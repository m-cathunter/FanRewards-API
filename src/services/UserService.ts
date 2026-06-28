import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { RewardRedemption } from '../entities/RewardRedemption';
import { AppError } from '../errors';
import { PublicUser, toPublicUser } from '../utils/user';

export interface UserStats {
  totalPoints: number;
  completions: { count: number; pointsEarned: number };
  redemptions: { count: number; pointsSpent: number };
}

export class UserService {
  private readonly users: Repository<User>;
  private readonly completions: Repository<ChallengeCompletion>;
  private readonly redemptions: Repository<RewardRedemption>;

  constructor(dataSource: DataSource) {
    this.users = dataSource.getRepository(User);
    this.completions = dataSource.getRepository(ChallengeCompletion);
    this.redemptions = dataSource.getRepository(RewardRedemption);
  }

  async getProfile(userId: string): Promise<PublicUser> {
    return toPublicUser(await this.findOrThrow(userId));
  }

  async updateProfile(userId: string, displayName: string | null): Promise<PublicUser> {
    const user = await this.findOrThrow(userId);
    user.displayName = displayName;
    return toPublicUser(await this.users.save(user));
  }

  async getStats(userId: string): Promise<UserStats> {
    const user = await this.findOrThrow(userId);

    const completion = await this.completions
      .createQueryBuilder('c')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(c.pointsEarned), 0)', 'points')
      .where('c.userId = :userId', { userId })
      .getRawOne<{ count: string; points: string }>();

    const redemption = await this.redemptions
      .createQueryBuilder('r')
      .select('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(r.pointsSpent), 0)', 'points')
      .where('r.userId = :userId', { userId })
      .getRawOne<{ count: string; points: string }>();

    return {
      totalPoints: user.totalPoints,
      completions: {
        count: Number(completion?.count ?? 0),
        pointsEarned: Number(completion?.points ?? 0),
      },
      redemptions: {
        count: Number(redemption?.count ?? 0),
        pointsSpent: Number(redemption?.points ?? 0),
      },
    };
  }

  private async findOrThrow(userId: string): Promise<User> {
    const user = await this.users.findOne({ where: { id: userId } });
    if (!user) {
      throw AppError.notFound('User not found');
    }
    return user;
  }
}
