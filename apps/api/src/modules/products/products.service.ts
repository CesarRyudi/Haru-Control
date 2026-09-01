import { Injectable, BadRequestException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { areUnitsCompatible, normalizeUnit } from "@haru-control/utils";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProductUncheckedCreateInput) {
    console.log("Creating product with data:", data);
    return this.prisma.product.create({
      data: {
        name: data.name,
        unit: data.unit,
        price: data.price,
        categoryId: data.categoryId,
        isSellable: data.isSellable,
        isPurchasable: data.isPurchasable,
      },
    });
  }

  async findAll(filter?: { isSellable?: boolean; isPurchasable?: boolean }) {
    const where: Prisma.ProductWhereInput = {};
    if (filter?.isSellable !== undefined) {
      where.isSellable = filter.isSellable;
    }
    if (filter?.isPurchasable !== undefined) {
      where.isPurchasable = filter.isPurchasable;
    }

    return this.prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.ProductUncheckedUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async getRecipe(id: string) {
    return this.prisma.recipeItem.findMany({
      where: { parentId: id },
      include: { child: true },
    });
  }

  async addRecipeItem(id: string, data: { childId: string; quantity: number; unit?: string }) {
    const child = await this.prisma.product.findUnique({
      where: { id: data.childId },
      select: { name: true, unit: true },
    });

    if (!child) {
      throw new BadRequestException("Insumo / Ingrediente não encontrado.");
    }

    const unit = data.unit ? normalizeUnit(data.unit) : normalizeUnit(child.unit);

    if (!areUnitsCompatible(unit, child.unit)) {
      throw new BadRequestException(
        `Incompatibilidade de unidades: Não é possível usar '${data.unit || unit}' para o insumo '${child.name}', que está cadastrado em '${child.unit}'.`
      );
    }

    return this.prisma.recipeItem.create({
      data: {
        parentId: id,
        childId: data.childId,
        quantity: data.quantity,
        unit,
      },
    });
  }

  async removeRecipeItem(id: string, recipeItemId: string) {
    return this.prisma.recipeItem.delete({
      where: { id: recipeItemId },
    });
  }
}
