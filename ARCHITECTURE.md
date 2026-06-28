# Architecture

This document explains the design decisions behind the FanRewards API and the
trade-offs made along the way.

## Layering

The codebase is organized into three layers with a clear dependency direction:

```
routes (HTTP) ──> services (business logic) ──> entities (persistence)
```

- **Routes** are thin Fastify plugins. They own HTTP concerns only: schema
  validation, reading the authenticated user, calling a service, and wrapping
  the result in the response envelope. They contain no business rules.
- **Services** own the business logic and all database access through TypeORM
  repositories. They are plain classes constructed with a `DataSource`, which
  makes them easy to reason about and to test in isolation from HTTP.
- **Entities** define the schema, relations, and constraints.

Keeping business logic out of route handlers means the rules (point math,
concurrency control, token rotation) live in one place, are reusable across
transports, and are unit-testable without spinning up HTTP. It also keeps the
HTTP layer declarative and easy to scan.

## Data model

Six entities (see `src/entities`):

- **User** — `email` (unique), `passwordHash` (`select: false` so it is never
  loaded by accident), `displayName`, `totalPoints`, timestamps.
- **Challenge** — title, artist, description, `points`, `durationSeconds`,
  `difficulty` (enum), `isActive`.
- **ChallengeCompletion** — links a user and a challenge, with `pointsEarned`
  and `listenPercentage`. A user can complete the same challenge many times, so
  this is an append-only log rather than a unique pairing.
- **Reward** — name, description, `pointsCost`, `isAvailable`.
- **RewardRedemption** — links a user and a reward, with `pointsSpent` and a
  `status` enum (pending/fulfilled/cancelled).
- **RefreshToken** — a SHA-256 hash of an issued refresh token, with `expiresAt`
  and `revokedAt`. Storing only the hash means a database leak cannot be replayed.

`totalPoints` on `User` is a denormalized running total. It could be derived from
completions minus redemptions, but storing it makes the leaderboard and balance
checks a single indexed read instead of an aggregation on every request. The
trade-off is that writes must keep it consistent, which is handled with
transactions and atomic updates (below).

### Indexes

Foreign keys (`userId`, `challengeId`) are indexed because completions and
redemptions are queried by user. `users.email` and `refresh_tokens.tokenHash`
are unique indexes (lookup paths for login and refresh). `challenges.isActive`
and `rewards.isAvailable` are indexed because listings filter on them. At scale
the leaderboard would benefit from an index on `users.totalPoints` (see Scaling).

## Authentication & token security

- Passwords are hashed with **bcrypt** before storage.
- Login issues a short-lived **access token** (15m) and a long-lived **refresh
  token** (7d). The access token authorizes API requests; the refresh token only
  mints new access tokens.
- Refresh tokens are **rotated**: every `/refresh` revokes the presented token
  and issues a new pair. Only the SHA-256 hash is persisted.
- **Theft detection**: if an already-rotated (revoked) refresh token is replayed,
  we treat it as compromise and revoke the user's entire active token family,
  forcing re-authentication. This bounds the damage from a stolen token.
- Login returns the same generic error for unknown email and wrong password to
  avoid user enumeration.

## Business rules

**Challenge completion** (`ChallengeService.complete`): listening to ≥ 80% earns
the full point value; below that, credit is proportional
(`round(points × percentage / 100)`). The completion insert and the user's
`totalPoints` increment run inside a single transaction, and the increment is an
atomic SQL `UPDATE ... SET totalPoints = totalPoints + n`, so concurrent
completions cannot lose updates.

**Reward redemption** (`RewardService.redeem`): points are deducted with a single
conditional statement —
`UPDATE users SET totalPoints = totalPoints - cost WHERE id = :id AND totalPoints >= cost`.
Because PostgreSQL serializes writes to the same row, two concurrent redemptions
for the same user can never both pass the balance check: exactly one updates a
row, the other affects zero rows and receives `INSUFFICIENT_POINTS`. The
deduction and the redemption record share a transaction so they commit or roll
back together. This is verified by a concurrency test.

**Leaderboard** (`LeaderboardService`): fans are ranked with SQL
`RANK() OVER (ORDER BY totalPoints DESC)`, so tied users share a rank (1, 1, 3).
The outer query adds `id` as a tiebreaker so pagination is deterministic even
with many equal scores. A user's own rank is computed in a subquery so the
window function sees all users before filtering down to the requester.

## API conventions

- **Envelope**: `{ data }` on success, `{ data, meta }` for paginated lists,
  `{ error: { code, message } }` on failure. `code` is a stable machine-readable
  string; `message` is human-facing.
- **Validation**: every request body, query, and path param is validated with
  TypeBox JSON schemas. Unknown properties are rejected (`additionalProperties:
  false`). Invalid input never reaches a service.
- **Error handling**: a centralized handler maps typed `AppError`s to their
  status/code, schema failures to `400 VALIDATION_ERROR`, unique-constraint
  violations to `409 CONFLICT`, and anything unexpected to `500 INTERNAL_ERROR`
  (logged, not leaked).

## Cross-cutting concerns

- **Plugins** (`src/plugins`) encapsulate the DataSource lifecycle, the error
  handler, and Swagger. `fastify-plugin` is used so decorations escape plugin
  encapsulation.
- **Rate limiting** is applied globally (disabled under test).
- **OpenAPI** docs are generated from the route schemas and served at `/docs`.
- **Health check** at `/health` reports database connectivity and returns 503 if
  the DB is unreachable.
- **Graceful shutdown** closes the server and DB pool on SIGINT/SIGTERM.

## Testing strategy

Integration tests (Jest + Supertest) exercise the real HTTP stack against a
dedicated test database. Each test truncates tables for isolation. The suite
covers the end-to-end auth flow including rotation and theft detection, the
completion point math, concurrent redemption, and leaderboard ties — the parts
where bugs would be most costly.

## Leaderboard performance (EXPLAIN analysis)

The leaderboard is the hottest read and the most likely to degrade at scale, so
its plan is worth checking rather than guessing. Measured on a local Postgres 16
seeded with **500,000 users**, querying the first page (`LIMIT 20`).

**Before** — no index on `totalPoints`:

```
Limit  (actual time=39.341..41.363 rows=20)
  -> Incremental Sort (Sort Key: "totalPoints" DESC, id)
    -> WindowAgg
      -> Gather Merge
        -> Sort  (Sort Method: external merge  Disk: ~7000kB)   <- spills to disk
          -> Parallel Seq Scan on users                          <- reads all 500k rows
Execution Time: 41.686 ms
```

Every request scans the whole table and sorts it on disk.

**After** — `CREATE INDEX ON users (totalPoints)` (migration `LeaderboardIndex`):

```
Limit  (actual time=0.163..0.165 rows=20)
  -> Incremental Sort
    -> WindowAgg
      -> Index Scan Backward using IDX_..._totalPoints on users  <- reads ~26 rows
Execution Time: 0.200 ms
```

The index provides rows already ordered by `totalPoints`, so the planner does a
backward index scan, the `RANK()` window is computed incrementally, and the
`LIMIT` lets it stop after the first page instead of sorting all 500k rows. That
is **~41.7 ms → ~0.2 ms, roughly a 200× improvement**, and it scales with page
size rather than table size.

## Scaling notes

- **Leaderboard beyond this**: the index above handles the top pages cheaply.
  For very heavy read traffic, cache the top-N page (it changes slowly) and/or
  maintain a materialized ranking refreshed on a schedule, trading freshness for
  cheap reads. Cursor-based pagination would replace `OFFSET` for deep pages,
  which still pay for the rows they skip.
- **Refresh tokens**: a periodic job should prune expired/revoked rows.
- **Service extraction**: auth is the natural first microservice to split out —
  it is cohesive, has a clear interface (token issuance/verification), and is a
  shared dependency of everything else.
- **Connection pooling**: TypeORM's pool size would be tuned to the deployment's
  concurrency and the database's connection limit.
