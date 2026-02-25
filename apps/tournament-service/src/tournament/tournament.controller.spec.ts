import { type TournamentResponseMessage } from '@app/contracts';
import { TournamentController } from './tournament.controller';
import { TournamentService } from './tournament.service';
import {
  type GetPlayerTournamentsQueryMessageDto,
  type JoinTournamentCommandMessageDto,
} from './dto/tournament-message.dto';

type MockedTournamentService = Pick<
  jest.Mocked<TournamentService>,
  'joinTournament' | 'getPlayerTournaments'
>;

function createJoinMessage(): JoinTournamentCommandMessageDto {
  return {
    meta: {
      correlationId: 'corr-1',
      timestamp: '2026-02-25T12:00:00.000Z',
      source: 'gateway',
      messageType: 'command',
    },
    data: {
      playerId: 'user1',
      gameType: 'chess',
      tournamentType: 'solo',
      entryFee: 10,
    },
  } as JoinTournamentCommandMessageDto;
}

function createQueryMessage(): GetPlayerTournamentsQueryMessageDto {
  return {
    meta: {
      correlationId: 'corr-2',
      timestamp: '2026-02-25T12:01:00.000Z',
      source: 'gateway',
      messageType: 'query',
    },
    data: {
      playerId: 'user1',
    },
  } as GetPlayerTournamentsQueryMessageDto;
}

describe('TournamentController', () => {
  let controller: TournamentController;
  let tournamentService: MockedTournamentService;

  beforeEach(() => {
    tournamentService = {
      joinTournament: jest.fn(),
      getPlayerTournaments: jest.fn(),
    };

    controller = new TournamentController(
      tournamentService as unknown as TournamentService,
    );
  });

  it('delegates join command payload to TournamentService', async () => {
    const payload = createJoinMessage();
    const expectedResponse = {
      meta: {
        correlationId: payload.meta.correlationId,
        timestamp: '2026-02-25T12:00:01.000Z',
        source: 'tournament-service',
        messageType: 'command',
      },
      data: {
        ok: true,
        data: {
          joinedPlayer: {
            playerId: 'user1',
            username: 'alice',
            displayName: 'Alice',
            joinedAt: '2026-02-25T12:00:01.000Z',
          },
          tournament: {
            tournamentId: 't1',
            gameType: 'chess',
            tournamentType: 'solo',
            entryFee: 10,
            status: 'open',
            playersCount: 1,
            maxPlayers: 4,
            createdAt: '2026-02-25T12:00:01.000Z',
            updatedAt: '2026-02-25T12:00:01.000Z',
            players: [],
          },
        },
      },
    } satisfies TournamentResponseMessage<unknown>;

    tournamentService.joinTournament.mockResolvedValue(expectedResponse);

    const response = await controller.handleJoinTournament(payload);

    expect(tournamentService.joinTournament).toHaveBeenCalledWith(payload);
    expect(response).toBe(expectedResponse);
  });

  it('delegates get-player-tournaments query payload to TournamentService', async () => {
    const payload = createQueryMessage();
    const expectedResponse = {
      meta: {
        correlationId: payload.meta.correlationId,
        timestamp: '2026-02-25T12:01:01.000Z',
        source: 'tournament-service',
        messageType: 'query',
      },
      data: {
        ok: true,
        data: {
          playerId: 'user1',
          tournaments: [],
        },
      },
    } satisfies TournamentResponseMessage<unknown>;

    tournamentService.getPlayerTournaments.mockResolvedValue(expectedResponse);

    const response = await controller.handleGetPlayerTournaments(payload);

    expect(tournamentService.getPlayerTournaments).toHaveBeenCalledWith(payload);
    expect(response).toBe(expectedResponse);
  });
});
