import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { requestMatchesBranch, SUBJECTS } from "@/lib/schedule";
import { sameTerm } from "@/lib/yks";
import { setDragData } from "@/lib/scheduleDrag";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { CalendarPlus, Layers, Plus, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ClassGroupRow = Doc<"classGroupExtraLessons">;
type ClassRow = Doc<"classes">;
type TeacherRow = Doc<"teachers">;

/** Pastel green badge style — distinct from the fixed sınıf dersleri. */
const BADGE_CG_EXTRA = "border border-emerald-300 bg-emerald-50 text-emerald-900";

/**
 * Sınıf (Grup) Ek Ders — bağımsız bölüm.
 *
 * Birebir ders mantığıyla çalışır: tek fark, dersin öğrenciye değil sınıfa
 * (gruba) yazılmasıdır. Talep havuzu oluşturulur; kartlar öğretmenin haftalık
 * birebir takvimindeki boş saatlere sürüklenerek planlanır (WeeklySchedule
 * içindeki Öğretmen Birebir Programı drop hedefidir).
 */
export function ClassGroupEkDersPanel({
  term,
}: {
  term: string;
}) {
  const cgExtras = useQuery(api.lessons.listClassGroupExtraLessons);
  const classes = useQuery(api.lessons.listClasses);
  const teachers = useQuery(api.teachers.listTeachers);

  const createCg = useMutation(api.lessons.createClassGroupExtraLesson);
  const moveCg = useMutation(api.lessons.moveClassGroupExtraLesson);
  const deleteCg = useMutation(api.lessons.deleteClassGroupExtraLesson);

  /* --- Talep formu --- */
  const [fClass, setFClass] = useState("");
  const [fSubject, setFSubject] = useState<string>("MATEMATİK");
  const [fTeacher, setFTeacher] = useState("");
  const [fTopic, setFTopic] = useState("");
  const [saving, setSaving] = useState(false);

  /* LocalStorage yansıması: sinifGrupEkDersleri (yenilemede kaybolmaz). */
  useEffect(() => {
    if (cgExtras === undefined) return;
    try {
      localStorage.setItem("sinifGrupEkDersleri", JSON.stringify(cgExtras));
    } catch {
      /* kota dolu vb. — sessiz geç */
    }
  }, [cgExtras]);

  const ready =
    cgExtras !== undefined && classes !== undefined && teachers !== undefined;

  const classList = (classes ?? []).filter((c) => sameTerm(c.term ?? "", term));
  const teacherList = teachers ?? [];

  /* Döneme ait talepler (havuz + planlanmış). */
  const termRows = useMemo(
    () => (cgExtras ?? []).filter((c) => sameTerm(c.term || "", term)),
    [cgExtras, term],
  );

  const poolRows = useMemo(
    () =>
      termRows
        .filter((c) => !c.date)
        .sort(
          (a, b) =>
            a.className.localeCompare(b.className, "tr") ||
            a.subject.localeCompare(b.subject, "tr") ||
            a.teacherName.localeCompare(b.teacherName, "tr"),
        ),
    [termRows],
  );

  const scheduledRows = useMemo(
    () =>
      termRows
        .filter((c) => c.date)
        .slice()
        .sort((a, b) =>
          a.date === b.date
            ? a.time.localeCompare(b.time)
            : (a.date ?? "").localeCompare(b.date ?? ""),
        ),
    [termRows],
  );

  const handleCreate = async () => {
    setSaving(true);
    try {
      await createCg({
        term,
        className: fClass,
        subject: fSubject,
        teacherName: fTeacher,
        topic: fTopic,
        scheduledDate: "",
        scheduledTime: "",
      });
      toast.success("Sınıf (Grup) Ek Ders talebi oluşturuldu", {
        description: `${fClass} · ${fSubject} · ${fTeacher} — havuza eklendi; kartı Öğretmen Birebir Programı'ndaki boş bir saate sürükleyin.`,
      });
      setFTopic("");
    } catch (error) {
      toast.error("Talep oluşturulamadı", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  const returnToPool = async (cg: ClassGroupRow) => {
    try {
      await moveCg({ id: cg._id, date: "", time: "" });
      toast("Ek ders havuza alındı", {
        description: `${cg.className} · ${cg.subject}`,
      });
    } catch {
      toast.error("Havuza alınamadı");
    }
  };

  const removeRow = async (cg: ClassGroupRow) => {
    try {
      await deleteCg({ id: cg._id });
      toast("Talep silindi", {
        description: `${cg.className} · ${cg.subject}`,
      });
    } catch {
      toast.error("Talep silinemedi");
    }
  };

  if (!ready) {
    return (
      <div className="flex min-h-[24vh] items-center justify-center rounded-2xl border border-neutral-200/80 bg-white">
        <div className="size-5 animate-spin rounded-full border-2 border-neutral-200 border-t-neutral-500" />
      </div>
    );
  }

  return (
    <motion.section
      id="sinif-grup-ek-ders"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="scroll-mt-24 overflow-hidden rounded-2xl border border-neutral-200/80 bg-white"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-600/[0.07] px-5 py-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600 shadow-sm">
            <CalendarPlus className="size-4 text-white" />
          </span>
          <div>
            <h3 className="text-sm font-bold tracking-tight text-neutral-900">
              Ek Ders Paneli
            </h3>
            <p className="text-[11px] text-neutral-500">
              Sınıf (Grup) Ek Ders — sınıflara esnek haftalık ders yazma
            </p>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-800 tabular-nums">
            {termRows.length} talep · {scheduledRows.length} planlandı
          </span>
          <span className="hidden rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-400 sm:inline">
            {term}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {/* Talep oluşturma formu */}
        <div className="grid gap-2.5 rounded-xl border border-emerald-100 bg-emerald-50/40 p-3">
          <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-[10px] font-semibold tracking-wide text-neutral-500 uppercase">
                Sınıf / Grup
              </label>
              <Select value={fClass} onValueChange={setFClass}>
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
                value={fSubject}
                onValueChange={(v) => {
                  setFSubject(v);
                  if (fTeacher && !requestMatchesBranch(v, fTeacher)) {
                    setFTeacher("");
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
              <Select value={fTeacher} onValueChange={setFTeacher}>
                <SelectTrigger className="h-8 w-full text-[12px]">
                  <SelectValue placeholder="Öğretmen seç" />
                </SelectTrigger>
                <SelectContent>
                  {teacherList
                    .filter((t: TeacherRow) => requestMatchesBranch(fSubject, t.name))
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
                value={fTopic}
                onChange={(e) => setFTopic(e.target.value)}
                placeholder="örn. Paralel denklem sistemleri"
                className="h-8 w-full rounded-md border border-input bg-white px-2.5 text-[12px] shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          </div>
          <Button
            type="button"
            disabled={saving || !fClass || !fSubject || !fTeacher || !fTopic.trim()}
            onClick={() => void handleCreate()}
            className="h-8 cursor-pointer justify-self-start rounded-full bg-emerald-600 px-4 text-[12px] font-semibold text-white hover:bg-emerald-700"
          >
            <Plus className="size-4" strokeWidth={2.5} />
            Sınıf (Grup) Ek Ders Talebi Oluştur
          </Button>
        </div>

        {/* Havuz */}
        <div className="mt-4 flex items-center gap-2">
          <span className="flex size-5 items-center justify-center rounded bg-emerald-100">
            <Layers className="size-3 text-emerald-700" />
          </span>
          <span className="text-[12px] font-semibold text-neutral-700">
            Talep Havuzu
          </span>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-medium text-neutral-500">
            {poolRows.length} talep
          </span>
        </div>
        {poolRows.length === 0 ? (
          <p className="mt-2 rounded-lg border border-dashed border-neutral-200 py-4 text-center text-[12px] text-neutral-400">
            Havuzda bekleyen talep yok. Yukarıdaki formla talep oluşturun;
            sonra kartı Öğretmen Birebir Programı'ndaki boş bir saate
            sürükleyin.
          </p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {poolRows.map((c) => (
              <div
                key={c._id}
                draggable
                onDragStart={(ev) =>
                  setDragData(ev, { kind: "classGroupExtra", extraId: c._id })
                }
                className={cn(
                  "cursor-grab rounded-lg px-3 py-2 text-[12px] leading-tight active:cursor-grabbing hover:shadow-sm",
                  BADGE_CG_EXTRA,
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold">{c.className}</span>
                  <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-emerald-700">
                    havuzda
                  </span>
                </div>
                <div className="text-emerald-800">
                  {c.subject} · {c.teacherName}
                </div>
                <div className="truncate text-[11px] opacity-75">{c.topic}</div>
                <div className="mt-1 flex items-center gap-2">
                  <button
                    type="button"
                    title="Talebi sil"
                    className="cursor-pointer text-[11px] font-medium text-red-400 hover:text-red-600"
                    onClick={() => void removeRow(c)}
                  >
                    sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Planlanmış talepler */}
        {scheduledRows.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-semibold text-neutral-700">
                Planlanmış talepler
              </span>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                {scheduledRows.length}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {scheduledRows.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 text-[11px] text-neutral-600"
                >
                  <span className="font-semibold text-neutral-800">
                    {c.className}
                  </span>
                  <span>
                    {c.subject} · {c.teacherName}
                  </span>
                  <span className="tabular-nums text-neutral-400">
                    {c.date.split("-").reverse().join(".")} {c.time}
                  </span>
                  <button
                    type="button"
                    title="Havuza geri al"
                    className="cursor-pointer font-medium text-emerald-600 hover:text-emerald-800"
                    onClick={() => void returnToPool(c)}
                  >
                    <Undo2 className="size-3.5" />
                  </button>
                  <button
                    type="button"
                    title="Talebi sil"
                    className="cursor-pointer font-medium text-red-400 hover:text-red-600"
                    onClick={() => void removeRow(c)}
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="mt-3 text-[11px] text-neutral-400">
          Bu bölüm birebir ders mantığıyla çalışır: tek fark, dersin öğrenciye
          değil sınıfa yazılmasıdır. Havuzdaki kartları aşağıdaki Öğretmen
          Birebir Programı'ndaki boş saatlere sürükleyin; branş ve çakışma
          kontrolleri otomatik uygulanır, yerleşen kartlar pastel yeşil renkte
          görünür ve analize "Ek Ders" olarak dahil edilir.
        </p>
      </div>
    </motion.section>
  );
}
