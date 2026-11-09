import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Role } from "@/common/enums/role.enum";
import { activeActor } from "@/modules/admin/access";
import { appendAudit } from "@/modules/audit-log/audit-log.service";
import { OrganizationEntity } from "@/modules/organization/entities/organization.entity";
import { UserEntity, UserStatus } from "@/modules/user/entities/user.entity";
@Injectable()
export class AdminService {
  constructor(private readonly db: DataSource) {}
  decideOrganization(
    actorId: string,
    id: string,
    status: "APPROVED" | "REJECTED",
    reason?: string,
  ) {
    return this.db.transaction(async (manager) => {
      await activeActor(manager, actorId, Role.ADMINISTRATOR);
      const org = await manager.findOne(OrganizationEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!org) throw new NotFoundException("Organization not found");
      if (org.approvalStatus !== "PENDING")
        throw new ConflictException("Organization already reviewed");
      org.approvalStatus = status;
      org.approvedAt = status === "APPROVED" ? new Date() : null;
      org.approvedById = status === "APPROVED" ? actorId : null;
      await manager.save(org);
      await appendAudit(
        manager,
        actorId,
        "ORGANIZATION_" + status,
        "organization",
        id,
        reason?.trim(),
      );
      return { success: true, data: org };
    });
  }
  setUserStatus(actorId: string, id: string, status: UserStatus) {
    return this.db.transaction(async (manager) => {
      await activeActor(manager, actorId, Role.ADMINISTRATOR);
      const user = await manager.findOne(UserEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!user) throw new NotFoundException("User not found");
      if (user.status === status)
        throw new ConflictException("Account already has requested status");
      user.status = status;
      await manager.save(user);
      await appendAudit(manager, actorId, "USER_" + status, "user", id);
      return { success: true, data: { id, status } };
    });
  }
}
