import { Module } from "@nestjs/common";
import { OpportunityController } from "@/modules/opportunity/opportunity.controller";
import { OpportunityService } from "@/modules/opportunity/opportunity.service";

@Module({
  controllers: [OpportunityController],
  providers: [OpportunityService],
  exports: [OpportunityService],
})
export class OpportunityModule {}
