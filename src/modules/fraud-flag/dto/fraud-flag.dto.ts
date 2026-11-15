import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";
export class ReviewFraudFlagDto {
  @ApiProperty({ enum: ["DISMISSED", "CONFIRMED"] })
  @IsIn(["DISMISSED", "CONFIRMED"])
  status!: "DISMISSED" | "CONFIRMED";
}
