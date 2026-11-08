import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "@/modules/user/entities/user.entity";
import { OpportunityEntity } from "@/modules/opportunity/entities/opportunity.entity";
import { CommunityRequestEntity } from "@/modules/community-request/entities/community-request.entity";

export type ApplicationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "WITHDRAWN";

@Entity({ name: "applications" })
export class ApplicationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "volunteer_id", type: "uuid" })
  volunteerId!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "volunteer_id" })
  volunteer!: UserEntity;

  @Column({ name: "opportunity_id", type: "uuid", nullable: true })
  opportunityId!: string | null;

  @ManyToOne(() => OpportunityEntity, { nullable: true })
  @JoinColumn({ name: "opportunity_id" })
  opportunity!: OpportunityEntity | null;

  @Column({ name: "request_id", type: "uuid", nullable: true })
  requestId!: string | null;

  @ManyToOne(() => CommunityRequestEntity, { nullable: true })
  @JoinColumn({ name: "request_id" })
  request!: CommunityRequestEntity | null;

  @Column({ type: "varchar", length: 20, default: "PENDING" })
  status!: ApplicationStatus;

  @CreateDateColumn({ name: "applied_at", type: "timestamptz" })
  appliedAt!: Date;
}
