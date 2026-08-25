import { FloatingActionButton, NumberInput } from "@haru-control/ui";
import { formatCurrency } from "@haru-control/utils";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Stock.css";

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  category?: { name: string; price?: number };
}

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"in" | "adjust">("in");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [newQuantity, setNewQuantity] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [stockRes, productsRes] = await Promise.all([
        api.get("/stock/snapshot"),
        api.get("/products")
      ]);
      setStock(stockRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const loadStock = async () => {
    try {
      const response = await api.get("/stock/snapshot");
      setStock(response.data);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    }
  };

  const groupedStock = useMemo(() => {
    const groups: Record<string, { product: Product, stockItem: StockItem }[]> = {};
    
    // Create a map of stock items for quick lookup
    const stockMap = new Map<string, StockItem>();
    stock.forEach(item => stockMap.set(item.productId, item));

    products.forEach(p => {
      const catName = p.category?.name || "Sem Categoria";
      if (!groups[catName]) groups[catName] = [];
      const sItem = stockMap.get(p.id) || { productId: p.id, productName: p.name, currentStock: 0 };
      groups[catName].push({ product: p, stockItem: sItem });
    });
    
    Object.values(groups).forEach(group => {
      group.sort((a, b) => a.product.name.localeCompare(b.product.name));
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => {
      if (a === "Sem Categoria") return 1;
      if (b === "Sem Categoria") return -1;

      const catA = groups[a][0]?.product.category;
      const catB = groups[b][0]?.product.category;
      const priceA = catA?.price != null ? Number(catA.price) : Infinity;
      const priceB = catB?.price != null ? Number(catB.price) : Infinity;

      if (priceA !== priceB) return priceA - priceB;
      return a.localeCompare(b);
    });

    return sortedKeys.map(key => ({ name: key, items: groups[key] }));
  }, [stock, products]);


  const handleOpenModal = (type: "in" | "adjust", productId?: string, currentStock?: number) => {
    setModalType(type);
    setSelectedProductId(productId || "");
    setNewQuantity(currentStock || 0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId("");
    setNewQuantity(0);
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
        const currentStock = stock.find(s => s.productId === selectedProductId)?.currentStock || 0;
        payloadQuantity = newQuantity - currentStock;
      }

      await api.post(endpoint, { productId: selectedProductId, quantity: payloadQuantity });
      loadStock();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao atualizar estoque:", error);
      alert("Erro ao atualizar estoque");
    }
  };

  return (
    <div className="stock-page">
      <header className="page-header">
        <h1>Estoque</h1>
      </header>

      <div className="stock-content">
        {groupedStock.map(group => (
          <div key={group.name} style={{ marginBottom: "24px" }}>
            <h2 style={{ borderBottom: "2px solid #ddd", paddingBottom: "8px", marginBottom: "16px", color: "#444" }}>
              {group.name}
            </h2>
            <div className="products-grid">
              {group.items.map(({ product, stockItem }) => (
                <div
                  key={product.id}
                  className={`product-card ${stockItem.currentStock < 0 ? "negative" : ""}`}
                >
                  <div className="product-info">
                    <h3>{product.name}</h3>
                    <p className="product-price">
                      Estoque: <strong>{stockItem.currentStock} {product.unit || 'un'}</strong>
                    </p>
                    {stockItem.warnings && stockItem.warnings.length > 0 && (
                      <div className="stock-warnings">
                        {stockItem.warnings.map((warning, index) => (
                          <p key={index} className="warning">
                            ⚠️ {warning}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="item-controls" style={{ margin: "0", justifyContent: "center" }}>
                    <button
                      onClick={() => handleOpenModal("adjust", product.id, stockItem.currentStock)}
                      className="btn-add-wide"
                    >
                      Ajustar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  required
                >
                  <option value="">Selecione um produto</option>
                  {stock.map((item) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <option key={item.productId} value={item.productId}>
                        {item.productName} ({prod?.unit || 'un'})
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="form-group">
                <label>
                  {(() => {
                    const prod = products.find(p => p.id === selectedProductId);
                    const unitSuffix = prod?.unit ? ` (${prod.unit})` : "";
                    return modalType === "in"
                      ? `Quantidade a adicionar${unitSuffix}`
                      : `Novo Estoque Atual${unitSuffix}`;
                  })()}
                </label>
                <div className="stock-adjust-controls">
                  <button
                    type="button"
                    onClick={() => setNewQuantity(Math.max(0, Number((newQuantity - 1).toFixed(4))))}
                    className="btn-qty"
                  >
                    -
                  </button>
                  <NumberInput
                    step="0.01"
                    min="0"
                    value={newQuantity}
                    onChange={(e) => setNewQuantity(parseFloat(e.target.value) || 0)}
                    required
                    className="qty-input"
                  />
                  <button
                    type="button"
                    onClick={() => setNewQuantity(Number((newQuantity + 1).toFixed(4)))}
                    className="btn-qty"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        onClick={() => handleOpenModal("in")}
        icon="＋"
      />
    </div>
  );
}
