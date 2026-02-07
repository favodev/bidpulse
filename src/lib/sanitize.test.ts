import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  stripHtml,
  sanitizeText,
  sanitizeMultiline,
  sanitizeEmail,
  isValidEmail,
  sanitizeNumber,
  sanitizeContactForm,
  sanitizeAuctionData,
  sanitizeProfileData,
} from "./sanitize";

describe("escapeHtml", () => {
  it("escapa caracteres HTML especiales", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
    );
  });

  it("escapa ampersands y comillas", () => {
    expect(escapeHtml('Tom & "Jerry"')).toBe("Tom &amp; &quot;Jerry&quot;");
  });

  it("retorna string vacío para no-strings", () => {
    expect(escapeHtml(null as unknown as string)).toBe("");
    expect(escapeHtml(undefined as unknown as string)).toBe("");
    expect(escapeHtml(123 as unknown as string)).toBe("");
  });
});

describe("stripHtml", () => {
  it("elimina tags HTML", () => {
    expect(stripHtml("<b>texto</b>")).toBe("texto");
    expect(stripHtml('<a href="evil.com">click</a>')).toBe("click");
  });

  it("elimina javascript: URIs", () => {
    expect(stripHtml("javascript:alert(1)")).toBe("alert(1)");
  });

  it("elimina event handlers", () => {
    expect(stripHtml('onload="alert(1)"')).toBe("");
  });
});

describe("sanitizeText", () => {
  it("elimina tags HTML y caracteres de control", () => {
    expect(sanitizeText("<script>alert('xss')</script>")).toBe("alert('xss')");
  });

  it("limpia whitespace", () => {
    expect(sanitizeText("  hola  mundo  ")).toBe("hola  mundo");
  });

  it("elimina caracteres de control", () => {
    expect(sanitizeText("hola\x00mundo")).toBe("holamundo");
  });
});

describe("sanitizeMultiline", () => {
  it("preserva saltos de línea", () => {
    expect(sanitizeMultiline("línea 1\nlínea 2")).toBe("línea 1\nlínea 2");
  });

  it("elimina HTML pero preserva newlines", () => {
    expect(sanitizeMultiline("<b>bold</b>\nnormal")).toBe("bold\nnormal");
  });
});

describe("sanitizeEmail", () => {
  it("limpia y normaliza emails", () => {
    expect(sanitizeEmail("  Test@Example.COM  ")).toBe("test@example.com");
  });

  it("elimina caracteres inválidos", () => {
    expect(sanitizeEmail("user<script>@mail.com")).toBe("userscript@mail.com");
    expect(sanitizeEmail("user!#$%@mail.com")).toBe("user@mail.com");
  });
});

describe("isValidEmail", () => {
  it("acepta emails válidos", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("a.b+c@domain.co")).toBe(true);
  });

  it("rechaza emails inválidos", () => {
    expect(isValidEmail("")).toBe(false);
    expect(isValidEmail("@domain.com")).toBe(false);
    expect(isValidEmail("no-at-sign")).toBe(false);
    expect(isValidEmail("spaces in@email.com")).toBe(false);
  });
});

describe("sanitizeNumber", () => {
  it("convierte números válidos", () => {
    expect(sanitizeNumber(42)).toBe(42);
    expect(sanitizeNumber("3.14")).toBe(3.14);
  });

  it("retorna NaN para valores inválidos", () => {
    expect(sanitizeNumber("abc")).toBeNaN();
    expect(sanitizeNumber(Infinity)).toBeNaN();
    expect(sanitizeNumber(null)).toBeNaN();
    expect(sanitizeNumber(undefined)).toBeNaN();
  });
});

describe("sanitizeContactForm", () => {
  it("sanitiza todos los campos", () => {
    const result = sanitizeContactForm({
      name: "<b>John</b>",
      email: "JOHN@mail.COM",
      subject: '<script>alert("xss")</script>',
      message: "Hola\n<b>Mundo</b>",
    });

    expect(result.name).toBe("John");
    expect(result.email).toBe("john@mail.com");
    expect(result.subject).toBe('alert("xss")');
    expect(result.message).toBe("Hola\nMundo");
  });
});

describe("sanitizeAuctionData", () => {
  it("sanitiza título y descripción con límites", () => {
    const longTitle = "A".repeat(300);
    const result = sanitizeAuctionData({
      title: longTitle,
      description: "<script>bad</script>Good description",
      category: "electronics",
      startingPrice: 100,
      bidIncrement: 5,
    });

    expect(result.title.length).toBe(200);
    expect(result.description).toBe("badGood description");
  });
});

describe("sanitizeProfileData", () => {
  it("sanitiza nombre y bio", () => {
    const result = sanitizeProfileData({
      displayName: "<b>Evil Name</b>",
      bio: "Normal bio\nwith newline",
    });

    expect(result.displayName).toBe("Evil Name");
    expect(result.bio).toBe("Normal bio\nwith newline");
  });

  it("respeta límites de longitud", () => {
    const result = sanitizeProfileData({
      displayName: "A".repeat(200),
      bio: "B".repeat(1000),
    });

    expect(result.displayName!.length).toBe(100);
    expect(result.bio!.length).toBe(500);
  });
});
