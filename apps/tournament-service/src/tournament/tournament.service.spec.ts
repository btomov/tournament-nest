import { Logger } from '@nestjs/common';
import { ServiceErrorCodes } from '@app/contracts';
import { TournamentPersistenceService } from './persistence/tournament.persistence.service';
import { TournamentService } from './tournament.service';
import { TournamentUsersClient } from './tournament-users.client';

type MockedTournamentPersistenceService = Pick<
  jest.Mocked<TournamentPersistenceService>,
  'upsertPlayerIntoTournament' | 'getPlayerTournaments'
>;

type MockedTournamentUsersClient = Pick<
  jest.Mocked<TournamentUsersClient>,
  'getUserById'
>;

function createJoinMessage() {
  return {
    meta: {
      correlationId: 'corr-join-1',
      timestamp: '2026-02-26T10:00:00.000Z',
      source: 'gateway',
      messageType: 'command' as const,
    },
    data: {
      playerId: 'user1',
      gameType: 'chess',
      tournamentType: 'solo',
      entryFee: 10,
    },
  };
}

function createQueryMessage() {
  return {
    meta: {
      correlationId: 'corr-query-1',
      timestamp: '2026-02-26T10:05:00.000Z',
      source: 'gateway',
      messageType: 'query' as const,
    },
    data: {
      playerId: 'user1',
    },
  };
}

describe('TournamentService', () => {
  let service: TournamentService;
  let persistence: MockedTournamentPersistenceService;
  let usersClient: MockedTournamentUsersClient;
  let loggerLogSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    persistence = {
      upsertPlayerIntoTournament: jest.fn(),
      getPlayerTournaments: jest.fn(),
    };
    usersClient = {
      getUserById: jest.fn(),
    };

    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    service = new TournamentService(
      persistence as unknown as TournamentPersistenceService,
      usersClient as unknown as TournamentUsersClient,
    );
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('joins a tournament when user lookup and persistence succeed', async () => {
    usersClient.getUserById.mockResolvedValue({
      ok: true,
      data: {
        id: 'user1',
        username: 'alice',
        displayName: 'Alice',
      },
    });
    persistence.upsertPlayerIntoTournament.mockResolvedValue({
      tournament: {
        id: 't1',
        gameType: 'chess',
        tournamentType: 'solo',
        entryFee: 10,
        maxPlayers: 4,
        createdAt: '2026-02-26T10:00:01.000Z',
        updatedAt: '2026-02-26T10:00:01.000Z',
        players: [
          {
            playerId: 'user1',
            username: 'alice',
            displayName: 'Alice',
            joinedAt: '2026-02-26T10:00:01.000Z',
          },
        ],
      },
      player: {
        playerId: 'user1',
        username: 'alice',
        displayName: 'Alice',
        joinedAt: '2026-02-26T10:00:01.000Z',
      },
    } as never);

    const response = await service.joinTournament(createJoinMessage() as never);

    expect(usersClient.getUserById).toHaveBeenCalledWith(
      'corr-join-1',
      'user1',
    );
    expect(persistence.upsertPlayerIntoTournament).toHaveBeenCalledWith(
      {
        gameType: 'chess',
        tournamentType: 'solo',
        entryFee: 10,
      },
      {
        id: 'user1',
        username: 'alice',
        displayName: 'Alice',
      },
    );
    expect(response.meta.correlationId).toBe('corr-join-1');
    expect(response.data.ok).toBe(true);
    if (response.data.ok) {
      expect(response.data.data.joinedPlayer.playerId).toBe('user1');
      expect(response.data.data.tournament.tournamentId).toBe('t1');
    }
  });

  it('returns failure when user lookup fails', async () => {
    usersClient.getUserById.mockResolvedValue({
      ok: false,
      error: {
        code: ServiceErrorCodes.userNotFound,
        message: 'User missing-user was not found',
      },
    });

    const response = await service.joinTournament({
      ...createJoinMessage(),
      data: { ...createJoinMessage().data, playerId: 'missing-user' },
    } as never);

    expect(persistence.upsertPlayerIntoTournament).not.toHaveBeenCalled();
    expect(response.data).toMatchObject({
      ok: false,
      error: { code: ServiceErrorCodes.userNotFound },
    });
  });

  it('maps duplicate join result to PLAYER_ALREADY_JOINED', async () => {
    usersClient.getUserById.mockResolvedValue({
      ok: true,
      data: {
        id: 'user1',
        username: 'alice',
        displayName: 'Alice',
      },
    });
    persistence.upsertPlayerIntoTournament.mockResolvedValue(
      'already_joined' as never,
    );

    const response = await service.joinTournament(createJoinMessage() as never);

    expect(response.data).toMatchObject({
      ok: false,
      error: { code: ServiceErrorCodes.playerAlreadyJoined },
    });
  });

  it('returns player tournaments for query success', async () => {
    persistence.getPlayerTournaments.mockResolvedValue([
      {
        id: 't1',
        gameType: 'chess',
        tournamentType: 'solo',
        entryFee: 10,
        maxPlayers: 4,
        createdAt: '2026-02-26T10:10:00.000Z',
        updatedAt: '2026-02-26T10:10:00.000Z',
        players: [
          {
            playerId: 'user1',
            username: 'alice',
            displayName: 'Alice',
            joinedAt: '2026-02-26T10:10:00.000Z',
          },
        ],
      },
    ] as never);

    const response = await service.getPlayerTournaments(
      createQueryMessage() as never,
    );

    expect(persistence.getPlayerTournaments).toHaveBeenCalledWith('user1');
    expect(response.data.ok).toBe(true);
    if (response.data.ok) {
      expect(response.data.data.playerId).toBe('user1');
      expect(response.data.data.tournaments).toHaveLength(1);
      expect(response.data.data.tournaments[0]).toMatchObject({
        tournamentId: 't1',
        status: 'open',
      });
    }
  });

  it('maps query persistence errors to INTERNAL_ERROR', async () => {
    persistence.getPlayerTournaments.mockRejectedValue(new Error('db down'));

    const response = await service.getPlayerTournaments(
      createQueryMessage() as never,
    );

    expect(response.data).toMatchObject({
      ok: false,
      error: { code: ServiceErrorCodes.internalError },
    });
  });
});
