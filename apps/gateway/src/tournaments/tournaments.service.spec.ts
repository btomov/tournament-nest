import {
  GatewayTimeoutException,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { of, throwError, TimeoutError } from 'rxjs';
import {
  KafkaTopics,
  ServiceErrorCodes,
  type TournamentResponseMessage,
} from '@app/contracts';
import { TournamentsService } from './tournaments.service';

type MockKafkaClient = Pick<
  jest.Mocked<ClientKafka>,
  'subscribeToResponseOf' | 'connect' | 'send'
>;

describe('TournamentsService', () => {
  let kafkaClient: MockKafkaClient;
  let service: TournamentsService;

  beforeEach(() => {
    kafkaClient = {
      subscribeToResponseOf: jest.fn(),
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn(),
    } as unknown as MockKafkaClient;

    service = new TournamentsService(kafkaClient as unknown as ClientKafka);
  });

  it('subscribes to Kafka reply topics on module init', async () => {
    await service.onModuleInit();

    expect(kafkaClient.subscribeToResponseOf).toHaveBeenCalledWith(
      KafkaTopics.joinTournamentCommand,
    );
    expect(kafkaClient.subscribeToResponseOf).toHaveBeenCalledWith(
      KafkaTopics.getPlayerTournamentsQuery,
    );
    expect(kafkaClient.connect).toHaveBeenCalled();
  });

  it('returns join result on successful Kafka response', async () => {
    const response: TournamentResponseMessage<{
      tournament: { tournamentId: string };
      joinedPlayer: { playerId: string };
    }> = {
      meta: {
        correlationId: 'corr-join-1',
        timestamp: '2026-02-26T12:00:00.000Z',
        source: 'tournament-service',
        messageType: 'command',
      },
      data: {
        ok: true,
        data: {
          tournament: { tournamentId: 't1' },
          joinedPlayer: { playerId: 'user1' },
        },
      },
    };
    kafkaClient.send.mockReturnValue(of(response) as never);

    const result = await service.joinTournament(
      {
        playerId: 'user1',
        gameType: 'chess',
        tournamentType: 'solo',
        entryFee: 10,
      },
      'corr-http-1',
    );

    expect(kafkaClient.send).toHaveBeenCalledWith(
      KafkaTopics.joinTournamentCommand,
      expect.objectContaining({
        meta: expect.objectContaining({
          correlationId: 'corr-http-1',
          source: 'gateway',
          messageType: 'command',
        }),
        data: expect.objectContaining({
          playerId: 'user1',
        }),
      }),
    );
    expect(response.data.ok).toBe(true);
    if (!response.data.ok) {
      throw new Error('Expected a successful service response');
    }
    expect(result).toEqual(response.data.data);
  });

  it('maps service errors to HttpException with status and correlation id', async () => {
    const response: TournamentResponseMessage<never> = {
      meta: {
        correlationId: 'corr-kafka-err-1',
        timestamp: '2026-02-26T12:01:00.000Z',
        source: 'tournament-service',
        messageType: 'command',
      },
      data: {
        ok: false,
        error: {
          code: ServiceErrorCodes.playerAlreadyJoined,
          message: 'Player already joined',
        },
      },
    };
    kafkaClient.send.mockReturnValue(of(response) as never);

    try {
      await service.joinTournament(
        {
          playerId: 'user1',
          gameType: 'chess',
          tournamentType: 'solo',
          entryFee: 10,
        },
        'corr-http-2',
      );
      throw new Error('Expected joinTournament to throw');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(HttpException);
      const exception = error as HttpException;
      expect(exception.getStatus()).toBe(HttpStatus.CONFLICT);
      expect(exception.getResponse()).toMatchObject({
        code: ServiceErrorCodes.playerAlreadyJoined,
        correlationId: 'corr-kafka-err-1',
      });
    }
  });

  it('maps Kafka timeout to GatewayTimeoutException', async () => {
    kafkaClient.send.mockReturnValue(
      throwError(() => new TimeoutError()) as never,
    );

    await expect(
      service.getPlayerTournaments('user1', 'corr-http-timeout'),
    ).rejects.toThrow(GatewayTimeoutException);

    try {
      await service.getPlayerTournaments('user1', 'corr-http-timeout');
    } catch (error: unknown) {
      const exception = error as GatewayTimeoutException;
      expect(exception.getResponse()).toMatchObject({
        code: ServiceErrorCodes.dependencyTimeout,
      });
    }
  });
});
