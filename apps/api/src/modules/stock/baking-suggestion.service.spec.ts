import { BakingSuggestionService } from "./baking-suggestion.service";
import { OrderStatus } from "@prisma/client";

describe("BakingSuggestionService", () => {
  let service: BakingSuggestionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      product: {
        findMany: jest.fn(),
      },
      ledgerEntry: {
        groupBy: jest.fn(),
      },
    };
    service = new BakingSuggestionService(mockPrisma);
  });

  it("BUG-011: não deve diluir a média por 10 quando a loja só possui 1 semana de histórico", async () => {
    // Simula: Início em 2026-09-28 (segunda-feira) e término em 2026-10-02 (sexta-feira) - 5 dias úteis
    const startDate = "2026-09-28";
    const targetDate = "2026-10-02";

    // Primeiro pedido da loja foi em 2026-09-21 (exatamente 7 dias atrás - 1 semana de histórico)
    mockPrisma.order.findFirst.mockResolvedValue({
      createdAt: new Date("2026-09-21T10:00:00.000Z"),
    });

    // Pedidos da última semana: 6 cookies vendidos por dia
    // 2026-09-21 (seg): 6 un
    // 2026-09-22 (ter): 6 un
    // 2026-09-23 (qua): 6 un
    // 2026-09-24 (qui): 6 un
    // 2026-09-25 (sex): 6 un
    const mockOrders = [
      {
        id: "order-1",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-21T14:00:00.000Z"),
        items: [{ productId: "cookie-tradicional", quantity: 6 }],
      },
      {
        id: "order-2",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-22T14:00:00.000Z"),
        items: [{ productId: "cookie-tradicional", quantity: 6 }],
      },
      {
        id: "order-3",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-23T14:00:00.000Z"),
        items: [{ productId: "cookie-tradicional", quantity: 6 }],
      },
      {
        id: "order-4",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-24T14:00:00.000Z"),
        items: [{ productId: "cookie-tradicional", quantity: 6 }],
      },
      {
        id: "order-5",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-25T14:00:00.000Z"),
        items: [{ productId: "cookie-tradicional", quantity: 6 }],
      },
    ];

    mockPrisma.order.findMany.mockResolvedValue(mockOrders);

    // Produto vendável: Cookie Tradicional
    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: "cookie-tradicional",
        name: "Cookie Tradicional",
        isSellable: true,
        unit: "un",
        createdAt: new Date("2026-09-20T00:00:00.000Z"),
        category: { name: "Cookies" },
        subcategory: { name: "Clássicos" },
        recipeItems: [],
      },
    ]);

    // Estoque atual: 7 cookies
    mockPrisma.ledgerEntry.groupBy.mockResolvedValue([
      {
        productId: "cookie-tradicional",
        _sum: { quantity: 7 },
      },
    ]);

    const result = await service.getBakingSuggestion(startDate, targetDate, 0.1);

    expect(result.items.length).toBe(1);
    const item = result.items[0];

    // Cada um dos 5 dias deve prever exatamente 6 cookies (pois weightSum = 4 e weightedSum = 24 -> 24 / 4 = 6)
    for (const day of item.dailyForecast) {
      expect(day.predictedSales).toBe(6);
    }

    // Demanda acumulada de 5 dias = 5 * 6 = 30 cookies (+10% de margem = 33 cookies)
    expect(item.totalDemand).toBe(33);

    // Estoque atual de 7 cookies deve resultar em 33 - 7 = 26 cookies sugeridos a assar (e NUNCA 7!)
    expect(item.currentStock).toBe(7);
    expect(item.netNeeded).toBe(26);
    expect(item.suggestedBake).toBe(26);
  });

  it("deve buscar pedidos por createdAt e contabilizar pedidos com completedAt nulo", async () => {
    const startDate = "2026-09-28";
    const targetDate = "2026-09-28"; // Apenas segunda-feira

    mockPrisma.order.findFirst.mockResolvedValue({
      createdAt: new Date("2026-09-21T00:00:00.000Z"),
    });

    // Pedido criado na segunda passada mas com completedAt nulo (retroativo/batch)
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "order-retroactive",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-21T18:00:00.000Z"),
        completedAt: null,
        items: [{ productId: "cookie-nutella", quantity: 8 }],
      },
    ]);

    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: "cookie-nutella",
        name: "Cookie de Nutella",
        isSellable: true,
        unit: "un",
        createdAt: new Date("2026-09-20T00:00:00.000Z"),
        recipeItems: [],
      },
    ]);

    mockPrisma.ledgerEntry.groupBy.mockResolvedValue([
      {
        productId: "cookie-nutella",
        _sum: { quantity: 2 },
      },
    ]);

    const result = await service.getBakingSuggestion(startDate, targetDate, 0.1);
    const item = result.items[0];

    // A query do Prisma deve ter sido chamada com createdAt: { gte: ... }
    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: OrderStatus.COMPLETED,
          createdAt: expect.any(Object),
        }),
      })
    );

    // Previsão para a segunda-feira: 8 cookies
    expect(item.dailyForecast[0].predictedSales).toBe(8);
    // Demanda com 10%: ceil(8 * 1.1) = 9
    // Necessidade líquida: 9 - 2 = 7 cookies a assar
    expect(item.suggestedBake).toBe(7);
  });

  it("deve ponderar corretamente quando há 4 semanas completas de histórico", async () => {
    const startDate = "2026-09-28";
    const targetDate = "2026-09-28"; // Segunda-feira

    // Loja existe há mais de 40 dias
    mockPrisma.order.findFirst.mockResolvedValue({
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    });

    // 4 segundas-feiras passadas:
    // w=1 (2026-09-21): 10 cookies (peso 4)
    // w=2 (2026-09-14): 8 cookies (peso 3)
    // w=3 (2026-09-07): 6 cookies (peso 2)
    // w=4 (2026-08-31): 4 cookies (peso 1)
    // weightedSum = 10*4 + 8*3 + 6*2 + 4*1 = 40 + 24 + 12 + 4 = 80
    // weightSum = 4 + 3 + 2 + 1 = 10
    // predicted = 80 / 10 = 8.00
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "w1",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-21T15:00:00.000Z"),
        items: [{ productId: "cookie-1", quantity: 10 }],
      },
      {
        id: "w2",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-14T15:00:00.000Z"),
        items: [{ productId: "cookie-1", quantity: 8 }],
      },
      {
        id: "w3",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-07T15:00:00.000Z"),
        items: [{ productId: "cookie-1", quantity: 6 }],
      },
      {
        id: "w4",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-08-31T15:00:00.000Z"),
        items: [{ productId: "cookie-1", quantity: 4 }],
      },
    ]);

    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: "cookie-1",
        name: "Cookie 1",
        isSellable: true,
        unit: "un",
        createdAt: new Date("2026-08-01T00:00:00.000Z"),
        recipeItems: [],
      },
    ]);

    mockPrisma.ledgerEntry.groupBy.mockResolvedValue([
      {
        productId: "cookie-1",
        _sum: { quantity: 0 },
      },
    ]);

    const result = await service.getBakingSuggestion(startDate, targetDate, 0.1);
    const item = result.items[0];

    expect(item.dailyForecast[0].predictedSales).toBe(8);
    // Demanda = 8 * 1.1 = 8.8 -> ceil(8.8) = 9
    expect(item.suggestedBake).toBe(9);
  });

  it("deve sugerir 0 quando o estoque atual for suficiente para cobrir toda a demanda", async () => {
    const startDate = "2026-09-28";
    const targetDate = "2026-09-28";

    mockPrisma.order.findFirst.mockResolvedValue({
      createdAt: new Date("2026-09-21T00:00:00.000Z"),
    });

    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "w1",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-21T15:00:00.000Z"),
        items: [{ productId: "cookie-1", quantity: 5 }],
      },
    ]);

    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: "cookie-1",
        name: "Cookie 1",
        isSellable: true,
        unit: "un",
        createdAt: new Date("2026-09-20T00:00:00.000Z"),
        recipeItems: [],
      },
    ]);

    // Estoque de 20 cookies (muito acima da demanda de ~6)
    mockPrisma.ledgerEntry.groupBy.mockResolvedValue([
      {
        productId: "cookie-1",
        _sum: { quantity: 20 },
      },
    ]);

    const result = await service.getBakingSuggestion(startDate, targetDate, 0.1);
    const item = result.items[0];

    expect(item.currentStock).toBe(20);
    expect(item.netNeeded).toBe(0);
    expect(item.suggestedBake).toBe(0);
  });

  it("deve sempre arredondar a demanda e a sugestão de fornada para cima (Math.ceil)", async () => {
    const startDate = "2026-09-28";
    const targetDate = "2026-09-28";

    mockPrisma.order.findFirst.mockResolvedValue({
      createdAt: new Date("2026-09-21T00:00:00.000Z"),
    });

    // 4 cookies vendidos na segunda passada
    mockPrisma.order.findMany.mockResolvedValue([
      {
        id: "w1",
        status: OrderStatus.COMPLETED,
        createdAt: new Date("2026-09-21T15:00:00.000Z"),
        items: [{ productId: "cookie-1", quantity: 4 }],
      },
    ]);

    mockPrisma.product.findMany.mockResolvedValue([
      {
        id: "cookie-1",
        name: "Cookie 1",
        isSellable: true,
        unit: "un",
        createdAt: new Date("2026-09-20T00:00:00.000Z"),
        recipeItems: [],
      },
    ]);

    // Estoque: 1 cookie
    // Previsão = 4.00 un
    // Demanda com 10%: 4 * 1.1 = 4.4 un -> Arredondado pra cima = 5 un!
    // Sugestão a assar: 5 - 1 = 4 un!
    mockPrisma.ledgerEntry.groupBy.mockResolvedValue([
      {
        productId: "cookie-1",
        _sum: { quantity: 1 },
      },
    ]);

    const result = await service.getBakingSuggestion(startDate, targetDate, 0.1);
    const item = result.items[0];

    expect(item.totalDemand).toBe(5); // 4.4 arredondado para cima é 5
    expect(item.suggestedBake).toBe(4); // 5 - 1 = 4
  });
});
