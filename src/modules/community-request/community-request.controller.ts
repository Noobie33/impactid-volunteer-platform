import {
  Body,
  Controller,
  Delete,
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
import { CommunityRequestService } from "./community-request.service";
import {
  CreateCommunityRequestDto,
  UpdateCommunityRequestDto,
} from "./dto/community-request.dto";
import type { CommunityRequestStatus } from "./entities/community-request.entity";

@ApiTags("Community Requests")
@Controller("community-requests")
export class CommunityRequestController {
  constructor(
    private readonly communityRequestService: CommunityRequestService,
  ) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.VOLUNTEER, Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a community help request (Volunteer or Admin)",
  })
  create(@CurrentUser() user: any, @Body() dto: CreateCommunityRequestDto) {
    const userId = user.user_id ?? user.id;
    return this.communityRequestService.create(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List and search community help requests with pagination",
  })
  findAll(
    @Query("search") search?: string,
    @Query("causeId") causeId?: string,
    @Query("date") date?: string,
    @Query("status") status?: CommunityRequestStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    return this.communityRequestService.findAll({
      search,
      causeId,
      date,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a community request by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.communityRequestService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Update or close a community request (Requester or Admin)",
  })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateCommunityRequestDto,
  ) {
    const userId = user.user_id ?? user.id;
    return this.communityRequestService.update(id, userId, user.role, dto);
  }

  @Delete(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Soft-delete a community request (Requester or Admin)",
  })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const userId = user.user_id ?? user.id;
    return this.communityRequestService.remove(id, userId, user.role);
  }
}