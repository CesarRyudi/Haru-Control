import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ProductCreateInput) {
    console.log("Creating product with data:", data);
    return this.prisma.product.create({
      data: {
        name: data.name,
        unit: data.unit,
        price: data.price,
      },
    });
  }

  async findAll() {
    return this.prisma.product.findMany({
      orderBy: { name: "asc" },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
    });
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
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
}
