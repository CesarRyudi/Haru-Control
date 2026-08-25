import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "./Help.css";

interface Topic {
  id: string;
  category: "products" | "recipes" | "customers" | "orders" | "manufacturing" | "stock" | "workflow";
  badge: string;
  icon: string;
  title: string;
  shortDesc: string;
  actionText?: string;
  actionPath?: string;
  content: React.ReactNode;
}

export default function Help() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [openCardId, setOpenCardId] = useState<string | null>("orders"); // default first card open

  const categories = [
    { id: "all", label: "🌟 Tudo" },
    { id: "orders", label: "📋 Pedidos & Kanban" },
    { id: "customers", label: "👥 Clientes" },
    { id: "products", label: "📦 Produtos" },
    { id: "recipes", label: "📖 Receitas" },
    { id: "manufacturing", label: "🏭 Produção" },
    { id: "stock", label: "📊 Estoque" },
  ];

  const topics: Topic[] = [
    {
      id: "orders",
      category: "orders",
      badge: "Pedidos & Vendas",
      icon: "📋",
      title: "Como Criar e Gerenciar Pedidos",
      shortDesc: "Passo a passo para registrar vendas, gerenciar o Kanban e comandas.",
      actionText: "Ir para Pedidos",
      actionPath: "/",
      content: (
        <div>
          <h4 className="help-section-title">✨ Como Criar um Novo Pedido:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Início</strong> (ou o botão <strong>＋</strong> flutuante).</li>
            <li>No topo, toque em <strong>"Selecionar Cliente"</strong>:
              <ul>
                <li>Pesquise por nome, telefone ou endereço do cliente.</li>
                <li>Ou toque em <strong>"Novo Cliente"</strong> para cadastrar um novo rapidamente.</li>
              </ul>
            </li>
            <li>O <strong>endereço de entrega</strong> e a <strong>taxa de entrega</strong> serão preenchidos automaticamente (você pode editar caso necessário).</li>
            <li>Navegue pelas categorias e adicione os <strong>produtos e quantidades</strong> desejados.</li>
            <li>Adicione <strong>observações</strong> do pedido se o cliente tiver pedidos especiais (ex: sem cebolinha, mandar sachês extras).</li>
            <li>Toque em <strong>"Criar Pedido"</strong>.</li>
          </ol>

          <h4 className="help-section-title">📊 As Colunas do Quadro Kanban:</h4>
          <ul className="help-list">
            <li><strong>📝 Rascunho:</strong> Pedidos recém-criados aguardando confirmação ou início do preparo.</li>
            <li><strong>🍳 Produção:</strong> Pedidos que foram enviados para a cozinha e estão sendo preparados.</li>
            <li><strong>🛵 Em Entrega:</strong> Pedidos prontos, embalados e em rota de entrega com o motoboy.</li>
            <li><strong>✅ Concluídos:</strong> Pedidos já entregues e finalizados. Você pode filtrar por data para conferir o histórico.</li>
          </ul>

          <div className="help-tip-box">
            💡 <strong>Dica Rápida:</strong> Toque no card de qualquer pedido para abrir os detalhes completos, avançar de etapa ou imprimir a comanda.
          </div>
        </div>
      ),
    },
    {
      id: "customers",
      category: "customers",
      badge: "Cadastro",
      icon: "👥",
      title: "Como Cadastrar e Gerenciar Clientes",
      shortDesc: "Cadastro de contatos, endereços para entrega e telefones WhatsApp.",
      actionText: "Ir para Clientes",
      actionPath: "/customers",
      content: (
        <div>
          <h4 className="help-section-title">✨ Cadastrando um Cliente:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Clientes</strong> no menu inferior.</li>
            <li>Toque no botão flutuante <strong>＋</strong>.</li>
            <li>Preencha as informações:
              <ul>
                <li><strong>Nome:</strong> Nome do cliente ou apelido.</li>
                <li><strong>Telefone:</strong> Aceita qualquer formato livre (ex: com DDD <code>11 99999-9999</code>, WhatsApp, ou código do país <code>+55 11...</code>).</li>
                <li><strong>Endereço de Entrega:</strong> Rua, número, complemento, bairro e pontos de referência.</li>
                <li><strong>Observação:</strong> Preferências gerais, restrições alimentares ou alergias do cliente.</li>
              </ul>
            </li>
            <li>Toque em <strong>Salvar</strong>.</li>
          </ol>

          <div className="help-info-box">
            ℹ️ <strong>Cadastro Rápido na Venda:</strong> Você não precisa cadastrar o cliente antes! Ao abrir um novo pedido, você pode tocar em <em>"Novo Cliente"</em> direto na tela do pedido.
          </div>
        </div>
      ),
    },
    {
      id: "products",
      category: "products",
      badge: "Catálogo",
      icon: "📦",
      title: "Como Criar e Gerenciar Produtos & Insumos",
      shortDesc: "Diferença entre produtos vendáveis e insumos compráveis, criação de categorias.",
      actionText: "Ir para Produtos",
      actionPath: "/products",
      content: (
        <div>
          <h4 className="help-section-title">💡 Tipos de Itens no Sistema:</h4>
          <ul className="help-list">
            <li><strong>🟢 Produto Vendável:</strong> Aparece no cardápio de vendas para adicionar aos pedidos (ex: <em>Combo Haru Especial</em>, <em>Temaki Salmão</em>, <em>Refrigerante</em>).</li>
            <li><strong>🟡 Insumo / Comprável:</strong> Matérias-primas que você compra para usar nas receitas ou embalagens (ex: <em>Arroz Shari</em>, <em>Nori</em>, <em>Salmão Fresco</em>, <em>Embalagem Box</em>).</li>
            <li><strong>🔵 Produto Misto:</strong> Pode ser tanto vendido avulso quanto comprado/usado em receitas (ex: <em>Água Mineral</em>).</li>
          </ul>

          <h4 className="help-section-title">✨ Passo a Passo para Criar um Produto:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Produtos</strong> e toque no botão <strong>＋</strong>.</li>
            <li>Digite o <strong>Nome</strong> do produto.</li>
            <li>Selecione a <strong>Categoria</strong> (ou crie uma nova tocando no botão de categorias).</li>
            <li>Defina o <strong>Preço de Venda</strong> (se for um produto vendável).</li>
            <li>Marque as caixas de seleção:
              <ul>
                <li>☑️ <strong>Pode ser vendido:</strong> Marque para aparecer na tela de pedidos.</li>
                <li>☑️ <strong>Pode ser comprado / Insumo:</strong> Marque se este item é uma matéria-prima para receitas.</li>
              </ul>
            </li>
            <li>Toque em <strong>Salvar</strong>.</li>
          </ol>
        </div>
      ),
    },
    {
      id: "recipes",
      category: "recipes",
      badge: "Ficha Técnica",
      icon: "📖",
      title: "Como Criar Receitas (Ficha Técnica)",
      shortDesc: "Vincular ingredientes a um produto para controle e baixa automática de estoque.",
      actionText: "Ir para Produtos",
      actionPath: "/products",
      content: (
        <div>
          <h4 className="help-section-title">🎯 O que pode ser adicionado em uma Receita?</h4>
          <p style={{ marginBottom: "10px" }}>
            Qualquer item do catálogo pode ser usado como ingrediente na receita:
          </p>
          <ul className="help-list">
            <li><strong>Matérias-primas / Insumos comprados:</strong> Itens adquiridos de fornecedores (ex: farinha, salmão, arroz, açúcar, embalagens).</li>
            <li><strong>Produtos Intermediários / Pré-preparos da casa:</strong> Itens produzidos pela própria loja para uso posterior (ex: <em>Cookie Congelado</em> para assar depois, <em>Massa Base</em>, <em>Molhos artesanais</em>).</li>
          </ul>

          <h4 className="help-section-title">🍪 Exemplo Prático (Receitas em Etapas):</h4>
          <div className="help-info-box" style={{ marginBottom: '14px' }}>
            <p><strong>1. Receita do Cookie Congelado:</strong> Farinha + Manteiga + Açúcar + Chocolate.</p>
            <p style={{ marginTop: '4px' }}><strong>2. Receita do Cookie Assado (Venda):</strong> 1 un de Cookie Congelado + 1 un de Embalagem.</p>
          </div>

          <h4 className="help-section-title">✨ Como Configurar a Receita de um Produto:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Produtos</strong>.</li>
            <li>Localize o produto que deseja configurar (ex: <em>Cookie Assado</em> ou <em>Combo Especial</em>).</li>
            <li>Toque no botão de <strong>Receita / Ficha Técnica</strong> (ícone de livro 📖) no card do produto.</li>
            <li>Toque no botão <strong>＋ Adicionar Ingrediente</strong>.</li>
            <li>Selecione o <strong>Ingrediente / Componente</strong> no catálogo.</li>
            <li>Defina a <strong>Quantidade gasta</strong> para fazer 1 unidade do produto.</li>
            <li>Salve. Repita para todos os ingredientes que compõem a receita.</li>
          </ol>

          <div className="help-tip-box">
            💡 <strong>Dica:</strong> Ao produzir um item intermediário (como o Cookie Congelado) na tela de <strong>Manufatura</strong>, o sistema consome os insumos básicos e alimenta o estoque do Cookie Congelado para quando for assá-lo!
          </div>
        </div>
      ),
    },
    {
      id: "manufacturing",
      category: "manufacturing",
      badge: "Cozinha & Fábrica",
      icon: "🏭",
      title: "Como Registrar Produção (Manufatura)",
      shortDesc: "Transforme insumos em produtos acabados com baixa e entrada automáticas no estoque.",
      actionText: "Ir para Manufatura",
      actionPath: "/manufacturing",
      content: (
        <div>
          <h4 className="help-section-title">⚙️ Como Funciona a Manufatura:</h4>
          <p style={{ marginBottom: "10px" }}>
            Quando a cozinha prepara um lote de produtos (ex: pré-preparo de 50 temakis ou 20 combos), você registra a produção aqui.
          </p>

          <h4 className="help-section-title">✨ Passo a Passo para Produzir:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Manufatura</strong> no menu inferior.</li>
            <li>Selecione o <strong>Produto</strong> que foi preparado (ele precisa ter uma receita cadastrada).</li>
            <li>Informe a <strong>Quantidade produzida</strong>.</li>
            <li>Toque em <strong>"Registrar Produção"</strong> e confirme.</li>
          </ol>

          <h4 className="help-section-title">🔄 O que o sistema faz automaticamente:</h4>
          <ul className="help-list">
            <li><strong>Subtrai</strong> do estoque a quantidade proporcional de cada insumo configurado na receita.</li>
            <li><strong>Adiciona</strong> ao estoque a quantidade correspondente do produto final pronto para venda.</li>
            <li>Caso o saldo de algum insumo fique negativo, o sistema emitirá um aviso amigável para você repor.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "stock",
      category: "stock",
      badge: "Inventário",
      icon: "📊",
      title: "Como Controlar o Estoque (Entradas e Ajustes)",
      shortDesc: "Como registrar compras de mercadorias e fazer inventário / balanço do estoque.",
      actionText: "Ir para Estoque",
      actionPath: "/stock",
      content: (
        <div>
          <h4 className="help-section-title">📦 Operações de Estoque:</h4>
          <ul className="help-list">
            <li><strong>＋ Entrada de Estoque:</strong> Use sempre que chegar compra do fornecedor (ex: comprou 10kg de arroz ou 5 caixas de embalagens). O valor informado é <em>somado</em> ao estoque atual.</li>
            <li><strong>📝 Ajuste de Estoque (Inventário):</strong> Use para conferência física (balanço). O valor informado se torna o <em>novo saldo exato</em> no sistema.</li>
          </ul>

          <h4 className="help-section-title">✨ Como Registrar uma Entrada ou Ajuste:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Estoque</strong>.</li>
            <li>Toque no botão correspondente no topo ou flutuante:
              <ul>
                <li>Toque em <strong>"＋ Entrada"</strong> para somar itens comprados.</li>
                <li>Ou em <strong>"Ajuste"</strong> para corrigir o saldo real.</li>
              </ul>
            </li>
            <li>Selecione o produto ou insumo e digite a quantidade.</li>
            <li>Confirme a operação.</li>
          </ol>
        </div>
      ),
    },
    {
      id: "workflow",
      category: "workflow",
      badge: "Guia Rápido",
      icon: "🚀",
      title: "Fluxo Recomendado: Começando do Zero",
      shortDesc: "A ordem ideal para cadastrar seus dados e operar a operação sem erros.",
      content: (
        <div>
          <h4 className="help-section-title">🗺️ Sequência Recomendada de Configuração:</h4>
          <ol className="help-list">
            <li><strong>1. Cadastre os Insumos:</strong> Na tela de <em>Produtos</em>, crie os ingredientes e embalagens marcando <em>"Pode ser comprado / Insumo"</em>.</li>
            <li><strong>2. Dê Entrada no Estoque Inicial:</strong> Na tela de <em>Estoque</em>, adicione a quantidade inicial que você tem disponível de cada insumo.</li>
            <li><strong>3. Cadastre os Produtos do Cardápio:</strong> Crie os pratos e combos marcando <em>"Pode ser vendido"</em> com seus preços.</li>
            <li><strong>4. Configure a Receita de Cada Produto:</strong> Abra a Ficha Técnica de cada prato e vincule os insumos necessários.</li>
            <li><strong>5. Cadastre Clientes e Lance os Pedidos:</strong> Pronto! Agora sua operação está 100% pronta para receber pedidos, movimentar estoque e organizar a cozinha no Kanban.</li>
          </ol>
        </div>
      ),
    },
  ];

  const filteredTopics = useMemo(() => {
    return topics.filter((t) => {
      const matchesCategory =
        selectedCategory === "all" ||
        t.category === selectedCategory ||
        (selectedCategory === "recipes" && t.id === "recipes") ||
        (selectedCategory === "manufacturing" && t.id === "manufacturing");

      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        t.title.toLowerCase().includes(q) ||
        t.shortDesc.toLowerCase().includes(q) ||
        t.badge.toLowerCase().includes(q)
      );
    });
  }, [topics, selectedCategory, searchQuery]);

  const toggleCard = (id: string) => {
    setOpenCardId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="help-page">
      <header className="help-header">
        <div className="help-header-top">
          <button className="help-back-btn" onClick={() => navigate(-1)}>
            ← Voltar
          </button>
          <div className="help-header-title">
            <span>📖</span>
            <span>Central de Ajuda</span>
          </div>
        </div>
        <p className="help-header-subtitle">
          Guia completo e instruções passo a passo para usar todas as funcionalidades do Haru Control.
        </p>
      </header>

      {/* Search Input */}
      <div className="help-search-box">
        <span className="help-search-icon">🔍</span>
        <input
          type="text"
          className="help-search-input"
          placeholder="Buscar instruções (ex: receitas, clientes, kanban...)"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="help-search-clear" onClick={() => setSearchQuery("")}>
            ✕
          </button>
        )}
      </div>

      {/* Category Chips */}
      <div className="help-categories">
        {categories.map((cat) => (
          <button
            key={cat.id}
            className={`help-chip ${selectedCategory === cat.id ? "active" : ""}`}
            onClick={() => setSelectedCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Highlight Banner */}
      {selectedCategory === "all" && !searchQuery && (
        <div className="help-banner">
          <div className="help-banner-title">
            <span>💡</span>
            <span>Fluxo Completo do Haru Control</span>
          </div>
          <p className="help-banner-text">
            O Haru Control integra todo o ciclo do seu restaurante:
          </p>
          <div className="help-steps-flow">
            <div className="help-step-item">
              <span className="help-step-num">1</span>
              <span><strong>Insumos & Estoque:</strong> Cadastro de matérias-primas e compras.</span>
            </div>
            <div className="help-step-item">
              <span className="help-step-num">2</span>
              <span><strong>Receitas & Manufatura:</strong> Ficha técnica e produção dos pratos.</span>
            </div>
            <div className="help-step-item">
              <span className="help-step-num">3</span>
              <span><strong>Clientes & Pedidos:</strong> Atendimento rápido e controle no Kanban.</span>
            </div>
          </div>
        </div>
      )}

      {/* Topics Accordion */}
      <div className="help-topic-list">
        {filteredTopics.length === 0 ? (
          <div className="help-empty">
            <div className="help-empty-icon">🔎</div>
            <h3>Nenhum tópico encontrado</h3>
            <p>Tente buscar por outras palavras-chave ou selecione outra categoria.</p>
          </div>
        ) : (
          filteredTopics.map((topic) => {
            const isOpen = openCardId === topic.id;
            return (
              <div key={topic.id} className={`help-card ${isOpen ? "open" : ""}`}>
                <div
                  className="help-card-header"
                  onClick={() => toggleCard(topic.id)}
                >
                  <div className="help-card-title-group">
                    <div className="help-card-icon">{topic.icon}</div>
                    <div>
                      <span className="help-card-badge">{topic.badge}</span>
                      <h3 className="help-card-title">{topic.title}</h3>
                    </div>
                  </div>
                  <div className="help-card-toggle">▼</div>
                </div>

                {isOpen && (
                  <div className="help-card-body">
                    {topic.content}
                    {topic.actionText && topic.actionPath && (
                      <button
                        className="help-action-btn"
                        onClick={() => navigate(topic.actionPath!)}
                      >
                        {topic.actionText} →
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
