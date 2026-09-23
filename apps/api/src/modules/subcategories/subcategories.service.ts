import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubcategoriesService {
  constructor(private prisma: PrismaService) {}

  create(data: { name: string; categoryId: string; price?: number; observation?: string }) {
    return this.prisma.subcategory.create({
      data: {
        name: data.name,
        categoryId: data.categoryId,
        price: data.price !== undefined ? data.price : null,
        observation: data.observation || null,
      },
      include: {
        category: true,
      },
    });
  }

  findAll(filter?: { categoryId?: string }) {
    const where: any = {};
    if (filter?.categoryId) {
      where.categoryId = filter.categoryId;
    }

    return this.prisma.subcategory.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  findOne(id: string) {
    return this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });
  }

  update(id: string, data: any) {
    return this.prisma.subcategory.update({
      where: { id },
      data,
      include: {
        category: true,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.product.updateMany({
      where: { subcategoryId: id },
      data: { subcategoryId: null },
    });

    return this.prisma.subcategory.delete({
      where: { id },
    });
  }
}
