import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { ApplicationEntity } from "@/modules/application/entities/application.entity";
import { UserEntity } from "@/modules/user/entities/user.entity";

export type ParticipationStatus =
  | "ACCEPTED"
  | "PENDING_VERIFICATION"
  | "VERIFIED"
  | "REJECTED"
  | "REVOKED";

@Entity({ name: "participations" })
export class ParticipationEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "application_id", type: "uuid", unique: true })
  applicationId!: string;

  @OneToOne(() => ApplicationEntity, { nullable: false })
  @JoinColumn({ name: "application_id" })
  application!: ApplicationEntity;

  @Column({ name: "volunteer_id", type: "uuid" })
  volunteerId!: string;

  @ManyToOne(() => UserEntity, { nullable: false })
  @JoinColumn({ name: "volunteer_id" })
  volunteer!: UserEntity;

  @Column({ type: "varchar", length: 30, default: "ACCEPTED" })
  status!: ParticipationStatus;

  @CreateDateColumn({ name: "accepted_at", type: "timestamptz" })
  acceptedAt!: Date;

  @Column({ name: "completion_note", type: "text", nullable: true })
  completionNote!: string | null;

  // pg returns numeric as a string; convert/validate explicitly when needed.
  @Column({
    name: "proposed_hours",
    type: "numeric",
    precision: 8,
    scale: 2,
    nullable: true,
  })
  proposedHours!: string | null;

  @Column({ name: "completed_at", type: "timestamptz", nullable: true })
  completedAt!: Date | null;
}
