import { Controller } from "@nestjs/common";
import { ImpactPassportService } from "@/modules/impact-passport/impact-passport.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("impact-passport")
export class ImpactPassportController {
  constructor(private readonly impactpassportService: ImpactPassportService) {}
}
