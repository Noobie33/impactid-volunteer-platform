import { Module } from "@nestjs/common";
import { VerificationController } from "@/modules/verification/verification.controller";
import { VerificationService } from "@/modules/verification/verification.service";

@Module({
  controllers: [VerificationController],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
