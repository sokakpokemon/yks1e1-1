import { api } from "@/convex/_generated/api";
import type { Doc, Id } from "@/convex/_generated/dataModel";
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
  DAY_NAMES,
  requestMatchesBranch,
  slotIndexForTime,
  slotStart,
  SUBJECTS,
  TIME_SLOTS,
} from "@/lib/schedule";
import {
  readDragData as readDragDataShared,
  setDragData as setDragDataShared,
  type DragPayload as SharedDragPayload,
} from "@/lib/scheduleDrag";
import { termOfYmd, todayYmd, ymdInTerm, ymdOf } from "@/lib/yks";
import { useMutation, useQuery } from "convex/react";
import { ClassGroupEkDersPanel } from "./ClassGroupEkDersPanel";
import { motion } from "framer-motion";
import {
  CalendarDays,
  Filter,
  GraduationCap,
  Layers,
  Lock,
  LockOpen,
  Plus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type LessonRow = Doc<"lessons">;
type ClassLessonRow = Doc<"classLessons">;
type ExtraLessonRow = Doc<"extraLessons">;
type ClassExtraRow = Doc<"classExtraLessons">;
type ClassGroupExtraRow = Doc<"classGroupExtraLessons">;
type ClassRow = Doc<"classes">;
type TeacherRow = Doc<"teachers">;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function dayOffsetOf(ymd: string, weekStart: Date): number | null {
  if (!ymd) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) return null;
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

function dayHeader(weekStart: Date, dayIndex: number): string {
  const ymd = ymdOfDay(weekStart, dayIndex);
  const [, m, d] = ymd.split("-");
  return `${DAY_LETTERS[dayIndex]} ${Number(d)}.${Number(m)}`;
}

/* ------------------------------------------------------------------ */
/* UI atoms                                                            */
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
  unlocked,
  onChange,
}: {
  unlocked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-full border border-neutral-200 bg-white px-3.5 py-1.5 select-none">
      <Checkbox checked={unlocked} onCheckedChange={(v) => onChange(v === true)} />
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium text-neutral-700">
        {unlocked ? (
          <LockOpen className="size-3.5 text-emerald-600" />
        ) : (
          <Lock className="size-3.5 text-neutral-400" />
        )}
        {unlocked ? "Düzenleme açık" : "Düzenleme kilidi"}
      </span>
    </label>
  );
}

/* Badge styles: existing fixed color preserved for class lessons. */
const BADGE_CLASS = "bg-[#14B8A6] text-white"; // sınıf dersi (mevcut sabit renk)
const BADGE_REQUEST = "bg-sky-50 border border-sky-300 text-sky-900"; // havuzdan yerleşen istek
const BADGE_CLASS_EXTRA =
  "bg-orange-50 border border-orange-300 text-orange-900"; // esnek sınıf ek dersi (pastel turuncu)

/* ------------------------------------------------------------------ */
/* Drag payload (delegates to the shared schedule drag module)         */
/* ------------------------------------------------------------------ */

type DragPayload = SharedDragPayload;

const setDragData = setDragDataShared;
const readDragData = readDragDataShared;

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
        "w-full rounded-md px-1.5 py-1 text-[10.5px] leading-tight font-medium",
        BADGE_REQUEST,
      )}
    >
      <div className="truncate font-semibold">{studentName}</div>
      {className && <div className="truncate opacity-80">{className}</div>}
      {missingTopic && (
        <div className="truncate text-[10px] opacity-70">{missingTopic}</div>
      )}
    </div>
  );
}

function ExtraBadge({ title, className }: { title: string; className: string }) {
  return (
    <div className="w-full rounded-md border border-violet-300 bg-violet-50 px-1.5 py-1 text-[10.5px] leading-tight font-medium text-violet-900">
      <div className="truncate font-semibold">{title}</div>
      <div className="truncate text-[10px] opacity-75">{className}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Drag payload                                                        */
/* ------------------------------------------------------------------ */

/* moved to @/lib/scheduleDrag — shared with ClassGroupEkDersPanel */

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export function WeeklySchedule({
  weekStart,
  term,
}: {
  weekStart: Date;
  term: string;
}) {
  const lessons = useQuery(api.lessons.listLessons);
  const classLessons = useQuery(api.lessons.listClassLessons);
  const extraLessons = useQuery(api.lessons.listExtraLessons);
  const classExtras = useQuery(api.lessons.listClassExtraLessons);
  const classGroupExtras = useQuery(api.lessons.listClassGroupExtraLessons);
  const classes = useQuery(api.lessons.listClasses);
  const teachers = useQuery(api.teachers.listTeachers);

  const moveLesson = useMutation(api.lessons.moveLesson);
  const deleteLesson = useMutation(api.lessons.deleteLesson);
  const upsertClassLesson = useMutation(api.lessons.upsertClassLesson);
  const deleteClassLesson = useMutation(api.lessons.deleteClassLesson);
  const upsertExtraLesson = useMutation(api.lessons.upsertExtraLesson);
  const deleteExtraLesson = useMutation(api.lessons.deleteExtraLesson);
  const createClassExtraLesson = useMutation(api.lessons.createClassExtraLesson);
  const moveClassExtraLesson = useMutation(api.lessons.moveClassExtraLesson);
  const deleteClassExtraLesson = useMutation(api.lessons.deleteClassExtraLesson);
  const moveClassGroupExtraLesson = useMutation(
    api.lessons.moveClassGroupExtraLesson,
  );
  const deleteClassGroupExtraLesson = useMutation(
    api.lessons.deleteClassGroupExtraLesson,
  );

  const [unlockClass, setUnlockClass] = useState(false);
  const [unlockTeacher, setUnlockTeacher] = useState(false);
  const [filterSubject, setFilterSubject] = useState<string>("Tüm Dersler");
  const [selectedClass, setSelectedClass] = useState<string>("all");

  const todayDayIndex = useMemo(() => {
    const ymd = todayYmd();
    for (let i = 0; i < 7; i++) {
      if (ymdOfDay(weekStart, i) === ymd) return i;
    }
    return -1;
  }, [weekStart]);
  const [dailyDay, setDailyDay] = useState<number>(
    todayDayIndex >= 0 ? todayDayIndex : 0,
  );

  const [extraDialogOpen, setExtraDialogOpen] = useState(false);
  const [extraTitle, setExtraTitle] = useState("");
  const [extraTeacher, setExtraTeacher] = useState("");
  const [extraClass, setExtraClass] = useState("");
  const [extraDay, setExtraDay] = useState("0");
  const [extraSlot, setExtraSlot] = useState("1");
  const [extraEditId, setExtraEditId] = useState<Id<"extraLessons"> | null>(
    null,
  );
  const [savingExtra, setSavingExtra] = useState(false);

  /* --- Sınıf ek ders talebi formu --- */
  const [ceClass, setCeClass] = useState("");
  const [ceSubject, setCeSubject] = useState<string>("MATEMATİK");
  const [ceTeacher, setCeTeacher] = useState("");
  const [ceTopic, setCeTopic] = useState("");
  const [savingCe, setSavingCe] = useState(false);

  const ready =
    lessons !== undefined &&
    classLessons !== undefined &&
    extraLessons !== undefined &&
    classExtras !== undefined &&
    classGroupExtras !== undefined &&
    classes !== undefined &&
    teachers !== undefined;

  /* --- LocalStorage yansıması: sinifEkDersleri (yenilemede kaybolmaz) --- */
  useEffect(() => {
    try {
      localStorage.setItem(
        "sinifEkDersleri",
        JSON.stringify(classExtras ?? []),
      );
    } catch {
      /* kota dolu vb. — sessiz geç */
    }
  }, [classExtras]);

  const classList = (classes ?? []).filter((c) => c.term === term);
  const teacherList = teachers ?? [];

  /* ---------------- request pool ---------------- */
  const allPoolItems = useMemo(() => {
    const planned = (lessons ?? []).filter(
      (l) => l.status === "planned" && ymdInTerm(l.date, term),
    );
    const taken = new Set(
      (classLessons ?? []).map((c) => `${c.date}|${c.time}|${c.teacherName}`),
    );
    return planned
      .filter((l) => !taken.has(`${l.date}|${l.time}|${l.teacherName}`))
      .sort((a, b) =>
        a.date === b.date
          ? a.time.localeCompare(b.time)
          : a.date.localeCompare(b.date),
      );
  }, [lessons, classLessons, term]);

  const poolItems = useMemo(
    () =>
      filterSubject === "Tüm Dersler"
        ? allPoolItems
        : allPoolItems.filter(
            (l) =>
              l.subject.trim().toLocaleUpperCase("tr") === filterSubject,
          ),
    [allPoolItems, filterSubject],
  );

  /* ---------------- index maps ---------------- */
  const lessonsByTeacherCell = useMemo(() => {
    const map = new Map<string, LessonRow[]>();
    for (const l of lessons ?? []) {
      if (l.status === "cancelled") continue;
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

  const extrasByTeacherCell = useMemo(() => {
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

  const classLessonsByCell = useMemo(() => {
    const map = new Map<string, ClassLessonRow[]>();
    for (const c of classLessons ?? []) {
      const day = dayOffsetOf(c.date, weekStart);
      if (day === null) continue;
      const slot = slotIndexForTime(c.time);
      if (slot === null) continue;
      const key = `${c.className}|${day}|${slot}`;
      const arr = map.get(key);
      if (arr) arr.push(c);
      else map.set(key, [c]);
    }
    return map;
  }, [classLessons, weekStart]);

  /* ---------------- sınıf ek dersleri havuzu + yerleşim haritası ---------------- */
  const termClassExtras = useMemo(
    () =>
      (classExtras ?? []).filter((c) =>
        c.date ? termOfYmd(c.date) === term : (c.term || "") === term,
      ),
    [classExtras, term],
  );

  const classExtraPool = useMemo(
    () =>
      termClassExtras
        .filter((c) => !c.date)
        .sort((a, b) =>
          a.className === b.className
            ? a.subject.localeCompare(b.subject, "tr")
            : a.className.localeCompare(b.className, "tr"),
        ),
    [termClassExtras],
  );

  const classExtrasByCell = useMemo(() => {
    const map = new Map<string, ClassExtraRow>();
    for (const c of classExtras ?? []) {
      if (!c.date) continue;
      const day = dayOffsetOf(c.date, weekStart);
      if (day === null) continue;
      const slot = slotIndexForTime(c.time);
      if (slot === null) continue;
      map.set(`${c.className}|${day}|${slot}`, c);
    }
    return map;
  }, [classExtras, weekStart]);

  /* Sınıf (Grup) Ek Ders yerleşimleri — öğretmen hücre anahtarlı. */
  const classGroupExtrasByCell = useMemo(() => {
    const map = new Map<string, ClassGroupExtraRow>();
    for (const c of classGroupExtras ?? []) {
      if (!c.date) continue;
      const day = dayOffsetOf(c.date, weekStart);
      if (day === null) continue;
      const slot = slotIndexForTime(c.time);
      if (slot === null) continue;
      map.set(`${c.teacherName}|${day}|${slot}`, c);
    }
    return map;
  }, [classGroupExtras, weekStart]);

  /* Bir öğretmen o gün/o saatte gerçekten meşgul mü? (birebir + sınıf dersi + ek ders + sınıf ek dersi) */
  const teacherBusyAt = useMemo(() => {
    const set = new Set<string>();
    for (const l of lessons ?? []) {
      if (l.status === "cancelled") continue;
      set.add(`${l.teacherName}|${l.date}|${l.time}`);
    }
    for (const c of classLessons ?? []) {
      set.add(`${c.teacherName}|${c.date}|${c.time}`);
    }
    for (const e of extraLessons ?? []) {
      set.add(`${e.teacherName}|${e.date}|${e.time}`);
    }
    for (const ce of classExtras ?? []) {
      if (!ce.date) continue;
      set.add(`${ce.teacherName}|${ce.date}|${ce.time}`);
    }
    for (const cg of classGroupExtras ?? []) {
      if (!cg.date) continue;
      set.add(`${cg.teacherName}|${cg.date}|${cg.time}`);
    }
    return set;
  }, [lessons, classLessons, extraLessons, classExtras, classGroupExtras]);

  /* ---------------- drop handlers ---------------- */
  const handleDropTeacher = async (
    e: React.DragEvent,
    teacherName: string,
    day: number,
    slot: number,
  ) => {
    if (!unlockTeacher || !teacherName) return;
    e.preventDefault();
    const payload = readDragData(e);
    if (!payload) return;
    const ymd = ymdOfDay(weekStart, day);
    const start = slotStart(slot);
    if (!start) return;

    const cellKey = `${teacherName}|${day}|${slot}`;
    const cellBusy =
      lessonsByTeacherCell.has(cellKey) || extrasByTeacherCell.has(cellKey);

    if (payload.kind === "pool") {
      const request = (lessons ?? []).find((l) => l._id === payload.requestId);
      if (!request) return;
      if (!requestMatchesBranch(request.subject, teacherName)) {
        toast.error("Branş uyuşmuyor", {
          description: `${request.subject} dersi yalnızca branş öğretmenine planlanabilir.`,
        });
        return;
      }
      if (cellBusy) {
        toast.error("Bu saat dolu", {
          description: `${teacherName} öğretmeninin bu saatinde zaten ders var.`,
        });
        return;
      }
      try {
        await moveLesson({ id: request._id, date: ymd, time: start });
        toast.success("Ders takvime yerleştirildi", {
          description: `${request.studentName} · ${request.subject} · ${DAY_NAMES[day]} ${start} · ${teacherName}`,
        });
      } catch (error) {
        toast.error("Ders yerleştirilemedi", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
      return;
    }

    if (payload.kind === "extra") {
      const extra = (extraLessons ?? []).find((x) => x._id === payload.extraId);
      if (!extra) return;
      if (cellBusy) {
        toast.error("Bu saat dolu");
        return;
      }
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
      return;
    }

    /* Sınıf (Grup) Ek Ders → öğretmenin birebir takvimine yerleşir. */
    if (payload.kind === "classGroupExtra") {
      const cg = (classGroupExtras ?? []).find(
        (c) => c._id === payload.extraId,
      );
      if (!cg) return;
      if (!requestMatchesBranch(cg.subject, teacherName)) {
        toast.error("Branş uyuşmuyor", {
          description: `${cg.subject} ek dersi yalnızca branş öğretmenine planlanabilir; ${teacherName} bu branşta değil.`,
        });
        return;
      }
      if (cg.teacherName && cg.teacherName !== teacherName) {
        toast.error("Öğretmen uyuşmuyor", {
          description: `${cg.className} talebi ${cg.teacherName} için oluşturuldu; ${teacherName} takvimine bırakılamaz.`,
        });
        return;
      }
      if (cellBusy) {
        toast.error("Bu saat dolu", {
          description: `${teacherName} öğretmeninin bu saatinde zaten ders var.`,
        });
        return;
      }
      if (cg.date === ymd && cg.time === start) return; // zaten o slotta
      if (teacherBusyAt.has(`${teacherName}|${ymd}|${start}`)) {
        toast.error("Çakışma var", {
          description: `${teacherName} öğretmeninin ${DAY_NAMES[day]} ${start} saatinde başka dersi var.`,
        });
        return;
      }
      try {
        await moveClassGroupExtraLesson({ id: cg._id, date: ymd, time: start });
        toast.success("Sınıf (Grup) Ek Ders planlandı", {
          description: `${cg.className} · ${cg.subject} · ${DAY_NAMES[day]} ${start} · ${teacherName}`,
        });
      } catch (error) {
        toast.error("Sınıf ek dersi yerleştirilemedi", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
      return;
    }
  };

  const handleDropClass = async (
    e: React.DragEvent,
    className: string,
    day: number,
    cellMap: Map<string, ClassLessonRow[]>,
  ) => {
    if (!unlockClass || !className || className === "all") return;
    e.preventDefault();
    const payload = readDragData(e);
    if (!payload) return;
    const ymd = ymdOfDay(weekStart, day);

    /* 1) Havuzdan gelen birebir istek → sabit sınıf dersine dönüşür. */
    if (payload.kind === "pool") {
      const request = (lessons ?? []).find((l) => l._id === payload.requestId);
      if (!request) return;
      const start = "08:50"; // class grid shows all lessons of the day in one cell
      const slot = slotIndexForTime(start);
      if (slot === null) return;
      const cell = cellMap.get(`${className}|${day}|${slot}`);
      if (cell && cell.length > 0) {
        toast.error("Bu hücre dolu", {
          description: `${className} sınıfının bu saatinde zaten ders var.`,
        });
        return;
      }
      if (!requestMatchesBranch(request.subject, request.teacherName)) {
        toast.error("Branş uyuşmuyor", {
          description: `${request.subject} dersi ${request.teacherName} öğretmenine atanamaz.`,
        });
        return;
      }
      try {
        await upsertClassLesson({
          className,
          subject: request.subject,
          teacherName: request.teacherName,
          date: ymd,
          time: start,
        });
        await deleteLesson({ id: request._id });
        toast.success("Sınıf dersi planlandı", {
          description: `${className} · ${request.subject} · ${DAY_NAMES[day]} ${start} · ${request.teacherName}`,
        });
      } catch (error) {
        toast.error("Sınıf dersi oluşturulamadı", {
          description: error instanceof Error ? error.message : undefined,
        });
      }
      return;
    }

    /* 2) Sınıf ek dersi havuzundan gelen esnek talep → ilk boş slota yerleşir. */
    if (payload.kind === "classExtra") {
      const ce = (classExtras ?? []).find((c) => c._id === payload.extraId);
      if (!ce) return;
      if (!requestMatchesBranch(ce.subject, ce.teacherName)) {
        toast.error("Branş uyuşmuyor", {
          description: `${ce.subject} ek dersi yalnızca branş öğretmenine planlanabilir; ${ce.teacherName} bu branşta değil.`,
        });
        return;
      }
      if (ce.className !== className) {
        toast.error("Sınıf uyuşmuyor", {
          description: `${ce.className} talebi ${className} sınıfına bırakılamaz.`,
        });
        return;
      }
      // Talebin sınıfı için ilk boş slota yerleş (kartın kendi hücresi hariç).
      for (const s of TIME_SLOTS) {
        const cellFixed = classLessonsByCell.get(`${className}|${day}|${s.index}`);
        const cellExtra = classExtrasByCell.get(`${className}|${day}|${s.index}`);
        if (cellFixed && cellFixed.length > 0) continue;
        if (cellExtra && cellExtra._id !== ce._id) continue;
        const start = slotStart(s.index);
        if (!start) continue;
        if (ce.date === ymd && ce.time === start) continue; // zaten o slotta
        if (
          ce.teacherName &&
          teacherBusyAt.has(`${ce.teacherName}|${ymd}|${start}`)
        ) {
          continue; // öğretmen o slotta dolu; sonraki slotu dene
        }
        try {
          await moveClassExtraLesson({ id: ce._id, date: ymd, time: start });
          toast.success("Sınıf ek dersi planlandı", {
            description: `${className} · ${ce.subject} · ${DAY_NAMES[day]} ${start} · ${ce.teacherName}`,
          });
        } catch (error) {
          toast.error("Sınıf ek dersi yerleştirilemedi", {
            description: error instanceof Error ? error.message : undefined,
          });
        }
        return;
      }
      toast.error("Uygun boş saat yok", {
        description: `${className} sınıfının ${DAY_NAMES[day]} günü müsait bir saati bulunamadı.`,
      });
    }
  };

  /** Takvimde yerleşik sınıf ek dersini başka gün/slota taşır. */
  const handleMoveClassExtra = async (
    ce: ClassExtraRow,
    day: number,
    slot: number,
  ) => {
    const ymd = ymdOfDay(weekStart, day);
    if (!requestMatchesBranch(ce.subject, ce.teacherName)) {
      toast.error("Branş uyuşmuyor");
      return;
    }
    const start = slotStart(slot);
    if (!start) return;
    // Kartın kendi hücresine bırakma, öğretmen çakışması sayılmasın.
    if (
      ce.teacherName &&
      teacherBusyAt.has(`${ce.teacherName}|${ymd}|${start}`) &&
      !(ce.date === ymd && ce.time === start)
    ) {
      toast.error("Çakışma var", {
        description: `${ce.teacherName} öğretmeninin ${DAY_NAMES[day]} ${start} saatinde başka dersi var.`,
      });
      return;
    }
    const cellFixed = classLessonsByCell.get(`${ce.className}|${day}|${slot}`);
    const cellExtra = classExtrasByCell.get(`${ce.className}|${day}|${slot}`);
    const ownCell = cellExtra?._id === ce._id;
    if ((cellFixed && cellFixed.length > 0) || (cellExtra && !ownCell)) {
      toast.error("Bu hücre dolu", {
        description: `${ce.className} sınıfının bu saatinde zaten ders var.`,
      });
      return;
    }
    try {
      await moveClassExtraLesson({ id: ce._id, date: ymd, time: start });
      toast.success("Ek ders taşındı", {
        description: `${ce.className} · ${DAY_NAMES[day]} ${start}`,
      });
    } catch (error) {
      toast.error("Ek ders taşınamadı", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  /** Havuza geri alma (yerleşimi kaldır). */
  const returnClassExtraToPool = async (ce: ClassExtraRow) => {
    try {
      await moveClassExtraLesson({ id: ce._id, date: "", time: "" });
      toast("Ek ders havuza alındı", {
        description: `${ce.className} · ${ce.subject}`,
      });
    } catch {
      toast.error("Havuza alınamadı");
    }
  };

  const removeClassLesson = async (row: ClassLessonRow) => {
    try {
      await deleteClassLesson({ id: row._id });
      toast("Sınıf dersi silindi", {
        description: `${row.className} · ${row.subject} · ${row.date} ${row.time}`,
      });
    } catch {
      toast.error("Sınıf dersi silinemedi");
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
      type: "birebir" | "sinif" | "ek" | "sinifEk";
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
    for (const ce of classExtras ?? []) {
      if (ce.date !== ymd) continue;
      rows.push({
        teacher: ce.teacherName,
        student: ce.className,
        studentClass: "Ek ders",
        subject: ce.subject,
        topic: ce.topic || "—",
        time: ce.time,
        type: "sinifEk",
      });
    }
    for (const cg of classGroupExtras ?? []) {
      if (cg.date !== ymd) continue;
      rows.push({
        teacher: cg.teacherName,
        student: cg.className,
        studentClass: "Sınıf (Grup) Ek ders",
        subject: cg.subject,
        topic: cg.topic || "—",
        time: cg.time,
        type: "sinifEk",
      });
    }
    return rows.sort((a, b) =>
      a.time === b.time
        ? a.teacher.localeCompare(b.teacher, "tr")
        : a.time.localeCompare(b.time),
    );
  }, [
    lessons,
    classLessons,
    extraLessons,
    classExtras,
    classGroupExtras,
    weekStart,
    dailyDay,
  ]);

  if (!ready) {
    return (
      <div className="flex min-h-[30vh] items-center justify-center rounded-2xl border border-neutral-200/80 bg-white">
        <div className="size-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {/* İki havuz yan yana: birebir istek havuzu + sınıf ek ders havuzu */}
      <div className="grid items-start gap-5 xl:grid-cols-2">
      {/* ==================================================== */}
      {/* Ders İstek Havuzu                                     */}
      {/* ==================================================== */}
      <SectionShell
        title="Ders İstek Havuzu"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-amber-500">
            <Filter className="size-4 text-white" />
          </span>
        }
        badge={`${poolItems.length}/${allPoolItems.length} istek`}
        action={
          <div className="flex flex-wrap items-center gap-1.5">
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
                {s === "Tüm Dersler"
                  ? s
                  : s.charAt(0) + s.slice(1).toLocaleLowerCase("tr")}
              </button>
            ))}
          </div>
        }
      >
        {poolItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            {filterSubject === "Tüm Dersler"
              ? "Havuzda bekleyen istek yok. Planlanan birebir dersler burada listelenir."
              : "Bu ders için havuzda bekleyen istek yok."}
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {poolItems.map((l) => (
              <div
                key={l._id}
                draggable
                onDragStart={(e) =>
                  setDragData(e, { kind: "pool", requestId: l._id })
                }
                className="cursor-grab rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] leading-tight transition-shadow active:cursor-grabbing hover:shadow-sm"
              >
                <div className="font-semibold text-amber-900">
                  {l.studentName}
                </div>
                <div className="text-amber-700">
                  {l.subject}
                  {l.missingTopic ? ` · ${l.missingTopic}` : ""}
                </div>
                <div className="text-[11px] text-amber-600/80">
                  {l.teacherName} · {l.date.split("-").reverse().join(".")}{" "}
                  {l.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </SectionShell>

      {/* ==================================================== */}
      {/* Sınıf Ek Ders Havuzu (esnek, haftalık değişebilir)    */}
      {/* ==================================================== */}
      <SectionShell
        title="Sınıf Ek Ders Havuzu"
        icon={
          <span className="flex size-7 items-center justify-center rounded-lg bg-orange-500">
            <Layers className="size-4 text-white" />
          </span>
        }
        badge={`${classExtraPool.length} talep`}
      >
        {/* Talep oluşturma formu */}
        <div className="grid gap-2.5 rounded-xl border border-orange-100 bg-orange-50/40 p-3">
          <div className="grid gap-2.5 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
                Sınıf / Grup
              </label>
              <Select value={ceClass} onValueChange={setCeClass}>
                <SelectTrigger className="h-8 w-full text-[12px]">
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
            <div>
              <label className="mb-1 block text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
                Ders / Branş
              </label>
              <Select
                value={ceSubject}
                onValueChange={(v) => {
                  setCeSubject(v);
                  if (ceTeacher && !requestMatchesBranch(v, ceTeacher)) {
                    setCeTeacher("");
                  }
                }}
              >
                <SelectTrigger className="h-8 w-full text-[12px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUBJECTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
                Öğretmen (branş)
              </label>
              <Select value={ceTeacher} onValueChange={setCeTeacher}>
                <SelectTrigger className="h-8 w-full text-[12px]">
                  <SelectValue placeholder="Öğretmen seç" />
                </SelectTrigger>
                <SelectContent>
                  {teacherList
                    .filter((t: TeacherRow) =>
                      requestMatchesBranch(ceSubject, t.name),
                    )
                    .map((t: TeacherRow) => (
                      <SelectItem key={t._id} value={t.name}>
                        {t.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
                Anlatılacak Konu
              </label>
              <input
                value={ceTopic}
                onChange={(e) => setCeTopic(e.target.value)}
                placeholder="örn. Trigonometri tekrarı"
                className="h-8 w-full rounded-md border border-input bg-white px-2.5 text-[12px] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <Button
            type="button"
            disabled={
              savingCe || !ceClass || !ceSubject || !ceTeacher || !ceTopic.trim()
            }
            onClick={async () => {
              setSavingCe(true);
              try {
                await createClassExtraLesson({
                  className: ceClass,
                  subject: ceSubject,
                  teacherName: ceTeacher,
                  topic: ceTopic,
                  scheduledDate: "",
                  scheduledTime: "",
                  term,
                });
                toast.success("Sınıf ek ders talebi oluşturuldu", {
                  description: `${ceClass} · ${ceSubject} · ${ceTeacher} — havuza eklendi, sürükleyerek takvime yerleştirin.`,
                });
                setCeTopic("");
              } catch (error) {
                toast.error("Talep oluşturulamadı", {
                  description:
                    error instanceof Error ? error.message : undefined,
                });
              } finally {
                setSavingCe(false);
              }
            }}
            className="h-8 cursor-pointer justify-self-start rounded-full bg-orange-500 px-4 text-[12px] font-semibold text-white hover:bg-orange-600"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Sınıf Ek Ders Talebi Oluştur
          </Button>
        </div>

        {/* Havuz kartları (kronolojik / sınıf sıralı, sürüklenebilir) */}
        {termClassExtras.length === 0 ? (
          <p className="py-6 text-center text-sm text-neutral-400">
            {term} dönemi için henüz sınıf ek ders talebi yok. Formu doldurup
            havuza ekleyin; sonra kartı Sınıf Programı'na sürükleyin.
          </p>
        ) : (
          <div className="mt-3 flex flex-wrap gap-2">
            {termClassExtras
              .slice()
              .sort((a, b) =>
                a.className === b.className
                  ? a.subject.localeCompare(b.subject, "tr")
                  : a.className.localeCompare(b.className, "tr"),
              )
              .map((c) => (
                <div
                  key={c._id}
                  draggable={Boolean(c.date) || true}
                  onDragStart={(ev) =>
                    setDragData(ev, { kind: "classExtra", extraId: c._id })
                  }
                  className="cursor-grab rounded-lg border border-orange-200 bg-orange-50 px-3 py-2 text-[12px] leading-tight active:cursor-grabbing hover:shadow-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-orange-900">
                      {c.className}
                    </span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                        c.date
                          ? "bg-orange-100 text-orange-700"
                          : "bg-neutral-100 text-neutral-500",
                      )}
                    >
                      {c.date ? "planlandı" : "havuzda"}
                    </span>
                  </div>
                  <div className="text-orange-800">
                    {c.subject} · {c.teacherName}
                  </div>
                  <div className="truncate text-[11px] text-orange-700/80">
                    {c.topic}
                  </div>
                  {c.date ? (
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-orange-600/80">
                      {c.date.split("-").reverse().join(".")} {c.time}
                      <button
                        type="button"
                        title="Havuza geri al"
                        className="cursor-pointer font-medium hover:text-orange-900"
                        onClick={() => void returnClassExtraToPool(c)}
                      >
                        havuza al
                      </button>
                    </div>
                  ) : null}
                  <button
                    type="button"
                    title="Talebi sil"
                    className="mt-0.5 cursor-pointer text-[11px] font-medium text-red-400 hover:text-red-600"
                    onClick={async () => {
                      try {
                        await deleteClassExtraLesson({ id: c._id });
                        toast("Talep silindi", {
                          description: `${c.className} · ${c.subject}`,
                        });
                      } catch {
                        toast.error("Talep silinemedi");
                      }
                    }}
                  >
                    sil
                  </button>
                </div>
              ))}
          </div>
        )}
        <p className="mt-3 text-[11px] text-neutral-400">
          Kartları Sınıf Programı'ndaki boş günlere sürükleyin; uygun ilk boş
          saate yerleşir. Kilit açıkken yerleşen kartları takvimde
          taşıyabilir, ✕ ile silebilirsiniz.
        </p>
      </SectionShell>
      </div>

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
          <div className="flex flex-wrap items-center gap-2">
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="h-8 w-[190px] text-[13px]">
                <SelectValue placeholder="Sınıf seç" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm sınıflar</SelectItem>
                {classList.map((c: ClassRow) => (
                  <SelectItem key={c._id} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <EditLockToggle
              unlocked={unlockClass}
              onChange={(v) => setUnlockClass(v)}
            />
          </div>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0 text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-20 min-w-20 bg-white px-2 py-2 text-left text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Saat
                </th>
                <th className="w-32 min-w-32 px-2 py-2 text-left text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Sınıf
                </th>
                {DAY_NAMES.map((_, i) => (
                  <th
                    key={i}
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
              {classList.map((cls: ClassRow) => (
                <tr key={cls._id}>
                  <td className="sticky left-0 z-10 border-t border-neutral-100 bg-white px-2 py-1.5 text-[11px] font-medium text-neutral-300">
                    {selectedClass === cls.name ? "•" : ""}
                  </td>
                  <td className="border-t border-neutral-100 bg-neutral-50/60 px-2 py-1.5 text-[11px] font-semibold whitespace-nowrap text-neutral-700">
                    {cls.name}
                  </td>
                  {DAY_NAMES.map((_, dayIndex) => {
                    const ymd = ymdOfDay(weekStart, dayIndex);
                    if (
                      selectedClass !== "all" &&
                      selectedClass !== cls.name
                    ) {
                      return (
                        <td
                          key={dayIndex}
                          className="border-t border-l border-neutral-100 bg-neutral-50/30 px-1.5 py-1 align-top last:border-r"
                        />
                      );
                    }
                    return (
                      <td
                        key={dayIndex}
                        onDragOver={(e) => {
                          if (!unlockClass) {
                            e.dataTransfer.dropEffect = "none";
                            return;
                          }
                          e.preventDefault();
                          e.dataTransfer.dropEffect = "move";
                        }}
                        onDrop={(e) => {
                          if (!unlockClass) return;
                          const payload = readDragData(e);
                          if (
                            payload?.kind === "classExtra" &&
                            payload.extraId
                          ) {
                            const ce = (classExtras ?? []).find(
                              (c) => c._id === payload.extraId,
                            );
                            if (!ce) return;
                            const slot = slotIndexForTime(ce.time);
                            const ownDay =
                              ce.date === ymdOfDay(weekStart, dayIndex);
                            // Yerleşmiş kart kendi hücresine bırakıldıysa dokunma;
                            // kendi gününe bırakıldıysa ilk boş slota taşı.
                            if (ce.date && ownDay && slot !== null) {
                              void handleMoveClassExtra(
                                ce,
                                dayIndex,
                                slot,
                              );
                            } else {
                              void handleDropClass(
                                e,
                                cls.name,
                                dayIndex,
                                classLessonsByCell,
                              );
                            }
                            return;
                          }
                          void handleDropClass(
                            e,
                            cls.name,
                            dayIndex,
                            classLessonsByCell,
                          );
                        }}
                        className={cn(
                          "border-t border-l border-neutral-100 px-1.5 py-1 align-top last:border-r",
                          unlockClass &&
                            "cursor-pointer hover:bg-teal-50/50",
                        )}
                      >
                        <ClassDayCell
                          className={cls.name}
                          dayIndex={dayIndex}
                          ymd={ymd}
                          cellMap={classLessonsByCell}
                        />                        {/* Esnek sınıf ek dersi kartları (pastel turuncu) */}
                        {TIME_SLOTS.map((s) => {
                          const ce = classExtrasByCell.get(
                            `${cls.name}|${dayIndex}|${s.index}`,
                          );
                          if (!ce) return null;
                          return (
                            <div
                              key={ce._id}
                              draggable={unlockClass}
                              onDragStart={(ev) =>
                                setDragData(ev, {
                                  kind: "classExtra",
                                  extraId: ce._id,
                                })
                              }
                              className={cn(
                                "group relative mt-1 rounded-md px-1.5 py-1 text-[10.5px] leading-tight font-medium",
                                BADGE_CLASS_EXTRA,
                                unlockClass
                                  ? "cursor-grab active:cursor-grabbing"
                                  : "cursor-not-allowed",
                              )}
                              title={`${ce.subject} · ${ce.teacherName} · ${ce.topic}`}
                            >
                              <div className="flex items-center justify-between gap-1">
                                <span className="tabular-nums opacity-80">
                                  {ce.time}
                                </span>
                                {unlockClass && (
                                  <button
                                    type="button"
                                    title="Ek dersi sil"
                                    className="shrink-0 cursor-pointer font-bold text-orange-400 hover:text-red-600"
                                    onClick={(ev) => {
                                      ev.stopPropagation();
                                      void (async () => {
                                        try {
                                          await deleteClassExtraLesson({
                                            id: ce._id,
                                          });
                                          toast("Sınıf ek dersi silindi", {
                                            description: `${ce.className} · ${ce.subject} · ${ce.date} ${ce.time}`,
                                          });
                                        } catch {
                                          toast.error(
                                            "Sınıf ek dersi silinemedi",
                                          );
                                        }
                                      })();
                                    }}
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                              <div className="truncate">{ce.subject}</div>
                              <div className="truncate opacity-90">
                                {ce.teacherName}
                              </div>
                              <div className="truncate text-[10px] opacity-70">
                                {ce.topic}
                              </div>
                            </div>
                          );
                        })}
                      </td>
                    );
                  })}
                </tr>
              ))}
              {classList.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="py-6 text-center text-sm text-neutral-400"
                  >
                    Henüz sınıf eklenmemiş.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Sınıf programındaki her hücre o gün o saatte sınıfın aldığı grubu
          gösterir (ders + öğretmen kartı). Düzenleme kilidi açıkken havuzdan
          sürükleyerek sınıf dersi oluşturabilirsiniz.
        </p>
      </SectionShell>

      {/* ==================================================== */}
      {/* Öğretmen Birebir Programı (tek toplu tablo)           */}
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
            unlocked={unlockTeacher}
            onChange={(v) => setUnlockTeacher(v)}
          />
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px] border-separate border-spacing-0 text-[12px]">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 w-32 min-w-32 bg-white px-2 py-2 text-left text-[10px] font-semibold tracking-wider text-neutral-400 uppercase">
                  Öğretmen / Saat
                </th>
                {DAY_NAMES.map((_, i) => (
                  <th
                    key={i}
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
              {teacherList.map((teacher: TeacherRow) => {
                const tName = teacher.name.trim();
                const isTurGroup =
                  requestMatchesBranch("TÜRKÇE", tName) &&
                  requestMatchesBranch("EDEBİYAT", tName) &&
                  (tName === "EREN BİLGİLİ" || tName === "FATMA KURT");
                return (
                  <tr key={teacher._id} className="align-top">
                    <td className="sticky left-0 z-10 border-t border-neutral-100 bg-white px-2 py-1.5">
                      <div className="text-[12px] font-semibold whitespace-nowrap text-neutral-800">
                        {tName}
                      </div>
                      {isTurGroup && (
                        <div className="text-[10px] font-medium text-blue-600">
                          TÜRKÇE / EDEBİYAT
                        </div>
                      )}
                    </td>
                    {DAY_NAMES.map((_, dayIndex) => (
                      <td
                        key={dayIndex}
                        className="border-t border-l border-neutral-100 px-1 py-1.5 align-top last:border-r"
                      >
                        <div className="flex flex-col gap-1">
                          {TIME_SLOTS.map((slot) => {
                            const cellKey = `${tName}|${dayIndex}|${slot.index}`;
                            const cellLessons =
                              lessonsByTeacherCell.get(cellKey);
                            const cellExtra =
                              extrasByTeacherCell.get(cellKey);
                            const cellCg =
                              classGroupExtrasByCell.get(cellKey);
                            const hasContent =
                              (cellLessons && cellLessons.length > 0) ||
                              Boolean(cellExtra) ||
                              Boolean(cellCg);
                            return (
                              <div
                                key={slot.index}
                                onDragOver={(e) => {
                                  if (!unlockTeacher || hasContent) {
                                    e.dataTransfer.dropEffect = "none";
                                    return;
                                  }
                                  e.preventDefault();
                                  e.dataTransfer.dropEffect = "move";
                                }}
                                onDrop={(e) => {
                                  if (!unlockTeacher || hasContent) return;
                                  void handleDropTeacher(
                                    e,
                                    tName,
                                    dayIndex,
                                    slot.index,
                                  );
                                }}
                                className={cn(
                                  "flex min-h-[30px] flex-col gap-0.5 rounded-md border border-dashed border-transparent px-1 py-0.5 transition-colors",
                                  hasContent &&
                                    "border-solid border-neutral-100 bg-neutral-50/70",
                                  !hasContent &&
                                    unlockTeacher &&
                                    "hover:border-blue-200 hover:bg-blue-50/40",
                                  !unlockTeacher && "cursor-not-allowed",
                                )}
                                title={`${tName} · ${DAY_NAMES[dayIndex]} · ${slot.index}. Ders ${slot.start}-${slot.end}`}
                              >
                                {cellLessons?.map((l) => (
                                  <RequestBadge
                                    key={l._id}
                                    studentName={l.studentName}
                                    className={l.className || undefined}
                                    missingTopic={l.missingTopic}
                                  />
                                ))}
                                {cellExtra && (
                                  <ExtraBadge
                                    title={cellExtra.title}
                                    className={cellExtra.className}
                                  />
                                )}
                                {cellCg && (
                                  <div
                                    draggable={unlockTeacher}
                                    onDragStart={(ev) =>
                                      setDragData(ev, {
                                        kind: "classGroupExtra",
                                        extraId: cellCg._id,
                                      })
                                    }
                                    className={cn(
                                      "w-full rounded-md border border-emerald-300 bg-emerald-50 px-1.5 py-1 text-[10.5px] leading-tight font-medium text-emerald-900",
                                      unlockTeacher
                                        ? "cursor-grab active:cursor-grabbing"
                                        : "cursor-not-allowed",
                                    )}
                                    title={`${cellCg.className} · ${cellCg.subject} · ${cellCg.teacherName} · ${cellCg.topic}`}
                                  >
                                    <div className="flex items-center justify-between gap-1">
                                      <span className="tabular-nums opacity-80">
                                        {cellCg.time}
                                      </span>
                                      {unlockTeacher && (
                                        <button
                                          type="button"
                                          title="Ek dersi sil"
                                          className="shrink-0 cursor-pointer font-bold text-emerald-400 hover:text-red-600"
                                          onClick={(ev) => {
                                            ev.stopPropagation();
                                            void (async () => {
                                              try {
                                                await deleteClassGroupExtraLesson({
                                                  id: cellCg._id,
                                                });
                                                toast("Sınıf (Grup) Ek dersi silindi", {
                                                  description: `${cellCg.className} · ${cellCg.subject} · ${cellCg.date} ${cellCg.time}`,
                                                });
                                              } catch {
                                                toast.error(
                                                  "Sınıf (Grup) Ek dersi silinemedi",
                                                );
                                              }
                                            })();
                                          }}
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>
                                    <div className="truncate font-semibold">
                                      {cellCg.className}
                                    </div>
                                    <div className="truncate">
                                      {cellCg.subject}
                                    </div>
                                    <div className="truncate text-[10px] opacity-75">
                                      {cellCg.topic}
                                    </div>
                                  </div>
                                )}
                                {!hasContent && (
                                  <span className="text-[9px] text-neutral-200">
                                    {slot.start}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-[11px] text-neutral-400">
          Hücrelerde öğrencinin adı, sınıfı ve eksik konusu alt alta listelenir;
          ek dersler mor kartla görünür. Düzenleme kilidi açıkken havuzdaki
          istekleri boş saatlere sürükleyin — branş dışı öğretmene bırakma
          engellenir.
        </p>
      </SectionShell>

      {/* Sınıf (Grup) Ek Ders — bağımsız bölüm (birebir mantığı, sınıfa yazılır) */}
      <ClassGroupEkDersPanel term={term} />

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
                  {[
                    "Saat",
                    "Öğretmen",
                    "Öğrenci / Grup",
                    "Sınıf",
                    "Ders",
                    "Eksik Konu",
                    "Tür",
                  ].map((head) => (
                    <th
                      key={head}
                      className="h-9 px-3 text-left text-[11px] font-semibold tracking-wider text-neutral-400 uppercase"
                    >
                      {head}
                    </th>
                  ))}
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
                          row.type === "sinifEk" &&
                            "bg-orange-50 text-orange-700",
                        )}
                      >
                        {row.type === "birebir"
                          ? "Birebir"
                          : row.type === "sinif"
                            ? "Sınıf"
                            : row.type === "sinifEk"
                              ? "Sınıf Ek"
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
      {/* Ek Dersler                                            */}
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
              setExtraDay(String(todayDayIndex >= 0 ? todayDayIndex : 0));
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
                  onDragStart={(ev) =>
                    setDragData(ev, { kind: "extra", extraId: e._id })
                  }
                  className="cursor-grab rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-[12px] leading-tight active:cursor-grabbing hover:shadow-sm"
                >
                  <div className="font-semibold text-violet-900">
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
                      className="cursor-pointer font-medium text-violet-500 hover:text-violet-800"
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
                      className="cursor-pointer font-medium text-red-500 hover:text-red-700"
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

      {/* Sınıf dersi sil butonları (kilitliyken gizli) */}
      {unlockClass && (classLessons ?? []).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {(classLessons ?? [])
            .slice()
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .map((c) => (
              <button
                key={c._id}
                type="button"
                onClick={() => void removeClassLesson(c)}
                className="cursor-pointer rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] text-neutral-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                title="Sınıf dersini sil"
              >
                {c.className} · {c.subject} ·{" "}
                {c.date.split("-").reverse().join(".")} {c.time} ✕
              </button>
            ))}
        </div>
      )}

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
                savingExtra || !extraTitle.trim() || !extraTeacher || !extraClass
              }
              className="cursor-pointer bg-violet-600 text-white hover:bg-violet-700"
              onClick={async () => {
                setSavingExtra(true);
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
                } finally {
                  setSavingExtra(false);
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

/* ------------------------------------------------------------------ */
/* Class-day cell: shows the grouped class lessons of that day/slot    */
/* ------------------------------------------------------------------ */

function ClassDayCell({
  className,
  dayIndex,
  ymd,
  cellMap,
}: {
  className: string;
  dayIndex: number;
  ymd: string;
  cellMap: Map<string, ClassLessonRow[]>;
}) {
  const rows: ClassLessonRow[] = [];
  for (const [key, list] of cellMap) {
    void key;
    for (const c of list) {
      if (c.className === className && c.date === ymd) rows.push(c);
    }
  }
  if (rows.length === 0) {
    return (
      <span className="block text-center text-[10px] text-neutral-300">—</span>
    );
  }
  return (
    <div className="flex flex-col gap-0.5">
      {rows
        .slice()
        .sort((a, b) => a.time.localeCompare(b.time))
        .map((c) => (
          <div
            key={c._id}
            className={cn(
              "rounded-md px-1.5 py-1 text-[10.5px] leading-tight font-semibold",
              BADGE_CLASS,
            )}
            title={`${c.subject} · ${c.teacherName} · ${DAY_NAMES[dayIndex]} ${c.time}`}
          >
            <span className="tabular-nums opacity-80">{c.time}</span>
            <div className="truncate">{c.subject}</div>
            <div className="truncate font-medium opacity-90">
              {c.teacherName}
            </div>
          </div>
        ))}
    </div>
  );
}
