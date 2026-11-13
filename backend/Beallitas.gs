// Első beállítás és karbantartás. Ezeket az Apps Script szerkesztőből kell futtatni.
//
// elsoBeallitas(): többször is futtatható, semmit nem ír felül.
//   - megkeresi (vagy létrehozza) a „FantasyAge” mappát és almappáit
//     (a szabálykönyvek szövege a meglévő „md” almappában van),
//   - létrehozza (vagy név szerint megkeresi) a két táblázatot, és mappába teszi őket,
//   - minden lapot és fejlécet pótol a schema szerint (új oszlopot a sor végére tesz),
//   - beállítja a token titkos kulcsát,
//   - ha még nincs felhasználó, engedélyezi a legelső belépést (aki először belép, az lesz a DM).

const MAPPA_NEV = 'FantasyAge';
const ALMAPPAK = ['md', 'Import', 'Kiosztható', 'Mentések']; // md: a szabálykönyvek szövege, Import: szabályadat-adagok

function elsoBeallitas() {
  const p = PropertiesService.getScriptProperties();
  const naplo = [];

  if (!p.getProperty('TOKEN_TITOK')) {
    p.setProperty('TOKEN_TITOK', Utilities.getUuid() + Utilities.getUuid());
    naplo.push('Token titkos kulcs létrehozva.');
  }

  const mappa = mappa_(DriveApp.getRootFolder(), MAPPA_NEV);
  p.setProperty('MAPPA_ID', mappa.getId());
  ALMAPPAK.forEach(function (n) { mappa_(mappa, n); });
  naplo.push('Mappa: ' + mappa.getUrl());

  Object.keys(SEMA.tablazatok).forEach(function (kulcs) {
    const t = SEMA.tablazatok[kulcs];
    const kulcsNev = kulcs === 'szabaly' ? 'SZABALY_ID' : 'JATEK_ID';
    let ss = null;
    const id = p.getProperty(kulcsNev);
    if (id) {
      try { ss = SpreadsheetApp.openById(id); } catch (e) { ss = null; }
    }
    if (!ss) {
      const talalt = DriveApp.getFilesByName(t.cim);
      while (talalt.hasNext()) {
        const f = talalt.next();
        if (f.getMimeType() === MimeType.GOOGLE_SHEETS && !f.isTrashed()) { ss = SpreadsheetApp.openById(f.getId()); break; }
      }
    }
    if (!ss) {
      ss = SpreadsheetApp.create(t.cim);
      naplo.push('Új táblázat: ' + t.cim);
    }
    p.setProperty(kulcsNev, ss.getId());
    try { DriveApp.getFileById(ss.getId()).moveTo(mappa); } catch (e) { /* már a mappában van */ }
    lapokPotlasa_(ss, t.lapok);
    naplo.push(t.cim + ': ' + ss.getUrl());
  });

  // szabályverzió
  const meta = SpreadsheetApp.openById(p.getProperty('SZABALY_ID')).getSheetByName('Meta');
  const metaErtekek = meta.getDataRange().getValues();
  if (!metaErtekek.some(function (r) { return r[0] === 'szabaly_verzio'; })) meta.appendRow(['szabaly_verzio', 1]);

  // legelső belépés engedélyezése
  const felh = SpreadsheetApp.openById(p.getProperty('JATEK_ID')).getSheetByName('Felhasználók');
  if (felh.getLastRow() < 2) {
    p.setProperty('ELSO_BELEPES', 'igen');
    naplo.push('Még nincs felhasználó: aki először belép, az lesz a DM.');
  }

  CacheService.getScriptCache().removeAll(['szabaly_verzio', 'letiltottak']);
  naplo.push('Kész.');
  Logger.log(naplo.join('\n'));
  return naplo;
}

function mappa_(szulo, nev) {
  const it = szulo.getFoldersByName(nev);
  return it.hasNext() ? it.next() : szulo.createFolder(nev);
}

function lapokPotlasa_(ss, lapok) {
  Object.keys(lapok).forEach(function (nev) {
    const oszlopok = lapok[nev];
    let l = ss.getSheetByName(nev);
    if (!l) l = ss.insertSheet(nev);
    const meglevo = l.getLastColumn() > 0 ? l.getRange(1, 1, 1, l.getLastColumn()).getValues()[0].map(String) : [];
    if (meglevo.filter(Boolean).length === 0) {
      l.getRange(1, 1, 1, oszlopok.length).setValues([oszlopok]);
    } else {
      const hianyzo = oszlopok.filter(function (o) { return meglevo.indexOf(o) < 0; });
      if (hianyzo.length) l.getRange(1, meglevo.length + 1, 1, hianyzo.length).setValues([hianyzo]);
    }
    l.getRange(1, 1, 1, l.getLastColumn()).setFontWeight('bold');
    l.setFrozenRows(1);
  });
  // az új táblázat alapértelmezett, üres lapjának törlése
  ss.getSheets().forEach(function (l) {
    if (!lapok[l.getName()] && l.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(l);
  });
}

// Másolat a Játékadat táblázatról a Mentések mappába. Kézzel vagy időzítve futtatható.
function mentesKeszitese() {
  const p = PropertiesService.getScriptProperties();
  const mentesek = mappa_(DriveApp.getFolderById(p.getProperty('MAPPA_ID')), 'Mentések');
  const datum = Utilities.formatDate(new Date(), 'Europe/Budapest', 'yyyy-MM-dd HH.mm');
  const masolat = DriveApp.getFileById(p.getProperty('JATEK_ID')).makeCopy('Játékadat mentés ' + datum, mentesek);
  Logger.log('Mentés kész: ' + masolat.getUrl());
}

// Napi automatikus mentés bekapcsolása (hajnali 4 órakor). Egyszer kell futtatni.
function napiMentesBekapcsolasa() {
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === 'mentesKeszitese') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('mentesKeszitese').timeBased().everyDays(1).atHour(4).create();
  Logger.log('Napi mentés bekapcsolva.');
}
