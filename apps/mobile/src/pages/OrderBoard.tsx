import { Order, OrderStatus } from "@haru-control/types";
import { FloatingActionButton, Toast } from "@haru-control/ui";
import {
  formatCurrency,
  formatDate,
  getTodayString,
  generatePixPayload,
} from "@haru-control/utils";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./OrderBoard.css";

const TABS: OrderStatus[] = [
  OrderStatus.DRAFT,
  OrderStatus.PENDING,
  OrderStatus.COMPLETED,
];

export default function OrderBoard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [completedDate, setCompletedDate] = useState(getTodayString());
  const [activeTab, setActiveTab] = useState<OrderStatus>(OrderStatus.DRAFT);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const boardColumnsRef = useRef<HTMLDivElement>(null);
  const scrollPositionRef = useRef(0);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a, .order-modal-content, .batch-action-bar")) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    touchStartX.current = null;
    touchStartY.current = null;

    // Critérios para swipe horizontal:
    // 1. Mínimo de 50px de deslocamento
    // 2. Movimento predominantemente horizontal (deltaX > 1.5 * deltaY)
    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const currentIndex = TABS.indexOf(activeTab);
      if (deltaX < 0 && currentIndex < TABS.length - 1) {
        // Deslize para a esquerda -> avança de aba
        setActiveTab(TABS[currentIndex + 1]);
        setSelectedOrderIds(new Set());
      } else if (deltaX > 0 && currentIndex > 0) {
        // Deslize para a direita -> volta de aba
        setActiveTab(TABS[currentIndex - 1]);
        setSelectedOrderIds(new Set());
      }
    }
  };

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
    if (status === OrderStatus.PENDING) {
      return orders.filter(
        (order) =>
          order.status === OrderStatus.PENDING ||
          order.status === OrderStatus.READY
      );
    }
    return orders.filter((order) => order.status === status);
  };

  const currentTabOrders = getOrdersByStatus(activeTab);
  const isAllSelected =
    currentTabOrders.length > 0 &&
    currentTabOrders.every((o) => selectedOrderIds.has(o.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedOrderIds(new Set());
      setIsSelectionMode(false);
    } else {
      setSelectedOrderIds(new Set(currentTabOrders.map((o) => o.id)));
      setIsSelectionMode(true);
    }
  };

  const toggleSelectOrder = (orderId: string) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      setIsSelectionMode(next.size > 0);
      return next;
    });
  };

  const handleLongPressCard = (orderId: string) => {
    setIsSelectionMode(true);
    setSelectedOrderIds((prev) => new Set(prev).add(orderId));
  };

  const handleExitSelectionMode = () => {
    setIsSelectionMode(false);
    setSelectedOrderIds(new Set());
  };

  const handleBatchStatusChange = async (targetStatus: OrderStatus) => {
    if (selectedOrderIds.size === 0) return;
    const ids = Array.from(selectedOrderIds);
    setLoading(true);
    try {
      await api.patch("/orders/batch/status", { ids, status: targetStatus });
      setToast({
        message: `${ids.length} ${ids.length === 1 ? "pedido movido" : "pedidos movidos"} com sucesso!`,
        type: "success",
      });
      handleExitSelectionMode();
      await loadOrders(true);
    } catch (error) {
      console.error("Erro ao mover pedidos em lote:", error);
      setToast({ message: "Erro ao mover pedidos em lote", type: "error" });
    } finally {
      setLoading(false);
    }
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
    <div
      className="order-board"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
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
          onClick={() => {
            setActiveTab(OrderStatus.DRAFT);
            setSelectedOrderIds(new Set());
          }}
        >
          Rascunho
          <span className="tab-badge">
            {getOrdersByStatus(OrderStatus.DRAFT).length}
          </span>
        </button>
        <button
          className={`tab-btn ${activeTab === OrderStatus.PENDING ? "active" : ""}`}
          onClick={() => {
            setActiveTab(OrderStatus.PENDING);
            setSelectedOrderIds(new Set());
          }}
        >
          Em Preparo
          <span className="tab-badge">
            {getOrdersByStatus(OrderStatus.PENDING).length}
          </span>
        </button>
        <button
          className={`tab-btn ${activeTab === OrderStatus.COMPLETED ? "active" : ""}`}
          onClick={() => {
            setActiveTab(OrderStatus.COMPLETED);
            setSelectedOrderIds(new Set());
          }}
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
            <div className="column-header">
              <div className="column-header-left">
                {isSelectionMode && getOrdersByStatus(OrderStatus.DRAFT).length > 0 && (
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="column-select-all-checkbox"
                    title={isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
                  />
                )}
                <h2>Rascunho</h2>
                <span className="column-count-badge">
                  ({getOrdersByStatus(OrderStatus.DRAFT).length})
                </span>
              </div>
              {selectedOrderIds.size > 0 && (
                <div className="column-header-batch-actions">
                  <button
                    type="button"
                    className="btn-header-batch btn-header-pending"
                    onClick={() => handleBatchStatusChange(OrderStatus.PENDING)}
                    title="Mover selecionados para Em Preparo"
                  >
                    Em Preparo ({selectedOrderIds.size})
                  </button>
                  <button
                    type="button"
                    className="btn-header-batch btn-header-complete"
                    onClick={() => handleBatchStatusChange(OrderStatus.COMPLETED)}
                    title="Mover selecionados para Concluído"
                  >
                    Concluir ({selectedOrderIds.size})
                  </button>
                  <button
                    type="button"
                    className="btn-header-batch-cancel"
                    onClick={handleExitSelectionMode}
                    title="Cancelar seleção"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
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
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedOrderIds.has(order.id)}
                    onToggleSelect={toggleSelectOrder}
                    onLongPress={handleLongPressCard}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === OrderStatus.PENDING && (
          <div className="board-column active-column">
            <div className="column-header">
              <div className="column-header-left">
                {isSelectionMode && getOrdersByStatus(OrderStatus.PENDING).length > 0 && (
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="column-select-all-checkbox"
                    title={isAllSelected ? "Desmarcar todos" : "Selecionar todos"}
                  />
                )}
                <h2>Em Preparo</h2>
                <span className="column-count-badge">
                  ({getOrdersByStatus(OrderStatus.PENDING).length})
                </span>
              </div>
              {selectedOrderIds.size > 0 && (
                <div className="column-header-batch-actions">
                  <button
                    type="button"
                    className="btn-header-batch btn-header-draft"
                    onClick={() => handleBatchStatusChange(OrderStatus.DRAFT)}
                    title="Mover selecionados para Rascunho"
                  >
                    Rascunho ({selectedOrderIds.size})
                  </button>
                  <button
                    type="button"
                    className="btn-header-batch btn-header-complete"
                    onClick={() => handleBatchStatusChange(OrderStatus.COMPLETED)}
                    title="Mover selecionados para Concluído"
                  >
                    Concluir ({selectedOrderIds.size})
                  </button>
                  <button
                    type="button"
                    className="btn-header-batch-cancel"
                    onClick={handleExitSelectionMode}
                    title="Cancelar seleção"
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>
            <div className="orders-list">
              {getOrdersByStatus(OrderStatus.PENDING).length === 0 ? (
                <p className="empty-state">Nenhum pedido em preparo</p>
              ) : (
                getOrdersByStatus(OrderStatus.PENDING).map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={handleStatusChange}
                    onAcknowledge={handleAcknowledge}
                    onEdit={() => navigate(`/orders/${order.id}/edit`)}
                    showToast={setToast}
                    isSelectionMode={isSelectionMode}
                    isSelected={selectedOrderIds.has(order.id)}
                    onToggleSelect={toggleSelectOrder}
                    onLongPress={handleLongPressCard}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === OrderStatus.COMPLETED && (
          <div className="board-column active-column">
            <div className="column-header">
              <div className="column-header-left">
                <h2>Concluídos</h2>
                <span className="column-count-badge">
                  ({getOrdersByStatus(OrderStatus.COMPLETED).length})
                </span>
              </div>
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
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (id: string) => void;
  onLongPress?: (id: string) => void;
}

function OrderCard({
  order,
  onStatusChange,
  onAcknowledge,
  onEdit,
  readonly,
  showToast,
  isSelectionMode,
  isSelected,
  onToggleSelect,
  onLongPress,
}: OrderCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [isPixExpanded, setIsPixExpanded] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressTriggered = useRef(false);

  const handleTouchStart = () => {
    isLongPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPressTriggered.current = true;
      onLongPress?.(order.id);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest("button, input[type='checkbox']")) {
      return;
    }
    if (isLongPressTriggered.current) {
      isLongPressTriggered.current = false;
      return;
    }
    if (isSelectionMode) {
      onToggleSelect?.(order.id);
      return;
    }
    setIsPixExpanded(false);
    setShowModal(true);
  };

  const getPrevStatus = () => {
    switch (order.status) {
      case OrderStatus.COMPLETED:
        return OrderStatus.PENDING;
      case OrderStatus.READY:
      case OrderStatus.PENDING:
        return OrderStatus.DRAFT;
      default:
        return null;
    }
  };

  const getNextStatus = () => {
    switch (order.status) {
      case OrderStatus.DRAFT:
        return OrderStatus.PENDING;
      case OrderStatus.PENDING:
      case OrderStatus.READY:
        return OrderStatus.COMPLETED;
      default:
        return null;
    }
  };

  const deliveryFee = parseFloat(order.deliveryFee || 0);
  const orderTotal = parseFloat(order.totalPrice || 0);
  const finalTotal = orderTotal + deliveryFee;

  const pixKey = import.meta.env.VITE_PIX_KEY || "11976952264";
  const pixName = import.meta.env.VITE_PIX_NAME || "Haru Cookies";
  const pixCity = import.meta.env.VITE_PIX_CITY || "Sao Paulo";

  const pixCode =
    finalTotal > 0
      ? generatePixPayload({
          key: pixKey,
          name: pixName,
          city: pixCity,
          amount: finalTotal,
          txid: order.id
            ? order.id.slice(0, 10).replace(/[^a-zA-Z0-9]/g, "")
            : "***",
          description: "Haru Cookies",
        })
      : "";

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

    // Montar mensagem completa (formato original sem Pix)
    const orderText = `Então são: 
${itemsList}
 

Valor do pedido: ${formatCurrency(orderTotal)} 
Taxa de entrega: ${formatCurrency(deliveryFee)} 
Valor total: ${formatCurrency(finalTotal)} 

${order.address ? `Endereço para entrega:\n${order.address}\n\n` : ""}Certo?`;

    // Tentar usar a API moderna do clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(orderText)
        .then(() => {
          showToast?.({
            message: "Mensagem de confirmação copiada!",
            type: "success",
          });
        })
        .catch((error) => {
          console.error("Erro ao copiar:", error);
          copyToClipboardFallback(
            orderText,
            "Mensagem de confirmação copiada!",
          );
        });
    } else {
      copyToClipboardFallback(orderText, "Mensagem de confirmação copiada!");
    }
  };

  const handleCopyPixOnly = () => {
    if (!pixCode) {
      showToast?.({ message: "Valor inválido para gerar Pix", type: "error" });
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard
        .writeText(pixCode)
        .then(() => {
          showToast?.({
            message: "Pix Copia e Cola copiado!",
            type: "success",
          });
        })
        .catch(() => {
          copyToClipboardFallback(pixCode, "Pix Copia e Cola copiado!");
        });
    } else {
      copyToClipboardFallback(pixCode, "Pix Copia e Cola copiado!");
    }
  };

  const copyToClipboardFallback = (
    text: string,
    successMessage = "Copiado com sucesso!",
  ) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand("copy");
      showToast?.({ message: successMessage, type: "success" });
    } catch (error) {
      console.error("Erro ao copiar:", error);
      showToast?.({
        message: "Erro ao copiar para a área de transferência",
        type: "error",
      });
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
        return "Em Preparo";
      case OrderStatus.READY:
        return "Em Preparo";
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
      <div
        className={`order-card ${isSelected ? "selected" : ""}`}
        onClick={handleCardClick}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchEnd}
      >
        <div className="order-header">
          <div className="order-header-left">
            {!readonly && isSelectionMode && (
              <div
                className="order-select-checkbox-container"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(order.id);
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected || false}
                  onChange={() => onToggleSelect?.(order.id)}
                  className="order-select-checkbox"
                />
              </div>
            )}
            <span className="order-id">#{order.id.slice(0, 8)}</span>
            <span className={`status-badge status-${order.status.toLowerCase()}`}>

              {getStatusLabel()}
            </span>
            {order.status === OrderStatus.PENDING && (
              order.acknowledgedAt ? (
                <span
                  className="ack-badge ack-confirmed"
                  title={`Confirmado às ${formatAckTime(order.acknowledgedAt)}`}
                >
                  ✅ Confirmado {formatAckTime(order.acknowledgedAt)}
                </span>
              ) : (
                <button
                  type="button"
                  className="ack-badge ack-pending"
                  title={order.pushoverReceipt ? "Alarme tocando no celular. Clique para confirmar pelo painel" : "Clique para confirmar ciência do pedido"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAcknowledge?.(order.id);
                  }}
                >
                  {order.pushoverReceipt ? "🔔 Pendente" : "⏱️ Confirmar"}
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
                {order.acknowledgedAt && (
                  <div style={{ fontSize: "13px", color: "#059669", marginTop: "4px", fontWeight: 600 }}>
                    ✅ Confirmado às {formatAckTime(order.acknowledgedAt)}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setIsPixExpanded(false);
                }}
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

            {/* Seção Pix no Modal de Detalhes (Colapsável, default fechado) */}
            {pixCode && (
              <div className={`order-modal-pix-section ${isPixExpanded ? "expanded" : "collapsed"}`}>
                <div
                  className="pix-section-header"
                  onClick={() => setIsPixExpanded(!isPixExpanded)}
                  title={isPixExpanded ? "Toque para recolher QR Code" : "Toque para abrir QR Code"}
                >
                  <div className="pix-section-title-wrap">
                    <span className="pix-section-title">
                      🔑 Pix Copia e Cola ({formatCurrency(totalWithDelivery)})
                    </span>
                    <span className="pix-toggle-indicator">
                      {isPixExpanded ? "▲ Fechar QR" : "▼ QR Code"}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyPixOnly();
                    }}
                    className="btn-pix-modal-copy"
                  >
                    📋 Copiar Código
                  </button>
                </div>
                {isPixExpanded && (
                  <div className="pix-expanded-content">
                    <div className="pix-code-preview">
                      <code>{pixCode}</code>
                    </div>
                    <div className="pix-qr-container">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(pixCode)}`}
                        alt="QR Code Pix"
                        className="pix-qr-image"
                      />
                      <span className="pix-qr-caption">
                        Aponte a câmera do banco para pagar no balcão
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Botão Copiar Mensagem de Confirmação para WhatsApp */}
            <div className="order-modal-copy-section">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyOrder();
                }}
                className="btn-modal-copy-confirmation"
              >
                💬 Copiar Mensagem de Confirmação
              </button>
            </div>

            {!readonly && (
              <div className="order-modal-actions" style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                {order.status === OrderStatus.PENDING && !order.acknowledgedAt && onAcknowledge && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onAcknowledge(order.id);
                    }}
                    style={{
                      flex: 1,
                      padding: "10px",
                      background: "#10b981",
                      color: "#fff",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "6px",
                      fontSize: "14px",
                    }}
                  >
                    <span>✅</span> Confirmar Pedido
                  </button>
                )}
                {onEdit && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEdit();
                    }}
                    className="btn-edit-modal"
                    style={{ flex: 1 }}
                  >
                    Editar Pedido
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
