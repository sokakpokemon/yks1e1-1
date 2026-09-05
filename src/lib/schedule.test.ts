import { describe, expect, test } from "bun:test";

import {
  branchOf,
  DAY_NAMES,
  isKnownSubject,
  LUNCH_SLOT_INDEX,
  requestMatchesBranch,
  slotIndexForTime,
  slotStart,
  subjectsOfTeacher,
  TIME_SLOTS,
} from "./schedule";
import { DRAG_MIME, readDragData, setDragData } from "./scheduleDrag";

/* ------------------------------------------------------------------ */
/* Branch matching — protects the "Akıllı Branş Kontrolü" drop rule    */
/* ------------------------------------------------------------------ */

describe("requestMatchesBranch", () => {
  test("FİZİK only matches FİZİK teachers", () => {
    expect(requestMatchesBranch("FİZİK", "MUSTAFA GÜRKAN")).toBe(true);
    expect(requestMatchesBranch("FİZİK", "RAVİDE DERYA")).toBe(true);
    expect(requestMatchesBranch("FİZİK", "SALİM URTİMUR")).toBe(false); // matematikçi
    expect(requestMatchesBranch("FİZİK", "EREN BİLGİLİ")).toBe(false); // türkçe
  });

  test("İNGİLİZCE only matches İNGİLİZCE teachers", () => {
    expect(requestMatchesBranch("İNGİLİZCE", "MERT ASİL")).toBe(true);
    expect(requestMatchesBranch("İNGİLİZCE", "SALİM URTİMUR")).toBe(false);
  });

  test("TÜRKÇE and EDEBİYAT share the same teacher group", () => {
    expect(requestMatchesBranch("TÜRKÇE", "EREN BİLGİLİ")).toBe(true);
    expect(requestMatchesBranch("EDEBİYAT", "EREN BİLGİLİ")).toBe(true);
  });

  test("case / whitespace tolerant", () => {
    expect(requestMatchesBranch("fizik", "mustafa gürkan")).toBe(true);
    expect(requestMatchesBranch("  FİZİK  ", "MUSTAFA GÜRKAN")).toBe(true);
  });

  test("unknown teacher imposes no branch constraint", () => {
    expect(requestMatchesBranch("FİZİK", "Bilinmeyen Öğretmen")).toBe(true);
  });
});

describe("branchOf / subjectsOfTeacher / isKnownSubject", () => {
  test("branchOf resolves normalized names", () => {
    expect(branchOf("SALİM URTİMUR")).toBe("MATEMATİK");
    expect(branchOf("salim urtimur")).toBe("MATEMATİK");
    expect(branchOf("MUSTAFA GÜRKAN")).toBe("FİZİK");
    expect(branchOf("NİHAT KANARIG")).toBe("TARİH");
    expect(branchOf("Yok Böyle Bir Öğretmen")).toBeNull();
  });

  test("Türkçe teacher can teach TÜRKÇE and EDEBİYAT", () => {
    expect(subjectsOfTeacher("EREN BİLGİLİ")).toEqual([
      "TÜRKÇE",
      "EDEBİYAT",
    ]);
    expect(subjectsOfTeacher("MERT ASİL")).toEqual(["İNGİLİZCE"]);
    expect(subjectsOfTeacher("Tanımsız")).toEqual([]);
  });

  test("isKnownSubject", () => {
    expect(isKnownSubject("MATEMATİK")).toBe(true);
    expect(isKnownSubject("matematik")).toBe(true);
    expect(isKnownSubject("MÜZİK")).toBe(false);
  });
});

/* ------------------------------------------------------------------ */
/* Drag payload — shared by pools and calendar drop zones              */
/* ------------------------------------------------------------------ */

describe("drag payload (setDragData / readDragData)", () => {
  function fakeDragEvent(raw: string) {
    const store = new Map<string, string>();
    return {
      dataTransfer: {
        setData: (t: string, v: string) => store.set(t, v),
        getData: (t: string) => store.get(t) ?? "",
      },
      raw,
    };
  }

  test("classGroupExtra payload round-trips", () => {
    const ev = fakeDragEvent("");
    setDragData(ev as never, {
      kind: "classGroupExtra",
      extraId: "cg-123",
    });
    expect(ev.dataTransfer.getData(DRAG_MIME)).toContain("cg-123");
    expect(readDragData(ev as never)).toEqual({
      kind: "classGroupExtra",
      extraId: "cg-123",
    });
  });

  test("all four payload kinds are accepted", () => {
    for (const payload of [
      { kind: "pool", requestId: "r1" },
      { kind: "extra", extraId: "e1" },
      { kind: "classExtra", extraId: "c1" },
      { kind: "classGroupExtra", extraId: "g1" },
    ] as const) {
      const ev = fakeDragEvent("");
      setDragData(ev as never, payload);
      expect(readDragData(ev as never)).toEqual(payload);
    }
  });

  test("falls back to text/plain when MIME missing", () => {
    const ev = fakeDragEvent("");
    setDragData(ev as never, { kind: "extra", extraId: "x1" });
    // Simulate a browser that dropped the custom MIME:
    const partial = {
      dataTransfer: {
        setData: () => {},
        getData: (t: string) =>
          t === "text/plain"
            ? JSON.stringify({ kind: "extra", extraId: "x1" })
            : "",
      },
    };
    void ev;
    expect(readDragData(partial as never)).toEqual({
      kind: "extra",
      extraId: "x1",
    });
  });

  test("rejects unknown kinds and malformed JSON", () => {
    const badKind = {
      dataTransfer: { setData: () => {}, getData: () => '{"kind":"nope"}' },
    };
    expect(readDragData(badKind as never)).toBeNull();
    const badJson = {
      dataTransfer: { setData: () => {}, getData: () => "{not json" },
    };
    expect(readDragData(badJson as never)).toBeNull();
    const empty = {
      dataTransfer: { setData: () => {}, getData: () => "" },
    };
    expect(readDragData(empty as never)).toBeNull();
  });
});

/* ------------------------------------------------------------------ */
/* Time slots — 11 lessons with locked lunch break                     */
/* ------------------------------------------------------------------ */

describe("TIME_SLOTS", () => {
  test("11 lessons, lunch break between 4th and 5th period", () => {
    expect(TIME_SLOTS).toHaveLength(11);
    expect(TIME_SLOTS[0]).toEqual({ index: 1, start: "08:50", end: "09:30" });
    expect(TIME_SLOTS[4]).toEqual({ index: 5, start: "13:00", end: "13:40" });
    expect(TIME_SLOTS[10]).toEqual({
      index: 11,
      start: "18:00",
      end: "18:40",
    });
    expect(LUNCH_SLOT_INDEX).toBe(4.5);
  });

  test("slotIndexForTime maps start and end times to periods", () => {
    expect(slotIndexForTime("08:50")).toBe(1);
    expect(slotIndexForTime("09:30")).toBe(1);
    expect(slotIndexForTime("13:00")).toBe(5);
    expect(slotIndexForTime("18:40")).toBe(11);
    expect(slotIndexForTime("12:30")).toBeNull(); // öğle molası
    expect(slotIndexForTime("")).toBeNull();
  });

  test("slotStart round-trips with slotIndexForTime", () => {
    for (const slot of TIME_SLOTS) {
      expect(slotStart(slot.index)).toBe(slot.start);
      expect(slotIndexForTime(slot.start)).toBe(slot.index);
    }
    expect(slotStart(0)).toBeNull();
    expect(slotStart(12)).toBeNull();
  });

  test("7 day names, Monday first", () => {
    expect(DAY_NAMES[0]).toBe("Pazartesi");
    expect(DAY_NAMES).toHaveLength(7);
  });
});
