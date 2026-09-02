import { Order, OrderStatus } from "@haru-control/types";
import { FloatingActionButton, Toast } from "@haru-control/ui";
import {
  formatCurrency,
  formatDate,
  getTodayString,
} from "@haru-control/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./OrderBoard.css";

export default function OrderBoard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedDate, setCompletedDate] = useState(getTodayString());
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.DRAFT);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const boardColumnsRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders(true);
    }, 3000);
    return () => clearInterval(interval);
  }, [completedDate]);

  const handleAcknowledge = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/acknowledge`);
      loadOrders(true);
      setToast({ message: "Alerta confirmado com sucesso!", type: "success" });
    } catch (error) {
      console.error("Erro ao confirmar pedido:", error);
      setToast({ message: "Erro ao confirmar pedido", type: "error" });
    }
  };

  const loadOrders = async (preserveScroll = false) => {
    console.log("Loading orders...");

    // Salvar posição de scroll se necessário
    if (preserveScroll && boardColumnsRef.current) {
      scrollPositionRef.current = boardColumnsRef.current.scrollLeft;
    }

    // Não mostrar loading quando estamos preservando o scroll (atualização em background)
    if (!preserveScroll) {
      setLoading(true);
    }

    try {
      // Buscar todos os pedidos não concluídos
      const allOrdersRes = await api.get("/orders", {
        params: {
          excludeStatus: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
        },
      });
      console.log("All orders response:", allOrdersRes.data);

      // Buscar pedidos concluídos da data selecionada
      const completedRes = await api.get("/orders/completed", {
        params: { date: completedDate },
      });
      console.log("Completed orders response:", completedRes.data);

      // Prevenir duplicatas caso o backend retorne o mesmo pedido
      const ordersMap = new Map();
      [...allOrdersRes.data, ...completedRes.data].forEach((order: Order) => {
        ordersMap.set(order.id, order);
      });

      const allOrders = Array.from(ordersMap.values());
      console.log("Combined orders:", allOrders);
      setOrders(allOrders);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    } finally {
      if (!preserveScroll) {
        setLoading(false);
      }

      // Restaurar posição de scroll
      if (preserveScroll) {
        setTimeout(() => {
          if (boardColumnsRef.current) {
            boardColumnsRef.current.scrollLeft = scrollPositionRef.current;
          }
        }, 0);
      }
    }
  };

  const getOrdersByStatus = (status: OrderStatus) => {
    return orders.filter((order) => order.status === status);
  };

  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatus,
  ) => {
    try {
      if (newStatus === OrderStatus.COMPLETED) {
        await api.post(`/orders/${orderId}/complete`);
      } else {
        await api.patch(`/orders/${orderId}`, { status: newStatus });
      }
      loadOrders(true);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      alert("Erro ao atualizar status do pedido");
    }
  };


  if (loading) {
    return <div className="loading">Carregando...</div>;
  }

  return (
    <div className="order-board">
      <header className="board-header">
        <h1>Pedidos</h1>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            className="insights-btn-header"
            onClick={() => navigate("/insights")}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#4f46e5",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <span>📊</span> Insights
          </button>
          <button
            className="help-btn-header"
            onClick={() => navigate("/help")}
            style={{
              background: "#ffffff",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              padding: "8px 14px",
              fontSize: "13px",
              fontWeight: 600,
              color: "#475569",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              cursor: "pointer",
              boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
            }}
          >
            <span>📖</span> Ajuda
          </button>
        </div>
      </header>
      <div className="board-tabs">
        <button
          className={`tab-btn ${activeTab === OrderStatus.DRAFT ? "active" : ""}`}
          onClick={() => setActiveTab(OrderStatus.DRAFT)}
        >
          Rascunho
          <span className="tab-badge">
            {getOrdersByStatus(OrderStatus.DRAFT).length}
          </span>
        </button>
        <button
          className={`tab-btn ${activeTab === OrderStatus.PENDING ? "active" : ""}`}
          onClick={() => setActiveTab(OrderStatus.PENDING)}
        >
          Produção
          <span className="tab-badge">
            {getOrdersByStatus(OrderStatus.PENDING).length}
          </span>
        </button>
        <button
          className={`tab-btn ${activeTab === OrderStatus.READY ? "active" : ""}`}
          onClick={() => setActiveTab(OrderStatus.READY)}
        >
          Em Entrega
          <span className="tab-badge">
            {getOrdersByStatus(OrderStatus.READY).length}
          </span>
        </button>
        <button
          className={`tab-btn ${activeTab === OrderStatus.COMPLETED ? "active" : ""}`}
          onClick={() => setActiveTab(OrderStatus.COMPLETED)}
        >
          Concluídos
          <span className="tab-badge">
            {getOrdersByStatus(OrderStatus.COMPLETED).length}
          </span>
        </button>
      </div>

      <div className="board-content" ref={boardColumnsRef}>
        {activeTab === OrderStatus.DRAFT && (
          <div className="board-column active-column">
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
                    onEdit={() => navigate(`/orders/${order.id}/edit`)}
                    showToast={setToast}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === OrderStatus.PENDING && (
          <div className="board-column active-column">
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
                    onAcknowledge={handleAcknowledge}
                    onEdit={() => navigate(`/orders/${order.id}/edit`)}
                    showToast={setToast}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === OrderStatus.READY && (
          <div className="board-column active-column">
            <h2>Em Entrega</h2>
            <div className="orders-list">
              {getOrdersByStatus(OrderStatus.READY).length === 0 ? (
                <p className="empty-state">Nenhum pedido pronto</p>
              ) : (
                getOrdersByStatus(OrderStatus.READY).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onEdit={() => navigate(`/orders/${order.id}/edit`)}
                    showToast={setToast}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === OrderStatus.COMPLETED && (
          <div className="board-column active-column">
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
        )}
      </div>

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <FloatingActionButton
        onClick={() => navigate("/orders/new")}
        icon="＋"
      />
    </div>
  );
}

interface OrderCardProps {
  order: any;
  onStatusChange?: (id: string, status: OrderStatus) => void;
  onAcknowledge?: (id: string) => void;
  onEdit?: () => void;
  readonly?: boolean;
  showToast?: (
    toast: { message: string; type: "success" | "error" } | null,
  ) => void;
}

function OrderCard({
  order,
  onStatusChange,
  onAcknowledge,
  onEdit,
  readonly,
  showToast,
}: OrderCardProps) {
  const [showModal, setShowModal] = useState(false);

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button")) {
      return;
    }
    setShowModal(true);
  };

  const getPrevStatus = () => {
    switch (order.status) {
      case OrderStatus.PENDING:
        return OrderStatus.DRAFT;
      case OrderStatus.READY:
        return OrderStatus.PENDING;
      default:
        return null;
    }
  };

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
          `${item.quantity}  ${item.product.name}(${formatCurrency(item.unitPrice)})`,
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

${order.customer?.name ? `Cliente: ${order.customer.name}\n` : ""}${order.address ? `Endereço para entrega:\n${order.address}\n\n` : ""}Certo?`;

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
  const prevStatus = getPrevStatus();

  const getStatusLabel = () => {
    switch (order.status) {
      case OrderStatus.DRAFT:
        return "Rascunho";
      case OrderStatus.PENDING:
        return "Produção";
      case OrderStatus.READY:
        return "Em entrega";
      case OrderStatus.COMPLETED:
        return "Concluído";
      case OrderStatus.CANCELLED:
        return "Cancelado";
      default:
        return order.status;
    }
  };

  const formatAckTime = (date: any) => {
    if (!date) return "";
    try {
      const d = new Date(date);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const totalWithDelivery =
    parseFloat(order.totalPrice) + parseFloat(order.deliveryFee || 0);

  return (
    <>
      <div className="order-card" onClick={handleCardClick}>
        <div className="order-header">
          <div className="order-header-left">
            <span className="order-id">#{order.id.slice(0, 8)}</span>
            <span className={`status-badge status-${order.status.toLowerCase()}`}>
              {getStatusLabel()}
            </span>
            {order.status === OrderStatus.PENDING && order.pushoverReceipt && (
              order.acknowledgedAt ? (
                <span
                  className="ack-badge ack-confirmed"
                  title={`Confirmado no celular às ${formatAckTime(order.acknowledgedAt)}`}
                >
                  ✅ Confirmado {formatAckTime(order.acknowledgedAt)}
                </span>
              ) : (
                <button
                  type="button"
                  className="ack-badge ack-pending"
                  title="Alarme tocando no celular. Clique para confirmar pelo painel"
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge?.(order.id);
                  }}
                >
                  🔔 Pendente
                </button>
              )
            )}
          </div>
          <span className="order-time">{formatDate(order.createdAt)}</span>
        </div>

        {order.address && (
          <div className="order-address-text">{order.address}</div>
        )}

        {order.customer?.name && (
          <div className="order-customer-name">
            👤 {order.customer.name}
          </div>
        )}

        <div className="order-total">{formatCurrency(totalWithDelivery)}</div>

        {order.items && (
          <div className="order-items-container">
            <div className="order-items">
              {order.items.slice(0, 6).map((item: any) => (
                <div key={item.id} className="order-item">
                  {item.quantity}x {item.product.name}
                </div>
              ))}
              {order.items.length > 6 && (
                <div className="order-item-more">
                  +{order.items.length - 6} mais
                </div>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCopyOrder();
              }}
              className="btn-copy"
              title="Copiar pedido"
            >
              📋
            </button>
          </div>
        )}

        {!readonly && (
          <div className="order-actions">
            {prevStatus && onStatusChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(order.id, prevStatus);
                }}
                className="btn-back-phase"
              >
                Voltar
              </button>
            )}

            {nextStatus && onStatusChange && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onStatusChange(order.id, nextStatus);
                }}
                className="btn-advance"
              >
                {nextStatus === OrderStatus.COMPLETED ? "Concluir" : "Avançar"}
              </button>
            )}
          </div>
        )}
      </div>

      {showModal && (
        <div className="order-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="order-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="order-modal-header">
              <div>
                <h3>Pedido #{order.id.slice(0, 8)}</h3>
                {order.customer?.name && (
                  <div className="order-modal-customer">
                    👤 {order.customer.name}
                  </div>
                )}
                {order.address && (
                  <div className="order-modal-address">
                    📍 {order.address}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>
            <div className="order-modal-items">
              {order.items?.map((item: any) => (
                <div key={item.id} className="order-modal-item">
                  <span className="item-qty">{item.quantity}x</span>
                  <span className="item-name">{item.product.name}</span>
                  <span className="item-price">
                    {formatCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="order-modal-total">
              <div className="total-line">
                <span>Produtos:</span>
                <span>{formatCurrency(order.totalPrice)}</span>
              </div>
              <div className="total-line">
                <span>Entrega:</span>
                <span>{formatCurrency(order.deliveryFee || 0)}</span>
              </div>
              <div className="total-line total-final">
                <span>Total:</span>
                <strong>{formatCurrency(totalWithDelivery)}</strong>
              </div>
            </div>
            {!readonly && onEdit && (
              <div className="order-modal-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                  className="btn-edit-modal"
                >
                  Editar Pedido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
