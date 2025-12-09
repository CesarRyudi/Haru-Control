// Prisma-like types (duplicated to avoid importing @prisma/client in frontend)
export enum OrderStatus {
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  READY = "READY",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  name: string;
  contact: string | null;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string | null;
  status: OrderStatus;
  totalPrice: number;
  deliveryFee: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
}

export interface Sale {
  id: string;
  orderId: string;
  createdAt: Date;
}

export interface LedgerEntry {
  id: string;
  productId: string;
  orderId: string | null;
  quantity: number;
  type: string;
  createdAt: Date;
}

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
  status?: "DRAFT" | "PENDING" | "READY" | "COMPLETED" | "CANCELLED";
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
