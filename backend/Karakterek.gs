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
    keszites: kar.adat && typeof kar.adat === 'object' && kar.adat.keszites ? (kar.adat.keszites.allapot || '') : ''
  };
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
    valtozasNaplozasa_(felh, 'karakter.torol', kar.id, kar.verzio, '');
    return { torolve: kar.id };
  });
}
