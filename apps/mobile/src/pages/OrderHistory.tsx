import { Order, OrderStatus } from "@haru-control/types";
import { Toast } from "@haru-control/ui";
import { formatCurrency, formatDate } from "@haru-control/utils";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./OrderHistory.css";

export default function OrderHistory() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  // Filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Toast
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, startDate, endDate]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== "ALL") {
        params.status = statusFilter;
      }
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (searchTerm.trim()) params.search = searchTerm.trim();

      const res = await api.get("/orders", { params });
      setOrders(res.data);
    } catch (error) {
      console.error("Erro ao carregar histórico:", error);
      setToast({ message: "Erro ao buscar histórico de pedidos", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadOrders();
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("ALL");
    setStartDate("");
    setEndDate("");
    api.get("/orders").then((res) => setOrders(res.data));
  };

  // KPIs calculados sobre os pedidos filtrados
  const totalRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status === OrderStatus.COMPLETED)
      .reduce((sum, o) => sum + Number(o.totalPrice || 0), 0);
  }, [orders]);

  const completedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === OrderStatus.COMPLETED).length;
  }, [orders]);

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return "Concluído";
      case OrderStatus.CANCELLED:
        return "Cancelado";
      case OrderStatus.PENDING:
        return "Produção";
      case OrderStatus.READY:
        return "Em Entrega";
      case OrderStatus.DRAFT:
        return "Rascunho";
      default:
        return status;
    }
  };

  const getStatusClass = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.COMPLETED:
        return "completed";
      case OrderStatus.CANCELLED:
        return "cancelled";
      case OrderStatus.PENDING:
        return "pending";
      case OrderStatus.READY:
        return "ready";
      case OrderStatus.DRAFT:
        return "draft";
      default:
        return "";
    }
  };

  return (
    <div className="order-history-page">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Header */}
      <header className="history-header">
        <div className="history-header-left">
          <button onClick={() => navigate("/")} className="btn-back-history">
            ← Voltar
          </button>
          <h1>📜 Histórico de Pedidos</h1>
        </div>
        <button
          className="btn-new-retroactive"
          onClick={() => navigate("/orders/new?retroactive=true")}
        >
          <span>＋</span> Pedido Histórico
        </button>
      </header>

      {/* KPIs */}
      <div className="history-kpis">
        <div className="kpi-card">
          <div className="kpi-title">Total de Pedidos Listados</div>
          <div className="kpi-value">{orders.length}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Pedidos Concluídos</div>
          <div className="kpi-value">{completedOrdersCount}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-title">Faturamento Concluído</div>
          <div className="kpi-value green">{formatCurrency(totalRevenue)}</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="filter-card">
        <form onSubmit={handleSearchSubmit}>
          <div className="filter-grid">
            <div className="filter-group">
              <label>Buscar (Cliente, Endereço, Produto, ID)</label>
              <input
                type="text"
                placeholder="Ex: Maria, Rua das Flores..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">Todos os Status</option>
                <option value={OrderStatus.COMPLETED}>Concluído</option>
                <option value={OrderStatus.CANCELLED}>Cancelado</option>
                <option value={OrderStatus.PENDING}>Em Produção</option>
                <option value={OrderStatus.READY}>Em Entrega</option>
                <option value={OrderStatus.DRAFT}>Rascunho</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Data Inicial</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Data Final</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-actions">
              <button
                type="submit"
                className="btn-primary"
                style={{ height: "40px", padding: "8px 16px" }}
              >
                Filtrar
              </button>
              <button
                type="button"
                onClick={handleClearFilters}
                className="btn-clear-filter"
              >
                Limpar
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Lista de Pedidos */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
          Carregando pedidos do histórico...
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-history-state">
          <h3>Nenhum pedido encontrado</h3>
          <p>Tente ajustar os filtros ou lance um novo pedido histórico acima.</p>
        </div>
      ) : (
        <div className="orders-history-list">
          {orders.map((order) => (
            <div key={order.id} className="history-order-card">
              <div className="order-card-header">
                <div className="order-id-group">
                  <span className="order-id-badge">#{order.id.slice(0, 8)}</span>
                  <span className={`status-badge ${getStatusClass(order.status)}`}>
                    {getStatusLabel(order.status)}
                  </span>
                </div>
                <div className="order-dates">
                  <span>
                    Criado: <strong>{formatDate(order.createdAt)}</strong>
                  </span>
                  {order.completedAt && (
                    <span>
                      Concluído: <strong>{formatDate(order.completedAt)}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="order-customer-info">
                <div className="customer-name">
                  👤 {order.customer?.name || "Cliente não vinculado"}
                  {order.customer?.phone ? ` • ${order.customer.phone}` : ""}
                </div>
                {order.address && (
                  <div className="customer-address">📍 {order.address}</div>
                )}
              </div>

              <div className="order-items-preview">
                {(order.items || []).map((item: any, idx) => (
                  <div key={idx} className="item-line">
                    <div className="item-qty-name">
                      <span className="item-qty">{item.quantity}x</span>
                      <span>{item.product?.name || "Produto"}</span>
                    </div>
                    <span>
                      {formatCurrency(Number(item.quantity) * Number(item.unitPrice))}
                    </span>
                  </div>
                ))}
              </div>

              <div className="order-card-footer">
                <div className="order-totals">
                  {order.deliveryFee != null && Number(order.deliveryFee) > 0 && (
                    <span className="delivery-fee-tag">
                      Taxa: {formatCurrency(order.deliveryFee)}
                    </span>
                  )}
                  <span className="order-total-price">
                    {formatCurrency(order.totalPrice)}
                  </span>
                </div>
                <div className="order-actions">
                  <button
                    className="btn-edit-order"
                    onClick={() => navigate(`/orders/${order.id}/edit`)}
                  >
                    ✏️ Editar Pedido
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
