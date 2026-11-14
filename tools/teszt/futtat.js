// A háttérkód helyi tesztje: a Google szolgáltatásokat memóriában utánozza,
// és végigjátssza a fő forgatókönyveket. Futtatás: node tools/teszt/futtat.js
'use strict';
const U = require('./utanzat').letrehoz();
const { kornyezet, tablazatok, fajlok, gyoker, mappaKeres, tulajdonsagok } = U;

// ---------- Segédek ----------
function hivas(action, adat, token) {
  const v = kornyezet.doPost({ postData: { contents: JSON.stringify({ action, token, adat }) } });
  return JSON.parse(v.getContent());
}
let hibak = 0;
function ellenoriz(feltetel, leiras, extra) {
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---------- Forgatókönyv ----------
kornyezet.elsoBeallitas();
const jatek = tablazatok[tulajdonsagok.JATEK_ID];
ellenoriz(!!jatek.getSheetByName('Karakterek') && !jatek.getSheetByName('Munkalap1'), 'elsoBeallitas: lapok létrejöttek, alapértelmezett lap törölve');
kornyezet.elsoBeallitas();
ellenoriz(jatek.getSheetByName('Karakterek').getLastRow() === 1, 'elsoBeallitas többször futtatható');

let v = hivas('login', { nev: 'Arnold', jelszo: 'sarkany1' });
ellenoriz(v.ok && v.elso_belepes && v.felhasznalo.szerep === 'dm', 'legelső belépés DM-et hoz létre', v);
const dm = v.token;
ellenoriz(!hivas('login', { nev: 'Valaki', jelszo: 'xxxx' }).ok, 'második ismeretlen belépés nem hoz létre felhasználót');

const anna = hivas('users.admin', { muvelet: 'letrehoz', nev: 'Anna', jelszo: 'anna1', szerep: 'jatekos' }, dm).felhasznalo;
const bence = hivas('users.admin', { muvelet: 'letrehoz', nev: 'Bence', jelszo: 'bence1', szerep: 'jatekos' }, dm).felhasznalo;
ellenoriz(anna && bence, 'DM létrehozza a játékosokat');

const annaT = hivas('login', { nev: 'anna', jelszo: 'anna1' }).token;
const bencT = hivas('login', { nev: 'Bence', jelszo: 'bence1' }).token;
ellenoriz(annaT && bencT, 'játékosok belépnek (név kisbetűvel is)');
ellenoriz(hivas('users.admin', { muvelet: 'lista' }, annaT).hiba === 'nincs_jogosultsag', 'játékos nem kezelhet felhasználókat');

v = hivas('campaign.create', { cim: 'Az elveszett torony', mesterjatekos_id: anna.id }, dm);
const kampany = v.kampany;
ellenoriz(v.ok && kampany.sajat_szerep === 'dm', 'DM kampányt hoz létre, Anna a mesterjátékos');

v = hivas('character.create', { nev: 'Pöttöm', adat: { faj: 'Félszerzet', osztaly: 'Tolvaj', szint: 1 } }, dm);
const pottom = v.karakter;
ellenoriz(v.ok && pottom.jatekos_id === '' && pottom.faj === 'Félszerzet', 'DM játékos nélküli karaktert hoz létre (gyerek karaktere)');
ellenoriz(hivas('characters.list', {}, annaT).karakterek.length === 0, 'Anna még nem látja (nincs a kampányban)');

ellenoriz(hivas('campaign.addCharacter', { kampany_id: kampany.id, karakter_id: pottom.id }, dm).ok, 'DM kampányhoz rendeli');
const lista = hivas('characters.list', {}, annaT).karakterek;
ellenoriz(lista.length === 1 && lista[0].irhato, 'mesterjátékos látja és írhatja a kampány karakterét');

v = hivas('character.save', { id: pottom.id, verzio: 1, adat: { nev: 'Pöttöm', faj: 'Félszerzet', osztaly: 'Tolvaj', szint: 2, egeszseg: 30 } }, annaT);
ellenoriz(v.ok && v.verzio === 2, 'mesterjátékos ment, a verzió nő', v);
v = hivas('character.save', { id: pottom.id, verzio: 1, adat: { nev: 'Pöttöm' } }, dm);
ellenoriz(v.hiba === 'utkozes' && v.aktualis && v.aktualis.verzio === 2, 'régi verzióra mentés ütközést jelez, visszaadja az aktuálisat', v);
ellenoriz(hivas('character.save', { id: pottom.id, verzio: 2, adat: { nev: 'X' } }, bencT).hiba === 'nincs_jogosultsag', 'Bence nem szerkesztheti');
v = hivas('character.save', { id: pottom.id, verzio: 2, adat: { nev: 'Pöttöm', faj: 'Félszerzet', osztaly: 'Tolvaj', szint: 2, keszites: { allapot: 'piszkozat' } } }, annaT);
ellenoriz(v.ok && hivas('characters.list', {}, annaT).karakterek[0].keszites === 'piszkozat', 'a listában látszik, hogy a karakter piszkozat (karakterkészítés folyamatban)');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).hiba === 'nincs_jogosultsag', 'Bence nem látja a kampányt, amíg nincs benne karaktere');

v = hivas('character.create', { nev: 'Bence önálló hőse' }, bencT);
const bhos = v.karakter;
ellenoriz(v.ok && bhos.jatekos_id === bence.id && bhos.kampanyok.length === 0, 'játékos kampány nélkül hoz létre saját karaktert');
v = hivas('character.create', { nev: 'Morg', kampany_id: kampany.id }, annaT);
ellenoriz(v.ok && v.karakter.jatekos_id === '' && v.karakter.kampanyok[0] === kampany.id, 'mesterjátékos a kampányába hoz létre karaktert');
const morg = v.karakter;

ellenoriz(hivas('character.assign', { karakter_id: morg.id, jatekos_id: bence.id }, dm).ok, 'DM Bencéhez társítja Morgot');
ellenoriz(hivas('character.assign', { karakter_id: morg.id, jatekos_id: anna.id }, bencT).hiba === 'nincs_jogosultsag', 'társítani csak a DM tud');

const verzioElotte = hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio;
v = hivas('roll.log', { kampany_id: kampany.id, mire: 'Lopakodás', kockak: [3, 3, 5], modosito: 2, celertek: 11, eredmeny: 'siker', mutatvanypont: 5, id: 'dobas-1' }, bencT);
ellenoriz(v.ok && !v.dobas.rejtett, 'Bence dobást naplóz');
hivas('roll.log', { kampany_id: kampany.id, mire: 'Lopakodás', kockak: [3, 3, 5], modosito: 2, id: 'dobas-1' }, bencT);
hivas('roll.log', { kampany_id: kampany.id, mire: 'Csapda (rejtett)', kockak: [1, 2, 6], modosito: 0, rejtett: true }, dm);
hivas('roll.log', { kampany_id: kampany.id, mire: 'Próbálkozás rejtve', kockak: [1, 1, 1], rejtett: true }, bencT);
ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio > verzioElotte, 'a dobás növeli a kampányverziót');
const olvasasElotte = U.propOlvasas();
for (let i = 0; i < 50; i++) hivas('state.poll', { kampany_id: kampany.id }, bencT);
hivas('state.get', { kampany_id: kampany.id }, bencT);
ellenoriz(U.propOlvasas() === olvasasElotte, '50 state.poll és egy state.get nem olvassa a Script Properties tárat (napi kvóta)', U.propOlvasas() - olvasasElotte);

const bAll = hivas('state.get', { kampany_id: kampany.id }, bencT);
ellenoriz(bAll.ok && bAll.kampany.sajat_szerep === 'jatekos' && bAll.kampany.dm_jegyzet === undefined, 'Bence látja a kampányt játékosként, DM jegyzet nélkül', bAll);
const bMorg = bAll.karakterek.find(c => c.id === morg.id), bPottom = bAll.karakterek.find(c => c.id === pottom.id);
ellenoriz(bMorg.adat && !bPottom.adat, 'saját karakterét teljesen, a többit csak névsorként látja');
ellenoriz(bAll.dobasok.length === 2 && bAll.dobasok.every(d => !d.rejtett), 'dupla küldés kiszűrve, rejtett DM-dobás nem látszik, játékos nem dobhat rejtve', bAll.dobasok);
const dAll = hivas('state.get', { kampany_id: kampany.id }, dm);
ellenoriz(dAll.dobasok.length === 3 && dAll.kampany.dm_jegyzet !== undefined, 'a DM a rejtett dobást is látja');
const aAll = hivas('state.get', { kampany_id: kampany.id }, annaT);
ellenoriz(aAll.kampany.sajat_szerep === 'mester' && aAll.karakterek.every(c => c.adat), 'mesterjátékos minden karaktert teljesen lát');

hivas('share.send', { kampany_id: kampany.id, cimzett: pottom.id, tipus: 'level', cim: 'Titkos levél' }, dm);
hivas('share.send', { kampany_id: kampany.id, cimzett: 'mindenki', tipus: 'kep', cim: 'Térkép' }, dm);
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).megosztasok.length === 1, 'Bence csak a mindenkinek szóló megosztást látja');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).megosztasok.length === 2, 'a mesterjátékos mindkettőt látja');

v = hivas('rules.get', {}, bencT);
ellenoriz(v.ok && v.verzio === 1 && Array.isArray(v.lapok.Fajok), 'szabályadat letölthető');
const szabaly = tablazatok[tulajdonsagok.SZABALY_ID];
szabaly.getSheetByName('Fajok').appendRow(['faj_torpe', "'Törp", 'Dwarf', 'Alapkönyv', 9, "'+1 Szívósság", "'{\"x\":1}", '']);
kornyezet.szabalyVerzioNovelese();
v = hivas('rules.get', {}, bencT);
ellenoriz(v.verzio === 2 && v.lapok.Fajok[0].reszletek.x === 1 && v.lapok.Fajok[0].leiras_hu === '+1 Szívósság', 'verzióváltás után az új adat jön, a JSON mező feldolgozva', v.lapok && v.lapok.Fajok);

// import táblázatból betöltés
const imp = kornyezet.SpreadsheetApp.create('Import 01 teszt');
const fajLap = imp.getSheets()[0]; fajLap.nev = 'Fajok';
fajLap.appendRow(['id', 'nev_hu', 'nev_en', 'forras', 'oldal', 'leiras_hu', 'reszletek', 'aktiv']);
fajLap.appendRow(['faj_torpe', 'Törp (javított)', 'Dwarf', 'Alapkönyv', 12, '+1 Szívósság', '{"x":2}', true]);
fajLap.appendRow(['faj_elf', 'Elf', 'Elf', 'Alapkönyv', 13, '3-4 dobás', '{}', true]);
const szot = imp.insertSheet('Szótár'); szot.appendRow(['eredeti', 'projektben', 'megjegyzes']); szot.appendRow(['Dwarf', 'Törp', 'faj']);
const importMappa = mappaKeres(gyoker, tulajdonsagok.MAPPA_ID).almappak.find(m => m.nev === 'Import');
fajlok[imp.id].szulo = importMappa.id;
kornyezet.importalas();
v = hivas('rules.get', {}, bencT);
ellenoriz(v.verzio === 3 && v.lapok.Fajok.length === 2 && v.lapok.Fajok[0].nev_hu === 'Törp (javított)' && v.lapok.Fajok[1].leiras_hu === '3-4 dobás' && v.lapok.Szótár.length === 1,
  'import: azonosító szerint frissít, újat hozzáfűz, verziót növel, a „3-4” szöveg marad', v.lapok && v.lapok.Fajok);
ellenoriz(fajlok[imp.id].cim.startsWith('Betöltve: '), 'import után a fájl Betöltve előtagot kap');
kornyezet.importalas();
ellenoriz(hivas('rules.version', {}, bencT).verzio === 3, 'betöltött fájlt nem tölt be újra');

hivas('users.admin', { muvelet: 'letilt', id: bence.id }, dm);
ellenoriz(hivas('characters.list', {}, bencT).hiba === 'nincs_bejelentkezve', 'letiltott felhasználó tokenje azonnal érvénytelen');
for (let i = 0; i < 5; i++) hivas('login', { nev: 'Anna', jelszo: 'rossz' });
ellenoriz(hivas('login', { nev: 'Anna', jelszo: 'anna1' }).hiba === 'tiltva', '5 rossz jelszó után tiltás');
ellenoriz(hivas('characters.list', {}, 'hamis.token').hiba === 'nincs_bejelentkezve', 'hamis token elutasítva');

const kar = jatek.getSheetByName('Karakterek').getDataRange().getValues();
ellenoriz(typeof kar[1][kar[0].indexOf('modositva')] === 'string', 'időbélyeg szövegként tárolódik');

// ---------- Gyorsítótár, induló hívás, archiválás és törlés ----------
const dm2 = hivas('login', { nev: 'Arnold', jelszo: 'sarkany1' }).token;
const karLap = jatek.getSheetByName('Karakterek');
let lapOlvasas = 0;
const eredetiOlvasas = karLap.getDataRange.bind(karLap);
karLap.getDataRange = () => { lapOlvasas++; return eredetiOlvasas(); };
hivas('characters.list', {}, dm2);
const olvasasUtan = lapOlvasas;
hivas('characters.list', {}, dm2);
hivas('state.get', { kampany_id: kampany.id }, dm2);
ellenoriz(lapOlvasas === olvasasUtan, 'ismételt olvasás a gyorsítótárból jön (nem olvassa újra a lapot)', lapOlvasas - olvasasUtan);
const pAktualis = hivas('character.get', { id: pottom.id }, dm2).karakter;
hivas('character.save', { id: pottom.id, verzio: pAktualis.verzio, adat: { nev: 'Pöttöm', szint: 7 } }, dm2);
const pFriss = hivas('state.get', { kampany_id: kampany.id }, dm2).karakterek.find(c => c.id === pottom.id);
ellenoriz(pFriss && pFriss.adat.szint === 7 && pFriss.verzio === pAktualis.verzio + 1, 'írás után a gyorsítótár azonnal az új adatot adja', pFriss);
karLap.getDataRange = eredetiOlvasas;

v = hivas('init', {}, dm2);
ellenoriz(v.ok && v.kampanyok.length === 1 && v.karakterek.length >= 3 && v.felhasznalok.length === 3, 'init: kampányok, karakterek, felhasználók egy hívásban (DM)', v);
v = hivas('init', {}, annaT);
ellenoriz(v.ok && v.kampanyok.length === 1 && v.felhasznalok === undefined, 'init: játékos nem kapja meg a felhasználókat', v);

ellenoriz(hivas('character.delete', { id: morg.id }, dm2).hiba === 'hibas_adat', 'aktív karakter nem törölhető');
ellenoriz(hivas('character.archive', { id: morg.id, aktiv: false }, annaT).hiba === 'nincs_jogosultsag', 'archiválni csak a DM tud');
ellenoriz(hivas('character.archive', { id: morg.id, aktiv: false }, dm2).ok, 'DM archiválja Morgot');
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, annaT).karakterek.some(c => c.id === morg.id), 'archivált karakter nem látszik a kampányban');
ellenoriz(!hivas('characters.list', {}, annaT).karakterek.some(c => c.id === morg.id), 'archivált karakter nincs a mesterjátékos listájában');
ellenoriz(hivas('characters.list', {}, dm2).karakterek.some(c => c.id === morg.id && !c.aktiv), 'a DM listájában archiváltként szerepel');
ellenoriz(hivas('character.delete', { id: morg.id }, dm2).ok, 'archivált karakter törölhető');
ellenoriz(!jatek.getSheetByName('Kampánykarakterek').adat.some(sor => sor.includes(morg.id)), 'a törölt karakter kampánykapcsolata is törlődött');
ellenoriz(hivas('character.get', { id: morg.id }, dm2).hiba === 'nem_talalhato', 'a törölt karakter nem kérhető le');

ellenoriz(hivas('users.admin', { muvelet: 'torol', id: anna.id }, dm2).hiba === 'hibas_adat', 'aktív felhasználó nem törölhető');
ellenoriz(/Bence önálló hőse/.test(hivas('users.admin', { muvelet: 'torol', id: bence.id }, dm2).uzenet), 'karakteres felhasználó nem törölhető, az üzenet megnevezi a karaktert');
hivas('character.assign', { karakter_id: bhos.id, jatekos_id: '' }, dm2);
ellenoriz(hivas('users.admin', { muvelet: 'torol', id: bence.id }, dm2).ok, 'letiltott, karakter nélküli felhasználó törölhető');
ellenoriz(!hivas('init', {}, dm2).felhasznalok.some(f => f.id === bence.id), 'a törölt felhasználó eltűnt');
ellenoriz(hivas('login', { nev: 'Bence', jelszo: 'bence1' }).hiba === 'hibas_belepes', 'a törölt felhasználó nem léphet be');

ellenoriz(hivas('campaign.delete', { id: kampany.id }, dm2).hiba === 'hibas_adat', 'nem archivált kampány nem törölhető');
hivas('campaign.update', { id: kampany.id, allapot: 'archivált' }, dm2);
ellenoriz(hivas('campaigns.list', {}, annaT).kampanyok.length === 0, 'archivált kampányt a mesterjátékos nem látja');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).hiba === 'nincs_jogosultsag', 'archivált kampány állapota nem kérhető le játékosként');
ellenoriz(hivas('campaigns.list', {}, dm2).kampanyok.length === 1, 'a DM látja az archivált kampányt');
ellenoriz(hivas('campaign.delete', { id: kampany.id }, dm2).ok, 'archivált kampány törölhető');
ellenoriz(hivas('campaigns.list', {}, dm2).kampanyok.length === 0 && hivas('character.get', { id: pottom.id }, dm2).ok, 'a kampány törlődött, a karakter megmaradt');

console.log(hibak ? `\n${hibak} HIBA` : '\nMinden teszt sikeres.');
process.exit(hibak ? 1 : 0);
