import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  KafkaTopics,
  type GetPlayerTournamentsResult,
  type JoinTournamentResult,
  type TournamentResponseMessage,
} from '@app/contracts';
import { TournamentService } from './tournament.service';
import {
  GetPlayerTournamentsQueryMessageDto,
  JoinTournamentCommandMessageDto,
} from './dto/tournament-message.dto';

@Controller()
export class TournamentController {
  constructor(private readonly tournamentService: TournamentService) {}

  @MessagePattern(KafkaTopics.joinTournamentCommand)
  handleJoinTournament(
    @Payload() payload: JoinTournamentCommandMessageDto,
  ): Promise<TournamentResponseMessage<JoinTournamentResult>> {
    return this.tournamentService.joinTournament(payload);
  }

  @MessagePattern(KafkaTopics.getPlayerTournamentsQuery)
  handleGetPlayerTournaments(
    @Payload() payload: GetPlayerTournamentsQueryMessageDto,
  ): Promise<TournamentResponseMessage<GetPlayerTournamentsResult>> {
    return this.tournamentService.getPlayerTournaments(payload);
  }
}
