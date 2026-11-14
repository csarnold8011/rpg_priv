// Tapasztalati pont (XP): a szintek küszöbei és a DM jutalmai (Alapkönyv 10. fejezet, 117–118. o.).
// A küszöbök a Szintlépés lap szint_altalanos sorából jönnek (xp_tabla), ez csak tartalék.
import { szam, reszletek } from './szabalyindex.js';

const TARTALEK = [0, 0, 2000, 4000, 6000, 8000, 10000, 13000, 16000, 19000, 22000, 25000, 28000, 32000, 36000, 40000, 44000, 48000, 52000, 56000, 60000];

// Index: szint, érték: a szinthez kellő XP (az 1. szint 0).
export function xpTabla(ix) {
  const t = reszletek(ix && ix.elem('Szintlépés', 'szint_altalanos')).xp_tabla;
  if (!Array.isArray(t) || !t.length) return TARTALEK;
  const ki = TARTALEK.slice();
  t.forEach((s) => { const n = szam(s.szint); if (n >= 1 && n <= 20) ki[n] = szam(s.xp); });
  return ki;
}
// A szinthez kellő XP; 20 fölött null.
export const xpKuszob = (ix, szint) => (szint >= 1 && szint <= 20 ? xpTabla(ix)[szint] : null);
// A legmagasabb szint, amelyet az XP elér.
export function xpSzint(ix, xp) {
  const t = xpTabla(ix);
  let n = 1;
  for (let i = 2; i <= 20; i++) if (szam(xp) >= t[i]) n = i;
  return n;
}

// A találkozások besorolása és a hozzájuk járó XP (Alapkönyv 117–118. o.).
export const XP_TALALKOZAS = [
  { kulcs: 'rutin', nev: 'Rutin', xp: 0, leiras: 'Semmi különös: bevásárlás, eseménytelen utazás, hétköznapi beszélgetés.' },
  { kulcs: 'konnyu', nev: 'Könnyű', xp: 100, leiras: 'Gyorsan, kis erőfeszítéssel megoldották, alig volt veszély, kevés erőforrás fogyott.' },
  { kulcs: 'kozepes', nev: 'Közepes', xp: 250, leiras: 'Valódi kihívás volt, ügyesség kellett hozzá, és jelentős erőforrás (pénz, Egészség, Mágiapont) fogyhatott.' },
  { kulcs: 'nehez', nev: 'Nehéz', xp: 400, leiras: 'Kemény küzdelem, sok idő és erőforrás, halálos veszély, akár egy karakter halála.' }
];

// A jutalom típusai a kiosztó ablakhoz és a naplóhoz.
export const XP_TIPUSOK = [
  { kulcs: 'talalkozas', nev: 'Találkozás' },
  { kulcs: 'bonusz', nev: 'Kaland vége' },
  { kulcs: 'szerep', nev: 'Szerepjáték' },
  { kulcs: 'szintjutalom', nev: 'Szintjutalom' },
  { kulcs: 'javitas', nev: 'Egyéb, javítás' }
];
export const xpTipusNev = (k) => (XP_TIPUSOK.find((x) => x.kulcs === k) || { nev: k || 'XP' }).nev;

// Szintjutalom: annyi XP, amennyi a következő szinthez hiányzik (legalább 0).
export function szintjutalomXp(ix, xp, lezartSzint) {
  const k = xpKuszob(ix, lezartSzint + 1);
  return k === null ? 0 : Math.max(0, k - szam(xp));
}
