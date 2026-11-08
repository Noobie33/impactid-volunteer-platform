import { Module } from "@nestjs/common";
import { SkillController } from "@/modules/skill/skill.controller";
import { SkillService } from "@/modules/skill/skill.service";

@Module({
  controllers: [SkillController],
  providers: [SkillService],
  exports: [SkillService],
})
export class SkillModule {}
