import { Button } from "@/components/ui/button";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import { Link } from "react-router";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center text-neutral-900">
      <p className="text-6xl font-bold tracking-tight">404</p>
      <h1 className="mt-4 text-lg font-semibold tracking-tight">
        Aradığın sayfa bulunamadı
      </h1>
      <p className="mt-2 max-w-sm text-sm leading-relaxed text-neutral-500">
        Adres yanlış olabilir ya da sayfa taşınmış olabilir. Ana sayfaya dönüp
        yeniden başlayabilirsin.
      </p>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button
          asChild
          variant="outline"
          className="cursor-pointer rounded-full"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            Ana sayfa
          </Link>
        </Button>
        <Button
          asChild
          className="cursor-pointer rounded-full bg-neutral-900 text-white hover:bg-neutral-800"
        >
          <Link to="/dashboard">
            <LayoutDashboard className="size-4" />
            Panoya git
          </Link>
        </Button>
      </div>
    </div>
  );
}
