import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { SkillEntity } from "./entities/skill.entity";
import { CreateSkillDto, UpdateSkillDto } from "./dto/skill.dto";
 
@Injectable()
export class SkillService {
  constructor(
    @InjectRepository(SkillEntity)
    private readonly skillRepo: Repository<SkillEntity>,
    private readonly dataSource: DataSource,
  ) {}
 
  async create(dto: CreateSkillDto): Promise<SkillEntity> {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
 
    try {
      const existing = await qr.manager
        .createQueryBuilder(SkillEntity, "skill")
        .where("LOWER(skill.name) = LOWER(:name)", { name: dto.name.trim() })
        .getOne();
 
      if (existing) {
        throw new ConflictException(`Skill "${dto.name}" already exists`);
      }
 
      const skill = qr.manager.create(SkillEntity, {
        name: dto.name.trim(),
      });
      const saved = await qr.manager.save(SkillEntity, skill);
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
 
    const qb = this.skillRepo
      .createQueryBuilder("skill")
      .orderBy("skill.name", "ASC")
      .skip((safePage - 1) * safeLimit)
      .take(safeLimit);
 
    if (search) {
      qb.andWhere("skill.name ILIKE :search", { search: `%${search}%` });
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
 
  async findOne(id: string): Promise<SkillEntity> {
    const skill = await this.skillRepo.findOne({ where: { id } });
    if (!skill) {
      throw new NotFoundException("Skill not found");
    }
    return skill;
  }
 
  async update(id: string, dto: UpdateSkillDto): Promise<SkillEntity> {
    const skill = await this.findOne(id);
 
    if (dto.name !== undefined) {
      const trimmed = dto.name.trim();
      const duplicate = await this.skillRepo
        .createQueryBuilder("skill")
        .where("LOWER(skill.name) = LOWER(:name)", { name: trimmed })
        .andWhere("skill.id != :id", { id })
        .getOne();
 
      if (duplicate) {
        throw new ConflictException(`Skill "${trimmed}" already exists`);
      }
      skill.name = trimmed;
    }
 
    return this.skillRepo.save(skill);
  }
 
  async remove(id: string): Promise<{ message: string }> {
    const skill = await this.findOne(id);
    try {
      await this.skillRepo.remove(skill);
      return { message: "Skill deleted successfully" };
    } catch {
      throw new ConflictException(
        "Cannot delete this skill because it is currently tagged on opportunities",
      );
    }
  }
}