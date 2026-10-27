export type UnitDimension = 'mass' | 'volume' | 'count' | 'custom';

// Fatores relativos à unidade base (g para massa, ml para volume)
const MASS_UNITS: Record<string, { factor: number; label: string }> = {
  mg: { factor: 0.001, label: 'mg (miligrama)' },
  g: { factor: 1, label: 'g (grama)' },
  kg: { factor: 1000, label: 'kg (quilograma)' },
  ton: { factor: 1000000, label: 'ton (tonelada)' },
};

const VOLUME_UNITS: Record<string, { factor: number; label: string }> = {
  ml: { factor: 1, label: 'ml (mililitro)' },
  cl: { factor: 10, label: 'cl (centilitro)' },
  dl: { factor: 100, label: 'dl (decilitro)' },
  L: { factor: 1000, label: 'L (litro)' },
};

const COUNT_UNITS: Record<string, { label: string }> = {
  un: { label: 'un (unidade)' },
  fatia: { label: 'fatia' },
  porção: { label: 'porção' },
  cx: { label: 'cx (caixa)' },
  pct: { label: 'pct (pacote)' },
  dose: { label: 'dose' },
  par: { label: 'par' },
};

const UNIT_ALIASES: Record<string, string> = {
  // Massa
  g: 'g',
  gr: 'g',
  grama: 'g',
  gramas: 'g',
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  quilo: 'kg',
  quilos: 'kg',
  quilograma: 'kg',
  quilogramas: 'kg',
  mg: 'mg',
  miligrama: 'mg',
  miligramas: 'mg',
  ton: 'ton',
  t: 'ton',
  tonelada: 'ton',
  toneladas: 'ton',

  // Volume
  ml: 'ml',
  mililitro: 'ml',
  mililitros: 'ml',
  l: 'L',
  L: 'L',
  litro: 'L',
  litros: 'L',
  cl: 'cl',
  centilitro: 'cl',
  centilitros: 'cl',
  dl: 'dl',
  decilitro: 'dl',
  decilitros: 'dl',

  // Contagem
  un: 'un',
  und: 'un',
  unidade: 'un',
  unidades: 'un',
  unit: 'un',
  fatia: 'fatia',
  fatias: 'fatia',
  porcao: 'porção',
  porção: 'porção',
  porcoes: 'porção',
  porções: 'porção',
  cx: 'cx',
  caixa: 'cx',
  caixas: 'cx',
  pct: 'pct',
  pacote: 'pct',
  pacotes: 'pct',
  dose: 'dose',
  doses: 'dose',
  par: 'par',
  pares: 'par',
};

/**
 * Normaliza uma string de unidade para seu código canônico (ex: 'Quilos' -> 'kg', 'Litro' -> 'L').
 */
export function normalizeUnit(unit?: string | null): string {
  if (!unit) return 'un';
  const trimmed = unit.trim();
  const lower = trimmed.toLowerCase();
  if (UNIT_ALIASES[lower]) {
    return UNIT_ALIASES[lower];
  }
  return lower;
}

/**
 * Retorna a família de grandeza da unidade ('mass', 'volume', 'count' ou 'custom').
 */
export function getUnitDimension(unit?: string | null): UnitDimension {
  const norm = normalizeUnit(unit);
  if (norm in MASS_UNITS) return 'mass';
  if (norm in VOLUME_UNITS) return 'volume';
  if (norm in COUNT_UNITS) return 'count';
  return 'custom';
}

/**
 * Retorna o nome amigável da dimensão.
 */
export function getDimensionName(dimension: UnitDimension): string {
  switch (dimension) {
    case 'mass':
      return 'Massa/Peso';
    case 'volume':
      return 'Volume';
    case 'count':
      return 'Contagem';
    case 'custom':
      return 'Personalizada';
  }
}

/**
 * Verifica se duas unidades são compatíveis entre si para conversão.
 */
export function areUnitsCompatible(unitA?: string | null, unitB?: string | null): boolean {
  const normA = normalizeUnit(unitA);
  const normB = normalizeUnit(unitB);

  if (normA === normB) return true;

  const dimA = getUnitDimension(normA);
  const dimB = getUnitDimension(normB);

  if (dimA === 'mass' && dimB === 'mass') return true;
  if (dimA === 'volume' && dimB === 'volume') return true;

  // Unidades de contagem ou customizadas só são compatíveis se forem exatamente iguais
  return false;
}

/**
 * Retorna uma lista de unidades compatíveis com a unidade fornecida.
 */
export function getCompatibleUnits(unit?: string | null): Array<{ value: string; label: string }> {
  const norm = normalizeUnit(unit);
  const dim = getUnitDimension(norm);

  if (dim === 'mass') {
    return Object.entries(MASS_UNITS).map(([value, info]) => ({
      value,
      label: info.label,
    }));
  }

  if (dim === 'volume') {
    return Object.entries(VOLUME_UNITS).map(([value, info]) => ({
      value,
      label: info.label,
    }));
  }

  if (dim === 'count' && COUNT_UNITS[norm]) {
    return [
      { value: norm, label: COUNT_UNITS[norm].label },
    ];
  }

  return [
    { value: norm, label: norm },
  ];
}

/**
 * Converte uma quantidade de uma unidade para outra.
 * Lança um erro explicativo caso as unidades sejam incompatíveis.
 */
export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  if (normFrom === normTo) {
    return quantity;
  }

  const dimFrom = getUnitDimension(normFrom);
  const dimTo = getUnitDimension(normTo);

  if (dimFrom === 'mass' && dimTo === 'mass') {
    const factorFrom = MASS_UNITS[normFrom].factor;
    const factorTo = MASS_UNITS[normTo].factor;
    const inBaseGrams = quantity * factorFrom;
    const converted = inBaseGrams / factorTo;
    return Number(converted.toFixed(6));
  }

  if (dimFrom === 'volume' && dimTo === 'volume') {
    const factorFrom = VOLUME_UNITS[normFrom].factor;
    const factorTo = VOLUME_UNITS[normTo].factor;
    const inBaseMl = quantity * factorFrom;
    const converted = inBaseMl / factorTo;
    return Number(converted.toFixed(6));
  }

  const dimNameFrom = getDimensionName(dimFrom);
  const dimNameTo = getDimensionName(dimTo);

  throw new Error(
    `Incompatibilidade de unidades: Não é possível converter '${fromUnit}' (${dimNameFrom}) para '${toUnit}' (${dimNameTo}).`
  );
}


export interface UnitConvertibleProduct {
  unit?: string | null;
  recipeYield?: number | string | { toString(): string } | null;
  recipeYieldUnit?: string | null;
}

/**
 * Verifica se uma unidade de receita é compatível com um produto,
 * considerando tanto a unidade principal (unit) quanto o rendimento/peso equivalente (recipeYieldUnit).
 */
export function areProductUnitsCompatible(
  recipeUnit?: string | null,
  product?: UnitConvertibleProduct | null
): boolean {
  if (!product) return false;
  if (areUnitsCompatible(recipeUnit, product.unit)) {
    return true;
  }

  const yieldVal = Number(product.recipeYield || 0);
  if (yieldVal > 0 && product.recipeYieldUnit) {
    if (areUnitsCompatible(recipeUnit, product.recipeYieldUnit)) {
      return true;
    }
    const normRecipe = normalizeUnit(recipeUnit);
    if (normRecipe === 'un' && areUnitsCompatible(product.unit, product.recipeYieldUnit)) {
      return true;
    }
  }

  return false;
}

/**
 * Retorna a lista de unidades compatíveis para usar este produto como ingrediente ou dar entrada no estoque.
 */
export function getCompatibleUnitsForProduct(
  product?: UnitConvertibleProduct | null
): Array<{ value: string; label: string }> {
  if (!product) {
    return [{ value: 'un', label: 'un (unidade)' }];
  }

  const baseUnits = getCompatibleUnits(product.unit);
  const yieldVal = Number(product.recipeYield || 0);

  if (yieldVal > 0 && product.recipeYieldUnit) {
    const normStock = normalizeUnit(product.unit);
    const normYield = normalizeUnit(product.recipeYieldUnit);
    const yieldUnits = getCompatibleUnits(normYield);

    const seen = new Set<string>();
    const result: Array<{ value: string; label: string }> = [];

    // Se o produto está em 'un'/'pct'/'cx', mas tem peso/volume equivalente (ex: 1 massa = 1600g),
    // oferecemos as unidades de peso/volume primeiro (g, kg) e a unidade original com o peso descritivo
    const stockDim = getUnitDimension(normStock);
    if (stockDim === 'count' || stockDim === 'custom') {
      for (const u of yieldUnits) {
        if (!seen.has(u.value)) {
          seen.add(u.value);
          result.push(u);
        }
      }
      for (const u of baseUnits) {
        if (!seen.has(u.value)) {
          seen.add(u.value);
          result.push({
            value: u.value,
            label: `${u.value} (1 ${u.value} = ${yieldVal}${normYield})`,
          });
        }
      }
      return result;
    }

    // Se o produto já está em massa/volume (ex: g ou kg) e tem rendimento de lote (ex: 1600g),
    // oferecemos as unidades de massa/volume e também 'un' (batelada/receita)
    for (const u of baseUnits) {
      if (!seen.has(u.value)) {
        seen.add(u.value);
        result.push(u);
      }
    }
    for (const u of yieldUnits) {
      if (!seen.has(u.value)) {
        seen.add(u.value);
        result.push(u);
      }
    }
    if (!seen.has('un')) {
      result.push({
        value: 'un',
        label: `un (1 lote/receita = ${yieldVal}${normYield})`,
      });
    }
    return result;
  }

  return baseUnits;
}

/**
 * Converte uma quantidade expressa em `fromUnit` para a unidade de estoque (`product.unit`) do produto,
 * utilizando `recipeYield` e `recipeYieldUnit` quando necessário (ex: 60g de uma massa de 1600g -> 0.0375 un).
 */
export function convertProductQuantity(
  quantity: number,
  fromUnit: string,
  product: UnitConvertibleProduct
): number {
  const stockUnit = normalizeUnit(product.unit);
  const normFrom = normalizeUnit(fromUnit || stockUnit);

  if (areUnitsCompatible(normFrom, stockUnit)) {
    return convertQuantity(quantity, normFrom, stockUnit);
  }

  const yieldVal = Number(product.recipeYield || 0);
  if (yieldVal > 0 && product.recipeYieldUnit) {
    const normYield = normalizeUnit(product.recipeYieldUnit);

    // Ex: Produto em 'un' (1 massa = 1600g) e ingrediente usado em 'g' (60g) -> 60 / 1600 = 0.0375 un
    if (areUnitsCompatible(normFrom, normYield)) {
      const qtyInYieldUnit = convertQuantity(quantity, normFrom, normYield);
      return Number((qtyInYieldUnit / yieldVal).toFixed(6));
    }

    // Ex: Produto em 'g' ou 'kg' com rendimento de 1600g, e usado como '1 un' (1 lote) -> 1600g
    if (normFrom === 'un' && areUnitsCompatible(normYield, stockUnit)) {
      return convertQuantity(quantity * yieldVal, normYield, stockUnit);
    }
  }

  return convertQuantity(quantity, normFrom, stockUnit);
}

/**
 * Retorna quantas unidades de estoque (`parentProduct.unit`) são geradas por 1 execução da receita do produto pai.
 * - Se o produto pai está em 'un' (ex: 1 Massa = 1600g), 1 receita gera 1 'un' (fator = 1), pois a conversão de 1600g já ocorre ao consumir a massa em gramas.
 * - Se o produto pai está em 'g' ou 'kg' e tem rendimento configurado (ex: 1600g), 1 receita gera 1600g (ou 1.6kg).
 */
export function getParentRecipeBatchFactor(parentProduct?: UnitConvertibleProduct | null): number {
  if (!parentProduct) return 1;
  const yieldVal = Number(parentProduct.recipeYield || 0);
  if (yieldVal > 0 && parentProduct.recipeYieldUnit) {
    const stockUnit = normalizeUnit(parentProduct.unit);
    const yieldUnit = normalizeUnit(parentProduct.recipeYieldUnit);
    if (areUnitsCompatible(yieldUnit, stockUnit)) {
      const converted = convertQuantity(yieldVal, yieldUnit, stockUnit);
      return converted > 0 ? converted : 1;
    }
  }
  return 1;
}

/**
 * Retorna um passo de incremento amigável para botões +/- de acordo com a unidade selecionada.
 */
export function getRecommendedStepForUnit(unit?: string | null): number {
  const norm = normalizeUnit(unit);
  if (norm === 'g' || norm === 'ml') return 10;
  if (norm === 'mg') return 50;
  if (norm === 'kg' || norm === 'L') return 0.1;
  return 1;
}

/**
 * Converte uma quantidade entre quaisquer duas unidades compatíveis para um determinado produto.
 * Suporta conversões entre contagem (ex: 'un') e massa/volume baseadas no rendimento da receita (ex: 1 un <-> 1600 g),
 * bem como conversões diretas de escala (ex: kg <-> g, L <-> ml).
 */
export function convertQuantityBetweenUnits(
  quantity: number,
  fromUnit: string,
  toUnit: string,
  product: UnitConvertibleProduct
): number {
  const normFrom = normalizeUnit(fromUnit);
  const normTo = normalizeUnit(toUnit);

  if (normFrom === normTo) {
    return quantity;
  }

  // Se ambas as unidades forem diretamente compatíveis (ex: kg -> g ou L -> ml)
  if (areUnitsCompatible(normFrom, normTo)) {
    return convertQuantity(quantity, normFrom, normTo);
  }

  // Primeiro converte para a unidade base de estoque do produto
  const qtyInStockUnit = convertProductQuantity(quantity, normFrom, product);
  const stockUnit = normalizeUnit(product.unit);

  if (normTo === stockUnit) {
    return Number(qtyInStockUnit.toFixed(6));
  }

  // Se a unidade de destino for diretamente compatível com a unidade de estoque
  if (areUnitsCompatible(stockUnit, normTo)) {
    return convertQuantity(qtyInStockUnit, stockUnit, normTo);
  }

  // Se o produto possui rendimento de receita (ex: 1 un = 1600g)
  const yieldVal = Number(product.recipeYield || 0);
  if (yieldVal > 0 && product.recipeYieldUnit) {
    const normYield = normalizeUnit(product.recipeYieldUnit);

    // Se a unidade de estoque for contagem ('un') e o destino for compatível com o rendimento (ex: 'g' ou 'kg')
    const stockDim = getUnitDimension(stockUnit);
    if ((stockDim === 'count' || stockDim === 'custom') && areUnitsCompatible(normYield, normTo)) {
      const inYieldUnit = qtyInStockUnit * yieldVal;
      return convertQuantity(inYieldUnit, normYield, normTo);
    }

    // Se a unidade de estoque for massa/volume (ex: 'g') e o destino for 'un' (lote/receita)
    if (normTo === 'un' && areUnitsCompatible(stockUnit, normYield)) {
      const inYieldUnit = convertQuantity(qtyInStockUnit, stockUnit, normYield);
      return Number((inYieldUnit / yieldVal).toFixed(6));
    }
  }

  throw new Error(
    `Incompatibilidade de unidades: Não é possível converter '${fromUnit}' para '${toUnit}' para o produto especificado.`
  );
}

