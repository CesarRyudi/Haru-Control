import { formatCurrency } from "@haru-control/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Products.css";

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
}

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: "", unit: "", price: 0 });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      console.log("Loading products...");
      const response = await api.get("/products");
      console.log("Products response:", response.data);
      setProducts(response.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        unit: product.unit,
        price: product.price,
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", unit: "", price: 0 });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", unit: "", price: 0 });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post("/products", formData);
      }
      loadProducts();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Erro ao salvar produto");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir este produto?")) return;

    try {
      await api.delete(`/products/${id}`);
      loadProducts();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto");
    }
  };

  return (
    <div className="products-page">
      <header className="page-header">
        <button onClick={() => navigate("/")} className="btn-back">
          ← Voltar
        </button>
        <h1>Produtos</h1>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          + Novo Produto
        </button>
      </header>

      <div className="products-list">
        {products.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum produto cadastrado. Clique em "+ Novo Produto" para
            adicionar.
          </p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="product-item">
              <div className="product-details">
                <h3>{product.name}</h3>
                <p className="product-unit">{product.unit}</p>
                <p className="product-price">{formatCurrency(product.price)}</p>
              </div>
              <div className="product-actions">
                <button
                  onClick={() => handleOpenModal(product)}
                  className="btn-edit"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  className="btn-delete"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingProduct ? "Editar Produto" : "Novo Produto"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Unidade</label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  placeholder="Ex: kg, un, L"
                  required
                />
              </div>
              <div className="form-group">
                <label>Preço</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      price: parseFloat(e.target.value),
                    })
                  }
                  required
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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
