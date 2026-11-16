// Csatamotor (3. lépés, 4. ütem): a csaták tárolása. A szabályok és minden lépés a felületen van
// (web/js/jatek/csata.js); a felület a lépés utáni teljes állapotot küldi, itt csak verzió, dupla küldés
// szűrése, a játékos karakterek Egészségének visszaírása és a kampány verziójának növelése történik.
// Terv: claude/csata-terv.md, „Csataállapot” és „Háttér és teljesítmény”. A 4. ütemben csak a DM vezeti a csatát;
// a játékosok oldala (5. ütem) a kiadott állapot szűrésével és a saját lépések ellenőrzésével bővül.

const CSATA_ALLAPOTOK = ['kezdemenyezes', 'fut', 'lezart'];
const MAX_CSATA_MERET = 48000;
const LEZART_CSATAK_SZAMA = 10;

function csataSorok_() {
  try { return sorok_('jatek', 'Csaták'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function csataNezet_(c) {
  return {
    id: c.id, kampany_id: c.kampany_id, osszecsapas_id: c.osszecsapas_id || '', cim: c.cim, allapot: c.allapot,
    kor: Number(c.kor) || 0, adat: c.adat && typeof c.adat === 'object' ? c.adat : {},
    pillanatkepek: c.pillanatkepek && typeof c.pillanatkepek === 'object' ? c.pillanatkepek : {},
    verzio: Number(c.verzio) || 0, letrehozva: c.letrehozva, modositva: c.modositva, modositotta: c.modositotta || '', lezarva: c.lezarva || ''
  };
}

function csataKeresese_(id, sorok) {
  const c = (sorok || csataSorok_()).find(function (x) { return x.id === id; });
  if (!c) throw hiba_('nem_talalhato', 'Nincs ilyen csata.');
  return c;
}

// A kampány csatái a DM-nek (state.get): a folyamatban lévők teljes adattal, a lezártak röviden (a napló szűrőjéhez).
function kampanyCsatai_(kampany) {
  const mind = csataSorok_().filter(function (c) { return c.kampany_id === kampany.id; });
  const futo = mind.filter(function (c) { return c.allapot !== 'lezart'; }).map(csataNezet_);
  const lezart = mind.filter(function (c) { return c.allapot === 'lezart'; }).slice(-LEZART_CSATAK_SZAMA)
    .map(function (c) { return { id: c.id, cim: c.cim, allapot: 'lezart', lezarva: c.lezarva || '', osszecsapas_id: c.osszecsapas_id || '' }; });
  return futo.concat(lezart);
}

function csataAdatEllenorzes_(adat, pillanatkepek) {
  if (!adat || typeof adat !== 'object' || Array.isArray(adat) || !Array.isArray(adat.resztvevok)) throw hiba_('hibas_adat', 'Hibás csataállapot.');
  if (JSON.stringify(adat).length > MAX_CSATA_MERET) throw hiba_('tul_nagy', 'A csata állapota túl nagy egy cellához.');
  if (pillanatkepek !== undefined && JSON.stringify(pillanatkepek || {}).length > MAX_CSATA_MERET) throw hiba_('tul_nagy', 'A lények pillanatképei túl nagyok egy cellához.');
}

// A játékos karakterek Egészségének visszaírása a karakter saját állapotába (zárolás alatt hívandó).
// ertekek: { karakter id: egeszseg }. Csak a csata résztvevőiként szereplő karakterek írhatók.
function csataKarakterek_(csata, ertekek, k, felh) {
  if (!ertekek || typeof ertekek !== 'object') return [];
  const resztvevoKarakterek = (csata.adat.resztvevok || []).filter(function (r) { return r.forras && r.forras.tipus === 'karakter'; })
    .map(function (r) { return r.forras.id; });
  const irt = [];
  Object.keys(ertekek).forEach(function (kid) {
    if (resztvevoKarakterek.indexOf(kid) < 0) return;
    const kar = k.karakterek.find(function (x) { return x.id === kid; });
    if (!kar) return;
    const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
    adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
    const uj = Math.max(0, Math.round(Number(ertekek[kid]) || 0));
    // a régi szerkezetű (átvett) karakternél a felület az egeszseg.aktualis mezőből olvas
    const regiSzerk = !(Number(adat.sema) >= 1) && adat.egeszseg && typeof adat.egeszseg === 'object';
    if (adat.allapot.egeszseg === uj && (!regiSzerk || Number(adat.egeszseg.aktualis) === uj)) return;
    adat.allapot.egeszseg = uj;
    if (regiSzerk) adat.egeszseg.aktualis = uj;
    kar.adat = adat;
    kar.verzio = (Number(kar.verzio) || 0) + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    irt.push(kid);
  });
  return irt;
}

// action: combat.start (DM)   adat: { kampany_id, osszecsapas_id?, cim, adat, pillanatkepek? }
// A felület az összecsapásból (vagy gyors csataként) állítja össze az állapotot (csata.js csataOsszecsapasbol).
function csataInditasa_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány.');
  csataAdatEllenorzes_(a.adat, a.pillanatkepek);
  return zarolva_(function () {
    const k = kornyezet_();
    kampanyKeresese_(a.kampany_id, k);
    if (a.osszecsapas_id) {
      const e = osszecsapasKeresese_(a.osszecsapas_id);
      if (e.kampany_id !== a.kampany_id) throw hiba_('hibas_adat', 'Az összecsapás másik kampányé.');
    }
    const c = {
      id: ujId_('b'), kampany_id: a.kampany_id, osszecsapas_id: a.osszecsapas_id || '',
      cim: String(a.cim || 'Csata').trim().slice(0, 120) || 'Csata',
      allapot: CSATA_ALLAPOTOK.indexOf(a.adat.allapot) >= 0 ? a.adat.allapot : 'kezdemenyezes', kor: Number(a.adat.kor) || 0,
      adat: a.adat, pillanatkepek: a.pillanatkepek && typeof a.pillanatkepek === 'object' ? a.pillanatkepek : {},
      verzio: 1, letrehozva: most_(), modositva: most_(), modositotta: felh.n, lezarva: ''
    };
    sorHozzaadasa_('jatek', 'Csaták', c);
    const kv = kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'csata.indit', c.id, '', 1);
    return { csata: csataNezet_(c), kampany_verziok: kv };
  });
}

// action: combat.act (DM)   adat: { id, verzio, kulcs, adat, karakterek?: { karakter id: egeszseg }, pillanatkepek? }
// A pillanatkepek a csata közben felvett lények statblokkjai (a meglévőkhöz fűződnek).
// Egy lépés (vagy visszavonás) utáni állapot. A kulcs a dupla küldést szűri: ha már feldolgozott lépés jön
// újra, a válasz az aktuális állapot, változás nélkül. Elavult verziónál 'utkozes', benne az aktuális csata.
function csataLepese_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a csata azonosítója.');
  csataAdatEllenorzes_(a.adat);
  return zarolva_(function () {
    const k = kornyezet_();
    const c = csataKeresese_(a.id);
    const regi = Number(c.verzio) || 0;
    const kulcsok = c.adat && Array.isArray(c.adat.kulcsok) ? c.adat.kulcsok : [];
    if (a.kulcs && kulcsok.indexOf(a.kulcs) >= 0) return { csata: csataNezet_(c), ismetelt: true, kampany_verziok: {} };
    if (c.allapot === 'lezart') throw hiba_('hibas_adat', 'Ez a csata már lezárult.');
    if (Number(a.verzio) !== regi) throw hiba_('utkozes', 'A csatát közben más is léptette.', { aktualis: csataNezet_(c) });
    if (a.pillanatkepek && typeof a.pillanatkepek === 'object') {
      const pk = Object.assign({}, c.pillanatkepek && typeof c.pillanatkepek === 'object' ? c.pillanatkepek : {}, a.pillanatkepek);
      if (JSON.stringify(pk).length <= MAX_CSATA_MERET) c.pillanatkepek = pk; // ha nem fér el, a lény a szabályadatból számol
    }
    c.adat = a.adat;
    c.allapot = CSATA_ALLAPOTOK.indexOf(a.adat.allapot) >= 0 && a.adat.allapot !== 'lezart' ? a.adat.allapot : c.allapot;
    c.kor = Number(a.adat.kor) || 0;
    c.verzio = regi + 1;
    c.modositva = most_();
    c.modositotta = felh.n;
    sorFrissitese_('jatek', 'Csaták', c);
    const irt = csataKarakterek_(c, a.karakterek, k, felh);
    const kv = kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    return { csata: csataNezet_(c), verzio: c.verzio, karakterek: irt, kampany_verziok: kv };
  });
}

// action: combat.close (DM)   adat: { id, adat? }   A csata lezárása; az összecsapása „lefutott” lesz.
// (Az összesítő, az XP és az NJK-k állapotának visszaírása az 5. ütemben jön.)
function csataLezarasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const c = csataKeresese_(a.id);
    if (a.adat) { csataAdatEllenorzes_(a.adat); c.adat = a.adat; }
    c.allapot = 'lezart';
    if (c.adat && typeof c.adat === 'object') c.adat.allapot = 'lezart';
    c.lezarva = most_();
    c.verzio = (Number(c.verzio) || 0) + 1;
    c.modositva = most_();
    c.modositotta = felh.n;
    sorFrissitese_('jatek', 'Csaták', c);
    if (c.osszecsapas_id) {
      const e = osszecsapasSorok_().find(function (x) { return x.id === c.osszecsapas_id; });
      if (e) {
        e.allapot = 'lefutott';
        e.verzio = (Number(e.verzio) || 0) + 1;
        e.modositva = most_();
        e.modositotta = felh.n;
        sorFrissitese_('jatek', 'Összecsapások', e);
      }
    }
    kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'csata.lezar', c.id, '', c.verzio);
    return { csata: csataNezet_(c) };
  });
}

// action: combat.delete (DM)   adat: { id }   Elrontott vagy kipróbált csata törlése. A dobásnapló sorai maradnak.
function csataTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const c = csataKeresese_(a.id);
    sorTorlese_('jatek', 'Csaták', c._sor);
    kampanyVerziokNovelese_([c.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'csata.torol', c.id, c.verzio, '');
    return { torolve: c.id };
  });
}

// A kampány törlésekor a csatái is törlődnek (zárolás alatt hívandó).
function kampanyCsatainakTorlese_(kampanyId) {
  const sorok = csataSorok_().filter(function (c) { return c.kampany_id === kampanyId; });
  if (sorok.length) sorokTorlese_('jatek', 'Csaták', sorok.map(function (c) { return c._sor; }));
  return sorok.length;
}
