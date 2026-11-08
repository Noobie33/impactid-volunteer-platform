import { Module } from "@nestjs/common";
import { ParticipationController } from "@/modules/participation/participation.controller";
import { ParticipationService } from "@/modules/participation/participation.service";

@Module({
  controllers: [ParticipationController],
  providers: [ParticipationService],
  exports: [ParticipationService],
})
export class ParticipationModule {}
