import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { config } from './config';
import dbPlugin, { dataSource } from './plugins/db';
import errorHandler from './plugins/errorHandler';
import swaggerPlugin from './plugins/swagger';
import authPlugin from './middleware/auth';
import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import challengeRoutes from './routes/challenges';
import rewardRoutes from './routes/rewards';
import leaderboardRoutes from './routes/leaderboard';

const buildApp = async () => {
  const app = Fastify({
    logger: {
      level: config.logLevel,
    },
  });

  // Security + cross-origin plugins.
  await app.register(cors, { origin: true });
  await app.register(helmet);
  await app.register(rateLimit, {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.timeWindow,
    errorResponseBuilder: (_request, context) => ({
      error: {
        code: 'RATE_LIMITED',
        message: `Rate limit exceeded, retry in ${context.after}`,
      },
    }),
  });

  // Cross-cutting concerns. Swagger registers before routes so it sees their schemas.
  await app.register(errorHandler);
  await app.register(swaggerPlugin);
  await app.register(dbPlugin);
  await app.register(authPlugin);

  // Route plugins.
  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(userRoutes, { prefix: '/api/users' });
  await app.register(challengeRoutes, { prefix: '/api/challenges' });
  await app.register(rewardRoutes, { prefix: '/api/rewards' });
  await app.register(leaderboardRoutes, { prefix: '/api/leaderboard' });

  // Health check with database connectivity status.
  app.get('/health', async (_request, reply) => {
    try {
      await dataSource.query('SELECT 1');
      return { status: 'ok', db: 'up' };
    } catch {
      reply.code(503);
      return { status: 'degraded', db: 'down' };
    }
  });

  return app;
};

const start = async () => {
  const app = await buildApp();

  // Graceful shutdown: close the server (which tears down the DB pool) on signal.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down`);
      await app.close();
      process.exit(0);
    });
  }

  try {
    await app.listen({ port: config.port, host: '0.0.0.0' });
    app.log.info(`Server running on http://localhost:${config.port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

// Only start the server when run directly, so tests can import buildApp.
if (require.main === module) {
  start();
}

export { buildApp };
