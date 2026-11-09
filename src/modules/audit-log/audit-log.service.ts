import { Injectable } from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { AuditLogEntity } from "@/modules/audit-log/entities/audit-log.entity";
import { PageDto, paginated } from "@/modules/audit-log/dto/audit-log.dto";
import { activeActor } from "@/modules/admin/access";
import { Role } from "@/common/enums/role.enum";

export function appendAudit(
  manager: EntityManager,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  reason: string | null = null,
) {
  return manager.insert(AuditLogEntity, {
    actorId,
    action,
    targetType,
    targetId,
    reason,
  });
}
@Injectable()
export class AuditLogService {
  constructor(private readonly db: DataSource) {}
  async list(actorId: string, page: PageDto) {
    await activeActor(this.db.manager, actorId, Role.ADMINISTRATOR);
    const [rows, total] = await this.db.manager.findAndCount(AuditLogEntity, {
      order: { createdAt: "DESC", id: "DESC" },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return paginated(rows, total, page);
  }
}
