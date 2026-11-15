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
import { SkillService } from "./skill.service";
import { CreateSkillDto, UpdateSkillDto } from "./dto/skill.dto";
 
@ApiTags("Skills")
@Controller("skills")
export class SkillController {
  constructor(private readonly skillService: SkillService) {}
 
  @Post()
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a new skill tag (Admin only)" })
  create(@Body() dto: CreateSkillDto) {
    return this.skillService.create(dto);
  }
 
  @Get()
  @ApiOperation({ summary: "List and search skills with pagination" })
  findAll(
    @Query("search") search?: string,
    @Query("page") page = 1,
    @Query("limit") limit = 20,
  ) {
    return this.skillService.findAll(search, Number(page), Number(limit));
  }
 
  @Get(":id")
  @ApiOperation({ summary: "Get skill details by ID" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.skillService.findOne(id);
  }
 
  @Patch(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a skill tag (Admin only)" })
  update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillDto,
  ) {
    return this.skillService.update(id, dto);
  }
 
  @Delete(":id")
  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.ADMINISTRATOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Delete an unused skill tag (Admin only)" })
  remove(@Param("id", ParseUUIDPipe) id: string) {
    return this.skillService.remove(id);
  }
}
