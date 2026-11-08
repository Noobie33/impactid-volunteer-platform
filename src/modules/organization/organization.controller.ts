import { Controller } from "@nestjs/common";
import { OrganizationService } from "@/modules/organization/organization.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("organizations")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}
}
