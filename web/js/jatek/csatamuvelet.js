// Csatalépések szándékként (3. lépés, 5. ütem): a támadás, a varázslat, a gyógyítás, a cselekvések, a kezdeményezés,
// a kör vége és a célpont próbája egyetlen leíró objektumból („művelet”) alkalmazva. A DM felülete ezekkel lép
// (a teljes állapotot küldi, combat.act), a játékos felülete a műveletet küldi (combat.player), és a háttér
// ugyanezzel a kóddal alkalmazza a teljes csatán (backend/Csatamotor.gs, a tools/csatamotor_general.py kimenete).
// Itt van a játékosnak szűrt csata (jatekosNezet), a varázslatok adatai és a lezárás segédei is.
// Tiszta függvények, böngészőben, Node-ban és Apps Scriptben is futnak. Teszt: node tools/teszt/csatamuvelet.mjs
// Terv: claude/csata-terv.md („Játékos oldal”, „A csata menete” 7. és 13. pont).
//
// Egy művelet: { tipus, r (a cselekvő résztvevő azonosítója), ... }
//   kezdemenyezes  { osszeg, sarkany, tul, kockak, kezi }
//   cselekves      { kulcs } vagy { szabad: { nev, fajta } }
//   kovetkezo      {}
//   tamadas        { cel, cselekves, tamadas: { nev, atuto }, osszeg, talalat, sebzes, pancel?, fel_pancel, kegyelem,
//                    masodik: { cel, sebzes } | null, hatasok: { fekszik, vedoallas, atvetel, villam }, mutatvanyok: [név] }
//   gyogyitas      { cel, mennyi }
//   varazslat      { varazslat: { id, nev }, fajta, mp, siker, osszeg, celok: [id], proba: { tul, fokuszok, celertek, nev } | null,
//                    sebzes: { teljes, csokkentett, atuto } | null, gyogyitas, extra: { cel, sebzes } | null,
//                    hatasok: { vedopajzs }, mutatvanyok: [név] }
//   celpont_proba  { proba_id, osszeg, kockak, kezi }
//   mutatvany_proba { proba_id, fel: 'tamado' | 'cel', osszeg, sarkany, tul, kockak, kezi }
// A támadás és a varázslat mutatvany_probak mezője: [{ mutatvany, nev }] a próbát kérő mutatványok (MUTATVANY_PROBAK).
//   visszavonas    {} (a játékos csak a saját utolsó lépését vonhatja vissza)
// A függő próbák a csata `fuggo` listájában. A varázslat célpontjáé: { id, varazslo, varazslo_nev, varazslat, cel, cel_nev,
//   tul, fokuszok, proba_nev, celertek, teljes, csokkentett, atuto, kor }; a célpont irányítója (és a DM) dobja.
// A mutatványé: { id, fajta: 'mutatvany', mutatvany, nev, tipus: 'sajat' | 'ellen', tamado, tamado_nev, cel, cel_nev,
//   tamado_proba, cel_proba, celertek, eredmeny: { tamado, cel }, kor }; mindkét oldalt az irányítója (és a DM) dobja.
import * as C from './csata.js';
import { egeszsegLathatosag, leiroEgeszseg } from './osszecsapas.js';

const masol = (x) => JSON.parse(JSON.stringify(x));
const szam = (x, alap = 0) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));
const reszletekBol = (e) => {
  const r = e && e.reszletek;
  if (!r) return {};
  if (typeof r === 'string') { try { return JSON.parse(r); } catch (err) { return {}; } }
  return r;
};
let szamlalo = 0;
const ujId = (elotag) => { szamlalo = (szamlalo + 1) % 1000; return `${elotag}_${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}${szamlalo}`; };

export const MUVELET_TIPUSOK = ['kezdemenyezes', 'cselekves', 'kovetkezo', 'tamadas', 'gyogyitas', 'varazslat', 'celpont_proba', 'mutatvany_proba', 'visszavonas'];
const ismeretlenHp = (r) => !r || r.egeszseg === null || r.egeszseg === undefined;

// ---------------- Varázslatok ----------------

// A varázslat ideje a cselekvés fajtájára (a perces, órás varázslat csatában fő cselekvésnek számít).
const IDO_FAJTA = { fo: 'fo', kis: 'mellek', szabad: 'szabad' };

// Sebzés- vagy gyógyításkifejezés a varázslat adatából: „2d6+Akaraterő”, „Akaraterő (legalább 1)”, „1d6+1”, „0”.
// Visszaad: { kocka, plusz } vagy null.
export function varazslatKifejezes(s, akarat = 0) {
  if (s === null || s === undefined || s === '') return null;
  const a = Math.round(szam(akarat));
  let t = String(s).trim();
  if (/^Akaraterő\s*\(legalább 1\)$/i.test(t)) return { kocka: 0, plusz: Math.max(1, a) };
  t = t.replace(/\+\s*Akaraterő/gi, a >= 0 ? `+${a}` : `${a}`).replace(/^Akaraterő$/i, String(a));
  return C.sebzesKifejezes(t);
}

// A varázslat csatához szükséges adatai (a Varázslatok lap sorából). akarat: a varázsló Akaraterője.
export function varazslatAdat(elem, { akarat = 0 } = {}) {
  if (!elem) return null;
  const r = reszletekBol(elem);
  const mp = r.mp && typeof r.mp === 'object' ? r.mp : { min: szam(elem.mp_koltseg), max: szam(elem.mp_koltseg), plusz: false };
  const pr = r.proba && typeof r.proba === 'object' && r.proba.tulajdonsag ? r.proba : null;
  const gy = r.gyogyitas ? String(r.gyogyitas) : '';
  const gyMp = /mágiapontonként/i.test(gy);
  return {
    id: elem.id, nev: elem.nev_hu || elem.nev_en || elem.id, arkanum: elem.arkanum || '', fokozat: elem.fokozat || '',
    ido_kod: r.ido_kod || 'fo', fajta: IDO_FAJTA[r.ido_kod] || 'fo',
    mp: { min: szam(mp.min), max: mp.max === null || mp.max === undefined ? null : szam(mp.max), plusz: !!mp.plusz },
    celertek: r.celertek && typeof r.celertek === 'object' ? szam(r.celertek.ertek, null) : szam(elem.celertek, null),
    proba: pr ? { tul: pr.tulajdonsag, fokuszok: Array.isArray(pr.fokusz) ? pr.fokusz.slice() : (pr.fokusz ? [pr.fokusz] : []) } : null,
    sebzes: varazslatKifejezes(r.sebzes, akarat), sebzes_szoveg: r.sebzes || '',
    csokkentett: r.sebzes_ellenallaskor === null || r.sebzes_ellenallaskor === undefined ? null : varazslatKifejezes(r.sebzes_ellenallaskor, akarat),
    csokkentett_szoveg: r.sebzes_ellenallaskor || '',
    atuto: !!r.atuto,
    gyogyitas: gyMp ? null : varazslatKifejezes(gy.replace(/\s/g, ''), akarat), gyogyitas_mp: gyMp, gyogyitas_szoveg: gy,
    terulet: r.terulet || '', hatotav: r.hatotav_yard || null, leiras: elem.leiras_hu || ''
  };
}

// A gyógyító varázslat kockái: „Mágiapontonként 1d6” esetén a kifizetett Mágiapont.
export function varazslatGyogyitasKocka(v, mp) {
  if (!v) return null;
  if (v.gyogyitas_mp) return { kocka: Math.max(0, Math.round(szam(mp))), plusz: 0 };
  return v.gyogyitas;
}

// A varázslati mutatványok gépi hatása (azonosító szerint): Erőteljes varázslás (+1 Varázserő pontonként, legfeljebb +3),
// Ügyes varázslás (−1 Mágiapont), Hatalmas varázslat (+1d6 egy célpontnak), Halálos varázslat (+2d6 egy célpontnak),
// Mágikus védőpajzs (+2 Védekezés). A többi szövegként, a DM dönt. mutatvanyok: [{ id, nev, mp, db }].
export function varazsMutatvanyHatasok(mutatvanyok) {
  const ki = { varazsero: 0, mp_kedvezmeny: 0, extra_kocka: 0, vedopajzs: false, szoveges: [] };
  (mutatvanyok || []).forEach((m) => {
    const db = Math.max(1, szam(m.db, 1));
    if (m.id === 'mut_powerful_casting') ki.varazsero = Math.min(3, ki.varazsero + Math.max(db, szam(m.mp, 1)));
    else if (m.id === 'mut_skillful_casting') ki.mp_kedvezmeny += db;
    else if (m.id === 'mut_mighty_spell') ki.extra_kocka += db;
    else if (m.id === 'mut_lethal_spell') ki.extra_kocka += 2 * db;
    else if (m.id === 'mut_magic_shield') ki.vedopajzs = true;
    else ki.szoveges.push(m.nev || m.id);
  });
  return ki;
}

// A próbát kérő mutatványok (a leírásuk szerint) és a következményük. A próba: { nev, tul, fokuszok, barmely_fokusz,
// tamadas (támadópróba: a támadónál a támadás bónusza, a célpontnál a legjobb támadása) }.
export const MUTATVANY_PROBAK = {
  mut_stay_aware: { tipus: 'sajat', tamado: { nev: 'Észlelés (bármely fókusz)', tul: 'tul_perception', fokuszok: [], barmely_fokusz: true }, celertek: 11,
    kovetkezmeny: 'Siker: +1 a következő próbára (a következő köre végéig), vagy a DM elárul valamit a harctérről.' },
  mut_threaten: { tipus: 'ellen', tamado: { nev: 'Erő (Megfélemlítés)', tul: 'tul_strength', fokuszok: ['fok_strength_intimidation'] },
    cel: { nev: 'Akaraterő (Önfegyelem)', tul: 'tul_willpower', fokuszok: ['fok_willpower_self_discipline'] },
    kovetkezmeny: 'Ha a fenyegető nyer: a célpont Megfélemlítve, a következő körében őt kell támadnia.' },
  mut_taunt: { tipus: 'ellen', tamado: { nev: 'Kommunikáció (Megtévesztés)', tul: 'tul_communication', fokuszok: ['fok_communication_deception'] },
    cel: { nev: 'Akaraterő (Önfegyelem)', tul: 'tul_willpower', fokuszok: ['fok_willpower_self_discipline'] },
    kovetkezmeny: 'Ha a gúnyolódó nyer: a célpont Gúnyolva, a következő körében −1 a támadásra és a varázslásra.' },
  mut_disarm: { tipus: 'ellen', tamado: { nev: 'támadópróba', tamadas: true }, cel: { nev: 'támadópróba', tamadas: true },
    kovetkezmeny: 'Ha a támadó nyer: a célpont Lefegyverezve, a fegyvere 1d6 + Erő yardra repül.' },
  mut_disrupt_magic: { tipus: 'sajat', tamado: { nev: 'Intelligencia (Hatalom arkánum)', tul: 'tul_intelligence', fokuszok: ['fok_intelligence_power_arcana'] }, celertek: null,
    kovetkezmeny: 'A megzavart hatás Varázsereje ellen: ha eléri, a hatás megszűnik (a DM tudja a Varázserőt).', mp_nelkul: true }
};
// A kosár mutatványai közül a próbát kérők: [{ mutatvany, nev }].
export function mutatvanyProbak(mutatvanyok) {
  return (mutatvanyok || []).filter((m) => MUTATVANY_PROBAK[m.id]).map((m) => ({ mutatvany: m.id, nev: m.nev || m.id }));
}
// A Félelmetes varázslat Célértéke: 10 + a varázsló Akaraterője (a varázslón hatásként él a következő köre elejéig).
export const FELELMETES = 'Félelmetes varázslat';

function mutatvanyFuggok(x, lista, tamadoId, celId) {
  const t = C.resztvevo(x, tamadoId);
  const c = celId ? C.resztvevo(x, celId) : null;
  (lista || []).forEach((p) => {
    const d = MUTATVANY_PROBAK[p.mutatvany];
    if (!d || (d.tipus === 'ellen' && !c)) return;
    x.fuggo = (x.fuggo || []).concat([{
      id: ujId('p'), fajta: 'mutatvany', mutatvany: p.mutatvany, nev: p.nev, tipus: d.tipus, tamado: tamadoId, tamado_nev: t ? t.nev : '',
      cel: c ? c.id : null, cel_nev: c ? c.nev : '', tamado_proba: { ...d.tamado, bonusz: d.tamado.tamadas ? szam(p.bonusz) : undefined },
      cel_proba: d.cel ? { ...d.cel } : null, celertek: d.celertek === undefined ? null : d.celertek, kovetkezmeny: d.kovetkezmeny,
      eredmeny: { tamado: null, cel: null }, kor: x.kor
    }]);
  });
}

// A mutatványpróba kimenete, ha minden kell dobás megvan: { kesz, nyert: 'tamado' | 'cel' | null, holtverseny, siker }.
export function mutatvanyProbaAllas(f) {
  const a = f.eredmeny && f.eredmeny.tamado;
  const b = f.eredmeny && f.eredmeny.cel;
  if (f.tipus === 'sajat') {
    if (!a) return { kesz: false };
    return { kesz: true, siker: f.celertek === null || f.celertek === undefined ? null : szam(a.osszeg) >= szam(f.celertek) };
  }
  if (!a || !b) return { kesz: false };
  const k = (e) => [szam(e.osszeg), szam(e.sarkany), szam(e.tul)];
  const x = k(a), y = k(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return { kesz: true, nyert: x[i] > y[i] ? 'tamado' : 'cel' };
  return { kesz: true, nyert: null, holtverseny: true };
}

function mutatvanyKovetkezmeny(x, f, allas) {
  if (f.mutatvany === 'mut_stay_aware' && allas.siker) C.hatasHozzaadas(x, f.tamado, { nev: 'Éberség', cel: 'proba', ertek: 1, lejar: 'sajat_kor_vege', fogy: true });
  if (allas.nyert !== 'tamado') return;
  if (f.mutatvany === 'mut_threaten') C.feltetelHozzaadas(x, f.cel, { kulcs: 'megfelemlitve', nev: `Megfélemlítve (${f.tamado_nev})`, lejar: 'sajat_kor_vege', forras: f.tamado });
  if (f.mutatvany === 'mut_taunt') C.feltetelHozzaadas(x, f.cel, { kulcs: 'gunyolva', lejar: 'sajat_kor_vege', forras: f.tamado });
  if (f.mutatvany === 'mut_disarm') C.feltetelHozzaadas(x, f.cel, { kulcs: 'lefegyverezve' });
}

function mutatvanyProbaSzoveg(f, allas) {
  const e = f.eredmeny || {};
  if (f.tipus === 'sajat') {
    const o = `${f.tamado_nev}: ${f.nev}, ${f.tamado_proba.nev} ${szam(e.tamado && e.tamado.osszeg)}`;
    if (allas.siker === null) return `${o} (a DM dönt)`;
    return `${o} vs ${f.celertek}: ${allas.siker ? 'siker' : 'kudarc'}${allas.siker && f.mutatvany === 'mut_stay_aware' ? ' (+1 a következő próbára)' : ''}`;
  }
  const o = `${f.nev}: ${f.tamado_nev} ${szam(e.tamado && e.tamado.osszeg)}, ${f.cel_nev} ${szam(e.cel && e.cel.osszeg)}`;
  if (allas.holtverseny) return `${o}: teljes holtverseny, újra kell dobni`;
  const k = { mut_threaten: `${f.cel_nev} Megfélemlítve`, mut_taunt: `${f.cel_nev} Gúnyolva`, mut_disarm: `${f.cel_nev} Lefegyverezve` }[f.mutatvany] || 'siker';
  return `${o}: ${allas.nyert === 'tamado' ? k : `${f.cel_nev} ellenállt`}`;
}

// ---------------- Segédek ----------------

// A célpont Védekezése és Páncélértéke a csata állapotából (ertekek), a csata hatásaival. null, ha nem ismert.
export function celVedekezes(cel) {
  if (!cel || !cel.ertekek || !Number.isFinite(Number(cel.ertekek.vedekezes))) return null;
  return C.vedekezes(cel, cel.ertekek.vedekezes);
}
const celPancel = (cel, m) => (cel && cel.ertekek && Number.isFinite(Number(cel.ertekek.pancelertek)) ? Number(cel.ertekek.pancelertek) : szam(m && m.pancel));
const celAtutoEllen = (cel) => !!(cel && cel.ertekek && cel.ertekek.atuto_ellen);

// Sebzés alkalmazása; a játékos szűrt nézetében az ismeretlen Egészségű célpontot nem érinti (azt a háttér számolja).
function sebez(x, id, v) {
  const r = C.resztvevo(x, id);
  if (!r || ismeretlenHp(r) || !(v > 0)) return;
  C.sebzesAlkalmazas(x, id, v);
}
function gyogyit(x, id, v, opciok) {
  const r = C.resztvevo(x, id);
  if (!r || ismeretlenHp(r) || !(v > 0)) return;
  C.gyogyitas(x, id, v, opciok);
}
const nevE = (cs, id) => { const r = C.resztvevo(cs, id); return r ? r.nev : '?'; };

// A támadás eredménye a csata állapotából: a háttér a saját Védekezés- és Páncélérték-adatából számol,
// a kliens beküldött találata csak akkor számít, ha a célpont értékei nem ismertek.
export function tamadasEredmeny(cs, m) {
  const cel = C.resztvevo(cs, m.cel);
  const ved = celVedekezes(cel);
  const talalat = ved === null ? !!m.talalat : szam(m.osszeg) >= ved;
  const atuto = !!(m.tamadas && m.tamadas.atuto);
  const v1 = talalat ? C.sebzesSzamol({ osszeg: szam(m.sebzes), pancelertek: celPancel(cel, m), atuto, atuto_ellen: celAtutoEllen(cel), fel_pancel: !!m.fel_pancel }).vegso : 0;
  let talalat2 = false, v2 = 0;
  const cel2 = m.masodik && C.resztvevo(cs, m.masodik.cel);
  if (talalat && cel2) {
    const ved2 = celVedekezes(cel2);
    talalat2 = ved2 === null ? !!m.masodik.talalat : szam(m.osszeg) >= ved2;
    if (talalat2) v2 = C.sebzesSzamol({ osszeg: szam(m.masodik.sebzes), pancelertek: celPancel(cel2, m.masodik), atuto, atuto_ellen: celAtutoEllen(cel2), fel_pancel: !!m.fel_pancel }).vegso;
  }
  return { talalat, v1, talalat2, v2, ved };
}

// A célpont próbájának kimenete: { siker, sebzes } (a csökkentett sebzés hiánya sikernél nulla sebzést jelent).
export function celpontProbaEredmeny(cs, f, osszeg) {
  const siker = szam(osszeg) >= szam(f.celertek);
  const nyers = siker ? (f.csokkentett === null || f.csokkentett === undefined ? 0 : szam(f.csokkentett)) : szam(f.teljes);
  const cel = C.resztvevo(cs, f.cel);
  const vegso = f.teljes === null || f.teljes === undefined ? 0
    : C.sebzesSzamol({ osszeg: nyers, pancelertek: celPancel(cel), atuto: !!f.atuto, atuto_ellen: celAtutoEllen(cel) }).vegso;
  return { siker, sebzes: vegso, van_sebzes: f.teljes !== null && f.teljes !== undefined };
}

// ---------------- Leírás és alkalmazás ----------------

export function muveletLeiras(cs, m) {
  const ki = nevE(cs, m.r);
  switch (m.tipus) {
    case 'kezdemenyezes': return `${ki}: kezdeményezés ${szam(m.osszeg)}`;
    case 'cselekves': {
      if (m.szabad) return `${ki}: ${String(m.szabad.nev || '').trim()}`;
      const a = C.cselekvesAdat(m.kulcs);
      const rr = C.resztvevo(cs, m.r);
      const plusz = m.kulcs === 'mozgas' && C.vanFeltetel(rr, 'fekszik') ? ' (feláll)' : m.kulcs === 'keszenlet' && C.vanFeltetel(rr, 'lefegyverezve') ? ' (újra fegyver a kezében)' : '';
      return `${ki}: ${a ? a.nev : m.kulcs}${plusz}`;
    }
    case 'kovetkezo': return `${nevE(cs, cs.soron) || ki} köre véget ért`;
    case 'tamadas': {
      const e = tamadasEredmeny(cs, m);
      const mut = (m.mutatvanyok || []).length ? ` (${m.mutatvanyok.join(', ')})` : '';
      return e.talalat
        ? `${ki} → ${nevE(cs, m.cel)}: ${e.v1} sebzés${e.v2 ? `, ${nevE(cs, m.masodik.cel)}: ${e.v2}` : ''}${mut}`
        : `${ki} → ${nevE(cs, m.cel)}: nem talált`;
    }
    case 'gyogyitas': return szam(m.mennyi) > 0 ? `${ki} gyógyítja: ${nevE(cs, m.cel)} +${szam(m.mennyi)}` : `${ki} gyógyítása nem sikerült (${nevE(cs, m.cel)})`;
    case 'varazslat': {
      const v = (m.varazslat && m.varazslat.nev) || 'varázslat';
      if (!m.siker) return `${ki}: ${v} nem sikerült (${szam(m.mp)} MP)`;
      const celok = (m.celok || []).map((id) => nevE(cs, id)).join(', ');
      const mut = (m.mutatvanyok || []).length ? ` (${m.mutatvanyok.join(', ')})` : '';
      return `${ki}: ${v}${celok ? ' → ' + celok : ''}, ${szam(m.mp)} MP${m.proba && (m.celok || []).length ? ', a célpont próbája következik' : ''}${mut}`;
    }
    case 'celpont_proba': {
      const f = ((cs.fuggo) || []).find((x) => x.id === m.proba_id);
      if (!f) return 'Célpont próbája';
      const e = celpontProbaEredmeny(cs, f, m.osszeg);
      return `${f.cel_nev}: ${f.varazslat} ellen ${e.siker ? 'ellenállt' : 'nem állt ellen'} (${szam(m.osszeg)} vs ${f.celertek})${e.van_sebzes ? `, ${e.sebzes} sebzés` : ''}`;
    }
    case 'mutatvany_proba': {
      const f = ((cs.fuggo) || []).find((x) => x.id === m.proba_id);
      if (!f) return 'Mutatvány próbája';
      const masolat = { ...f, eredmeny: { ...(f.eredmeny || {}), [m.fel]: { osszeg: szam(m.osszeg), sarkany: szam(m.sarkany), tul: szam(m.tul) } } };
      const allas = mutatvanyProbaAllas(masolat);
      if (!allas.kesz) return `${m.fel === 'tamado' ? f.tamado_nev : f.cel_nev}: ${f.nev} próbája ${szam(m.osszeg)}, a másik fél dobására vár`;
      return mutatvanyProbaSzoveg(masolat, allas);
    }
    default: return '';
  }
}

// A művelet alkalmazása a csata másolatán (x-et módosítja). A leírás előre számolódik (muveletLeiras).
export function muveletAlkalmazas(x, m) {
  const r = C.resztvevo(x, m.r);
  switch (m.tipus) {
    case 'kezdemenyezes':
      return C.kezdemenyezesBeallitas(x, m.r, { osszeg: m.osszeg, sarkany: m.sarkany, tul: m.tul, kockak: m.kockak, kezi: m.kezi });
    case 'cselekves': {
      if (m.szabad) return C.cselekvesRogzites(x, m.r, m.szabad.fajta || 'mellek', String(m.szabad.nev || '').trim().slice(0, 80));
      const a = C.cselekvesAdat(m.kulcs);
      if (!a) return x;
      C.cselekvesRogzites(x, m.r, a.fajta, a.nev);
      if (m.kulcs === 'vedekezes') C.hatasHozzaadas(x, m.r, { nev: 'Védekezés', cel: 'vedekezes', ertek: 2, lejar: 'sajat' });
      if (m.kulcs === 'celzas') C.hatasHozzaadas(x, m.r, { nev: 'Célzás', cel: 'tamadas', ertek: 1, lejar: 'kovetkezo_tamadas' });
      if (r && m.kulcs === 'mozgas' && C.vanFeltetel(r, 'fekszik')) r.feltetelek = r.feltetelek.filter((f) => f.kulcs !== 'fekszik');
      if (r && m.kulcs === 'keszenlet' && C.vanFeltetel(r, 'lefegyverezve')) r.feltetelek = r.feltetelek.filter((f) => f.kulcs !== 'lefegyverezve');
      return x;
    }
    case 'kovetkezo': return C.kovetkezo(x);
    case 'tamadas': {
      const e = tamadasEredmeny(x, m);
      const a = C.cselekvesAdat(m.cselekves) || C.cselekvesAdat('tamadas');
      C.cselekvesRogzites(x, m.r, a.fajta, a.nev);
      C.tamadasUtan(x, m.r);
      if (m.cselekves === 'mindent_bele') C.hatasHozzaadas(x, m.r, { nev: 'Mindent bele', cel: 'vedekezes', ertek: -1, lejar: 'sajat' });
      if (!e.talalat) return x;
      const cel = C.resztvevo(x, m.cel);
      if (m.kegyelem && cel && !ismeretlenHp(cel) && cel.egeszseg - e.v1 <= 0 && e.v1 > 0) {
        C.egeszsegBeallitas(x, m.cel, 1);
        C.feltetelHozzaadas(x, m.cel, { kulcs: 'eszmeletlen' });
      } else sebez(x, m.cel, e.v1);
      if (e.v2) sebez(x, m.masodik.cel, e.v2);
      const h = m.hatasok || {};
      if (h.fekszik) C.feltetelHozzaadas(x, m.cel, { kulcs: 'fekszik' });
      if (h.vedoallas) C.hatasHozzaadas(x, m.r, { nev: 'Védőállás', cel: 'vedekezes', ertek: 2, lejar: 'sajat' });
      if (h.atvetel) C.sorrendElere(x, m.r);
      if (h.villam) C.cselekvesFeloldas(x, m.r, szam(h.villam, 1));
      mutatvanyFuggok(x, m.mutatvany_probak, m.r, m.cel);
      return x;
    }
    case 'gyogyitas':
      C.cselekvesRogzites(x, m.r, 'fo', 'Gyógyítás');
      if (szam(m.mennyi) > 0) gyogyit(x, m.cel, szam(m.mennyi), { heal: true });
      return x;
    case 'varazslat': {
      const nev = (m.varazslat && m.varazslat.nev) || 'Varázslat';
      C.cselekvesRogzites(x, m.r, m.fajta || 'fo', 'Varázslat: ' + nev);
      if (r && r.magiapont !== null && r.magiapont !== undefined) C.magiapontBeallitas(x, m.r, r.magiapont - szam(m.mp));
      C.probaBonuszFogyasztas(x, m.r);
      if (!m.siker) return x;
      const h = m.hatasok || {};
      if (h.vedopajzs) C.hatasHozzaadas(x, m.r, { nev: 'Mágikus védőpajzs', cel: 'vedekezes', ertek: 2, lejar: 'sajat' });
      if (h.felelmetes) C.hatasHozzaadas(x, m.r, { nev: FELELMETES, cel: 'felelmetes', ertek: szam(h.felelmetes), lejar: 'sajat' });
      mutatvanyFuggok(x, m.mutatvany_probak, m.r, (m.celok || [])[0]);
      const celok = (m.celok || []).filter((id) => C.resztvevo(x, id));
      if (szam(m.gyogyitas) > 0) celok.forEach((id) => gyogyit(x, id, szam(m.gyogyitas)));
      const extra = (id) => (m.extra && m.extra.cel === id ? szam(m.extra.sebzes) : 0);
      if (m.proba) {
        x.fuggo = (x.fuggo || []).concat(celok.map((id) => {
          const c = C.resztvevo(x, id);
          const s = m.sebzes || null;
          return {
            id: ujId('p'), varazslo: m.r, varazslo_nev: r ? r.nev : '', varazslat: nev, cel: id, cel_nev: c.nev,
            tul: m.proba.tul, fokuszok: m.proba.fokuszok || [], proba_nev: m.proba.nev || '', celertek: szam(m.proba.celertek, 10),
            teljes: s ? szam(s.teljes) + extra(id) : null,
            csokkentett: s && s.csokkentett !== null && s.csokkentett !== undefined ? szam(s.csokkentett) + (szam(s.csokkentett) > 0 ? extra(id) : 0) : null,
            atuto: !!(s && s.atuto), kor: x.kor
          };
        }));
      } else if (m.sebzes) {
        celok.forEach((id) => {
          const c = C.resztvevo(x, id);
          const v = C.sebzesSzamol({ osszeg: szam(m.sebzes.teljes) + extra(id), pancelertek: celPancel(c), atuto: !!m.sebzes.atuto, atuto_ellen: celAtutoEllen(c) }).vegso;
          sebez(x, id, v);
        });
      }
      return x;
    }
    case 'celpont_proba': {
      const f = (x.fuggo || []).find((y) => y.id === m.proba_id);
      if (!f) return x;
      const e = celpontProbaEredmeny(x, f, m.osszeg);
      x.fuggo = x.fuggo.filter((y) => y.id !== f.id);
      C.probaBonuszFogyasztas(x, f.cel);
      if (e.sebzes) sebez(x, f.cel, e.sebzes);
      return x;
    }
    case 'mutatvany_proba': {
      const f = (x.fuggo || []).find((y) => y.id === m.proba_id);
      if (!f) return x;
      f.eredmeny = { ...(f.eredmeny || {}), [m.fel]: { osszeg: szam(m.osszeg), sarkany: szam(m.sarkany), tul: szam(m.tul) } };
      C.probaBonuszFogyasztas(x, m.fel === 'tamado' ? f.tamado : f.cel);
      const allas = mutatvanyProbaAllas(f);
      if (!allas.kesz) return x;
      if (allas.holtverseny) { f.eredmeny = { tamado: null, cel: null }; return x; }
      x.fuggo = x.fuggo.filter((y) => y.id !== f.id);
      mutatvanyKovetkezmeny(x, f, allas);
      return x;
    }
    default: return x;
  }
}

// Egy művelet lépésként (visszavonható, kulccsal). opciok: { szerzo } (lásd csata.js lepes).
export function muveletLepes(cs, m, kulcs, opciok = {}) {
  if (m.tipus === 'visszavonas') return C.visszavon(cs, kulcs);
  return C.lepes(cs, muveletLeiras(cs, m), (x) => muveletAlkalmazas(x, m), kulcs, opciok);
}

// ---------------- Ellenőrzés (a játékos lépése a háttérben) ----------------

// Mit tehet a játékos: csak az általa irányított résztvevőkért (iranyitott), a saját körében, a cselekvésszámláló
// szerint; a kezdeményezést a kezdeményezés szakaszában; a célpont próbáját, ha ő irányítja a célpontot.
// Visszaad: a hiba szövege, vagy null. dm: a DM bármit megtehet.
export function muveletEllenorzes(cs, m, { iranyitott = [], dm = false, szerzo = '' } = {}) {
  if (!m || typeof m !== 'object' || MUVELET_TIPUSOK.indexOf(m.tipus) < 0) return 'Ismeretlen lépés.';
  if (!cs || cs.allapot === 'lezart') return 'A csata lezárult.';
  if (m.tipus === 'visszavonas') {
    const v = cs.visszavonas || [];
    const utolso = v[v.length - 1];
    if (!utolso) return 'Nincs visszavonható lépés.';
    if (!dm && (!utolso.szerzo || utolso.szerzo !== szerzo)) return 'Csak a saját utolsó lépésedet vonhatod vissza.';
    return null;
  }
  if (m.tipus === 'mutatvany_proba') {
    const f = (cs.fuggo || []).find((x) => x.id === m.proba_id);
    if (!f || f.fajta !== 'mutatvany') return 'Ez a próba már lezárult.';
    if (m.fel !== 'tamado' && m.fel !== 'cel') return 'Hibás oldal.';
    if (m.fel === 'cel' && f.tipus !== 'ellen') return 'Ennél a próbánál a célpont nem dob.';
    if (f.eredmeny && f.eredmeny[m.fel]) return 'Ezt az oldalt már dobták.';
    if (!dm && iranyitott.indexOf(f[m.fel]) < 0) return 'Ezt a próbát az irányítója dobja.';
    return null;
  }
  if (m.tipus === 'celpont_proba') {
    const f = (cs.fuggo || []).find((x) => x.id === m.proba_id);
    if (!f || f.fajta === 'mutatvany') return 'Ez a próba már lezárult.';
    if (!dm && iranyitott.indexOf(f.cel) < 0) return 'Ezt a próbát a célpont irányítója dobja.';
    return null;
  }
  if (dm) return null;
  const r = C.resztvevo(cs, m.r);
  if (!r || r.rejtett) return 'Nincs ilyen résztvevő.';
  if (iranyitott.indexOf(r.id) < 0) return 'Ezt a résztvevőt nem te irányítod.';
  if (m.tipus === 'kezdemenyezes') {
    if (cs.allapot !== 'kezdemenyezes') return 'A kezdeményezést már lezárták; a DM rendezi.';
    return null;
  }
  if (cs.allapot !== 'fut') return 'A csata még nem indult el.';
  if (cs.soron !== r.id) return 'Nem te következel.';
  if (m.tipus === 'kovetkezo') return null;
  if (r.allapot !== 'aktiv') return 'Ez a résztvevő most nem cselekedhet.';
  const fajta = m.tipus === 'cselekves' ? (m.szabad ? (m.szabad.fajta || 'mellek') : ((C.cselekvesAdat(m.kulcs) || {}).fajta || 'fo'))
    : m.tipus === 'varazslat' ? (m.fajta || 'fo') : m.tipus === 'tamadas' ? ((C.cselekvesAdat(m.cselekves) || { fajta: 'fo' }).fajta) : 'fo';
  if (m.tipus === 'cselekves' && !m.szabad && !C.cselekvesAdat(m.kulcs)) return 'Ismeretlen cselekvés.';
  if (m.tipus === 'cselekves' && m.kulcs === 'futas' && C.vanFeltetel(r, 'fekszik')) return 'Fekve nem lehet futni: előbb Mozgással felállni.';
  if (!C.cselekvesEngedett(r, fajta)) return 'Ebben a körben ez a cselekvés már elfogyott.';
  const cel = (id) => { const c = C.resztvevo(cs, id); return c && !c.rejtett; };
  if (m.tipus === 'tamadas') {
    if (!cel(m.cel)) return 'Nincs ilyen célpont.';
    if (m.masodik && !cel(m.masodik.cel)) return 'Nincs ilyen második célpont.';
  }
  if (m.tipus === 'gyogyitas') {
    const c = C.resztvevo(cs, m.cel);
    if (!cel(m.cel)) return 'Nincs ilyen célpont.';
    if (szam(m.mennyi) > 0 && c.gyogyithato === false) return `${c.nev} már kapott Gyógyítást, és azóta nem sérült meg.`;
  }
  if (m.tipus === 'varazslat') {
    if (!(m.celok || []).every(cel)) return 'Nincs ilyen célpont.';
    if (szam(m.mp) < 0) return 'Hibás Mágiapont.';
    if (r.magiapont !== null && r.magiapont !== undefined && szam(m.mp) > r.magiapont) return 'Nincs elég Mágiapont.';
  }
  return null;
}

// ---------------- A játékosnak szűrt csata ----------------

// A játékos (vagy mesterjátékos) nézete: a rejtett résztvevők és a DM naplósorai nélkül, más oldal Egészsége a kampány
// beállítása szerint (pontos, leíró, rejtett), a visszavonási adatok helyett csak az utolsó lépés neve.
// A célpontok Védekezése és Páncélértéke megérkezik (a találatot a játékos eszköze számolja), de a felület csak akkor
// mutatja a számot, ha a kampányban a Célérték nem rejtett (vedekezes_rejtett).
// iranyitott: a néző által irányított résztvevők azonosítói; szerzo: a néző azonosítója.
export function jatekosNezet(cs, { beallitas = {}, iranyitott = [], szerzo = '' } = {}) {
  const rejtett = new Set((cs.resztvevok || []).filter((r) => r.rejtett).map((r) => r.id));
  const nezoOldalak = (cs.resztvevok || []).filter((r) => iranyitott.indexOf(r.id) >= 0).map((r) => r.oldal);
  const resztvevok = (cs.resztvevok || []).filter((r) => !r.rejtett).map((r) => {
    const o = masol(r);
    o.iranyithato = iranyitott.indexOf(r.id) >= 0;
    const lath = egeszsegLathatosag(beallitas, { nezoOldalak, celOldal: r.oldal });
    if (lath !== 'pontos') {
      o.egeszseg_szoveg = lath === 'rejtett' ? '?' : leiroEgeszseg(r.egeszseg, r.egeszseg_max);
      o.egeszseg = null;
      o.egeszseg_max = null;
      o.magiapont = null;
      o.haldoklas_kor = null;
      o.ertekek = r.ertekek ? { vedekezes: r.ertekek.vedekezes, pancelertek: r.ertekek.pancelertek, atuto_ellen: !!r.ertekek.atuto_ellen } : null;
    }
    return o;
  });
  const v = cs.visszavonas || [];
  const utolso = v[v.length - 1];
  return {
    v: cs.v, allapot: cs.allapot, kor: cs.kor, soron: rejtett.has(cs.soron) ? null : cs.soron,
    sorrend: (cs.sorrend || []).filter((id) => !rejtett.has(id)), leptek: (cs.leptek || []).filter((id) => !rejtett.has(id)),
    oldalak: cs.oldalak, viszonyok: cs.viszonyok, csoportok: cs.csoportok, resztvevok,
    naplo: (cs.naplo || []).filter((n) => !n.dm), kulcsok: cs.kulcsok || [],
    fuggo: (cs.fuggo || []).filter((f) => !rejtett.has(f.cel) && !rejtett.has(f.varazslo) && !rejtett.has(f.tamado)),
    utolso_lepes: utolso ? { leiras: utolso.leiras || '', sajat: !!szerzo && utolso.szerzo === szerzo } : null,
    vedekezes_rejtett: !(beallitas && beallitas.celertek_rejtett === false),
    jatekos: true
  };
}

// ---------------- Lezárás ----------------

// A csata összecsapás-alakja (a nehézségbecsléshez és az XP-javaslathoz, osszecsapas.js nehezsegBecsles).
export function osszecsapasCsatabol(cs) {
  return {
    leiras: '', helyszin: '', terep: '', megjegyzes: '', oldalak: cs.oldalak || [], viszonyok: cs.viszonyok || {}, csoportok: [],
    resztvevok: (cs.resztvevok || []).map((r) => ({ id: r.id, forras: { ...r.forras }, nev: r.nev, db: 1, oldal: r.oldal, csoport: '', fontos: !!r.fontos, rejtett: false, megjegyzes: '' }))
  };
}

// A becsült nehézség XP-besorolása (karakter/xp.js XP_TALALKOZAS kulcsai).
export const XP_BESOROLAS = { 'Könnyű': 'konnyu', 'Átlagos': 'kozepes', 'Nehéz': 'nehez', 'Nagyon nehéz': 'nehez' };

// A csata karakterei (az XP-kiosztáshoz): a nem rejtett játékos karakterek, azonosítónként egyszer.
export function csataKarakterei(cs) {
  const ki = [];
  (cs.resztvevok || []).forEach((r) => { if (r.forras.tipus === 'karakter' && !ki.some((x) => x.id === r.forras.id)) ki.push({ id: r.forras.id, nev: r.nev, allapot: r.allapot }); });
  return ki;
}

// Az NJK-tár elemeinek állapota a csata végén (a háttér visszaírja): [{ njk_id, nev, egeszseg, magiapont, allapot, feltetelek }].
// Ha egy NJK több példányban szerepelt, az utolsó példány számít.
export function njkAllapotok(cs) {
  const m = {};
  (cs.resztvevok || []).forEach((r) => {
    if (r.forras.tipus !== 'njk') return;
    m[r.forras.id] = { njk_id: r.forras.id, nev: r.nev, egeszseg: r.egeszseg, magiapont: r.magiapont === undefined ? null : r.magiapont,
      allapot: r.allapot, feltetelek: (r.feltetelek || []).map((f) => f.nev) };
  });
  return Object.keys(m).map((k) => m[k]);
}
