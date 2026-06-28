# AI Use Description

I used AI tooling throughout this assessment. This file describes what I used,
how, and why.

## Tool

- **Claude Code** (Anthropic's agentic CLI), running the Claude Opus model.

## How I used it

I treated the AI as a pair-programmer that I directed and reviewed, not as an
autopilot. The workflow was deliberately structured:

- **Planning first.** Before any code, I had it read the assignment and the
  starter project, then propose an ordered, one-task-per-commit plan. I made the
  key design calls myself — DB-backed refresh tokens with rotation over stateless
  JWTs, which bonus features were worth including, and the commit granularity —
  and it implemented against those decisions.

- **One task per commit, reviewed before committing.** Each unit of work
  (entities, migration, error handling, auth, each resource, seed, tests, docs)
  was implemented, type-checked, and smoke-tested, then I reviewed the diff and
  explicitly approved it before it was committed. Nothing was committed without
  my sign-off. This keeps the history clean and meant I understood every line
  that went in.

- **Verification, not just generation.** Every feature was exercised against the
  running app (and Postgres) before being committed — e.g. the refresh-token
  reuse path, the 80% completion threshold, and two concurrent redemptions
  racing for the last affordable reward. The behaviors I most cared about being
  correct are also covered by the integration tests.

## Why

The value of AI here was speed on the mechanical parts (boilerplate entities,
schema definitions, repetitive route wiring, test scaffolding) so I could spend
my attention on the decisions that actually matter: the data model, the token
security model, and getting the concurrency and ranking semantics right. Keeping
a tight review loop with one commit per task ensured the result is something I
can fully explain and defend, which is the point of the exercise.
