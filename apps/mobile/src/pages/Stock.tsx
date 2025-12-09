import { NumberInput } from "@haru-control/ui";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Stock.css";

interface StockItem {
  productId: string;
  productName: string;
  currentStock: number;
  warnings?: string[];
}

export default function Stock() {
  const navigate = useNavigate();
  const [stock, setStock] = useState<StockItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"in" | "adjust">("in");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [quantity, setQuantity] = useState(0);

  useEffect(() => {
    loadStock();
  }, []);

  const loadStock = async () => {
    try {
      const response = await api.get("/stock/snapshot");
      setStock(response.data);
    } catch (error) {
      console.error("Erro ao carregar estoque:", error);
    }
  };

  const handleOpenModal = (type: "in" | "adjust", productId?: string) => {
    setModalType(type);
    setSelectedProductId(productId || "");
    setQuantity(0);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProductId("");
    setQuantity(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId || quantity === 0) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      const endpoint = modalType === "in" ? "/stock/in" : "/stock/adjust";
      await api.post(endpoint, { productId: selectedProductId, quantity });
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
        <button onClick={() => navigate("/")} className="btn-back">
          ← Voltar
        </button>
        <h1>Estoque</h1>
        <button onClick={() => handleOpenModal("in")} className="btn-primary">
          + Entrada de Estoque
        </button>
      </header>

      <div className="stock-list">
        {stock.map((item) => (
          <div
            key={item.productId}
            className={`stock-item ${item.currentStock < 0 ? "negative" : ""}`}
          >
            <div className="stock-info">
              <h3>{item.productName}</h3>
              <p className="stock-quantity">
                Estoque: <strong>{item.currentStock}</strong>
              </p>
              {item.warnings && item.warnings.length > 0 && (
                <div className="stock-warnings">
                  {item.warnings.map((warning, index) => (
                    <p key={index} className="warning">
                      ⚠️ {warning}
                    </p>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => handleOpenModal("adjust", item.productId)}
              className="btn-adjust"
            >
              Ajustar
            </button>
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
                  {stock.map((item) => (
                    <option key={item.productId} value={item.productId}>
                      {item.productName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>
                  {modalType === "in"
                    ? "Quantidade (adicionar)"
                    : "Quantidade (positivo ou negativo)"}
                </label>
                <NumberInput
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value))}
                  required
                  placeholder={modalType === "in" ? "Ex: 10" : "Ex: -5 ou +10"}
                />
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
    </div>
  );
}
