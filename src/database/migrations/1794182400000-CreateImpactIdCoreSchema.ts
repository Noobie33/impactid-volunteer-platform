import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Shared starting schema. Feature owners must update entity mappings to match
 * this migration and propose any schema changes as separate reviewed migrations.
 */
export class CreateImpactIdCoreSchema1794182400000 implements MigrationInterface {
  name = "CreateImpactIdCoreSchema1794182400000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(255) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        role varchar(32) NOT NULL CHECK (role IN ('VOLUNTEER', 'ORGANIZATION', 'ADMINISTRATOR')),
        status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE profiles (
        user_id uuid PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        display_name varchar(150) NOT NULL,
        bio text,
        sharing_enabled boolean NOT NULL DEFAULT false,
        share_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE organizations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        owner_user_id uuid NOT NULL REFERENCES users(id),
        name varchar(200) NOT NULL,
        description text,
        approval_status varchar(20) NOT NULL DEFAULT 'PENDING'
          CHECK (approval_status IN ('PENDING', 'APPROVED', 'REJECTED')),
        approved_by uuid REFERENCES users(id),
        approved_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE causes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE skills (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL UNIQUE,
        is_active boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE opportunities (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id uuid NOT NULL REFERENCES organizations(id),
        cause_id uuid NOT NULL REFERENCES causes(id),
        title varchar(200) NOT NULL,
        description text NOT NULL,
        location varchar(200),
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        capacity integer NOT NULL CHECK (capacity > 0),
        is_time_based boolean NOT NULL DEFAULT true,
        status varchar(20) NOT NULL DEFAULT 'OPEN'
          CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT chk_opportunity_dates CHECK (ends_at > starts_at)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE opportunity_skills (
        opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
        skill_id uuid NOT NULL REFERENCES skills(id),
        PRIMARY KEY (opportunity_id, skill_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE community_requests (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        requester_id uuid NOT NULL REFERENCES users(id),
        cause_id uuid NOT NULL REFERENCES causes(id),
        title varchar(200) NOT NULL,
        description text NOT NULL,
        approximate_area varchar(200) NOT NULL,
        starts_at timestamptz NOT NULL,
        ends_at timestamptz NOT NULL,
        is_time_based boolean NOT NULL DEFAULT true,
        status varchar(20) NOT NULL DEFAULT 'OPEN'
          CHECK (status IN ('OPEN', 'CLOSED', 'CANCELLED')),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz,
        CONSTRAINT chk_request_dates CHECK (ends_at > starts_at)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE applications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        volunteer_id uuid NOT NULL REFERENCES users(id),
        opportunity_id uuid REFERENCES opportunities(id),
        request_id uuid REFERENCES community_requests(id),
        status varchar(20) NOT NULL DEFAULT 'PENDING'
          CHECK (status IN ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN')),
        applied_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_application_one_target CHECK (
          (opportunity_id IS NOT NULL AND request_id IS NULL)
          OR (opportunity_id IS NULL AND request_id IS NOT NULL)
        ),
        CONSTRAINT uq_volunteer_opportunity UNIQUE (volunteer_id, opportunity_id),
        CONSTRAINT uq_volunteer_request UNIQUE (volunteer_id, request_id)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE participations (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        application_id uuid NOT NULL UNIQUE REFERENCES applications(id),
        volunteer_id uuid NOT NULL REFERENCES users(id),
        status varchar(30) NOT NULL DEFAULT 'ACCEPTED'
          CHECK (status IN ('ACCEPTED', 'PENDING_VERIFICATION', 'VERIFIED', 'REJECTED', 'REVOKED')),
        accepted_at timestamptz NOT NULL DEFAULT now(),
        completion_note text,
        proposed_hours numeric(8,2) CHECK (proposed_hours >= 0),
        completed_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE verifications (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        participation_id uuid NOT NULL UNIQUE REFERENCES participations(id),
        verifier_id uuid NOT NULL REFERENCES users(id),
        type varchar(20) NOT NULL CHECK (type IN ('ORGANIZATION', 'COMMUNITY')),
        status varchar(20) NOT NULL CHECK (status IN ('APPROVED', 'REJECTED', 'REVOKED')),
        confirmed_hours numeric(8,2) CHECK (confirmed_hours >= 0),
        reason text,
        decided_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      CREATE TABLE impact_records (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        volunteer_id uuid NOT NULL REFERENCES users(id),
        verification_id uuid UNIQUE REFERENCES verifications(id),
        cause_id uuid REFERENCES causes(id),
        source_type varchar(32) NOT NULL
          CHECK (source_type IN ('ORGANIZATION_VERIFIED', 'COMMUNITY_VERIFIED', 'SELF_REPORTED')),
        title varchar(200) NOT NULL,
        activity_date date NOT NULL,
        status varchar(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REVOKED')),
        visibility varchar(20) NOT NULL DEFAULT 'PRIVATE' CHECK (visibility IN ('PUBLIC', 'PRIVATE')),
        self_reported_hours numeric(8,2) CHECK (self_reported_hours >= 0),
        created_at timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT chk_impact_record_source CHECK (
          (source_type = 'SELF_REPORTED' AND verification_id IS NULL)
          OR (source_type <> 'SELF_REPORTED' AND verification_id IS NOT NULL AND self_reported_hours IS NULL)
        )
      )
    `);

    await queryRunner.query(`
      CREATE TABLE fraud_flags (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        participation_id uuid NOT NULL REFERENCES participations(id),
        rule_code varchar(80) NOT NULL,
        details jsonb NOT NULL DEFAULT '{}'::jsonb,
        status varchar(20) NOT NULL DEFAULT 'OPEN'
          CHECK (status IN ('OPEN', 'DISMISSED', 'CONFIRMED')),
        reviewed_by uuid REFERENCES users(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        reviewed_at timestamptz
      )
    `);

    await queryRunner.query(`
      CREATE TABLE audit_logs (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        actor_id uuid REFERENCES users(id),
        action varchar(120) NOT NULL,
        target_type varchar(100) NOT NULL,
        target_id uuid NOT NULL,
        reason text,
        details jsonb NOT NULL DEFAULT '{}'::jsonb,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_opportunities_status_start ON opportunities(status, starts_at)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_applications_opportunity ON applications(opportunity_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_applications_request ON applications(request_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_participations_volunteer_status ON participations(volunteer_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_impact_records_volunteer_status ON impact_records(volunteer_id, status)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_audit_logs_created ON audit_logs(created_at)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tables = [
      "audit_logs",
      "fraud_flags",
      "impact_records",
      "verifications",
      "participations",
      "applications",
      "community_requests",
      "opportunity_skills",
      "opportunities",
      "skills",
      "causes",
      "organizations",
      "profiles",
      "users",
    ];

    for (const table of tables) {
      await queryRunner.query(`DROP TABLE IF EXISTS "${table}"`);
    }
  }
}
