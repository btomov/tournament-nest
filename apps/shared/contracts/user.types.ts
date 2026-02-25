export type UserLookupRequest = {
  correlationId: string;
  playerId: string;
};

export type UserLookupResponse = UserProfile | null;

export type UserProfile = {
  id: string;
  username: string;
  displayName: string;
};
