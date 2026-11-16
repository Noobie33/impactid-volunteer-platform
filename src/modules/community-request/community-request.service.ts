import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import {
  CommunityRequestEntity,
  type CommunityRequestStatus,
} from "./entities/community-request.entity";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";
import { Role } from "@/common/enums/role.enum";
import {
  CreateCommunityRequestDto,
  UpdateCommunityRequestDto,
} from "./dto/community-request.dto";

@Injectable()
export class CommunityRequestService {
  constructor(
    @InjectRepository(CommunityRequestEntity)
    private readonly requestRepo: Repository<CommunityRequestEntity>,
    @InjectRepository(CauseEntity)
    private readonly causeRepo: Repository<CauseEntity>,
  ) {}

  async create(
    requesterId: string,
    dto: CreateCommunityRequestDto,
  ): Promise<CommunityRequestEntity> {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (endsAt <= startsAt) {
      throw new BadRequestException("endsAt must be after startsAt");
    }

    const cause = await this.causeRepo.findOne({
      where: { id: dto.causeId },
    });
    if (!cause) {
      throw new NotFoundException("Cause not found");
    }

    const reqEntity = this.requestRepo.create({
      requesterId,
      causeId: dto.causeId,
      title: dto.title,
      description: dto.description,
      approximateArea: dto.approximateArea,
      startsAt,
      endsAt,
      isTimeBased: dto.isTimeBased ?? true,
      status: "OPEN",
    });

    const saved = await this.requestRepo.save(reqEntity);
    return this.findOne(saved.id);
  }

  async findAll(query: {
    search?: string;
    causeId?: string;
    date?: string;
    status?: CommunityRequestStatus;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));

    const qb = this.requestRepo
      .createQueryBuilder("req")
      .leftJoinAndSelect("req.cause", "cause")
      .orderBy("req.createdAt", "DESC")
      .skip((page - 1) * limit)
      .take(limit);

    if (query.status) {
      qb.andWhere("req.status = :status", { status: query.status });
    }
    if (query.causeId) {
      qb.andWhere("req.causeId = :causeId", { causeId: query.causeId });
    }
    if (query.date) {
      qb.andWhere("DATE(req.startsAt) = DATE(:date)", { date: query.date });
    }
    if (query.search) {
      qb.andWhere(
        "(req.title ILIKE :search OR req.description ILIKE :search OR req.approximateArea ILIKE :search)",
        { search: `%${query.search}%` },
      );
    }

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: string): Promise<CommunityRequestEntity> {
    const request = await this.requestRepo.findOne({
      where: { id },
      relations: ["cause"],
    });
    if (!request) {
      throw new NotFoundException("Community request not found");
    }
    return request;
  }

  async update(
    id: string,
    actorId: string,
    actorRole: string,
    dto: UpdateCommunityRequestDto,
  ): Promise<CommunityRequestEntity> {
    const request = await this.findOne(id);
    if (
      request.requesterId !== actorId &&
      actorRole !== Role.ADMINISTRATOR
    ) {
      throw new ForbiddenException(
        "Only the original requester or an administrator can update this request",
      );
    }

    const newStartsAt = dto.startsAt
      ? new Date(dto.startsAt)
      : request.startsAt;
    const newEndsAt = dto.endsAt ? new Date(dto.endsAt) : request.endsAt;

    if (newEndsAt <= newStartsAt) {
      throw new BadRequestException("endsAt must be after startsAt");
    }

    if (dto.causeId !== undefined) {
      const cause = await this.causeRepo.findOne({
        where: { id: dto.causeId },
      });
      if (!cause) {
        throw new NotFoundException("Cause not found");
      }
      request.causeId = dto.causeId;
    }

    if (dto.title !== undefined) request.title = dto.title;
    if (dto.description !== undefined) request.description = dto.description;
    if (dto.approximateArea !== undefined)
      request.approximateArea = dto.approximateArea;
    if (dto.startsAt !== undefined) request.startsAt = newStartsAt;
    if (dto.endsAt !== undefined) request.endsAt = newEndsAt;
    if (dto.isTimeBased !== undefined) request.isTimeBased = dto.isTimeBased;
    if (dto.status !== undefined) request.status = dto.status;

    await this.requestRepo.save(request);
    return this.findOne(id);
  }

  async remove(
    id: string,
    actorId: string,
    actorRole: string,
  ): Promise<{ message: string }> {
    const request = await this.findOne(id);
    if (
      request.requesterId !== actorId &&
      actorRole !== Role.ADMINISTRATOR
    ) {
      throw new ForbiddenException(
        "Only the original requester or an administrator can delete this request",
      );
    }

    await this.requestRepo.softRemove(request);
    return { message: "Community request deleted successfully" };
  }
}