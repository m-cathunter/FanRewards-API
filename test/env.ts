// Runs before any module (and before config's dotenv) so tests target the
// dedicated test database and never touch dev data. dotenv does not override
// already-set vars, so these win.
import 'reflect-metadata';

process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '5433';
process.env.DB_DATABASE = 'fan_rewards_test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
// Fixed allowlist so the CORS behavior is deterministic in tests.
process.env.CORS_ORIGINS = 'https://allowed.example.com';
