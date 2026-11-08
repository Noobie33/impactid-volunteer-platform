import { Controller } from "@nestjs/common";
import { OpportunityService } from "@/modules/opportunity/opportunity.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("opportunities")
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}
}
