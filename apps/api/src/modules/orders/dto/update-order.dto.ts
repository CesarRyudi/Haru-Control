import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsOptional, ValidateNested } from "class-validator";
import { CreateOrderItemDto } from "./create-order.dto";

export class UpdateOrderDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
