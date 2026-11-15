import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { randomUUID } from "crypto";
import { UserEntity, type UserStatus } from "./entities/user.entity";
import { ProfileEntity } from "./entities/profile.entity";
import { Role } from "@/common/enums/role.enum";
import { UpdateProfileDto } from "./dto/user.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(ProfileEntity)
    private readonly profileRepository: Repository<ProfileEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async createUserWithProfile(data: {
    email: string;
    passwordHash: string;
    displayName: string;
    role?: Role;
  }) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const existing = await qr.manager.findOne(UserEntity, {
        where: { email: data.email },
      });
      if (existing) {
        throw new ConflictException("Email already exists");
      }

      const user = qr.manager.create(UserEntity, {
        email: data.email,
        passwordHash: data.passwordHash,
        role: data.role || Role.VOLUNTEER,
        status: "ACTIVE",
      });
      const savedUser = await qr.manager.save(UserEntity, user);

      const profile = qr.manager.create(ProfileEntity, {
        userId: savedUser.id,
        displayName: data.displayName,
        bio: null,
        shareToken: randomUUID(),
        sharingEnabled: false,
      });
      await qr.manager.save(ProfileEntity, profile);

      await qr.commitTransaction();
      return this.findOneById(savedUser.id);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }

  async findOneByEmail(
    email: string,
  ): Promise<(UserEntity & { profile?: ProfileEntity | null }) | null> {
    const user = await this.userRepository
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email })
      .getOne();

    if (!user) {
      return null;
    }

    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });

    return Object.assign(user, { profile });
  }

  async findOneById(
    id: string,
  ): Promise<UserEntity & { profile?: ProfileEntity | null }> {
    const user = await this.userRepository.findOne({
      where: { id },
    });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    const profile = await this.profileRepository.findOne({
      where: { userId: user.id },
    });
    return Object.assign(user, { profile });
  }

  async getProfile(userId: string): Promise<ProfileEntity> {
    const profile = await this.profileRepository.findOne({
      where: { userId },
    });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
    return profile;
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
  ): Promise<ProfileEntity> {
    const profile = await this.getProfile(userId);

    if (dto.displayName !== undefined) profile.displayName = dto.displayName;
    if (dto.bio !== undefined) profile.bio = dto.bio;
    if (dto.sharingEnabled !== undefined)
      profile.sharingEnabled = dto.sharingEnabled;

    return this.profileRepository.save(profile);
  }

  async rotateShareToken(userId: string): Promise<ProfileEntity> {
    const profile = await this.getProfile(userId);
    profile.shareToken = randomUUID();
    return this.profileRepository.save(profile);
  }

  async findAll(page = 1, limit = 10) {
    const [users, total] = await this.userRepository.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: "DESC" },
    });

    const data = await Promise.all(
      users.map(async (user) => {
        const profile = await this.profileRepository.findOne({
          where: { userId: user.id },
        });
        const { passwordHash, ...safeUser } = user;
        return { ...safeUser, profile };
      }),
    );

    return {
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async updateStatus(id: string, status: UserStatus) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException("User not found");
    }
    user.status = status;
    const saved = await this.userRepository.save(user);
    const { passwordHash, ...safeUser } = saved;
    return safeUser;
  }
}