import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { UserEntity } from "@/modules/user/entities/user.entity";

/** Append-only audit evidence. Never expose an update/delete endpoint. */
@Entity({ name: "audit_logs" })
export class AuditLogEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "actor_id", type: "uuid", nullable: true })
  actorId!: string | null;

  @ManyToOne(() => UserEntity, { nullable: true })
  @JoinColumn({ name: "actor_id" })
  actor!: UserEntity | null;

  @Column({ type: "varchar", length: 120 })
  action!: string;

  @Column({ name: "target_type", type: "varchar", length: 100 })
  targetType!: string;

  @Column({ name: "target_id", type: "uuid" })
  targetId!: string;

  @Column({ type: "text", nullable: true })
  reason!: string | null;

  @Column({ type: "jsonb", default: () => "'{}'::jsonb" })
  details!: Record<string, unknown>;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
