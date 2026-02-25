import { Injectable, Logger } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ServiceErrorCodes,
  type GetPlayerTournamentsResult,
  type JoinTournamentResult,
  type MessageMeta,
  type ServiceError,
  type TournamentResponseMessage,
} from '@app/contracts';
import { TOURNAMENT_SERVICE_SOURCE } from './types/tournament.constants';
import { TournamentPersistenceService } from './persistence/tournament.persistence.service';
import { TournamentUsersClient } from './tournament-users.client';
import {
  GetPlayerTournamentsQueryMessageDto,
  JoinTournamentCommandMessageDto,
} from './dto/tournament-message.dto';
import {
  mapTournamentPlayerSummary,
  mapTournamentSummary,
} from './dto/tournament.mapper';

@Injectable()
export class TournamentService {
  private readonly logger = new Logger(TournamentService.name);

  constructor(
    private readonly tournamentPersistence: TournamentPersistenceService,
    private readonly tournamentUsersClient: TournamentUsersClient,
  ) {}

  async joinTournament(
    message: JoinTournamentCommandMessageDto,
  ): Promise<TournamentResponseMessage<JoinTournamentResult>> {
    const meta = this.normalizeRequestMeta(message.meta, 'command');
    const { data } = message;

    this.logger.log(
      `Kafka command ${meta.correlationId} join playerId=${data.playerId} gameType=${data.gameType} tournamentType=${data.tournamentType} entryFee=${data.entryFee}`,
    );

    const userLookup = await this.tournamentUsersClient.getUserById(
      meta.correlationId,
      data.playerId,
    );

    if (!userLookup.ok) {
      return this.buildFailureResponse(meta, userLookup.error);
    }

    let upsertResult: Awaited<
      ReturnType<TournamentPersistenceService['upsertPlayerIntoTournament']>
    >;

    try {
      upsertResult =
        await this.tournamentPersistence.upsertPlayerIntoTournament(
          {
            gameType: data.gameType,
            tournamentType: data.tournamentType,
            entryFee: data.entryFee,
          },
          userLookup.data,
        );
    } catch (error: unknown) {
      this.logger.error(
        `Join tournament persistence failure correlationId=${meta.correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      return this.buildFailureResponse(meta, {
        code: ServiceErrorCodes.internalError,
        message: 'Failed to persist tournament join',
      });
    }

    if (upsertResult === 'already_joined') {
      return this.buildFailureResponse(meta, {
        code: ServiceErrorCodes.playerAlreadyJoined,
        message: 'Player already joined a matching tournament',
      });
    }

    return this.buildSuccessResponse(meta, {
      tournament: mapTournamentSummary(upsertResult.tournament),
      joinedPlayer: mapTournamentPlayerSummary(upsertResult.player),
    });
  }

  async getPlayerTournaments(
    message: GetPlayerTournamentsQueryMessageDto,
  ): Promise<TournamentResponseMessage<GetPlayerTournamentsResult>> {
    const meta = this.normalizeRequestMeta(message.meta, 'query');
    const { data } = message;

    this.logger.log(
      `Kafka query ${meta.correlationId} get-player-tournaments playerId=${data.playerId}`,
    );

    let tournaments: ReturnType<typeof mapTournamentSummary>[];

    try {
      tournaments = (
        await this.tournamentPersistence.getPlayerTournaments(data.playerId)
      ).map(mapTournamentSummary);
    } catch (error: unknown) {
      this.logger.error(
        `Get player tournaments persistence failure correlationId=${meta.correlationId}`,
        error instanceof Error ? error.stack : String(error),
      );

      return this.buildFailureResponse(meta, {
        code: ServiceErrorCodes.internalError,
        message: 'Failed to fetch player tournaments',
      });
    }

    return this.buildSuccessResponse(meta, {
      playerId: data.playerId,
      tournaments,
    });
  }

  private buildSuccessResponse<T>(
    requestMeta: MessageMeta,
    data: T,
  ): TournamentResponseMessage<T> {
    return {
      meta: {
        correlationId: requestMeta.correlationId,
        timestamp: new Date().toISOString(),
        source: TOURNAMENT_SERVICE_SOURCE,
        messageType: requestMeta.messageType,
      },
      data: {
        ok: true,
        data,
      },
    };
  }

  private buildFailureResponse(
    requestMeta: MessageMeta,
    error: ServiceError,
  ): TournamentResponseMessage<never> {
    return {
      meta: {
        correlationId: requestMeta.correlationId,
        timestamp: new Date().toISOString(),
        source: TOURNAMENT_SERVICE_SOURCE,
        messageType: requestMeta.messageType,
      },
      data: {
        ok: false,
        error,
      },
    };
  }

  private normalizeRequestMeta(
    meta: MessageMeta,
    fallbackType: MessageMeta['messageType'],
  ): MessageMeta {
    return {
      correlationId: meta.correlationId.trim() || randomUUID(),
      timestamp: meta.timestamp,
      source: meta.source.trim() || 'unknown',
      messageType: meta.messageType ?? fallbackType,
    };
  }
}
