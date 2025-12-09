import { Order, OrderStatus } from "@haru-control/types";
import { Toast } from "@haru-control/ui";
import {
  formatCurrency,
  formatDate,
  getTodayString,
} from "@haru-control/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./OrderBoard.css";

export default function OrderBoard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedDate, setCompletedDate] = useState(getTodayString());
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadOrders();
  }, [completedDate]);

  const loadOrders = async () => {
    console.log("Loading orders...");
    setLoading(true);
    try {
      // Buscar todos os pedidos não concluídos
      const allOrdersRes = await api.get("/orders");
      console.log("All orders response:", allOrdersRes.data);

      // Buscar pedidos concluídos da data selecionada
      const completedRes = await api.get("/orders/completed", {
        params: { date: completedDate },
      });
      console.log("Completed orders response:", completedRes.data);

      const allOrders = [...allOrdersRes.data, ...completedRes.data];
      console.log("Combined orders:", allOrders);
      setOrders(allOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      setLoading(false);
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus
  ) => {
    try {
      if (newStatus === OrderStatus.COMPLETED) {
        await api.post(`/orders/${orderId}/complete`);
      } else {
        await api.patch(`/orders/${orderId}`, { status: newStatus });
      }
      loadOrders();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do pedido");
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm("Deseja realmente cancelar este pedido?")) return;

    try {
      await api.post(`/orders/${orderId}/cancel`);
      loadOrders();
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      alert("Erro ao cancelar pedido");
    }
  };

  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="order-board">
      <header className="board-header">
        <h1>Pedidos</h1>
        <div className="header-actions">
          <button
            onClick={() => navigate("/products")}
            className="btn-secondary"
          >
            Produtos
          </button>
          <button onClick={() => navigate("/stock")} className="btn-secondary">
            Estoque
          </button>
          <button
            onClick={() => navigate("/orders/new")}
            className="btn-primary"
          >
            + Novo Pedido
          </button>
        </div>
      </header>

      <div className="board-columns">
        <div className="board-column">
          <h2>Rascunho</h2>
          <div className="orders-list">
            {getOrdersByStatus(OrderStatus.DRAFT).length === 0 ? (
              <p className="empty-state">Nenhum pedido rascunho</p>
            ) : (
              getOrdersByStatus(OrderStatus.DRAFT).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onCancel={handleCancelOrder}
                  onEdit={() => navigate(`/orders/${order.id}/edit`)}
                  showToast={setToast}
                />
              ))
            )}
          </div>
        </div>

        <div className="board-column">
          <h2>Em Produção</h2>
          <div className="orders-list">
            {getOrdersByStatus(OrderStatus.PENDING).length === 0 ? (
              <p className="empty-state">Nenhum pedido em produção</p>
            ) : (
              getOrdersByStatus(OrderStatus.PENDING).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onCancel={handleCancelOrder}
                  onEdit={() => navigate(`/orders/${order.id}/edit`)}
                  showToast={setToast}
                />
              ))
            )}
          </div>
        </div>

        <div className="board-column">
          <h2>Pronto</h2>
          <div className="orders-list">
            {getOrdersByStatus(OrderStatus.READY).length === 0 ? (
              <p className="empty-state">Nenhum pedido pronto</p>
            ) : (
              getOrdersByStatus(OrderStatus.READY).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  onStatusChange={handleStatusChange}
                  onCancel={handleCancelOrder}
                  onEdit={() => navigate(`/orders/${order.id}/edit`)}
                  showToast={setToast}
                />
              ))
            )}
          </div>
        </div>

        <div className="board-column">
          <div className="column-header">
            <h2>Concluídos</h2>
            <input
              type="date"
              value={completedDate}
              onChange={(e) => setCompletedDate(e.target.value)}
              className="date-filter"
            />
          </div>
          <div className="orders-list">
            {getOrdersByStatus(OrderStatus.COMPLETED).length === 0 ? (
              <p className="empty-state">Nenhum pedido concluído</p>
            ) : (
              getOrdersByStatus(OrderStatus.COMPLETED).map((order) => (
                <OrderCard
                  key={order.id}
                  order={order}
                  readonly
                  showToast={setToast}
                />
              ))
            )}
          </div>
        </div>
      </div>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}

interface OrderCardProps {
  order: any;
  onStatusChange?: (id: string, status: OrderStatus) => void;
  onCancel?: (id: string) => void;
  onEdit?: () => void;
  readonly?: boolean;
  showToast?: (
    toast: { message: string; type: "success" | "error" } | null
  ) => void;
}

function OrderCard({
  order,
  onStatusChange,
  onCancel,
  onEdit,
  readonly,
  showToast,
}: OrderCardProps) {
  const getNextStatus = () => {
    switch (order.status) {
      case OrderStatus.DRAFT:
        return OrderStatus.PENDING;
      case OrderStatus.PENDING:
        return OrderStatus.READY;
      case OrderStatus.READY:
        return OrderStatus.COMPLETED;
      default:
        return null;
    }
  };

  const handleCopyOrder = () => {
    if (!order.items || order.items.length === 0) {
      showToast?.({ message: "Nenhum item no pedido", type: "error" });
      return;
    }

    // Formatar itens do pedido
    const itemsList = order.items
      .map(
        (item: any) =>
          `${item.quantity}  ${item.product.name}(${formatCurrency(item.unitPrice)})`
      )
      .join("\n");

    // Usar taxa de entrega do pedido
    const deliveryFee = parseFloat(order.deliveryFee || 0);
    const orderTotal = parseFloat(order.totalPrice);
    const finalTotal = orderTotal + deliveryFee;

    // Montar mensagem completa
    const orderText = `Então são: 
${itemsList}
 

Valor do pedido: ${formatCurrency(orderTotal)} 
Taxa de entrega: ${formatCurrency(deliveryFee)} 

Valor total: ${formatCurrency(finalTotal)} 

Certo?`;

    // Tentar usar a API moderna do clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(orderText)
        .then(() => {
          showToast?.({ message: "Pedido copiado!", type: "success" });
        })
        .catch((error) => {
          console.error("Erro ao copiar:", error);
          // Fallback para o método antigo
          copyToClipboardFallback(orderText);
        });
    } else {
      // Fallback para navegadores antigos
      copyToClipboardFallback(orderText);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      showToast?.({ message: "Pedido copiado!", type: "success" });
    } catch (error) {
      console.error("Erro ao copiar:", error);
      showToast?.({ message: "Erro ao copiar pedido", type: "error" });
    } finally {
      document.body.removeChild(textArea);
    }
  };

  const nextStatus = getNextStatus();

  const getStatusLabel = () => {
    switch (order.status) {
      case OrderStatus.DRAFT:
        return "Rascunho";
      case OrderStatus.PENDING:
        return "Pendente";
      case OrderStatus.READY:
        return "Pronto";
      case OrderStatus.COMPLETED:
        return "Concluído";
      case OrderStatus.CANCELLED:
        return "Cancelado";
      default:
        return order.status;
    }
  };

  const totalWithDelivery =
    parseFloat(order.totalPrice) + parseFloat(order.deliveryFee || 0);

  return (
    <div className="order-card">
      <div className="order-header">
        <div className="order-header-left">
          <span className="order-id">#{order.id.slice(0, 8)}</span>
          <span className={`status-badge status-${order.status.toLowerCase()}`}>
            {getStatusLabel()}
          </span>
        </div>
        <span className="order-time">{formatDate(order.createdAt)}</span>
      </div>

      <div className="order-total">{formatCurrency(totalWithDelivery)}</div>

      {order.deliveryFee !== undefined && order.deliveryFee > 0 && (
        <div className="delivery-fee-info">
          (Produtos: {formatCurrency(order.totalPrice)} + Entrega:{" "}
          {formatCurrency(order.deliveryFee)})
        </div>
      )}

      {order.items && (
        <div className="order-items-container">
          <div className="order-items">
            {order.items.slice(0, 3).map((item: any) => (
              <div key={item.id} className="order-item">
                {item.quantity}x {item.product.name}
              </div>
            ))}
            {order.items.length > 3 && (
              <div className="order-item-more">
                +{order.items.length - 3} mais
              </div>
            )}
          </div>
          <button
            onClick={handleCopyOrder}
            className="btn-copy"
            title="Copiar pedido"
          >
            📋
          </button>
        </div>
      )}

      {!readonly && (
        <div className="order-actions">
          {onCancel && (
            <button onClick={() => onCancel(order.id)} className="btn-cancel">
              Cancelar
            </button>
          )}
          {onEdit && (
            <button onClick={onEdit} className="btn-edit">
              Editar
            </button>
          )}
          {nextStatus && onStatusChange && (
            <button
              onClick={() => onStatusChange(order.id, nextStatus)}
              className="btn-advance"
            >
              {nextStatus === OrderStatus.COMPLETED ? "Concluir" : "Avançar"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
