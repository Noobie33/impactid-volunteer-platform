import { IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
 
export class CreateCauseDto {

  @ApiProperty({ example: "Environment & Climate Action" })

  @IsString()

  @IsNotEmpty()

  @MinLength(2)

  @MaxLength(100)

  name!: string;

}
 
export class UpdateCauseDto {

  @ApiPropertyOptional({ example: "Environmental Conservation" })

  @IsOptional()

  @IsString()

  @MinLength(2)

  @MaxLength(100)

  name?: string;

}
 