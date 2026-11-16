import {
  Controller,
  UseGuards,
  Body,
  Post,
  Get,
  Param,
  ParseUUIDPipe,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@/common/guard/auth.guard";
import { RolesGuard } from "@/common/guard/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/common/enums/role.enum";
import { ActorId } from "@/modules/admin/access";
import { VerificationService } from "@/modules/verification/verification.service";
import {
  ApproveVerificationDto,
  RejectVerificationDto,
} from "@/modules/verification/dto/verification.dto";
@ApiBearerAuth()
@ApiTags("verifications")
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.VOLUNTEER, Role.ORGANIZATION, Role.ADMINISTRATOR)
@Controller("verifications")
export class VerificationController {
  constructor(private readonly service: VerificationService) {}
  @Roles(Role.VOLUNTEER, Role.ORGANIZATION)
  @Post(":participationId/approve")
  @ApiOperation({ summary: "Approve completed participation" })
  approve(
    @Param("participationId", ParseUUIDPipe) id: string,
    @ActorId() actor: string,
    @Body() input: ApproveVerificationDto,
  ) {
    return this.service.approve(id, actor, input);
  }
  @Roles(Role.VOLUNTEER, Role.ORGANIZATION)
  @Post(":participationId/reject")
  @ApiOperation({ summary: "Reject completed participation" })
  reject(
    @Param("participationId", ParseUUIDPipe) id: string,
    @ActorId() actor: string,
    @Body() input: RejectVerificationDto,
  ) {
    return this.service.reject(id, actor, input);
  }
  @Get(":id")
  @ApiOperation({ summary: "Read a verification" })
  detail(@Param("id", ParseUUIDPipe) id: string, @ActorId() actor: string) {
    return this.service.detail(id, actor);
  }
}
