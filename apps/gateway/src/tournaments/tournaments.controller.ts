import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
} from '@nestjs/common';
import {
  type GetPlayerTournamentsResult,
  type JoinTournamentResult,
} from '@app/contracts';
import {
  JoinTournamentHttpRequestDto,
  PlayerTournamentsParamsDto,
} from './dto/tournaments-http.dto';
import { TournamentsService } from './tournaments.service';

@Controller()
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Post('tournaments/join')
  joinTournament(
    @Body() body: JoinTournamentHttpRequestDto,
    @Headers('x-correlation-id') correlationId?: string,
  ): Promise<JoinTournamentResult> {
    return this.tournamentsService.joinTournament(body, correlationId);
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
