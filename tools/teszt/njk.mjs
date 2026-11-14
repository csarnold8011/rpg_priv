// Az NJK-tár tiszta függvényeinek tesztje (web/js/jatek/njk.js). Futtatás: node tools/teszt/njk.mjs
// A minta lények és képességek kitaláltak, csak számok és azonosítók (szabálykönyvszöveg nem kerülhet a repóba).
import * as N from '../../web/js/jatek/njk.js';
import * as LN from '../../web/js/jatek/leny.js';
import { LAPOK as ALAP } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

const farkas = {
  tulajdonsagok: { tul_accuracy: 2, tul_communication: -2, tul_constitution: 1, tul_dexterity: 2, tul_fighting: 1, tul_intelligence: -2, tul_perception: 2, tul_strength: 1, tul_willpower: 1 },
  fokuszok: ['fok_accuracy_bite', 'fok_strength_might'], sebesseg: 16, egeszseg: 15, vedekezes: 12, pancelertek: 0,
  tamadasok: [{ nev_hu: 'Harapás', nev_en: 'Bite', bonusz: 4, sebzes: '1d6+1', tul: 'tul_accuracy', fokusz: 'fok_accuracy_bite' }],
  valtozatok: [{ nev_hu: 'Télifarkas' }], csoport: 'állat'
};
const KEP = [
  { id: 'kep_mighty', nev_hu: 'Erős', nev_en: 'Mighty', reszletek: { modositok: [{ cel: 'tul_strength', ertek: 2 }], fokusz_javitas: 'fok_strength_might' } },
  { id: 'kep_armored', nev_hu: 'Páncélos', nev_en: 'Armored', reszletek: { modositok: [{ cel: 'pancelertek', ertek: 2 }] } },
  { id: 'kep_winged', nev_hu: 'Szárnyas', nev_en: 'Winged', reszletek: { mozgas: 'repülés' } },
  { id: 'kep_clawed', nev_hu: 'Karmos', nev_en: 'Clawed', reszletek: { tamadas: { nev_hu: 'Karom', nev_en: 'Claws', tul: 'tul_fighting', fokusz: 'fok_fighting_claws', sebzes: '1d6+3' } } },
  { id: 'kep_big', nev_hu: 'Nagy', nev_en: 'Big', reszletek: { mutatvany_ar_modositok: [{ mutatvanyok: ['mut_knock_prone'], mod: 1, kinek: 'ellene' }] } },
  { id: 'kep_regen', nev_hu: 'Regenerálódás', nev_en: 'Regenerate', reszletek: { sajat_mutatvanyok: [{ kulcs: 'regeneralas', nev_hu: 'Regenerálódás', mp: 2, leiras: 'x' }] } },
  { id: 'kep_dark', nev_hu: 'Sötétlátás', nev_en: 'Darkvision', reszletek: { gepi: { sotetlatas: true } } },
  { id: 'kep_gep', nev_hu: 'Gépsablon', nev_en: 'Machine', reszletek: { modositok: [{ cel: 'egeszseg_max', ertek: 10 }], tovabbi: ['kep_armored'] } }
];
const LAPOK = {
  ...ALAP,
  'Fókuszok': [...ALAP['Fókuszok'], { id: 'fok_accuracy_bite', nev_hu: 'Harapás', tulajdonsag: 'tul_accuracy' }, { id: 'fok_strength_might', nev_hu: 'Erőkifejtés', tulajdonsag: 'tul_strength' }],
  'Szörnyek': [{ id: 'szo_farkas', nev_hu: 'Farkas', nev_en: 'Wolf', forras: 'Alapkönyv', fenyegetes: 'Csekély', leiras_hu: 'Falkában vadászik.', reszletek: JSON.stringify(farkas) }],
  'Különleges képességek': KEP
};
const sorral = (n, id = 'n_teszt') => ({ ...n, id });

// ---------- Üres NJK és fajták ----------
let n = N.uresNjk({ nev: 'Kocsmáros', fajta: 'rovid' });
ellenoriz(n.fajta === 'rovid' && n.adat.statblokk.nem_harcolo && n.adat.erosites.fok === 'nincs', 'rövid NJK: nem harcoló, erősítés nélkül');
n.adat.statblokk.tulajdonsagok.tul_constitution = 2;
n.adat.statblokk.tulajdonsagok.tul_dexterity = 1;
delete n.adat.statblokk.egeszseg; delete n.adat.statblokk.vedekezes;
let v = LN.lenyNezet({ tipus: 'njk', sor: sorral(n) }, LAPOK);
ellenoriz(v.egeszseg.ertek === 12 && v.vedekezes.ertek === 11 && v.nem_harcolo && v.fajta === 'rovid', 'rövid NJK nézete: Egészség 10 + Szívósság, Védekezés 10 + Ügyesség', [v.egeszseg, v.vedekezes]);

// ---------- Másolat a bestiáriumból ----------
n = N.njkSzornybol(LAPOK['Szörnyek'][0]);
ellenoriz(n.nev === 'Farkas' && n.alap_szorny === 'szo_farkas' && n.fenyegetes === 'Csekély' && !n.adat.statblokk.valtozatok, 'szörny másolata: név, forrás, fenyegetés, változatok nélkül');
ellenoriz(n.adat.szerep.nyilvanos === 'Falkában vadászik.', 'a rövid leírás a nyilvános leírásba kerül');
v = LN.lenyNezet({ tipus: 'njk', sor: sorral(n) }, LAPOK);
const sz = LN.lenyNezet({ tipus: 'szorny', sor: 'szo_farkas' }, LAPOK);
ellenoriz(v.egeszseg.ertek === sz.egeszseg.ertek && v.tamadasok[0].tamadas === sz.tamadasok[0].tamadas && v.csoport === 'állat', 'a másolat nézete azonos a szörnyével');
n.adat.statblokk.tulajdonsagok.tul_strength = 9;
ellenoriz(JSON.parse(LAPOK['Szörnyek'][0].reszletek).tulajdonsagok.tul_strength === 1, 'a másolat módosítása nem hat a szabályadatra');
const k = N.njkSzornybol(LAPOK['Szörnyek'][0], { nev: 'Bolhás', fajta: 'koveto' });
ellenoriz(k.fajta === 'koveto' && k.fenyegetes === '' && Array.isArray(k.adat.szerep.feladatok) && /Állatidomítás/.test(k.adat.szerep.koncepcio), 'társállat a bestiáriumból (Állatidomítás haladó fokon képzett)');

// ---------- Erősítés és fejlesztés ----------
n = N.njkSzornybol(LAPOK['Szörnyek'][0]);
n.adat.erosites = N.erositesFeljebb(n.adat.erosites);
n.adat.erosites.tulajdonsagok = { tul_strength: 1, tul_fighting: 1 };
ellenoriz(n.adat.erosites.fok === 'elit' && LN.erositesAllas(n.adat.erosites).maradek.tul[0].db === 1, 'Fejlesztés: elit, a maradék egy +1');
n.adat.erosites = N.erositesFeljebb(n.adat.erosites);
ellenoriz(n.adat.erosites.fok === 'hosi' && n.adat.erosites.tulajdonsagok.tul_strength === 1, 'még egy fok: hősi, a korábbi kiosztás megmarad');
v = LN.lenyNezet({ tipus: 'njk', sor: sorral(n) }, LAPOK);
ellenoriz(v.egeszseg.ertek === 30 && v.erosites.fok === 'hosi', 'hősi erősítés: +15 Egészség', v.egeszseg);
ellenoriz(N.erositesFeljebb(N.erositesFeljebb({ fok: 'epikus' })).fok === 'epikus', 'az epikusnál nincs feljebb');

// ---------- Fenyegetési sablon ----------
n = N.njkSablonbol('Mérsékelt', 'Zsoldoskapitány');
ellenoriz(n.fenyegetes === 'Mérsékelt' && n.adat.statblokk.egeszseg === 50, 'sablon: Mérsékelt, alap Egészség 50');
n.adat.statblokk.tulajdonsagok = { ...n.adat.statblokk.tulajdonsagok, tul_fighting: 4, tul_constitution: 3, tul_strength: 3, tul_willpower: 2 };
let s = N.sablonAllas(n.adat.statblokk, 'Mérsékelt');
ellenoriz(s.pontok === 12 && s.maradek === 3 && s.egeszseg_ajanlott === 65 && s.mp_ajanlott === 40, 'sablon állása: pontok, maradék, ajánlott Egészség és Mágiapont', s);
ellenoriz(s.figyelmeztetesek.some((f) => /Egészség/.test(f)), 'eltérő Egészségnél figyelmeztet');
n.adat.statblokk.egeszseg = 67;
n.adat.statblokk.tulajdonsagok.tul_fighting = 8;
s = N.sablonAllas(n.adat.statblokk, 'Mérsékelt');
ellenoriz(!s.figyelmeztetesek.some((f) => /Egészség/.test(f)) && s.figyelmeztetesek.some((f) => /legnagyobb/.test(f)) && s.figyelmeztetesek.some((f) => /összege/.test(f)),
  '±5 Egészség belefér; túl nagy érték és túl sok pont figyelmeztet', s.figyelmeztetesek);
n.adat.statblokk.fokusz_bonusz = { fok_strength_might: 3 };
ellenoriz(N.sablonAllas(n.adat.statblokk, 'Csekély').figyelmeztetesek.some((f) => /\+3/.test(f)), '+3-as fókusz Csekély szinten figyelmeztet');
ellenoriz(N.sablonAllas({}, 'Ismeretlen') === null, 'ismeretlen fenyegetésnél nincs sablon');

// ---------- Követő ----------
ellenoriz(N.kovetoEgeszseg(31) === 15, 'követő Egészsége: a gazda fele (lefelé kerekítve)');
ellenoriz(N.csapatKovetoEgeszseg([62, 40, 32, 55]) === 20, 'csapat követője: a második legkisebb Egészség fele');
ellenoriz(N.csapatKovetoEgeszseg([30]) === 15 && N.csapatKovetoEgeszseg([]) === null, 'egy karakternél annak fele, üres csapatnál nincs érték');
n = N.njkKovetoSablon('Harmon', { egeszseg: 31 });
ellenoriz(n.fajta === 'koveto' && n.adat.statblokk.egeszseg === 31 && Array.isArray(n.adat.szerep.feladatok), 'követő sablon');
n.adat.statblokk.tulajdonsagok = { tul_fighting: 2, tul_perception: 2, tul_willpower: 2, tul_strength: 1, tul_communication: 1 };
n.adat.statblokk.fokuszok = ['a', 'b', 'c'];
s = N.kovetoAllas(n.adat.statblokk);
ellenoriz(s.ketesek === 3 && s.egyesek === 2 && !s.figyelmeztetesek.length, 'szokásos követő: nincs figyelmeztetés', s);
n.adat.statblokk.tulajdonsagok.tul_strength = 4;
ellenoriz(N.kovetoAllas(n.adat.statblokk).figyelmeztetesek.length === 1, '2-nél nagyobb tulajdonság figyelmeztet');

// ---------- Különleges képességek ----------
let a = N.njkSzornybol(LAPOK['Szörnyek'][0]).adat;
const alapNezet = LN.lenyNezet({ tipus: 'njk', sor: sorral({ nev: 'x', adat: a }) }, LAPOK);
a = N.kepessegHozzaadas(a, KEP[0], LAPOK);
v = LN.lenyNezet({ tipus: 'njk', sor: sorral({ nev: 'x', adat: a }) }, LAPOK);
ellenoriz(v.tulajdonsagok.tul_strength.ertek === 3 && v.fokuszok.fok_strength_might.bonusz === 3, 'Erős: +2 Erő, a meglévő Erőkifejtés fókusz +3 lesz', v.fokuszok.fok_strength_might);
ellenoriz(v.tamadasok[0].tamadas === alapNezet.tamadasok[0].tamadas, 'az Erő nem változtat a Pontosság alapú támadáson');
ellenoriz(N.kepessegHozzaadas(a, KEP[0], LAPOK).kezi.length === a.kezi.length, 'ugyanaz a képesség kétszer nem kerül fel');
a = N.kepessegHozzaadas(a, KEP[2], LAPOK);
a = N.kepessegHozzaadas(a, KEP[3], LAPOK);
a = N.kepessegHozzaadas(a, KEP[4], LAPOK);
a = N.kepessegHozzaadas(a, KEP[5], LAPOK);
a = N.kepessegHozzaadas(a, KEP[6], LAPOK);
v = LN.lenyNezet({ tipus: 'njk', sor: sorral({ nev: 'x', adat: a }) }, LAPOK);
const karom = v.tamadasok.find((t) => t.nev_hu === 'Karom');
ellenoriz(v.sebesseg.mozgas.some((m) => m.tipus === 'repülés' && m.ertek === 16), 'Szárnyas: repülés a Sebességgel');
ellenoriz(karom && karom.tamadas === 1, 'Karmos: új támadás, a bónusz a Harcból számolva (fókusz nélkül)', karom);
ellenoriz(LN.mutatvanyArModositas(v, 'mut_knock_prone', 'ellene').mod === 1 && v.sajat_mutatvanyok.some((m) => m.kulcs === 'regeneralas') && v.sotetlatas,
  'Nagy, Regenerálódás, Sötétlátás: ár-módosító, saját mutatvány, gépi kulcs');
ellenoriz(v.kepessegek.length === 6 && N.vanKepesseg(a, 'kep_winged'), 'a képességlista bővült');
a = N.kepessegEltavolitas(a, 'kep_mighty');
a = N.kepessegEltavolitas(a, 'kep_clawed');
a = N.kepessegEltavolitas(a, 'kep_big');
a = N.kepessegEltavolitas(a, 'kep_winged');
v = LN.lenyNezet({ tipus: 'njk', sor: sorral({ nev: 'x', adat: a }) }, LAPOK);
ellenoriz(v.tulajdonsagok.tul_strength.ertek === 1 && v.fokuszok.fok_strength_might.bonusz === 2 && v.fokuszok.fok_strength_might,
  'eltávolítás: az Erő és a fókusz visszaáll (a fókusz megmarad, mert a lényé volt)');
ellenoriz(!v.tamadasok.some((t) => t.nev_hu === 'Karom') && !v.sebesseg.mozgas.length && LN.mutatvanyArModositas(v, 'mut_knock_prone', 'ellene').mod === 0, 'eltávolítás: támadás, mozgás, ár-módosító eltűnik');
let b = N.kepessegHozzaadas(N.uresNjk().adat, KEP[0], LAPOK);
ellenoriz(b.statblokk.fokuszok.includes('fok_strength_might') && !b.statblokk.fokusz_bonusz.fok_strength_might, 'Erős fókusz nélküli lénynél: új Erőkifejtés fókusz (+2)');
b = N.kepessegEltavolitas(b, 'kep_mighty');
ellenoriz(!b.statblokk.fokuszok.includes('fok_strength_might'), 'eltávolításkor a képességgel kapott fókusz is megy');
b = N.kepessegHozzaadas(N.uresNjk().adat, KEP[7], LAPOK);
v = LN.lenyNezet({ tipus: 'njk', sor: sorral({ nev: 'x', adat: b }) }, LAPOK);
ellenoriz(v.egeszseg.ertek === 20 && v.pancelertek.ertek === 2 && v.kepessegek.length === 2, 'sablon képesség: a további képességek is felkerülnek', [v.egeszseg.ertek, v.pancelertek.ertek]);

// ---------- Másolat, szűrés, szereplés ----------
n = N.njkSzornybol(LAPOK['Szörnyek'][0]);
n.adat.szerep.kep = { kep: 'x', belyeg: 'y' };
n.adat.szereplesek = [{ kampany: 'c1' }];
const m = N.njkMasolat(n, 'Falkavezér');
ellenoriz(m.nev === 'Falkavezér' && m.adat.szerep.kep === null && !m.adat.szereplesek.length && !m.id && n.adat.szerep.kep.kep === 'x', 'NJK másolata: új név, kép és szereplések nélkül, az eredeti változatlan');
const lista = [{ nev: 'Béla', fajta: 'rovid', kampanyok: ['c1'] }, { nev: 'Ádám', fajta: 'koveto', kampanyok: [] }, { nev: 'Cili', fajta: 'statblokk', kampanyok: ['c2'], aktiv: false }];
ellenoriz(N.njkSzures(lista).map((x) => x.nev).join() === 'Ádám,Béla', 'szűrés: az archivált kimarad, ábécérend');
ellenoriz(N.njkSzures(lista, { kampany: '_nincs' }).length === 1 && N.njkSzures(lista, { fajta: 'rovid' })[0].nev === 'Béla' && N.njkSzures(lista, { archivalt: true, kampany: 'c2' }).length === 1, 'szűrés kampány és fajta szerint');
const sz2 = N.szereplesBejegyzes({}, { kampany_id: 'c1', csata: 'Rajtaütés' }, 2);
ellenoriz(N.szereplesBejegyzes(N.szereplesBejegyzes(sz2, {}, 2), { utolso: true }, 2).szereplesek.length === 2, 'a szereplések listája korlátos');
ellenoriz(N.kotodesSzoveg({ fajta: 'koveto', kotodes: 'csapat' }) === 'a csapat követője' && N.kotodesSzoveg({ fajta: 'koveto', kotodes: 'k1' }, () => 'Dorn') === 'Dorn követője', 'kötődés szövege');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
