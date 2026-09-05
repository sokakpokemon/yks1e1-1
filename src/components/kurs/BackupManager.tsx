import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Database,
  FileJson,
  FileSpreadsheet,
  Loader2,
  Upload,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { termOfYmd } from "@/lib/yks";

type LessonRow = Doc<"lessons">;
type ClassLessonRow = Doc<"classLessons">;
type ExtraLessonRow = Doc<"extraLessons">;
type ClassExtraRow = Doc<"classExtraLessons">;
type ClassGroupRow = Doc<"classGroupExtraLessons">;
type TeacherRow = Doc<"teachers">;
type ClassRow = Doc<"classes">;
type StudentRow = Doc<"students">;

type BackupShape = {
  lessons: LessonRow[];
  classLessons: ClassLessonRow[];
  extraLessons: ExtraLessonRow[];
  classExtraLessons: ClassExtraRow[];
  classGroupExtraLessons: ClassGroupRow[];
  teachers: TeacherRow[];
  classes: ClassRow[];
  students: StudentRow[];
};

const STATUS_LABEL: Record<string, string> = {
  planned: "Planlandı",
  completed: "Tamamlandı",
  cancelled: "İptal",
};

function plain<T extends { _id: unknown; _creationTime?: number }>(row: T) {
  const { _id, _creationTime, userId, ...rest } = row as T & {
    userId?: string;
    _id: unknown;
    _creationTime?: number;
  };
  void _id;
  void _creationTime;
  void userId;
  return rest;
}

function fmtYmd(ymd: string): string {
  if (!ymd) return "—";
  const [y, m, d] = ymd.split("-");
  if (!y || !m || !d) return ymd;
  return `${d}.${m}.${y}`;
}

function download(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5_000);
}

export function BackupManager({ term }: { term: string }) {
  const lessons = useQuery(api.lessons.listLessons);
  const classLessons = useQuery(api.lessons.listClassLessons);
  const extraLessons = useQuery(api.lessons.listExtraLessons);
  const classExtras = useQuery(api.lessons.listClassExtraLessons);
  const classGroups = useQuery(api.lessons.listClassGroupExtraLessons);
  const teachers = useQuery(api.teachers.listTeachers);
  const classes = useQuery(api.lessons.listClasses);
  const students = useQuery(api.lessons.listStudents);
  const importBackup = useMutation(api.lessons.importBackup);

  const [exporting, setExporting] = useState<"json" | "excel" | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [pending, setPending] = useState<{
    data: BackupShape;
    summary: Array<[string, number]>;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const ready =
    lessons !== undefined &&
    classLessons !== undefined &&
    extraLessons !== undefined &&
    classExtras !== undefined &&
    classGroups !== undefined &&
    teachers !== undefined &&
    classes !== undefined &&
    students !== undefined;

  const snapshot = (): BackupShape | null => {
    if (!ready) return null;
    return {
      lessons: lessons as LessonRow[],
      classLessons: classLessons as ClassLessonRow[],
      extraLessons: extraLessons as ExtraLessonRow[],
      classExtraLessons: classExtras as ClassExtraRow[],
      classGroupExtraLessons: classGroups as ClassGroupRow[],
      teachers: teachers as TeacherRow[],
      classes: classes as ClassRow[],
      students: students as StudentRow[],
    };
  };

  const exportJson = async () => {
    if (exporting) return;
    const snap = snapshot();
    if (!snap) {
      toast.error("Veriler henüz yüklenmedi");
      return;
    }
    setExporting("json");
    try {
      const data = {
        app: "yks-birebir-takip",
        version: 1,
        exportedAt: new Date().toISOString(),
        note: "YKS Birebir Takip yedeği — tüm dönemleri kapsar.",
        tables: Object.fromEntries(
          Object.entries(snap).map(([key, rows]) => [
            key,
            rows.map((r) => plain(r)),
          ]),
        ),
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      download(`YKS-yedek-${term.replace("/", "-")}.json`, blob);
      toast.success("JSON yedeği indirildi", {
        description: "Tüm dönemlerin verileri dosyaya kaydedildi.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Yedek oluşturulamadı");
    } finally {
      setExporting(null);
    }
  };

  const exportExcel = async () => {
    if (exporting) return;
    const snap = snapshot();
    if (!snap) {
      toast.error("Veriler henüz yüklenmedi");
      return;
    }
    setExporting("excel");
    try {
      const { utils, write } = await import("xlsx");
      const wb = utils.book_new();
      const sheets: Array<[string, unknown[]]> = [
        [
          "Birebir Dersler",
          (snap.lessons as LessonRow[])
            .slice()
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .map((l) => ({
              "Dönem": termOfYmd(l.date),
              "Tarih": fmtYmd(l.date),
              "Saat": l.time,
              "Öğrenci": l.studentName,
              "Sınıf": l.className || "—",
              "Ders": l.subject,
              "Eksik Konu": l.missingTopic || "—",
              "Öğretmen": l.teacherName,
              "Durum": STATUS_LABEL[l.status] ?? l.status,
            })),
        ],
        [
          "Sınıf Programı",
          (snap.classLessons as ClassLessonRow[])
            .slice()
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .map((c) => ({
              "Dönem": termOfYmd(c.date),
              "Tarih": fmtYmd(c.date),
              "Saat": c.time,
              "Sınıf": c.className,
              "Ders": c.subject,
              "Öğretmen": c.teacherName,
            })),
        ],
        [
          "Ek Dersler",
          (snap.extraLessons as ExtraLessonRow[])
            .slice()
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .map((e) => ({
              "Dönem": termOfYmd(e.date),
              "Tarih": fmtYmd(e.date),
              "Saat": e.time,
              "Başlık": e.title,
              "Sınıf": e.className,
              "Öğretmen": e.teacherName,
            })),
        ],
        [
          "Sınıf Ek Dersleri",
          (snap.classExtraLessons as ClassExtraRow[])
            .slice()
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .map((c) => ({
              "Durum": c.date ? "Planlandı" : "Havuzda",
              "Dönem": c.term,
              "Sınıf": c.className,
              "Ders": c.subject,
              "Öğretmen": c.teacherName,
              "Konu": c.topic,
              "Tarih": c.date ? fmtYmd(c.date) : "—",
              "Saat": c.time || "—",
            })),
        ],
        [
          "Sınıf (Grup) Ek Ders",
          (snap.classGroupExtraLessons as ClassGroupRow[])
            .slice()
            .sort((a, b) =>
              a.date === b.date
                ? a.time.localeCompare(b.time)
                : a.date.localeCompare(b.date),
            )
            .map((c) => ({
              "Durum": c.date ? "Planlandı" : "Havuzda",
              "Dönem": c.term,
              "Sınıf": c.className,
              "Ders": c.subject,
              "Öğretmen": c.teacherName,
              "Konu": c.topic,
              "Tarih": c.date ? fmtYmd(c.date) : "—",
              "Saat": c.time || "—",
            })),
        ],
        [
          "Öğretmenler",
          (snap.teachers as TeacherRow[]).map((t) => ({ "Ad Soyad": t.name })),
        ],
        [
          "Sınıflar",
          (snap.classes as ClassRow[])
            .slice()
            .sort((a, b) =>
              a.term === b.term
                ? a.name.localeCompare(b.name, "tr")
                : a.term.localeCompare(b.term),
            )
            .map((c) => ({ "Dönem": c.term, "Sınıf": c.name })),
        ],
        [
          "Öğrenciler",
          (snap.students as StudentRow[])
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, "tr"))
            .map((s) => ({
              "Dönem": s.term,
              "Öğrenci": s.name,
              "Sınıf": s.className || "—",
            })),
        ],
      ];
      for (const [name, rows] of sheets) {
        const ws = utils.json_to_sheet(rows);
        ws["!cols"] = Object.keys(rows[0] ?? {}).map(() => ({ wch: 20 }));
        utils.book_append_sheet(wb, ws, name);
      }
      const out = write(wb, { bookType: "xlsx", type: "array" });
      const blob = new Blob([out], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      download(`YKS-yedek-${term.replace("/", "-")}.xlsx`, blob);
      toast.success("Excel yedeği indirildi", {
        description: "Tüm kayıtlar sayfalara ayrılarak yazıldı.",
      });
    } catch (error) {
      console.error(error);
      toast.error("Excel oluşturulamadı", {
        description: "Sayfayı yenileyip tekrar deneyin.",
      });
    } finally {
      setExporting(null);
    }
  };

  const onPickFile = (file: File | undefined | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result)) as {
          tables?: Record<string, unknown[]>;
        };
        const tables = parsed.tables;
        if (!tables || typeof tables !== "object") {
          throw new Error("Yedek dosyasında 'tables' bölümü yok.");
        }
        const clean = {
          lessons: Array.isArray(tables.lessons) ? tables.lessons : [],
          classLessons: Array.isArray(tables.classLessons)
            ? tables.classLessons
            : [],
          extraLessons: Array.isArray(tables.extraLessons)
            ? tables.extraLessons
            : [],
          classExtraLessons: Array.isArray(tables.classExtraLessons)
            ? tables.classExtraLessons
            : [],
          classGroupExtraLessons: Array.isArray(tables.classGroupExtraLessons)
            ? tables.classGroupExtraLessons
            : [],
          teachers: Array.isArray(tables.teachers) ? tables.teachers : [],
          classes: Array.isArray(tables.classes) ? tables.classes : [],
          students: Array.isArray(tables.students) ? tables.students : [],
        };
        const summary: Array<[string, number]> = [
          ["Birebir Ders", clean.lessons.length],
          ["Sınıf Dersi", clean.classLessons.length],
          ["Ek Ders", clean.extraLessons.length],
          ["Sınıf Ek Dersi", clean.classExtraLessons.length],
          ["Sınıf (Grup) Ek Ders", clean.classGroupExtraLessons.length],
          ["Öğretmen", clean.teachers.length],
          ["Sınıf", clean.classes.length],
          ["Öğrenci", clean.students.length],
        ];
        const total = summary.reduce((sum, [, n]) => sum + n, 0);
        if (total === 0) {
          toast.error("Yedek dosyasında kayıt bulunamadı");
          return;
        }
        setPending({
          data: clean as unknown as BackupShape,
          summary: summary.filter(([, n]) => n > 0),
        });
      } catch (error) {
        console.error(error);
        toast.error("Dosya okunamadı", {
          description:
            error instanceof Error ? error.message : "Geçerli bir JSON yedeği seçin.",
        });
      }
    };
    reader.readAsText(file);
    if (fileRef.current) fileRef.current.value = "";
  };

  const confirmRestore = async () => {
    if (!pending) return;
    setRestoring(true);
    try {
      const res = await importBackup({ data: pending.data });
      const counts = res.counts as Record<string, number>;
      const total = Object.values(counts).reduce((s, n) => s + n, 0);
      toast.success("Yedek geri yüklendi", {
        description: `${total} kayıt içe aktarıldı.`,
      });
      setPending(null);
    } catch (error) {
      console.error(error);
      toast.error("Geri yükleme başarısız", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setRestoring(false);
    }
  };

  const btnBase =
    "inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-[13px] font-semibold transition-colors disabled:cursor-wait disabled:opacity-60";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white print:hidden"
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-lg bg-neutral-800">
            <Database className="size-4 text-white" />
          </span>
          <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
            Yedekleme & Dışa Aktarma
          </h3>
          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
            {term}
          </span>
        </div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void exportExcel()}
            disabled={exporting !== null || !ready}
            className={`${btnBase} border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100`}
          >
            {exporting === "excel" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="size-4" />
            )}
            Excel Yedek (.xlsx)
          </button>
          <button
            type="button"
            onClick={() => void exportJson()}
            disabled={exporting !== null || !ready}
            className={`${btnBase} border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50`}
          >
            {exporting === "json" ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FileJson className="size-4" />
            )}
            JSON Yedek (.json)
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={restoring}
            className={`${btnBase} border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100`}
          >
            <Upload className="size-4" />
            Yedekten Geri Yükle
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => onPickFile(e.target.files?.[0])}
          />
        </div>
        <p className="mt-3 text-[11px] leading-4 text-neutral-400">
          Yedekler <b>tüm dönemleri</b> (birebir, sınıf programı, ek dersler,
          sınıf ek dersleri, öğretmen, sınıf ve öğrenci listeleri) kapsar.
          Geri yükleme yalnızca JSON yedeğinden yapılır ve mevcut tüm veriyi
          yedekteki hâliyle değiştirir.
        </p>
      </div>

      <Dialog open={pending !== null} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Yedeği geri yükle</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-neutral-500">
            Aşağıdaki kayıtlar yüklenecek. Mevcut verilerin tamamı yedekteki
            hâliyle <b>değiştirilir</b> — bu işlem geri alınamaz.
          </p>
          {pending && (
            <ul className="space-y-1.5 rounded-xl border border-neutral-100 bg-neutral-50/60 p-3 text-[13px]">
              {pending.summary.map(([label, count]) => (
                <li
                  key={label}
                  className="flex items-center justify-between text-neutral-600"
                >
                  <span>{label}</span>
                  <span className="font-semibold text-neutral-900 tabular-nums">
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          )}
          <DialogFooter>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="h-9 cursor-pointer rounded-full border border-neutral-200 bg-white px-4 text-[13px] font-medium text-neutral-600 hover:bg-neutral-50"
            >
              Vazgeç
            </button>
            <button
              type="button"
              onClick={() => void confirmRestore()}
              disabled={restoring}
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-red-600 px-4 text-[13px] font-semibold text-white hover:bg-red-700 disabled:opacity-60"
            >
              {restoring && <Loader2 className="size-4 animate-spin" />}
              Evet, Değiştir ve Yükle
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
}
