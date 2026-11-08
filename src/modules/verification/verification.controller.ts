import { Controller } from "@nestjs/common";
import { VerificationService } from "@/modules/verification/verification.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("verifications")
export class VerificationController {
  constructor(private readonly verificationService: VerificationService) {}
}
