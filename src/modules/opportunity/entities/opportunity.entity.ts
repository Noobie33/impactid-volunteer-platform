import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { OrganizationEntity } from "@/modules/organization/entities/organization.entity";
import { CauseEntity } from "@/modules/cause/entities/cause.entity";
import { SkillEntity } from "@/modules/skill/entities/skill.entity";

export type OpportunityStatus = "OPEN" | "CLOSED" | "CANCELLED";

@Entity({ name: "opportunities" })
export class OpportunityEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "organization_id", type: "uuid" })
  organizationId!: string;

  @ManyToOne(() => OrganizationEntity, { nullable: false })
  @JoinColumn({ name: "organization_id" })
  organization!: OrganizationEntity;

  @Column({ name: "cause_id", type: "uuid" })
  causeId!: string;

  @ManyToOne(() => CauseEntity, { nullable: false })
  @JoinColumn({ name: "cause_id" })
  cause!: CauseEntity;

  // Maps the existing opportunity_skills join table; do not create a second table.
  @ManyToMany(() => SkillEntity)
  @JoinTable({
    name: "opportunity_skills",
    joinColumn: { name: "opportunity_id", referencedColumnName: "id" },
    inverseJoinColumn: { name: "skill_id", referencedColumnName: "id" },
  })
  skills!: SkillEntity[];

  @Column({ type: "varchar", length: 200 })
  title!: string;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 200, nullable: true })
  location!: string | null;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ name: "ends_at", type: "timestamptz" })
  endsAt!: Date;

  @Column({ type: "integer" })
  capacity!: number;

  @Column({ name: "is_time_based", type: "boolean", default: true })
  isTimeBased!: boolean;

  @Column({ type: "varchar", length: 20, default: "OPEN" })
  status!: OpportunityStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;

  @DeleteDateColumn({ name: "deleted_at", type: "timestamptz", nullable: true })
  deletedAt!: Date | null;
}
