import { FastifyInstance } from 'fastify';
import { api, cleanDatabase, setupApp } from './helpers';

describe('auth flow', () => {
  let app: FastifyInstance;
  const creds = { email: 'amy@test.com', password: 'supersecret', displayName: 'Amy' };

  beforeAll(async () => {
    app = await setupApp();
  });
  afterAll(async () => {
    await app.close();
  });
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('registers and returns a safe user plus tokens', async () => {
    const res = await api(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(201);
    expect(res.body.data.user.email).toBe(creds.email);
    expect(res.body.data.user).not.toHaveProperty('passwordHash');
    expect(res.body.data.tokens.accessToken).toBeTruthy();
    expect(res.body.data.tokens.refreshToken).toBeTruthy();
  });

  it('rejects a duplicate email with 409 EMAIL_TAKEN', async () => {
    await api(app).post('/api/auth/register').send(creds);
    const res = await api(app).post('/api/auth/register').send(creds);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('EMAIL_TAKEN');
  });

  it('rejects an invalid body with 400 VALIDATION_ERROR', async () => {
    const res = await api(app).post('/api/auth/register').send({ email: 'x@test.com', password: '123' });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('logs in with valid credentials and rejects a wrong password', async () => {
    await api(app).post('/api/auth/register').send(creds);

    const ok = await api(app).post('/api/auth/login').send({ email: creds.email, password: creds.password });
    expect(ok.status).toBe(200);
    expect(ok.body.data.tokens.accessToken).toBeTruthy();

    const bad = await api(app).post('/api/auth/login').send({ email: creds.email, password: 'wrong' });
    expect(bad.status).toBe(401);
    expect(bad.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rotates the refresh token and revokes the family on reuse', async () => {
    const reg = await api(app).post('/api/auth/register').send(creds);
    const original = reg.body.data.tokens.refreshToken;

    const rotated = await api(app).post('/api/auth/refresh').send({ refreshToken: original });
    expect(rotated.status).toBe(200);
    const fresh = rotated.body.data.refreshToken;
    expect(fresh).toBeTruthy();

    // Replaying the original (already-rotated) token is treated as theft.
    const reuse = await api(app).post('/api/auth/refresh').send({ refreshToken: original });
    expect(reuse.status).toBe(401);
    expect(reuse.body.error.code).toBe('INVALID_TOKEN');

    // ...and that also revokes the legitimately-rotated token.
    const afterTheft = await api(app).post('/api/auth/refresh').send({ refreshToken: fresh });
    expect(afterTheft.status).toBe(401);
  });

  it('lets only one of two concurrent refreshes with the same token succeed', async () => {
    const reg = await api(app).post('/api/auth/register').send(creds);
    const rt = reg.body.data.tokens.refreshToken;

    const [a, b] = await Promise.all([
      api(app).post('/api/auth/refresh').send({ refreshToken: rt }),
      api(app).post('/api/auth/refresh').send({ refreshToken: rt }),
    ]);

    // Rotation is single-use: exactly one wins, the other is rejected.
    expect([a.status, b.status].sort()).toEqual([200, 401]);
  });

  it('invalidates a refresh token on logout', async () => {
    const reg = await api(app).post('/api/auth/register').send(creds);
    const rt = reg.body.data.tokens.refreshToken;

    const logout = await api(app).post('/api/auth/logout').send({ refreshToken: rt });
    expect(logout.status).toBe(200);

    const res = await api(app).post('/api/auth/refresh').send({ refreshToken: rt });
    expect(res.status).toBe(401);
  });

  it('rejects access to a protected route without a token', async () => {
    const res = await api(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });
});
