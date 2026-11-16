import { Module } from "@nestjs/common";
import { FraudFlagController } from "@/modules/fraud-flag/fraud-flag.controller";
import { FraudFlagService } from "@/modules/fraud-flag/fraud-flag.service";

@Module({
  controllers: [FraudFlagController],
  providers: [FraudFlagService],
  exports: [FraudFlagService],
})
export class FraudFlagModule {}
