import { Body, Controller, Get, Post, Query } from "@nestjs/common";
import { WasteReason } from "@prisma/client";
import { Type } from "class-transformer";
import { IsArray, IsEnum, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { StockService } from "./stock.service";
import { BakingSuggestionService } from "./baking-suggestion.service";

export class StockInDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class StockInBatchItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class StockInBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockInBatchItemDto)
  items: StockInBatchItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockAdjustDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class StockWasteDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsEnum(WasteReason)
  reason: WasteReason;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class StockWasteBatchItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class StockWasteBatchDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockWasteBatchItemDto)
  items: StockWasteBatchItemDto[];

  @IsEnum(WasteReason)
  reason: WasteReason;

  @IsOptional()
  @IsString()
  notes?: string;
}

@Controller("stock")
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly bakingSuggestionService: BakingSuggestionService
  ) {}

  @Post("in")
  async stockIn(@Body() dto: StockInDto) {
    await this.stockService.addStock(dto.productId, dto.quantity);
    return { success: true };
  }

  @Post("in/batch")
  async stockInBatch(@Body() dto: StockInBatchDto) {
    await this.stockService.addStockBatch(dto.items, dto.notes);
    return { success: true };
  }

  @Get("baking-suggestion")
  async getBakingSuggestion(
    @Query("startDate") startDate?: string,
    @Query("targetDate") targetDate?: string,
    @Query("safetyMargin") safetyMargin?: string
  ) {
    const margin = safetyMargin != null && !isNaN(Number(safetyMargin))
      ? Number(safetyMargin)
      : 0.1;
    return this.bakingSuggestionService.getBakingSuggestion(
      startDate,
      targetDate,
      margin
    );
  }

  @Post("adjust")
  async stockAdjust(@Body() dto: StockAdjustDto) {
    await this.stockService.adjustStock(dto.productId, dto.quantity);
    return { success: true };
  }

  @Post("waste")
  async recordWaste(@Body() dto: StockWasteDto) {
    await this.stockService.recordWaste(
      dto.productId,
      dto.quantity,
      dto.reason,
      dto.notes
    );
    return { success: true };
  }

  @Post("waste/batch")
  async recordWasteBatch(@Body() dto: StockWasteBatchDto) {
    await this.stockService.recordWasteBatch(
      dto.items,
      dto.reason,
      dto.notes
    );
    return { success: true };
  }

  @Get("waste/history")
  async getWasteHistory(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.stockService.getWasteHistory(startDate, endDate);
  }

  @Get("waste/metrics")
  async getWasteMetrics(
    @Query("startDate") startDate?: string,
    @Query("endDate") endDate?: string
  ) {
    return this.stockService.getWasteMetrics(startDate, endDate);
  }

  @Get("snapshot")
  async getSnapshot() {
    return this.stockService.getStockSnapshot();
  }
}

