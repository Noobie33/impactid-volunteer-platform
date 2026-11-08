import { MODULE_METADATA } from "@nestjs/common/constants";
import { DataSource } from "typeorm";
import { dataSourceOptions } from "@/config/database.config";
import { AuthModule } from "@/modules/auth/auth.module";
import { UserModule } from "@/modules/user/user.module";
import { OrganizationModule } from "@/modules/organization/organization.module";
import { OpportunityModule } from "@/modules/opportunity/opportunity.module";
import { CommunityRequestModule } from "@/modules/community-request/community-request.module";
import { ApplicationModule } from "@/modules/application/application.module";
import { ParticipationModule } from "@/modules/participation/participation.module";
import { VerificationModule } from "@/modules/verification/verification.module";
import { FraudFlagModule } from "@/modules/fraud-flag/fraud-flag.module";
import { AuditLogModule } from "@/modules/audit-log/audit-log.module";
import { AdminModule } from "@/modules/admin/admin.module";
import { ImpactPassportModule } from "@/modules/impact-passport/impact-passport.module";
import { SkillModule } from "@/modules/skill/skill.module";
import { CauseModule } from "@/modules/cause/cause.module";
import { PublicSharingModule } from "@/modules/public-sharing/public-sharing.module";

const featureModules = [
  AuthModule,
  UserModule,
  OrganizationModule,
  OpportunityModule,
  CommunityRequestModule,
  ApplicationModule,
  ParticipationModule,
  VerificationModule,
  FraudFlagModule,
  AuditLogModule,
  AdminModule,
  ImpactPassportModule,
  SkillModule,
  CauseModule,
  PublicSharingModule,
];

describe("module scaffolding", () => {
  it("registers each feature module exactly once", () => {
    // AppModule validates environment variables at import time. Supply local
    // dummy values for a wiring-only test; no connection is attempted.
    const env = {
      DB_HOST: "127.0.0.1",
      DB_PORT: "5432",
      DB_USER: "impactid_test",
      DB_DATABASE: "impactid_test",
      JWT_BEARER_SECRET: "module-test-only-placeholder-secret",
    };
    const previous = Object.fromEntries(
      Object.keys(env).map((key) => [key, process.env[key]]),
    );
    Object.assign(process.env, env);
    let AppModule: typeof import("@/src/app.module").AppModule;
    try {
      // Jest's CJS runner needs require here: ESM dynamic import needs VM flags.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const appModule = require("@/src/app.module");
      AppModule =
        appModule.AppModule as typeof import("@/src/app.module").AppModule;
    } finally {
      for (const [key, old] of Object.entries(previous)) {
        if (old === undefined) delete process.env[key];
        else process.env[key] = old;
      }
    }
    const imports = Reflect.getMetadata(
      MODULE_METADATA.IMPORTS,
      AppModule,
    ) as unknown[];
    for (const moduleClass of featureModules) {
      expect(imports.filter((entry) => entry === moduleClass)).toHaveLength(1);
      expect(
        Reflect.getMetadata(MODULE_METADATA.CONTROLLERS, moduleClass),
      ).toHaveLength(1);
      expect(
        Reflect.getMetadata(MODULE_METADATA.PROVIDERS, moduleClass),
      ).toHaveLength(1);
    }
  });

  it("maps all 14 migration tables without opening a database connection", async () => {
    const source = new DataSource(dataSourceOptions);
    // Building metadata is connection-free; initialize() would require PostgreSQL.
    await (
      source as unknown as { buildMetadatas(): Promise<void> }
    ).buildMetadatas();

    expect(
      source.entityMetadatas.map((entity) => entity.tableName).sort(),
    ).toEqual([
      "applications",
      "audit_logs",
      "causes",
      "community_requests",
      "fraud_flags",
      "impact_records",
      "opportunities",
      "opportunity_skills",
      "organizations",
      "participations",
      "profiles",
      "skills",
      "users",
      "verifications",
    ]);

    const opportunity = source.entityMetadatas.find(
      (entity) => entity.tableName === "opportunities",
    );
    expect(
      opportunity?.relations.find(
        (relation) => relation.propertyName === "skills",
      )?.isManyToMany,
    ).toBe(true);
    const profile = source.entityMetadatas.find(
      (entity) => entity.tableName === "profiles",
    );
    expect(
      profile?.relations.find((relation) => relation.propertyName === "user")
        ?.isOneToOne,
    ).toBe(true);
    const organization = source.entityMetadatas.find(
      (entity) => entity.tableName === "organizations",
    );
    expect(
      organization?.relations.find(
        (relation) => relation.propertyName === "owner",
      )?.isManyToOne,
    ).toBe(true);
  });
});
