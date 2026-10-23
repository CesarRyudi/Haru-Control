import {
  areProductUnitsCompatible,
  getCompatibleUnitsForProduct,
  convertProductQuantity,
  getParentRecipeBatchFactor,
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
});
