import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { type LoginHttpResponse } from './auth.dto';
import { type JwtUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  issueTokenForPlayer(playerId: string): LoginHttpResponse {
    const payload: JwtUser = { sub: playerId };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    };
  }
}
