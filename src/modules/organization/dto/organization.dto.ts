import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { OrganizationApprovalStatus } from "../entities/organization.entity";

export class CreateOrganizationDto {
  @ApiProperty({ example: "Green Earth Bangladesh" })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: "Youth-led environmental organization organizing river clean-ups.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;
}

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ example: "Green Earth Foundation BD" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({
    example: "Updated description of environmental initiatives.",
  })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;
}

export class UpdateOrganizationApprovalDto {
  @ApiProperty({
    enum: ["APPROVED", "REJECTED"],
    example: "APPROVED",
  })
  @IsIn(["APPROVED", "REJECTED"])
  approvalStatus!: OrganizationApprovalStatus;
}