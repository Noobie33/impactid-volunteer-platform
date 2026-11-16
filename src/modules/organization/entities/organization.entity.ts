import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "@/modules/user/entities/user.entity";

export type OrganizationApprovalStatus = "PENDING" | "APPROVED" | "REJECTED";

@Entity({ name: "organizations" })
export class OrganizationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "owner_user_id", type: "uuid" })
  ownerUserId!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "owner_user_id" })
  owner!: UserEntity;

  @Column({ type: "varchar", length: 200 })
  name!: string;

  @Column({ type: "text", nullable: true })
  description!: string | null;

  @Column({
    name: "approval_status",
    type: "varchar",
    length: 20,
    default: "PENDING",
  })
  approvalStatus!: OrganizationApprovalStatus;

  @Column({ name: "approved_by", type: "uuid", nullable: true })
  approvedById!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "approved_by" })
  approver!: UserEntity | null;

  @Column({ name: "approved_at", type: "timestamptz", nullable: true })
  approvedAt!: Date | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
