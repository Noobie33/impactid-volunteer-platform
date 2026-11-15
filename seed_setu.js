const { Client } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const adminId = 'a0000000-0000-4000-8000-000000000001';
const ownerId = 'c0000000-0000-4000-8000-000000000001';
const volunteerId = 'b0000000-0000-4000-8000-000000000001';
const volunteer2Id = 'b0000000-0000-4000-8000-000000000002';

const causeId = 'd0000000-0000-4000-8000-000000000001';

const approvedOrgId = 'e0000000-0000-4000-8000-000000000001';
const pendingOrg1Id = 'e0000000-0000-4000-8000-000000000002'; // approveOrganizationId
const pendingOrg2Id = 'e0000000-0000-4000-8000-000000000003'; // rejectOrganizationId

const opp1Id = 'f0000000-0000-4000-8000-000000000001';
const opp2Id = 'f0000000-0000-4000-8000-000000000002';

const app1Id = '10000000-0000-4000-8000-000000000001';
const app2Id = '10000000-0000-4000-8000-000000000002';
const app3Id = '10000000-0000-4000-8000-000000000003';

const part1Id = '20000000-0000-4000-8000-000000000001'; // approveParticipationId
const part2Id = '20000000-0000-4000-8000-000000000002'; // rejectParticipationId
const part3Id = '20000000-0000-4000-8000-000000000003'; // validationParticipationId

const fraud1Id = '30000000-0000-4000-8000-000000000001'; // fraudFlagId
const fraud2Id = '30000000-0000-4000-8000-000000000002';

async function seed() {
  const client = new Client({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '12345',
    database: process.env.DB_DATABASE || 'impactid_dev',
  });

  await client.connect();

  console.log('Truncating tables...');
  await client.query(`
    TRUNCATE audit_logs, fraud_flags, impact_records, verifications, 
             participations, applications, community_requests, 
             opportunity_skills, opportunities, skills, causes, 
             organizations, profiles, users CASCADE;
  `);

  console.log('Inserting seed records with deterministic UUID v4s...');
  const adminHash = await bcrypt.hash('Admin@123', 10);
  const ownerHash = await bcrypt.hash('OrgOwner@123', 10);
  const volunteerHash = await bcrypt.hash('Volunteer@123', 10);
  const volunteer2Hash = await bcrypt.hash('Volunteer2@123', 10);

  // Users
  await client.query(`
    INSERT INTO users (id, email, password_hash, role, status) VALUES
      ($1, 'admin@impactid.test', $2, 'ADMINISTRATOR', 'ACTIVE'),
      ($3, 'orgowner@impactid.test', $4, 'ORGANIZATION', 'ACTIVE'),
      ($5, 'volunteer@impactid.test', $6, 'VOLUNTEER', 'ACTIVE'),
      ($7, 'volunteer2@impactid.test', $8, 'VOLUNTEER', 'ACTIVE');
  `, [adminId, adminHash, ownerId, ownerHash, volunteerId, volunteerHash, volunteer2Id, volunteer2Hash]);

  // Profiles
  await client.query(`
    INSERT INTO profiles (user_id, display_name) VALUES
      ($1, 'System Admin'),
      ($2, 'Org Owner'),
      ($3, 'Test Volunteer'),
      ($4, 'Test Volunteer 2');
  `, [adminId, ownerId, volunteerId, volunteer2Id]);

  // Cause
  await client.query(`
    INSERT INTO causes (id, name) VALUES ($1, 'Education');
  `, [causeId]);

  // Organizations
  await client.query(`
    INSERT INTO organizations (id, owner_user_id, name, description, approval_status, approved_by, approved_at) VALUES
      ($1, $2, 'Approved NGO', 'Already approved org', 'APPROVED', $3, NOW()),
      ($4, $2, 'Pending Org Alpha', 'Waiting for admin approval', 'PENDING', NULL, NULL),
      ($5, $2, 'Pending Org Beta', 'Also waiting for approval', 'PENDING', NULL, NULL);
  `, [approvedOrgId, ownerId, adminId, pendingOrg1Id, pendingOrg2Id]);

  // Opportunities
  await client.query(`
    INSERT INTO opportunities (id, organization_id, cause_id, title, description, location, starts_at, ends_at, capacity, is_time_based, status) VALUES
      ($1, $2, $3, 'Weekend Teaching Program', 'Teach underprivileged children', 'Dhaka', '2026-10-01T08:00:00Z', '2026-12-31T18:00:00Z', 20, true, 'OPEN'),
      ($4, $2, $3, 'Code Mentorship', 'Mentor CS students', 'Online', '2026-10-01T08:00:00Z', '2026-12-31T18:00:00Z', 10, true, 'OPEN');
  `, [opp1Id, approvedOrgId, causeId, opp2Id]);

  // Applications
  await client.query(`
    INSERT INTO applications (id, volunteer_id, opportunity_id, request_id, status) VALUES
      ($1, $2, $3, NULL, 'ACCEPTED'),
      ($4, $2, $5, NULL, 'ACCEPTED'),
      ($6, $7, $3, NULL, 'ACCEPTED');
  `, [app1Id, volunteerId, opp1Id, app2Id, opp2Id, app3Id, volunteer2Id]);

  // Participations
  await client.query(`
    INSERT INTO participations (id, application_id, volunteer_id, status, accepted_at, completion_note, proposed_hours, completed_at) VALUES
      ($1, $2, $3, 'PENDING_VERIFICATION', '2026-10-05T10:00:00Z', 'Taught math and science', 2.50, '2026-10-12T12:30:00Z'),
      ($4, $5, $3, 'PENDING_VERIFICATION', '2026-10-05T10:00:00Z', 'Mentored two students', 1.50, '2026-10-12T11:30:00Z'),
      ($6, $7, $8, 'PENDING_VERIFICATION', '2026-10-06T10:00:00Z', 'Assisted with teaching', 1.25, '2026-10-13T11:15:00Z');
  `, [part1Id, app1Id, volunteerId, part2Id, app2Id, part3Id, app3Id, volunteer2Id]);

  // Fraud Flags
  await client.query(`
    INSERT INTO fraud_flags (id, participation_id, rule_code, details, status) VALUES
      ($1, $2, 'OVERLAPPING_TIME', '{"note":"concurrent activities detected"}', 'OPEN'),
      ($3, $4, 'RAPID_COMPLETION', '{"note":"completed unusually fast"}', 'OPEN');
  `, [fraud1Id, part1Id, fraud2Id, part2Id]);

  await client.end();

  const bearerSecret = process.env.JWT_BEARER_SECRET || process.env.JWT_SECRET || 'mySecretKey';

  const adminToken = jwt.sign(
    { user_id: adminId, name: 'System Admin', email: 'admin@impactid.test', role: 'ADMINISTRATOR' },
    bearerSecret,
    { expiresIn: '30d' }
  );

  const ownerToken = jwt.sign(
    { user_id: ownerId, name: 'Org Owner', email: 'orgowner@impactid.test', role: 'ORGANIZATION' },
    bearerSecret,
    { expiresIn: '30d' }
  );

  const nonAdminToken = jwt.sign(
    { user_id: volunteerId, name: 'Test Volunteer', email: 'volunteer@impactid.test', role: 'VOLUNTEER' },
    bearerSecret,
    { expiresIn: '30d' }
  );

  const vars = {
    baseUrl: 'http://localhost:5000',
    ownerToken,
    adminToken,
    nonAdminToken,
    approveParticipationId: part1Id,
    rejectParticipationId: part2Id,
    validationParticipationId: part3Id,
    approveOrganizationId: pendingOrg1Id,
    rejectOrganizationId: pendingOrg2Id,
    fraudFlagId: fraud1Id,
    userId: volunteer2Id,
    verificationId: '' // populated after first approval request
  };

  fs.writeFileSync(path.join(__dirname, 'setu_postman_vars.json'), JSON.stringify(vars, null, 2));

  // Update variables in existing collection if present
  const outCollectionPath = path.join(__dirname, 'docs', 'ImpactID-Setu-Ready.postman_collection.json');
  let collectionTemplate;
  if (fs.existsSync(outCollectionPath)) {
    collectionTemplate = JSON.parse(fs.readFileSync(outCollectionPath, 'utf8'));
  } else {
    const templatePath = path.join('C:\\Users\\User\\.gemini\\antigravity\\brain\\ee7c67f8-9e24-4a96-a210-6c3efa815c69\\.user_uploaded\\media_1794692296238_c9cd728c.json');
    collectionTemplate = JSON.parse(fs.readFileSync(templatePath, 'utf8'));
  }

  collectionTemplate.variable = Object.entries(vars).map(([key, value]) => ({
    key,
    value: String(value),
    type: 'string'
  }));

  fs.writeFileSync(outCollectionPath, JSON.stringify(collectionTemplate, null, 2));

  // Also create a standalone Postman Environment file!
  const envFile = {
    id: "impactid-setu-environment",
    name: "ImpactID — Setu Environment",
    values: Object.entries(vars).map(([key, value]) => ({
      key,
      value: String(value),
      enabled: true
    }))
  };
  fs.writeFileSync(path.join(__dirname, 'docs', 'ImpactID-Setu.postman_environment.json'), JSON.stringify(envFile, null, 2));

  console.log('Seeding finished successfully with deterministic UUIDs!');
  console.log('Created docs/ImpactID-Setu-Ready.postman_collection.json');
  console.log('Created docs/ImpactID-Setu.postman_environment.json');
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
