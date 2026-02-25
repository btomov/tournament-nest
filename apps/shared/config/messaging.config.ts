export function getKafkaBrokers(): string[] {
  // Host-run apps should use the Docker EXTERNAL listener.
  // When an app runs inside Docker, override with `kafka:9092`.
  const raw = process.env.KAFKA_BROKERS ?? 'localhost:9094';

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}
