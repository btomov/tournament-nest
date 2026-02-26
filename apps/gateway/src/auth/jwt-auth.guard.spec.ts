import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServiceErrorCodes } from '@app/contracts';
import { JwtAuthGuard } from './jwt-auth.guard';

type RequestWithHeaders = {
  headers: Record<string, string | string[] | undefined>;
  user?: { sub: string };
};

function createHttpContext(request: RequestWithHeaders): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let jwtService: Pick<jest.Mocked<JwtService>, 'verifyAsync'>;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwtService = {
      verifyAsync: jest.fn(),
    };
    guard = new JwtAuthGuard(jwtService as unknown as JwtService);
  });

  it('accepts a valid bearer token and attaches request.user', async () => {
    const request: RequestWithHeaders = {
      headers: { authorization: 'Bearer token-123' },
    };
    jwtService.verifyAsync.mockResolvedValue({ sub: 'user1' } as never);

    const result = await guard.canActivate(createHttpContext(request));

    expect(jwtService.verifyAsync).toHaveBeenCalledWith('token-123');
    expect(result).toBe(true);
    expect(request.user).toEqual({ sub: 'user1' });
  });

  it('rejects missing Authorization header', async () => {
    const request: RequestWithHeaders = { headers: {} };

    await expect(guard.canActivate(createHttpContext(request))).rejects.toThrow(
      UnauthorizedException,
    );

    try {
      await guard.canActivate(createHttpContext(request));
    } catch (error: unknown) {
      const exception = error as UnauthorizedException;
      expect(exception.getStatus()).toBe(401);
      expect(exception.getResponse()).toMatchObject({
        code: ServiceErrorCodes.unauthorized,
      });
    }
  });

  it('rejects token with missing subject', async () => {
    const request: RequestWithHeaders = {
      headers: { authorization: 'Bearer token-123' },
    };
    jwtService.verifyAsync.mockResolvedValue({ sub: '   ' } as never);

    await expect(guard.canActivate(createHttpContext(request))).rejects.toThrow(
      UnauthorizedException,
    );

    try {
      await guard.canActivate(createHttpContext(request));
    } catch (error: unknown) {
      const exception = error as UnauthorizedException;
      expect(exception.getResponse()).toMatchObject({
        code: ServiceErrorCodes.invalidToken,
      });
    }
  });

  it('rejects invalid or expired token', async () => {
    const request: RequestWithHeaders = {
      headers: { authorization: 'Bearer bad-token' },
    };
    jwtService.verifyAsync.mockRejectedValue(new Error('jwt malformed'));

    await expect(guard.canActivate(createHttpContext(request))).rejects.toThrow(
      UnauthorizedException,
    );

    try {
      await guard.canActivate(createHttpContext(request));
    } catch (error: unknown) {
      const exception = error as UnauthorizedException;
      expect(exception.getResponse()).toMatchObject({
        code: ServiceErrorCodes.invalidToken,
        message: 'Invalid or expired token',
      });
    }
  });
});
