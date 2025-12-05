import { Injectable } from "@nestjs/common";
import { LedgerOperationType } from "@prisma/client";
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
    return result._sum.quantity || 0;
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
