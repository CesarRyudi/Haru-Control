import { Injectable } from "@nestjs/common";
import { OrderStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { convertQuantity } from "@haru-control/utils";
import {
  BakingSuggestionDayBreakdown,
  BakingSuggestionItem,
  BakingSuggestionResponse,
  MissingIngredient,
} from "@haru-control/types";

@Injectable()
export class BakingSuggestionService {
  constructor(private readonly prisma: PrismaService) {}

  private parseLocalDate(dateStr: string): Date {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }

  private formatDateToString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  async getBakingSuggestion(
    startDateStr?: string,
    targetDateStr?: string,
    safetyMargin: number = 0.1
  ): Promise<BakingSuggestionResponse> {
    const today = new Date();
    const todayStr = this.formatDateToString(today);

    const effectiveStartStr = startDateStr || todayStr;
    const effectiveTargetStr = targetDateStr || effectiveStartStr;

    let startDate = this.parseLocalDate(effectiveStartStr);
    let targetDate = this.parseLocalDate(effectiveTargetStr);

    if (targetDate < startDate) {
      targetDate = new Date(startDate);
    }

    // 1. Monta lista de dias do período planejado
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

    const calendarDays: {
      dateStr: string;
      date: Date;
      dayOfWeek: number;
      dayName: string;
      shortName: string;
    }[] = [];

    const curr = new Date(startDate);
    while (curr <= targetDate) {
      const dOfWeek = curr.getDay();
      calendarDays.push({
        dateStr: this.formatDateToString(curr),
        date: new Date(curr),
        dayOfWeek: dOfWeek,
        dayName: dayNames[dOfWeek],
        shortName: dayShortNames[dOfWeek],
      });
      curr.setDate(curr.getDate() + 1);
    }

    // 2. Busca histórico de pedidos concluídos das últimas 5 semanas para cobrir 4 semanas anteriores
    const minHistoryDate = new Date(startDate);
    minHistoryDate.setDate(minHistoryDate.getDate() - 35);
    minHistoryDate.setHours(0, 0, 0, 0);

    const completedOrders = await this.prisma.order.findMany({
      where: {
        status: OrderStatus.COMPLETED,
        completedAt: {
          gte: minHistoryDate,
        },
      },
      include: {
        items: true,
      },
    });

    // Mapeamento: data (YYYY-MM-DD) -> Map<productId, totalQuantitySold>
    const salesByDateAndProduct = new Map<string, Map<string, number>>();

    for (const order of completedOrders) {
      const orderDate = order.completedAt || order.createdAt;
      const dateKey = this.formatDateToString(new Date(orderDate));
      let prodMap = salesByDateAndProduct.get(dateKey);
      if (!prodMap) {
        prodMap = new Map<string, number>();
        salesByDateAndProduct.set(dateKey, prodMap);
      }
      for (const item of order.items) {
        const currentQty = prodMap.get(item.productId) || 0;
        prodMap.set(item.productId, currentQty + Number(item.quantity));
      }
    }

    // 3. Busca produtos vendáveis com suas categorias, subcategorias e receitas (BOM)
    const products = await this.prisma.product.findMany({
      where: {
        isSellable: true,
      },
      include: {
        category: true,
        subcategory: true,
        recipeItems: {
          include: {
            child: true,
          },
        },
      },
      orderBy: [
        { category: { name: "asc" } },
        { subcategory: { name: "asc" } },
        { name: "asc" },
      ],
    });

    // 4. Saldo atual de todos os produtos do estoque via Ledger
    const ledgerAggregates = await this.prisma.ledgerEntry.groupBy({
      by: ["productId"],
      _sum: {
        quantity: true,
      },
    });

    const stockMap = new Map<string, number>();
    for (const entry of ledgerAggregates) {
      stockMap.set(entry.productId, Number(entry._sum.quantity || 0));
    }

    // 5. Para cada produto, calcular a previsão ponderada, equação e checagem BOM
    const items: BakingSuggestionItem[] = [];

    for (const product of products) {
      const currentStock = stockMap.get(product.id) || 0;
      const dailyForecast: BakingSuggestionDayBreakdown[] = [];
      let totalPredictedDemand = 0;

      for (const day of calendarDays) {
        // Busca as 4 semanas anteriores relativas a este dia específico da semana
        const qWeights = [4, 3, 2, 1];
        let weightedSum = 0;
        let weightSum = 0;

        for (let w = 1; w <= 4; w++) {
          const pastDate = new Date(day.date);
          pastDate.setDate(pastDate.getDate() - w * 7);
          const pastKey = this.formatDateToString(pastDate);

          const pastSales = salesByDateAndProduct.get(pastKey)?.get(product.id) || 0;
          const weight = qWeights[w - 1];
          weightedSum += pastSales * weight;
          weightSum += weight;
        }

        const predictedForDay = Number((weightedSum / weightSum).toFixed(2));
        dailyForecast.push({
          date: day.dateStr,
          dayOfWeek: day.dayOfWeek,
          dayName: day.dayName,
          shortName: day.shortName,
          predictedSales: predictedForDay,
        });

        totalPredictedDemand += predictedForDay;
      }

      const totalDemandWithMargin = Number(
        (totalPredictedDemand * (1 + safetyMargin)).toFixed(2)
      );

      const netNeeded = Math.max(
        0,
        Math.ceil(totalDemandWithMargin) - Math.max(0, currentStock)
      );

      const suggestedBake = netNeeded;

      // Checagem informativa da Ficha Técnica (BOM) — NÃO BLOQUEANTE
      const missingIngredients: MissingIngredient[] = [];

      if (product.recipeItems && product.recipeItems.length > 0 && suggestedBake > 0) {
        for (const recipeItem of product.recipeItems) {
          const childProduct = recipeItem.child;
          const recipeUnit = recipeItem.unit || childProduct.unit;
          let requiredInStockUnit = 0;

          try {
            const singleConverted = convertQuantity(
              Number(recipeItem.quantity),
              recipeUnit,
              childProduct.unit
            );
            requiredInStockUnit = Number((singleConverted * suggestedBake).toFixed(4));
          } catch {
            requiredInStockUnit = Number(recipeItem.quantity) * suggestedBake;
          }

          const availableStock = stockMap.get(childProduct.id) || 0;

          if (availableStock < requiredInStockUnit) {
            missingIngredients.push({
              productId: childProduct.id,
              productName: childProduct.name,
              unit: childProduct.unit,
              required: requiredInStockUnit,
              available: availableStock,
              missing: Number((requiredInStockUnit - availableStock).toFixed(4)),
            });
          }
        }
      }

      items.push({
        productId: product.id,
        productName: product.name,
        categoryName: product.category?.name,
        subcategoryName: product.subcategory?.name,
        unit: product.unit || "un",
        currentStock,
        dailyForecast,
        totalDemand: totalDemandWithMargin,
        safetyMargin,
        netNeeded,
        suggestedBake,
        hasSufficientIngredients: missingIngredients.length === 0,
        missingIngredients,
      });
    }

    return {
      startDate: this.formatDateToString(startDate),
      targetDate: this.formatDateToString(targetDate),
      daysCount: calendarDays.length,
      safetyMargin,
      items,
    };
  }
}
