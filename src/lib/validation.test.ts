import { describe, it, expect } from "vitest";
import {
  validateRequired,
  validateString,
  validateNumber,
  validateEmailField,
  validateCreateAuction,
  validateBidData,
  validateContactForm,
  validateProfileUpdate,
  validateVerificationRequest,
} from "./validation";

describe("validateRequired", () => {
  it("falla para null/undefined/vacío", () => {
    expect(validateRequired(null, "campo").valid).toBe(false);
    expect(validateRequired(undefined, "campo").valid).toBe(false);
    expect(validateRequired("", "campo").valid).toBe(false);
    expect(validateRequired("  ", "campo").valid).toBe(false);
  });

  it("pasa para valores válidos", () => {
    expect(validateRequired("hola", "campo").valid).toBe(true);
    expect(validateRequired(123, "campo").valid).toBe(true);
  });
});

describe("validateString", () => {
  it("valida longitud mínima y máxima", () => {
    expect(validateString("ab", "campo", 3).valid).toBe(false);
    expect(validateString("abc", "campo", 3).valid).toBe(true);
    expect(validateString("abcde", "campo", 1, 4).valid).toBe(false);
  });

  it("rechaza no-strings", () => {
    expect(validateString(123, "campo").valid).toBe(false);
  });
});

describe("validateNumber", () => {
  it("valida rangos numéricos", () => {
    expect(validateNumber(5, "campo", 1, 10).valid).toBe(true);
    expect(validateNumber(0, "campo", 1).valid).toBe(false);
    expect(validateNumber(11, "campo", 1, 10).valid).toBe(false);
  });

  it("rechaza no-números", () => {
    expect(validateNumber("abc", "campo").valid).toBe(false);
    expect(validateNumber(NaN, "campo").valid).toBe(false);
  });
});

describe("validateEmailField", () => {
  it("valida emails", () => {
    expect(validateEmailField("user@example.com", "email").valid).toBe(true);
    expect(validateEmailField("invalid", "email").valid).toBe(false);
    expect(validateEmailField(123, "email").valid).toBe(false);
  });
});

describe("validateContactForm", () => {
  const validData = {
    name: "Juan Pérez",
    email: "juan@example.com",
    subject: "Consulta general",
    message: "Hola, tengo una consulta sobre subastas.",
  };

  it("acepta datos válidos", () => {
    expect(validateContactForm(validData).valid).toBe(true);
  });

  it("rechaza campos faltantes", () => {
    const { name, ...noName } = validData;
    expect(validateContactForm(noName as Record<string, unknown>).valid).toBe(false);
  });

  it("rechaza mensaje muy corto", () => {
    expect(validateContactForm({ ...validData, message: "corto" }).valid).toBe(false);
  });
});

describe("validateBidData", () => {
  const validBid = {
    auctionId: "abc123",
    bidderId: "user123",
    bidderName: "Juan",
    amount: 150,
  };

  it("acepta pujas válidas", () => {
    expect(validateBidData(validBid).valid).toBe(true);
  });

  it("rechaza monto negativo", () => {
    expect(validateBidData({ ...validBid, amount: -10 }).valid).toBe(false);
  });

  it("rechaza nombre vacío", () => {
    expect(validateBidData({ ...validBid, bidderName: "" }).valid).toBe(false);
  });
});

describe("validateProfileUpdate", () => {
  it("acepta actualizaciones válidas", () => {
    expect(validateProfileUpdate({ displayName: "Juan" }).valid).toBe(true);
    expect(validateProfileUpdate({ bio: "Hola mundo" }).valid).toBe(true);
    expect(validateProfileUpdate({}).valid).toBe(true);
  });

  it("rechaza nombre muy corto", () => {
    expect(validateProfileUpdate({ displayName: "X" }).valid).toBe(false);
  });
});

describe("validateCreateAuction", () => {
  const validAuction = {
    title: "Mi Subasta",
    description: "Una descripción",
    category: "electronics",
    startingPrice: 100,
    bidIncrement: 5,
    images: ["data:image/jpeg;base64,/9j/test"],
    startTime: new Date(Date.now() + 60000),
    endTime: new Date(Date.now() + 86400000),
  };

  it("acepta datos válidos", () => {
    expect(validateCreateAuction(validAuction).valid).toBe(true);
  });

  it("rechaza título corto", () => {
    expect(validateCreateAuction({ ...validAuction, title: "AB" }).valid).toBe(false);
  });

  it("rechaza categoría inválida", () => {
    expect(validateCreateAuction({ ...validAuction, category: "invalid" }).valid).toBe(false);
  });

  it("rechaza precio negativo", () => {
    expect(validateCreateAuction({ ...validAuction, startingPrice: -1 }).valid).toBe(false);
  });

  it("rechaza sin imágenes", () => {
    expect(validateCreateAuction({ ...validAuction, images: [] }).valid).toBe(false);
  });
});

describe("validateVerificationRequest", () => {
  it("acepta solicitud válida", () => {
    expect(
      validateVerificationRequest({
        userId: "user123",
        reason: "Soy vendedor profesional con experiencia en electrónica.",
      }).valid
    ).toBe(true);
  });

  it("rechaza razón muy corta", () => {
    expect(
      validateVerificationRequest({
        userId: "user123",
        reason: "Quiero",
      }).valid
    ).toBe(false);
  });
});
