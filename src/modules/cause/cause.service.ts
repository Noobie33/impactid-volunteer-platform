import {

  ConflictException,

  Injectable,

  NotFoundException,

} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";

import { DataSource, Repository } from "typeorm";

import { CauseEntity } from "./entities/cause.entity";

import { CreateCauseDto, UpdateCauseDto } from "./dto/cause.dto";
 
@Injectable()

export class CauseService {

  constructor(

    @InjectRepository(CauseEntity)

    private readonly causeRepo: Repository<CauseEntity>,

    private readonly dataSource: DataSource,

  ) {}
 
  async create(dto: CreateCauseDto): Promise<CauseEntity> {

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();

    await qr.startTransaction();
 
    try {

      const existing = await qr.manager

        .createQueryBuilder(CauseEntity, "cause")

        .where("LOWER(cause.name) = LOWER(:name)", { name: dto.name.trim() })

        .getOne();
 
      if (existing) {

        throw new ConflictException(`Cause "${dto.name}" already exists`);

      }
 
      const cause = qr.manager.create(CauseEntity, {

        name: dto.name.trim(),

      });

      const saved = await qr.manager.save(CauseEntity, cause);

      await qr.commitTransaction();

      return saved;

    } catch (err) {

      await qr.rollbackTransaction();

      throw err;

    } finally {

      await qr.release();

    }

  }
 
  async findAll(search?: string, page = 1, limit = 20) {

    const safePage = Math.max(1, Number(page) || 1);

    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
 
    const qb = this.causeRepo

      .createQueryBuilder("cause")

      .orderBy("cause.name", "ASC")

      .skip((safePage - 1) * safeLimit)

      .take(safeLimit);
 
    if (search) {

      qb.andWhere("cause.name ILIKE :search", { search: `%${search}%` });

    }
 
    const [data, total] = await qb.getManyAndCount();

    return {

      data,

      meta: {

        total,

        page: safePage,

        limit: safeLimit,

        totalPages: Math.ceil(total / safeLimit),

      },

    };

  }
 
  async findOne(id: string): Promise<CauseEntity> {

    const cause = await this.causeRepo.findOne({ where: { id } });

    if (!cause) {

      throw new NotFoundException("Cause not found");

    }

    return cause;

  }
 
  async update(id: string, dto: UpdateCauseDto): Promise<CauseEntity> {

    const cause = await this.findOne(id);
 
    if (dto.name !== undefined) {

      const trimmed = dto.name.trim();

      const duplicate = await this.causeRepo

        .createQueryBuilder("cause")

        .where("LOWER(cause.name) = LOWER(:name)", { name: trimmed })

        .andWhere("cause.id != :id", { id })

        .getOne();
 
      if (duplicate) {

        throw new ConflictException(`Cause "${trimmed}" already exists`);

      }

      cause.name = trimmed;

    }
 
    return this.causeRepo.save(cause);

  }
 
  async remove(id: string): Promise<{ message: string }> {

    const cause = await this.findOne(id);

    try {

      await this.causeRepo.remove(cause);

      return { message: "Cause deleted successfully" };

    } catch {

      throw new ConflictException(

        "Cannot delete this cause because it is currently referenced by opportunities, requests, or impact records",

      );

    }

  }

}
 