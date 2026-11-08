import { Module } from "@nestjs/common";
import { CommunityRequestController } from "@/modules/community-request/community-request.controller";
import { CommunityRequestService } from "@/modules/community-request/community-request.service";

@Module({
  controllers: [CommunityRequestController],
  providers: [CommunityRequestService],
  exports: [CommunityRequestService],
})
export class CommunityRequestModule {}
