import { Module } from "@nestjs/common";
import { ApplicationController } from "@/modules/application/application.controller";
import { ApplicationService } from "@/modules/application/application.service";

@Module({
  controllers: [ApplicationController],
  providers: [ApplicationService],
  exports: [ApplicationService],
})
export class ApplicationModule {}
