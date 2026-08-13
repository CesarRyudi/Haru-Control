import { Module } from '@nestjs/common';
import { ManufacturingService } from './manufacturing.service';
import { ManufacturingController } from './manufacturing.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ManufacturingController],
  providers: [ManufacturingService],
})
export class ManufacturingModule {}
