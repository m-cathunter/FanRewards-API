import { FastifyInstance } from 'fastify';
import request from 'supertest';
import { buildApp } from '../src/app';
import { dataSource } from '../src/plugins/db';
import { User } from '../src/entities/User';

export { dataSource };

/** Build the app, initialize the connection, and ensure the schema exists. */
export async function setupApp(): Promise<FastifyInstance> {
  const app = await buildApp();
  await app.ready();
  await dataSource.runMigrations();
  return app;
}

/** Wipe all tables between tests for isolation. */
export async function cleanDatabase(): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE refresh_tokens, reward_redemptions, challenge_completions, rewards, challenges, users RESTART IDENTITY CASCADE',
  );
}

export function api(app: FastifyInstance) {
  return request(app.server);
}

export interface TestUser {
  id: string;
  accessToken: string;
  refreshToken: string;
  auth: { Authorization: string };
}

let counter = 0;

/** Register a fresh user and return its id and tokens. */
export async function registerUser(app: FastifyInstance, password = 'supersecret'): Promise<TestUser> {
  counter += 1;
  const email = `user${counter}@test.com`;
  const res = await api(app).post('/api/auth/register').send({ email, password, displayName: `User ${counter}` });
  const { user, tokens } = res.body.data;
  return {
    id: user.id,
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    auth: { Authorization: `Bearer ${tokens.accessToken}` },
  };
}

/** Directly set a user's point balance (test setup shortcut). */
export async function setPoints(userId: string, totalPoints: number): Promise<void> {
  await dataSource.getRepository(User).update({ id: userId }, { totalPoints });
}
