import {
  type TournamentSummary,
  type TournamentPlayerSummary,
} from '@app/contracts';
import {
  type TournamentPlayerRecord,
  type TournamentRecord,
} from '../types/tournament.persistence.types';

export function mapTournamentSummary(
  tournament: TournamentRecord,
): TournamentSummary {
  return {
    tournamentId: tournament.id,
    gameType: tournament.gameType,
    tournamentType: tournament.tournamentType,
    entryFee: tournament.entryFee,
    status:
      tournament.players.length >= tournament.maxPlayers ? 'full' : 'open',
    playersCount: tournament.players.length,
    maxPlayers: tournament.maxPlayers,
    createdAt: tournament.createdAt,
    updatedAt: tournament.updatedAt,
    players: tournament.players.map(mapTournamentPlayerSummary),
  };
}

export function mapTournamentPlayerSummary(
  player: TournamentPlayerRecord,
): TournamentPlayerSummary {
  return {
    playerId: player.playerId,
    username: player.username,
    displayName: player.displayName,
    joinedAt: player.joinedAt,
  };
}
