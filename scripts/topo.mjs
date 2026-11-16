// Lager public/topo.svg: høydekurver fra et glatt høydefelt (marching squares).
// Kjør: node scripts/topo.mjs
import { writeFileSync } from "node:fs";

const W = 1600, H = 1000, NX = 128, NY = 80, LEVELS = 13;
const g = (x, y, cx, cy, s, a) => a * Math.exp(-((x - cx) ** 2 + (y - cy) ** 2) / (2 * s * s));
function height(u, v) {
  // u, v i 0..1. En topp nede til venstre, en rygg mot høyre og litt bølger så linjene blir organiske.
  return (
    g(u, v, 0.13, 0.84, 0.2, 1) +
    g(u, v, 0.52, 0.62, 0.26, 0.55) +
    g(u, v, 0.02, 0.3, 0.3, 0.5) +
    g(u, v, 0.95, 1.05, 0.3, 0.45) +
    0.07 * Math.sin(u * 9 + v * 4) +
    0.05 * Math.sin(v * 11 - u * 5) +
    0.03 * Math.sin((u + v) * 21)
  );
}
const f = [];
let lo = Infinity, hi = -Infinity;
for (let j = 0; j <= NY; j++) {
  f.push([]);
  for (let i = 0; i <= NX; i++) {
    const h = height(i / NX, j / NY);
    f[j].push(h);
    lo = Math.min(lo, h);
    hi = Math.max(hi, h);
  }
}
const sx = W / NX, sy = H / NY;
const paths = [];
for (let l = 1; l <= LEVELS; l++) {
  const t = lo + ((hi - lo) * l) / (LEVELS + 1);
  const segs = [];
  const pt = (i1, j1, i2, j2) => {
    const a = f[j1][i1], b = f[j2][i2], k = (t - a) / (b - a);
    return [Math.round((i1 + (i2 - i1) * k) * sx * 2) / 2, Math.round((j1 + (j2 - j1) * k) * sy * 2) / 2];
  };
  for (let j = 0; j < NY; j++)
    for (let i = 0; i < NX; i++) {
      const c = [f[j][i] > t, f[j][i + 1] > t, f[j + 1][i + 1] > t, f[j + 1][i] > t];
      const e = [];
      if (c[0] !== c[1]) e.push(pt(i, j, i + 1, j));
      if (c[1] !== c[2]) e.push(pt(i + 1, j, i + 1, j + 1));
      if (c[2] !== c[3]) e.push(pt(i + 1, j + 1, i, j + 1));
      if (c[3] !== c[0]) e.push(pt(i, j + 1, i, j));
      if (e.length === 2) segs.push(e);
      else if (e.length === 4) segs.push([e[0], e[1]], [e[2], e[3]]);
    }
  // Kjeder segmentene sammen til lange linjer, så filen blir liten.
  const key = (p) => p.join(",");
  const ends = new Map();
  segs.forEach((s, n) => s.forEach((p) => (ends.get(key(p)) ?? ends.set(key(p), []).get(key(p))).push(n)));
  const used = new Set();
  const grow = (line, atEnd) => {
    for (;;) {
      const tip = atEnd ? line[line.length - 1] : line[0];
      const n = (ends.get(key(tip)) ?? []).find((m) => !used.has(m));
      if (n === undefined) return;
      used.add(n);
      const [a, b] = segs[n];
      const next = key(a) === key(tip) ? b : a;
      atEnd ? line.push(next) : line.unshift(next);
    }
  };
  let d = "";
  segs.forEach((s, n) => {
    if (used.has(n)) return;
    used.add(n);
    const line = [s[0], s[1]];
    grow(line, true);
    grow(line, false);
    d += "M" + line.map((p) => p.join(" ")).join("L");
  });
  paths.push(`<path d="${d}" stroke-width="${l % 4 === 0 ? 2.2 : 1.3}"/>`);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" fill="none" stroke="#d9d6cc" stroke-opacity="0.5" stroke-linejoin="round" stroke-linecap="round">${paths.join("")}</svg>`;
writeFileSync("public/topo.svg", svg);
console.log(`public/topo.svg: ${(svg.length / 1024).toFixed(0)} kB`);
