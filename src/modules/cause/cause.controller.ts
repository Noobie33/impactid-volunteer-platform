import { Controller } from "@nestjs/common";
import { CauseService } from "@/modules/cause/cause.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("causes")
export class CauseController {
  constructor(private readonly causeService: CauseService) {}
}
