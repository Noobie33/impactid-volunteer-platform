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
import { ApplicationService } from "./application.service";
import {
  CreateApplicationDto,
  ReviewApplicationDto,
} from "./dto/application.dto";
import type { ApplicationStatus } from "./entities/application.entity";

@ApiTags("Applications")
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller("applications")
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @Roles(Role.VOLUNTEER, Role.ADMINISTRATOR)
  @ApiOperation({
    summary: "Apply to an opportunity or offer help on a community request",
  })
  apply(@CurrentUser() user: any, @Body() dto: CreateApplicationDto) {
    const userId = user.user_id ?? user.id;
    return this.applicationService.apply(userId, dto);
  }

  @Get("my")
  @ApiOperation({ summary: "List my own volunteer applications" })
  findMyApplications(
    @CurrentUser() user: any,
    @Query("status") status?: ApplicationStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    const userId = user.user_id ?? user.id;
    return this.applicationService.findAll({
      volunteerId: userId,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get()
  @ApiOperation({
    summary: "List applications filtered by opportunityId, requestId, or status",
  })
  findAll(
    @Query("opportunityId") opportunityId?: string,
    @Query("requestId") requestId?: string,
    @Query("status") status?: ApplicationStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    return this.applicationService.findAll({
      opportunityId,
      requestId,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get application details by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.applicationService.findOne(id);
  }

  @Patch(":id/withdraw")
  @ApiOperation({ summary: "Withdraw a pending application (Volunteer owner)" })
  withdraw(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const userId = user.user_id ?? user.id;
    return this.applicationService.withdraw(id, userId);
  }

  @Patch(":id/decision")
  @ApiOperation({
    summary:
      "Accept or reject an application inside a transaction (Organizer, Requester, or Admin)",
  })
  reviewApplication(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: ReviewApplicationDto,
  ) {
    const userId = user.user_id ?? user.id;
    return this.applicationService.reviewApplication(
      id,
      userId,
      user.role,
      dto,
    );
  }
}