import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  create(data: CreateCategoryDto) {
    return this.prisma.category.create({
      data,
    });
  }

  findAll() {
    return this.prisma.category.findMany({
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  update(id: string, data: UpdateCategoryDto) {
    return this.prisma.category.update({
      where: { id },
      data,
      include: {
        subcategories: {
          orderBy: { name: 'asc' },
        },
      },
    });
  }

  async remove(id: string) {
    await this.prisma.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: null, subcategoryId: null },
    });
    return this.prisma.category.delete({
      where: { id },
    });
  }
}
