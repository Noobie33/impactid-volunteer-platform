import { Module } from "@nestjs/common";
import { AdminController } from "@/modules/admin/admin.controller";
import { AdminService } from "@/modules/admin/admin.service";
import { VerificationModule } from "@/modules/verification/verification.module";
@Module({
  imports: [VerificationModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
