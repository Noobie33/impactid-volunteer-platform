import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ImpactRecordEntity } from "../entities/impact-record.entity";
 
export class CreateSelfReportedRecordDto {
  @ApiProperty({ example: "Campus Winter Clothing Drive 2025" })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(200)
  title!: string;
 
  @ApiProperty({ example: "2025-12-15" })
  @IsDateString()
  activityDate!: string;
 
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440001" })
  @IsOptional()
  @IsUUID()
  causeId?: string;
 
  @ApiPropertyOptional({
    example: 5,
    description: "Optional self-reported hours (never counted in verified totals)",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  selfReportedHours?: number;
 
  @ApiPropertyOptional({ enum: ["PUBLIC", "PRIVATE"], default: "PRIVATE" })
  @IsOptional()
  @IsIn(["PUBLIC", "PRIVATE"])
  visibility?: ImpactRecordEntity["visibility"];
}
 
export class UpdateImpactRecordDto {
  @ApiPropertyOptional({ enum: ["PUBLIC", "PRIVATE"] })
  @IsOptional()
  @IsIn(["PUBLIC", "PRIVATE"])
  visibility?: ImpactRecordEntity["visibility"];
 
  @ApiPropertyOptional({
    example: "Updated Self-Reported Activity Title",
    description: "Editable only on SELF_REPORTED records",
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  title?: string;
 
  @ApiPropertyOptional({
    example: "2025-12-20",
    description: "Editable only on SELF_REPORTED records",
  })
  @IsOptional()
  @IsDateString()
  activityDate?: string;
 
  @ApiPropertyOptional({
    description: "Editable only on SELF_REPORTED records",
  })
  @IsOptional()
  @IsUUID()
  causeId?: string;
 
  @ApiPropertyOptional({
    example: 6,
    description: "Editable only on SELF_REPORTED records",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  selfReportedHours?: number;
}
