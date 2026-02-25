import {
  BadGatewayException,
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { randomUUID } from 'node:crypto';
import { firstValueFrom, TimeoutError, timeout } from 'rxjs';
import {
  KafkaTopics,
  ServiceErrorCodes,
  type GetPlayerTournamentsQueryMessage,
  type GetPlayerTournamentsResult,
  type JoinTournamentCommandMessage,
  type JoinTournamentCommandData,
  type JoinTournamentResult,
  type MessageMeta,
  type TournamentResponseMessage,
} from '@app/contracts';

const TOURNAMENT_KAFKA_CLIENT = 'TOURNAMENT_KAFKA_CLIENT';
const GATEWAY_SOURCE = 'gateway';
const KAFKA_REQUEST_TIMEOUT_MS = 5_000;

@Injectable()
export class TournamentsService implements OnModuleInit {
  private readonly logger = new Logger(TournamentsService.name);

  constructor(
    @Inject(TOURNAMENT_KAFKA_CLIENT)
    private readonly kafkaClient: ClientKafka,
  ) {}

  async onModuleInit(): Promise<void> {
    // Required for Kafka request/reply with ClientKafka
    this.kafkaClient.subscribeToResponseOf(KafkaTopics.joinTournamentCommand);
    this.kafkaClient.subscribeToResponseOf(
      KafkaTopics.getPlayerTournamentsQuery,
    );
    await this.kafkaClient.connect();
  }

  async joinTournament(
    data: JoinTournamentCommandData,
    correlationId?: string,
  ): Promise<JoinTournamentResult> {
    const response = await this.sendKafkaRequest<JoinTournamentResult>(
      KafkaTopics.joinTournamentCommand,
      {
        meta: this.buildMeta(correlationId, 'command'),
        data,
      },
    );

    return this.unwrapServiceResponse(response);
  }

  async getPlayerTournaments(
    playerId: string,
    correlationId?: string,
  ): Promise<GetPlayerTournamentsResult> {
    const response = await this.sendKafkaRequest<GetPlayerTournamentsResult>(
      KafkaTopics.getPlayerTournamentsQuery,
      {
        meta: this.buildMeta(correlationId, 'query'),
        data: { playerId },
      } satisfies GetPlayerTournamentsQueryMessage,
    );

    return this.unwrapServiceResponse(response);
  }

  private async sendKafkaRequest<T>(
    topic: string,
    payload: JoinTournamentCommandMessage | GetPlayerTournamentsQueryMessage,
  ): Promise<TournamentResponseMessage<T>> {
    try {
      return await firstValueFrom(
        this.kafkaClient
          .send<TournamentResponseMessage<T>, typeof payload>(topic, payload)
          .pipe(timeout(KAFKA_REQUEST_TIMEOUT_MS)),
      );
    } catch (error: unknown) {
      if (error instanceof TimeoutError) {
        throw new GatewayTimeoutException({
          code: ServiceErrorCodes.dependencyTimeout,
          message: 'Tournament service request timed out',
          details: {
            dependency: 'tournament-service',
            timeoutMs: KAFKA_REQUEST_TIMEOUT_MS,
          },
        });
      }

      this.logger.error(
        `Kafka request failed topic=${topic}`,
        error instanceof Error ? error.stack : String(error),
      );

      throw new BadGatewayException({
        code: ServiceErrorCodes.internalError,
        message: 'Tournament service is unavailable',
        details: { dependency: 'tournament-service' },
      });
    }
  }

  private unwrapServiceResponse<T>(response: TournamentResponseMessage<T>): T {
    if (response.data.ok) {
      return response.data.data;
    }

    const { error } = response.data;
    throw new HttpException(
      {
        code: error.code,
        message: error.message,
        details: error.details,
        correlationId: response.meta.correlationId,
      },
      this.mapServiceErrorToHttpStatus(error.code),
    );
  }

  private buildMeta(
    correlationId: string | undefined,
    messageType: MessageMeta['messageType'],
  ): MessageMeta {
    return {
      correlationId: correlationId?.trim() || randomUUID(),
      timestamp: new Date().toISOString(),
      source: GATEWAY_SOURCE,
      messageType,
    };
  }

  private mapServiceErrorToHttpStatus(code: string): HttpStatus {
    switch (code) {
      case ServiceErrorCodes.invalidRequest:
        return HttpStatus.BAD_REQUEST;
      case ServiceErrorCodes.userNotFound:
      case ServiceErrorCodes.tournamentNotFound:
        return HttpStatus.NOT_FOUND;
      case ServiceErrorCodes.playerAlreadyJoined:
      case ServiceErrorCodes.tournamentFull:
      case ServiceErrorCodes.tournamentNotOpen:
      case ServiceErrorCodes.concurrencyConflict:
        return HttpStatus.CONFLICT;
      case ServiceErrorCodes.dependencyTimeout:
        return HttpStatus.GATEWAY_TIMEOUT;
      default:
        return HttpStatus.INTERNAL_SERVER_ERROR;
    }
  }
}

export { TOURNAMENT_KAFKA_CLIENT };
