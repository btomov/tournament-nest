import 'reflect-metadata';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  const port = Number.parseInt(process.env.PORT ?? '3000', 10);
  const safePort = Number.isFinite(port) ? port : 3000;

  const openApiPath = join(
    process.cwd(),
    'openapi',
    'tournament-gateway.openapi.json',
  );
  const document = JSON.parse(
    readFileSync(openApiPath, 'utf-8'),
  ) as OpenAPIObject;
  document.servers = [{ url: `http://localhost:${safePort}` }];
  SwaggerModule.setup('docs', app, document);

  await app.listen(safePort);

  const logger = new Logger('GatewayBootstrap');
  logger.log(`Gateway listening on http://localhost:${safePort}`);
  logger.log(`Swagger docs available at http://localhost:${safePort}/docs`);
}

bootstrap().catch((error: unknown) => {
  const logger = new Logger('GatewayBootstrap');
  logger.error(
    'Failed to start gateway service',
    error instanceof Error ? error.stack : String(error),
  );
  process.exit(1);
});
