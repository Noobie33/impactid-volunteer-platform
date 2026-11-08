import { Module } from "@nestjs/common";
import { PublicSharingController } from "@/modules/public-sharing/public-sharing.controller";
import { PublicSharingService } from "@/modules/public-sharing/public-sharing.service";

@Module({
  controllers: [PublicSharingController],
  providers: [PublicSharingService],
  exports: [PublicSharingService],
})
export class PublicSharingModule {}
