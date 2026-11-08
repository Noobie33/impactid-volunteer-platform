import { Controller } from "@nestjs/common";
import { CommunityRequestService } from "@/modules/community-request/community-request.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("community-requests")
export class CommunityRequestController {
  constructor(
    private readonly communityrequestService: CommunityRequestService,
  ) {}
}
