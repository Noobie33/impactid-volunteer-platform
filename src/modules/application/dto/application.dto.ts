import { IsIn, IsOptional, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateApplicationDto {
  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440010",
    description: "Provide either opportunityId OR requestId (not both)",
  })
  @IsOptional()
  @IsUUID()
  opportunityId?: string;

  @ApiPropertyOptional({
    example: "550e8400-e29b-41d4-a716-446655440020",
    description: "Provide either requestId OR opportunityId (not both)",
  })
  @IsOptional()
  @IsUUID()
  requestId?: string;
}

export class ReviewApplicationDto {
  @ApiProperty({ enum: ["ACCEPTED", "REJECTED"] })
  @IsIn(["ACCEPTED", "REJECTED"])
  status!: "ACCEPTED" | "REJECTED";
}