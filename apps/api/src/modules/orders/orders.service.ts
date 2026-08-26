import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { StockService } from "../stock/stock.service";
import { PushoverService } from "../notifications/pushover.service";
import { CreateOrderDto } from "./dto/create-order.dto";
import { UpdateOrderDto } from "./dto/update-order.dto";

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private stockService: StockService,
    private pushoverService: PushoverService
  ) {}

  private formatOrder(order: any, warnings?: string[]) {
    return {
      id: order.id,
      customerId: order.customerId,
      status: order.status,
      totalPrice: Number(order.totalPrice),
      deliveryFee: Number(order.deliveryFee),
      address: order.address,
      pushoverReceipt: order.pushoverReceipt,
      acknowledgedAt: order.acknowledgedAt,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: (order.items || []).map((item: any) => ({
        id: item.id,
        orderId: item.orderId,
        productId: item.productId,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        product: item.product
          ? {
              id: item.product.id,
              name: item.product.name,
              unit: item.product.unit,
              price: Number(item.product.price),
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
            address: order.customer.address,
            observation: order.customer.observation,
            createdAt: order.customer.createdAt,
          }
        : null,
      warnings: warnings && warnings.length > 0 ? warnings : undefined,
    };
  }

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
        const futureStock = Number(currentStock) - Number(item.quantity);

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
      (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
      0
    );

    // Criar pedido e itens
    const order = await this.prisma.order.create({
      data: {
        customerId: createOrderDto.customerId,
        status: OrderStatus.DRAFT,
        totalPrice,
        deliveryFee: createOrderDto.deliveryFee ?? 2,
        address: createOrderDto.address,
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
        customer: true,
      },
    });

    // Reservar estoque
    await Promise.all(
      itemsWithPrices.map((item) =>
        this.stockService.reserveStock(item.productId, item.quantity, order.id)
      )
    );

    return this.formatOrder(order, warnings);
  }

  async findAll(
    status?: OrderStatus,
    date?: string,
    excludeStatus?: OrderStatus | OrderStatus[]
  ) {
    const where: any = {};

    if (status) {
      where.status = status;
    } else if (excludeStatus) {
      const excluded = Array.isArray(excludeStatus)
        ? excludeStatus
        : [excludeStatus];
      where.status = { notIn: excluded };
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

    return orders.map((order) => this.formatOrder(order));
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

    return this.formatOrder(order);
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
        existingItems.map((item: any) =>
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
          const futureStock = Number(currentStock) - Number(item.quantity);

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
        (sum, item) => sum + Number(item.quantity) * Number(item.unitPrice),
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

    // Se apenas atualizando status ou deliveryFee ou address
    if (
      updateOrderDto.status ||
      updateOrderDto.deliveryFee !== undefined ||
      updateOrderDto.address !== undefined
    ) {
      const updateData: any = {};
      if (updateOrderDto.deliveryFee !== undefined)
        updateData.deliveryFee = updateOrderDto.deliveryFee;
      if (updateOrderDto.address !== undefined)
        updateData.address = updateOrderDto.address;

      if (updateOrderDto.status) {
        updateData.status = updateOrderDto.status;

        // Se o pedido está entrando em PRODUÇÃO (PENDING)
        if (
          updateOrderDto.status === OrderStatus.PENDING &&
          order.status !== OrderStatus.PENDING
        ) {
          const receipt = await this.pushoverService.sendOrderAlert({
            id: order.id,
            items: order.items,
            totalPrice: order.totalPrice,
            deliveryFee:
              updateOrderDto.deliveryFee !== undefined
                ? updateOrderDto.deliveryFee
                : order.deliveryFee,
            address:
              updateOrderDto.address !== undefined
                ? updateOrderDto.address
                : order.address,
          });

          if (receipt) {
            updateData.pushoverReceipt = receipt;
            updateData.acknowledgedAt = null;
          }
        }
        // Se o pedido está saindo de PRODUÇÃO para outro status e ainda não foi confirmado no Pushover
        else if (
          updateOrderDto.status !== OrderStatus.PENDING &&
          order.status === OrderStatus.PENDING &&
          order.pushoverReceipt &&
          !order.acknowledgedAt
        ) {
          await this.pushoverService.cancelAlert(order.pushoverReceipt);
        }
      }

      await this.prisma.order.update({
        where: { id },
        data: updateData,
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

    // Se havia alerta pendente no Pushover, cancela
    if (order.pushoverReceipt && !order.acknowledgedAt) {
      await this.pushoverService.cancelAlert(order.pushoverReceipt);
    }

    // Liberar estoque reservado
    await Promise.all(
      order.items.map((item: any) =>
        this.stockService.releaseStock(item.productId, item.quantity, order.id)
      )
    );

    // Registrar venda
    await Promise.all(
      order.items.map((item: any) =>
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
        customer: true,
      },
    });

    return this.formatOrder(completedOrder);
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

    // Se havia alerta pendente no Pushover, cancela
    if (order.pushoverReceipt && !order.acknowledgedAt) {
      await this.pushoverService.cancelAlert(order.pushoverReceipt);
    }

    // Liberar estoque reservado
    await Promise.all(
      order.items.map((item: any) =>
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
        customer: true,
      },
    });

    return this.formatOrder(cancelledOrder);
  }

  async acknowledge(id: string) {
    const order = await this.findOne(id);
    if (order.pushoverReceipt && !order.acknowledgedAt) {
      await this.pushoverService.cancelAlert(order.pushoverReceipt);
    }
    await this.prisma.order.update({
      where: { id },
      data: { acknowledgedAt: new Date() },
    });
    return this.findOne(id);
  }
}
