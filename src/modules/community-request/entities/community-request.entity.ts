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
import { CauseEntity } from "@/modules/cause/entities/cause.entity";

export type CommunityRequestStatus = "OPEN" | "CLOSED" | "CANCELLED";

@Entity({ name: "community_requests" })
export class CommunityRequestEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "requester_id", type: "uuid" })
  requesterId!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "requester_id" })
  requester!: UserEntity;

  @Column({ name: "cause_id", type: "uuid" })
  causeId!: string;

  @ManyToOne(() => CauseEntity, { nullable: false })
  @JoinColumn({ name: "cause_id" })
  cause!: CauseEntity;

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ name: "approximate_area", type: "varchar", length: 200 })
  approximateArea!: string;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ name: "ends_at", type: "timestamptz" })
  endsAt!: Date;

  @Column({ name: "is_time_based", type: "boolean", default: true })
  isTimeBased!: boolean;

  @Column({ type: "varchar", length: 20, default: "OPEN" })
  status!: CommunityRequestStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
