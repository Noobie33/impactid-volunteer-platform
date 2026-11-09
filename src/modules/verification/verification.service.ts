import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager } from "typeorm";
import { Role } from "@/common/enums/role.enum";
import { activeActor } from "@/modules/admin/access";
import { appendAudit } from "@/modules/audit-log/audit-log.service";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { ImpactRecordEntity } from "@/modules/impact-passport/entities/impact-record.entity";
import { VerificationEntity } from "@/modules/verification/entities/verification.entity";
import {
  ApproveVerificationDto,
  RejectVerificationDto,
} from "@/modules/verification/dto/verification.dto";

type Decision =
  | { status: "APPROVED"; input: ApproveVerificationDto }
  | { status: "REJECTED"; input: RejectVerificationDto };

export function confirmedHours(
  isTimeBased: boolean,
  claimed: number | string | null,
  startsAt: Date,
  endsAt: Date,
  completedAt: Date,
): string | null {
  if (!isTimeBased) {
    if (claimed !== null && Number(claimed) !== 0)
      throw new BadRequestException(
        "Non-time-based activities cannot earn hours",
      );
    return null;
  }
  const hours = Number(claimed);
  const availableMs =
    Math.min(endsAt.getTime(), completedAt.getTime()) - startsAt.getTime();
  if (
    claimed === null ||
    !/^\d+(\.\d{1,2})?$/.test(String(claimed)) ||
    hours > 999999.99 ||
    Math.round(hours * 100) * 36000 > availableMs
  )
    throw new BadRequestException(
      "Supply valid hours within the completed activity duration",
    );
  return hours.toFixed(2);
}

async function applicationFor(
  manager: EntityManager,
  participation: ParticipationEntity,
  historical = false,
) {
  const application = await manager.findOne(ApplicationEntity, {
    where: { id: participation.applicationId },
    relations: { opportunity: { organization: true }, request: true },
    withDeleted: historical,
  });
  if (!application || application.volunteerId !== participation.volunteerId)
    throw new ConflictException("Participation and application do not match");
  return application;
}

@Injectable()
export class VerificationService {
  constructor(private readonly db: DataSource) {}
  approve(id: string, actorId: string, input: ApproveVerificationDto) {
    return this.decide(id, actorId, { status: "APPROVED", input });
  }
  reject(id: string, actorId: string, input: RejectVerificationDto) {
    return this.decide(id, actorId, { status: "REJECTED", input });
  }

  private decide(id: string, actorId: string, decision: Decision) {
    return this.db.transaction(async (manager) => {
      const actor = await activeActor(manager, actorId);
      const p = await manager.findOne(ParticipationEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!p) throw new NotFoundException("Participation not found");
      if (p.volunteerId === actor.id)
        throw new ForbiddenException("Cannot verify your own participation");
      const app = await applicationFor(manager, p);
      const org = app.opportunity?.organization;
      const activity = app.opportunity ?? app.request;
      const authorized = app.opportunityId
        ? actor.role === Role.ORGANIZATION &&
          org?.ownerUserId === actor.id &&
          org.approvalStatus === "APPROVED"
        : actor.role === Role.VOLUNTEER &&
          app.request?.requesterId === actor.id;
      if (!authorized || !activity)
        throw new ForbiddenException(
          "Only the authorized activity owner may decide",
        );
      if (
        p.status !== "PENDING_VERIFICATION" ||
        !p.completedAt ||
        app.status !== "ACCEPTED" ||
        activity.status === "CANCELLED" ||
        (await manager.existsBy(VerificationEntity, { participationId: id }))
      )
        throw new ConflictException("Participation is not awaiting a decision");
      const reason =
        decision.status === "REJECTED" ? decision.input.reason.trim() : null;
      const eligibleStart = new Date(
        Math.max(activity.startsAt.getTime(), p.acceptedAt.getTime()),
      );
      if (
        decision.status === "APPROVED" &&
        (p.completedAt < eligibleStart ||
          p.completedAt.getTime() > Date.now() ||
          eligibleStart > activity.endsAt)
      ) {
        throw new ConflictException(
          "Completion falls outside the participation timeline",
        );
      }
      const hours =
        decision.status === "APPROVED"
          ? confirmedHours(
              activity.isTimeBased,
              decision.input.confirmedHours ?? p.proposedHours,
              eligibleStart,
              activity.endsAt,
              p.completedAt,
            )
          : null;
      const verification = await manager.save(VerificationEntity, {
        participationId: id,
        verifierId: actor.id,
        type: app.opportunityId ? "ORGANIZATION" : "COMMUNITY",
        status: decision.status,
        reason,
        confirmedHours: hours,
      });
      await manager.update(ParticipationEntity, id, {
        status: decision.status === "APPROVED" ? "VERIFIED" : "REJECTED",
      });
      if (decision.status === "APPROVED")
        await manager.insert(ImpactRecordEntity, {
          volunteerId: p.volunteerId,
          verificationId: verification.id,
          causeId: activity.causeId,
          sourceType: app.opportunityId
            ? "ORGANIZATION_VERIFIED"
            : "COMMUNITY_VERIFIED",
          title: activity.title,
          activityDate: activity.startsAt.toISOString().slice(0, 10),
          visibility: "PRIVATE",
          status: "ACTIVE",
        });
      await appendAudit(
        manager,
        actor.id,
        "VERIFICATION_" + decision.status,
        "verification",
        verification.id,
        reason,
      );
      return { success: true, data: verification };
    });
  }

  async detail(id: string, actorId: string) {
    const manager = this.db.manager;
    const actor = await activeActor(manager, actorId);
    const verification = await manager.findOneBy(VerificationEntity, { id });
    if (!verification) throw new NotFoundException("Verification not found");
    if (actor.role !== Role.ADMINISTRATOR) {
      const p = await manager.findOneByOrFail(ParticipationEntity, {
        id: verification.participationId,
      });
      if (actor.id !== p.volunteerId) {
        const app = await applicationFor(manager, p, true);
        if (
          !(
            actor.role === Role.ORGANIZATION &&
            app.opportunity?.organization?.ownerUserId === actor.id
          ) &&
          !(
            actor.role === Role.VOLUNTEER &&
            app.request?.requesterId === actor.id
          )
        )
          throw new ForbiddenException("Verification is private");
      }
    }
    return { success: true, data: verification };
  }

  revoke(id: string, actorId: string, reason: string) {
    return this.db.transaction(async (manager) => {
      await activeActor(manager, actorId, Role.ADMINISTRATOR);
      const v = await manager.findOne(VerificationEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!v) throw new NotFoundException("Verification not found");
      if (v.status !== "APPROVED")
        throw new ConflictException(
          "Only approved verifications can be revoked",
        );
      const participation = await manager.update(
        ParticipationEntity,
        { id: v.participationId, status: "VERIFIED" },
        { status: "REVOKED" },
      );
      const impact = await manager.update(
        ImpactRecordEntity,
        { verificationId: id, status: "ACTIVE" },
        { status: "REVOKED" },
      );
      if (participation.affected !== 1 || impact.affected !== 1)
        throw new ConflictException(
          "Verified participation and active impact record required",
        );
      v.status = "REVOKED";
      await manager.save(v);
      await appendAudit(
        manager,
        actorId,
        "VERIFICATION_REVOKED",
        "verification",
        id,
        reason.trim(),
      );
      return { success: true, data: v };
    });
  }
}
