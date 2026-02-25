import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { TournamentEntity } from './tournament.entity';

@Entity({ name: 'tournament_players' })
@Unique('uq_tournament_player_membership', ['tournamentId', 'playerId'])
@Index('ix_tournament_players_tournament_id', ['tournamentId'])
@Index('ix_tournament_players_player_id', ['playerId'])
export class TournamentPlayerEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  tournamentId!: string;

  @Column({ type: 'varchar', length: 64 })
  playerId!: string;

  @Column({ type: 'varchar', length: 64 })
  username!: string;

  @Column({ type: 'varchar', length: 128 })
  displayName!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt!: Date;

  @ManyToOne(() => TournamentEntity, (tournament) => tournament.players, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tournamentId' })
  tournament!: TournamentEntity;
}
