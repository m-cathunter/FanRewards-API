import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './User';
import { Challenge } from './Challenge';

@Entity('challenge_completions')
export class ChallengeCompletion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => User, (user) => user.completions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  @Index()
  @ManyToOne(() => Challenge, (challenge) => challenge.completions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'challengeId' })
  challenge!: Challenge;

  @Column({ type: 'uuid' })
  challengeId!: string;

  @Column({ type: 'int' })
  pointsEarned!: number;

  // Percentage of the track the user listened to, 0-100.
  @Column({ type: 'int' })
  listenPercentage!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
