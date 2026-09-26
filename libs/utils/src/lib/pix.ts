/**
 * Gerador de Payload Pix Copia e Cola (EMVCo BR Code do Banco Central do Brasil)
 */

export interface PixPayloadOptions {
  /** Chave Pix (telefone, CNPJ, e-mail ou chave aleatória EVP) */
  key: string;
  /** Nome do recebedor/beneficiário (máx 25 caracteres, sem acentos) */
  name?: string;
  /** Cidade do recebedor (máx 15 caracteres, sem acentos) */
  city?: string;
  /** Valor monetário exato em Reais (ex: 34.50) */
  amount: number;
  /** Identificador da transação / referência do pedido (máx 25 caracteres) */
  txid?: string;
  /** Descrição ou mensagem adicional opcional (máx 25 caracteres) */
  description?: string;
}

/**
 * Validador oficial de CPF (módulo 11) para evitar falsos positivos entre telefones e CPFs
 */
function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(10), 10)) return false;

  return true;
}

/**
 * Normaliza e formata a chave Pix para conformidade estrita com o padrão BACEN.
 * Se a chave for um número de telefone brasileiro (mesmo sem formatação ou sem +55),
 * adiciona automaticamente o prefixo internacional E.164 (+55), conforme exigência do DICT.
 */
export function normalizePixKey(key: string): string {
  if (!key) return "";
  const trimmed = key.trim();

  // 1. Se for e-mail (contém @), limpa espaços e passa para minúsculas
  if (trimmed.includes("@")) {
    return trimmed.toLowerCase().replace(/\s+/g, "");
  }

  // 2. Se for chave aleatória EVP (UUID de 36 caracteres)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (uuidRegex.test(trimmed)) {
    return trimmed.toLowerCase();
  }

  // 3. Se já começa com +, mantém apenas o + e dígitos numéricos
  if (trimmed.startsWith("+")) {
    const digitsOnly = trimmed.replace(/\D/g, "");
    if (digitsOnly.length === 10 || digitsOnly.length === 11) {
      return `+55${digitsOnly}`;
    }
    return `+${digitsOnly}`;
  }

  // 4. Extrai apenas dígitos
  const digits = trimmed.replace(/\D/g, "");

  // Se já tem 12 ou 13 dígitos começando com 55 (DDI do Brasil sem +)
  // Ex: 5511976952264 (13 dígitos) ou 551134567890 (12 dígitos)
  if ((digits.length === 12 || digits.length === 13) && digits.startsWith("55")) {
    return `+${digits}`;
  }

  // Se tem 14 dígitos, é CNPJ
  if (digits.length === 14) {
    return digits;
  }

  // Se tem 11 dígitos e for um CPF matematicamente válido, mantém como CPF
  if (digits.length === 11 && isValidCPF(digits)) {
    return digits;
  }

  // Se tem 10 ou 11 dígitos (número de telefone brasileiro: DDD + 8 ou 9 dígitos),
  // adiciona obrigatoriamente o código do Brasil (+55) conforme o padrão E.164 do BACEN
  if (digits.length === 10 || digits.length === 11) {
    return `+55${digits}`;
  }

  // Fallback: retorna caracteres alfanuméricos sem espaços
  return trimmed.replace(/\s+/g, "");
}

/**
 * Remove acentos e caracteres especiais para conformidade estrita com o padrão EMVCo
 */
function sanitizeText(text: string, maxLength: number): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove acentos
    .replace(/[^a-zA-Z0-9\s]/g, "") // apenas alfanuméricos e espaços
    .trim()
    .slice(0, maxLength);
}

/**
 * Formata um campo TLV (Tag-Length-Value)
 */
function formatField(id: string, value: string): string {
  const len = String(value.length).padStart(2, "0");
  return `${id}${len}${value}`;
}

/**
 * Cálculo do Checksum CRC16-CCITT (Polinômio 0x1021, Inicial 0xFFFF) conforme BACEN
 */
export function calculateCRC16(payload: string): string {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Gera o código Pix "Copia e Cola" (BR Code estático com valor pré-definido)
 */
export function generatePixPayload(options: PixPayloadOptions): string {
  const {
    key,
    name = "HARU COOKIES",
    city = "SAO PAULO",
    amount,
    txid = "***",
    description,
  } = options;

  // Normaliza e garante conformidade estrita da chave Pix (ex: padrão E.164 com +55 para telefones)
  const cleanKey = normalizePixKey(key);
  const cleanName = sanitizeText(name, 25).toUpperCase() || "HARU COOKIES";
  const cleanCity = sanitizeText(city, 15).toUpperCase() || "SAO PAULO";
  const cleanTxid = sanitizeText(txid, 25).toUpperCase() || "***";

  // 00: Payload Format Indicator (fixo "01")
  let payload = formatField("00", "01");

  // Nota: Para Pix Estático (mesmo com valor fixo definido no campo 54), a Tag 01
  // (Point of Initiation Method) deve ser omitida conforme especificação do BACEN (Manual BR Code).
  // O valor "12" indicava incorretamente QR dinâmico e fazia bancos rejeitarem a chave estática.

  // 26: Merchant Account Information (Pix)
  let merchantAccount = formatField("00", "br.gov.bcb.pix");
  merchantAccount += formatField("01", cleanKey);
  if (description) {
    const cleanDesc = sanitizeText(description, 25);
    if (cleanDesc) {
      merchantAccount += formatField("02", cleanDesc);
    }
  }
  payload += formatField("26", merchantAccount);

  // 52: Merchant Category Code (0000 = Geral)
  payload += formatField("52", "0000");

  // 53: Transaction Currency (986 = Real BRL)
  payload += formatField("53", "986");

  // 54: Transaction Amount (formatado em 2 casas decimais)
  if (amount > 0) {
    const amountStr = Number(amount).toFixed(2);
    payload += formatField("54", amountStr);
  }

  // 58: Country Code (BR)
  payload += formatField("58", "BR");

  // 59: Merchant Name
  payload += formatField("59", cleanName);

  // 60: Merchant City
  payload += formatField("60", cleanCity);

  // 62: Additional Data Field Template (txid)
  const additionalData = formatField("05", cleanTxid);
  payload += formatField("62", additionalData);

  // 63: CRC16 (Tag "63", Tamanho "04")
  const payloadToHash = payload + "6304";
  const crc = calculateCRC16(payloadToHash);

  return payloadToHash + crc;
}
