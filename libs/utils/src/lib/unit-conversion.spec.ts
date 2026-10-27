import {
  areProductUnitsCompatible,
  getCompatibleUnitsForProduct,
  convertProductQuantity,
  getParentRecipeBatchFactor,
  convertQuantityBetweenUnits,
} from './unit-conversion';

describe('Unit Conversion & Recipe Yield (Massa / Pacotes)', () => {
  const massaEmUnidades = {
    unit: 'un',
    recipeYield: 1600,
    recipeYieldUnit: 'g',
  };

  const massaEmGramas = {
    unit: 'g',
    recipeYield: 1600,
    recipeYieldUnit: 'g',
  };

  const farinhaEmKg = {
    unit: 'kg',
    recipeYield: null,
    recipeYieldUnit: null,
  };

  it('deve permitir usar gramas (ex: 60g) para uma Massa cadastrada em unidades com peso de 1600g', () => {
    expect(areProductUnitsCompatible('g', massaEmUnidades)).toBe(true);
    expect(areProductUnitsCompatible('kg', massaEmUnidades)).toBe(true);
    expect(areProductUnitsCompatible('un', massaEmUnidades)).toBe(true);

    const units = getCompatibleUnitsForProduct(massaEmUnidades).map((u) => u.value);
    expect(units).toContain('g');
    expect(units).toContain('kg');
    expect(units).toContain('un');

    // 60g de uma massa de 1600g = 0.0375 un
    const converted = convertProductQuantity(60, 'g', massaEmUnidades);
    expect(converted).toBe(0.0375);
  });

  it('deve calcular corretamente o fator de batelada quando a Massa está em gramas com rendimento de 1600g', () => {
    expect(getParentRecipeBatchFactor(massaEmGramas)).toBe(1600);
    expect(getParentRecipeBatchFactor(massaEmUnidades)).toBe(1);
    expect(convertProductQuantity(60, 'g', massaEmGramas)).toBe(60);
    expect(convertProductQuantity(1, 'un', massaEmGramas)).toBe(1600);
  });

  it('deve converter compras de Farinha em pacotes de 1kg, 5kg ou 500g para a unidade de estoque', () => {
    expect(convertProductQuantity(1, 'kg', farinhaEmKg)).toBe(1);
    expect(convertProductQuantity(5, 'kg', farinhaEmKg)).toBe(5);
    expect(convertProductQuantity(500, 'g', farinhaEmKg)).toBe(0.5);
    expect(convertProductQuantity(45, 'g', farinhaEmKg)).toBe(0.045);
  });

  it('deve converter quantidades fluidamente entre unidades compatíveis do produto (convertQuantityBetweenUnits)', () => {
    // 1 un da massa de 1600g para g -> 1600
    expect(convertQuantityBetweenUnits(1, 'un', 'g', massaEmUnidades)).toBe(1600);
    // 1600 g da massa para un -> 1
    expect(convertQuantityBetweenUnits(1600, 'g', 'un', massaEmUnidades)).toBe(1);
    // 2 un da massa para g -> 3200
    expect(convertQuantityBetweenUnits(2, 'un', 'g', massaEmUnidades)).toBe(3200);
    // 3200 g da massa para un -> 2
    expect(convertQuantityBetweenUnits(3200, 'g', 'un', massaEmUnidades)).toBe(2);
    // 800 g (meia receita) para un -> 0.5
    expect(convertQuantityBetweenUnits(800, 'g', 'un', massaEmUnidades)).toBe(0.5);
    // 1.6 kg da massa para un -> 1
    expect(convertQuantityBetweenUnits(1.6, 'kg', 'un', massaEmUnidades)).toBe(1);
    // 1 un da massa para kg -> 1.6
    expect(convertQuantityBetweenUnits(1, 'un', 'kg', massaEmUnidades)).toBe(1.6);

    // Produto em kg (Farinha)
    expect(convertQuantityBetweenUnits(1, 'kg', 'g', farinhaEmKg)).toBe(1000);
    expect(convertQuantityBetweenUnits(500, 'g', 'kg', farinhaEmKg)).toBe(0.5);
  });
});

