// A karakterkészítő varázsló (1. szint) logikája: tiszta függvények, böngészőben és Node-ban is futnak.
// A felület (web/js/app/varazslo*.js) ezekkel módosítja a karakter adatát; a végértékeket a szamol.js adja.
// A módosító függvények a kapott adatot helyben változtatják (a felület előbb lemásolja).
import { szam, reszletek, tartomanyban, index, altalanos } from './szabalyindex.js';
import { TULAJDONSAGOK, tulajdonsagDobasbol, tarsadalmiOsztalyDobasbol, kezdoPenzRez, fokozatSzam } from './tablak.js';
import { uresSzint, kulcsmezok } from './adat.js';
import { kezdoCsomag } from './felszereles.js';
import { fokozatVarazslatok } from './magia.js';

// ---- Lépések ----
export const LEPESEK = [
  { kulcs: 'keret', cim: 'Keret' },
  { kulcs: 'koncepcio', cim: 'Koncepció' },
  { kulcs: 'tulajdonsagok', cim: 'Tulajdonságok' },
  { kulcs: 'faj', cim: 'Faj' },
  { kulcs: 'hatter', cim: 'Háttér' },
  { kulcs: 'osztaly', cim: 'Osztály' },
  { kulcs: 'felszereles', cim: 'Felszerelés' },
  { kulcs: 'szamitott', cim: 'Számított értékek' },
  { kulcs: 'nev', cim: 'Név és célok' },
  { kulcs: 'osszegzes', cim: 'Összegzés' }
];
export const lepesSzam = (kulcs) => Math.max(0, LEPESEK.findIndex((l) => l.kulcs === kulcs));

// A figyelmeztetések `lepes` mezője melyik varázslólépéshez tartozik.
const FIGY_LEPES = { keret: 'keret', tulajdonsagok: 'tulajdonsagok', faj: 'faj', hatter: 'hatter', osztaly: 'osztaly',
  szintlepes: 'osztaly', felszereles: 'felszereles', karakterlap: 'osszegzes' };
export const figyelmeztetesLepese = (f) => FIGY_LEPES[f.lepes] || 'osszegzes';

// Lépésenként a még el nem fogadott figyelmeztetések száma (az info szintűek nem számítanak).
export function lepesFigyelmeztetesek(lap) {
  const db = {};
  (lap.figyelmeztetesek || []).filter((f) => f.szint === 'figyelmeztetes' && !f.elfogadott).forEach((f) => {
    const k = figyelmeztetesLepese(f);
    db[k] = (db[k] || 0) + 1;
  });
  return db;
}

// ---- Források ----
export const FORRAS_SORREND = ['Alapkönyv', 'Companion', 'Bestiárium', 'Kampányépítő', 'Házi'];

// A szabályadatban előforduló források, a megszokott sorrendben.
export function elerhetoForrasok(lapok) {
  const van = new Set();
  Object.values(lapok || {}).forEach((lista) => (lista || []).forEach((e) => { if (e && e.forras) van.add(e.forras); }));
  return FORRAS_SORREND.filter((f) => van.has(f)).concat([...van].filter((f) => !FORRAS_SORREND.includes(f)));
}

// A lapok szűrése a karakter forrásaira. Az általános szabálysorok (…_altalanos) és a forrás nélküli
// sorok mindig maradnak. Üres forráslista: minden.
const szurtTar = new WeakMap();
export function szurtLapok(lapok, forrasok) {
  if (!lapok) return {};
  if (!forrasok || !forrasok.length) return lapok;
  const kulcs = forrasok.slice().sort().join('|');
  let tar = szurtTar.get(lapok);
  if (!tar) { tar = new Map(); szurtTar.set(lapok, tar); }
  if (tar.has(kulcs)) return tar.get(kulcs);
  const ki = {};
  Object.keys(lapok).forEach((nev) => {
    ki[nev] = (lapok[nev] || []).filter((e) => !e || !e.forras || altalanos(e) || forrasok.includes(e.forras));
  });
  tar.set(kulcs, ki);
  return ki;
}

// ---- Kockák és a készítés naplója ----
export function kocka(oldal = 6) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const t = new Uint32Array(1);
    const hatar = Math.floor(0x100000000 / oldal) * oldal; // egyenletes eloszlás
    do { crypto.getRandomValues(t); } while (t[0] >= hatar);
    return 1 + (t[0] % oldal);
  }
  return 1 + Math.floor(Math.random() * oldal);
}
export const dobas = (db, oldal = 6) => Array.from({ length: db }, () => kocka(oldal));
export const osszeg = (kockak) => (kockak || []).reduce((a, b) => a + szam(b), 0);

const NAPLO_MAX = 200;
// Egy dobás a karakter saját naplójába (nem a kampány dobásnaplójába). mire: például 'tul:tul_strength'.
export function naplozDobas(adat, mire, kockak, kezi) {
  if (!Array.isArray(adat.dobasok)) adat.dobasok = [];
  adat.dobasok.push({ mire, kockak: kockak.slice(), kezi: !!kezi, idopont: new Date().toISOString() });
  if (adat.dobasok.length > NAPLO_MAX) adat.dobasok.splice(0, adat.dobasok.length - NAPLO_MAX);
}
// A legutóbbi naplóbejegyzés egy célhoz (a kockák és a kézi jel megjelenítéséhez).
export function utolsoDobas(adat, mire) {
  const d = adat.dobasok || [];
  for (let i = d.length - 1; i >= 0; i--) if (d[i].mire === mire) return d[i];
  return null;
}

// ---- 1. Keret ----
export function modszerBeallit(adat, modszer) {
  adat.keszites.modszer = modszer;
  adat.tulajdonsag_keszites = modszer === 'vasarlas' ? { dobasok: [], csere: null } : { dobasok: Array(9).fill(null), csere: null, kiosztas: {} };
  TULAJDONSAGOK.forEach((t) => { adat.tulajdonsag_alap[t] = 0; });
}

// ---- 3. Tulajdonságok ----
// Sorban dobás: a dobások a lap sorrendjében, a csere után. A még nem dobott tulajdonság 0.
export function sorbanSzamol(adat, ix) {
  const tk = adat.tulajdonsag_keszites;
  const ertek = {};
  TULAJDONSAGOK.forEach((t, i) => {
    const d = (tk.dobasok || [])[i];
    ertek[t] = d === null || d === undefined ? 0 : tulajdonsagDobasbol(szam(d), ix);
  });
  const cs = tk.csere;
  if (Array.isArray(cs) && cs.length === 2 && ertek[cs[0]] !== undefined && ertek[cs[1]] !== undefined) {
    const x = ertek[cs[0]]; ertek[cs[0]] = ertek[cs[1]]; ertek[cs[1]] = x;
  }
  TULAJDONSAGOK.forEach((t) => { adat.tulajdonsag_alap[t] = ertek[t]; });
}

// Sorban dobás egy tulajdonságra (3d6 összeg); a csere a dobások után is érvényes marad.
export function sorbanDob(adat, tul, kockak, kezi, ix) {
  const i = TULAJDONSAGOK.indexOf(tul);
  if (i < 0) return;
  if (!Array.isArray(adat.tulajdonsag_keszites.dobasok) || adat.tulajdonsag_keszites.dobasok.length !== 9) {
    adat.tulajdonsag_keszites.dobasok = Array(9).fill(null);
  }
  adat.tulajdonsag_keszites.dobasok[i] = osszeg(kockak);
  naplozDobas(adat, 'tul:' + tul, kockak, kezi);
  sorbanSzamol(adat, ix);
}

// Csere kijelölése: koppintásra be- és kikerül; két kijelölt tulajdonság a csere.
export function csereValt(adat, tul, ix) {
  const tk = adat.tulajdonsag_keszites;
  let cs = Array.isArray(tk.csere) ? tk.csere.slice() : [];
  if (cs.includes(tul)) cs = cs.filter((x) => x !== tul);
  else if (cs.length >= 2) cs = [tul];
  else cs.push(tul);
  tk.csere = cs.length ? cs : null;
  sorbanSzamol(adat, ix);
}

// Dobás és elrendezés: a dobások sorszám szerint, a kiosztás tulajdonság → dobás sorszáma.
export function elrendezesDob(adat, hely, kockak, kezi, ix) {
  const tk = adat.tulajdonsag_keszites;
  if (!Array.isArray(tk.dobasok) || tk.dobasok.length !== 9) tk.dobasok = Array(9).fill(null);
  tk.dobasok[hely] = osszeg(kockak);
  naplozDobas(adat, 'dobas:' + hely, kockak, kezi);
  elrendezesSzamol(adat, ix);
}
export function elrendezesKioszt(adat, tul, hely, ix) {
  const tk = adat.tulajdonsag_keszites;
  tk.kiosztas = Object.assign({}, tk.kiosztas || {});
  Object.keys(tk.kiosztas).forEach((t) => { if (tk.kiosztas[t] === hely) delete tk.kiosztas[t]; });
  if (hely === null || hely === undefined) delete tk.kiosztas[tul];
  else tk.kiosztas[tul] = hely;
  elrendezesSzamol(adat, ix);
}
export function elrendezesSzamol(adat, ix) {
  const tk = adat.tulajdonsag_keszites;
  const k = tk.kiosztas || {};
  TULAJDONSAGOK.forEach((t) => {
    const d = k[t] === undefined ? null : (tk.dobasok || [])[k[t]];
    adat.tulajdonsag_alap[t] = d === null || d === undefined ? 0 : tulajdonsagDobasbol(szam(d), ix);
  });
}

export function vasarlasOsszeg(adat) {
  return TULAJDONSAGOK.reduce((a, t) => a + szam(adat.tulajdonsag_alap[t]), 0);
}

// ---- 4. Faj ----
export function fajBeallit(adat, fajId) {
  if (adat.faj === fajId) return;
  adat.faj = fajId;
  adat.faj_dontes = { fokusz: null, elonyok: [] };
}
export function elonySor(fr, d) {
  return (fr.elonytabla || []).find((s) => tartomanyban(s.dobas, szam(d))) || null;
}
// Egy előnydobás rögzítése a hely sorszámára (0, 1, ...). Új dobásnál a korábbi egyedi választás törlődik.
export function elonyDob(adat, hely, kockak, kezi) {
  const el = adat.faj_dontes.elonyok = (adat.faj_dontes.elonyok || []).slice();
  while (el.length <= hely) el.push({ dobas: null });
  el[hely] = { dobas: osszeg(kockak) };
  naplozDobas(adat, 'elony:' + hely, kockak, kezi);
}
// Ismétlődő előny: ugyanazt a táblasort adó korábbi dobás sorszáma, vagy -1.
export function elonyIsmetles(adat, fr, hely) {
  const el = adat.faj_dontes.elonyok || [];
  const sor = el[hely] && el[hely].dobas !== null ? elonySor(fr, el[hely].dobas) : null;
  if (!sor) return -1;
  for (let i = 0; i < hely; i++) if (el[i] && el[i].dobas !== null && elonySor(fr, el[i].dobas) === sor) return i;
  return -1;
}

// A Félvér „a legmagasabb tulajdonság” jellegű választásaihoz: a karakter tulajdonságai csökkenő sorrendben.
export function tulajdonsagSorrend(lap) {
  return TULAJDONSAGOK.slice().sort((a, b) => lap.tulajdonsagok[b].ertek - lap.tulajdonsagok[a].ertek);
}

// ---- 5. Háttér ----
export const TARSADALMI_OSZTALYOK = ['Kívülálló', 'Alsó', 'Közép', 'Felső'];
// A háttér saját 1d6 eredménye a reszletek.dobas mezőből ("1d6: 5" → 5).
export const hatterSajatDobas = (h) => { const m = String(reszletek(h).dobas || '').match(/(\d+)\s*$/); return m ? Number(m[1]) : null; };

// Alapkönyv: egy társadalmi osztály hátterei. Companion: egy háttércsoport hátterei.
export function hatterLista(ix, rendszer, csoport) {
  const lista = ix.lista('Hátterek');
  if (rendszer === 'companion') return lista.filter((h) => (reszletek(h).hattercsoport || h.csoport) === csoport && h.forras !== 'Alapkönyv');
  return lista.filter((h) => h.forras === 'Alapkönyv' && reszletek(h).tarsadalmi_osztaly === csoport);
}
export function hatterCsoportok(ix) {
  const cs = [];
  ix.lista('Hátterek').filter((h) => h.forras !== 'Alapkönyv').forEach((h) => {
    const n = reszletek(h).hattercsoport || h.csoport;
    if (n && !cs.includes(n)) cs.push(n);
  });
  return cs;
}
export function hatterDobasbol(ix, rendszer, csoport, d6) {
  return hatterLista(ix, rendszer, csoport).find((h) => hatterSajatDobas(h) === d6) || null;
}
export function hatterBeallit(adat, hatterId) {
  if (adat.hatter.id === hatterId) return;
  adat.hatter.id = hatterId;
  adat.hatter.fokusz = null;
}
export const tarsadalmiOsztalyDobas = (ix, d6) => tarsadalmiOsztalyDobasbol(d6, ix);

// ---- 6. Osztály ----
export function szint1Kepessegek(ix, osztalyId) {
  return reszletek(ix.szintSor(osztalyId, 1)).kepessegek || [];
}
export function magusE(ix, osztalyId) {
  return szint1Kepessegek(ix, osztalyId).some((k) => k.tipus === 'mp');
}
export function kotelezoTalentumok(ix, osztalyId) {
  const ki = [];
  szint1Kepessegek(ix, osztalyId).forEach((k) => (k.kotelezo || []).forEach((id) => ki.push(id)));
  return ki;
}
export function osztalyBeallit(adat, osztalyId, ix) {
  if (adat.osztaly === osztalyId) return;
  adat.osztaly = osztalyId;
  adat.osztaly_dontes = { fegyvercsoportok: [] };
  const sz = uresSzint(1);
  kotelezoTalentumok(ix, osztalyId).forEach((id) => sz.kapott.push({ tipus: 'talentum', id }));
  adat.szintek[0] = sz;
  // a fegyverválasztás az osztálytól függ
  if (adat.felszereles) adat.felszereles.kezdo_fegyverek = [];
}
// Az 1. szint kapott elemei egy típusból (például a választott kezdő talentumok).
export const kapottIdk = (adat, tipus) => ((adat.szintek[0] || {}).kapott || []).filter((k) => k.tipus === tipus).map((k) => k.id);
// Egy típus elemeinek cseréje a megadottakra; a kötelező (nem választható) elemek maradnak.
export function kapottBeallit(adat, tipus, idk, megtart = []) {
  const sz = adat.szintek[0];
  sz.kapott = sz.kapott.filter((k) => k.tipus !== tipus || megtart.includes(k.id))
    .concat(idk.filter((id) => !megtart.includes(id)).map((id) => ({ tipus, id })));
}

// Előfeltételek kijelzése a választókártyákon: [{ szoveg, ok }]. A szöveges feltételt nem értékeli (ok: null).
export function elofeltetelek(elem, lap, ix) {
  const nev = (lapNev, id) => { const e = ix.elem(lapNev, id); return e ? e.nev_hu : id; };
  const tulE = (t) => (lap.tulajdonsagok[t] ? lap.tulajdonsagok[t].ertek : 0);
  const csoportok = new Set(lap.fegyvercsoportok.map((c) => c.id));
  return (reszletek(elem).elofeltetel || []).map((e) => {
    if (e.tipus === 'tulajdonsag') return { szoveg: `${nev('Tulajdonságok', e.ertek)} ${e.min}+`, ok: tulE(e.ertek) >= szam(e.min) };
    if (e.tipus === 'fokusz') return { szoveg: (e.egyik || []).map((x) => nev('Fókuszok', x)).join(' vagy '), ok: (e.egyik || []).some((x) => lap.fokuszok[x]) };
    if (e.tipus === 'fegyvercsoport') return { szoveg: (e.egyik || []).map((x) => nev('Fegyvercsoportok', x)).join(' vagy '), ok: (e.egyik || []).some((x) => csoportok.has(x)) };
    if (e.tipus === 'talentum') {
      const lista = e.egyik || (e.ertek ? [e.ertek] : []);
      return { szoveg: lista.map((x) => nev('Talentumok', x)).join(' vagy ') + (e.fokozat ? ` (${e.fokozat})` : ''),
        ok: lap.talentumok.some((t) => lista.includes(t.id) && t.db >= (fokozatSzam(e.fokozat) || 1)) };
    }
    if (e.tipus === 'arkanum') return { szoveg: 'Arkánum' + (e.fokozat ? ` (${e.fokozat})` : ''), ok: lap.arkanumok.length > 0 };
    return { szoveg: e.szoveg || e.leiras || String(e.ertek || ''), ok: null };
  });
}

// Mágus: egy arkánum kezdő varázslatai. Ha a választási szabály forrása (Companion) aktív, a felsoroltakból
// `db` választható; különben a fix varázslatok (az Alapkönyvből származó Kezdő varázslatok) járnak.
export function kezdoVarazslatok(ix, arkanumId, forrasok) {
  return fokozatVarazslatok(ix, arkanumId, 'Kezdő', forrasok);
}
// Arkánumok cseréje: a kivett arkánum varázslatai is kikerülnek, a fix varázslatok automatikusan bekerülnek.
export function arkanumokBeallit(adat, ix, arkanumIdk, forrasok) {
  kapottBeallit(adat, 'arkanum', arkanumIdk);
  const maradVar = kapottIdk(adat, 'varazslat').filter((v) => arkanumIdk.includes((ix.elem('Varázslatok', v) || {}).arkanum));
  arkanumIdk.forEach((a) => {
    const kv = kezdoVarazslatok(ix, a, forrasok);
    if (!kv.valaszthato) kv.lista.forEach((v) => { if (!maradVar.includes(v)) maradVar.push(v); });
  });
  kapottBeallit(adat, 'varazslat', maradVar);
}

// ---- 7. Felszerelés ----
// Ár rézben: a reszletek.ar_rez, vagy az ár szövegéből ("14 ezüst", "1 arany", "5 réz").
export function arRez(elem) {
  if (!elem) return null;
  const r = reszletek(elem);
  if (r.ar_rez !== undefined && r.ar_rez !== null && r.ar_rez !== '') return szam(r.ar_rez);
  const m = String(elem.ar || '').replace(',', '.').match(/([\d.]+)\s*(arany|ezüst|réz)/i);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * { arany: 100, ezüst: 10, réz: 1 }[m[2].toLowerCase()]);
}
// Ezüstben és rézben, mert a könyv árai és a kezdőpénz is ezüstben vannak (1 arany = 10 ezüst = 100 réz).
export function penzSzoveg(rez) {
  const n = Math.round(szam(rez));
  if (n < 0) return '−' + penzSzoveg(-n);
  const e = Math.floor(n / 10); const r = n % 10;
  const reszek = [];
  if (e) reszek.push(e + ' ezüst');
  if (r || !reszek.length) reszek.push(r + ' réz');
  return reszek.join(' ');
}
export const targyLap = (id) => (id.startsWith('fgy_') ? 'Fegyverek' : id.startsWith('pan_') ? 'Páncélok' : 'Felszerelés');

// A háttér társadalmi osztálya; ha háttér még nincs, de az Alapkönyv szerinti osztály már ki van dobva vagy választva, az.
export function tarsadalmiOsztaly(adat, ix) {
  const h = ix.elem('Hátterek', adat.hatter.id);
  const t = reszletek(h).tarsadalmi_osztaly || adat.hatter.tarsadalmi_osztaly;
  if (t) return t;
  if (adat.hatter.rendszer !== 'companion' && TARSADALMI_OSZTALYOK.includes(adat.hatter.csoport)) return adat.hatter.csoport;
  return null;
}

// A felszerelés újraszámolása a döntésekből: kezdő csomag + választott fegyverek + vásárlások,
// a pénz a kezdőpénzből a vásárlások árával csökkentve. A korábbi „felszerelve” jelek megmaradnak.
export function felszerelesFrissit(adat, lapok) {
  const ix = index(lapok);
  const f = adat.felszereles;
  f.kezdo_fegyverek = f.kezdo_fegyverek || [];
  f.vasarolt = f.vasarolt || [];
  const talentumok = kapottIdk(adat, 'talentum');
  const cs = adat.osztaly ? kezdoCsomag(lapok, adat.osztaly, f.kezdo_fegyverek, talentumok) : { targyak: [] };
  const regi = new Map((f.targyak || []).map((t) => [t.id, t]));
  const targyak = cs.targyak.map((t) => ({ ...t, felszerelve: regi.has(t.id) ? !!regi.get(t.id).felszerelve : t.felszerelve }));
  let kolt = 0;
  f.vasarolt.forEach((v) => {
    kolt += (arRez(ix.elem(targyLap(v.id), v.id)) || 0) * (v.db || 1);
    const meglevo = targyak.find((t) => t.id === v.id);
    if (meglevo) meglevo.db += v.db || 1;
    else targyak.push({ id: v.id, db: v.db || 1, felszerelve: regi.has(v.id) ? !!regi.get(v.id).felszerelve : false });
  });
  f.targyak = targyak;
  const osztaly = tarsadalmiOsztaly(adat, ix);
  const kezdo = osztaly && f.penz_dobas !== null && f.penz_dobas !== undefined ? kezdoPenzRez(osztaly, f.penz_dobas, ix) : null;
  f.kezdo_penz_rez = kezdo;
  f.penz_rez = (kezdo || 0) - kolt;
  return { kolt, kezdo, osztaly, csomag: cs };
}
export function vasarlas(adat, id, valtozas) {
  const f = adat.felszereles;
  f.vasarolt = (f.vasarolt || []).map((v) => ({ ...v }));
  const v = f.vasarolt.find((x) => x.id === id);
  if (v) v.db = (v.db || 1) + valtozas;
  else if (valtozas > 0) f.vasarolt.push({ id, db: valtozas });
  f.vasarolt = f.vasarolt.filter((x) => x.db > 0);
}

// ---- Mentés előtt ----
// A kulcsmezők a legfelső szintre (a háttér ezekből tölti a lap oszlopait).
export function kulcsmezokFrissit(adat) {
  const k = kulcsmezok(adat);
  adat.szint = k.szint;
  return adat;
}

export { TULAJDONSAGOK };
