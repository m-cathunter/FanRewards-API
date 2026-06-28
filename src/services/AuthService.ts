import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';
import { DataSource, IsNull, Repository } from 'typeorm';
import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { config } from '../config';
import { AppError } from '../errors';
import { TokenPair } from '../types';
import { PublicUser, toPublicUser } from '../utils/user';

const SALT_ROUNDS = 10;

interface RefreshPayload {
  sub: string;
  type: 'refresh';
  jti: string;
}

export interface AuthResult {
  user: PublicUser;
  tokens: TokenPair;
}

/** SHA-256 of the raw token; this is what we persist, never the token itself. */
function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class AuthService {
  private readonly users: Repository<User>;
  private readonly refreshTokens: Repository<RefreshToken>;

  constructor(dataSource: DataSource) {
    this.users = dataSource.getRepository(User);
    this.refreshTokens = dataSource.getRepository(RefreshToken);
  }

  async register(email: string, password: string, displayName?: string): Promise<AuthResult> {
    const existing = await this.users.findOne({ where: { email } });
    if (existing) {
      throw AppError.conflict('EMAIL_TAKEN', 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await this.users.save(
      this.users.create({ email, passwordHash, displayName: displayName ?? null }),
    );

    const tokens = await this.issueTokens(user.id);
    return { user: toPublicUser(user), tokens };
  }

  async login(email: string, password: string): Promise<AuthResult> {
    // passwordHash is select:false, so request it explicitly for verification.
    const user = await this.users
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('user.email = :email', { email })
      .getOne();

    // Same generic error whether the email is unknown or the password is wrong,
    // so we don't leak which accounts exist.
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw AppError.unauthorized('Invalid email or password', 'INVALID_CREDENTIALS');
    }

    const tokens = await this.issueTokens(user.id);
    return { user: toPublicUser(user), tokens };
  }

  /**
   * Rotate a refresh token: validate it, revoke it, and issue a fresh pair.
   * If a token that was already rotated is replayed, we treat it as theft and
   * revoke the user's entire active token family.
   */
  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = this.verifyRefresh(refreshToken);
    const stored = await this.refreshTokens.findOne({
      where: { tokenHash: hashToken(refreshToken) },
    });

    if (!stored) {
      throw AppError.unauthorized('Invalid refresh token', 'INVALID_TOKEN');
    }

    if (stored.revokedAt) {
      await this.refreshTokens.update(
        { userId: payload.sub, revokedAt: IsNull() },
        { revokedAt: new Date() },
      );
      throw AppError.unauthorized('Refresh token has already been used', 'INVALID_TOKEN');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw AppError.unauthorized('Refresh token has expired', 'INVALID_TOKEN');
    }

    stored.revokedAt = new Date();
    await this.refreshTokens.save(stored);

    return this.issueTokens(stored.userId);
  }

  /** Idempotent logout: revoke the presented refresh token if it is valid. */
  async logout(refreshToken: string): Promise<void> {
    try {
      this.verifyRefresh(refreshToken);
    } catch {
      return; // Already invalid — nothing to revoke.
    }
    await this.refreshTokens.update(
      { tokenHash: hashToken(refreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }

  private async issueTokens(userId: string): Promise<TokenPair> {
    const accessToken = jwt.sign({ sub: userId, type: 'access' }, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    } as SignOptions);

    const refreshToken = jwt.sign(
      { sub: userId, type: 'refresh', jti: randomUUID() },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn } as SignOptions,
    );

    const { exp } = jwt.decode(refreshToken) as { exp: number };
    await this.refreshTokens.save(
      this.refreshTokens.create({
        userId,
        tokenHash: hashToken(refreshToken),
        expiresAt: new Date(exp * 1000),
        revokedAt: null,
      }),
    );

    return { accessToken, refreshToken };
  }

  private verifyRefresh(token: string): RefreshPayload {
    try {
      const payload = jwt.verify(token, config.jwt.refreshSecret) as RefreshPayload;
      if (payload.type !== 'refresh') {
        throw new Error('wrong token type');
      }
      return payload;
    } catch {
      throw AppError.unauthorized('Invalid refresh token', 'INVALID_TOKEN');
    }
  }
}
