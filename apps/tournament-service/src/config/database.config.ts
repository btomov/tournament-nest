type TournamentDatabaseConfig = {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  schema: string;
  synchronize: boolean;
  logging: boolean;
};

function parseNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function parseBooleanEnv(name: string, fallback: boolean): boolean {
  const raw = process.env[name];
  if (!raw) {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(raw.trim().toLowerCase());
}

export function getTournamentDatabaseConfig(): TournamentDatabaseConfig {
  return {
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: parseNumberEnv('POSTGRES_PORT', 5432),
    username: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD ?? 'postgres',
    database: process.env.POSTGRES_DB ?? 'tournament_db',
    schema: process.env.POSTGRES_SCHEMA ?? 'public',
    synchronize: parseBooleanEnv('POSTGRES_SYNCHRONIZE', true),
    logging: parseBooleanEnv('POSTGRES_LOGGING', false),
  };
}
