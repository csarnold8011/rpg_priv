// NJK-tár (3. lépés, 2. ütem): önálló nem játékos karakterek, a karakterekhez hasonlóan verziózva.
// Terv: claude/csata-terv.md, „NJK-tár”. A számolás (statblokk, erősítés, sablonok) a felületen van:
// web/js/jatek/leny.js és web/js/jatek/njk.js. Itt csak tárolás, jogosultság és láthatóság.
//
// Fajták: statblokk (harcoló NJK), rovid (csak tulajdonság és fókusz), koveto (követő vagy társ).
// Láthatóság: a DM mindent lát. A követőt (fajta koveto) teljesen látja a gazda karakter írója,
// az irányítója, csapathoz kötve a kampány minden tagja. A megosztott NJK-ból (Megosztások, tipus njk)
// a címzett a nevet, a képet és a nyilvános leírást látja. A titkok és a DM-jegyzet csak a DM-é.

const NJK_FAJTAK = ['statblokk', 'rovid', 'koveto'];
const MAX_NJK_MERET = 48000;

// ---- Szintek és öröklés (5.5, Kampányépítő 5. fejezet) ----
// Szint: sablon (adat.sablon), világ (vilag_id), szabad (a többi, kampányokhoz rendelhető). Az NJK épülhet egy másikra
// (alap_id). Az öröklés materializált: a sor mindig a teljes adatot tárolja, az adat.felulirt pedig a saját mezőket.
// Mentéskor a háttér kiszámolja a felülírásokat (az alaptól eltérő mezők), az alap módosításakor a rá épülőket frissíti.
// A mezőlista azonos a web/js/kampany/szereplo.js OROKOLHETO listájával (a teszt összeveti).
const NJK_SZEREPLO_MEZOK = ['szerepek', 'szerep_jegyzet', 'ellenpolus_id', 'epitesi_mod', 'epites_jegyzet', 'cel', 'indok', 'vonas',
  'arnyalatok', 'hang', 'hibak', 'elet', 'gyerekkor', 'ma', 'kapcsolat_jegyzet', 'rejtett', 'kulcspontok', 'monologus', 'kerdesek',
  'fejlodes_terv', 'valtozasok'];
const NJK_OROKOLHETO = ['nev', 'fajta', 'fenyegetes', 'alap_szorny', 'adat.statblokk', 'adat.erosites', 'adat.kezi',
  'adat.szerep.koncepcio', 'adat.szerep.megjelenes', 'adat.szerep.motivacio', 'adat.szerep.nyilvanos', 'adat.szerep.titkok',
  'adat.szerep.kapcsolatok', 'adat.szerep.dm_jegyzet', 'adat.szerep.feladatok'].concat(NJK_SZEREPLO_MEZOK.map(function (m) { return 'adat.szereplo.' + m; }));
const NJK_MAX_LANC = 4;

function njkSablon_(n) { return !!njkAdat_(n).sablon; }
function njkSzint_(n) { return njkSablon_(n) ? 'sablon' : n.vilag_id ? 'vilag' : 'szabad'; }

function njkUt_(n, ut) {
  let x = n;
  const r = ut.split('.');
  for (let i = 0; i < r.length; i++) { if (!x || typeof x !== 'object') return undefined; x = x[r[i]]; }
  return x;
}
function njkUtBeallit_(n, ut, ertek) {
  const r = ut.split('.');
  let x = n;
  for (let i = 0; i < r.length - 1; i++) { if (!x[r[i]] || typeof x[r[i]] !== 'object') x[r[i]] = {}; x = x[r[i]]; }
  if (ertek === undefined) delete x[r[r.length - 1]]; else x[r[r.length - 1]] = JSON.parse(JSON.stringify(ertek));
}
function njkUres_(x) {
  return x === undefined || x === null || x === '' || (Array.isArray(x) && !x.length) ||
    (typeof x === 'object' && !Array.isArray(x) && !Object.keys(x).length);
}
function njkAzonos_(a, b) { return (njkUres_(a) && njkUres_(b)) || JSON.stringify(a) === JSON.stringify(b); }

// A felülírások (az alaptól eltérő mezők), és az örökölt mezők beírása az alapból.
function njkFelulirasok_(n, alap) {
  return NJK_OROKOLHETO.filter(function (ut) { return !njkAzonos_(njkUt_(n, ut), njkUt_(alap, ut)); });
}
function njkFeloldas_(n, alap, felulirt) {
  NJK_OROKOLHETO.forEach(function (ut) { if (felulirt.indexOf(ut) < 0) njkUtBeallit_(n, ut, njkUt_(alap, ut)); });
  n.adat = njkAdat_(n);
  n.adat.felulirt = felulirt.slice();
}

// Lehet-e az alapja (hibát dob, ha nem).
function njkAlapEllenorzes_(n, alap, sorok) {
  if (!alap) throw hiba_('nem_talalhato', 'Nincs ilyen alap NJK.');
  if (alap.id === n.id) throw hiba_('hibas_adat', 'Egy NJK nem épülhet önmagára.');
  const nsz = njkSzint_(n), asz = njkSzint_(alap);
  if (nsz === 'sablon' && asz !== 'sablon') throw hiba_('hibas_adat', 'Sablon csak sablonra épülhet.');
  if (nsz === 'vilag' && !(asz === 'sablon' || (asz === 'vilag' && alap.vilag_id === n.vilag_id))) {
    throw hiba_('hibas_adat', 'Világ-NJK csak sablonra vagy ugyanannak a világnak az NJK-jára épülhet. Előbb válaszd le.');
  }
  let x = alap, hossz = 1;
  const volt = {};
  while (x) {
    if (x.id === n.id || volt[x.id]) throw hiba_('hibas_adat', 'Körbe érne az öröklés.');
    volt[x.id] = true;
    hossz++;
    if (hossz > NJK_MAX_LANC) throw hiba_('hibas_adat', 'Legfeljebb ' + NJK_MAX_LANC + ' szint örökölhető egymásra.');
    const aid = x.alap_id;
    x = aid ? sorok.find(function (y) { return y.id === aid; }) : null;
  }
}

// Az alapjára épülő NJK-k frissítése (zárolás alatt): az örökölt mezők az új értéket kapják. A változott
// NJK-k kampányainak listáját adja vissza.
function njkPeldanyokFrissitese_(alap, sorok, felh, mely) {
  const kampanyok = [];
  if ((mely || 0) > NJK_MAX_LANC) return kampanyok;
  sorok.filter(function (x) { return x.alap_id === alap.id; }).forEach(function (p) {
    const elotte = JSON.stringify([p.nev, p.fajta, p.fenyegetes, p.alap_szorny, p.adat]);
    const felulirt = (Array.isArray(njkAdat_(p).felulirt) ? njkAdat_(p).felulirt : []).filter(function (ut) { return NJK_OROKOLHETO.indexOf(ut) >= 0; });
    p.adat = njkAdat_(p);
    njkFeloldas_(p, alap, felulirt);
    if (JSON.stringify([p.nev, p.fajta, p.fenyegetes, p.alap_szorny, p.adat]) === elotte) return;
    const regi = Number(p.verzio) || 0;
    p.verzio = regi + 1;
    p.modositva = most_();
    p.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', p);
    valtozasNaplozasa_(felh, 'njk.orokles', p.id, regi, p.verzio);
    njkKampanyai_(p).forEach(function (k) { kampanyok.push(k); });
    njkPeldanyokFrissitese_(p, sorok, felh, (mely || 0) + 1).forEach(function (k) { kampanyok.push(k); });
  });
  return kampanyok;
}

// Az NJK-k lap sorai. Ha a lap még nincs meg (az elsoBeallitas előtt), üres lista.
function njkSorok_() {
  try { return sorok_('jatek', 'NJK-k'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function njkAdat_(n) {
  return n.adat && typeof n.adat === 'object' ? n.adat : {};
}

function njkKampanyai_(n) {
  return Array.isArray(n.kampanyok) ? n.kampanyok : [];
}

function njkKep_(n) {
  const sz = njkAdat_(n).szerep;
  const kep = sz && sz.kep;
  return kep && typeof kep === 'object' ? kep : null;
}

function njkOsszefoglalo_(n) {
  const sz = njkAdat_(n).szerep || {};
  const kep = njkKep_(n);
  return {
    id: n.id, nev: n.nev, fajta: n.fajta || 'statblokk', alap_szorny: n.alap_szorny || '', fenyegetes: n.fenyegetes || '',
    kampanyok: njkKampanyai_(n), kotodes: n.kotodes || '', iranyito: n.iranyito || '',
    verzio: Number(n.verzio) || 0, modositva: n.modositva, aktiv: igaz_(n.aktiv),
    kep: kep ? (kep.belyeg || kep.kep || '') : '', koncepcio: sz.koncepcio ? String(sz.koncepcio).slice(0, 160) : '',
    vilag_id: n.vilag_id || '', alap_id: n.alap_id || '', sablon: njkSablon_(n),
    szerepek: Array.isArray(objektum_(njkAdat_(n).szereplo).szerepek) ? njkAdat_(n).szereplo.szerepek : []
  };
}

// lathatosag: 'teljes' (DM: minden), 'kovetonek' (statblokk, titkok nélkül), 'nyilvanos' (név, kép, leírás)
function njkNezet_(n, lathatosag) {
  const o = njkOsszefoglalo_(n);
  o.lathatosag = lathatosag;
  const adat = njkAdat_(n);
  if (lathatosag === 'teljes') { o.adat = adat; return o; }
  const sz = adat.szerep || {};
  delete o.vilag_id; delete o.alap_id; delete o.sablon; delete o.szerepek;
  if (lathatosag === 'kovetonek') {
    const masolat = JSON.parse(JSON.stringify(adat));
    delete masolat.szereplo; delete masolat.felulirt; delete masolat.sablon;
    masolat.szerep = { kep: sz.kep || null, megjelenes: sz.megjelenes || '', koncepcio: sz.koncepcio || '',
      nyilvanos: sz.nyilvanos || '', feladatok: sz.feladatok || [] };
    o.adat = masolat;
    return o;
  }
  // nyilvános: csak a név, a kép és a nyilvános leírás
  o.adat = { szerep: { kep: sz.kep || null, nyilvanos: sz.nyilvanos || '', megjelenes: sz.megjelenes || '' } };
  delete o.alap_szorny; delete o.fenyegetes; delete o.koncepcio; delete o.iranyito;
  return o;
}

// Mennyit lát a felhasználó az NJK-ból (null: semmit). k: kornyezet_(), megosztasok: a Megosztások sorai.
function njkLathatosag_(felh, n, k, megosztasok) {
  if (felh.r === 'dm') return 'teljes';
  if (!igaz_(n.aktiv)) return null;
  if (n.fajta === 'koveto' && njkKovetoLathato_(felh, n, k)) return 'kovetonek';
  const sajat = k.karakterek.filter(function (c) { return c.jatekos_id === felh.u; }).map(function (c) { return c.id; });
  const megosztva = (megosztasok || []).some(function (m) {
    if (m.tipus !== 'njk' || m.hivatkozas !== n.id) return false;
    const kampany = k.kampanyok.find(function (x) { return x.id === m.kampany_id; });
    if (!kampany || kampany.allapot === ARCHIVALT) return false;
    const szerep = kampanySzerep_(felh, kampany, k);
    if (!szerep) return false;
    return szerep === 'mester' || m.cimzett === 'mindenki' || sajat.indexOf(m.cimzett) >= 0;
  });
  return megosztva ? 'nyilvanos' : null;
}

// A követő statblokkját látja: az irányítója, a gazda karakter írója (játékosa, mesterjátékosa),
// csapathoz kötve a kampányai bármelyikének tagja.
function njkKovetoLathato_(felh, n, k) {
  if (n.iranyito && n.iranyito === felh.u) return true;
  if (n.kotodes && n.kotodes !== 'csapat') {
    const gazda = k.karakterek.find(function (c) { return c.id === n.kotodes; });
    return !!gazda && karakterIrhato_(felh, gazda, k);
  }
  if (n.kotodes === 'csapat') {
    return njkKampanyai_(n).some(function (id) {
      const kampany = k.kampanyok.find(function (x) { return x.id === id; });
      return kampany && kampany.allapot !== ARCHIVALT && !!kampanySzerep_(felh, kampany, k);
    });
  }
  return false;
}

// Dobhat-e az NJK nevében: a DM; követőnél az irányító, a gazda karakter írója, csapathoz kötve a mesterjátékos.
function njkDobhat_(felh, n, k) {
  if (felh.r === 'dm') return true;
  if (n.fajta !== 'koveto' || !igaz_(n.aktiv)) return false;
  if (n.iranyito) return n.iranyito === felh.u;
  if (n.kotodes && n.kotodes !== 'csapat') {
    const gazda = k.karakterek.find(function (c) { return c.id === n.kotodes; });
    return !!gazda && karakterIrhato_(felh, gazda, k);
  }
  return njkKampanyai_(n).some(function (id) {
    const kampany = k.kampanyok.find(function (x) { return x.id === id; });
    return kampany && kampanySzerep_(felh, kampany, k) === 'mester';
  });
}

function njkKeresese_(id, sorok) {
  const n = (sorok || njkSorok_()).find(function (x) { return x.id === id; });
  if (!n) throw hiba_('nem_talalhato', 'Nincs ilyen NJK.');
  return n;
}

// A kampány NJK-i a kérő szerepe szerint (state.get).
function kampanyNjkjai_(kampany, felh, k, megosztasok) {
  const ki = [];
  njkSorok_().forEach(function (n) {
    const benne = njkKampanyai_(n).indexOf(kampany.id) >= 0;
    if (felh.r === 'dm') {
      if (benne && igaz_(n.aktiv)) ki.push(njkNezet_(n, 'teljes'));
      return;
    }
    if (!benne && !(megosztasok || []).some(function (m) { return m.tipus === 'njk' && m.hivatkozas === n.id && m.kampany_id === kampany.id; })) return;
    const l = njkLathatosag_(felh, n, k, (megosztasok || []).filter(function (m) { return m.kampany_id === kampany.id; }));
    if (l) ki.push(njkNezet_(n, l));
  });
  return ki;
}

// ---- Műveletek ----

// action: npc.list (DM)   adat: { archivaltak? }
function njkLista_(a) {
  const lista = njkSorok_()
    .filter(function (n) { return a.archivaltak || igaz_(n.aktiv); })
    .map(njkOsszefoglalo_);
  return { njkk: lista };
}

// action: npc.get   adat: { id }
function njkLekerese_(a, felh) {
  const n = njkKeresese_(a.id);
  const k = kornyezet_();
  const l = njkLathatosag_(felh, n, k, sorok_('jatek', 'Megosztások'));
  if (!l) throw hiba_('nincs_jogosultsag', 'Ezt az NJK-t nem láthatod.');
  return { njk: njkNezet_(n, l) };
}

function njkMezok_(n, a, k) {
  if (a.nev !== undefined) {
    const nev = String(a.nev || '').trim().slice(0, 120);
    if (!nev) throw hiba_('hianyzo_adat', 'Adj nevet az NJK-nak.');
    n.nev = nev;
  }
  if (a.fajta !== undefined) n.fajta = NJK_FAJTAK.indexOf(a.fajta) >= 0 ? a.fajta : 'statblokk';
  if (a.alap_szorny !== undefined) n.alap_szorny = String(a.alap_szorny || '');
  if (a.fenyegetes !== undefined) n.fenyegetes = String(a.fenyegetes || '');
  if (a.kampanyok !== undefined) {
    const ids = Array.isArray(a.kampanyok) ? a.kampanyok.map(String) : [];
    ids.forEach(function (id) { kampanyKeresese_(id, k); });
    n.kampanyok = ids.filter(function (id, i) { return ids.indexOf(id) === i; });
  }
  if (a.kotodes !== undefined) {
    const kot = String(a.kotodes || '');
    if (kot && kot !== 'csapat') karakterKeresese_(kot, k);
    n.kotodes = kot;
  }
  if (a.iranyito !== undefined) {
    const ir = String(a.iranyito || '');
    if (ir && !sorok_('jatek', 'Felhasználók').some(function (f) { return f.id === ir; })) throw hiba_('nem_talalhato', 'Nincs ilyen felhasználó.');
    n.iranyito = ir;
  }
  if (a.adat !== undefined) {
    if (!a.adat || typeof a.adat !== 'object') throw hiba_('hibas_adat', 'Hibás NJK-adat.');
    if (JSON.stringify(a.adat).length > MAX_NJK_MERET) throw hiba_('tul_nagy', 'Az NJK adatai túl nagyok egy cellához.');
    // a kép csak az npc.image.set művelettel változhat, a sablon jelölő csak létrehozáskor
    const regiKep = njkKep_(n);
    const sablon = njkSablon_(n);
    const adat = a.adat;
    adat.szerep = adat.szerep && typeof adat.szerep === 'object' ? adat.szerep : {};
    adat.szerep.kep = regiKep;
    if (sablon) adat.sablon = true; else delete adat.sablon;
    n.adat = adat;
  }
  if (a.vilag_id !== undefined) {
    const w = String(a.vilag_id || '');
    if (w && njkSablon_(n)) throw hiba_('hibas_adat', 'A sablon nem tartozik világhoz.');
    if (w && !epitoSorok_('Világok').some(function (x) { return x.id === w; })) throw hiba_('nem_talalhato', 'Nincs ilyen világ.');
    n.vilag_id = w;
  }
  if (a.alap_id !== undefined) n.alap_id = String(a.alap_id || '');
}

// Az öröklés rendezése mentés előtt: az alap ellenőrzése, a felülírások kiszámolása, a sablon korlátai.
function njkOroklesRendezese_(n, sorok) {
  n.adat = njkAdat_(n);
  if (njkSablon_(n) && (njkKampanyai_(n).length || n.kotodes)) throw hiba_('hibas_adat', 'A sablon nem rendelhető kampányhoz, és nincs gazdája.');
  if (!n.alap_id) { n.adat.felulirt = []; return; }
  const alap = sorok.find(function (x) { return x.id === n.alap_id; });
  njkAlapEllenorzes_(n, alap, sorok);
  njkFeloldas_(n, alap, njkFelulirasok_(n, alap));
}

// action: npc.save (DM)
//   adat: { id?, verzio?, nev, fajta, alap_szorny, fenyegetes, kampanyok, kotodes, iranyito, adat }
// id nélkül új NJK. A verzio az a verziószám, amelyből a felület a módosítást készítette; ha közben
// más mentett, a válasz hiba: 'utkozes', benne az aktuális NJK.
function njkMentese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const sorok = njkSorok_();
    if (!a.id) {
      const n = { id: ujId_('n'), nev: '', fajta: 'statblokk', alap_szorny: '', fenyegetes: '', kampanyok: [], kotodes: '',
        iranyito: '', adat: a.sablon ? { sablon: true } : {}, verzio: 1, modositva: most_(), modositotta: felh.n, aktiv: true,
        vilag_id: '', alap_id: '' };
      njkMezok_(n, Object.assign({ nev: a.nev || '' }, a), k);
      njkOroklesRendezese_(n, sorok);
      sorHozzaadasa_('jatek', 'NJK-k', n);
      const kv = kampanyVerziokNovelese_(njkKampanyai_(n), k.kampanyok);
      valtozasNaplozasa_(felh, 'njk.letrehoz', n.id, '', 1);
      return { njk: njkNezet_(n, 'teljes'), kampany_verziok: kv };
    }
    const n = njkKeresese_(a.id, sorok);
    const regi = Number(n.verzio) || 0;
    if (a.verzio !== undefined && Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'Az NJK-t közben más is módosította.', { aktualis: njkNezet_(n, 'teljes') });
    }
    const regiKampanyok = njkKampanyai_(n).slice();
    njkMezok_(n, a, k);
    njkOroklesRendezese_(n, sorok);
    n.verzio = regi + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    const peldanyKampanyok = njkPeldanyokFrissitese_(n, sorok, felh, 0);
    const erintett = regiKampanyok.concat(njkKampanyai_(n), peldanyKampanyok).filter(function (x, i, t) { return t.indexOf(x) === i; });
    const kv = kampanyVerziokNovelese_(erintett, k.kampanyok);
    valtozasNaplozasa_(felh, 'njk.ment', n.id, regi, n.verzio);
    return { njk: njkNezet_(n, 'teljes'), verzio: n.verzio, modositva: n.modositva, kampany_verziok: kv };
  });
}

// action: npc.archive (DM)   adat: { id, aktiv }
function njkArchivalasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const n = njkKeresese_(a.id);
    n.aktiv = !!a.aktiv;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    kampanyVerziokNovelese_(njkKampanyai_(n), k.kampanyok);
    valtozasNaplozasa_(felh, n.aktiv ? 'njk.visszaallit' : 'njk.archival', n.id, '', '');
    return { njk: njkOsszefoglalo_(n) };
  });
}

// action: npc.delete (DM)   adat: { id }   Csak archivált NJK törölhető; a képe a kukába kerül, a napló marad.
function njkTorlese_(a, felh) {
  return zarolva_(function () {
    const sorok = njkSorok_();
    const n = njkKeresese_(a.id, sorok);
    if (igaz_(n.aktiv)) throw hiba_('hibas_adat', 'Csak archivált NJK törölhető. Előbb archiváld.');
    if (sorok.some(function (x) { return x.alap_id === n.id; })) throw hiba_('hibas_adat', 'Más NJK-k erre épülnek (alapjuk). Előbb válaszd le őket.');
    sorTorlese_('jatek', 'NJK-k', n._sor);
    kepekKukaba_(njkKep_(n));
    valtozasNaplozasa_(felh, 'njk.torol', n.id, n.verzio, '');
    return { torolve: n.id };
  });
}

// action: npc.detach (DM)   adat: { id, verzio? }   Leválasztás az alapjáról: a jelenlegi (teljes) adat megmarad.
function njkLevalasztasa_(a, felh) {
  return zarolva_(function () {
    const n = njkKeresese_(a.id);
    const regi = Number(n.verzio) || 0;
    if (a.verzio !== undefined && Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'Az NJK-t közben más is módosította.', { aktualis: njkNezet_(n, 'teljes') });
    }
    if (!n.alap_id) return { njk: njkNezet_(n, 'teljes'), verzio: regi };
    n.alap_id = '';
    n.adat = njkAdat_(n);
    n.adat.felulirt = [];
    n.verzio = regi + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    valtozasNaplozasa_(felh, 'njk.levalaszt', n.id, regi, n.verzio);
    return { njk: njkNezet_(n, 'teljes'), verzio: n.verzio };
  });
}

// action: npc.image.set (DM)   adat: { id, kep, belyeg }  (base64 JPEG; kep nélkül: a kép törlése)
function njkKepBeallitasa_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik az NJK azonosítója.');
  if (a.kep && (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET)) {
    throw hiba_('tul_nagy', 'A kép túl nagy.');
  }
  return zarolva_(function () {
    const k = kornyezet_();
    const n = njkKeresese_(a.id);
    const adat = njkAdat_(n);
    adat.szerep = adat.szerep && typeof adat.szerep === 'object' ? adat.szerep : {};
    const regi = njkKep_(n);
    let uj = null;
    if (a.kep) uj = kepFajlok_(n.id, a.kep, a.belyeg, regi);
    kepekKukaba_(regi);
    adat.szerep.kep = uj;
    const verzio = Number(n.verzio) || 0;
    n.adat = adat;
    n.verzio = verzio + 1;
    n.modositva = most_();
    n.modositotta = felh.n;
    sorFrissitese_('jatek', 'NJK-k', n);
    kampanyVerziokNovelese_(njkKampanyai_(n), k.kampanyok);
    valtozasNaplozasa_(felh, uj ? 'njk.kep' : 'njk.kep:torol', n.id, verzio, n.verzio);
    return { verzio: n.verzio, modositva: n.modositva, kep: uj };
  });
}

// Az image.get engedélylistájához: a felhasználó által látható NJK-k képei.
function njkKepekEngedese_(felh, k, engedett) {
  const megosztasok = sorok_('jatek', 'Megosztások');
  njkSorok_().forEach(function (n) {
    const kep = njkKep_(n);
    if (!kep || !njkLathatosag_(felh, n, k, megosztasok)) return;
    if (kep.kep) engedett[kep.kep] = true;
    if (kep.belyeg) engedett[kep.belyeg] = true;
  });
}
