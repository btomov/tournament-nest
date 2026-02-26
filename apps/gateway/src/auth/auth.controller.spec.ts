import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  it('returns a token payload for a player id', () => {
    const authService: Pick<jest.Mocked<AuthService>, 'issueTokenForPlayer'> = {
      issueTokenForPlayer: jest.fn().mockReturnValue({
        accessToken: 'token-1',
        tokenType: 'Bearer',
        expiresIn: '1h',
      }),
    };

    const controller = new AuthController(
      authService as unknown as AuthService,
    );

    const result = controller.login({ playerId: 'user1' } as never);

    expect(authService.issueTokenForPlayer).toHaveBeenCalledWith('user1');
    expect(result).toEqual({
      accessToken: 'token-1',
      tokenType: 'Bearer',
      expiresIn: '1h',
    });
  });
});
