import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Role } from "@/common/enums/role.enum";
import { activeActor } from "@/modules/admin/access";
import { appendAudit } from "@/modules/audit-log/audit-log.service";
import { PageDto, paginated } from "@/modules/audit-log/dto/audit-log.dto";
import { ReviewFraudFlagDto } from "@/modules/fraud-flag/dto/fraud-flag.dto";
import { FraudFlagEntity } from "@/modules/fraud-flag/entities/fraud-flag.entity";
@Injectable()
export class FraudFlagService {
  constructor(private readonly db: DataSource) {}
  async list(actorId: string, page: PageDto) {
    await activeActor(this.db.manager, actorId, Role.ADMINISTRATOR);
    const [rows, total] = await this.db.manager.findAndCount(FraudFlagEntity, {
      order: { createdAt: "DESC", id: "DESC" },
      skip: (page.page - 1) * page.limit,
      take: page.limit,
    });
    return paginated(rows, total, page);
  }
  async detail(actorId: string, id: string) {
    await activeActor(this.db.manager, actorId, Role.ADMINISTRATOR);
    const flag = await this.db.manager.findOneBy(FraudFlagEntity, { id });
    if (!flag) throw new NotFoundException("Fraud flag not found");
    return { success: true, data: flag };
  }
  review(actorId: string, id: string, input: ReviewFraudFlagDto) {
    return this.db.transaction(async (manager) => {
      await activeActor(manager, actorId, Role.ADMINISTRATOR);
      const flag = await manager.findOne(FraudFlagEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!flag) throw new NotFoundException("Fraud flag not found");
      if (flag.status !== "OPEN")
        throw new ConflictException("Flag already reviewed");
      flag.status = input.status;
      flag.reviewedById = actorId;
      flag.reviewedAt = new Date();
      await manager.save(flag);
      await appendAudit(
        manager,
        actorId,
        "FRAUD_FLAG_" + flag.status,
        "fraud_flag",
        id,
      );
      return { success: true, data: flag };
    });
  }
}
