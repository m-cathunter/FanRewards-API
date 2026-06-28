import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ChallengeCompletion } from './ChallengeCompletion';

export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'varchar', length: 255 })
  artist!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int' })
  points!: number;

  @Column({ type: 'int' })
  durationSeconds!: number;

  @Column({ type: 'enum', enum: ['easy', 'medium', 'hard'] })
  difficulty!: ChallengeDifficulty;

  // Indexed because challenge listings filter on active status.
  @Index()
  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => ChallengeCompletion, (completion) => completion.challenge)
  completions!: ChallengeCompletion[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
