import { PrismaClient, OrderStatus, LedgerOperationType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🍪 [Haru Control] Iniciando o povoamento de dados de teste realistas...\n');

  // 1. Limpeza do banco de dados (respeitando chaves estrangeiras)
  console.log('🧹 Limpando dados existentes no banco de desenvolvimento...');
  await prisma.sale.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.recipeItem.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  console.log('✅ Banco de dados limpo com sucesso.\n');

  // 2. Criação de Categorias
  console.log('📂 Criando categorias...');
  const catClassicos = await prisma.category.create({
    data: {
      name: 'Cookies Clássicos',
      price: 14.0,
      observation: 'Receitas tradicionais com massas amanteigadas e chocolates nobres.',
    },
  });

  const catEspeciais = await prisma.category.create({
    data: {
      name: 'Cookies Especiais & Recheados',
      price: 17.0,
      observation: 'Cookies com recheios generosos e combinações exclusivas.',
    },
  });

  const catSazonais = await prisma.category.create({
    data: {
      name: 'Cookies Sazonais',
      price: 18.0,
      observation: 'Edições limitadas e sabores comemorativos.',
    },
  });

  const catBebidas = await prisma.category.create({
    data: {
      name: 'Bebidas Refrescantes & Chocolates',
      price: null,
      observation: 'Bebidas artesanais não alcoólicas e sem café para acompanhar os cookies.',
    },
  });

  const catInsumos = await prisma.category.create({
    data: {
      name: 'Insumos & Matérias-Primas',
      price: null,
      observation: 'Ingredientes e embalagens para controle interno de produção.',
    },
  });
  console.log('✅ 5 Categorias criadas.\n');

  // 3. Criação de Insumos / Matérias-Primas (isPurchasable: true, isSellable: false)
  console.log('🌾 Criando insumos e matérias-primas...');
  const insumosData = [
    { name: 'Farinha de Trigo Especial Tipo 1', unit: 'kg', price: 6.5 },
    { name: 'Manteiga Sem Sal Extra', unit: 'kg', price: 48.0 },
    { name: 'Açúcar Cristal Orgânico', unit: 'kg', price: 5.2 },
    { name: 'Açúcar Mascavo Úmido', unit: 'kg', price: 12.5 },
    { name: 'Gotas de Chocolate Belga 54% Callebaut', unit: 'kg', price: 78.0 },
    { name: 'Gotas de Chocolate ao Leite Belga', unit: 'kg', price: 68.0 },
    { name: 'Gotas de Chocolate Branco Velvet', unit: 'kg', price: 72.0 },
    { name: 'Nutella Original Ferrero', unit: 'kg', price: 58.0 },
    { name: 'Doce de Leite Havanna Artesanal', unit: 'kg', price: 38.0 },
    { name: 'Pasta Pura de Pistache & Pistache Granulado', unit: 'kg', price: 145.0 },
    { name: 'Cacau em Pó 100% Black Alcalino', unit: 'kg', price: 42.0 },
    { name: 'Extrato Natural de Baunilha de Madagascar', unit: 'L', price: 130.0 },
    { name: 'Bicarbonato de Sódio Puro', unit: 'kg', price: 14.0 },
    { name: 'Ovos Caipiras Selecionados', unit: 'Un', price: 0.85 },
    { name: 'Flor de Sal de Guérande', unit: 'kg', price: 28.0 },
    { name: 'Cream Cheese Philadelphia', unit: 'kg', price: 44.0 },
    { name: 'Canela em Pó do Ceilão', unit: 'kg', price: 36.0 },
    { name: 'Leite Integral Pasteurizado', unit: 'L', price: 5.8 },
    { name: 'Xarope Natural de Maçã Verde', unit: 'L', price: 45.0 },
    { name: 'Xarope Natural de Frutas Vermelhas', unit: 'L', price: 48.0 },
    { name: 'Embalagem Caixa Kraft Haru 4 Cookies', unit: 'Un', price: 3.2 },
    { name: 'Embalagem Individual Celofane + Tag Haru', unit: 'Un', price: 0.75 },
  ];

  const insumosMap = new Map<string, any>();
  for (const item of insumosData) {
    const created = await prisma.product.create({
      data: {
        name: item.name,
        unit: item.unit,
        price: item.price,
        categoryId: catInsumos.id,
        isPurchasable: true,
        isSellable: false,
      },
    });
    insumosMap.set(item.name, created);
  }
  console.log(`✅ ${insumosMap.size} Insumos criados.\n`);

  // 4. Criação de Cookies e Bebidas Vendíveis (isSellable: true, isPurchasable: false)
  console.log('🍪 Criando produtos vendíveis (Cookies e Bebidas)...');
  const productsSellableData = [
    // Cookies Clássicos
    {
      name: 'Cookie Clássico Gotas Belga 54%',
      unit: 'Un',
      price: 14.0,
      categoryId: catClassicos.id,
    },
    {
      name: 'Cookie Double Chocolate Intenso',
      unit: 'Un',
      price: 15.0,
      categoryId: catClassicos.id,
    },
    {
      name: 'Cookie Triplo Chocolate Belga',
      unit: 'Un',
      price: 16.0,
      categoryId: catClassicos.id,
    },
    {
      name: 'Cookie Churros & Doce de Leite',
      unit: 'Un',
      price: 15.0,
      categoryId: catClassicos.id,
    },
    // Cookies Especiais & Recheados
    {
      name: 'Cookie Red Velvet com Cream Cheese',
      unit: 'Un',
      price: 17.0,
      categoryId: catEspeciais.id,
    },
    {
      name: 'Cookie Nutella & Leite Ninho',
      unit: 'Un',
      price: 18.0,
      categoryId: catEspeciais.id,
    },
    {
      name: 'Cookie Doce de Leite & Flor de Sal',
      unit: 'Un',
      price: 16.0,
      categoryId: catEspeciais.id,
    },
    {
      name: 'Cookie Pistache Supremo & Choc Branco',
      unit: 'Un',
      price: 21.0,
      categoryId: catEspeciais.id,
    },
    {
      name: 'Cookie Dark & White Black Cacau',
      unit: 'Un',
      price: 16.0,
      categoryId: catEspeciais.id,
    },
    // Cookies Sazonais
    {
      name: 'Cookie Sazonal Cenoura & Brigadeiro',
      unit: 'Un',
      price: 18.0,
      categoryId: catSazonais.id,
    },
    // Bebidas Artesanais
    {
      name: 'Chocolate Quente Cremoso Belga 250ml',
      unit: 'Un',
      price: 15.0,
      categoryId: catBebidas.id,
    },
    {
      name: 'Leite Gelado Aromatizado com Fava de Baunilha',
      unit: 'Un',
      price: 10.0,
      categoryId: catBebidas.id,
    },
    {
      name: 'Soda Italiana de Maçã Verde 400ml',
      unit: 'Un',
      price: 14.0,
      categoryId: catBebidas.id,
    },
    {
      name: 'Soda Italiana de Frutas Vermelhas 400ml',
      unit: 'Un',
      price: 14.0,
      categoryId: catBebidas.id,
    },
    {
      name: 'Chá Gelado Artesanal de Pêssego & Hibisco 400ml',
      unit: 'Un',
      price: 12.0,
      categoryId: catBebidas.id,
    },
    {
      name: 'Suco de Laranja Integral 300ml',
      unit: 'Un',
      price: 9.0,
      categoryId: catBebidas.id,
    },
    {
      name: 'Água Mineral San Pellegrino com Gás 500ml',
      unit: 'Un',
      price: 9.0,
      categoryId: catBebidas.id,
    },
    {
      name: 'Água Mineral sem Gás 500ml',
      unit: 'Un',
      price: 5.0,
      categoryId: catBebidas.id,
    },
  ];

  const productsMap = new Map<string, any>();
  for (const item of productsSellableData) {
    const created = await prisma.product.create({
      data: {
        name: item.name,
        unit: item.unit,
        price: item.price,
        categoryId: item.categoryId,
        isPurchasable: false,
        isSellable: true,
      },
    });
    productsMap.set(item.name, created);
  }
  console.log(`✅ ${productsMap.size} Produtos Vendíveis criados.\n`);

  // 5. Criação das Fichas Técnicas (BOM - RecipeItem)
  console.log('📜 Criando fichas técnicas (receitas/BOM)...');
  const recipesData: Array<{
    parentName: string;
    items: Array<{ childName: string; quantity: number; unit: string }>;
  }> = [
    {
      parentName: 'Cookie Clássico Gotas Belga 54%',
      items: [
        { childName: 'Farinha de Trigo Especial Tipo 1', quantity: 0.045, unit: 'kg' },
        { childName: 'Manteiga Sem Sal Extra', quantity: 0.025, unit: 'kg' },
        { childName: 'Açúcar Mascavo Úmido', quantity: 0.02, unit: 'kg' },
        { childName: 'Açúcar Cristal Orgânico', quantity: 0.015, unit: 'kg' },
        { childName: 'Gotas de Chocolate Belga 54% Callebaut', quantity: 0.035, unit: 'kg' },
        { childName: 'Ovos Caipiras Selecionados', quantity: 0.25, unit: 'Un' },
        { childName: 'Extrato Natural de Baunilha de Madagascar', quantity: 0.002, unit: 'L' },
        { childName: 'Bicarbonato de Sódio Puro', quantity: 0.001, unit: 'kg' },
        { childName: 'Embalagem Individual Celofane + Tag Haru', quantity: 1, unit: 'Un' },
      ],
    },
    {
      parentName: 'Cookie Double Chocolate Intenso',
      items: [
        { childName: 'Farinha de Trigo Especial Tipo 1', quantity: 0.04, unit: 'kg' },
        { childName: 'Cacau em Pó 100% Black Alcalino', quantity: 0.01, unit: 'kg' },
        { childName: 'Manteiga Sem Sal Extra', quantity: 0.025, unit: 'kg' },
        { childName: 'Açúcar Mascavo Úmido', quantity: 0.02, unit: 'kg' },
        { childName: 'Gotas de Chocolate Branco Velvet', quantity: 0.035, unit: 'kg' },
        { childName: 'Ovos Caipiras Selecionados', quantity: 0.25, unit: 'Un' },
        { childName: 'Embalagem Individual Celofane + Tag Haru', quantity: 1, unit: 'Un' },
      ],
    },
    {
      parentName: 'Cookie Nutella & Leite Ninho',
      items: [
        { childName: 'Farinha de Trigo Especial Tipo 1', quantity: 0.045, unit: 'kg' },
        { childName: 'Manteiga Sem Sal Extra', quantity: 0.025, unit: 'kg' },
        { childName: 'Açúcar Cristal Orgânico', quantity: 0.02, unit: 'kg' },
        { childName: 'Nutella Original Ferrero', quantity: 0.03, unit: 'kg' },
        { childName: 'Gotas de Chocolate ao Leite Belga', quantity: 0.02, unit: 'kg' },
        { childName: 'Ovos Caipiras Selecionados', quantity: 0.25, unit: 'Un' },
        { childName: 'Embalagem Individual Celofane + Tag Haru', quantity: 1, unit: 'Un' },
      ],
    },
    {
      parentName: 'Cookie Red Velvet com Cream Cheese',
      items: [
        { childName: 'Farinha de Trigo Especial Tipo 1', quantity: 0.045, unit: 'kg' },
        { childName: 'Cacau em Pó 100% Black Alcalino', quantity: 0.005, unit: 'kg' },
        { childName: 'Manteiga Sem Sal Extra', quantity: 0.025, unit: 'kg' },
        { childName: 'Cream Cheese Philadelphia', quantity: 0.03, unit: 'kg' },
        { childName: 'Gotas de Chocolate Branco Velvet', quantity: 0.02, unit: 'kg' },
        { childName: 'Ovos Caipiras Selecionados', quantity: 0.25, unit: 'Un' },
        { childName: 'Embalagem Individual Celofane + Tag Haru', quantity: 1, unit: 'Un' },
      ],
    },
    {
      parentName: 'Cookie Doce de Leite & Flor de Sal',
      items: [
        { childName: 'Farinha de Trigo Especial Tipo 1', quantity: 0.045, unit: 'kg' },
        { childName: 'Manteiga Sem Sal Extra', quantity: 0.025, unit: 'kg' },
        { childName: 'Açúcar Mascavo Úmido', quantity: 0.02, unit: 'kg' },
        { childName: 'Doce de Leite Havanna Artesanal', quantity: 0.03, unit: 'kg' },
        { childName: 'Flor de Sal de Guérande', quantity: 0.001, unit: 'kg' },
        { childName: 'Ovos Caipiras Selecionados', quantity: 0.25, unit: 'Un' },
        { childName: 'Embalagem Individual Celofane + Tag Haru', quantity: 1, unit: 'Un' },
      ],
    },
    {
      parentName: 'Cookie Pistache Supremo & Choc Branco',
      items: [
        { childName: 'Farinha de Trigo Especial Tipo 1', quantity: 0.045, unit: 'kg' },
        { childName: 'Manteiga Sem Sal Extra', quantity: 0.025, unit: 'kg' },
        { childName: 'Pasta Pura de Pistache & Pistache Granulado', quantity: 0.03, unit: 'kg' },
        { childName: 'Gotas de Chocolate Branco Velvet', quantity: 0.025, unit: 'kg' },
        { childName: 'Ovos Caipiras Selecionados', quantity: 0.25, unit: 'Un' },
        { childName: 'Embalagem Individual Celofane + Tag Haru', quantity: 1, unit: 'Un' },
      ],
    },
    {
      parentName: 'Cookie Churros & Doce de Leite',
      items: [
        { childName: 'Farinha de Trigo Especial Tipo 1', quantity: 0.045, unit: 'kg' },
        { childName: 'Manteiga Sem Sal Extra', quantity: 0.025, unit: 'kg' },
        { childName: 'Açúcar Cristal Orgânico', quantity: 0.02, unit: 'kg' },
        { childName: 'Canela em Pó do Ceilão', quantity: 0.002, unit: 'kg' },
        { childName: 'Doce de Leite Havanna Artesanal', quantity: 0.025, unit: 'kg' },
        { childName: 'Ovos Caipiras Selecionados', quantity: 0.25, unit: 'Un' },
        { childName: 'Embalagem Individual Celofane + Tag Haru', quantity: 1, unit: 'Un' },
      ],
    },
    {
      parentName: 'Chocolate Quente Cremoso Belga 250ml',
      items: [
        { childName: 'Leite Integral Pasteurizado', quantity: 0.22, unit: 'L' },
        { childName: 'Gotas de Chocolate Belga 54% Callebaut', quantity: 0.04, unit: 'kg' },
        { childName: 'Cacau em Pó 100% Black Alcalino', quantity: 0.005, unit: 'kg' },
      ],
    },
    {
      parentName: 'Soda Italiana de Maçã Verde 400ml',
      items: [
        { childName: 'Xarope Natural de Maçã Verde', quantity: 0.04, unit: 'L' },
      ],
    },
    {
      parentName: 'Soda Italiana de Frutas Vermelhas 400ml',
      items: [
        { childName: 'Xarope Natural de Frutas Vermelhas', quantity: 0.04, unit: 'L' },
      ],
    },
  ];

  let totalRecipeItems = 0;
  for (const recipe of recipesData) {
    const parent = productsMap.get(recipe.parentName);
    if (!parent) continue;

    for (const item of recipe.items) {
      const child = insumosMap.get(item.childName);
      if (!child) continue;

      await prisma.recipeItem.create({
        data: {
          parentId: parent.id,
          childId: child.id,
          quantity: item.quantity,
          unit: item.unit,
        },
      });
      totalRecipeItems++;
    }
  }
  console.log(`✅ ${totalRecipeItems} Itens de Ficha Técnica (BOM) vinculados.\n`);

  // 6. Criação de Clientes Reais de Condomínio
  console.log('👥 Criando clientes realistas de condomínio...');
  const customersData = [
    { name: 'Camila Silveira', phone: '(11) 98765-4321', address: 'Torre A - Apto 142', observation: 'Adora os cookies de Pistache e Red Velvet. Pedir para interfonar.' },
    { name: 'Lucas Takahashi', phone: '(11) 99123-4567', address: 'Torre B - Apto 53', observation: 'Cliente VIP. Sempre pede fornada da tarde aos finais de semana.' },
    { name: 'Beatriz Lima', phone: '(11) 98234-5678', address: 'Torre C - Cobertura 221', observation: 'Entregar na porta de serviço. Sem contato (deixar na maçaneta).' },
    { name: 'Rodrigo Mendes', phone: '(11) 97345-6789', address: 'Bloco 1 - Apto 32', observation: 'Prefere receber bem quentinho para o lanche dos filhos.' },
    { name: 'Juliana Albuquerque', phone: '(11) 99456-7890', address: 'Bloco 2 - Apto 84', observation: 'Gosta com bastante recheio de Nutella.' },
    { name: 'Felipe Costa', phone: '(11) 98567-8901', address: 'Casa 12 - Alameda dos Ipês', observation: 'Portão preto ao lado da pracinha.' },
    { name: 'Mariana Prado', phone: '(11) 97678-9012', address: 'Torre A - Apto 91', observation: 'Chamar no WhatsApp antes de subir.' },
    { name: 'Gabriel Santana', phone: '(11) 99789-0123', address: 'Torre B - Apto 114', observation: 'Fã incondicional do Cookie Double Chocolate.' },
    { name: 'Fernanda Rocha', phone: '(11) 98890-1234', address: 'Bloco 3 - Apto 12', observation: 'Pede quase todos os domingos para a família toda.' },
    { name: 'Bruno Henrique', phone: '(11) 97901-2345', address: 'Torre C - Apto 74', observation: 'Deixar na portaria com Seu Zé se não atender.' },
    { name: 'Larissa Martins', phone: '(11) 99012-3456', address: 'Casa 08 - Alameda das Acácias', observation: 'Casa com jardim florido na frente.' },
    { name: 'Thiago Oliveira', phone: '(11) 98123-4567', address: 'Torre A - Apto 33', observation: 'Adiciona taxa de entrega de balcão (retira na cozinha).' },
    { name: 'Patricia Souza', phone: '(11) 97234-5678', address: 'Bloco 2 - Apto 101', observation: 'Pedir caixa kraft para presente com fita bonita.' },
    { name: 'Rafael Guimarães', phone: '(11) 99345-6789', address: 'Torre B - Apto 182', observation: 'Gosta do Cookie Doce de Leite com Flor de Sal.' },
    { name: 'Aline Nogueira', phone: '(11) 98456-7890', address: 'Torre C - Apto 15', observation: 'Entregar rápido para comer com a soda italiana.' },
    { name: 'Diego Ferreira', phone: '(11) 97567-8901', address: 'Casa 25 - Alameda dos Manacás', observation: 'Casa de esquina.' },
    { name: 'Isabela Carvalho', phone: '(11) 99678-9012', address: 'Bloco 1 - Apto 71', observation: 'Pede sempre 4 cookies variados em caixas kraft.' },
    { name: 'Marcelo Dias', phone: '(11) 98789-0123', address: 'Torre A - Apto 164', observation: 'Prefere pagamento via Pix na hora da entrega.' },
    { name: 'Renata Campos', phone: '(11) 97890-1234', address: 'Torre B - Apto 62', observation: 'Adora os chocolates quentes cremosos nos dias frios.' },
    { name: 'Vinicius Castro', phone: '(11) 99901-2345', address: 'Bloco 3 - Apto 43', observation: 'Avisa quando descer no hall do bloco.' },
    { name: 'Carolina Rezende', phone: '(11) 98012-3456', address: 'Torre C - Apto 111', observation: 'Excelente cliente, avalia sempre super bem.' },
    { name: 'Leandro Pires', phone: '(11) 97123-4567', address: 'Casa 04 - Alameda Central', observation: 'Entregar para os netos.' },
    { name: 'Vanessa Toledo', phone: '(11) 99234-5678', address: 'Torre A - Apto 52', observation: 'Sempre pede Cookies Tradicionais e Triplo Chocolate.' },
    { name: 'Eduardo Moreira', phone: '(11) 98345-6789', address: 'Bloco 2 - Apto 64', observation: 'Mora sozinho, pede 2 cookies e 1 soda.' },
    { name: 'Thais Peixoto', phone: '(11) 97456-7890', address: 'Torre B - Apto 133', observation: 'Costuma pedir à noite após as 19h.' },
    { name: 'Gustavo Borges', phone: '(11) 99567-8901', address: 'Casa 19 - Alameda dos Ipês', observation: 'Interfone sem fio, tocar com paciência.' },
    { name: 'Heloisa Fontes', phone: '(11) 98678-9012', address: 'Torre C - Apto 42', observation: 'Cliente antiga da Haru.' },
    { name: 'Leonardo Paiva', phone: '(11) 97789-0123', address: 'Bloco 1 - Apto 11', observation: 'Apartamento térreo com acesso fácil.' },
    { name: 'Tatiane Vasconcelos', phone: '(11) 99890-1234', address: 'Torre A - Apto 121', observation: 'Pede cookies para reuniões de trabalho em home office.' },
    { name: 'Guilherme Macedo', phone: '(11) 98901-2345', address: 'Torre B - Apto 81', observation: 'Gosta de provar todos os lançamentos sazonais.' },
  ];

  const createdCustomers: any[] = [];
  for (const c of customersData) {
    const customer = await prisma.customer.create({
      data: {
        name: c.name,
        phone: c.phone,
        address: c.address,
        observation: c.observation,
      },
    });
    createdCustomers.push(customer);
  }
  console.log(`✅ ${createdCustomers.length} Clientes criados.\n`);

  // 7. Entradas de Estoque Inicial dos Insumos (STOCK_IN)
  console.log('📦 Registrando estoque inicial dos insumos no ledger...');
  const initialStockInsumos = [
    { name: 'Farinha de Trigo Especial Tipo 1', qty: 60 },
    { name: 'Manteiga Sem Sal Extra', qty: 40 },
    { name: 'Açúcar Cristal Orgânico', qty: 35 },
    { name: 'Açúcar Mascavo Úmido', qty: 35 },
    { name: 'Gotas de Chocolate Belga 54% Callebaut', qty: 45 },
    { name: 'Gotas de Chocolate ao Leite Belga', qty: 35 },
    { name: 'Gotas de Chocolate Branco Velvet', qty: 30 },
    { name: 'Nutella Original Ferrero', qty: 30 },
    { name: 'Doce de Leite Havanna Artesanal', qty: 25 },
    { name: 'Pasta Pura de Pistache & Pistache Granulado', qty: 15 },
    { name: 'Cacau em Pó 100% Black Alcalino', qty: 20 },
    { name: 'Extrato Natural de Baunilha de Madagascar', qty: 8 },
    { name: 'Bicarbonato de Sódio Puro', qty: 10 },
    { name: 'Ovos Caipiras Selecionados', qty: 500 },
    { name: 'Flor de Sal de Guérande', qty: 5 },
    { name: 'Cream Cheese Philadelphia', qty: 20 },
    { name: 'Canela em Pó do Ceilão', qty: 5 },
    { name: 'Leite Integral Pasteurizado', qty: 60 },
    { name: 'Xarope Natural de Maçã Verde', qty: 15 },
    { name: 'Xarope Natural de Frutas Vermelhas', qty: 15 },
    { name: 'Embalagem Caixa Kraft Haru 4 Cookies', qty: 400 },
    { name: 'Embalagem Individual Celofane + Tag Haru', qty: 1200 },
  ];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 32);

  for (const item of initialStockInsumos) {
    const insumo = insumosMap.get(item.name);
    if (!insumo) continue;

    await prisma.ledgerEntry.create({
      data: {
        productId: insumo.id,
        quantity: item.qty,
        type: LedgerOperationType.STOCK_IN,
        createdAt: thirtyDaysAgo,
      },
    });
  }
  console.log('✅ Estoque inicial de insumos inserido no ledger.\n');

  // 8. Registro de Manufatura de Fornadas Passadas (MANUFACTURING_PRODUCTION & CONSUMPTION)
  console.log('🥣 Simulando fornadas e produções de cookies dos últimos 30 dias...');
  const sellableCookiesList = [
    'Cookie Clássico Gotas Belga 54%',
    'Cookie Double Chocolate Intenso',
    'Cookie Triplo Chocolate Belga',
    'Cookie Churros & Doce de Leite',
    'Cookie Red Velvet com Cream Cheese',
    'Cookie Nutella & Leite Ninho',
    'Cookie Doce de Leite & Flor de Sal',
    'Cookie Pistache Supremo & Choc Branco',
    'Cookie Dark & White Black Cacau',
    'Cookie Sazonal Cenoura & Brigadeiro',
  ];

  // Fornadas de 6 a 13 unidades de cada sabor distribuídas ao longo dos últimos 30 dias
  for (let d = 30; d >= 0; d--) {
    const prodDate = new Date();
    prodDate.setDate(prodDate.getDate() - d);
    prodDate.setHours(9, 30, 0, 0);

    for (const cookieName of sellableCookiesList) {
      const cookie = productsMap.get(cookieName);
      if (!cookie) continue;

      const batchSize = Math.floor(Math.random() * 8) + 6; // 6 a 13 cookies por sabor/dia

      // Entrada de produção do cookie acabado
      await prisma.ledgerEntry.create({
        data: {
          productId: cookie.id,
          quantity: batchSize,
          type: LedgerOperationType.MANUFACTURING_PRODUCTION,
          createdAt: prodDate,
        },
      });

      // Baixa estimada de insumo proporcional
      const farinha = insumosMap.get('Farinha de Trigo Especial Tipo 1');
      if (farinha) {
        await prisma.ledgerEntry.create({
          data: {
            productId: farinha.id,
            quantity: -(batchSize * 0.045),
            type: LedgerOperationType.MANUFACTURING_CONSUMPTION,
            createdAt: prodDate,
          },
        });
      }

      const manteiga = insumosMap.get('Manteiga Sem Sal Extra');
      if (manteiga) {
        await prisma.ledgerEntry.create({
          data: {
            productId: manteiga.id,
            quantity: -(batchSize * 0.025),
            type: LedgerOperationType.MANUFACTURING_CONSUMPTION,
            createdAt: prodDate,
          },
        });
      }

      const embalagem = insumosMap.get('Embalagem Individual Celofane + Tag Haru');
      if (embalagem) {
        await prisma.ledgerEntry.create({
          data: {
            productId: embalagem.id,
            quantity: -batchSize,
            type: LedgerOperationType.MANUFACTURING_CONSUMPTION,
            createdAt: prodDate,
          },
        });
      }
    }
  }

  // Estoque inicial das bebidas vendidas prontas
  const readyBeverages = [
    { name: 'Suco de Laranja Integral 300ml', qty: 80 },
    { name: 'Água Mineral San Pellegrino com Gás 500ml', qty: 90 },
    { name: 'Água Mineral sem Gás 500ml', qty: 100 },
    { name: 'Chá Gelado Artesanal de Pêssego & Hibisco 400ml', qty: 60 },
    { name: 'Chocolate Quente Cremoso Belga 250ml', qty: 70 },
    { name: 'Leite Gelado Aromatizado com Fava de Baunilha', qty: 50 },
    { name: 'Soda Italiana de Maçã Verde 400ml', qty: 60 },
    { name: 'Soda Italiana de Frutas Vermelhas 400ml', qty: 60 },
  ];

  for (const bev of readyBeverages) {
    const prod = productsMap.get(bev.name);
    if (!prod) continue;
    await prisma.ledgerEntry.create({
      data: {
        productId: prod.id,
        quantity: bev.qty,
        type: LedgerOperationType.STOCK_IN,
        createdAt: thirtyDaysAgo,
      },
    });
  }
  console.log('✅ Fornadas e bebidas registradas no ledger.\n');

  // 9. Geração de Histórico de Pedidos dos Últimos 30 Dias (COMPLETED)
  console.log('📊 Gerando pedidos históricos concluídos para alimentar Insights e Vendas...');
  const sellableProductsArray = Array.from(productsMap.values());
  let totalOrdersCompleted = 0;

  for (let dayOffset = 30; dayOffset >= 1; dayOffset--) {
    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() - dayOffset);
    const dayOfWeek = baseDate.getDay(); // 0: Dom, 1: Seg, ..., 5: Sex, 6: Sab

    // Maior movimento de quinta a domingo (5 a 8 pedidos/dia), menor no início da semana (2 a 4 pedidos/dia)
    let ordersCountForDay = Math.floor(Math.random() * 3) + 2;
    if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0) {
      ordersCountForDay = Math.floor(Math.random() * 4) + 5;
    }

    for (let o = 0; o < ordersCountForDay; o++) {
      // Horários realistas de pico: tarde (14:00 - 17:30) e noite (18:30 - 21:00)
      const isNight = Math.random() > 0.45;
      const hour = isNight
        ? 18 + Math.floor(Math.random() * 3)
        : 14 + Math.floor(Math.random() * 4);
      const minute = Math.floor(Math.random() * 60);

      const orderDate = new Date(baseDate);
      orderDate.setHours(hour, minute, Math.floor(Math.random() * 60), 0);

      // Escolhe cliente aleatório
      const customer = createdCustomers[Math.floor(Math.random() * createdCustomers.length)];

      // Escolhe 1 a 4 produtos aleatórios
      const numItems = Math.floor(Math.random() * 3) + 1;
      const selectedItems: Array<{ product: any; quantity: number }> = [];
      const usedProducts = new Set<string>();

      for (let i = 0; i < numItems; i++) {
        let p = sellableProductsArray[Math.floor(Math.random() * sellableProductsArray.length)];
        // Dando preferência leve para cookies campeões de venda
        if (Math.random() < 0.4) {
          p = productsMap.get('Cookie Clássico Gotas Belga 54%') || p;
        } else if (Math.random() < 0.3) {
          p = productsMap.get('Cookie Nutella & Leite Ninho') || p;
        } else if (Math.random() < 0.25) {
          p = productsMap.get('Cookie Pistache Supremo & Choc Branco') || p;
        }

        if (!usedProducts.has(p.id)) {
          usedProducts.add(p.id);
          const qty = Math.floor(Math.random() * 2) + 1; // 1 ou 2 unidades por item
          selectedItems.push({ product: p, quantity: qty });
        }
      }

      if (selectedItems.length === 0) continue;

      const totalPrice = selectedItems.reduce(
        (acc, item) => acc + item.quantity * Number(item.product.price),
        0
      );

      const deliveryOptions = [0, 2.0, 2.0, 2.0, 5.0];
      const deliveryFee = deliveryOptions[Math.floor(Math.random() * deliveryOptions.length)];

      // Criação do Pedido
      const order = await prisma.order.create({
        data: {
          customerId: customer.id,
          status: OrderStatus.COMPLETED,
          totalPrice: totalPrice,
          deliveryFee: deliveryFee,
          address: customer.address || 'Retirada no Balcão',
          createdAt: orderDate,
          updatedAt: orderDate,
          acknowledgedAt: orderDate,
          items: {
            create: selectedItems.map((it) => ({
              productId: it.product.id,
              quantity: it.quantity,
              unitPrice: it.product.price,
            })),
          },
        },
      });

      // Criação do Registro de Venda (Sale)
      await prisma.sale.create({
        data: {
          orderId: order.id,
          createdAt: orderDate,
        },
      });

      // Registro de Baixa de Venda no Ledger (SALE)
      for (const it of selectedItems) {
        await prisma.ledgerEntry.create({
          data: {
            productId: it.product.id,
            quantity: -it.quantity,
            type: LedgerOperationType.SALE,
            orderId: order.id,
            createdAt: orderDate,
          },
        });
      }

      totalOrdersCompleted++;
    }
  }
  console.log(`✅ ${totalOrdersCompleted} Pedidos Concluídos gerados com vendas e ledger.\n`);

  // 10. Geração de Pedidos Ativos para o Kanban (Hoje / Tempo Real)
  console.log('📌 Criando pedidos ativos para o Board Kanban (DRAFT, PENDING, READY, CANCELLED)...');

  const now = new Date();

  // A. Pedidos em Produção (PENDING)
  const pendingData = [
    {
      customer: createdCustomers[0],
      items: [
        { product: productsMap.get('Cookie Pistache Supremo & Choc Branco'), qty: 2 },
        { product: productsMap.get('Soda Italiana de Frutas Vermelhas 400ml'), qty: 1 },
      ],
      deliveryFee: 2.0,
      minutesAgo: 15,
    },
    {
      customer: createdCustomers[1],
      items: [
        { product: productsMap.get('Cookie Nutella & Leite Ninho'), qty: 2 },
        { product: productsMap.get('Cookie Double Chocolate Intenso'), qty: 2 },
      ],
      deliveryFee: 2.0,
      minutesAgo: 25,
    },
    {
      customer: createdCustomers[2],
      items: [
        { product: productsMap.get('Cookie Red Velvet com Cream Cheese'), qty: 3 },
        { product: productsMap.get('Chocolate Quente Cremoso Belga 250ml'), qty: 1 },
      ],
      deliveryFee: 5.0,
      minutesAgo: 35,
    },
    {
      customer: createdCustomers[3],
      items: [
        { product: productsMap.get('Cookie Clássico Gotas Belga 54%'), qty: 4 },
      ],
      deliveryFee: 0.0,
      minutesAgo: 8,
    },
  ];

  for (const p of pendingData) {
    const orderTime = new Date(now.getTime() - p.minutesAgo * 60000);
    const totalPrice = p.items.reduce(
      (acc, it) => acc + it.qty * Number(it.product.price),
      0
    );

    const order = await prisma.order.create({
      data: {
        customerId: p.customer.id,
        status: OrderStatus.PENDING,
        totalPrice,
        deliveryFee: p.deliveryFee,
        address: p.customer.address,
        createdAt: orderTime,
        updatedAt: orderTime,
        items: {
          create: p.items.map((it) => ({
            productId: it.product.id,
            quantity: it.qty,
            unitPrice: it.product.price,
          })),
        },
      },
    });

    // Reserva no ledger
    for (const it of p.items) {
      await prisma.ledgerEntry.create({
        data: {
          productId: it.product.id,
          quantity: -it.qty,
          type: LedgerOperationType.RESERVE,
          orderId: order.id,
          createdAt: orderTime,
        },
      });
    }
  }

  // B. Pedidos Prontos (READY)
  const readyData = [
    {
      customer: createdCustomers[4],
      items: [
        { product: productsMap.get('Cookie Doce de Leite & Flor de Sal'), qty: 2 },
        { product: productsMap.get('Leite Gelado Aromatizado com Fava de Baunilha'), qty: 1 },
      ],
      deliveryFee: 2.0,
      minutesAgo: 45,
    },
    {
      customer: createdCustomers[5],
      items: [
        { product: productsMap.get('Cookie Triplo Chocolate Belga'), qty: 2 },
        { product: productsMap.get('Cookie Churros & Doce de Leite'), qty: 2 },
      ],
      deliveryFee: 2.0,
      minutesAgo: 50,
    },
    {
      customer: createdCustomers[6],
      items: [
        { product: productsMap.get('Cookie Sazonal Cenoura & Brigadeiro'), qty: 2 },
        { product: productsMap.get('Suco de Laranja Integral 300ml'), qty: 1 },
      ],
      deliveryFee: 0.0,
      minutesAgo: 20,
    },
  ];

  for (const r of readyData) {
    const orderTime = new Date(now.getTime() - r.minutesAgo * 60000);
    const totalPrice = r.items.reduce(
      (acc, it) => acc + it.qty * Number(it.product.price),
      0
    );

    const order = await prisma.order.create({
      data: {
        customerId: r.customer.id,
        status: OrderStatus.READY,
        totalPrice,
        deliveryFee: r.deliveryFee,
        address: r.customer.address,
        createdAt: orderTime,
        updatedAt: orderTime,
        items: {
          create: r.items.map((it) => ({
            productId: it.product.id,
            quantity: it.qty,
            unitPrice: it.product.price,
          })),
        },
      },
    });

    for (const it of r.items) {
      await prisma.ledgerEntry.create({
        data: {
          productId: it.product.id,
          quantity: -it.qty,
          type: LedgerOperationType.RESERVE,
          orderId: order.id,
          createdAt: orderTime,
        },
      });
    }
  }

  // C. Pedidos em Rascunho (DRAFT)
  const draftData = [
    {
      customer: createdCustomers[7],
      items: [
        { product: productsMap.get('Cookie Clássico Gotas Belga 54%'), qty: 1 },
        { product: productsMap.get('Cookie Dark & White Black Cacau'), qty: 1 },
      ],
      deliveryFee: 2.0,
      minutesAgo: 5,
    },
    {
      customer: createdCustomers[8],
      items: [
        { product: productsMap.get('Cookie Pistache Supremo & Choc Branco'), qty: 1 },
      ],
      deliveryFee: 2.0,
      minutesAgo: 2,
    },
  ];

  for (const d of draftData) {
    const orderTime = new Date(now.getTime() - d.minutesAgo * 60000);
    const totalPrice = d.items.reduce(
      (acc, it) => acc + it.qty * Number(it.product.price),
      0
    );

    const order = await prisma.order.create({
      data: {
        customerId: d.customer.id,
        status: OrderStatus.DRAFT,
        totalPrice,
        deliveryFee: d.deliveryFee,
        address: d.customer.address,
        createdAt: orderTime,
        updatedAt: orderTime,
        items: {
          create: d.items.map((it) => ({
            productId: it.product.id,
            quantity: it.qty,
            unitPrice: it.product.price,
          })),
        },
      },
    });

    for (const it of d.items) {
      await prisma.ledgerEntry.create({
        data: {
          productId: it.product.id,
          quantity: -it.qty,
          type: LedgerOperationType.RESERVE,
          orderId: order.id,
          createdAt: orderTime,
        },
      });
    }
  }

  // D. Pedidos Cancelados (CANCELLED)
  const cancelledData = [
    {
      customer: createdCustomers[9],
      items: [
        { product: productsMap.get('Cookie Nutella & Leite Ninho'), qty: 3 },
      ],
      deliveryFee: 2.0,
      hoursAgo: 4,
    },
    {
      customer: createdCustomers[10],
      items: [
        { product: productsMap.get('Cookie Churros & Doce de Leite'), qty: 2 },
      ],
      deliveryFee: 2.0,
      hoursAgo: 18,
    },
  ];

  for (const c of cancelledData) {
    const orderTime = new Date(now.getTime() - c.hoursAgo * 3600000);
    const totalPrice = c.items.reduce(
      (acc, it) => acc + it.qty * Number(it.product.price),
      0
    );

    const order = await prisma.order.create({
      data: {
        customerId: c.customer.id,
        status: OrderStatus.CANCELLED,
        totalPrice,
        deliveryFee: c.deliveryFee,
        address: c.customer.address,
        createdAt: orderTime,
        updatedAt: orderTime,
        items: {
          create: c.items.map((it) => ({
            productId: it.product.id,
            quantity: it.qty,
            unitPrice: it.product.price,
          })),
        },
      },
    });

    // Reserva e liberação subsequente no ledger
    for (const it of c.items) {
      await prisma.ledgerEntry.create({
        data: {
          productId: it.product.id,
          quantity: -it.qty,
          type: LedgerOperationType.RESERVE,
          orderId: order.id,
          createdAt: orderTime,
        },
      });
      await prisma.ledgerEntry.create({
        data: {
          productId: it.product.id,
          quantity: it.qty,
          type: LedgerOperationType.RELEASE,
          orderId: order.id,
          createdAt: orderTime,
        },
      });
    }
  }

  console.log('✅ Pedidos ativos (DRAFT, PENDING, READY, CANCELLED) criados no Kanban!\n');

  console.log('🎉 [Haru Control] Seed concluído com sucesso!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`• Categorias criadas: 5`);
  console.log(`• Insumos cadastrados: ${insumosMap.size}`);
  console.log(`• Cookies & Bebidas artesanais: ${productsMap.size}`);
  console.log(`• Fichas Técnicas (BOM): ${totalRecipeItems} ingredientes vinculados`);
  console.log(`• Clientes de condomínio: ${createdCustomers.length}`);
  console.log(`• Pedidos Concluídos (30 dias): ${totalOrdersCompleted}`);
  console.log(`• Pedidos Ativos no Kanban: 4 em Produção, 3 Prontos, 2 Rascunhos, 2 Cancelados`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Erro durante a execução do seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
