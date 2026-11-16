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

import { Role } from "@/common/enums/role.enum";

import { CauseService } from "./cause.service";

import { CreateCauseDto, UpdateCauseDto } from "./dto/cause.dto";
 
@ApiTags("Causes")

@Controller("causes")

export class CauseController {

  constructor(private readonly causeService: CauseService) {}
 
  @Post()

  @UseGuards(JwtGuard, RolesGuard)

  @Roles(Role.ADMINISTRATOR)

  @ApiBearerAuth()

  @ApiOperation({ summary: "Create a new cause label (Admin only)" })

  create(@Body() dto: CreateCauseDto) {

    return this.causeService.create(dto);

  }
 
  @Get()

  @ApiOperation({ summary: "List and search cause labels with pagination" })

  findAll(

    @Query("search") search?: string,

    @Query("page") page = 1,

    @Query("limit") limit = 20,

  ) {

    return this.causeService.findAll(search, Number(page), Number(limit));

  }
 
  @Get(":id")

  @ApiOperation({ summary: "Get cause details by ID" })

  findOne(@Param("id", ParseUUIDPipe) id: string) {

    return this.causeService.findOne(id);

  }
 
  @Patch(":id")

  @UseGuards(JwtGuard, RolesGuard)

  @Roles(Role.ADMINISTRATOR)

  @ApiBearerAuth()

  @ApiOperation({ summary: "Update a cause label (Admin only)" })

  update(

    @Param("id", ParseUUIDPipe) id: string,

    @Body() dto: UpdateCauseDto,

  ) {

    return this.causeService.update(id, dto);

  }
 
  @Delete(":id")

  @UseGuards(JwtGuard, RolesGuard)

  @Roles(Role.ADMINISTRATOR)

  @ApiBearerAuth()

  @ApiOperation({ summary: "Delete an unused cause label (Admin only)" })

  remove(@Param("id", ParseUUIDPipe) id: string) {

    return this.causeService.remove(id);

  }

}
 