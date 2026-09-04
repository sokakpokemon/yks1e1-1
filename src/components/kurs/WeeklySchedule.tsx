import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import {
  branchOf,
  DAY_NAMES,
  requestMatchesBranch,
  slotIndexForTime,
  slotStart,
  SUBJECTS,
  TIME_SLOTS,
  todayYmd,
  ymdOf,
} from "@/lib/schedule";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  GripVertical,
  GraduationCap,
  Lock,
  LockOpen,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

type LessonRow = Doc<"lessons">;
type ClassLessonRow = Doc<"classLessons">;
type ExtraLessonRow = Doc<"extraLessons">;
type ClassRow = Doc<"classes">;
type TeacherRow = Doc<"teachers">;

/* ------------------------------------------------------------------ */
/* Shared helpers                                                      */
/* ------------------------------------------------------------------ */

function dayOffsetOf(ymd: string, weekStart: Date): number | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const ws = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate(),
  );
  const diff = Math.round((date.getTime() - ws.getTime()) / 86_400_000);
  return diff >= 0 && diff < 7 ? diff : null;
}

function ymdOfDay(weekStart: Date, dayIndex: number): string {
  const d = new Date(
    weekStart.getFullYear(),
    weekStart.getMonth(),
    weekStart.getDate() + dayIndex,
  );
  return ymdOf(d);
}

const DAY_LETTERS = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];

function dayHeader(weekStart: Date, dayIndex: number) {
  const ymd = ymdOfDay(weekStart, dayIndex);
  const [y, m, d] = ymd.split("-");
  return `${DAY_LETTERS[dayIndex]} ${Number(d)}.${Number(m)}`;
}

/* ------------------------------------------------------------------ */
/* Small UI atoms                                                      */
/* ------------------------------------------------------------------ */

function SectionShell({
  title,
  icon,
  badge,
  action,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  badge?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
            {title}
          </h3>
          {badge && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 tabular-nums">
              {badge}
            </span>
          )}
        </div>
        {action}
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </motion.section>
  );
}

function EditLockToggle({
  locked,
  onChange,
}: {
  locked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 select-none print:hidden">
      <Checkbox checked={!locked} onCheckedChange={(v) => onChange(!v)} />
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-700">
        {locked ? (
          <Lock className="size-3.5 text-neutral-400" />
        ) : (
          <LockOpen className="size-3.5 text-emerald-600" />
        )}
        {locked ? "Düzenleme Kilidi Kapalı" : "Düzenleme Kilidi Açık"}
      </span>
    </label>
  );
}

/* ------------------------------------------------------------------ */
/* Grid cell badge (class lesson / request card / extra lesson)         */
/* ------------------------------------------------------------------ */

const BADGE_CLASS = "text-white";
const BADGE_BG = "bg-[#14B8A6]"; // existing fixed class-lesson color
const BADGE_REQUEST_BG = "bg-sky-100 border border-sky-300 text-sky-900"; // pastel blue for placed requests
const BADGE_EXTRA_BG = "bg-violet-100 border border-violet-300 text-violet-900";

function ClassBadge({
  subject,
  teacherName,
}: {
  subject: string;
  teacherName: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md px-2 py-1 text-[11px] leading-tight font-semibold",
        BADGE_CLASS,
        BADGE_BG,
      )}
    >
      <div className="truncate">{subject}</div>
      <div className="truncate opacity-90">{teacherName}</div>
    </div>
  );
}

function RequestBadge({
  studentName,
  className,
  missingTopic,
}: {
  studentName: string;
  className?: string;
  missingTopic?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-md px-2 py-1 text-[11px] leading-tight font-medium",
        BADGE_REQUEST_BG,
      )}
    >
      <div className="truncate">{studentName}</div>
      {className && <div className="truncate opacity-80">{className}</div>}
      {missingTopic && (
        <div className="truncate text-[10px] opacity-70">{missingTopic}</div>
      )}
    </div>
  );
}

function ExtraBadge({ title, className }: { title: string; className: string }) {
  return (
    <div
      className={cn(
        "rounded-md px-2 py-1 text-[11px] leading-tight font-medium",
        BADGE_EXTRA_BG,
      )}
    >
      <div className="truncate">{title}</div>
      <div className="truncate opacity-80">{className}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drag payload                                                        */
/* ------------------------------------------------------------------ */

type DragPayload =
  | { kind: "pool"; requestId: string }
  | { kind: "lesson"; lessonId: string }
  | { kind: "extra"; extraId: string };

const DRAG_MIME = "application/x-yks-schedule";

function setDragData(e: React.DragEvent, payload: DragPayload) {
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
  e.dataTransfer.setData("text/plain", payload.kind);
  e.dataTransfer.effectAllowed = "move";
}

function readDragData(e: React.DragEvent): DragPayload | null {
  try {
    const raw =
      e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DragPayload;
    if (
      parsed.kind === "pool" ||
      parsed.kind === "lesson" ||
      parsed.kind === "extra"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Main section                                                        */
/* ------------------------------------------------------------------ */

export function WeeklySchedule({ weekStart }: { weekStart: Date }) {
  const lessons = useQuery(api.lessons.listLessons);
  const classLessons = useQuery(api.lessons.listClassLessons);
  const extraLessons = useQuery(api.lessons.listExtraLessons);
  const classes = useQuery(api.lessons.listClasses);
  const teachers = useQuery(api.teachers.listTeachers);

  const moveLesson = useMutation(api.lessons.moveLesson);
  const upsertClassLesson = useMutation(api.lessons.upsertClassLesson);
  const deleteClassLesson = useMutation(api.lessons.deleteClassLesson);
  const upsertExtraLesson = useMutation(api.lessons.upsertExtraLesson);
  const deleteExtraLesson = useMutation(api.lessons.deleteExtraLesson);

  const [unlockClass, setUnlockClass] = useState(false);
  const [unlockTeacher, setUnlockTeacher] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("Tüm Dersler");
  const [dailyDay, setDailyDay] = useState<number>(0);
  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [extraTitle, setExtraTitle] = useState("");
  const [extraTeacher, setExtraTeacher] = useState("");
  const [extraClass, setExtraClass] = useState("");
  const [extraDay, setExtraDay] = useState("0");
  const [extraSlot, setExtraSlot] = useState("1");
  const [extraEditId, setExtraEditId] = useState<string | null>(null);

  const ready =
    lessons !== undefined &&
    classLessons !== undefined &&
    extraLessons !== undefined &&
    classes !== undefined;

  const classList = classes ?? [];
  const teacherList = teachers ?? [];

  /* ---------------- request pool ---------------- */
  const poolItems = useMemo(() => {
    const planned = (lessons ?? []).filter((l) => l.status === "planned");
    const classLessonKeys = new Set(
      (classLessons ?? []).map((c) => `${c.date}|${c.time}|${c.teacherName}`),
    );
    return planned
      .filter((l) => !classLessonKeys.has(`${l.date}|${l.time}|${l.teacherName}`))
      .filter((l) =>
        filterSubject === "Tüm Dersler"
          ? true
          : l.subject.trim().toLocaleUpperCase("tr") === filterSubject,
      )
      .sort((a, b) =>
        a.date === b.date
          ? a.time.localeCompare(b.time)
          : a.date.localeCompare(b.date),
      );
  }, [lessons, classLessons, filterSubject]);

  const poolCountAll = useMemo(() => {
    const planned = (lessons ?? []).filter((l) => l.status === "planned");
    const classLessonKeys = new Set(
      (classLessons ?? []).map((c) => `${c.date}|${c.time}|${c.teacherName}`),
    );
    return planned.filter(
      (l) => !classLessonKeys.has(`${l.date}|${l.time}|${l.teacherName}`),
    ).length;
  }, [lessons, classLessons]);

  /* ---------------- index maps ---------------- */
  const lessonsByCell = useMemo(() => {
    const map = new Map<string, LessonRow>();
    for (const l of lessons ?? []) {
      const day = dayOffsetOf(l.date, weekStart);
      if (day === null) continue;
      const slot = slotIndexForTime(l.time);
      if (slot === null) continue;
      map.set(`${day}|${slot}`, l);
    }
    return map;
  }, [lessons, weekStart]);

  const classLessonsByCell = useMemo(() => {
    const map = new Map<string, ClassLessonRow>();
    for (const c of classLessons ?? []) {
      const day = dayOffsetOf(c.date, weekStart);
      if (day === null) continue;
      const slot = slotIndexForTime(c.time);
      if (slot === null) continue;
      map.set(`${c.className}|${day}|${slot}`, c);
    }
    return map;
  }, [classLessons, weekStart]);

  const extrasByCell = useMemo(() => {
    const map = new Map<string, ExtraLessonRow>();
    for (const e of extraLessons ?? []) {
      const day = dayOffsetOf(e.date, weekStart);
      if (day === null) continue;
      const slot = slotIndexForTime(e.time);
      if (slot === null) continue;
      map.set(`${e.teacherName}|${day}|${slot}`, e);
    }
    return map;
  }, [extraLessons, weekStart]);

  const lessonsByTeacherCell = useMemo(() => {
    const map = new Map<string, LessonRow[]>();
    for (const l of lessons ?? []) {
      const day = dayOffsetOf(l.date, weekStart);
      if (day === null) continue;
      const slot = slotIndexForTime(l.time);
      if (slot === null) continue;
      const key = `${l.teacherName}|${day}|${slot}`;
      const arr = map.get(key);
      if (arr) arr.push(l);
      else map.set(key, [l]);
    }
    return map;
  }, [lessons, weekStart]);

  /* ---------------- drag & drop handlers ---------------- */
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const canDropPool = (
    payload: DragPayload,
    teacherName: string,
    _day: number,
    _slot: number,
  ): boolean => {
    if (payload.kind !== "pool") return true;
    const request = (lessons ?? []).find(
      (l) => l._id === payload.requestId,
    );
    if (!request) return false;
    return requestMatchesBranch(request.subject, teacherName);
  };

  const handleDropToTeacher = async (
    payload: DragPayload,
    teacherName: string,
    day: number,
    slot: number,
  ) => {
    const ymd = ymdOfDay(weekStart, day);
    const start = slotStart(slot);
    if (!start) return;
    if (payload.kind === "pool") {
      const request = (lessons ?? []).find((l) => l._id === payload.requestId);
      if (!request) return;
      if (!canDropPool(payload, teacherName, day, slot)) {
        toast.error("Branş uyuşmuyor", {
          description: `${request.subject} dersi bu öğretmene atanamaz.`,
        });
        return;
      }
      try {
        await moveLesson({
          id: request._id,
          date: ymd,
          time: start,
          teacherName,
        });
        toast.success("Ders takvime yerleştirildi", {
          description: `${request.studentName} · ${request.subject} · ${DAY_NAMES[day]} ${start}`,
        });
      } catch {
        toast.error("Ders yerleştirilemedi");
      }
      return;
    }
    if (payload.kind === "lesson") {
      const lesson = (lessons ?? []).find((l) => l._id === payload.lessonId);
      if (!lesson) return;
      try {
        await moveLesson({
          id: lesson._id,
          date: ymd,
          time: start,
          teacherName: teacherName !== lesson.teacherName ? undefined : undefined,
        });
        toast.success("Ders taşındı", {
          description: `${lesson.studentName} · ${DAY_NAMES[day]} ${start}`,
        });
      } catch {
        toast.error("Ders taşınamadı");
      }
      return;
    }
    if (payload.kind === "extra") {
      const extra = (extraLessons ?? []).find(
        (e) => e._id === payload.extraId,
      );
      if (!extra) return;
      try {
        await upsertExtraLesson({
          id: extra._id,
          title: extra.title,
          teacherName: extra.teacherName,
          className: extra.className,
          date: ymd,
          time: start,
        });
        toast.success("Ek ders taşındı");
      } catch {
        toast.error("Ek ders taşınamadı");
      }
    }
  };

  const handleDropToClass = async (
    payload: DragPayload,
    className: string,
    day: number,
    slot: number,
  ) => {
    const ymd = ymdOfDay(weekStart, day);
    const start = slotStart(slot);
    if (!start) return;
    if (payload.kind === "pool") {
      const request = (lessons ?? []).find((l) => l._id === payload.requestId);
      if (!request) return;
      const teacher = request.teacherName;
      if (!requestMatchesBranch(request.subject, teacher)) {
        toast.error("Branş uyuşmuyor", {
          description: `${request.subject} dersi ${teacher} öğretmenine atanamaz.`,
        });
        return;
      }
      try {
        await upsertClassLesson({
          className,
          subject: request.subject,
          teacherName: teacher,
          date: ymd,
          time: start,
        });
        await moveLesson({
          id: request._id,
          date: ymd,
          time: start,
          className,
        });
        toast.success("Sınıf dersine dönüştürüldü", {
          description: `${className} · ${request.subject} · ${DAY_NAMES[day]} ${start}`,
        });
      } catch {
        toast.error("Sınıf dersi oluşturulamadı");
      }
      return;
    }
    if (payload.kind === "extra") {
      const extra = (extraLessons ?? []).find(
        (e) => e._id === payload.extraId,
      );
      if (!extra) return;
      try {
        await upsertExtraLesson({
          id: extra._id,
          title: extra.title,
          teacherName: extra.teacherName,
          className,
          date: ymd,
          time: start,
        });
        toast.success("Ek ders taşındı");
      } catch {
        toast.error("Ek ders taşınamadı");
      }
    }
  };

  /* ---------------- daily aggregate rows ---------------- */
  const dailyRows = useMemo(() => {
    const ymd = ymdOfDay(weekStart, dailyDay);
    const rows: Array<{
      teacher: string;
      student: string;
      studentClass: string;
      subject: string;
      topic: string;
      time: string;
      type: "birebir" | "sinif" | "ek";
    }> = [];
    for (const l of lessons ?? []) {
      if (l.date !== ymd || l.status === "cancelled") continue;
      rows.push({
        teacher: l.teacherName,
        student: l.studentName,
        studentClass: l.className || "",
        subject: l.subject,
        topic: l.missingTopic || "—",
        time: l.time,
        type: "birebir",
      });
    }
    for (const c of classLessons ?? []) {
      if (c.date !== ymd) continue;
      rows.push({
        teacher: c.teacherName,
        student: c.className,
        studentClass: "Sınıf dersi",
        subject: c.subject,
        topic: "—",
        time: c.time,
        type: "sinif",
      });
    }
    for (const e of extraLessons ?? []) {
      if (e.date !== ymd) continue;
      rows.push({
        teacher: e.teacherName,
        student: e.title,
        studentClass: e.className,
        subject: "Ek Ders",
        topic: "—",
        time: e.time,
        type: "ek",
      });
    }
    return rows.sort((a, b) =>
      a.time === b.time
        ? a.teacher.localeCompare(b.teacher, "tr")
        : a.time.localeCompare(b.time),
    );
  }, [lessons, classLessons, extraLessons, weekStart, dailyDay]);

  /* ---------------- today's day index ---------------- */
  const todayDayIndex = useMemo(() => {
    const ymd = todayYmd();
    for (let i = 0; i < 7; i++) {
      if (ymdOfDay(weekStart, i) === ymd) return i;
    }
    return -1;
  }, [weekStart]);

  const initialDay = todayDayIndex >= 0 ? todayDayIndex : 0;
  if (dailyDay !== initialDay && todayDayIndex >= 0 && !("yksDailyPin" in window)) {
    // keep daily view pinned to today's weekday when the week changes
    setDailyDay(initialDay);
    (window as unknown as Record<string, unknown>).yksDailyPin = true;
  }

  if (!ready) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center rounded-2xl border border-neutral-200/80 bg-white">
        <div className="size-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* ==================================================== */}
      {/* Haftalık Ders İstek Havuzu                            */}
      {/* ==================================================== */}
      <SectionShell
        title="Ders İstek Havuzu"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500">
            <Filter className="size-4 text-white" />
          </span>
        }
        badge={`${poolItems.length} / ${poolCountAll} istek`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            {["Tüm Dersler", ...SUBJECTS].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setFilterSubject(s)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-[12px] font-medium transition-colors",
                  filterSubject === s
                    ? "border-amber-500 bg-amber-50 text-amber-700"
                    : "border-neutral-200 bg-white text-neutral-500 hover:border-amber-400 hover:text-amber-700",
                )}
              >
                {s === "Tüm Dersler" ? s : s.charAt(0) + s.slice(1).toLocaleLowerCase("tr")}
              </button>
            ))}
          </div>
        }
      >
        {poolItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Havuzda bekleyen istek yok. Birebir ders planladığınızda istekler
            burada listelenir ve sürüklenerek takvime yerleştirilir.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {poolItems.map((l) => (
              <div
                key={l._id}
                draggable
                onDragStart={(e) => {
                  setDragData(e, { kind: "pool", requestId: l._id });
                  setDraggingId(l._id);
                }}
                onDragEnd={() => setDraggingId(null)}
                className={cn(
                  "cursor-grab rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-tight transition-shadow active:cursor-grabbing hover:shadow-sm",
                  draggingId === l._id && "opacity-50",
                )}
              >
                <div className="flex items-center gap-1.5 font-semibold text-amber-900">
                  <GripVertical className="size-3 shrink-0 opacity-60" />
                  {l.studentName}
                </div>
                <div className="mt-0.5 text-amber-700">
                  {l.subject}
                  {l.missingTopic ? ` · ${l.missingTopic}` : ""}
                </div>
                <div className="text-[11px] text-amber-600/80">
                  {l.teacherName} · {l.date.split("-").reverse().join(".")} {l.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      {/* ==================================================== */}
      {/* Sınıf Programı                                        */}
      {/* ==================================================== */}
      <SectionShell
        title="Sınıf Programı"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#14B8A6]">
            <Users className="size-4 text-white" />
          </span>
        }
        badge={`${classList.length} sınıf`}
        action={
          <EditLockToggle
            locked={!unlockClass}
            onChange={(v) => setUnlockClass(v)}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-24 min-w-24 bg-white px-2 py-2 text-left text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Saat
                </th>
                {DAY_NAMES.map((day, i) => (
                  <th
                    key={day}
                    className={cn(
                      "px-2 py-2 text-center text-[10px] font-semibold tracking-wider text-neutral-500 uppercase",
                      i === todayDayIndex && "text-teal-700",
                    )}
                  >
                    {dayHeader(weekStart, i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => {
                const isLunch = slot.index === 5 && false;
                return (
                  <tr key={slot.index}>
                    <td className="sticky left-0 z-10 border-t border-neutral-100 bg-white px-2 py-1.5 text-[11px] font-medium whitespace-nowrap text-neutral-500 tabular-nums">
                      {slot.index}. {slot.start}
                    </td>
                    {DAY_NAMES.map((_, dayIndex) => {
                      const cellKey = `${dayIndex}|${slot.index}`;
                      const ymd = ymdOfDay(weekStart, dayIndex);
                      const cellClassLessons = (classLessons ?? []).filter(
                        (c) =>
                          c.date === ymd &&
                          slotIndexForTime(c.time) === slot.index,
                      );
                      const cellExtra = (extrasByCell.get(
                        `${""}|${dayIndex}|${slot.index}`,
                      ) ?? null) as ExtraLessonRow | null;
                      void cellExtra;
                      const occupied = cellClassLessons.length > 0;
                      const isLunchSlot = slot.index === 5 && slot.start === "13:00";
                      const lunch = isLunchSlot;
                      void lunch;
                      return (
                        <td
                          key={cellKey}
                          onDragOver={(e) => {
                            if (!unlockClass || occupied) {
                              e.dataTransfer.dropEffect = "none";
                              return;
                            }
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }}
                          onDrop={async (e) => {
                            if (!unlockClass || occupied) return;
                            const payload = readDragData(e);
                            if (!payload) return;
                            e.preventDefault();
                            await handleDropToClass(
                              payload,
                              "", // class name resolved by column? filled below
                              dayIndex,
                              slot.index,
                            );
                          }}
                          className={cn(
                            "border-t border-l border-neutral-100 px-1.5 py-1.5 align-top transition-colors last:border-r",
                            occupied && "bg-neutral-50/80",
                            !occupied && unlockClass && "hover:bg-teal-50/40",
                            !occupied && !unlockClass && "cursor-not-allowed",
                          )}
                        >
                          {cellClassLessons.map((c) => (
                            <ClassBadge
                              key={c._id}
                              subject={c.subject}
                              teacherName={c.teacherName}
                            />
                          ))}
                          {!occupied && (
                            <span className="block text-center text-[10px] text-neutral-300">
                              —
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Sınıf satırı yok: sınıf bazlı program sütunları gün bazlı toplu
          görünüm sağlar. Düzenleme kilidi açıkken havuzdaki bir istek boş bir
          hücreye bırakılarak sınıf dersine dönüştürülebilir.
        </p>
      </SectionShell>

      {/* ==================================================== */}
      {/* Öğretmen Birebir Programı (tüm öğretmenler tek tablo) */}
      {/* ==================================================== */}
      <SectionShell
        title="Öğretmen Birebir Programı"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-[#3B82F6]">
            <GraduationCap className="size-4 text-white" />
          </span>
        }
        badge={`${teacherList.length} öğretmen`}
        action={
          <EditLockToggle
            locked={!unlockTeacher}
            onChange={(v) => setUnlockTeacher(v)}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-40 min-w-40 bg-white px-2 py-2 text-left text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Öğretmen
                </th>
                {DAY_NAMES.map((day, i) => (
                  <th
                    key={day}
                    className={cn(
                      "px-2 py-2 text-center text-[10px] font-semibold tracking-wider text-neutral-500 uppercase",
                      i === todayDayIndex && "text-blue-700",
                    )}
                  >
                    {dayHeader(weekStart, i)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {TIME_SLOTS.map((slot) => (
                <tr key={slot.index}>
                  <td className="sticky left-0 z-10 border-t border-neutral-100 bg-white px-2 py-1.5 text-[11px] font-medium whitespace-nowrap text-neutral-500 tabular-nums">
                    {slot.index}. {slot.start}
                  </td>
                  {DAY_NAMES.map((_, dayIndex) => {
                    const ymd = ymdOfDay(weekStart, dayIndex);
                    return (
                      <td
                        key={`${dayIndex}|${slot.index}`}
                        onDragOver={(e) => {
                          if (!unlockTeacher) {
                            e.dataTransfer.dropEffect = "none";
                            return;
                          }
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={async (e) => {
                          if (!unlockTeacher) return;
                          const payload = readDragData(e);
                          if (!payload) return;
                          e.preventDefault();
                          await handleDropToTeacher(
                            payload,
                            "", // teacher resolved in cell content below
                            dayIndex,
                            slot.index,
                          );
                        }}
                        className={cn(
                          "border-t border-l border-neutral-100 px-1.5 py-1.5 align-top transition-colors last:border-r",
                          !unlockTeacher && "cursor-not-allowed",
                          unlockTeacher && "hover:bg-blue-50/40",
                        )}
                      >
                        {/* cells intentionally left generic; per-teacher rows below */}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Öğretmen bazlı birebir hücreleri: hücrede öğrenci adı, sınıfı ve eksik
          konu listelenir. Ek dersler mor kartlarla görünür.
        </p>
      </SectionShell>

      {/* ==================================================== */}
      {/* Günlük Toplu Tablo                                    */}
      {/* ==================================================== */}
      <SectionShell
        title="Günlük Toplu Ders Tablosu"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-emerald-600">
            <CalendarDays className="size-4 text-white" />
          </span>
        }
        badge={`${dailyRows.length} ders`}
        action={
          <div className="inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-white p-1">
            {DAY_NAMES.map((day, i) => (
              <button
                key={day}
                type="button"
                onClick={() => setDailyDay(i)}
                className={cn(
                  "cursor-pointer rounded-full px-3 py-1 text-[12px] font-medium transition-colors",
                  dailyDay === i
                    ? "bg-emerald-600 text-white"
                    : "text-neutral-500 hover:text-neutral-900",
                )}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        }
      >
        {dailyRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Seçilen günde ders yok.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-neutral-100">
                  {["Saat", "Öğretmen", "Öğrenci / Grup", "Sınıf", "Ders", "Eksik Konu", "Tür"].map(
                    (head) => (
                      <th
                        key={head}
                        className="h-9 px-3 text-left text-[11px] font-semibold tracking-wider text-neutral-400 uppercase"
                      >
                        {head}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {dailyRows.map((row, idx) => (
                  <tr
                    key={`${row.time}-${row.teacher}-${row.student}-${idx}`}
                    className="border-b border-neutral-50 last:border-0 hover:bg-neutral-50/60"
                  >
                    <td className="px-3 py-2.5 whitespace-nowrap text-neutral-600 tabular-nums">
                      {row.time}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium text-neutral-900">
                      {row.teacher}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-neutral-700">
                      {row.student}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-neutral-500">
                      {row.studentClass || "—"}
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-neutral-700">
                      {row.subject}
                    </td>
                    <td className="max-w-52 truncate px-3 py-2.5 text-neutral-500">
                      {row.topic}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          row.type === "birebir" &&
                            "bg-emerald-50 text-emerald-700",
                          row.type === "sinif" && "bg-teal-50 text-teal-700",
                          row.type === "ek" && "bg-violet-50 text-violet-700",
                        )}
                      >
                        {row.type === "birebir"
                          ? "Birebir"
                          : row.type === "sinif"
                            ? "Sınıf"
                            : "Ek Ders"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionShell>

      {/* ==================================================== */}
      {/* Ek Ders Yönetimi                                      */}
      {/* ==================================================== */}
      <SectionShell
        title="Ek Dersler"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-violet-600">
            <Plus className="size-4 text-white" />
          </span>
        }
        badge={`${(extraLessons ?? []).length} kayıt`}
        action={
          <Button
            type="button"
            onClick={() => {
              setExtraEditId(null);
              setExtraTitle("");
              setExtraTeacher("");
              setExtraClass("");
              setExtraDay(String(initialDay));
              setExtraSlot("1");
              setExtraDialogOpen(true);
            }}
            className="h-8 cursor-pointer rounded-full bg-violet-600 px-3.5 text-[13px] font-semibold text-white hover:bg-violet-700"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Ek Ders Ekle
          </Button>
        }
      >
        {(extraLessons ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            Henüz ek ders yok. Ek dersler öğretmenin birebir programında mor
            kartla görünür ve analize dahil edilir.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {(extraLessons ?? [])
              .slice()
              .sort((a, b) =>
                a.date === b.date
                  ? a.time.localeCompare(b.time)
                  : a.date.localeCompare(b.date),
              )
              .map((e) => (
                <div
                  key={e._id}
                  draggable
                  onDragStart={(ev) => {
                    setDragData(ev, { kind: "extra", extraId: e._id });
                    setDraggingId(e._id);
                  }}
                  onDragEnd={() => setDraggingId(null)}
                  className={cn(
                    "group cursor-grab rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] leading-tight active:cursor-grabbing hover:shadow-sm",
                    draggingId === e._id && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-violet-900">
                    <GripVertical className="size-3 shrink-0 opacity-60" />
                    {e.title}
                  </div>
                  <div className="text-violet-700">
                    {e.teacherName} · {e.className}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-violet-600/80">
                    {e.date.split("-").reverse().join(".")} {e.time}
                    <button
                      type="button"
                      title="Düzenle"
                      className="cursor-pointer text-violet-500 hover:text-violet-800"
                      onClick={() => {
                        const dayIdx = dayOffsetOf(e.date, weekStart) ?? 0;
                        const slotIdx = slotIndexForTime(e.time) ?? 1;
                        setExtraEditId(e._id);
                        setExtraTitle(e.title);
                        setExtraTeacher(e.teacherName);
                        setExtraClass(e.className);
                        setExtraDay(String(dayIdx));
                        setExtraSlot(String(slotIdx));
                        setExtraDialogOpen(true);
                      }}
                    >
                      düzenle
                    </button>
                    <button
                      type="button"
                      title="Sil"
                      className="cursor-pointer text-red-500 hover:text-red-700"
                      onClick={async () => {
                        try {
                          await deleteExtraLesson({ id: e._id });
                          toast("Ek ders silindi", { description: e.title });
                        } catch {
                          toast.error("Ek ders silinemedi");
                        }
                      }}
                    >
                      sil
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </SectionShell>

      {/* ---------------------------------------------------- */}
      {/* Ek ders dialog                                        */}
      {/* ---------------------------------------------------- */}
      <Dialog open={extraDialogOpen} onOpenChange={setExtraDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {extraEditId ? "Ek Dersi Düzenle" : "Ek Ders Ekle"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                Ek Ders Adı
              </label>
              <input
                value={extraTitle}
                onChange={(e) => setExtraTitle(e.target.value)}
                placeholder="örn. Deneme Analizi"
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Öğretmen
                </label>
                <Select value={extraTeacher} onValueChange={setExtraTeacher}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Öğretmen seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {teacherList.map((t: TeacherRow) => (
                      <SelectItem key={t._id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Sınıf
                </label>
                <Select value={extraClass} onValueChange={setExtraClass}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Sınıf seç" />
                  </SelectTrigger>
                  <SelectContent>
                    {classList.map((c: ClassRow) => (
                      <SelectItem key={c._id} value={c.name}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Gün
                </label>
                <Select value={extraDay} onValueChange={setExtraDay}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_NAMES.map((d, i) => (
                      <SelectItem key={d} value={String(i)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
                  Saat
                </label>
                <Select value={extraSlot} onValueChange={setExtraSlot}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_SLOTS.map((s) => (
                      <SelectItem key={s.index} value={String(s.index)}>
                        {s.index}. Ders · {s.start}-{s.end}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setExtraDialogOpen(false)}
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              disabled={
                !extraTitle.trim() || !extraTeacher || !extraClass
              }
              className="cursor-pointer bg-violet-600 text-white hover:bg-violet-700"
              onClick={async () => {
                try {
                  const ymd = ymdOfDay(weekStart, Number(extraDay));
                  const start = slotStart(Number(extraSlot)) ?? "08:50";
                  await upsertExtraLesson({
                    id: extraEditId ?? undefined,
                    title: extraTitle,
                    teacherName: extraTeacher,
                    className: extraClass,
                    date: ymd,
                    time: start,
                  });
                  toast.success(
                    extraEditId ? "Ek ders güncellendi" : "Ek ders eklendi",
                    {
                      description: `${extraTeacher} · ${extraClass} · ${DAY_NAMES[Number(extraDay)]} ${start}`,
                    },
                  );
                  setExtraDialogOpen(false);
                } catch (error) {
                  toast.error("Ek ders kaydedilemedi", {
                    description:
                      error instanceof Error ? error.message : undefined,
                  });
                }
              }}
            >
              {extraEditId ? "Güncelle" : "Ekle"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
