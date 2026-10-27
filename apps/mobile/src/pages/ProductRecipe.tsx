import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../services/api";
import { FloatingActionButton, NumberInput, Toast } from "@haru-control/ui";
import {
  getCompatibleUnitsForProduct,
  convertProductQuantity,
  convertQuantity,
  normalizeUnit,
  getUnitDimension,
  getRecommendedStepForUnit,
} from "@haru-control/utils";
import { Product } from "@haru-control/types";
import "./Products.css";

interface RecipeItem {
  id: string;
  childId: string;
  quantity: number;
  unit: string;
  child: Product;
}

const YIELD_UNITS = [
  { value: "g", label: "g (gramas)" },
  { value: "kg", label: "kg (quilogramas)" },
  { value: "ml", label: "ml (mililitros)" },
  { value: "L", label: "L (litros)" },
  { value: "un", label: "un (unidades)" },
];

export default function ProductRecipe() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [recipe, setRecipe] = useState<RecipeItem[]>([]);
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RecipeItem | null>(null);
  const [formData, setFormData] = useState({ childId: "", quantity: 1, unit: "un" });

  const [isYieldModalOpen, setIsYieldModalOpen] = useState(false);
  const [yieldFormData, setYieldFormData] = useState({
    recipeYield: 0,
    recipeYieldUnit: "g",
  });

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [productRes, recipeRes, allProductsRes] = await Promise.all([
        api.get(`/products/${id}`),
        api.get(`/products/${id}/recipe`),
        api.get(`/products`),
      ]);
      setProduct(productRes.data);
      setRecipe(recipeRes.data);

      const eligibleProducts = allProductsRes.data
        .filter((p: Product) => p.id !== id)
        .sort((a: Product, b: Product) => a.name.localeCompare(b.name));
      setAvailableProducts(eligibleProducts);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  // Calcula a soma total em gramas dos ingredientes que são de massa (g/kg/mg)
  const calculatedRecipeWeightGrams = useMemo(() => {
    let totalGrams = 0;
    for (const item of recipe) {
      const itemUnit = item.unit || item.child?.unit || "un";
      if (getUnitDimension(itemUnit) === "mass") {
        try {
          totalGrams += convertQuantity(Number(item.quantity), itemUnit, "g");
        } catch {
          // ignora se incompatível
        }
      } else if (
        item.child?.recipeYield &&
        Number(item.child.recipeYield) > 0 &&
        item.child.recipeYieldUnit &&
        getUnitDimension(item.child.recipeYieldUnit) === "mass"
      ) {
        try {
          const singleGrams = convertQuantity(
            Number(item.child.recipeYield),
            item.child.recipeYieldUnit,
            "g"
          );
          totalGrams += Number(item.quantity) * singleGrams;
        } catch {
          // ignora
        }
      }
    }
    return Math.round(totalGrams * 100) / 100;
  }, [recipe]);

  const groupedAvailableProducts = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    availableProducts.forEach((p) => {
      let groupName = p.category?.name || "Sem Categoria";
      if (p.subcategory?.name) {
        groupName += ` > ${p.subcategory.name}`;
      }
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(p);
    });
    return groups;
  }, [availableProducts]);

  const getDefaultUnitForChild = (child?: Product) => {
    if (!child) return "un";
    if (child.recipeYield && Number(child.recipeYield) > 0 && child.recipeYieldUnit) {
      return normalizeUnit(child.recipeYieldUnit);
    }
    return normalizeUnit(child.unit);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    const firstProduct = availableProducts[0];
    const defaultUnit = getDefaultUnitForChild(firstProduct);
    const defaultQty = defaultUnit === "g" || defaultUnit === "ml" ? 60 : 1;
    setFormData({
      childId: firstProduct?.id || "",
      quantity: defaultQty,
      unit: defaultUnit,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: RecipeItem) => {
    setEditingItem(item);
    const child = availableProducts.find((p) => p.id === item.childId) || item.child;
    const currentUnit = normalizeUnit(item.unit || child?.unit || "un");
    setFormData({
      childId: item.childId,
      quantity: Number(item.quantity),
      unit: currentUnit,
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
  };

  const handleIngredientChange = (childId: string) => {
    const selected = availableProducts.find((p) => p.id === childId);
    const defaultUnit = getDefaultUnitForChild(selected);
    const defaultQty = defaultUnit === "g" || defaultUnit === "ml" ? 60 : 1;
    setFormData((prev) => ({
      ...prev,
      childId,
      unit: defaultUnit,
      quantity: prev.quantity === 1 && defaultQty === 60 ? 60 : prev.quantity,
    }));
  };

  const selectedChildProduct =
    availableProducts.find((p) => p.id === formData.childId) || editingItem?.child;
  const compatibleUnits = getCompatibleUnitsForProduct(selectedChildProduct);
  const currentStep = getRecommendedStepForUnit(formData.unit);

  let conversionPreview: { text: string; extraInfo?: string; stockQty: number } | null = null;
  if (selectedChildProduct && formData.quantity > 0) {
    try {
      const stockQty = convertProductQuantity(
        formData.quantity,
        formData.unit,
        selectedChildProduct
      );
      const isDifferent =
        normalizeUnit(formData.unit) !== normalizeUnit(selectedChildProduct.unit);

      let extraInfo: string | undefined;
      const yieldVal = Number(selectedChildProduct.recipeYield || 0);
      if (yieldVal > 0 && selectedChildProduct.recipeYieldUnit && stockQty > 0 && stockQty < 1) {
        const cookiesPerBatch = Number((1 / stockQty).toFixed(1));
        extraInfo = `1 ${selectedChildProduct.unit || "receita"} (${yieldVal}${normalizeUnit(
          selectedChildProduct.recipeYieldUnit
        )}) rende ~${cookiesPerBatch} porções de ${formData.quantity}${formData.unit}`;
      }

      conversionPreview = {
        text: isDifferent
          ? `${formData.quantity} ${formData.unit} = ${Number(stockQty.toFixed(4))} ${selectedChildProduct.unit} no estoque`
          : `${formData.quantity} ${selectedChildProduct.unit} no estoque`,
        extraInfo,
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
    if (formData.quantity <= 0) {
      alert("Informe uma quantidade maior que zero.");
      return;
    }

    try {
      const payload = {
        childId: formData.childId,
        quantity: formData.quantity,
        unit: formData.unit || selectedChildProduct?.unit || "un",
      };

      if (editingItem) {
        await api.patch(`/products/${id}/recipe/${editingItem.id}`, payload);
        setToast({ message: "Ingrediente atualizado com sucesso!", type: "success" });
      } else {
        await api.post(`/products/${id}/recipe`, payload);
        setToast({ message: "Ingrediente adicionado à receita!", type: "success" });
      }
      await loadData();
      handleCloseModal();
    } catch (error: any) {
      console.error("Erro ao salvar ingrediente:", error);
      alert(
        error.response?.data?.message ||
          "Erro ao salvar ingrediente na receita."
      );
    }
  };

  const handleDelete = async (recipeItemId: string) => {
    if (!confirm("Deseja remover este ingrediente da receita?")) return;
    try {
      await api.delete(`/products/${id}/recipe/${recipeItemId}`);
      setToast({ message: "Ingrediente removido da receita.", type: "success" });
      await loadData();
      if (editingItem?.id === recipeItemId) {
        handleCloseModal();
      }
    } catch (error) {
      console.error("Erro ao remover ingrediente:", error);
      alert("Erro ao remover ingrediente");
    }
  };

  const handleOpenYieldModal = () => {
    setYieldFormData({
      recipeYield:
        product?.recipeYield && Number(product.recipeYield) > 0
          ? Number(product.recipeYield)
          : calculatedRecipeWeightGrams > 0
          ? calculatedRecipeWeightGrams
          : 1600,
      recipeYieldUnit: product?.recipeYieldUnit || "g",
    });
    setIsYieldModalOpen(true);
  };

  const handleSaveYield = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      const validYield =
        yieldFormData.recipeYield > 0 ? Number(yieldFormData.recipeYield) : null;
      await api.patch(`/products/${id}`, {
        recipeYield: validYield,
        recipeYieldUnit: validYield ? yieldFormData.recipeYieldUnit : null,
      });
      setToast({
        message: validYield
          ? `Rendimento definido: ${validYield} ${yieldFormData.recipeYieldUnit}`
          : "Rendimento removido.",
        type: "success",
      });
      setIsYieldModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao salvar rendimento:", error);
      alert("Erro ao salvar rendimento da receita.");
    }
  };

  const handleClearYield = async () => {
    if (!id) return;
    try {
      await api.patch(`/products/${id}`, {
        recipeYield: null,
        recipeYieldUnit: null,
      });
      setToast({ message: "Rendimento redefinido para o padrão.", type: "success" });
      setIsYieldModalOpen(false);
      await loadData();
    } catch (error) {
      console.error("Erro ao limpar rendimento:", error);
    }
  };

  const hasCustomYield =
    product?.recipeYield != null &&
    Number(product.recipeYield) > 0 &&
    Boolean(product?.recipeYieldUnit);

  return (
    <div className="products-page">
      <header
        className="page-header"
        style={{ display: "flex", alignItems: "center", gap: "12px" }}
      >
        <button
          onClick={() => navigate("/products")}
          style={{
            background: "none",
            border: "none",
            fontSize: "24px",
            cursor: "pointer",
            color: "#667eea",
          }}
        >
          &larr;
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ marginBottom: "4px" }}>Receita / Ficha Técnica</h1>
          <p style={{ color: "#666", margin: 0, fontWeight: 500 }}>
            {product?.name}{" "}
            {product?.unit ? (
              <span style={{ color: "#94a3b8", fontSize: "13px" }}>
                (Estoque em {product.unit})
              </span>
            ) : null}
          </p>
        </div>
      </header>

      {/* Card de Peso / Rendimento da Receita (Ex: 1 Massa = 1600g) */}
      <div
        style={{
          margin: "0 0 20px",
          padding: "14px 16px",
          background: hasCustomYield ? "#eef2ff" : "#f8fafc",
          border: `1px solid ${hasCustomYield ? "#c7d2fe" : "#e2e8f0"}`,
          borderRadius: "12px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: 1, minWidth: "200px" }}>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              color: hasCustomYield ? "#3730a3" : "#475569",
              marginBottom: "4px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>⚖️ Peso / Rendimento da Receita</span>
          </div>
          {hasCustomYield ? (
            <p style={{ margin: 0, fontSize: "14px", color: "#1e1b4b" }}>
              1 receita ({product?.unit || "un"}) equivale a{" "}
              <strong>
                {Number(product?.recipeYield)} {product?.recipeYieldUnit}
              </strong>
              <span style={{ display: "block", fontSize: "12px", color: "#4f46e5", marginTop: "2px" }}>
                ✓ Permite usar este item em gramas/quilos dentro de outras receitas (ex: 60g por cookie).
              </span>
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: "12.5px", color: "#64748b" }}>
              Se este produto for uma <strong>Massa / Base</strong> (ex: 1 massa pesa 1600g), defina o peso total aqui para conseguir usar em <strong>gramas (ex: 60g)</strong> na receita dos cookies.
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleOpenYieldModal}
          style={{
            padding: "8px 14px",
            borderRadius: "8px",
            border: hasCustomYield ? "1px solid #6366f1" : "1px solid #cbd5e1",
            background: hasCustomYield ? "#ffffff" : "#4f46e5",
            color: hasCustomYield ? "#4f46e5" : "#ffffff",
            fontWeight: 600,
            fontSize: "13px",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {hasCustomYield ? "✏️ Editar Peso" : "⚖️ Definir Peso (ex: 1600g)"}
        </button>
      </div>

      <div className="products-list">
        {recipe.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#999" }}>
            Nenhum ingrediente adicionado. Toque no botão ＋ para adicionar.
          </p>
        ) : (
          <>
            <p style={{ fontSize: "12.5px", color: "#64748b", margin: "0 0 10px" }}>
              💡 Toque em qualquer ingrediente abaixo para <strong>editar a quantidade ou unidade</strong>:
            </p>
            <div className="products-grid">
              {recipe.map((item) => {
                const recipeUnit = item.unit || item.child?.unit || "un";
                const childStockUnit = item.child?.unit || "un";
                const hasConversion =
                  normalizeUnit(recipeUnit) !== normalizeUnit(childStockUnit);
                let convertedDesc = "";
                if (hasConversion && item.child) {
                  try {
                    const converted = convertProductQuantity(
                      Number(item.quantity),
                      recipeUnit,
                      item.child
                    );
                    convertedDesc = `(${Number(converted.toFixed(4))} ${childStockUnit} no estoque)`;
                  } catch {
                    convertedDesc = "";
                  }
                }

                return (
                  <div
                    key={item.id}
                    className="product-card"
                    onClick={() => handleOpenEditModal(item)}
                    style={{ cursor: "pointer" }}
                  >
                    <div
                      className="product-info"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        width: "100%",
                      }}
                    >
                      <div style={{ textAlign: "left", flex: 1 }}>
                        <h3 style={{ fontSize: "1.05em", marginBottom: "4px" }}>
                          {item.child?.name}
                        </h3>
                        <p
                          style={{
                            color: "#667eea",
                            fontWeight: 600,
                            margin: 0,
                            fontSize: "15px",
                          }}
                        >
                          {Number(item.quantity)} {recipeUnit}
                        </p>
                        {hasConversion && convertedDesc && (
                          <p
                            style={{
                              color: "#64748b",
                              fontSize: "12px",
                              margin: "2px 0 0",
                            }}
                          >
                            {convertedDesc}
                          </p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditModal(item);
                          }}
                          style={{
                            background: "#f1f5f9",
                            border: "none",
                            borderRadius: "6px",
                            color: "#475569",
                            fontSize: "15px",
                            cursor: "pointer",
                            padding: "6px 8px",
                          }}
                          title="Editar ingrediente"
                        >
                          ✏️
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#e74c3c",
                            fontSize: "18px",
                            cursor: "pointer",
                            padding: "6px",
                          }}
                          title="Remover ingrediente"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal de Adicionar / Editar Ingrediente */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>{editingItem ? "Editar Ingrediente" : "Adicionar Ingrediente"}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Ingrediente / Insumo / Massa</label>
                <select
                  value={formData.childId}
                  onChange={(e) => handleIngredientChange(e.target.value)}
                  className="form-select"
                  required
                >
                  <option value="" disabled>
                    Selecione...
                  </option>
                  {Object.entries(groupedAvailableProducts).map(
                    ([groupName, groupItems]) => (
                      <optgroup key={groupName} label={groupName}>
                        {groupItems.map((p) => {
                          const yieldLabel =
                            p.recipeYield && Number(p.recipeYield) > 0 && p.recipeYieldUnit
                              ? ` • 1 ${normalizeUnit(p.unit) === "un" ? "un" : "receita"} = ${Number(p.recipeYield)}${p.recipeYieldUnit}`
                              : "";
                          return (
                            <option key={p.id} value={p.id}>
                              {p.name} (Estoque em {p.unit || "un"}
                              {yieldLabel})
                            </option>
                          );
                        })}
                      </optgroup>
                    )
                  )}
                </select>
              </div>

              {selectedChildProduct &&
                normalizeUnit(selectedChildProduct.unit) === "un" &&
                (!selectedChildProduct.recipeYield ||
                  Number(selectedChildProduct.recipeYield) <= 0) && (
                  <div
                    style={{
                      padding: "10px 12px",
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "8px",
                      fontSize: "12.5px",
                      color: "#92400e",
                      marginBottom: "14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span>
                      ⚠️ <strong>{selectedChildProduct.name}</strong> está em{" "}
                      <code>un</code> sem peso definido. É uma massa medida em gramas?
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseModal();
                        navigate(`/products/${selectedChildProduct.id}/recipe`);
                      }}
                      style={{
                        background: "#d97706",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "5px 10px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        whiteSpace: "nowrap",
                      }}
                    >
                      Definir peso lá
                    </button>
                  </div>
                )}

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label>Quantidade</label>
                  <NumberInput
                    step="any"
                    buttonStep={currentStep}
                    min="0.0001"
                    value={formData.quantity}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        quantity: parseFloat(e.target.value) || 0,
                      })
                    }
                    showButtons
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Unidade</label>
                  <select
                    value={formData.unit}
                    onChange={(e) =>
                      setFormData({ ...formData, unit: e.target.value })
                    }
                    className="form-select"
                    required
                  >
                    {compatibleUnits.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {(formData.unit === "g" || formData.unit === "ml") && (
                <div
                  style={{
                    display: "flex",
                    gap: "6px",
                    marginBottom: "16px",
                    flexWrap: "wrap",
                  }}
                >
                  {[30, 50, 60, 80, 100, 150, 200].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, quantity: preset }))
                      }
                      style={{
                        flex: 1,
                        minWidth: "44px",
                        padding: "5px 6px",
                        background:
                          formData.quantity === preset ? "#4f46e5" : "#f1f5f9",
                        color: formData.quantity === preset ? "#fff" : "#334155",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {preset}
                      {formData.unit}
                    </button>
                  ))}
                </div>
              )}

              {conversionPreview && (
                <div
                  style={{
                    padding: "10px 14px",
                    background: "#f0fdf4",
                    borderRadius: "8px",
                    border: "1px solid #bbf7d0",
                    fontSize: "13px",
                    color: "#166534",
                    marginBottom: "20px",
                  }}
                >
                  <div>
                    💡 <strong>Impacto no estoque:</strong>{" "}
                    {conversionPreview.text} por unidade produzida.
                  </div>
                  {conversionPreview.extraInfo && (
                    <div
                      style={{
                        marginTop: "4px",
                        fontSize: "12px",
                        color: "#15803d",
                      }}
                    >
                      🍪 {conversionPreview.extraInfo}
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: "20px" }}>
                {editingItem && (
                  <div style={{ marginBottom: "10px" }}>
                    <button
                      type="button"
                      onClick={() => handleDelete(editingItem.id)}
                      className="btn-danger-outline"
                      style={{ width: "100%" }}
                    >
                      🗑️ Remover da Receita
                    </button>
                  </div>
                )}
                <div
                  style={{
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
                  <button type="submit" className="btn-primary">
                    {editingItem ? "Salvar Alterações" : "Adicionar"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Peso / Rendimento da Receita */}
      {isYieldModalOpen && (
        <div className="modal-overlay" onClick={() => setIsYieldModalOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>⚖️ Peso / Rendimento da Receita</h2>
            <p style={{ fontSize: "13px", color: "#64748b", marginTop: "-4px", marginBottom: "16px" }}>
              Informe quanto pesa ou rende <strong>1 receita / unidade</strong> de{" "}
              <strong>{product?.name}</strong> (ex: uma batelada de massa rende 1600g).
            </p>
            <form onSubmit={handleSaveYield}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.3fr 1fr",
                  gap: "12px",
                }}
              >
                <div className="form-group">
                  <label>Peso / Rendimento Total</label>
                  <NumberInput
                    step="any"
                    buttonStep={100}
                    min="0"
                    value={yieldFormData.recipeYield}
                    onChange={(e) =>
                      setYieldFormData({
                        ...yieldFormData,
                        recipeYield: parseFloat(e.target.value) || 0,
                      })
                    }
                    showButtons
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Unidade</label>
                  <select
                    value={yieldFormData.recipeYieldUnit}
                    onChange={(e) =>
                      setYieldFormData({
                        ...yieldFormData,
                        recipeYieldUnit: e.target.value,
                      })
                    }
                    className="form-select"
                  >
                    {YIELD_UNITS.map((u) => (
                      <option key={u.value} value={u.value}>
                        {u.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {calculatedRecipeWeightGrams > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setYieldFormData({
                      recipeYield: calculatedRecipeWeightGrams,
                      recipeYieldUnit: "g",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    marginBottom: "16px",
                    borderRadius: "8px",
                    border: "1px dashed #6366f1",
                    background: "#eef2ff",
                    color: "#4338ca",
                    fontWeight: 600,
                    fontSize: "13px",
                    cursor: "pointer",
                  }}
                >
                  ⚡ Usar soma dos ingredientes desta receita ({calculatedRecipeWeightGrams} g)
                </button>
              )}

              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  marginBottom: "20px",
                  flexWrap: "wrap",
                }}
              >
                {[1000, 1200, 1500, 1600, 2000, 5000].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() =>
                      setYieldFormData({
                        recipeYield: preset,
                        recipeYieldUnit: "g",
                      })
                    }
                    style={{
                      flex: 1,
                      padding: "6px 8px",
                      background:
                        yieldFormData.recipeYield === preset &&
                        yieldFormData.recipeYieldUnit === "g"
                          ? "#4f46e5"
                          : "#f1f5f9",
                      color:
                        yieldFormData.recipeYield === preset &&
                        yieldFormData.recipeYieldUnit === "g"
                          ? "#fff"
                          : "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "6px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    {preset}g
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "20px" }}>
                {hasCustomYield && (
                  <div style={{ marginBottom: "10px" }}>
                    <button
                      type="button"
                      onClick={handleClearYield}
                      className="btn-danger-outline"
                      style={{ width: "100%" }}
                    >
                      Remover Peso Equivalente
                    </button>
                  </div>
                )}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setIsYieldModalOpen(false)}
                    className="btn-secondary"
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn-primary">
                    Salvar Rendimento
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <FloatingActionButton
        menuItems={[
          {
            icon: "➕",
            label: "Adicionar Ingrediente",
            onClick: () => handleOpenAddModal(),
          },
          {
            icon: "⚖️",
            label: "Peso / Rendimento da Receita",
            onClick: () => handleOpenYieldModal(),
          },
        ]}
      />

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
