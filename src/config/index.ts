import dotenv from 'dotenv';

dotenv.config();

const isTest = process.env.NODE_ENV === 'test';

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  logLevel: process.env.LOG_LEVEL || 'info',

  // Generous default; effectively disabled under test so it never flakes.
  rateLimit: {
    max: isTest ? 1_000_000 : parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
    timeWindow: process.env.RATE_LIMIT_WINDOW || '1 minute',
  },

  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'belong',
    password: process.env.DB_PASSWORD || 'belong_dev',
    database: process.env.DB_DATABASE || 'fan_rewards',
  },

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET || 'your-access-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-me',
    accessExpiresIn: '15m',
    refreshExpiresIn: '7d',
  },
};
