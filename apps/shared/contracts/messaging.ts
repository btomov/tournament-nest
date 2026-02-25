export const KafkaTopics = {
  joinTournamentCommand: 'tournament.join.command',
  getPlayerTournamentsQuery: 'tournament.get-player-tournaments.query',
} as const;

export const NatsPatterns = {
  usersGetById: 'users.get-by-id',
} as const;

export type MessageMeta = {
  correlationId: string;
  timestamp: string;
  source: string;
  messageType: 'command' | 'query';
};

export type MessageEnvelope<T> = {
  meta: MessageMeta;
  data: T;
};
