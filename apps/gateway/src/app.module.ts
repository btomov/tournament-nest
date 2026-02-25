import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { getKafkaBrokers } from '@app/config/messaging.config';
import { HealthController } from './health/health.controller';
import { TournamentsController } from './tournaments/tournaments.controller';
import {
  TOURNAMENT_KAFKA_CLIENT,
  TournamentsService,
} from './tournaments/tournaments.service';

@Module({
  imports: [
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
  controllers: [HealthController, TournamentsController],
  providers: [TournamentsService],
})
export class AppModule {}
