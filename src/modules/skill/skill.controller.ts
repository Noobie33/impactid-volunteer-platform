import { Controller } from "@nestjs/common";
import { SkillService } from "@/modules/skill/skill.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("skills")
export class SkillController {
  constructor(private readonly skillService: SkillService) {}
}
