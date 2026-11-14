// A szintlépés-varázsló logikája: tiszta függvények, böngészőben és Node-ban is futnak.
// Egy szintlépés a karakter szintek[] listájában egy `kesz: false` bejegyzés; lezáráskor `kesz: true`.
// A folyamatban lévő szintlépés célja és lépése: adat.szintlepes = { cel, lepes }.
// A végértékeket a szamol.js adja (a félkész szinttel együtt: karakterSzamol(adat, lapok, { felkesz: true })).
import { szam, reszletek } from './szabalyindex.js';
import { TULAJDONSAGOK, fejlesztesKoltseg, fokozatNev } from './tablak.js';
import { uresSzint } from './adat.js';
import { fokozatVarazslatok } from './magia.js';
import { naplozDobas, osszeg } from './varazslo.js';
import { xpKuszob } from './xp.js';

export const MAX_SZINT = 20;

export const SZINT_LEPESEK = [
  { kulcs: 'egeszseg', cim: 'Egészség' },
  { kulcs: 'tulajdonsag', cim: 'Tulajdonság' },
  { kulcs: 'fokusz', cim: 'Fókusz' },
  { kulcs: 'kepessegek', cim: 'Képességek' },
  { kulcs: 'attekintes', cim: 'Áttekintés' }
];
export const szintLepesSzam = (kulcs) => Math.max(0, SZINT_LEPESEK.findIndex((l) => l.kulcs === kulcs));

// ---- A szintlépés állapota ----
export const felkeszSzint = (adat) => (adat.szintek || []).find((s) => s.kesz === false) || null;
export function lezartSzint(adat) {
  const sz = (adat.szintek || []).filter((s) => s.kesz !== false).map((s) => szam(s.szint, 1));
  return sz.length ? Math.max(...sz) : 1;
}
export const szintBejegyzes = (adat, n) => (adat.szintek || []).find((s) => s.szint === n) || null;

// Szintlépés indítása (vagy a félbehagyott folytatása) a `cel` szintig. Visszaadja a most nyitott szint számát.
// Átvett (régi szerkezetű) karakternél rögzíti az átvételkori szintet: a régi lapról átvett Egészség és
// Mágiapont felülírás eddig érvényes, a későbbi szintek gyarapodása hozzáadódik.
export function szintlepesIndit(adat, cel) {
  if (adat.keszites && adat.keszites.allapot === 'atvett' && (adat.keszites.atvett_szint === undefined || adat.keszites.atvett_szint === null)) {
    adat.keszites.atvett_szint = lezartSzint(adat);
    (adat.kezi || []).forEach((k) => {
      if (k && k.mod === 'felulir' && (k.cel === 'egeszseg_max' || k.cel === 'magiapont_max') && !k.szint) k.szint = adat.keszites.atvett_szint;
    });
  }
  let sz = felkeszSzint(adat);
  let uj = false;
  if (!sz) {
    const n = lezartSzint(adat) + 1;
    if (n > MAX_SZINT) return null;
    sz = Object.assign(uresSzint(n), { kesz: false });
    adat.szintek.push(sz);
    adat.szintek.sort((a, b) => a.szint - b.szint);
    uj = true;
  }
  const regi = adat.szintlepes || {};
  const c = Math.min(MAX_SZINT, Math.max(sz.szint, szam(cel, 0), uj ? 0 : szam(regi.cel, 0)));
  // kezdo: ennek a szintlépésnek az első szintje (a szintsorhoz), elert: a legtávolabbi megnyitott lépés
  adat.szintlepes = { cel: c, kezdo: regi.kezdo && !uj ? regi.kezdo : sz.szint, lepes: uj || !regi.lepes ? 'egeszseg' : regi.lepes, elert: uj ? 0 : szam(regi.elert, 0) };
  return sz.szint;
}

// A nyitott szint lezárása. Ha a cél magasabb, rögtön nyílik a következő; visszaadja annak számát, vagy null.
// ix megadásakor a karakterkészítőben választott kezdő szintig az XP is felmegy a szint küszöbéig
// (aki 4. szinten kezd, 6000 XP-vel indul, így a későbbi jutalmak jól adódnak hozzá).
export function szintLezar(adat, ix) {
  const sz = felkeszSzint(adat);
  if (!sz) return null;
  sz.kesz = true;
  if (ix && sz.szint <= szam((adat.keszites || {}).cel_szint, 1)) {
    adat.allapot = adat.allapot || {};
    const k = xpKuszob(ix, sz.szint);
    if (k !== null && szam(adat.allapot.xp) < k) adat.allapot.xp = k;
  }
  const cel = adat.szintlepes ? szam(adat.szintlepes.cel, sz.szint) : sz.szint;
  if (cel > sz.szint && sz.szint < MAX_SZINT) {
    adat.szintek.push(Object.assign(uresSzint(sz.szint + 1), { kesz: false }));
    adat.szintlepes = { cel, kezdo: (adat.szintlepes && adat.szintlepes.kezdo) || sz.szint, lepes: 'egeszseg', elert: 0 };
    return sz.szint + 1;
  }
  delete adat.szintlepes;
  return null;
}

// A félbehagyott szint elvetése (a dobásnapló megmarad).
export function szintElvet(adat) {
  adat.szintek = (adat.szintek || []).filter((s) => s.kesz !== false);
  delete adat.szintlepes;
}

// ---- Szabályok szintenként ----
export const szintKepessegek = (ix, osztalyId, n) => reszletek(ix.szintSor(osztalyId, n)).kepessegek || [];
// Páros szinten elsődleges, páratlanon másodlagos tulajdonság (fejlesztés és fókusz).
export const szintCsoport = (n) => (n % 2 === 0 ? 'elsodleges' : 'masodlagos');
export function szintTulajdonsagok(ix, osztalyId, n) {
  const or = reszletek(ix.elem('Osztályok', osztalyId));
  const sajat = (szintCsoport(n) === 'elsodleges' ? or.elsodleges : or.masodlagos) || [];
  return { sajat, tobbi: TULAJDONSAGOK.filter((t) => !sajat.includes(t)) };
}
// Az Egészség és a Mágiapont dobása: az 1–10. szinten 1d6, a 11. szinttől nincs dobás.
export const szintDobasKell = (n) => n <= 10;

// Egy tulajdonság fejlesztésének ára és állapota a szint előtti lapból (Alapkönyv 27. o.).
export function fejlesztesInfo(lapElotte, t) {
  const x = lapElotte.tulajdonsagok[t] || { ertek: 0, fejlesztes_fuggo: 0 };
  const ertek = szam(x.ertek);
  const fizetett = szam(x.fejlesztes_fuggo);
  const uj = ertek + 1;
  const ar = fejlesztesKoltseg(uj);
  return { ertek, uj, ar, fizetett, most: fizetett + 1 >= ar };
}

// ---- Döntések a nyitott szinten ----
function nyitott(adat, n) {
  const sz = szintBejegyzes(adat, n);
  if (!sz) throw new Error(`Nincs ${n}. szint.`);
  return sz;
}
export function egeszsegDob(adat, n, kockak, kezi) {
  nyitott(adat, n).egeszseg_dobas = osszeg(kockak);
  naplozDobas(adat, 'egeszseg:' + n, kockak, kezi);
}
export function mpDob(adat, n, kockak, kezi) {
  nyitott(adat, n).mp_dobas = osszeg(kockak);
  naplozDobas(adat, 'mp:' + n, kockak, kezi);
}
export function fejlesztesBeallit(adat, n, t) {
  const sz = nyitott(adat, n);
  sz.fejlesztes = sz.fejlesztes === t ? null : t;
}
export function fokuszBeallit(adat, n, id) {
  const sz = nyitott(adat, n);
  sz.fokusz = sz.fokusz === id ? null : id;
}
export const szintKapott = (adat, n, tipus) => ((szintBejegyzes(adat, n) || {}).kapott || []).filter((k) => k.tipus === tipus).map((k) => k.id);
export function szintKapottBeallit(adat, n, tipus, idk) {
  const sz = nyitott(adat, n);
  sz.kapott = (sz.kapott || []).filter((k) => k.tipus !== tipus).concat(idk.filter(Boolean).map((id) => ({ tipus, id })));
}
// Egy elem a típusából egyetlen választásként (újra koppintva kikerül).
export function egyValaszt(adat, n, tipus, id) {
  const most = szintKapott(adat, n, tipus);
  szintKapottBeallit(adat, n, tipus, most.length === 1 && most[0] === id ? [] : [id]);
}

// Egy elem fokozata (a bejegyzések száma) az n. szint előtt.
function dbElotte(adat, n, tipus, id) {
  return (adat.szintek || []).filter((s) => s.szint < n)
    .reduce((a, s) => a + (s.kapott || []).filter((k) => k.tipus === tipus && k.id === id).length, 0);
}
const osztalyNak = (elem, osztalyId) => {
  const o = reszletek(elem).osztalyok || (elem && elem.osztaly && /^osz_/.test(elem.osztaly) ? [elem.osztaly] : null);
  return !o || !o.length || o.includes(osztalyId);
};

// Választható talentumok (új Kezdő vagy a meglévő következő fokozata). `ix` a karakter forrásaira szűrt index.
export function talentumLehetosegek(ix, adat, n) {
  return ix.lista('Talentumok').map((e) => {
    const db = dbElotte(adat, n, 'talentum', e.id);
    return { elem: e, id: e.id, db, kovetkezo: db < 3 ? fokozatNev(db + 1) : null, osztalynak: osztalyNak(e, adat.osztaly) };
  });
}
export function specializacioLehetosegek(ix, adat, n) {
  return ix.lista('Specializációk').map((e) => {
    const db = dbElotte(adat, n, 'specializacio', e.id);
    return { elem: e, id: e.id, db, kovetkezo: db < 3 ? fokozatNev(db + 1) : null, osztalynak: osztalyNak(e, adat.osztaly) };
  });
}
export function arkanumLehetosegek(ix, adat, n) {
  return ix.lista('Arkánumok').map((e) => {
    const db = dbElotte(adat, n, 'arkanum', e.id);
    return { elem: e, id: e.id, db, kovetkezo: db < 3 ? fokozatNev(db + 1) : null, osztalynak: osztalyNak(e, adat.osztaly) };
  });
}
// „Specializáció új fokozata”: a megadott szinten (specializacio_szint) választott specializáció.
export function specFokozatJavaslat(adat, kp) {
  const sz = szintBejegyzes(adat, szam(kp.specializacio_szint, 0));
  const k = sz && (sz.kapott || []).find((x) => x.tipus === 'specializacio');
  return k ? k.id : null;
}
// A karakter specializációi az n. szint előtt (a „Specializáció új fokozata” választólistájához).
export function meglevoSpecializaciok(adat, n) {
  const idk = [];
  (adat.szintek || []).filter((s) => s.szint < n).forEach((s) => (s.kapott || []).forEach((k) => {
    if (k.tipus === 'specializacio' && !idk.includes(k.id)) idk.push(k.id);
  }));
  return idk;
}

// Az n. szinten választott arkánum új fokozatához járó varázslatok (a már ismertek nélkül).
export function szintVarazslatok(ix, adat, n, arkanumId, forrasok) {
  const db = dbElotte(adat, n, 'arkanum', arkanumId) + 1;
  const fokozat = fokozatNev(Math.min(db, 3));
  const v = fokozatVarazslatok(ix, arkanumId, fokozat, forrasok);
  const ismert = [];
  (adat.szintek || []).filter((s) => s.szint < n).forEach((s) => (s.kapott || []).forEach((k) => { if (k.tipus === 'varazslat') ismert.push(k.id); }));
  return { ...v, fokozat, ismert, lista: v.lista.filter((id) => !ismert.includes(id)) };
}
// Mágikus talentum választása az n. szinten: a más arkánumhoz tartozó szintbeli varázslatok kikerülnek,
// a fix (csak Alapkönyv) varázslatok automatikusan bekerülnek.
export function arkanumValaszt(adat, ix, n, arkanumId, forrasok) {
  egyValaszt(adat, n, 'arkanum', arkanumId);
  const ark = szintKapott(adat, n, 'arkanum')[0] || null;
  let vars = szintKapott(adat, n, 'varazslat').filter((v) => ark && (ix.elem('Varázslatok', v) || {}).arkanum === ark);
  if (ark) {
    const sv = szintVarazslatok(ix, adat, n, ark, forrasok);
    if (!sv.valaszthato) vars = sv.lista.slice();
    else vars = vars.filter((v) => sv.lista.includes(v));
  }
  szintKapottBeallit(adat, n, 'varazslat', vars);
}
export function varazslatValt(adat, n, id) {
  const v = szintKapott(adat, n, 'varazslat');
  const j = v.indexOf(id);
  if (j >= 0) v.splice(j, 1); else v.push(id);
  szintKapottBeallit(adat, n, 'varazslat', v);
}

// Belépéskor a „Specializáció új fokozata” előre kitöltése a korábban választott specializációval.
export function automatikusKitoltes(adat, ix, n) {
  szintKepessegek(ix, adat.osztaly, n).forEach((kp) => {
    if (kp.tipus === 'specializacio_fokozat' && !szintKapott(adat, n, 'specializacio').length) {
      const id = specFokozatJavaslat(adat, kp) || (meglevoSpecializaciok(adat, n).length === 1 ? meglevoSpecializaciok(adat, n)[0] : null);
      if (id) szintKapottBeallit(adat, n, 'specializacio', [id]);
    }
  });
}

// ---- Áttekintés ----
// Figyelmeztetés → a szintlépés lépése.
const FIGY_LEPES = {
  hianyzo_dobas: 'egeszseg', fejlesztes_hianyzik: 'tulajdonsag', fejlesztes_tipus: 'tulajdonsag',
  szint_fokusz_hianyzik: 'fokusz', szint_fokusz_tipus: 'fokusz', dupla_fokusz: 'fokusz'
};
export const szintFigyLepese = (f) => FIGY_LEPES[f.kod] || 'kepessegek';
// Az n. szint figyelmeztetései: amelyek a szint előtti lapon még nem voltak.
export function szintFigyelmeztetesek(lapUtana, lapElotte) {
  const volt = new Set((lapElotte.figyelmeztetesek || []).map((f) => f.kulcs));
  return (lapUtana.figyelmeztetesek || []).filter((f) => f.szint === 'figyelmeztetes' && !volt.has(f.kulcs));
}

// Mi változott a szinten: [{ nev, ertek }] a két számolt lap összevetéséből.
export function szintValtozasok(lapElotte, lapUtana, tulNev) {
  const ki = [];
  if (lapUtana.egeszseg.ertek !== lapElotte.egeszseg.ertek) ki.push({ nev: 'Egészség', regi: lapElotte.egeszseg.ertek, uj: lapUtana.egeszseg.ertek });
  if (lapUtana.magiapont && (!lapElotte.magiapont || lapUtana.magiapont.ertek !== lapElotte.magiapont.ertek)) {
    ki.push({ nev: 'Mágiapont', regi: lapElotte.magiapont ? lapElotte.magiapont.ertek : 0, uj: lapUtana.magiapont.ertek });
  }
  TULAJDONSAGOK.forEach((t) => {
    const a = lapElotte.tulajdonsagok[t];
    const b = lapUtana.tulajdonsagok[t];
    if (b.ertek !== a.ertek) ki.push({ nev: tulNev(t), regi: a.ertek, uj: b.ertek });
    else if (b.fejlesztes_fuggo > a.fejlesztes_fuggo) ki.push({ nev: tulNev(t), szoveg: `fejlesztés: ${b.fejlesztes_fuggo} / ${fejlesztesKoltseg(b.ertek + 1)} a ${b.ertek + 1}-hoz` });
  });
  Object.values(lapUtana.fokuszok).forEach((x) => {
    const a = lapElotte.fokuszok[x.id];
    if (!a) ki.push({ nev: 'Új fókusz', szoveg: x.nev_hu, tul: x.tulajdonsag });
    else if (x.bonusz > a.bonusz) ki.push({ nev: 'Fókusz', szoveg: `${x.nev_hu} +${a.bonusz} → +${x.bonusz}`, tul: x.tulajdonsag });
  });
  const fokozatok = (nev, lista, regi) => lista.forEach((x) => {
    const a = regi.find((y) => y.id === x.id);
    if (!a || a.db < x.db) ki.push({ nev, szoveg: `${x.nev_hu} (${x.fokozat})` });
  });
  fokozatok('Talentum', lapUtana.talentumok, lapElotte.talentumok);
  fokozatok('Specializáció', lapUtana.specializaciok, lapElotte.specializaciok);
  fokozatok('Arkánum', lapUtana.arkanumok, lapElotte.arkanumok);
  lapUtana.varazslatok.filter((v) => !lapElotte.varazslatok.some((x) => x.id === v.id)).forEach((v) => ki.push({ nev: 'Varázslat', szoveg: v.nev_hu }));
  lapUtana.fegyvercsoportok.filter((c) => !lapElotte.fegyvercsoportok.some((x) => x.id === c.id)).forEach((c) => ki.push({ nev: 'Fegyvercsoport', szoveg: c.nev_hu }));
  lapUtana.kepessegek.filter((k) => !lapElotte.kepessegek.some((x) => x.nev_hu === k.nev_hu && x.eredet === k.eredet)).forEach((k) => ki.push({ nev: 'Képesség', szoveg: k.nev_hu }));
  return ki;
}
