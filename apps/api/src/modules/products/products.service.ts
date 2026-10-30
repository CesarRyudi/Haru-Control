import { Injectable, BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { areProductUnitsCompatible, normalizeUnit } from "@haru-control/utils";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProductUncheckedCreateInput) {
    const yieldNum = data.recipeYield != null && Number(data.recipeYield) > 0 ? Number(data.recipeYield) : null;
    const yieldUnit = yieldNum && data.recipeYieldUnit ? normalizeUnit(String(data.recipeYieldUnit)) : null;

    return this.prisma.product.create({
      data: {
        name: data.name,
        unit: data.unit,
        price: data.price,
        recipeYield: yieldNum,
        recipeYieldUnit: yieldUnit,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        isSellable: data.isSellable,
        isPurchasable: data.isPurchasable,
        description: data.description,
      },
      include: {
        category: true,
        subcategory: true,
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
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
      },
    });
  }

  async update(id: string, data: Prisma.ProductUncheckedUpdateInput) {
    const updateData: Prisma.ProductUncheckedUpdateInput = { ...data };
    if (data.recipeYield !== undefined) {
      const yieldNum = data.recipeYield != null && Number(data.recipeYield) > 0 ? Number(data.recipeYield) : null;
      updateData.recipeYield = yieldNum;
      if (!yieldNum) {
        updateData.recipeYieldUnit = null;
      } else if (data.recipeYieldUnit) {
        updateData.recipeYieldUnit = normalizeUnit(String(data.recipeYieldUnit));
      }
    } else if (data.recipeYieldUnit !== undefined) {
      updateData.recipeYieldUnit = data.recipeYieldUnit ? normalizeUnit(String(data.recipeYieldUnit)) : null;
    }

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        subcategory: true,
      },
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
      select: { name: true, unit: true, recipeYield: true, recipeYieldUnit: true },
    });

    if (!child) {
      throw new BadRequestException("Insumo / Ingrediente não encontrado.");
    }

    const defaultUnit =
      child.recipeYield && Number(child.recipeYield) > 0 && child.recipeYieldUnit
        ? normalizeUnit(child.recipeYieldUnit)
        : normalizeUnit(child.unit);
    const unit = data.unit ? normalizeUnit(data.unit) : defaultUnit;

    if (!areProductUnitsCompatible(unit, child)) {
      const yieldHint =
        child.recipeYield && child.recipeYieldUnit
          ? ` (ou ${child.recipeYield} ${child.recipeYieldUnit})`
          : "";
      throw new BadRequestException(
        `Incompatibilidade de unidades: Não é possível usar '${data.unit || unit}' para o insumo '${child.name}', que está cadastrado em '${child.unit}'${yieldHint}.`
      );
    }

    const existing = await this.prisma.recipeItem.findUnique({
      where: {
        parentId_childId: {
          parentId: id,
          childId: data.childId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException(
        `O ingrediente '${child.name}' já está na receita. Toque nele na lista para editar a quantidade.`
      );
    }

    return this.prisma.recipeItem.create({
      data: {
        parentId: id,
        childId: data.childId,
        quantity: data.quantity,
        unit,
      },
      include: { child: true },
    });
  }

  async updateRecipeItem(
    parentId: string,
    recipeItemId: string,
    data: { childId?: string; quantity?: number; unit?: string }
  ) {
    const existing = await this.prisma.recipeItem.findUnique({
      where: { id: recipeItemId },
    });

    if (!existing || existing.parentId !== parentId) {
      throw new NotFoundException("Item da receita não encontrado.");
    }

    const targetChildId = data.childId || existing.childId;
    const child = await this.prisma.product.findUnique({
      where: { id: targetChildId },
      select: { name: true, unit: true, recipeYield: true, recipeYieldUnit: true },
    });

    if (!child) {
      throw new BadRequestException("Insumo / Ingrediente não encontrado.");
    }

    const unit = data.unit ? normalizeUnit(data.unit) : existing.unit || normalizeUnit(child.unit);

    if (!areProductUnitsCompatible(unit, child)) {
      const yieldHint =
        child.recipeYield && child.recipeYieldUnit
          ? ` (ou ${child.recipeYield} ${child.recipeYieldUnit})`
          : "";
      throw new BadRequestException(
        `Incompatibilidade de unidades: Não é possível usar '${data.unit || unit}' para o insumo '${child.name}', que está cadastrado em '${child.unit}'${yieldHint}.`
      );
    }

    if (data.childId && data.childId !== existing.childId) {
      const duplicate = await this.prisma.recipeItem.findUnique({
        where: {
          parentId_childId: {
            parentId,
            childId: data.childId,
          },
        },
      });
      if (duplicate) {
        throw new BadRequestException(
          `O ingrediente '${child.name}' já está na receita.`
        );
      }
    }

    return this.prisma.recipeItem.update({
      where: { id: recipeItemId },
      data: {
        childId: targetChildId,
        quantity: data.quantity !== undefined ? data.quantity : existing.quantity,
        unit,
      },
      include: { child: true },
    });
  }

  async removeRecipeItem(id: string, recipeItemId: string) {
    return this.prisma.recipeItem.delete({
      where: { id: recipeItemId },
    });
  }
}
