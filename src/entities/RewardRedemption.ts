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
import { Reward } from './Reward';

export type RedemptionStatus = 'pending' | 'fulfilled' | 'cancelled';

@Entity('reward_redemptions')
export class RewardRedemption {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @ManyToOne(() => User, (user) => user.redemptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => Reward, (reward) => reward.redemptions, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'rewardId' })
  reward!: Reward;

  @Column({ type: 'uuid' })
  rewardId!: string;

  @Column({ type: 'int' })
  pointsSpent!: number;

  @Column({
    type: 'enum',
    enum: ['pending', 'fulfilled', 'cancelled'],
    default: 'pending',
  })
  status!: RedemptionStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
