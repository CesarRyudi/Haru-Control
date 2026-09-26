import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { LedgerOperationType, WasteReason } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class StockService {
  constructor(private prisma: PrismaService) {}

  async addStock(productId: string, quantity: number): Promise<void> {
    console.log("Adding stock:", { productId, quantity });
    await this.prisma.ledgerEntry.create({
      data: {
        productId: productId,
        quantity: Number(quantity),
        type: LedgerOperationType.STOCK_IN,
      },
    });
  }

  async addStockBatch(
    items: { productId: string; quantity: number }[],
    notes?: string
  ): Promise<void> {
    if (!items || items.length === 0) {
      throw new BadRequestException("Nenhum item informado para entrada de estoque");
    }

    const validItems = items.filter((item) => Number(item.quantity) > 0);
    if (validItems.length === 0) {
      throw new BadRequestException("Todos os itens devem ter quantidade maior que zero");
    }

    console.log("Adding stock batch:", { count: validItems.length, notes });

    await this.prisma.$transaction(
      validItems.map((item) =>
        this.prisma.ledgerEntry.create({
          data: {
            productId: item.productId,
            quantity: Number(item.quantity),
            type: LedgerOperationType.STOCK_IN,
            notes: notes?.trim() || null,
          },
        })
      )
    );
  }

  async adjustStock(productId: string, quantity: number): Promise<void> {
    console.log("Adjusting stock:", { productId, quantity });
    await this.prisma.ledgerEntry.create({
      data: {
        productId: productId,
        quantity: Number(quantity),
        type: LedgerOperationType.STOCK_ADJUSTMENT,
      },
    });
  }

  async recordWaste(
    productId: string,
    quantity: number,
    reason: WasteReason,
    notes?: string
  ): Promise<void> {
    const numQty = Number(quantity);
    if (isNaN(numQty) || numQty <= 0) {
      throw new BadRequestException("A quantidade de descarte deve ser maior que zero");
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException("Produto não encontrado");
    }

    console.log("Recording waste:", { productId, quantity: numQty, reason, notes });

    await this.prisma.ledgerEntry.create({
      data: {
        productId,
        quantity: -Math.abs(numQty),
        type: LedgerOperationType.WASTE,
        wasteReason: reason,
        notes: notes?.trim() || null,
      },
    });
  }

  async recordWasteBatch(
    items: { productId: string; quantity: number }[],
    reason: WasteReason,
    notes?: string
  ): Promise<void> {
    if (!items || items.length === 0) {
      throw new BadRequestException("Nenhum item informado para descarte");
    }

    const validItems = items.filter((item) => Number(item.quantity) > 0);
    if (validItems.length === 0) {
      throw new BadRequestException("Todos os itens devem ter quantidade maior que zero");
    }

    console.log("Recording waste batch:", { count: validItems.length, reason, notes });

    await this.prisma.$transaction(
      validItems.map((item) =>
        this.prisma.ledgerEntry.create({
          data: {
            productId: item.productId,
            quantity: -Math.abs(Number(item.quantity)),
            type: LedgerOperationType.WASTE,
            wasteReason: reason,
            notes: notes?.trim() || null,
          },
        })
      )
    );
  }

  calculateProductCost(product: any): number {
    if (!product) return 0;
    if (product.recipeItems && product.recipeItems.length > 0) {
      let bomCost = 0;
      for (const item of product.recipeItems) {
        const childPrice = Number(item.child?.price || 0);
        const childQty = Number(item.quantity || 0);
        bomCost += childPrice * childQty;
      }
      if (bomCost > 0) return Number(bomCost.toFixed(2));
    }
    return Number(product.price || 0);
  }

  async getWasteHistory(startDate?: string, endDate?: string) {
    let startDateTime: Date | undefined;
    let endDateTime: Date | undefined;

    if (startDate && endDate) {
      const [sYear, sMonth, sDay] = startDate.split("-").map(Number);
      const [eYear, eMonth, eDay] = endDate.split("-").map(Number);
      startDateTime = new Date(sYear, sMonth - 1, sDay, 0, 0, 0, 0);
      endDateTime = new Date(eYear, eMonth - 1, eDay, 23, 59, 59, 999);
    }

    const where: any = {
      type: LedgerOperationType.WASTE,
    };

    if (startDateTime && endDateTime) {
      where.createdAt = {
        gte: startDateTime,
        lte: endDateTime,
      };
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      include: {
        product: {
          include: {
            category: true,
            recipeItems: {
              include: {
                child: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return entries.map((entry) => {
      const product = entry.product;
      const unitCost = this.calculateProductCost(product);
      const qty = Math.abs(Number(entry.quantity));
      const totalCost = Number((qty * unitCost).toFixed(2));

      return {
        id: entry.id,
        productId: entry.productId,
        productName: product?.name || "Produto Desconhecido",
        categoryName: product?.category?.name || "Sem Categoria",
        unit: product?.unit || "un",
        quantity: qty,
        wasteReason: entry.wasteReason,
        notes: entry.notes,
        unitCost,
        totalCost,
        createdAt: entry.createdAt,
      };
    });
  }

  async getWasteMetrics(startDate?: string, endDate?: string) {
    const history = await this.getWasteHistory(startDate, endDate);

    let totalQuantity = 0;
    let estimatedLossCost = 0;

    const reasonMap = new Map<
      WasteReason,
      { reason: WasteReason; quantity: number; estimatedCost: number }
    >();

    const productMap = new Map<
      string,
      {
        productId: string;
        productName: string;
        unit: string;
        quantity: number;
        estimatedCost: number;
        reasonCounts: Record<string, number>;
      }
    >();

    const REASON_LABELS: Record<string, string> = {
      EXPIRED: "Validade Vencida",
      DAMAGE: "Quebra / Avaria",
      BAKING_FAILURE: "Falha de Forno / Preparo",
      TASTING: "Teste / Degustação",
      OTHER: "Outro Motivo",
    };

    const REASON_ICONS: Record<string, string> = {
      EXPIRED: "⏳",
      DAMAGE: "💥",
      BAKING_FAILURE: "🔥",
      TASTING: "🍴",
      OTHER: "📝",
    };

    for (const item of history) {
      const qty = Number(item.quantity || 0);
      const cost = Number(item.totalCost || 0);

      totalQuantity += qty;
      estimatedLossCost += cost;

      const reason = item.wasteReason as WasteReason;
      if (reason) {
        const rEntry = reasonMap.get(reason) || {
          reason,
          quantity: 0,
          estimatedCost: 0,
        };
        rEntry.quantity += qty;
        rEntry.estimatedCost += cost;
        reasonMap.set(reason, rEntry);
      }

      const pEntry = productMap.get(item.productId) || {
        productId: item.productId,
        productName: item.productName,
        unit: item.unit,
        quantity: 0,
        estimatedCost: 0,
        reasonCounts: {},
      };
      pEntry.quantity += qty;
      pEntry.estimatedCost += cost;
      if (reason) {
        pEntry.reasonCounts[reason] = (pEntry.reasonCounts[reason] || 0) + qty;
      }
      productMap.set(item.productId, pEntry);
    }

    const byReason = Array.from(reasonMap.values())
      .map((r) => ({
        reason: r.reason,
        label: REASON_LABELS[r.reason] || r.reason,
        icon: REASON_ICONS[r.reason] || "⚠️",
        quantity: Number(r.quantity.toFixed(2)),
        estimatedCost: Number(r.estimatedCost.toFixed(2)),
        percentage:
          estimatedLossCost > 0
            ? Number(((r.estimatedCost / estimatedLossCost) * 100).toFixed(1))
            : 0,
      }))
      .sort((a, b) => b.estimatedCost - a.estimatedCost);

    const topWastedProducts = Array.from(productMap.values())
      .map((p) => {
        let mainReasonKey = "";
        let maxCount = 0;
        Object.entries(p.reasonCounts).forEach(([k, count]) => {
          if (count > maxCount) {
            maxCount = count;
            mainReasonKey = k;
          }
        });

        return {
          productId: p.productId,
          productName: p.productName,
          unit: p.unit,
          quantity: Number(p.quantity.toFixed(2)),
          estimatedCost: Number(p.estimatedCost.toFixed(2)),
          mainReason: REASON_LABELS[mainReasonKey] || "Geral",
        };
      })
      .sort((a, b) => b.estimatedCost - a.estimatedCost)
      .slice(0, 10);

    return {
      totalQuantity: Number(totalQuantity.toFixed(2)),
      estimatedLossCost: Number(estimatedLossCost.toFixed(2)),
      byReason,
      topWastedProducts,
    };
  }

  async reserveStock(
    productId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    await this.prisma.ledgerEntry.create({
      data: {
        productId: productId,
        quantity: -Number(quantity),
        type: LedgerOperationType.RESERVE,
        orderId: orderId,
      },
    });
  }

  async releaseStock(
    productId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    await this.prisma.ledgerEntry.create({
      data: {
        productId: productId,
        quantity: Number(quantity),
        type: LedgerOperationType.RELEASE,
        orderId: orderId,
      },
    });
  }

  async recordSale(
    productId: string,
    quantity: number,
    orderId: string
  ): Promise<void> {
    await this.prisma.ledgerEntry.create({
      data: {
        productId: productId,
        quantity: -Number(quantity),
        type: LedgerOperationType.SALE,
        orderId: orderId,
      },
    });
  }

  async getCurrentStock(productId: string): Promise<number> {
    const result = await this.prisma.ledgerEntry.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return Number(result._sum.quantity || 0);
  }

  async getStockSnapshot() {
    const products = await this.prisma.product.findMany();

    const snapshot = await Promise.all(
      products.map(async (product) => {
        const stock = await this.getCurrentStock(product.id);
        const warnings: string[] = [];

        if (stock < 0) {
          warnings.push(`Estoque negativo: ${stock}`);
        }

        return {
          productId: product.id,
          productName: product.name,
          currentStock: stock,
          warnings: warnings.length > 0 ? warnings : undefined,
        };
      })
    );

    return snapshot;
  }
}
