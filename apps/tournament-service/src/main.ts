import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app.module';
import { getKafkaBrokers } from './config/messaging.config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: process.env.KAFKA_CLIENT_ID ?? 'tournament-service',
          brokers: getKafkaBrokers(),
        },
        consumer: {
          groupId:
            process.env.KAFKA_CONSUMER_GROUP_ID ??
            'tournament-service-consumer',
        },
      },
    },
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen();
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('TournamentBootstrap');
  logger.error(
    'Failed to start tournament service',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
