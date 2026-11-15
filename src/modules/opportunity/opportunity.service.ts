import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, Repository } from "typeorm";
import {
  OpportunityEntity,
  type OpportunityStatus,
} from "./entities/opportunity.entity";
import { OrganizationEntity } from "@/modules/organization/entities/organization.entity";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";
import { SkillEntity } from "@/modules/skill/entities/skill.entity";
import { Role } from "@/common/enums/role.enum";
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from "./dto/opportunity.dto";

@Injectable()
export class OpportunityService {
  constructor(
    @InjectRepository(OpportunityEntity)
    private readonly opportunityRepo: Repository<OpportunityEntity>,
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepo: Repository<OrganizationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    actorId: string,
    actorRole: string,
    dto: CreateOpportunityDto,
  ): Promise<OpportunityEntity> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    const now = new Date();

    if (endsAt <= startsAt) {
      throw new BadRequestException("endsAt must be after startsAt");
    }
    if (startsAt < new Date(now.getTime() - 60_000)) {
      throw new BadRequestException(
        "Opportunity startsAt cannot be back-dated in the past",
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const org = await qr.manager.findOne(OrganizationEntity, {
        where: { id: dto.organizationId },
      });
      if (!org) {
        throw new NotFoundException("Organization not found");
      }
      if (org.ownerUserId !== actorId && actorRole !== Role.ADMINISTRATOR) {
        throw new ForbiddenException(
          "You can only create opportunities for your own organization",
        );
      }
      if (org.approvalStatus !== "APPROVED") {
        throw new ConflictException(
          "Organization must be APPROVED by an administrator before posting opportunities",
        );
      }

      const cause = await qr.manager.findOne(CauseEntity, {
        where: { id: dto.causeId },
      });
      if (!cause) {
        throw new NotFoundException("Cause not found");
      }

      let skills: SkillEntity[] = [];
      if (dto.skillIds && dto.skillIds.length > 0) {
        const uniqueSkillIds = [...new Set(dto.skillIds)];
        skills = await qr.manager.findBy(SkillEntity, {
          id: In(uniqueSkillIds),
        });
        if (skills.length !== uniqueSkillIds.length) {
          throw new NotFoundException("One or more skillIds were not found");
        }
      }

      const opportunity = qr.manager.create(OpportunityEntity, {
        organizationId: dto.organizationId,
        causeId: dto.causeId,
        title: dto.title,
        description: dto.description,
        location: dto.location ?? null,
        startsAt,
        endsAt,
        capacity: dto.capacity,
        isTimeBased: dto.isTimeBased ?? true,
        status: "OPEN",
        skills,
      });

      const saved = await qr.manager.save(OpportunityEntity, opportunity);
      await qr.commitTransaction();

      return this.findOne(saved.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findAll(query: {
    search?: string;
    causeId?: string;
    skillId?: string;
    organizationId?: string;
    date?: string;
    status?: OpportunityStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

    const qb = this.opportunityRepo
      .createQueryBuilder("opp")
      .leftJoinAndSelect("opp.organization", "organization")
      .leftJoinAndSelect("opp.cause", "cause")
      .leftJoinAndSelect("opp.skills", "skill")
      .orderBy("opp.startsAt", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere("opp.status = :status", { status: query.status });
    }
    if (query.causeId) {
      qb.andWhere("opp.causeId = :causeId", { causeId: query.causeId });
    }
    if (query.organizationId) {
      qb.andWhere("opp.organizationId = :organizationId", {
        organizationId: query.organizationId,
      });
    }
    if (query.skillId) {
      qb.andWhere("skill.id = :skillId", { skillId: query.skillId });
    }
    if (query.date) {
      qb.andWhere("DATE(opp.startsAt) = DATE(:date)", { date: query.date });
    }
    if (query.search) {
      qb.andWhere(
        "(opp.title ILIKE :search OR opp.description ILIKE :search OR opp.location ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<OpportunityEntity> {
    const opp = await this.opportunityRepo.findOne({
      where: { id },
      relations: ["organization", "cause", "skills"],
    });
    if (!opp) {
      throw new NotFoundException("Opportunity not found");
    }
    return opp;
  }

  async update(
    id: string,
    actorId: string,
    actorRole: string,
    dto: UpdateOpportunityDto,
  ): Promise<OpportunityEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const opp = await qr.manager.findOne(OpportunityEntity, {
        where: { id },
        relations: ["skills"],
        lock: { mode: "pessimistic_write" },
      });
      if (!opp) {
        throw new NotFoundException("Opportunity not found");
      }

      const org = await qr.manager.findOne(OrganizationEntity, {
        where: { id: opp.organizationId },
      });
      if (
        (!org || org.ownerUserId !== actorId) &&
        actorRole !== Role.ADMINISTRATOR
      ) {
        throw new ForbiddenException(
          "Only the organization owner or an administrator can update this opportunity",
        );
      }

      const newStartsAt = dto.startsAt
        ? new Date(dto.startsAt)
        : opp.startsAt;
      const newEndsAt = dto.endsAt ? new Date(dto.endsAt) : opp.endsAt;

      if (newEndsAt <= newStartsAt) {
        throw new BadRequestException("endsAt must be after startsAt");
      }

      if (dto.causeId !== undefined) {
        const cause = await qr.manager.findOne(CauseEntity, {
          where: { id: dto.causeId },
        });
        if (!cause) {
          throw new NotFoundException("Cause not found");
        }
        opp.causeId = dto.causeId;
      }

      if (dto.skillIds !== undefined) {
        const uniqueSkillIds = [...new Set(dto.skillIds)];
        const skills =
          uniqueSkillIds.length > 0
            ? await qr.manager.findBy(SkillEntity, { id: In(uniqueSkillIds) })
            : [];
        if (skills.length !== uniqueSkillIds.length) {
          throw new NotFoundException("One or more skillIds were not found");
        }
        opp.skills = skills;
      }

      if (dto.title !== undefined) opp.title = dto.title;
      if (dto.description !== undefined) opp.description = dto.description;
      if (dto.location !== undefined) opp.location = dto.location;
      if (dto.startsAt !== undefined) opp.startsAt = newStartsAt;
      if (dto.endsAt !== undefined) opp.endsAt = newEndsAt;
      if (dto.capacity !== undefined) opp.capacity = dto.capacity;
      if (dto.isTimeBased !== undefined) opp.isTimeBased = dto.isTimeBased;
      if (dto.status !== undefined) opp.status = dto.status;

      await qr.manager.save(OpportunityEntity, opp);
      await qr.commitTransaction();

      return this.findOne(id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async remove(
    id: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ message: string }> {
    const opp = await this.findOne(id);
    const org = await this.organizationRepo.findOne({
      where: { id: opp.organizationId },
    });

    if (
      (!org || org.ownerUserId !== actorId) &&
      actorRole !== Role.ADMINISTRATOR
    ) {
      throw new ForbiddenException(
        "Only the organization owner or an administrator can delete this opportunity",
      );
    }

    await this.opportunityRepo.softRemove(opp);
    return { message: "Opportunity deleted successfully" };
  }
}