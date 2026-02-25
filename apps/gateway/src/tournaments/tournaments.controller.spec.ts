import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

type MockedTournamentsService = Pick<
  jest.Mocked<TournamentsService>,
  'joinTournament' | 'getPlayerTournaments'
>;

describe('TournamentsController', () => {
  let controller: TournamentsController;
  let tournamentsService: MockedTournamentsService;

  beforeEach(() => {
    tournamentsService = {
      joinTournament: jest.fn(),
      getPlayerTournaments: jest.fn(),
    };

    controller = new TournamentsController(
      tournamentsService as unknown as TournamentsService,
    );
  });

  it('delegates POST /tournaments/join to TournamentsService', async () => {
    const body = {
      playerId: 'user1',
      gameType: 'chess',
      tournamentType: 'solo',
      entryFee: 10,
    };
    const expected = {
      tournament: {
        tournamentId: 't1',
        gameType: 'chess',
        tournamentType: 'solo',
        entryFee: 10,
        status: 'open',
        playersCount: 1,
        maxPlayers: 4,
        createdAt: '2026-02-25T12:00:00.000Z',
        updatedAt: '2026-02-25T12:00:00.000Z',
        players: [],
      },
      joinedPlayer: {
        playerId: 'user1',
        username: 'alice',
        displayName: 'Alice',
        joinedAt: '2026-02-25T12:00:00.000Z',
      },
    };
    tournamentsService.joinTournament.mockResolvedValue(expected);

    const result = await controller.joinTournament(
      body as never,
      'corr-http-1',
    );

    expect(tournamentsService.joinTournament).toHaveBeenCalledWith(
      body,
      'corr-http-1',
    );
    expect(result).toBe(expected);
  });

  it('delegates GET /players/:playerId/tournaments to TournamentsService', async () => {
    const expected = {
      playerId: 'user1',
      tournaments: [],
    };
    tournamentsService.getPlayerTournaments.mockResolvedValue(expected);

    const result = await controller.getPlayerTournaments(
      { playerId: 'user1' } as never,
      'corr-http-2',
    );

    expect(tournamentsService.getPlayerTournaments).toHaveBeenCalledWith(
      'user1',
      'corr-http-2',
    );
    expect(result).toBe(expected);
  });
});
