import { format } from "date-fns";

export function formatCurrency(value: number | string): string {
  const numValue = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(numValue);
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy HH:mm");
}

export function formatDateOnly(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "dd/MM/yyyy");
}

export function getTodayString(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export interface OrderConfirmationItem {
  quantity: number;
  productName: string;
  unitPrice: number;
}

export function formatOrderConfirmationMessage(options: {
  items: OrderConfirmationItem[];
  orderTotal: number;
  deliveryFee: number;
  address?: string | null;
}): string {
  const itemsList = options.items
    .map(
      (item) =>
        `${item.quantity}  ${item.productName}(${formatCurrency(item.unitPrice)})`,
    )
    .join("\n");

  const finalTotal = options.orderTotal + options.deliveryFee;

  return `Então são: 
${itemsList}
 

Valor do pedido: ${formatCurrency(options.orderTotal)} 
Taxa de entrega: ${formatCurrency(options.deliveryFee)} 
Valor total: ${formatCurrency(finalTotal)} 

${options.address ? `Endereço para entrega:\n${options.address}\n\n` : ""}Certo?`;
}
