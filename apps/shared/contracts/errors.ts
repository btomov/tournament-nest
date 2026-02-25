export const ServiceErrorCodes = {
  unauthorized: 'UNAUTHORIZED',
  invalidToken: 'INVALID_TOKEN',
  userNotFound: 'USER_NOT_FOUND',
  playerAlreadyJoined: 'PLAYER_ALREADY_JOINED',
  tournamentNotOpen: 'TOURNAMENT_NOT_OPEN',
  tournamentFull: 'TOURNAMENT_FULL',
  tournamentNotFound: 'TOURNAMENT_NOT_FOUND',
  playerNotInTournament: 'PLAYER_NOT_IN_TOURNAMENT',
  invalidRequest: 'INVALID_REQUEST',
  dependencyTimeout: 'DEPENDENCY_TIMEOUT',
  concurrencyConflict: 'CONCURRENCY_CONFLICT',
  internalError: 'INTERNAL_ERROR',
} as const;

export type ServiceErrorCode =
  (typeof ServiceErrorCodes)[keyof typeof ServiceErrorCodes];

export interface ServiceError {
  code: ServiceErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

export interface ServiceSuccess<T> {
  ok: true;
  data: T;
}

export interface ServiceFailure {
  ok: false;
  error: ServiceError;
}

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;
