import { format } from "date-fns";
import { tr } from "date-fns/locale";

/* ------------------------------------------------------------------ */
/* Subjects & colors                                                   */
/* ------------------------------------------------------------------ */

export const SUBJECTS = [
  "Matematik",
  "Geometri",
  "Türkçe",
  "Edebiyat",
  "Fizik",
  "Kimya",
  "Biyoloji",
  "Tarih",
  "Coğrafya",
  "Felsefe",
  "İngilizce",
  "Din Kültürü",
] as const;

/** Solid fill colors (donut segments, legend dots, badges). */
export const SUBJECT_COLORS: Record<string, string> = {
  Matematik: "#0D9488", // teal-600
  Geometri: "#0284C7", // sky-600
  Türkçe: "#E11D48", // rose-600
  Edebiyat: "#EA580C", // orange-600
  Fizik: "#D97706", // amber-600
  Kimya: "#7C3AED", // violet-600
  Biyoloji: "#16A34A", // green-600
  Tarih: "#57534E", // stone-600
  Coğrafya: "#0891B2", // cyan-600
  Felsefe: "#64748B", // slate-500
  İngilizce: "#4F46E5", // indigo-600
  "Din Kültürü": "#9333EA", // fuchsia-600
  "Ek Ders": "#7C3AED", // violet-600 — matches the violet ek-ders badges
};

const FALLBACK_PALETTE = [
  "#0D9488",
  "#E11D48",
  "#0284C7",
  "#D97706",
  "#7C3AED",
  "#16A34A",
  "#EA580C",
  "#4F46E5",
  "#0891B2",
  "#64748B",
];

/** Color for a lesson subject — stable per subject name. */
export function subjectColor(subject: string): string {
  const known = SUBJECT_COLORS[subject];
  if (known) return known;
  const fallbackIndex = SUBJECTS.indexOf(subject as (typeof SUBJECTS)[number]);
  return FALLBACK_PALETTE[
    ((fallbackIndex >= 0 ? fallbackIndex : subject.length) +
      subject.length) %
      FALLBACK_PALETTE.length
  ];
}

/* ------------------------------------------------------------------ */
/* Lesson status                                                       */
/* ------------------------------------------------------------------ */

export type LessonStatus = "planned" | "completed" | "cancelled";

export const STATUS_META: Record<
  LessonStatus,
  { label: string; pillClass: string }
> = {
  planned: {
    label: "Planlandı",
    pillClass:
      "border border-emerald-200 bg-emerald-50 text-emerald-700",
  },
  completed: {
    label: "Tamamlandı",
    pillClass: "border border-transparent bg-emerald-600 text-white",
  },
  cancelled: {
    label: "İptal",
    pillClass: "border border-neutral-200 bg-neutral-100 text-neutral-500",
  },
};

/* ------------------------------------------------------------------ */
/* Subject display labels                                              */
/* ------------------------------------------------------------------ */

/** Upper-case storage subjects -> Turkish display labels. */
export const SUBJECT_LABELS: Record<string, string> = {
  MATEMATİK: "Matematik",
  GEOMETRİ: "Geometri",
  TÜRKÇE: "Türkçe",
  EDEBİYAT: "Edebiyat",
  FİZİK: "Fizik",
  KİMYA: "Kimya",
  BİYOLOJİ: "Biyoloji",
  TARİH: "Tarih",
  COĞRAFYA: "Coğrafya",
  FELSEFE: "Felsefe",
  İNGİLİZCE: "İngilizce",
  "DİN KÜLTÜRÜ": "Din Kültürü",
};

/** Pretty display label for a stored subject name ("MATEMATİK" -> "Matematik"). */
export function subjectLabel(subject: string): string {
  const key = subject.trim().toLocaleUpperCase("tr");
  return SUBJECT_LABELS[key] ?? subject.trim();
}

/* ------------------------------------------------------------------ */
/* Academic term (dönem) — e.g. "2026/2027"                            */
/* ------------------------------------------------------------------ */

/** Terms run Sep 1 -> Aug 31 (Türkiye eğitim dönemi). */
const TERM_START_MONTH = 8; // 0-based: September
const TERM_START_DAY = 1;

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * Normalizes any stored term label to the full "YYYY/YYYY" form.
 * Accepts "2026/27" (legacy 2-digit) and "2026/2027".
 */
export function normalizeTerm(term: string): string {
  if (!term) return "";
  const m = term.trim().match(/^(\d{4})\/(\d{2,4})$/);
  if (!m) return term.trim();
  const start = Number(m[1]);
  let end = Number(m[2]);
  if (m[2].length === 2) end = start + (end === (start + 1) % 100 ? 1 : 0);
  return `${start}/${end}`;
}

/** "2026-09-05" -> "2026/2027". Empty/invalid strings return "". */
export function termOfYmd(ymd: string): string {
  if (!ymd) return "";
  const [y] = ymd.split("-").map(Number);
  if (!y) return "";
  const [, m] = ymd.split("-");
  const month = Number(m);
  if (month >= TERM_START_MONTH + 1) {
    return `${y}/${y + 1}`;
  }
  return `${y - 1}/${y}`;
}

/** A local Date -> "2026/2027" (September starts the new term). */
export function termOfDate(date: Date): string {
  const y = date.getFullYear();
  const month = date.getMonth(); // 0-based; 8 = September
  if (month >= TERM_START_MONTH) {
    return `${y}/${y + 1}`;
  }
  return `${y - 1}/${y}`;
}

/** "2026/2027" -> first day (Sep 1 2026) as a local Date. */
export function termStartDate(term: string): Date {
  const y = Number(term.slice(0, 4));
  if (!y) return new Date();
  return new Date(y, TERM_START_MONTH, TERM_START_DAY);
}

/** "2026/2027" -> first day AFTER the term (Sep 1 2027), exclusive bound. */
export function termEndExclusiveDate(term: string): Date {
  const y = Number(term.slice(0, 4));
  if (!y) return new Date();
  return new Date(y + 1, TERM_START_MONTH, TERM_START_DAY);
}

/** The current dönem for "today". */
export function currentTerm(): string {
  return termOfDate(new Date());
}

/** True when the given YYYY-MM-DD falls inside the term. */
export function ymdInTerm(ymd: string, term: string): boolean {
  if (!ymd || !term) return false;
  const start = ymdOf(termStartDate(term));
  const end = ymdOf(termEndExclusiveDate(term));
  return ymd >= start && ymd < end;
}

/** "2026/2027" -> "2027/2028" (next term label, accepts legacy 2-digit). */
export function termPlus(term: string, delta: number): string {
  const y = Number(normalizeTerm(term).slice(0, 4)) + delta;
  return `${y}/${y + 1}`;
}

/** True when two term labels refer to the same dönem (legacy "2026/27" safe). */
export function sameTerm(a: string, b: string): boolean {
  return normalizeTerm(a) === normalizeTerm(b);
}

/** Candidate term labels (past few + current + next) for selectors. */
export function termOptions(around?: string): string[] {
  const cur = around ?? currentTerm();
  return [
    termPlus(cur, -2),
    termPlus(cur, -1),
    cur,
    termPlus(cur, 1),
    termPlus(cur, 2),
  ];
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

/** Local date -> "YYYY-MM-DD" (the storage format). */
export function ymdOf(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayYmd(): string {
  return ymdOf(new Date());
}

/** "2026-09-01" -> "01.09.2026" */
export function fmtDMY(ymd: string): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}.${m}.${y}`;
}

/** Monday-based week start for a given date (locale agnostic, local tz). */
export function startOfWeekMonday(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const offset = (copy.getDay() + 6) % 7; // Monday = 0
  copy.setDate(copy.getDate() - offset);
  return copy;
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

/** "31 Ağustos - 6 Eylül" (with year when the range crosses one). */
export function fmtWeekRange(start: Date, end: Date): string {
  if (start.getFullYear() !== end.getFullYear()) {
    return `${format(start, "d MMMM yyyy", { locale: tr })} - ${format(
      end,
      "d MMMM yyyy",
      { locale: tr },
    )}`;
  }
  return `${format(start, "d MMMM", { locale: tr })} - ${format(
    end,
    "d MMMM",
    { locale: tr },
  )}`;
}

/** "16:00" as a 12-hour-ish friendly label, e.g. "16:00". */
export function fmtTime(time: string): string {
  return time || "—";
}

/** Turkish full date with weekday, e.g. "1 Eylül 2026 Salı". */
export function fmtLongDate(date: Date): string {
  return format(date, "d MMMM yyyy EEEE", { locale: tr });
}

/* ------------------------------------------------------------------ */
/* Lesson list text helpers (WhatsApp, copy)                           */
/* ------------------------------------------------------------------ */

export function lessonLine(opts: {
  date: string;
  time: string;
  studentName: string;
  subject: string;
  missingTopic: string;
  teacherName: string;
  statusLabel: string;
}): string {
  const topic = opts.missingTopic ? ` · ${opts.missingTopic}` : "";
  return `• ${fmtDMY(opts.date)} ${opts.time} — ${opts.studentName} — ${opts.subject}${topic} — ${opts.teacherName} (${opts.statusLabel})`;
}
