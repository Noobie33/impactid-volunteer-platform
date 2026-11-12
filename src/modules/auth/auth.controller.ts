import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
  ValidationPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtGuard } from "@/common/guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { AuthService } from "./auth.service";
import { AuthDto, RegisterDto } from "./dto/auth.dto";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post("register")
  @ApiOperation({ summary: "Register a new Volunteer or Organization account" })
  register(@Body(new ValidationPipe({ whitelist: true })) dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({ summary: "Login with email and password" })
  login(@Body(new ValidationPipe({ whitelist: true })) dto: AuthDto) {
    return this.authService.signIn(dto);
  }

  @Get("me")
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current authenticated user info" })
  getMe(@CurrentUser() user: any) {
    return user;
  }
}