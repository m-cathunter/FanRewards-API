import { FastifyInstance } from 'fastify';
import { api, setupApp } from './helpers';

// Exercises the HTTP-layer hardening on a public route (/health) so no auth
// is needed. CORS_ORIGINS is fixed to https://allowed.example.com in test/env.ts.
describe('http layer', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await setupApp();
  });
  afterAll(async () => {
    await app.close();
  });

  describe('correlation id', () => {
    it('echoes an incoming x-request-id', async () => {
      const res = await api(app).get('/health').set('x-request-id', 'trace-abc-123');
      expect(res.headers['x-request-id']).toBe('trace-abc-123');
    });

    it('generates an x-request-id when none is supplied', async () => {
      const res = await api(app).get('/health');
      expect(res.headers['x-request-id']).toBeTruthy();
    });
  });

  describe('cors allowlist', () => {
    it('allows a configured origin', async () => {
      const res = await api(app).get('/health').set('Origin', 'https://allowed.example.com');
      expect(res.headers['access-control-allow-origin']).toBe('https://allowed.example.com');
    });

    it('does not allow an origin outside the allowlist', async () => {
      const res = await api(app).get('/health').set('Origin', 'https://evil.example.com');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });
});
