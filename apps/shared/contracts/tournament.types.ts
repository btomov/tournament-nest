import { type ServiceResult } from './errors';
import { type MessageEnvelope } from './messaging';

export type JoinTournamentCommandData = {
  playerId: string;
  gameType: string;
  tournamentType: string;
  entryFee: number;
};

export type GetPlayerTournamentsQueryData = {
  playerId: string;
};

export type TournamentPlayerSummary = {
  playerId: string;
  username: string;
  displayName: string;
  joinedAt: string;
};

export type TournamentSummary = {
  tournamentId: string;
  gameType: string;
  tournamentType: string;
  entryFee: number;
  status: 'open' | 'full';
  playersCount: number;
  maxPlayers: number;
  createdAt: string;
  updatedAt: string;
  players: TournamentPlayerSummary[];
};

export type JoinTournamentResult = {
  tournament: TournamentSummary;
  joinedPlayer: TournamentPlayerSummary;
};

export type GetPlayerTournamentsResult = {
  playerId: string;
  tournaments: TournamentSummary[];
};

export type JoinTournamentCommandMessage =
  MessageEnvelope<JoinTournamentCommandData>;

export type GetPlayerTournamentsQueryMessage =
  MessageEnvelope<GetPlayerTournamentsQueryData>;

export type TournamentResponseMessage<T> = MessageEnvelope<ServiceResult<T>>;
