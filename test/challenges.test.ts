import { FastifyInstance } from 'fastify';
import { api, cleanDatabase, dataSource, registerUser, setupApp, TestUser } from './helpers';
import { Challenge } from '../src/entities/Challenge';

async function createChallenge(overrides: Partial<Challenge> = {}): Promise<Challenge> {
  const repo = dataSource.getRepository(Challenge);
  return repo.save(
    repo.create({
      title: 'All Night',
      artist: 'Camo & Krooked',
      description: 'dnb classic',
      points: 150,
      durationSeconds: 219,
      difficulty: 'easy',
      isActive: true,
      ...overrides,
    }),
  );
}

describe('challenges', () => {
  let app: FastifyInstance;
  let user: TestUser;

  beforeAll(async () => {
    app = await setupApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await cleanDatabase();
    user = await registerUser(app);
  });

  it('lists challenges with pagination meta', async () => {
    await createChallenge();
    const res = await api(app).get('/api/challenges?limit=10').set(user.auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.meta).toMatchObject({ page: 1, limit: 10, total: 1 });
  });

  it('awards full points at >= 80% listened', async () => {
    const challenge = await createChallenge({ points: 150 });
    const res = await api(app)
      .post(`/api/challenges/${challenge.id}/complete`)
      .set(user.auth)
      .send({ listenPercentage: 90 });
    expect(res.status).toBe(201);
    expect(res.body.data.completion.pointsEarned).toBe(150);
    expect(res.body.data.totalPoints).toBe(150);
  });

  it('awards proportional points below 80%', async () => {
    const challenge = await createChallenge({ points: 150 });
    const res = await api(app)
      .post(`/api/challenges/${challenge.id}/complete`)
      .set(user.auth)
      .send({ listenPercentage: 50 });
    expect(res.status).toBe(201);
    expect(res.body.data.completion.pointsEarned).toBe(75);
  });

  it('accumulates points across multiple completions in stats', async () => {
    const challenge = await createChallenge({ points: 150 });
    await api(app).post(`/api/challenges/${challenge.id}/complete`).set(user.auth).send({ listenPercentage: 90 });
    await api(app).post(`/api/challenges/${challenge.id}/complete`).set(user.auth).send({ listenPercentage: 50 });

    const stats = await api(app).get('/api/users/me/stats').set(user.auth);
    expect(stats.body.data.totalPoints).toBe(225);
    expect(stats.body.data.completions).toEqual({ count: 2, pointsEarned: 225 });
  });

  it('rejects completing an inactive challenge with 409', async () => {
    const challenge = await createChallenge({ isActive: false });
    const res = await api(app)
      .post(`/api/challenges/${challenge.id}/complete`)
      .set(user.auth)
      .send({ listenPercentage: 90 });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CHALLENGE_INACTIVE');
  });

  it('validates listenPercentage bounds', async () => {
    const challenge = await createChallenge();
    const res = await api(app)
      .post(`/api/challenges/${challenge.id}/complete`)
      .set(user.auth)
      .send({ listenPercentage: 120 });
    expect(res.status).toBe(400);
  });

  it('returns 404 for an unknown challenge', async () => {
    const res = await api(app)
      .get('/api/challenges/00000000-0000-0000-0000-000000000000')
      .set(user.auth);
    expect(res.status).toBe(404);
  });
});
