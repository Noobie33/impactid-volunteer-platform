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
import { OpportunityService } from "./opportunity.service";
import {
  CreateOpportunityDto,
  UpdateOpportunityDto,
} from "./dto/opportunity.dto";
import type { OpportunityStatus } from "./entities/opportunity.entity";

@ApiTags("Opportunities")
@Controller("opportunities")
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ORGANIZATION, Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Create a volunteer opportunity (Approved Organization or Admin)",
  })
  create(@CurrentUser() user: any, @Body() dto: CreateOpportunityDto) {
    const userId = user.user_id ?? user.id;
    return this.opportunityService.create(userId, user.role, dto);
  }

  @Get()
  @ApiOperation({
    summary: "Browse and search opportunities with filters and pagination",
  })
  findAll(
    @Query("search") search?: string,
    @Query("causeId") causeId?: string,
    @Query("skillId") skillId?: string,
    @Query("organizationId") organizationId?: string,
    @Query("date") date?: string,
    @Query("status") status?: OpportunityStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    return this.opportunityService.findAll({
      search,
      causeId,
      skillId,
      organizationId,
      date,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get opportunity details by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.opportunityService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ORGANIZATION, Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update or close an opportunity (Owner or Admin)" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateOpportunityDto,
  ) {
    const userId = user.user_id ?? user.id;
    return this.opportunityService.update(id, userId, user.role, dto);
  }

  @Delete(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ORGANIZATION, Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Soft-delete an opportunity (Owner or Admin)" })
  remove(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    const userId = user.user_id ?? user.id;
    return this.opportunityService.remove(id, userId, user.role);
  }
}