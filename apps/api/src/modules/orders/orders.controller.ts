import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";
import { OrdersService } from "./orders.service";

@Controller("orders")
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.create(createOrderDto);
  }

  @Get()
  findAll(@Query("status") status?: OrderStatus, @Query("date") date?: string) {
    return this.ordersService.findAll(status, date);
  }

  @Get("completed")
  async findCompleted(@Query("date") date?: string) {
    // Por padrão, mostrar pedidos concluídos do dia atual
    const targetDate = date || new Date().toISOString().split("T")[0];
    return this.ordersService.findAll(OrderStatus.COMPLETED, targetDate);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Post(":id/complete")
  complete(@Param("id") id: string) {
    return this.ordersService.complete(id);
  }

  @Post(":id/cancel")
  cancel(@Param("id") id: string) {
    return this.ordersService.cancel(id);
  }
}
