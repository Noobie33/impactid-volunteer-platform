import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { Role } from "@/common/enums/role.enum";

export type UserStatus = "ACTIVE" | "SUSPENDED";

@Entity({ name: "users" })
export class UserEntity {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255, unique: true })
  email!: string;

  // Login queries must explicitly select this field; never include it in API output.
  @Column({
    name: "password_hash",
    type: "varchar",
    length: 255,
    select: false,
  })
  passwordHash!: string;

  @Column({ type: "varchar", length: 32 })
  role!: Role;

  @Column({ type: "varchar", length: 20, default: "ACTIVE" })
  status!: UserStatus;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
