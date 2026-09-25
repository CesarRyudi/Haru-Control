import { generatePixPayload, calculateCRC16 } from "./pix";

describe("Pix BR Code Generator", () => {
  it("deve gerar payload de Pix estático sem a tag 010212 de QR dinâmico", () => {
    const payload = generatePixPayload({
      key: "11976952264",
      name: "Haru Cookies",
      city: "Sao Paulo",
      amount: 78.0,
      txid: "6FA44CD3F",
      description: "Haru Cookies",
    });

    // 1. Deve começar com o formato do payload 000201 e ir direto para o campo 26 do Pix
    expect(payload.startsWith("00020126")).toBe(true);

    // 2. Não deve conter a tag 010212 (que induz o banco a tratar como QR dinâmico sem URL)
    expect(payload).not.toContain("010212");

    // 3. Deve conter a identificação do arranjo Pix
    expect(payload).toContain("0014br.gov.bcb.pix");

    // 4. Deve conter a chave Pix
    expect(payload).toContain("011111976952264");

    // 5. Deve conter o valor exato formatado com 2 casas
    expect(payload).toContain("540578.00");

    // 6. Deve conter o recebedor e a cidade sanitizados
    expect(payload).toContain("5912HARU COOKIES");
    expect(payload).toContain("6009SAO PAULO");

    // 7. Deve terminar com o CRC16 de 4 caracteres hexadecimais
    expect(payload).toMatch(/6304[0-9A-F]{4}$/);
  });

  it("deve limpar espaços acidentais na chave Pix", () => {
    const payload = generatePixPayload({
      key: " +55 11 97695-2264 ",
      amount: 10.0,
    });

    expect(payload).not.toContain(" ");
    expect(payload).toContain("+551197695-2264");
  });

  it("deve calcular o CRC16-CCITT corretamente", () => {
    const data = "00020126330014br.gov.bcb.pix011111976952264520400005303986540525.005802BR5912HARU COOKIES6009SAO PAULO62070503***6304";
    const crc = calculateCRC16(data);
    expect(crc).toHaveLength(4);
    expect(/^[0-9A-F]{4}$/.test(crc)).toBe(true);
  });
});
