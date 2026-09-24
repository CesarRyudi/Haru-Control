import React, { useState, useEffect, useMemo } from "react";
import api from "../services/api";
import {
  BakingSuggestionResponse,
  BakingSuggestionItem,
} from "@haru-control/types";
import "./BakingSuggestionCard.css";

interface BakingSuggestionCardProps {
  onStockUpdated: () => void;
  onToast?: (message: string, type: "success" | "error") => void;
}

const formatDateToInput = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function BakingSuggestionCard({
  onStockUpdated,
  onToast,
}: BakingSuggestionCardProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BakingSuggestionResponse | null>(null);

  // Controle de Início: Hoje vs Amanhã
  const [startType, setStartType] = useState<"today" | "tomorrow">("today");

  // Preset de Término
  const [targetPreset, setTargetPreset] = useState<
    "same_day" | "tomorrow" | "wednesday" | "weekend" | "custom"
  >("same_day");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Expansão de detalhes dia a dia
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Modal de Fornada
  const [isBakeModalOpen, setIsBakeModalOpen] = useState(false);
  const [bakingLoading, setBakingLoading] = useState(false);
  const [bakeQuantities, setBakeQuantities] = useState<Record<string, number>>({});
  const [selectedForBake, setSelectedForBake] = useState<Record<string, boolean>>({});

  // Calcular datas de início e término baseadas na seleção
  const { startDateStr, targetDateStr, periodDescription } = useMemo(() => {
    const today = new Date();
    const baseStart = new Date(today);
    if (startType === "tomorrow") {
      baseStart.setDate(baseStart.getDate() + 1);
    }
    const sStr = formatDateToInput(baseStart);

    let baseTarget = new Date(baseStart);

    if (targetPreset === "same_day") {
      baseTarget = new Date(baseStart);
    } else if (targetPreset === "tomorrow") {
      const nextDay = new Date(today);
      nextDay.setDate(today.getDate() + 1);
      baseTarget = nextDay;
      if (baseTarget < baseStart) baseTarget = new Date(baseStart);
    } else if (targetPreset === "wednesday") {
      // Encontra a próxima quarta-feira (dia 3)
      const currentDay = baseStart.getDay();
      let diff = (3 - currentDay + 7) % 7;
      if (diff === 0 && startType === "today" && currentDay === 3) {
        diff = 0; // se hoje é quarta, mantém
      }
      baseTarget.setDate(baseStart.getDate() + diff);
    } else if (targetPreset === "weekend") {
      // Encontra o próximo domingo (dia 0)
      const currentDay = baseStart.getDay();
      let diff = (0 - currentDay + 7) % 7;
      if (diff === 0 && currentDay !== 0) diff = 7;
      baseTarget.setDate(baseStart.getDate() + diff);
    } else if (targetPreset === "custom") {
      if (customEndDate) {
        return {
          startDateStr: sStr,
          targetDateStr: customEndDate,
          periodDescription: `${sStr.split("-").reverse().join("/")} a ${customEndDate.split("-").reverse().join("/")}`,
        };
      }
    }

    const tStr = formatDateToInput(baseTarget);

    const startFormatted = baseStart.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });
    const targetFormatted = baseTarget.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "2-digit",
    });

    const isSameDay = sStr === tStr;
    const desc = isSameDay
      ? `${startFormatted}`
      : `${startFormatted} até ${targetFormatted}`;

    return {
      startDateStr: sStr,
      targetDateStr: tStr,
      periodDescription: desc,
    };
  }, [startType, targetPreset, customEndDate]);

  // Carregar sugestões
  const loadSuggestions = async () => {
    try {
      setLoading(true);
      const res = await api.get("/stock/baking-suggestion", {
        params: {
          startDate: startDateStr,
          targetDate: targetDateStr,
          safetyMargin: 0.1,
        },
      });
      setData(res.data);
    } catch (err) {
      console.error("Erro ao carregar sugestões de fornada:", err);
      onToast?.("Erro ao calcular previsão de fornada.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSuggestions();
  }, [startDateStr, targetDateStr]);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const itemsToDisplay = useMemo(() => {
    if (!data?.items) return [];
    if (showAllProducts) return data.items;
    return data.items.filter((i) => i.suggestedBake > 0);
  }, [data, showAllProducts]);

  const totalToBakeCount = useMemo(() => {
    if (!data?.items) return 0;
    return data.items.reduce((acc, curr) => acc + (curr.suggestedBake || 0), 0);
  }, [data]);

  // Copiar Resumo para Área de Transferência
  const handleCopySummary = async () => {
    if (!data || !data.items) return;

    const itemsToBake = data.items.filter((i) => i.suggestedBake > 0);
    const dateFormatted = `${data.startDate.split("-").reverse().join("/")} a ${data.targetDate.split("-").reverse().join("/")}`;

    let text = `🍪 *Sugestão de Fornada - Haru Cookies*\n`;
    text += `📅 *Período:* ${dateFormatted} (${data.daysCount} ${data.daysCount === 1 ? "dia" : "dias"})\n\n`;

    if (itemsToBake.length === 0) {
      text += `✅ *Estoque suficiente para todo o período!* Não há necessidade de assamento imediato.\n`;
    } else {
      text += `🔥 *Cookies a Assar:*\n`;
      let totalToBake = 0;
      itemsToBake.forEach((item) => {
        text += `• *${item.productName}:* *${item.suggestedBake} ${item.unit}* (Demanda: ${item.totalDemand} | Estoque: ${item.currentStock})\n`;
        totalToBake += item.suggestedBake;
      });
      text += `\n📦 *Total a fornar:* ${totalToBake} unidades\n`;
    }

    try {
      await navigator.clipboard.writeText(text);
      onToast?.("Resumo da fornada copiado para a área de transferência!", "success");
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = text;
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

  return (
    <div className="baking-suggestion-panel">
      {/* Cabeçalho Retrátil */}
      <div
        className="baking-suggestion-header"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <div className="baking-suggestion-title">
          <h2>
            <span>🍪</span> Sugestão de Fornada & Planejamento
          </h2>
          {totalToBakeCount > 0 && (
            <span className="baking-badge-count">
              {totalToBakeCount} a fornar
            </span>
          )}
        </div>
        <span
          className="baking-suggestion-toggle-icon"
          style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          ▼
        </span>
      </div>

      {isOpen && (
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

            <div className="horizon-row">
              <span className="horizon-label">2. Cobrir o estoque até:</span>
              <div className="horizon-chips">
                <button
                  type="button"
                  className={`horizon-chip ${targetPreset === "same_day" ? "active" : ""}`}
                  onClick={() => setTargetPreset("same_day")}
                >
                  {startType === "today" ? "Hoje" : "Amanhã"} (1 dia)
                </button>
                {startType === "today" && (
                  <button
                    type="button"
                    className={`horizon-chip ${targetPreset === "tomorrow" ? "active" : ""}`}
                    onClick={() => setTargetPreset("tomorrow")}
                  >
                    Até Amanhã (2 dias)
                  </button>
                )}
                <button
                  type="button"
                  className={`horizon-chip ${targetPreset === "wednesday" ? "active" : ""}`}
                  onClick={() => setTargetPreset("wednesday")}
                >
                  Até Quarta-feira
                </button>
                <button
                  type="button"
                  className={`horizon-chip ${targetPreset === "weekend" ? "active" : ""}`}
                  onClick={() => setTargetPreset("weekend")}
                >
                  Fim de Semana (até Domingo)
                </button>
                <button
                  type="button"
                  className={`horizon-chip ${targetPreset === "custom" ? "active" : ""}`}
                  onClick={() => setTargetPreset("custom")}
                >
                  Outra Data...
                </button>
              </div>

              {targetPreset === "custom" && (
                <div className="horizon-custom-dates">
                  <input
                    type="date"
                    value={customEndDate || targetDateStr}
                    min={startDateStr}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                  />
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
      )}

      {/* Modal de Confirmação da Fornada */}
      {isBakeModalOpen && (
        <div className="bake-modal-backdrop" onClick={() => setIsBakeModalOpen(false)}>
          <div className="bake-modal-sheet" onClick={(e) => e.stopPropagation()}>
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
