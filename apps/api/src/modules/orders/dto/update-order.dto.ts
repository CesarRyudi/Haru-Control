import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { CreateOrderItemDto } from "./create-order.dto";

export class UpdateOrderDto {
  @IsOptional()
  @IsString()
  customerId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  deliveryFee?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  totalPrice?: number;

  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsDateString()
  createdAt?: string | Date;

  @IsOptional()
  @IsDateString()
  completedAt?: string | Date;

  @IsOptional()
  @IsBoolean()
  notify?: boolean;
}
