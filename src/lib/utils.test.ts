import { describe, it, expect, vi, afterEach } from "vitest";
import {
  formatDistanceToNow,
  formatCurrency,
  formatTimeRemaining,
  truncate,
} from "./utils";

afterEach(() => {
  vi.useRealTimers();
});

describe("utils", () => {
  it("formats currency in CLP", () => {
    expect(formatCurrency(1500, "CLP")).toContain("1.500");
  });

  it("truncates text with ellipsis", () => {
    expect(truncate("1234567890", 6)).toBe("123...");
  });

  it("formats distance to now in minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-05T12:00:00Z"));
    const date = new Date("2026-02-05T11:58:00Z");
    expect(formatDistanceToNow(date)).toContain("Hace 2 minutos");
  });

  it("formats time remaining", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-05T12:00:00Z"));
    const end = new Date("2026-02-05T12:00:30Z");
    expect(formatTimeRemaining(end)).toContain("30s");
  });
});
