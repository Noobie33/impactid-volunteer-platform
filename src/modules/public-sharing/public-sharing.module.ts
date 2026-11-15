import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ProfileEntity } from "@/modules/user/entities/profile.entity";
import { ImpactRecordEntity } from "@/modules/impact-passport/entities/impact-record.entity";
import { VerificationEntity } from "@/modules/verification/entities/verification.entity";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { PublicSharingController } from "./public-sharing.controller";
import { PublicSharingService } from "./public-sharing.service";
 
@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProfileEntity,
      ImpactRecordEntity,
      VerificationEntity,
      ParticipationEntity,
      ApplicationEntity,
      OpportunityEntity,
    ]),
  ],
  controllers: [PublicSharingController],
  providers: [PublicSharingService],
  exports: [PublicSharingService],
})
export class PublicSharingModule {}