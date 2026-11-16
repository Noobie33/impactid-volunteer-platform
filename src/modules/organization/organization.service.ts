import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import {
  OrganizationEntity,
  type OrganizationApprovalStatus,
} from "./entities/organization.entity";
import {
  CreateOrganizationDto,
  UpdateOrganizationApprovalDto,
  UpdateOrganizationDto,
} from "./dto/organization.dto";
import { Role } from "@/common/enums/role.enum";

@Injectable()
export class OrganizationService {
  constructor(
    @InjectRepository(OrganizationEntity)
    private readonly organizationRepo: Repository<OrganizationEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    ownerUserId: string,
    dto: CreateOrganizationDto,
  ): Promise<OrganizationEntity> {
    const org = this.organizationRepo.create({
      ownerUserId,
      name: dto.name,
      description: dto.description,
      approvalStatus: "PENDING",
    });
    return this.organizationRepo.save(org);
  }

  async findAll(status?: OrganizationApprovalStatus, page = 1, limit = 10) {
    const where = status ? { approvalStatus: status } : {};
    const [data, total] = await this.organizationRepo.findAndCount({
      where,
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<OrganizationEntity> {
    const org = await this.organizationRepo.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return org;
  }

  async update(
    id: string,
    actorId: string,
    actorRole: string,
    dto: UpdateOrganizationDto,
  ): Promise<OrganizationEntity> {
    const org = await this.findOne(id);
    if (org.ownerUserId !== actorId && actorRole !== Role.ADMINISTRATOR) {
      throw new ForbiddenException(
        "Only the organization owner or an administrator can update this organization",
      );
    }

    if (dto.name !== undefined) org.name = dto.name;
    if (dto.description !== undefined) org.description = dto.description;

    return this.organizationRepo.save(org);
  }

  async updateApprovalStatus(
    id: string,
    actorId: string,
    actorRole: string,
    dto: UpdateOrganizationApprovalDto,
  ): Promise<OrganizationEntity> {
    if (actorRole !== Role.ADMINISTRATOR) {
      throw new ForbiddenException(
        "Only an administrator can approve or reject organizations",
      );
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const org = await qr.manager.findOne(OrganizationEntity, {
        where: { id },
        lock: { mode: "pessimistic_write" },
      });
      if (!org) {
        throw new NotFoundException("Organization not found");
      }

      org.approvalStatus = dto.approvalStatus;
      org.approvedById = actorId;
      org.approvedAt = dto.approvalStatus === "APPROVED" ? new Date() : null;

      const saved = await qr.manager.save(OrganizationEntity, org);
      await qr.commitTransaction();
      return saved;
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
    const org = await this.findOne(id);
    if (org.ownerUserId !== actorId && actorRole !== Role.ADMINISTRATOR) {
      throw new ForbiddenException(
        "Only the organization owner or an administrator can delete this organization",
      );
    }

    await this.organizationRepo.softRemove(org);
    return { message: "Organization deleted successfully" };
  }
}