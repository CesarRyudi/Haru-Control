import { FloatingActionButton, NumberInput } from "@haru-control/ui";
import { formatCurrency } from "@haru-control/utils";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Products.css";

interface Category {
  id: string;
  name: string;
  price?: number;
  observation?: string;
}

interface Product {
  id: string;
  name: string;
  unit: string;
  price: number;
  categoryId?: string;
  category?: Category;
  isSellable: boolean;
  isPurchasable: boolean;
}

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({ name: "", unit: "un", price: 0, categoryId: "", isSellable: false, isPurchasable: false });

  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", price: 0, observation: "" });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get("/products"),
        api.get("/categories")
      ]);
      const sortedCategories = categoriesRes.data.sort((a: Category, b: Category) => {
        const priceA = a.price != null ? Number(a.price) : Infinity;
        const priceB = b.price != null ? Number(b.price) : Infinity;
        if (priceA !== priceB) return priceA - priceB;
        return a.name.localeCompare(b.name);
      });
      setProducts(productsRes.data);
      setCategories(sortedCategories);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        unit: product.unit || "un",
        price: product.price,
        categoryId: product.categoryId || "",
        isSellable: product.isSellable || false,
        isPurchasable: product.isPurchasable || false,
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", unit: "un", price: 0, categoryId: "", isSellable: false, isPurchasable: false });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", unit: "un", price: 0, categoryId: "", isSellable: false, isPurchasable: false });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCatId = e.target.value;
    const selectedCat = categories.find(c => c.id === selectedCatId);
    
    setFormData(prev => ({
      ...prev,
      categoryId: selectedCatId,
      price: selectedCat && selectedCat.price != null ? Number(selectedCat.price) : prev.price
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { 
        ...formData, 
        unit: formData.unit.trim() || "un",
        categoryId: formData.categoryId || undefined 
      };
      if (editingProduct) {
        await api.patch(`/products/${editingProduct.id}`, dataToSend);
      } else {
        await api.post("/products", dataToSend);
      }
      loadData();
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
      loadData();
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      alert("Erro ao excluir produto");
    }
  };

  const handleOpenCategoryModal = () => {
    setCategoryFormData({ name: "", price: 0, observation: "" });
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setCategoryFormData({ name: "", price: 0, observation: "" });
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        name: categoryFormData.name,
        price: categoryFormData.price > 0 ? categoryFormData.price : null,
        observation: categoryFormData.observation || null,
      };
      await api.post("/categories", dataToSend);
      loadData();
      handleCloseCategoryModal();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      alert("Erro ao salvar categoria");
    }
  };

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

  return (
    <div className="products-page">
      <header className="page-header">
        <h1>Produtos</h1>
      </header>

      <div className="products-list">
        {products.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum produto cadastrado. Clique no botão de ação para adicionar.
          </p>
        ) : (
          groupedProducts.map(group => (
            <div key={group.name} className="product-category-group">
              <h2 className="category-title">{group.name}</h2>
              <div className="products-grid">
                {group.products.map(product => (
                  <div key={product.id} className="product-card" onClick={() => handleOpenModal(product)} style={{ cursor: "pointer" }}>
                    <div className="product-info">
                      <h3>{product.name}</h3>
                      <p className="product-price">
                        {formatCurrency(product.price)}
                        <span style={{ fontSize: '0.75em', fontWeight: 'normal', color: '#666', marginLeft: '4px' }}>
                          / {product.unit || 'un'}
                        </span>
                      </p>
                      <div className="product-badges" style={{ display: 'flex', gap: '8px', marginTop: '8px', fontSize: '0.8em' }}>
                        {product.isSellable && <span style={{ background: '#e0f7fa', color: '#006064', padding: '2px 6px', borderRadius: '4px' }}>🛒 Venda</span>}
                        {product.isPurchasable && <span style={{ background: '#f3e5f5', color: '#4a148c', padding: '2px 6px', borderRadius: '4px' }}>📦 Compra</span>}
                      </div>
                    </div>
                  </div>
                ))}
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Unidade de Medida</label>
                <input
                  type="text"
                  list="units-suggestions"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="ex: un, kg, g, ml, L, cx, pct"
                  required
                />
                <datalist id="units-suggestions">
                  <option value="un" />
                  <option value="g" />
                  <option value="kg" />
                  <option value="ml" />
                  <option value="L" />
                  <option value="cx" />
                  <option value="pct" />
                  <option value="fatia" />
                  <option value="porção" />
                </datalist>
              </div>
              <div className="form-group">
                <label>Categoria (Opcional)</label>
                <select 
                  value={formData.categoryId} 
                  onChange={handleCategoryChange}
                  className="form-select"
                >
                  <option value="">Sem Categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Preço</label>
                <NumberInput
                  step="0.5"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  showButtons
                  required
                />
              </div>
              <div className="form-group" style={{ display: 'flex', gap: '16px', margin: '16px 0', flexDirection: 'column' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={formData.isSellable} onChange={(e) => setFormData({ ...formData, isSellable: e.target.checked })} style={{ width: 'auto', margin: 0 }} />
                  Pode ser vendido (Produto final)
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontWeight: 'normal' }}>
                  <input type="checkbox" checked={formData.isPurchasable} onChange={(e) => setFormData({ ...formData, isPurchasable: e.target.checked })} style={{ width: 'auto', margin: 0 }} />
                  Pode ser comprado (Insumo)
                </label>
              </div>
              <div className="modal-actions" style={{ justifyContent: editingProduct ? "space-between" : "flex-end", display: "flex", width: "100%" }}>
                {editingProduct && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button type="button" onClick={() => handleDelete(editingProduct.id)} className="btn-delete" style={{ background: "#e74c3c", color: "white", padding: "12px 16px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                      Excluir
                    </button>
                    <button type="button" onClick={() => { handleCloseModal(); navigate(`/products/${editingProduct.id}/recipe`); }} className="btn-secondary" style={{ background: "#3498db", color: "white", padding: "12px 16px", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                      Receita
                    </button>
                  </div>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" onClick={handleCloseModal} className="btn-secondary">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={handleCloseCategoryModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Nova Categoria</h2>
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label>Nome da Categoria</label>
                <input
                  type="text"
                  value={categoryFormData.name}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Preço Padrão (Opcional)</label>
                <NumberInput
                  step="0.5"
                  min="0"
                  value={categoryFormData.price}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, price: parseFloat(e.target.value) || 0 })}
                  showButtons
                />
              </div>
              <div className="form-group">
                <label>Observação (Opcional)</label>
                <textarea
                  value={categoryFormData.observation}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, observation: e.target.value })}
                  rows={3}
                  className="form-textarea"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }}
                />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={handleCloseCategoryModal} className="btn-secondary">
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

      <FloatingActionButton
        menuItems={[
          { icon: "➕", label: "Novo Produto", onClick: () => handleOpenModal() },
          { icon: "📁", label: "Nova Categoria", onClick: () => handleOpenCategoryModal() },
        ]}
      />
    </div>
  );
}
