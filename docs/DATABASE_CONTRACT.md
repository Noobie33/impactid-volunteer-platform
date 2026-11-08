# ImpactID Database Contract

This contract is the single starting point for entity definitions. The executable schema is `src/database/migrations/1794182400000-CreateImpactIdCoreSchema.ts`. Feature branches must map their TypeORM entities to these exact table and column names. Propose changes through new migrations; do not edit a migration that other members have already applied.

## Account roles

Each user has exactly one role: `VOLUNTEER`, `ORGANIZATION`, or `ADMINISTRATOR`. A Volunteer can also create a community request; **community requester is not a fourth role**. Public passport viewers do not need an account. Public registration must never allow an administrator role.

## Core tables and ownership

| Table                | Responsible member | Key references                                                                |
| -------------------- | ------------------ | ----------------------------------------------------------------------------- |
| `users`              | Umme               | `id`, unique `email`, `role`, `status`, bcrypt `password_hash`                |
| `profiles`           | Umme               | `user_id` 1:1 `users`, unique `share_token`, private by default               |
| `organizations`      | Umme               | `owner_user_id` → `users`, `approved_by` → `users`                            |
| `causes`             | Intisar            | unique `name`, `is_active`                                                    |
| `skills`             | Intisar            | unique `name`, `is_active`                                                    |
| `opportunities`      | Emran              | `organization_id` → `organizations`, `cause_id` → `causes`                    |
| `opportunity_skills` | Emran              | many-to-many `opportunities` ↔ `skills`                                       |
| `community_requests` | Emran              | `requester_id` → `users`, `cause_id` → `causes`                               |
| `applications`       | Emran              | `volunteer_id` → `users`; exactly one of `opportunity_id`/`request_id`        |
| `participations`     | Emran              | unique `application_id` → `applications`, `volunteer_id` → `users`            |
| `verifications`      | Setu               | unique `participation_id` → `participations`, `verifier_id` → `users`         |
| `impact_records`     | Intisar            | `volunteer_id` → `users`, unique nullable `verification_id` → `verifications` |
| `fraud_flags`        | Setu               | `participation_id` → `participations`, nullable `reviewed_by` → `users`       |
| `audit_logs`         | Setu               | nullable `actor_id` → `users`; append-only; no passwords/tokens               |

IDs are UUIDs. Dates are timezone-aware `timestamptz` except `impact_records.activity_date` (calendar date). SQL uses snake_case; TypeScript uses camelCase with explicit TypeORM mappings. Do not use `synchronize: true`.

## Enumerated values

- User status: `ACTIVE`, `SUSPENDED`
- Organization approval: `PENDING`, `APPROVED`, `REJECTED`
- Opportunity/request status: `OPEN`, `CLOSED`, `CANCELLED`
- Application: `PENDING`, `ACCEPTED`, `REJECTED`, `WITHDRAWN`
- Participation: `ACCEPTED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`, `REVOKED`
- Verification type: `ORGANIZATION`, `COMMUNITY`
- Verification status: `APPROVED`, `REJECTED`, `REVOKED`
- Impact source: `ORGANIZATION_VERIFIED`, `COMMUNITY_VERIFIED`, `SELF_REPORTED`
- Impact status: `ACTIVE`, `REVOKED`; visibility: `PUBLIC`, `PRIVATE`
- Fraud flag: `OPEN`, `DISMISSED`, `CONFIRMED`

## Cross-module rules

1. A volunteer cannot apply twice to the same opportunity or request. An application targets **exactly one** of those two tables; the database enforces both rules.
2. A volunteer cannot apply to their own community request. Accepting an application creates one Participation, checks capacity, and must be transactional. The participation's volunteer must match the application.
3. A volunteer submits completion details. Only the owning, authorized organizer/requester may approve; no one can self-verify. An organization must be approved. Hours are non-negative and valid only for time-based activities. Hours must also fit the actual allowable duration.
4. **Setu owns the approval transaction:** `Verification` + `ImpactRecord` + `AuditLog` must commit or roll back together, using one transactional TypeORM EntityManager. Intisar owns the ImpactRecord entity and read APIs, not this transaction coordinator.
5. One participation may have only one Verification; one Verification may generate only one ImpactRecord. Duplicate or simultaneous approvals must never create an extra record.
6. Revocation updates verification, participation and impact record state in one transaction and adds an audit entry. Public and private verified totals must be calculated from currently `ACTIVE` verified records, never stored as a cached truth.
7. Self-reported records have no Verification, do not count toward verified totals, and never earn verified credit. Non-time-based contributions are verified activities but contribute zero verified hours.
8. `visibility=PRIVATE` and `sharing_enabled=false` are defaults. Public passport endpoints reveal only public records and safe fields. A disabled share link reveals nothing.
9. Fraud flags only request an admin review; they do not automatically accuse or revoke anyone. Audit logs are append-only.
10. DELETE endpoints for history-linked core data should archive/soft-delete where needed rather than destroy verification evidence. Verify the demonstrated CRUD semantics with faculty.

The proposal is the source of truth for overall scope. The initial migration establishes a starting schema, but ownership checks, timeline rules and transactional behavior still require service-level implementation and tests. Database CHECK constraints do not replace those service checks.
