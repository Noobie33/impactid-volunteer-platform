import { Global, Module, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtService } from "@nestjs/jwt";
import request from "supertest";
import { AdminModule } from "@/modules/admin/admin.module";
import { AuditLogModule } from "@/modules/audit-log/audit-log.module";
import { FraudFlagModule } from "@/modules/fraud-flag/fraud-flag.module";
import { HttpExceptionFilter } from "@/common/filters/http-exception.filter";

import { randomUUID } from "crypto";
import { DataSource } from "typeorm";
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { dataSourceOptions } from "@/config/database.config";
import { CreateImpactIdCoreSchema1794182400000 } from "@/database/migrations/1794182400000-CreateImpactIdCoreSchema";
import { VerificationService } from "@/modules/verification/verification.service";
import { AuditLogService } from "@/modules/audit-log/audit-log.service";
import { FraudFlagService } from "@/modules/fraud-flag/fraud-flag.service";
import { AdminService } from "@/modules/admin/admin.service";
import { UserEntity } from "@/modules/user/entities/user.entity";
import { Role } from "@/common/enums/role.enum";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";
import { CommunityRequestEntity } from "@/modules/community-request/entities/community-request.entity";
import { OrganizationEntity } from "@/modules/organization/entities/organization.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { VerificationEntity } from "@/modules/verification/entities/verification.entity";
import { ImpactRecordEntity } from "@/modules/impact-passport/entities/impact-record.entity";
import { FraudFlagEntity } from "@/modules/fraud-flag/entities/fraud-flag.entity";
import { AuditLogEntity } from "@/modules/audit-log/entities/audit-log.entity";

const postgres =
  process.env.SETU_POSTGRES_TESTS === "1" ? describe : describe.skip;
postgres("Setu services against the PostgreSQL migration", () => {
  const schema = "setu_test_" + randomUUID().replace(/-/g, "");
  if (dataSourceOptions.type !== "postgres")
    throw new Error("PostgreSQL required");
  const db = new DataSource({
    ...dataSourceOptions,
    schema,
    installExtensions: false,
    synchronize: false,
    migrationsRun: false,
    dropSchema: false,
    extra: { options: "-c search_path=" + schema },
  });
  const manager = db.manager;
  const verification = new VerificationService(db);
  const admin = new AdminService(db);
  const flags = new FraudFlagService(db);
  const audit = new AuditLogService(db);
  let created = false;
  let administrator: string,
    owner: string,
    volunteer: string,
    organizer: string,
    causeId: string;
  const createUser = async (role: Role) =>
    (
      await manager.save(UserEntity, {
        email: randomUUID() + "@example.test",
        passwordHash: "unused-test-fixture",
        role,
      })
    ).id;
  beforeAll(async () => {
    await db.initialize();
    await db.query('CREATE SCHEMA "' + schema + '"');
    created = true;
    const runner = db.createQueryRunner();
    try {
      await runner.connect();
      const [current] = await runner.query("select current_schema() as name");
      if (current.name !== schema)
        throw new Error("Test schema isolation failed");
      await new CreateImpactIdCoreSchema1794182400000().up(runner);
    } finally {
      await runner.release();
    }
    [administrator, owner, volunteer, organizer] = await Promise.all(
      [
        Role.ADMINISTRATOR,
        Role.VOLUNTEER,
        Role.VOLUNTEER,
        Role.ORGANIZATION,
      ].map(createUser),
    );
    causeId = (await manager.save(CauseEntity, { name: "Community" })).id;
  });
  afterAll(async () => {
    try {
      if (created) await db.query('DROP SCHEMA "' + schema + '" CASCADE');
    } finally {
      if (db.isInitialized) await db.destroy();
    }
  });
  async function fixture(orgId?: string) {
    const fields = {
      title: "Park cleanup",
      description: "Cleanup",
      causeId,
      startsAt: new Date("2026-01-01T10:00Z"),
      endsAt: new Date("2026-01-01T12:00Z"),
    };
    const target = orgId
      ? {
          opportunityId: (
            await manager.save(OpportunityEntity, {
              ...fields,
              organizationId: orgId,
              capacity: 2,
            })
          ).id,
        }
      : {
          requestId: (
            await manager.save(CommunityRequestEntity, {
              ...fields,
              requesterId: owner,
              approximateArea: "Park",
            })
          ).id,
        };
    const application = await manager.save(ApplicationEntity, {
      ...target,
      volunteerId: volunteer,
      status: "ACCEPTED",
    });
    return manager.save(ParticipationEntity, {
      applicationId: application.id,
      volunteerId: volunteer,
      status: "PENDING_VERIFICATION",
      acceptedAt: fields.startsAt,
      completedAt: fields.endsAt,
      proposedHours: "1.50",
    });
  }
  it("serializes simultaneous decisions, creates private credit once, and revokes once", async () => {
    const p = await fixture();
    const results = await Promise.allSettled([
      verification.approve(p.id, owner, {}),
      verification.approve(p.id, owner, {}),
    ]);
    const winners = results.filter((r) => r.status === "fulfilled");
    expect(winners).toHaveLength(1);
    expect(results.find((r) => r.status === "rejected")?.reason).toBeInstanceOf(
      ConflictException,
    );
    const id = winners[0].value.data.id;
    expect(
      await manager.countBy(VerificationEntity, { participationId: p.id }),
    ).toBe(1);
    expect(
      await manager.findBy(ImpactRecordEntity, { verificationId: id }),
    ).toMatchObject([
      {
        sourceType: "COMMUNITY_VERIFIED",
        visibility: "PRIVATE",
        activityDate: "2026-01-01",
      },
    ]);
    for (const reader of [administrator, owner, volunteer])
      expect((await verification.detail(id, reader)).data.id).toBe(id);
    await expect(verification.detail(id, organizer)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    const flag = await manager.save(FraudFlagEntity, {
      participationId: p.id,
      ruleCode: "REVIEW",
    });
    await flags.review(administrator, flag.id, { status: "CONFIRMED" });
    await expect(
      flags.review(administrator, flag.id, { status: "DISMISSED" }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect((await flags.detail(administrator, flag.id)).data.reviewedById).toBe(
      administrator,
    );
    expect(
      (await flags.list(administrator, { page: 1, limit: 1 })).meta.total,
    ).toBeGreaterThan(0);
    expect((await verification.detail(id, administrator)).data.status).toBe(
      "APPROVED",
    );
    await verification.revoke(id, administrator, "Incorrect evidence");
    await expect(
      verification.revoke(id, administrator, "Again"),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(
      await manager.findOneBy(ParticipationEntity, { id: p.id }),
    ).toMatchObject({ status: "REVOKED" });
    expect(
      await manager.findOneBy(ImpactRecordEntity, { verificationId: id }),
    ).toMatchObject({ status: "REVOKED" });
    expect(await manager.countBy(AuditLogEntity, { targetId: id })).toBe(2);
  });
  it("rolls back approval and revocation when the final audit insert fails", async () => {
    const p = await fixture();
    // Each constraint applies only in this run's private schema.
    async function failAudit(
      action: string,
      operation: () => Promise<unknown>,
    ) {
      await db.query(
        "ALTER TABLE audit_logs ADD CONSTRAINT fail_test_audit CHECK (action <> '" +
          action +
          "') NOT VALID",
      );
      try {
        await expect(operation()).rejects.toMatchObject({
          driverError: { code: "23514" },
        });
      } finally {
        await db.query(
          "ALTER TABLE audit_logs DROP CONSTRAINT fail_test_audit",
        );
      }
    }
    const baseline = await manager.countBy(ImpactRecordEntity, {
      volunteerId: volunteer,
    });
    await failAudit("VERIFICATION_APPROVED", () =>
      verification.approve(p.id, owner, {}),
    );
    expect(
      await manager.countBy(VerificationEntity, { participationId: p.id }),
    ).toBe(0);
    expect(
      await manager.findOneBy(ParticipationEntity, { id: p.id }),
    ).toMatchObject({ status: "PENDING_VERIFICATION" });
    expect(
      await manager.countBy(ImpactRecordEntity, { volunteerId: volunteer }),
    ).toBe(baseline);
    const { data: v } = await verification.approve(p.id, owner, {});
    expect(
      await manager.countBy(ImpactRecordEntity, { volunteerId: volunteer }),
    ).toBe(baseline + 1);
    await failAudit("VERIFICATION_REVOKED", () =>
      verification.revoke(v.id, administrator, "Test"),
    );
    expect(
      await manager.findOneBy(VerificationEntity, { id: v.id }),
    ).toMatchObject({ status: "APPROVED" });
    expect(
      await manager.findOneBy(ParticipationEntity, { id: p.id }),
    ).toMatchObject({ status: "VERIFIED" });
    expect(
      await manager.findOneBy(ImpactRecordEntity, { verificationId: v.id }),
    ).toMatchObject({ status: "ACTIVE" });
  });
  it("enforces organizer approval and ownership and audits organization decisions", async () => {
    const org = await manager.save(OrganizationEntity, {
      ownerUserId: organizer,
      name: "Cleanup",
    });
    const p = await fixture(org.id);
    await expect(
      verification.approve(p.id, organizer, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await admin.decideOrganization(administrator, org.id, "APPROVED");
    await expect(
      admin.decideOrganization(administrator, org.id, "REJECTED"),
    ).rejects.toBeInstanceOf(ConflictException);
    await expect(verification.approve(p.id, owner, {})).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    const { data: v } = await verification.approve(p.id, organizer, {
      confirmedHours: 2,
    });
    expect(
      await manager.findOneBy(ImpactRecordEntity, { verificationId: v.id }),
    ).toMatchObject({ sourceType: "ORGANIZATION_VERIFIED" });
    const second = await manager.save(OrganizationEntity, {
      ownerUserId: organizer,
      name: "Second",
    });
    expect(
      (await admin.decideOrganization(administrator, second.id, "REJECTED"))
        .data.approvalStatus,
    ).toBe("REJECTED");
  });
  it("rejects self-verification, invalid hours and duplicate decisions; rejection creates no credit", async () => {
    const p = await fixture();
    await expect(
      verification.approve(p.id, volunteer, {}),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      verification.approve(p.id, owner, { confirmedHours: 3 }),
    ).rejects.toBeInstanceOf(BadRequestException);
    const { data: v } = await verification.reject(p.id, owner, {
      reason: "Evidence incomplete",
    });
    expect(
      await manager.countBy(ImpactRecordEntity, { verificationId: v.id }),
    ).toBe(0);
    await expect(verification.approve(p.id, owner, {})).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
  it("enforces active accounts, administrator access, missing resources and paginated history", async () => {
    const user = await createUser(Role.VOLUNTEER);
    await expect(
      admin.setUserStatus(owner, user, "SUSPENDED"),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await admin.setUserStatus(administrator, user, "SUSPENDED");
    await expect(
      verification.detail(randomUUID(), user),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await admin.setUserStatus(administrator, user, "ACTIVE");
    await expect(
      verification.detail(randomUUID(), user),
    ).rejects.toBeInstanceOf(NotFoundException);
    await expect(
      audit.list(randomUUID(), { page: 1, limit: 2 }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
    await expect(flags.detail(owner, randomUUID())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    const page = await audit.list(administrator, { page: 1, limit: 1 });
    expect(page.data).toHaveLength(1);
    expect(page.meta.totalPages).toBe(page.meta.total);
  });
  it("serves the contracted HTTP routes with signature validation, role guards and global pipes", async () => {
    const key = randomUUID();
    class FixtureJwt extends PassportStrategy(Strategy, "jwt") {
      constructor() {
        super({
          jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
          secretOrKey: key,
          algorithms: ["HS256"],
        });
      }
      validate(payload: { sub: string; role: Role }) {
        return { id: payload.sub, role: payload.role };
      }
    }
    @Global()
    @Module({
      providers: [{ provide: DataSource, useValue: db }],
      exports: [DataSource],
    })
    class TestDatabaseModule {}
    const module = await Test.createTestingModule({
      imports: [
        TestDatabaseModule,
        AdminModule,
        AuditLogModule,
        FraudFlagModule,
      ],
      providers: [FixtureJwt],
    }).compile();
    const app = module.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    try {
      await app.init();
      const paths = SwaggerModule.createDocument(
        app,
        new DocumentBuilder().addBearerAuth().build(),
      ).paths;
      expect(
        Object.values(paths).flatMap((path) => Object.keys(path)),
      ).toHaveLength(11);
      const server = request(app.getHttpServer());
      const jwt = new JwtService({ secret: key });
      const token = (id: string, role: Role) =>
        "Bearer " + jwt.sign({ sub: id, role }, { expiresIn: "1m" });
      const bearer = token(owner, Role.VOLUNTEER);
      const auditPath = "/admin/audit-logs";
      await server.get(auditPath).expect(401);
      await server
        .get(auditPath)
        .set(
          "Authorization",
          "Bearer " +
            new JwtService({ secret: randomUUID() }).sign({
              sub: administrator,
              role: Role.ADMINISTRATOR,
            }),
        )
        .expect(401);
      await server.get(auditPath).set("Authorization", bearer).expect(403);
      await server
        .get(auditPath + "?limit=101")
        .set("Authorization", token(administrator, Role.ADMINISTRATOR))
        .expect(400);
      await server
        .get("/verifications/" + randomUUID())
        .set("Authorization", bearer)
        .expect(404);
      await server
        .get("/verifications/malformed")
        .set("Authorization", bearer)
        .expect(400);
      const p = await fixture();
      const url = "/verifications/" + p.id + "/approve";
      await server
        .post(url)
        .set("Authorization", bearer)
        .send({ actorId: administrator })
        .expect(400);
      const response = await server
        .post(url)
        .set("Authorization", bearer)
        .send({ confirmedHours: 1.25 })
        .expect(201);
      expect(response.body.data.confirmedHours).toBe("1.25");
      await server.post(url).set("Authorization", bearer).send({}).expect(409);
      await server
        .post("/admin/verifications/" + response.body.data.id + "/revoke")
        .set("Authorization", token(administrator, Role.ADMINISTRATOR))
        .send({ reason: "Duplicate evidence" })
        .expect(200);
    } finally {
      await app.close();
    }
  });
});
