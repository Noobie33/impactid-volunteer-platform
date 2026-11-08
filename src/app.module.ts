import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PostgresDatabaseProviderModule } from "@/providers/database/postgres/provider.module";
import { AppController } from "@/src/app.controller";
import { AppService } from "@/src/app.service";
import { validateEnvironment } from "@/config/validate-env";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    PostgresDatabaseProviderModule,
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
