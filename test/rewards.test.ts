import { FastifyInstance } from 'fastify';
import { api, cleanDatabase, dataSource, registerUser, setPoints, setupApp, TestUser } from './helpers';
import { Reward } from '../src/entities/Reward';

async function createReward(pointsCost: number, overrides: Partial<Reward> = {}): Promise<Reward> {
  const repo = dataSource.getRepository(Reward);
  return repo.save(
    repo.create({
      name: 'Early Access Pass',
      description: 'desc',
      pointsCost,
      isAvailable: true,
      ...overrides,
    }),
  );
}

describe('rewards', () => {
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

  it('redeems a reward and deducts points', async () => {
    const reward = await createReward(200);
    await setPoints(user.id, 200);

    const res = await api(app).post(`/api/rewards/${reward.id}/redeem`).set(user.auth);
    expect(res.status).toBe(201);
    expect(res.body.data.redemption.pointsSpent).toBe(200);
    expect(res.body.data.totalPoints).toBe(0);
  });

  it('rejects redemption without enough points', async () => {
    const reward = await createReward(200);
    await setPoints(user.id, 50);

    const res = await api(app).post(`/api/rewards/${reward.id}/redeem`).set(user.auth);
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INSUFFICIENT_POINTS');
  });

  it('lets exactly one of two concurrent redemptions succeed', async () => {
    const reward = await createReward(200);
    await setPoints(user.id, 200); // only enough for one

    const [a, b] = await Promise.all([
      api(app).post(`/api/rewards/${reward.id}/redeem`).set(user.auth),
      api(app).post(`/api/rewards/${reward.id}/redeem`).set(user.auth),
    ]);

    const statuses = [a.status, b.status].sort();
    expect(statuses).toEqual([201, 400]);

    const me = await api(app).get('/api/users/me').set(user.auth);
    expect(me.body.data.totalPoints).toBe(0);
  });

  it('records redemption history', async () => {
    const reward = await createReward(200);
    await setPoints(user.id, 200);
    await api(app).post(`/api/rewards/${reward.id}/redeem`).set(user.auth);

    const res = await api(app).get('/api/rewards/history').set(user.auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].reward.name).toBe('Early Access Pass');
  });
});
