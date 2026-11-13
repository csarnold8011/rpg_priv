// Szabályadat betöltése import táblázatokból.
//
// Claude az egyes adagokat „Import ...” nevű táblázatként tölti fel a FantasyAge/Import mappába.
// Az importalas() függvény minden még be nem töltött import táblázat lapjait átvezeti a
// Szabályadatbázis azonos nevű lapjaira: azonosító szerint frissít, az újakat hozzáfűzi.
// Utána a fájl nevét „Betöltve: ...” előtagra cseréli, és növeli a szabályverziót.
// Futtatható kézzel a szerkesztőből, vagy óránkénti időzítővel (importIdozitoBekapcsolasa).

const IMPORT_MAPPA = 'Import';
const BETOLTVE = 'Betöltve: ';

function importalas() {
  const p = PropertiesService.getScriptProperties();
  const mappa = mappa_(DriveApp.getFolderById(p.getProperty('MAPPA_ID')), IMPORT_MAPPA);
  const fajlok = mappa.getFilesByType(MimeType.GOOGLE_SHEETS);
  const naplo = [];
  let volt = false;
  while (fajlok.hasNext()) {
    const f = fajlok.next();
    if (f.getName().indexOf(BETOLTVE) === 0 || f.getName().indexOf('Import') !== 0) continue;
    const forras = SpreadsheetApp.openById(f.getId());
    forras.getSheets().forEach(function (lap) {
      const nev = lap.getName();
      if (SEMA.szabaly_lapok.indexOf(nev) < 0) { naplo.push('Kihagyva (nem szabálylap): ' + nev); return; }
      const db = lapBetoltese_(lap, nev);
      naplo.push(f.getName() + ' / ' + nev + ': ' + db.uj + ' új, ' + db.frissitett + ' frissített sor');
    });
    f.setName(BETOLTVE + f.getName());
    volt = true;
  }
  if (volt) naplo.push('Új szabályverzió: ' + szabalyVerzioNovelese());
  else naplo.push('Nincs betöltendő import táblázat.');
  Logger.log(naplo.join('\n'));
  return naplo;
}

function lapBetoltese_(forrasLap, nev) {
  const ertekek = forrasLap.getDataRange().getValues();
  if (ertekek.length < 2) return { uj: 0, frissitett: 0 };
  const forrasFej = ertekek[0].map(String);
  const cel = lap_('szabaly', nev);
  const celFej = fejlec_(cel);
  // kulcs: id, a Szótárban eredeti + megjegyzes
  const kulcs = celFej.indexOf('id') >= 0 ? function (o) { return String(o.id); }
    : function (o) { return String(o.eredeti) + '|' + String(o.megjegyzes || ''); };

  const meglevo = {};
  sorok_('szabaly', nev).forEach(function (o) { meglevo[kulcs(o)] = o._sor; });

  const ujSorok = [];
  let frissitett = 0;
  for (let i = 1; i < ertekek.length; i++) {
    if (uresSor_(ertekek[i])) continue;
    const o = {};
    forrasFej.forEach(function (f, j) { o[f] = ertekek[i][j]; });
    const sor = celFej.map(function (f) { return cellaErtek_(f, o[f] === undefined ? '' : o[f]); });
    const k = kulcs(o);
    if (meglevo[k]) {
      cel.getRange(meglevo[k], 1, 1, celFej.length).setValues([sor]);
      frissitett++;
    } else {
      ujSorok.push(sor);
    }
  }
  if (ujSorok.length) cel.getRange(cel.getLastRow() + 1, 1, ujSorok.length, celFej.length).setValues(ujSorok);
  return { uj: ujSorok.length, frissitett: frissitett };
}

// Óránkénti automatikus import bekapcsolása. Egyszer kell futtatni.
function importIdozitoBekapcsolasa() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'importalas') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('importalas').timeBased().everyHours(1).create();
  Logger.log('Óránkénti import bekapcsolva.');
}
