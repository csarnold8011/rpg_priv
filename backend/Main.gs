// Fantasy AGE családi webapp, háttérszolgáltatás (Google Apps Script).
// Belépési pont: minden kérés POST, text/plain törzzsel: { action, token, adat }.

// Függvényként, hogy a fájlok betöltési sorrendje ne számítson.
function muveletek_() {
  return {
    'login':                   { fn: belepes_, nyilvanos: true },
    'init':                    { fn: indulas_ },
    'users.admin':             { fn: felhasznaloKezeles_, szerep: 'dm' },
    'rules.version':           { fn: szabalyVerzio_ },
    'rules.get':               { fn: szabalyokLekerese_ },
    'state.poll':              { fn: allapotFigyeles_ },
    'state.get':               { fn: allapotLekerese_ },
    'characters.list':         { fn: karakterLista_ },
    'character.get':           { fn: karakterLekerese_ },
    'character.create':        { fn: karakterLetrehozasa_ },
    'character.save':          { fn: karakterMentese_ },
    'character.assign':        { fn: karakterTarsitasa_, szerep: 'dm' },
    'character.archive':       { fn: karakterArchivalasa_, szerep: 'dm' },
    'character.delete':        { fn: karakterTorlese_, szerep: 'dm' },
    'campaigns.list':          { fn: kampanyLista_ },
    'campaign.create':         { fn: kampanyLetrehozasa_, szerep: 'dm' },
    'campaign.update':         { fn: kampanyModositasa_, szerep: 'dm' },
    'campaign.delete':         { fn: kampanyTorlese_, szerep: 'dm' },
    'campaign.addCharacter':   { fn: kampanyhozRendeles_, szerep: 'dm' },
    'campaign.removeCharacter':{ fn: kampanybolKivetel_, szerep: 'dm' },
    'roll.log':                { fn: dobasNaplozasa_ },
    'share.send':              { fn: megosztasKuldese_, szerep: 'dm' }
    // 'ai.ask': a 4. fejlesztési lépésben
  };
}

function doGet() {
  return json_({ ok: true, szolgaltatas: 'Fantasy AGE háttér', ido: most_() });
}

function doPost(e) {
  let keres;
  try {
    keres = JSON.parse(e.postData.contents);
  } catch (err) {
    return json_({ ok: false, hiba: 'hibas_keres', uzenet: 'A kérés nem érvényes JSON.' });
  }
  try {
    const muvelet = muveletek_()[keres.action];
    if (!muvelet) throw hiba_('ismeretlen_muvelet', 'Ismeretlen művelet: ' + keres.action);
    let felh = null;
    if (!muvelet.nyilvanos) felh = tokenEllenorzes_(keres.token);
    if (muvelet.szerep && felh.r !== muvelet.szerep) throw hiba_('nincs_jogosultsag', 'Ehhez nincs jogosultságod.');
    const eredmeny = muvelet.fn(keres.adat || {}, felh) || {};
    if (eredmeny._nyers) return nyers_(eredmeny._nyers);
    return json_(Object.assign({ ok: true }, eredmeny));
  } catch (err) {
    if (err && err.kod) return json_(Object.assign({ ok: false, hiba: err.kod, uzenet: err.uzenet || '' }, err.extra || {}));
    console.error(err && err.stack || err);
    return json_({ ok: false, hiba: 'szerverhiba', uzenet: String(err && err.message || err) });
  }
}

// ---- Segédfüggvények ----

function hiba_(kod, uzenet, extra) {
  return { kod: kod, uzenet: uzenet || '', extra: extra || null };
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function nyers_(szoveg) {
  return ContentService.createTextOutput(szoveg).setMimeType(ContentService.MimeType.JSON);
}

function most_() {
  return new Date().toISOString();
}

function ujId_(elotag) {
  return elotag + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 10);
}

function igaz_(x) {
  if (x === '' || x === null || x === undefined) return true; // üres = aktív
  return x === true || x === 1 || ['true', 'igen', '1', 'i', 'x'].indexOf(String(x).toLowerCase()) >= 0;
}

// Zárolás alatt a lapok mindig a táblázatból olvasódnak (lásd Adat.gs, gyorsítótár).
function zarolva_(fn) {
  const zar = LockService.getScriptLock();
  zar.waitLock(15000);
  const elozo = _zarolasAlatt;
  _zarolasAlatt = true;
  try {
    return fn();
  } finally {
    _zarolasAlatt = elozo;
    zar.releaseLock();
  }
}
