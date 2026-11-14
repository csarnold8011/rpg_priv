// A dobásnapló tiszta függvényeinek tesztje (web/js/jatek/naplo.js). Futtatás: node tools/teszt/naplo.mjs
import * as N from '../../web/js/jatek/naplo.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

const karakterek = [
  { id: 'c_dorn', nev: 'Dorn', kep: 'kep_dorn', jatekos_id: 'u_bence', irhato: true },
  { id: 'c_lysa', nev: 'Lysa', kep: '', jatekos_id: 'u_anna', irhato: false },
  { id: 'c_potty', nev: 'Pöttöm', kep: '', jatekos_id: '', irhato: false }
];
const probak = [{ id: 'p_1', cim: 'Észlelés a kapunál' }];
const bence = { felhasznalo: { id: 'u_bence', nev: 'Bence' }, szerep: 'jatekos', karakterek, probak, reszletekLathatok: true };
const dm = { ...bence, felhasznalo: { id: 'u_arnold', nev: 'Arnold' }, szerep: 'dm' };

const d1 = { id: 'd1', karakter_id: 'c_dorn', dobta: 'Bence', mire: 'Szívósság (Ivás)', kockak: [4, 4, 5], modosito: 5, celertek: 13,
  eredmeny: 'siker', mutatvanypont: 5, tipus: 'alap', tulajdonsag: 'tul_constitution', fokusz: 'fok_constitution_drinking', kezi: false,
  reszletek: { osszetevok: [{ ertek: 3, eredet: 'Szívósság' }, { ertek: 2, eredet: 'Ivás' }, { ertek: 0, eredet: 'Semmi' }], fok: 'kiemelkedő siker' } };
const d2 = { id: 'd2', karakter_id: 'c_lysa', dobta: 'Anna', mire: 'Pontosság (Arkánlövés)', kockak: [2, 5, 6], modosito: 4, celertek: '',
  eredmeny: '', mutatvanypont: 0, kezi: 'true', proba_id: 'p_1', reszletek: JSON.stringify({ osszetevok: [{ ertek: 4, eredet: 'Pontosság' }], ujradobas: 'd0' }) };
const d3 = { id: 'd3', karakter_id: '', dobta: 'Arnold', mire: 'Csapda', kockak: [1, 2, 6], modosito: 0, rejtett: true, reszletek: '' };
const d4 = { id: 'd4', karakter_id: 'c_potty', dobta: 'Arnold', mire: 'Lopakodás', kockak: [3, 3, 3], modosito: 2, eredmeny: 'siker', mutatvanypont: 3,
  felfedve: true, reszletek: { mutatvanyok: [{ id: 'm1', nev: 'Hatalmas csapás', mp: 1, db: 1 }, { id: 'm2', nev: 'Helyezkedés', mp: 2, db: 2 }], mp_plusz: [{ ertek: 1, eredet: 'Gengszter (Haladó)' }] } };
const dobasok = [d1, d2, d3, d4];

// ---------- Részletek ----------
ellenoriz(N.reszletekBol(d2).ujradobas === 'd0', 'JSON szövegként érkező részletek');
ellenoriz(Object.keys(N.reszletekBol(d3)).length === 0, 'üres részletek: üres objektum');
ellenoriz(N.dobasOsszege(d1) === 18, 'összeg: 13 + 5');

// ---------- Saját dobás ----------
ellenoriz(N.sajatDobasE(d1, bence), 'Bence dobása a sajátja');
ellenoriz(!N.sajatDobasE(d2, bence), 'Anna dobása nem Bencéé');
ellenoriz(N.sajatDobasE(d3, dm) && N.sajatDobasE(d4, dm), 'a DM dobásai a DM sajátjai');
ellenoriz(N.sajatDobasE({ karakter_id: 'c_dorn', dobta: 'Arnold' }, bence), 'a DM dobta Dorn helyett: Bence karakteréé, tehát Bencéé');

// ---------- Sor ----------
let s = N.naploSor(d1, bence);
ellenoriz(s.nev === 'Dorn' && s.kep === 'kep_dorn' && s.osszeg === 18 && s.eredmeny === 'siker', 'sor: név, bélyeg, összeg, eredmény', s);
ellenoriz(s.reszletek.osszetevok.length === 2, 'a nulla összetevő kimarad', s.reszletek.osszetevok);
ellenoriz(s.reszletek.celertek === 13 && s.reszletek.celertekNev === 'Kihívó', 'Célérték névvel', s.reszletek);
ellenoriz(s.reszletek.fok === 'kiemelkedő siker' && s.reszletek.tulajdonsag === 'Szívósság', 'siker foka és tulajdonság');
ellenoriz(s.mutatvanyRogzitheto, 'saját, Mutatványpontos, rögzítetlen: utólag rögzíthető');
ellenoriz(N.vanReszlet(s), 'van lenyitható részlet');
ellenoriz(!s.rejtett && !s.felfedheto, 'nem rejtett');

s = N.naploSor(d2, bence);
ellenoriz(s.kezi && s.ujradobas, 'beírt és újradobás jel', s);
ellenoriz(s.reszletek.probaCim === 'Észlelés a kapunál', 'próbakérés címe', s.reszletek);
ellenoriz(s.reszletek.celertek === null && s.reszletek.celertekRejtett, 'próbakérés rejtett Célértékkel: „a DM tudja”');
ellenoriz(!s.mutatvanyRogzitheto, 'más dobása és Mutatványpont nélkül: nem rögzíthető');
ellenoriz(N.naploSor(d2, dm).reszletek.celertekRejtett === false, 'a DM-nél nincs „rejtett Célérték” jel');

s = N.naploSor(d3, dm);
ellenoriz(s.rejtett && s.felfedheto && s.nev === 'Arnold', 'DM: rejtett, felfedhető, karakter nélkül a dobó neve');
ellenoriz(!N.naploSor({ ...d3, _fuggo: true }, dm).felfedheto, 'küldés alatt nem fedhető fel');
ellenoriz(!N.naploSor(d3, { ...bence }).rejtett, 'játékosnál nincs „Rejtett” jel');

s = N.naploSor(d4, dm);
ellenoriz(s.felfedve, 'felfedett dobás');
ellenoriz(s.mutatvanyok === 'Hatalmas csapás (1), Helyezkedés × 2 (2)', 'elköltött mutatványok szövege', s.mutatvanyok);
ellenoriz(s.reszletek.plusz.length === 1 && s.reszletek.plusz[0].eredet === 'Gengszter (Haladó)', 'plusz pontok forrása');
ellenoriz(!s.mutatvanyRogzitheto, 'már rögzített mutatványnál nincs újabb rögzítés');
s = N.naploSor({ ...d4, reszletek: { mutatvanyok: [] } }, dm);
ellenoriz(s.mutatvanyok === 'nem költött pontot' && !s.mutatvanyRogzitheto, 'üres rögzítés: nem költött pontot');
ellenoriz(N.naploSor(d4, bence).mutatvanyRogzitheto === false, 'Bence nem rögzíthet Pöttöm dobására');
ellenoriz(N.naploSor({ ...d4, reszletek: {} }, dm).mutatvanyRogzitheto, 'a DM rögzíthet a saját NJK-dobására');

// ---------- Részletek elrejtése (dobas_reszletek_lathatok: false) ----------
const rejt = { ...bence, reszletekLathatok: false };
s = N.naploSor(d4, rejt);
ellenoriz(s.korlatozott && s.osszeg === 11 && s.eredmeny === 'siker', 'mások dobásánál csak összeg és eredmény', s);
ellenoriz(!s.kockak.length && !s.mutatvanypont && !s.mutatvanyok && s.reszletek === null && !N.vanReszlet(s), 'kockák, pontok, részletek nélkül');
ellenoriz(!N.naploSor(d1, rejt).korlatozott, 'a saját dobás teljes');
ellenoriz(!N.naploSor(d4, { ...rejt, szerep: 'mester' }).korlatozott, 'a mesterjátékos mindent lát');
ellenoriz(!N.naploSor(d4, { ...rejt, szerep: 'dm' }).korlatozott, 'a DM mindent lát');

// ---------- Szűrés ----------
ellenoriz(N.naploSzur(dobasok, 'mindenki', bence).length === 4, 'mindenki');
ellenoriz(N.naploSzur(dobasok, 'sajat', bence).map((d) => d.id).join() === 'd1', 'csak az enyém (Bence)');
ellenoriz(N.naploSzur(dobasok, 'sajat', dm).map((d) => d.id).join() === 'd3,d4', 'csak az enyém (DM)');
ellenoriz(N.naploSzur(dobasok, 'k:c_lysa', bence).map((d) => d.id).join() === 'd2', 'egy karakter');
ellenoriz(N.naploSzur(dobasok, 'p:p_1', bence).map((d) => d.id).join() === 'd2', 'egy próbakérés');
const op = N.szuroOpciok(dobasok, bence);
ellenoriz(op.map((o) => o.value).join() === 'mindenki,sajat,k:c_dorn,k:c_lysa,k:c_potty,p:p_1', 'szűrőcsipek: a csapat sorrendje, végül a próbakérés', op);
ellenoriz(op[op.length - 1].label === 'Próba: Észlelés a kapunál', 'a próbakérés csipje a címével');
ellenoriz(N.szuroOpciok([d2], bence).map((o) => o.value).join() === 'mindenki,k:c_lysa,p:p_1', 'saját dobás nélkül nincs „Csak az enyém”');
ellenoriz(N.szuroErvenyes('k:c_x', op) === 'mindenki' && N.szuroErvenyes('k:c_dorn', op) === 'k:c_dorn', 'érvénytelen szűrő: mindenki');

// ---------- Felülírások ----------
let fel = { d3: { rejtett: false, felfedve: true }, d1: { reszletek: { mutatvanyok: [{ id: 'm1', nev: 'X', mp: 5, db: 1 }] } } };
let ki = N.felulirasAlkalmaz(dobasok, fel);
ellenoriz(ki[2].felfedve === true && ki[2].rejtett === false, 'felfedés helyben');
ellenoriz(ki[0].reszletek.mutatvanyok.length === 1 && ki[0].reszletek.fok === 'kiemelkedő siker', 'mutatvány helyben, a többi részlet marad');
ellenoriz(N.felulirasAlkalmaz(dobasok, {}) === dobasok, 'üres felülírás: ugyanaz a lista');
ellenoriz(Object.keys(N.felulirasTisztit(dobasok, fel)).sort().join() === 'd1,d3', 'a szerver még nem adta vissza: marad');
ellenoriz(Object.keys(N.felulirasTisztit(ki, fel)).length === 0, 'a szerver visszaadta: törlődik');

// ---------- Mutatvány kontextus, lapozás ----------
ellenoriz(JSON.stringify(N.mutatvanyKontextus({ tipus: 'tamadas', tulajdonsag: 'tul_fighting', fokusz: '' })) === JSON.stringify({ tipus: 'tamadas', tul: 'tul_fighting' }), 'kontextus támadásnál');
ellenoriz(N.mutatvanyKontextus({ tipus: 'szabad' }).tipus === 'alap', 'ismeretlen típus: alap');
const l = N.lapozasFuz([{ id: 'a', idopont: '3' }, { id: 'b', idopont: '2' }], [{ id: 'b', idopont: '2' }, { id: 'c', idopont: '1' }]);
ellenoriz(l.map((x) => x.id).join() === 'a,b,c' && N.kovetkezoElotte(l) === '1', 'lapozás: összefésülés és a következő kezdőpont');
ellenoriz(N.kovetkezoElotte([]) === undefined, 'üres lista: nincs kezdőpont');

console.log(`\n${db - hibak}/${db} rendben${hibak ? `, ${hibak} hiba` : ''}.`);
process.exit(hibak ? 1 : 0);
