import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  BakingSuggestionResponse,
  BakingSuggestionItem,
} from "@haru-control/types";
import "./BakingSuggestionModal.css";

export interface BakingSuggestionModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  onStockUpdated: () => void;
  onToast?: (message: string, type: "success" | "error") => void;
}

const formatDateToInput = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getDynamicOptions = (startType: "today" | "tomorrow") => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const baseStart = new Date(today);
  if (startType === "tomorrow") {
    baseStart.setDate(baseStart.getDate() + 1);
  }

  const options: { value: string; label: string; dateStr: string }[] = [];

  const baseStartStr = formatDateToInput(baseStart);
  const baseStartWeekday = baseStart.toLocaleDateString("pt-BR", { weekday: "long" });
  const baseStartShort = baseStart.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

  if (startType === "today") {
    options.push({
      value: baseStartStr,
      label: `Hoje (${baseStartWeekday}, ${baseStartShort}) - Somente hoje`,
      dateStr: baseStartStr,
    });
  } else {
    options.push({
      value: baseStartStr,
      label: `Amanhã (${baseStartWeekday}, ${baseStartShort}) - 1 dia`,
      dateStr: baseStartStr,
    });
  }

  // Dias subsequentes até sábado daquela semana (0=domingo, 6=sábado)
  const currentDayOfWeek = today.getDay();
  const daysUntilSaturday = (6 - currentDayOfWeek + 7) % 7;
  const saturdayDate = new Date(today);
  saturdayDate.setDate(today.getDate() + (daysUntilSaturday === 0 && currentDayOfWeek === 0 ? 6 : daysUntilSaturday));

  let iterDate = new Date(baseStart);
  iterDate.setDate(iterDate.getDate() + 1);

  while (iterDate <= saturdayDate) {
    if (iterDate.getDay() !== 0) { // Não vendemos no domingo
      const dStr = formatDateToInput(iterDate);
      const weekdayName = iterDate.toLocaleDateString("pt-BR", { weekday: "long" });
      const dayShort = iterDate.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });

      const diffDaysFromToday = Math.round(
        (iterDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );

      let labelText = "";
      if (diffDaysFromToday === 1) {
        labelText = `Até amanhã (${weekdayName})`;
      } else if (diffDaysFromToday === 2) {
        labelText = `Até depois de amanhã (${weekdayName})`;
      } else {
        labelText = `Até ${weekdayName} (${dayShort})`;
      }

      options.push({
        value: dStr,
        label: labelText,
        dateStr: dStr,
      });
    }

    iterDate.setDate(iterDate.getDate() + 1);
  }

  options.push({
    value: "custom",
    label: "Outra data... (definir data final)",
    dateStr: "",
  });

  return options;
};

export default function BakingSuggestionModal({
  isOpen = true,
  onClose = () => {},
  onStockUpdated,
  onToast,
}: BakingSuggestionModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BakingSuggestionResponse | null>(null);

  // Controle de Início: Hoje vs Amanhã
  const [startType, setStartType] = useState<"today" | "tomorrow">("today");

  // Seletor dinâmico de término (Padrão dropdown nativo dos Insights)
  const [selectedOptionValue, setSelectedOptionValue] = useState<string>(() => {
    const initialOpts = getDynamicOptions("today");
    return (initialOpts.length > 2 ? initialOpts[1] : initialOpts[0])?.value || "";
  });
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Expansão de detalhes dia a dia
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Modal de Fornada (Nested Sheet)
  const [isBakeModalOpen, setIsBakeModalOpen] = useState(false);
  const [bakingLoading, setBakingLoading] = useState(false);
  const [bakeQuantities, setBakeQuantities] = useState<Record<string, number>>({});
  const [selectedForBake, setSelectedForBake] = useState<Record<string, boolean>>({});

  // Gerar opções dinâmicas de término até sábado da semana corrente (sem domingo)
  const dynamicOptions = useMemo(() => {
    return getDynamicOptions(startType);
  }, [startType]);

  // Garantir que selectedOptionValue tenha um valor coerente ao alternar startType
  useEffect(() => {
    if (
      !selectedOptionValue ||
      (selectedOptionValue !== "custom" &&
        !dynamicOptions.some((o) => o.value === selectedOptionValue))
    ) {
      const defaultOpt = dynamicOptions.length > 2 ? dynamicOptions[1] : dynamicOptions[0];
      if (defaultOpt) {
        setSelectedOptionValue(defaultOpt.value);
      }
    }
  }, [dynamicOptions, selectedOptionValue]);

  // Calcular datas de início e término
  const startDateStr = useMemo(() => {
    const today = new Date();
    if (startType === "tomorrow") {
      today.setDate(today.getDate() + 1);
    }
    return formatDateToInput(today);
  }, [startType]);

  const targetDateStr = useMemo(() => {
    if (selectedOptionValue === "custom") {
      return customEndDate || startDateStr;
    }
    return selectedOptionValue || startDateStr;
  }, [selectedOptionValue, customEndDate, startDateStr]);

  const periodDescription = useMemo(() => {
    if (!startDateStr || !targetDateStr) return "";

    const [sYear, sMonth, sDay] = startDateStr.split("-").map(Number);
    const [tYear, tMonth, tDay] = targetDateStr.split("-").map(Number);

    const startD = new Date(sYear, sMonth - 1, sDay);
    const targetD = new Date(tYear, tMonth - 1, tDay);

    const startFormatted = startD.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
    const targetFormatted = targetD.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

    return startDateStr === targetDateStr
      ? startFormatted
      : `${startFormatted} a ${targetFormatted}`;
  }, [startDateStr, targetDateStr]);

  // Carregar dados da sugestão de fornada quando modal abrir ou datas mudarem
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock/baking-suggestion", {
        params: {
          startDate: startDateStr,
          targetDate: targetDateStr,
        },
      });
      setData(res.data);
    } catch (err: any) {
      console.error("Erro ao carregar sugestão de fornada:", err);
      onToast?.("Erro ao carregar previsão de fornada.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSuggestions();
    }
  }, [isOpen, startDateStr, targetDateStr]);

  // Fechar com tecla Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isBakeModalOpen) {
          setIsBakeModalOpen(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isBakeModalOpen, onClose]);

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

  // Total geral de unidades a assar sugeridas
  const totalToBakeCount = useMemo(() => {
    if (!data?.items) return 0;
    return data.items.reduce((sum, item) => sum + (item.suggestedBake || 0), 0);
  }, [data]);

  // Filtro de exibição
  const itemsToDisplay = useMemo(() => {
    if (!data?.items) return [];
    if (showAllProducts) return data.items;
    return data.items.filter((item) => item.suggestedBake > 0);
  }, [data, showAllProducts]);

  // Alternar expansão dia a dia
  const toggleExpand = (productId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  // Copiar resumo formatado para WhatsApp / Clipboard
  const handleCopySummary = async () => {
    if (!data?.items) return;
    const toBake = data.items.filter((i) => i.suggestedBake > 0);

    const lines: string[] = [
      `*🍪 SUGESTÃO DE FORNADA - HARU COOKIES*`,
      `📅 *Período:* ${periodDescription} (${data.daysCount} ${data.daysCount === 1 ? "dia" : "dias"})`,
      `🔥 *Total a Assar:* ${totalToBakeCount} unidades`,
      ``,
    ];

    if (toBake.length === 0) {
      lines.push(`✅ Estoque 100% abastecido para o período! Nenhuma fornada necessária.`);
    } else {
      lines.push(`*Cookies para produção:*`);
      toBake.forEach((item) => {
        lines.push(`• *${item.productName}:* ${item.suggestedBake} ${item.unit} (Demanda: ${item.totalDemand} | Estoque: ${item.currentStock})`);
      });
    }

    const missingBoms = data.items.filter(
      (i) => i.suggestedBake > 0 && !i.hasSufficientIngredients && i.missingIngredients.length > 0
    );

    if (missingBoms.length > 0) {
      lines.push(``);
      lines.push(`⚠️ *Insumos em falta detectados:*`);
      missingBoms.forEach((mItem) => {
        mItem.missingIngredients.forEach((m) => {
          lines.push(`  - ${m.productName}: falta ${m.missing} ${m.unit}`);
        });
      });
    }

    const textToCopy = lines.join("\n");

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
      }
      onToast?.("Resumo da fornada copiado para a área de transferência!", "success");
    } catch (err) {
      console.warn("Clipboard writeText falhou, tentando fallback...", err);
      const textArea = document.createElement("textarea");
      textArea.value = textToCopy;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      onToast?.("Resumo da fornada copiado para a área de transferência!", "success");
    }
  };

  // Abrir Modal de Confirmação de Fornada
  const handleOpenBakeModal = () => {
    if (!data?.items) return;
    const initialQtys: Record<string, number> = {};
    const initialSelected: Record<string, boolean> = {};

    data.items.forEach((item) => {
      if (item.suggestedBake > 0) {
        initialQtys[item.productId] = item.suggestedBake;
        initialSelected[item.productId] = true;
      }
    });

    setBakeQuantities(initialQtys);
    setSelectedForBake(initialSelected);
    setIsBakeModalOpen(true);
  };

  // Confirmar Fornada em Lote
  const handleConfirmBake = async () => {
    try {
      setBakingLoading(true);
      const itemsToSubmit = Object.entries(bakeQuantities)
        .filter(([pId, qty]) => selectedForBake[pId] && Number(qty) > 0)
        .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }));

      if (itemsToSubmit.length === 0) {
        onToast?.("Nenhum cookie selecionado para fornar.", "error");
        return;
      }

      await api.post("/stock/in/batch", {
        items: itemsToSubmit,
        notes: `Fornada sugerida (${data?.startDate} a ${data?.targetDate})`,
      });

      onToast?.("Fornada registrada e estoque atualizado com sucesso!", "success");
      setIsBakeModalOpen(false);
      onStockUpdated();
      loadSuggestions();
    } catch (err: any) {
      console.error("Erro ao registrar fornada:", err);
      onToast?.("Erro ao registrar fornada no estoque.", "error");
    } finally {
      setBakingLoading(false);
    }
  };

  if (!isOpen && !isBakeModalOpen) return null;

  return (
    <div
      className="baking-modal-overlay"
      onClick={onClose}
      onTouchMove={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
        }
      }}
    >
      <div
        className="baking-modal-container"
        onClick={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho do Modal */}
        <div className="baking-modal-header">
          <div className="baking-modal-title baking-suggestion-title">
            <h2>
              <span>🍪</span> Sugestão de Fornada &amp; Planejamento
            </h2>
            {totalToBakeCount > 0 && (
              <span className="baking-badge-count">
                {totalToBakeCount} a fornar
              </span>
            )}
          </div>
          <button
            type="button"
            className="baking-modal-close"
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        {/* Corpo do Modal (Rolável) */}
        <div className="baking-modal-body baking-suggestion-panel">
          <div className="baking-suggestion-content">
            {/* Controles de Início e Término do Horizonte */}
            <div className="baking-horizon-controls">
              <div className="horizon-row">
                <span className="horizon-label">1. Assar para consumo a partir de:</span>
                <div className="horizon-chips">
                  <button
                    type="button"
                    className={`horizon-chip ${startType === "today" ? "active" : ""}`}
                    onClick={() => setStartType("today")}
                  >
                    📅 De Hoje
                  </button>
                  <button
                    type="button"
                    className={`horizon-chip ${startType === "tomorrow" ? "active" : ""}`}
                    onClick={() => setStartType("tomorrow")}
                  >
                    🌙 A partir de Amanhã
                  </button>
                </div>
              </div>

              <div className="baking-period-select-wrapper">
                <label htmlFor="baking-period-select" className="baking-period-label">
                  2. Cobrir o estoque até:
                </label>
                <select
                  id="baking-period-select"
                  className="baking-period-select"
                  value={selectedOptionValue}
                  onChange={(e) => setSelectedOptionValue(e.target.value)}
                >
                  {dynamicOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOptionValue === "custom" && (
                <div className="baking-custom-dates">
                  <div className="baking-date-input-group">
                    <label>Data Final</label>
                    <input
                      type="date"
                      className="baking-date-input"
                      value={customEndDate || targetDateStr}
                      min={startDateStr}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="horizon-summary-text">
                <span>
                  🗓️ <strong>Período:</strong> {periodDescription} (
                  {data?.daysCount || 1} {data?.daysCount === 1 ? "dia" : "dias"})
                </span>
                <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                  +10% margem de segurança
                </span>
              </div>
            </div>

            {/* Ações de Topo */}
            <div className="baking-actions-top">
              <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", cursor: "pointer", color: "#475569" }}>
                <input
                  type="checkbox"
                  checked={showAllProducts}
                  onChange={(e) => setShowAllProducts(e.target.checked)}
                />
                Mostrar todos os cookies (incluindo estoque ok)
              </label>

              <div className="baking-actions-buttons">
                <button
                  type="button"
                  className="btn-baking-copy"
                  onClick={handleCopySummary}
                  title="Copiar lista para colar no WhatsApp"
                >
                  📋 Copiar Resumo
                </button>

                {totalToBakeCount > 0 && (
                  <button
                    type="button"
                    className="btn-baking-bake-all"
                    onClick={handleOpenBakeModal}
                  >
                    🔥 Fornar Sugestão ({totalToBakeCount} un)
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Produtos */}
            {loading ? (
              <p style={{ textAlign: "center", color: "#94a3b8", padding: "20px" }}>
                Calculando histórico de vendas e estoque...
              </p>
            ) : itemsToDisplay.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", background: "#f0fdf4", borderRadius: "10px", color: "#166534" }}>
                <p style={{ margin: "0 0 6px 0", fontWeight: 700, fontSize: "1rem" }}>
                  🎉 Estoque 100% abastecido para o período!
                </p>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#15803d" }}>
                  Todos os cookies possuem saldo suficiente para cobrir a demanda prevista.
                </p>
              </div>
            ) : (
              <div className="baking-product-list">
                {itemsToDisplay.map((item) => {
                  const isExpanded = expandedIds.has(item.productId);
                  const hasBake = item.suggestedBake > 0;

                  return (
                    <div
                      key={item.productId}
                      className={`baking-product-card ${hasBake ? "has-bake" : "no-bake"}`}
                    >
                      <div className="baking-product-main">
                        <div>
                          <h4 className="baking-product-name">{item.productName}</h4>
                          {(item.subcategoryName || item.categoryName) && (
                            <div className="baking-product-sub">
                              {item.categoryName} {item.subcategoryName ? `> ${item.subcategoryName}` : ""}
                            </div>
                          )}

                          {/* Equação Transparente */}
                          <div className="baking-equation-box">
                            <span>Demanda: <strong className="equation-term demand">{item.totalDemand} {item.unit}</strong></span>
                            <span>−</span>
                            <span>Estoque: <strong className="equation-term stock">{item.currentStock} {item.unit}</strong></span>
                            <span>=</span>
                            <span>
                              {hasBake ? (
                                <strong className="equation-term result">Assar {item.suggestedBake} {item.unit}</strong>
                              ) : (
                                <strong className="equation-term result zero">Suficiente (0)</strong>
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="baking-card-actions">
                          <span
                            className={`badge-suggested-bake ${hasBake ? "orange" : "green"}`}
                          >
                            {hasBake ? `🔥 Assar ${item.suggestedBake}` : "✅ OK"}
                          </span>
                          <button
                            type="button"
                            className="btn-expand-breakdown"
                            onClick={() => toggleExpand(item.productId)}
                          >
                            {isExpanded ? "Ocultar dias ▲" : "Ver dias ▼"}
                          </button>
                        </div>
                      </div>

                      {/* Alerta Informativo de Ficha Técnica (BOM) */}
                      {!item.hasSufficientIngredients && item.missingIngredients.length > 0 && (
                        <div className="baking-bom-warning">
                          <div className="baking-bom-warning-title">
                            <span>⚠️</span> Insumos em falta para a fornada completa:
                          </div>
                          <ul className="baking-bom-missing-list">
                            {item.missingIngredients.map((m) => (
                              <li key={m.productId}>
                                <strong>{m.productName}:</strong> falta {m.missing} {m.unit} (disponível: {m.available}, necessário: {m.required})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Breakdown Dia a Dia (Accordion) */}
                      {isExpanded && (
                        <div className="baking-breakdown-details">
                          <div className="breakdown-grid">
                            {item.dailyForecast.map((d) => (
                              <div key={d.date} className="breakdown-day-item">
                                <span className="day-name">{d.shortName}:</span>
                                <span>{d.predictedSales} un</span>
                              </div>
                            ))}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                            Soma diária: {item.dailyForecast.reduce((acc, curr) => acc + curr.predictedSales, 0).toFixed(1)} un (+10% = {item.totalDemand} un)
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Rodapé do Modal */}
        <div className="baking-modal-footer">
          <button
            type="button"
            className="btn-baking-modal-close"
            onClick={onClose}
          >
            Fechar
          </button>
          {totalToBakeCount > 0 && (
            <button
              type="button"
              className="btn-baking-modal-bake"
              onClick={handleOpenBakeModal}
            >
              🔥 Fornar Sugestão ({totalToBakeCount} un)
            </button>
          )}
        </div>
      </div>

      {/* Modal de Confirmação da Fornada (Nested Sheet) */}
      {isBakeModalOpen && (
        <div
          className="bake-modal-backdrop"
          onClick={(e) => {
            e.stopPropagation();
            setIsBakeModalOpen(false);
          }}
          onTouchMove={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
            }
          }}
        >
          <div
            className="bake-modal-sheet"
            onClick={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <div className="bake-modal-header">
              <h3>🔥 Registrar Fornada no Estoque</h3>
              <button
                type="button"
                className="bake-modal-close-btn"
                onClick={() => setIsBakeModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="bake-modal-body">
              <p style={{ margin: 0, fontSize: "0.85rem", color: "#64748b" }}>
                Confira as quantidades que foram assadas para dar entrada automática no estoque contábil:
              </p>

              {data?.items
                .filter((item) => item.suggestedBake > 0)
                .map((item) => (
                  <div key={item.productId} className="bake-modal-item">
                    <div className="bake-modal-item-info">
                      <input
                        type="checkbox"
                        checked={selectedForBake[item.productId] ?? true}
                        onChange={(e) =>
                          setSelectedForBake((prev) => ({
                            ...prev,
                            [item.productId]: e.target.checked,
                          }))
                        }
                      />
                      <span className="bake-modal-item-name">{item.productName}</span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <input
                        type="number"
                        min="1"
                        className="bake-modal-item-qty-input"
                        value={bakeQuantities[item.productId] ?? item.suggestedBake}
                        onChange={(e) =>
                          setBakeQuantities((prev) => ({
                            ...prev,
                            [item.productId]: Number(e.target.value),
                          }))
                        }
                      />
                      <span style={{ fontSize: "0.8rem", color: "#64748b" }}>{item.unit}</span>
                    </div>
                  </div>
                ))}
            </div>

            <div className="bake-modal-footer">
              <button
                type="button"
                className="btn-bake-cancel"
                onClick={() => setIsBakeModalOpen(false)}
                disabled={bakingLoading}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-bake-confirm"
                onClick={handleConfirmBake}
                disabled={bakingLoading}
              >
                {bakingLoading ? "Registrando..." : "Confirmar e Entrar no Estoque"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
