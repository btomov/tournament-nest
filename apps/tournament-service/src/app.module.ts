import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTournamentDatabaseConfig } from './config/database.config';
import { getNatsServers } from './config/messaging.config';
import { TournamentController } from './tournament/tournament.controller';
import { TournamentEntity } from './tournament/persistence/entities/tournament.entity';
import { TournamentPlayerEntity } from './tournament/persistence/entities/tournament-player.entity';
import { TournamentPersistenceService } from './tournament/persistence/tournament.persistence.service';
import { TournamentService } from './tournament/tournament.service';
import { TournamentUsersClient } from './tournament/tournament-users.client';
import { USER_SERVICE_NATS_CLIENT } from './tournament/types/tournament.constants';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const db = getTournamentDatabaseConfig();

        return {
          type: 'postgres' as const,
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          schema: db.schema,
          synchronize: db.synchronize,
          logging: db.logging,
          entities: [TournamentEntity, TournamentPlayerEntity],
          retryAttempts: 10,
          retryDelay: 3_000,
        };
      },
    }),
    TypeOrmModule.forFeature([TournamentEntity, TournamentPlayerEntity]),
    ClientsModule.register([
      {
        name: USER_SERVICE_NATS_CLIENT,
        transport: Transport.NATS,
        options: {
          servers: getNatsServers(),
        },
      },
    ]),
  ],
  controllers: [TournamentController],
  providers: [
    TournamentService,
    TournamentPersistenceService,
    TournamentUsersClient,
  ],
})
export class AppModule {}
