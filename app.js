      var sinifOgrt = null;
      if (tip === "sinif" && durum === "var" && sinifOgrtMap) sinifOgrt = sinifOgrtMap[k] || null;
      if (tip === "ogretmen" && durum === "sinif" && sinifOgrtMap) sinifOgrt = sinifOgrtMap[k] || null;
      var cls = "hucreBtn border ";
      var baslik = GUN_KISA[g2] + " " + bil.no + ". Ders (" + slotAralikYazi(bil) + ")";
      if (mola) { cls += "bg-emerald-100 border-emerald-200 cursor-not-allowed"; baslik = "Öğle Molası 12:00-13:00 — ders eklenemez"; }
      else if (durum === "sinif") { cls += "bg-amber-200 border-amber-300" + (kilitli ? "" : " hover:bg-amber-300"); baslik += " · Sınıf Dersi"; }
      else if (durum === "musait") { cls += "bg-rose-200 border-rose-300" + (kilitli ? "" : " hover:bg-rose-300"); baslik += " · Müsait Değil"; }
      else if (durum === "var") { cls += "bg-blue-200 border-blue-300" + (kilitli ? "" : " hover:bg-blue-300"); baslik += " · Toplu ders"; }
      else { cls += "bg-white border-slate-200" + (kilitli ? " cursor-not-allowed" : " hover:border-teal-300 hover:bg-teal-50"); baslik += kilitli ? " · Düzenleme kapalı" : " · Boş"; }
      var icerik = "";
      if (mola) icerik = '<span class="text-[8.5px] font-extrabold text-emerald-600/80">MOLA</span>';
      else if (durum === "sinif") {
        icerik = sinifOgrt
          ? '<div class="leading-tight"><span class="block text-[7px] font-extrabold text-amber-800/90 whitespace-nowrap">' + esc(String(sinifOgrt.ad).substring(0, 12)) + "</span><span class=\"block text-[6.5px] font-bold text-amber-600/80 whitespace-nowrap\">" + esc(String(sinifOgrt.dersAd).substring(0, 10)) + "</span></div>"
          : '<span class="text-[7.5px] font-extrabold text-amber-700/80 leading-tight whitespace-nowrap">' + esc(String((avail.sinif && avail.sinif[k]) || "Sınıf Dersi").substring(0, 14)) + "</span>";
      }
      else if (durum === "musait") icerik = '<span class="text-[8.5px] font-extrabold text-rose-500/70">MD</span>';
      else if (durum === "var") {
        icerik = sinifOgrt
          ? '<div class="rounded-md bg-white/70 border border-blue-300 px-1 py-0.5 leading-tight"><span class="block text-[7px] font-extrabold text-blue-800/90 whitespace-nowrap">' + esc(String(sinifOgrt.ad).substring(0, 12)) + "</span><span class=\"block text-[6.5px] font-bold text-blue-600/80 whitespace-nowrap\">" + esc(String(sinifOgrt.dersAd).substring(0, 10)) + "</span></div>"
          : '<span class="text-[8.5px] font-extrabold text-blue-600/60">DV</span>';
      }
      var disable = kilitli || mola ? "disabled " : "";
      h += '<td class="p-0.5"><button ' + disable + 'class="' + cls + '" title="' + baslik + '"' +
        (!kilitli && !mola ? ' onclick="' + onclickOnce + "," + g2 + "," + key + ')"' : "") + ">" + icerik + "</button></td>";
