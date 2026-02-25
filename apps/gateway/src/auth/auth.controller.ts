import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  type LoginHttpResponse,
  LoginHttpRequestDto,
} from './auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() body: LoginHttpRequestDto): LoginHttpResponse {
    return this.authService.issueTokenForPlayer(body.playerId);
  }
}

