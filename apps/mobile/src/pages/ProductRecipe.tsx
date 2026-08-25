import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FloatingActionButton, NumberInput } from "@haru-control/ui";
import "./Products.css";

interface Product {
  id: string;
  name: string;
  isPurchasable: boolean;
}

interface RecipeItem {
  id: string;
  childId: string;
  quantity: number;
  unit: string;
  child: Product;
}

export default function ProductRecipe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ childId: "", quantity: 1 });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [productRes, recipeRes, allProductsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/recipe`),
        api.get(`/products`)
      ]);
      setProduct(productRes.data);
      setRecipe(recipeRes.data);
      
      // Qualquer produto do catálogo (exceto o próprio produto) pode ser ingrediente na receita
      const eligibleProducts = allProductsRes.data
        .filter((p: Product) => p.id !== id)
        .sort((a: Product, b: Product) => a.name.localeCompare(b.name));
      setAvailableProducts(eligibleProducts);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleOpenModal = () => {
    setFormData({ childId: availableProducts[0]?.id || "", quantity: 1 });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childId) {
      alert("Selecione um ingrediente.");
      return;
    }
    
    try {
      await api.post(`/products/${id}/recipe`, {
        childId: formData.childId,
        quantity: formData.quantity
      });
      loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao adicionar ingrediente:", error);
      alert("Erro ao adicionar ingrediente. Ele já pode estar na receita.");
    }
  };

  const handleDelete = async (recipeItemId: string) => {
    if (!confirm("Deseja remover este ingrediente da receita?")) return;
    try {
      await api.delete(`/products/${id}/recipe/${recipeItemId}`);
      loadData();
    } catch (error) {
      console.error("Erro ao remover ingrediente:", error);
      alert("Erro ao remover ingrediente");
    }
  };

  return (
    <div className="products-page">
      <header className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button onClick={() => navigate("/products")} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--primary-color)' }}>
          &larr;
        </button>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Receita / BOM</h1>
          <p style={{ color: '#666', margin: 0 }}>{product?.name}</p>
        </div>
      </header>

      <div className="products-list">
        {recipe.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum ingrediente adicionado.
          </p>
        ) : (
          <div className="products-grid">
            {recipe.map(item => (
              <div key={item.id} className="product-card">
                <div className="product-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1em' }}>{item.child.name}</h3>
                    <p style={{ color: '#666', marginTop: '4px' }}>{item.quantity} {item.unit}</p>
                  </div>
                  <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '20px', cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Adicionar Ingrediente</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Ingrediente / Insumo</label>
                <select
                  value={formData.childId}
                  onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="" disabled>Selecione...</option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Quantidade Necessária</label>
                <NumberInput
                  step="0.1"
                  min="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                  showButtons
                  required
                />
              </div>
              <div className="modal-actions" style={{ justifyContent: 'flex-end', display: "flex", width: "100%" }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Adicionar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        menuItems={[
          { icon: "➕", label: "Adicionar Ingrediente", onClick: () => handleOpenModal() },
        ]}
      />
    </div>
  );
}
