import { Controller } from "@nestjs/common";
import { AuditLogService } from "@/modules/audit-log/audit-log.service";

/**
 * Route handlers are intentionally not implemented in this scaffold.
 * Add guards, validated DTOs, authorization and Swagger documentation before use.
 */
@Controller("admin/audit-logs")
export class AuditLogController {
  constructor(private readonly auditlogService: AuditLogService) {}
}
