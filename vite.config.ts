import { vlyPlugin } from "@vly-ai/integrations";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    // KÖK-VARLIK KOPYASI: platformda postbuild/prebuild hook'ları KOŞMUYOR (kanıtlı).
    // Bu yüzden kök app.js + ek-ders.js + vendor/*'ı doğrudan dist/'e yazar; public/ kopyasını
    // EZER (closeBundle = publicDir kopyasından SONRA koşar; writeBundle önce koşup ezilebilir).
    // D62: kopyalama ATOMİK (geçici → doğrula → rename) ve kopyadan SONRA dist
    // doğrulanır (varlık var mı, boyut > 0, sha256(kök) == sha256(dist));
    // uyuşmazlıkta throw → build kırmızı düşer, sessiz bozuk dist imkânsız.
    // closeBundle dist'in TEK yazıcısıdır; scripts/copy-static.mjs ile eşzamanlı
    // çalışmaz (o postbuild'de, bu build sırasında koşar — emit/copy sırası değişmez).
    {
      name: "kok-varlik-kopyala",
      closeBundle() {
        const kok = path.resolve(__dirname);
        const hedefKok = path.join(kok, "dist");
        const sha256 = (b: Buffer) => createHash("sha256").update(b).digest("hex");

        // ATOMİK KOPYA: hedefle AYNI dizinde benzersiz geçici
        // ".<basename>.tmp-<pid>" → writeFileSync → boyut+sha256 karşılaştır →
        // renameSync (tek atomik adım). Kaynak 0 bayt ya da doğrulama
        // başarısızsa: geçici rmSync(force) ile silinir, MEVCUT HEDEF
        // KORUNUR, throw edilir → build kırmızı düşer.
        const kopyalaAtomik = (kaynak: string, hedef: string) => {
          const icerik = fs.readFileSync(kaynak);
          if (icerik.length === 0) {
            throw new Error("0 BAYT KAYNAK REDDEDİLDİ: " + kaynak + " → " + hedef + " (mevcut hedef korundu)");
          }
          fs.mkdirSync(path.dirname(hedef), { recursive: true });
          const gecici = path.join(path.dirname(hedef), "." + path.basename(hedef) + ".tmp-" + process.pid);
          try {
            fs.writeFileSync(gecici, icerik);
            const geri = fs.readFileSync(gecici);
            if (geri.length !== icerik.length || sha256(geri) !== sha256(icerik)) {
              throw new Error("DOĞRULAMA BAŞARISIZ: " + gecici + " → " + hedef);
            }
            fs.renameSync(gecici, hedef); // atomik: hedef yalnız bu noktada değişir
          } catch (e) {
            fs.rmSync(gecici, { force: true }); // geçiciyi sil, mevcut hedefi KORU
            throw e;
          }
        };

        // Varlık listesi: app.js + ek-ders.js + vendor/* (alt dizinler dahil)
        const listele = (dir: string): string[] =>
          fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
            const tam = path.join(dir, d.name);
            return d.isDirectory() ? listele(tam) : [tam];
          });
        const VARLIKLAR = [
          "app.js",
          "ek-ders.js",
          ...listele(path.join(kok, "vendor")).map((p) => path.relative(kok, p)),
        ];

        // KOPYALA (yazı → doğrula → rename)
        for (const rel of VARLIKLAR) kopyalaAtomik(path.join(kok, rel), path.join(hedefKok, rel));

        // DOĞRULA: her varlık dist'te var mı, boyut > 0 mı,
        // sha256(kök) == sha256(dist) mi. Uyuşmazlıkta THROW → build KIRMIZI.
        for (const rel of VARLIKLAR) {
          const kokDosya = path.join(kok, rel);
          const distDosya = path.join(hedefKok, rel);
          if (!fs.existsSync(distDosya)) throw new Error("DIST EKSİK: " + rel);
          const boyut = fs.statSync(distDosya).size;
          if (boyut === 0) throw new Error("DIST 0 BAYT: " + rel);
          if (sha256(fs.readFileSync(distDosya)) !== sha256(fs.readFileSync(kokDosya))) {
            throw new Error("SHA UYUŞMADI (kök ≠ dist): " + rel);
          }
        }
      },
    },
    react(),
    vlyPlugin(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    // Force a single copy of React across all packages (including vlyPlugin).
    // Without this, @vly-ai/integrations can resolve its own React copy, which
    // triggers "Invalid hook call" errors at runtime.
    dedupe: ["react", "react/jsx-runtime", "react-dom", "react-dom/client"],
  },
  build: {
    // Enable source maps for better debugging (disable in production if needed)
    sourcemap: false,
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        // manualChunks KALDIRILDI: bu proje vanilya-JS (kök index.html + app.js).
        // React/Convex/radix/recharts import EDİLMEDİĞİ için eski manualChunks
        // listesi yalnızca 6 adet BOŞ chunk (react-vendor, convex-vendor, radix-ui,
        // framer-motion, charts, forms — her biri 1 bayt) üretiyordu. Boş chunk'lar
        // build çıktısını kirletir ve "Generated an empty chunk" uyarıları verir.
        // Optimize chunk size
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase chunk size warning limit for better chunking
    chunkSizeWarningLimit: 1000,
    // Target modern browsers for better optimization
    target: 'esnext',
    // Minify options - using esbuild (faster than terser)
    minify: 'esbuild',
  },
  // Optimize dependencies
  optimizeDeps: {
    // Only scan the app entry HTML; avoids crawling unrelated *.html files
    // if a legacy snapshot accidentally contains leaked package folders.
    entries: ['index.html'],
    include: [
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-router',
      '@convex-dev/auth/react',
      'framer-motion',
    ],
  },
  // Performance hints
  server: {
    // Bind to all interfaces so WebContainer's server-ready event fires.
    host: true,
    port: 5173,
    // Keep HMR on, but disable full-screen error overlay
    hmr: {
      overlay: false,
    },
  },
});
