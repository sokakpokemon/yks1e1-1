import { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { motion } from "framer-motion";
import {
  Check,
  MessageCircle,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  fmtDMY,
  lessonLine,
  STATUS_META,
  subjectColor,
  type LessonStatus,
} from "@/lib/yks";

type LessonRow = Doc<"lessons">;

function SubjectBadge({ subject }: { subject: string }) {
  const color = subjectColor(subject);
  return (
    <span
      className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap"
      style={{
        color,
        backgroundColor: `${color}12`,
        borderColor: `${color}30`,
      }}
    >
      {subject}
    </span>
  );
}

export function LessonTable({
  lessons,
  scopeLabel,
}: {
  lessons: LessonRow[];
  scopeLabel: string;
}) {
  const setLessonStatus = useMutation(api.lessons.setLessonStatus);
  const deleteLesson = useMutation(api.lessons.deleteLesson);
  const planLesson = useMutation(api.lessons.planLesson);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const changeStatus = async (lesson: LessonRow, next: LessonStatus) => {
    if (pendingId) return;
    setPendingId(lesson._id);
    try {
      await setLessonStatus({ id: lesson._id, status: next });
      toast.success(`Durum güncellendi: ${STATUS_META[next].label}`, {
        description: `${lesson.studentName} · ${lesson.subject}`,
      });
    } catch (error) {
      console.error(error);
      toast.error("Durum güncellenemedi");
    } finally {
      setPendingId(null);
    }
  };

  const handleDelete = async (lesson: LessonRow) => {
    try {
      await deleteLesson({ id: lesson._id });
      toast("Ders silindi", {
        description: `${lesson.studentName} · ${lesson.subject} · ${fmtDMY(lesson.date)} ${lesson.time}`,
        action: {
          label: "Geri Al",
          onClick: async () => {
            try {
              const { lessonId } = await planLesson({
                studentName: lesson.studentName,
                subject: lesson.subject,
                missingTopic: lesson.missingTopic,
                teacherName: lesson.teacherName,
                date: lesson.date,
                time: lesson.time,
              });
              if (lesson.status !== "planned") {
                await setLessonStatus({ id: lessonId, status: lesson.status });
              }
              toast.success("Ders geri eklendi");
            } catch {
              toast.error("Geri alma başarısız");
            }
          },
        },
      });
    } catch (error) {
      console.error(error);
      toast.error("Ders silinemedi");
    }
  };

  const waMessage = (lesson: LessonRow) => {
    const statusLabel = STATUS_META[lesson.status].label;
    return `📚 *YKS Birebir Takip*\n\n${lessonLine({
      date: lesson.date,
      time: lesson.time,
      studentName: lesson.studentName,
      subject: lesson.subject,
      missingTopic: lesson.missingTopic,
      teacherName: lesson.teacherName,
      statusLabel,
    })}`;
  };

  const statusButton = (
    lesson: LessonRow,
    kind: "done" | "cancel",
  ) => {
    const isDone = lesson.status === "completed";
    const isCancelled = lesson.status === "cancelled";
    const active = kind === "done" ? isDone : isCancelled;
    return (
      <button
        type="button"
        disabled={pendingId === lesson._id}
        onClick={() => {
          const next: LessonStatus =
            kind === "done"
              ? isDone
                ? "planned"
                : "completed"
              : isCancelled
                ? "planned"
                : "cancelled";
          void changeStatus(lesson, next);
        }}
        title={
          kind === "done"
            ? isDone
              ? "Planlandıya dön"
              : "Tamamlandı olarak işaretle"
            : isCancelled
              ? "Planlandıya dön"
              : "İptal et"
        }
        className={cn(
          "inline-flex size-[26px] cursor-pointer items-center justify-center rounded-full border transition-colors",
          kind === "done"
            ? active
              ? "border-[#10B981] bg-[#10B981] text-white"
              : "border-emerald-200 bg-white text-emerald-600 hover:bg-emerald-50"
            : active
              ? "border-neutral-400 bg-neutral-400 text-white"
              : "border-neutral-200 bg-white text-neutral-400 hover:bg-neutral-100 hover:text-neutral-500",
        )}
      >
        {kind === "done" ? (
          <Check className="size-3.5" strokeWidth={2.75} />
        ) : (
          <X className="size-3.5" strokeWidth={2.5} />
        )}
      </button>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.4, ease: "easeOut" }}
      className="overflow-hidden rounded-2xl border border-neutral-200/80 bg-white"
    >
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 px-5 py-4 sm:px-6">
        <h3 className="text-sm font-semibold tracking-tight text-neutral-900">
          {scopeLabel}
        </h3>
        <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-500 tabular-nums">
          {lessons.length} ders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full caption-bottom text-sm">
          <thead>
            <tr className="border-b border-neutral-100">
              {["Tarih", "Saat", "Öğrenci", "Ders", "Eksik Konu", "Öğretmen", "Durum", "İşlem"].map(
                (head) => (
                  <th
                    key={head}                      className={cn(
                        "h-10 px-4 text-[11px] font-semibold tracking-wider whitespace-nowrap text-neutral-400 uppercase",
                        head === "İşlem" && "text-right print:hidden",
                      )}
                  >
                    {head}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {lessons.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-14 text-center">
                  <p className="text-sm text-neutral-400">
                    Bu aralıkta ders yok.
                  </p>
                  <p className="mt-1 text-[13px] text-neutral-300">
                    Yukarıdaki formdan ilk birebir dersini planlayabilirsin.
                  </p>
                </td>
              </tr>
            ) : (
              lessons.map((lesson) => {
                const statusMeta = STATUS_META[lesson.status];
                const cancelled = lesson.status === "cancelled";
                return (
                  <tr
                    key={lesson._id}
                    className={cn(
                      "border-b border-neutral-50 transition-colors last:border-0 hover:bg-neutral-50/60",
                      cancelled && "opacity-55",
                    )}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap text-neutral-600 tabular-nums">
                      {fmtDMY(lesson.date)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-neutral-600 tabular-nums">
                      {lesson.time}
                    </td>
                    <td className="px-4 py-3.5 font-medium whitespace-nowrap text-neutral-900">
                      {lesson.studentName}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <SubjectBadge subject={lesson.subject} />
                    </td>
                    <td className="max-w-56 truncate px-4 py-3.5 text-neutral-500">
                      {lesson.missingTopic || "—"}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-neutral-700">
                      {lesson.teacherName}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-2 print:hidden">
                          {statusButton(lesson, "done")}
                          {statusButton(lesson, "cancel")}
                        </span>
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
                            statusMeta.pillClass,
                          )}
                        >
                          {statusMeta.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 print:hidden">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(waMessage(lesson))}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Öğrenciye WhatsApp'ta gönder"
                          className="inline-flex size-8 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-emerald-50 hover:text-[#128C7E]"
                        >
                          <MessageCircle className="size-4" />
                        </a>
                        <button
                          type="button"
                          onClick={() => void handleDelete(lesson)}
                          title="Dersi sil"
                          className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
