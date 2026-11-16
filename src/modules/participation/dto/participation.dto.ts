import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class SubmitCompletionDto {
  @ApiProperty({
    example:
      "Completed 4 hours of riverbank waste collection and sorted 15 bags of plastic.",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  completionNote!: string;

  @ApiPropertyOptional({
    example: 4,
    description:
      "Required for time-based activities; must be omitted for non-time-based activities",
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0.25)
  proposedHours?: number;
}