import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { DataSource } from 'typeorm';
import { config } from '../config';
import { User } from '../entities/User';
import { Challenge } from '../entities/Challenge';
import { ChallengeCompletion } from '../entities/ChallengeCompletion';
import { Reward } from '../entities/Reward';
import { RewardRedemption } from '../entities/RewardRedemption';
import { RefreshToken } from '../entities/RefreshToken';

export const dataSource = new DataSource({
  type: 'postgres',
  host: config.db.host,
  port: config.db.port,
  username: config.db.username,
  password: config.db.password,
  database: config.db.database,
  entities: [
    User,
    Challenge,
    ChallengeCompletion,
    Reward,
    RewardRedemption,
    RefreshToken,
  ],
  migrations: ['src/migrations/*.ts'],
  synchronize: false, // Use migrations instead.
  logging: false,
});

/**
 * Fastify plugin that owns the TypeORM DataSource lifecycle: it initializes the
 * connection on boot, decorates the instance so handlers can reach it, and
 * tears it down on shutdown. Wrapped with fastify-plugin so the decoration
 * escapes the plugin's encapsulation context and is visible app-wide.
 */
async function dbPlugin(fastify: FastifyInstance) {
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  fastify.log.info('Database connection established');

  fastify.decorate('dataSource', dataSource);

  fastify.addHook('onClose', async () => {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  });
}

declare module 'fastify' {
  interface FastifyInstance {
    dataSource: DataSource;
  }
}

export default fp(dbPlugin, { name: 'db' });
