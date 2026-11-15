import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SkillEntity } from "./entities/skill.entity";
import { SkillController } from "./skill.controller";
import { SkillService } from "./skill.service";
 
@Module({
  imports: [TypeOrmModule.forFeature([SkillEntity])],
  controllers: [SkillController],
  providers: [SkillService],
  exports: [SkillService],
})
export class SkillModule {}