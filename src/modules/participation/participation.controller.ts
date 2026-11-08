import { Controller } from "@nestjs/common";
import { ParticipationService } from "@/modules/participation/participation.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("participations")
export class ParticipationController {
  constructor(private readonly participationService: ParticipationService) {}
}
