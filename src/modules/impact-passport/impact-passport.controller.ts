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

import { ImpactPassportService } from "./impact-passport.service";

import {

  CreateSelfReportedRecordDto,

  UpdateImpactRecordDto,

} from "./dto/impact-passport.dto";
 
@ApiTags("Impact Passport")

@ApiBearerAuth()

@UseGuards(JwtGuard, RolesGuard)

@Controller("impact-passport")

export class ImpactPassportController {

  constructor(private readonly impactPassportService: ImpactPassportService) {}
 
  @Get("me")

  @ApiOperation({

    summary:

      "Get full Impact Passport summary, verified totals by source, causes, skills, and timeline",

  })

  getMyPassport(@CurrentUser() user: any) {

    const userId = user.user_id ?? user.id;

    return this.impactPassportService.getMyPassport(userId);

  }
 
  @Get("records")

  @ApiOperation({

    summary: "List my impact records with pagination and filters",

  })

  findMyRecords(

    @CurrentUser() user: any,

    @Query("sourceType") sourceType?: string,

    @Query("status") status?: string,

    @Query("visibility") visibility?: string,

    @Query("causeId") causeId?: string,

    @Query("page") page = 1,

    @Query("limit") limit = 10,

  ) {

    const userId = user.user_id ?? user.id;

    return this.impactPassportService.findAllForVolunteer(userId, {

      sourceType,

      status,

      visibility,

      causeId,

      page: Number(page),

      limit: Number(limit),

    });

  }
 
  @Get("records/:id")

  @ApiOperation({ summary: "Get a single impact record by ID" })

  findOne(

    @Param("id", ParseUUIDPipe) id: string,

    @CurrentUser() user: any,

  ) {

    const userId = user.user_id ?? user.id;

    return this.impactPassportService.findOne(id, userId, user.role);

  }
 
  @Post("self-reported")

  @Roles(Role.VOLUNTEER, Role.ADMINISTRATOR)

  @ApiOperation({

    summary:

      "Add a self-reported past activity (always marked SELF_REPORTED / unverified)",

  })

  createSelfReported(

    @CurrentUser() user: any,

    @Body() dto: CreateSelfReportedRecordDto,

  ) {

    const userId = user.user_id ?? user.id;

    return this.impactPassportService.createSelfReported(userId, dto);

  }
 
  @Patch("records/:id")

  @ApiOperation({

    summary:

      "Update record visibility (PUBLIC/PRIVATE) or edit a self-reported record",

  })

  updateRecord(

    @Param("id", ParseUUIDPipe) id: string,

    @CurrentUser() user: any,

    @Body() dto: UpdateImpactRecordDto,

  ) {

    const userId = user.user_id ?? user.id;

    return this.impactPassportService.updateRecord(

      id,

      userId,

      user.role,

      dto,

    );

  }
 
  @Delete("records/:id")

  @ApiOperation({ summary: "Delete a self-reported impact record" })

  removeSelfReported(

    @Param("id", ParseUUIDPipe) id: string,

    @CurrentUser() user: any,

  ) {

    const userId = user.user_id ?? user.id;

    return this.impactPassportService.removeSelfReported(

      id,

      userId,

      user.role,

    );

  }

}
 