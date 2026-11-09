# ImpactID verification and administration implementation report

Branch `feature/setu-verification`. Scope covers Setu's four backend modules.

## Routes and decision rules

| Method and path | Input and behavior |
| --- | --- |
| POST /verifications/:participationId/approve | Accepts an optional numeric `confirmedHours` with up to two decimal places. Creates a verification and a private impact record. |
| POST /verifications/:participationId/reject | Requires a nonblank `reason`. Records a rejection and closes the participation without awarding credit. |
| GET /verifications/:id | Returns the decision to the participant, activity owner or administrator. |
| POST /admin/verifications/:id/revoke | Requires a nonblank `reason`. Revokes an approved verification and its linked participation and impact record. The audit entry retains the revocation reason. |
| PATCH /admin/organizations/:id/approve or /reject | Reviews a pending organization. Accepts an optional `reason`. |
| PATCH /admin/users/:id/status | Accepts `ACTIVE` or `SUSPENDED`. The four modules check the current account status on access. |
| GET /admin/fraud-flags and GET /admin/fraud-flags/:id | Lists flags or retrieves one for review. |
| PATCH /admin/fraud-flags/:id | Reviews an open flag once. Accepts `CONFIRMED` or `DISMISSED` and records the reviewer and review time. Verification state is independent of flag status. |
| GET /admin/audit-logs | Lists append-only action records. Both lists accept `page` and `limit` and return totals. |

Verification decisions require an accepted application and a completed participation awaiting verification. The service checks volunteer consistency, ownership, role and organization approval. The participant cannot verify their own work. For time-based activities the service uses the submitted hours when the reviewer omits an override. The maximum is the overlap between the scheduled activity and the accepted-to-completed interval. Non-time-based activities earn no hours. The impact record uses the activity's scheduled UTC start date as its calendar date.

Approval locks the participation before checking its status and existing verification. Verification, participation, impact and audit writes use the same transactional manager. Database uniqueness also constrains each participation to one decision and each decision to one impact record. Revocation locks the verification and requires exactly one verified participation and one active impact record before commit.

## Verification and reproduction

The local Nest build, TypeScript check, scoped lint and 26 Jest tests passed on Node 24.16.0. The project targets Node 22. The suite includes the six foundation tests, fourteen input-validation tests and six opt-in PostgreSQL integration tests. Each database run creates a uniquely named schema, applies the existing migration there and removes that schema afterward.

From the project directory in PowerShell, with dependencies installed and the local database connection configured:

```powershell
pnpm build
$env:SETU_POSTGRES_TESTS = '1'
pnpm test --runInBand
Remove-Item Env:SETU_POSTGRES_TESTS
```

The database tests race two approvals and assert one winner, inject a failing audit insert during approval and revocation, and check the persisted state after rollback. They exercise both verification sources, authorized readers, suspension, fraud review and pagination. The HTTP test registers the actual feature modules, generates their Swagger paths, and checks success responses and 400, 401, 403, 404 and 409 responses through Nest. Its signed tokens use a test-only Passport strategy and a per-run secret.

## Team integration

- Umme's production Passport JWT strategy must validate tokens and supply a user with `id` and singular `role` for the shared guards. Registration, bcrypt login and production-token access need a team integration test.
- Intisar's application and participation flow must supply a consistent accepted application, participant, acceptance time, completion time and proposed hours before verification.
- Emran's passport queries must read active verified impact records, respect visibility and exclude revoked credit. The tests verify stored records. The full private/public passport flow still needs an integrated demo.
- Audit entries are append-only through the application API. Database access privileges remain a deployment concern.

Implementation and tests were developed with Codex assistance for Setu's review.
