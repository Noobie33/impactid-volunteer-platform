# ImpactID Team Development Workflow

## Branches and merge permissions

- `main`: stable final demo/release branch. Do not work or push directly here.
- `dev`: shared integration branch. Feature Pull Requests target `dev`.
- Each member creates a feature branch **from the latest `origin/dev`**. Branches are independent; Git has no literal parent/child hierarchy.

| Member                  | Branch                        | Owned modules                                                      |
| ----------------------- | ----------------------------- | ------------------------------------------------------------------ |
| Umme Fahmida Sultana    | `feature/umme-auth-org`       | `auth`, `user`, `organization`                                     |
| Emran Ahmed Tanzim      | `feature/emran-participation` | `opportunity`, `community-request`, `application`, `participation` |
| Shazzad Hossain Setu    | `feature/setu-verification`   | `verification`, `fraud-flag`, `audit-log`, `admin`                 |
| Intisar Jaman Chowdhury | `feature/intisar-passport`    | `impact-passport`, `skill`, `cause`, `public-sharing`              |

The leader has pre-registered all feature modules in `src/app.module.ts`. Folder names are singular (e.g. `user`), but the routes (`/users`) and database tables (`users`) remain plural; see `src/modules/README.md`. Setu coordinates shared `src/main.ts`, `src/app.module.ts`, `src/common`, `src/config`, `package.json`, `.env.example`, and schema migrations. **Ask in the group before modifying these shared files.** Feature owners can import other modules' entity types but should not edit another member's module without agreement.

## Before development

1. Accept GitHub collaborator invitation.
2. Install the versions in the root README (Node 22 and pnpm 11.25.0), PostgreSQL and VS Code.
3. Clone the repository afresh; do **not** create a separate repository, run `git init`, or copy the original ZIP over the clone.
4. Check out and pull `dev`, install dependencies, create local `.env` from `.env.example`, and run the reviewed migrations against your **own local database**.
5. Confirm `pnpm build` and `/health` work. Only then create your personal feature branch.

```powershell
git clone https://github.com/Noobie33/impactid-volunteer-platform.git
cd impactid-volunteer-platform
git switch --track origin/dev
pnpm install --frozen-lockfile
Copy-Item .env.example .env
# Edit your private .env and create your own PostgreSQL database first.
pnpm run migration:run
pnpm build
pnpm start:dev
```

After baseline setup succeeds, for example Umme runs:

```powershell
git switch -c feature/umme-auth-org
git push -u origin feature/umme-auth-org
```

## Daily integration rules

1. Keep commits small and descriptive. Push only to your own feature branch.
2. Before a Pull Request, fetch and merge the latest `origin/dev` into your feature branch, resolve conflicts, and run `pnpm build` and relevant tests.
3. Open a Pull Request targeting `dev`; include changed modules, working API endpoints, Postman/Swagger evidence, migrations (if any), and tests.
4. Setu reviews other members' Pull Requests. Another team member reviews Setu's own Pull Request when GitHub requires independent approval.
5. Do not force-push shared branches, commit `.env` or credentials, or edit already-merged migrations. Merge `dev` into `main` only after final end-to-end tests.
6. New requirements or entity changes must be communicated immediately; update the shared contracts and add a new migration before dependent code merges.

## Five-day priority

| Day | Deliverable                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------ |
| 1   | Shared foundation, migrations, account/auth groundwork, entity and route contracts                     |
| 2   | Auth, organization approval, opportunity/request CRUD, application flow                                |
| 3   | Participation completion, verification transaction, passport generation                                |
| 4   | Public privacy filtering, fraud/admin/audit, error scenarios and integration tests                     |
| 5   | Clean build, fresh-database migration, rollback demonstration, report screenshots, live demo rehearsal |

Backend, correctness and faculty minimum requirements come before optional Next.js UI, Redis, email, badges or rewards. Each member must understand their submitted code and truthfully report AI usage in the final course report.
