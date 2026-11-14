// A karakterlap logikájának helyi tesztje: XP (xp.js, a számoló XP-mezője) és a játék közbeni leltár (leltar.js).
// Futtatás: node tools/teszt/karakterlap.mjs
import * as X from '../../web/js/karakter/xp.js';
import * as L from '../../web/js/karakter/leltar.js';
import * as S from '../../web/js/karakter/szintlepes.js';
import { uresKarakter, uresSzint } from '../../web/js/karakter/adat.js';
import { karakterSzamol } from '../../web/js/karakter/szamol.js';
import { felszerelesFrissit } from '../../web/js/karakter/varazslo.js';
import { index } from '../../web/js/karakter/szabalyindex.js';
import { LAPOK } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}
const ix = index(LAPOK);
const kodok = (lap) => lap.figyelmeztetesek.filter((f) => f.szint === 'figyelmeztetes').map((f) => f.kod);

function harcos() {
  const k = uresKarakter({ nev: 'Brigitte', forrasok: ['Alapkönyv', 'Companion'] });
  Object.assign(k, { faj: 'faj_human', osztaly: 'osz_warrior' });
  k.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 2, tul_dexterity: 1, tul_fighting: 2, tul_intelligence: 0, tul_perception: 2, tul_strength: 3, tul_willpower: 2 };
  k.hatter = { rendszer: 'alap', id: 'hat_soldier', mod: 'dobas', osztaly_dobas: 2, hatter_dobas: 5, fokusz: 'fok_communication_gambling' };
  k.szintek = [{ ...uresSzint(1), egeszseg_dobas: 4, kapott: [{ tipus: 'talentum', id: 'tal_armor_training' }] }];
  k.felszereles = { targyak: [], kezdo_fegyverek: ['fgy_two_handed_axe'], vasarolt: [], penz_dobas: 12 };
  k.keszites.allapot = 'kesz';
  felszerelesFrissit(k, LAPOK);
  return k;
}

// ---------- XP ----------
ellenoriz(X.xpKuszob(ix, 2) === 2000 && X.xpKuszob(ix, 13) === 32000 && X.xpKuszob(ix, 21) === null, 'XP-küszöbök (2. szint 2000, 13. szint 32 000)');
ellenoriz(X.xpSzint(ix, 0) === 1 && X.xpSzint(ix, 4500) === 3 && X.xpSzint(ix, 99999) === 20, 'a szint az XP-ből');
ellenoriz(X.XP_TALALKOZAS.map((x) => x.xp).join() === '0,100,250,400', 'a találkozások jutalma: 0, 100, 250, 400');
ellenoriz(X.szintjutalomXp(ix, 1500, 1) === 500 && X.szintjutalomXp(ix, 2500, 1) === 0, 'szintjutalom: a következő küszöbig hiányzó XP');
const k = harcos();
let lap = karakterSzamol(k, LAPOK);
ellenoriz(lap.xp.ertek === 0 && lap.xp.kovetkezo === 2000 && !lap.xp.elerheto, 'kezdő karakter: 0 XP, a következő szint 2000-nél');
k.allapot.xp = 2100;
lap = karakterSzamol(k, LAPOK);
ellenoriz(lap.xp.elerheto && lap.xp.elert_szint === 2, '2100 XP: a 2. szint elérhető');
k.allapot.xp = 100;
k.xp_naplo = [{ xp: 100, ok: 'teszt' }];
S.szintlepesIndit(k); S.szintLezar(k);
ellenoriz(kodok(karakterSzamol(k, LAPOK)).includes('xp_keves'), 'XP-vel játszó csoportban kevés XP-vel szintet lépni figyelmeztet');
const kk = harcos();
kk.keszites.cel_szint = 3;
S.szintlepesIndit(kk, 3); S.szintLezar(kk, ix);
ellenoriz(kk.allapot.xp === 2000, 'a karakterkészítő kezdő szintjéig az XP a küszöbre áll (2. szint: 2000)');
S.szintLezar(kk, ix);
ellenoriz(kk.allapot.xp === 4000 && !kodok(karakterSzamol(kk, LAPOK)).includes('xp_keves'), '3. szint: 4000 XP, nincs figyelmeztetés');

// ---------- Leltár ----------
const p = harcos();
const kezdo = p.felszereles.penz_rez;
ellenoriz(kezdo === 370, 'kezdőpénz: 37 ezüst', kezdo);
L.vetel(p, LAPOK, 'fel_rope', 2, 10, 'Vásártér');
ellenoriz(p.felszereles.penz_rez === kezdo - 20 && p.felszereles.targyak.find((t) => t.id === 'fel_rope').db === 2, 'vétel: két kötél, 2 ezüst');
ellenoriz(p.felszereles.jatek[0].hol === 'Vásártér' && p.felszereles.jatek[0].penz === -20, 'a vétel helye és ára rögzül');
L.eladas(p, LAPOK, 'fel_rope', 1, 3);
ellenoriz(p.felszereles.penz_rez === kezdo - 17 && p.felszereles.targyak.find((t) => t.id === 'fel_rope').db === 1, 'eladás: egy kötél 3 rézért');
L.penzValtozas(p, LAPOK, 500, 'zsákmány');
ellenoriz(p.felszereles.penz_rez === kezdo + 483, 'pénz: +50 ezüst zsákmány');
L.targyHozzaad(p, LAPOK, { nev: 'Ezüst serleg' }, 1, 'a kriptából');
const serleg = p.felszereles.targyak.find((t) => t.nev === 'Ezüst serleg');
ellenoriz(serleg && serleg.id.startsWith('sajat:'), 'saját nevű talált tárgy', p.felszereles.targyak);
L.targyElvesz(p, LAPOK, 'fel_rope', 1, 'elvágták');
ellenoriz(!p.felszereles.targyak.some((t) => t.id === 'fel_rope'), 'az elvesztett tárgy kikerül');
L.tetelTorol(p, LAPOK, p.felszereles.jatek.length - 1);
ellenoriz(p.felszereles.targyak.find((t) => t.id === 'fel_rope').db === 1, 'tétel visszavonása');
p.felszereles.targyak.find((t) => t.id === 'fgy_two_handed_axe').felszerelve = true;
L.vetel(p, LAPOK, 'fel_rope', 1, 10);
ellenoriz(p.felszereles.targyak.find((t) => t.id === 'fgy_two_handed_axe').felszerelve, 'a „felszerelve” jel megmarad');
p.felszereles.penz_dobas = 15;
felszerelesFrissit(p, LAPOK);
ellenoriz(p.felszereles.penz_rez === 400 - 20 + 3 + 500 - 10, 'a kezdőpénz módosítása után is helyes az egyenleg (a készítő újraszámolása megtartja a játék tételeit)', p.felszereles.penz_rez);
const elotte = p.felszereles.penz_rez;
for (let i = 0; i < 230; i++) L.penzValtozas(p, LAPOK, 1, 'apró');
ellenoriz(p.felszereles.jatek.length <= 200 && p.felszereles.jatek[0].tipus === 'osszevont' && p.felszereles.penz_rez === elotte + 230, 'sok tételnél a régiek összevonódnak, az egyenleg nem változik', p.felszereles.jatek.length);
ellenoriz(p.felszereles.targyak.find((t) => t.nev === 'Ezüst serleg'), 'az összevonás után a tárgyak megmaradnak');
lap = karakterSzamol(p, LAPOK);
ellenoriz(lap.penz_rez === p.felszereles.penz_rez && lap.fegyverek.length === 1, 'a számoló a játék tételeivel együtt dolgozik');

console.log(`\n${db - hibak}/${db} ellenőrzés rendben.`);
if (hibak) process.exit(1);
