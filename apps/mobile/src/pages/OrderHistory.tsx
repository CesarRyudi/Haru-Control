import { Customer, Order, OrderStatus } from "@haru-control/types";
import { Toast } from "@haru-control/ui";
import { formatCurrency, formatDate } from "@haru-control/utils";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./OrderHistory.css";

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
}

interface DraftItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
}

const toDateTimeLocal = (date?: string | Date | null): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function OrderHistory() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
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

  // Modal Novo Pedido Histórico
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [newCustomerId, setNewCustomerId] = useState("");
  const [newCreatedAt, setNewCreatedAt] = useState(toDateTimeLocal(new Date()));
  const [newCompletedAt, setNewCompletedAt] = useState(toDateTimeLocal(new Date()));
  const [newStatus, setNewStatus] = useState<OrderStatus>(OrderStatus.COMPLETED);
  const [newAddress, setNewAddress] = useState("");
  const [newDeliveryFee, setNewDeliveryFee] = useState<number>(0);
  const [newNotify, setNewNotify] = useState(false);
  const [newItems, setNewItems] = useState<DraftItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedQty, setSelectedQty] = useState<number>(1);
  const [selectedUnitPrice, setSelectedUnitPrice] = useState<number>(0);

  // Modal Editar Pedido
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editCustomerId, setEditCustomerId] = useState("");
  const [editCreatedAt, setEditCreatedAt] = useState("");
  const [editCompletedAt, setEditCompletedAt] = useState("");
  const [editStatus, setEditStatus] = useState<OrderStatus>(OrderStatus.COMPLETED);
  const [editAddress, setEditAddress] = useState("");
  const [editDeliveryFee, setEditDeliveryFee] = useState<number>(0);
  const [editItems, setEditItems] = useState<DraftItem[]>([]);
  const [editSelectedProductId, setEditSelectedProductId] = useState("");
  const [editSelectedQty, setEditSelectedQty] = useState<number>(1);
  const [editSelectedUnitPrice, setEditSelectedUnitPrice] = useState<number>(0);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  useEffect(() => {
    loadOrders();
  }, [statusFilter, startDate, endDate]);

  const loadCustomers = async () => {
    try {
      const res = await api.get("/customers");
      setCustomers(res.data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await api.get("/products", { params: { isSellable: true } });
      setProducts(res.data);
      if (res.data.length > 0) {
        setSelectedProductId(res.data[0].id);
        setSelectedUnitPrice(Number(res.data[0].price));
        setEditSelectedProductId(res.data[0].id);
        setEditSelectedUnitPrice(Number(res.data[0].price));
      }
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

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
    // Recarregar sem filtros
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

  // Handlers para Novo Pedido Histórico
  const handleProductSelectChange = (pId: string) => {
    setSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setSelectedUnitPrice(Number(prod.price));
    }
  };

  const handleAddItemToNew = () => {
    if (!selectedProductId) return;
    const prod = products.find((p) => p.id === selectedProductId);
    if (!prod) return;

    setNewItems([
      ...newItems,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: selectedQty,
        unitPrice: selectedUnitPrice,
      },
    ]);
  };

  const handleRemoveItemFromNew = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  const newOrderCalculatedTotal = useMemo(() => {
    const itemsTotal = newItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    return itemsTotal + Number(newDeliveryFee || 0);
  }, [newItems, newDeliveryFee]);

  const handleCreateHistoricalOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newItems.length === 0) {
      alert("Adicione pelo menos um item ao pedido");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: newCustomerId || undefined,
        address: newAddress.trim() || undefined,
        deliveryFee: Number(newDeliveryFee),
        totalPrice: newOrderCalculatedTotal,
        status: newStatus,
        createdAt: newCreatedAt ? new Date(newCreatedAt).toISOString() : undefined,
        completedAt:
          newStatus === OrderStatus.COMPLETED && newCompletedAt
            ? new Date(newCompletedAt).toISOString()
            : undefined,
        notify: newNotify,
        items: newItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await api.post("/orders", payload);
      setToast({ message: "Pedido histórico criado com sucesso!", type: "success" });
      setIsNewModalOpen(false);
      // Resetar form
      setNewItems([]);
      setNewAddress("");
      setNewCustomerId("");
      setNewDeliveryFee(0);
      loadOrders();
    } catch (error: any) {
      console.error("Erro ao criar pedido histórico:", error);
      alert(error.response?.data?.message || "Erro ao criar pedido histórico");
    } finally {
      setSaving(false);
    }
  };

  // Handlers para Editar Pedido
  const openEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditCustomerId(order.customerId || "");
    setEditCreatedAt(toDateTimeLocal(order.createdAt));
    setEditCompletedAt(toDateTimeLocal(order.completedAt));
    setEditStatus(order.status);
    setEditAddress(order.address || "");
    setEditDeliveryFee(order.deliveryFee != null ? Number(order.deliveryFee) : 0);
    setEditItems(
      (order.items || []).map((item: any) => ({
        productId: item.productId,
        productName: item.product?.name || "Produto",
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      }))
    );
  };

  const handleEditProductSelectChange = (pId: string) => {
    setEditSelectedProductId(pId);
    const prod = products.find((p) => p.id === pId);
    if (prod) {
      setEditSelectedUnitPrice(Number(prod.price));
    }
  };

  const handleAddItemToEdit = () => {
    if (!editSelectedProductId) return;
    const prod = products.find((p) => p.id === editSelectedProductId);
    if (!prod) return;

    setEditItems([
      ...editItems,
      {
        productId: prod.id,
        productName: prod.name,
        quantity: editSelectedQty,
        unitPrice: editSelectedUnitPrice,
      },
    ]);
  };

  const handleRemoveItemFromEdit = (index: number) => {
    setEditItems(editItems.filter((_, i) => i !== index));
  };

  const editOrderCalculatedTotal = useMemo(() => {
    const itemsTotal = editItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );
    return itemsTotal + Number(editDeliveryFee || 0);
  }, [editItems, editDeliveryFee]);

  const handleSaveEditOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    if (editItems.length === 0) {
      alert("O pedido deve conter pelo menos um produto");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        customerId: editCustomerId || undefined,
        address: editAddress.trim() || undefined,
        deliveryFee: Number(editDeliveryFee),
        totalPrice: editOrderCalculatedTotal,
        status: editStatus,
        createdAt: editCreatedAt ? new Date(editCreatedAt).toISOString() : undefined,
        completedAt:
          editStatus === OrderStatus.COMPLETED && editCompletedAt
            ? new Date(editCompletedAt).toISOString()
            : null,
        items: editItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await api.patch(`/orders/${editingOrder.id}`, payload);
      setToast({ message: "Pedido atualizado com sucesso!", type: "success" });
      setEditingOrder(null);
      loadOrders();
    } catch (error: any) {
      console.error("Erro ao atualizar pedido:", error);
      alert(error.response?.data?.message || "Erro ao atualizar pedido");
    } finally {
      setSaving(false);
    }
  };

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
          onClick={() => {
            setNewCreatedAt(toDateTimeLocal(new Date()));
            setNewCompletedAt(toDateTimeLocal(new Date()));
            setIsNewModalOpen(true);
          }}
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
                    onClick={() => openEditModal(order)}
                  >
                    ✏️ Editar Pedido
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: NOVO PEDIDO HISTÓRICO */}
      {isNewModalOpen && (
        <div
          className="history-modal-overlay"
          onClick={() => setIsNewModalOpen(false)}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <h2>＋ Lançar Pedido Histórico Retroativo</h2>
              <button
                className="btn-close-modal"
                onClick={() => setIsNewModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateHistoricalOrder}>
              <div className="modal-form-grid">
                <div className="form-field">
                  <label>Data de Criação do Pedido *</label>
                  <input
                    type="datetime-local"
                    value={newCreatedAt}
                    onChange={(e) => setNewCreatedAt(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Status do Pedido *</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                    required
                  >
                    <option value={OrderStatus.COMPLETED}>Concluído</option>
                    <option value={OrderStatus.CANCELLED}>Cancelado</option>
                    <option value={OrderStatus.PENDING}>Em Produção</option>
                    <option value={OrderStatus.READY}>Em Entrega</option>
                    <option value={OrderStatus.DRAFT}>Rascunho</option>
                  </select>
                </div>

                {newStatus === OrderStatus.COMPLETED && (
                  <div className="form-field">
                    <label>Data de Conclusão *</label>
                    <input
                      type="datetime-local"
                      value={newCompletedAt}
                      onChange={(e) => setNewCompletedAt(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className="form-field">
                  <label>Cliente</label>
                  <select
                    value={newCustomerId}
                    onChange={(e) => {
                      setNewCustomerId(e.target.value);
                      const c = customers.find((cust) => cust.id === e.target.value);
                      if (c && c.address) setNewAddress(c.address);
                    }}
                  >
                    <option value="">Selecione um cliente (opcional)</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field full-width">
                  <label>Endereço de Entrega</label>
                  <input
                    type="text"
                    placeholder="Rua, número, complemento..."
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Taxa de Entrega (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={newDeliveryFee}
                    onChange={(e) => setNewDeliveryFee(Number(e.target.value))}
                  />
                </div>

                <div className="form-field">
                  <label>Total Calculado</label>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#059669",
                      padding: "8px 0",
                    }}
                  >
                    {formatCurrency(newOrderCalculatedTotal)}
                  </div>
                </div>

                <div className="form-field full-width">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={newNotify}
                      onChange={(e) => setNewNotify(e.target.checked)}
                    />
                    Enviar notificação Pushover para celular (desmarcado por padrão para histórico)
                  </label>
                </div>
              </div>

              {/* Itens */}
              <div className="modal-items-section">
                <h3>Itens do Pedido</h3>
                <div className="add-item-row">
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelectChange(e.target.value)}
                    className="filter-select"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.price)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={selectedQty}
                    onChange={(e) => setSelectedQty(Math.max(1, Number(e.target.value)))}
                    className="filter-input"
                    placeholder="Qtd"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={selectedUnitPrice}
                    onChange={(e) => setSelectedUnitPrice(Number(e.target.value))}
                    className="filter-input"
                    placeholder="Preço Unit"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemToNew}
                    className="btn-add-item"
                  >
                    ＋ Adicionar
                  </button>
                </div>

                {newItems.length > 0 ? (
                  <div className="modal-items-list">
                    {newItems.map((item, idx) => (
                      <div key={idx} className="modal-item-row">
                        <span>
                          <strong>{item.quantity}x</strong> {item.productName} ({formatCurrency(item.unitPrice)}) ={" "}
                          <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
                        </span>
                        <button
                          type="button"
                          className="btn-remove-item"
                          onClick={() => handleRemoveItemFromNew(idx)}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: "13px", color: "#94a3b8" }}>
                    Nenhum item adicionado ainda.
                  </p>
                )}
              </div>

              <div className="history-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsNewModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Pedido Histórico"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR PEDIDO */}
      {editingOrder && (
        <div
          className="history-modal-overlay"
          onClick={() => setEditingOrder(null)}
        >
          <div
            className="history-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="history-modal-header">
              <h2>Editar Pedido #{editingOrder.id.slice(0, 8)}</h2>
              <button
                className="btn-close-modal"
                onClick={() => setEditingOrder(null)}
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveEditOrder}>
              <div className="modal-form-grid">
                <div className="form-field">
                  <label>Data de Criação *</label>
                  <input
                    type="datetime-local"
                    value={editCreatedAt}
                    onChange={(e) => setEditCreatedAt(e.target.value)}
                    required
                  />
                </div>

                <div className="form-field">
                  <label>Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as OrderStatus)}
                  >
                    <option value={OrderStatus.COMPLETED}>Concluído</option>
                    <option value={OrderStatus.CANCELLED}>Cancelado</option>
                    <option value={OrderStatus.PENDING}>Em Produção</option>
                    <option value={OrderStatus.READY}>Em Entrega</option>
                    <option value={OrderStatus.DRAFT}>Rascunho</option>
                  </select>
                </div>

                {editStatus === OrderStatus.COMPLETED && (
                  <div className="form-field">
                    <label>Data de Conclusão</label>
                    <input
                      type="datetime-local"
                      value={editCompletedAt}
                      onChange={(e) => setEditCompletedAt(e.target.value)}
                    />
                  </div>
                )}

                <div className="form-field">
                  <label>Cliente</label>
                  <select
                    value={editCustomerId}
                    onChange={(e) => {
                      setEditCustomerId(e.target.value);
                      const c = customers.find((cust) => cust.id === e.target.value);
                      if (c && c.address) setEditAddress(c.address);
                    }}
                  >
                    <option value="">Sem cliente vinculado</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.phone ? `(${c.phone})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-field full-width">
                  <label>Endereço de Entrega</label>
                  <input
                    type="text"
                    value={editAddress}
                    onChange={(e) => setEditAddress(e.target.value)}
                  />
                </div>

                <div className="form-field">
                  <label>Taxa de Entrega (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={editDeliveryFee}
                    onChange={(e) => setEditDeliveryFee(Number(e.target.value))}
                  />
                </div>

                <div className="form-field">
                  <label>Total do Pedido</label>
                  <div
                    style={{
                      fontSize: "18px",
                      fontWeight: 700,
                      color: "#059669",
                      padding: "8px 0",
                    }}
                  >
                    {formatCurrency(editOrderCalculatedTotal)}
                  </div>
                </div>
              </div>

              {/* Itens em edição */}
              <div className="modal-items-section">
                <h3>Itens do Pedido</h3>
                <div className="add-item-row">
                  <select
                    value={editSelectedProductId}
                    onChange={(e) => handleEditProductSelectChange(e.target.value)}
                    className="filter-select"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({formatCurrency(p.price)})
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="1"
                    value={editSelectedQty}
                    onChange={(e) => setEditSelectedQty(Math.max(1, Number(e.target.value)))}
                    className="filter-input"
                    placeholder="Qtd"
                  />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={editSelectedUnitPrice}
                    onChange={(e) => setEditSelectedUnitPrice(Number(e.target.value))}
                    className="filter-input"
                    placeholder="Preço Unit"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemToEdit}
                    className="btn-add-item"
                  >
                    ＋ Adicionar
                  </button>
                </div>

                <div className="modal-items-list">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="modal-item-row">
                      <span>
                        <strong>{item.quantity}x</strong> {item.productName} ({formatCurrency(item.unitPrice)}) ={" "}
                        <strong>{formatCurrency(item.quantity * item.unitPrice)}</strong>
                      </span>
                      <button
                        type="button"
                        className="btn-remove-item"
                        onClick={() => handleRemoveItemFromEdit(idx)}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="history-modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingOrder(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? "Salvando..." : "Salvar Alterações"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
