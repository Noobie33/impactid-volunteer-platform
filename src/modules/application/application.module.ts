import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ApplicationEntity } from "./entities/application.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { CommunityRequestEntity } from "@/modules/community-request/entities/community-request.entity";
import { OrganizationEntity } from "@/modules/organization/entities/organization.entity";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { ApplicationController } from "./application.controller";
import { ApplicationService } from "./application.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ApplicationEntity,
      OpportunityEntity,
      CommunityRequestEntity,
      OrganizationEntity,
      ParticipationEntity,
    ]),
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}