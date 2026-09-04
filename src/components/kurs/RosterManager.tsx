import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type ClassRow = Doc<"classes">;
type StudentRow = Doc<"students">;

export function RosterManager() {
  const classes = useQuery(api.lessons.listClasses);
  const students = useQuery(api.lessons.listStudents);
  const upsertClass = useMutation(api.lessons.upsertClass);
  const deleteClass = useMutation(api.lessons.deleteClass);
  const upsertStudent = useMutation(api.lessons.upsertStudent);
  const deleteStudent = useMutation(api.lessons.deleteStudent);

  const [classDraft, setClassDraft] = useState("");
  const [classEditId, setClassEditId] = useState<string | null>(null);
  const [classEditName, setClassEditName] = useState("");
  const [studentDraft, setStudentDraft] = useState("");
  const [studentDraftClass, setStudentDraftClass] = useState("");
  const [studentEditId, setStudentEditId] = useState<string | null>(null);
  const [studentEditName, setStudentEditName] = useState("");
  const [studentEditClass, setStudentEditClass] = useState("");
  const [busy, setBusy] = useState(false);

  const classList = classes ?? [];
  const studentList = [...(students ?? [])].sort((a, b) =>
    a.name.localeCompare(b.name, "tr", { sensitivity: "base" }),
  );

  const saveClass = async () => {
    const name = (classEditId ? classEditName : classDraft).trim();
    if (!name) {
      toast.error("Sınıf adı boş olamaz");
      return;
    }
    setBusy(true);
    try {
      if (classEditId) {
        await upsertClass({ id: classEditId, name });
        toast.success("Sınıf güncellendi", { description: name });
        setClassEditId(null);
        setClassEditName("");
      } else {
        await upsertClass({ name });
        toast.success("Sınıf eklendi", { description: name });
        setClassDraft("");
      }
    } catch (error) {
      toast.error("Sınıf kaydedilemedi", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const saveStudent = async () => {
    const name = (studentEditId ? studentEditName : studentDraft).trim();
    const className = (
      studentEditId ? studentEditClass : studentDraftClass
    ).trim();
    if (!name) {
      toast.error("Öğrenci adı boş olamaz");
      return;
    }
    setBusy(true);
    try {
      if (studentEditId) {
        await upsertStudent({ id: studentEditId, name, className });
        toast.success("Öğrenci güncellendi", { description: name });
        setStudentEditId(null);
        setStudentEditName("");
        setStudentEditClass("");
      } else {
        await upsertStudent({ name, className });
        toast.success("Öğrenci eklendi", { description: name });
        setStudentDraft("");
        setStudentDraftClass("");
      }
    } catch (error) {
      toast.error("Öğrenci kaydedilemedi", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  };

  const removeClass = async (row: ClassRow) => {
    try {
      await deleteClass({ id: row._id });
      toast("Sınıf silindi", { description: row.name });
      if (classEditId === row._id) setClassEditId(null);
    } catch {
      toast.error("Sınıf silinemedi");
    }
  };

  const removeStudent = async (row: StudentRow) => {
    try {
      await deleteStudent({ id: row._id });
      toast("Öğrenci silindi", { description: row.name });
      if (studentEditId === row._id) setStudentEditId(null);
    } catch {
      toast.error("Öğrenci silinemedi");
    }
  };

  const inputClass =
    "h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none placeholder:text-neutral-400 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

  const sectionTitle = (icon: React.ReactNode, text: string, count: number) => (
    <div className="flex items-center gap-2">
      {icon}
      <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
        {text}
      </h3>
      <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 tabular-nums">
        {count}
      </span>
    </div>
  );

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {/* ------------------------------------------------------ */}
      {/* Sınıflar                                                */}
      {/* ------------------------------------------------------ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
        className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white"
      >
        <div className="border-b border-neutral-100 px-5 py-4">
          {sectionTitle(
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#14B8A6]">
              <Users className="size-4 text-white" />
            </span>,
            "Sınıflar / Gruplar",
            classList.length,
          )}
        </div>
        <div className="px-5 py-4">
          <div className="flex gap-2">
            <input
              value={classDraft}
              onChange={(e) => setClassDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) void saveClass();
              }}
              placeholder="Yeni sınıf adı (örn. 10.SINIF)"
              className={inputClass}
            />
            <button
              type="button"
              onClick={() => void saveClass()}
              disabled={busy || !classDraft.trim()}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[#14B8A6] px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#0D9488] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Ekle
            </button>
          </div>

          <div className="mt-4 max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {classes === undefined ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-neutral-300" />
              </div>
            ) : classList.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">
                Henüz sınıf yok.
              </p>
            ) : (
              classList.map((row) => (
                <div
                  key={row._id}
                  className="group flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2"
                >
                  {classEditId === row._id ? (
                    <>
                      <input
                        autoFocus
                        value={classEditName}
                        onChange={(e) => setClassEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !busy) void saveClass();
                          if (e.key === "Escape") setClassEditId(null);
                        }}
                        className={cn(inputClass, "h-8 flex-1")}
                      />
                      <button
                        type="button"
                        onClick={() => void saveClass()}
                        title="Kaydet"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setClassEditId(null)}
                        title="Vazgeç"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                        {row.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setClassEditId(row._id);
                          setClassEditName(row.name);
                        }}
                        title="Düzenle"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-teal-50 hover:text-teal-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeClass(row)}
                        title="Sil"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>

      {/* ------------------------------------------------------ */}
      {/* Öğrenciler                                              */}
      {/* ------------------------------------------------------ */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1, ease: "easeOut" }}
        className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white"
      >
        <div className="border-b border-neutral-100 px-5 py-4">
          {sectionTitle(
            <span className="flex size-7 items-center justify-center rounded-lg bg-[#3B82F6]">
              <Users className="size-4 text-white" />
            </span>,
            "Öğrenciler",
            studentList.length,
          )}
        </div>
        <div className="px-5 py-4">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_180px_auto]">
            <input
              value={studentDraft}
              onChange={(e) => setStudentDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !busy) void saveStudent();
              }}
              placeholder="Yeni öğrenci (Ad Soyad)"
              className={inputClass}
            />
            <select
              value={studentDraftClass}
              onChange={(e) => setStudentDraftClass(e.target.value)}
              className={cn(inputClass, "cursor-pointer")}
            >
              <option value="">Sınıf seç (opsiyonel)</option>
              {classList.map((c) => (
                <option key={c._id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => void saveStudent()}
              disabled={busy || !studentDraft.trim()}
              className="inline-flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-md bg-[#3B82F6] px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Ekle
            </button>
          </div>

          <div className="mt-4 max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {students === undefined ? (
              <div className="flex justify-center py-6">
                <Loader2 className="size-5 animate-spin text-neutral-300" />
              </div>
            ) : studentList.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-400">
                Henüz öğrenci yok. Birebir ders planladıkça öğrenciler de
                burada listelenir.
              </p>
            ) : (
              studentList.map((row) => (
                <div
                  key={row._id}
                  className="flex items-center gap-2 rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2"
                >
                  {studentEditId === row._id ? (
                    <>
                      <input
                        autoFocus
                        value={studentEditName}
                        onChange={(e) => setStudentEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !busy) void saveStudent();
                          if (e.key === "Escape") setStudentEditId(null);
                        }}
                        className={cn(inputClass, "h-8 flex-1")}
                      />
                      <select
                        value={studentEditClass}
                        onChange={(e) => setStudentEditClass(e.target.value)}
                        className={cn(inputClass, "h-8 w-36 cursor-pointer")}
                      >
                        <option value="">Sınıf seç</option>
                        {classList.map((c) => (
                          <option key={c._id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => void saveStudent()}
                        title="Kaydet"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Check className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setStudentEditId(null)}
                        title="Vazgeç"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 hover:bg-neutral-100"
                      >
                        <X className="size-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-800">
                        {row.name}
                      </span>
                      {row.className && (
                        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium whitespace-nowrap text-neutral-500">
                          {row.className}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setStudentEditId(row._id);
                          setStudentEditName(row.name);
                          setStudentEditClass(row.className ?? "");
                        }}
                        title="Düzenle"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-blue-50 hover:text-blue-700"
                      >
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeStudent(row)}
                        title="Sil"
                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
