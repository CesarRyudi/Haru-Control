import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StockService } from "../stock/stock.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService
  ) {}

  async create(createOrderDto: CreateOrderDto) {
    const warnings: string[] = [];

    // Buscar produtos e calcular total
    const itemsWithPrices = await Promise.all(
      createOrderDto.items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new NotFoundException(
            `Produto ${item.productId} não encontrado`
          );
        }

        // Verificar estoque
        const currentStock = await this.stockService.getCurrentStock(
          item.productId
        );
        const futureStock = currentStock - item.quantity;

        if (futureStock < 0) {
          warnings.push(
            `Produto "${product.name}" ficará com estoque negativo: ${futureStock}`
          );
        }

        return {
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: product.price,
          productName: product.name,
        };
      })
    );

    const totalPrice = itemsWithPrices.reduce(
      (sum, item) => sum + item.quantity * Number(item.unitPrice),
      0
    );

    // Criar pedido e itens
    const order = await this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,
        status: OrderStatus.DRAFT,
        totalPrice,
        items: {
          create: itemsWithPrices.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Reservar estoque
    await Promise.all(
      itemsWithPrices.map((item) =>
        this.stockService.reserveStock(item.productId, item.quantity, order.id)
      )
    );

    // Mapear explicitamente para evitar problemas com webpack
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              description: item.product.description,
              price: item.product.price,
              image: item.product.image,
              createdAt: item.product.createdAt,
              updatedAt: item.product.updatedAt,
            }
          : null,
      })),
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async findAll(status?: OrderStatus, date?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
      orderBy: { createdAt: "desc" },
    });

    // Mapear explicitamente para evitar problemas com webpack
    return orders.map((order) => ({
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              description: item.product.description,
              price: item.product.price,
              image: item.product.image,
              createdAt: item.product.createdAt,
              updatedAt: item.product.updatedAt,
            }
          : null,
      })),
      customer: order.customer
        ? {
            id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
            createdAt: order.customer.createdAt,
            updatedAt: order.customer.updatedAt,
          }
        : null,
    }));
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });

    if (!order) {
      throw new NotFoundException("Pedido não encontrado");
    }

    // Mapear explicitamente para evitar problemas com webpack
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              description: item.product.description,
              price: item.product.price,
              image: item.product.image,
              createdAt: item.product.createdAt,
              updatedAt: item.product.updatedAt,
            }
          : null,
      })),
      customer: order.customer
        ? {
            id: order.customer.id,
            name: order.customer.name,
            phone: order.customer.phone,
            createdAt: order.customer.createdAt,
            updatedAt: order.customer.updatedAt,
          }
        : null,
    };
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const order = await this.findOne(id);

    if (
      order.status === OrderStatus.COMPLETED ||
      order.status === OrderStatus.CANCELLED
    ) {
      throw new BadRequestException(
        "Não é possível editar pedido concluído ou cancelado"
      );
    }

    const warnings: string[] = [];

    // Se atualizando itens
    if (updateOrderDto.items) {
      const existingItems = order.items;

      // Liberar estoque dos itens antigos
      await Promise.all(
        existingItems.map((item) =>
          this.stockService.releaseStock(
            item.productId,
            item.quantity,
            order.id
          )
        )
      );

      // Deletar itens antigos
      await this.prisma.orderItem.deleteMany({
        where: { orderId: id },
      });

      // Adicionar novos itens
      const itemsWithPrices = await Promise.all(
        updateOrderDto.items.map(async (item) => {
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
          });

          if (!product) {
            throw new NotFoundException(
              `Produto ${item.productId} não encontrado`
            );
          }

          // Verificar estoque
          const currentStock = await this.stockService.getCurrentStock(
            item.productId
          );
          const futureStock = currentStock - item.quantity;

          if (futureStock < 0) {
            warnings.push(
              `Produto "${product.name}" ficará com estoque negativo: ${futureStock}`
            );
          }

          return {
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: product.price,
          };
        })
      );

      const totalPrice = itemsWithPrices.reduce(
        (sum, item) => sum + item.quantity * Number(item.unitPrice),
        0
      );

      // Criar novos itens
      await this.prisma.orderItem.createMany({
        data: itemsWithPrices.map((item) => ({
          ...item,
          orderId: id,
        })),
      });

      // Reservar estoque dos novos itens
      await Promise.all(
        itemsWithPrices.map((item) =>
          this.stockService.reserveStock(
            item.productId,
            item.quantity,
            order.id
          )
        )
      );

      // Atualizar total do pedido
      await this.prisma.order.update({
        where: { id },
        data: { totalPrice },
      });
    }

    // Se atualizando status
    if (updateOrderDto.status) {
      await this.prisma.order.update({
        where: { id },
        data: { status: updateOrderDto.status },
      });
    }

    const updatedOrder = await this.findOne(id);

    return {
      ...updatedOrder,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  async complete(id: string) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException("Pedido já foi concluído");
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("Pedido cancelado não pode ser concluído");
    }

    // Liberar estoque reservado
    await Promise.all(
      order.items.map((item) =>
        this.stockService.releaseStock(item.productId, item.quantity, order.id)
      )
    );

    // Registrar venda
    await Promise.all(
      order.items.map((item) =>
        this.stockService.recordSale(item.productId, item.quantity, order.id)
      )
    );

    // Criar registro de venda
    await this.prisma.sale.create({
      data: { orderId: id },
    });

    // Atualizar status do pedido
    const completedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.COMPLETED },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Mapear explicitamente para evitar problemas com webpack
    return {
      id: completedOrder.id,
      customerId: completedOrder.customerId,
      status: completedOrder.status,
      totalPrice: completedOrder.totalPrice,
      createdAt: completedOrder.createdAt,
      updatedAt: completedOrder.updatedAt,
      items: completedOrder.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              description: item.product.description,
              price: item.product.price,
              image: item.product.image,
              createdAt: item.product.createdAt,
              updatedAt: item.product.updatedAt,
            }
          : null,
      })),
    };
  }

  async cancel(id: string) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.COMPLETED) {
      throw new BadRequestException(
        "Não é possível cancelar pedido já concluído"
      );
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new BadRequestException("Pedido já está cancelado");
    }

    // Liberar estoque reservado
    await Promise.all(
      order.items.map((item) =>
        this.stockService.releaseStock(item.productId, item.quantity, order.id)
      )
    );

    // Atualizar status do pedido
    const cancelledOrder = await this.prisma.order.update({
      where: { id },
      data: { status: OrderStatus.CANCELLED },
      include: {
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    // Mapear explicitamente para evitar problemas com webpack
    return {
      id: cancelledOrder.id,
      customerId: cancelledOrder.customerId,
      status: cancelledOrder.status,
      totalPrice: cancelledOrder.totalPrice,
      createdAt: cancelledOrder.createdAt,
      updatedAt: cancelledOrder.updatedAt,
      items: cancelledOrder.items.map((item) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              description: item.product.description,
              price: item.product.price,
              image: item.product.image,
              createdAt: item.product.createdAt,
              updatedAt: item.product.updatedAt,
            }
          : null,
      })),
    };
  }
}
