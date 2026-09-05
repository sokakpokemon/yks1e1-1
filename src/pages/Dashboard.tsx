import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ActionBar } from "@/components/kurs/ActionBar";
import { ClassGroupEkDersPanel } from "@/components/kurs/ClassGroupEkDersPanel";
import { BackupManager } from "@/components/kurs/BackupManager";
import { LessonTable } from "@/components/kurs/LessonTable";
import { PlanForm } from "@/components/kurs/PlanForm";
import { RosterManager } from "@/components/kurs/RosterManager";
import { StatCards, type StatScope, type StatValues } from "@/components/kurs/StatCards";
import { SubjectDonut, type SubjectCount } from "@/components/kurs/SubjectDonut";
import { WeeklySchedule } from "@/components/kurs/WeeklySchedule";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  addDays,
  currentTerm,
  fmtWeekRange,
  startOfWeekMonday,
  subjectLabel,
  termOfYmd,
  termPlus,
  termStartDate,
  todayYmd,
  ymdInTerm,
  ymdOf,
} from "@/lib/yks";
import { useMutation, useQuery } from "convex/react";
import { CalendarRange, GraduationCap, Home, Loader2, LogOut } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";

type LessonRow = Doc<"lessons">;

function initialsOf(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toLocaleUpperCase("tr");
  }
  return source.slice(0, 2).toLocaleUpperCase("tr");
}

function sortLessons(rows: LessonRow[]): LessonRow[] {
  return [...rows].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1;
    return a.time.localeCompare(b.time);
  });
}

function subjectCountsOf(
  rows: Array<{ subject: string }>,
): SubjectCount[] {
  const map = new Map<string, number>();
  for (const row of rows) {
    const label = subjectLabel(row.subject);
    map.set(label, (map.get(label) ?? 0) + 1);
  }
  return [...map.entries()].map(([subject, count]) => ({ subject, count }));
}

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const lessons = useQuery(api.lessons.listLessons);
  const teachers = useQuery(api.teachers.listTeachers);
  const classLessons = useQuery(api.lessons.listClassLessons);
  const extraLessons = useQuery(api.lessons.listExtraLessons);
  const classExtras = useQuery(api.lessons.listClassExtraLessons);
  const classGroups = useQuery(api.lessons.listClassGroupExtraLessons);
  const classes = useQuery(api.lessons.listClasses);
  const students = useQuery(api.lessons.listStudents);
  const ensureSampleData = useMutation(api.lessons.ensureSampleData);
  const ensureTermDefaults = useMutation(api.lessons.ensureTermDefaults);

  const [scope, setScope] = useState<StatScope>("week");
  const [term, setTerm] = useState<string>(() => currentTerm());
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeekMonday(new Date()),
  );
  const exportNodes = useRef<(HTMLElement | null)[]>([]);

  /* One-time demo dataset for a fresh course. */
  useEffect(() => {
    if (!user?._id) return;
    if (lessons === undefined || teachers === undefined) return;
    if (lessons.length > 0 || teachers.length > 0) return;
    try {
      if (localStorage.getItem(`yks-sample:${user._id}`)) return;
      localStorage.setItem(`yks-sample:${user._id}`, "1");
    } catch {
      /* storage unavailable — server-side flag still protects us */
    }
    void ensureSampleData({ today: todayYmd() }).catch((error) => {
      console.error("sample data seeding failed:", error);
    });
  }, [user, lessons, teachers, ensureSampleData]);

  /* Dönem bazlı varsayılan sınıf listesi (yalnızca güncel dönemde, bir kez). */
  useEffect(() => {
    if (!user?._id) return;
    if (classes === undefined || classes === null) return;
    const classesForTerm = classes.filter((c) => c.term === term);
    if (term !== currentTerm() || classesForTerm.length > 0) return;
    try {
      if (localStorage.getItem(`yks-defaults:${user._id}:${term}`)) return;
      localStorage.setItem(`yks-defaults:${user._id}:${term}`, "1");
    } catch {
      /* storage unavailable */
    }
    void ensureTermDefaults({ term }).catch((error) => {
      console.error("default roster seeding failed:", error);
    });
  }, [user, term, classes, ensureTermDefaults]);

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const weekFrom = useMemo(() => ymdOf(weekStart), [weekStart]);
  const weekToExclusive = useMemo(
    () => ymdOf(addDays(weekStart, 7)),
    [weekStart],
  );

  const dateInScope = useCallback(
    (ymd: string): boolean => {
      if (!ymd) return false;
      if (scope === "week") {
        return ymd >= weekFrom && ymd < weekToExclusive;
      }
      return ymdInTerm(ymd, term);
    },
    [scope, weekFrom, weekToExclusive, term],
  );

  const allTerms = useMemo(() => {
    const set = new Set<string>();
    set.add(currentTerm());
    const addDate = (ymd: string) => {
      const t = termOfYmd(ymd);
      if (t) set.add(t);
    };
    const addTerm = (t: string | undefined | null) => {
      if (t) set.add(t);
    };
    lessons?.forEach((l) => addDate(l.date));
    classLessons?.forEach((c) => addDate(c.date));
    extraLessons?.forEach((e) => addDate(e.date));
    classExtras?.forEach((c) => (c.date ? addDate(c.date) : addTerm(c.term)));
    classGroups?.forEach((c) => (c.date ? addDate(c.date) : addTerm(c.term)));
    (classes ?? []).forEach((c) => addTerm(c.term));
    (students ?? []).forEach((s) => addTerm(s.term));
    // Her zaman ileriye dönük bir boş dönem de seçilebilsin.
    set.add(termPlus(currentTerm(), 1));
    return [...set].sort();
  }, [
    lessons,
    classLessons,
    extraLessons,
    classExtras,
    classGroups,
    classes,
    students,
  ]);

  const handleTermChange = (next: string) => {
    setTerm(next);
    const today = todayYmd();
    if (!ymdInTerm(today, next)) {
      // Dönem içinde "bugün" yoksa dönemin başındaki haftaya git.
      setWeekStart(startOfWeekMonday(termStartDate(next)));
    }
  };

  const scopedSorted = useMemo(() => {
    if (!lessons) return [];
    return sortLessons(lessons.filter((l) => dateInScope(l.date)));
  }, [lessons, dateInScope]);

  const scopedClassLessons = useMemo(
    () => (classLessons ?? []).filter((c) => dateInScope(c.date)),
    [classLessons, dateInScope],
  );

  const scopedExtraLessons = useMemo(
    () => (extraLessons ?? []).filter((e) => dateInScope(e.date)),
    [extraLessons, dateInScope],
  );

  const scopedClassExtras = useMemo(
    () =>
      (classExtras ?? []).filter(
        (c) => c.date !== "" && dateInScope(c.date),
      ),
    [classExtras, dateInScope],
  );

  const scopedClassGroups = useMemo(
    () =>
      (classGroups ?? []).filter(
        (c) => c.date !== "" && dateInScope(c.date),
      ),
    [classGroups, dateInScope],
  );

  const stats = useMemo<StatValues>(() => {
    const active = scopedSorted.filter((l) => l.status !== "cancelled");
    const plannedBirebir = scopedSorted.filter(
      (l) => l.status === "planned",
    ).length;
    const sinifDersi = scopedClassLessons.length;
    const ekDers = scopedExtraLessons.length + scopedClassExtras.length;
    const sinifGrupEk = scopedClassGroups.length;
    const birebir = active.length;
    const students = new Set(active.map((l) => l.studentName.trim())).size;
    return {
      total: birebir + sinifDersi + ekDers + sinifGrupEk,
      birebir,
      sinifDersi,
      ekDers,
      sinifGrupEk,
      students,
      planned: plannedBirebir + sinifDersi + ekDers + sinifGrupEk,
    };
  }, [
    scopedSorted,
    scopedClassLessons,
    scopedExtraLessons,
    scopedClassExtras,
    scopedClassGroups,
  ]);

  const birebirCounts = useMemo<SubjectCount[]>(
    () =>
      subjectCountsOf(
        scopedSorted.filter((l) => l.status !== "cancelled"),
      ),
    [scopedSorted],
  );

  const sinifCounts = useMemo<SubjectCount[]>(
    () => subjectCountsOf(scopedClassLessons),
    [scopedClassLessons],
  );

  const ekCounts = useMemo<SubjectCount[]>(() => {
    const rows: Array<{ subject: string }> = [
      ...scopedExtraLessons.map(() => ({ subject: "Ek Ders" })),
      ...scopedClassExtras,
    ];
    return subjectCountsOf(rows);
  }, [scopedExtraLessons, scopedClassExtras]);

  const sinifGrupCounts = useMemo<SubjectCount[]>(
    () => subjectCountsOf(scopedClassGroups),
    [scopedClassGroups],
  );

  const teacherNames = useMemo(
    () =>
      teachers
        ? [...new Set(teachers.map((t) => t.name.trim()).filter(Boolean))]
        : [],
    [teachers],
  );

  const studentNames = useMemo(() => {
    const names = new Set(
      (lessons ?? [])
        .filter((l) => l.status !== "cancelled" && ymdInTerm(l.date, term))
        .map((l) => l.studentName.trim())
        .filter(Boolean),
    );
    return [...names].sort((a, b) =>
      a.localeCompare(b, "tr", { sensitivity: "base" }),
    );
  }, [lessons, term]);

  const scopeLabel =
    scope === "week"
      ? fmtWeekRange(weekStart, weekEnd)
      : `${term} dönemi · tümü`;

  const ready =
    lessons !== undefined &&
    teachers !== undefined &&
    classLessons !== undefined &&
    extraLessons !== undefined &&
    classExtras !== undefined &&
    classGroups !== undefined;

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const segmented = (value: StatScope, label: string) => (
    <button
      type="button"
      onClick={() => setScope(value)}
      className={cn(
        "h-8 cursor-pointer rounded-full px-4 text-[13px] font-medium transition-colors print:hidden",
        scope === value
          ? "border border-neutral-200/80 bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
          : "text-neutral-500 hover:text-neutral-900",
      )}
    >
      {label}
    </button>
  );

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1240px] px-4 pt-6 pb-24 sm:px-6 sm:pt-10 lg:px-8">
        {/* ---------------------------------------------------------- */}
        {/* Header                                                     */}
        {/* ---------------------------------------------------------- */}
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 border-b border-neutral-200/70 pb-6">
          <div className="flex items-center gap-3.5">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#14B8A6]">
              <GraduationCap className="size-6 text-white" strokeWidth={1.9} />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-neutral-900 sm:text-xl">
                YKS Birebir Takip
              </h1>
              <p className="text-[13px] text-neutral-500">
                Birebir Ders ve Öğrenci Eksik Takip Programı
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Dönem seçici */}
            <Select value={term} onValueChange={handleTermChange}>
              <SelectTrigger className="h-8 w-[152px] gap-1.5 rounded-full border-neutral-200 bg-white pr-2 text-[13px] font-medium shadow-none print:hidden">
                <CalendarRange className="size-3.5 text-neutral-500" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {allTerms.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t} Dönemi
                    {t === currentTerm() ? " (güncel)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="inline-flex items-center rounded-full bg-neutral-100 p-1 print:hidden">
              {segmented("week", "Haftalık")}
              {segmented("all", "Dönem")}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Hesap menüsü"
                  className="inline-flex size-9 cursor-pointer items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white transition-opacity hover:opacity-85 print:hidden"
                >
                  {initialsOf(user?.name, user?.email)}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <span className="block truncate text-sm font-medium text-neutral-900">
                    {user?.name || "Misafir kullanıcı"}
                  </span>
                  {user?.email && (
                    <span className="mt-0.5 block truncate text-xs font-normal text-neutral-500">
                      {user.email}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => navigate("/")}
                  className="cursor-pointer"
                >
                  <Home className="size-4" />
                  Ana sayfa
                </DropdownMenuItem>
                {isAuthenticated && (
                  <DropdownMenuItem
                    onClick={() => void handleSignOut()}
                    className="cursor-pointer text-red-600 focus:text-red-600"
                  >
                    <LogOut className="size-4" />
                    Çıkış Yap
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ---------------------------------------------------------- */}
        {/* Content                                                    */}
        {/* ---------------------------------------------------------- */}
        {isLoading || !ready ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <Loader2 className="size-6 animate-spin text-neutral-400" />
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-5">
            {/* Stats + split donuts (report PNG export region part 1) */}
            <div
              ref={(node) => {
                exportNodes.current[0] = node;
              }}
            >
              <StatCards scope={scope} values={stats} />
              <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-4">
                <SubjectDonut
                  title="Birebir · Ders Dağılımı"
                  data={birebirCounts}
                />
                <SubjectDonut
                  title="Sınıf Dersi · Branş Dağılımı"
                  data={sinifCounts}
                />
                <SubjectDonut
                  title="Ek Ders · Branş Dağılımı"
                  data={ekCounts}
                />
                <SubjectDonut
                  title="Sınıf (Grup) Ek Ders · Branş Dağılımı"
                  data={sinifGrupCounts}
                />
              </div>
            </div>

            {/* Plan form */}
            <div className="print:hidden">
              <PlanForm
                teacherNames={teacherNames}
                studentNames={studentNames}
              />
            </div>

            {/* Roster management (döneme özel sınıflar + öğrenciler) */}
            <RosterManager term={term} />

            {/* Sınıf (Grup) Ek Ders — bağımsız üst düzey bölüm */}
            <ClassGroupEkDersPanel term={term} />

            {/* Action bar */}
            <ActionBar
              scope={scope}
              weekStart={weekStart}
              weekEnd={weekEnd}
              onPrevWeek={() => setWeekStart((d) => addDays(d, -7))}
              onNextWeek={() => setWeekStart((d) => addDays(d, 7))}
              onGoToday={() => setWeekStart(startOfWeekMonday(new Date()))}
              lessons={scopedSorted}
              scopeLabel={scopeLabel}
              exportNodes={exportNodes}
            />

            {/* Table (report PNG export region part 2) */}
            <div
              ref={(node) => {
                exportNodes.current[1] = node;
              }}
            >
              <LessonTable lessons={scopedSorted} scopeLabel={scopeLabel} />
            </div>

            {/* Weekly schedules, request pools, ek ders panels */}
            <WeeklySchedule weekStart={weekStart} term={term} />

            {/* Yedekleme / dışa aktarma */}
            <BackupManager term={term} />
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="sr-only">Yönlendiriliyorsunuz…</div>
      )}
    </main>
  );
}
