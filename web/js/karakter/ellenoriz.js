// Szabályellenőrzés: figyelmeztetéseket ad, semmit nem tilt (karakterkészítő terve: „csak figyelmeztet”).
// Egy figyelmeztetés: { kod, targy, uzenet, lepes, szint: figyelmeztetes | info, elfogadott }.
// A DM elfogadottnak jelölheti (adat.elfogadott: ['kod:targy']), ilyenkor szürkén marad.
import { szam, reszletek, tartomanyban } from './szabalyindex.js';
import { TULAJDONSAGOK, tulajdonsagDobasbol, fokozatSzam } from './tablak.js';

export function gyujto(adat) {
  const elfogadott = new Set(adat.elfogadott || []);
  const lista = [];
  const latott = new Set();
  const f = (kod, targy, uzenet, lepes, szint = 'figyelmeztetes') => {
    const kulcs = kod + ':' + targy;
    if (latott.has(kulcs)) return;
    latott.add(kulcs);
    lista.push({ kod, targy, kulcs, uzenet, lepes, szint, elfogadott: elfogadott.has(kulcs) });
  };
  f.lista = () => lista;
  return f;
}

const tulNev = (ix, id) => { const t = ix.elem('Tulajdonságok', id); return t ? t.nev_hu : id; };
const elemNev = (ix, lap, id) => { const e = ix.elem(lap, id); return e ? e.nev_hu : id; };

export function ellenorzes(adat, ix, lap, k) {
  const { f, faj, fr, osztaly, or, hatter, magus } = k;
  const kesz = adat.keszites.allapot === 'kesz';

  // ---- Tulajdonság-módszer ----
  const alap = adat.tulajdonsag_alap;
  const modszer = adat.keszites.modszer;
  if (modszer === 'vasarlas') {
    const ossz = TULAJDONSAGOK.reduce((a, t) => a + szam(alap[t]), 0);
    if (ossz !== 10) f('vasarlas_osszeg', String(ossz), `Vásárlásnál pontosan 10 fejlesztést kell elkölteni (most ${ossz}).`, 'tulajdonsagok');
    TULAJDONSAGOK.forEach((t) => {
      const v = szam(alap[t]);
      if (v < 0 || v > 3) f('vasarlas_korlat', t, `Vásárlásnál minden tulajdonság 0 és 3 között lehet (${tulNev(ix, t)}: ${v}).`, 'tulajdonsagok');
    });
  } else if ((modszer === 'sorban' || modszer === 'elrendezes') && (adat.tulajdonsag_keszites.dobasok || []).length) {
    const dobasok = adat.tulajdonsag_keszites.dobasok.map((d) => tulajdonsagDobasbol(szam(d), ix));
    if (dobasok.length !== 9) f('dobas_darab', String(dobasok.length), `A tulajdonságokhoz kilenc dobás kell (most ${dobasok.length}).`, 'tulajdonsagok');
    else if (modszer === 'sorban') {
      const vart = {};
      TULAJDONSAGOK.forEach((t, i) => { vart[t] = dobasok[i]; });
      const cs = adat.tulajdonsag_keszites.csere;
      if (Array.isArray(cs) && cs.length === 2 && vart[cs[0]] !== undefined && vart[cs[1]] !== undefined) {
        const x = vart[cs[0]]; vart[cs[0]] = vart[cs[1]]; vart[cs[1]] = x;
      }
      const elter = TULAJDONSAGOK.filter((t) => szam(alap[t]) !== vart[t]);
      if (elter.length) f('dobas_elteres', elter.join(','), 'A tulajdonságok nem egyeznek a sorban dobott értékekkel (és a cserével): ' + elter.map((t) => tulNev(ix, t)).join(', ') + '.', 'tulajdonsagok');
    } else {
      const a = TULAJDONSAGOK.map((t) => szam(alap[t])).sort((x, y) => x - y).join(',');
      const b = dobasok.slice().sort((x, y) => x - y).join(',');
      if (a !== b) f('dobas_elteres', 'elrendezes', 'A tulajdonságok nem a dobott értékek elrendezései.', 'tulajdonsagok');
    }
  } else if (kesz && !modszer) f('modszer_hianyzik', '', 'Nincs rögzítve a tulajdonság-módszer.', 'tulajdonsagok', 'info');

  // ---- Faj ----
  if (faj) {
    const valaszthato = fr.fokusz_valasztas || [];
    const fok = adat.faj_dontes.fokusz;
    if (valaszthato.length && fok && !valaszthato.includes(fok)) f('faj_fokusz', fok, `A faji fókusz (${elemNev(ix, 'Fókuszok', fok)}) nem a faj két választható fókusza közül való.`, 'faj');
    if (valaszthato.length && !fok && kesz) f('faj_fokusz_hianyzik', '', 'Nincs kiválasztva a faji fókusz.', 'faj');
    const elonyok = adat.faj_dontes.elonyok || [];
    const kell = szam(fr.elonydobasok, 2);
    if (elonyok.length !== kell && (kesz || elonyok.length > kell)) f('elony_darab', String(elonyok.length), `A fajnál ${kell} előnydobás jár (most ${elonyok.length}).`, 'faj');
    const sorok = elonyok.filter((e) => !e.sajat).map((e) => (fr.elonytabla || []).findIndex((s) => tartomanyban(s.dobas, szam(e.dobas))));
    const ism = sorok.filter((x, i) => x >= 0 && sorok.indexOf(x) !== i);
    if (ism.length) f('elony_ismetles', ism.join(','), 'Ugyanaz a faji előny kétszer: ismétlődő eredménynél újra kell dobni.', 'faj');
  } else if (kesz && !adat.faj) f('faj_hianyzik', '', 'Nincs kiválasztva faj.', 'faj');

  // ---- Háttér ----
  if (hatter) {
    const valaszthato = reszletek(hatter).fokusz_valasztas || [];
    const fok = adat.hatter.fokusz;
    if (fok && valaszthato.length && !valaszthato.includes(fok)) f('hatter_fokusz', fok, `A háttér fókusza (${elemNev(ix, 'Fókuszok', fok)}) nem a háttér választható fókuszai közül való.`, 'hatter');
    if (!fok && kesz) f('hatter_fokusz_hianyzik', '', 'Nincs kiválasztva a háttér fókusza.', 'hatter');
  } else if (kesz && !adat.hatter.id) f('hatter_hianyzik', '', 'Nincs kiválasztva háttér.', 'hatter');

  // ---- Ugyanaz a fókusz kétszer ----
  Object.values(lap.fokuszok).forEach((x) => {
    if (x.forrasok.length >= 2 && x.bonusz === 2) {
      f('dupla_fokusz', x.id, `${x.nev_hu}: ugyanaz a fókusz kétszer (${x.forrasok.map((s) => s.eredet).join(', ')}). A 11. szint előtt ez nem ad többet; válassz másikat.`, x.forrasok.some((s) => /^Háttér/.test(s.eredet)) ? 'hatter' : 'szintlepes');
    }
  });

  // ---- Osztály: fegyvercsoportok ----
  if (osztaly) {
    const v = or.fegyvercsoport_valasztas;
    const valasztott = adat.osztaly_dontes.fegyvercsoportok || [];
    if (v && v.valaszthato) {
      valasztott.filter((c) => !v.valaszthato.includes(c)).forEach((c) => f('fegyvercsoport_nem_valaszthato', c, `${elemNev(ix, 'Fegyvercsoportok', c)} nem választható ennél az osztálynál.`, 'osztaly'));
      const db = szam(v.db, 1);
      if (valasztott.length > db || (kesz && valasztott.length < db)) f('fegyvercsoport_darab', String(valasztott.length), `Az osztálynál ${db} fegyvercsoport választható (most ${valasztott.length}).`, 'osztaly');
    } else if (valasztott.length) f('fegyvercsoport_nem_valaszthato', valasztott.join(','), 'Ennél az osztálynál nincs választható fegyvercsoport.', 'osztaly');
  } else if (kesz && !adat.osztaly) f('osztaly_hianyzik', '', 'Nincs kiválasztva osztály.', 'osztaly');

  // ---- Szintek ----
  const szintSzamok = adat.szintek.map((s) => s.szint);
  szintSzamok.forEach((n, i) => { if (n !== i + 1) f('szint_sorrend', String(n), 'A szintek nem folytonosak 1-től.', 'szintlepes'); });
  const elsodleges = or.elsodleges || [];
  const masodlagos = or.masodlagos || [];
  adat.szintek.forEach((s) => {
    const n = s.szint;
    const lepes = n === 1 ? 'osztaly' : 'szintlepes';
    const kapott = s.kapott || [];
    if (n >= 2 && osztaly) {
      const kell = n % 2 === 0 ? elsodleges : masodlagos;
      const nev = n % 2 === 0 ? 'elsődleges' : 'másodlagos';
      if (!s.fejlesztes) { if (kesz) f('fejlesztes_hianyzik', String(n), `${n}. szint: nincs kiválasztva a tulajdonság-fejlesztés.`, lepes); }
      else if (kell.length && !kell.includes(s.fejlesztes)) f('fejlesztes_tipus', String(n), `${n}. szint: a fejlesztés ${nev} tulajdonságra jár (${tulNev(ix, s.fejlesztes)} nem az).`, lepes);
      if (!s.fokusz) { if (kesz) f('szint_fokusz_hianyzik', String(n), `${n}. szint: nincs kiválasztva az új fókusz.`, lepes); }
      else {
        const fe = ix.elem('Fókuszok', s.fokusz);
        if (fe && kell.length && !kell.includes(fe.tulajdonsag)) f('szint_fokusz_tipus', String(n), `${n}. szint: a fókusz ${nev} tulajdonsághoz kell, hogy tartozzon (${fe.nev_hu} nem az).`, lepes);
      }
    }
    if (!osztaly) return;
    const sor = ix.szintSor(osztaly.id, n);
    (reszletek(sor).kepessegek || []).forEach((kp) => {
      const van = (tipus, lista) => kapott.filter((x) => x.tipus === tipus && (!lista || lista.includes(x.id)));
      if (kp.tipus === 'talentum_valasztas') {
        const db = szam(kp.valasztando, 1);
        const valasztott = van('talentum', kp.valaszthato);
        if (valasztott.length > db || (kesz && valasztott.length < db)) f('kezdo_talentum', String(n), `${n}. szint, ${kp.nev_hu}: ${db} választandó a felsoroltak közül (most ${valasztott.length}).`, lepes);
        (kp.kotelezo || []).forEach((id) => { if (!van('talentum', [id]).length) f('kotelezo_talentum', id, `${n}. szint: ${elemNev(ix, 'Talentumok', id)} Kezdő fokozata jár, de nincs felvéve.`, lepes); });
      } else if (kesz && kp.tipus === 'talentum' && !van('talentum').length) f('szint_kepesseg_hianyzik', n + ':talentum', `${n}. szint: hiányzik az új talentum.`, lepes);
      else if (kesz && kp.tipus === 'magikus_talentum' && !van('arkanum').length) f('szint_kepesseg_hianyzik', n + ':arkanum', `${n}. szint: hiányzik az új mágikus talentum (arkánum).`, lepes);
      else if (kesz && (kp.tipus === 'specializacio' || kp.tipus === 'specializacio_fokozat') && !van('specializacio').length) f('szint_kepesseg_hianyzik', n + ':specializacio', `${n}. szint: hiányzik: ${kp.nev_hu}.`, lepes);
      else if (kesz && kp.tipus === 'fegyvercsoport' && !van('fegyvercsoport').length) f('szint_kepesseg_hianyzik', n + ':fegyvercsoport', `${n}. szint: hiányzik az új fegyvercsoport.`, lepes);
      else if (kp.tipus === 'fokusz_valasztas') {
        const v = van('fokusz');
        if (v.some((x) => kp.valaszthato && !kp.valaszthato.includes(x.id))) f('osztaly_fokusz', String(n), `${n}. szint: a fókusz nem a felsoroltak közül való.`, lepes);
        if (kesz && !v.length) f('szint_kepesseg_hianyzik', n + ':fokusz', `${n}. szint: hiányzik az osztály által adott fókusz.`, lepes);
      }
    });
    // Mágus 1. szint: két mágikus talentum (arkánum) és a hozzájuk tartozó varázslatok.
    if (n === 1 && magus) {
      const ark = kapott.filter((x) => x.tipus === 'arkanum');
      const vars = kapott.filter((x) => x.tipus === 'varazslat');
      if (ark.length > 2 || (kesz && ark.length < 2)) f('magus_arkanum', '1', `Mágus 1. szint: két mágikus talentummal (arkánummal) kezd (most ${ark.length}).`, 'osztaly');
      const kellVar = ark.reduce((a, x) => a + szam(((reszletek(ix.elem('Arkánumok', x.id)).valasztas || {})['Kezdő'] || {}).db, 2), 0);
      if (vars.length > kellVar || (kesz && vars.length < kellVar)) f('magus_varazslat', '1', `Mágus 1. szint: ${kellVar} varázslat jár (most ${vars.length}).`, 'osztaly');
    }
  });

  // ---- Talentumok, specializációk: előfeltétel, osztály, fokozat ----
  const tulE = (t) => (lap.tulajdonsagok[t] ? lap.tulajdonsagok[t].ertek : 0);
  const csoportIdk = new Set(lap.fegyvercsoportok.map((c) => c.id));
  const elofeltetel = (lista) => (lista || []).filter((e) => {
    if (e.tipus === 'tulajdonsag') return tulE(e.ertek) < szam(e.min);
    if (e.tipus === 'fokusz') return !(e.egyik || []).some((x) => lap.fokuszok[x]);
    if (e.tipus === 'fegyvercsoport') return !(e.egyik || []).some((x) => csoportIdk.has(x));
    if (e.tipus === 'arkanum') return !lap.arkanumok.some((a) => a.db >= (fokozatSzam(e.fokozat) || 1));
    if (e.tipus === 'talentum') return !lap.talentumok.some((t) => t.id === e.ertek && t.db >= (fokozatSzam(e.fokozat) || 1));
    return false;
  });
  const fokozatosEllenor = (lista, lap1, lepesNev) => lista.forEach((t) => {
    if (!t.elem) { f('ismeretlen_elem', t.id, `${t.id} nincs a szabályadatbázisban.`, lepesNev, 'info'); return; }
    if (t.db > 3) f('fokozat_tobb', t.id, `${t.nev_hu}: legfeljebb három fokozat (Kezdő, Haladó, Mester) van, de ${t.db} bejegyzés szerepel.`, lepesNev);
    const r = reszletek(t.elem);
    const oszt = r.osztalyok || (t.elem.osztaly ? [t.elem.osztaly] : null);
    if (osztaly && oszt && oszt.length && !oszt.includes(osztaly.id)) f('osztaly_tiltott', t.id, `${t.nev_hu} nem érhető el a(z) ${osztaly.nev_hu} osztálynak.`, lepesNev);
    const hiany = elofeltetel(r.elofeltetel);
    if (hiany.length) f('elofeltetel', t.id, `${t.nev_hu}: az előfeltétel nem teljesül (${t.elem.elofeltetel || 'lásd a leírást'}).`, lepesNev);
  });
  fokozatosEllenor(lap.talentumok, 'Talentumok', 'szintlepes');
  fokozatosEllenor(lap.specializaciok, 'Specializációk', 'szintlepes');
  fokozatosEllenor(lap.arkanumok, 'Arkánumok', 'osztaly');

  // ---- Varázslatok: a saját arkánumból, legfeljebb az elért fokozatig ----
  lap.varazslatok.forEach((v) => {
    if (!v.elem) { f('ismeretlen_elem', v.id, `${v.id} nincs a szabályadatbázisban.`, 'osztaly', 'info'); return; }
    const ark = lap.arkanumok.find((a) => a.id === v.arkanum);
    if (!ark) f('varazslat_arkanum', v.id, `${v.nev_hu}: a karakternek nincs ${elemNev(ix, 'Arkánumok', v.arkanum)} arkánuma.`, 'osztaly');
    else if (fokozatSzam(v.fokozat) > ark.db) f('varazslat_fokozat', v.id, `${v.nev_hu}: ${v.fokozat} fokozatú, de az arkánum csak ${ark.fokozat} fokon van.`, 'osztaly');
  });
  const varIdk = lap.varazslatok.map((v) => v.id);
  varIdk.filter((x, i) => varIdk.indexOf(x) !== i).forEach((x) => f('varazslat_ketszer', x, `${elemNev(ix, 'Varázslatok', x)} kétszer szerepel.`, 'osztaly'));

  // ---- Fegyverek, pénz ----
  lap.fegyverek.forEach((w) => {
    if (!w.ismert) f('fegyver_kepzetlen', w.id, `${w.nev_hu}: a karakter nem ismeri a(z) ${w.csoport_nev} fegyvercsoportot (−2 a támadásra, fél sebzés).`, 'felszereles');
    if (w.min_ero_alatt) f('fegyver_min_ero', w.id, `${w.nev_hu}: a minimális Erő ${w.min_ero}, a karakteré ${tulE('tul_strength')}.`, 'felszereles');
  });
  if (szam(adat.felszereles.penz_rez) < 0) f('penz_negativ', '', 'Több pénzt költöttél, mint amennyi volt.', 'felszereles');
  if (lap.pancel && lap.pancel.ugyesseg_buntetes) f('pancel_kepzetlen', lap.pancel.id, `${lap.pancel.nev_hu}: Páncélviselet nélkül az Ügyesség alapú próbákra is −${lap.pancel.ugyesseg_buntetes}.`, 'felszereles', 'info');

  // ---- Források: kikapcsolt könyvből származó elem ----
  const forrasok = adat.keszites.forrasok || [];
  if (forrasok.length) {
    const nezd = (lap1, id) => {
      const e = ix.elem(lap1, id);
      if (e && e.forras && e.forras !== 'Házi' && !forrasok.includes(e.forras)) f('forras_kikapcsolt', id, `${e.nev_hu}: a(z) ${e.forras} forrás nincs bekapcsolva ennél a karakternél.`, 'keret');
    };
    nezd('Fajok', adat.faj); nezd('Osztályok', adat.osztaly); nezd('Hátterek', adat.hatter.id);
    lap.talentumok.forEach((t) => nezd('Talentumok', t.id));
    lap.specializaciok.forEach((t) => nezd('Specializációk', t.id));
    lap.arkanumok.forEach((t) => nezd('Arkánumok', t.id));
    lap.varazslatok.forEach((t) => nezd('Varázslatok', t.id));
    lap.fegyverek.forEach((t) => nezd('Fegyverek', t.id));
  }
}
