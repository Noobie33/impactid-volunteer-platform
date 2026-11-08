# ImpactID Volunteer Platform

NestJS 11, TypeScript, TypeORM and PostgreSQL backend for verified volunteering records and a shareable Impact Passport. The frontend is optional for the CSC4161 course demo; Swagger/Postman can demonstrate the REST API.

## Requirements

- Node.js 22 (see `.nvmrc`)
- pnpm 11.25.0
- PostgreSQL 13 or later (the schema uses `gen_random_uuid()`)
- VS Code, Git and Postman (recommended)

Redis is **not needed** to run the foundation. It can be enabled later by the member implementing optional caching/rate limiting.

## Setup (Windows PowerShell)

```powershell
git clone https://github.com/Noobie33/impactid-volunteer-platform.git
cd impactid-volunteer-platform
git switch --track origin/dev
pnpm install --frozen-lockfile
Copy-Item .env.example .env
```

Create a local PostgreSQL database named `impactid_dev`. Edit `.env` to supply your own `DB_USER`, `DB_PASSWORD` and random `JWT_BEARER_SECRET`. Every developer uses a separate local database; never commit `.env` or database credentials.

```powershell
pnpm run migration:run
pnpm build
pnpm start:dev
```

- Health: `http://localhost:5000/health`
- Swagger: `http://localhost:5000/api/docs`

The Swagger page will grow as feature controllers are added. The initial database migration creates core tables; it does not add demo users.

## Migration workflow

- `pnpm run migration:run` applies pending migrations.
- `pnpm run migration:rollback` reverts the most recent migration. **Do not run this on shared data.**
- `synchronize` is disabled. Change the database through reviewed, versioned migrations only.
- Entity classes under `src/modules/*/entities` must use the same table, column and status names as the initial migration and `docs/DATABASE_CONTRACT.md`.

## Team conventions

Read these files **before creating a feature branch**:

- `docs/DATABASE_CONTRACT.md` — tables, roles, relationships and invariants
- `docs/API_CONTRACT.md` — planned routes and response/error conventions
- `docs/TEAM_WORKFLOW.md` — ownership, branches and pull requests

The initial foundation contains infrastructure and the database schema, not finished feature endpoints. Member 1 must implement JWT registration/login and Passport strategy before protected routes are usable. The shared JWT guard intentionally rejects unverified tokens; no route may bypass authentication by trusting a token's mere presence.
