import { motion } from "framer-motion";
import {
  BookOpen,
  CalendarDays,
  Clock,
  Layers,
  Layers2,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type StatScope = "week" | "all";

export type StatValues = {
  total: number;
  birebir: number;
  sinifDersi: number;
  ekDers: number;
  sinifGrupEk: number;
  students: number;
  planned: number;
};

type StatDef = {
  key: keyof StatValues;
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
    key: "total",
    titleWeek: "Bu Haftaki Ders",
    titleAll: "Toplam Ders",
    subtitleWeek: "birebir + sınıf + ek ders · bu hafta",
    subtitleAll: "birebir + sınıf + ek ders · seçili dönem",
    icon: Clock,
    cardClass: "bg-[#E6FFFA]",
    iconClass: "bg-[#14B8A6] text-white",
  },
  {
    key: "birebir",
    titleWeek: "Birebir Ders",
    titleAll: "Birebir Ders",
    subtitleWeek: "öğrenciye yazılan ders · bu hafta",
    subtitleAll: "öğrenciye yazılan ders · seçili dönem",
    icon: Users,
    cardClass: "bg-[#EBF8FF]",
    iconClass: "bg-[#3B82F6] text-white",
  },
  {
    key: "sinifDersi",
    titleWeek: "Sınıf Dersi",
    titleAll: "Sınıf Dersi",
    subtitleWeek: "kur / grup dersi · bu hafta",
    subtitleAll: "kur / grup dersi · seçili dönem",
    icon: BookOpen,
    cardClass: "bg-[#ECFDF5]",
    iconClass: "bg-[#10B981] text-white",
  },
  {
    key: "ekDers",
    titleWeek: "Ek Ders",
    titleAll: "Ek Ders",
    subtitleWeek: "öğretmen + sınıf ek dersleri · bu hafta",
    subtitleAll: "öğretmen + sınıf ek dersleri · seçili dönem",
    icon: Layers,
    cardClass: "bg-[#FAF5FF]",
    iconClass: "bg-[#8B5CF6] text-white",
  },
  {
    key: "sinifGrupEk",
    titleWeek: "Sınıf (Grup) Ek Ders",
    titleAll: "Sınıf (Grup) Ek Ders",
    subtitleWeek: "sınıfa yazılan ek ders · bu hafta",
    subtitleAll: "sınıfa yazılan ek ders · seçili dönem",
    icon: Layers2,
    cardClass: "bg-[#ECFDF5]",
    iconClass: "bg-[#059669] text-white",
  },
  {
    key: "students",
    titleWeek: "Aktif Öğrenci",
    titleAll: "Aktif Öğrenci",
    subtitleWeek: "takip edilen öğrenci",
    subtitleAll: "takip edilen öğrenci",
    icon: Users,
    cardClass: "bg-[#FEFCE8]",
    iconClass: "bg-[#F59E0B] text-white",
  },
  {
    key: "planned",
    titleWeek: "Bu Hafta Planlanan",
    titleAll: "Planlanan Ders",
    subtitleWeek: "iptal hariç planlanan ders sayısı",
    subtitleAll: "iptal hariç planlanan ders sayısı",
    icon: CalendarDays,
    cardClass: "bg-[#FFF7ED]",
    iconClass: "bg-[#EA580C] text-white",
  },
];

export function StatCards({
  scope,
  values,
}: {
  scope: StatScope;
  values: StatValues;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
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
          <p className="mt-4 truncate text-[13px] font-medium text-neutral-500">
            {scope === "week" ? stat.titleWeek : stat.titleAll}
          </p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-neutral-900 tabular-nums">
            {values[stat.key]}
          </p>
          <p className="mt-1 text-xs leading-4 text-neutral-400">
            {scope === "week" ? stat.subtitleWeek : stat.subtitleAll}
          </p>
        </motion.div>
      ))}
    </div>
  );
}
