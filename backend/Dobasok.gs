// Dobásnapló, próbakérések és megosztások. A kocka a böngészőben gurul, ide csak az eredmény érkezik.
// A próbák szabályai (a felületen): web/js/jatek/proba.js. Itt csak annyi számolás van, amennyi a rejtett
// Célértékhez és a próbakérés állásához kell (a játékos böngészője a rejtett Célértéket nem ismeri).

const DOBAS_TIPUSOK = ['alap', 'ellen', 'osszetett', 'tamadas', 'varazslas', 'szabad', 'titkos'];
const PROBA_TIPUSOK = ['alap', 'ellen', 'osszetett', 'titkos'];
const KERESES_HOSSZ = 1000; // ennyi utolsó dobássorban keres a roll.update és a dupla küldés szűrése

function szamOsszeg_(kockak) {
  return (kockak || []).reduce(function (a, b) { return a + (Number(b) || 0); }, 0);
}

function duplaE_(k) {
  return k.length === 3 && (k[0] === k[1] || k[0] === k[2] || k[1] === k[2]);
}

// A próba kiértékelése a szerveren (csak a rejtett Célértékű és a próbakéréshez tartozó dobásoknál).
function dobasKiertekelese_(kockak, modosito, celertek, opciok) {
  const o = opciok || {};
  const osszeg = szamOsszeg_(kockak) + (Number(modosito) || 0);
  let eredmeny = '';
  if (o.fokusz_hianyzik) eredmeny = 'kudarc';
  else if (celertek !== '' && celertek !== undefined && celertek !== null && !isNaN(Number(celertek))) {
    eredmeny = osszeg >= Number(celertek) ? 'siker' : 'kudarc';
  }
  const mp = !o.mutatvany_tiltva && duplaE_(kockak) && eredmeny !== 'kudarc' ? Number(kockak[2]) || 0 : 0;
  return { osszeg: osszeg, eredmeny: eredmeny, mutatvanypont: mp };
}

// action: roll.log
// adat: { id?, kampany_id?, karakter_id?, mire, kockak: [k1, k2, sarkanykocka], modosito, celertek?, eredmeny?,
//         mutatvanypont?, rejtett?, proba_id?, tipus?, tulajdonsag?, fokusz?, kezi?, reszletek?, ellenfel? }
// Kampány nélkül is naplózható, ha van karakter, és a hívó szerkesztheti (a karakter saját dobásai).
function dobasNaplozasa_(a, felh) {
  if (!a.kampany_id && !a.karakter_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány vagy a karakter azonosítója.');
  if (!Array.isArray(a.kockak) || a.kockak.length < 1) throw hiba_('hianyzo_adat', 'Hiányoznak a kockák.');
  return zarolva_(function () {
    const k = kornyezet_();
    let kampany = null, szerep = null;
    if (a.kampany_id) {
      kampany = kampanyKeresese_(a.kampany_id, k);
      szerep = kampanySzerep_(felh, kampany, k);
      if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    }
    if (a.karakter_id) {
      const kar = karakterKeresese_(a.karakter_id, k);
      if (!karakterIrhato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ennek a karakternek a nevében nem dobhatsz.');
    }
    // kiesés utáni újraküldésnél ne kerüljön be kétszer ugyanaz a dobás
    if (a.id) {
      const megvan = utolsoSorok_('jatek', 'Dobásnapló', KERESES_HOSSZ).find(function (d) { return d.id === a.id; });
      if (megvan) { delete megvan._sor; return { dobas: megvan, kampany_verziok: {} }; }
    }
    const dobas = {
      id: a.id || ujId_('d'), idopont: most_(), kampany_id: kampany ? kampany.id : '', karakter_id: a.karakter_id || '',
      dobta: felh.n, mire: a.mire || '', kockak: a.kockak, modosito: Number(a.modosito) || 0,
      celertek: a.celertek === undefined || a.celertek === null ? '' : a.celertek, eredmeny: a.eredmeny || '',
      mutatvanypont: Number(a.mutatvanypont) || 0,
      rejtett: szerep === 'dm' && !!a.rejtett, // rejtett dobás csak a DM-é lehet
      proba_id: '', tipus: DOBAS_TIPUSOK.indexOf(a.tipus) >= 0 ? a.tipus : '',
      tulajdonsag: a.tulajdonsag || '', fokusz: a.fokusz || '', kezi: !!a.kezi, felfedve: false,
      reszletek: a.reszletek && typeof a.reszletek === 'object' ? a.reszletek : ''
    };
    let proba = null;
    if (a.proba_id && kampany) {
      proba = probaSorok_().find(function (p) { return p.id === a.proba_id && p.kampany_id === kampany.id; });
      if (proba) probahozDobas_(proba, dobas, a, szerep);
    }
    sorHozzaadasa_('jatek', 'Dobásnapló', dobas);
    if (proba) sorFrissitese_('jatek', 'Próbák', proba);
    // a rejtett dobás nem jelez változást a játékosoknak (a DM kliense a küldés után maga frissít)
    const verziok = kampany && !dobas.rejtett ? kampanyVerziokNovelese_([kampany.id], k.kampanyok) : {};
    return { dobas: dobas, kampany_verziok: verziok };
  });
}

// Próbakéréshez tartozó dobás: a szerver értékel (rejtett Célérték, kötelező fókusz, tiltott Mutatványpont),
// és frissíti a kérés állását. Az állás kulcsa a karakter, az ellenfélé '_ellenfel', a DM szabad dobásáé '_dm'.
function probahozDobas_(proba, dobas, a, szerep) {
  if (proba.allapot === 'lezart') throw hiba_('hibas_adat', 'Ez a próba már le van zárva.');
  dobas.proba_id = proba.id;
  if (!dobas.tipus) dobas.tipus = proba.tipus;
  const ellenfel = !!a.ellenfel && (szerep === 'dm' || szerep === 'mester');
  const kulcs = ellenfel ? '_ellenfel' : (dobas.karakter_id || '_dm');
  if (proba.tipus === 'titkos') dobas.rejtett = true;
  if (!ellenfel) {
    const fokuszok = Array.isArray(proba.fokuszok) ? proba.fokuszok : [];
    const mut = proba.mutatvany && typeof proba.mutatvany === 'object' ? proba.mutatvany : {};
    const celertek = proba.tipus === 'ellen' ? '' : proba.celertek;
    const ert = dobasKiertekelese_(dobas.kockak, dobas.modosito, celertek, {
      fokusz_hianyzik: igaz_rejtett_(proba.fokusz_kotelezo) && fokuszok.length > 0 && fokuszok.indexOf(dobas.fokusz) < 0,
      mutatvany_tiltva: mut.engedett === false
    });
    if (celertek !== '' && celertek !== undefined) {
      dobas.celertek = Number(celertek);
      dobas.eredmeny = ert.eredmeny;
      dobas.mutatvanypont = ert.mutatvanypont;
    } else if (mut.engedett === false) dobas.mutatvanypont = 0;
  }
  const allas = proba.allas && typeof proba.allas === 'object' ? proba.allas : {};
  const e = allas[kulcs] || { dobasok: [], osszeg: 0, kesz: false };
  e.dobasok.push(dobas.id);
  e.utolso = { osszeg: szamOsszeg_(dobas.kockak) + dobas.modosito, sarkany: Number(dobas.kockak[2]) || 0,
    eredmeny: dobas.eredmeny, mutatvanypont: dobas.mutatvanypont, idopont: dobas.idopont };
  if (proba.tipus === 'osszetett' && dobas.eredmeny === 'siker') {
    e.osszeg += Number(dobas.kockak[2]) || 0;
    if (!e.kesz && e.osszeg >= (Number(proba.kuszob) || 0)) {
      e.kesz = true;
      e.kesz_sorszam = Object.keys(allas).filter(function (x) { return allas[x].kesz; }).length + 1;
      e.probak_szama = e.dobasok.length;
    }
  }
  allas[kulcs] = e;
  proba.allas = allas;
}

// action: roll.update   adat: { id, mutatvanyok?: [{ id, mp, db }], felfedve?: true }
// A mutatványokat a dobó (vagy a DM, mesterjátékos) rögzítheti, felfedni csak a DM tud.
function dobasModositasa_(a, felh) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a dobás azonosítója.');
  return zarolva_(function () {
    const k = kornyezet_();
    const dobas = utolsoSorok_('jatek', 'Dobásnapló', KERESES_HOSSZ).find(function (d) { return d.id === a.id; });
    if (!dobas) throw hiba_('nem_talalhato', 'Nincs ilyen dobás (vagy túl régi).');
    const kampany = dobas.kampany_id ? k.kampanyok.find(function (x) { return x.id === dobas.kampany_id; }) : null;
    const szerep = kampany ? kampanySzerep_(felh, kampany, k) : (felh.r === 'dm' ? 'dm' : null);
    const kar = dobas.karakter_id ? k.karakterek.find(function (x) { return x.id === dobas.karakter_id; }) : null;
    const sajat = dobas.dobta === felh.n || (kar && karakterIrhato_(felh, kar, k));
    if (a.felfedve !== undefined && szerep !== 'dm') throw hiba_('nincs_jogosultsag', 'Rejtett dobást csak a DM fedhet fel.');
    if (a.mutatvanyok !== undefined && !sajat && szerep !== 'dm' && szerep !== 'mester') throw hiba_('nincs_jogosultsag', 'Ehhez a dobáshoz nincs jogosultságod.');
    const reszletek = dobas.reszletek && typeof dobas.reszletek === 'object' ? dobas.reszletek : {};
    if (a.mutatvanyok !== undefined) {
      if (!Array.isArray(a.mutatvanyok)) throw hiba_('hibas_adat', 'A mutatványok listája hibás.');
      reszletek.mutatvanyok = a.mutatvanyok.slice(0, 20).map(function (m) {
        return { id: String(m.id || ''), mp: Number(m.mp) || 0, db: Number(m.db) || 1, nev: m.nev ? String(m.nev).slice(0, 80) : undefined };
      });
    }
    dobas.reszletek = reszletek;
    if (a.felfedve) { dobas.felfedve = true; dobas.rejtett = false; }
    sorFrissitese_('jatek', 'Dobásnapló', dobas);
    const verziok = kampany && (!igaz_rejtett_(dobas.rejtett) || a.felfedve) ? kampanyVerziokNovelese_([kampany.id], k.kampanyok) : {};
    delete dobas._sor;
    return { dobas: dobas, kampany_verziok: verziok };
  });
}

// action: roll.list   adat: { karakter_id, elotte?: idopont, db?: 50 }
// Egy karakter dobásai (a karakter oldalához), az újabbak elöl. A rejtetteket csak a DM látja.
function dobasLista_(a, felh) {
  const k = kornyezet_();
  const kar = karakterKeresese_(a.karakter_id, k);
  if (!karakterLathato_(felh, kar, k)) throw hiba_('nincs_jogosultsag', 'Ennek a karakternek a dobásait nem láthatod.');
  const db = Math.min(Number(a.db) || 50, 200);
  // ritka hívás: közvetlenül a táblázatból, hogy a nagy eredmény ne terhelje a gyorsítótárat
  const lista = utolsoSorokTablazatbol_('jatek', 'Dobásnapló', 3000)
    .filter(function (d) { return d.karakter_id === kar.id; })
    .filter(function (d) { return felh.r === 'dm' || !igaz_rejtett_(d.rejtett); })
    .filter(function (d) { return !a.elotte || String(d.idopont) < String(a.elotte); })
    .reverse().slice(0, db)
    .map(function (d) { delete d._sor; d.rejtett = igaz_rejtett_(d.rejtett); return d; });
  return { dobasok: lista, tobb: lista.length === db };
}

// ---- Próbakérések (DM és mesterjátékos) ----

// A Próbák lap sorai. Ha a lap még nincs meg (új verzió, de az elsoBeallitas még nem futott), üres lista,
// hogy a kampány állapota addig is betöltődjön.
function probaSorok_() {
  try { return sorok_('jatek', 'Próbák'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function probaJog_(felh, kampanyId, tipus) {
  const k = kornyezet_();
  const kampany = kampanyKeresese_(kampanyId, k);
  const szerep = kampanySzerep_(felh, kampany, k);
  if (szerep !== 'dm' && szerep !== 'mester') throw hiba_('nincs_jogosultsag', 'Próbát a DM és a mesterjátékos kérhet.');
  if (tipus === 'titkos' && szerep !== 'dm') throw hiba_('nincs_jogosultsag', 'Titkos próbát csak a DM kérhet.');
  return { k: k, kampany: kampany, szerep: szerep };
}

function probaMezok_(p, a) {
  if (a.cim !== undefined) p.cim = String(a.cim || '').slice(0, 120);
  if (a.tulajdonsag !== undefined) p.tulajdonsag = a.tulajdonsag || '';
  if (a.fokuszok !== undefined) p.fokuszok = Array.isArray(a.fokuszok) ? a.fokuszok.slice(0, 10) : [];
  if (a.fokusz_kotelezo !== undefined) p.fokusz_kotelezo = !!a.fokusz_kotelezo;
  if (a.celertek !== undefined) p.celertek = a.celertek === '' || a.celertek === null ? '' : Number(a.celertek);
  if (a.celertek_rejtett !== undefined) p.celertek_rejtett = !!a.celertek_rejtett;
  if (a.kuszob !== undefined) p.kuszob = a.kuszob === '' || a.kuszob === null ? '' : Number(a.kuszob);
  if (a.haladas !== undefined) p.haladas = a.haladas === 'kozos' ? 'kozos' : 'egyeni';
  if (a.idoegyseg !== undefined) p.idoegyseg = String(a.idoegyseg || '').slice(0, 60);
  if (a.cimzettek !== undefined) p.cimzettek = Array.isArray(a.cimzettek) ? a.cimzettek : 'mindenki';
  if (a.modositok !== undefined) p.modositok = a.modositok && typeof a.modositok === 'object' ? a.modositok : {};
  if (a.mutatvany !== undefined) p.mutatvany = a.mutatvany && typeof a.mutatvany === 'object' ? a.mutatvany : { engedett: true };
  if (a.ellenfel !== undefined) p.ellenfel = a.ellenfel && typeof a.ellenfel === 'object' ? a.ellenfel : '';
}

// action: test.request   adat: { kampany_id, tipus, cim, tulajdonsag, fokuszok, fokusz_kotelezo, celertek,
//   celertek_rejtett, kuszob, haladas, idoegyseg, cimzettek, modositok, mutatvany, ellenfel }
function probaKerese_(a, felh) {
  const tipus = PROBA_TIPUSOK.indexOf(a.tipus) >= 0 ? a.tipus : 'alap';
  if (tipus === 'osszetett' && !(Number(a.kuszob) > 0)) throw hiba_('hianyzo_adat', 'Az összetett próbához Sikerküszöb kell.');
  return zarolva_(function () {
    const j = probaJog_(felh, a.kampany_id, tipus);
    const beall = kampanyBeallitasai_(j.kampany);
    const p = {
      id: ujId_('p'), kampany_id: j.kampany.id, letrehozva: most_(), letrehozta: felh.n, tipus: tipus,
      cim: '', tulajdonsag: '', fokuszok: [], fokusz_kotelezo: false, celertek: '',
      celertek_rejtett: beall.celertek_rejtett, kuszob: '', haladas: 'egyeni', idoegyseg: '', cimzettek: 'mindenki',
      modositok: {}, mutatvany: { engedett: true }, ellenfel: '', allas: {}, allapot: 'nyitott', lezarva: ''
    };
    probaMezok_(p, a);
    sorHozzaadasa_('jatek', 'Próbák', p);
    // a titkos próba nem jelez a játékosoknak
    const verziok = tipus === 'titkos' ? {} : kampanyVerziokNovelese_([j.kampany.id], j.k.kampanyok);
    delete p._sor;
    return { proba: p, kampany_verziok: verziok };
  });
}

// action: test.update   adat: { id, ...mezők }   action: test.close   adat: { id, ujranyit? }
function probaModositasa_(a, felh) { return probaIrasa_(a, felh, false); }
function probaLezarasa_(a, felh) { return probaIrasa_(a, felh, true); }

function probaIrasa_(a, felh, lezaras) {
  if (!a.id) throw hiba_('hianyzo_adat', 'Hiányzik a próba azonosítója.');
  return zarolva_(function () {
    const p = probaSorok_().find(function (x) { return x.id === a.id; });
    if (!p) throw hiba_('nem_talalhato', 'Nincs ilyen próba.');
    const j = probaJog_(felh, p.kampany_id, p.tipus);
    if (lezaras) {
      p.allapot = a.ujranyit ? 'nyitott' : 'lezart';
      p.lezarva = a.ujranyit ? '' : most_();
    } else probaMezok_(p, a);
    sorFrissitese_('jatek', 'Próbák', p);
    const verziok = p.tipus === 'titkos' ? {} : kampanyVerziokNovelese_([j.kampany.id], j.k.kampanyok);
    delete p._sor;
    return { proba: p, kampany_verziok: verziok };
  });
}

// A kampány próbái a kérő szerepe szerint: a nyitottak és az utolsó 10 lezárt.
// A játékos nem látja a titkos próbát, a rejtett Célértéket és a nem neki szóló kérést.
function kampanyProbai_(kampany, szerep, sajatKarakterek) {
  const mind = probaSorok_().filter(function (p) { return p.kampany_id === kampany.id; });
  const nyitott = mind.filter(function (p) { return p.allapot !== 'lezart'; });
  const lezart = mind.filter(function (p) { return p.allapot === 'lezart'; }).slice(-10);
  const mindentLat = szerep === 'dm';
  return nyitott.concat(lezart).filter(function (p) {
    if (mindentLat) return true;
    if (p.tipus === 'titkos') return false;
    if (szerep === 'mester') return true;
    return p.cimzettek === 'mindenki' || !Array.isArray(p.cimzettek) ||
      p.cimzettek.some(function (id) { return sajatKarakterek.indexOf(id) >= 0; });
  }).map(function (p) {
    const o = Object.assign({}, p);
    delete o._sor;
    o.fokusz_kotelezo = igaz_rejtett_(p.fokusz_kotelezo);
    o.celertek_rejtett = igaz_rejtett_(p.celertek_rejtett);
    if (!mindentLat && o.celertek_rejtett && szerep !== 'mester') o.celertek = '';
    if (!mindentLat && o.ellenfel && typeof o.ellenfel === 'object' && szerep !== 'mester') o.ellenfel = { nev: o.ellenfel.nev || '' };
    return o;
  });
}

// ---- Kampány beállításai ----

function kampanyBeallitasai_(kampany) {
  const b = kampany.beallitasok && typeof kampany.beallitasok === 'object' ? kampany.beallitasok : {};
  const m = b.mutatvanyok && typeof b.mutatvanyok === 'object' ? b.mutatvanyok : {};
  return {
    mutatvanyok: {
      felfedezes: m.felfedezes !== false, szerepjatek: m.szerepjatek !== false,
      isteni: m.isteni === true, nyomozas: m.nyomozas === true
    },
    celertek_rejtett: b.celertek_rejtett !== false,
    dobas_reszletek_lathatok: b.dobas_reszletek_lathatok !== false
  };
}

// action: share.send (DM)
// adat: { kampany_id, cimzett: 'mindenki' | karakter_id, tipus: 'kep' | 'level' | 'szoveg', cim, hivatkozas }
function megosztasKuldese_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    if (!kampanyok.some(function (x) { return x.id === a.kampany_id; })) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    const m = {
      id: ujId_('m'), kampany_id: a.kampany_id, cimzett: a.cimzett || 'mindenki', tipus: a.tipus || 'szoveg',
      cim: a.cim || '', hivatkozas: a.hivatkozas || '', idopont: most_()
    };
    sorHozzaadasa_('jatek', 'Megosztások', m);
    kampanyVerziokNovelese_([a.kampany_id], kampanyok);
    return { megosztas: m };
  });
}
