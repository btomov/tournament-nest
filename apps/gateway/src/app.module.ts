import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaBrokers } from '@app/config/messaging.config';
import { AuthController } from './auth/auth.controller';
import { AuthService } from './auth/auth.service';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { HealthController } from './health/health.controller';
import { TournamentsController } from './tournaments/tournaments.controller';
import {
  TOURNAMENT_KAFKA_CLIENT,
  TournamentsService,
} from './tournaments/tournaments.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: (process.env.JWT_EXPIRES_IN ?? '1h') as never,
      },
    }),
    ClientsModule.register([
      {
        name: TOURNAMENT_KAFKA_CLIENT,
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: process.env.KAFKA_CLIENT_ID ?? 'gateway',
            brokers: getKafkaBrokers(),
          },
          consumer: {
            // Separate group from tournament-service so request/reply internals don't collide
            groupId: process.env.KAFKA_CONSUMER_GROUP_ID ?? 'gateway-consumer',
          },
        },
      },
    ]),
  ],
  controllers: [AuthController, HealthController, TournamentsController],
  providers: [AuthService, JwtAuthGuard, TournamentsService],
})
export class AppModule {}
