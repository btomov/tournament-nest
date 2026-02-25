import { Type } from 'class-transformer';
import {
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { type MessageMeta } from '@app/contracts';

export class MessageMetaDto implements MessageMeta {
  @IsString()
  @IsNotEmpty()
  correlationId!: string;

  @IsISO8601()
  timestamp!: string;

  @IsString()
  @IsNotEmpty()
  source!: string;

  @IsIn(['command', 'query'])
  messageType!: MessageMeta['messageType'];
}

export class JoinTournamentCommandDataDto {
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

export class GetPlayerTournamentsQueryDataDto {
  @IsString()
  @IsNotEmpty()
  playerId!: string;
}

export class JoinTournamentCommandMessageDto {
  @ValidateNested()
  @Type(() => MessageMetaDto)
  meta!: MessageMetaDto;

  @ValidateNested()
  @Type(() => JoinTournamentCommandDataDto)
  data!: JoinTournamentCommandDataDto;
}

export class GetPlayerTournamentsQueryMessageDto {
  @ValidateNested()
  @Type(() => MessageMetaDto)
  meta!: MessageMetaDto;

  @ValidateNested()
  @Type(() => GetPlayerTournamentsQueryDataDto)
  data!: GetPlayerTournamentsQueryDataDto;
}
