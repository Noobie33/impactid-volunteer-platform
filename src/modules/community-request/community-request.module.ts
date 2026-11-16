import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CommunityRequestEntity } from "./entities/community-request.entity";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";
import { CommunityRequestController } from "./community-request.controller";
import { CommunityRequestService } from "./community-request.service";

@Module({
  imports: [TypeOrmModule.forFeature([CommunityRequestEntity, CauseEntity])],
  controllers: [CommunityRequestController],
  providers: [CommunityRequestService],
  exports: [CommunityRequestService],
})
export class CommunityRequestModule {}