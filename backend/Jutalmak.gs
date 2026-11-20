// Kampányjátszó 6.5: jutalmak kiosztása, csapatkassza, zsákmány elosztása.
//
// Egy kiosztás egyetlen művelet, amely egyszerre több karaktert és a csapatkasszát is érintheti (mint a character.xp):
//   - karakterenként pénz (a felszerelés játék közbeni tételei közé, `penz` tétel, a penz_rez is frissül),
//   - tárgy (`targy` tétel; mágikus tárgynál egyedi azonosítóval, például `fgy_longsword~ko_abc123`),
//   - jutalombejegyzés (cím, tagság, mágikus tárgy, ereklye, társ: az adat.jutalmak listába),
//   - a csapatkassza mozgása,
//   - társnál az NJK-tár követőjének kötődése (és a kampány hozzárendelése).
// A kiosztás azonosítóját a kliens adja (`ko_…`), az ismételt küldés nem duplikál. Minden kiosztás visszavonható
// (reward.undo): a karakterekről lekerülnek a tételei és a bejegyzései, a kassza és a követő kötődése visszaáll.
//
// A csapatkassza a kampány `beallitasok` cellájában él (`kassza` kulcs), így nem kell új oszlop: { egyenleg (réz),
// naplo: [kiosztás] }. A kassza a kampány minden tagjának látszik (kampanyNezet_ kassza), a DM-nek a jutalomelem
// azonosítójával együtt. A campaign.update nem írhatja (Kampanyok.gs).

const KIOSZTAS_ID_MINTA = /^ko_[a-z0-9]{6,16}$/;
const KASSZA_NAPLO_MAX = 300;
const JUTALOM_BEJEGYZES_MAX = 60;
const KIOSZTAS_FAJTAK = ['jutalom', 'kincs', 'zsakmany', 'kassza', 'atadas', 'penz'];
const JUTALOM_BEJEGYZES_FAJTAK = ['cim', 'tagsag', 'targy', 'ereklye', 'tars', 'egyeb'];

function kasszaAdat_(kampany) {
  const b = kampany && kampany.beallitasok && typeof kampany.beallitasok === 'object' ? kampany.beallitasok : {};
  const k = b.kassza && typeof b.kassza === 'object' ? b.kassza : {};
  return { egyenleg: Math.round(Number(k.egyenleg) || 0), naplo: Array.isArray(k.naplo) ? k.naplo : [] };
}

// A kampány nézetébe: a DM mindent lát, a játékos a jutalomelem azonosítója és a társ belső adatai nélkül.
function kasszaNezet_(kampany, szerep) {
  const k = kasszaAdat_(kampany);
  if (szerep === 'dm') return k;
  return {
    egyenleg: k.egyenleg,
    naplo: k.naplo.map(function (x) {
      const o = {};
      Object.keys(x).forEach(function (m) { if (m !== 'jutalom_id' && m !== 'tars_elozo') o[m] = x[m]; });
      return o;
    })
  };
}

function kasszaIrasa_(kampany, k) {
  const b = kampany.beallitasok && typeof kampany.beallitasok === 'object' ? kampany.beallitasok : {};
  b.kassza = k;
  kampany.beallitasok = b;
  cellaIrasa_('jatek', 'Kampányok', kampany._sor, 'beallitasok', b);
}

function egesz_(x) { return Math.round(Number(String(x === undefined || x === null ? '' : x).replace('−', '-')) || 0); }
function rovidSzoveg_(x, n) { return String(x === undefined || x === null ? '' : x).slice(0, n); }

// A tárgy azonosítója: a szabályadat azonosítója (fgy_…, pan_…, fel_…), annak egyedi változata (`…~k_…`), vagy saját.
function targyAzonosito_(t) {
  const id = String(t.id || '').trim();
  if (/^(fgy|pan|fel)_[a-z0-9_]+(~[a-z0-9_]+)?$/.test(id)) return id;
  if (/^sajat:[^\s]{1,60}$/.test(id)) return id;
  const nev = String(t.nev || '').trim();
  if (!nev) throw hiba_('hibas_adat', 'Hiányzik a tárgy neve.');
  return 'sajat:' + nev.toLowerCase().replace(/\s+/g, '_').slice(0, 40);
}

// Egy karakter adatának módosítása a kiosztás szerint. Visszaad: a karakterre jutó összegzés a naplóba.
function karakterreKioszt_(adat, t, kiosztas, felh, ido) {
  adat.felszereles = adat.felszereles && typeof adat.felszereles === 'object' ? adat.felszereles : {};
  const f = adat.felszereles;
  f.jatek = Array.isArray(f.jatek) ? f.jatek : [];
  f.targyak = Array.isArray(f.targyak) ? f.targyak : [];
  const o = { id: t.karakter_id };
  const megj = rovidSzoveg_(t.megjegyzes || kiosztas.ok, 200);
  const penz = egesz_(t.penz);
  if (penz) {
    f.jatek.push({ tipus: 'penz', penz: penz, megjegyzes: megj, kiosztas_id: kiosztas.id, idopont: ido });
    f.penz_rez = egesz_(f.penz_rez) + penz;
    o.penz = penz;
  }
  if (t.targy && typeof t.targy === 'object') {
    const id = targyAzonosito_(t.targy);
    const db = Math.max(1, egesz_(t.targy.db) || 1);
    const nev = rovidSzoveg_(t.targy.nev, 120);
    const tetel = { tipus: 'targy', targy: id, db: db, megjegyzes: megj, kiosztas_id: kiosztas.id, idopont: ido };
    if (nev) tetel.nev = nev;
    f.jatek.push(tetel);
    const meglevo = f.targyak.find(function (x) { return x && x.id === id; });
    if (meglevo) meglevo.db = (Number(meglevo.db) || 0) + db;
    else f.targyak.push(nev ? { id: id, db: db, felszerelve: false, nev: nev } : { id: id, db: db, felszerelve: false });
    o.targy = { id: id, nev: nev, db: db };
  }
  if (t.jutalom && typeof t.jutalom === 'object') {
    const j = JSON.parse(JSON.stringify(t.jutalom));
    j.fajta = JUTALOM_BEJEGYZES_FAJTAK.indexOf(j.fajta) >= 0 ? j.fajta : 'egyeb';
    j.id = kiosztas.id;
    j.kiosztas_id = kiosztas.id;
    j.idopont = ido;
    j.ki = felh.n;
    j.kampany_id = kiosztas.kampany_id;
    if (kiosztas.jutalom_id) j.jutalom_id = kiosztas.jutalom_id;
    adat.jutalmak = Array.isArray(adat.jutalmak) ? adat.jutalmak : [];
    if (adat.jutalmak.length >= JUTALOM_BEJEGYZES_MAX) throw hiba_('tul_nagy', 'A karakternek túl sok jutalombejegyzése van.');
    adat.jutalmak.push(j);
    o.jutalom = { fajta: j.fajta, nev: rovidSzoveg_(j.nev, 120) };
  }
  return o;
}

// A kiosztás nyomainak eltávolítása egy karakterről (visszavonás). Visszaad: történt-e változás.
function karakterrolVisszavon_(adat, kiosztasId) {
  let valtozott = false;
  const f = adat.felszereles && typeof adat.felszereles === 'object' ? adat.felszereles : null;
  if (f && Array.isArray(f.jatek)) {
    const marad = [];
    f.jatek.forEach(function (t) {
      if (!t || t.kiosztas_id !== kiosztasId) { marad.push(t); return; }
      valtozott = true;
      f.penz_rez = egesz_(f.penz_rez) - egesz_(t.penz);
      if (t.targy && t.db) {
        const x = (f.targyak || []).find(function (y) { return y && y.id === t.targy; });
        if (x) x.db = (Number(x.db) || 0) - egesz_(t.db);
      }
    });
    f.jatek = marad;
    if (Array.isArray(f.targyak)) f.targyak = f.targyak.filter(function (x) { return x && (Number(x.db) || 0) > 0; });
  }
  if (Array.isArray(adat.jutalmak)) {
    const n = adat.jutalmak.length;
    adat.jutalmak = adat.jutalmak.filter(function (j) { return !j || j.kiosztas_id !== kiosztasId; });
    if (adat.jutalmak.length !== n) valtozott = true;
  }
  return valtozott;
}

function karakterMentese6_5_(kar, adat, felh, ido, mit) {
  meretEllenorzes_(adat);
  const regi = Number(kar.verzio) || 0;
  kar.adat = adat;
  kar.verzio = regi + 1;
  kar.modositva = ido;
  kar.modositotta = felh.n;
  sorFrissitese_('jatek', 'Karakterek', kar);
  valtozasNaplozasa_(felh, mit, kar.id, regi, kar.verzio);
  return { id: kar.id, verzio: kar.verzio, modositva: ido, adat: adat };
}

// action: reward.give (DM)
//   adat: { kampany_id, id: 'ko_…', fajta, ok, jutalom_id?, kassza? (réz, előjeles), kassza_megjegyzes?,
//           karakterek: [{ karakter_id, penz? (réz, előjeles), targy? { id?, nev, db }, jutalom? {...}, megjegyzes? }],
//           tars? { njk_id, kotodes: karakter_id | 'csapat' } }
// Visszaad: { kiosztas, kassza, karakterek: [{ id, verzio, modositva, adat }], njk? }. Ismételt küldésnél a meglévő
// kiosztást adja vissza (ismetelt: true), változtatás nélkül.
function jutalomKiosztasa_(a, felh) {
  const id = String(a.id || '');
  if (!KIOSZTAS_ID_MINTA.test(id)) throw hiba_('hibas_adat', 'Hibás kiosztásazonosító.');
  const tetelek = Array.isArray(a.karakterek) ? a.karakterek.filter(function (t) { return t && t.karakter_id; }) : [];
  const kasszaValt = egesz_(a.kassza);
  const tars = a.tars && typeof a.tars === 'object' && a.tars.njk_id ? a.tars : null;
  if (!tetelek.length && !kasszaValt && !tars) throw hiba_('hianyzo_adat', 'Nincs mit kiosztani.');
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const kassza = kasszaAdat_(kampany);
    const meglevo = kassza.naplo.find(function (x) { return x && x.id === id; });
    if (meglevo) return { ismetelt: true, kiosztas: meglevo, kassza: kassza, karakterek: [] };
    const tagok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; }).map(function (x) { return x.karakter_id; });
    const ido = most_();
    const kiosztas = {
      id: id, kampany_id: kampany.id, idopont: ido, ki: felh.n,
      fajta: KIOSZTAS_FAJTAK.indexOf(a.fajta) >= 0 ? a.fajta : 'jutalom',
      ok: rovidSzoveg_(a.ok, 200), karakterek: []
    };
    if (a.jutalom_id) kiosztas.jutalom_id = String(a.jutalom_id);
    if (a.jutalom_nev) kiosztas.jutalom_nev = rovidSzoveg_(a.jutalom_nev, 120);
    const ki = [];
    tetelek.forEach(function (t) {
      if (tagok.indexOf(t.karakter_id) < 0) throw hiba_('hibas_adat', 'A karakter nincs ebben a kampányban.');
      const kar = karakterKeresese_(t.karakter_id, k);
      const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
      const osszeg = karakterreKioszt_(adat, t, kiosztas, felh, ido);
      osszeg.nev = kar.nev || '';
      kiosztas.karakterek.push(osszeg);
      ki.push(karakterMentese6_5_(kar, adat, felh, ido, 'jutalom.kioszt:' + id));
    });
    if (kasszaValt) {
      kiosztas.kassza = kasszaValt;
      if (a.kassza_megjegyzes) kiosztas.kassza_megjegyzes = rovidSzoveg_(a.kassza_megjegyzes, 200);
      kassza.egyenleg += kasszaValt;
    }
    let njk = null;
    if (tars) {
      const sorok = njkSorok_();
      const n = njkKeresese_(String(tars.njk_id), sorok);
      if (njkSablon_(n)) throw hiba_('hibas_adat', 'Sablon NJK nem lehet társ.');
      const kot = String(tars.kotodes || 'csapat');
      if (kot !== 'csapat' && tagok.indexOf(kot) < 0) throw hiba_('hibas_adat', 'A gazda karakter nincs ebben a kampányban.');
      kiosztas.tars_elozo = { kotodes: n.kotodes || '', kampanyok: njkKampanyai_(n).slice() };
      kiosztas.tars = { njk_id: n.id, nev: n.nev || '', kotodes: kot };
      n.kotodes = kot;
      if (njkKampanyai_(n).indexOf(kampany.id) < 0) n.kampanyok = njkKampanyai_(n).concat([kampany.id]);
      const regi = Number(n.verzio) || 0;
      n.verzio = regi + 1;
      n.modositva = ido;
      n.modositotta = felh.n;
      sorFrissitese_('jatek', 'NJK-k', n);
      valtozasNaplozasa_(felh, 'jutalom.tars:' + id, n.id, regi, n.verzio);
      njk = { id: n.id, verzio: n.verzio, kotodes: n.kotodes, kampanyok: n.kampanyok };
    }
    kassza.naplo.push(kiosztas);
    if (kassza.naplo.length > KASSZA_NAPLO_MAX) kassza.naplo.splice(0, kassza.naplo.length - KASSZA_NAPLO_MAX);
    kasszaIrasa_(kampany, kassza);
    const erintett = [kampany.id];
    ki.forEach(function (x) { karakterKampanyai_(x.id, k).forEach(function (c) { if (erintett.indexOf(c) < 0) erintett.push(c); }); });
    kampanyVerziokNovelese_(erintett, k.kampanyok);
    valtozasNaplozasa_(felh, 'kassza.kioszt:' + kiosztas.fajta, kampany.id, '', id);
    return { kiosztas: kiosztas, kassza: kassza, karakterek: ki, njk: njk };
  });
}

// action: reward.undo (DM)   adat: { kampany_id, id }
// A kiosztás visszavonása: a karakterekről lekerülnek a tételei és a jutalombejegyzései, a kassza visszaáll, a társ
// kötődése és kampányai a kiosztás előttire állnak. A naplóban a kiosztás „visszavonva” jelet kap (nem törlődik).
function jutalomVisszavonasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const kassza = kasszaAdat_(kampany);
    const x = kassza.naplo.find(function (y) { return y && y.id === a.id; });
    if (!x) throw hiba_('nem_talalhato', 'Nincs ilyen kiosztás.');
    if (x.visszavonva) return { kiosztas: x, kassza: kassza, karakterek: [] };
    const ido = most_();
    const ki = [];
    (x.karakterek || []).forEach(function (t) {
      const kar = k.karakterek.find(function (c) { return c.id === t.id; });
      if (!kar) return; // törölt karakter
      const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
      if (karakterrolVisszavon_(adat, x.id)) ki.push(karakterMentese6_5_(kar, adat, felh, ido, 'jutalom.visszavon:' + x.id));
    });
    if (x.kassza) kassza.egyenleg -= egesz_(x.kassza);
    let njk = null;
    if (x.tars && x.tars_elozo) {
      const sorok = njkSorok_();
      const n = sorok.find(function (y) { return y.id === x.tars.njk_id; });
      if (n) {
        n.kotodes = x.tars_elozo.kotodes || '';
        n.kampanyok = Array.isArray(x.tars_elozo.kampanyok) ? x.tars_elozo.kampanyok : [];
        const regi = Number(n.verzio) || 0;
        n.verzio = regi + 1;
        n.modositva = ido;
        n.modositotta = felh.n;
        sorFrissitese_('jatek', 'NJK-k', n);
        njk = { id: n.id, verzio: n.verzio, kotodes: n.kotodes, kampanyok: n.kampanyok };
      }
    }
    x.visszavonva = ido;
    x.visszavonta = felh.n;
    kasszaIrasa_(kampany, kassza);
    const erintett = [kampany.id];
    ki.forEach(function (y) { karakterKampanyai_(y.id, k).forEach(function (c) { if (erintett.indexOf(c) < 0) erintett.push(c); }); });
    kampanyVerziokNovelese_(erintett, k.kampanyok);
    valtozasNaplozasa_(felh, 'kassza.visszavon', kampany.id, '', x.id);
    return { kiosztas: x, kassza: kassza, karakterek: ki, njk: njk };
  });
}
