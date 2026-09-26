import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';
import { BakingSuggestionService } from './baking-suggestion.service';

@Module({
  controllers: [StockController],
  providers: [StockService, BakingSuggestionService],
  exports: [StockService, BakingSuggestionService],
})
export class StockModule {}
