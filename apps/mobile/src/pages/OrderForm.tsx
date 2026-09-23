import {
  Customer,
  OrderStatus,
  WasteReason,
  WASTE_REASON_LABELS,
  WASTE_REASON_ICONS,
  Product,
  Category,
  Subcategory,
} from "@haru-control/types";
import { NumberInput } from "@haru-control/ui";
import { formatCurrency } from "@haru-control/utils";
import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { useOrderDraft } from "../store/useOrderDraft";
import CustomerFormModal from "../components/CustomerFormModal";
import "./OrderForm.css";

export type FormMode = "normal" | "historical" | "waste";

const toDateTimeLocal = (date?: string | Date | null): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const isRetroactiveParam = searchParams.get("retroactive") === "true";
  const modeParam = searchParams.get("mode");

  const initialMode = useMemo<FormMode>(() => {
    if (modeParam === "waste") return "waste";
    if (modeParam === "historical" || isRetroactiveParam) return "historical";
    return "normal";
  }, [modeParam, isRetroactiveParam]);

  const [formMode, setFormMode] = useState<FormMode>(initialMode);
  const [pendingMode, setPendingMode] = useState<FormMode | null>(null);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState<boolean>(false);

  // Waste state
  const [wasteReason, setWasteReason] = useState<WasteReason>(WasteReason.EXPIRED);
  const [wasteNotes, setWasteNotes] = useState<string>("");

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [isCustomerFormModalOpen, setIsCustomerFormModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(2);
  const [notify, setNotify] = useState<boolean>(!isRetroactiveParam && initialMode !== "historical");

  // Data e status para pedidos retroativos ou edição
  const [status, setStatus] = useState<OrderStatus>(
    initialMode === "historical" ? OrderStatus.COMPLETED : OrderStatus.DRAFT
  );
  const [createdAt, setCreatedAt] = useState<string>(toDateTimeLocal(new Date()));
  const [completedAt, setCompletedAt] = useState<string>(toDateTimeLocal(new Date()));
  const [showRetroactiveConfig, setShowRetroactiveConfig] = useState<boolean>(
    initialMode === "historical" || isEdit
  );
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isBottomInView, setIsBottomInView] = useState(false);
  const bottomCheckoutRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = bottomCheckoutRef.current;
    if (!target) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsBottomInView(entry.isIntersecting);
      },
      { threshold: 0.05 }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  // Bloqueia a rolagem do body no mobile enquanto o drawer do carrinho estiver aberto
  useEffect(() => {
    if (!isCartDrawerOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isCartDrawerOpen]);

  const isHistorical = useMemo(() => {
    if (formMode === "historical") return true;
    if (isRetroactiveParam) return true;
    if (status === OrderStatus.COMPLETED) return true;
    if (createdAt) {
      const createdTime = new Date(createdAt).getTime();
      if (!isNaN(createdTime) && createdTime < Date.now() - 10 * 60 * 1000) {
        return true;
      }
    }
    return false;
  }, [formMode, isRetroactiveParam, status, createdAt]);

  const { items, addItem, updateItem, removeItem, clear, getTotalPrice, address, setAddress, customerId, setCustomer } =
    useOrderDraft();

  const totalCartQuantity = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0),
    [items]
  );
  const totalCartPrice = useMemo(
    () => items.reduce((sum, i) => sum + (Number(i.quantity) || 0) * (Number(i.unitPrice) || 0), 0),
    [items]
  );


  const handleModeChange = (newMode: FormMode) => {
    if (newMode === formMode) return;

    // Se a troca for apenas entre Pedido Normal e Pedido Histórico, mantém os itens no rascunho sem confirmação
    const isSwitchingBetweenOrders =
      (formMode === "normal" && newMode === "historical") ||
      (formMode === "historical" && newMode === "normal");

    if (isSwitchingBetweenOrders) {
      applyMode(newMode);
      return;
    }

    // Se envolver descarte (indo para descarte ou saindo de descarte) e houver itens:
    if (items.length > 0) {
      setPendingMode(newMode);
      setIsConfirmModalOpen(true);
      return;
    }

    applyMode(newMode);
  };

  const handleConfirmSwitch = () => {
    if (pendingMode) {
      clear();
      applyMode(pendingMode);
    }
    setIsConfirmModalOpen(false);
    setPendingMode(null);
  };

  const handleCancelSwitch = () => {
    setIsConfirmModalOpen(false);
    setPendingMode(null);
  };

  const applyMode = (mode: FormMode) => {
    setFormMode(mode);
    if (mode === "historical") {
      setStatus(OrderStatus.COMPLETED);
      setNotify(false);
      setShowRetroactiveConfig(true);
    } else if (mode === "normal") {
      setStatus(OrderStatus.DRAFT);
      setNotify(true);
      setShowRetroactiveConfig(false);
    } else if (mode === "waste") {
      setShowRetroactiveConfig(false);
    }
  };

  const availableProducts = useMemo(() => {
    if (formMode === "waste") {
      return products;
    }
    return products.filter((p) => p.isSellable !== false);
  }, [products, formMode]);

  const groupedProducts = useMemo(() => {
    const categoryMap: Record<string, {
      id: string;
      name: string;
      category?: Category | null;
      hasSubcategories: boolean;
      subgroups: Record<string, { id: string; name: string; subcategory?: Subcategory | null; products: Product[] }>;
      directProducts: Product[];
    }> = {};

    availableProducts.forEach((p) => {
      const catId = p.category?.id || "none";
      const catName = p.category?.name || "Sem Categoria";

      if (!categoryMap[catId]) {
        categoryMap[catId] = {
          id: catId,
          name: catName,
          category: p.category,
          hasSubcategories: false,
          subgroups: {},
          directProducts: [],
        };
      }

      if (p.subcategory) {
        categoryMap[catId].hasSubcategories = true;
      }
    });

    availableProducts.forEach((p) => {
      const catId = p.category?.id || "none";
      const catGroup = categoryMap[catId];

      if (catGroup.hasSubcategories) {
        const subId = p.subcategory?.id || "none";
        const subName = p.subcategory?.name || "Outros / Sem Subcategoria";
        if (!catGroup.subgroups[subId]) {
          catGroup.subgroups[subId] = {
            id: subId,
            name: subName,
            subcategory: p.subcategory,
            products: [],
          };
        }
        catGroup.subgroups[subId].products.push(p);
      } else {
        catGroup.directProducts.push(p);
      }
    });

    Object.values(categoryMap).forEach((catGroup) => {
      catGroup.directProducts.sort((a, b) => a.name.localeCompare(b.name));
      Object.values(catGroup.subgroups).forEach((sub) => {
        sub.products.sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    const sortedCatIds = Object.keys(categoryMap).sort((a, b) => {
      if (a === "none") return 1;
      if (b === "none") return -1;

      const catA = categoryMap[a].category;
      const catB = categoryMap[b].category;
      const priceA = catA?.price != null ? Number(catA.price) : Infinity;
      const priceB = catB?.price != null ? Number(catB.price) : Infinity;

      if (priceA !== priceB) return priceA - priceB;
      return categoryMap[a].name.localeCompare(categoryMap[b].name);
    });

    return sortedCatIds.map((id) => {
      const catGroup = categoryMap[id];
      const sortedSubgroups = Object.values(catGroup.subgroups).sort((a, b) => {
        if (a.id === "none") return 1;
        if (b.id === "none") return -1;
        return a.name.localeCompare(b.name);
      });

      return {
        id,
        name: catGroup.name,
        category: catGroup.category,
        hasSubcategories: catGroup.hasSubcategories,
        subgroups: sortedSubgroups,
        directProducts: catGroup.directProducts,
      };
    });
  }, [availableProducts]);

  useEffect(() => {
    loadProducts();
    loadCustomers();
  }, []);

  useEffect(() => {
    if (isEdit && customers.length > 0) {
      loadOrder();
    }
  }, [id, customers.length > 0]);

  const loadCustomers = async () => {
    try {
      const response = await api.get("/customers");
      setCustomers(response.data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await api.get("/products");
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const loadOrder = async () => {
    try {
      const response = await api.get(`/orders/${id}`);
      const order = response.data;

      setDeliveryFee(
        order.deliveryFee != null ? Number(order.deliveryFee) : 2
      );
      setAddress(order.address || "");
      
      const orderIsHistorical =
        order.status === OrderStatus.COMPLETED ||
        (order.createdAt && new Date(order.createdAt).getTime() < Date.now() - 10 * 60 * 1000);

      if (orderIsHistorical) {
        setNotify(false);
      } else if (order.notify !== undefined && order.notify !== null) {
        setNotify(Boolean(order.notify));
      }
      if (order.status) {
        setStatus(order.status);
      }
      if (order.createdAt) {
        setCreatedAt(toDateTimeLocal(order.createdAt));
      }
      if (order.completedAt) {
        setCompletedAt(toDateTimeLocal(order.completedAt));
      }
      setShowRetroactiveConfig(true);

      if (order.customerId) {
        setCustomer(order.customerId);
        const cust = customers.find(c => c.id === order.customerId);
        if (cust) setCustomerSearch(cust.name);
      }

      clear();
      order.items.forEach((item: any) => {
        addItem({
          productId: item.productId,
          productName: item.product?.name || item.productName || "Produto",
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        });
      });
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
      alert("Erro ao carregar pedido");
      navigate("/");
    }
  };

  const handleAddProduct = (product: Product) => {
    addItem({
      productId: product.id,
      productName: product.name,
      quantity: 1,
      unitPrice: product.price,
    });
  };

  const handleSave = async () => {
    if (items.length === 0) {
      alert(
        formMode === "waste"
          ? "Adicione pelo menos um produto para registrar o descarte"
          : "Adicione ao menos um produto ao pedido"
      );
      return;
    }

    setLoading(true);

    if (formMode === "waste") {
      try {
        await api.post("/stock/waste/batch", {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          reason: wasteReason,
          notes: wasteNotes.trim() || undefined,
        });

        clear();
        setIsCartDrawerOpen(false);
        alert("Descarte de estoque registrado com sucesso!");
        navigate("/stock");
      } catch (error: any) {
        console.error("Erro ao registrar descarte:", error);
        alert(error.response?.data?.message || "Erro ao registrar descarte");
      } finally {
        setLoading(false);
      }
      return;
    }

    setWarnings([]);

    try {
      const payload: any = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
        deliveryFee: Number(deliveryFee),
        address,
        customerId,
        notify: isHistorical ? false : notify,
      };

      if (isHistorical || isEdit || showRetroactiveConfig) {
        payload.status = status;
        if (createdAt) {
          payload.createdAt = new Date(createdAt).toISOString();
        }
        if (status === OrderStatus.COMPLETED) {
          payload.completedAt = completedAt
            ? new Date(completedAt).toISOString()
            : createdAt
            ? new Date(createdAt).toISOString()
            : new Date().toISOString();
        } else if (completedAt) {
          payload.completedAt = new Date(completedAt).toISOString();
        }
      }

      let response;
      if (isEdit) {
        response = await api.patch(`/orders/${id}`, payload);
      } else {
        response = await api.post("/orders", payload);
      }

      if (response.data.warnings && response.data.warnings.length > 0) {
        setWarnings(response.data.warnings);
        setIsCartDrawerOpen(false);
        setTimeout(() => {
          bottomCheckoutRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 150);
      } else {
        clear();
        setIsCartDrawerOpen(false);
        if (isHistorical) {
          navigate("/orders/history");
        } else {
          navigate(-1);
        }
      }
    } catch (error: any) {
      console.error("Erro ao salvar pedido:", error);
      alert(error.response?.data?.message || "Erro ao salvar pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleClearOrder = () => {
    if (
      confirm(
        formMode === "waste"
          ? "Tem certeza que deseja limpar a lista de descarte?"
          : "Tem certeza que deseja limpar todo o pedido?"
      )
    ) {
      clear();
      setDeliveryFee(2);
      setAddress("");
      setNotify(!isHistorical);
      setWasteNotes("");
      setIsCartDrawerOpen(false);
    }
  };

  const handleCancelOrder = async () => {
    if (!isEdit) return;
    if (!confirm("Deseja realmente cancelar este pedido?")) return;

    try {
      setLoading(true);
      await api.post(`/orders/${id}/cancel`);
      clear();
      navigate(-1);
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      alert("Erro ao cancelar pedido");
      setLoading(false);
    }
  };

  const handleContinueWithWarnings = () => {
    clear();
    if (isHistorical) {
      navigate("/orders/history");
    } else {
      navigate(-1);
    }
  };

  const renderOrderProductCard = (product: Product) => (
    <div key={product.id} className="product-card">
      <div className="product-info">
        <h3>{product.name}</h3>
        {formMode === "waste" ? (
          <p className="product-price" style={{ color: "#64748b", fontSize: "0.85em" }}>
            Unidade: <strong>{product.unit || "un"}</strong>
          </p>
        ) : (
          <p className="product-price">
            {formatCurrency(product.price)}
            <span style={{ fontSize: '0.75em', fontWeight: 'normal', color: '#666', marginLeft: '4px' }}>
              / {product.unit || 'un'}
            </span>
          </p>
        )}
      </div>
      {(() => {
        const cartItem = items.find((i) => i.productId === product.id);
        if (cartItem) {
          return (
            <div className="item-controls" style={{ margin: "0", justifyContent: "center" }}>
              <button
                onClick={() => {
                  if (cartItem.quantity <= 1) {
                    removeItem(product.id);
                  } else {
                    updateItem(product.id, cartItem.quantity - 1);
                  }
                }}
                className="btn-qty"
              >
                -
              </button>
              <NumberInput
                value={cartItem.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val > 0) {
                    updateItem(product.id, val);
                  } else {
                    removeItem(product.id);
                  }
                }}
                className="qty-input"
                min="1"
              />
              <button
                onClick={() => updateItem(product.id, cartItem.quantity + 1)}
                className="btn-qty"
              >
                +
              </button>
            </div>
          );
        }
        return (
          <button
            onClick={() => handleAddProduct(product)}
            className="btn-add-wide"
          >
            Adicionar
          </button>
        );
      })()}
    </div>
  );

  return (
    <div className="order-form">
      {/* Modal de confirmação ao trocar de modo com itens no carrinho */}
      {isConfirmModalOpen && (
        <div className="mode-switch-modal-backdrop">
          <div className="mode-switch-modal-content">
            <h3>⚠️ Alterar Tipo de Registro?</h3>
            <p>
              Você possui <strong>{items.length} {items.length === 1 ? "item" : "itens"}</strong> no rascunho atual.
              Ao mudar para <strong>{pendingMode === "waste" ? "Descarte" : pendingMode === "historical" ? "Pedido Histórico" : "Pedido Normal"}</strong>, os itens selecionados serão limpos.
            </p>
            <div className="mode-switch-modal-actions">
              <button
                type="button"
                className="btn-cancel-switch"
                onClick={handleCancelSwitch}
              >
                Manter Modo Atual
              </button>
              <button
                type="button"
                className="btn-confirm-switch"
                onClick={handleConfirmSwitch}
              >
                Sim, Limpar e Mudar
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="form-header">
        <div className="form-header-top">
          <button
            onClick={() => {
              if (formMode === "historical") navigate("/orders/history");
              else if (formMode === "waste") navigate("/stock");
              else navigate(-1);
            }}
            className="btn-back"
          >
            ← Voltar
          </button>

          <h1>
            {isEdit
              ? "Editar Pedido"
              : formMode === "waste"
              ? "Descarte de Estoque"
              : formMode === "historical"
              ? "Novo Pedido Histórico"
              : "Novo Pedido"}
          </h1>
        </div>

        {!isEdit && (
          <div className="form-mode-select-wrapper">
            <select
              id="form-mode-select"
              className="form-mode-select"
              value={formMode}
              onChange={(e) => handleModeChange(e.target.value as FormMode)}
            >
              <option value="normal">🛒 Pedido Normal</option>
              <option value="historical">📜 Pedido Histórico</option>
              <option value="waste">🗑️ Descarte de Estoque</option>
            </select>
          </div>
        )}
      </header>

      {/* Configuração de Data e Status (Retroativo ou Edição) */}
      {formMode !== "waste" && (isHistorical || isEdit || showRetroactiveConfig) ? (
        <div
          className="order-details-card"
          style={{
            marginBottom: "24px",
            borderLeft: "4px solid #059669",
            backgroundColor: "#f0fdf4",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <h3
              style={{
                margin: 0,
                color: "#065f46",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>📅</span> Data & Status do Pedido{" "}
              {isHistorical && (
                <span
                  style={{
                    fontSize: "12px",
                    background: "#d1fae5",
                    color: "#065f46",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontWeight: "normal",
                  }}
                >
                  Histórico
                </span>
              )}
            </h3>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "14px",
            }}
          >
            <div>
              <label
                htmlFor="order-created-at"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "4px",
                }}
              >
                Data de Criação *
              </label>
              <input
                id="order-created-at"
                type="datetime-local"
                value={createdAt}
                onChange={(e) => setCreatedAt(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  background: "#fff",
                }}
                required
              />
            </div>

            <div>
              <label
                htmlFor="order-status"
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: "600",
                  color: "#334155",
                  marginBottom: "4px",
                }}
              >
                Status do Pedido
              </label>
              <select
                id="order-status"
                value={status}
                onChange={(e) => {
                  const newStatus = e.target.value as OrderStatus;
                  setStatus(newStatus);
                  if (newStatus === OrderStatus.COMPLETED) {
                    setNotify(false);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  background: "white",
                }}
              >
                <option value={OrderStatus.COMPLETED}>Concluído</option>
                <option value={OrderStatus.DRAFT}>Rascunho</option>
                <option value={OrderStatus.PENDING}>Em Produção</option>
                <option value={OrderStatus.READY}>Em Entrega</option>
                <option value={OrderStatus.CANCELLED}>Cancelado</option>
              </select>
            </div>

            {status === OrderStatus.COMPLETED && (
              <div>
                <label
                  htmlFor="order-completed-at"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: "600",
                    color: "#334155",
                    marginBottom: "4px",
                  }}
                >
                  Data de Conclusão
                </label>
                <input
                  id="order-completed-at"
                  type="datetime-local"
                  value={completedAt}
                  onChange={(e) => setCompletedAt(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                    background: "#fff",
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {formMode !== "waste" && (
        <div className="order-details-card" style={{ marginBottom: '24px' }}>
          <h3>Detalhes do Cliente</h3>
          
          <div className="customer-section">
            <label>Cliente (Opcional):</label>
            {!customerId ? (
              <button 
                type="button"
                className="btn-select-customer" 
                onClick={() => {
                  setCustomerSearch("");
                  setIsCustomerSelectModalOpen(true);
                }}
                style={{ width: '100%', padding: '16px', background: '#fdfdfd', border: '2px dashed #ccc', borderRadius: '8px', cursor: 'pointer', textAlign: 'center', color: '#666', fontSize: '16px', fontWeight: 'bold', transition: 'all 0.2s' }}
              >
                👤 Selecionar Cliente
              </button>
            ) : (() => {
              const selectedCustomer = customers.find(c => c.id === customerId);
              return (
                <div 
                  className="selected-customer-card" 
                  onClick={() => {
                    setCustomerSearch("");
                    setIsCustomerSelectModalOpen(true);
                  }}
                  style={{ background: '#f8f9fa', border: '1px solid #3498db', borderLeft: '4px solid #3498db', borderRadius: '8px', padding: '16px', cursor: 'pointer' }}
                >
                  <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50', fontSize: '16px' }}>{selectedCustomer?.name || 'Cliente Desconhecido'}</h4>
                  {selectedCustomer?.address && <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>📍 {selectedCustomer.address}</p>}
                  {!selectedCustomer?.address && selectedCustomer?.phone && <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>📞 {selectedCustomer.phone}</p>}
                  {selectedCustomer?.observation && <p style={{ margin: '4px 0', fontSize: '14px', color: '#555' }}>📝 {selectedCustomer.observation}</p>}
                  <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#3498db', fontWeight: 'bold', textAlign: 'right' }}>Toque para trocar</p>
                </div>
              );
            })()}
          </div>

          <div className="address-section">
            <label htmlFor="address">Endereço de Entrega (Opcional):</label>
            <textarea
              id="address"
              value={address || ""}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Rua, Número, Bairro, Referência..."
              className="address-input"
            />
          </div>

          {isHistorical ? (
            <div
              style={{
                marginTop: "16px",
                paddingTop: "16px",
                borderTop: "1px solid #eee",
                display: "flex",
                alignItems: "center",
                gap: "10px",
                color: "#64748b",
                fontSize: "14px",
              }}
            >
              <span style={{ fontSize: "18px" }}>🔕</span>
              <div>
                <strong style={{ color: "#475569" }}>Alertas desativados:</strong> Pedidos históricos nunca geram notificações de emergência no celular.
              </div>
            </div>
          ) : (
            <div className="notify-section" style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #eee' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  style={{ width: '22px', height: '22px', accentColor: '#4f46e5', cursor: 'pointer' }}
                />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '15px', color: '#1e293b' }}>
                    🔔 Alerta de emergência no celular (Pushover)
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                    Desmarque para pedidos presenciais de balcão ou se já estiver na cozinha
                  </div>
                </div>
              </label>
            </div>
          )}
        </div>
      )}

      <div className="form-content">
        <section className="products-section">
          <h2>{formMode === "waste" ? "Itens / Ingredientes para Descarte" : "Produtos Disponíveis"}</h2>
          {groupedProducts.map((group) => (
            <div key={group.id} style={{ marginBottom: "24px" }}>
              <h3 style={{ borderBottom: "2px solid #e2e8f0", paddingBottom: "6px", marginBottom: "12px", color: "#334155", fontSize: "1.15rem" }}>
                {group.name}
              </h3>
              {group.hasSubcategories ? (
                group.subgroups.map((subgroup) => (
                  <div key={subgroup.id} style={{ marginBottom: "16px", paddingLeft: "8px", borderLeft: "3px solid #e2e8f0" }}>
                    <h4 style={{ margin: "0 0 10px 4px", color: "#64748b", fontSize: "0.95rem", fontWeight: 600 }}>
                      🏷️ {subgroup.name}
                    </h4>
                    <div className="products-grid">
                      {subgroup.products.map(renderOrderProductCard)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="products-grid">
                  {group.directProducts.map(renderOrderProductCard)}
                </div>
              )}
            </div>
          ))}
        </section>

        <section className="cart-section" ref={bottomCheckoutRef}>
          <h2>{formMode === "waste" ? "Itens a Descartar" : "Itens do Pedido"}</h2>

          {items.length === 0 ? (
            <p className="empty-cart">
              {formMode === "waste" ? "Nenhum item selecionado para descarte" : "Nenhum produto adicionado"}
            </p>
          ) : (
            <div className="cart-items">
              {items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="item-info">
                      <h3>{item.productName}</h3>
                      {formMode === "waste" ? (
                        <div className="item-pricing">
                          <p className="unit-price" style={{ color: "#64748b" }}>
                            {item.quantity} {products.find(p => p.id === item.productId)?.unit || "un"} a descartar
                          </p>
                        </div>
                      ) : (
                        <div className="item-pricing">
                          <p className="unit-price">
                            {formatCurrency(item.unitPrice)} / {products.find(p => p.id === item.productId)?.unit || 'un'}
                          </p>
                          <p className="total-price">
                            Total:{" "}
                            {formatCurrency(item.unitPrice * item.quantity)}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="item-controls">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.productId);
                          } else {
                            updateItem(item.productId, item.quantity - 1);
                          }
                        }}
                        className="btn-qty"
                      >
                        -
                      </button>
                      <NumberInput
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="qty-input"
                        min="1"
                      />
                      <button
                        onClick={() =>
                          updateItem(item.productId, item.quantity + 1)
                        }
                        className="btn-qty"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="btn-remove"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        <section className="checkout-section">
          {formMode === "waste" ? (
            <>
              <div className="waste-config-card">
                <h3>Motivo do Descarte *</h3>
                <div className="waste-reason-chips">
                  {Object.values(WasteReason).map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      className={`waste-reason-chip waste-chip-btn ${wasteReason === reason ? "active" : ""}`}
                      onClick={() => setWasteReason(reason)}
                    >
                      <span>{WASTE_REASON_ICONS[reason]}</span>
                      <span>{WASTE_REASON_LABELS[reason]}</span>
                    </button>
                  ))}
                </div>

                <div className="waste-notes-field">
                  <label htmlFor="wasteNotes">Observações adicionais (opcional):</label>
                  <textarea
                    id="wasteNotes"
                    value={wasteNotes}
                    onChange={(e) => setWasteNotes(e.target.value)}
                    placeholder="Ex: Lote perdeu a validade, quebrou pote na bancada..."
                    className="waste-notes-input"
                    rows={2}
                  />
                </div>
              </div>

              <div className="waste-summary-card">
                <div className="waste-summary-line">
                  <span>Itens distintos a descartar:</span>
                  <strong>{items.length}</strong>
                </div>
                <div className="waste-summary-line">
                  <span>Quantidade total de unidades:</span>
                  <strong>{items.reduce((acc, i) => acc + i.quantity, 0)}</strong>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="delivery-fee-section">
                <label htmlFor="deliveryFee">Taxa de Entrega:</label>
                <NumberInput
                  id="deliveryFee"
                  step="any"
                  buttonStep={0.5}
                  min="0"
                  value={deliveryFee}
                  onChange={(e) =>
                    setDeliveryFee(parseFloat(e.target.value) || 0)
                  }
                  showButtons
                  className="delivery-fee-input"
                />
              </div>

              <div className="cart-total">
                <div className="total-line">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(getTotalPrice())}</span>
                </div>
                <div className="total-line">
                  <span>Taxa de Entrega:</span>
                  <span>{formatCurrency(deliveryFee)}</span>
                </div>
                <div className="total-line total-final">
                  <span>Total:</span>
                  <strong>
                    {formatCurrency(getTotalPrice() + Number(deliveryFee))}
                  </strong>
                </div>
              </div>
            </>
          )}

          {warnings.length > 0 && (
            <div className="warnings">
              <h3>⚠️ Avisos</h3>
              {warnings.map((warning, index) => (
                <p key={index} className="warning-message">
                  {warning}
                </p>
              ))}
              <div className="warning-actions">
                <button
                  onClick={() => setWarnings([])}
                  className="btn-secondary"
                >
                  Corrigir
                </button>
                <button
                  onClick={handleContinueWithWarnings}
                  className="btn-primary"
                >
                  Continuar Mesmo Assim
                </button>
              </div>
            </div>
          )}

          <div className="order-form-actions">
            <button
              onClick={handleClearOrder}
              disabled={loading}
              className="btn-clear-order"
            >
              {formMode === "waste" ? "Limpar Descarte" : "Limpar Pedido"}
            </button>
            {isEdit && (
              <button
                onClick={handleCancelOrder}
                disabled={loading}
                className="btn-cancel-order"
              >
                Cancelar Pedido
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={loading}
              className={`btn-save ${formMode === "waste" ? "btn-save-waste" : ""}`}
              style={formMode === "waste" ? { backgroundColor: "#dc2626" } : undefined}
            >
              {loading
                ? "Salvando..."
                : formMode === "waste"
                ? "🗑️ Registrar Descarte"
                : isEdit
                ? "Atualizar Pedido"
                : isHistorical
                ? "Salvar Pedido Histórico"
                : "Criar Pedido"}
            </button>
          </div>
        </section>
      </div>

      {isCustomerSelectModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCustomerSelectModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column' }}>
            <h2>Selecionar Cliente</h2>
            <div className="customer-search-wrapper" style={{ position: "relative", marginBottom: '16px' }}>
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Buscar cliente por nome ou telefone..."
                className="address-input"
              />
            </div>
            
            <div className="customers-list" style={{ flex: 1, overflowY: 'auto' }}>
              {customerId && (
                <div 
                  className="customer-card" 
                  style={{ marginBottom: '12px', background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px', padding: '16px', cursor: 'pointer', textAlign: 'center' }}
                  onClick={() => {
                    setCustomer(undefined);
                    setCustomerSearch("");
                    setAddress("");
                    setIsCustomerSelectModalOpen(false);
                  }}
                >
                  <h4 style={{ margin: '0', color: '#e74c3c' }}>Remover Cliente Selecionado</h4>
                </div>
              )}

              {customers
                .filter(c => c.id !== customerId)
                .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)) || (c.address && c.address.toLowerCase().includes(customerSearch.toLowerCase())))
                .map(cust => (
                  <div key={cust.id} className="customer-card" style={{ marginBottom: '12px', background: '#fff', border: '1px solid #eee', borderRadius: '8px', padding: '16px', cursor: 'pointer' }}
                    onClick={() => {
                      setCustomer(cust.id);
                      setCustomerSearch("");
                      setAddress(cust.address || "");
                      setIsCustomerSelectModalOpen(false);
                    }}>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#333' }}>{cust.name}</h4>
                    {cust.address && <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>📍 {cust.address}</p>}
                    {!cust.address && cust.phone && <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>📞 {cust.phone}</p>}
                  </div>
              ))}
              {customers.filter(c => c.id !== customerId).filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)) || (c.address && c.address.toLowerCase().includes(customerSearch.toLowerCase()))).length === 0 && (
                <p style={{ textAlign: 'center', color: '#999', marginTop: '20px' }}>Nenhum cliente encontrado.</p>
              )}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setIsCustomerSelectModalOpen(false)} style={{ flex: 1 }}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={() => { setIsCustomerSelectModalOpen(false); setIsCustomerFormModalOpen(true); }} style={{ flex: 1 }}>
                + Novo Cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {isCustomerFormModalOpen && (
        <CustomerFormModal
          onClose={() => setIsCustomerFormModalOpen(false)}
          onSuccess={(newCustomer) => {
            setCustomers([...customers, newCustomer]);
            setCustomer(newCustomer.id);
            setCustomerSearch("");
            setAddress(newCustomer.address || "");
            setIsCustomerFormModalOpen(false);
          }}
        />
      )}

      {/* Barra Flutuante de Carrinho */}
      {items.length > 0 && !isBottomInView && (
        <div
          className="floating-cart-bar"
          onClick={() => setIsCartDrawerOpen(true)}
        >
          <div className="floating-cart-left">
            <span className="floating-cart-badge">{totalCartQuantity}</span>
            <div className="floating-cart-text">
              <span className="floating-cart-title">
                {formMode === "waste"
                  ? `${totalCartQuantity} ${totalCartQuantity === 1 ? "item" : "itens"} a descartar`
                  : `${totalCartQuantity} ${totalCartQuantity === 1 ? "item" : "itens"}`}
              </span>
              {formMode !== "waste" && (
                <span className="floating-cart-price">
                  {formatCurrency(totalCartPrice)}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="floating-cart-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsCartDrawerOpen(true);
            }}
          >
            {formMode === "waste" ? "Revisar" : "Ver Carrinho"} 🛒
          </button>
        </div>
      )}

      {/* Drawer Inferior do Carrinho */}
      {isCartDrawerOpen && (
        <div
          className="cart-drawer-overlay"
          onClick={() => setIsCartDrawerOpen(false)}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            className="cart-drawer-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="cart-drawer-header">
              <div className="cart-drawer-title">
                <span>{formMode === "waste" ? "🗑️" : "🛒"}</span>
                <h3>
                  {formMode === "waste"
                    ? "Itens a Descartar"
                    : "Resumo do Carrinho"}
                </h3>
                <span className="cart-drawer-count">
                  ({totalCartQuantity} {totalCartQuantity === 1 ? "item" : "itens"})
                </span>
              </div>
              <button
                type="button"
                className="cart-drawer-close"
                onClick={() => setIsCartDrawerOpen(false)}
                title="Fechar gaveta"
              >
                ✕
              </button>
            </div>

            <div className="cart-drawer-items">
              {items.map((item) => {
                const p = products.find((prod) => prod.id === item.productId);
                return (
                  <div key={item.productId} className="cart-drawer-item">
                    <div className="cart-drawer-item-info">
                      <h4>{item.productName}</h4>
                      {formMode === "waste" ? (
                        <span className="cart-drawer-unit">
                          {item.quantity} {p?.unit || "un"} a descartar
                        </span>
                      ) : (
                        <div className="cart-drawer-prices">
                          <span className="cart-drawer-unit-price">
                            {formatCurrency(item.unitPrice)} / {p?.unit || "un"}
                          </span>
                          <span className="cart-drawer-subtotal">
                            Total: {formatCurrency(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="cart-drawer-controls">
                      <button
                        type="button"
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeItem(item.productId);
                          } else {
                            updateItem(item.productId, item.quantity - 1);
                          }
                        }}
                        className="btn-qty"
                      >
                        -
                      </button>
                      <NumberInput
                        value={item.quantity}
                        onChange={(e) =>
                          updateItem(
                            item.productId,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="qty-input"
                        min="1"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          updateItem(item.productId, item.quantity + 1)
                        }
                        className="btn-qty"
                      >
                        +
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId)}
                        className="btn-remove"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="cart-drawer-footer">
              {formMode !== "waste" ? (
                <div className="cart-drawer-pricing-summary">
                  <div className="cart-drawer-row">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(totalCartPrice)}</span>
                  </div>
                  <div className="cart-drawer-row cart-drawer-delivery-row">
                    <label htmlFor="drawer-delivery-fee">Taxa de Entrega:</label>
                    <div className="cart-drawer-fee-control">
                      <button
                        type="button"
                        className="btn-drawer-fee-step"
                        onClick={() =>
                          setDeliveryFee(Math.max(0, Number((deliveryFee - 0.5).toFixed(2))))
                        }
                      >
                        -
                      </button>
                      <NumberInput
                        id="drawer-delivery-fee"
                        step="any"
                        buttonStep={0.5}
                        min="0"
                        value={deliveryFee}
                        onChange={(e) =>
                          setDeliveryFee(parseFloat(e.target.value) || 0)
                        }
                        className="drawer-fee-input"
                      />
                      <button
                        type="button"
                        className="btn-drawer-fee-step"
                        onClick={() =>
                          setDeliveryFee(Number((deliveryFee + 0.5).toFixed(2)))
                        }
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div className="cart-drawer-total-row">
                    <span>Total:</span>
                    <strong>{formatCurrency(totalCartPrice + Number(deliveryFee))}</strong>
                  </div>
                </div>
              ) : (
                <div className="cart-drawer-waste-notes">
                  <label htmlFor="drawer-waste-notes" className="cart-drawer-notes-label">
                    Observação do descarte (opcional):
                  </label>
                  <input
                    id="drawer-waste-notes"
                    type="text"
                    value={wasteNotes}
                    onChange={(e) => setWasteNotes(e.target.value)}
                    placeholder="Ex: Lote perdeu a validade, quebrou pote..."
                    className="cart-drawer-notes-input"
                  />
                </div>
              )}
              <div className="cart-drawer-actions">
                <button
                  type="button"
                  className="btn-drawer-clear"
                  onClick={handleClearOrder}
                  disabled={loading}
                >
                  {formMode === "waste" ? "Limpar Descarte" : "Limpar Pedido"}
                </button>
                <button
                  type="button"
                  className={`btn-drawer-checkout ${formMode === "waste" ? "btn-drawer-waste" : ""}`}
                  onClick={handleSave}
                  disabled={loading || items.length === 0}
                >
                  {loading
                    ? "Salvando..."
                    : formMode === "waste"
                    ? "Registrar Descarte"
                    : isEdit
                    ? "Atualizar Pedido"
                    : isHistorical
                    ? "Salvar Pedido Histórico"
                    : `Criar Pedido (${formatCurrency(totalCartPrice + Number(deliveryFee))})`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

