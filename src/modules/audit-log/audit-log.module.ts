import { Module } from "@nestjs/common";
import { AuditLogController } from "@/modules/audit-log/audit-log.controller";
import { AuditLogService } from "@/modules/audit-log/audit-log.service";

@Module({
  controllers: [AuditLogController],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class AuditLogModule {}
