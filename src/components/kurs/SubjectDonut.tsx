import { motion } from "framer-motion";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { subjectColor } from "@/lib/yks";

export type SubjectCount = { subject: string; count: number };

/** "En Çok Birebir Ders Yazılan Dersler" card with a donut + legend. */
export function SubjectDonut({ data }: { data: SubjectCount[] }) {
  const sorted = useMemo(
    () => [...data].sort((a, b) => b.count - a.count || a.subject.localeCompare(b.subject, "tr")),
    [data],
  );
  const total = sorted.reduce((sum, d) => sum + d.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.2, ease: "easeOut" }}
      className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[13px] font-semibold tracking-tight text-neutral-900">
          En Çok Birebir Ders Yazılan Dersler
        </h3>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500">
          {total} ders
        </span>
      </div>

      <div className="mt-4 flex flex-1 items-center gap-6 sm:gap-8">
        {/* Donut */}
        <div className="relative h-40 w-40 shrink-0 sm:h-44 sm:w-44">
          {sorted.length === 0 ? (
            <div className="absolute inset-0 rounded-full border-[14px] border-neutral-100" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sorted}
                  dataKey="count"
                  nameKey="subject"
                  innerRadius="68%"
                  outerRadius="94%"
                  paddingAngle={sorted.length > 1 ? 2 : 0}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive
                >
                  {sorted.map((entry) => (
                    <Cell key={entry.subject} fill={subjectColor(entry.subject)} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-semibold tracking-tight text-neutral-900 tabular-nums">
              {total}
            </span>
            <span className="mt-0.5 text-[11px] text-neutral-400">toplam ders</span>
          </div>
        </div>

        {/* Legend */}
        <div className="min-w-0 flex-1">
          {sorted.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Henüz ders yazılmadı. Planladığın ilk derste ders bazlı dağılım burada
              görünür.
            </p>
          ) : (
            <ul className="space-y-2.5">
              {sorted.map((entry) => (
                <li
                  key={entry.subject}
                  className="flex items-center gap-2 text-sm text-neutral-700"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: subjectColor(entry.subject) }}
                  />
                  <span className="truncate">{entry.subject}</span>
                  <span className="ml-auto font-medium tabular-nums text-neutral-900">
                    {entry.count}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
