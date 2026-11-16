import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Role } from "@/common/enums/role.enum";

export class AuthDto {
  @ApiProperty({ example: "umme@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "Password@123" })
  @IsString()
  @IsNotEmpty()
  password!: string;
}

export class RegisterDto {
  @ApiProperty({ example: "Umme Fahmida" })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  displayName!: string;

  @ApiProperty({ example: "umme@example.com" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "Password@123" })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    enum: [Role.VOLUNTEER, Role.ORGANIZATION],
    default: Role.VOLUNTEER,
  })
  @IsOptional()
  @IsIn([Role.VOLUNTEER, Role.ORGANIZATION], {
    message: "Public registration only allows VOLUNTEER or ORGANIZATION roles",
  })
  role?: Role;
}