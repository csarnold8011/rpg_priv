// Kampányjátszó 6.2: kiosztható anyagok (levél, irat, nyom, kép, képrészlet, részlet) és alanyaik.
// Minden a Megosztások lapon él: tipus 'anyag' (kiosztott anyag) vagy 'alany' (akiről vagy amiről a részletek szólnak).
// A régi, egycímzettes sorok (tipus 'njk', 'kep', 'level', 'szoveg') változatlanul működnek.
//
// Az anyag pillanatkép: a szöveg és a kivágott kép másolatként kerül a sorba, illetve a Drive „Kiosztások” mappájába,
// így ha a DM később átírja az előkészítő elemet, a játékos nem lát többet. A játékos az anyagot csak szűrve kapja meg
// (forrás és DM-adat nélkül), az alanynak pedig csak az ismert nevét (a valódit csak felfedés után).

const ANYAG_FAJTAK = ['level', 'nyom', 'kep', 'kepreszlet', 'reszlet'];
const ALANY_KATEGORIAK = ['szemely', 'hely', 'targy', 'egyeb'];
const LEVEL_MEZOK = ['felado', 'cimzett', 'alairas', 'pecset', 'kezires', 'allapot'];
const MAX_ANYAG_SZOVEG = 20000;
const MAX_ANYAG_KEP = 6;

function szoveg_(x, max) { return String(x === undefined || x === null ? '' : x).slice(0, max || 500); }

// A sor címzettjei listaként ('mindenki' vagy karakterazonosítók); a régi sorokban egyetlen cimzett mező van.
function megosztasCimzettjei_(m) {
  const l = Array.isArray(m.cimzettek) && m.cimzettek.length ? m.cimzettek : [m.cimzett || 'mindenki'];
  return l.map(String);
}

// Látja-e a sort a kérő. szerep: 'dm', 'mester', 'jatekos'; sajat: a kérő által írható karakterek a kampányban.
// Az alanysorokat a játékos nem így kapja (lásd alanyokJatekosnak_).
function megosztasLathato_(m, szerep, sajat) {
  if (szerep === 'dm') return true;
  if (m.tipus === 'alany') return false;
  if (m.allapot === 'visszavont') return false;
  if (szerep === 'mester') return true; // a mesterjátékos a kampány összes karakterét kezeli
  const c = megosztasCimzettjei_(m);
  return c.indexOf('mindenki') >= 0 || c.some(function (id) { return sajat.indexOf(id) >= 0; });
}

// Az anyag adatának tisztítása (csak az ismert mezők, hosszkorláttal).
function anyagAdatTisztit_(x) {
  const a = objektum_(x);
  const o = { fajta: ANYAG_FAJTAK.indexOf(a.fajta) >= 0 ? a.fajta : 'nyom', szoveg: szoveg_(a.szoveg, MAX_ANYAG_SZOVEG) };
  if (o.fajta === 'level') {
    const l = objektum_(a.level);
    o.level = {};
    LEVEL_MEZOK.forEach(function (m) { o.level[m] = szoveg_(l[m], 300); });
  }
  o.kepek = (Array.isArray(a.kepek) ? a.kepek : []).slice(0, MAX_ANYAG_KEP).filter(function (k) { return k && k.kep; }).map(function (k) {
    return { kep: szoveg_(k.kep, 100), belyeg: szoveg_(k.belyeg || k.kep, 100), cim: szoveg_(k.cim, 120),
      szel: Number(k.szel) || 0, mag: Number(k.mag) || 0, terkep: k.terkep === true };
  });
  const f = objektum_(a.forras);
  if (f.id || f.nev) o.forras = { tipus: szoveg_(f.tipus, 30), id: szoveg_(f.id, 60), nev: szoveg_(f.nev, 200), anyag: szoveg_(f.anyag, 60) };
  if (a.elozo) o.elozo = szoveg_(a.elozo, 60);
  return o;
}

function alanyAdatTisztit_(x, regi) {
  const a = objektum_(x);
  const r = objektum_(regi);
  const v = objektum_(a.valodi !== undefined ? a.valodi : r.valodi);
  return {
    kategoria: ALANY_KATEGORIAK.indexOf(a.kategoria) >= 0 ? a.kategoria : (r.kategoria || 'egyeb'),
    valodi: { tipus: szoveg_(v.tipus, 30), id: szoveg_(v.id, 60), nev: szoveg_(v.nev, 200) },
    felfedve: a.felfedve !== undefined ? a.felfedve === true : r.felfedve === true,
    osszekapcsolva: a.osszekapcsolva !== undefined ? szoveg_(a.osszekapcsolva, 60) : (r.osszekapcsolva || ''),
    jegyzet: a.jegyzet !== undefined ? szoveg_(a.jegyzet, 2000) : (r.jegyzet || '')
  };
}

// Eléri-e a láncot id-től indulva a keresett alany (körfigyeléshez).
function alanyLancban_(id, keresett, alanyok) {
  let most = id;
  for (let i = 0; i < 30 && most; i++) {
    if (most === keresett) return true;
    const a = alanyok.find(function (x) { return x.id === most; });
    most = a ? objektum_(a.adat).osszekapcsolva : '';
  }
  return !!most;
}

// A kampány karakterei (a címzettek ellenőrzéséhez).
function kampanyKarakterIdk_(kampanyId) {
  return sorok_('jatek', 'Kampánykarakterek').filter(function (x) { return x.kampany_id === kampanyId; })
    .map(function (x) { return x.karakter_id; });
}

function cimzettekTisztit_(lista, kampanyId) {
  const l = (Array.isArray(lista) ? lista : [lista || 'mindenki']).map(String).filter(Boolean);
  if (!l.length || l.indexOf('mindenki') >= 0) return ['mindenki'];
  const tagok = kampanyKarakterIdk_(kampanyId);
  const rossz = l.filter(function (id) { return tagok.indexOf(id) < 0; });
  if (rossz.length) throw hiba_('hibas_adat', 'A címzett nincs a kampányban.');
  return l.filter(function (id, i) { return l.indexOf(id) === i; }).slice(0, 20);
}

// share.send új formája: { kampany_id, tipus: 'anyag', id?, cim, cimzettek, adat, alany_id?, megmutat? }
// vagy alany: { kampany_id, tipus: 'alany', id?, cim (ismert név), adat: { kategoria, valodi: { tipus, id, nev } } }
function anyagKuldese_(a, felh) {
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    if (!kampanyok.some(function (x) { return x.id === a.kampany_id; })) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    const sorok = sorok_('jatek', 'Megosztások');
    let id = ujId_('m');
    if (a.id && /^m_[a-z0-9]{6,16}$/.test(String(a.id))) {
      const meglevo = sorok.find(function (x) { return x.id === a.id; });
      if (meglevo) { delete meglevo._sor; return { megosztas: meglevo, mar_megvolt: true }; } // ismételt küldés (sorból)
      id = String(a.id);
    }
    const alany = a.tipus === 'alany';
    const cim = szoveg_(a.cim, 200).trim();
    if (alany && !cim) throw hiba_('hianyzo_adat', 'Add meg az alany ismert nevét.');
    let alanyId = '';
    if (!alany && a.alany_id) {
      const al = sorok.find(function (x) { return x.id === a.alany_id && x.tipus === 'alany' && x.kampany_id === a.kampany_id; });
      if (!al) throw hiba_('nem_talalhato', 'Nincs ilyen alany ebben a kampányban.');
      alanyId = al.id;
    }
    const cimzettek = alany ? [] : cimzettekTisztit_(a.cimzettek || a.cimzett, a.kampany_id);
    const adat = alany ? alanyAdatTisztit_(a.adat) : anyagAdatTisztit_(a.adat);
    const m = {
      id: id, kampany_id: a.kampany_id, cimzett: alany ? '' : (cimzettek[0] === 'mindenki' ? 'mindenki' : 'tobb'),
      tipus: alany ? 'alany' : 'anyag', cim: cim, hivatkozas: adat.forras ? adat.forras.id : (adat.valodi ? adat.valodi.id : ''),
      idopont: most_(), cimzettek: cimzettek, adat: adat, alany_id: alanyId, allapot: 'aktiv', latta: {},
      megmutat: !alany && a.megmutat ? most_() : '', letrehozta: felh.u, verzio: 1
    };
    sorHozzaadasa_('jatek', 'Megosztások', m);
    kampanyVerziokNovelese_([a.kampany_id], kampanyok);
    return { megosztas: m };
  });
}

// action: share.update (DM)
// adat: { id, allapot?: 'aktiv' | 'visszavont', megmutat?: true, cim?, cimzettek?, alany_id?, adat? (alanynál: kategoria,
// valodi, felfedve, osszekapcsolva, jegyzet) }
function megosztasModositasa_(a, felh) {
  return zarolva_(function () {
    const sorok = sorok_('jatek', 'Megosztások');
    const m = sorok.find(function (x) { return x.id === a.id; });
    if (!m) throw hiba_('nem_talalhato', 'Nincs ilyen kiosztás.');
    if (a.allapot !== undefined) m.allapot = a.allapot === 'visszavont' ? 'visszavont' : 'aktiv';
    if (a.cim !== undefined) {
      const cim = szoveg_(a.cim, 200).trim();
      if (m.tipus === 'alany' && !cim) throw hiba_('hianyzo_adat', 'Az alany ismert neve nem lehet üres.');
      m.cim = cim;
    }
    if (m.tipus === 'alany') {
      if (a.adat !== undefined) {
        const uj = alanyAdatTisztit_(a.adat, m.adat);
        if (uj.osszekapcsolva) {
          const alanyok = sorok.filter(function (x) { return x.tipus === 'alany' && x.kampany_id === m.kampany_id; });
          if (!alanyok.some(function (x) { return x.id === uj.osszekapcsolva; })) throw hiba_('nem_talalhato', 'Nincs ilyen alany ebben a kampányban.');
          const proba = alanyok.map(function (x) { return x.id === m.id ? Object.assign({}, x, { adat: uj }) : x; });
          if (alanyLancban_(uj.osszekapcsolva, m.id, proba)) throw hiba_('hibas_adat', 'Az összekapcsolás körbe érne.');
        }
        m.adat = uj;
      }
    } else if (m.tipus === 'anyag') {
      if (a.megmutat) m.megmutat = most_();
      if (a.cimzettek !== undefined) {
        m.cimzettek = cimzettekTisztit_(a.cimzettek, m.kampany_id);
        m.cimzett = m.cimzettek[0] === 'mindenki' ? 'mindenki' : 'tobb';
      }
      if (a.alany_id !== undefined) {
        if (a.alany_id && !sorok.some(function (x) { return x.id === a.alany_id && x.tipus === 'alany' && x.kampany_id === m.kampany_id; })) {
          throw hiba_('nem_talalhato', 'Nincs ilyen alany ebben a kampányban.');
        }
        m.alany_id = a.alany_id || '';
      }
    } else {
      throw hiba_('hibas_adat', 'Ez a régi megosztás nem módosítható.');
    }
    m.verzio = (Number(m.verzio) || 1) + 1;
    sorFrissitese_('jatek', 'Megosztások', m);
    kampanyVerziokNovelese_([m.kampany_id]);
    delete m._sor;
    return { megosztas: m };
  });
}

// action: share.seen   adat: { id }   A játékos megnyitotta az anyagot (a DM listájában „látta” jel).
function megosztasLatta_(a, felh) {
  if (felh.r === 'dm') return { latta: false };
  const k = kornyezet_();
  const m = sorok_('jatek', 'Megosztások').find(function (x) { return x.id === a.id; });
  if (!m || m.tipus !== 'anyag') throw hiba_('nem_talalhato', 'Nincs ilyen anyag.');
  const kampany = kampanyKeresese_(m.kampany_id, k);
  const szerep = kampanySzerep_(felh, kampany, k);
  if (!szerep || !megosztasLathato_(m, szerep, sajatKampanyKarakterek_(felh, kampany, k))) throw hiba_('nincs_jogosultsag', 'Ezt az anyagot nem látod.');
  if (objektum_(m.latta)[felh.u]) return { latta: true };
  return zarolva_(function () {
    const friss = sorok_('jatek', 'Megosztások').find(function (x) { return x.id === a.id; });
    const latta = objektum_(friss.latta);
    if (latta[felh.u]) return { latta: true };
    latta[felh.u] = most_();
    cellaIrasa_('jatek', 'Megosztások', friss._sor, 'latta', latta);
    kampanyVerziokNovelese_([friss.kampany_id]);
    return { latta: true };
  });
}

// action: share.image.add (DM)   adat: { kep, belyeg } (base64 JPEG, a böngésző vágta és méretezte)
function megosztasKepFeltoltese_(a, felh) {
  if (!a.kep) throw hiba_('hianyzo_adat', 'Hiányzik a kép.');
  if (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET) throw hiba_('tul_nagy', 'A kép túl nagy.');
  const mappa = kiosztasMappa_();
  const azon = 'anyag_' + Utilities.getUuid().slice(0, 8);
  const fajl = function (b64, nev) {
    return mappa.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', azon + '_' + nev + '.jpg'));
  };
  const kep = fajl(a.kep, 'kep').getId();
  const belyeg = a.belyeg ? fajl(a.belyeg, 'belyeg').getId() : kep;
  return { kep: { kep: kep, belyeg: belyeg } };
}

function kiosztasMappa_() {
  const id = beallitas_('KIOSZTASMAPPA_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* törölték: újra létrehozzuk */ }
  }
  const mappa = mappa_(DriveApp.getFolderById(beallitas_('MAPPA_ID')), 'Kiosztások');
  PropertiesService.getScriptProperties().setProperty('KIOSZTASMAPPA_ID', mappa.getId());
  CacheService.getScriptCache().put('prop_KIOSZTASMAPPA_ID', mappa.getId(), BEALLITAS_CACHE_MP);
  return mappa;
}

// A felhasználó által írható karakterek egy kampányban (a címzettség ellenőrzéséhez).
function sajatKampanyKarakterek_(felh, kampany, k) {
  return k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; }).map(function (x) {
    return k.karakterek.find(function (c) { return c.id === x.karakter_id; });
  }).filter(function (c) { return c && karakterIrhato_(felh, c, k); }).map(function (c) { return c.id; });
}

// Az anyag a játékos (és a mesterjátékos) nézetében: forrás, DM-adat és mások „látta” jele nélkül.
function anyagJatekosnak_(m, felh) {
  const a = objektum_(m.adat);
  const adat = { fajta: a.fajta, szoveg: a.szoveg || '', kepek: (a.kepek || []).map(function (k) {
    return { kep: k.kep, belyeg: k.belyeg, cim: k.cim, szel: k.szel, mag: k.mag, terkep: k.terkep };
  }) };
  if (a.level) adat.level = a.level;
  if (a.elozo) adat.elozo = a.elozo;
  return {
    id: m.id, kampany_id: m.kampany_id, tipus: 'anyag', cim: m.cim, idopont: m.idopont, cimzettek: megosztasCimzettjei_(m),
    alany_id: m.alany_id || '', megmutat: m.megmutat || '', adat: adat, latta_en: !!objektum_(m.latta)[felh.u]
  };
}

// A játékosnak csak azok az alanyok jutnak el, amelyekhez neki látható anyag tartozik (az összekapcsolás láncával
// együtt), és csak az ismert nevük; a valódi név a felfedés után.
function alanyokJatekosnak_(alanySorok, anyagok) {
  const kell = {};
  anyagok.forEach(function (m) {
    let most = m.alany_id;
    for (let i = 0; i < 20 && most && !kell[most]; i++) {
      kell[most] = true;
      const a = alanySorok.find(function (x) { return x.id === most; });
      most = a ? objektum_(a.adat).osszekapcsolva : '';
    }
  });
  return alanySorok.filter(function (a) { return kell[a.id]; }).map(function (a) {
    const d = objektum_(a.adat);
    const valodi = objektum_(d.valodi);
    return {
      id: a.id, tipus: 'alany', ismert_nev: a.cim, nev: d.felfedve && valodi.nev ? valodi.nev : a.cim, felfedve: d.felfedve === true,
      kategoria: d.kategoria || 'egyeb', osszekapcsolva: d.osszekapcsolva || ''
    };
  });
}

// A kampány állapotába: a kérő szerint szűrt megosztások és alanyok.
function kampanyMegosztasai_(osszes, kampany, szerep, sajat, felh) {
  const sajatSorok = osszes.filter(function (m) { return m.kampany_id === kampany.id; });
  if (szerep === 'dm') {
    return {
      megosztasok: sajatSorok.filter(function (m) { return m.tipus !== 'alany'; }).map(function (m) { const o = Object.assign({}, m); delete o._sor; return o; }),
      alanyok: sajatSorok.filter(function (m) { return m.tipus === 'alany'; }).map(function (m) { const o = Object.assign({}, m); delete o._sor; return o; })
    };
  }
  const lathato = sajatSorok.filter(function (m) { return megosztasLathato_(m, szerep, sajat); });
  const anyagok = lathato.filter(function (m) { return m.tipus === 'anyag'; });
  return {
    megosztasok: lathato.map(function (m) {
      if (m.tipus === 'anyag') return anyagJatekosnak_(m, felh);
      const o = Object.assign({}, m); delete o._sor; return o;
    }),
    alanyok: alanyokJatekosnak_(sajatSorok.filter(function (m) { return m.tipus === 'alany'; }), anyagok)
  };
}

// Az image.get engedélylistájához: a kiosztott anyagok képei annak, aki az anyagot látja (a DM mindet).
function megosztasKepekEngedese_(felh, k, engedett) {
  const szerepek = {};
  sorok_('jatek', 'Megosztások').forEach(function (m) {
    if (m.tipus !== 'anyag') return;
    const kepek = objektum_(m.adat).kepek;
    if (!Array.isArray(kepek) || !kepek.length) return;
    if (!(m.kampany_id in szerepek)) {
      const kampany = k.kampanyok.find(function (x) { return x.id === m.kampany_id; });
      const szerep = kampany && (felh.r === 'dm' || kampany.allapot !== ARCHIVALT) ? kampanySzerep_(felh, kampany, k) : null;
      szerepek[m.kampany_id] = szerep ? { szerep: szerep, sajat: sajatKampanyKarakterek_(felh, kampany, k) } : null;
    }
    const sz = szerepek[m.kampany_id];
    if (!sz || !megosztasLathato_(m, sz.szerep, sz.sajat)) return;
    kepek.forEach(function (x) {
      if (x && x.kep) engedett[x.kep] = true;
      if (x && x.belyeg) engedett[x.belyeg] = true;
    });
  });
}

// A kampány törlésekor a megosztásai is törlődnek (a Drive képei maradnak, a napi mentés miatt).
function kampanyMegosztasainakTorlese_(kampanyId) {
  const sorok = sorok_('jatek', 'Megosztások').filter(function (m) { return m.kampany_id === kampanyId; });
  sorokTorlese_('jatek', 'Megosztások', sorok.map(function (m) { return m._sor; }));
}
