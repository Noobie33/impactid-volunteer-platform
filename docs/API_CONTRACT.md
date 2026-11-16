# ImpactID API Contract

All application routes are under the root path (e.g. `/auth/login`), while Swagger is at `/api/docs`. Use UUID path parameters. Group endpoint names and module ownership as follows; discuss additions before changing shared routes.

## Auth and identity — Umme

| Method | Route                | Access                                         |
| ------ | -------------------- | ---------------------------------------------- |
| POST   | `/auth/register`     | Public; only Volunteer or Organization account |
| POST   | `/auth/login`        | Public                                         |
| GET    | `/users/me`          | Authenticated                                  |
| PATCH  | `/users/me`          | Authenticated owner                            |
| GET    | `/organizations`     | Authenticated/paginated                        |
| POST   | `/organizations`     | Organization                                   |
| GET    | `/organizations/:id` | Authenticated                                  |
| PATCH  | `/organizations/:id` | Owner                                          |
| DELETE | `/organizations/:id` | Owner/Admin; safe archive rules                |

## Activities and participation — Emran

| Method           | Route                          | Access                                                    |
| ---------------- | ------------------------------ | --------------------------------------------------------- |
| GET/POST         | `/opportunities`               | Public list / approved Organization create                |
| GET/PATCH/DELETE | `/opportunities/:id`           | Public detail / owner modify or archive                   |
| GET/POST         | `/community-requests`          | Public list / Volunteer create                            |
| GET/PATCH/DELETE | `/community-requests/:id`      | Public detail / requester modify or archive               |
| POST             | `/applications`                | Volunteer applying to opportunity/request                 |
| GET              | `/applications`                | Volunteer own list or authorized organizer/requester list |
| GET              | `/applications/:id`            | Participant/authorized owner                              |
| PATCH            | `/applications/:id/withdraw`   | Applicant                                                 |
| PATCH            | `/applications/:id/accept`     | Authorized organizer/requester                            |
| PATCH            | `/applications/:id/reject`     | Authorized organizer/requester                            |
| GET              | `/participations`              | Volunteer/authorized organizer/requester                  |
| GET              | `/participations/:id`          | Participant/authorized owner                              |
| PATCH            | `/participations/:id/complete` | Volunteer participant                                     |

## Verification, trust and administration — Setu

| Method    | Route                                          | Access                             |
| --------- | ---------------------------------------------- | ---------------------------------- |
| POST      | `/verifications/:participationId/approve`      | Authorized organizer/requester     |
| POST      | `/verifications/:participationId/reject`       | Authorized organizer/requester     |
| GET       | `/verifications/:id`                           | Authorized participant/owner/admin |
| POST      | `/admin/verifications/:id/revoke`              | Administrator; reason required     |
| PATCH     | `/admin/organizations/:id/approve`             | Administrator                      |
| PATCH     | `/admin/organizations/:id/reject`              | Administrator                      |
| GET/PATCH | `/admin/fraud-flags`, `/admin/fraud-flags/:id` | Administrator                      |
| GET       | `/admin/audit-logs`                            | Administrator; read-only           |
| PATCH     | `/admin/users/:id/status`                      | Administrator                      |

## Passport, privacy and catalogs — Intisar

| Method           | Route                                     | Access                                       |
| ---------------- | ----------------------------------------- | -------------------------------------------- |
| GET              | `/impact-passport/me`                     | Authenticated Volunteer                      |
| POST             | `/impact-passport/self-reported`          | Volunteer; unverified only                   |
| PATCH            | `/impact-passport/records/:id/visibility` | Record owner                                 |
| PATCH            | `/impact-passport/sharing`                | Profile owner                                |
| POST             | `/impact-passport/sharing/rotate`         | Profile owner                                |
| GET              | `/public/passports/:shareToken`           | Public, privacy-filtered                     |
| GET/POST         | `/causes`                                 | Public list / Administrator create           |
| GET/PATCH/DELETE | `/causes/:id`                             | Public detail / Administrator edit or retire |
| GET/POST         | `/skills`                                 | Public list / Administrator create           |
| GET/PATCH/DELETE | `/skills/:id`                             | Public detail / Administrator edit or retire |

## Shared conventions

- At least four related core resources must demonstrate create, list, get-by-id, update and delete, with pagination. Candidate demo resources: `organizations`, `opportunities`, `community-requests`, `causes` and `skills`.
- Lists accept `page` (default 1) and `limit` (default 10; maximum 100), with a `meta` block `{ page, limit, total, totalPages }`.
- Create: 201, successful read/update: 200, delete: 200/204, bad DTO: 400, missing/invalid JWT: 401, insufficient role/ownership: 403, missing resource: 404, duplicate/conflicting state: 409.
- The shared exception filter returns `{ success: false, statusCode, message, path, timestamp }`. Validation messages may be an array. Never leak stack traces or passwords.
- For normal responses, prefer `{ success: true, data }` and add `meta` for lists; a global success response interceptor is **not yet implemented**.
- All write endpoints require separate Create/Update DTOs (where applicable) and class-validator decorators. The global ValidationPipe rejects unexpected fields.
- Use `@Roles` and a verified JWT user identity. A role guard alone is insufficient; services must also enforce ownership.
- Register/post/login and public passport are exceptions to authenticated-by-default routes. Member 1 must explicitly implement auth before other modules may claim protected endpoints work.
- `GET /health` is a framework check, not proof of database, migration or feature readiness.

## Required end-to-end scenarios

1. Organization owner is approved; creates an opportunity; volunteer applies; owner accepts; volunteer completes; owner approves; verified record appears on passport.
2. Volunteer opens a community request; a **different** volunteer offers help; requester accepts/completes verification; passport shows Community Verified separately.
3. Invalid DTO 400, no token 401, wrong role 403, missing ID 404, duplicate application 409, failed approval transaction rolls back, private or revoked record excluded from public totals.
