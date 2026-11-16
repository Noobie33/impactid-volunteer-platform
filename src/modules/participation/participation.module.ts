import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ParticipationEntity } from "./entities/participation.entity";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { CommunityRequestEntity } from "@/modules/community-request/entities/community-request.entity";
import { ParticipationController } from "./participation.controller";
import { ParticipationService } from "./participation.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ParticipationEntity,
      ApplicationEntity,
      OpportunityEntity,
      CommunityRequestEntity,
    ]),
  ],
  controllers: [ParticipationController],
  providers: [ParticipationService],
  exports: [ParticipationService],
})
export class ParticipationModule {}