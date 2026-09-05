import { describe, expect, test } from "bun:test";

import {
  addDays,
  currentTerm,
  normalizeTerm,
  sameTerm,
  startOfWeekMonday,
  termOfDate,
  termOfYmd,
  termOptions,
  termPlus,
  ymdInTerm,
  ymdOf,
} from "./yks";

/* ------------------------------------------------------------------ */
/* Dönem (term) logic — lists are term-scoped since the period change  */
/* ------------------------------------------------------------------ */

describe("term helpers", () => {
  test("termOfYmd splits school years at September 1", () => {
    expect(termOfYmd("2026-09-01")).toBe("2026/2027");
    expect(termOfYmd("2027-08-31")).toBe("2026/2027");
    expect(termOfYmd("2027-09-01")).toBe("2027/2028");
    expect(termOfYmd("2026-01-15")).toBe("2025/2026");
  });

  test("termOfDate matches termOfYmd", () => {
    const d = new Date(2026, 8, 1); // Sep 1 2026, local time
    expect(termOfDate(d)).toBe(termOfYmd(ymdOf(d)));
    expect(termOfDate(new Date(2027, 7, 15))).toBe("2026/2027");
  });

  test("currentTerm returns a valid 'YYYY/YYYY+1' string", () => {
    const t = currentTerm();
    expect(t).toMatch(/^\d{4}\/\d{4}$/);
    const [a, b] = t.split("/").map(Number);
    expect(b).toBe(a + 1);
  });

  test("ymdInTerm bounds correctly", () => {
    expect(ymdInTerm("2026-09-05", "2026/2027")).toBe(true);
    expect(ymdInTerm("2027-08-31", "2026/2027")).toBe(true);
    expect(ymdInTerm("2027-09-01", "2026/2027")).toBe(false);
    expect(ymdInTerm("2026-08-31", "2026/2027")).toBe(false);
  });

  test("termPlus moves by whole school years", () => {
    expect(termPlus("2026/2027", 1)).toBe("2027/2028");
    expect(termPlus("2026/2027", -1)).toBe("2025/2026");
  });

  test("termOptions includes the current term", () => {
    expect(termOptions()).toContain(currentTerm());
  });

  test("labels are full YYYY/YYYY (user-requested 2026/2027 format)", () => {
    expect(termOfYmd("2026-09-05")).toBe("2026/2027");
    expect(currentTerm()).toMatch(/^\d{4}\/\d{4}$/);
    expect(termPlus("2026/2027", 1)).toBe("2027/2028");
  });

  test("normalizeTerm upgrades legacy 2-digit labels", () => {
    expect(normalizeTerm("2026/27")).toBe("2026/2027");
    expect(normalizeTerm("2026/2027")).toBe("2026/2027");
    expect(normalizeTerm(" 2026/2027 ")).toBe("2026/2027");
    expect(normalizeTerm("")).toBe("");
    expect(normalizeTerm("mevcut etiket")).toBe("mevcut etiket");
  });

  test("sameTerm matches legacy and full labels", () => {
    expect(sameTerm("2026/27", "2026/2027")).toBe(true);
    expect(sameTerm("2026/2027", "2026/2027")).toBe(true);
    expect(sameTerm("2026/2027", "2027/2028")).toBe(false);
    expect(sameTerm("", "")).toBe(true);
    expect(sameTerm("", "2026/2027")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Week helpers — used by the weekly calendars                         */
/* ------------------------------------------------------------------ */

describe("week helpers", () => {
  test("startOfWeekMonday lands on Monday", () => {
    for (let i = 0; i < 7; i++) {
      const d = new Date(2026, 8, 7 + i); // Sep 7 2026 is a Monday
      const monday = startOfWeekMonday(d);
      expect(monday.getDay()).toBe(1);
    }
  });

  test("addDays crosses month boundaries", () => {
    const d = addDays(new Date(2026, 7, 31), 1); // Aug 31 -> Sep 1
    expect(ymdOf(d)).toBe("2026-09-01");
  });

  test("ymdOf is zero-padded", () => {
    expect(ymdOf(new Date(2026, 8, 5))).toBe("2026-09-05");
  });
});
