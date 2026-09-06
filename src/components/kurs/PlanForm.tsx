import { api } from "@/convex/_generated/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { fmtDMY, SUBJECTS, ymdOf } from "@/lib/yks";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Plus,
  UserRound,
} from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="mb-1.5 block text-[11px] font-semibold tracking-wide text-neutral-500 uppercase">
      {children}
    </span>
  );
}

export function PlanForm({
  teacherNames,
  studentNames,
}: {
  teacherNames: string[];
  studentNames: string[];
}) {
  const planLesson = useMutation(api.lessons.planLesson);
  const [student, setStudent] = useState("");
  const [subject, setSubject] = useState<string>("Matematik");
  const [topic, setTopic] = useState("");
  const [teacher, setTeacher] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [time, setTime] = useState("16:00");
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedStudent = student.trim();
    const trimmedTeacher = teacher.trim();
    const trimmedTopic = topic.trim();

    if (!trimmedStudent) {
      toast.error("Öğrenci adını yaz", {
        description: "Örneğin: Ayşe Demir",
      });
      return;
    }
    if (!subject) {
      toast.error("Ders seçilmedi");
      return;
    }
    if (!trimmedTeacher) {
      toast.error("Öğretmen seçilmedi", {
        description: "Listeden seç ya da yeni bir öğretmen adı yaz.",
      });
      return;
    }
    if (!date) {
      toast.error("Tarih seçilmedi");
      return;
    }
    if (!time) {
      toast.error("Saat seçilmedi");
      return;
    }

    setPending(true);
    try {
      await planLesson({
        studentName: trimmedStudent,
        subject,
        missingTopic: trimmedTopic,
        teacherName: trimmedTeacher,
        date: ymdOf(date),
        time,
      });
      toast.success(
        `${trimmedStudent} için ${subject} dersi planlandı`,
        {
          description: `${fmtDMY(ymdOf(date))} ${time} · ${trimmedTeacher}`,
        },
      );
      setStudent("");
      setTopic("");
      setTime("16:00");
    } catch (error) {
      console.error("planLesson error:", error);
      toast.error("Ders planlanamadı", {
        description:
          error instanceof Error ? error.message : "Tekrar dene.",
      });
    } finally {
      setPending(false);
    }
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25, ease: "easeOut" }}
      className="rounded-2xl border border-neutral-200/80 bg-white p-5 sm:p-6"
      aria-label="Birebir ders planla"
    >
      {/* Section header */}
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3.5 text-[13px] font-semibold text-emerald-700">
          <Plus className="size-4" strokeWidth={2.25} />
          Birebir Ders Planla
        </span>
      </div>

      <form onSubmit={submit} className="mt-5">
        <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-2 xl:grid-cols-6">
          {/* Öğrenci */}
          <div className="md:col-span-1 xl:col-span-1">
            <label htmlFor="plan-student">
              <FieldLabel>Öğrenci</FieldLabel>
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="plan-student"
                value={student}
                onChange={(e) => setStudent(e.target.value)}
                list="student-options"
                placeholder="Ad Soyad"
                autoComplete="off"
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent pr-3 pl-9 text-sm shadow-xs outline-none placeholder:text-neutral-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <datalist id="student-options">
                {studentNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Ders */}
          <div>
            <FieldLabel>Ders</FieldLabel>
            <div className="relative">
              <BookOpen className="pointer-events-none absolute top-1/2 left-3 z-10 size-4 -translate-y-1/2 text-neutral-400" />
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger className="w-full pl-9">
                  <SelectValue placeholder="Ders seç" />
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
          </div>

          {/* Eksik Konu */}
          <div>
            <label htmlFor="plan-topic">
              <FieldLabel>Eksik Konu</FieldLabel>
            </label>
            <div className="relative">
              <FileText className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="plan-topic"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Konu başlığı"
                autoComplete="off"
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent pr-3 pl-9 text-sm shadow-xs outline-none placeholder:text-neutral-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>

          {/* Öğretmen */}
          <div>
            <label htmlFor="plan-teacher">
              <FieldLabel>Öğretmen</FieldLabel>
            </label>
            <div className="relative">
              <GraduationCap className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="plan-teacher"
                value={teacher}
                onChange={(e) => setTeacher(e.target.value)}
                list="teacher-options"
                placeholder="Öğretmen adı"
                autoComplete="off"
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent pr-3 pl-9 text-sm shadow-xs outline-none placeholder:text-neutral-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <datalist id="teacher-options">
                {teacherNames.map((name) => (
                  <option key={name} value={name} />
                ))}
              </datalist>
            </div>
          </div>

          {/* Tarih */}
          <div>
            <FieldLabel>Tarih</FieldLabel>
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex h-9 w-full items-center gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs outline-none transition-[color,box-shadow] hover:bg-neutral-50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <CalendarDays className="size-4 shrink-0 text-neutral-400" />
                  <span
                    className={cn(
                      "flex-1",
                      date ? "text-foreground" : "text-neutral-400",
                    )}
                  >
                    {date ? format(date, "dd.MM.yyyy") : "gg.aa.yyyy"}
                  </span>
                </button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto p-0"
                sideOffset={6}
              >
                <Calendar
                  mode="single"
                  selected={date ?? undefined}
                  onSelect={(day) => setDate(day ?? null)}
                  locale={tr}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Saat */}
          <div>
            <label htmlFor="plan-time">
              <FieldLabel>Saat</FieldLabel>
            </label>
            <div className="relative">
              <Clock className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-neutral-400" />
              <input
                id="plan-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9 w-full min-w-0 rounded-md border border-input bg-transparent pr-2 pl-9 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
        </div>

        {/* Quick teacher pills */}
        {teacherNames.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            <span className="mr-1 text-xs text-neutral-400">Hızlı öğretmen:</span>
            {teacherNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setTeacher(name)}
                className={cn(
                  "cursor-pointer rounded-full border px-3 py-1 text-[13px] transition-colors",
                  teacher.trim().toLocaleLowerCase("tr") ===
                    name.toLocaleLowerCase("tr")
                    ? "border-teal-600 bg-teal-50 font-medium text-teal-700"
                    : "border-neutral-200 bg-white text-neutral-600 hover:border-teal-600/50 hover:text-teal-700",
                )}
              >
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-full bg-[#14B8A6] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" strokeWidth={2.5} />
            )}
            Birebir Dersini Planla
          </button>
        </div>
      </form>
    </motion.section>
  );
}
