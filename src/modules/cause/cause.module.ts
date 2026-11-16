import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { CauseEntity } from "./entities/cause.entity";
import { CauseController } from "./cause.controller";
import { CauseService } from "./cause.service";
 
@Module({
  imports: [TypeOrmModule.forFeature([CauseEntity])],
  controllers: [CauseController],
  providers: [CauseService],
  exports: [CauseService],
})
export class CauseModule {}