import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { UserStatus } from "../entities/user.entity";

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: "Umme Fahmida" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  displayName?: string;

  @ApiPropertyOptional({ example: "Community volunteer and organizer." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sharingEnabled?: boolean;
}

export class UpdateUserStatusDto {
  @ApiProperty({ enum: ["ACTIVE", "SUSPENDED"], example: "SUSPENDED" })
  @IsIn(["ACTIVE", "SUSPENDED"])
  status!: UserStatus;
}