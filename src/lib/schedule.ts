/**
 * Weekly schedule model shared by class, teacher, and one-to-one timetables.
 * Times stored as "HH:mm" start times; each slot lasts 40 minutes.
 */

/* ------------------------------------------------------------------ */
/* Time slots (11 lessons + lunch break)                               */
/* ------------------------------------------------------------------ */

export type TimeSlot = {
  index: number; // 1-based period number
  start: string; // "HH:mm"
  end: string; // "HH:mm"
};

export const TIME_SLOTS: TimeSlot[] = [
  { index: 1, start: "08:50", end: "09:30" },
  { index: 2, start: "09:40", end: "10:20" },
  { index: 3, start: "10:30", end: "11:10" },
  { index: 4, start: "11:20", end: "12:00" },
  { index: 5, start: "13:00", end: "13:40" }, // after lunch break
  { index: 6, start: "13:50", end: "14:30" },
  { index: 7, start: "14:40", end: "15:20" },
  { index: 8, start: "15:30", end: "16:10" },
  { index: 9, start: "16:20", end: "17:00" },
  { index: 10, start: "17:10", end: "17:50" },
  { index: 11, start: "18:00", end: "18:40" },
];

/** Period (1-based) whose slot contains the given "HH:mm" time, else null. */
export function slotIndexForTime(time: string): number | null {
  if (!time) return null;
  const [hRaw, mRaw] = time.split(":");
  const minutes = Number(hRaw) * 60 + Number(mRaw);
  for (const slot of TIME_SLOTS) {
    const [sh, sm] = slot.start.split(":").map(Number);
    const [eh, em] = slot.end.split(":").map(Number);
    if (minutes >= sh * 60 + sm && minutes <= eh * 60 + em) return slot.index;
  }
  return null;
}

/** Start time ("HH:mm") of a 1-based period, or null. */
export function slotStart(index: number): string | null {
  return TIME_SLOTS.find((s) => s.index === index)?.start ?? null;
}

/** Lunch break slot index (not schedulable). */
export const LUNCH_SLOT_INDEX = 4.5;

/* ------------------------------------------------------------------ */
/* Days                                                                */
/* ------------------------------------------------------------------ */

export const DAY_NAMES = [
  "Pazartesi",
  "Salı",
  "Çarşamba",
  "Perşembe",
  "Cuma",
  "Cumartesi",
  "Pazar",
] as const;

/* ------------------------------------------------------------------ */
/* Subjects and teacher branches                                       */
/* ------------------------------------------------------------------ */

export const SUBJECTS = [
  "MATEMATİK",
  "FİZİK",
  "KİMYA",
  "BİYOLOJİ",
  "TÜRKÇE",
  "EDEBİYAT",
  "COĞRAFYA",
  "TARİH",
  "GEOMETRİ",
  "İNGİLİZCE",
] as const;

export type Subject = (typeof SUBJECTS)[number];

/** The user's official teacher-branch assignments (upper-cased names). */
export const TEACHER_BRANCHES: Record<string, Subject> = {
  "SONER AÇIKGÖZ": "MATEMATİK",
  "MEHMET ŞAŞAR": "MATEMATİK",
  "TAHSİN ASLAN": "MATEMATİK",
  "MİNE GÜRKAN": "MATEMATİK",
  "MERVE GEREK": "MATEMATİK",
  "SALİM URTİMUR": "MATEMATİK",
  "MUSTAFA GÜRKAN": "FİZİK",
  "RAVİDE DERYA": "FİZİK",
  "BELGİN ÇOLAK": "KİMYA",
  "KARDELEN ASLAN": "KİMYA",
  "SELİNA KUTLU": "KİMYA",
  "ŞAHİN DOĞANAY": "BİYOLOJİ",
  "EREN BİLGİLİ": "TÜRKÇE",
  "FATMA KURT": "TÜRKÇE",
  "FİKRİYE KIYAR": "COĞRAFYA",
  "NİHAT KANARIG": "TARİH",
  "MERT ASİL": "İNGİLİZCE",
};

/** Branch (subject) for a teacher name; case/whitespace tolerant. */
export function branchOf(teacherName: string): Subject | null {
  const key = teacherName.trim().toLocaleUpperCase("tr");
  return TEACHER_BRANCHES[key] ?? null;
}

/** Edebiyat requests are routed to Türkçe/Edebiyat teachers. */
export function requestMatchesBranch(
  subject: string,
  teacherName: string,
): boolean {
  const branch = branchOf(teacherName);
  if (!branch) return true; // unknown teacher: no branch constraint
  const wanted = subject.trim().toLocaleUpperCase("tr");
  if (wanted === branch) return true;
  // Türkçe↔Edebiyat are taught by the same group of teachers.
  const isTurGroup =
    (wanted === "TÜRKÇE" || wanted === "EDEBİYAT") &&
    (branch === "TÜRKÇE" || branch === "EDEBİYAT");
  return isTurGroup;
}

/** True when the subject is one known to the branch map (draggable pool). */
export function isKnownSubject(subject: string): boolean {
  return SUBJECTS.includes(
    subject.trim().toLocaleUpperCase("tr") as Subject,
  );
}

/* ------------------------------------------------------------------ */
/* Class groups (default roster)                                       */
/* ------------------------------------------------------------------ */

export const CLASS_GROUPS = [
  "MEZUN SAY 1",
  "MEZUN SAY 2",
  "MEZUN SAY 3",
  "MEZUN EA 1",
  "MEZUN EA 2",
  "12 SAY 1",
  "12 SAY 2",
  "12 SAY CAL",
  "12 EA 1",
  "12 DİL",
  "11 SAY 1",
  "11 SAY 2",
  "11 SAY 3",
  "11 SAY CAL",
  "11 SAYISAL FEN",
  "11 EA 1",
  "10.SINIF",
  "9.SINIF",
] as const;

/* ------------------------------------------------------------------ */
/* Default teachers per subject (seeding)                              */
/* ------------------------------------------------------------------ */

export const DEFAULT_TEACHERS_BY_SUBJECT: Record<string, string[]> = {
  MATEMATİK: [
    "SONER AÇIKGÖZ",
    "MEHMET ŞAŞAR",
    "TAHSİN ASLAN",
    "MİNE GÜRKAN",
    "MERVE GEREK",
    "SALİM URTİMUR",
  ],
  FİZİK: ["MUSTAFA GÜRKAN", "RAVİDE DERYA"],
  KİMYA: ["BELGİN ÇOLAK", "KARDELEN ASLAN", "SELİNA KUTLU"],
  BİYOLOJİ: ["ŞAHİN DOĞANAY"],
  TÜRKÇE: ["EREN BİLGİLİ", "FATMA KURT"],
  EDEBİYAT: ["EREN BİLGİLİ", "FATMA KURT"],
  COĞRAFYA: ["FİKRİYE KIYAR"],
  TARİH: ["NİHAT KANARIG"],
  İNGİLİZCE: ["MERT ASİL"],
};

/** All default teacher names, insertion order, de-duplicated. */
export const DEFAULT_TEACHERS: string[] = Object.values(
  DEFAULT_TEACHERS_BY_SUBJECT,
).flat();

/** All subject names a given teacher can teach. */
export function subjectsOfTeacher(teacherName: string): Subject[] {
  const branch = branchOf(teacherName);
  if (!branch) return [];
  if (branch === "TÜRKÇE") return ["TÜRKÇE", "EDEBİYAT"];
  return [branch];
}

/* ------------------------------------------------------------------ */
/* Storage keys for roster overrides (edit existing data)              */
/* ------------------------------------------------------------------ */

export const ROSTER_KEYS = {
  classes: "yks.classes.v1",
  students: "yks.students.v1",
} as const;
