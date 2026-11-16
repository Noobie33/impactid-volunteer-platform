# Module scaffolding — read before implementing

The directories follow the faculty's `src/modules/<name>/dto`, `entities`, `<name>.controller.ts`, `<name>.service.ts` and `<name>.module.ts` layout. Folder names are **singular**, while HTTP routes and database tables use the plural names in the contracts. These are not finished endpoints: controllers have no handlers and the DTO files are intentionally placeholders.

| Owner   | Folders                                                            |
| ------- | ------------------------------------------------------------------ |
| Umme    | `auth`, `user`, `organization`                                     |
| Emran   | `opportunity`, `community-request`, `application`, `participation` |
| Setu    | `verification`, `fraud-flag`, `audit-log`, `admin`                 |
| Intisar | `impact-passport`, `skill`, `cause`, `public-sharing`              |

## What's already provided

- All 15 module classes, controllers and services are registered once by the leader in `src/app.module.ts`.
- Entity classes map the 14 existing migration tables, including `opportunity_skills` through the `OpportunityEntity.skills` many-to-many relationship. **Do not change the committed initial migration.**
- `auth`, `admin`, and `public-sharing` have no new database tables and therefore do not need fake entity classes.
- A module service is exported by its module, but it is **not** globally available. To inject another member's service, import that member's module (coordinate cross-module changes).

## Before claiming an endpoint is done

1. Fill in concrete create/update or action DTOs with `class-validator`, and use the global ValidationPipe. Do not pass unvalidated request bodies straight into repositories.
2. Write the controller route with Swagger annotations, JWT/roles/ownership guards as required by `docs/API_CONTRACT.md`, and write its service logic.
3. For database access, import `TypeOrmModule.forFeature([YourEntity])` into your module, then inject repositories. Keep `synchronize: false`.
4. Follow `docs/DATABASE_CONTRACT.md` and never expose `passwordHash` or private passport information. `UserEntity.passwordHash` uses `select: false`: the login query must explicitly select it.
5. Treat PostgreSQL `numeric` values as **strings** from the driver, and only convert after validation. `activityDate` is an ISO calendar date (`YYYY-MM-DD`), not a timestamp.
6. All cross-table state changes (acceptance, approval, revocation) must use transactions. **Setu coordinates the verification + impact record + audit transaction.** Intisar owns the impact record mapping and passport read APIs.
7. Add tests for every completed flow. The current scaffold tests only validate wiring and entity metadata, not business behavior.

The owners edit their own module folders, not shared `app.module.ts`, `src/common`, `src/config`, or another owner's entity without coordination. API paths remain those in `docs/API_CONTRACT.md`; singular folder names do **not** change public routes.
