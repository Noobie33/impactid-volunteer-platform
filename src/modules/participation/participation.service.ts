import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  ParticipationEntity,
  type ParticipationStatus,
} from "./entities/participation.entity";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { CommunityRequestEntity } from "@/modules/community-request/entities/community-request.entity";
import { SubmitCompletionDto } from "./dto/participation.dto";

const MS_PER_HOUR = 3_600_000;

@Injectable()
export class ParticipationService {
  constructor(
    @InjectRepository(ParticipationEntity)
    private readonly participationRepo: Repository<ParticipationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async submitCompletion(
    id: string,
    volunteerId: string,
    dto: SubmitCompletionDto,
  ): Promise<ParticipationEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const participation = await qr.manager.findOne(ParticipationEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });

      if (!participation) {
        throw new NotFoundException("Participation record not found");
      }
      if (participation.volunteerId !== volunteerId) {
        throw new ForbiddenException(
          "Only the assigned volunteer can submit completion details",
        );
      }
      if (participation.status !== "ACCEPTED") {
        throw new ConflictException(
          `Participation is currently ${participation.status} and cannot be submitted for completion`,
        );
      }

      const app = await qr.manager.findOne(ApplicationEntity, {
        where: { id: participation.applicationId },
      });
      if (!app) {
        throw new NotFoundException("Linked application not found");
      }

      let isTimeBased = true;
      let maxAllowedHours = 0;

      if (app.opportunityId) {
        const opp = await qr.manager.findOne(OpportunityEntity, {
          where: { id: app.opportunityId },
        });
        if (!opp) {
          throw new NotFoundException("Linked opportunity not found");
        }
        isTimeBased = opp.isTimeBased;
        maxAllowedHours =
          (opp.endsAt.getTime() - opp.startsAt.getTime()) / MS_PER_HOUR;
      } else if (app.requestId) {
        const reqEntity = await qr.manager.findOne(CommunityRequestEntity, {
          where: { id: app.requestId },
        });
        if (!reqEntity) {
          throw new NotFoundException("Linked community request not found");
        }
        isTimeBased = reqEntity.isTimeBased;
        const scheduleDurationHours =
          (reqEntity.endsAt.getTime() - reqEntity.startsAt.getTime()) /
          MS_PER_HOUR;
        const elapsedSinceAcceptedHours =
          (Date.now() - participation.acceptedAt.getTime()) / MS_PER_HOUR;
        maxAllowedHours = Math.max(
          scheduleDurationHours,
          elapsedSinceAcceptedHours,
        );
      }

      if (!isTimeBased) {
        if (dto.proposedHours !== undefined && dto.proposedHours !== null) {
          throw new BadRequestException(
            "Non-time-based activities cannot record proposedHours",
          );
        }
        participation.proposedHours = null;
      } else {
        if (dto.proposedHours === undefined || dto.proposedHours <= 0) {
          throw new BadRequestException(
            "proposedHours (> 0) is required for time-based activities",
          );
        }
        if (dto.proposedHours > maxAllowedHours) {
          throw new BadRequestException(
            `proposedHours (${dto.proposedHours}) cannot exceed the maximum activity duration (${maxAllowedHours.toFixed(2)} hours)`,
          );
        }
        participation.proposedHours = dto.proposedHours.toFixed(2);
      }

      participation.completionNote = dto.completionNote;
      participation.completedAt = new Date();
      participation.status = "PENDING_VERIFICATION";

      const saved = await qr.manager.save(ParticipationEntity, participation);
      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(query: {
    volunteerId?: string;
    opportunityId?: string;
    requestId?: string;
    status?: ParticipationStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

    const qb = this.participationRepo
      .createQueryBuilder("p")
      .leftJoinAndSelect("p.application", "application")
      .orderBy("p.acceptedAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (query.volunteerId) {
      qb.andWhere("p.volunteerId = :volunteerId", {
        volunteerId: query.volunteerId,
      });
    }
    if (query.status) {
      qb.andWhere("p.status = :status", { status: query.status });
    }
    if (query.opportunityId) {
      qb.andWhere("application.opportunityId = :opportunityId", {
        opportunityId: query.opportunityId,
      });
    }
    if (query.requestId) {
      qb.andWhere("application.requestId = :requestId", {
        requestId: query.requestId,
      });
    }

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<ParticipationEntity> {
    const participation = await this.participationRepo.findOne({
      where: { id },
      relations: ["application"],
    });
    if (!participation) {
      throw new NotFoundException("Participation record not found");
    }
    return participation;
  }
}