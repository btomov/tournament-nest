import { IsNotEmpty, IsString } from 'class-validator';

export class AuthLoginRequestDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;
}

export type AuthLoginResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  playerId: string;
  expiresIn: string;
};

export type JwtClaims = {
  sub: string;
  username?: string;
  displayName?: string;
};
