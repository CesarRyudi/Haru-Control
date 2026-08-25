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
    { id: "products", label: "📦 Produtos & Categorias" },
    { id: "recipes", label: "📖 Receitas" },
    { id: "manufacturing", label: "🏭 Produção" },
    { id: "stock", label: "📊 Estoque" },
    { id: "workflow", label: "🚀 Fluxo Geral" },
  ];

  const topics: Topic[] = [
    {
      id: "orders",
      category: "orders",
      badge: "Vendas & Atendimento",
      icon: "📋",
      title: "Como Criar e Gerenciar Pedidos (Kanban)",
      shortDesc: "Criação de pedidos, seleção de cliente, cópia para WhatsApp e fluxo das colunas.",
      actionText: "Ir para Pedidos",
      actionPath: "/",
      content: (
        <div>
          <h4 className="help-section-title">✨ Passo a Passo para Criar um Pedido:</h4>
          <ol className="help-list">
            <li>Na tela de <strong>Pedidos (Início)</strong>, toque no botão flutuante <strong>＋</strong>.</li>
            <li><strong>Cliente (Opcional):</strong> Toque em <em>"👤 Selecionar Cliente"</em> para pesquisar por nome, telefone ou endereço, ou toque em <em>"Novo Cliente"</em> para cadastrá-lo na hora.</li>
            <li><strong>Endereço & Taxa de Entrega:</strong> O endereço do cliente é carregado automaticamente (você pode editar) e a taxa de entrega padrão pode ser ajustada.</li>
            <li><strong>Adicionar Produtos:</strong> Navegue pelas categorias, toque em <em>"Adicionar"</em> nos produtos desejados e use os botões <strong>＋</strong> e <strong>－</strong> para ajustar as quantidades.</li>
            <li>Toque em <strong>"Salvar Pedido"</strong> no rodapé. O pedido entrará automaticamente na coluna <strong>Rascunho</strong>.</li>
          </ol>

          <h4 className="help-section-title">📊 As 4 Etapas do Quadro Kanban:</h4>
          <ul className="help-list">
            <li><strong>📝 Rascunho:</strong> Pedidos recém-criados aguardando confirmação do cliente ou início do expediente.</li>
            <li><strong>🍳 Produção:</strong> Pedidos em preparação na cozinha.</li>
            <li><strong>🛵 Em Entrega:</strong> Pedidos embalados e em trânsito com o motoboy.</li>
            <li><strong>✅ Concluídos:</strong> Pedidos entregues e finalizados. Você pode filtrar pelo calendário de data no topo da coluna para ver o histórico de dias anteriores.</li>
          </ul>

          <h4 className="help-section-title">💬 Recursos no Card do Pedido:</h4>
          <ul className="help-list">
            <li><strong>Mudar Status:</strong> Use os botões de seta no card para avançar ou retroceder o pedido entre as colunas com 1 clique.</li>
            <li><strong>Copiar Mensagem (WhatsApp):</strong> Toque no card do pedido para abrir os detalhes e clique em <em>"Copiar Mensagem do Pedido"</em> para obter o texto formatado pronto para colar no WhatsApp do cliente com itens, taxa e total.</li>
            <li><strong>Editar / Cancelar:</strong> Toque em <em>"Editar"</em> no modal de detalhes para alterar itens ou cancelar o pedido.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "customers",
      category: "customers",
      badge: "Contatos",
      icon: "👥",
      title: "Como Cadastrar e Gerenciar Clientes",
      shortDesc: "Cadastro de clientes, telefones em qualquer formato e busca rápida.",
      actionText: "Ir para Clientes",
      actionPath: "/customers",
      content: (
        <div>
          <h4 className="help-section-title">✨ Cadastrando um Cliente:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Clientes</strong> no menu inferior.</li>
            <li>Toque no botão flutuante <strong>＋</strong>.</li>
            <li>Preencha os dados:
              <ul>
                <li><strong>Nome *:</strong> Nome ou identificação do cliente.</li>
                <li><strong>Telefone:</strong> Campo de texto livre (aceita WhatsApp, com DDD como <code>(11) 99999-9999</code> ou código internacional <code>+55 11...</code>).</li>
                <li><strong>Endereço de Entrega:</strong> Rua, número, complemento, bairro e pontos de referência.</li>
                <li><strong>Observação:</strong> Restrições, preferências ou notas fixas do cliente.</li>
              </ul>
            </li>
            <li>Toque em <strong>"Salvar"</strong>.</li>
          </ol>

          <h4 className="help-section-title">🔍 Busca e Edição:</h4>
          <ul className="help-list">
            <li>Use a barra de pesquisa no topo da tela de Clientes para filtrar por nome ou telefone.</li>
            <li>Toque em qualquer card de cliente para abrir o formulário e <strong>editar</strong> ou <strong>excluir</strong> o cadastro.</li>
          </ul>

          <div className="help-info-box">
            ℹ️ <strong>Atalho na Venda:</strong> Você não precisa cadastrar o cliente previamente! Ao abrir um novo pedido, toque em <em>"👤 Selecionar Cliente"</em> ➔ <em>"Novo Cliente"</em>.
          </div>
        </div>
      ),
    },
    {
      id: "products",
      category: "products",
      badge: "Catálogo & Categorias",
      icon: "📦",
      title: "Como Criar Produtos e Categorias",
      shortDesc: "Configuração de categorias, produtos vendáveis e insumos compráveis.",
      actionText: "Ir para Produtos",
      actionPath: "/products",
      content: (
        <div>
          <h4 className="help-section-title">💡 Entendendo os Tipos de Produtos:</h4>
          <ul className="help-list">
            <li><strong>🛒 Pode ser vendido (Produto final):</strong> Aparece na tela de criação de pedidos para venda aos clientes (ex: <em>Combo Especial</em>, <em>Cookie Assado</em>, <em>Refrigerante</em>).</li>
            <li><strong>📦 Pode ser comprado (Insumo):</strong> Matéria-prima comprada de fornecedores para usar em receitas ou embalagens (ex: <em>Farinha</em>, <em>Arroz</em>, <em>Salmão</em>, <em>Embalagem Box</em>).</li>
            <li><strong>🔄 Itens de Produção Interna / Intermediários:</strong> Podem ser fabricados pela loja (têm receita própria) e usados como ingredientes de outros produtos (ex: <em>Cookie Congelado</em>, <em>Massa Base</em>, <em>Molhos</em>).</li>
          </ul>

          <h4 className="help-section-title">✨ Criando Categorias:</h4>
          <ol className="help-list">
            <li>Na tela de <strong>Produtos</strong>, toque no botão flutuante <strong>＋</strong> e selecione <strong>"📁 Nova Categoria"</strong>.</li>
            <li>Informe o <strong>Nome</strong> da categoria (ex: <em>Temakis</em>, <em>Sobremesas</em>, <em>Insumos Básicos</em>).</li>
            <li>(Opcional) Defina um <strong>Preço Padrão</strong>: produtos associados a essa categoria puxarão esse preço automaticamente.</li>
            <li>Toque em <strong>"Salvar"</strong>.</li>
          </ol>

          <h4 className="help-section-title">✨ Criando um Produto:</h4>
          <ol className="help-list">
            <li>Toque no botão flutuante <strong>＋</strong> e selecione <strong>"➕ Novo Produto"</strong>.</li>
            <li>Preencha o <strong>Nome</strong>, selecione a <strong>Categoria</strong> e defina o <strong>Preço</strong>.</li>
            <li>Marque as opções correspondentes: <em>"Pode ser vendido"</em> e/ou <em>"Pode ser comprado"</em>.</li>
            <li>Toque em <strong>"Salvar"</strong>.</li>
          </ol>
        </div>
      ),
    },
    {
      id: "recipes",
      category: "recipes",
      badge: "Ficha Técnica (BOM)",
      icon: "📖",
      title: "Como Criar Receitas (Ficha Técnica)",
      shortDesc: "Como acessar a receita pelo card do produto e vincular ingredientes/subprodutos.",
      actionText: "Ir para Produtos",
      actionPath: "/products",
      content: (
        <div>
          <h4 className="help-section-title">🎯 Para que serve a Ficha Técnica?</h4>
          <p style={{ marginBottom: "10px" }}>
            A receita ensina ao sistema quais ingredientes e em que quantidades são consumidos para produzir 1 unidade do item.
          </p>

          <h4 className="help-section-title">✨ Como Acessar e Montar a Receita:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Produtos</strong> no menu inferior.</li>
            <li>Toque no <strong>card do produto</strong> que deseja configurar para abrir o modal de edição.</li>
            <li>No canto inferior esquerdo do modal, toque no botão azul <strong>"Receita"</strong>.</li>
            <li>Você será levado para a tela de <em>Receita / BOM</em> do produto.</li>
            <li>Toque no botão flutuante <strong>➕ Adicionar Ingrediente</strong>.</li>
            <li>Selecione o <strong>Ingrediente / Componente</strong> no catálogo e informe a <strong>Quantidade Necessária</strong> consumida por unidade.</li>
            <li>Toque em <strong>"Adicionar"</strong> e repita para todos os componentes.</li>
          </ol>

          <h4 className="help-section-title">🍪 Receitas em Múltiplas Etapas (Exemplo Real):</h4>
          <div className="help-info-box" style={{ marginBottom: '10px' }}>
            <p><strong>1. Receita do Cookie Congelado (Intermediário):</strong> Farinha (0.05kg) + Manteiga (0.02kg) + Chocolate (0.03kg).</p>
            <p style={{ marginTop: '6px' }}><strong>2. Receita do Cookie Assado (Final):</strong> 1 un de Cookie Congelado + 1 un de Embalagem.</p>
          </div>

          <div className="help-tip-box">
            💡 <strong>Dica:</strong> Qualquer item do catálogo pode ser ingrediente de outro! Para remover um ingrediente da receita, basta tocar no ícone da lixeira 🗑️ ao lado dele.
          </div>
        </div>
      ),
    },
    {
      id: "manufacturing",
      category: "manufacturing",
      badge: "Produção na Cozinha",
      icon: "🏭",
      title: "Como Registrar Produção (Manufatura)",
      shortDesc: "Transformação de insumos em produtos com baixa e entrada automáticas no estoque.",
      actionText: "Ir para Manufatura",
      actionPath: "/manufacturing",
      content: (
        <div>
          <h4 className="help-section-title">⚙️ O que a Manufatura faz:</h4>
          <p style={{ marginBottom: "10px" }}>
            Quando você fabrica um lote de itens que possuem receita cadastrada (seja um produto final para venda ou um pré-preparo como cookies congelados ou massas), registre a produção aqui.
          </p>

          <h4 className="help-section-title">✨ Como Registrar uma Produção:</h4>
          <ol className="help-list">
            <li>Acesse a aba <strong>Produção</strong> no menu inferior.</li>
            <li>Selecione o <strong>Produto a fabricar</strong> no menu suspenso.</li>
            <li>Informe a <strong>Quantidade a produzir</strong> (ex: 20 unidades).</li>
            <li>Toque em <strong>"Registrar Produção"</strong> e confirme.</li>
          </ol>

          <h4 className="help-section-title">🔄 Movimentação Automática no Estoque:</h4>
          <ul className="help-list">
            <li><strong>Baixa Automática:</strong> O sistema calcula a quantidade proporcional de cada ingrediente da receita e subtrai do estoque.</li>
            <li><strong>Entrada Automática:</strong> O sistema adiciona as unidades fabricadas ao estoque do produto pronto.</li>
            <li><strong>Avisos de Saldo:</strong> Caso algum insumo não tenha saldo suficiente, a produção é registrada e o sistema exibe um aviso informando qual insumo ficou com saldo negativo para você repor.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "stock",
      category: "stock",
      badge: "Saldo & Inventário",
      icon: "📊",
      title: "Como Controlar o Estoque (Entradas e Ajustes)",
      shortDesc: "Registro de compras recebidas e realização de balanço/inventário físico.",
      actionText: "Ir para Estoque",
      actionPath: "/stock",
      content: (
        <div>
          <h4 className="help-section-title">📦 Diferença entre as Operações:</h4>
          <ul className="help-list">
            <li><strong>＋ Entrada de Estoque (Compras):</strong> Use quando receber mercadorias do fornecedor. A quantidade digitada é <em>somada</em> ao saldo atual.</li>
            <li><strong>📝 Ajustar Estoque (Inventário / Balanço):</strong> Use para contagem física periódica. O valor digitado substitui o saldo e se torna o <em>novo estoque exato</em>.</li>
          </ul>

          <h4 className="help-section-title">✨ Como Registrar Entrada de Estoque:</h4>
          <ol className="help-list">
            <li>Na tela de <strong>Estoque</strong>, toque no botão flutuante <strong>＋</strong>.</li>
            <li>Selecione o item e informe a quantidade recebida.</li>
            <li>Toque em <strong>"Confirmar"</strong>.</li>
          </ol>

          <h4 className="help-section-title">✨ Como Ajustar o Estoque de um Item:</h4>
          <ol className="help-list">
            <li>Na tela de <strong>Estoque</strong>, localize o item desejado.</li>
            <li>Toque no botão <strong>"Ajustar"</strong> diretamente no card do produto.</li>
            <li>Ajuste o novo saldo real pelos botões <strong>＋</strong> / <strong>－</strong> ou digitando no campo.</li>
            <li>Toque em <strong>"Confirmar"</strong>.</li>
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
      shortDesc: "A sequência ideal para cadastrar seus dados e operar sem falhas.",
      content: (
        <div>
          <h4 className="help-section-title">🗺️ Sequência Recomendada de Uso:</h4>
          <ol className="help-list">
            <li><strong>1. Cadastrar Insumos e Produtos:</strong> Crie suas matérias-primas e produtos vendáveis na tela de <em>Produtos</em>.</li>
            <li><strong>2. Dar Entrada no Estoque Inicial:</strong> Na tela de <em>Estoque</em> (botão <strong>＋</strong>), registre as quantidades iniciais disponíveis.</li>
            <li><strong>3. Criar as Receitas:</strong> Abra o card do produto em <em>Produtos</em> ➔ toque em <em>"Receita"</em> e adicione os ingredientes consumidos por unidade.</li>
            <li><strong>4. Produzir na Manufatura:</strong> Na aba <em>Produção</em>, registre os lotes fabricados para dar baixa nos insumos e alimentar o estoque de produtos prontos.</li>
            <li><strong>5. Operar os Pedidos no Kanban:</strong> Abra pedidos em <em>Início</em> (botão <strong>＋</strong>), copie o resumo para o WhatsApp do cliente e controle as etapas da cozinha até a entrega.</li>
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
            O Haru Control integra todo o ciclo operacional do seu negócio:
          </p>
          <div className="help-steps-flow">
            <div className="help-step-item">
              <span className="help-step-num">1</span>
              <span><strong>Insumos & Estoque:</strong> Cadastro de matérias-primas e compras.</span>
            </div>
            <div className="help-step-item">
              <span className="help-step-num">2</span>
              <span><strong>Receitas & Manufatura:</strong> Ficha técnica e transformação em produtos.</span>
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
