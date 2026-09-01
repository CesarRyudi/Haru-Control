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
