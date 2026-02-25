import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class JoinTournamentHttpRequestDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;

  @IsString()
  @IsNotEmpty()
  gameType!: string;

  @IsString()
  @IsNotEmpty()
  tournamentType!: string;

  @IsNumber({ allowInfinity: false, allowNaN: false })
  @Min(0)
  entryFee!: number;
}

export class PlayerTournamentsParamsDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;
}
