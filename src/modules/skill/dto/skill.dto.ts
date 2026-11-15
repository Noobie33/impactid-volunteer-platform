import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
 
export class CreateSkillDto {
  @ApiProperty({ example: "Community Coordination" })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(100)
  name!: string;
}
 
export class UpdateSkillDto {
  @ApiPropertyOptional({ example: "Event & Community Coordination" })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;
}