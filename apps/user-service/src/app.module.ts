import { Module } from '@nestjs/common';
import { UserController } from './user/user.controller';
import { UsersService } from './user/users.service';
import { HealthController } from './health/health.controller';

@Module({
  controllers: [HealthController, UserController],
  providers: [UsersService],
})
export class AppModule {}
