import { BadRequestException, NotFoundException } from "@nestjs/common";
import { ProductsService } from "./products.service";
import { StockService } from "../stock/stock.service";
import { ManufacturingService } from "../manufacturing/manufacturing.service";

describe("ProductsService, StockService & ManufacturingService — Receitas e Peso/Rendimento (BOM)", () => {
  let productsService: ProductsService;
  let stockService: StockService;
  let manufacturingService: ManufacturingService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      product: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      recipeItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      ledgerEntry: {
        create: jest.fn(),
        aggregate: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    productsService = new ProductsService(mockPrisma);
    stockService = new StockService(mockPrisma);
    manufacturingService = new ManufacturingService(mockPrisma);
  });

  it("deve criar e atualizar um produto com peso/rendimento equivalente (ex: 1 Massa = 1600g)", async () => {
    mockPrisma.product.create.mockImplementation(({ data }: any) => Promise.resolve({ id: "massa-1", ...data }));

    const created = await productsService.create({
      name: "Massa Tradicional",
      unit: "un",
      price: 32,
      recipeYield: 1600,
      recipeYieldUnit: "gramas",
    });

    expect(created.recipeYield).toBe(1600);
    expect(created.recipeYieldUnit).toBe("g");
  });

  it("deve permitir adicionar 60g de uma Massa cadastrada em 'un' quando ela possui recipeYield = 1600g", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "massa-1",
      name: "Massa Tradicional",
      unit: "un",
      recipeYield: 1600,
      recipeYieldUnit: "g",
    });
    mockPrisma.recipeItem.findUnique.mockResolvedValue(null);
    mockPrisma.recipeItem.create.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: "ri-1", ...data })
    );

    const item = await productsService.addRecipeItem("cookie-1", {
      childId: "massa-1",
      quantity: 60,
      unit: "g",
    });

    expect(item.quantity).toBe(60);
    expect(item.unit).toBe("g");
  });

  it("deve rejeitar usar 'g' para um produto em 'un' que NÃO possui recipeYield definido", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "embalagem-1",
      name: "Caixa Kraft",
      unit: "un",
      recipeYield: null,
      recipeYieldUnit: null,
    });

    await expect(
      productsService.addRecipeItem("cookie-1", {
        childId: "embalagem-1",
        quantity: 60,
        unit: "g",
      })
    ).rejects.toThrow(BadRequestException);
  });

  it("deve editar um ingrediente existente na receita (updateRecipeItem) alterando quantidade e unidade", async () => {
    mockPrisma.recipeItem.findUnique.mockResolvedValue({
      id: "ri-1",
      parentId: "cookie-1",
      childId: "massa-1",
      quantity: 1,
      unit: "un",
    });

    mockPrisma.product.findUnique.mockResolvedValue({
      id: "massa-1",
      name: "Massa Tradicional",
      unit: "un",
      recipeYield: 1600,
      recipeYieldUnit: "g",
    });

    mockPrisma.recipeItem.update.mockImplementation(({ data }: any) =>
      Promise.resolve({ id: "ri-1", parentId: "cookie-1", ...data })
    );

    const updated = await productsService.updateRecipeItem("cookie-1", "ri-1", {
      quantity: 60,
      unit: "g",
    });

    expect(updated.quantity).toBe(60);
    expect(updated.unit).toBe("g");
  });

  it("deve lançar NotFoundException ao tentar editar item de receita inexistente ou de outro produto", async () => {
    mockPrisma.recipeItem.findUnique.mockResolvedValue(null);

    await expect(
      productsService.updateRecipeItem("cookie-1", "ri-inexistente", { quantity: 50 })
    ).rejects.toThrow(NotFoundException);
  });

  it("deve calcular o custo do Cookie proporcionalmente quando usa 60g de uma Massa de 1600g (R$ 32,00)", () => {
    const cookieWithMassa = {
      id: "cookie-1",
      name: "Cookie Clássico",
      unit: "un",
      price: 14,
      recipeItems: [
        {
          quantity: 60,
          unit: "g",
          child: {
            id: "massa-1",
            name: "Massa Tradicional",
            unit: "un",
            price: 32, // R$ 32,00 por batelada de 1600g
            recipeYield: 1600,
            recipeYieldUnit: "g",
          },
        },
        {
          quantity: 30,
          unit: "g",
          child: {
            id: "choc-1",
            name: "Gotas de Chocolate Belga",
            unit: "kg",
            price: 80, // R$ 80,00 por kg -> 30g = R$ 2,40
          },
        },
      ],
    };

    // 60g / 1600g * 32 = R$ 1,20 + 0.03kg * 80 = R$ 2,40 -> Total = R$ 3,60
    const cost = stockService.calculateProductCost(cookieWithMassa);
    expect(cost).toBe(3.6);
  });

  it("deve dar baixa proporcional correta no estoque ao produzir 10 Cookies que usam 60g de Massa (1600g)", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "cookie-1",
      name: "Cookie Clássico",
      unit: "un",
      recipeYield: null,
      recipeYieldUnit: null,
      recipeItems: [
        {
          childId: "massa-1",
          quantity: 60,
          unit: "g",
          child: {
            id: "massa-1",
            name: "Massa Tradicional",
            unit: "un",
            recipeYield: 1600,
            recipeYieldUnit: "g",
          },
        },
      ],
    });

    mockPrisma.ledgerEntry.aggregate.mockResolvedValue({
      _sum: { quantity: 2 },
    });

    const createdLedgerEntries: any[] = [];
    mockPrisma.ledgerEntry.create.mockImplementation(({ data }: any) => {
      createdLedgerEntries.push(data);
      return Promise.resolve(data);
    });

    // Produzir 10 cookies -> 10 * (60 / 1600) = 0.375 un de Massa consumida
    const res = await manufacturingService.produce({
      productId: "cookie-1",
      quantity: 10,
    });

    expect(res.success).toBe(true);
    expect(createdLedgerEntries).toHaveLength(2);
    expect(createdLedgerEntries[0]).toEqual({
      productId: "massa-1",
      quantity: -0.375,
      type: "MANUFACTURING_CONSUMPTION",
    });
    expect(createdLedgerEntries[1]).toEqual({
      productId: "cookie-1",
      quantity: 10,
      type: "MANUFACTURING_PRODUCTION",
    });
  });

  it("StockService.addStock: deve registrar STOCK_IN simples quando o produto não possui receita", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "farinha-1",
      name: "Farinha de Trigo",
      unit: "kg",
      recipeItems: [],
    });

    const createdEntries: any[] = [];
    mockPrisma.ledgerEntry.create.mockImplementation(({ data }: any) => {
      createdEntries.push(data);
      return Promise.resolve(data);
    });

    const res = await stockService.addStock("farinha-1", 5, "Compra fornecedor");

    expect(res.success).toBe(true);
    expect(createdEntries).toHaveLength(1);
    expect(createdEntries[0]).toEqual({
      productId: "farinha-1",
      quantity: 5,
      type: "STOCK_IN",
      notes: "Compra fornecedor",
    });
  });

  it("StockService.addStock: deve consumir automaticamente insumos da receita (MANUFACTURING_CONSUMPTION) e produzir o cookie (MANUFACTURING_PRODUCTION)", async () => {
    mockPrisma.product.findUnique.mockResolvedValue({
      id: "cookie-1",
      name: "Cookie Clássico",
      unit: "un",
      recipeYield: null,
      recipeYieldUnit: null,
      recipeItems: [
        {
          childId: "massa-1",
          quantity: 60,
          unit: "g",
          child: {
            id: "massa-1",
            name: "Massa Tradicional",
            unit: "un",
            recipeYield: 1600,
            recipeYieldUnit: "g",
          },
        },
        {
          childId: "gotas-1",
          quantity: 20,
          unit: "g",
          child: {
            id: "gotas-1",
            name: "Gotas de Chocolate",
            unit: "kg",
          },
        },
      ],
    });

    mockPrisma.ledgerEntry.aggregate.mockResolvedValue({
      _sum: { quantity: 10 },
    });

    const createdEntries: any[] = [];
    mockPrisma.ledgerEntry.create.mockImplementation(({ data }: any) => {
      createdEntries.push(data);
      return Promise.resolve(data);
    });

    const res = await stockService.addStock("cookie-1", 10, "Fornada da manhã");

    expect(res.success).toBe(true);
    expect(createdEntries).toHaveLength(3);

    // Consumo da Massa: 10 * (60 / 1600) = 0.375 un
    expect(createdEntries[0].productId).toBe("massa-1");
    expect(createdEntries[0].quantity).toBe(-0.375);
    expect(createdEntries[0].type).toBe("MANUFACTURING_CONSUMPTION");

    // Consumo das Gotas: 10 * (20g / 1000) = 0.2 kg
    expect(createdEntries[1].productId).toBe("gotas-1");
    expect(createdEntries[1].quantity).toBe(-0.2);
    expect(createdEntries[1].type).toBe("MANUFACTURING_CONSUMPTION");

    // Produção do Cookie: +10 un
    expect(createdEntries[2].productId).toBe("cookie-1");
    expect(createdEntries[2].quantity).toBe(10);
    expect(createdEntries[2].type).toBe("MANUFACTURING_PRODUCTION");
  });

  it("StockService.addStockBatch: deve processar múltiplos itens no lote consumindo receitas e insumos simples", async () => {
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: "cookie-1",
        name: "Cookie Clássico",
        unit: "un",
        recipeItems: [
          {
            childId: "massa-1",
            quantity: 60,
            unit: "g",
            child: {
              id: "massa-1",
              name: "Massa Tradicional",
              unit: "un",
              recipeYield: 1600,
              recipeYieldUnit: "g",
            },
          },
        ],
      },
      {
        id: "refri-1",
        name: "Refrigerante Lata",
        unit: "un",
        recipeItems: [],
      },
    ]);

    mockPrisma.ledgerEntry.aggregate.mockResolvedValue({
      _sum: { quantity: 5 },
    });

    const createdEntries: any[] = [];
    mockPrisma.ledgerEntry.create.mockImplementation(({ data }: any) => {
      createdEntries.push(data);
      return Promise.resolve(data);
    });

    const res = await stockService.addStockBatch(
      [
        { productId: "cookie-1", quantity: 20 },
        { productId: "refri-1", quantity: 12 },
      ],
      "Fornada e reposição"
    );

    expect(res.success).toBe(true);
    expect(createdEntries).toHaveLength(3);

    // Consumo da Massa do Cookie: 20 * (60 / 1600) = 0.75 un
    expect(createdEntries[0]).toMatchObject({
      productId: "massa-1",
      quantity: -0.75,
      type: "MANUFACTURING_CONSUMPTION",
    });

    // Produção do Cookie: +20 un
    expect(createdEntries[1]).toMatchObject({
      productId: "cookie-1",
      quantity: 20,
      type: "MANUFACTURING_PRODUCTION",
    });

    // Entrada simples do Refrigerante (sem receita): +12 un
    expect(createdEntries[2]).toMatchObject({
      productId: "refri-1",
      quantity: 12,
      type: "STOCK_IN",
    });
  });
});

