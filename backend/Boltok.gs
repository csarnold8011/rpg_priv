// Kampányjátszó 6.6: vásárlás a boltokban (Boltok lap).
//
// A DM a helyszín boltját (5.4, 5.6, az előkészítő elem `kinalat` mezője) megnyitja a csapatnak: a felülete pillanatképet
// küld a kínálatról (shop.open), az árszorzós, árszintes és kedvezményes árral, a darabszámmal és a mágikus tételek
// karakterlapra kerülő bejegyzésével. A pillanatkép a Boltok lap sorában él (kampányonként és boltonként egy sor), így az
// előkészítő elem automatikus mentésével nem ütközik, és a játékosok az elemet nem látják. A fogyás (`eladva`, tételenként
// a darabszám) a sorban marad bezárás és újranyitás után is; a DM újraindíthatja.
//
// A vásárlás és az eladás (shop.buy) egyetlen zárolt művelet: a háttér ellenőrzi, hogy a bolt nyitva van, a karaktert a
// kérő kezelheti, van elég a készletből és elég pénze a karakternek, aztán a karakter játék közbeni tételei közé írja
// (`vetel`, `eladas`, a `vasarlas_id`-vel), frissíti a pénzét és a tárgyait, és a bolt naplójába írja. Az eladási ár a
// szabályadat listaára a bolt felvásárlási arányával (a háttér számolja). A DM minden vásárlást visszavonhat (shop.undo).
//
// A játékos a state.get `boltok` kulcsában csak a nyitott boltokat kapja meg; a DM mindet.

const VASARLAS_ID_MINTA = /^vb_[a-z0-9]{6,16}$/;
const BOLT_ELEM_ID_MINTA = /^el_[a-z0-9]{6,24}$/;
const BOLT_TETEL_MAX = 150;
const BOLT_NAPLO_MAX = 80;
const NYITOTT_BOLT_MAX = 6;
const BOLT_MERET_MAX = 48000;
const KOSAR_DB_MAX = 99;

function boltSorok_() {
  try { return sorok_('jatek', 'Boltok'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function boltAdat_(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }

// A tétel szabad készlete: null, ha a bolt nem számolja (korlátlan).
function boltKeszlet_(adat, t) {
  if (t.darab === null || t.darab === undefined || t.darab === '') return null;
  const eladva = Number(boltAdat_(adat.eladva)[t.id]) || 0;
  return Math.max(0, (Number(t.darab) || 0) - eladva);
}

function boltNezet_(s) {
  const a = boltAdat_(s.adat);
  const tetelek = (Array.isArray(a.tetelek) ? a.tetelek : []).map(function (t) {
    const o = Object.assign({}, t);
    o.keszlet = boltKeszlet_(a, t);
    return o;
  });
  return {
    id: s.id, kampany_id: s.kampany_id, elem_id: s.elem_id, nev: s.nev || '', nyitva: igaz_rejtett_(s.nyitva),
    megnyitva: s.megnyitva || '', modositva: s.modositva || '', verzio: Number(s.verzio) || 0,
    hely: a.hely || '', tipus: a.tipus || '', felvasarlas: Number(a.felvasarlas) || 0, visszavasarlas: a.visszavasarlas !== false,
    csere: !!a.csere, bogo: !!a.bogo, kedvezmeny: Number(a.kedvezmeny) || 0, arszint: Number(a.arszint) || 100, megj: a.megj || '',
    tetelek: tetelek, naplo: Array.isArray(a.naplo) ? a.naplo : []
  };
}

// A state.get boltjai: a DM-nek a kampány összes boltja, a többieknek csak a nyitottak.
function kampanyBoltjai_(kampany, szerep) {
  return boltSorok_()
    .filter(function (s) { return s.kampany_id === kampany.id && (szerep === 'dm' || igaz_rejtett_(s.nyitva)); })
    .map(boltNezet_);
}

function kampanyBoltjainakTorlese_(kampanyId) {
  const sorok = boltSorok_().filter(function (s) { return s.kampany_id === kampanyId; });
  if (sorok.length) sorokTorlese_('jatek', 'Boltok', sorok.map(function (s) { return s._sor; }));
}

function boltKeresese_(kampanyId, boltId) {
  const s = boltSorok_().find(function (x) { return x.kampany_id === kampanyId && (x.id === boltId || x.elem_id === boltId); });
  if (!s) throw hiba_('nem_talalhato', 'Nincs ilyen bolt ebben a kampányban.');
  s.adat = boltAdat_(s.adat);
  return s;
}

function boltMentese_(s, felh, mit) {
  if (JSON.stringify(s.adat).length > BOLT_MERET_MAX) throw hiba_('tul_nagy', 'A bolt adata túl nagy egy cellához (túl sok tétel vagy naplósor).');
  const regi = Number(s.verzio) || 0;
  s.verzio = regi + 1;
  s.modositva = most_();
  s.modositotta = felh.n;
  sorFrissitese_('jatek', 'Boltok', s);
  valtozasNaplozasa_(felh, mit, s.id, regi, s.verzio);
}

function szovegx_(x, n) { return String(x === undefined || x === null ? '' : x).slice(0, n); }
function egeszVagyNull_(x) {
  if (x === null || x === undefined || x === '') return null;
  const n = Math.round(Number(x));
  return Number.isFinite(n) ? n : null;
}

// A felületről érkező kínálati tétel ellenőrzése és tisztítása.
function boltTetel_(t) {
  if (!t || typeof t !== 'object') throw hiba_('hibas_adat', 'Hibás kínálati tétel.');
  const id = szovegx_(t.id, 40);
  if (!id) throw hiba_('hibas_adat', 'Hiányzik a kínálati tétel azonosítója.');
  const tetel = String(t.tetel || '');
  if (tetel && !/^(fgy|pan|fel)_[a-z0-9_]+$/.test(tetel)) throw hiba_('hibas_adat', 'Hibás tételazonosító: ' + tetel);
  const ar = egeszVagyNull_(t.ar);
  if (ar === null || ar < 0) throw hiba_('hibas_adat', 'A kínálati tételnek nincs ára: ' + szovegx_(t.nev, 60));
  const darab = egeszVagyNull_(t.darab);
  const o = { id: id, tetel: tetel, nev: szovegx_(t.nev, 120) || 'Tétel', csoport: szovegx_(t.csoport, 60), ar: ar,
    lista: egeszVagyNull_(t.lista), darab: darab === null ? null : Math.max(0, darab), megj: szovegx_(t.megj, 400) };
  const eredeti = egeszVagyNull_(t.eredeti);
  if (eredeti !== null && eredeti !== ar) o.eredeti = eredeti; // a kedvezmény nélküli ár (a csapat kedvezményénél)
  if (t.magikus && typeof t.magikus === 'object') {
    const m = t.magikus;
    const alap = String(m.alap_id || '');
    o.magikus = { alap_id: /^(fgy|pan)_[a-z0-9_]+$/.test(alap) ? alap : '', bejegyzes: boltAdat_(m.bejegyzes) };
    if (JSON.stringify(o.magikus).length > 4000) throw hiba_('tul_nagy', 'A mágikus tétel leírása túl hosszú.');
  }
  return o;
}

// action: shop.open (DM)
//   adat: { kampany_id, bolt: { elem_id, nev, hely, tipus, felvasarlas, visszavasarlas, csere, bogo, kedvezmeny, arszint,
//           megj, tetelek: [{ id, tetel, nev, csoport, ar, eredeti?, lista, darab, megj, magikus? }] }, keszlet_ujra? }
// Megnyitja (vagy a friss kínálattal újranyitja) a boltot. A fogyás megmarad, hacsak a DM nem kéri az újraindítását.
function boltMegnyitasa_(a, felh) {
  const b = boltAdat_(a.bolt);
  const elemId = String(b.elem_id || '');
  if (!BOLT_ELEM_ID_MINTA.test(elemId)) throw hiba_('hibas_adat', 'Hibás bolt (előkészítő elem) azonosító.');
  const tetelek = Array.isArray(b.tetelek) ? b.tetelek : [];
  if (tetelek.length > BOLT_TETEL_MAX) throw hiba_('tul_nagy', 'Túl sok tétel egy boltban (legfeljebb ' + BOLT_TETEL_MAX + ').');
  const tiszta = tetelek.map(boltTetel_);
  return zarolva_(function () {
    const k = { kampanyok: sorok_('jatek', 'Kampányok') };
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const sorok = boltSorok_();
    let s = sorok.find(function (x) { return x.kampany_id === kampany.id && x.elem_id === elemId; });
    const nyitott = sorok.filter(function (x) { return x.kampany_id === kampany.id && igaz_rejtett_(x.nyitva) && x !== s; }).length;
    if (nyitott >= NYITOTT_BOLT_MAX) throw hiba_('hibas_adat', 'Egyszerre legfeljebb ' + NYITOTT_BOLT_MAX + ' bolt lehet nyitva. Előbb zárj be egyet.');
    const ido = most_();
    const regi = s ? boltAdat_(s.adat) : {};
    const adat = {
      hely: szovegx_(b.hely, 200), tipus: szovegx_(b.tipus, 120),
      felvasarlas: Math.max(0, Math.min(200, egeszVagyNull_(b.felvasarlas) === null ? 25 : egeszVagyNull_(b.felvasarlas))),
      visszavasarlas: b.visszavasarlas !== false, csere: !!b.csere, bogo: !!b.bogo,
      kedvezmeny: Math.max(0, Math.min(100, egeszVagyNull_(b.kedvezmeny) || 0)), arszint: egeszVagyNull_(b.arszint) || 100,
      megj: szovegx_(b.megj, 600), tetelek: tiszta,
      eladva: a.keszlet_ujra ? {} : boltAdat_(regi.eladva),
      naplo: Array.isArray(regi.naplo) ? regi.naplo : []
    };
    if (s) {
      s.nev = szovegx_(b.nev, 120) || s.nev;
      s.nyitva = true;
      s.megnyitva = ido;
      s.adat = adat;
      boltMentese_(s, felh, 'bolt.megnyit');
    } else {
      s = { id: ujId_('bo'), kampany_id: kampany.id, elem_id: elemId, nev: szovegx_(b.nev, 120) || 'Bolt', nyitva: true,
        adat: adat, verzio: 1, megnyitva: ido, modositva: ido, modositotta: felh.n };
      if (JSON.stringify(adat).length > BOLT_MERET_MAX) throw hiba_('tul_nagy', 'A bolt adata túl nagy egy cellához.');
      sorHozzaadasa_('jatek', 'Boltok', s);
      valtozasNaplozasa_(felh, 'bolt.megnyit', s.id, '', 1);
    }
    kampanyVerziokNovelese_([kampany.id], k.kampanyok);
    return { bolt: boltNezet_(s) };
  });
}

// action: shop.close (DM)   adat: { kampany_id, bolt_id, torol? }
// Bezárja a boltot (a játékosok nem látják tovább). torol: a bolt sora a naplójával és a fogyással együtt törlődik.
function boltBezarasa_(a, felh) {
  return zarolva_(function () {
    const k = { kampanyok: sorok_('jatek', 'Kampányok') };
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const s = boltKeresese_(kampany.id, String(a.bolt_id || ''));
    if (a.torol) {
      sorokTorlese_('jatek', 'Boltok', [s._sor]);
      valtozasNaplozasa_(felh, 'bolt.torol', s.id, s.verzio, '');
      kampanyVerziokNovelese_([kampany.id], k.kampanyok);
      return { torolve: s.id };
    }
    s.nyitva = false;
    boltMentese_(s, felh, 'bolt.bezar');
    kampanyVerziokNovelese_([kampany.id], k.kampanyok);
    return { bolt: boltNezet_(s) };
  });
}

// A szabályadat eleme: { ar (listaár rézben, mint a felületen: varazslo.js arRez, vagy null), nev }, vagy null.
function szabalyTargy_(id) {
  const lap = id.indexOf('fgy_') === 0 ? 'Fegyverek' : id.indexOf('pan_') === 0 ? 'Páncélok' : 'Felszerelés';
  let sorok = [];
  try { sorok = sorok_('szabaly', lap); } catch (e) { return null; }
  const s = sorok.find(function (x) { return x.id === id; });
  if (!s) return null;
  const nev = String(s.nev_hu || id);
  const r = boltAdat_(s.reszletek);
  if (r.ar_rez !== undefined && r.ar_rez !== null && r.ar_rez !== '' && Number.isFinite(Number(r.ar_rez))) return { ar: Number(r.ar_rez), nev: nev };
  const m = String(s.ar || '').replace(',', '.').match(/([\d.]+)\s*(arany|ezüst|réz)/i);
  if (!m) return { ar: null, nev: nev };
  return { ar: Math.round(parseFloat(m[1]) * { arany: 100, 'ezüst': 10, 'réz': 1 }[m[2].toLowerCase()]), nev: nev };
}

// A kosár egységárai a „két tételből az olcsóbb féláron” üzletrészlettel (mint a felületen: web/js/kampany/vasarlas.js
// kosarArak): az egységek ár szerint csökkenő sorban, minden második fele áron (lefelé kerekített engedménnyel).
// sorok: [{ ar, db }]. Visszaad: soronként a fizetendő összeg.
function kosarArak_(sorok, bogo) {
  const egysegek = [];
  sorok.forEach(function (s, i) { for (let j = 0; j < s.db; j++) egysegek.push({ i: i, ar: s.ar }); });
  egysegek.sort(function (x, y) { return y.ar - x.ar || x.i - y.i; });
  const ki = sorok.map(function () { return 0; });
  egysegek.forEach(function (e, n) { ki[e.i] += bogo && n % 2 === 1 ? e.ar - Math.floor(e.ar / 2) : e.ar; });
  return ki;
}

function karakterFelszerelese_(adat) {
  adat.felszereles = adat.felszereles && typeof adat.felszereles === 'object' ? adat.felszereles : {};
  const f = adat.felszereles;
  f.jatek = Array.isArray(f.jatek) ? f.jatek : [];
  f.targyak = Array.isArray(f.targyak) ? f.targyak : [];
  return f;
}

function targyValtozas_(f, id, nev, db) {
  const m = f.targyak.find(function (x) { return x && x.id === id; });
  if (m) m.db = (Number(m.db) || 0) + db;
  else if (db > 0) f.targyak.push(nev ? { id: id, db: db, felszerelve: false, nev: nev } : { id: id, db: db, felszerelve: false });
  f.targyak = f.targyak.filter(function (x) { return x && (Number(x.db) || 0) > 0; });
}

// A leltárba kerülő azonosító: a szabályadat eleme; a mágikus tétel a szabályadat elemének egyedi változata
// (`fgy_…~vb_…`) vagy saját; az egyedi tétel saját, a nevéből (így az azonos nevűek összeadódnak).
function vettTargyAzonosito_(t, vasarlasId, n) {
  if (t.magikus) return (t.magikus.alap_id ? t.magikus.alap_id + '~' : 'sajat:') + vasarlasId + (n ? '_' + n : '');
  if (t.tetel) return t.tetel;
  return 'sajat:' + String(t.nev || 'tetel').toLowerCase().replace(/\s+/g, '_').slice(0, 40);
}

// action: shop.buy (a kampány tagja a saját karakteréért, a mesterjátékos a kampány karaktereiért, a DM bárkiért)
//   adat: { kampany_id, bolt_id, id: 'vb_…', karakter_id, fajta: 'vetel' | 'eladas',
//           tetelek: [{ tetel_id, db }] (vételnél), targyak: [{ targy, db }] (eladásnál) }
// Visszaad: { vasarlas, bolt, karakter: { id, verzio, modositva, adat } }. Ismételt küldésnél a meglévőt (ismetelt: true).
function boltVasarlas_(a, felh) {
  const id = String(a.id || '');
  if (!VASARLAS_ID_MINTA.test(id)) throw hiba_('hibas_adat', 'Hibás vásárlásazonosító.');
  const fajta = a.fajta === 'eladas' ? 'eladas' : 'vetel';
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const szerep = kampanySzerep_(felh, kampany, k);
    if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    const s = boltKeresese_(kampany.id, String(a.bolt_id || ''));
    const b = s.adat;
    b.naplo = Array.isArray(b.naplo) ? b.naplo : [];
    const meglevo = b.naplo.find(function (x) { return x && x.id === id; });
    if (meglevo) return { ismetelt: true, vasarlas: meglevo, bolt: boltNezet_(s) };
    if (!igaz_rejtett_(s.nyitva) && felh.r !== 'dm') throw hiba_('hibas_adat', 'A bolt közben bezárt.');
    if (b.csere) throw hiba_('hibas_adat', 'Ez a bolt csak cserekereskedelmet folytat: a cserét a DM-mel egyeztesd.');
    const tagok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; }).map(function (x) { return x.karakter_id; });
    if (tagok.indexOf(a.karakter_id) < 0) throw hiba_('hibas_adat', 'A karakter nincs ebben a kampányban.');
    const kar = karakterKeresese_(a.karakter_id, k);
    if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ezt a karaktert nem kezelheted.');
    const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
    const f = karakterFelszerelese_(adat);
    const ido = most_();
    const hol = s.nev + (b.hely ? ' (' + b.hely + ')' : '');
    const naplo = { id: id, fajta: fajta, idopont: ido, ki: felh.n, karakter_id: kar.id, karakter_nev: kar.nev || '', tetelek: [], osszeg: 0 };

    if (fajta === 'vetel') {
      const kert = {};
      (Array.isArray(a.tetelek) ? a.tetelek : []).forEach(function (x) {
        const db = Math.round(Number(x && x.db) || 0);
        if (x && x.tetel_id && db > 0) kert[x.tetel_id] = (kert[x.tetel_id] || 0) + db;
      });
      const sorok = Object.keys(kert).map(function (tid) {
        const t = (b.tetelek || []).find(function (y) { return y.id === tid; });
        if (!t) throw hiba_('hibas_adat', 'Ez a tétel már nincs a kínálatban.');
        const db = kert[tid];
        if (db > KOSAR_DB_MAX) throw hiba_('hibas_adat', 'Túl nagy darabszám.');
        if (t.magikus && db > 1) throw hiba_('hibas_adat', 'A mágikus tárgyból egyszerre egy vehető.');
        const keszlet = boltKeszlet_(b, t);
        if (keszlet !== null && db > keszlet) {
          throw hiba_('elfogyott', keszlet ? t.nev + ': csak ' + keszlet + ' darab van.' : t.nev + ': elfogyott.', { tetel_id: t.id, keszlet: keszlet });
        }
        return { t: t, db: db, ar: Number(t.ar) || 0 };
      });
      if (!sorok.length) throw hiba_('hianyzo_adat', 'Üres a kosár.');
      const fizet = kosarArak_(sorok, b.bogo);
      const osszeg = fizet.reduce(function (n, x) { return n + x; }, 0);
      const penz = Math.round(Number(f.penz_rez) || 0);
      if (osszeg > penz && felh.r !== 'dm') throw hiba_('nincs_penz', 'Nincs elég pénz: ' + osszeg + ' réz kellene, ' + penz + ' réz van.', { kell: osszeg, van: penz });
      let magikusSzam = 0;
      sorok.forEach(function (x, i) {
        const t = x.t;
        const tid = vettTargyAzonosito_(t, id, t.magikus ? magikusSzam++ : 0);
        const nevKell = !t.tetel || !!t.magikus;
        const tetel = { tipus: 'vetel', targy: tid, db: x.db, penz: -fizet[i], hol: hol, vasarlas_id: id, idopont: ido };
        if (nevKell) tetel.nev = t.nev;
        f.jatek.push(tetel);
        targyValtozas_(f, tid, nevKell ? t.nev : '', x.db);
        if (t.magikus) {
          const j = JSON.parse(JSON.stringify(boltAdat_(t.magikus.bejegyzes)));
          j.fajta = j.fajta === 'ereklye' ? 'ereklye' : 'targy';
          j.nev = szovegx_(j.nev || t.nev, 120);
          j.id = id + '_' + i;
          j.targy_id = tid;
          j.vasarlas_id = id;
          j.idopont = ido;
          j.ki = felh.n;
          j.kampany_id = kampany.id;
          j.honnan = hol;
          adat.jutalmak = Array.isArray(adat.jutalmak) ? adat.jutalmak : [];
          if (adat.jutalmak.length >= JUTALOM_BEJEGYZES_MAX) throw hiba_('tul_nagy', 'A karakternek túl sok jutalombejegyzése van.');
          adat.jutalmak.push(j);
        }
        b.eladva = boltAdat_(b.eladva);
        b.eladva[t.id] = (Number(b.eladva[t.id]) || 0) + x.db;
        naplo.tetelek.push({ tetel_id: t.id, targy: tid, nev: t.nev, db: x.db, ar: t.ar, fizet: fizet[i] });
      });
      f.penz_rez = penz - osszeg;
      naplo.osszeg = -osszeg;
    } else {
      if (b.visszavasarlas === false) throw hiba_('hibas_adat', 'Ez a bolt nem vásárol fel (végkiárusítás).');
      const kert = {};
      (Array.isArray(a.targyak) ? a.targyak : []).forEach(function (x) {
        const db = Math.round(Number(x && x.db) || 0);
        if (x && x.targy && db > 0) kert[x.targy] = (kert[x.targy] || 0) + db;
      });
      const ids = Object.keys(kert);
      if (!ids.length) throw hiba_('hianyzo_adat', 'Nincs mit eladni.');
      let osszeg = 0;
      ids.forEach(function (tid) {
        if (!/^(fgy|pan|fel)_[a-z0-9_]+$/.test(tid)) throw hiba_('hibas_adat', 'Ezt a tárgyat a bolt nem vásárolja fel (egyedi vagy mágikus tárgy: egyeztesd a DM-mel).');
        const van = f.targyak.find(function (x) { return x && x.id === tid; });
        const db = kert[tid];
        if (!van || (Number(van.db) || 0) < db) throw hiba_('hibas_adat', 'Nincs ennyi a karakternél ebből a tárgyból.');
        const elem = szabalyTargy_(tid);
        if (!elem || elem.ar === null) throw hiba_('hibas_adat', 'Ennek a tárgynak nincs listaára.');
        const ar = Math.round(elem.ar * (Number(b.felvasarlas) || 0) / 100);
        f.jatek.push({ tipus: 'eladas', targy: tid, db: -db, penz: ar * db, hol: hol, vasarlas_id: id, idopont: ido });
        targyValtozas_(f, tid, '', -db);
        osszeg += ar * db;
        naplo.tetelek.push({ targy: tid, nev: szovegx_(van.nev || elem.nev, 120), db: db, ar: ar, fizet: ar * db });
      });
      f.penz_rez = Math.round(Number(f.penz_rez) || 0) + osszeg;
      naplo.osszeg = osszeg;
    }

    b.naplo.push(naplo);
    if (b.naplo.length > BOLT_NAPLO_MAX) b.naplo.splice(0, b.naplo.length - BOLT_NAPLO_MAX);
    const karakter = karakterMentese6_5_(kar, adat, felh, ido, 'bolt.' + fajta + ':' + id);
    boltMentese_(s, felh, 'bolt.' + fajta + ':' + id);
    const erintett = [kampany.id];
    karakterKampanyai_(kar.id, k).forEach(function (c) { if (erintett.indexOf(c) < 0) erintett.push(c); });
    kampanyVerziokNovelese_(erintett, k.kampanyok);
    return { vasarlas: naplo, bolt: boltNezet_(s), karakter: karakter };
  });
}

// action: shop.undo (DM)   adat: { kampany_id, bolt_id, id }
// A vásárlás vagy eladás visszavonása: a karakterről lekerülnek a tételei (a pénz és a tárgyak visszaszámolva) és a
// mágikus tárgy bejegyzése, a bolt fogyása visszaáll. A naplóban „visszavonva” jel marad.
function boltVisszavonas_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const s = boltKeresese_(kampany.id, String(a.bolt_id || ''));
    const b = s.adat;
    const x = (Array.isArray(b.naplo) ? b.naplo : []).find(function (y) { return y && y.id === a.id; });
    if (!x) throw hiba_('nem_talalhato', 'Nincs ilyen vásárlás a bolt naplójában.');
    if (x.visszavonva) return { vasarlas: x, bolt: boltNezet_(s) };
    const ido = most_();
    let karakter = null;
    const kar = k.karakterek.find(function (c) { return c.id === x.karakter_id; });
    if (kar) {
      const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
      const f = karakterFelszerelese_(adat);
      let valtozott = false;
      const marad = [];
      f.jatek.forEach(function (t) {
        if (!t || t.vasarlas_id !== x.id) { marad.push(t); return; }
        valtozott = true;
        f.penz_rez = Math.round(Number(f.penz_rez) || 0) - Math.round(Number(t.penz) || 0);
        if (t.targy && t.db) targyValtozas_(f, t.targy, t.nev || '', -Math.round(Number(t.db) || 0));
      });
      f.jatek = marad;
      if (Array.isArray(adat.jutalmak)) {
        const n = adat.jutalmak.length;
        adat.jutalmak = adat.jutalmak.filter(function (j) { return !j || j.vasarlas_id !== x.id; });
        if (adat.jutalmak.length !== n) valtozott = true;
      }
      if (valtozott) karakter = karakterMentese6_5_(kar, adat, felh, ido, 'bolt.visszavon:' + x.id);
    }
    if (x.fajta === 'vetel') {
      b.eladva = boltAdat_(b.eladva);
      (x.tetelek || []).forEach(function (t) {
        if (!t.tetel_id) return;
        b.eladva[t.tetel_id] = Math.max(0, (Number(b.eladva[t.tetel_id]) || 0) - (Number(t.db) || 0));
      });
    }
    x.visszavonva = ido;
    x.visszavonta = felh.n;
    boltMentese_(s, felh, 'bolt.visszavon:' + x.id);
    const erintett = [kampany.id];
    if (kar) karakterKampanyai_(kar.id, k).forEach(function (c) { if (erintett.indexOf(c) < 0) erintett.push(c); });
    kampanyVerziokNovelese_(erintett, k.kampanyok);
    return { vasarlas: x, bolt: boltNezet_(s), karakter: karakter };
  });
}
