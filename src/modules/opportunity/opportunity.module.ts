import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OpportunityEntity } from "./entities/opportunity.entity";
import { OrganizationEntity } from "@/modules/organization/entities/organization.entity";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";
import { SkillEntity } from "@/modules/skill/entities/skill.entity";
import { OpportunityController } from "./opportunity.controller";
import { OpportunityService } from "./opportunity.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OpportunityEntity,
      OrganizationEntity,
      CauseEntity,
      SkillEntity,
    ]),
  ],
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}