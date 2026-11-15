import {

  BadRequestException,

  ForbiddenException,

  Injectable,

  NotFoundException,

} from "@nestjs/common";

import { InjectRepository } from "@nestjs/typeorm";

import { DataSource, Repository } from "typeorm";

import { ImpactRecordEntity } from "./entities/impact-record.entity";

import { VerificationEntity } from "@/modules/verification/entities/verification.entity";

import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";

import { ApplicationEntity } from "@/modules/application/entities/application.entity";

import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";

import { CauseEntity } from "@/modules/cause/entities/cause.entity";

import { ProfileEntity } from "@/modules/user/entities/profile.entity";

import { Role } from "@/common/enums/role.enum";

import {

  CreateSelfReportedRecordDto,

  UpdateImpactRecordDto,

} from "./dto/impact-passport.dto";
 
@Injectable()

export class ImpactPassportService {

  constructor(

    @InjectRepository(ImpactRecordEntity)

    private readonly recordRepo: Repository<ImpactRecordEntity>,

    private readonly dataSource: DataSource,

  ) {}
 
  private isOrgVerified(sourceType: string): boolean {

    const norm = sourceType.toUpperCase().replace(/[\s-]+/g, "_");

    return norm === "ORGANIZATION_VERIFIED";

  }
 
  private isCommunityVerified(sourceType: string): boolean {

    const norm = sourceType.toUpperCase().replace(/[\s-]+/g, "_");

    return norm === "COMMUNITY_VERIFIED";

  }
 
  private isSelfReported(sourceType: string): boolean {

    const norm = sourceType.toUpperCase().replace(/[\s-]+/g, "_");

    return norm.startsWith("SELF_REPORTED");

  }
 
  private isActive(status: string): boolean {

    return status.toUpperCase() === "ACTIVE";

  }
 
  async getMyPassport(volunteerId: string) {

    const profile = await this.dataSource.manager.findOne(ProfileEntity, {

      where: { userId: volunteerId },

    });
 
    const records = await this.recordRepo.find({

      where: { volunteerId },

      relations: ["cause", "verification"],

      order: { activityDate: "DESC", createdAt: "DESC" },

    });
 
    let verifiedActivityCount = 0;

    let organizationVerifiedCount = 0;

    let communityVerifiedCount = 0;

    let selfReportedCount = 0;

    let revokedCount = 0;
 
    let organizationVerifiedHours = 0;

    let communityVerifiedHours = 0;

    let selfReportedHours = 0;
 
    const causesMap = new Map<string, { id: string; name: string; count: number }>();

    const organizationsMap = new Map<string, { id: string; name: string; verifiedCount: number }>();

    const skillsMap = new Map<string, { id: string; name: string }>();
 
    const timeline = await Promise.all(

      records.map(async (record) => {

        let confirmedHours = 0;

        let confirmingSource = "Self-Reported (Unverified)";

        let activitySkills: { id: string; name: string }[] = [];
 
        if (record.verificationId) {

          const verification =

            record.verification ??

            (await this.dataSource.manager.findOne(VerificationEntity, {

              where: { id: record.verificationId },

            }));
 
          if (verification?.confirmedHours) {

            confirmedHours = Number(verification.confirmedHours) || 0;

          }
 
          if (verification?.participationId) {

            const participation = await this.dataSource.manager.findOne(

              ParticipationEntity,

              { where: { id: verification.participationId } },

            );

            if (participation?.applicationId) {

              const app = await this.dataSource.manager.findOne(

                ApplicationEntity,

                { where: { id: participation.applicationId } },

              );

              if (app?.opportunityId) {

                const opp = await this.dataSource.manager.findOne(

                  OpportunityEntity,

                  {

                    where: { id: app.opportunityId },

                    relations: ["organization", "skills"],

                  },

                );

                if (opp?.organization) {

                  confirmingSource = opp.organization.name;

                  if (this.isActive(record.status)) {

                    const prev = organizationsMap.get(opp.organization.id);

                    organizationsMap.set(opp.organization.id, {

                      id: opp.organization.id,

                      name: opp.organization.name,

                      verifiedCount: (prev?.verifiedCount ?? 0) + 1,

                    });

                  }

                }

                if (opp?.skills && opp.skills.length > 0) {

                  activitySkills = opp.skills.map((s) => ({

                    id: s.id,

                    name: s.name,

                  }));

                  if (this.isActive(record.status)) {

                    for (const s of opp.skills) {

                      skillsMap.set(s.id, { id: s.id, name: s.name });

                    }

                  }

                }

              } else if (app?.requestId) {

                confirmingSource = "Community Requester";

              }

            }

          }

        }
 
        if (!this.isActive(record.status)) {

          revokedCount += 1;

        } else if (this.isOrgVerified(record.sourceType)) {

          verifiedActivityCount += 1;

          organizationVerifiedCount += 1;

          organizationVerifiedHours += confirmedHours;

        } else if (this.isCommunityVerified(record.sourceType)) {

          verifiedActivityCount += 1;

          communityVerifiedCount += 1;

          communityVerifiedHours += confirmedHours;

        } else {

          selfReportedCount += 1;

          selfReportedHours += Number(record.selfReportedHours) || 0;

        }
 
        if (

          this.isActive(record.status) &&

          !this.isSelfReported(record.sourceType) &&

          record.cause

        ) {

          const prevCause = causesMap.get(record.cause.id);

          causesMap.set(record.cause.id, {

            id: record.cause.id,

            name: record.cause.name,

            count: (prevCause?.count ?? 0) + 1,

          });

        }
 
        return {

          id: record.id,

          title: record.title,

          activityDate: record.activityDate,

          sourceType: record.sourceType,

          status: record.status,

          visibility: record.visibility,

          confirmedHours: !this.isSelfReported(record.sourceType)

            ? Number(confirmedHours.toFixed(2))

            : null,

          selfReportedHours: this.isSelfReported(record.sourceType)

            ? record.selfReportedHours

              ? Number(record.selfReportedHours)

              : null

            : null,

          confirmingSource,

          cause: record.cause

            ? { id: record.cause.id, name: record.cause.name }

            : null,

          skills: activitySkills,

          createdAt: record.createdAt,

        };

      }),

    );
 
    return {

      profile: profile

        ? {

            userId: profile.userId,

            displayName: profile.displayName,

            bio: profile.bio,

            sharingEnabled: profile.sharingEnabled,

            shareToken: profile.shareToken,

          }

        : null,

      summary: {

        verifiedActivityCount,

        organizationVerifiedCount,

        communityVerifiedCount,

        selfReportedCount,

        revokedCount,

        hoursBySource: {

          organizationVerifiedHours: Number(

            organizationVerifiedHours.toFixed(2),

          ),

          communityVerifiedHours: Number(communityVerifiedHours.toFixed(2)),

          totalVerifiedHours: Number(

            (organizationVerifiedHours + communityVerifiedHours).toFixed(2),

          ),

          selfReportedHoursUnverified: Number(selfReportedHours.toFixed(2)),

        },

      },

      causes: Array.from(causesMap.values()),

      organizations: Array.from(organizationsMap.values()),

      skills: Array.from(skillsMap.values()),

      timeline,

    };

  }
 
  async findAllForVolunteer(

    volunteerId: string,

    query: {

      sourceType?: string;

      status?: string;

      visibility?: string;

      causeId?: string;

      page?: number;

      limit?: number;

    },

  ) {

    const page = Math.max(1, Number(query.page) || 1);

    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
 
    const qb = this.recordRepo

      .createQueryBuilder("rec")

      .leftJoinAndSelect("rec.cause", "cause")

      .leftJoinAndSelect("rec.verification", "verification")

      .where("rec.volunteerId = :volunteerId", { volunteerId })

      .orderBy("rec.activityDate", "DESC")

      .skip((page - 1) * limit)

      .take(limit);
 
    if (query.sourceType) {

      qb.andWhere("rec.sourceType = :sourceType", {

        sourceType: query.sourceType,

      });

    }

    if (query.status) {

      qb.andWhere("rec.status = :status", { status: query.status });

    }

    if (query.visibility) {

      qb.andWhere("rec.visibility = :visibility", {

        visibility: query.visibility,

      });

    }

    if (query.causeId) {

      qb.andWhere("rec.causeId = :causeId", { causeId: query.causeId });

    }
 
    const [data, total] = await qb.getManyAndCount();

    return {

      data,

      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },

    };

  }
 
  async findOne(

    id: string,

    actorId: string,

    actorRole: string,

  ): Promise<ImpactRecordEntity> {

    const record = await this.recordRepo.findOne({

      where: { id },

      relations: ["cause", "verification"],

    });

    if (!record) {

      throw new NotFoundException("Impact record not found");

    }

    if (

      record.volunteerId !== actorId &&

      actorRole !== Role.ADMINISTRATOR

    ) {

      throw new ForbiddenException(

        "You can only view your own impact records",

      );

    }

    return record;

  }
 
  async createSelfReported(

    volunteerId: string,

    dto: CreateSelfReportedRecordDto,

  ): Promise<ImpactRecordEntity> {

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();

    await qr.startTransaction();
 
    try {

      if (dto.causeId) {

        const cause = await qr.manager.findOne(CauseEntity, {

          where: { id: dto.causeId },

        });

        if (!cause) {

          throw new NotFoundException("Cause not found");

        }

      }
 
      const record = qr.manager.create(ImpactRecordEntity, {

        volunteerId,

        verificationId: null,

        causeId: dto.causeId ?? null,

        sourceType: "SELF_REPORTED" as ImpactRecordEntity["sourceType"],

        title: dto.title.trim(),

        activityDate: dto.activityDate as any,

        status: "ACTIVE" as ImpactRecordEntity["status"],

        visibility: (dto.visibility ??

          "PRIVATE") as ImpactRecordEntity["visibility"],

        selfReportedHours:

          dto.selfReportedHours !== undefined

            ? dto.selfReportedHours.toFixed(2)

            : null,

      });
 
      const saved = await qr.manager.save(ImpactRecordEntity, record);

      await qr.commitTransaction();

      return this.findOne(saved.id, volunteerId, Role.VOLUNTEER);

    } catch (err) {

      await qr.rollbackTransaction();

      throw err;

    } finally {

      await qr.release();

    }

  }
 
  async updateRecord(

    id: string,

    actorId: string,

    actorRole: string,

    dto: UpdateImpactRecordDto,

  ): Promise<ImpactRecordEntity> {

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();

    await qr.startTransaction();
 
    try {

      const record = await qr.manager.findOne(ImpactRecordEntity, {

        where: { id },

        lock: { mode: "pessimistic_write" },

      });
 
      if (!record) {

        throw new NotFoundException("Impact record not found");

      }

      if (

        record.volunteerId !== actorId &&

        actorRole !== Role.ADMINISTRATOR

      ) {

        throw new ForbiddenException(

          "You can only update your own impact records",

        );

      }
 
      const isSelfRep = this.isSelfReported(record.sourceType);

      const attemptingContentEdit =

        dto.title !== undefined ||

        dto.activityDate !== undefined ||

        dto.causeId !== undefined ||

        dto.selfReportedHours !== undefined;
 
      if (!isSelfRep && attemptingContentEdit) {

        throw new BadRequestException(

          "Verified records cannot have their title, date, cause, or hours modified; only visibility (PUBLIC/PRIVATE) can be updated",

        );

      }
 
      if (dto.visibility !== undefined) {

        record.visibility = dto.visibility;

      }
 
      if (isSelfRep) {

        if (dto.causeId !== undefined) {

          const cause = await qr.manager.findOne(CauseEntity, {

            where: { id: dto.causeId },

          });

          if (!cause) {

            throw new NotFoundException("Cause not found");

          }

          record.causeId = dto.causeId;

        }

        if (dto.title !== undefined) record.title = dto.title.trim();

        if (dto.activityDate !== undefined)

          record.activityDate = dto.activityDate as any;

        if (dto.selfReportedHours !== undefined) {

          record.selfReportedHours = dto.selfReportedHours.toFixed(2);

        }

      }
 
      await qr.manager.save(ImpactRecordEntity, record);

      await qr.commitTransaction();

      return this.findOne(id, actorId, actorRole);

    } catch (err) {

      await qr.rollbackTransaction();

      throw err;

    } finally {

      await qr.release();

    }

  }
 
  async removeSelfReported(

    id: string,

    actorId: string,

    actorRole: string,

  ): Promise<{ message: string }> {

    const qr = this.dataSource.createQueryRunner();

    await qr.connect();

    await qr.startTransaction();
 
    try {

      const record = await qr.manager.findOne(ImpactRecordEntity, {

        where: { id },

        lock: { mode: "pessimistic_write" },

      });

      if (!record) {

        throw new NotFoundException("Impact record not found");

      }

      if (

        record.volunteerId !== actorId &&

        actorRole !== Role.ADMINISTRATOR

      ) {

        throw new ForbiddenException(

          "You can only delete your own self-reported records",

        );

      }

      if (!this.isSelfReported(record.sourceType)) {

        throw new ForbiddenException(

          "Verified impact records are permanent and cannot be deleted by a volunteer",

        );

      }
 
      await qr.manager.remove(ImpactRecordEntity, record);

      await qr.commitTransaction();

      return { message: "Self-reported record deleted successfully" };

    } catch (err) {

      await qr.rollbackTransaction();

      throw err;

    } finally {

      await qr.release();

    }

  }

}
 