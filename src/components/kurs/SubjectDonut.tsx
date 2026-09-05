import { motion } from "framer-motion";
import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { subjectColor } from "@/lib/yks";

export type SubjectCount = { subject: string; count: number };

/** Donut + legend card; one per lesson type (Birebir / Sınıf Dersi / Ek Ders). */
export function SubjectDonut({
  title,
  data,
  limit = 6,
}: {
  title: string;
  data: SubjectCount[];
  limit?: number;
}) {
  const sorted = useMemo(
    () =>
      [...data].sort(
        (a, b) => b.count - a.count || a.subject.localeCompare(b.subject, "tr"),
      ),
    [data],
  );
  const total = sorted.reduce((sum, d) => sum + d.count, 0);
  const visible = sorted.slice(0, limit);
  const restCount = total - visible.reduce((sum, d) => sum + d.count, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
      className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[13px] font-semibold tracking-tight text-neutral-900">
          {title}
        </h3>
        <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] font-medium text-neutral-500 tabular-nums">
          {total} ders
        </span>
      </div>

      <div className="mt-4 flex flex-1 items-center gap-5 sm:gap-6">
        {/* Donut */}
        <div className="relative h-32 w-32 shrink-0 sm:h-36 sm:w-36">
          {visible.length === 0 ? (
            <div className="absolute inset-0 rounded-full border-[14px] border-neutral-100" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={visible}
                  dataKey="count"
                  nameKey="subject"
                  innerRadius="68%"
                  outerRadius="94%"
                  paddingAngle={visible.length > 1 ? 2 : 0}
                  startAngle={90}
                  endAngle={-270}
                  stroke="none"
                  isAnimationActive
                >
                  {visible.map((entry) => (
                    <Cell
                      key={entry.subject}
                      fill={subjectColor(entry.subject)}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          )}
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-semibold tracking-tight text-neutral-900 tabular-nums sm:text-2xl">
              {total}
            </span>
            <span className="mt-0.5 text-[10px] text-neutral-400">toplam ders</span>
          </div>
        </div>

        {/* Legend */}
        <div className="min-w-0 flex-1">
          {visible.length === 0 ? (
            <p className="text-sm text-neutral-400">
              Henüz ders yazılmadı. Dersler planlandıkça ders bazlı dağılım burada
              görünür.
            </p>
          ) : (
            <ul className="space-y-2">
              {visible.map((entry) => (
                <li
                  key={entry.subject}
                  className="flex items-center gap-2 text-[13px] text-neutral-700"
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
              {restCount > 0 && (
                <li className="flex items-center gap-2 text-[12px] text-neutral-400">
                  <span className="size-2.5 shrink-0 rounded-full bg-neutral-200" />
                  Diğer dersler
                  <span className="ml-auto font-medium tabular-nums">
                    +{restCount}
                  </span>
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  );
}
