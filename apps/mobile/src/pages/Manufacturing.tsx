import { useEffect, useState, useMemo } from "react";
import api from "../services/api";
import { NumberInput } from "@haru-control/ui";
import "./Products.css"; // Reuse styling for now

import { Product } from "@haru-control/types";

export default function Manufacturing() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await api.get("/products");
      setProducts(res.data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
    }
  };

  const groupedProducts = useMemo<Record<string, Product[]>>(() => {
    const groups: Record<string, Product[]> = {};
    products.forEach(p => {
      let groupName = p.category?.name || "Sem Categoria";
      if (p.subcategory?.name) {
        groupName += ` > ${p.subcategory.name}`;
      }
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(p);
    });
    return groups;
  }, [products]);

  const selectedProduct = products.find(p => p.id === selectedProductId);

  const handleProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || quantity <= 0) {
      alert("Selecione um produto e uma quantidade válida.");
      return;
    }

    const unitText = selectedProduct?.unit || "unidade(s)";
    if (!confirm(`Confirmar produção de ${quantity} ${unitText}?`)) return;

    setLoading(true);
    try {
      const response = await api.post("/manufacturing/produce", {
        productId: selectedProductId,
        quantity,
      });
      
      const warnings = response.data.warnings;
      if (warnings && warnings.length > 0) {
        alert("Produção registrada, porém houve avisos:\n\n" + warnings.join("\n"));
      } else {
        alert("Produção registrada com sucesso!");
      }
      
      setQuantity(1);
      setSelectedProductId("");
    } catch (error: any) {
      console.error("Erro na produção:", error);
      alert(error.response?.data?.message || "Erro ao registrar produção.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="products-page">
      <header className="page-header">
        <h1>Produção</h1>
        <p style={{ color: '#666', marginTop: '4px' }}>Registre a transformação de insumos em produtos finais.</p>
      </header>

      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto', background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleProduce}>
          <div className="form-group">
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Produto a fabricar</label>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="form-select"
              required
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '16px' }}
            >
              <option value="" disabled>Selecione um produto final...</option>
              {Object.entries(groupedProducts).map(([groupName, groupItems]) => (
                <optgroup key={groupName} label={groupName}>
                  {groupItems.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.unit || 'un'})</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginTop: '20px' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>
              Quantidade a produzir {selectedProduct ? `(${selectedProduct.unit || 'un'})` : ''}
            </label>
            <NumberInput
              step="any"
              min="0.0001"
              value={quantity}
              onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
              showButtons
              required
            />
          </div>

          <button 
            type="submit" 
            className="btn-primary" 
            disabled={loading}
            style={{ width: '100%', marginTop: '32px', padding: '16px', fontSize: '18px' }}
          >
            {loading ? "Processando..." : "Confirmar Produção"}
          </button>
        </form>
      </div>
    </div>
  );
}
