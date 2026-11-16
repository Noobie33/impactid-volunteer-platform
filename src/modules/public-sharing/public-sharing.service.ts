import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { randomUUID } from "crypto";
import { ProfileEntity } from "@/modules/user/entities/profile.entity";
import { ImpactRecordEntity } from "@/modules/impact-passport/entities/impact-record.entity";
import { VerificationEntity } from "@/modules/verification/entities/verification.entity";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import {
  UpdateRecordVisibilityDto,
  UpdateSharingSettingsDto,
} from "./dto/public-sharing.dto";
 
@Injectable()
export class PublicSharingService {
  constructor(
    @InjectRepository(ProfileEntity)
    private readonly profileRepo: Repository<ProfileEntity>,
    @InjectRepository(ImpactRecordEntity)
    private readonly recordRepo: Repository<ImpactRecordEntity>,
    private readonly dataSource: DataSource,
  ) {}
 
  private isOrgVerified(sourceType: string): boolean {
    return sourceType.toUpperCase().replace(/[\s-]+/g, "_") === "ORGANIZATION_VERIFIED";
  }
 
  private isCommunityVerified(sourceType: string): boolean {
    return sourceType.toUpperCase().replace(/[\s-]+/g, "_") === "COMMUNITY_VERIFIED";
  }
 
  private isSelfReported(sourceType: string): boolean {
    return sourceType.toUpperCase().replace(/[\s-]+/g, "_").startsWith("SELF_REPORTED");
  }
 
  private isActive(status: string): boolean {
    return status.toUpperCase() === "ACTIVE";
  }
 
  async getSharingSettings(userId: string) {
    const profile = await this.profileRepo.findOne({ where: { userId } });
    if (!profile) {
      throw new NotFoundException("Profile not found");
    }
 
    return {
      userId: profile.userId,
      displayName: profile.displayName,
      sharingEnabled: profile.sharingEnabled,
      shareToken: profile.shareToken,
      publicPassportPath: `/public-sharing/passport/${profile.shareToken}`,
    };
  }
 
  async updateSharingSettings(
    userId: string,
    dto: UpdateSharingSettingsDto,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
 
    try {
      const profile = await qr.manager.findOne(ProfileEntity, {
        where: { userId },
        lock: { mode: "pessimistic_write" },
      });
      if (!profile) {
        throw new NotFoundException("Profile not found");
      }
 
      profile.sharingEnabled = dto.sharingEnabled;
      const saved = await qr.manager.save(ProfileEntity, profile);
      await qr.commitTransaction();
 
      return {
        userId: saved.userId,
        displayName: saved.displayName,
        sharingEnabled: saved.sharingEnabled,
        shareToken: saved.shareToken,
        publicPassportPath: `/public-sharing/passport/${saved.shareToken}`,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
 
  async rotateShareToken(userId: string) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
 
    try {
      const profile = await qr.manager.findOne(ProfileEntity, {
        where: { userId },
        lock: { mode: "pessimistic_write" },
      });
      if (!profile) {
        throw new NotFoundException("Profile not found");
      }
 
      profile.shareToken = randomUUID();
      const saved = await qr.manager.save(ProfileEntity, profile);
      await qr.commitTransaction();
 
      return {
        userId: saved.userId,
        sharingEnabled: saved.sharingEnabled,
        shareToken: saved.shareToken,
        publicPassportPath: `/public-sharing/passport/${saved.shareToken}`,
      };
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
 
  async updateRecordVisibility(
    recordId: string,
    userId: string,
    dto: UpdateRecordVisibilityDto,
  ) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
 
    try {
      const record = await qr.manager.findOne(ImpactRecordEntity, {
        where: { id: recordId },
        lock: { mode: "pessimistic_write" },
      });
      if (!record) {
        throw new NotFoundException("Impact record not found");
      }
      if (record.volunteerId !== userId) {
        throw new ForbiddenException(
          "You can only change visibility on your own impact records",
        );
      }
 
      record.visibility = dto.visibility;
      const saved = await qr.manager.save(ImpactRecordEntity, record);
      await qr.commitTransaction();
      return saved;
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }
  }
 
  /**
   * Public read-only verification view (no account needed).
   * Reveals nothing if sharing is disabled, hides PRIVATE records,
   * and recalculates visible totals on the server from PUBLIC + ACTIVE verified records only.
   */
  async getPublicPassportByToken(shareToken: string) {
    const profile = await this.profileRepo.findOne({
      where: { shareToken },
    });
 
    if (!profile || !profile.sharingEnabled) {
      throw new NotFoundException(
        "Public Impact Passport is unavailable or sharing has been disabled",
      );
    }
 
    const publicRecords = await this.recordRepo.find({
      where: {
        volunteerId: profile.userId,
        visibility: "PUBLIC" as ImpactRecordEntity["visibility"],
      },
      relations: ["cause", "verification"],
      order: { activityDate: "DESC", createdAt: "DESC" },
    });
 
    let visibleVerifiedActivityCount = 0;
    let visibleOrganizationVerifiedHours = 0;
    let visibleCommunityVerifiedHours = 0;
 
    const causesMap = new Map<string, { id: string; name: string; count: number }>();
    const skillsMap = new Map<string, { id: string; name: string }>();
 
    const visibleTimeline = await Promise.all(
      publicRecords.map(async (record) => {
        let confirmedHours = 0;
        let confirmingSource = "Self-Reported (Unverified)";
        let decisionReason: string | null = null;
        let skills: { id: string; name: string }[] = [];
 
        if (record.verificationId) {
          const verification =
            record.verification ??
            (await this.dataSource.manager.findOne(VerificationEntity, {
              where: { id: record.verificationId },
            }));
 
          if (verification?.confirmedHours) {
            confirmedHours = Number(verification.confirmedHours) || 0;
          }
          decisionReason = verification?.reason ?? null;
 
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
                }
                if (opp?.skills && opp.skills.length > 0) {
                  skills = opp.skills.map((s) => ({ id: s.id, name: s.name }));
                  if (this.isActive(record.status)) {
                    for (const s of opp.skills) {
                      skillsMap.set(s.id, { id: s.id, name: s.name });
                    }
                  }
                }
              } else if (app?.requestId) {
                // Never expose community requester personal contact details on public view
                confirmingSource = "Verified Community Requester";
              }
            }
          }
        }
 
        if (this.isActive(record.status)) {
          if (this.isOrgVerified(record.sourceType)) {
            visibleVerifiedActivityCount += 1;
            visibleOrganizationVerifiedHours += confirmedHours;
          } else if (this.isCommunityVerified(record.sourceType)) {
            visibleVerifiedActivityCount += 1;
            visibleCommunityVerifiedHours += confirmedHours;
          }
 
          if (!this.isSelfReported(record.sourceType) && record.cause) {
            const prev = causesMap.get(record.cause.id);
            causesMap.set(record.cause.id, {
              id: record.cause.id,
              name: record.cause.name,
              count: (prev?.count ?? 0) + 1,
            });
          }
        }
 
        return {
          id: record.id,
          title: record.title,
          activityDate: record.activityDate,
          verificationSource: record.sourceType,
          currentStatus: record.status,
          confirmingSource,
          confirmedHours:
            this.isActive(record.status) &&
            !this.isSelfReported(record.sourceType)
              ? Number(confirmedHours.toFixed(2))
              : null,
          selfReportedHours: this.isSelfReported(record.sourceType)
            ? record.selfReportedHours
              ? Number(record.selfReportedHours)
              : null
            : null,
          revocationOrDecisionNote:
            !this.isActive(record.status) ? decisionReason : null,
          cause: record.cause
            ? { id: record.cause.id, name: record.cause.name }
            : null,
          skills,
        };
      }),
    );
 
    return {
      volunteer: {
        displayName: profile.displayName,
        bio: profile.bio,
      },
      verifiedSummary: {
        visibleVerifiedActivityCount,
        organizationVerifiedHours: Number(
          visibleOrganizationVerifiedHours.toFixed(2),
        ),
        communityVerifiedHours: Number(
          visibleCommunityVerifiedHours.toFixed(2),
        ),
        totalVisibleVerifiedHours: Number(
          (
            visibleOrganizationVerifiedHours + visibleCommunityVerifiedHours
          ).toFixed(2),
        ),
      },
      causes: Array.from(causesMap.values()),
      skills: Array.from(skillsMap.values()),
      records: visibleTimeline,
    };
  }
}
