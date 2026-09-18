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
  phone: string | null;
  address: string | null;
  observation: string | null;
  createdAt: Date;
}

export interface Order {
  id: string;
  customerId: string | null;
  status: OrderStatus;
  totalPrice: number;
  deliveryFee: number;
  address: string | null;
  pushoverReceipt?: string | null;
  acknowledgedAt?: Date | string | null;
  completedAt?: Date | string | null;
  notify?: boolean;
  createdAt: Date;
  updatedAt: Date;
  customer?: Customer | null;
  items?: any[];
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

export enum WasteReason {
  EXPIRED = "EXPIRED",
  DAMAGE = "DAMAGE",
  BAKING_FAILURE = "BAKING_FAILURE",
  TASTING = "TASTING",
  OTHER = "OTHER",
}

export const WASTE_REASON_LABELS: Record<WasteReason, string> = {
  [WasteReason.EXPIRED]: "Validade Vencida",
  [WasteReason.DAMAGE]: "Quebra / Avaria",
  [WasteReason.BAKING_FAILURE]: "Falha de Forno / Preparo",
  [WasteReason.TASTING]: "Teste / Degustação",
  [WasteReason.OTHER]: "Outro Motivo",
};

export const WASTE_REASON_ICONS: Record<WasteReason, string> = {
  [WasteReason.EXPIRED]: "⏳",
  [WasteReason.DAMAGE]: "💥",
  [WasteReason.BAKING_FAILURE]: "🔥",
  [WasteReason.TASTING]: "🍴",
  [WasteReason.OTHER]: "📝",
};

export interface LedgerEntry {
  id: string;
  productId: string;
  orderId: string | null;
  quantity: number;
  type: string;
  wasteReason?: WasteReason | null;
  notes?: string | null;
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
  address?: string;
}

export interface UpdateOrderDto {
  items?: CreateOrderItemDto[];
  status?: "DRAFT" | "PENDING" | "READY" | "COMPLETED" | "CANCELLED";
  address?: string;
}

export interface StockInDto {
  productId: string;
  quantity: number;
}

export interface StockAdjustDto {
  productId: string;
  quantity: number;
}

export interface StockWasteDto {
  productId: string;
  quantity: number;
  reason: WasteReason;
  notes?: string;
}

export interface MonthlyProjection {
  isCurrentMonth: boolean;
  projectedRevenue: number;
  dailyAverage: number;
  elapsedDays: number;
  remainingDays: number;
  totalDaysInMonth: number;
}

export interface WasteMetricsItem {
  reason: WasteReason;
  label: string;
  icon: string;
  quantity: number;
  estimatedCost: number;
  percentage: number;
}

export interface TopWastedProduct {
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  estimatedCost: number;
  mainReason: string;
}

export interface WasteMetrics {
  totalQuantity: number;
  estimatedLossCost: number;
  byReason: WasteMetricsItem[];
  topWastedProducts: TopWastedProduct[];
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
  address?: string | null;
  pushoverReceipt?: string | null;
  acknowledgedAt?: Date | string | null;
  completedAt?: Date | string | null;
  notify?: boolean;
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
