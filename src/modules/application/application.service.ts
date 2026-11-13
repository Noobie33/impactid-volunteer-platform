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
  ApplicationEntity,
  type ApplicationStatus,
} from "./entities/application.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { CommunityRequestEntity } from "@/modules/community-request/entities/community-request.entity";
import { OrganizationEntity } from "@/modules/organization/entities/organization.entity";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { Role } from "@/common/enums/role.enum";
import {
  CreateApplicationDto,
  ReviewApplicationDto,
} from "./dto/application.dto";

@Injectable()
export class ApplicationService {
  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly applicationRepo: Repository<ApplicationEntity>,
    @InjectRepository(OpportunityEntity)
    private readonly opportunityRepo: Repository<OpportunityEntity>,
    @InjectRepository(CommunityRequestEntity)
    private readonly requestRepo: Repository<CommunityRequestEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepo: Repository<OrganizationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async apply(
    volunteerId: string,
    dto: CreateApplicationDto,
  ): Promise<ApplicationEntity> {
    const hasOpportunity = Boolean(dto.opportunityId);
    const hasRequest = Boolean(dto.requestId);

    if (hasOpportunity === hasRequest) {
      throw new BadRequestException(
        "Application must target exactly one of opportunityId or requestId",
      );
    }

    if (dto.opportunityId) {
      const opp = await this.opportunityRepo.findOne({
        where: { id: dto.opportunityId },
      });
      if (!opp) {
        throw new NotFoundException("Opportunity not found");
      }
      if (opp.status !== "OPEN") {
        throw new ConflictException("Opportunity is not open for applications");
      }

      const org = await this.organizationRepo.findOne({
        where: { id: opp.organizationId },
      });
      if (org && org.ownerUserId === volunteerId) {
        throw new ForbiddenException(
          "You cannot apply as a volunteer to your own organization's opportunity",
        );
      }

      const existing = await this.applicationRepo.findOne({
        where: { volunteerId, opportunityId: dto.opportunityId },
      });
      if (existing) {
        throw new ConflictException(
          "You have already applied to this opportunity",
        );
      }

      const app = this.applicationRepo.create({
        volunteerId,
        opportunityId: dto.opportunityId,
        requestId: null,
        status: "PENDING",
      });
      return this.applicationRepo.save(app);
    }

    const request = await this.requestRepo.findOne({
      where: { id: dto.requestId },
    });
    if (!request) {
      throw new NotFoundException("Community request not found");
    }
    if (request.status !== "OPEN") {
      throw new ConflictException(
        "Community request is not open for applications",
      );
    }
    if (request.requesterId === volunteerId) {
      throw new ForbiddenException(
        "You cannot apply to your own community help request",
      );
    }

    const existing = await this.applicationRepo.findOne({
      where: { volunteerId, requestId: dto.requestId },
    });
    if (existing) {
      throw new ConflictException(
        "You have already offered help on this community request",
      );
    }

    const app = this.applicationRepo.create({
      volunteerId,
      opportunityId: null,
      requestId: dto.requestId!,
      status: "PENDING",
    });
    return this.applicationRepo.save(app);
  }

  async withdraw(
    id: string,
    volunteerId: string,
  ): Promise<ApplicationEntity> {
    const app = await this.findOne(id);
    if (app.volunteerId !== volunteerId) {
      throw new ForbiddenException(
        "You can only withdraw your own application",
      );
    }
    if (app.status !== "PENDING") {
      throw new ConflictException(
        "Only PENDING applications can be withdrawn",
      );
    }

    app.status = "WITHDRAWN";
    return this.applicationRepo.save(app);
  }

  async reviewApplication(
    id: string,
    actorId: string,
    actorRole: string,
    dto: ReviewApplicationDto,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const app = await qr.manager.findOne(ApplicationEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!app) {
        throw new NotFoundException("Application not found");
      }
      if (app.status !== "PENDING") {
        throw new ConflictException(
          `Application is already ${app.status} and cannot be reviewed again`,
        );
      }

      if (app.opportunityId) {
        const opp = await qr.manager.findOne(OpportunityEntity, {
          where: { id: app.opportunityId },
          lock: { mode: "pessimistic_write" },
        });
        if (!opp) {
          throw new NotFoundException("Target opportunity not found");
        }

        const org = await qr.manager.findOne(OrganizationEntity, {
          where: { id: opp.organizationId },
        });
        if (
          (!org || org.ownerUserId !== actorId) &&
          actorRole !== Role.ADMINISTRATOR
        ) {
          throw new ForbiddenException(
            "Only the organization owner or an administrator can review applications for this opportunity",
          );
        }

        if (dto.status === "ACCEPTED") {
          const acceptedCount = await qr.manager.count(ApplicationEntity, {
            where: {
              opportunityId: opp.id,
              status: "ACCEPTED",
            },
          });
          if (acceptedCount >= opp.capacity) {
            throw new ConflictException("Opportunity capacity has been reached");
          }
        }
      } else if (app.requestId) {
        const request = await qr.manager.findOne(CommunityRequestEntity, {
          where: { id: app.requestId },
          lock: { mode: "pessimistic_write" },
        });
        if (!request) {
          throw new NotFoundException("Target community request not found");
        }
        if (
          request.requesterId !== actorId &&
          actorRole !== Role.ADMINISTRATOR
        ) {
          throw new ForbiddenException(
            "Only the community requester or an administrator can review offers for this request",
          );
        }
      }

      app.status = dto.status;
      const savedApp = await qr.manager.save(ApplicationEntity, app);

      let participation: ParticipationEntity | null = null;
      if (dto.status === "ACCEPTED") {
        const newParticipation = qr.manager.create(ParticipationEntity, {
          applicationId: savedApp.id,
          volunteerId: savedApp.volunteerId,
          status: "ACCEPTED",
          acceptedAt: new Date(),
          completionNote: null,
          proposedHours: null,
          completedAt: null,
        });
        participation = await qr.manager.save(
          ParticipationEntity,
          newParticipation,
        );
      }

      await qr.commitTransaction();
      return {
        application: savedApp,
        participation,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(query: {
    opportunityId?: string;
    requestId?: string;
    volunteerId?: string;
    status?: ApplicationStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

    const where: Record<string, any> = {};
    if (query.opportunityId) where.opportunityId = query.opportunityId;
    if (query.requestId) where.requestId = query.requestId;
    if (query.volunteerId) where.volunteerId = query.volunteerId;
    if (query.status) where.status = query.status;

    const [data, total] = await this.applicationRepo.findAndCount({
      where,
      relations: ["opportunity", "request"],
      skip: (page - 1) * limit,
      take: limit,
      order: { appliedAt: "DESC" },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<ApplicationEntity> {
    const app = await this.applicationRepo.findOne({
      where: { id },
      relations: ["opportunity", "request"],
    });
    if (!app) {
      throw new NotFoundException("Application not found");
    }
    return app;
  }
}