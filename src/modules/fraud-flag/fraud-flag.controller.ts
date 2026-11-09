import {
  Controller,
  UseGuards,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Query,
  Body,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@/common/guard/auth.guard";
import { RolesGuard } from "@/common/guard/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/common/enums/role.enum";
import { ActorId } from "@/modules/admin/access";
import { FraudFlagService } from "@/modules/fraud-flag/fraud-flag.service";
import { PageDto } from "@/modules/audit-log/dto/audit-log.dto";
import { ReviewFraudFlagDto } from "@/modules/fraud-flag/dto/fraud-flag.dto";
@ApiBearerAuth()
@ApiTags("admin/fraud-flags")
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin/fraud-flags")
export class FraudFlagController {
  constructor(private readonly service: FraudFlagService) {}
  @Get("")
  @ApiOperation({ summary: "List fraud flags" })
  list(@ActorId() actor: string, @Query() page: PageDto) {
    return this.service.list(actor, page);
  }
  @Get(":id")
  @ApiOperation({ summary: "Read a fraud flag" })
  detail(@ActorId() actor: string, @Param("id", ParseUUIDPipe) id: string) {
    return this.service.detail(actor, id);
  }
  @Patch(":id")
  @ApiOperation({ summary: "Review an open fraud flag" })
  review(
    @ActorId() actor: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: ReviewFraudFlagDto,
  ) {
    return this.service.review(actor, id, input);
  }
}
