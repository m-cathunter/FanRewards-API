import { DataSource, Repository } from 'typeorm';
import { User } from '../entities/User';
import { AppError } from '../errors';
import { LeaderboardEntry, PaginationOptions } from '../types';

export class LeaderboardService {
  private readonly users: Repository<User>;

  constructor(private readonly dataSource: DataSource) {
    this.users = dataSource.getRepository(User);
  }

  /**
   * Top fans by total points. RANK() ranks purely on points, so tied users
   * share a rank (e.g. 1, 1, 3); the outer ORDER BY adds id as a tiebreaker so
   * pagination is deterministic even when many users have the same points.
   */
  async getTopFans(
    { page, limit }: PaginationOptions,
  ): Promise<{ rows: LeaderboardEntry[]; total: number }> {
    const raw = await this.users
      .createQueryBuilder('user')
      .select('user.id', 'userId')
      .addSelect('user.displayName', 'displayName')
      .addSelect('user.totalPoints', 'totalPoints')
      .addSelect('RANK() OVER (ORDER BY user.totalPoints DESC)', 'rank')
      .orderBy('user.totalPoints', 'DESC')
      .addOrderBy('user.id', 'ASC')
      .limit(limit)
      .offset((page - 1) * limit)
      .getRawMany<{ userId: string; displayName: string | null; totalPoints: string; rank: string }>();

    const total = await this.users.count();

    const rows: LeaderboardEntry[] = raw.map((r) => ({
      rank: Number(r.rank),
      userId: r.userId,
      displayName: r.displayName,
      totalPoints: Number(r.totalPoints),
    }));

    return { rows, total };
  }

  /** The given user's rank and points. Rank is computed in a subquery so the
   * window sees every user before we filter down to this one. */
  async getUserRank(userId: string): Promise<LeaderboardEntry> {
    const rows = await this.dataSource.query(
      `SELECT id, "displayName", "totalPoints", rank
       FROM (
         SELECT id, "displayName", "totalPoints",
                RANK() OVER (ORDER BY "totalPoints" DESC) AS rank
         FROM users
       ) ranked
       WHERE id = $1`,
      [userId],
    );

    if (rows.length === 0) {
      throw AppError.notFound('User not found');
    }

    const row = rows[0];
    return {
      rank: Number(row.rank),
      userId: row.id,
      displayName: row.displayName,
      totalPoints: Number(row.totalPoints),
    };
  }
}
