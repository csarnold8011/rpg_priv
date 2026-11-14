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

ellenoriz(hivas('campaign.delete', { id: kampany.id }, dm2).hiba === 'hibas_adat', 'nem archivált kampány nem törölhető');
hivas('campaign.update', { id: kampany.id, allapot: 'archivált' }, dm2);
ellenoriz(hivas('campaigns.list', {}, annaT).kampanyok.length === 0, 'archivált kampányt a mesterjátékos nem látja');
ellenoriz(hivas('state.get', { kampany_id: kampany.id }, annaT).hiba === 'nincs_jogosultsag', 'archivált kampány állapota nem kérhető le játékosként');
ellenoriz(hivas('campaigns.list', {}, dm2).kampanyok.length === 1, 'a DM látja az archivált kampányt');
ellenoriz(hivas('campaign.delete', { id: kampany.id }, dm2).ok, 'archivált kampány törölhető');
ellenoriz(hivas('campaigns.list', {}, dm2).kampanyok.length === 0 && hivas('character.get', { id: pottom.id }, dm2).ok, 'a kampány törlődött, a karakter megmaradt');

console.log(hibak ? `\n${hibak} HIBA` : '\nMinden teszt sikeres.');
process.exit(hibak ? 1 : 0);
