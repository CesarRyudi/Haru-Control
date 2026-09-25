import React, { useState, useMemo, useEffect } from "react";
import { Product, Category, Subcategory } from "@haru-control/types";
import { formatCurrency } from "@haru-control/utils";
import "./BroadcastMenuModal.css";

interface BroadcastMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  categories: Category[];
  stockMap: Map<string, number>;
  onCopied: () => void;
}

export function getDefaultGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

const DEFAULT_FOOTER = `*Entregamos na porta* 🚪 \n\nAceitamos encomendas!\n\nhttps://wa.me/c/5511976952264`;

export function generateBroadcastText(
  greeting: string,
  contextMessage: string,
  selectedProductIds: Set<string>,
  products: Product[],
  categories: Category[],
  footer: string = DEFAULT_FOOTER
): string {
  const parts: string[] = [];

  // 1. Saudação
  const cleanGreeting = greeting.trim() || getDefaultGreeting();
  parts.push(`🌟🌟 *${cleanGreeting}* 🌟🌟`);

  // 2. Contexto / Gancho (se preenchido)
  if (contextMessage.trim()) {
    parts.push(`*${contextMessage.trim()}*`);
  }

  // Filtrar apenas produtos selecionados e vendáveis
  const selectedProducts = products.filter(
    (p) => p.isSellable && selectedProductIds.has(p.id)
  );

  if (selectedProducts.length === 0) {
    parts.push("_Nenhum produto selecionado no momento._");
    if (footer.trim()) parts.push(footer.trim());
    return parts.join("\n\n");
  }

  // Mapear categorias e subcategorias
  const categoryOrderMap = new Map<string, number>();
  categories.forEach((c, idx) => categoryOrderMap.set(c.id, idx));

  // Agrupar produtos por Categoria e Subcategoria
  interface GroupedCat {
    category: Category | null;
    subgroups: {
      subcategory: Subcategory | null;
      items: Product[];
    }[];
    directItems: Product[];
  }

  const grouped: Record<string, GroupedCat> = {};

  selectedProducts.forEach((p) => {
    const catId = p.categoryId || "none";
    if (!grouped[catId]) {
      const cat = categories.find((c) => c.id === catId) || null;
      grouped[catId] = {
        category: cat,
        subgroups: [],
        directItems: [],
      };
    }

    const catGroup = grouped[catId];
    if (p.subcategoryId) {
      let subGroup = catGroup.subgroups.find(
        (s) => s.subcategory?.id === p.subcategoryId
      );
      if (!subGroup) {
        const sub =
          catGroup.category?.subcategories?.find(
            (s) => s.id === p.subcategoryId
          ) || null;
        subGroup = { subcategory: sub, items: [] };
        catGroup.subgroups.push(subGroup);
      }
      subGroup.items.push(p);
    } else {
      catGroup.directItems.push(p);
    }
  });

  // Helper para obter o preço de ordenação da categoria (menor preço encontrado)
  const getCategorySortPrice = (catId: string): number => {
    const group = grouped[catId];
    if (!group) return 999999;
    if (group.category?.price != null && Number(group.category.price) > 0) {
      return Number(group.category.price);
    }
    const allItems = [
      ...group.directItems,
      ...group.subgroups.flatMap((s) => s.items),
    ];
    if (allItems.length === 0) return 999999;
    return Math.min(...allItems.map((p) => Number(p.price || 0)));
  };

  // Ordenar categorias pelo menor preço: do mais barato para o mais caro
  const sortedCatIds = Object.keys(grouped).sort((a, b) => {
    if (a === "none" && b !== "none") return 1;
    if (b === "none" && a !== "none") return -1;
    const priceA = getCategorySortPrice(a);
    const priceB = getCategorySortPrice(b);
    if (priceA !== priceB) return priceA - priceB;
    const nameA = grouped[a]?.category?.name || "";
    const nameB = grouped[b]?.category?.name || "";
    return nameA.localeCompare(nameB);
  });

  // Renderizar cada bloco de produtos
  sortedCatIds.forEach((catId) => {
    const catGroup = grouped[catId];

    // Helper para renderizar uma lista de produtos de um grupo (com ou sem preço uniforme)
    const renderProductBlock = (title: string, groupFixedPrice: number | null, items: Product[]) => {
      if (items.length === 0) return;

      // Ordenar produtos por preço e depois nome
      const sortedItems = [...items].sort((a, b) => {
        const prA = Number(a.price || 0);
        const prB = Number(b.price || 0);
        if (prA !== prB) return prA - prB;
        return a.name.localeCompare(b.name);
      });

      // Checar se todos os itens têm o mesmo preço
      const distinctPrices = Array.from(new Set(sortedItems.map((i) => Number(i.price))));
      const isUniformPrice = groupFixedPrice != null || distinctPrices.length === 1;
      const uniformPrice = groupFixedPrice ?? distinctPrices[0];

      if (isUniformPrice) {
        // Ex: *Cookies Tradicionais R$8,00*
        const blockLines: string[] = [];
        blockLines.push(`*${title} ${formatCurrency(uniformPrice)}*\n`);
        sortedItems.forEach((p) => {
          const desc = p.description?.trim();
          blockLines.push(`*${p.name}*${desc ? ` - ${desc}` : ""}`);
        });
        parts.push(blockLines.join("\n"));
      } else {
        // Preços variados: Ex: *Cookies Especiais:* seguido por *R$11,00* ... *R$14,00* ...
        const blockLines: string[] = [];
        blockLines.push(`*${title}:*\n`);

        // Agrupar itens por preço (ascendente)
        const priceMap: Record<number, Product[]> = {};
        sortedItems.forEach((p) => {
          const pr = Number(p.price);
          if (!priceMap[pr]) priceMap[pr] = [];
          priceMap[pr].push(p);
        });

        const sortedPrices = Object.keys(priceMap)
          .map(Number)
          .sort((a, b) => a - b);

        sortedPrices.forEach((pr) => {
          blockLines.push(`*${formatCurrency(pr)}*\n`);
          priceMap[pr].forEach((p) => {
            const desc = p.description?.trim();
            blockLines.push(`*${p.name}*${desc ? ` - ${desc}` : ""}`);
          });
          blockLines.push(""); // linha em branco entre blocos de preço
        });

        // Remover linha vazia extra no final se houver
        if (blockLines[blockLines.length - 1] === "") blockLines.pop();
        parts.push(blockLines.join("\n"));
      }
    };

    // Montar blocos da categoria (subcategorias e itens diretos)
    interface BlockToRender {
      title: string;
      groupFixedPrice: number | null;
      items: Product[];
      sortPrice: number;
    }

    const blocks: BlockToRender[] = [];

    catGroup.subgroups.forEach((subGroup) => {
      const subName = subGroup.subcategory?.name || "Especiais";
      const subFixedPrice = subGroup.subcategory?.price != null ? Number(subGroup.subcategory.price) : null;
      const sortPrice =
        subFixedPrice ??
        (subGroup.items.length > 0
          ? Math.min(...subGroup.items.map((i) => Number(i.price)))
          : 999999);

      blocks.push({
        title: subName,
        groupFixedPrice: subFixedPrice,
        items: subGroup.items,
        sortPrice,
      });
    });

    if (catGroup.directItems.length > 0) {
      const catName = catGroup.category?.name || "Cookies & Delícias";
      const catFixedPrice = catGroup.category?.price != null ? Number(catGroup.category.price) : null;
      const sortPrice =
        catFixedPrice ??
        Math.min(...catGroup.directItems.map((i) => Number(i.price)));

      blocks.push({
        title: catName,
        groupFixedPrice: catFixedPrice,
        items: catGroup.directItems,
        sortPrice,
      });
    }

    // Ordenar os blocos dentro da categoria do mais barato para o mais caro
    blocks.sort((a, b) => {
      if (a.sortPrice !== b.sortPrice) return a.sortPrice - b.sortPrice;
      return a.title.localeCompare(b.title);
    });

    blocks.forEach((b) => renderProductBlock(b.title, b.groupFixedPrice, b.items));
  });

  // 4. Rodapé
  if (footer.trim()) {
    parts.push(footer.trim());
  }

  return parts.join("\n\n");
}

export default function BroadcastMenuModal({
  isOpen,
  onClose,
  products,
  categories,
  stockMap,
  onCopied,
}: BroadcastMenuModalProps) {
  const [greeting, setGreeting] = useState(getDefaultGreeting());
  const [contextMessage, setContextMessage] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Inicializar seleção com produtos vendáveis que possuem estoque > 0
  useEffect(() => {
    if (isOpen) {
      setGreeting(getDefaultGreeting());
      const initialSelected = new Set<string>();
      products.forEach((p) => {
        if (p.isSellable) {
          const currentQty = stockMap.get(p.id) || 0;
          if (currentQty > 0) {
            initialSelected.add(p.id);
          }
        }
      });
      setSelectedProductIds(initialSelected);
    }
  }, [isOpen, products, stockMap]);

  // Bloqueia a rolagem do body no mobile enquanto o modal estiver aberto
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;

    document.body.style.overflow = "hidden";
    document.body.style.touchAction = "none";

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
    };
  }, [isOpen]);

  // Lista de produtos vendáveis ordenada por preço (do mais barato ao mais caro)
  const sellableProducts = useMemo(() => {
    return products
      .filter((p) => p.isSellable)
      .sort((a, b) => {
        const prA = Number(a.price || 0);
        const prB = Number(b.price || 0);
        if (prA !== prB) return prA - prB;
        return a.name.localeCompare(b.name);
      });
  }, [products]);

  // Texto gerado em tempo real
  const generatedMessage = useMemo(() => {
    return generateBroadcastText(
      greeting,
      contextMessage,
      selectedProductIds,
      products,
      categories
    );
  }, [greeting, contextMessage, selectedProductIds, products, categories]);

  if (!isOpen) return null;

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAllWithStock = () => {
    const next = new Set<string>();
    sellableProducts.forEach((p) => {
      const currentQty = stockMap.get(p.id) || 0;
      if (currentQty > 0) {
        next.add(p.id);
      }
    });
    setSelectedProductIds(next);
  };

  const handleClearAll = () => {
    setSelectedProductIds(new Set());
  };

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(generatedMessage);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = generatedMessage;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      setCopyFeedback(true);
      setTimeout(() => {
        setCopyFeedback(false);
        onCopied();
        onClose();
      }, 600);
    } catch (err) {
      console.error("Erro ao copiar mensagem:", err);
      alert("Não foi possível copiar automaticamente para o clipboard.");
    }
  };

  // Agrupamento para exibição no checklist do modal
  return (
    <div
      className="broadcast-modal-overlay"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="broadcast-modal-container"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        <div className="broadcast-modal-header">
          <div className="broadcast-modal-title">
            <span className="broadcast-icon">📢</span>
            <h2>Divulgar Cookies Disponíveis</h2>
          </div>
          <button
            type="button"
            className="broadcast-modal-close"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="broadcast-modal-body">
          {/* Campo de Saudação */}
          <div className="broadcast-field-group">
            <label className="broadcast-field-label">
              Saudação Inicial
            </label>
            <input
              type="text"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              className="broadcast-input"
              placeholder="Ex: Boa tarde"
            />
            <span className="broadcast-field-hint">
              Sugerido automaticamente de acordo com o horário atual.
            </span>
          </div>

          {/* Campo de Contexto / Gancho */}
          <div className="broadcast-field-group">
            <label className="broadcast-field-label">
              Mensagem Complementar / Gancho (Opcional)
            </label>
            <textarea
              value={contextMessage}
              onChange={(e) => setContextMessage(e.target.value)}
              className="broadcast-textarea"
              rows={2}
              placeholder="Ex: Nesse friozinho, nada melhor que um cookie🌧️🥰"
            />
            <span className="broadcast-field-hint">
              Se deixado em branco, será completamente omitido da mensagem sem quebras extras.
            </span>
          </div>

          {/* Seleção de Produtos */}
          <div className="broadcast-field-group">
            <div className="broadcast-selection-header">
              <label className="broadcast-field-label" style={{ margin: 0 }}>
                Cookies & Produtos Vendáveis ({selectedProductIds.size} selecionados)
              </label>
              <div className="broadcast-quick-actions">
                <button
                  type="button"
                  className="broadcast-btn-text"
                  onClick={handleSelectAllWithStock}
                >
                  Estoque &gt; 0
                </button>
                <span style={{ color: "#cbd5e1" }}>|</span>
                <button
                  type="button"
                  className="broadcast-btn-text"
                  onClick={handleClearAll}
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="broadcast-products-list">
              {sellableProducts.length === 0 ? (
                <div className="broadcast-empty">
                  Nenhum produto vendável cadastrado.
                </div>
              ) : (
                sellableProducts.map((p) => {
                  const stockQty = stockMap.get(p.id) || 0;
                  const isChecked = selectedProductIds.has(p.id);
                  const hasStock = stockQty > 0;

                  return (
                    <label
                      key={p.id}
                      className={`broadcast-product-item ${
                        isChecked ? "selected" : ""
                      } ${!hasStock ? "no-stock" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProduct(p.id)}
                        className="broadcast-checkbox"
                      />
                      <div className="broadcast-product-info">
                        <div className="broadcast-product-name-row">
                          <span className="broadcast-product-name">
                            {p.name}
                          </span>
                          <span className="broadcast-product-price">
                            {formatCurrency(p.price)}
                          </span>
                        </div>
                        {p.description && (
                          <span className="broadcast-product-desc">
                            {p.description}
                          </span>
                        )}
                      </div>
                      <div
                        className={`broadcast-stock-badge ${
                          hasStock ? "in-stock" : "out-of-stock"
                        }`}
                      >
                        {hasStock ? `${stockQty} un` : "Esgotado"}
                      </div>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Pré-visualização da Mensagem */}
          <div className="broadcast-field-group">
            <label className="broadcast-field-label">
              Pré-visualização do WhatsApp
            </label>
            <div className="broadcast-preview-box">
              <pre className="broadcast-preview-text">{generatedMessage}</pre>
            </div>
          </div>
        </div>

        <div className="broadcast-modal-footer">
          <button
            type="button"
            className="broadcast-btn-cancel"
            onClick={onClose}
          >
            Fechar
          </button>
          <button
            type="button"
            className={`broadcast-btn-copy ${copyFeedback ? "copied" : ""}`}
            onClick={handleCopy}
          >
            {copyFeedback ? "✅ Copiado!" : "📋 Copiar Mensagem para WhatsApp"}
          </button>
        </div>
      </div>
    </div>
  );
}
