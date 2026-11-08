import { Module } from "@nestjs/common";
import { ImpactPassportController } from "@/modules/impact-passport/impact-passport.controller";
import { ImpactPassportService } from "@/modules/impact-passport/impact-passport.service";

@Module({
  controllers: [ImpactPassportController],
  providers: [ImpactPassportService],
  exports: [ImpactPassportService],
})
export class ImpactPassportModule {}
