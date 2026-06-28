# FanRewards API

A fan rewards REST API built for the Belong backend assessment. Fans complete
listen-to-earn music challenges, earn points, redeem rewards, and climb a
leaderboard.

## Tech stack

- **Node.js + TypeScript** (strict mode)
- **Fastify** — plugin-based routing with JSON-schema (TypeBox) validation
- **TypeORM + PostgreSQL** — entities, relations, and migrations
- **JWT** auth — short-lived access tokens + rotating, DB-backed refresh tokens
- **Jest + Supertest** — integration tests
- **Docker Compose** — local Postgres (dev + test)

## Prerequisites

- Docker (for PostgreSQL)
- Node.js 20+

## Setup (from a clean clone)

```bash
# 1. Create your env file (defaults match docker-compose)
cp .env.example .env

# 2. Start PostgreSQL (dev on :5432, test on :5433)
docker compose up -d

# 3. Install dependencies
npm install

# 4. Run migrations
npm run migration:run

# 5. Seed sample challenges and rewards (idempotent)
npm run seed

# 6. Start the dev server
npm run dev
```

The server runs on http://localhost:3000. Interactive API docs (Swagger UI) are
at http://localhost:3000/docs, and a health check with DB status is at
http://localhost:3000/health.

## Testing

Tests run against the separate test database (`fan_rewards_test` on port 5433),
which is started by `docker compose up -d`. The schema is migrated automatically
and tables are truncated between tests.

```bash
npm test            # run all tests
npm run test:coverage
```

## API overview

All responses use a consistent envelope: `{ "data": ... }` on success (with a
`meta` block for paginated endpoints) and `{ "error": { "code", "message" } }`
on failure. All routes except `/api/auth/*` require an
`Authorization: Bearer <accessToken>` header.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create an account, returns tokens |
| POST | `/api/auth/login` | Log in, returns tokens |
| POST | `/api/auth/refresh` | Rotate the refresh token |
| POST | `/api/auth/logout` | Revoke a refresh token |
| GET | `/api/users/me` | Current user profile |
| PATCH | `/api/users/me` | Update profile |
| GET | `/api/users/me/stats` | Points, completions, redemptions summary |
| GET | `/api/challenges` | List challenges (paginated, filterable) |
| GET | `/api/challenges/:id` | Challenge detail |
| POST | `/api/challenges/:id/complete` | Complete a challenge, earn points |
| GET | `/api/rewards` | List available rewards |
| POST | `/api/rewards/:id/redeem` | Redeem a reward |
| GET | `/api/rewards/history` | Redemption history (paginated) |
| GET | `/api/leaderboard` | Top fans by points (paginated) |
| GET | `/api/leaderboard/me` | Current user's rank |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm run migration:generate <path>` | Generate a migration from entity changes |
| `npm run migration:run` | Run pending migrations |
| `npm run migration:revert` | Revert the last migration |
| `npm run seed` | Seed sample data (idempotent) |
| `npm test` | Run tests |
| `npm run test:coverage` | Run tests with coverage |

## Project structure

```
src/
├── config/        # Environment config
├── entities/      # TypeORM entities (User, Challenge, Reward, ...)
├── migrations/    # Generated SQL migrations
├── middleware/    # JWT auth guard
├── plugins/       # DB, error handler, Swagger (Fastify plugins)
├── routes/        # Route plugins with schema validation
├── services/      # Business logic (Auth, Challenge, Reward, Leaderboard, User)
├── utils/         # Response envelope + user serialization helpers
├── errors.ts      # Typed AppError + error codes
├── seed.ts        # Idempotent data seeding
└── app.ts         # Fastify app assembly
test/              # Jest + Supertest integration tests
```

## Further reading

- [ARCHITECTURE.md](./ARCHITECTURE.md) — design decisions and trade-offs
- [ai_use_description.md](./ai_use_description.md) — how AI tools were used
