import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ParticipationEntity } from "@/modules/participation/entities/participation.entity";
import { UserEntity } from "@/modules/user/entities/user.entity";

export type FraudFlagStatus = "OPEN" | "DISMISSED" | "CONFIRMED";

@Entity({ name: "fraud_flags" })
export class FraudFlagEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "participation_id", type: "uuid" })
  participationId!: string;

  @ManyToOne(() => ParticipationEntity, { nullable: false })
  @JoinColumn({ name: "participation_id" })
  participation!: ParticipationEntity;

  @Column({ name: "rule_code", type: "varchar", length: 80 })
  ruleCode!: string;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  details!: Record<string, unknown>;

  @Column({ type: "varchar", length: 20, default: "OPEN" })
  status!: FraudFlagStatus;

  @Column({ name: "reviewed_by", type: "uuid", nullable: true })
  reviewedById!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "reviewed_by" })
  reviewer!: UserEntity | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @Column({ name: "reviewed_at", type: "timestamptz", nullable: true })
  reviewedAt!: Date | null;
}
