import {
  Controller,
  UseGuards,
  Patch,
  Post,
  Param,
  ParseUUIDPipe,
  Body,
  HttpCode,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AuthGuard } from "@/common/guard/auth.guard";
import { RolesGuard } from "@/common/guard/roles.guard";
import { Roles } from "@/common/decorators/roles.decorator";
import { Role } from "@/common/enums/role.enum";
import { ActorId } from "@/modules/admin/access";
import { AdminService } from "@/modules/admin/admin.service";
import {
  OrganizationDecisionDto,
  UpdateUserStatusDto,
} from "@/modules/admin/dto/admin.dto";
import { RevokeVerificationDto } from "@/modules/verification/dto/verification.dto";
import { VerificationService } from "@/modules/verification/verification.service";
@ApiBearerAuth()
@ApiTags("admin")
@UseGuards(AuthGuard, RolesGuard)
@Roles(Role.ADMINISTRATOR)
@Controller("admin")
export class AdminController {
  constructor(
    private readonly service: AdminService,
    private readonly verifications: VerificationService,
  ) {}
  @Patch("organizations/:id/approve")
  @ApiOperation({ summary: "Approve a pending organization" })
  approve(
    @ActorId() actor: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: OrganizationDecisionDto,
  ) {
    return this.service.decideOrganization(actor, id, "APPROVED", input.reason);
  }
  @Patch("organizations/:id/reject")
  @ApiOperation({ summary: "Reject a pending organization" })
  reject(
    @ActorId() actor: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: OrganizationDecisionDto,
  ) {
    return this.service.decideOrganization(actor, id, "REJECTED", input.reason);
  }
  @Patch("users/:id/status")
  @ApiOperation({ summary: "Change account status" })
  status(
    @ActorId() actor: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: UpdateUserStatusDto,
  ) {
    return this.service.setUserStatus(actor, id, input.status);
  }
  @Post("verifications/:id/revoke")
  @HttpCode(200)
  @ApiOperation({ summary: "Revoke an approved verification" })
  revoke(
    @ActorId() actor: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: RevokeVerificationDto,
  ) {
    return this.verifications.revoke(id, actor, input.reason);
  }
}
