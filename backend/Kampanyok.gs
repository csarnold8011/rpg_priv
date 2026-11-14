// Kampányok, karakterek kampányhoz rendelése, és a kampány élő állapota (state.get).

const DOBASNAPLO_HOSSZ = 100;

function kampanyNezet_(kampany, szerep) {
  const o = {
    id: kampany.id, cim: kampany.cim, mesterjatekos_id: kampany.mesterjatekos_id || '',
    aktiv_forrasok: Array.isArray(kampany.aktiv_forrasok) ? kampany.aktiv_forrasok : [],
    allapot: kampany.allapot, verzio: Number(kampany.verzio) || 0, sajat_szerep: szerep,
    beallitasok: kampanyBeallitasai_(kampany)
  };
  if (szerep === 'dm') o.dm_jegyzet = kampany.dm_jegyzet || '';
  return o;
}

const ARCHIVALT = 'archivált';

// action: campaigns.list
// Az archivált kampányokat csak a DM látja.
function kampanyLista_(a, felh, kornyezet) {
  const k = kornyezet || kornyezet_();
  const lista = [];
  k.kampanyok.forEach(function (kampany) {
    const szerep = kampanySzerep_(felh, kampany, k);
    if (szerep && (szerep === 'dm' || kampany.allapot !== ARCHIVALT)) lista.push(kampanyNezet_(kampany, szerep));
  });
  return { kampanyok: lista };
}

// action: init
// Minden, ami a nyitóképernyőhöz kell, egyetlen hívásban: kampányok, karakterek, és a DM-nek a felhasználók.
function indulas_(a, felh) {
  const k = kornyezet_();
  const o = {
    kampanyok: kampanyLista_(a, felh, k).kampanyok,
    karakterek: karakterLista_(a, felh, k).karakterek
  };
  if (felh.r === 'dm') o.felhasznalok = sorok_('jatek', 'Felhasználók').map(publikus_);
  return o;
}

// action: campaign.delete (csak DM)   adat: { id }
// Csak archivált kampány törölhető. A kampánykapcsolatok törlődnek, a karakterek megmaradnak,
// a dobásnapló és a megosztások sorai is maradnak.
function kampanyTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.id, k);
    if (kampany.allapot !== ARCHIVALT) throw hiba_('hibas_adat', 'Csak archivált kampány törölhető. Előbb archiváld.');
    const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; });
    sorokTorlese_('jatek', 'Kampánykarakterek', kapcsolatok.map(function (x) { return x._sor; }));
    sorTorlese_('jatek', 'Kampányok', kampany._sor);
    CacheService.getScriptCache().remove('kv_' + kampany.id);
    valtozasNaplozasa_(felh, 'kampany.torol', kampany.id, kampany.verzio, '');
    return { torolve: kampany.id };
  });
}

// action: campaign.create (DM)   adat: { cim, aktiv_forrasok?, mesterjatekos_id?, allapot? }
function kampanyLetrehozasa_(a, felh) {
  const cim = String(a.cim || '').trim();
  if (!cim) throw hiba_('hianyzo_adat', 'Adj címet a kampánynak.');
  return zarolva_(function () {
    const kampany = {
      id: ujId_('c'), cim: cim, mesterjatekos_id: a.mesterjatekos_id || '',
      aktiv_forrasok: a.aktiv_forrasok || ['Alapkönyv', 'Companion'],
      allapot: a.allapot || 'előkészítés', verzio: 1, dm_jegyzet: a.dm_jegyzet || '', letrehozva: most_()
    };
    sorHozzaadasa_('jatek', 'Kampányok', kampany);
    valtozasNaplozasa_(felh, 'kampany.letrehoz', kampany.id, '', 1);
    return { kampany: kampanyNezet_(kampany, 'dm') };
  });
}

// action: campaign.update (DM)   adat: { id, cim?, aktiv_forrasok?, mesterjatekos_id?, allapot?, dm_jegyzet?, beallitasok? }
function kampanyModositasa_(a, felh) {
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    const kampany = kampanyok.find(function (x) { return x.id === a.id; });
    if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    ['cim', 'aktiv_forrasok', 'mesterjatekos_id', 'allapot', 'dm_jegyzet'].forEach(function (m) {
      if (a[m] !== undefined) kampany[m] = a[m];
    });
    if (a.beallitasok && typeof a.beallitasok === 'object') {
      const regi = kampany.beallitasok && typeof kampany.beallitasok === 'object' ? kampany.beallitasok : {};
      kampany.beallitasok = Object.assign({}, regi, a.beallitasok);
    }
    sorFrissitese_('jatek', 'Kampányok', kampany);
    kampanyVerziokNovelese_([kampany.id], kampanyok);
    valtozasNaplozasa_(felh, 'kampany.modosit', kampany.id, '', kampany.verzio);
    return { kampany: kampanyNezet_(kampany, 'dm') };
  });
}

// action: campaign.addCharacter (DM)   adat: { kampany_id, karakter_id, allapot? }
// allapot: aktív, távol, kilépett, elhunyt. Ha a karakter már a kampányban van, csak az állapota változik.
function kampanyhozRendeles_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    kampanyKeresese_(a.kampany_id, k);
    karakterKeresese_(a.karakter_id, k);
    const allapot = a.allapot || 'aktív';
    const letezo = k.kapcsolatok.find(function (x) { return x.kampany_id === a.kampany_id && x.karakter_id === a.karakter_id; });
    if (letezo) {
      letezo.allapot = allapot;
      sorFrissitese_('jatek', 'Kampánykarakterek', letezo);
    } else {
      sorHozzaadasa_('jatek', 'Kampánykarakterek', { kampany_id: a.kampany_id, karakter_id: a.karakter_id, allapot: allapot, csatlakozott: most_() });
    }
    kampanyVerziokNovelese_([a.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'kampany.karakter:' + allapot, a.karakter_id, '', a.kampany_id);
    return {};
  });
}

// action: campaign.removeCharacter (DM)   adat: { kampany_id, karakter_id }
function kampanybolKivetel_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const letezo = k.kapcsolatok.find(function (x) { return x.kampany_id === a.kampany_id && x.karakter_id === a.karakter_id; });
    if (!letezo) throw hiba_('nem_talalhato', 'A karakter nincs ebben a kampányban.');
    sorTorlese_('jatek', 'Kampánykarakterek', letezo._sor);
    kampanyVerziokNovelese_([a.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'kampany.karakter:kivesz', a.karakter_id, '', a.kampany_id);
    return {};
  });
}

// action: state.get   adat: { kampany_id }
// A kampány élő állapota, a kérő szerepe szerint szűrve.
function allapotLekerese_(a, felh) {
  const k = kornyezet_();
  const kampany = kampanyKeresese_(a.kampany_id, k);
  const szerep = kampanySzerep_(felh, kampany, k);
  if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
  if (szerep !== 'dm' && kampany.allapot === ARCHIVALT) throw hiba_('nincs_jogosultsag', 'Ez a kampány archiválva van.');
  const mindentLat = szerep === 'dm' || szerep === 'mester';

  const kapcsolatok = k.kapcsolatok.filter(function (x) { return x.kampany_id === kampany.id; });
  const karakterek = kapcsolatok.map(function (x) {
    const kar = k.karakterek.find(function (c) { return c.id === x.karakter_id; });
    if (!kar || !igaz_(kar.aktiv)) return null; // archivált karakter nem látszik a kampányban
    const irhato = karakterIrhato_(felh, kar, k);
    const o = irhato ? karakterTeljes_(kar, k, felh) : {
      // a csapattársakról csak a névsor látszik
      id: kar.id, nev: kar.nev, faj: kar.faj, osztaly: kar.osztaly, szint: kar.szint, irhato: false, kep: karakterBelyeg_(kar)
    };
    o.kampany_allapot = x.allapot;
    return o;
  }).filter(Boolean);

  const sajatKarakterek = karakterek.filter(function (c) { return c.irhato; }).map(function (c) { return c.id; });

  const probak = kampanyProbai_(kampany, szerep, sajatKarakterek);
  // rejtett Célértékű próbakérés dobásainál a játékos nem látja a Célértéket (csak a sikert)
  const rejtettCel = {};
  if (!mindentLat) probaSorok_().forEach(function (p) {
    if (p.kampany_id === kampany.id && igaz_rejtett_(p.celertek_rejtett)) rejtettCel[p.id] = true;
  });
  const dobasok = utolsoSorok_('jatek', 'Dobásnapló', DOBASNAPLO_HOSSZ * 3)
    .filter(function (d) { return d.kampany_id === kampany.id; })
    .filter(function (d) { return szerep === 'dm' || !igaz_rejtett_(d.rejtett); })
    .slice(-DOBASNAPLO_HOSSZ)
    .map(function (d) {
      delete d._sor;
      d.rejtett = igaz_rejtett_(d.rejtett);
      d.kezi = igaz_rejtett_(d.kezi);
      d.felfedve = igaz_rejtett_(d.felfedve);
      if (d.proba_id && rejtettCel[d.proba_id]) d.celertek = '';
      return d;
    });

  const megosztasok = sorok_('jatek', 'Megosztások')
    .filter(function (m) { return m.kampany_id === kampany.id; })
    .filter(function (m) { return mindentLat || m.cimzett === 'mindenki' || sajatKarakterek.indexOf(m.cimzett) >= 0; })
    .map(function (m) { delete m._sor; return m; });

  return {
    verzio: Number(kampany.verzio) || 0,
    kampany: kampanyNezet_(kampany, szerep),
    karakterek: karakterek,
    dobasok: dobasok,
    probak: probak,
    megosztasok: megosztasok
  };
}

// A rejtett mező üresen hamis (szemben az aktiv mezővel, ami üresen igaz).
function igaz_rejtett_(x) {
  return x === true || ['true', 'igen', '1'].indexOf(String(x).toLowerCase()) >= 0;
}
