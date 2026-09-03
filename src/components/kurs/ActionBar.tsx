import type { Doc } from "@/convex/_generated/dataModel";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  MessageCircle,
  Printer,
} from "lucide-react";
import { useRef, useState, type MutableRefObject } from "react";
import { toast } from "sonner";
import {
  fmtWeekRange,
  lessonLine,
  startOfWeekMonday,
  STATUS_META,
  ymdOf,
} from "@/lib/yks";
import type { StatScope } from "./StatCards";

type LessonRow = Doc<"lessons">;

/** Draws a set of <div> subtrees into a single PNG (SVG <foreignObject> snapshot). */
async function downloadRegionAsPng(nodes: HTMLElement[]): Promise<void> {
  const gap = 24;
  const padY = 28;
  const width = Math.max(...nodes.map((n) => n.offsetWidth));
  const heights = nodes.map((n) => n.offsetHeight);
  const totalHeight =
    heights.reduce((sum, h) => sum + h, 0) + gap * (nodes.length - 1) + padY * 2;
  if (!width || !totalHeight) throw new Error("Bölge boş");

  const wrap = document.createElement("div");
  wrap.style.cssText = [
    `width:${width}px`,
    "box-sizing:border-box",
    "background:#ffffff",
    `padding:${padY}px`,
    "font-family:inherit",
  ].join(";");

  nodes.forEach((node, index) => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.style.width = `${width}px`;
    clone.style.boxSizing = "border-box";
    if (index < nodes.length - 1) {
      clone.style.marginBottom = `${gap}px`;
    }
    wrap.appendChild(clone);
  });

  const svgMarkup =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" ` +
    `height="${totalHeight}"><foreignObject width="100%" height="100%">` +
    `${wrap.outerHTML}</foreignObject></svg>`;

  const svgUrl = URL.createObjectURL(
    new Blob([svgMarkup], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Görsel oluşturulamadı"));
      image.src = svgUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = width * 2;
    canvas.height = totalHeight * 2;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas desteklenmiyor");
    ctx.scale(2, 2);
    ctx.drawImage(image, 0, 0, width, totalHeight);

    const png = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png"),
    );
    if (!png) throw new Error("PNG üretilemedi");

    const pngUrl = URL.createObjectURL(png);
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = "yks-birebir-ders-raporu.png";
    link.click();
    setTimeout(() => URL.revokeObjectURL(pngUrl), 5_000);
  } finally {
    URL.revokeObjectURL(svgUrl);
  }
}

export function ActionBar({
  scope,
  weekStart,
  weekEnd,
  onPrevWeek,
  onNextWeek,
  onGoToday,
  lessons,
  scopeLabel,
  exportNodes,
}: {
  scope: StatScope;
  weekStart: Date;
  weekEnd: Date;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onGoToday: () => void;
  lessons: LessonRow[];
  scopeLabel: string;
  exportNodes: MutableRefObject<(HTMLElement | null)[]>;
}) {
  const [exporting, setExporting] = useState(false);
  const copyBusy = useRef(false);
  const isCurrentWeek =
    ymdOf(weekStart) === ymdOf(startOfWeekMonday(new Date()));

  const plainText = () => {
    const header =
      scope === "week"
        ? `YKS Birebir Takip · ${fmtWeekRange(weekStart, weekEnd)}`
        : "YKS Birebir Takip · Tüm zamanlar";
    if (lessons.length === 0) return header;
    const lines = lessons.map((l) =>
      lessonLine({
        date: l.date,
        time: l.time,
        studentName: l.studentName,
        subject: l.subject,
        missingTopic: l.missingTopic,
        teacherName: l.teacherName,
        statusLabel: STATUS_META[l.status].label,
      }),
    );
    return `${header}\n${scopeLabel} (${lessons.length})\n\n${lines.join("\n")}`;
  };

  const handleCopy = async () => {
    if (copyBusy.current) return;
    copyBusy.current = true;
    try {
      await navigator.clipboard.writeText(plainText());
      toast.success("Ders listesi panoya kopyalandı");
    } catch {
      toast.error("Kopyalanamadı — tarayıcı izni gerekebilir");
    } finally {
      copyBusy.current = false;
    }
  };

  const handlePng = async () => {
    if (exporting) return;
    const nodes = (exportNodes.current ?? []).filter(
      (n): n is HTMLElement => n !== null,
    );
    if (nodes.length === 0) return;
    setExporting(true);
    try {
      await downloadRegionAsPng(nodes);
      toast.success("Rapor görseli indirildi");
    } catch (error) {
      console.error("PNG export error:", error);
      toast.error("Rapor görseli oluşturulamadı", {
        description: "Bunun yerine 'Yazdır / PDF Al'ı kullanabilirsin.",
      });
    } finally {
      setExporting(false);
    }
  };

  const handleWhatsApp = () => {
    const header =
      scope === "week"
        ? `📅 *${scopeLabel}* (${fmtWeekRange(weekStart, weekEnd)})`
        : `📅 *${scopeLabel}*`;
    const lines = lessons.map((l) =>
      lessonLine({
        date: l.date,
        time: l.time,
        studentName: l.studentName,
        subject: l.subject,
        missingTopic: l.missingTopic,
        teacherName: l.teacherName,
        statusLabel: STATUS_META[l.status].label,
      }),
    );
    const url = `https://wa.me/?text=${encodeURIComponent(
      `📚 *YKS Birebir Takip*\n\n${header}\n\n${lines.join("\n")}`,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.32, ease: "easeOut" }}
      className="flex flex-wrap items-center justify-between gap-3 print:hidden"
    >
      {/* Date navigation */}
      <div className="flex items-center gap-2">
        <div className="inline-flex h-9 items-center rounded-full border border-neutral-200 bg-white p-1">
          {scope === "week" && (
            <button
              type="button"
              onClick={onPrevWeek}
              aria-label="Önceki hafta"
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronLeft className="size-4" />
            </button>
          )}
          <div className="flex items-center gap-2 px-2.5 text-sm whitespace-nowrap">
            <CalendarDays className="size-4 text-neutral-500" />
            <span className="font-medium text-neutral-800">
              {scope === "week"
                ? fmtWeekRange(weekStart, weekEnd)
                : "Tüm zamanlar"}
            </span>
          </div>
          {scope === "week" && (
            <button
              type="button"
              onClick={onNextWeek}
              aria-label="Sonraki hafta"
              className="inline-flex size-7 cursor-pointer items-center justify-center rounded-full text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
            >
              <ChevronRight className="size-4" />
            </button>
          )}
        </div>
        {scope === "week" && !isCurrentWeek && (
          <button
            type="button"
            onClick={onGoToday}
            className="cursor-pointer text-[13px] font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            Bu haftaya dön
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
        >
          <Printer className="size-4 text-neutral-500" />
          Yazdır / PDF Al
        </button>

        <button
          type="button"
          onClick={() => void handlePng()}
          disabled={exporting}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-wait disabled:opacity-60"
        >
          <Download className="size-4 text-neutral-500" />
          {exporting ? "Hazırlanıyor…" : "Rapor Görseli (PNG)"}
        </button>

        <button
          type="button"
          onClick={handleWhatsApp}
          disabled={lessons.length === 0}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-[#25D366] px-3.5 text-[13px] font-semibold text-white transition-colors hover:bg-[#1DA851] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <MessageCircle className="size-4" />
          Öğrenciye WhatsApp Bilgilendirmesi
        </button>

        <button
          type="button"
          onClick={() => void handleCopy()}
          disabled={lessons.length === 0}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-3.5 text-[13px] font-medium text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Copy className="size-4 text-neutral-500" />
          Listeyi Kopyala
        </button>
      </div>
    </motion.div>
  );
}
