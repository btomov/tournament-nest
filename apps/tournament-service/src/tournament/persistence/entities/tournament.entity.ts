import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DEFAULT_TOURNAMENT_MAX_PLAYERS } from '../../types/tournament.constants';
import { TournamentPlayerEntity } from './tournament-player.entity';

export const numericToNumberTransformer = {
  to(value: number): number {
    return value;
  },
  from(value: string | number): number {
    return typeof value === 'number' ? value : Number(value);
  },
};

@Entity({ name: 'tournaments' })
@Index('ix_tournaments_matching_lookup', [
  'gameType',
  'tournamentType',
  'entryFee',
  'createdAt',
])
export class TournamentEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64 })
  gameType!: string;

  @Column({ type: 'varchar', length: 64 })
  tournamentType!: string;

  @Column({
    type: 'numeric',
    precision: 10,
    scale: 2,
    transformer: numericToNumberTransformer,
  })
  entryFee!: number;

  @Column({ type: 'integer', default: DEFAULT_TOURNAMENT_MAX_PLAYERS })
  maxPlayers!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @OneToMany(() => TournamentPlayerEntity, (player) => player.tournament)
  players!: TournamentPlayerEntity[];
}
