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

// ---- Kiosztható anyagok és alanyok (6.2) ----
{
  const alanyV = hivas('share.send', { kampany_id: kampany.id, tipus: 'alany', id: 'm_alany00001', cim: 'A kapucnis idegen',
    adat: { kategoria: 'szemely', valodi: { tipus: 'njk', id: 'npc_x', nev: 'Varga mester' } } }, dm);
  ellenoriz(alanyV.ok && alanyV.megosztas.id === 'm_alany00001' && alanyV.megosztas.tipus === 'alany', 'DM alanyt hoz létre a saját azonosítójával', alanyV);
  ellenoriz(hivas('share.send', { kampany_id: kampany.id, tipus: 'alany', cim: 'X' }, annaT).hiba === 'nincs_jogosultsag', 'alanyt csak a DM hoz létre');
  ellenoriz(hivas('share.send', { kampany_id: kampany.id, tipus: 'anyag', cimzettek: ['kar_idegen'], adat: { fajta: 'nyom', szoveg: 'x' } }, dm).hiba === 'hibas_adat',
    'kampányon kívüli címzett nem lehet');
  const img = hivas('share.image.add', { kep: Buffer.from('kep').toString('base64'), belyeg: Buffer.from('b').toString('base64') }, dm);
  ellenoriz(img.ok && img.kep.kep && img.kep.belyeg, 'a kivágott kép a Kiosztások mappába kerül', img);
  const kioszt = U.mappaKeres(gyoker, U.tulajdonsagok.KIOSZTASMAPPA_ID);
  ellenoriz(!!kioszt && kioszt.nev === 'Kiosztások', 'a Kiosztások mappa létrejött');
  let w = hivas('share.send', { kampany_id: kampany.id, tipus: 'anyag', cim: 'Levél a toronyból', cimzettek: ['mindenki'], alany_id: 'm_alany00001', megmutat: true,
    adat: { fajta: 'level', szoveg: 'Gyertek [[éjfélkor]] a hídhoz.', level: { felado: 'V.', kezires: 'kapkodo', titok: 'nem kell' },
      kepek: [{ kep: img.kep.kep, belyeg: img.kep.belyeg, cim: 'pecsét' }], forras: { tipus: 'jelenet', id: 'el_x', nev: 'A híd' }, dm_titok: 'x' } }, dm);
  const level = w.megosztas;
  ellenoriz(w.ok && level.cimzett === 'mindenki' && level.megmutat && level.adat.level.kezires === 'kapkodo' && level.adat.level.titok === undefined && level.adat.dm_titok === undefined,
    'levél kiosztása: ismeretlen mezők nélkül, megmutatással', w);
  w = hivas('share.send', { kampany_id: kampany.id, tipus: 'anyag', cim: 'Titkos nyom', cimzettek: [morg.id], alany_id: 'm_alany00001', adat: { fajta: 'nyom', szoveg: 'Sántít.' } }, dm);
  const titkos = w.megosztas;
  ellenoriz(w.ok && titkos.cimzett === 'tobb', 'titkos nyom egy karakternek');
  const ism = hivas('share.send', { kampany_id: kampany.id, tipus: 'anyag', id: titkos.id, cim: 'más', adat: { fajta: 'nyom' } }, dm);
  ellenoriz(ism.ok && ism.mar_megvolt && ism.megosztas.cim === 'Titkos nyom', 'ugyanaz az azonosító kétszer nem kerül be (sorból újraküldés)');

  let bAll = hivas('state.get', { kampany_id: kampany.id }, bencT);
  const bLevel = bAll.megosztasok.find((m) => m.id === level.id);
  ellenoriz(!!bLevel && !bLevel.adat.forras && bLevel.hivatkozas === undefined && bLevel.letrehozta === undefined && bLevel.latta === undefined && bLevel.latta_en === false,
    'a játékos a levelet forrás és DM-adat nélkül kapja', bLevel);
  ellenoriz(!!bAll.megosztasok.find((m) => m.id === titkos.id), 'Bence (Morg játékosa) látja a titkos nyomot');
  const bAlany = (bAll.alanyok || []).find((x) => x.id === 'm_alany00001');
  ellenoriz(bAlany && bAlany.nev === 'A kapucnis idegen' && !JSON.stringify(bAll.alanyok).includes('Varga'), 'az alany csak ismert névvel jut el, a valódi név nem', bAll.alanyok);
  const nyitott = hivas('state.get', { kampany_id: kampany.id }, annaT);
  ellenoriz(nyitott.megosztasok.some((m) => m.id === titkos.id), 'a mesterjátékos is látja a karakternek szóló anyagot');
  const pAll = hivas('state.get', { kampany_id: kampany.id }, dm);
  ellenoriz(pAll.alanyok.length === 1 && pAll.megosztasok.find((m) => m.id === level.id).adat.forras.id === 'el_x', 'a DM mindent lát, a forrással együtt');

  // képek: a játékos csak a neki kiosztott anyag képét kérheti le
  ellenoriz(Object.keys(hivas('image.get', { idk: [img.kep.kep] }, bencT).kepek).length === 1, 'a kiosztott kép a játékosnak lekérhető');
  // látta
  ellenoriz(hivas('share.seen', { id: level.id }, bencT).latta === true, 'Bence megnyitja a levelet');
  ellenoriz(hivas('state.get', { kampany_id: kampany.id }, dm).megosztasok.find((m) => m.id === level.id).latta[bence.id], 'a DM látja, hogy Bence megnyitotta');
  ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).megosztasok.find((m) => m.id === level.id).latta_en === true, 'Bence nézetében „láttam” jel');

  // visszavonás
  w = hivas('share.update', { id: level.id, allapot: 'visszavont' }, dm);
  ellenoriz(w.ok && !hivas('state.get', { kampany_id: kampany.id }, bencT).megosztasok.some((m) => m.id === level.id), 'visszavont anyag eltűnik a játékos nézetéből');
  ellenoriz(Object.keys(hivas('image.get', { idk: [img.kep.kep] }, bencT).kepek).length === 0, 'a visszavont anyag képe sem kérhető le');
  ellenoriz(hivas('share.update', { id: level.id, allapot: 'aktiv' }, annaT).hiba === 'nincs_jogosultsag', 'visszavonni csak a DM tud');
  hivas('share.update', { id: level.id, allapot: 'aktiv', megmutat: true }, dm);

  // összekapcsolás és felfedés
  hivas('share.send', { kampany_id: kampany.id, tipus: 'alany', id: 'm_alany00002', cim: 'Varga mester', adat: { kategoria: 'szemely', valodi: { tipus: 'njk', id: 'npc_x', nev: 'Varga mester' } } }, dm);
  w = hivas('share.update', { id: 'm_alany00001', adat: { osszekapcsolva: 'm_alany00002' } }, dm);
  ellenoriz(w.ok && w.megosztas.adat.osszekapcsolva === 'm_alany00002' && w.megosztas.adat.kategoria === 'szemely', 'összekapcsolás: a kapucnis idegen = Varga mester', w);
  ellenoriz(hivas('share.update', { id: 'm_alany00002', adat: { osszekapcsolva: 'm_alany00001' } }, dm).hiba === 'hibas_adat', 'körbe érő összekapcsolás nem lehet');
  bAll = hivas('state.get', { kampany_id: kampany.id }, bencT);
  ellenoriz(bAll.alanyok.length === 2 && bAll.alanyok.find((x) => x.id === 'm_alany00001').osszekapcsolva === 'm_alany00002', 'a játékos megkapja az összekapcsolás célját is');
  hivas('share.update', { id: 'm_alany00001', cim: 'A sánta idegen', adat: { felfedve: true } }, dm);
  const felf = hivas('state.get', { kampany_id: kampany.id }, bencT).alanyok.find((x) => x.id === 'm_alany00001');
  ellenoriz(felf.nev === 'Varga mester' && felf.ismert_nev === 'A sánta idegen', 'felfedés után a valódi név látszik', felf);
  ellenoriz(hivas('share.update', { id: 'm_alany00001', cim: '' }, dm).hiba === 'hianyzo_adat', 'az alany ismert neve nem lehet üres');
  ellenoriz(hivas('share.seen', { id: 'm_alany00001' }, bencT).hiba === 'nem_talalhato', 'alanyra nincs „látta”');
}

// ---- Jegyzetfüzet (6.3) ----
{
  const titkos = hivas('state.get', { kampany_id: kampany.id }, dm).megosztasok.find((m) => m.cim === 'Titkos nyom');
  const pottomNak = hivas('share.send', { kampany_id: kampany.id, tipus: 'anyag', cim: 'Csak Pöttömnek', cimzettek: [pottom.id], adat: { fajta: 'nyom', szoveg: 'psszt' } }, dm).megosztas;
  const verzioElotte = hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio;
  let w = hivas('note.save', { id: 'j_sajat00001', uj: true, kampany_id: kampany.id, lathatosag: 'sajat', karakter_id: morg.id,
    kapcsolodik: titkos.id, cim: 'Gyanú', szoveg: 'Szerintem a sánta ember követ minket.', cimkek: 'gyanú, idegen, Gyanú' }, bencT);
  ellenoriz(w.ok && w.verzio === 1 && w.jegyzet.szerzo_id === bence.id && w.jegyzet.szerzo_nev === 'Bence' && w.jegyzet.karakter_id === morg.id,
    'Bence saját jegyzetet ír Morg nevében, a titkos nyomhoz kötve', w);
  ellenoriz(w.jegyzet.cimkek.length === 2, 'a címkék kis- és nagybetűtől függetlenül egyszer szerepelnek', w.jegyzet.cimkek);
  ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio > verzioElotte, 'a jegyzet mentése növeli a kampányverziót');
  w = hivas('note.save', { id: 'j_sajat00001', uj: true, kampany_id: kampany.id, szoveg: 'újra' }, bencT);
  ellenoriz(w.ok && w.mar_megvolt && w.jegyzet.szoveg.startsWith('Szerintem'), 'az ismételt létrehozás nem duplikál (sorból újraküldés)');
  ellenoriz(hivas('note.save', { id: 'j_ures000001', uj: true, kampany_id: kampany.id, szoveg: '  ' }, bencT).hiba === 'hianyzo_adat', 'üres jegyzet nem menthető');
  ellenoriz(hivas('note.save', { id: 'rossz', uj: true, kampany_id: kampany.id, szoveg: 'x' }, bencT).hiba === 'hibas_adat', 'hibás azonosító nem menthető');
  ellenoriz(hivas('note.save', { id: 'j_titok00001', uj: true, kampany_id: kampany.id, szoveg: 'x', kapcsolodik: pottomNak.id }, bencT).hiba === 'nem_talalhato',
    'nem köthető olyan anyaghoz, amelyet az írója nem lát');
  ellenoriz(hivas('note.save', { id: 'j_titok00002', uj: true, kampany_id: kampany.id, szoveg: 'x', karakter_id: pottom.id }, bencT).hiba === 'nincs_jogosultsag',
    'más karakterének nevében nem írhat');
  w = hivas('note.save', { id: 'j_csapat0001', uj: true, kampany_id: kampany.id, lathatosag: 'csapat', kapcsolodik: 'm_alany00001',
    cim: 'Amit eddig tudunk', szoveg: 'A híd.' }, bencT);
  ellenoriz(w.ok && w.jegyzet.lathatosag === 'csapat' && w.jegyzet.kapcsolodik === 'm_alany00001', 'csapatjegyzet egy ismert alanyhoz kötve');

  let aAll = hivas('state.get', { kampany_id: kampany.id }, annaT);
  ellenoriz(aAll.jegyzetek.length === 1 && aAll.jegyzetek[0].id === 'j_csapat0001', 'a mesterjátékos a csapatjegyzetet látja, Bence saját jegyzetét nem', aAll.jegyzetek);
  const dAll = hivas('state.get', { kampany_id: kampany.id }, dm);
  ellenoriz(dAll.jegyzetek.length === 1 && !JSON.stringify(dAll).includes('sánta ember követ'), 'a DM sem látja a játékos saját jegyzetét');
  ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).jegyzetek.length === 2, 'Bence a sajátját és a csapatjegyzetet is látja');
  ellenoriz(hivas('note.save', { id: 'j_sajat00001', verzio: 1, szoveg: 'x' }, annaT).hiba === 'nincs_jogosultsag', 'más saját jegyzete nem szerkeszthető');
  ellenoriz(hivas('note.archive', { id: 'j_sajat00001' }, dm).hiba === 'nem_talalhato', 'más saját jegyzete nem törölhető (a DM sem)');

  w = hivas('note.save', { id: 'j_csapat0001', verzio: 1, szoveg: 'A híd. Éjfélkor.' }, annaT);
  ellenoriz(w.ok && w.verzio === 2 && w.jegyzet.modositotta === 'Anna', 'a mesterjátékos szerkeszti a csapatjegyzetet');
  w = hivas('note.save', { id: 'j_csapat0001', verzio: 1, szoveg: 'A híd. Hajnalban.' }, bencT);
  ellenoriz(w.hiba === 'utkozes' && w.aktualis && w.aktualis.verzio === 2 && w.aktualis.szoveg === 'A híd. Éjfélkor.', 'régi verzióra mentés ütközést jelez az aktuálissal', w);
  ellenoriz(hivas('note.save', { id: 'j_csapat0001', verzio: 2, lathatosag: 'sajat' }, annaT).hiba === 'nincs_jogosultsag', 'a láthatóságot csak az írója változtatja');
  w = hivas('note.save', { id: 'j_csapat0001', verzio: 2, szoveg: 'A dm is ír.', rogzitett: true }, dm);
  ellenoriz(w.ok && w.jegyzet.rogzitett === true && w.verzio === 3, 'a DM is szerkeszti és rögzíti a csapatjegyzetet');

  w = hivas('note.archive', { id: 'j_csapat0001' }, bencT);
  ellenoriz(w.ok && !hivas('state.get', { kampany_id: kampany.id }, annaT).jegyzetek.length, 'a törölt csapatjegyzet eltűnik');
  w = hivas('note.archive', { id: 'j_csapat0001', aktiv: true }, bencT);
  ellenoriz(w.ok && hivas('state.get', { kampany_id: kampany.id }, annaT).jegyzetek.length === 1, 'a törlés visszavonható');
  ellenoriz(hivas('note.save', { id: 'j_kivul00001', uj: true, kampany_id: 'k_nincs', szoveg: 'x' }, bencT).hiba === 'nem_talalhato', 'nem létező kampányba nem írható');
  hivas('share.update', { id: pottomNak.id, allapot: 'visszavont' }, dm);
}

// ---- Próbák (2. fejlesztési lépés) ----
let kall = hivas('state.get', { kampany_id: kampany.id }, bencT);
ellenoriz(kall.kampany.beallitasok && kall.kampany.beallitasok.celertek_rejtett === true && kall.kampany.beallitasok.mutatvanyok.felfedezes === true && kall.kampany.beallitasok.mutatvanyok.isteni === false,
  'kampány alapbeállításai: rejtett Célérték, felfedezési mutatványok be, isteni ki', kall.kampany.beallitasok);
ellenoriz(Array.isArray(kall.probak) && kall.probak.length === 0, 'az állapotban van próbalista');
v = hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, mire: 'Ügyesség (Lopakodás)', kockak: [4, 4, 3], modosito: 3, tipus: 'alap',
  tulajdonsag: 'tul_dexterity', fokusz: 'fok_dexterity_stealth', kezi: true, reszletek: { osszetevok: [{ ertek: 3, eredet: 'Ügyesség' }] }, id: 'dobas-2' }, bencT);
ellenoriz(v.ok && v.dobas.tulajdonsag === 'tul_dexterity' && v.dobas.kezi === true && v.dobas.reszletek.osszetevok.length === 1, 'a dobás új mezői (tulajdonság, fókusz, beírt, részletek) mentődnek', v);
ellenoriz(hivas('roll.log', { kampany_id: kampany.id, karakter_id: pottom.id, mire: 'X', kockak: [1, 2, 3] }, bencT).hiba === 'nincs_jogosultsag', 'más karaktere nevében nem lehet dobni');
v = hivas('roll.log', { karakter_id: bhos.id, mire: 'Erő próba', kockak: [2, 5, 6], modosito: 1, id: 'dobas-onallo' }, bencT);
ellenoriz(v.ok && v.dobas.kampany_id === '', 'kampány nélküli karakter dobása naplózható');
ellenoriz(hivas('roll.log', { karakter_id: bhos.id, mire: 'X', kockak: [1, 1, 1] }, annaT).hiba === 'nincs_jogosultsag', 'kampány nélküli dobás csak a karakter szerkesztőjétől');
v = hivas('roll.list', { karakter_id: bhos.id }, bencT);
ellenoriz(v.ok && v.dobasok.length === 1 && v.dobasok[0].id === 'dobas-onallo', 'roll.list: a karakter dobásai', v);
ellenoriz(hivas('roll.list', { karakter_id: bhos.id }, annaT).hiba === 'nincs_jogosultsag', 'roll.list: más karakterét nem láthatja');
ellenoriz(hivas('roll.list', { karakter_id: morg.id }, annaT).dobasok.some(d => d.id === 'dobas-2'), 'roll.list: a mesterjátékos látja a kampány karakterének dobásait');

v = hivas('roll.update', { id: 'dobas-2', mutatvanyok: [{ id: 'mut_skirmish', mp: 2, db: 1 }, { id: 'mut_threaten', mp: 1 }] }, bencT);
ellenoriz(v.ok && v.dobas.reszletek.mutatvanyok.length === 2 && v.dobas.reszletek.osszetevok.length === 1, 'roll.update: mutatványok a dobáshoz, a többi részlet marad', v);
ellenoriz(hivas('roll.update', { id: 'dobas-2', mutatvanyok: [{ id: 'mut_threaten', mp: 1 }], plusz: [{ ertek: 1, eredet: 'Gengszter (Haladó)' }] }, bencT).dobas.reszletek.mp_plusz[0].ertek === 1, 'roll.update: a plusz Mutatványpont forrása is rögzül');
ellenoriz(hivas('roll.update', { id: 'dobas-2', mutatvanyok: [] }, annaT).ok, 'a mesterjátékos is rögzíthet mutatványt');
ellenoriz(hivas('roll.update', { id: 'dobas-2', felfedve: true }, bencT).hiba === 'nincs_jogosultsag', 'felfedni csak a DM tud');
v = hivas('roll.log', { kampany_id: kampany.id, mire: 'Őr észlelése', kockak: [5, 5, 5], rejtett: true, id: 'dobas-rejtett' }, dm);
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, bencT).dobasok.some(d => d.id === 'dobas-rejtett'), 'rejtett dobás a játékosnak nem látszik');
ellenoriz(hivas('roll.update', { id: 'dobas-rejtett', felfedve: true }, dm).ok, 'a DM felfedi a rejtett dobást');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).dobasok.some(d => d.id === 'dobas-rejtett' && d.felfedve && !d.rejtett), 'felfedés után a játékos is látja');

ellenoriz(hivas('test.request', { kampany_id: kampany.id, tipus: 'alap', cim: 'Keresés' }, bencT).hiba === 'nincs_jogosultsag', 'játékos nem kérhet próbát');
ellenoriz(hivas('test.request', { kampany_id: kampany.id, tipus: 'titkos' }, annaT).hiba === 'nincs_jogosultsag', 'titkos próbát a mesterjátékos sem kérhet');
v = hivas('test.request', { kampany_id: kampany.id, tipus: 'alap', cim: 'Keresés a romokban', tulajdonsag: 'tul_perception',
  fokuszok: ['fok_perception_searching'], celertek: 13 }, dm);
const pAlap = v.proba;
ellenoriz(v.ok && pAlap.celertek_rejtett === true && pAlap.allapot === 'nyitott', 'alap próba kérése, a Célérték alapból rejtett', v);
kall = hivas('state.get', { kampany_id: kampany.id }, bencT);
const bProba = kall.probak.find(p => p.id === pAlap.id);
ellenoriz(bProba && bProba.celertek === '' && bProba.cim === 'Keresés a romokban', 'a játékos látja a kérést, de a rejtett Célértéket nem', bProba);
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).probak.find(p => p.id === pAlap.id).celertek === 13, 'a mesterjátékos látja a Célértéket');
v = hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pAlap.id, mire: 'Észlelés (Keresés)', kockak: [3, 3, 4], modosito: 4,
  fokusz: 'fok_perception_searching', id: 'dobas-p1' }, bencT);
ellenoriz(v.ok && v.dobas.eredmeny === 'siker' && v.dobas.mutatvanypont === 4 && v.dobas.tipus === 'alap', 'a szerver értékeli a rejtett Célértékű próbát (14 ≥ 13, dupla: 4 pont)', v);
kall = hivas('state.get', { kampany_id: kampany.id }, bencT);
ellenoriz(kall.dobasok.find(d => d.id === 'dobas-p1').celertek === '' && kall.dobasok.find(d => d.id === 'dobas-p1').eredmeny === 'siker', 'a naplóban a játékos a sikert látja, a Célértéket nem');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, dm).probak.find(p => p.id === pAlap.id).allas[morg.id].utolso.eredmeny === 'siker', 'a DM az állásban látja Morg eredményét');
v = hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pAlap.id, mire: 'Észlelés', kockak: [6, 6, 6], modosito: 9, celertek: 1, eredmeny: 'siker', id: 'dobas-p2' }, bencT);
ellenoriz(v.dobas.celertek === 13 && v.dobas.eredmeny === 'siker', 'a kliens által küldött Célérték nem írja felül a kérését');

v = hivas('test.request', { kampany_id: kampany.id, tipus: 'alap', cim: 'Tudás', fokuszok: ['fok_intelligence_arcane_lore'], fokusz_kotelezo: true, celertek: 9,
  mutatvany: { engedett: false }, cimzettek: [morg.id] }, annaT);
const pKot = v.proba;
ellenoriz(v.ok, 'a mesterjátékos kérhet próbát');
v = hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pKot.id, mire: 'Intelligencia', kockak: [6, 6, 6], modosito: 2, id: 'dobas-p3' }, bencT);
ellenoriz(v.dobas.eredmeny === 'kudarc' && v.dobas.mutatvanypont === 0, 'kötelező fókusz nélkül automatikus kudarc', v.dobas);
v = hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pKot.id, mire: 'Intelligencia', kockak: [5, 5, 2], modosito: 4, fokusz: 'fok_intelligence_arcane_lore', id: 'dobas-p4' }, bencT);
ellenoriz(v.dobas.eredmeny === 'siker' && v.dobas.mutatvanypont === 0, 'a fókusszal sikerül, de a DM tiltotta a Mutatványpontot', v.dobas);

v = hivas('test.request', { kampany_id: kampany.id, tipus: 'osszetett', cim: 'Kutatás', celertek: 11, kuszob: 8, idoegyseg: 'egy óra', celertek_rejtett: false }, dm);
const pOssz = v.proba;
ellenoriz(v.ok && pOssz.kuszob === 8, 'összetett próba Sikerküszöbbel');
ellenoriz(hivas('test.request', { kampany_id: kampany.id, tipus: 'osszetett' }, dm).hiba === 'hianyzo_adat', 'összetett próba küszöb nélkül nem kérhető');
[[[1, 2, 5], 5], [[1, 1, 2], 2], [[3, 4, 6], 5]].forEach(([k, m], i) => hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pOssz.id, mire: 'Kutatás', kockak: k, modosito: m, id: 'dobas-o' + i }, bencT));
let allas = hivas('state.get', { kampany_id: kampany.id }, bencT).probak.find(p => p.id === pOssz.id).allas[morg.id];
ellenoriz(allas.osszeg === 11 && allas.kesz && allas.probak_szama === 3 && allas.dobasok.length === 3, 'összetett próba: a sikeres dobások sárkánykockái (5 + 6, a 2-es kudarc nem számít), 3 próba alatt kész', allas);
ellenoriz(allas.kesz_sorszam === 1, 'összetett próba: az egyetlen kész karakter az első (a saját korábbi bejegyzése nem számít bele)', allas);

v = hivas('test.request', { kampany_id: kampany.id, tipus: 'ellen', cim: 'Lopakodás az őr mellett', ellenfel: { nev: 'Őr', bonusz: 3 } }, dm);
const pEllen = v.proba;
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT).probak.find(p => p.id === pEllen.id).ellenfel.bonusz === undefined, 'ellenpróbánál a játékos az ellenfél nevét látja, a bónuszát nem');
hivas('roll.log', { kampany_id: kampany.id, proba_id: pEllen.id, mire: 'Őr: Észlelés', kockak: [2, 3, 4], modosito: 3, ellenfel: true, rejtett: true, id: 'dobas-e1' }, dm);
hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pEllen.id, mire: 'Lopakodás', kockak: [4, 4, 5], modosito: 3, id: 'dobas-e2' }, bencT);
allas = hivas('state.get', { kampany_id: kampany.id }, dm).probak.find(p => p.id === pEllen.id).allas;
ellenoriz(allas._ellenfel.utolso.osszeg === 12 && allas[morg.id].utolso.osszeg === 16, 'ellenpróba: az ellenfél és a karakter eredménye is az állásban', allas);

v = hivas('test.request', { kampany_id: kampany.id, tipus: 'titkos', cim: 'Csapda észlelése', tulajdonsag: 'tul_perception', celertek: 15 }, dm);
const pTitok = v.proba;
const verzioTitok = hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio;
hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pTitok.id, mire: 'Észlelés', kockak: [6, 5, 4], modosito: 1, id: 'dobas-t1' }, dm);
ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, bencT).verzio === verzioTitok, 'a titkos próba dobása nem jelez a játékosoknak');
kall = hivas('state.get', { kampany_id: kampany.id }, bencT);
ellenoriz(!kall.probak.some(p => p.id === pTitok.id) && !kall.dobasok.some(d => d.id === 'dobas-t1'), 'a titkos próbát és a dobását a játékos nem látja');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, dm).dobasok.some(d => d.id === 'dobas-t1' && d.rejtett && d.eredmeny === 'siker'), 'a DM látja a titkos dobást (rejtett, siker)');

ellenoriz(hivas('test.update', { id: pAlap.id, celertek: 15 }, bencT).hiba === 'nincs_jogosultsag', 'játékos nem módosíthat próbát');
v = hivas('test.update', { id: pAlap.id, celertek_rejtett: false }, dm);
ellenoriz(v.ok && hivas('state.get', { kampany_id: kampany.id }, bencT).probak.find(p => p.id === pAlap.id).celertek === 13, 'a DM felfedi a Célértéket');
ellenoriz(hivas('test.close', { id: pAlap.id }, dm).proba.allapot === 'lezart', 'a DM lezárja a próbát');
ellenoriz(hivas('roll.log', { kampany_id: kampany.id, karakter_id: morg.id, proba_id: pAlap.id, mire: 'Késő', kockak: [1, 2, 3] }, bencT).hiba === 'hibas_adat', 'lezárt próbához nem lehet dobni');
ellenoriz(hivas('test.close', { id: pAlap.id, ujranyit: true }, dm).proba.allapot === 'nyitott', 'lezárt próba újranyitható');
const pCimzett = hivas('test.request', { kampany_id: kampany.id, tipus: 'alap', cim: 'Csak Pöttöm', cimzettek: [pottom.id] }, dm).proba;
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, bencT).probak.some(p => p.id === pCimzett.id), 'a nem neki szóló kérést a játékos nem látja');

v = hivas('campaign.update', { id: kampany.id, beallitasok: { mutatvanyok: { felfedezes: false, szerepjatek: true }, celertek_rejtett: false } }, dm);
ellenoriz(v.ok && v.kampany.beallitasok.mutatvanyok.felfedezes === false && v.kampany.beallitasok.celertek_rejtett === false, 'a DM módosítja a kampány beállításait', v.kampany);
ellenoriz(hivas('test.request', { kampany_id: kampany.id, tipus: 'alap', cim: 'Új' }, dm).proba.celertek_rejtett === false, 'az új kérés a kampány beállítását veszi alapul');
ellenoriz(hivas('campaign.update', { id: kampany.id, beallitasok: { celertek_rejtett: true } }, bencT).hiba === 'nincs_jogosultsag', 'beállítást csak a DM módosíthat');

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

// ---------- XP ----------
const b64 = (x) => Buffer.from(x, 'utf8').toString('base64');
let morgElotte = hivas('character.get', { id: morg.id }, dm2).karakter;
v = hivas('character.xp', { tetelek: [{ karakter_id: morg.id, xp: 250 }, { karakter_id: pottom.id, xp: 250 }], ok: 'Rajtaütés', tipus: 'talalkozas', kampany_id: kampany.id }, dm2);
ellenoriz(v.ok && v.karakterek.length === 2 && v.karakterek[0].xp === 250 && v.karakterek[0].verzio === morgElotte.verzio + 1, 'DM XP-t oszt két karakternek, a verzió nő', v);
const morgXp = hivas('character.get', { id: morg.id }, dm2).karakter;
ellenoriz(morgXp.adat.allapot.xp === 250 && morgXp.adat.xp_naplo.length === 1 && morgXp.adat.xp_naplo[0].ok === 'Rajtaütés' && morgXp.xp === 250, 'az XP és a napló a karakteren, az összefoglalóban is', morgXp.adat);
ellenoriz(hivas('character.xp', { tetelek: [{ karakter_id: morg.id, xp: 1000 }] }, annaT).hiba === 'nincs_jogosultsag', 'XP-t csak a DM oszthat');
v = hivas('character.xp', { tetelek: [{ karakter_id: morg.id, xp: -50 }], ok: 'javítás', tipus: 'javitas' }, dm2);
ellenoriz(v.ok && v.karakterek[0].xp === 200, 'negatív XP-vel javítható', v);

// ---------- Karakterkép ----------
v = hivas('character.image.set', { id: morg.id, kep: b64('NAGYKEP'), belyeg: b64('BELYEG') }, annaT);
ellenoriz(v.ok && v.kep && v.kep.verzio === 1 && v.kep.kep !== v.kep.belyeg, 'A mesterjátékos képet tölt fel Morghoz (kép és bélyeg)', v);
const kep1 = v.kep;
ellenoriz(fajlok[kep1.kep] && fajlok[kep1.kep].szulo === mappaKeres(gyoker, tulajdonsagok.KEPMAPPA_ID).id && mappaKeres(gyoker, tulajdonsagok.KEPMAPPA_ID).nev === 'Karakterképek', 'a kép a Karakterképek mappába került');
ellenoriz(hivas('characters.list', {}, annaT).karakterek.find(c => c.id === morg.id).kep === kep1.belyeg, 'a listában a bélyeg azonosítója');
v = hivas('image.get', { idk: [kep1.kep, kep1.belyeg] }, annaT);
ellenoriz(v.ok && Buffer.from(v.kepek[kep1.kep], 'base64').toString() === 'NAGYKEP' && Buffer.from(v.kepek[kep1.belyeg], 'base64').toString() === 'BELYEG', 'a kép és a bélyeg lekérhető', v);
ellenoriz(Object.keys(hivas('image.get', { idk: [kep1.belyeg] }, dm2).kepek).length === 1, 'a DM is látja');
v = hivas('character.image.set', { id: bhos.id, kep: b64('SAJAT') }, dm2);
ellenoriz(v.ok && Object.keys(hivas('image.get', { idk: [v.kep.kep] }, annaT).kepek).length === 0, 'más kampányon kívüli karakterének képe nem kérhető le');
ellenoriz(hivas('character.image.set', { id: bhos.id, kep: b64('X') }, annaT).hiba === 'nincs_jogosultsag', 'képet csak az tölthet fel, aki a karaktert szerkesztheti');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).karakterek.find(c => c.id === pottom.id).kep === '', 'a csapattárs névsorában a kép mezője is ott van');
v = hivas('character.image.set', { id: morg.id, kep: b64('UJKEP'), belyeg: b64('UJBELYEG') }, annaT);
ellenoriz(v.ok && v.kep.verzio === 2 && fajlok[kep1.kep].kuka && fajlok[kep1.belyeg].kuka, 'képcsere: a régi fájlok a kukába kerülnek', v);
const kep2 = v.kep;
v = hivas('character.image.set', { id: morg.id, kep: null }, annaT);
ellenoriz(v.ok && v.kep === null && fajlok[kep2.kep].kuka && hivas('character.get', { id: morg.id }, dm2).karakter.adat.alap.kep === null, 'kép törlése', v);
v = hivas('character.image.set', { id: morg.id, kep: b64('HARMADIK') }, annaT);
const kep3 = v.kep;

// ---------- NJK-tár (3. lépés, 2. ütem) ----------
hivas('users.admin', { muvelet: 'engedelyez', id: bence.id }, dm2);
const bencT3 = hivas('login', { nev: 'Bence', jelszo: 'bence1' }).token;
ellenoriz(hivas('npc.save', { nev: 'Őr' }, annaT).hiba === 'nincs_jogosultsag', 'NJK-t csak a DM hozhat létre');
v = hivas('npc.save', { nev: 'Grimbold, a kapuőr', fajta: 'statblokk', alap_szorny: 'szo_bandit', fenyegetes: 'Csekély', kampanyok: [kampany.id],
  adat: { statblokk: { tulajdonsagok: { tul_fighting: 2 } }, szerep: { nyilvanos: 'Morcos öreg őr.', titkok: 'A bandák fizetik.', kep: { kep: 'hamis' } } } }, dm2);
const grim = v.njk;
ellenoriz(v.ok && grim.verzio === 1 && grim.kampanyok[0] === kampany.id && grim.adat.szerep.kep === null, 'DM NJK-t hoz létre kampányhoz rendelve (a kép mentéssel nem írható)', v);
v = hivas('npc.save', { id: grim.id, verzio: 1, fenyegetes: 'Mérsékelt' }, dm2);
ellenoriz(v.ok && v.verzio === 2 && v.njk.adat.szerep.titkok === 'A bandák fizetik.', 'NJK módosítása: a verzió nő, az adat megmarad', v);
ellenoriz(hivas('npc.save', { id: grim.id, verzio: 1, nev: 'X' }, dm2).hiba === 'utkozes', 'régi verzióra mentés ütközést jelez');
ellenoriz(jatek.getSheetByName('Változásnapló').adat.some(sor => sor.includes('njk.ment')), 'az NJK mentése a Változásnaplóba kerül');
ellenoriz(hivas('npc.list', {}, dm2).njkk.some(n => n.id === grim.id && n.fenyegetes === 'Mérsékelt'), 'npc.list: a DM listájában ott van');
let allNjk = hivas('state.get', { kampany_id: kampany.id }, dm2);
ellenoriz(allNjk.njkk.some(n => n.id === grim.id && n.adat.szerep.titkok), 'a kampány állapotában a DM látja az NJK-t a titkokkal');
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, annaT).njkk.some(n => n.id === grim.id), 'meg nem osztott NJK-t a mesterjátékos sem lát');
ellenoriz(hivas('npc.get', { id: grim.id }, bencT3).hiba === 'nincs_jogosultsag', 'meg nem osztott NJK nem kérhető le játékosként');
hivas('share.send', { kampany_id: kampany.id, cimzett: 'mindenki', tipus: 'njk', cim: 'Grimbold', hivatkozas: grim.id }, dm2);
let bNjk = hivas('state.get', { kampany_id: kampany.id }, bencT3).njkk.find(n => n.id === grim.id);
ellenoriz(bNjk && bNjk.lathatosag === 'nyilvanos' && bNjk.adat.szerep.nyilvanos === 'Morcos öreg őr.' && !bNjk.adat.statblokk && !bNjk.adat.szerep.titkok && bNjk.fenyegetes === undefined,
  'megosztás után a játékos a nevet és a nyilvános leírást látja, a statblokkot és a titkot nem', bNjk);
ellenoriz(hivas('roll.log', { kampany_id: kampany.id, njk_id: grim.id, mire: 'Grimbold: Észlelés', kockak: [1, 2, 3] }, bencT3).hiba === 'nincs_jogosultsag', 'játékos nem dobhat egy idegen NJK nevében');
v = hivas('roll.log', { kampany_id: kampany.id, njk_id: grim.id, mire: 'Grimbold: Észlelés', kockak: [2, 2, 3], modosito: 1, tipus: 'alap' }, dm2);
ellenoriz(v.ok && v.dobas.njk_id === grim.id && v.dobas.karakter_id === '', 'a DM próbája az NJK-ért naplózódik (njk_id)');
ellenoriz(hivas('roll.log', { njk_id: grim.id, mire: 'Grimbold: Erő', kockak: [3, 3, 3] }, dm2).ok, 'NJK-próba kampány nélkül is naplózható (a DM-nek)');

// követő: Morghoz (Bence karakteréhez) kötve, és a csapathoz kötve
v = hivas('npc.save', { nev: 'Bolhás', fajta: 'koveto', kotodes: morg.id, kampanyok: [kampany.id], adat: { statblokk: { egeszseg: 12 }, szerep: { titkok: 'Valójában farkas.', feladatok: ['őrt áll'] } } }, dm2);
const bolhas = v.njk;
let kNjk = hivas('state.get', { kampany_id: kampany.id }, bencT3).njkk.find(n => n.id === bolhas.id);
ellenoriz(kNjk && kNjk.lathatosag === 'kovetonek' && kNjk.adat.statblokk.egeszseg === 12 && !kNjk.adat.szerep.titkok, 'a gazda karakter játékosa látja a követő statblokkját, a titkát nem', kNjk);
ellenoriz(hivas('roll.log', { kampany_id: kampany.id, njk_id: bolhas.id, mire: 'Bolhás: Észlelés', kockak: [4, 5, 6] }, bencT3).ok, 'a gazda karakter játékosa dobhat a követőért');
hivas('npc.save', { id: bolhas.id, iranyito: anna.id }, dm2);
ellenoriz(hivas('roll.log', { kampany_id: kampany.id, njk_id: bolhas.id, mire: 'Bolhás', kockak: [4, 5, 6] }, bencT3).hiba === 'nincs_jogosultsag', 'ha más az irányító, a gazda már nem dob érte');
ellenoriz(hivas('roll.log', { kampany_id: kampany.id, njk_id: bolhas.id, mire: 'Bolhás', kockak: [4, 5, 6] }, annaT).ok, 'az irányító dobhat a követőért');
v = hivas('npc.save', { nev: 'Aryss', fajta: 'koveto', kotodes: 'csapat', kampanyok: [kampany.id], adat: {} }, dm2);
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, bencT3).njkk.some(n => n.id === v.njk.id && n.lathatosag === 'kovetonek'), 'a csapathoz kötött követőt a kampány tagja látja');

// kép
v = hivas('npc.image.set', { id: grim.id, kep: Buffer.from('njkkep').toString('base64'), belyeg: Buffer.from('b').toString('base64') }, dm2);
ellenoriz(v.ok && v.kep && v.kep.belyeg, 'NJK-kép feltöltése');
ellenoriz(Object.keys(hivas('image.get', { idk: [v.kep.belyeg] }, bencT3).kepek).length === 1, 'a megosztott NJK képét a játékos lekérheti');
const grimKep = v.kep;

// archiválás, törlés
ellenoriz(hivas('npc.delete', { id: grim.id }, dm2).hiba === 'hibas_adat', 'aktív NJK nem törölhető');
hivas('npc.archive', { id: grim.id, aktiv: false }, dm2);
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, bencT3).njkk.some(n => n.id === grim.id), 'archivált NJK-t a játékos nem lát');
ellenoriz(!hivas('npc.list', {}, dm2).njkk.some(n => n.id === grim.id) && hivas('npc.list', { archivaltak: true }, dm2).njkk.some(n => n.id === grim.id), 'az archivált NJK csak kérésre szerepel a listában');
ellenoriz(hivas('npc.delete', { id: grim.id }, dm2).ok && fajlok[grimKep.kep].kuka, 'archivált NJK törölhető, a képe a kukába kerül');

// karakter-szintű NJK jelző
v = hivas('character.npc', { id: pottom.id, njk: true }, dm2);
ellenoriz(v.ok && v.karakter.njk === true, 'a DM karakter-szintű NJK-nak jelöli a karaktert');
ellenoriz(hivas('character.npc', { id: pottom.id, njk: true }, annaT).hiba === 'nincs_jogosultsag', 'az NJK jelzőt csak a DM állíthatja');

// egy karakter egyszerre egy kampányban aktív
const masik = hivas('campaign.create', { cim: 'Mellékszál' }, dm2).kampany;
v = hivas('campaign.addCharacter', { kampany_id: masik.id, karakter_id: pottom.id }, dm2);
ellenoriz(v.ok && v.kileptetve.includes(kampany.id), 'új kampányban aktívvá téve a korábbi aktív kampányából kiléptetődik', v);
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, dm2).karakterek.find(c => c.id === pottom.id).kampany_allapot === 'kilépett', 'a korábbi kampányban „kilépett” az állapota');
ellenoriz(JSON.stringify(hivas('characters.list', {}, dm2).karakterek.find(c => c.id === pottom.id).aktiv_kampanyok) === JSON.stringify([masik.id]), 'a karakter összefoglalója mutatja az aktív kampányát');
v = hivas('campaign.addCharacter', { kampany_id: kampany.id, karakter_id: pottom.id, allapot: 'távol' }, dm2);
ellenoriz(v.ok && !v.kileptetve.length, 'nem aktív állapot nem léptet ki máshonnan');
hivas('campaign.update', { id: masik.id, allapot: 'archivált' }, dm2);
hivas('campaign.delete', { id: masik.id }, dm2);

// ---------- Összecsapások (3. lépés, 3. ütem) ----------
const eAdat = { leiras: 'Rajtaütés a hídnál', oldalak: [{ id: 'o_csapat', nev: 'Csapat' }, { id: 'o_ellen', nev: 'Ellenfelek' }],
  viszonyok: { 'o_csapat|o_ellen': 'ellenseges' }, csoportok: [], resztvevok: [{ id: 'r1', forras: { tipus: 'szorny', id: 'szo_bandit' }, nev: 'Bandita', db: 3, oldal: 'o_ellen' }] };
ellenoriz(hivas('encounter.save', { kampany_id: kampany.id, cim: 'Híd', adat: eAdat }, annaT).hiba === 'nincs_jogosultsag', 'összecsapást csak a DM készíthet');
ellenoriz(hivas('encounter.save', { cim: 'Híd', adat: eAdat }, dm2).hiba === 'hianyzo_adat', 'kampány nélkül nem jön létre összecsapás');
ellenoriz(hivas('encounter.save', { kampany_id: kampany.id, cim: '  ', adat: eAdat }, dm2).hiba === 'hianyzo_adat', 'cím nélkül nem jön létre összecsapás');
const kvElotte = hivas('state.poll', { kampany_id: kampany.id }, dm2).verzio;
v = hivas('encounter.save', { kampany_id: kampany.id, cim: 'Rajtaütés a hídnál', adat: eAdat }, dm2);
const hid = v.osszecsapas;
ellenoriz(v.ok && hid.verzio === 1 && hid.allapot === 'előkészítés' && hid.adat.resztvevok[0].db === 3, 'a DM összecsapást készít a kampányhoz', v);
ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, dm2).verzio > kvElotte, 'az összecsapás mentése növeli a kampány verzióját');
let eAll = hivas('state.get', { kampany_id: kampany.id }, dm2);
ellenoriz(eAll.osszecsapasok && eAll.osszecsapasok.some(e => e.id === hid.id && e.adat.leiras === 'Rajtaütés a hídnál'), 'a DM kampányállapotában ott az összecsapás');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).osszecsapasok === undefined, 'a mesterjátékos nem látja az előkészített összecsapásokat');
v = hivas('encounter.save', { id: hid.id, verzio: 1, allapot: 'kész', adat: Object.assign({}, eAdat, { terep: 'csúszós deszkák' }) }, dm2);
ellenoriz(v.ok && v.verzio === 2 && v.osszecsapas.allapot === 'kész' && v.osszecsapas.adat.terep === 'csúszós deszkák' && v.osszecsapas.cim === 'Rajtaütés a hídnál', 'módosítás: verzió nő, a cím megmarad');
ellenoriz(hivas('encounter.save', { id: hid.id, verzio: 1, cim: 'X' }, dm2).hiba === 'utkozes', 'régi verzióra mentés ütközést jelez');
ellenoriz(hivas('encounter.save', { id: hid.id, allapot: 'valami' }, dm2).osszecsapas.allapot === 'előkészítés', 'ismeretlen állapot helyett előkészítés');
ellenoriz(hivas('encounter.save', { id: hid.id, adat: [1, 2] }, dm2).hiba === 'hibas_adat', 'hibás adat nem menthető');
ellenoriz(hivas('encounter.save', { id: hid.id, kampany_id: 'c_nincs' }, dm2).hiba === 'nem_talalhato', 'nem létező kampányba nem tehető');
ellenoriz(jatek.getSheetByName('Változásnapló').adat.some(sor => sor.includes('osszecsapas.ment')), 'az összecsapás mentése a Változásnaplóba kerül');
ellenoriz(hivas('encounter.list', {}, dm2).osszecsapasok.some(e => e.id === hid.id) && hivas('encounter.list', { kampany_id: 'masik' }, dm2).osszecsapasok.length === 0, 'encounter.list kampány szerint szűr');
ellenoriz(hivas('encounter.delete', { id: hid.id }, dm2).hiba === 'hibas_adat', 'aktív összecsapás nem törölhető');
hivas('encounter.archive', { id: hid.id, aktiv: false }, dm2);
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, dm2).osszecsapasok.some(e => e.id === hid.id), 'az archivált összecsapás nincs a kampányállapotban');
ellenoriz(!hivas('encounter.list', {}, dm2).osszecsapasok.some(e => e.id === hid.id) && hivas('encounter.list', { archivaltak: true }, dm2).osszecsapasok.some(e => e.id === hid.id && !e.aktiv), 'az archivált csak kérésre szerepel a listában');
ellenoriz(hivas('encounter.delete', { id: hid.id }, dm2).ok && !hivas('encounter.list', { archivaltak: true }, dm2).osszecsapasok.some(e => e.id === hid.id), 'archivált összecsapás törölhető');
const marado = hivas('encounter.save', { kampany_id: kampany.id, cim: 'Farkasok', adat: eAdat }, dm2).osszecsapas;

// ---------- Csaták (3. lépés, 4. ütem) ----------
const csAdat = (extra) => Object.assign({ v: 1, allapot: 'kezdemenyezes', kor: 0, soron: null, sorrend: [], leptek: [], oldalak: eAdat.oldalak, viszonyok: eAdat.viszonyok, csoportok: [],
  resztvevok: [{ id: 'p1', forras: { tipus: 'karakter', id: pottom.id }, nev: 'Pöttöm', oldal: 'o_csapat', egeszseg: 30, egeszseg_max: 30, allapot: 'aktiv' },
    { id: 'r1_1', forras: { tipus: 'szorny', id: 'szo_bandit' }, nev: 'Bandita 1', oldal: 'o_ellen', egeszseg: 12, egeszseg_max: 12, allapot: 'aktiv' }],
  naplo: [], visszavonas: [], kulcsok: [] }, extra || {});
ellenoriz(hivas('combat.start', { kampany_id: kampany.id, cim: 'X', adat: csAdat() }, annaT).hiba === 'nincs_jogosultsag', 'csatát (a 4. ütemben) csak a DM indíthat');
ellenoriz(hivas('combat.start', { kampany_id: kampany.id, cim: 'X', adat: { resztvevok: 'x' } }, dm2).hiba === 'hibas_adat', 'hibás csataállapot nem indul');
v = hivas('combat.start', { kampany_id: kampany.id, osszecsapas_id: marado.id, cim: 'Farkasok', adat: csAdat(), pillanatkepek: { 'szorny:szo_bandit': { nev_hu: 'Bandita' } } }, dm2);
const csata = v.csata;
ellenoriz(v.ok && csata.verzio === 1 && csata.allapot === 'kezdemenyezes' && csata.pillanatkepek['szorny:szo_bandit'].nev_hu === 'Bandita', 'a DM csatát indít az összecsapásból', v);
let csAll = hivas('state.get', { kampany_id: kampany.id }, dm2);
ellenoriz(csAll.csatak && csAll.csatak.some(c => c.id === csata.id && c.adat.resztvevok.length === 2), 'a DM kampányállapotában ott a csata');
ellenoriz(Array.isArray(hivas('state.get', { kampany_id: kampany.id }, annaT).csatak), 'a játékosok (5. ütem) szűrt csatalistát kapnak');
const karVerzio = hivas('character.get', { id: pottom.id }, dm2).karakter.verzio;
v = hivas('combat.act', { id: csata.id, verzio: 1, kulcs: 'l1', adat: csAdat({ allapot: 'fut', kor: 1, kulcsok: ['l1'] }), karakterek: { [pottom.id]: 21, k_idegen: 5 } }, dm2);
ellenoriz(v.ok && v.verzio === 2 && v.csata.kor === 1 && v.csata.allapot === 'fut' && JSON.stringify(v.karakterek) === JSON.stringify([pottom.id]), 'lépés: az állapot ment, a résztvevő karakter Egészsége íródik (idegen nem)', v);
const potKar = hivas('character.get', { id: pottom.id }, dm2).karakter;
ellenoriz(potKar.adat.allapot.egeszseg === 21 && potKar.verzio === karVerzio + 1, 'a karakter állapotában az új Egészség, a verziója nő');
v = hivas('combat.act', { id: csata.id, verzio: 1, kulcs: 'l1', adat: csAdat({ kor: 9 }) }, dm2);
ellenoriz(v.ok && v.ismetelt && v.csata.kor === 1, 'ugyanaz a lépés újra: nincs változás (dupla küldés)');
v = hivas('combat.act', { id: csata.id, verzio: 1, kulcs: 'l2', adat: csAdat() }, dm2);
ellenoriz(v.hiba === 'utkozes' && v.aktualis && v.aktualis.verzio === 2, 'elavult verzió: ütközés, az aktuális csatával');
ellenoriz(hivas('combat.act', { id: csata.id, verzio: 2, kulcs: 'l3', adat: csAdat() }, annaT).hiba === 'nincs_jogosultsag', 'a játékos nem küldhet teljes csataállapotot');
v = hivas('combat.close', { id: csata.id }, dm2);
ellenoriz(v.ok && v.csata.allapot === 'lezart' && v.csata.lezarva && v.csata.adat.allapot === 'lezart', 'a csata lezárul');
ellenoriz(hivas('encounter.list', { kampany_id: kampany.id }, dm2).osszecsapasok.find(e => e.id === marado.id).allapot === 'lefutott', 'az összecsapása „lefutott” lesz');
ellenoriz(hivas('combat.act', { id: csata.id, verzio: 3, kulcs: 'l4', adat: csAdat() }, dm2).hiba === 'hibas_adat', 'lezárt csata nem léptethető');
csAll = hivas('state.get', { kampany_id: kampany.id }, dm2);
ellenoriz(csAll.csatak.some(c => c.id === csata.id && c.allapot === 'lezart' && !c.adat), 'a lezárt csata röviden szerepel (a napló szűrőjéhez)');
v = hivas('roll.log', { kampany_id: kampany.id, mire: 'Sebzés', kockak: [4, 5], modosito: 2, tipus: 'sebzes', csata_id: csata.id }, dm2);
ellenoriz(v.ok && v.dobas.tipus === 'sebzes' && v.dobas.csata_id === csata.id, 'sebzésdobás a naplóban a csata azonosítójával');
const csata2 = hivas('combat.start', { kampany_id: kampany.id, cim: 'Gyors csata', adat: csAdat() }, dm2).csata;
ellenoriz(csata2 && !csata2.osszecsapas_id, 'gyors csata összecsapás nélkül');
ellenoriz(hivas('combat.delete', { id: csata2.id }, dm2).ok && !hivas('state.get', { kampany_id: kampany.id }, dm2).csatak.some(c => c.id === csata2.id), 'csata törlése');


// ---------- Változásfigyelés egy hívással ----------
{
  const pv = hivas('state.poll', { kampany_id: kampany.id }, bencT3).verzio;
  const azonos = hivas('state.poll', { kampany_id: kampany.id, ismert: pv, teljes: true }, bencT3);
  ellenoriz(azonos.ok && azonos.verzio === pv && !azonos.allapot, 'változatlan verziónál a figyelés könnyű marad');
  const elteres = hivas('state.poll', { kampany_id: kampany.id, ismert: pv - 1, teljes: true }, bencT3);
  ellenoriz(elteres.ok && elteres.allapot && elteres.allapot.kampany.id === kampany.id && !elteres.allapot.osszecsapasok, 'eltérő verziónál a figyelés rögtön a (szűrt) állapotot hozza');
  ellenoriz(hivas('state.poll', { kampany_id: kampany.id, ismert: 0, teljes: true }, 'rossz-token').hiba, 'érvénytelen belépéssel nincs állapot');
}

// ---------- Csata: a játékos oldala (3. lépés, 5. ütem) ----------
const kapitany = hivas('npc.save', { nev: 'Őrkapitány', fajta: 'statblokk', kampanyok: [kampany.id], adat: { statblokk: { egeszseg: 20 }, allapot: {} } }, dm2).njk;
const resz = (id, forras, nev, oldal, extra) => Object.assign({ id, resztvevo_id: id, forras, nev, oldal, csoport: '', fontos: false, rejtett: false, meglepett: false,
  kezdemenyezes: null, egeszseg: 20, egeszseg_max: 20, szivossag: 1, allapot: 'aktiv', haldoklas_kor: null, feltetelek: [], hatasok: [],
  cselekves: { fo: 0, mellek: 0, plusz: 0, lista: [] }, gyogyithato: true, magiapont: null, ertekek: { vedekezes: 12, pancelertek: 3, atuto_ellen: false } }, extra || {});
const jAdat = (extra) => Object.assign({ v: 1, allapot: 'kezdemenyezes', kor: 0, soron: null, sorrend: [], leptek: [], oldalak: eAdat.oldalak, viszonyok: eAdat.viszonyok, csoportok: [],
  resztvevok: [
    resz('p_pot', { tipus: 'karakter', id: pottom.id }, 'Pöttöm', 'o_csapat'),
    resz('p_morg', { tipus: 'karakter', id: morg.id }, 'Morg', 'o_csapat', { magiapont: 10, ertekek: { vedekezes: 11, pancelertek: 0, magiapont_max: 12 } }),
    resz('p_kap', { tipus: 'njk', id: kapitany.id }, 'Őrkapitány', 'o_ellen', { fontos: true }),
    resz('p_rejt', { tipus: 'szorny', id: 'szo_bandit' }, 'Rejtett íjász', 'o_ellen', { rejtett: true })],
  naplo: [{ kor: 0, szoveg: 'Kezdés' }, { kor: 0, szoveg: 'Titkos erősítés', dm: true }], visszavonas: [], kulcsok: [], fuggo: [] }, extra || {});
const jcs = hivas('combat.start', { kampany_id: kampany.id, cim: 'Őrség', adat: jAdat() }, dm2).csata;
let bNezet = hivas('state.get', { kampany_id: kampany.id }, bencT3).csatak.find(c => c.id === jcs.id);
ellenoriz(bNezet && bNezet.adat.resztvevok.length === 3 && !bNezet.adat.resztvevok.some(r => r.nev === 'Rejtett íjász'), 'a játékos nem látja a rejtett résztvevőt', bNezet);
const bKap = bNezet.adat.resztvevok.find(r => r.id === 'p_kap');
ellenoriz(bKap.egeszseg === null && bKap.egeszseg_szoveg === 'ép' && bKap.ertekek.vedekezes === 12, 'más oldal Egészsége leíró, a Védekezés megérkezik', bKap);
ellenoriz(bNezet.adat.resztvevok.find(r => r.id === 'p_morg').iranyithato && !bNezet.adat.resztvevok.find(r => r.id === 'p_pot').iranyithato, 'Bence a saját karakterét irányítja, a másikat nem');
ellenoriz(!bNezet.adat.naplo.some(n => n.dm) && !bNezet.adat.visszavonas && !bNezet.pillanatkepek, 'a DM naplósorai, a visszavonás és a pillanatképek nem mennek ki');
const jl = (muvelet, token, kulcs) => hivas('combat.player', { id: jcs.id, kulcs: kulcs || ('k' + Math.random()), muvelet }, token);
ellenoriz(jl({ tipus: 'kezdemenyezes', r: 'p_pot', osszeg: 12, sarkany: 4, tul: 2, kockak: [3, 3, 4] }, bencT3).hiba === 'hibas_lepes', 'más karakteréért nem dobhat kezdeményezést');
v = jl({ tipus: 'kezdemenyezes', r: 'p_morg', osszeg: 15, sarkany: 5, tul: 2, kockak: [4, 4, 5] }, bencT3, 'kz1');
ellenoriz(v.ok && v.csata.adat.resztvevok.find(r => r.id === 'p_morg').kezdemenyezes.osszeg === 15, 'a játékos kezdeményezése rögzül, szűrt választ kap', v);
ellenoriz(jl({ tipus: 'kezdemenyezes', r: 'p_morg', osszeg: 3 }, bencT3, 'kz1').ismetelt, 'a dupla küldés nem lép kétszer');
ellenoriz(jl({ tipus: 'kezdemenyezes', r: 'p_pot', osszeg: 9, sarkany: 1, tul: 1, kockak: [1, 2, 1] }, annaT).ok, 'a mesterjátékos a kampány bármely karakteréért dobhat');
let teljes = hivas('state.get', { kampany_id: kampany.id }, dm2).csatak.find(c => c.id === jcs.id);
ellenoriz(teljes.adat.visszavonas.length === 2 && teljes.adat.visszavonas[1].szerzo === anna.id, 'a DM teljes állapotában a lépések szerzővel', teljes.adat.visszavonas);
ellenoriz(jl({ tipus: 'visszavonas' }, bencT3).hiba === 'hibas_lepes', 'más lépését a játékos nem vonhatja vissza');
// a DM elindítja: Morg következik
const futAdat = Object.assign({}, teljes.adat, { allapot: 'fut', kor: 1, soron: 'p_morg', sorrend: ['p_morg', 'p_kap', 'p_pot'], leptek: [] });
ellenoriz(hivas('combat.act', { id: jcs.id, verzio: teljes.verzio, kulcs: 'dmind', adat: futAdat }, dm2).ok, 'a DM elindítja a csatát');
ellenoriz(jl({ tipus: 'cselekves', r: 'p_pot', kulcs: 'vedekezes' }, annaT).hiba === 'hibas_lepes', 'nem soron lévő nem cselekedhet');
v = jl({ tipus: 'tamadas', r: 'p_morg', cel: 'p_kap', cselekves: 'tamadas', tamadas: { nev: 'Kard' }, osszeg: 14, talalat: true, sebzes: 9, pancel: 0, hatasok: {}, mutatvanyok: [] }, bencT3);
teljes = hivas('state.get', { kampany_id: kampany.id }, dm2).csatak.find(c => c.id === jcs.id);
ellenoriz(v.ok && teljes.adat.resztvevok.find(r => r.id === 'p_kap').egeszseg === 14, 'támadás: a háttér a saját Páncélértékével számol (9 − 3 = 6 sebzés)', v);
ellenoriz(jl({ tipus: 'tamadas', r: 'p_morg', cel: 'p_kap', cselekves: 'tamadas', osszeg: 18, sebzes: 9 }, bencT3).hiba === 'hibas_lepes', 'a fő cselekvés elfogyott: második támadás nem megy');
ellenoriz(jl({ tipus: 'tamadas', r: 'p_morg', cel: 'p_rejt', cselekves: 'tamadas', osszeg: 18, sebzes: 9 }, bencT3).hiba === 'hibas_lepes', 'rejtett célpont nem támadható');
v = jl({ tipus: 'varazslat', r: 'p_morg', varazslat: { id: 'x', nev: 'Villámcsapás' }, fajta: 'mellek', mp: 4, siker: true, osszeg: 13, celok: ['p_kap'],
  proba: { tul: 'tul_constitution', fokuszok: [], celertek: 13, nev: 'Szívósság' }, sebzes: { teljes: 10, csokkentett: 4, atuto: true }, hatasok: {}, mutatvanyok: [] }, bencT3);
teljes = hivas('state.get', { kampany_id: kampany.id }, dm2).csatak.find(c => c.id === jcs.id);
const fuggo = teljes.adat.fuggo[0];
ellenoriz(v.ok && fuggo && fuggo.cel === 'p_kap' && fuggo.teljes === 10 && teljes.adat.resztvevok.find(r => r.id === 'p_morg').magiapont === 6, 'varázslat: a Mágiapont fogy, a célpont próbája függő lesz', teljes.adat.fuggo);
ellenoriz(hivas('character.get', { id: morg.id }, dm2).karakter.adat.allapot.magiapont === 6, 'a Mágiapont a karakter állapotába íródik');
ellenoriz(jl({ tipus: 'celpont_proba', proba_id: fuggo.id, osszeg: 9 }, bencT3).hiba === 'hibas_lepes', 'az NJK célpont próbáját a játékos nem dobhatja');
v = jl({ tipus: 'celpont_proba', proba_id: fuggo.id, osszeg: 9, kockak: [2, 3, 1] }, dm2);
teljes = hivas('state.get', { kampany_id: kampany.id }, dm2).csatak.find(c => c.id === jcs.id);
ellenoriz(v.ok && !teljes.adat.fuggo.length && teljes.adat.resztvevok.find(r => r.id === 'p_kap').egeszseg === 4, 'a DM dobja a célpont próbáját: nem állt ellen, átütő sebzés (14 − 10 = 4)', v);
v = jl({ tipus: 'kovetkezo', r: 'p_morg' }, bencT3);
ellenoriz(v.ok && v.csata.adat.soron === 'p_kap', 'a játékos befejezi a körét, a következő jön');
v = jl({ tipus: 'visszavonas' }, bencT3);
ellenoriz(v.ok && v.csata.adat.soron === 'p_morg', 'a játékos visszavonja a saját utolsó lépését', v);
v = hivas('combat.close', { id: jcs.id, adat: teljes.adat }, dm2);
const kapUtana = hivas('npc.get', { id: kapitany.id }, dm2).njk;
ellenoriz(v.ok && JSON.stringify(v.njkk) === JSON.stringify([kapitany.id]) && kapUtana.adat.allapot.egeszseg === 4 && kapUtana.adat.szereplesek.some(s => s.csata_id === jcs.id), 'lezárás: az NJK Egészsége és szereplése visszaíródik', kapUtana.adat);
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, bencT3).csatak.some(c => c.id === jcs.id), 'a lezárt csata a játékosnak eltűnik');
ellenoriz(jl({ tipus: 'kovetkezo', r: 'p_morg' }, bencT3).hiba === 'hibas_adat', 'lezárt csatában nincs lépés');

hivas('users.admin', { muvelet: 'letilt', id: bence.id }, dm2);

ellenoriz(hivas('character.delete', { id: morg.id }, dm2).hiba === 'hibas_adat', 'aktív karakter nem törölhető');
ellenoriz(hivas('character.archive', { id: morg.id, aktiv: false }, annaT).hiba === 'nincs_jogosultsag', 'archiválni csak a DM tud');
ellenoriz(hivas('character.archive', { id: morg.id, aktiv: false }, dm2).ok, 'DM archiválja Morgot');
ellenoriz(!hivas('state.get', { kampany_id: kampany.id }, annaT).karakterek.some(c => c.id === morg.id), 'archivált karakter nem látszik a kampányban');
ellenoriz(!hivas('characters.list', {}, annaT).karakterek.some(c => c.id === morg.id), 'archivált karakter nincs a mesterjátékos listájában');
ellenoriz(hivas('characters.list', {}, dm2).karakterek.some(c => c.id === morg.id && !c.aktiv), 'a DM listájában archiváltként szerepel');
ellenoriz(hivas('character.delete', { id: morg.id }, dm2).ok, 'archivált karakter törölhető');
ellenoriz(!jatek.getSheetByName('Kampánykarakterek').adat.some(sor => sor.includes(morg.id)), 'a törölt karakter kampánykapcsolata is törlődött');
ellenoriz(hivas('character.get', { id: morg.id }, dm2).hiba === 'nem_talalhato', 'a törölt karakter nem kérhető le');
ellenoriz(fajlok[kep3.kep].kuka, 'a törölt karakter képe is a kukába került');

ellenoriz(hivas('users.admin', { muvelet: 'torol', id: anna.id }, dm2).hiba === 'hibas_adat', 'aktív felhasználó nem törölhető');
ellenoriz(/Bence önálló hőse/.test(hivas('users.admin', { muvelet: 'torol', id: bence.id }, dm2).uzenet), 'karakteres felhasználó nem törölhető, az üzenet megnevezi a karaktert');
hivas('character.assign', { karakter_id: bhos.id, jatekos_id: '' }, dm2);
ellenoriz(hivas('users.admin', { muvelet: 'torol', id: bence.id }, dm2).ok, 'letiltott, karakter nélküli felhasználó törölhető');
ellenoriz(!hivas('init', {}, dm2).felhasznalok.some(f => f.id === bence.id), 'a törölt felhasználó eltűnt');
ellenoriz(hivas('login', { nev: 'Bence', jelszo: 'bence1' }).hiba === 'hibas_belepes', 'a törölt felhasználó nem léphet be');

// ---------- Kampányépítő (5. lépés, 5.1 alépés) ----------
ellenoriz(hivas('prep.get', {}, annaT).hiba === 'nincs_jogosultsag', 'az előkészítést játékos nem kérheti le');
v = hivas('prep.get', {}, dm2);
ellenoriz(v.ok && v.vilagok.length === 0 && v.elemek.length === 0 && v.kapcsolatok.length === 0 && v.keret === undefined, 'üres előkészítés');
ellenoriz(hivas('world.save', { id: 'w_hibas!', uj: true, nev: 'X' }, dm2).hiba === 'hibas_adat', 'hibás világazonosító');
v = hivas('world.save', { id: 'w_alfold01', uj: true, nev: 'Alföld', adat: { alapkoncepcio: 'Végtelen puszta' } }, dm2);
ellenoriz(v.ok && v.verzio === 1 && v.vilag.adat.alapkoncepcio === 'Végtelen puszta', 'új világ a felület adta azonosítóval');
ellenoriz(hivas('world.save', { id: 'w_alfold01', uj: true, nev: 'Alföld' }, dm2).verzio === 1, 'ismételt küldés nem hoz létre újat');
ellenoriz(hivas('world.save', { id: 'w_alfold01', verzio: 0, nev: 'Y' }, dm2).hiba === 'utkozes', 'világmentés verzióütközése');
ellenoriz(hivas('world.save', { id: 'w_alfold01', verzio: 1, nev: 'Alföld és környéke' }, dm2).verzio === 2, 'világ mentése');
const kVerzio = hivas('state.poll', { kampany_id: kampany.id }, annaT).verzio;
v = hivas('element.save', { id: 'el_sablon001', uj: true, tipus: 'helyszin', nev: 'Kocsma', adat: { nev: 'Kocsma', leiras: 'Füstös ivó.' } }, dm2);
ellenoriz(v.ok && v.elem.vilag_id === '' && v.elem.kampany_id === '' && v.verzio === 1, 'sablon létrehozása');
v = hivas('element.save', { id: 'el_vilag001', uj: true, tipus: 'helyszin', vilag_id: 'w_alfold01', nev: 'Pusztaváros', adat: { nev: 'Pusztaváros' } }, dm2);
ellenoriz(v.ok && v.elem.vilag_id === 'w_alfold01', 'világelem létrehozása');
v = hivas('element.save', { id: 'el_kamp0001', uj: true, tipus: 'helyszin', kampany_id: kampany.id, alap_id: 'el_sablon001', szulo_id: 'el_vilag001', nev: 'Vén Csuka', adat: { nev: 'A Vén Csuka', titkok: 'Kém' } }, dm2);
ellenoriz(v.ok && v.elem.alap_id === 'el_sablon001' && v.elem.szulo_id === 'el_vilag001', 'kampányelem sablonra építve, világelem alatt');
ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, annaT).verzio === kVerzio, 'az előkészítés nem növeli a kampány verzióját');
ellenoriz(hivas('element.save', { id: 'el_rossz001', uj: true, tipus: 'csoport', kampany_id: kampany.id, szulo_id: 'el_vilag001', adat: {} }, dm2).hiba === 'hibas_adat', 'csoport nem kerülhet helyszín alá');
ellenoriz(hivas('element.save', { id: 'el_vallas01', uj: true, tipus: 'istenseg', kampany_id: kampany.id, nev: 'Mahre hite', adat: { fajta: 'vallas' } }, dm2).ok &&
  hivas('element.save', { id: 'el_isten001', uj: true, tipus: 'istenseg', kampany_id: kampany.id, szulo_id: 'el_vallas01', nev: 'Mahre', adat: { fajta: 'isten' } }, dm2).ok, 'isten a vallás alatt (5.8)');
ellenoriz(hivas('element.save', { id: 'el_rossz003', uj: true, tipus: 'istenseg', kampany_id: kampany.id, szulo_id: 'el_kamp0001', adat: {} }, dm2).hiba === 'hibas_adat', 'isteni elem nem kerülhet helyszín alá');
ellenoriz(hivas('element.save', { id: 'el_rossz002', uj: true, tipus: 'helyszin', vilag_id: 'w_alfold01', szulo_id: 'el_kamp0001', adat: {} }, dm2).hiba === 'hibas_adat', 'világelem nem kerülhet kampányelem alá');
ellenoriz(hivas('element.save', { id: 'el_rossz003', uj: true, tipus: 'csoport', vilag_id: 'w_alfold01', alap_id: 'el_sablon001', adat: {} }, dm2).hiba === 'hibas_adat', 'az alap csak azonos típusú lehet');
ellenoriz(hivas('element.save', { id: 'el_rossz004', uj: true, tipus: 'keret', kampany_id: kampany.id, adat: {} }, dm2).hiba === 'hibas_adat', 'kampánykeret elem csak sablon lehet');
ellenoriz(hivas('element.save', { id: 'el_vilag001', verzio: 1, szulo_id: 'el_vilag001' }, dm2).hiba === 'hibas_adat', 'elem nem lehet a saját szülője');
ellenoriz(hivas('element.save', { id: 'el_rossz005', uj: true, tipus: 'helyszin', vilag_id: 'w_nincs0001', adat: {} }, dm2).hiba === 'hibas_adat', 'nem létező világ');
v = hivas('element.save', { id: 'el_kamp0001', verzio: 1, adat: { nev: 'A Vén Csuka', titkok: 'Kettős kém' } }, dm2);
ellenoriz(v.ok && v.verzio === 2, 'elem mentése, a verzió nő');
v = hivas('element.save', { id: 'el_kamp0001', verzio: 1, adat: {} }, dm2);
ellenoriz(v.hiba === 'utkozes' && v.aktualis.verzio === 2 && v.aktualis.adat.titkok === 'Kettős kém', 'elem verzióütközése, az aktuális visszajön');
ellenoriz(hivas('element.save', { id: 'el_kamp0001', verzio: 2, adat: { x: 'y'.repeat(50000) } }, dm2).hiba === 'tul_nagy', 'túl nagy elem');
v = hivas('link.save', { id: 'ln_kapcs0001', uj: true, honnan: 'el_kamp0001', hova: 'el_vilag001', tipus: 'resze', kampany_id: kampany.id }, dm2);
ellenoriz(v.ok && v.kapcsolat.tipus === 'resze', 'kapcsolat létrehozása');
ellenoriz(hivas('link.save', { id: 'ln_kapcs0002', uj: true, honnan: 'a', hova: 'a', tipus: 'resze' }, dm2).hiba === 'hibas_adat', 'önmagára mutató kapcsolat');
ellenoriz(hivas('link.save', { id: 'ln_kapcs0002', uj: true, honnan: 'a', hova: 'b', tipus: 'barmi' }, dm2).hiba === 'hibas_adat', 'ismeretlen kapcsolattípus');
hivas('link.save', { id: 'ln_kapcs0003', uj: true, honnan: 'el_vilag001', hova: 'el_sablon001', tipus: 'egyeb', vilag_id: 'w_alfold01' }, dm2);
v = hivas('prep.get', { kampany_id: kampany.id }, dm2);
ellenoriz(v.ok && v.elemek.length === 5 && v.kapcsolatok.length === 1 && v.keret && v.keret.verzio === 0, 'kampány előkészítése: a sablonok és a kampány elemei, a kampány kapcsolatai');
ellenoriz(v.vilag_id === '' && v.elemek.some(e => e.id === 'el_vilag001'), 'világ nélküli keretnél is jön a világelem, amelyre a kampány eleme hivatkozik');
v = hivas('campaign.frame.save', { id: kampany.id, verzio: 0, keret: { tema: 'Nyomozás', vilag_id: 'w_alfold01', veg: { tet: 'titok' } } }, dm2);
ellenoriz(v.ok && v.verzio === 1 && !v.kampany, 'kampánykeret mentése, a DM titkai nem érintik a játékosokat');
ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, annaT).verzio === kVerzio, 'a keret DM-részének mentése nem növeli a kampány verzióját');
ellenoriz(hivas('campaign.frame.save', { id: kampany.id, verzio: 0, keret: {} }, dm2).hiba === 'utkozes', 'keret verzióütközése');
ellenoriz(hivas('campaign.frame.save', { id: kampany.id, verzio: 1, keret: { vilag_id: 'w_nincs0001' } }, dm2).hiba === 'hibas_adat', 'a keret világa létezzen');
ellenoriz(hivas('campaign.frame.save', { id: kampany.id, keret: {} }, annaT).hiba === 'nincs_jogosultsag', 'a keretet csak a DM mentheti');
v = hivas('campaign.frame.save', { id: kampany.id, verzio: 1, keret: { tema: 'Nyomozás', vilag_id: 'w_alfold01', veg: { tet: 'titok' },
  kalandra_hivas: { jatekosoknak: 'Városi nyomozók lesztek.' }, ajanlasok: { fajok: { ajanlott: ['faj_elf'], kizart: [] } }, szintsav: { kezdo: 1, zaro: 10 } } }, dm2);
ellenoriz(v.ok && v.verzio === 2 && v.kampany && v.kampany.keret_jatekosoknak.bemutatas === 'Városi nyomozók lesztek.', 'a játékosoknak szóló rész változása visszajön');
ellenoriz(hivas('state.poll', { kampany_id: kampany.id }, annaT).verzio > kVerzio, 'a játékosoknak szóló rész változása növeli a kampány verzióját');
const jk = hivas('campaigns.list', {}, annaT).kampanyok.find(c => c.id === kampany.id).keret_jatekosoknak;
ellenoriz(jk && jk.ajanlasok.fajok.ajanlott[0] === 'faj_elf' && jk.szintsav.zaro === 10 && !('tema' in jk) && !('veg' in jk), 'a játékos a bemutatást és az ajánlásokat látja, a DM titkait nem');
ellenoriz(!JSON.stringify(hivas('state.get', { kampany_id: kampany.id }, annaT)).includes('Vén Csuka'), 'az előkészítő elemek nem kerülnek a játékos állapotába');
v = hivas('prep.get', { kampany_id: kampany.id }, dm2);
ellenoriz(v.vilag_id === 'w_alfold01' && v.kapcsolatok.length === 2 && v.keret.keret.tema === 'Nyomozás' && v.keret.verzio === 2 && !('_verzio' in v.keret.keret), 'a keret világa szerint jönnek a világ elemei, a keret a verziójával');
v = hivas('element.detach', { id: 'el_kamp0001', verzio: 2 }, dm2);
ellenoriz(v.ok && v.elem.alap_id === '' && v.elem.adat.leiras === 'Füstös ivó.' && v.elem.adat.titkok === 'Kettős kém' && v.verzio === 3, 'leválasztás: az örökölt mezők bemásolódnak');
v = hivas('element.promote', { id: 'el_kamp0001', verzio: 3, vilag_id: 'w_alfold01' }, dm2);
ellenoriz(v.ok && v.elem.vilag_id === 'w_alfold01' && v.elem.kampany_id === '' && v.elem.szulo_id === 'el_vilag001', 'világelemmé emelés (a világelem szülő marad)');
ellenoriz(hivas('element.promote', { id: 'el_kamp0001', vilag_id: 'w_alfold01' }, dm2).hiba === 'hibas_adat', 'világelem nem emelhető újra');
ellenoriz(hivas('element.delete', { id: 'el_vilag001' }, dm2).hiba === 'hibas_adat', 'aktív elem nem törölhető');
hivas('element.archive', { id: 'el_vilag001', aktiv: false }, dm2);
ellenoriz(/gyerekei/.test(hivas('element.delete', { id: 'el_vilag001' }, dm2).uzenet), 'gyerekes elem nem törölhető');
hivas('element.save', { id: 'el_kamp0002', uj: true, tipus: 'helyszin', kampany_id: kampany.id, alap_id: 'el_sablon001', adat: {} }, dm2);
hivas('element.archive', { id: 'el_sablon001', aktiv: false }, dm2);
ellenoriz(/alapjuk/.test(hivas('element.delete', { id: 'el_sablon001' }, dm2).uzenet), 'alapként használt elem nem törölhető');
hivas('element.archive', { id: 'el_kamp0001', aktiv: false }, dm2);
v = hivas('element.delete', { id: 'el_kamp0001' }, dm2);
ellenoriz(v.ok && v.kapcsolatok.includes('ln_kapcs0001'), 'archivált elem törlése a kapcsolataival');
ellenoriz(hivas('link.delete', { id: 'ln_kapcs0003' }, dm2).ok && hivas('link.delete', { id: 'ln_kapcs0003' }, dm2).ok, 'kapcsolat törlése (ismételten is)');
hivas('link.save', { id: 'ln_kapcs0004', uj: true, honnan: 'el_kamp0002', hova: 'el_vilag001', tipus: 'resze', kampany_id: kampany.id }, dm2);

// Az elemek képei (5.3)
ellenoriz(hivas('element.image.add', { kep: b64('TERKEP') }, annaT).hiba === 'nincs_jogosultsag', 'elemképet játékos nem tölthet fel');
v = hivas('element.image.add', { kep: b64('TERKEP'), belyeg: b64('TBELYEG') }, dm2);
const ekep = v.kep;
ellenoriz(v.ok && ekep.kep && ekep.belyeg && ekep.kep !== ekep.belyeg && mappaKeres(gyoker, tulajdonsagok.KAMPANYKEPMAPPA_ID).nev === 'Kampányképek'
  && fajlok[ekep.kep].szulo === tulajdonsagok.KAMPANYKEPMAPPA_ID, 'elemkép feltöltése a Kampányképek mappába', v);
ellenoriz(Object.keys(hivas('image.get', { idk: [ekep.kep] }, dm2).kepek).length === 0, 'elemhez nem kötött kép nem kérhető le');
hivas('element.save', { id: 'el_kamp0002', verzio: 1, adat: { kepek: [{ kep: ekep.kep, belyeg: ekep.belyeg, cim: 'Híd', terkep: true }] } }, dm2);
v = hivas('image.get', { idk: [ekep.kep, ekep.belyeg] }, dm2);
ellenoriz(Buffer.from(v.kepek[ekep.kep], 'base64').toString() === 'TERKEP' && v.kepek[ekep.belyeg], 'a DM lekéri az elem képét és bélyegét');
ellenoriz(Object.keys(hivas('image.get', { idk: [ekep.kep] }, annaT).kepek).length === 0, 'a játékos nem kéri le az elem képét');
v = hivas('element.image.trash', { kep: ekep }, dm2);
ellenoriz(v.ok && v.torolve.length === 0 && !fajlok[ekep.kep].kuka, 'használt elemkép nem kerül a kukába');
ellenoriz(hivas('element.image.trash', { kep: { kep: kep3.kep } }, dm2).torolve.length === 0, 'más mappa képe (karakterkép) nem törölhető így');
hivas('element.save', { id: 'el_kamp0002', verzio: 2, adat: {} }, dm2);
v = hivas('element.image.trash', { kep: ekep }, dm2);
ellenoriz(v.torolve.length === 2 && fajlok[ekep.kep].kuka && fajlok[ekep.belyeg].kuka, 'a már nem használt elemkép a kukába kerül');

// ---------- 5.5: NJK szintek és öröklés ----------
{
  const OR = require('vm').runInContext('NJK_OROKOLHETO', kornyezet);
  const vs = hivas('npc.save', { nev: 'Kalmár (sablon)', sablon: true, fajta: 'rovid', adat: { statblokk: { tulajdonsagok: { tul_communication: 2 } }, szerep: { koncepcio: 'Kalmár' }, szereplo: { szerepek: ['szemlelo'], cel: 'haszon' } } }, dm2);
  ellenoriz(vs.ok && vs.njk.adat.sablon === true && hivas('npc.list', {}, dm2).njkk.some((n) => n.id === vs.njk.id && n.sablon && n.szerepek[0] === 'szemlelo'), 'sablon NJK létrejön, a lista mutatja a szintet és a szerepet', vs);
  const sablon = vs.njk;
  ellenoriz(hivas('npc.save', { id: sablon.id, kampanyok: [kampany.id] }, dm2).hiba === 'hibas_adat', 'sablon nem rendelhető kampányhoz');
  ellenoriz(hivas('npc.save', { id: sablon.id, vilag_id: 'w_alfold01' }, dm2).hiba === 'hibas_adat', 'sablon nem kerül világba');
  const sablonMost = hivas('npc.get', { id: sablon.id }, dm2).njk;
  // világ-NJK a sablonra építve, saját névvel
  let w = hivas('npc.save', { nev: 'Bodor kalmár', fajta: 'rovid', vilag_id: 'w_alfold01', alap_id: sablon.id, adat: JSON.parse(JSON.stringify(sablonMost.adat)) }, dm2);
  ellenoriz(w.ok && w.njk.adat.felulirt.length === 1 && w.njk.adat.felulirt[0] === 'nev' && !w.njk.adat.sablon, 'a világ-NJK csak a nevét írja felül', w.njk && w.njk.adat.felulirt);
  const vilagNjk = w.njk;
  ellenoriz(hivas('npc.save', { nev: 'Rossz', vilag_id: 'w_nincs' }, dm2).hiba === 'nem_talalhato', 'nem létező világ');
  // szabad NJK a világ-NJK-ra, felülírt céllal
  const ad = JSON.parse(JSON.stringify(vilagNjk.adat)); ad.szereplo.cel = 'bosszú'; delete ad.felulirt;
  w = hivas('npc.save', { nev: 'Bodor kalmár', fajta: 'rovid', alap_id: vilagNjk.id, kampanyok: [kampany.id], adat: ad }, dm2);
  ellenoriz(w.ok && JSON.stringify(w.njk.adat.felulirt) === JSON.stringify(['adat.szereplo.cel']), 'a kampány-NJK a célt írja felül', w.njk && w.njk.adat.felulirt);
  const kampNjk = w.njk;
  // a sablon módosítása végiggyűrűzik a láncon, a felülírt mező marad
  const sa = JSON.parse(JSON.stringify(sablonMost.adat)); sa.szerep.koncepcio = 'Utazó kalmár'; sa.szereplo.cel = 'gazdagság';
  w = hivas('npc.save', { id: sablon.id, verzio: sablonMost.verzio, adat: sa }, dm2);
  const v1 = hivas('npc.get', { id: vilagNjk.id }, dm2).njk;
  const k1 = hivas('npc.get', { id: kampNjk.id }, dm2).njk;
  ellenoriz(w.ok && v1.adat.szerep.koncepcio === 'Utazó kalmár' && v1.adat.szereplo.cel === 'gazdagság' && v1.nev === 'Bodor kalmár' && v1.verzio === vilagNjk.verzio + 1,
    'a sablon változása a világ-NJK-ba is beíródik (a saját neve marad)', v1);
  ellenoriz(k1.adat.szerep.koncepcio === 'Utazó kalmár' && k1.adat.szereplo.cel === 'bosszú', 'a lánc végén is: az örökölt mező frissül, a felülírt marad', k1.adat);
  ellenoriz(w.kampany_verziok && Object.keys(w.kampany_verziok).includes(kampany.id), 'az érintett kampány verziója nő');
  // szintszabályok és kör
  ellenoriz(hivas('npc.save', { id: vilagNjk.id, alap_id: kampNjk.id }, dm2).hiba === 'hibas_adat', 'világ-NJK nem épülhet kampány-NJK-ra (és kör sem lehet)');
  ellenoriz(hivas('npc.save', { id: sablon.id, alap_id: vilagNjk.id }, dm2).hiba === 'hibas_adat', 'sablon csak sablonra épülhet');
  ellenoriz(hivas('npc.save', { id: kampNjk.id, vilag_id: 'w_alfold01' }, dm2).ok, 'kampány-NJK világ-NJK-vá emelhető, ha az alapja azonos világé');
  // játékos nézet: a tervezés nem látszik
  hivas('npc.save', { id: kampNjk.id, vilag_id: '' }, dm2);
  const kov = hivas('npc.save', { nev: 'Apród', fajta: 'koveto', kotodes: 'csapat', kampanyok: [kampany.id], adat: { szereplo: { cel: 'lovag lenni' }, szerep: {} } }, dm2).njk;
  const allas = hivas('state.get', { kampany_id: kampany.id }, annaT);
  const kovNezet = allas.ok && (allas.njkk || []).find((n) => n.id === kov.id);
  ellenoriz(!!kovNezet && !kovNezet.adat.szereplo && kovNezet.alap_id === undefined, 'a követő nézetében nincs szereplőterv és öröklési adat', kovNezet);
  // törlés és leválasztás
  hivas('npc.archive', { id: vilagNjk.id, aktiv: false }, dm2);
  ellenoriz(hivas('npc.delete', { id: vilagNjk.id }, dm2).hiba === 'hibas_adat', 'akire más épül, nem törölhető');
  const kmost = hivas('npc.get', { id: kampNjk.id }, dm2).njk;
  w = hivas('npc.detach', { id: kampNjk.id, verzio: kmost.verzio }, dm2);
  ellenoriz(w.ok && !w.njk.alap_id && !w.njk.adat.felulirt.length && w.njk.adat.szerep.koncepcio === 'Utazó kalmár', 'leválasztás: az adat megmarad, az alap megszűnik');
  ellenoriz(hivas('npc.delete', { id: vilagNjk.id }, dm2).ok, 'leválasztás után törölhető');
  ellenoriz(Array.isArray(OR) && OR.length > 30, 'a háttér örökölhető mezőlistája megvan');
}

ellenoriz(hivas('campaign.delete', { id: kampany.id }, dm2).hiba === 'hibas_adat', 'nem archivált kampány nem törölhető');
hivas('campaign.update', { id: kampany.id, allapot: 'archivált' }, dm2);
ellenoriz(hivas('campaigns.list', {}, annaT).kampanyok.length === 0, 'archivált kampányt a mesterjátékos nem látja');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).hiba === 'nincs_jogosultsag', 'archivált kampány állapota nem kérhető le játékosként');
ellenoriz(hivas('campaigns.list', {}, dm2).kampanyok.length === 1, 'a DM látja az archivált kampányt');
ellenoriz(hivas('campaign.delete', { id: kampany.id }, dm2).ok, 'archivált kampány törölhető');
ellenoriz(hivas('campaigns.list', {}, dm2).kampanyok.length === 0 && hivas('character.get', { id: pottom.id }, dm2).ok, 'a kampány törlődött, a karakter megmaradt');
ellenoriz(!jatek.getSheetByName('Összecsapások').adat.some(sor => sor.includes(marado.id)), 'a törölt kampány összecsapásai is törlődtek');
ellenoriz(!jatek.getSheetByName('Csaták').adat.some(sor => sor.includes(csata.id)), 'a törölt kampány csatái is törlődtek');
ellenoriz(!jatek.getSheetByName('Elemek').adat.some(sor => sor.includes('el_kamp0002')) && jatek.getSheetByName('Elemek').adat.some(sor => sor.includes('el_vilag001')), 'a törölt kampány elemei törlődtek, a világ elemei megmaradtak');
ellenoriz(!jatek.getSheetByName('Kapcsolatok').adat.some(sor => sor.includes('ln_kapcs0004')), 'a törölt kampány kapcsolatai is törlődtek');
ellenoriz(!jatek.getSheetByName('Jegyzetek').adat.some(sor => sor.includes(kampany.id)), 'a törölt kampány jegyzetei is törlődtek');

console.log(hibak ? `\n${hibak} HIBA` : '\nMinden teszt sikeres.');
process.exit(hibak ? 1 : 0);
