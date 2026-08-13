import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ManufacturingService {
  constructor(private readonly prisma: PrismaService) {}

  async produce(data: { productId: string; quantity: number }) {
    // Busca o produto e sua receita
    const product = await this.prisma.product.findUnique({
      where: { id: data.productId },
      include: { recipeItems: true },
    });

    if (!product) {
      throw new BadRequestException('Produto não encontrado.');
    }

    if (product.recipeItems.length === 0) {
      throw new BadRequestException('Este produto não possui uma receita (BOM) definida.');
    }

    // Calcula os ingredientes necessários
    const requiredIngredients = product.recipeItems.map(item => ({
      productId: item.childId,
      requiredQuantity: Number(item.quantity) * data.quantity,
    }));

    // Verifica o estoque atual dos ingredientes para emitir aviso (se necessário)
    // Para simplificar e performar melhor, vamos permitir o registro e retornar um aviso.
    const warnings: string[] = [];
    
    // Inicia a transação
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Consome os ingredientes (MANUFACTURING_CONSUMPTION)
      for (const ingredient of requiredIngredients) {
        // Verifica estoque atual (opcional, apenas para o aviso)
        const currentStock = await tx.ledgerEntry.aggregate({
          where: { productId: ingredient.productId },
          _sum: { quantity: true },
        });

        const stockAvailable = Number(currentStock._sum.quantity || 0);
        if (stockAvailable < ingredient.requiredQuantity) {
          warnings.push(`Estoque negativo para o insumo ID ${ingredient.productId}. Disponível: ${stockAvailable}, Necessário: ${ingredient.requiredQuantity}`);
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
