import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";
import type { UserStatus } from "@/modules/user/entities/user.entity";

export class OrganizationDecisionDto {
  @ApiPropertyOptional()
  @ValidateIf((_o, v) => v !== undefined)
  @IsString()
  @Matches(/\S/)
  @MaxLength(2000)
  reason?: string;
}
export class UpdateUserStatusDto {
  @ApiProperty({ enum: ["ACTIVE", "SUSPENDED"] })
  @IsIn(["ACTIVE", "SUSPENDED"])
  status!: UserStatus;
}
