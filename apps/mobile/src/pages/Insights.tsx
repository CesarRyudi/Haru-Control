import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import api from "../services/api";
import "./Insights.css";

type PeriodPreset =
  | "this_month"
  | "today"
  | "7days"
  | "30days"
  | "last_month"
  | "custom";

const CATEGORY_COLORS = [
  "#4f46e5",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#06b6d4",
  "#ef4444",
  "#84cc16",
];

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val || 0);
};

const formatNumber = (val: number) => {
  return new Intl.NumberFormat("pt-BR").format(val || 0);
};

const formatDateToInput = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function Insights() {
  const navigate = useNavigate();

  // Filtro de Período (Padrão: Mês Atual)
  const [preset, setPreset] = useState<PeriodPreset>("this_month");
  const [customStart, setCustomStart] = useState<string>("");
  const [customEnd, setCustomEnd] = useState<string>("");

  // Dados das Métricas
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Alternâncias de Visualização
  const [productRankingMode, setProductRankingMode] = useState<"quantity" | "revenue">("quantity");
  const [timeMovementMode, setTimeMovementMode] = useState<"hours" | "weekdays">("hours");

  // Calcular datas baseadas no preset
  const { startDate, endDate, subtitleText } = useMemo(() => {
    const today = new Date();

    if (preset === "this_month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const sStr = formatDateToInput(start);
      const eStr = formatDateToInput(end);
      const monthName = start.toLocaleDateString("pt-BR", { month: "long" });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return {
        startDate: sStr,
        endDate: eStr,
        subtitleText: `Mês Atual (${capitalizedMonth} de ${today.getFullYear()})`,
      };
    }

    if (preset === "today") {
      const sStr = formatDateToInput(today);
      return {
        startDate: sStr,
        endDate: sStr,
        subtitleText: `Hoje (${today.toLocaleDateString("pt-BR")})`,
      };
    }

    if (preset === "7days") {
      const start = new Date(today);
      start.setDate(today.getDate() - 6);
      const sStr = formatDateToInput(start);
      const eStr = formatDateToInput(today);
      return {
        startDate: sStr,
        endDate: eStr,
        subtitleText: `Últimos 7 dias (${start.toLocaleDateString("pt-BR")} a ${today.toLocaleDateString("pt-BR")})`,
      };
    }

    if (preset === "30days") {
      const start = new Date(today);
      start.setDate(today.getDate() - 29);
      const sStr = formatDateToInput(start);
      const eStr = formatDateToInput(today);
      return {
        startDate: sStr,
        endDate: eStr,
        subtitleText: `Últimos 30 dias (${start.toLocaleDateString("pt-BR")} a ${today.toLocaleDateString("pt-BR")})`,
      };
    }

    if (preset === "last_month") {
      const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const end = new Date(today.getFullYear(), today.getMonth(), 0);
      const sStr = formatDateToInput(start);
      const eStr = formatDateToInput(end);
      const monthName = start.toLocaleDateString("pt-BR", { month: "long" });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return {
        startDate: sStr,
        endDate: eStr,
        subtitleText: `Mês Anterior (${capitalizedMonth} de ${start.getFullYear()})`,
      };
    }

    // Custom
    const sStr = customStart || formatDateToInput(new Date(today.getFullYear(), today.getMonth(), 1));
    const eStr = customEnd || formatDateToInput(today);
    return {
      startDate: sStr,
      endDate: eStr,
      subtitleText: `Período personalizado (${sStr.split("-").reverse().join("/")} até ${eStr.split("-").reverse().join("/")})`,
    };
  }, [preset, customStart, customEnd]);

  // Carregar Métricas da API
  const loadMetrics = async (sDate: string, eDate: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get("/orders/metrics", {
        params: {
          startDate: sDate,
          endDate: eDate,
        },
      });
      setMetrics(response.data);
    } catch (err: any) {
      console.error("Erro ao carregar insights:", err);
      setError("Não foi possível carregar as métricas do período.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (preset !== "custom" || (customStart && customEnd)) {
      loadMetrics(startDate, endDate);
    }
  }, [startDate, endDate, preset]);

  const handleApplyCustom = () => {
    if (customStart && customEnd) {
      loadMetrics(customStart, customEnd);
    }
  };

  const topProducts =
    productRankingMode === "quantity"
      ? metrics?.topProductsByQuantity || []
      : metrics?.topProductsByRevenue || [];

  const maxProductVal = useMemo(() => {
    if (!topProducts.length) return 1;
    return productRankingMode === "quantity"
      ? Math.max(...topProducts.map((p: any) => p.quantity), 1)
      : Math.max(...topProducts.map((p: any) => p.revenue), 1);
  }, [topProducts, productRankingMode]);

  return (
    <div className="insights-page">
      {/* Header */}
      <header className="insights-header">
        <div className="insights-header-top">
          <button className="insights-back-btn" onClick={() => navigate("/")}>
            ← Voltar
          </button>
          <button
            className="insights-refresh-btn"
            onClick={() => loadMetrics(startDate, endDate)}
          >
            🔄 Atualizar
          </button>
        </div>
        <h1 className="insights-title">📊 Insights & Métricas</h1>
        <p className="insights-subtitle">{subtitleText}</p>
      </header>

      {/* Seletor de Período */}
      <div className="insights-filters-container">
        <div className="insights-filter-chips">
          <button
            className={`insights-chip ${preset === "this_month" ? "active" : ""}`}
            onClick={() => setPreset("this_month")}
          >
            Mês Atual
          </button>
          <button
            className={`insights-chip ${preset === "today" ? "active" : ""}`}
            onClick={() => setPreset("today")}
          >
            Hoje
          </button>
          <button
            className={`insights-chip ${preset === "7days" ? "active" : ""}`}
            onClick={() => setPreset("7days")}
          >
            Últimos 7 dias
          </button>
          <button
            className={`insights-chip ${preset === "30days" ? "active" : ""}`}
            onClick={() => setPreset("30days")}
          >
            Últimos 30 dias
          </button>
          <button
            className={`insights-chip ${preset === "last_month" ? "active" : ""}`}
            onClick={() => setPreset("last_month")}
          >
            Mês Anterior
          </button>
          <button
            className={`insights-chip ${preset === "custom" ? "active" : ""}`}
            onClick={() => setPreset("custom")}
          >
            Personalizado 📅
          </button>
        </div>

        {preset === "custom" && (
          <div className="insights-custom-dates">
            <div className="insights-date-input-group">
              <label>Data Início</label>
              <input
                type="date"
                className="insights-date-input"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
              />
            </div>
            <div className="insights-date-input-group">
              <label>Data Fim</label>
              <input
                type="date"
                className="insights-date-input"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
              />
            </div>
            <button className="insights-apply-btn" onClick={handleApplyCustom}>
              Aplicar
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="insights-loading">
          <div className="insights-spinner" />
          <span>Calculando métricas da loja...</span>
        </div>
      ) : error ? (
        <div className="insights-empty">
          <div className="insights-empty-icon">⚠️</div>
          <p>{error}</p>
          <button
            className="insights-apply-btn"
            onClick={() => loadMetrics(startDate, endDate)}
            style={{ marginTop: "10px" }}
          >
            Tentar novamente
          </button>
        </div>
      ) : metrics ? (
        <>
          {/* 1. Cards de Resumo KPIs */}
          <div className="insights-kpi-grid">
            <div className="kpi-card revenue">
              <div className="kpi-header">
                <span className="kpi-title">Faturamento Total</span>
                <span className="kpi-icon">💰</span>
              </div>
              <div className="kpi-value">
                {formatCurrency(metrics.summary.totalRevenue)}
              </div>
              <div className="kpi-subtitle">
                Prod: {formatCurrency(metrics.summary.productsRevenue)} | Frete: {formatCurrency(metrics.summary.deliveryRevenue)}
              </div>
            </div>

            <div className="kpi-card orders">
              <div className="kpi-header">
                <span className="kpi-title">Pedidos Concluídos</span>
                <span className="kpi-icon">📦</span>
              </div>
              <div className="kpi-value">
                {formatNumber(metrics.summary.totalOrders)}
              </div>
              <div className="kpi-subtitle">Vendas finalizadas no período</div>
            </div>

            <div className="kpi-card ticket">
              <div className="kpi-header">
                <span className="kpi-title">Ticket Médio</span>
                <span className="kpi-icon">🎯</span>
              </div>
              <div className="kpi-value">
                {formatCurrency(metrics.summary.averageTicket)}
              </div>
              <div className="kpi-subtitle">Média gasta por pedido</div>
            </div>

            <div className="kpi-card cookies">
              <div className="kpi-header">
                <span className="kpi-title">Cookies Vendidos</span>
                <span className="kpi-icon">🍪</span>
              </div>
              <div className="kpi-value">
                {formatNumber(metrics.summary.totalCookiesSold)} un
              </div>
              <div className="kpi-subtitle">Volume físico total vendido</div>
            </div>
          </div>

          {/* 2. Evolução do Faturamento no Período */}
          <div className="insights-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <span>📈</span> Evolução Diária de Vendas
              </h2>
            </div>
            {metrics.dailyEvolution && metrics.dailyEvolution.length > 0 ? (
              <div style={{ width: "100%", height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={metrics.dailyEvolution}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="formattedDate"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                      tickFormatter={(v) => `R$${v}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val)), "Faturamento"]}
                      labelFormatter={(label) => `Dia ${label}`}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorRev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="insights-empty">Nenhum dado registrado no período.</div>
            )}

            {/* Composição da Receita */}
            {metrics.revenueComposition && metrics.summary.totalRevenue > 0 && (
              <div className="revenue-breakdown-box">
                <div className="revenue-progress-bar">
                  <div
                    className="progress-segment-products"
                    style={{ width: `${metrics.revenueComposition.productsPercent}%` }}
                    title={`Produtos: ${metrics.revenueComposition.productsPercent}%`}
                  />
                  <div
                    className="progress-segment-delivery"
                    style={{ width: `${metrics.revenueComposition.deliveryPercent}%` }}
                    title={`Entrega: ${metrics.revenueComposition.deliveryPercent}%`}
                  />
                </div>
                <div className="revenue-legend">
                  <div className="legend-item">
                    <span className="legend-dot products" />
                    <span>
                      <strong>Produtos:</strong> {formatCurrency(metrics.revenueComposition.productsRevenue)} (
                      {metrics.revenueComposition.productsPercent}%)
                    </span>
                  </div>
                  <div className="legend-item">
                    <span className="legend-dot delivery" />
                    <span>
                      <strong>Taxas Frete:</strong> {formatCurrency(metrics.revenueComposition.deliveryRevenue)} (
                      {metrics.revenueComposition.deliveryPercent}%)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. Top Produtos Mais Vendidos */}
          <div className="insights-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <span>🏆</span> Top Produtos Mais Vendidos
              </h2>
              <div className="section-card-toggle-group">
                <button
                  className={`toggle-btn ${productRankingMode === "quantity" ? "active" : ""}`}
                  onClick={() => setProductRankingMode("quantity")}
                >
                  Qtd (Un)
                </button>
                <button
                  className={`toggle-btn ${productRankingMode === "revenue" ? "active" : ""}`}
                  onClick={() => setProductRankingMode("revenue")}
                >
                  Receita (R$)
                </button>
              </div>
            </div>

            {topProducts.length > 0 ? (
              <div className="ranking-list">
                {topProducts.map((p: any, idx: number) => {
                  const val = productRankingMode === "quantity" ? p.quantity : p.revenue;
                  const percent = Math.min(100, Math.round((val / maxProductVal) * 100));
                  return (
                    <div key={p.id} className="ranking-item">
                      <div
                        className={`ranking-badge ${
                          idx === 0 ? "top-1" : idx === 1 ? "top-2" : idx === 2 ? "top-3" : ""
                        }`}
                      >
                        {idx + 1}º
                      </div>
                      <div className="ranking-info">
                        <div className="ranking-name">{p.name}</div>
                        <div className="ranking-meta">
                          {p.categoryName} •{" "}
                          {productRankingMode === "quantity"
                            ? `${formatCurrency(p.revenue)} gerados`
                            : `${p.quantity} unidades vendidas`}
                        </div>
                        <div className="ranking-bar-wrap">
                          <div
                            className="ranking-bar-fill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                      <div className="ranking-val">
                        {productRankingMode === "quantity"
                          ? `${formatNumber(p.quantity)} un`
                          : formatCurrency(p.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="insights-empty">Nenhum produto vendido no período.</div>
            )}
          </div>

          {/* 4. Vendas por Categoria */}
          <div className="insights-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <span>🍩</span> Vendas por Categoria
              </h2>
            </div>
            {metrics.salesByCategory && metrics.salesByCategory.length > 0 ? (
              <div className="category-summary-grid">
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={metrics.salesByCategory}
                        dataKey="revenue"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={4}
                      >
                        {metrics.salesByCategory.map((_: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), "Faturamento"]}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="category-list-chips">
                  {metrics.salesByCategory.map((c: any, index: number) => (
                    <div key={c.name} className="category-row">
                      <div className="category-name-group">
                        <span
                          className="category-color-dot"
                          style={{
                            backgroundColor: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
                          }}
                        />
                        <span>{c.name}</span>
                      </div>
                      <div>
                        <strong>{formatCurrency(c.revenue)}</strong>{" "}
                        <span style={{ color: "#64748b", fontSize: "11px" }}>
                          ({c.percentage}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="insights-empty">Nenhuma venda por categoria registrada.</div>
            )}
          </div>

          {/* 5. Horários de Pico e Dias da Semana */}
          <div className="insights-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <span>⏰</span> Concentração de Pedidos
              </h2>
              <div className="section-card-toggle-group">
                <button
                  className={`toggle-btn ${timeMovementMode === "hours" ? "active" : ""}`}
                  onClick={() => setTimeMovementMode("hours")}
                >
                  Horários do Dia
                </button>
                <button
                  className={`toggle-btn ${timeMovementMode === "weekdays" ? "active" : ""}`}
                  onClick={() => setTimeMovementMode("weekdays")}
                >
                  Dias da Semana
                </button>
              </div>
            </div>

            {timeMovementMode === "hours" ? (
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.peakHours}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="hour"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(val: any) => [`${val} pedidos`, "Volume"]}
                      labelFormatter={(label) => `Horário: ${label}`}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="ordersCount" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div style={{ width: "100%", height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={metrics.dayOfWeekMovement}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis
                      dataKey="shortName"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, fill: "#94a3b8" }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                    />
                    <Tooltip
                      formatter={(val: any, name: any) => [
                        name === "ordersCount" ? `${val} pedidos` : formatCurrency(Number(val)),
                        name === "ordersCount" ? "Pedidos" : "Faturamento",
                      ]}
                      labelFormatter={(label, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? item.dayName : label;
                      }}
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid #e2e8f0",
                        fontSize: "12px",
                      }}
                    />
                    <Bar dataKey="ordersCount" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* 6. Top Clientes Mais Recorrentes / VIPs */}
          <div className="insights-section-card">
            <div className="section-card-header">
              <h2 className="section-card-title">
                <span>👑</span> Clientes Recorrentes (Top VIPs)
              </h2>
            </div>
            {metrics.topCustomers && metrics.topCustomers.length > 0 ? (
              <table className="customers-ranking-table">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th style={{ textAlign: "center" }}>Pedidos</th>
                    <th style={{ textAlign: "right" }}>Total Comprado</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.topCustomers.map((c: any) => (
                    <tr key={c.customerId}>
                      <td>
                        <div className="customer-cell-name">{c.name}</div>
                        {c.phone && <div className="customer-cell-phone">{c.phone}</div>}
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 600 }}>
                        {c.ordersCount}x
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                        {formatCurrency(c.totalSpent)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="insights-empty">Nenhum pedido vinculado a cliente no período.</div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
