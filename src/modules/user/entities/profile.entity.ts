import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserEntity } from "@/modules/user/entities/user.entity";

@Entity({ name: "profiles" })
export class ProfileEntity {
  @PrimaryColumn({ name: "user_id", type: "uuid" })
  userId!: string;

  @OneToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id", referencedColumnName: "id" })
  user!: UserEntity;

  @Column({ name: "display_name", type: "varchar", length: 150 })
  displayName!: string;

  @Column({ type: "text", nullable: true })
  bio!: string | null;

  @Column({ name: "sharing_enabled", type: "boolean", default: false })
  sharingEnabled!: boolean;

  @Column({
    name: "share_token",
    type: "uuid",
    unique: true,
    default: () => "gen_random_uuid()",
  })
  shareToken!: string;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
