import { Controller, Post, Body } from '@nestjs/common';
import { ManufacturingService } from './manufacturing.service';
import { IsNumber, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class ProduceItemDto {
  @IsString()
  productId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

@Controller('manufacturing')
export class ManufacturingController {
  constructor(private readonly manufacturingService: ManufacturingService) {}

  @Post('produce')
  produce(@Body() produceItemDto: ProduceItemDto) {
    return this.manufacturingService.produce(produceItemDto);
  }
}
