import { DataSource, Repository } from 'typeorm';
import { Reward } from '../entities/Reward';
import { RewardRedemption } from '../entities/RewardRedemption';
import { User } from '../entities/User';
import { AppError } from '../errors';
import { PaginationOptions } from '../types';

export interface RedeemResult {
  redemption: RewardRedemption;
  totalPoints: number;
}

export class RewardService {
  private readonly rewards: Repository<Reward>;
  private readonly redemptions: Repository<RewardRedemption>;

  constructor(private readonly dataSource: DataSource) {
    this.rewards = dataSource.getRepository(Reward);
    this.redemptions = dataSource.getRepository(RewardRedemption);
  }

  async list(): Promise<Reward[]> {
    return this.rewards.find({
      where: { isAvailable: true },
      order: { pointsCost: 'ASC' },
    });
  }

  /**
   * Spend points on a reward. The points are deducted with a single
   * conditional UPDATE (`SET totalPoints = totalPoints - cost WHERE id = :id
   * AND totalPoints >= cost`). Because the database serializes writes to the
   * same row, two concurrent redemptions for the same user can never both
   * succeed past the balance — exactly one wins and the other sees
   * INSUFFICIENT_POINTS. The deduction and the redemption record share a
   * transaction so they commit or roll back together.
   */
  async redeem(userId: string, rewardId: string): Promise<RedeemResult> {
    return this.dataSource.transaction(async (manager) => {
      const reward = await manager.findOne(Reward, { where: { id: rewardId } });
      if (!reward) {
        throw AppError.notFound('Reward not found');
      }
      if (!reward.isAvailable) {
        throw AppError.conflict('REWARD_UNAVAILABLE', 'This reward is not available');
      }

      // pointsCost comes from our own DB (an integer), so inlining it is safe.
      const result = await manager
        .createQueryBuilder()
        .update(User)
        .set({ totalPoints: () => `"totalPoints" - ${reward.pointsCost}` })
        .where('id = :id', { id: userId })
        .andWhere('"totalPoints" >= :cost', { cost: reward.pointsCost })
        .execute();

      if (result.affected === 0) {
        const user = await manager.findOneOrFail(User, { where: { id: userId } });
        const needed = reward.pointsCost - user.totalPoints;
        throw AppError.badRequest(
          'INSUFFICIENT_POINTS',
          `You need ${needed} more point${needed === 1 ? '' : 's'} to redeem this reward`,
        );
      }

      const redemption = await manager.save(
        manager.create(RewardRedemption, {
          userId,
          rewardId,
          pointsSpent: reward.pointsCost,
          status: 'pending',
        }),
      );

      const user = await manager.findOneOrFail(User, { where: { id: userId } });
      return { redemption, totalPoints: user.totalPoints };
    });
  }

  async getHistory(
    userId: string,
    { page, limit }: PaginationOptions,
  ): Promise<{ rows: RewardRedemption[]; total: number }> {
    const [rows, total] = await this.redemptions.findAndCount({
      where: { userId },
      relations: { reward: true },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { rows, total };
  }
}
