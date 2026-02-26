import { IsNotEmpty, IsString } from 'class-validator';

export class LoginHttpRequestDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;
}

export type LoginHttpResponse = {
  accessToken: string;
  tokenType: 'Bearer';
  expiresIn: string;
};
