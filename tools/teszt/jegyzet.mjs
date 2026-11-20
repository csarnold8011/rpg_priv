// A karakterlap jegyzeteinek és a pénzbevitelnek a tesztje (web/js/karakter/jegyzet.js, 6.1).
// Futtatás: node tools/teszt/jegyzet.mjs
import * as J from '../../web/js/karakter/jegyzet.js';
import { uresKarakter, atallit } from '../../web/js/karakter/adat.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}
const lemasol = (x) => JSON.parse(JSON.stringify(x));

ellenoriz(Array.isArray(atallit({ sema: 1, nev: 'X' }).jegyzetek) && J.jegyzetek({}).length === 0, 'a régi karakternek üres jegyzetlistája lesz');
const a = uresKarakter({ nev: 'Dorn' });
J.jegyzetHozzaad(a, { id: 'j1', cim: 'Varga', szoveg: 'Sántít.', ki: 'Bence', idopont: '2026-11-20T10:00:00Z' });
J.jegyzetHozzaad(a, { id: 'j2', szoveg: 'Éjfélkor a hídnál', ki: 'Anna', idopont: '2026-11-20T11:00:00Z' });
ellenoriz(J.jegyzetek(a).map((j) => j.id).join() === 'j2,j1', 'a legújabb elöl');
J.jegyzetModosit(a, 'j1', { rogzitett: true });
ellenoriz(J.jegyzetek(a)[0].id === 'j1' && a.jegyzetek.find((j) => j.id === 'j1').modositva, 'a rögzített elöl, a módosítás ideje rögzül');
J.jegyzetHozzaad(a, { id: 'j1', szoveg: 'más' });
ellenoriz(a.jegyzetek.length === 2 && a.jegyzetek[0].szoveg === 'Sántít.', 'ugyanaz az azonosító kétszer nem kerül be (újra alkalmazás)');
ellenoriz(!J.jegyzetModosit(a, 'nincs', { szoveg: 'x' }), 'nem létező jegyzet módosítása nem hiba');
const torolt = J.jegyzetTorol(a, 'j2');
ellenoriz(torolt.id === 'j2' && a.jegyzetek.length === 1, 'törlés');
J.jegyzetVissza(a, torolt); J.jegyzetVissza(a, torolt);
ellenoriz(a.jegyzetek.length === 2, 'visszavonás egyszer állítja vissza');
ellenoriz(J.jegyzetHozzaad(a, { szoveg: 'x'.repeat(9000) }) && a.jegyzetek[2].szoveg.length === J.MAX_JEGYZET_SZOVEG, 'a túl hosszú szöveg levágódik');
ellenoriz(J.jegyzetMeret(a) > 5000 && J.jegyzetMeret({}) === 0, 'méretbecslés');

// összefésülés: két eszköz, függő módosítások újra alkalmazva a máshol mentett változatra
const kozos = uresKarakter({ nev: 'Dorn' });
const masik = lemasol(kozos);
J.jegyzetHozzaad(masik, { id: 'jm', szoveg: 'A másik eszközön' });
const fuggo = [(x) => J.jegyzetHozzaad(x, { id: 'js', szoveg: 'Az én jegyzetem' }), (x) => J.jegyzetModosit(x, 'js', { szoveg: 'Az én jegyzetem, javítva' })];
const osszefesult = atallit(masik);
fuggo.forEach((fn) => fn(osszefesult));
ellenoriz(osszefesult.jegyzetek.length === 2 && osszefesult.jegyzetek.find((j) => j.id === 'js').szoveg.endsWith('javítva'), 'ütközéskor mindkét eszköz jegyzete megmarad');

// pénz
ellenoriz(J.penzRezben({ a: '2', e: '3', r: '4' }) === 234 && J.penzRezben({ e: '5' }) === 50 && J.penzRezben({}) === 0, 'arany, ezüst, réz rézben');
ellenoriz(J.penzRezben({ a: '-1', e: 'x7' }) === 170, 'csak számjegyek számítanak');
ellenoriz(J.penzHozzaad({ e: '5' }, 10).e === '15' && J.penzHozzaad({}, 1).e === '1', 'gyorsösszeg hozzáadása');
const p = uresKarakter();
p.felszereles.jatek = [{ tipus: 'penz', penz: 10 }, { tipus: 'targy' }, { tipus: 'penz', penz: -5, megjegyzes: 'szállás' }, { tipus: 'vetel', penz: -20 }, { tipus: 'penz', penz: 100 }];
ellenoriz(J.utolsoPenztetelek(p).map((t) => t.penz).join() === '100,-20,-5', 'a legutóbbi három pénztétel, a legújabb elöl');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzésből)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
