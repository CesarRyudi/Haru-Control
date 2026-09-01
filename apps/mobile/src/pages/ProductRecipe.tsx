import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FloatingActionButton, NumberInput } from "@haru-control/ui";
import { getCompatibleUnits, convertQuantity, normalizeUnit } from "@haru-control/utils";
import "./Products.css";

interface Product {
  id: string;
  name: string;
  unit: string;
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
  const [formData, setFormData] = useState({ childId: "", quantity: 1, unit: "un" });

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
    const firstProduct = availableProducts[0];
    const defaultUnit = firstProduct ? normalizeUnit(firstProduct.unit) : "un";
    setFormData({ childId: firstProduct?.id || "", quantity: 1, unit: defaultUnit });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleIngredientChange = (childId: string) => {
    const selected = availableProducts.find(p => p.id === childId);
    const defaultUnit = selected ? normalizeUnit(selected.unit) : "un";
    setFormData(prev => ({
      ...prev,
      childId,
      unit: defaultUnit,
    }));
  };

  const selectedChildProduct = availableProducts.find(p => p.id === formData.childId);
  const compatibleUnits = selectedChildProduct ? getCompatibleUnits(selectedChildProduct.unit) : [{ value: "un", label: "un" }];

  let conversionPreview: { text: string; stockQty: number } | null = null;
  if (selectedChildProduct && formData.quantity > 0) {
    try {
      const stockQty = convertQuantity(formData.quantity, formData.unit, selectedChildProduct.unit);
      const isDifferent = normalizeUnit(formData.unit) !== normalizeUnit(selectedChildProduct.unit);
      conversionPreview = {
        text: isDifferent
          ? `${formData.quantity} ${formData.unit} = ${stockQty} ${selectedChildProduct.unit} no estoque`
          : `${formData.quantity} ${selectedChildProduct.unit} no estoque`,
        stockQty,
      };
    } catch {
      conversionPreview = null;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.childId) {
      alert("Selecione um ingrediente.");
      return;
    }
    
    try {
      await api.post(`/products/${id}/recipe`, {
        childId: formData.childId,
        quantity: formData.quantity,
        unit: formData.unit || selectedChildProduct?.unit || "un",
      });
      loadData();
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao adicionar ingrediente:", error);
      alert(error.response?.data?.message || "Erro ao adicionar ingrediente. Ele já pode estar na receita.");
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
        <button onClick={() => navigate("/products")} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#667eea' }}>
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
            {recipe.map(item => {
              const hasConversion = item.unit && item.child?.unit && normalizeUnit(item.unit) !== normalizeUnit(item.child.unit);
              let convertedDesc = "";
              if (hasConversion) {
                try {
                  const converted = convertQuantity(Number(item.quantity), item.unit, item.child.unit);
                  convertedDesc = `(${converted} ${item.child.unit} no estoque)`;
                } catch {
                  convertedDesc = "";
                }
              }

              return (
                <div key={item.id} className="product-card">
                  <div className="product-info" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <div style={{ textAlign: 'left' }}>
                      <h3 style={{ fontSize: '1.05em', marginBottom: '4px' }}>{item.child.name}</h3>
                      <p style={{ color: '#667eea', fontWeight: 600, margin: 0, fontSize: '15px' }}>
                        {item.quantity} {item.unit || item.child?.unit || 'un'}
                      </p>
                      {hasConversion && (
                        <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
                          {convertedDesc}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDelete(item.id)} style={{ background: 'none', border: 'none', color: '#e74c3c', fontSize: '20px', cursor: 'pointer', padding: '6px' }} title="Remover ingrediente">
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
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
                  onChange={(e) => handleIngredientChange(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="" disabled>Selecione...</option>
                  {availableProducts.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Estoque em {p.unit || 'un'})</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Quantidade</label>
                  <NumberInput
                    step="any"
                    buttonStep={1}
                    min="0.0001"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                    showButtons
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unidade</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="form-select"
                    required
                  >
                    {compatibleUnits.map(u => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {conversionPreview && (
                <div style={{ padding: '10px 14px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '13px', color: '#166534', marginBottom: '20px' }}>
                  💡 <strong>Impacto no estoque:</strong> {conversionPreview.text} por unidade produzida.
                </div>
              )}

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
