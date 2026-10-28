import { readFileSync, writeFileSync } from 'node:fs';
const src = readFileSync('public/takip-sistem.js', 'utf8');

let out = src;
let changes = 0;

const truncBetween = (startMarker, endMarker) => {
  const start = out.indexOf(startMarker);
  if (start === -1) return false;
  const chunk = out.slice(start);
  if (!chunk.startsWith(startMarker)) return false;
  const end = chunk.indexOf(endMarker, startMarker.length);
  if (end === -1) return false;
  out = out.replace(chunk.slice(0, end + endMarker.length), endMarker);
  changes++;
  return true;
};

truncBetween(
  `// BIREBİR-VARSAYILAN: 'birebir' kategorisinde 'plan' destanı yoksa varsayılan plan metnini temin et.`,
  `    __waTaslakKategorileri.forEach(function (kat) {`
);
truncBetween(
  `// BIREBİR-BACKSTOP: 'birebir.plan' boşsa varsayılan plan metnini temin et (kayıt/yazma/mesajenu.)`,
  `    return t;\n  }\n  function taslakYaz`
);
truncBetween(
  `// BIREBİR-TASLAK: kayıt objesi 'birebir.plan' yoksa varsayılan plan metnini temin et.`,
  `    localStorage.setItem("yksOto_taslaklar", JSON.stringify(t));`
);

if (changes > 0) writeFileSync('public/takip-sistem.js', out, 'utf8');
console.log('sanitize', changes ? 'applied (' + changes + ')' : 'no change');
