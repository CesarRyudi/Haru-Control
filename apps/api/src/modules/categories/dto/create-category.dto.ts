import { IsString, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";

export class CreateCategoryDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  price?: number;

  @IsOptional()
  @IsString()
  observation?: string;
}
