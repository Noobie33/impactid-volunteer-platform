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
import { OrganizationService } from "./organization.service";
import {
  CreateOrganizationDto,
  UpdateOrganizationApprovalDto,
  UpdateOrganizationDto,
} from "./dto/organization.dto";
import type { OrganizationApprovalStatus } from "./entities/organization.entity";

@ApiTags("Organizations")
@Controller("organizations")
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ORGANIZATION, Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create an organization (starts as Pending)" })
  create(@CurrentUser() user: any, @Body() dto: CreateOrganizationDto) {
    const userId = user.user_id ?? user.id;
    return this.organizationService.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List all organizations with pagination" })
  findAll(
    @Query("status") status?: OrganizationApprovalStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    return this.organizationService.findAll(
      status,
      Number(page),
      Number(limit),
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get organization by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.organizationService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ORGANIZATION, Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update organization details (Owner or Admin)" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateOrganizationDto,
  ) {
    const userId = user.user_id ?? user.id;
    return this.organizationService.update(id, userId, user.role, dto);
  }

  @Patch(":id/approval")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Approve or reject an organization (Admin only)" })
  updateApproval(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateOrganizationApprovalDto,
  ) {
    const userId = user.user_id ?? user.id;
    return this.organizationService.updateApprovalStatus(
      id,
      userId,
      user.role,
      dto,
    );
  }

  @Delete(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ORGANIZATION, Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete organization (Owner or Admin)" })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const userId = user.user_id ?? user.id;
    return this.organizationService.remove(id, userId, user.role);
  }
}