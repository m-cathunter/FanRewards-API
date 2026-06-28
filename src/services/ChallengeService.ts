import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Challenge, ChallengeDifficulty } from '../entities/Challenge';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { User } from '../entities/User';
import { AppError } from '../errors';
import { PaginationOptions } from '../types';

/** Minimum listen percentage that earns the full point value. */
export const FULL_CREDIT_THRESHOLD = 80;

export interface ListChallengesOptions extends PaginationOptions {
  difficulty?: ChallengeDifficulty;
  active?: boolean;
}

export interface CompletionResult {
  completion: ChallengeCompletion;
  totalPoints: number;
}

export class ChallengeService {
  private readonly challenges: Repository<Challenge>;

  constructor(private readonly dataSource: DataSource) {
    this.challenges = dataSource.getRepository(Challenge);
  }

  async list(
    options: ListChallengesOptions,
  ): Promise<{ rows: Challenge[]; total: number }> {
    const where: FindOptionsWhere<Challenge> = {};
    if (options.difficulty) {
      where.difficulty = options.difficulty;
    }
    if (options.active !== undefined) {
      where.isActive = options.active;
    }

    const [rows, total] = await this.challenges.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (options.page - 1) * options.limit,
      take: options.limit,
    });

    return { rows, total };
  }

  async getById(id: string): Promise<Challenge> {
    const challenge = await this.challenges.findOne({ where: { id } });
    if (!challenge) {
      throw AppError.notFound('Challenge not found');
    }
    return challenge;
  }

  /**
   * Record a completion and award points. Listening to >= 80% earns the full
   * value; below that, credit is proportional to how much was listened. The
   * insert and the user's point increment run in one transaction, and the
   * increment is an atomic SQL UPDATE so concurrent completions can't lose
   * updates.
   */
  async complete(
    userId: string,
    challengeId: string,
    listenPercentage: number,
  ): Promise<CompletionResult> {
    return this.dataSource.transaction(async (manager) => {
      const challenge = await manager.findOne(Challenge, { where: { id: challengeId } });
      if (!challenge) {
        throw AppError.notFound('Challenge not found');
      }
      if (!challenge.isActive) {
        throw AppError.conflict('CHALLENGE_INACTIVE', 'This challenge is no longer active');
      }

      const pointsEarned =
        listenPercentage >= FULL_CREDIT_THRESHOLD
          ? challenge.points
          : Math.round((challenge.points * listenPercentage) / 100);

      const completion = await manager.save(
        manager.create(ChallengeCompletion, {
          userId,
          challengeId,
          pointsEarned,
          listenPercentage,
        }),
      );

      await manager.increment(User, { id: userId }, 'totalPoints', pointsEarned);
      const user = await manager.findOneOrFail(User, { where: { id: userId } });

      return { completion, totalPoints: user.totalPoints };
    });
  }
}
