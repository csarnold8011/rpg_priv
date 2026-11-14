// Összecsapás-építő (3. lépés, 3. ütem): előkészített összecsapások egy kampányhoz, csak a DM-nek.
// Terv: claude/csata-terv.md, „Összecsapás-építő” és „Oldalak és viszonyok”. A szerkezet (oldalak, viszonyok,
// kezdeményezési csoportok, résztvevők) és a nehézségbecslés a felületen van: web/js/jatek/osszecsapas.js.
// Itt csak tárolás, verziózás és a kampány verziójának növelése. A 4. ütem csatája ebből indul.

const OSSZECSAPAS_ALLAPOTOK = ['előkészítés', 'kész', 'lefutott'];
const MAX_OSSZECSAPAS_MERET = 48000;

// Az Összecsapások lap sorai. Ha a lap még nincs meg (az elsoBeallitas előtt), üres lista.
function osszecsapasSorok_() {
  try { return sorok_('jatek', 'Összecsapások'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function osszecsapasNezet_(e) {
  return {
    id: e.id, kampany_id: e.kampany_id, cim: e.cim, allapot: e.allapot || 'előkészítés',
    adat: e.adat && typeof e.adat === 'object' ? e.adat : {},
    verzio: Number(e.verzio) || 0, letrehozva: e.letrehozva, modositva: e.modositva, modositotta: e.modositotta || '',
    aktiv: igaz_(e.aktiv)
  };
}

function osszecsapasKeresese_(id, sorok) {
  const e = (sorok || osszecsapasSorok_()).find(function (x) { return x.id === id; });
  if (!e) throw hiba_('nem_talalhato', 'Nincs ilyen összecsapás.');
  return e;
}

// A kampány aktív összecsapásai (state.get, csak a DM-nek).
function kampanyOsszecsapasai_(kampany) {
  return osszecsapasSorok_()
    .filter(function (e) { return e.kampany_id === kampany.id && igaz_(e.aktiv); })
    .map(osszecsapasNezet_);
}

// action: encounter.list (DM)   adat: { kampany_id?, archivaltak? }
function osszecsapasLista_(a) {
  const lista = osszecsapasSorok_()
    .filter(function (e) { return (!a.kampany_id || e.kampany_id === a.kampany_id) && (a.archivaltak || igaz_(e.aktiv)); })
    .map(osszecsapasNezet_);
  return { osszecsapasok: lista };
}

function osszecsapasMezok_(e, a, k) {
  if (a.cim !== undefined) {
    const cim = String(a.cim || '').trim().slice(0, 120);
    if (!cim) throw hiba_('hianyzo_adat', 'Adj címet az összecsapásnak.');
    e.cim = cim;
  }
  if (a.kampany_id !== undefined) {
    kampanyKeresese_(a.kampany_id, k);
    e.kampany_id = a.kampany_id;
  }
  if (a.allapot !== undefined) e.allapot = OSSZECSAPAS_ALLAPOTOK.indexOf(a.allapot) >= 0 ? a.allapot : 'előkészítés';
  if (a.adat !== undefined) {
    if (!a.adat || typeof a.adat !== 'object' || Array.isArray(a.adat)) throw hiba_('hibas_adat', 'Hibás összecsapás-adat.');
    if (JSON.stringify(a.adat).length > MAX_OSSZECSAPAS_MERET) throw hiba_('tul_nagy', 'Az összecsapás adatai túl nagyok egy cellához.');
    e.adat = a.adat;
  }
}

// action: encounter.save (DM)   adat: { id?, verzio?, kampany_id, cim, allapot?, adat }
// id nélkül új összecsapás (a kampány kötelező). Ha a verzio közben elavult, a válasz hiba: 'utkozes',
// benne az aktuális összecsapás.
function osszecsapasMentese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    if (!a.id) {
      if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Válassz kampányt az összecsapásnak.');
      const e = { id: ujId_('e'), kampany_id: '', cim: '', allapot: 'előkészítés', adat: {}, verzio: 1,
        letrehozva: most_(), modositva: most_(), modositotta: felh.n, aktiv: true };
      osszecsapasMezok_(e, Object.assign({ cim: a.cim || '' }, a), k);
      sorHozzaadasa_('jatek', 'Összecsapások', e);
      const kv = kampanyVerziokNovelese_([e.kampany_id], k.kampanyok);
      valtozasNaplozasa_(felh, 'osszecsapas.letrehoz', e.id, '', 1);
      return { osszecsapas: osszecsapasNezet_(e), kampany_verziok: kv };
    }
    const e = osszecsapasKeresese_(a.id);
    const regi = Number(e.verzio) || 0;
    if (a.verzio !== undefined && Number(a.verzio) !== regi) {
      throw hiba_('utkozes', 'Az összecsapást közben más is módosította.', { aktualis: osszecsapasNezet_(e) });
    }
    const regiKampany = e.kampany_id;
    osszecsapasMezok_(e, a, k);
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Összecsapások', e);
    const kv = kampanyVerziokNovelese_([regiKampany, e.kampany_id].filter(function (x, i, t) { return x && t.indexOf(x) === i; }), k.kampanyok);
    valtozasNaplozasa_(felh, 'osszecsapas.ment', e.id, regi, e.verzio);
    return { osszecsapas: osszecsapasNezet_(e), verzio: e.verzio, modositva: e.modositva, kampany_verziok: kv };
  });
}

// action: encounter.archive (DM)   adat: { id, aktiv }
function osszecsapasArchivalasa_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const e = osszecsapasKeresese_(a.id);
    e.aktiv = !!a.aktiv;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Összecsapások', e);
    kampanyVerziokNovelese_([e.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, e.aktiv ? 'osszecsapas.visszaallit' : 'osszecsapas.archival', e.id, '', '');
    return { osszecsapas: osszecsapasNezet_(e) };
  });
}

// action: encounter.delete (DM)   adat: { id }   Csak archivált összecsapás törölhető.
function osszecsapasTorlese_(a, felh) {
  return zarolva_(function () {
    const e = osszecsapasKeresese_(a.id);
    if (igaz_(e.aktiv)) throw hiba_('hibas_adat', 'Csak archivált összecsapás törölhető. Előbb archiváld.');
    sorTorlese_('jatek', 'Összecsapások', e._sor);
    valtozasNaplozasa_(felh, 'osszecsapas.torol', e.id, e.verzio, '');
    return { torolve: e.id };
  });
}

// A kampány törlésekor az összecsapásai is törlődnek (zárolás alatt hívandó).
function kampanyOsszecsapasainakTorlese_(kampanyId) {
  const sorok = osszecsapasSorok_().filter(function (e) { return e.kampany_id === kampanyId; });
  if (sorok.length) sorokTorlese_('jatek', 'Összecsapások', sorok.map(function (e) { return e._sor; }));
  return sorok.length;
}
