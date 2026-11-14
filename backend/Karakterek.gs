// Karakterek: önálló elemek, kampánytól függetlenül léteznek.
// A teljes karakter az `adat` oszlopban van JSON-ban; a kulcsoszlopok (nev, faj, osztaly, szint) listázáshoz kellenek.

const MAX_KARAKTER_MERET = 48000; // egy Sheets cella legfeljebb 50 000 karaktert tárol

function karakterOsszefoglalo_(kar, k, felh) {
  return {
    id: kar.id, nev: kar.nev, jatekos_id: kar.jatekos_id || '', faj: kar.faj, osztaly: kar.osztaly,
    szint: kar.szint, verzio: Number(kar.verzio) || 0, modositva: kar.modositva, aktiv: igaz_(kar.aktiv),
    kampanyok: karakterKampanyai_(kar.id, k),
    irhato: felh ? karakterIrhato_(felh, kar, k) : false,
    // a karakterkészítés állapota a listák „Piszkozat” címkéjéhez (piszkozat | kesz | atvett)
    keszites: kar.adat && typeof kar.adat === 'object' && kar.adat.keszites ? (kar.adat.keszites.allapot || '') : '',
    kep: karakterBelyeg_(kar),
    xp: kar.adat && typeof kar.adat === 'object' && kar.adat.allapot ? (Number(kar.adat.allapot.xp) || 0) : 0
  };
}

// A karakterkép bélyegének Drive-azonosítója (a listákhoz), vagy üres.
function karakterBelyeg_(kar) {
  const kep = kar.adat && typeof kar.adat === 'object' && kar.adat.alap && kar.adat.alap.kep;
  return kep && typeof kep === 'object' ? (kep.belyeg || kep.kep || '') : '';
}

function karakterTeljes_(kar, k, felh) {
  const o = karakterOsszefoglalo_(kar, k, felh);
  o.adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
  return o;
}

function kulcsmezok_(kar, adat) {
  if (adat.nev) kar.nev = adat.nev;
  if (adat.faj !== undefined) kar.faj = adat.faj;
  if (adat.osztaly !== undefined) kar.osztaly = adat.osztaly;
  if (adat.szint !== undefined) kar.szint = adat.szint;
}

function meretEllenorzes_(adat) {
  if (JSON.stringify(adat).length > MAX_KARAKTER_MERET) throw hiba_('tul_nagy', 'A karakter adatai túl nagyok egy cellához.');
}

// action: characters.list
// Az archivált (aktiv = hamis) karaktereket csak a DM látja.
function karakterLista_(a, felh, kornyezet) {
  const k = kornyezet || kornyezet_();
  const lista = k.karakterek
    .filter(function (kar) { return karakterIrhato_(felh, kar, k) && (felh.r === 'dm' || igaz_(kar.aktiv)); })
    .map(function (kar) { return karakterOsszefoglalo_(kar, k, felh); });
  return { karakterek: lista };
}

// action: character.get   adat: { id }
function karakterLekerese_(a, felh) {
  const k = kornyezet_();
  const kar = karakterKeresese_(a.id, k);
  if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ehhez a karakterhez nincs hozzáférésed.');
  return { karakter: karakterTeljes_(kar, k, felh) };
}

// action: character.create   adat: { nev, adat?, jatekos_id?, kampany_id? }
// DM: bárkinek létrehozhat, és kampányhoz is rendelheti.
// Mesterjátékos: kampany_id-vel a saját kampányába hoz létre játékos nélküli karaktert.
// Játékos: saját magának hoz létre karaktert (kampányhoz a DM rendeli).
function karakterLetrehozasa_(a, felh) {
  const adat = a.adat && typeof a.adat === 'object' ? a.adat : {};
  const nev = String(a.nev || adat.nev || '').trim();
  if (!nev) throw hiba_('hianyzo_adat', 'Adj nevet a karakternek.');
  adat.nev = nev;
  meretEllenorzes_(adat);

  return zarolva_(function () {
    const k = kornyezet_();
    let jatekosId = '';
    let kampanyId = '';
    if (felh.r === 'dm') {
      jatekosId = a.jatekos_id || '';
      kampanyId = a.kampany_id || '';
    } else if (a.kampany_id && mesterKampanyai_(felh, k).indexOf(a.kampany_id) >= 0) {
      jatekosId = a.jatekos_id || '';
      kampanyId = a.kampany_id;
    } else {
      jatekosId = felh.u;
    }
    if (kampanyId) kampanyKeresese_(kampanyId, k);

    const kar = { id: ujId_('k'), nev: nev, jatekos_id: jatekosId, faj: '', osztaly: '', szint: '', adat: adat,
      verzio: 1, modositva: most_(), modositotta: felh.n, aktiv: true };
    kulcsmezok_(kar, adat);
    sorHozzaadasa_('jatek', 'Karakterek', kar);
    if (kampanyId) {
      sorHozzaadasa_('jatek', 'Kampánykarakterek', { kampany_id: kampanyId, karakter_id: kar.id, allapot: 'aktív', csatlakozott: most_() });
      k.kapcsolatok.push({ kampany_id: kampanyId, karakter_id: kar.id });
      kampanyVerziokNovelese_([kampanyId], k.kampanyok);
    }
    valtozasNaplozasa_(felh, 'karakter.letrehoz', kar.id, '', 1);
    k.karakterek.push(kar);
    return { karakter: karakterTeljes_(kar, k, felh) };
  });
}

// action: character.save   adat: { id, verzio, adat, aktiv? }
// A verzio az a verziószám, amelyből a felület a módosítást készítette. Ha közben más mentett,
// a válasz hiba: 'utkozes', és benne van az aktuális karakter az összefésüléshez.
function karakterMentese_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a karakter azonosítója.');
  const adat = a.adat && typeof a.adat === 'object' ? a.adat : null;
  if (!adat) throw hiba_('hianyzo_adat', 'Hiányoznak a karakter adatai.');
  meretEllenorzes_(adat);

  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ezt a karaktert nem szerkesztheted.');
    const regi = Number(kar.verzio) || 0;
    if (Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'A karaktert közben más is módosította.', { aktualis: karakterTeljes_(kar, k, felh) });
    }
    kar.adat = adat;
    kulcsmezok_(kar, adat);
    if (a.aktiv !== undefined && (felh.r === 'dm')) kar.aktiv = !!a.aktiv;
    kar.verzio = regi + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    const kampanyVerziok = kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, 'karakter.ment', kar.id, regi, kar.verzio);
    return { verzio: kar.verzio, modositva: kar.modositva, kampany_verziok: kampanyVerziok };
  });
}

// action: character.assign (csak DM)   adat: { karakter_id, jatekos_id }  (üres jatekos_id = társítás törlése)
function karakterTarsitasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.karakter_id, k);
    const jatekosId = a.jatekos_id || '';
    if (jatekosId) {
      const van = sorok_('jatek', 'Felhasználók').some(function (f) { return f.id === jatekosId; });
      if (!van) throw hiba_('nem_talalhato', 'Nincs ilyen felhasználó.');
    }
    const regi = Number(kar.verzio) || 0;
    kar.jatekos_id = jatekosId;
    kar.verzio = regi + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, 'karakter.tarsit:' + (jatekosId || 'nincs'), kar.id, regi, kar.verzio);
    return { karakter: karakterOsszefoglalo_(kar, k, felh) };
  });
}

// action: character.archive (csak DM)   adat: { id, aktiv }
// Archivált karakter: a játékosok és a kampány nézete nem mutatja, a DM visszaállíthatja.
function karakterArchivalasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    kar.aktiv = !!a.aktiv;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, kar.aktiv ? 'karakter.visszaallit' : 'karakter.archival', kar.id, '', '');
    return { karakter: karakterOsszefoglalo_(kar, k, felh) };
  });
}

// action: character.delete (csak DM)   adat: { id }
// Csak archivált karakter törölhető. A kampánykapcsolatai is törlődnek, a dobásnapló marad.
function karakterTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    if (igaz_(kar.aktiv)) throw hiba_('hibas_adat', 'Csak archivált karakter törölhető. Előbb archiváld.');
    const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.karakter_id === kar.id; });
    kampanyVerziokNovelese_(kapcsolatok.map(function (x) { return x.kampany_id; }), k.kampanyok);
    sorokTorlese_('jatek', 'Kampánykarakterek', kapcsolatok.map(function (x) { return x._sor; }));
    sorTorlese_('jatek', 'Karakterek', kar._sor);
    kepekKukaba_(kar.adat && kar.adat.alap && kar.adat.alap.kep);
    valtozasNaplozasa_(felh, 'karakter.torol', kar.id, kar.verzio, '');
    return { torolve: kar.id };
  });
}

// ---- Tapasztalati pont (XP) ----

// action: character.xp (csak DM)
//   adat: { tetelek: [{ karakter_id, xp }], ok, tipus, kampany_id? }
// Karakterenként hozzáadja az XP-t (negatív is lehet, javításhoz), és naplózza a karakter xp_naplo listájában.
// tipus: talalkozas | bonusz | szerep | szintjutalom | javitas (a felület súgójához és a naplóhoz).
const XP_NAPLO_MAX = 300;
function karakterXp_(a, felh) {
  const tetelek = Array.isArray(a.tetelek) ? a.tetelek.filter(function (t) { return t && t.karakter_id; }) : [];
  if (!tetelek.length) throw hiba_('hianyzo_adat', 'Nincs kiválasztott karakter.');
  return zarolva_(function () {
    const k = kornyezet_();
    const ki = [];
    const kampanyok = {};
    const ido = most_();
    tetelek.forEach(function (t) {
      const kar = karakterKeresese_(t.karakter_id, k);
      const xp = Math.round(Number(t.xp) || 0);
      const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
      adat.allapot = adat.allapot && typeof adat.allapot === 'object' ? adat.allapot : {};
      adat.allapot.xp = (Number(adat.allapot.xp) || 0) + xp;
      const bejegyzes = { idopont: ido, xp: xp, ok: String(a.ok || '').slice(0, 200), tipus: String(a.tipus || ''), ki: felh.n, kampany_id: a.kampany_id || '' };
      adat.xp_naplo = Array.isArray(adat.xp_naplo) ? adat.xp_naplo : [];
      adat.xp_naplo.push(bejegyzes);
      if (adat.xp_naplo.length > XP_NAPLO_MAX) adat.xp_naplo.splice(0, adat.xp_naplo.length - XP_NAPLO_MAX);
      meretEllenorzes_(adat);
      const regi = Number(kar.verzio) || 0;
      kar.adat = adat;
      kar.verzio = regi + 1;
      kar.modositva = ido;
      kar.modositotta = felh.n;
      sorFrissitese_('jatek', 'Karakterek', kar);
      karakterKampanyai_(kar.id, k).forEach(function (id) { kampanyok[id] = true; });
      valtozasNaplozasa_(felh, 'karakter.xp:' + xp, kar.id, regi, kar.verzio);
      ki.push({ id: kar.id, verzio: kar.verzio, modositva: ido, xp: adat.allapot.xp, bejegyzes: bejegyzes });
    });
    kampanyVerziokNovelese_(Object.keys(kampanyok), k.kampanyok);
    return { karakterek: ki };
  });
}

// ---- Karakterkép (Drive, FantasyAge/Karakterképek, nem megosztott fájlok) ----

const MAX_KEP_MERET = 2000000; // base64 karakter, kb. 1,5 MB kép

function kepMappa_() {
  const id = beallitas_('KEPMAPPA_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* törölték: újra létrehozzuk */ }
  }
  const mappa = mappa_(DriveApp.getFolderById(beallitas_('MAPPA_ID')), 'Karakterképek');
  PropertiesService.getScriptProperties().setProperty('KEPMAPPA_ID', mappa.getId());
  CacheService.getScriptCache().put('prop_KEPMAPPA_ID', mappa.getId(), BEALLITAS_CACHE_MP);
  return mappa;
}

function kepekKukaba_(kep) {
  if (!kep || typeof kep !== 'object') return;
  [kep.kep, kep.belyeg].filter(Boolean).forEach(function (id) {
    try { DriveApp.getFileById(id).setTrashed(true); } catch (e) { /* már nincs meg */ }
  });
}

// action: character.image.set   adat: { id, kep, belyeg }  (base64 JPEG; kep nélkül: a kép törlése)
// A karakter adatában csak a fájlazonosítók és egy verziószám (alap.kep) tárolódik.
function karakterKepBeallitasa_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a karakter azonosítója.');
  if (a.kep && (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET)) {
    throw hiba_('tul_nagy', 'A kép túl nagy.');
  }
  return zarolva_(function () {
    const k = kornyezet_();
    const kar = karakterKeresese_(a.id, k);
    if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ezt a karaktert nem szerkesztheted.');
    const adat = kar.adat && typeof kar.adat === 'object' ? kar.adat : {};
    adat.alap = adat.alap && typeof adat.alap === 'object' ? adat.alap : {};
    const regi = adat.alap.kep && typeof adat.alap.kep === 'object' ? adat.alap.kep : null;
    let uj = null;
    if (a.kep) {
      const mappa = kepMappa_();
      const v = (regi ? Number(regi.verzio) || 0 : 0) + 1;
      const fajl = function (b64, nev) {
        return mappa.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', kar.id + '_' + nev + '_' + v + '.jpg'));
      };
      const kepFajl = fajl(a.kep, 'kep');
      const belyegFajl = a.belyeg ? fajl(a.belyeg, 'belyeg') : null;
      uj = { kep: kepFajl.getId(), belyeg: belyegFajl ? belyegFajl.getId() : kepFajl.getId(), verzio: v };
    }
    kepekKukaba_(regi);
    adat.alap.kep = uj;
    const verzio = (Number(kar.verzio) || 0);
    kar.adat = adat;
    kar.verzio = verzio + 1;
    kar.modositva = most_();
    kar.modositotta = felh.n;
    sorFrissitese_('jatek', 'Karakterek', kar);
    kampanyVerziokNovelese_(karakterKampanyai_(kar.id, k), k.kampanyok);
    valtozasNaplozasa_(felh, uj ? 'karakter.kep' : 'karakter.kep:torol', kar.id, verzio, kar.verzio);
    return { verzio: kar.verzio, modositva: kar.modositva, kep: uj };
  });
}

// action: image.get   adat: { idk: [fájlazonosító] }  → { kepek: { id: base64 } }
// Csak olyan karakter képe kérhető le, amelyet a felhasználó láthat (a sajátja, vagy egy közös kampány tagja).
function kepekLekerese_(a, felh) {
  const idk = (Array.isArray(a.idk) ? a.idk : []).slice(0, 60);
  const k = kornyezet_();
  const engedett = {};
  k.karakterek.forEach(function (kar) {
    const kep = kar.adat && typeof kar.adat === 'object' && kar.adat.alap && kar.adat.alap.kep;
    if (kep && typeof kep === 'object' && karakterLathato_(felh, kar, k)) {
      if (kep.kep) engedett[kep.kep] = true;
      if (kep.belyeg) engedett[kep.belyeg] = true;
    }
  });
  const kepek = {};
  idk.forEach(function (id) {
    if (!engedett[id]) return;
    try { kepek[id] = Utilities.base64Encode(DriveApp.getFileById(id).getBlob().getBytes()); } catch (e) { /* törölt fájl */ }
  });
  return { kepek: kepek };
}
