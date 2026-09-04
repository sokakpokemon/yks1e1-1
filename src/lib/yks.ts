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
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, "0");

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
