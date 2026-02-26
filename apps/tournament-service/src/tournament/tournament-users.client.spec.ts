import { Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { of, throwError, TimeoutError } from 'rxjs';
import { ServiceErrorCodes } from '@app/contracts';
import { TournamentUsersClient } from './tournament-users.client';

type MockClientProxy = Pick<jest.Mocked<ClientProxy>, 'connect' | 'send'>;

describe('TournamentUsersClient', () => {
  let client: MockClientProxy;
  let service: TournamentUsersClient;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    client = {
      connect: jest.fn().mockResolvedValue(undefined),
      send: jest.fn(),
    } as unknown as MockClientProxy;

    loggerLogSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    loggerWarnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    service = new TournamentUsersClient(client as unknown as ClientProxy);
  });

  afterEach(() => {
    loggerLogSpy.mockRestore();
    loggerWarnSpy.mockRestore();
    loggerErrorSpy.mockRestore();
  });

  it('connects to NATS on module init', async () => {
    await service.onModuleInit();

    expect(client.connect).toHaveBeenCalled();
  });

  it('returns a successful result when user-service responds with a user', async () => {
    client.send.mockReturnValue(
      of({
        id: 'user1',
        username: 'alice',
        displayName: 'Alice',
      }) as never,
    );

    const result = await service.getUserById('corr-1', 'user1');

    expect(client.send).toHaveBeenCalledWith('users.get-by-id', {
      correlationId: 'corr-1',
      playerId: 'user1',
    });
    expect(result).toEqual({
      ok: true,
      data: {
        id: 'user1',
        username: 'alice',
        displayName: 'Alice',
      },
    });
  });

  it('maps null user response to USER_NOT_FOUND', async () => {
    client.send.mockReturnValue(of(null) as never);

    const result = await service.getUserById('corr-2', 'missing-user');

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: ServiceErrorCodes.userNotFound,
      },
    });
  });

  it('maps timeout to DEPENDENCY_TIMEOUT', async () => {
    client.send.mockReturnValue(
      throwError(() => new TimeoutError()) as never,
    );

    const result = await service.getUserById('corr-3', 'user1');

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: ServiceErrorCodes.dependencyTimeout,
      },
    });
  });

  it('maps unexpected errors to INTERNAL_ERROR', async () => {
    client.send.mockReturnValue(
      throwError(() => new Error('nats down')) as never,
    );

    const result = await service.getUserById('corr-4', 'user1');

    expect(result).toMatchObject({
      ok: false,
      error: {
        code: ServiceErrorCodes.internalError,
      },
    });
  });
});

