import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { UserEntity } from "@/modules/user/entities/user.entity";

export type VerificationType = "ORGANIZATION" | "COMMUNITY";
export type VerificationStatus = "APPROVED" | "REJECTED" | "REVOKED";

@Entity({ name: "verifications" })
export class VerificationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "participation_id", type: "uuid", unique: true })
  participationId!: string;

  @OneToOne(() => ParticipationEntity, { nullable: false })
  @JoinColumn({ name: "participation_id" })
  participation!: ParticipationEntity;

  @Column({ name: "verifier_id", type: "uuid" })
  verifierId!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "verifier_id" })
  verifier!: UserEntity;

  @Column({ type: "varchar", length: 20 })
  type!: VerificationType;

  @Column({ type: "varchar", length: 20 })
  status!: VerificationStatus;

  @Column({
    name: "confirmed_hours",
    type: "numeric",
    precision: 8,
    scale: 2,
    nullable: true,
  })
  confirmedHours!: string | null;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @CreateDateColumn({ name: "decided_at", type: "timestamptz" })
  decidedAt!: Date;
}
