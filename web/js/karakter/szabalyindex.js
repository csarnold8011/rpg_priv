// A szabályadat gyors elérése a karakterszámoláshoz. Tiszta függvények, böngészőben és Node-ban is futnak.
// A lapok szerkezete: { 'Fajok': [ { id, nev_hu, nev_en, forras, reszletek, ... } ], ... } (lásd schema/sema.json).

// Szám a táblázat cellájából: a "−1" (nyomdai mínusz), az üres cella és a szöveg is kezelve.
export function szam(x, alap = 0) {
  if (x === null || x === undefined || x === '') return alap;
  if (typeof x === 'number') return isFinite(x) ? x : alap;
  const s = String(x).trim().replace(/[−–]/g, '-').replace(',', '.');
  const n = parseFloat(s);
  return isFinite(n) ? n : alap;
}

// A reszletek mező objektumként (a háttér JSON-ként adja, de szöveg is érkezhet).
export function reszletek(elem) {
  if (!elem) return {};
  const r = elem.reszletek;
  if (r && typeof r === 'object') return r;
  if (typeof r === 'string' && r.trim()) {
    try { return JSON.parse(r) || {}; } catch (e) { return {}; }
  }
  return {};
}

// Dobástartomány illesztése: "7-8", "2", "10–11" alakú szöveg a 2d6 vagy 1d6 eredményére.
export function tartomanyban(tartomany, ertek) {
  const s = String(tartomany).replace(/[–—]/g, '-').trim();
  const m = s.match(/^(-?\d+)\s*(?:-|\.\.)\s*(-?\d+)$/);
  if (m) return ertek >= Number(m[1]) && ertek <= Number(m[2]);
  return Number(s) === ertek;
}

// Az általános szabálysorok (…_altalanos) nem valódi elemek, a választólistákból ki kell hagyni őket.
export const altalanos = (elem) => !!(elem && elem.id && /_altalanos$/.test(elem.id));

const gyorsitotar = new WeakMap();

// Index a lapokhoz: azonosító szerinti keresés, egy WeakMap-ben megjegyezve.
export function index(lapok) {
  if (!lapok || typeof lapok !== 'object') lapok = {};
  let ix = gyorsitotar.get(lapok);
  if (ix) return ix;
  const lapIndex = {};
  Object.keys(lapok).forEach((nev) => {
    const m = new Map();
    (lapok[nev] || []).forEach((e) => { if (e && e.id) m.set(e.id, e); });
    lapIndex[nev] = m;
  });
  ix = {
    lapok,
    elem: (lap, id) => (id && lapIndex[lap] ? lapIndex[lap].get(id) || null : null),
    lista: (lap) => (lapok[lap] || []).filter((e) => !altalanos(e)),
    // Szintlépés sor egy osztály egy szintjéhez
    szintSor: (osztaly, szint) => (lapok['Szintlépés'] || []).find((s) => s.osztaly === osztaly && szam(s.szint) === szint) || null,
    // Fegyvercsoport a hozzá tartozó fókusz azonosítójából (a faji előnytábla így hivatkozik rá)
    csoportFokuszbol: (fokuszId) => (lapok['Fegyvercsoportok'] || []).find((c) => reszletek(c).fokusz === fokuszId) || null
  };
  gyorsitotar.set(lapok, ix);
  return ix;
}
