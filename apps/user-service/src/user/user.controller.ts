import { Controller, Logger } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { NatsPatterns } from 'apps/shared/contracts/messaging';
import { UserLookupRequest, UserLookupResponse } from '@app/contracts';

@Controller()
export class UserController {
  private readonly logger = new Logger(UserController.name);

  constructor(private readonly usersService: UsersService) {}

  @MessagePattern(NatsPatterns.usersGetById)
  getById(@Payload() payload: UserLookupRequest): UserLookupResponse {
    const user = this.usersService.findById(payload.playerId);

    this.logger.log(
      `NATS ${NatsPatterns.usersGetById} correlationId=${payload.correlationId} playerId=${payload.playerId} found=${Boolean(user)}`,
    );

    return user;
  }
}
