import { FastifyInstance } from 'fastify';
import { api, cleanDatabase, registerUser, setPoints, setupApp } from './helpers';

describe('leaderboard', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setupApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('ranks fans by points and shares ranks on ties', async () => {
    const a = await registerUser(app);
    const b = await registerUser(app);
    const c = await registerUser(app);
    await setPoints(a.id, 300);
    await setPoints(b.id, 300); // tie with a
    await setPoints(c.id, 100);

    const res = await api(app).get('/api/leaderboard?limit=10').set(a.auth);
    expect(res.status).toBe(200);
    expect(res.body.meta.total).toBe(3);

    const ranks = res.body.data.map((e: { rank: number }) => e.rank);
    expect(ranks).toEqual([1, 1, 3]); // tied first, then rank 3
  });

  it('returns the current user rank', async () => {
    const a = await registerUser(app);
    const c = await registerUser(app);
    await setPoints(a.id, 300);
    await setPoints(c.id, 100);

    const res = await api(app).get('/api/leaderboard/me').set(c.auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ rank: 2, totalPoints: 100, userId: c.id });
  });
});
