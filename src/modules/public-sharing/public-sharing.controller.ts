import { Controller } from "@nestjs/common";
import { PublicSharingService } from "@/modules/public-sharing/public-sharing.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("public/passports")
export class PublicSharingController {
  constructor(private readonly publicsharingService: PublicSharingService) {}
}
