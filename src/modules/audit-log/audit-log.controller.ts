import { Controller, UseGuards, Query, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@/common/guard/auth.guard";
import { RolesGuard } from "@/common/guard/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/common/enums/role.enum";
import { ActorId } from "@/modules/admin/access";
import { AuditLogService } from "@/modules/audit-log/audit-log.service";
import { PageDto } from "@/modules/audit-log/dto/audit-log.dto";
@ApiBearerAuth()
@ApiTags("admin/audit-logs")
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/audit-logs")
export class AuditLogController {
  constructor(private readonly service: AuditLogService) {}
  @Get("")
  @ApiOperation({ summary: "List audit records" })
  list(@ActorId() actor: string, @Query() page: PageDto) {
    return this.service.list(actor, page);
  }
}
