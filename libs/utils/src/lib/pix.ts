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

  const cleanKey = key.trim();
  const cleanName = sanitizeText(name, 25).toUpperCase() || "HARU COOKIES";
  const cleanCity = sanitizeText(city, 15).toUpperCase() || "SAO PAULO";
  const cleanTxid = sanitizeText(txid, 25).toUpperCase() || "***";

  // 00: Payload Format Indicator (fixo "01")
  let payload = formatField("00", "01");

  // 01: Point of Initiation Method ("12" = QR dinâmico / valor pré-definido para uso único)
  payload += formatField("01", "12");

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
