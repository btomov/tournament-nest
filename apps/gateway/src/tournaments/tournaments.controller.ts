import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  type GetPlayerTournamentsResult,
  type JoinTournamentCommandData,
  type JoinTournamentResult,
} from '@app/contracts';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { type JwtUser } from '../auth/auth.types';
import {
  JoinTournamentHttpRequestDto,
  PlayerTournamentsParamsDto,
} from './dto/tournaments-http.dto';
import { TournamentsService } from './tournaments.service';

@Controller()
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post('tournaments/join')
  @UseGuards(JwtAuthGuard)
  joinTournament(
    @Body() body: JoinTournamentHttpRequestDto,
    @CurrentUser() user: JwtUser,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<JoinTournamentResult> {
    const command: JoinTournamentCommandData = {
      playerId: user.sub,
      gameType: body.gameType,
      tournamentType: body.tournamentType,
      entryFee: body.entryFee,
    };

    return this.tournamentsService.joinTournament(command, correlationId);
  }

  @Get('tournaments/my-tournaments')
  @UseGuards(JwtAuthGuard)
  getMyTournaments(
    @CurrentUser() user: JwtUser,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<GetPlayerTournamentsResult> {
    return this.tournamentsService.getPlayerTournaments(
      user.sub,
      correlationId,
    );
  }

  @Get('players/:playerId/tournaments')
  getPlayerTournaments(
    @Param() params: PlayerTournamentsParamsDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<GetPlayerTournamentsResult> {
    return this.tournamentsService.getPlayerTournaments(
      params.playerId,
      correlationId,
    );
  }
}
