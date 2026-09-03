import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  GraduationCap,
  Loader2,
  LogOut,
  NotebookPen,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const FEATURES = [
  {
    icon: CalendarDays,
    title: "Haftalık ders planı",
    text: "Her birebir dersi öğrenci, ders, eksik konu, öğretmen, tarih ve saatle tek ekranda planla.",
  },
  {
    icon: NotebookPen,
    title: "Eksik konu takibi",
    text: "Derste işlenen ve işlenecek eksik konular derste kalmasın; haftalık görünümde kaçmasın.",
  },
  {
    icon: ClipboardList,
    title: "Raporlar ve bilgilendirme",
    text: "Ders dağılımı, planlanan ve tamamlanan dersler anlık istatistiklerle; liste tek tıkla paylaşılır.",
  },
];

const STEPS = [
  {
    step: "01",
    title: "Dersini planla",
    text: "Formu doldur: öğrenci, ders, eksik konu, öğretmen, tarih ve saat.",
  },
  {
    step: "02",
    title: "Durumu işaretle",
    text: "Ders planlandı, tamamlandı ya da iptal — durum tabloda anında güncellenir.",
  },
  {
    step: "03",
    title: "Raporla ve paylaş",
    text: "Listeyi kopyala, PDF al ya da öğrencilere WhatsApp'tan gönder.",
  },
];

export default function Landing() {
  const { isLoading, isAuthenticated, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [guestPending, setGuestPending] = useState(false);

  const handleGuest = async () => {
    if (guestPending) return;
    setGuestPending(true);
    try {
      await signIn("anonymous");
      navigate("/dashboard");
    } catch (error) {
      console.error("Guest sign-in error:", error);
      setGuestPending(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="flex min-h-screen flex-col bg-white text-neutral-900"
    >
      {/* Nav */}
      <header className="border-b border-neutral-100">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-[#14B8A6]">
              <GraduationCap className="size-[18px] text-white" strokeWidth={2} />
            </span>
            <span className="text-[15px] font-semibold tracking-tight">
              YKS Birebir Takip
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            {isLoading ? (
              <Loader2 className="size-4 animate-spin text-neutral-400" />
            ) : isAuthenticated ? (
              <>
                <Button
                  variant="ghost"
                  className="cursor-pointer text-neutral-600"
                  onClick={() => void handleSignOut()}
                >
                  <LogOut className="size-4" />
                  Çıkış
                </Button>
                <Button
                  asChild
                  className="cursor-pointer rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  <Link to="/dashboard">
                    Panoya Git
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  className="cursor-pointer text-neutral-600"
                >
                  <Link to="/auth">Giriş Yap</Link>
                </Button>
                <Button
                  asChild
                  className="cursor-pointer rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
                >
                  <Link to="/auth?returnTo=%2Fdashboard">
                    Hemen Başla
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Hero */}
      <motion.section
        variants={stagger}
        initial="hidden"
        animate="show"
        className="border-b border-neutral-100"
      >
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 pt-20 pb-24 text-center sm:px-8 sm:pt-28 sm:pb-32">
          <motion.p
            variants={fadeUp}
            className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-3.5 py-1.5 text-xs font-medium text-neutral-500"
          >
            <span className="size-1.5 rounded-full bg-[#14B8A6]" />
            Kurslar için birebir ders takip aracı
          </motion.p>

          <motion.h1
            variants={fadeUp}
            className="mt-7 max-w-3xl text-4xl leading-[1.08] font-bold tracking-tight text-balance sm:text-6xl"
          >
            Birebir derslerin planı,
            <br />
            <span className="text-neutral-400">eksik konuların takibi.</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 max-w-xl text-base leading-relaxed text-pretty text-neutral-500 sm:text-lg"
          >
            YKS kursunuzun yazdığı özel dersleri tek sade ekranda yönetin:
            haftalık plan, öğrenci eksik konuları ve anlık ders istatistikleri.
          </motion.p>

          <motion.div
            variants={fadeUp}
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row"
          >
            {isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="h-11 cursor-pointer rounded-full bg-neutral-900 px-7 text-white hover:bg-neutral-800"
              >
                <Link to="/dashboard">
                  Panoya Git
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  size="lg"
                  className="h-11 cursor-pointer rounded-full bg-neutral-900 px-7 text-white hover:bg-neutral-800"
                >
                  <Link to="/auth?returnTo=%2Fdashboard">
                    Hemen Başla
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <button
                  type="button"
                  onClick={() => void handleGuest()}
                  disabled={guestPending}
                  className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-neutral-200 px-7 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {guestPending && (
                    <Loader2 className="size-4 animate-spin" />
                  )}
                  Misafir olarak dene
                </button>
              </>
            )}
          </motion.div>

          <motion.p
            variants={fadeUp}
            className="mt-10 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[13px] text-neutral-400"
          >
            <span className="flex items-center gap-1.5">
              <CalendarDays className="size-3.5" /> Haftalık plan
            </span>
            <span className="text-neutral-200">·</span>
            <span>Eksik konu takibi</span>
            <span className="text-neutral-200">·</span>
            <span>WhatsApp bilgilendirme</span>
            <span className="text-neutral-200">·</span>
            <span>Rapor görseli</span>
          </motion.p>
        </div>
      </motion.section>

      {/* Features */}
      <motion.section
        id="ozellikler"
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="border-b border-neutral-100"
      >
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-x-12 gap-y-12 px-5 py-20 sm:px-8 md:grid-cols-3 md:py-24">
          {FEATURES.map((feature) => (
            <motion.div key={feature.title} variants={fadeUp}>
              <span className="flex size-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-50">
                <feature.icon className="size-[18px] text-neutral-800" strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 text-[15px] font-semibold tracking-tight">
                {feature.title}
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-neutral-500">
                {feature.text}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* How it works */}
      <motion.section
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-80px" }}
        className="border-b border-neutral-100"
      >
        <div className="mx-auto w-full max-w-6xl px-5 py-20 sm:px-8 md:py-24">
          <motion.h2
            variants={fadeUp}
            className="max-w-md text-2xl font-bold tracking-tight text-balance sm:text-3xl"
          >
            Kursta işleyiş, üç adımda.
          </motion.h2>
          <div className="mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {STEPS.map((item) => (
              <motion.div
                key={item.step}
                variants={fadeUp}
                className="border-t border-neutral-200 pt-5"
              >
                <span className="text-sm font-semibold text-neutral-300 tabular-nums">
                  {item.step}
                </span>
                <h3 className="mt-2 text-[15px] font-semibold tracking-tight">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-neutral-500">
                  {item.text}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Final CTA */}
      <section>
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center px-5 py-20 text-center sm:px-8 sm:py-28">
          <h2 className="max-w-xl text-2xl font-bold tracking-tight text-balance sm:text-4xl">
            İlk birebir dersini bugün planla.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-neutral-500 sm:text-base">
            E-posta ile üye ol ya da misafir girişiyle örnek verilerle hemen
            keşfet — 30 saniye sürer.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {isAuthenticated ? (
              <Button
                asChild
                className="h-11 cursor-pointer rounded-full bg-neutral-900 px-7 text-white hover:bg-neutral-800"
              >
                <Link to="/dashboard">
                  Panoya Git
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ) : (
              <>
                <Button
                  asChild
                  className="h-11 cursor-pointer rounded-full bg-neutral-900 px-7 text-white hover:bg-neutral-800"
                >
                  <Link to="/auth?returnTo=%2Fdashboard">
                    Ücretsiz Başla
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => void handleGuest()}
                  disabled={guestPending}
                  className="h-11 cursor-pointer rounded-full"
                >
                  {guestPending && <Loader2 className="size-4 animate-spin" />}
                  Misafir olarak dene
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-neutral-100">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-8">
          <div className="flex items-center gap-2">
            <span className="flex size-6 items-center justify-center rounded-md bg-[#14B8A6]">
              <GraduationCap className="size-3.5 text-white" strokeWidth={2} />
            </span>
            <span className="text-[13px] font-medium text-neutral-700">
              YKS Birebir Takip
            </span>
          </div>
          <p className="text-xs text-neutral-400">
            © {new Date().getFullYear()} · Birebir Ders ve Öğrenci Eksik Takip
            Programı
          </p>
        </div>
      </footer>
    </motion.div>
  );
}
