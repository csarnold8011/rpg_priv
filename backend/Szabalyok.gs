// Szabályadatbázis kiadása. A böngésző verziószámmal tárolja, és csak verzióváltáskor tölti le újra.

function aktualisSzabalyVerzio_() {
  const c = CacheService.getScriptCache();
  const v = c.get('szabaly_verzio');
  if (v !== null) return Number(v);
  const sor = sorok_('szabaly', 'Meta').find(function (x) { return x.kulcs === 'szabaly_verzio'; });
  const szam = sor ? Number(sor.ertek) || 1 : 1;
  c.put('szabaly_verzio', String(szam), 21600);
  return szam;
}

// action: rules.version
function szabalyVerzio_() {
  return { verzio: aktualisSzabalyVerzio_() };
}

// action: rules.get
// Válasz: { ok, verzio, lapok: { 'Fajok': [...], 'Talentumok': [...], ... } }
// Az inaktív (aktiv = hamis) elemek nem kerülnek bele.
function szabalyokLekerese_() {
  const verzio = aktualisSzabalyVerzio_();
  const kulcs = 'szabalyok_v' + verzio;
  let lapokJson = gyorsitotarOlvasas_(kulcs);
  if (lapokJson === null) {
    const lapok = {};
    SEMA.szabaly_lapok.forEach(function (nev) {
      lapok[nev] = sorok_('szabaly', nev)
        .filter(function (s) { return igaz_(s.aktiv); })
        .map(function (s) { delete s._sor; return s; });
    });
    lapokJson = JSON.stringify(lapok);
    gyorsitotarIras_(kulcs, lapokJson);
  }
  return { _nyers: '{"ok":true,"verzio":' + verzio + ',"lapok":' + lapokJson + '}' };
}

// Az Apps Script szerkesztőből futtatható: a szabályadat módosítása után növeli a verziót,
// így a böngészők legközelebb újratöltik.
function szabalyVerzioNovelese() {
  const lap = lap_('szabaly', 'Meta');
  const sorok = sorok_('szabaly', 'Meta');
  const sor = sorok.find(function (x) { return x.kulcs === 'szabaly_verzio'; });
  const uj = (sor ? Number(sor.ertek) || 1 : 0) + 1;
  if (sor) cellaIrasa_('szabaly', 'Meta', sor._sor, 'ertek', uj);
  else lap.appendRow(['szabaly_verzio', uj]);
  CacheService.getScriptCache().put('szabaly_verzio', String(uj), 21600);
  Logger.log('Új szabályverzió: ' + uj);
  return uj;
}
