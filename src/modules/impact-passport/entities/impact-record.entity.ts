import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "@/modules/user/entities/user.entity";
import { VerificationEntity } from "@/modules/verification/entities/verification.entity";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";

export type ImpactSourceType =
  | "ORGANIZATION_VERIFIED"
  | "COMMUNITY_VERIFIED"
  | "SELF_REPORTED";
export type ImpactRecordStatus = "ACTIVE" | "REVOKED";
export type ImpactRecordVisibility = "PUBLIC" | "PRIVATE";

@Entity({ name: "impact_records" })
export class ImpactRecordEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "volunteer_id", type: "uuid" })
  volunteerId!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "volunteer_id" })
  volunteer!: UserEntity;

  @Column({
    name: "verification_id",
    type: "uuid",
    nullable: true,
    unique: true,
  })
  verificationId!: string | null;

  @OneToOne(() => VerificationEntity, { nullable: true })
  @JoinColumn({ name: "verification_id" })
  verification!: VerificationEntity | null;

  @Column({ name: "cause_id", type: "uuid", nullable: true })
  causeId!: string | null;

  @ManyToOne(() => CauseEntity, { nullable: true })
  @JoinColumn({ name: "cause_id" })
  cause!: CauseEntity | null;

  @Column({ name: "source_type", type: "varchar", length: 32 })
  sourceType!: ImpactSourceType;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  // DATE is returned as YYYY-MM-DD; avoid timezone conversion.
  @Column({ name: "activity_date", type: "date" })
  activityDate!: string;

  @Column({ type: "varchar", length: 20, default: "ACTIVE" })
  status!: ImpactRecordStatus;

  @Column({ type: "varchar", length: 20, default: "PRIVATE" })
  visibility!: ImpactRecordVisibility;

  @Column({
    name: "self_reported_hours",
    type: "numeric",
    precision: 8,
    scale: 2,
    nullable: true,
  })
  selfReportedHours!: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
