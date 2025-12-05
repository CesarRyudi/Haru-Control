// Re-export Prisma types
export * from '@prisma/client';

// DTOs
export interface CreateProductDto {
  name: string;
  unit: string;
  price: number;
}

export interface UpdateProductDto {
  name?: string;
  unit?: string;
  price?: number;
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
}

export interface CreateOrderDto {
  customerId?: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  items?: CreateOrderItemDto[];
  status?: 'DRAFT' | 'PENDING' | 'READY' | 'COMPLETED' | 'CANCELLED';
}

export interface StockInDto {
  productId: string;
  quantity: number;
}

export interface StockAdjustDto {
  productId: string;
  quantity: number;
}

// Response types
export interface StockSnapshot {
  productId: string;
  productName: string;
  currentStock: number;
  warnings?: string[];
}

export interface OrderResponse {
  id: string;
  customerId?: string;
  status: string;
  totalPrice: number;
  items: OrderItemResponse[];
  createdAt: Date;
  updatedAt: Date;
  warnings?: string[];
}

export interface OrderItemResponse {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

export interface ProductResponse {
  id: string;
  name: string;
  unit: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}
