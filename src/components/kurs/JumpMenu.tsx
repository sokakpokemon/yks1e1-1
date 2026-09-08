import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

const SECTIONS = [
  { id: "bolum-program", label: "Program" },
  { id: "bolum-ders-planla", label: "Ders Planla" },
  { id: "bolum-istekler", label: "İstekler" },
  { id: "bolum-ek-ders", label: "Ek Ders" },
  { id: "bolum-bakis", label: "Bakış" },
  { id: "bolum-yonetim", label: "Yönetim" },
] as const;

/** Hedef bölümlerdeki scroll-mt-20 (80px) ile eşleşir. */
const SCROLL_OFFSET = 80;

export function JumpMenu({ className }: { className?: string }) {
  const [active, setActive] = useState<string | null>(null);
  const lockRef = useRef<{ until: number } | null>(null);
  const lastClickedRef = useRef<string | null>(null);

  useEffect(() => {
    const detect = () => {
      if (lockRef.current) {
        if (Date.now() < lockRef.current.until) return;
        lockRef.current = null;
      }
      const threshold = SCROLL_OFFSET + 1;
      let maxTop = -Infinity;
      const passed: { id: string; top: number }[] = [];
      for (const section of SECTIONS) {
        const node = document.getElementById(section.id);
        if (!node) continue;
        const top = node.getBoundingClientRect().top;
        if (top <= threshold) {
          passed.push({ id: section.id, top });
          if (top > maxTop) maxTop = top;
        }
      }
      // Aynı satırda duran bölüm kartları aynı top değerine sahip olabilir;
      // böyle durumlarda son tıklanan bölümü tercih et.
      const tied = passed.filter((item) => maxTop - item.top < 2);
      const clicked = tied.find((item) => item.id === lastClickedRef.current);
      setActive(clicked?.id ?? tied[0]?.id ?? null);
    };

    detect();
    window.addEventListener("scroll", detect, { passive: true });
    window.addEventListener("resize", detect);
    const observer = new ResizeObserver(detect);
    observer.observe(document.body);
    return () => {
      window.removeEventListener("scroll", detect);
      window.removeEventListener("resize", detect);
      observer.disconnect();
    };
  }, []);

  const jumpTo = (id: string) => {
    const node = document.getElementById(id);
    if (!node) return;
    lastClickedRef.current = id;
    setActive(id);
    lockRef.current = { until: Date.now() + 1200 };
    node.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Sayfa bölümleri"
      className={cn(
        "sticky top-0 z-40 border-b border-neutral-200/70 bg-white/95 shadow-[0_6px_16px_rgba(0,0,0,0.05)] backdrop-blur-sm print:hidden",
        className,
      )}
    >
      <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2.5 sm:px-6 lg:px-8 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            type="button"
            onClick={() => jumpTo(section.id)}
            aria-current={active === section.id ? "true" : undefined}
            className={cn(
              "inline-flex h-8 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors",
              active === section.id
                ? "bg-[#14B8A6] text-white hover:bg-[#0D9488]"
                : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
            )}
          >
            {section.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
