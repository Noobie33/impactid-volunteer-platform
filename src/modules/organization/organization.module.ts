import { Module } from "@nestjs/common";
import { OrganizationController } from "@/modules/organization/organization.controller";
import { OrganizationService } from "@/modules/organization/organization.service";

@Module({
  controllers: [OrganizationController],
  providers: [OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationModule {}
