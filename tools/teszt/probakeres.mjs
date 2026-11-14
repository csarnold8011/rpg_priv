// A DM próbakérés tiszta függvényeinek tesztje (web/js/jatek/probakeres.js). Futtatás: node tools/teszt/probakeres.mjs
import * as R from '../../web/js/jatek/probakeres.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}
const NEVEK = { fok_perception_searching: 'Keresés', fok_perception_seeing: 'Látás', fok_strength_might: 'Erőkifejtés' };
const fn = (id) => NEVEK[id] || id;
const karakterek = [
  { id: 'c_dorn', nev: 'Dorn', kep: 'k1', irhato: true, kampany_allapot: 'aktív' },
  { id: 'c_lysa', nev: 'Lysa', kep: '', irhato: false, kampany_allapot: 'aktív' },
  { id: 'c_potty', nev: 'Pöttöm', kep: '', irhato: true, kampany_allapot: 'aktív' },
  { id: 'c_halott', nev: 'Grim', kep: '', irhato: false, kampany_allapot: 'meghalt' }
];

// ---------- Űrlap ----------
let u = R.ujUrlap({ celertek_rejtett: true });
ellenoriz(u.celertek_rejtett && u.celertek === 11 && u.cimzettek === 'mindenki' && u.mutatvany_engedett, 'alapértékek (rejtett Célérték a kampányból)');
ellenoriz(R.ujUrlap({ celertek_rejtett: false }).celertek_rejtett === false, 'a kampány beállítása: látható Célérték');
ellenoriz(R.urlapHibak(u, karakterek).join() === 'Válassz tulajdonságot.', 'tulajdonság nélkül hiba');
u = { ...u, tulajdonsag: 'tul_perception', fokuszok: ['fok_perception_searching', 'fok_perception_seeing'] };
ellenoriz(R.urlapHibak(u, karakterek).length === 0, 'kitöltve küldhető');
ellenoriz(R.urlapHibak({ ...u, celertek: '' }, karakterek).join() === 'Adj meg Célértéket.', 'alap próbához Célérték kell');
ellenoriz(R.urlapHibak({ ...u, tipus: 'ellen', celertek: '' }, karakterek).length === 0, 'ellenpróbához nem kell Célérték');
ellenoriz(R.urlapHibak({ ...u, tipus: 'osszetett', kuszob: '' }, karakterek).join() === 'Adj meg Sikerküszöböt.', 'összetetthez Sikerküszöb kell');
ellenoriz(R.urlapHibak({ ...u, fokuszok: [], fokusz_kotelezo: true }, karakterek).length === 1, 'kötelező fókusz fókusz nélkül: hiba');
ellenoriz(R.urlapHibak({ ...u, cimzettek: [] }, karakterek).join() === 'Válassz legalább egy karaktert.', 'üres címzettlista: hiba');
ellenoriz(R.urlapHibak(u, []).join() === 'Nincs karakter a kampányban.', 'karakter nélküli kampány');

ellenoriz(R.probaCim('tul_perception', ['fok_perception_searching', 'fok_perception_seeing'], fn) === 'Észlelés (Keresés vagy Látás)', 'automatikus cím');
let a = R.keresAdat({ ...u, modositok: { c_dorn: -2, c_lysa: 0 } }, 'k1', fn);
ellenoriz(a.cim === 'Észlelés (Keresés vagy Látás)' && a.celertek === 11 && a.celertek_rejtett && a.kampany_id === 'k1', 'kérés adata', a);
ellenoriz(JSON.stringify(a.modositok) === '{"c_dorn":-2}' && a.mutatvany.engedett === true && a.kuszob === undefined, 'csak a nem nulla módosító, összetett mezők nélkül');
a = R.keresAdat({ ...u, tipus: 'ellen', ellenfel_nev: ' Őr ', ellenfel_bonusz: '4', celertek: 13 }, 'k1', fn);
ellenoriz(a.celertek === '' && !a.celertek_rejtett && a.ellenfel.nev === 'Őr' && a.ellenfel.bonusz === 4, 'ellenpróba: ellenfél, Célérték nélkül', a);
ellenoriz(R.keresAdat({ ...u, tipus: 'ellen' }, 'k1', fn).ellenfel === '', 'ellenpróba ellenfél nélkül (karakterek egymás ellen)');
a = R.keresAdat({ ...u, tipus: 'osszetett', kuszob: 15, haladas: 'kozos', idoegyseg: ' óránként ', cim: 'Nyomkeresés', cimzettek: ['c_dorn'] }, 'k1', fn);
ellenoriz(a.kuszob === 15 && a.haladas === 'kozos' && a.idoegyseg === 'óránként' && a.cim === 'Nyomkeresés' && a.cimzettek[0] === 'c_dorn', 'összetett kérés', a);

ellenoriz(R.cimzettLista('mindenki', karakterek).join() === 'c_dorn,c_lysa,c_potty', 'mindenki: az aktív karakterek');
ellenoriz(R.cimzettLista(['c_lysa', 'c_nincs'], karakterek).join() === 'c_lysa', 'kiválasztottak: a nem létező kimarad');

// ---------- Leírás ----------
ellenoriz(R.probaFeltetel({ tipus: 'alap', celertek: 13, celertek_rejtett: true }, { dm: true }) === 'Célérték 13 (Kihívó), rejtett', 'DM: rejtett Célérték');
ellenoriz(R.probaFeltetel({ tipus: 'alap', celertek: '', celertek_rejtett: true }) === 'A Célértéket a DM tudja', 'játékos: a DM tudja');
ellenoriz(R.probaFeltetel({ tipus: 'ellen', ellenfel: { nev: 'Őr', bonusz: -1 } }, { dm: true }) === 'Ellenfél: Őr (−1)', 'ellenfél bónusza a DM-nek, mínuszjellel');
ellenoriz(R.probaFeltetel({ tipus: 'ellen', ellenfel: { nev: 'Őr' } }) === 'Ellenfél: Őr', 'játékosnak bónusz nélkül');
ellenoriz(R.probaFeltetel({ tipus: 'osszetett', celertek: 11, kuszob: 10, haladas: 'kozos', idoegyseg: 'óránként', fokusz_kotelezo: true, mutatvany: { engedett: false } })
  === 'Célérték 11 (Átlagos) · Sikerküszöb 10, közös, óránként · fókusz kötelező · Mutatványpont nélkül', 'összetett leírás');

// ---------- Élő tábla ----------
const ut = (osszeg, sarkany, eredmeny, mp = 0) => ({ osszeg, sarkany, eredmeny, mutatvanypont: mp, idopont: 'x' });
let p = { id: 'p1', tipus: 'alap', cimzettek: 'mindenki', celertek: 11, allas: { c_dorn: { dobasok: ['d1'], osszeg: 0, kesz: false, utolso: ut(14, 5, 'siker', 5) } } };
let t = R.probaTabla(p, karakterek);
ellenoriz(t.sorok.length === 3 && t.dobott === 1 && t.osszes === 3, 'alap: három címzett, egy dobott', t);
ellenoriz(t.sorok[0].allapot === 'dobott' && t.sorok[0].osszeg === 14 && t.sorok[0].mp_koltheto, 'Dorn: dobott, Mutatványpont költhető');
ellenoriz(t.sorok[1].allapot === 'var' && t.sorok[1].osszeg === null, 'Lysa: vár');
p = { ...p, cimzettek: ['c_lysa'] };
ellenoriz(R.probaTabla(p, karakterek).sorok.map((s) => s.kulcs).join() === 'c_lysa,c_dorn', 'a már nem címzett, de dobott karakter is látszik');

p = { id: 'p2', tipus: 'ellen', cimzettek: ['c_dorn', 'c_potty'], ellenfel: { nev: 'Őr', bonusz: 3 }, allas: {
  c_dorn: { dobasok: ['a'], utolso: ut(15, 4, '', 4) }, c_potty: { dobasok: ['b'], utolso: ut(12, 6, '', 0) } } };
t = R.probaTabla(p, karakterek);
ellenoriz(t.sorok.length === 3 && t.sorok[2].ellenfel && t.sorok[2].allapot === 'var', 'ellenpróba: az ellenfél sora is', t.sorok);
ellenoriz(t.sorok[0].hely === 1 && t.sorok[1].hely === 2, 'helyezés két dobásból');
ellenoriz(!t.sorok[0].mp_koltheto, 'amíg nem dobott mindenki, nincs költés');
p.allas._ellenfel = { dobasok: ['c'], utolso: ut(15, 2, '', 0) };
t = R.probaTabla(p, karakterek);
ellenoriz(t.sorok[0].hely === 1 && t.sorok[2].hely === 2 && t.sorok[1].hely === 3, 'döntetlen: a nagyobb sárkánykocka nyer', t.sorok.map((s) => s.hely));
ellenoriz(t.sorok[0].mp_koltheto && !t.sorok[2].mp_koltheto, 'csak a győztes költhet');
p.allas._ellenfel.utolso = ut(15, 4, '', 4);
t = R.probaTabla(p, karakterek, { tul: (k) => (k === 'c_dorn' ? 3 : 1) });
ellenoriz(t.sorok[0].hely === 1 && t.sorok[2].hely === 2 && !t.sorok[0].ujradobas, 'teljes egyezés: a nagyobb tulajdonság nyer');
t = R.probaTabla(p, karakterek);
ellenoriz(t.sorok[0].ujradobas && t.sorok[2].ujradobas && !t.sorok[0].mp_koltheto, 'tulajdonság nélkül: újradobás, nincs költés');

p = { id: 'p3', tipus: 'osszetett', kuszob: 10, haladas: 'egyeni', cimzettek: ['c_dorn', 'c_potty'], allas: {
  c_dorn: { dobasok: ['a', 'b', 'c'], osszeg: 11, kesz: true, kesz_sorszam: 1, probak_szama: 3, utolso: ut(13, 6, 'siker') },
  c_potty: { dobasok: ['d'], osszeg: 4, kesz: false, utolso: ut(12, 4, 'siker') } } };
t = R.probaTabla(p, karakterek);
ellenoriz(t.sorok[0].allapot === 'kesz' && t.sorok[0].szazalek === 100 && t.sorok[0].probak_szama === 3 && t.sorok[0].kesz_sorszam === 1, 'összetett: kész, 3 próba alatt');
ellenoriz(t.sorok[1].szazalek === 40 && t.sorok[1].allapot === 'dobott' && t.kozos === null, 'egyéni haladás 40%');
t = R.probaTabla({ ...p, haladas: 'kozos' }, karakterek);
ellenoriz(t.kozos.gyujtott === 15 && t.kozos.kesz && t.kozos.szazalek === 100, 'közös haladás: összeadódik', t.kozos);

// ---------- Játékos kártyái ----------
const probak = [
  { id: 'p1', tipus: 'alap', allapot: 'nyitott', cimzettek: 'mindenki', allas: { c_dorn: { utolso: ut(14, 5, 'siker') } } },
  { id: 'p2', tipus: 'alap', allapot: 'nyitott', cimzettek: ['c_lysa'] },
  { id: 'p3', tipus: 'alap', allapot: 'lezart', cimzettek: 'mindenki' },
  { id: 'p4', tipus: 'titkos', allapot: 'nyitott', cimzettek: 'mindenki' },
  { id: 'p5', tipus: 'osszetett', allapot: 'nyitott', cimzettek: ['c_potty'], allas: { c_potty: { osszeg: 6, utolso: ut(12, 6, 'siker') } } }
];
const k = R.jatekosKartyak(probak, karakterek);
ellenoriz(k.map((x) => x.kulcs).join() === 'p1:c_dorn,p1:c_potty,p5:c_potty', 'kártyák: nyitott, nem titkos, saját karakterenként', k.map((x) => x.kulcs));
ellenoriz(k[0].dobott && !k[1].dobott && k[2].gyujtott === 6, 'dobott jelzés és gyűjtött pont');
const kk = R.jatekosKartyak([{ id: 'p6', tipus: 'osszetett', haladas: 'kozos', kuszob: 10, allapot: 'nyitott', cimzettek: 'mindenki',
  allas: { c_lysa: { osszeg: 7, kesz: false }, c_potty: { osszeg: 4, kesz: false, utolso: ut(12, 4, 'siker') } } }], karakterek);
ellenoriz(kk.length === 2 && kk.every((x) => x.gyujtott === 11 && x.kesz && x.kozos), 'közös haladás: a kártyán a csapat összege, kész', kk);

// ---------- Próba lap ----------
let kz = R.probaKezdet({ id: 'p1', cim: 'Kapu', tulajdonsag: 'tul_perception', fokuszok: ['fok_perception_searching'], celertek: '', celertek_rejtett: true,
  modositok: { c_dorn: -1 }, mutatvany: { engedett: false }, fokusz_kotelezo: true, tipus: 'alap' }, 'c_dorn');
ellenoriz(kz.proba_id === 'p1' && kz.celertek_rejtett && kz.celertek === undefined && kz.mutatvany_tiltva && kz.fokusz_kotelezo, 'játékos: rejtett Célérték, tiltott mutatvány, kötelező fókusz', kz);
ellenoriz(kz.modositok.length === 1 && kz.modositok[0].ertek === -1 && kz.modositok[0].eredet === 'DM módosító', 'a karakter módosítója');
kz = R.probaKezdet({ id: 'p1', tulajdonsag: 'tul_perception', fokuszok: [], celertek: 13, celertek_rejtett: true, tipus: 'alap' }, 'c_lysa');
ellenoriz(kz.celertek === 13 && !kz.celertek_rejtett && !kz.modositok.length && kz.cim === 'Észlelés', 'DM: ismert Célérték, automatikus cím');
ellenoriz(R.probaKezdet({ id: 'x', tipus: 'ellen', tulajdonsag: 'tul_strength' }, 'c').ellenproba, 'ellenpróba jelzés');

// ---------- Titkos próba ----------
const lap = { tulajdonsagok: { tul_perception: { ertek: 2 } }, fokuszok: { fok_perception_searching: { id: 'fok_perception_searching', nev_hu: 'Keresés', tulajdonsag: 'tul_perception', bonusz: 2 } }, pancel: null };
const lapUres = { tulajdonsagok: { tul_perception: { ertek: 0 } }, fokuszok: {}, pancel: null };
const sor = [4, 4, 6, 1, 2, 3];
let i = 0;
const kocka = () => sor[i++ % sor.length];
p = { id: 'p9', kampany_id: 'k1', tipus: 'titkos', cim: 'Csapda észrevétele', tulajdonsag: 'tul_perception', fokuszok: ['fok_perception_searching'], celertek: 13, modositok: { c_potty: 1 } };
const td = R.titkosDobasok(p, ['c_dorn', 'c_potty'], { c_dorn: lap, c_potty: lapUres }, kocka, 'Arnold');
ellenoriz(td[0].dobas.modosito === 4 && td[0].dobas.fokusz === 'fok_perception_searching' && td[0].kiertekeles.eredmeny === 'siker' && td[0].kiertekeles.mutatvanypont === 6, 'Dorn: 14 + 4 = 18, siker, 6 pont', td[0]);
ellenoriz(td[1].dobas.modosito === 1 && td[1].kiertekeles.eredmeny === 'kudarc', 'Pöttöm: fókusz nélkül, +1 módosító, 6 + 1 = 7, kudarc', td[1]);
ellenoriz(td.every((x) => x.dobas.rejtett && x.dobas.proba_id === 'p9' && x.dobas.dobta === 'Arnold' && x.dobas.tipus === 'titkos' && x.dobas.celertek === 13), 'rejtett, a kéréshez kötve');

// ---------- Ellenfél ----------
const ed = R.ellenfelDobas({ id: 'p2', kampany_id: 'k1', cim: 'Birkózás', ellenfel: { nev: 'Őr', bonusz: 3 } }, [2, 2, 5], true);
ellenoriz(ed.ellenfel && ed.modosito === 3 && ed.proba_id === 'p2' && ed.mire === 'Őr: Birkózás' && ed.kezi && !ed.karakter_id, 'ellenfél dobása', ed);

// ---------- Listák ----------
const l = R.probaListak([{ id: 'a', allapot: 'nyitott', letrehozva: '1' }, { id: 'b', allapot: 'nyitott', letrehozva: '2' }, { id: 'c', allapot: 'lezart', letrehozva: '3' }],
  [{ id: '_f1', allapot: 'nyitott', letrehozva: '9', _fuggo: true }], { a: { allapot: 'lezart' } });
ellenoriz(l.nyitott.map((x) => x.id).join() === '_f1,b' && l.lezart.map((x) => x.id).join() === 'c,a', 'nyitott és lezárt, helyi változással, újabbak elöl', l);

// ---------- Varázslat ----------
const v = { nev_hu: 'Széllöket', reszletek: { proba: { tulajdonsag: 'tul_strength', fokusz: ['fok_strength_might'], ellen: 'varazsero' } } };
const vu = R.varazslatProba(v, 14, { celertek_rejtett: true }, fn);
ellenoriz(vu.tulajdonsag === 'tul_strength' && vu.celertek === 14 && !vu.celertek_rejtett && vu.fokuszok[0] === 'fok_strength_might', 'varázslat: Erő a Varázserő ellen, látható Célértékkel', vu);
ellenoriz(vu.cim === 'Széllöket: Erő (Erőkifejtés) a Varázserő (14) ellen', 'varázslat címe', vu.cim);
ellenoriz(R.varazslatProba({ reszletek: {} }, 14) === null, 'próba nélküli varázslat: nincs gomb');

// ---------- Beállítások ----------
ellenoriz(JSON.stringify(R.beallitasValtozas({ mutatvanyok: { felfedezes: true, szerepjatek: true, isteni: false, nyomozas: false } }, 'mutatvanyok.isteni', true))
  === JSON.stringify({ mutatvanyok: { felfedezes: true, szerepjatek: true, isteni: true, nyomozas: false } }), 'mutatványtípus: a teljes objektum megy');
ellenoriz(JSON.stringify(R.beallitasValtozas({}, 'celertek_rejtett', false)) === '{"celertek_rejtett":false}', 'egyszerű kapcsoló');

console.log(`\n${db - hibak}/${db} rendben${hibak ? `, ${hibak} hiba` : ''}.`);
process.exit(hibak ? 1 : 0);
