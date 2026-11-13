import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtGuard, RolesGuard } from "@/common/guard";
import { CurrentUser } from "@/common/decorators/current-user.decorator";
import { ParticipationService } from "./participation.service";
import { SubmitCompletionDto } from "./dto/participation.dto";
import type { ParticipationStatus } from "./entities/participation.entity";

@ApiTags("Participations")
@ApiBearerAuth()
@UseGuards(JwtGuard, RolesGuard)
@Controller("participations")
export class ParticipationController {
  constructor(private readonly participationService: ParticipationService) {}

  @Get("my")
  @ApiOperation({ summary: "List my own volunteer participations" })
  findMyParticipations(
    @CurrentUser() user: any,
    @Query("status") status?: ParticipationStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    const userId = user.user_id ?? user.id;
    return this.participationService.findAll({
      volunteerId: userId,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get()
  @ApiOperation({
    summary:
      "List participations filtered by volunteerId, opportunityId, requestId, or status",
  })
  findAll(
    @Query("volunteerId") volunteerId?: string,
    @Query("opportunityId") opportunityId?: string,
    @Query("requestId") requestId?: string,
    @Query("status") status?: ParticipationStatus,
    @Query("page") page = 1,
    @Query("limit") limit = 10,
  ) {
    return this.participationService.findAll({
      volunteerId,
      opportunityId,
      requestId,
      status,
      page: Number(page),
      limit: Number(limit),
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get participation details by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.participationService.findOne(id);
  }

  @Patch(":id/complete")
  @ApiOperation({
    summary:
      "Submit completion details and proposed hours (moves ACCEPTED to PENDING_VERIFICATION)",
  })
  submitCompletion(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: any,
    @Body() dto: SubmitCompletionDto,
  ) {
    const userId = user.user_id ?? user.id;
    return this.participationService.submitCompletion(id, userId, dto);
  }
}