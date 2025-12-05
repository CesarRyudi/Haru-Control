import { Body, Controller, Get, Post } from "@nestjs/common";
import { Type } from "class-transformer";
import { IsNumber, IsString } from "class-validator";
import { StockService } from "./stock.service";

export class StockInDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class StockAdjustDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

@Controller("stock")
export class StockController {
  constructor(private readonly stockService: StockService) {}

  @Post("in")
  async stockIn(@Body() dto: StockInDto) {
    await this.stockService.addStock(dto.productId, dto.quantity);
    return { success: true };
  }

  @Post("adjust")
  async stockAdjust(@Body() dto: StockAdjustDto) {
    await this.stockService.adjustStock(dto.productId, dto.quantity);
    return { success: true };
  }

  @Get("snapshot")
  async getSnapshot() {
    return this.stockService.getStockSnapshot();
  }
}
