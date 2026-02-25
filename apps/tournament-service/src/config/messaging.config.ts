export function getKafkaBrokers(): string[] {
  // Local dev (service on host) should hit the compose EXTERNAL listener.
  // When the service itself runs in Docker later, override with `kafka:9092`.
  const raw = process.env.KAFKA_BROKERS ?? 'localhost:9094';

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

export function getNatsServers(): string[] {
  const raw = process.env.NATS_SERVERS ?? 'nats://localhost:4222';

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}
