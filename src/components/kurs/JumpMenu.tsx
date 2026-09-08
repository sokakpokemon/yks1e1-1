import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

const SECTIONS = [
  { id: "bolum-program", label: "Program" },
  { id: "bolum-ders-planla", label: "Ders Planla" },
  { id: "bolum-istekler", label: "İstekler" },
  { id: "bolum-ek-ders", label: "Ek Ders" },
  { id: "bolum-bakis", label: "Bakış" },
  { id: "bolum-yonetim", label: "Yönetim" },
] as const;

const STICKY_OFFSET = 64;

function sectionTop(id: string): number {
  const node = document.getElementById(id);
  if (!node) return 0;
  return node.getBoundingClientRect().top + window.scrollY - STICKY_OFFSET;
}

export function JumpMenu() {
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY + STICKY_OFFSET + 24;
      let current: string | null = null;
      for (const section of SECTIONS) {
        const node = document.getElementById(section.id);
        if (node && node.getBoundingClientRect().top + window.scrollY <= y) {
          current = section.id;
        }
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const jumpTo = (id: string) => {
    const node = document.getElementById(id);
    if (!node) return;
    const target = Math.max(0, sectionTop(id));
    window.scrollTo({ top: target, behavior: "smooth" });
  };

  return (
    <nav
      aria-label="Sayfa bölümleri"
      className="sticky top-0 z-40 border-b border-neutral-200/70 bg-white/95 shadow-[0_1px_0_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] backdrop-blur-sm print:hidden"
    >
      <div className="mx-auto w-full max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1.5 overflow-x-auto py-2.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SECTIONS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => jumpTo(section.id)}
              aria-current={active === section.id ? "true" : undefined}
              className={cn(
                "inline-flex h-8 shrink-0 cursor-pointer items-center whitespace-nowrap rounded-full px-3.5 text-[13px] font-medium transition-colors",
                active === section.id
                  ? "border border-neutral-200/80 bg-white text-neutral-900 shadow-[0_1px_2px_rgba(0,0,0,0.05)]"
                  : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
}