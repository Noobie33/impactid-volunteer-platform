import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ImpactRecordEntity } from "./entities/impact-record.entity";
import { VerificationEntity } from "@/modules/verification/entities/verification.entity";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";
import { ProfileEntity } from "@/modules/user/entities/profile.entity";
import { ImpactPassportController } from "./impact-passport.controller";
import { ImpactPassportService } from "./impact-passport.service";
 
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ImpactRecordEntity,
      VerificationEntity,
      ParticipationEntity,
      ApplicationEntity,
      OpportunityEntity,
      CauseEntity,
      ProfileEntity,
    ]),
  ],
  controllers: [ImpactPassportController],
  providers: [ImpactPassportService],
  exports: [ImpactPassportService],
})
export class ImpactPassportModule {}