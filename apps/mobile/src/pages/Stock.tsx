import { FloatingActionButton, NumberInput } from "@haru-control/ui";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Stock.css";

import { Category, Subcategory, Product } from "@haru-control/types";

interface StockItem {
  productId: string;
  productName: string;
  currentStock: number;
  warnings?: string[];
}

export default function Stock() {
  const navigate = useNavigate();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"in" | "adjust">("in");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newQuantity, setNewQuantity] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stockRes, productsRes, categoriesRes] = await Promise.all([
        api.get("/stock/snapshot"),
        api.get("/products"),
        api.get("/categories"),
      ]);

      const sortedCategories = (categoriesRes.data || []).sort((a: Category, b: Category) => {
        const priceA = a.price != null ? Number(a.price) : Infinity;
        const priceB = b.price != null ? Number(b.price) : Infinity;
        if (priceA !== priceB) return priceA - priceB;
        return a.name.localeCompare(b.name);
      });

      setStock(stockRes.data || []);
      setProducts(productsRes.data || []);
      setCategories(sortedCategories);
    } catch (error) {
      console.error("Erro ao carregar dados de estoque:", error);
    }
  };

  const loadStock = async () => {
    try {
      const response = await api.get("/stock/snapshot");
      setStock(response.data || []);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    }
  };

  const groupedStock = useMemo(() => {
    const stockMap = new Map<string, StockItem>();
    stock.forEach(item => stockMap.set(item.productId, item));

    const categoryMap: Record<string, {
      category?: Category;
      hasSubcategories: boolean;
      subgroups: Record<string, { id: string; subcategory?: Subcategory; name: string; items: { product: Product; stockItem: StockItem }[] }>;
      directItems: { product: Product; stockItem: StockItem }[];
    }> = {};

    categories.forEach(cat => {
      const hasSubs = Boolean(cat.subcategories && cat.subcategories.length > 0);
      const subMap: Record<string, { id: string; subcategory?: Subcategory; name: string; items: { product: Product; stockItem: StockItem }[] }> = {};
      if (hasSubs) {
        cat.subcategories!.forEach(sub => {
          subMap[sub.id] = { id: sub.id, subcategory: sub, name: sub.name, items: [] };
        });
        subMap["none"] = { id: "none", subcategory: undefined, name: "Outros / Sem Subcategoria", items: [] };
      }
      categoryMap[cat.id] = {
        category: cat,
        hasSubcategories: hasSubs,
        subgroups: subMap,
        directItems: [],
      };
    });

    categoryMap["none"] = {
      category: undefined,
      hasSubcategories: false,
      subgroups: {},
      directItems: [],
    };

    products.forEach(p => {
      const catId = p.categoryId && categoryMap[p.categoryId] ? p.categoryId : "none";
      const catGroup = categoryMap[catId];
      const sItem = stockMap.get(p.id) || { productId: p.id, productName: p.name, currentStock: 0 };
      const entry = { product: p, stockItem: sItem };

      if (catGroup.hasSubcategories) {
        const subId = p.subcategoryId && catGroup.subgroups[p.subcategoryId] ? p.subcategoryId : "none";
        catGroup.subgroups[subId].items.push(entry);
      } else {
        catGroup.directItems.push(entry);
      }
    });

    Object.values(categoryMap).forEach(catGroup => {
      catGroup.directItems.sort((a, b) => a.product.name.localeCompare(b.product.name));
      Object.values(catGroup.subgroups).forEach(sub => {
        sub.items.sort((a, b) => a.product.name.localeCompare(b.product.name));
      });
    });

    const sortedCatIds = Object.keys(categoryMap).filter(id => {
      if (id === "none") {
        return categoryMap["none"].directItems.length > 0;
      }
      return true;
    }).sort((a, b) => {
      if (a === "none") return 1;
      if (b === "none") return -1;
      const catA = categoryMap[a].category;
      const catB = categoryMap[b].category;
      const priceA = catA?.price != null ? Number(catA.price) : Infinity;
      const priceB = catB?.price != null ? Number(catB.price) : Infinity;
      if (priceA !== priceB) return priceA - priceB;
      return (catA?.name || "").localeCompare(catB?.name || "");
    });

    return sortedCatIds.map(id => {
      const catGroup = categoryMap[id];
      const validSubgroups = Object.values(catGroup.subgroups).filter(sub => {
        if (!sub.subcategory && sub.items.length === 0) return false;
        return true;
      });

      const totalCount = catGroup.hasSubcategories
        ? validSubgroups.reduce((sum, s) => sum + s.items.length, 0)
        : catGroup.directItems.length;

      return {
        id,
        name: catGroup.category?.name || "Sem Categoria",
        category: catGroup.category,
        hasSubcategories: catGroup.hasSubcategories,
        subgroups: validSubgroups,
        directItems: catGroup.directItems,
        totalCount,
      };
    });
  }, [stock, products, categories]);

  const handleOpenModal = (
    type: "in" | "adjust",
    productId?: string,
    currentStock?: number
  ) => {
    setModalType(type);
    setSelectedProductId(productId || "");
    if (type === "adjust") {
      setNewQuantity(currentStock ?? 0);
    } else {
      setNewQuantity(1);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId("");
    setNewQuantity(0);
  };

  const handleProductSelectChange = (productId: string) => {
    setSelectedProductId(productId);
    if (modalType === "adjust") {
      const s = stock.find((item) => item.productId === productId);
      setNewQuantity(s ? s.currentStock : 0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      alert("Selecione um produto");
      return;
    }

    try {
      let endpoint = "";
      let payloadQuantity = 0;

      if (modalType === "in") {
        endpoint = "/stock/in";
        payloadQuantity = newQuantity;
      } else {
        endpoint = "/stock/adjust";
        const currentStock =
          stock.find((s) => s.productId === selectedProductId)?.currentStock || 0;
        payloadQuantity = newQuantity - currentStock;
      }

      await api.post(endpoint, {
        productId: selectedProductId,
        quantity: payloadQuantity,
      });

      loadStock();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      alert("Erro ao atualizar estoque");
    }
  };

  const selectedProduct = products.find(p => p.id === selectedProductId);
  const currentStockForSelected = stock.find(s => s.productId === selectedProductId)?.currentStock ?? 0;

  const renderStockCard = ({ product, stockItem }: { product: Product; stockItem: StockItem }) => (
    <div
      key={product.id}
      className={`product-card ${stockItem.currentStock < 0 ? "negative-card" : ""}`}
      onClick={() => handleOpenModal("in", product.id)}
      style={{ cursor: "pointer" }}
    >
      <div className="product-info">
        <h3>{product.name}</h3>
        <p className={`product-stock-qty ${stockItem.currentStock < 0 ? "negative-qty" : ""}`}>
          {stockItem.currentStock}
          <span className="product-unit">
            {" "}{product.unit || 'un'}
          </span>
        </p>
        <div className="product-badges" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px', fontSize: '0.8em', justifyContent: 'center' }}>
          {stockItem.currentStock < 0 && (
            <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
              ⚠️ Negativo
            </span>
          )}
          {stockItem.warnings && stockItem.warnings.length > 0 && stockItem.warnings.map((warning, index) => (
            <span key={index} style={{ background: '#fffbeb', color: '#b45309', padding: '2px 6px', borderRadius: '4px' }}>
              ⚠️ {warning}
            </span>
          ))}
          {product.isSellable && (
            <span style={{ background: '#e0f7fa', color: '#006064', padding: '2px 6px', borderRadius: '4px' }}>
              🛒 Venda
            </span>
          )}
          {product.isPurchasable && (
            <span style={{ background: '#f3e5f5', color: '#4a148c', padding: '2px 6px', borderRadius: '4px' }}>
              📦 Compra
            </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="stock-page">
      <header className="page-header">
        <h1>Estoque</h1>
      </header>

      <div className="stock-list">
        {products.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum produto cadastrado no estoque.
          </p>
        ) : (
          groupedStock.map(group => (
            <div key={group.id} className="stock-category-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '24px 0 10px', borderBottom: '2px solid #eee', paddingBottom: '5px' }}>
                <h2 className="category-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                  {group.name}
                </h2>
              </div>
              {group.totalCount === 0 ? (
                <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic', padding: '8px 0 16px' }}>
                  Nenhum item nesta categoria.
                </p>
              ) : group.hasSubcategories ? (
                group.subgroups.map(subgroup => (
                  <div key={subgroup.id} className="subcategory-group">
                    <div className="subcategory-header">
                      <h3 className="subcategory-title">
                        {subgroup.subcategory ? `🏷️ ${subgroup.name}` : `📦 ${subgroup.name}`}
                      </h3>
                    </div>
                    {subgroup.items.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic', margin: '4px 0 12px' }}>
                        Nenhum item nesta subcategoria.
                      </p>
                    ) : (
                      <div className="products-grid stock-products-grid">
                        {subgroup.items.map(renderStockCard)}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="products-grid stock-products-grid">
                  {group.directItems.map(renderStockCard)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>
              {modalType === "in" ? "Entrada de Estoque" : "Ajustar Estoque"}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Produto</label>
                <select
                  value={selectedProductId}
                  onChange={(e) => handleProductSelectChange(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="">Selecione um produto...</option>
                  {products.map((p) => {
                    const s = stock.find((item) => item.productId === p.id);
                    const cur = s ? s.currentStock : 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Atual: {cur} {p.unit || "un"})
                      </option>
                    );
                  })}
                </select>
              </div>

              {selectedProduct && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px 14px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#64748b" }}>
                    Estoque atual:
                  </span>
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "15px",
                      color: currentStockForSelected < 0 ? "#dc2626" : "#334155",
                    }}
                  >
                    {currentStockForSelected} {selectedProduct.unit || "un"}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>
                  {modalType === "in"
                    ? `Quantidade a adicionar (${selectedProduct?.unit || "un"})`
                    : `Novo estoque total (${selectedProduct?.unit || "un"})`}
                </label>
                <NumberInput
                  step="any"
                  buttonStep={1}
                  min={modalType === "adjust" ? undefined : 0.0001}
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                  showButtons
                  required
                />
                {modalType === "in" && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                    {[1, 5, 10, 20].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setNewQuantity((prev) => (prev || 0) + inc)}
                        style={{
                          flex: 1,
                          padding: "6px 0",
                          background: "#f1f5f9",
                          border: "1px solid #cbd5e1",
                          borderRadius: "6px",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#334155",
                          cursor: "pointer",
                        }}
                      >
                        +{inc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedProduct && modalType === "in" && (
                <div
                  style={{
                    marginBottom: "16px",
                    padding: "10px 14px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "#166534" }}>
                    Novo saldo previsto:
                  </span>
                  <span
                    style={{
                      fontWeight: "700",
                      fontSize: "15px",
                      color: "#15803d",
                    }}
                  >
                    {(Number(currentStockForSelected) + Number(newQuantity || 0))} {selectedProduct.unit || "un"}
                  </span>
                </div>
              )}

              <div
                className="modal-actions"
                style={{
                  marginTop: "24px",
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {modalType === "in" ? "➕ Confirmar Entrada" : "Salvar Ajuste"}
                </button>
              </div>

              <div style={{ marginTop: "16px", textAlign: "center" }}>
                {modalType === "in" ? (
                  <button
                    type="button"
                    onClick={() => {
                      setModalType("adjust");
                      setNewQuantity(currentStockForSelected);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#64748b",
                      fontSize: "12px",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    ⚖️ Precisa corrigir o saldo total? Fazer balanço/ajuste
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setModalType("in");
                      setNewQuantity(1);
                    }}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#4f46e5",
                      fontSize: "12px",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: "4px 8px",
                    }}
                  >
                    📥 Voltar para Entrada de Estoque
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        menuItems={[
          {
            icon: "📥",
            label: "Entrada de Estoque",
            onClick: () => handleOpenModal("in"),
          },
          {
            icon: "⚖️",
            label: "Ajustar Estoque",
            onClick: () => handleOpenModal("adjust"),
          },
          {
            icon: "🗑️",
            label: "Registrar Descarte / Perda",
            onClick: () => navigate("/orders/new?mode=waste"),
          },
        ]}
      />
    </div>
  );
}
