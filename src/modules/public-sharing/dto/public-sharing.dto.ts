import { IsBoolean, IsIn, IsNotEmpty } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { ImpactRecordEntity } from "@/modules/impact-passport/entities/impact-record.entity";
 
export class UpdateSharingSettingsDto {
  @ApiProperty({
    example: true,
    description: "Enable or disable the public Impact Passport share link",
  })
  @IsBoolean()
  @IsNotEmpty()
  sharingEnabled!: boolean;
}
 
export class UpdateRecordVisibilityDto {
  @ApiProperty({ enum: ["PUBLIC", "PRIVATE"] })
  @IsIn(["PUBLIC", "PRIVATE"])
  visibility!: ImpactRecordEntity["visibility"];
}