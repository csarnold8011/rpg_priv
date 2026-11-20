// Kampányjátszó 6.3: a kampány jegyzetfüzete (Jegyzetek lap).
//
// Saját jegyzet (lathatosag 'sajat'): csak az írója látja és szerkeszti, a DM sem.
// Csapatjegyzet (lathatosag 'csapat'): a kampány minden tagja látja és szerkeszti (a DM is).
// A jegyzet köthető egy kiosztott anyaghoz vagy alanyhoz (kapcsolodik), olyanhoz, amelyet az írója lát.
// A karakterlap jegyzetei (6.1) ettől függetlenek: azok a karakter adatában vannak.
//
// A kliens adhat azonosítót (j_ előtaggal), így a kiesés alatt írt jegyzet ismételt küldése nem duplikál.
// Módosításnál a verzio kötelező: ha közben más mentett, a válasz 'utkozes', benne az aktuális jegyzet.

const JEGYZET_LATHATOSAG = ['sajat', 'csapat'];
const MAX_JEGYZET_SZOVEG = 20000;
const MAX_JEGYZET_CIMKE = 12;

function jegyzetCimkek_(x) {
  const l = (Array.isArray(x) ? x : String(x || '').split(',')).map(function (c) { return szoveg_(c, 40).trim(); }).filter(Boolean);
  return l.filter(function (c, i) {
    return l.findIndex(function (y) { return y.toLowerCase() === c.toLowerCase(); }) === i;
  }).slice(0, MAX_JEGYZET_CIMKE);
}

// Látja-e a felhasználó a jegyzetet (az aktív állapottól függetlenül).
function jegyzetLathato_(j, felh) {
  return j.lathatosag === 'csapat' || j.szerzo_id === felh.u;
}

// A felhasználó szerepe a kampányban (archivált kampányban játékosként nincs).
function jegyzetKampanySzerep_(kampanyId, felh, k) {
  const kampany = kampanyKeresese_(kampanyId, k);
  const szerep = kampanySzerep_(felh, kampany, k);
  if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
  if (szerep !== 'dm' && kampany.allapot === ARCHIVALT) throw hiba_('nincs_jogosultsag', 'Ez a kampány archiválva van.');
  return { kampany: kampany, szerep: szerep };
}

// A kapcsolódó anyag vagy alany ellenőrzése: a kampányé, és az író látja.
function jegyzetKapcsolatEllenorzes_(id, kampany, szerep, felh, k) {
  if (!id) return '';
  const sorok = sorok_('jatek', 'Megosztások').filter(function (m) { return m.kampany_id === kampany.id; });
  const m = sorok.find(function (x) { return x.id === id; });
  if (!m || (m.tipus !== 'anyag' && m.tipus !== 'alany')) throw hiba_('nem_talalhato', 'Nincs ilyen anyag vagy alany ebben a kampányban.');
  if (szerep === 'dm') return m.id;
  const sajat = sajatKampanyKarakterek_(felh, kampany, k);
  if (m.tipus === 'anyag') {
    if (!megosztasLathato_(m, szerep, sajat)) throw hiba_('nem_talalhato', 'Nincs ilyen anyag vagy alany ebben a kampányban.');
    return m.id;
  }
  const anyagok = sorok.filter(function (x) { return x.tipus === 'anyag' && megosztasLathato_(x, szerep, sajat); });
  const ismert = alanyokJatekosnak_(sorok.filter(function (x) { return x.tipus === 'alany'; }), anyagok);
  if (!ismert.some(function (x) { return x.id === m.id; })) throw hiba_('nem_talalhato', 'Nincs ilyen anyag vagy alany ebben a kampányban.');
  return m.id;
}

// A karakter, akinek a nevében a jegyzet készül (nem kötelező): a kampányé, és az író kezeli.
function jegyzetKarakterEllenorzes_(id, kampany, szerep, felh, k) {
  if (!id) return '';
  const tagok = kampanyKarakterIdk_(kampany.id);
  if (tagok.indexOf(id) < 0) throw hiba_('hibas_adat', 'A karakter nincs a kampányban.');
  if (szerep !== 'dm' && sajatKampanyKarakterek_(felh, kampany, k).indexOf(id) < 0) throw hiba_('nincs_jogosultsag', 'Ennek a karakternek a nevében nem írhatsz.');
  return id;
}

function jegyzetNezet_(j, nevek) {
  const o = {
    id: j.id, kampany_id: j.kampany_id, szerzo_id: j.szerzo_id, karakter_id: j.karakter_id || '',
    lathatosag: j.lathatosag === 'csapat' ? 'csapat' : 'sajat', kapcsolodik: j.kapcsolodik || '',
    cim: j.cim || '', szoveg: j.szoveg || '', cimkek: Array.isArray(j.cimkek) ? j.cimkek : [], rogzitett: igaz_rejtett_(j.rogzitett),
    verzio: Number(j.verzio) || 1, letrehozva: j.letrehozva || '', modositva: j.modositva || '', modositotta: j.modositotta || '',
    aktiv: igaz_(j.aktiv)
  };
  if (nevek) o.szerzo_nev = nevek[j.szerzo_id] || '';
  return o;
}

function felhasznaloNevek_() {
  const o = {};
  sorok_('jatek', 'Felhasználók').forEach(function (u) { o[u.id] = u.nev; });
  return o;
}

// action: note.save
// adat: { id, kampany_id (újnál), verzio (módosításnál), uj?: igaz (újnál), lathatosag?, karakter_id?, kapcsolodik?,
//         cim?, szoveg?, cimkek?, rogzitett? }
function jegyzetMentese_(a, felh) {
  const id = String(a.id || '');
  if (!/^j_[a-z0-9]{6,16}$/.test(id)) throw hiba_('hibas_adat', 'Hibás jegyzetazonosító.');
  return zarolva_(function () {
    const k = kornyezet_();
    const sorok = sorok_('jatek', 'Jegyzetek');
    const regi = sorok.find(function (x) { return x.id === id; });
    const nevek = felhasznaloNevek_();
    if (regi) {
      if (!jegyzetLathato_(regi, felh)) throw hiba_('nincs_jogosultsag', 'Ezt a jegyzetet nem szerkesztheted.');
      // ismételt létrehozás (a kiesés alatt sorba állt küldés újra felment)
      if (a.uj && regi.szerzo_id === felh.u) return { jegyzet: jegyzetNezet_(regi, nevek), verzio: Number(regi.verzio) || 1, mar_megvolt: true };
      const ksz = jegyzetKampanySzerep_(regi.kampany_id, felh, k);
      if (a.verzio === undefined || Number(a.verzio) !== (Number(regi.verzio) || 1)) {
        throw hiba_('utkozes', 'A jegyzetet közben más is módosította.', { aktualis: jegyzetNezet_(regi, nevek) });
      }
      if (a.lathatosag !== undefined && a.lathatosag !== regi.lathatosag && regi.szerzo_id !== felh.u) {
        throw hiba_('nincs_jogosultsag', 'A láthatóságot csak az írója változtathatja.');
      }
      jegyzetMezok_(regi, a, ksz, felh, k);
      regi.verzio = (Number(regi.verzio) || 1) + 1;
      regi.modositva = most_();
      regi.modositotta = felh.n || '';
      sorFrissitese_('jatek', 'Jegyzetek', regi);
      kampanyVerziokNovelese_([regi.kampany_id], k.kampanyok);
      return { jegyzet: jegyzetNezet_(regi, nevek), verzio: regi.verzio };
    }
    const ksz = jegyzetKampanySzerep_(a.kampany_id, felh, k);
    const j = {
      id: id, kampany_id: ksz.kampany.id, szerzo_id: felh.u, karakter_id: '', lathatosag: 'sajat', kapcsolodik: '',
      cim: '', szoveg: '', cimkek: [], rogzitett: false, verzio: 1, letrehozva: most_(), modositva: most_(),
      modositotta: felh.n || '', aktiv: true
    };
    jegyzetMezok_(j, a, ksz, felh, k);
    if (!j.cim.trim() && !j.szoveg.trim()) throw hiba_('hianyzo_adat', 'Üres jegyzetet nem mentek.');
    sorHozzaadasa_('jatek', 'Jegyzetek', j);
    kampanyVerziokNovelese_([j.kampany_id], k.kampanyok);
    return { jegyzet: jegyzetNezet_(j, nevek), verzio: 1 };
  });
}

function jegyzetMezok_(j, a, ksz, felh, k) {
  if (a.lathatosag !== undefined) j.lathatosag = JEGYZET_LATHATOSAG.indexOf(a.lathatosag) >= 0 ? a.lathatosag : 'sajat';
  if (a.cim !== undefined) j.cim = szoveg_(a.cim, 200);
  if (a.szoveg !== undefined) j.szoveg = szoveg_(a.szoveg, MAX_JEGYZET_SZOVEG);
  if (a.cimkek !== undefined) j.cimkek = jegyzetCimkek_(a.cimkek);
  if (a.rogzitett !== undefined) j.rogzitett = a.rogzitett === true;
  if (a.kapcsolodik !== undefined && a.kapcsolodik !== j.kapcsolodik) {
    j.kapcsolodik = jegyzetKapcsolatEllenorzes_(String(a.kapcsolodik || ''), ksz.kampany, ksz.szerep, felh, k);
  }
  if (a.karakter_id !== undefined && a.karakter_id !== j.karakter_id) {
    j.karakter_id = jegyzetKarakterEllenorzes_(String(a.karakter_id || ''), ksz.kampany, ksz.szerep, felh, k);
  }
}

// action: note.archive   adat: { id, aktiv?: hamis (törlés, alapból) vagy igaz (visszavonás) }
// A törölt jegyzet a lapon marad (aktiv: hamis), így visszahozható; a nézetekből eltűnik.
function jegyzetArchivalasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const j = sorok_('jatek', 'Jegyzetek').find(function (x) { return x.id === a.id; });
    if (!j || !jegyzetLathato_(j, felh)) throw hiba_('nem_talalhato', 'Nincs ilyen jegyzet.');
    jegyzetKampanySzerep_(j.kampany_id, felh, k);
    j.aktiv = a.aktiv === true;
    j.verzio = (Number(j.verzio) || 1) + 1;
    j.modositva = most_();
    j.modositotta = felh.n || '';
    sorFrissitese_('jatek', 'Jegyzetek', j);
    kampanyVerziokNovelese_([j.kampany_id], k.kampanyok);
    return { jegyzet: jegyzetNezet_(j, felhasznaloNevek_()), verzio: j.verzio };
  });
}

// A kampány állapotába (state.get): a kérő által látható aktív jegyzetek.
function kampanyJegyzetei_(kampany, felh) {
  const nevek = felhasznaloNevek_();
  return sorok_('jatek', 'Jegyzetek').filter(function (j) {
    return j.kampany_id === kampany.id && igaz_(j.aktiv) && jegyzetLathato_(j, felh);
  }).map(function (j) { return jegyzetNezet_(j, nevek); });
}

// A kampány törlésekor a jegyzetei is törlődnek.
function kampanyJegyzeteinekTorlese_(kampanyId) {
  const sorok = sorok_('jatek', 'Jegyzetek').filter(function (j) { return j.kampany_id === kampanyId; });
  sorokTorlese_('jatek', 'Jegyzetek', sorok.map(function (j) { return j._sor; }));
}
