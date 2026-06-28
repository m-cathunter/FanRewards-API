import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ChallengeCompletion } from './ChallengeCompletion';
import { RewardRedemption } from './RewardRedemption';
import { RefreshToken } from './RefreshToken';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 255 })
  email!: string;

  // Never selected by default so password hashes don't leak into query results.
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  displayName!: string | null;

  // Indexed for the leaderboard, which orders by totalPoints descending.
  @Index()
  @Column({ type: 'int', default: 0 })
  totalPoints!: number;

  @OneToMany(() => ChallengeCompletion, (completion) => completion.user)
  completions!: ChallengeCompletion[];

  @OneToMany(() => RewardRedemption, (redemption) => redemption.user)
  redemptions!: RewardRedemption[];

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
