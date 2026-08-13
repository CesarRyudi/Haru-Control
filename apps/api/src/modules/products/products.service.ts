import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

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

  async findAll() {
    return this.prisma.product.findMany({
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
    return this.prisma.recipeItem.create({
      data: {
        parentId: id,
        childId: data.childId,
        quantity: data.quantity,
        unit: data.unit ?? "Un",
      },
    });
  }

  async removeRecipeItem(id: string, recipeItemId: string) {
    return this.prisma.recipeItem.delete({
      where: { id: recipeItemId },
    });
  }
}
