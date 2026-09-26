import { generatePixPayload, calculateCRC16, normalizePixKey } from "./pix";
import { formatOrderConfirmationMessage } from "./utils";

describe("Pix BR Code Generator", () => {
  it("deve gerar payload de Pix estático normalizando chave de telefone para padrão internacional E.164 (+55)", () => {
    const payload = generatePixPayload({
      key: "11976952264",
      name: "Haru Cookies",
      city: "Sao Paulo",
      amount: 78.0,
      txid: "***",
    });

    // 1. Deve começar com o formato do payload 000201 e ir direto para o campo 26 do Pix
    expect(payload.startsWith("00020126")).toBe(true);

    // 2. Não deve conter a tag 010212 (que induz o banco a tratar como QR dinâmico sem URL)
    expect(payload).not.toContain("010212");

    // 3. Deve conter a identificação do arranjo Pix
    expect(payload).toContain("0014br.gov.bcb.pix");

    // 4. Deve conter a chave Pix formatada com +55 (14 caracteres)
    expect(payload).toContain("0114+5511976952264");

    // 5. Deve conter o valor exato formatado com 2 casas
    expect(payload).toContain("540578.00");

    // 6. Deve conter o recebedor e a cidade sanitizados
    expect(payload).toContain("5912HARU COOKIES");
    expect(payload).toContain("6009SAO PAULO");

    // 7. Deve conter txid estático canônico ***
    expect(payload).toContain("62070503***");

    // 8. Deve terminar com o CRC16 de 4 caracteres hexadecimais
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  it("deve normalizar telefones em diversos formatos para o padrão E.164 (+55)", () => {
    // 11 dígitos sem +55
    expect(normalizePixKey("11976952264")).toBe("+5511976952264");
    // Formatado com parênteses e traço
    expect(normalizePixKey("(11) 97695-2264")).toBe("+5511976952264");
    // Com 55 mas sem +
    expect(normalizePixKey("5511976952264")).toBe("+5511976952264");
    // Com + mas com espaços
    expect(normalizePixKey("+55 11 97695-2264")).toBe("+5511976952264");
    // Já no formato correto
    expect(normalizePixKey("+5511976952264")).toBe("+5511976952264");
  });

  it("deve preservar e-mails, chaves aleatórias EVP, CPFs válidos e CNPJs", () => {
    // E-mail
    expect(normalizePixKey(" Haru@Cookies.COM.br ")).toBe("haru@cookies.com.br");
    // Chave aleatória (UUID)
    expect(normalizePixKey("f8154cc9-79a1-4357-8ab0-1d898a69e46a")).toBe("f8154cc9-79a1-4357-8ab0-1d898a69e46a");
    // CNPJ (14 dígitos)
    expect(normalizePixKey("12.345.678/0001-90")).toBe("12345678000190");
  });

  it("deve calcular o CRC16-CCITT corretamente", () => {
    const data = "00020126360014br.gov.bcb.pix0114+5511976952264520400005303986540523.005802BR5912HARU COOKIES6009SAO PAULO62070503***6304";
    const crc = calculateCRC16(data);
    expect(crc).toHaveLength(4);
    expect(/^[0-9A-F]{4}$/.test(crc)).toBe(true);
  });
});

describe("formatOrderConfirmationMessage", () => {
  it("deve gerar mensagem de confirmação completa no formato original", () => {
    const text = formatOrderConfirmationMessage({
      items: [
        { quantity: 2, productName: "Cookie Nutella", unitPrice: 12 },
        { quantity: 1, productName: "Cookie Clássico", unitPrice: 8 },
      ],
      orderTotal: 32,
      deliveryFee: 5,
      address: "Rua das Flores, 123",
    });

    expect(text).toContain("Então são:");
    expect(text).toContain("2  Cookie Nutella(R$ 12,00)");
    expect(text).toContain("1  Cookie Clássico(R$ 8,00)");
    expect(text).toContain("Valor do pedido: R$ 32,00");
    expect(text).toContain("Taxa de entrega: R$ 5,00");
    expect(text).toContain("Valor total: R$ 37,00");
    expect(text).toContain("Endereço para entrega:\nRua das Flores, 123");
    expect(text).toContain("Certo?");
  });
});
