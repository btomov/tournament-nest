export type JoinCriteria = {
  gameType: string;
  tournamentType: string;
  entryFee: number;
};

export type TournamentPlayerRecord = {
  playerId: string;
  username: string;
  displayName: string;
  joinedAt: string;
};

export type TournamentRecord = {
  id: string;
  gameType: string;
  tournamentType: string;
  entryFee: number;
  maxPlayers: number;
  players: TournamentPlayerRecord[];
  createdAt: string;
  updatedAt: string;
};

export type AddPlayerResult = {
  tournament: TournamentRecord;
  player: TournamentPlayerRecord;
};
