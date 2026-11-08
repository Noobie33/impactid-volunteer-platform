import { Controller } from "@nestjs/common";
import { ApplicationService } from "@/modules/application/application.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}
}
