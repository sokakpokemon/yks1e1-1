import { motion } from "framer-motion";
import { BookOpen, CalendarDays, Clock, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StatScope = "week" | "all";

type StatDef = {
  key: string;
  titleWeek: string;
  titleAll: string;
  subtitleWeek: string;
  subtitleAll: string;
  icon: LucideIcon;
  cardClass: string;
  iconClass: string;
};

const STATS: StatDef[] = [
  {
    key: "lessons",
    titleWeek: "Bu Haftaki Ders",
    titleAll: "Yazılan Ders",
    subtitleWeek: "birebir ders · bu hafta",
    subtitleAll: "birebir ders · tüm zamanlar",
    icon: Clock,
    cardClass: "bg-[#E6FFFA]",
    iconClass: "bg-[#14B8A6] text-white",
  },
  {
    key: "students",
    titleWeek: "Aktif Öğrenci",
    titleAll: "Aktif Öğrenci",
    subtitleWeek: "takip edilen öğrenci",
    subtitleAll: "takip edilen öğrenci",
    icon: Users,
    cardClass: "bg-[#EBF8FF]",
    iconClass: "bg-[#3B82F6] text-white",
  },
  {
    key: "planned",
    titleWeek: "Bu Hafta Planlanan",
    titleAll: "Planlanan Ders",
    subtitleWeek: "planlanan ders sayısı",
    subtitleAll: "planlanan ders sayısı",
    icon: CalendarDays,
    cardClass: "bg-[#FEFCE8]",
    iconClass: "bg-[#F59E0B] text-white",
  },
  {
    key: "total",
    titleWeek: "Toplam Ders",
    titleAll: "Toplam Ders",
    subtitleWeek: "tüm zamanlar",
    subtitleAll: "tüm zamanlar",
    icon: BookOpen,
    cardClass: "bg-[#FAF5FF]",
    iconClass: "bg-[#8B5CF6] text-white",
  },
];

export function StatCards({
  scope,
  values,
}: {
  scope: StatScope;
  values: { lessons: number; students: number; planned: number; total: number };
}) {
  const nums: Record<string, number> = {
    lessons: values.lessons,
    students: values.students,
    planned: values.planned,
    total: values.total,
  };

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
      {STATS.map((stat, i) => (
        <motion.div
          key={stat.key}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 * i, ease: "easeOut" }}
          className={`${stat.cardClass} rounded-2xl border border-black/[0.04] p-4 sm:p-5`}
        >
          <div
            className={`flex size-9 items-center justify-center rounded-full ${stat.iconClass}`}
          >
            <stat.icon className="size-[18px]" strokeWidth={2} />
          </div>
          <p className="mt-4 text-[13px] font-medium text-neutral-500">
            {scope === "week" ? stat.titleWeek : stat.titleAll}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
            {nums[stat.key]}
          </p>
          <p className="mt-1 text-xs text-neutral-400">
            {scope === "week" ? stat.subtitleWeek : stat.subtitleAll}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
