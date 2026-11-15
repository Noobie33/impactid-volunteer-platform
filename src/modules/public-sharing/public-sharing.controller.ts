import {

  Body,

  Controller,

  Get,

  Param,

  ParseUUIDPipe,

  Patch,

  Post,

  UseGuards,

} from "@nestjs/common";

import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";

import { JwtGuard, RolesGuard } from "@/common/guard";

import { CurrentUser } from "@/common/decorators/current-user.decorator";

import { PublicSharingService } from "./public-sharing.service";

import {

  UpdateRecordVisibilityDto,

  UpdateSharingSettingsDto,

} from "./dto/public-sharing.dto";
 
@ApiTags("Public Sharing & Privacy")

@Controller("public-sharing")

export class PublicSharingController {

  constructor(private readonly publicSharingService: PublicSharingService) {}
 
  @Get("passport/:shareToken")

  @ApiOperation({

    summary:

      "Public Impact Passport verification view by shareToken (No authentication required)",

  })

  getPublicPassport(@Param("shareToken", ParseUUIDPipe) shareToken: string) {

    return this.publicSharingService.getPublicPassportByToken(shareToken);

  }
 
  @Get("settings")

  @UseGuards(JwtGuard, RolesGuard)

  @ApiBearerAuth()

  @ApiOperation({ summary: "Get my current public sharing settings and token" })

  getMySharingSettings(@CurrentUser() user: any) {

    const userId = user.user_id ?? user.id;

    return this.publicSharingService.getSharingSettings(userId);

  }
 
  @Patch("settings")

  @UseGuards(JwtGuard, RolesGuard)

  @ApiBearerAuth()

  @ApiOperation({ summary: "Enable or disable my public passport share link" })

  updateMySharingSettings(

    @CurrentUser() user: any,

    @Body() dto: UpdateSharingSettingsDto,

  ) {

    const userId = user.user_id ?? user.id;

    return this.publicSharingService.updateSharingSettings(userId, dto);

  }
 
  @Post("rotate-token")

  @UseGuards(JwtGuard, RolesGuard)

  @ApiBearerAuth()

  @ApiOperation({

    summary:

      "Rotate my public passport shareToken inside a transaction (invalidates old link)",

  })

  rotateMyShareToken(@CurrentUser() user: any) {

    const userId = user.user_id ?? user.id;

    return this.publicSharingService.rotateShareToken(userId);

  }
 
  @Patch("records/:id/visibility")

  @UseGuards(JwtGuard, RolesGuard)

  @ApiBearerAuth()

  @ApiOperation({

    summary: "Set an individual impact record visibility to PUBLIC or PRIVATE",

  })

  updateRecordVisibility(

    @Param("id", ParseUUIDPipe) id: string,

    @CurrentUser() user: any,

    @Body() dto: UpdateRecordVisibilityDto,

  ) {

    const userId = user.user_id ?? user.id;

    return this.publicSharingService.updateRecordVisibility(id, userId, dto);

  }

}
 