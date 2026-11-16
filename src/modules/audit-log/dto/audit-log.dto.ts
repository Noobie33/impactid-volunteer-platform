import { Type } from "class-transformer";
import { IsInt, Max, Min } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
export class PageDto {
  @ApiPropertyOptional({ default: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2147483647)
  page = 1;
  @ApiPropertyOptional({ default: 10, maximum: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 10;
}
export function paginated<T>(
  data: T[],
  total: number,
  { page, limit }: PageDto,
) {
  return {
    success: true,
    data,
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
