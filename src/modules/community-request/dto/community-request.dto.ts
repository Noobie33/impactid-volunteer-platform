import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { CommunityRequestStatus } from "../entities/community-request.entity";

export class CreateCommunityRequestDto {
  @ApiProperty({ example: "550e8400-e29b-41d4-a716-446655440001" })
  @IsUUID()
  @IsNotEmpty()
  causeId!: string;

  @ApiProperty({ example: "Emergency Math Tutoring for SSC Candidate" })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;

  @ApiProperty({
    example: "Need a volunteer for 3 hours of geometry revision this weekend.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  description!: string;

  @ApiProperty({
    example: "Mirpur 10, Dhaka (Approximate area only)",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  approximateArea!: string;

  @ApiProperty({ example: "2026-12-01T10:00:00.000Z" })
  @IsDateString()
  startsAt!: string;

  @ApiProperty({ example: "2026-12-01T13:00:00.000Z" })
  @IsDateString()
  endsAt!: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isTimeBased?: boolean;
}

export class UpdateCommunityRequestDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  causeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(10)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  approximateArea?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  startsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isTimeBased?: boolean;

  @ApiPropertyOptional({ enum: ["OPEN", "CLOSED", "CANCELLED"] })
  @IsOptional()
  @IsIn(["OPEN", "CLOSED", "CANCELLED"])
  status?: CommunityRequestStatus;
}