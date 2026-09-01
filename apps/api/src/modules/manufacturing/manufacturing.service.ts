import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { convertQuantity } from '@haru-control/utils';

@Injectable()
export class ManufacturingService {
  constructor(private readonly prisma: PrismaService) {}

  async produce(data: { productId: string; quantity: number }) {
    // Busca o produto e sua receita incluindo os dados do insumo (child)
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: {
        recipeItems: {
          include: { child: true },
        },
      },
    });

    if (!product) {
      throw new BadRequestException('Produto não encontrado.');
    }

    if (product.recipeItems.length === 0) {
      throw new BadRequestException('Este produto não possui uma receita (BOM) definida.');
    }

    // Calcula os ingredientes necessários convertendo da unidade da receita para a unidade do insumo no estoque
    const requiredIngredients = product.recipeItems.map((item) => {
      let requiredInStockUnit: number;
      const recipeUnit = item.unit || item.child.unit;
      try {
        const singleConverted = convertQuantity(
          Number(item.quantity),
          recipeUnit,
          item.child.unit
        );
        requiredInStockUnit = Number((singleConverted * data.quantity).toFixed(6));
      } catch (err: any) {
        throw new BadRequestException(
          `Erro na receita de '${product.name}' com o ingrediente '${item.child.name}': ${err.message}`
        );
      }

      return {
        productId: item.childId,
        productName: item.child.name,
        stockUnit: item.child.unit,
        recipeUnit: item.unit,
        recipeQuantity: Number(item.quantity) * data.quantity,
        requiredQuantity: requiredInStockUnit,
      };
    });

    // Verifica o estoque atual dos ingredientes para emitir aviso (se necessário)
    const warnings: string[] = [];

    // Inicia a transação
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Consome os ingredientes (MANUFACTURING_CONSUMPTION) convertidos para a unidade do estoque
      for (const ingredient of requiredIngredients) {
        const currentStock = await tx.ledgerEntry.aggregate({
          where: { productId: ingredient.productId },
          _sum: { quantity: true },
        });

        const stockAvailable = Number(currentStock._sum.quantity || 0);
        if (stockAvailable < ingredient.requiredQuantity) {
          warnings.push(
            `Estoque insuficiente para o insumo "${ingredient.productName}". Disponível: ${stockAvailable} ${ingredient.stockUnit}, Necessário: ${ingredient.requiredQuantity} ${ingredient.stockUnit}`
          );
        }

        await tx.ledgerEntry.create({
          data: {
            productId: ingredient.productId,
            quantity: -ingredient.requiredQuantity,
            type: 'MANUFACTURING_CONSUMPTION',
          },
        });
      }

      // 2. Produz o item final (MANUFACTURING_PRODUCTION)
      await tx.ledgerEntry.create({
        data: {
          productId: data.productId,
          quantity: data.quantity,
          type: 'MANUFACTURING_PRODUCTION',
        },
      });

      return { success: true, produced: data.quantity };
    });

    return {
      ...result,
      warnings: warnings.length > 0 ? warnings : null,
    };
  }
}

