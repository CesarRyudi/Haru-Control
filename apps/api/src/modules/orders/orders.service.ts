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

  async getMetrics(startDate?: string, endDate?: string) {
    let startDateTime: Date;
    let endDateTime: Date;

    if (startDate && endDate) {
      const [sYear, sMonth, sDay] = startDate.split("-").map(Number);
      const [eYear, eMonth, eDay] = endDate.split("-").map(Number);
      startDateTime = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      endDateTime = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
    } else {
      const now = new Date();
      startDateTime = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDateTime = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const orders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        createdAt: {
          gte: startDateTime,
          lte: endDateTime,
        },
      },
      include: {
        items: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        customer: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    // 1. Resumo KPIs
    let productsRevenue = 0;
    let deliveryRevenue = 0;
    let totalCookiesSold = 0;

    orders.forEach((order) => {
      productsRevenue += Number(order.totalPrice || 0);
      deliveryRevenue += Number(order.deliveryFee || 0);
      (order.items || []).forEach((item) => {
        totalCookiesSold += Number(item.quantity || 0);
      });
    });

    const totalRevenue = productsRevenue + deliveryRevenue;
    const totalOrders = orders.length;
    const averageTicket =
      totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0;

    const summary = {
      totalRevenue: Number(totalRevenue.toFixed(2)),
      productsRevenue: Number(productsRevenue.toFixed(2)),
      deliveryRevenue: Number(deliveryRevenue.toFixed(2)),
      totalOrders,
      averageTicket,
      totalCookiesSold,
    };

    // 2. Composição da Receita
    const revenueComposition = {
      productsRevenue: Number(productsRevenue.toFixed(2)),
      deliveryRevenue: Number(deliveryRevenue.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      productsPercent:
        totalRevenue > 0
          ? Number(((productsRevenue / totalRevenue) * 100).toFixed(1))
          : 0,
      deliveryPercent:
        totalRevenue > 0
          ? Number(((deliveryRevenue / totalRevenue) * 100).toFixed(1))
          : 0,
    };

    // 3. Evolução Diária
    const dailyMap = new Map<
      string,
      {
        date: string;
        formattedDate: string;
        revenue: number;
        productsRevenue: number;
        deliveryRevenue: number;
        ordersCount: number;
        cookiesCount: number;
      }
    >();

    const curr = new Date(startDateTime);
    while (curr <= endDateTime) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, "0");
      const d = String(curr.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${d}`;
      const formattedDate = `${d}/${m}`;
      dailyMap.set(key, {
        date: key,
        formattedDate,
        revenue: 0,
        productsRevenue: 0,
        deliveryRevenue: 0,
        ordersCount: 0,
        cookiesCount: 0,
      });
      curr.setDate(curr.getDate() + 1);
    }

    orders.forEach((order) => {
      const d = new Date(order.createdAt);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;
      const entry = dailyMap.get(key);
      if (entry) {
        const prodRev = Number(order.totalPrice || 0);
        const delRev = Number(order.deliveryFee || 0);
        entry.revenue += prodRev + delRev;
        entry.productsRevenue += prodRev;
        entry.deliveryRevenue += delRev;
        entry.ordersCount += 1;
        (order.items || []).forEach((item) => {
          entry.cookiesCount += Number(item.quantity || 0);
        });
      }
    });

    const dailyEvolution = Array.from(dailyMap.values()).map((e) => ({
      ...e,
      revenue: Number(e.revenue.toFixed(2)),
      productsRevenue: Number(e.productsRevenue.toFixed(2)),
      deliveryRevenue: Number(e.deliveryRevenue.toFixed(2)),
    }));

    // 4. Top Produtos (Quantidade & Faturamento)
    const productMap = new Map<
      string,
      {
        id: string;
        name: string;
        categoryName: string;
        quantity: number;
        revenue: number;
      }
    >();

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const pId = item.productId;
        const pName = item.product?.name || "Produto";
        const catName = item.product?.category?.name || "Geral";
        const qty = Number(item.quantity || 0);
        const rev = Number(item.quantity || 0) * Number(item.unitPrice || 0);

        const existing = productMap.get(pId) || {
          id: pId,
          name: pName,
          categoryName: catName,
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += qty;
        existing.revenue += rev;
        productMap.set(pId, existing);
      });
    });

    const productsList = Array.from(productMap.values()).map((p) => ({
      ...p,
      revenue: Number(p.revenue.toFixed(2)),
    }));

    const topProductsByQuantity = [...productsList]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);

    const topProductsByRevenue = [...productsList]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // 5. Vendas por Categoria
    const categoryMap = new Map<
      string,
      { name: string; revenue: number; quantity: number }
    >();

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const catName = item.product?.category?.name || "Sem Categoria";
        const qty = Number(item.quantity || 0);
        const rev = Number(item.quantity || 0) * Number(item.unitPrice || 0);

        const existing = categoryMap.get(catName) || {
          name: catName,
          revenue: 0,
          quantity: 0,
        };
        existing.quantity += qty;
        existing.revenue += rev;
        categoryMap.set(catName, existing);
      });
    });

    const categoriesTotalRevenue = Array.from(categoryMap.values()).reduce(
      (sum, c) => sum + c.revenue,
      0
    );

    const salesByCategory = Array.from(categoryMap.values())
      .map((c) => ({
        name: c.name,
        revenue: Number(c.revenue.toFixed(2)),
        quantity: c.quantity,
        percentage:
          categoriesTotalRevenue > 0
            ? Number(((c.revenue / categoriesTotalRevenue) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // 6. Horários de Pico (00h às 23h)
    const hoursMap = new Map<
      number,
      { hour: string; hourNumber: number; ordersCount: number; revenue: number }
    >();

    for (let h = 0; h < 24; h++) {
      hoursMap.set(h, {
        hour: `${String(h).padStart(2, "0")}:00`,
        hourNumber: h,
        ordersCount: 0,
        revenue: 0,
      });
    }

    orders.forEach((order) => {
      const d = new Date(order.createdAt);
      const h = d.getHours();
      const entry = hoursMap.get(h);
      if (entry) {
        entry.ordersCount += 1;
        entry.revenue +=
          Number(order.totalPrice || 0) + Number(order.deliveryFee || 0);
      }
    });

    const peakHours = Array.from(hoursMap.values()).map((h) => ({
      ...h,
      revenue: Number(h.revenue.toFixed(2)),
    }));

    // 7. Dias da Semana Mais Movimentados (Domingo a Sábado)
    const dayNames = [
      "Domingo",
      "Segunda",
      "Terça",
      "Quarta",
      "Quinta",
      "Sexta",
      "Sábado",
    ];
    const dayShortNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
    const daysMap = new Map<
      number,
      {
        dayIndex: number;
        dayName: string;
        shortName: string;
        ordersCount: number;
        revenue: number;
      }
    >();

    for (let i = 0; i < 7; i++) {
      daysMap.set(i, {
        dayIndex: i,
        dayName: dayNames[i],
        shortName: dayShortNames[i],
        ordersCount: 0,
        revenue: 0,
      });
    }

    orders.forEach((order) => {
      const d = new Date(order.createdAt);
      const dayOfWeek = d.getDay();
      const entry = daysMap.get(dayOfWeek);
      if (entry) {
        entry.ordersCount += 1;
        entry.revenue +=
          Number(order.totalPrice || 0) + Number(order.deliveryFee || 0);
      }
    });

    const dayOfWeekMovement = Array.from(daysMap.values()).map((d) => ({
      ...d,
      revenue: Number(d.revenue.toFixed(2)),
    }));

    // 8. Top Clientes VIP / Recorrentes
    const customerMap = new Map<
      string,
      {
        customerId: string;
        name: string;
        phone?: string;
        ordersCount: number;
        totalSpent: number;
      }
    >();

    orders.forEach((order) => {
      if (order.customer) {
        const cId = order.customer.id;
        const existing = customerMap.get(cId) || {
          customerId: cId,
          name: order.customer.name,
          phone: order.customer.phone || undefined,
          ordersCount: 0,
          totalSpent: 0,
        };
        existing.ordersCount += 1;
        existing.totalSpent +=
          Number(order.totalPrice || 0) + Number(order.deliveryFee || 0);
        customerMap.set(cId, existing);
      }
    });

    const topCustomers = Array.from(customerMap.values())
      .map((c) => ({
        ...c,
        totalSpent: Number(c.totalSpent.toFixed(2)),
        averageSpent: Number((c.totalSpent / c.ordersCount).toFixed(2)),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);

    return {
      period: {
        startDate: startDateTime.toISOString().split("T")[0],
        endDate: endDateTime.toISOString().split("T")[0],
      },
      summary,
      revenueComposition,
      dailyEvolution,
      topProductsByQuantity,
      topProductsByRevenue,
      salesByCategory,
      peakHours,
      dayOfWeekMovement,
      topCustomers,
    };
  }
}
