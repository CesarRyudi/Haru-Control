import { FloatingActionButton, NumberInput } from "@haru-control/ui";
import { formatCurrency } from "@haru-control/utils";
import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "./Products.css";

import { Category, Subcategory, Product } from "@haru-control/types";

const COMMON_UNITS = [
  { value: "un", label: "un (unidade)" },
  { value: "g", label: "g (grama)" },
  { value: "kg", label: "kg (quilograma)" },
  { value: "ml", label: "ml (mililitro)" },
  { value: "L", label: "L (litro)" },
  { value: "cx", label: "cx (caixa)" },
  { value: "pct", label: "pct (pacote)" },
  { value: "fatia", label: "fatia" },
  { value: "porção", label: "porção" },
];

export default function Products() {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    unit: "un",
    price: 0,
    categoryId: "",
    subcategoryId: "",
    isSellable: false,
    isPurchasable: false,
    description: "",
  });

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryFormData, setCategoryFormData] = useState({ name: "", price: 0, observation: "" });

  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);
  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [subcategoryFormData, setSubcategoryFormData] = useState({
    name: "",
    categoryId: "",
    price: 0,
    observation: "",
  });

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
        subcategoryId: product.subcategoryId || "",
        isSellable: product.isSellable || false,
        isPurchasable: product.isPurchasable || false,
        description: product.description || "",
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: "", unit: "un", price: 0, categoryId: "", subcategoryId: "", isSellable: false, isPurchasable: false, description: "" });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData({ name: "", unit: "un", price: 0, categoryId: "", subcategoryId: "", isSellable: false, isPurchasable: false, description: "" });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCatId = e.target.value;
    const selectedCat = categories.find(c => c.id === selectedCatId);
    
    // Verifica se a subcategoria atual pertence à nova categoria
    const validSubs = selectedCat?.subcategories || [];
    const isSubValid = validSubs.some(s => s.id === formData.subcategoryId);

    setFormData(prev => ({
      ...prev,
      categoryId: selectedCatId,
      subcategoryId: isSubValid ? prev.subcategoryId : "",
      price: (prev.price === 0 || !prev.price) && selectedCat && selectedCat.price != null ? Number(selectedCat.price) : prev.price
    }));
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedSubId = e.target.value;
    const selectedCat = categories.find(c => c.id === formData.categoryId);
    const selectedSub = selectedCat?.subcategories?.find(s => s.id === selectedSubId);

    setFormData(prev => ({
      ...prev,
      subcategoryId: selectedSubId,
      price: (prev.price === 0 || !prev.price) && selectedSub && selectedSub.price != null
        ? Number(selectedSub.price)
        : prev.price
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = { 
        ...formData, 
        unit: formData.unit.trim() || "un",
        categoryId: formData.categoryId || undefined,
        subcategoryId: formData.subcategoryId || undefined,
        description: formData.description?.trim() || null,
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

  const handleOpenCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        price: category.price != null ? Number(category.price) : 0,
        observation: category.observation || "",
      });
    } else {
      setEditingCategory(null);
      setCategoryFormData({ name: "", price: 0, observation: "" });
    }
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
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
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, dataToSend);
      } else {
        await api.post("/categories", dataToSend);
      }
      loadData();
      handleCloseCategoryModal();
    } catch (error) {
      console.error("Erro ao salvar categoria:", error);
      alert("Erro ao salvar categoria");
    }
  };

  const handleCategoryDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta categoria? Os produtos vinculados ficarão como 'Sem Categoria'.")) return;
    try {
      await api.delete(`/categories/${id}`);
      loadData();
      handleCloseCategoryModal();
    } catch (error) {
      console.error("Erro ao excluir categoria:", error);
      alert("Erro ao excluir categoria");
    }
  };

  const handleOpenSubcategoryModal = (subcategory?: Subcategory, defaultCategoryId?: string) => {
    if (subcategory) {
      setEditingSubcategory(subcategory);
      setSubcategoryFormData({
        name: subcategory.name,
        categoryId: subcategory.categoryId,
        price: subcategory.price != null ? Number(subcategory.price) : 0,
        observation: subcategory.observation || "",
      });
    } else {
      setEditingSubcategory(null);
      setSubcategoryFormData({
        name: "",
        categoryId: defaultCategoryId || categories[0]?.id || "",
        price: 0,
        observation: "",
      });
    }
    setIsSubcategoryModalOpen(true);
  };

  const handleCloseSubcategoryModal = () => {
    setIsSubcategoryModalOpen(false);
    setEditingSubcategory(null);
    setSubcategoryFormData({ name: "", categoryId: "", price: 0, observation: "" });
  };

  const handleSubcategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dataToSend = {
        name: subcategoryFormData.name,
        categoryId: subcategoryFormData.categoryId,
        price: subcategoryFormData.price > 0 ? subcategoryFormData.price : null,
        observation: subcategoryFormData.observation || null,
      };
      if (editingSubcategory) {
        await api.patch(`/subcategories/${editingSubcategory.id}`, dataToSend);
      } else {
        await api.post("/subcategories", dataToSend);
      }
      loadData();
      handleCloseSubcategoryModal();
    } catch (error) {
      console.error("Erro ao salvar subcategoria:", error);
      alert("Erro ao salvar subcategoria");
    }
  };

  const handleSubcategoryDelete = async (id: string) => {
    if (!confirm("Deseja realmente excluir esta subcategoria? Os produtos vinculados ficarão sem subcategoria.")) return;
    try {
      await api.delete(`/subcategories/${id}`);
      loadData();
      handleCloseSubcategoryModal();
    } catch (error) {
      console.error("Erro ao excluir subcategoria:", error);
      alert("Erro ao excluir subcategoria");
    }
  };

  const groupedProducts = useMemo(() => {
    const categoryMap: Record<string, {
      category?: Category;
      hasSubcategories: boolean;
      subgroups: Record<string, { id: string; subcategory?: Subcategory; name: string; products: Product[] }>;
      directProducts: Product[];
    }> = {};

    categories.forEach(cat => {
      const hasSubs = Boolean(cat.subcategories && cat.subcategories.length > 0);
      const subMap: Record<string, { id: string; subcategory?: Subcategory; name: string; products: Product[] }> = {};
      if (hasSubs) {
        cat.subcategories!.forEach(sub => {
          subMap[sub.id] = { id: sub.id, subcategory: sub, name: sub.name, products: [] };
        });
        subMap["none"] = { id: "none", subcategory: undefined, name: "Outros / Sem Subcategoria", products: [] };
      }
      categoryMap[cat.id] = {
        category: cat,
        hasSubcategories: hasSubs,
        subgroups: subMap,
        directProducts: [],
      };
    });

    categoryMap["none"] = {
      category: undefined,
      hasSubcategories: false,
      subgroups: {},
      directProducts: [],
    };

    products.forEach(p => {
      const catId = p.categoryId && categoryMap[p.categoryId] ? p.categoryId : "none";
      const catGroup = categoryMap[catId];

      if (catGroup.hasSubcategories) {
        const subId = p.subcategoryId && catGroup.subgroups[p.subcategoryId] ? p.subcategoryId : "none";
        catGroup.subgroups[subId].products.push(p);
      } else {
        catGroup.directProducts.push(p);
      }
    });

    Object.values(categoryMap).forEach(catGroup => {
      catGroup.directProducts.sort((a, b) => a.name.localeCompare(b.name));
      Object.values(catGroup.subgroups).forEach(sub => {
        sub.products.sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    const sortedCatIds = Object.keys(categoryMap).filter(id => {
      if (id === "none") {
        return categoryMap["none"].directProducts.length > 0;
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
        if (!sub.subcategory && sub.products.length === 0) return false;
        return true;
      });

      const totalCount = catGroup.hasSubcategories
        ? validSubgroups.reduce((sum, s) => sum + s.products.length, 0)
        : catGroup.directProducts.length;

      return {
        id,
        name: catGroup.category?.name || "Sem Categoria",
        category: catGroup.category,
        hasSubcategories: catGroup.hasSubcategories,
        subgroups: validSubgroups,
        directProducts: catGroup.directProducts,
        totalCount,
      };
    });
  }, [products, categories]);

  const renderProductCard = (product: Product) => (
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
  );

  return (
    <div className="products-page">
      <header className="page-header">
        <h1>Produtos</h1>
      </header>

      <div className="products-list">
        {products.length === 0 && categories.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum produto cadastrado. Clique no botão de ação para adicionar.
          </p>
        ) : (
          groupedProducts.map(group => (
            <div key={group.id} className="product-category-group">
              <div className="category-header">
                <h2 className="category-title" style={{ margin: 0, border: 'none', padding: 0 }}>
                  {group.name}
                </h2>
                {group.category && (
                  <div className="category-header-actions">
                    <button
                      type="button"
                      onClick={() => handleOpenSubcategoryModal(undefined, group.category?.id)}
                      className="btn-add-subcat"
                      title="Nova Subcategoria nesta categoria"
                    >
                      ➕ Subcategoria
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryModal(group.category)}
                      className="btn-edit-cat"
                      title="Editar Categoria"
                    >
                      ✏️ Editar
                    </button>
                  </div>
                )}
              </div>

              {group.totalCount === 0 ? (
                <p style={{ color: '#999', fontSize: '14px', fontStyle: 'italic', padding: '8px 0 16px' }}>
                  Nenhum produto nesta categoria.
                </p>
              ) : group.hasSubcategories ? (
                group.subgroups.map(subgroup => (
                  <div key={subgroup.id} className="subcategory-group">
                    <div className="subcategory-header">
                      <h3 className="subcategory-title">
                        {subgroup.subcategory ? `🏷️ ${subgroup.name}` : `📦 ${subgroup.name}`}
                        {subgroup.subcategory?.price != null && (
                          <span style={{ fontSize: '0.8em', color: '#667eea', fontWeight: 'normal', marginLeft: '6px' }}>
                            ({formatCurrency(Number(subgroup.subcategory.price))})
                          </span>
                        )}
                      </h3>
                      {subgroup.subcategory && (
                        <button
                          type="button"
                          onClick={() => handleOpenSubcategoryModal(subgroup.subcategory)}
                          className="btn-edit-subcat"
                          title="Editar Subcategoria"
                        >
                          ✏️ Editar
                        </button>
                      )}
                    </div>
                    {subgroup.products.length === 0 ? (
                      <p style={{ color: '#aaa', fontSize: '13px', fontStyle: 'italic', margin: '4px 0 12px' }}>
                        Nenhum produto nesta subcategoria.
                      </p>
                    ) : (
                      <div className="products-grid">
                        {subgroup.products.map(product => renderProductCard(product))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="products-grid">
                  {group.directProducts.map(product => renderProductCard(product))}
                </div>
              )}
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
                <select
                  value={COMMON_UNITS.some(u => u.value === formData.unit) ? formData.unit : "custom"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "custom") {
                      setFormData(prev => ({ ...prev, unit: "" }));
                    } else {
                      setFormData(prev => ({ ...prev, unit: val }));
                    }
                  }}
                  className="form-select"
                >
                  {COMMON_UNITS.map(u => (
                    <option key={u.value} value={u.value}>{u.label}</option>
                  ))}
                  <option value="custom">Outra (digitar manualmente)...</option>
                </select>
                {!COMMON_UNITS.some(u => u.value === formData.unit) && (
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="Digite a unidade (ex: garrafa, dose, par...)"
                    style={{ marginTop: '8px' }}
                    required
                    autoFocus
                  />
                )}
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
              {formData.categoryId && (
                <div className="form-group">
                  <label>Subcategoria (Opcional)</label>
                  {(() => {
                    const selectedCat = categories.find(c => c.id === formData.categoryId);
                    const availableSubs = selectedCat?.subcategories || [];
                    if (availableSubs.length === 0) {
                      return (
                        <div style={{ fontSize: '13px', color: '#666', fontStyle: 'italic', padding: '6px 0' }}>
                          Nenhuma subcategoria nesta categoria.{" "}
                          <button
                            type="button"
                            onClick={() => handleOpenSubcategoryModal(undefined, formData.categoryId)}
                            style={{ background: 'none', border: 'none', color: '#4f46e5', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            + Criar agora
                          </button>
                        </div>
                      );
                    }
                    return (
                      <select
                        value={formData.subcategoryId}
                        onChange={handleSubcategoryChange}
                        className="form-select"
                      >
                        <option value="">Sem Subcategoria</option>
                        {availableSubs.map(sub => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} {sub.price != null ? `(${formatCurrency(Number(sub.price))})` : ''}
                          </option>
                        ))}
                      </select>
                    );
                  })()}
                </div>
              )}
              <div className="form-group">
                <label>Preço</label>
                <NumberInput
                  step="any"
                  buttonStep={0.5}
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                  showButtons
                  required
                />
              </div>
              <div className="form-group">
                <label>Descrição / Texto de Divulgação (Opcional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Massa tradicional com gotas de chocolate belga 🍪"
                  rows={2}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
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
              <div style={{ marginTop: '24px' }}>
                {editingProduct && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(editingProduct.id)}
                      className="btn-danger-outline"
                    >
                      Excluir
                    </button>
                    <button
                      type="button"
                      onClick={() => { handleCloseModal(); navigate(`/products/${editingProduct.id}/recipe`); }}
                      className="btn-info-outline"
                    >
                      Receita
                    </button>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
            <h2>{editingCategory ? "Editar Categoria" : "Nova Categoria"}</h2>
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
                  step="any"
                  buttonStep={0.5}
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
              <div style={{ marginTop: '24px' }}>
                {editingCategory && (
                  <div style={{ marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleCategoryDelete(editingCategory.id)}
                      className="btn-danger-outline"
                      style={{ width: '100%' }}
                    >
                      Excluir Categoria
                    </button>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button type="button" onClick={handleCloseCategoryModal} className="btn-secondary">
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

      {isSubcategoryModalOpen && (
        <div className="modal-overlay" onClick={handleCloseSubcategoryModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingSubcategory ? "Editar Subcategoria" : "Nova Subcategoria"}</h2>
            <form onSubmit={handleSubcategorySubmit}>
              <div className="form-group">
                <label>Categoria Principal</label>
                <select
                  value={subcategoryFormData.categoryId}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, categoryId: e.target.value })}
                  className="form-select"
                  required
                >
                  <option value="" disabled>Selecione uma categoria...</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Nome da Subcategoria</label>
                <input
                  type="text"
                  value={subcategoryFormData.name}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, name: e.target.value })}
                  placeholder="Ex: Clássicos, Especiais, Chocolates..."
                  required
                />
              </div>
              <div className="form-group">
                <label>Preço Padrão Sugerido (Opcional)</label>
                <NumberInput
                  step="any"
                  buttonStep={0.5}
                  min="0"
                  value={subcategoryFormData.price}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, price: parseFloat(e.target.value) || 0 })}
                  showButtons
                />
              </div>
              <div className="form-group">
                <label>Observação (Opcional)</label>
                <textarea
                  value={subcategoryFormData.observation}
                  onChange={(e) => setSubcategoryFormData({ ...subcategoryFormData, observation: e.target.value })}
                  rows={3}
                  className="form-textarea"
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginTop: '5px' }}
                />
              </div>
              <div style={{ marginTop: '24px' }}>
                {editingSubcategory && (
                  <div style={{ marginBottom: '12px' }}>
                    <button
                      type="button"
                      onClick={() => handleSubcategoryDelete(editingSubcategory.id)}
                      className="btn-danger-outline"
                      style={{ width: '100%' }}
                    >
                      Excluir Subcategoria
                    </button>
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button type="button" onClick={handleCloseSubcategoryModal} className="btn-secondary">
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

      <FloatingActionButton
        menuItems={[
          { icon: "➕", label: "Novo Produto", onClick: () => handleOpenModal() },
          { icon: "📂", label: "Nova Subcategoria", onClick: () => handleOpenSubcategoryModal() },
          { icon: "📁", label: "Nova Categoria", onClick: () => handleOpenCategoryModal() },
        ]}
      />
    </div>
  );
}
