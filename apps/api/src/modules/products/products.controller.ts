import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, IsBoolean } from "class-validator";
import { ProductsService } from "./products.service";

export class AddRecipeItemDto {
  @IsString()
  childId: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;

  @IsString()
  @IsOptional()
  unit?: string;
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  unit: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isSellable?: boolean;

  @IsBoolean()
  @IsOptional()
  isPurchasable?: boolean;
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  unit?: string;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  price?: number;

  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsBoolean()
  @IsOptional()
  isSellable?: boolean;

  @IsBoolean()
  @IsOptional()
  isPurchasable?: boolean;
}

@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  create(@Body() createProductDto: CreateProductDto) {
    console.log("Received product data:", createProductDto);
    return this.productsService.create(createProductDto);
  }

  @Get()
  findAll(
    @Query("isSellable") isSellable?: string,
    @Query("isPurchasable") isPurchasable?: string
  ) {
    return this.productsService.findAll({
      isSellable: isSellable !== undefined ? isSellable === "true" : undefined,
      isPurchasable:
        isPurchasable !== undefined ? isPurchasable === "true" : undefined,
    });
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(":id")
  update(@Param("id") id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.productsService.remove(id);
  }

  @Get(":id/recipe")
  getRecipe(@Param("id") id: string) {
    return this.productsService.getRecipe(id);
  }

  @Post(":id/recipe")
  addRecipeItem(@Param("id") id: string, @Body() addRecipeItemDto: AddRecipeItemDto) {
    return this.productsService.addRecipeItem(id, addRecipeItemDto);
  }

  @Delete(":id/recipe/:recipeItemId")
  removeRecipeItem(@Param("id") id: string, @Param("recipeItemId") recipeItemId: string) {
    return this.productsService.removeRecipeItem(id, recipeItemId);
  }
}
