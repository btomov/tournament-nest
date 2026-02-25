import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository, type EntityManager } from 'typeorm';
import { type UserProfile } from '@app/contracts';
import { DEFAULT_TOURNAMENT_MAX_PLAYERS } from '../types/tournament.constants';
import { TournamentEntity } from './entities/tournament.entity';
import { TournamentPlayerEntity } from './entities/tournament-player.entity';
import {
  type AddPlayerResult,
  type JoinCriteria,
  type TournamentPlayerRecord,
  type TournamentRecord,
} from '../types/tournament.persistence.types';

type UpsertJoinResult = AddPlayerResult | 'already_joined';

@Injectable()
export class TournamentPersistenceService {
  constructor(
    @InjectRepository(TournamentEntity)
    private readonly tournamentsRepository: Repository<TournamentEntity>,
    @InjectRepository(TournamentPlayerEntity)
    private readonly tournamentPlayersRepository: Repository<TournamentPlayerEntity>,
  ) {}

  async upsertPlayerIntoTournament(
    criteria: JoinCriteria,
    user: UserProfile,
  ): Promise<UpsertJoinResult> {
    return this.tournamentsRepository.manager.transaction(
      async (manager) => this.upsertPlayerInTransaction(manager, criteria, user),
    );
  }

  async getPlayerTournaments(playerId: string): Promise<TournamentRecord[]> {
    const tournaments = await this.tournamentsRepository
      .createQueryBuilder('tournament')
      .innerJoin('tournament.players', 'membership', 'membership.playerId = :playerId', {
        playerId,
      })
      .leftJoinAndSelect('tournament.players', 'players')
      .orderBy('tournament.createdAt', 'ASC')
      .addOrderBy('players.joinedAt', 'ASC')
      .getMany();

    return tournaments.map((tournament) => this.toTournamentRecord(tournament));
  }

  private async upsertPlayerInTransaction(
    manager: EntityManager,
    criteria: JoinCriteria,
    user: UserProfile,
  ): Promise<UpsertJoinResult> {
    const tournamentsRepository = manager.getRepository(TournamentEntity);
    const playersRepository = manager.getRepository(TournamentPlayerEntity);

    const existingMembership = await playersRepository
      .createQueryBuilder('player')
      .innerJoin('player.tournament', 'tournament')
      .where('player.playerId = :playerId', { playerId: user.id })
      .andWhere('tournament.gameType = :gameType', { gameType: criteria.gameType })
      .andWhere('tournament.tournamentType = :tournamentType', {
        tournamentType: criteria.tournamentType,
      })
      .andWhere('tournament.entryFee = :entryFee', { entryFee: criteria.entryFee })
      .select(['player.id'])
      .getRawOne();

    if (existingMembership) {
      return 'already_joined';
    }

    const candidateIds = await tournamentsRepository
      .createQueryBuilder('tournament')
      .select('tournament.id', 'id')
      .where('tournament.gameType = :gameType', { gameType: criteria.gameType })
      .andWhere('tournament.tournamentType = :tournamentType', {
        tournamentType: criteria.tournamentType,
      })
      .andWhere('tournament.entryFee = :entryFee', { entryFee: criteria.entryFee })
      .orderBy('tournament.createdAt', 'ASC')
      .getRawMany<{ id: string }>();

    let selectedTournament: TournamentEntity | null = null;

    for (const candidate of candidateIds) {
      const lockedTournament = await tournamentsRepository
        .createQueryBuilder('tournament')
        .setLock('pessimistic_write')
        .where('tournament.id = :id', { id: candidate.id })
        .getOne();

      if (!lockedTournament) {
        continue;
      }

      const playersCount = await playersRepository.count({
        where: { tournamentId: lockedTournament.id },
      });

      if (playersCount >= lockedTournament.maxPlayers) {
        continue;
      }

      selectedTournament = lockedTournament;
      break;
    }

    if (!selectedTournament) {
      selectedTournament = await tournamentsRepository.save(
        tournamentsRepository.create({
          gameType: criteria.gameType,
          tournamentType: criteria.tournamentType,
          entryFee: criteria.entryFee,
          maxPlayers: DEFAULT_TOURNAMENT_MAX_PLAYERS,
        }),
      );
    }

    const playerEntity = playersRepository.create({
      tournamentId: selectedTournament.id,
      playerId: user.id,
      username: user.username,
      displayName: user.displayName,
    });

    try {
      const savedPlayer = await playersRepository.save(playerEntity);
      const tournamentWithPlayers = await tournamentsRepository.findOneOrFail({
        where: { id: selectedTournament.id },
        relations: { players: true },
      });

      return {
        tournament: this.toTournamentRecord(tournamentWithPlayers),
        player: this.toTournamentPlayerRecord(savedPlayer),
      };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        return 'already_joined';
      }

      throw error;
    }
  }

  private toTournamentRecord(tournament: TournamentEntity): TournamentRecord {
    const players = [...(tournament.players ?? [])].sort(
      (left, right) => left.joinedAt.getTime() - right.joinedAt.getTime(),
    );

    return {
      id: tournament.id,
      gameType: tournament.gameType,
      tournamentType: tournament.tournamentType,
      entryFee: tournament.entryFee,
      maxPlayers: tournament.maxPlayers,
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
      players: players.map((player) => this.toTournamentPlayerRecord(player)),
    };
  }

  private toTournamentPlayerRecord(
    player: TournamentPlayerEntity,
  ): TournamentPlayerRecord {
    return {
      playerId: player.playerId,
      username: player.username,
      displayName: player.displayName,
      joinedAt: player.joinedAt.toISOString(),
    };
  }

  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const driverError = error.driverError as { code?: string } | undefined;
    return driverError?.code === '23505';
  }
}
