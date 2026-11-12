import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtGuard, RolesGuard } from "@/common/guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { Role } from "@/common/enums/role.enum";
import { UserService } from "./user.service";
import { UpdateProfileDto, UpdateUserStatusDto } from "./dto/user.dto";

@ApiTags("Users")
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller("users")
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get("me")
  @ApiOperation({ summary: "Get logged-in user and profile" })
  async getMe(@CurrentUser() currentUser: any) {
    const userId = currentUser.user_id ?? currentUser.id;
    const user = await this.userService.findOneById(userId);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  @Patch("me/profile")
  @ApiOperation({ summary: "Update display name, bio, and sharing settings" })
  async updateMyProfile(
    @CurrentUser() currentUser: any,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = currentUser.user_id ?? currentUser.id;
    return this.userService.updateProfile(userId, dto);
  }

  @Post("me/profile/rotate-token")
  @ApiOperation({ summary: "Rotate public share link token" })
  async rotateShareToken(@CurrentUser() currentUser: any) {
    const userId = currentUser.user_id ?? currentUser.id;
    return this.userService.rotateShareToken(userId);
  }

  @Get()
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: "List users with pagination (Admin only)" })
  async findAll(@Query("page") page = 1, @Query("limit") limit = 10) {
    return this.userService.findAll(Number(page), Number(limit));
  }

  @Get(":id")
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: "Get user by ID (Admin only)" })
  async findOne(@Param("id", ParseUUIDPipe) id: string) {
    const user = await this.userService.findOneById(id);
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  @Patch(":id/status")
  @Roles(Role.ADMINISTRATOR)
  @ApiOperation({ summary: "Suspend or reactivate a user account (Admin only)" })
  async updateStatus(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.updateStatus(id, dto.status);
  }
}