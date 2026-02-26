import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  const originalJwtExpiresIn = process.env.JWT_EXPIRES_IN;

  afterEach(() => {
    process.env.JWT_EXPIRES_IN = originalJwtExpiresIn;
  });

  it('issues a bearer token for the player id', () => {
    const jwtService: Pick<jest.Mocked<JwtService>, 'sign'> = {
      sign: jest.fn().mockReturnValue('signed-jwt'),
    };

    const service = new AuthService(jwtService as unknown as JwtService);

    const result = service.issueTokenForPlayer('user1');

    expect(jwtService.sign).toHaveBeenCalledWith({ sub: 'user1' });
    expect(result).toEqual({
      accessToken: 'signed-jwt',
      tokenType: 'Bearer',
      expiresIn: '1h',
    });
  });

  it('uses JWT_EXPIRES_IN from environment when provided', () => {
    process.env.JWT_EXPIRES_IN = '15m';

    const jwtService: Pick<jest.Mocked<JwtService>, 'sign'> = {
      sign: jest.fn().mockReturnValue('signed-jwt'),
    };

    const service = new AuthService(jwtService as unknown as JwtService);

    const result = service.issueTokenForPlayer('user2');

    expect(result.expiresIn).toBe('15m');
  });
});
