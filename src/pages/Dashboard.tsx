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
import { ActionBar } from "@/components/kurs/ActionBar";
import { LessonTable } from "@/components/kurs/LessonTable";
import { PlanForm } from "@/components/kurs/PlanForm";
import { StatCards, type StatScope } from "@/components/kurs/StatCards";
import { SubjectDonut, type SubjectCount } from "@/components/kurs/SubjectDonut";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import {
  addDays,
  fmtWeekRange,
  startOfWeekMonday,
  todayYmd,
  ymdOf,
} from "@/lib/yks";
import { useMutation, useQuery } from "convex/react";
import { GraduationCap, Home, Loader2, LogOut } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
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

export default function Dashboard() {
  const { isLoading, isAuthenticated, user, signOut } = useAuth();
  const navigate = useNavigate();
  const lessons = useQuery(api.lessons.listLessons);
  const teachers = useQuery(api.teachers.listTeachers);
  const ensureSampleData = useMutation(api.lessons.ensureSampleData);

  const [scope, setScope] = useState<StatScope>("week");
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

  const weekEnd = useMemo(() => addDays(weekStart, 6), [weekStart]);

  const allSorted = useMemo(
    () => (lessons ? sortLessons(lessons) : []),
    [lessons],
  );

  const scopedSorted = useMemo(() => {
    if (!lessons || scope === "all") return allSorted;
    const from = ymdOf(weekStart);
    const toExclusive = ymdOf(addDays(weekStart, 7));
    return sortLessons(
      lessons.filter((l) => l.date >= from && l.date < toExclusive),
    );
  }, [lessons, scope, weekStart, allSorted]);

  const stats = useMemo(() => {
    const students = new Set(scopedSorted.map((l) => l.studentName.trim()));
    const planned = scopedSorted.filter((l) => l.status !== "cancelled").length;
    return {
      lessons: scopedSorted.length,
      students: students.size,
      planned,
      total: allSorted.length,
    };
  }, [scopedSorted, allSorted]);

  const subjectCounts = useMemo<SubjectCount[]>(() => {
    const map = new Map<string, number>();
    for (const lesson of scopedSorted) {
      map.set(lesson.subject, (map.get(lesson.subject) ?? 0) + 1);
    }
    return [...map.entries()].map(([subject, count]) => ({ subject, count }));
  }, [scopedSorted]);

  const teacherNames = useMemo(
    () =>
      teachers
        ? [...new Set(teachers.map((t) => t.name.trim()).filter(Boolean))]
        : [],
    [teachers],
  );

  const studentNames = useMemo(() => {
    const names = new Set(
      (lessons ?? []).map((l) => l.studentName.trim()).filter(Boolean),
    );
    return [...names].sort((a, b) =>
      a.localeCompare(b, "tr", { sensitivity: "base" }),
    );
  }, [lessons]);

  const scopeLabel =
    scope === "week"
      ? fmtWeekRange(weekStart, weekEnd)
      : "Tüm zamanlar";

  const ready = lessons !== undefined && teachers !== undefined;

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

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center rounded-full bg-neutral-100 p-1 print:hidden">
              {segmented("week", "Haftalık")}
              {segmented("all", "Tümü")}
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
            {/* Stats + donut (report PNG export region part 1) */}
            <div
              ref={(node) => {
                exportNodes.current[0] = node;
              }}
            >
              <div className="grid grid-cols-1 items-stretch gap-4 xl:grid-cols-6">
                <div className="xl:col-span-4">
                  <StatCards scope={scope} values={stats} />
                </div>
                <div className="xl:col-span-2">
                  <SubjectDonut data={subjectCounts} />
                </div>
              </div>
            </div>

            {/* Plan form */}
            <div className="print:hidden">
              <PlanForm
                teacherNames={teacherNames}
                studentNames={studentNames}
              />
            </div>

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
          </div>
        )}
      </div>

      {!isAuthenticated && (
        <div className="sr-only">Yönlendiriliyorsunuz…</div>
      )}
    </main>
  );
}
