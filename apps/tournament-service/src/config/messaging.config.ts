export { getKafkaBrokers } from '@app/config/messaging.config';

export function getNatsServers(): string[] {
  const raw = process.env.NATS_SERVERS ?? 'nats://localhost:4222';

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}
