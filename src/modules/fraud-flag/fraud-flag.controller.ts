import { Controller } from "@nestjs/common";
import { FraudFlagService } from "@/modules/fraud-flag/fraud-flag.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("admin/fraud-flags")
export class FraudFlagController {
  constructor(private readonly fraudflagService: FraudFlagService) {}
}
