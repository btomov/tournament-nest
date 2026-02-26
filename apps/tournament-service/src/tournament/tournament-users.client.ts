import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, TimeoutError, timeout } from 'rxjs';
import {
  NatsPatterns,
  ServiceErrorCodes,
  type ServiceResult,
  type UserLookupRequest,
  type UserLookupResponse,
  type UserProfile,
} from '@app/contracts';
import {
  USER_LOOKUP_TIMEOUT_MS,
  USER_SERVICE_NATS_CLIENT,
} from './types/tournament.constants';

@Injectable()
export class TournamentUsersClient implements OnModuleInit {
  private readonly logger = new Logger(TournamentUsersClient.name);

  constructor(
    @Inject(USER_SERVICE_NATS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    this.logger.log('Connected to user-service over NATS');
  }

  async getUserById(
    correlationId: string,
    playerId: string,
  ): Promise<ServiceResult<UserProfile>> {
    const payload: UserLookupRequest = { correlationId, playerId };

    try {
      const response = await firstValueFrom(
        this.client
          .send<
            UserLookupResponse,
            UserLookupRequest
          >(NatsPatterns.usersGetById, payload)
          .pipe(timeout(USER_LOOKUP_TIMEOUT_MS)),
      );

      if (!response) {
        return {
          ok: false,
          error: {
            code: ServiceErrorCodes.userNotFound,
            message: `User ${playerId} was not found`,
          },
        };
      }

      return {
        ok: true,
        data: response,
      };
    } catch (error: unknown) {
      if (error instanceof TimeoutError) {
        this.logger.warn(
          `NATS user lookup timeout correlationId=${correlationId} playerId=${playerId}`,
        );

        return {
          ok: false,
          error: {
            code: ServiceErrorCodes.dependencyTimeout,
            message: 'User service request timed out',
            details: {
              dependency: 'user-service',
              timeoutMs: USER_LOOKUP_TIMEOUT_MS,
            },
          },
        };
      }

      this.logger.error(
        `NATS user lookup failed correlationId=${correlationId} playerId=${playerId}`,
        error instanceof Error ? error.stack : String(error),
      );

      return {
        ok: false,
        error: {
          code: ServiceErrorCodes.internalError,
          message: 'Failed to resolve user via user service',
          details: { dependency: 'user-service' },
        },
      };
    }
  }
}
