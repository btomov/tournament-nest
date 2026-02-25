import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ServiceErrorCodes } from '@app/contracts';
import { type JwtUser } from './auth.types';

type RequestWithHeadersAndUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: JwtUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request =
      context.switchToHttp().getRequest<RequestWithHeadersAndUser>();
    const authHeader = request.headers.authorization;
    const token = this.extractBearerToken(authHeader);

    if (!token) {
      throw new UnauthorizedException({
        code: ServiceErrorCodes.unauthorized,
        message: 'Missing or invalid Authorization header',
      });
    }

    try {
      const payload = await this.jwtService.verifyAsync<JwtUser>(token);

      if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) {
        throw new UnauthorizedException({
          code: ServiceErrorCodes.invalidToken,
          message: 'JWT payload is missing a valid subject',
        });
      }

      request.user = { sub: payload.sub };
      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException({
        code: ServiceErrorCodes.invalidToken,
        message: 'Invalid or expired token',
      });
    }
  }

  private extractBearerToken(
    authHeader: string | string[] | undefined,
  ): string | null {
    if (typeof authHeader !== 'string') {
      return null;
    }

    const [scheme, token] = authHeader.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token?.trim()) {
      return null;
    }

    return token.trim();
  }
}

