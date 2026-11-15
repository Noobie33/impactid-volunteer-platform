import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { OpportunityStatus } from "../entities/opportunity.entity";

export class CreateOpportunityDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440000" })
  @IsUUID()
  @IsNotEmpty()
  organizationId!: string;

  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440001" })
  @IsUUID()
  @IsNotEmpty()
  causeId!: string;

  @ApiProperty({ example: "Weekend River Clean-Up Drive" })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: "Join us to clean the Buriganga riverbank and sort recyclable waste.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @ApiPropertyOptional({ example: "Sadarghat, Dhaka" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiProperty({ example: "2026-12-01T08:00:00.000Z" })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: "2026-12-01T14:00:00.000Z" })
  @IsDateString()
  endsAt!: string;

  @ApiProperty({ example: 25, minimum: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTimeBased?: boolean;

  @ApiPropertyOptional({
    type: [String],
    description: "Optional array of Skill UUIDs to tag on this opportunity",
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  skillIds?: string[];
}

export class UpdateOpportunityDto {
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440001" })
  @IsOptional()
  @IsUUID()
  causeId?: string;

  @ApiPropertyOptional({ example: "Updated River Clean-Up Drive" })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ example: "Updated activity details and schedule." })
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional({ example: "Dhanmondi Lake, Dhaka" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @ApiPropertyOptional({ example: "2026-12-02T08:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional({ example: "2026-12-02T14:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional({ example: 30, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTimeBased?: boolean;

  @ApiPropertyOptional({ enum: ["OPEN", "CLOSED", "CANCELLED"] })
  @IsOptional()
  @IsIn(["OPEN", "CLOSED", "CANCELLED"])
  status?: OpportunityStatus;

  @ApiPropertyOptional({
    type: [String],
    description: "Replace skill tags with this list of Skill UUIDs",
  })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  skillIds?: string[];
}