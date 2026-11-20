// Kampányjátszó 6.7: pihenés (szusszanás, alvás, meditáció, Súlyos sebek).
// A csapat egyszerre adott pihenése (a DM Játék nézetéből, vagy a mesterjátékos): character.rest; visszavonás:
// character.rest.undo. A szabályok és a dobások a felületen vannak (web/js/karakter/pihenes.js): ide tételenként a
// változás (előjeles) és a maximum érkezik. A háttér a változást az aktuális értékhez adja, a maximumig és 0-ig vágva
// (így a közben máshol kapott sebzés megmarad), és a karakter adat.pihenes_naplo listájába ír egy bejegyzést, ugyanazzal
// a szerkezettel, amit a karakterlap helyben ír (pihenes.js alkalmaz). Séma változás nincs.
// A szusszanáshoz a csata lezárása a résztvevő karakterekbe írja az utolsó csatát (Csatak.gs, adat.allapot.utolso_csata).
// Terv: claude/kampanyjatszo-terv.md, „6.7”.

const PIHENES_NAPLO_MAX = 100;
const PIHENES_FAJTAK = ['szusszanas', 'alvas', 'meditacio'];
const PIHENES_ID_MINTA = /^pi_[a-z0-9]{6,20}$/;
const PIHENES_KORULMENYEK = ['jo', 'gyenge', 'rossz', 'nagyon_rossz'];

function pihenesNaplo_(adat) {
  adat.pihenes_naplo = Array.isArray(adat.pihenes_naplo) ? adat.pihenes_naplo : [];
  return adat.pihenes_naplo;
}

function pihenesErtek_(akt, max) { return akt === null || akt === undefined || akt === '' ? max : Math.round(Number(akt) || 0); }

// Az aktuális Egészség vagy Mágiapont: az állapotból, a régi szerkezetű (átvett) karakternél a régi mezőből.
function pihenesAktualis_(adat, kulcs, max) {
  const a = adat.allapot && adat.allapot[kulcs];
  if (a !== null && a !== undefined && a !== '') return Math.round(Number(a) || 0);
  if (!(Number(adat.sema) >= 1) && adat[kulcs] && typeof adat[kulcs] === 'object') return pihenesErtek_(adat[kulcs].aktualis, max);
  return max;
}

// Egy tétel alkalmazása a karakter adatára (zárolás alatt). Visszaad: a bejegyzés, vagy null, ha már benne volt.
function pihenesAlkalmaz_(adat, t, kozos) {
  adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
  const lista = pihenesNaplo_(adat);
  if (lista.some(function (x) { return x && x.id === kozos.id; })) return null;
  const egMax = Math.max(0, Math.round(Number(t.eg_max) || 0));
  const mpMax = t.mp_max === null || t.mp_max === undefined || t.mp_max === '' ? null : Math.max(0, Math.round(Number(t.mp_max) || 0));
  const b = { id: kozos.id, idopont: kozos.idopont, fajta: kozos.fajta, ki: kozos.ki, kampany_id: kozos.kampany_id,
    eg: 0, mp: 0, eg_utana: null, mp_utana: null, eg_max: egMax, mp_max: mpMax, reszlet: rovidSzoveg_(t.reszlet, 300) };
  if (egMax > 0) {
    const akt = pihenesAktualis_(adat, 'egeszseg', egMax);
    const uj = Math.max(0, Math.min(egMax, akt + egesz_(t.eg)));
    b.eg = uj - akt;
    b.eg_utana = uj;
    adat.allapot.egeszseg = uj;
    if (!(Number(adat.sema) >= 1) && adat.egeszseg && typeof adat.egeszseg === 'object') adat.egeszseg.aktualis = uj; // régi szerkezet
  }
  if (mpMax) {
    const akt = pihenesAktualis_(adat, 'magiapont', mpMax);
    const uj = Math.max(0, Math.min(mpMax, akt + egesz_(t.mp)));
    b.mp = uj - akt;
    b.mp_utana = uj;
    adat.allapot.magiapont = uj;
    if (!(Number(adat.sema) >= 1) && adat.magiapont && typeof adat.magiapont === 'object') adat.magiapont.aktualis = uj; // régi szerkezet
  }
  if (kozos.fajta !== 'szusszanas') {
    b.orak = Math.max(0, Math.min(24, Math.round(Number(t.orak) || 0)));
    b.napok = Math.max(1, Math.min(60, Math.round(Number(t.napok) || 1)));
  }
  if (kozos.fajta === 'alvas' && t.sulyos) {
    b.sulyos = true;
    b.korulmeny = PIHENES_KORULMENYEK.indexOf(t.korulmeny) >= 0 ? t.korulmeny : 'jo';
    b.sulyos_elso = t.sulyos_elso !== false;
  }
  if (t.csata_id) b.csata_id = rovidSzoveg_(t.csata_id, 40);
  if (t.dobasok && typeof t.dobasok === 'object') {
    const d = {};
    ['eg', 'mp'].forEach(function (k) {
      if (Array.isArray(t.dobasok[k])) d[k] = t.dobasok[k].slice(0, 120).map(function (x) { return Math.max(1, Math.min(6, Math.round(Number(x) || 1))); });
    });
    if (Object.keys(d).length) b.dobasok = d;
  }
  lista.push(b);
  if (lista.length > PIHENES_NAPLO_MAX) lista.splice(0, lista.length - PIHENES_NAPLO_MAX);
  return b;
}

// Visszavonás a karakter adatán (zárolás alatt): a ténylegesen kapott érték lejön. Visszaad: bool.
function pihenesVisszavon_(adat, id, ido) {
  const b = pihenesNaplo_(adat).find(function (x) { return x && x.id === id; });
  if (!b || b.visszavonva) return false;
  adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
  if (Number(b.eg) && Number(b.eg_max) > 0) {
    const akt = pihenesAktualis_(adat, 'egeszseg', Number(b.eg_max));
    adat.allapot.egeszseg = Math.max(0, Math.min(Number(b.eg_max), akt - Number(b.eg)));
    if (!(Number(adat.sema) >= 1) && adat.egeszseg && typeof adat.egeszseg === 'object') adat.egeszseg.aktualis = adat.allapot.egeszseg;
  }
  if (Number(b.mp) && Number(b.mp_max) > 0) {
    const akt = pihenesAktualis_(adat, 'magiapont', Number(b.mp_max));
    adat.allapot.magiapont = Math.max(0, Math.min(Number(b.mp_max), akt - Number(b.mp)));
    if (!(Number(adat.sema) >= 1) && adat.magiapont && typeof adat.magiapont === 'object') adat.magiapont.aktualis = adat.allapot.magiapont;
  }
  b.visszavonva = ido;
  return true;
}

// action: character.rest
//   adat: { kampany_id, id: 'pi_…', fajta, tetelek: [{ karakter_id, eg, eg_max, mp?, mp_max?, reszlet?, orak?, napok?,
//           sulyos?, korulmeny?, sulyos_elso?, csata_id?, dobasok? }] }
// Aki a karaktert szerkesztheti (a DM mindet, a mesterjátékos a kampányéit, a játékos a sajátját). A karakternek a
// kampány tagjának kell lennie. Ismételt küldésnél (ugyanaz az azonosító) a karaktert nem módosítja újra.
// Visszaad: { pihenes: { id, idopont, fajta }, karakterek: [{ id, verzio, modositva, adat }] }.
function pihenes_(a, felh) {
  const id = String(a.id || '');
  if (!PIHENES_ID_MINTA.test(id)) throw hiba_('hibas_adat', 'Hibás pihenésazonosító.');
  if (PIHENES_FAJTAK.indexOf(a.fajta) < 0) throw hiba_('hibas_adat', 'Ismeretlen pihenés.');
  const tetelek = Array.isArray(a.tetelek) ? a.tetelek.filter(function (t) { return t && t.karakter_id; }) : [];
  if (!tetelek.length) throw hiba_('hianyzo_adat', 'Nincs kiválasztott karakter.');
  if (tetelek.length > 20) throw hiba_('hibas_adat', 'Túl sok karakter egyszerre.');
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const szerep = kampanySzerep_(felh, kampany, k);
    if (!szerep || (szerep !== 'dm' && kampany.allapot === ARCHIVALT)) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    const tagok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; }).map(function (x) { return x.karakter_id; });
    const karakterek = tetelek.map(function (t) {
      if (tagok.indexOf(t.karakter_id) < 0) throw hiba_('hibas_adat', 'A karakter nincs ebben a kampányban.');
      const kar = karakterKeresese_(t.karakter_id, k);
      if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ezt a karaktert nem szerkesztheted: ' + (kar.nev || ''));
      return kar;
    });
    const ido = most_();
    const kozos = { id: id, idopont: ido, fajta: a.fajta, ki: felh.n, kampany_id: kampany.id };
    const ki = [];
    const erintett = [kampany.id];
    tetelek.forEach(function (t, i) {
      const kar = karakterek[i];
      const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
      if (!pihenesAlkalmaz_(adat, t, kozos)) return; // ismételt küldés
      ki.push(karakterMentese6_5_(kar, adat, felh, ido, 'pihenes.' + a.fajta + ':' + id));
      karakterKampanyai_(kar.id, k).forEach(function (c) { if (erintett.indexOf(c) < 0) erintett.push(c); });
    });
    if (ki.length) kampanyVerziokNovelese_(erintett, k.kampanyok);
    return { pihenes: { id: id, idopont: ido, fajta: a.fajta }, karakterek: ki, ismetelt: !ki.length };
  });
}

// action: character.rest.undo   adat: { kampany_id, id }
// A pihenés visszavonása a kampány minden karakterén, amelyik kapta; csak ha mindet szerkesztheti a kérő.
function pihenesVisszavonasa_(a, felh) {
  const id = String(a.id || '');
  if (!PIHENES_ID_MINTA.test(id)) throw hiba_('hibas_adat', 'Hibás pihenésazonosító.');
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    if (!kampanySzerep_(felh, kampany, k)) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    const tagok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; }).map(function (x) { return x.karakter_id; });
    const erintettKar = k.karakterek.filter(function (c) {
      return tagok.indexOf(c.id) >= 0 && c.adat && Array.isArray(c.adat.pihenes_naplo) && c.adat.pihenes_naplo.some(function (x) { return x && x.id === id; });
    });
    if (!erintettKar.length) throw hiba_('nem_talalhato', 'Nincs ilyen pihenés.');
    erintettKar.forEach(function (c) { if (!karakterIrhato_(felh, c, k)) throw hiba_('nincs_jogosultsag', 'Ezt a karaktert nem szerkesztheted: ' + (c.nev || '')); });
    const ido = most_();
    const ki = [];
    const erintett = [kampany.id];
    erintettKar.forEach(function (c) {
      if (!pihenesVisszavon_(c.adat, id, ido)) return;
      ki.push(karakterMentese6_5_(c, c.adat, felh, ido, 'pihenes.visszavon:' + id));
      karakterKampanyai_(c.id, k).forEach(function (x) { if (erintett.indexOf(x) < 0) erintett.push(x); });
    });
    if (ki.length) kampanyVerziokNovelese_(erintett, k.kampanyok);
    return { karakterek: ki };
  });
}

// A csata lezárásakor (Csatak.gs, zárolás alatt): a résztvevő karakterekbe az utolsó csata, és hogy 0 Egészségen
// (haldokolva, halottan) zárult-e nekik. Ebből tudja a felület, jár-e szusszanás. Visszaad: az írt karakterek azonosítói.
function csataUtolsoBeirasa_(c, k, felh) {
  const resztvevok = (c.adat && Array.isArray(c.adat.resztvevok) ? c.adat.resztvevok : [])
    .filter(function (r) { return r && r.forras && r.forras.tipus === 'karakter'; });
  const irt = [];
  resztvevok.forEach(function (r) {
    const kar = k.karakterek.find(function (x) { return x.id === r.forras.id; });
    if (!kar) return;
    const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
    adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
    const nulla = (Number(r.egeszseg) || 0) <= 0 || r.allapot === 'haldoklik' || r.allapot === 'halott';
    const regi = adat.allapot.utolso_csata;
    if (regi && regi.id === c.id && !!regi.nulla === nulla) return;
    adat.allapot.utolso_csata = { id: c.id, cim: rovidSzoveg_(c.cim, 120), lezarva: c.lezarva || most_(), nulla: nulla };
    kar.adat = adat;
    kar.verzio = (Number(kar.verzio) || 0) + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    irt.push(kar.id);
  });
  return irt;
}
