import { Customer } from "@haru-control/types";
import { NumberInput } from "@haru-control/ui";
import { formatCurrency } from "@haru-control/utils";
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../services/api";
import { useOrderDraft } from "../store/useOrderDraft";
import CustomerFormModal from "../components/CustomerFormModal";
import "./OrderForm.css";

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  category?: { name: string; price?: number };
}

export default function OrderForm() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;

  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerSearch, setCustomerSearch] = useState("");
  const [isCustomerSelectModalOpen, setIsCustomerSelectModalOpen] = useState(false);
  const [isCustomerFormModalOpen, setIsCustomerFormModalOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [deliveryFee, setDeliveryFee] = useState<number>(2);

  const { items, addItem, updateItem, removeItem, clear, getTotalPrice, address, setAddress, customerId, setCustomer } =
    useOrderDraft();

  const groupedProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      const catName = p.category?.name || "Sem Categoria";
      if (!groups[catName]) groups[catName] = [];
      groups[catName].push(p);
    });
    
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.name.localeCompare(b.name));
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Sem Categoria") return 1;
      if (b === "Sem Categoria") return -1;

      const catA = groups[a][0]?.category;
      const catB = groups[b][0]?.category;
      const priceA = catA?.price != null ? Number(catA.price) : Infinity;
      const priceB = catB?.price != null ? Number(catB.price) : Infinity;

      if (priceA !== priceB) return priceA - priceB;
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => ({ name: key, products: groups[key] }));
  }, [products]);

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
      if (order.customerId) {
        setCustomer(order.customerId);
        const cust = customers.find(c => c.id === order.customerId);
        if (cust) setCustomerSearch(cust.name);
      }

      clear();
      order.items.forEach((item: any) => {
        addItem({
          productId: item.productId,
          productName: item.product.name,
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
      alert("Adicione ao menos um produto ao pedido");
      return;
    }

    setLoading(true);
    setWarnings([]);

    try {
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        deliveryFee: Number(deliveryFee),
        address,
        customerId,
      };

      let response;
      if (isEdit) {
        response = await api.patch(`/orders/${id}`, payload);
      } else {
        response = await api.post("/orders", payload);
      }

      if (response.data.warnings && response.data.warnings.length > 0) {
        setWarnings(response.data.warnings);
      } else {
        clear();
        navigate("/");
      }
    } catch (error: any) {
      console.error("Erro ao salvar pedido:", error);
      alert(error.response?.data?.message || "Erro ao salvar pedido");
    } finally {
      setLoading(false);
    }
  };

  const handleClearOrder = () => {
    if (confirm("Tem certeza que deseja limpar todo o pedido?")) {
      clear();
      setDeliveryFee(2);
      setAddress("");
    }
  };

  const handleCancelOrder = async () => {
    if (!isEdit) return;
    if (!confirm("Deseja realmente cancelar este pedido?")) return;

    try {
      setLoading(true);
      await api.post(`/orders/${id}/cancel`);
      clear();
      navigate("/");
    } catch (error) {
      console.error("Erro ao cancelar pedido:", error);
      alert("Erro ao cancelar pedido");
      setLoading(false);
    }
  };

  const handleContinueWithWarnings = () => {
    clear();
    navigate("/");
  };

  return (
    <div className="order-form">
      <header className="form-header">
        <button onClick={() => navigate("/")} className="btn-back">
          ← Voltar
        </button>
        <h1>{isEdit ? "Editar Pedido" : "Novo Pedido"}</h1>
      </header>

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
      </div>

      <div className="form-content">
        <section className="products-section">
          <h2>Produtos Disponíveis</h2>
          {groupedProducts.map(group => (
            <div key={group.name} style={{ marginBottom: "20px" }}>
              <h3 style={{ borderBottom: "1px solid #ddd", paddingBottom: "5px", marginBottom: "10px", color: "#666" }}>
                {group.name}
              </h3>
              <div className="products-grid">
                {group.products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-price">
                        {formatCurrency(product.price)}
                        <span style={{ fontSize: '0.75em', fontWeight: 'normal', color: '#666', marginLeft: '4px' }}>
                          / {product.unit || 'un'}
                        </span>
                      </p>
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
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="cart-section">
          <h2>Itens do Pedido</h2>

          {items.length === 0 ? (
            <p className="empty-cart">Nenhum produto adicionado</p>
          ) : (
            <div className="cart-items">
              {items.map((item) => (
                  <div key={item.productId} className="cart-item">
                    <div className="item-info">
                      <h3>{item.productName}</h3>
                      <div className="item-pricing">
                        <p className="unit-price">
                          {formatCurrency(item.unitPrice)} / {products.find(p => p.id === item.productId)?.unit || 'un'}
                        </p>
                        <p className="total-price">
                          Total:{" "}
                          {formatCurrency(item.unitPrice * item.quantity)}
                        </p>
                      </div>
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

              <div className="delivery-fee-section">
                <label htmlFor="deliveryFee">Taxa de Entrega:</label>
                <NumberInput
                  id="deliveryFee"
                  step="0.5"
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
                  Limpar Pedido
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
                  className="btn-save"
                >
                  {loading
                    ? "Salvando..."
                    : isEdit
                      ? "Atualizar Pedido"
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

    </div>
  );
}
