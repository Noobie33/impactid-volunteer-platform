import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsNumber,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from "class-validator";

export class ApproveVerificationDto {
  @ApiPropertyOptional({
    description:
      "Confirmed hours. Defaults to the submitted hours for time-based activities.",
  })
  @ValidateIf((_object, value) => value !== undefined)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999.99)
  confirmedHours?: number;
}

export class DecisionReasonDto {
  @ApiProperty({ example: "Completion could not be confirmed." })
  @IsString()
  @Matches(/\S/)
  @MaxLength(2000)
  reason!: string;
}

export class RejectVerificationDto extends DecisionReasonDto {}
export class RevokeVerificationDto extends DecisionReasonDto {}
