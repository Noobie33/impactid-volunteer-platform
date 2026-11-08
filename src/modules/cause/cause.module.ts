import { Module } from "@nestjs/common";
import { CauseController } from "@/modules/cause/cause.controller";
import { CauseService } from "@/modules/cause/cause.service";

@Module({
  controllers: [CauseController],
  providers: [CauseService],
  exports: [CauseService],
})
export class CauseModule {}
