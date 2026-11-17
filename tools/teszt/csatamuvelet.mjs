// A csatalépések (műveletek), a varázslatok, a játékosnak szűrt csata és a lezárás segédeinek tesztje
// (web/js/jatek/csatamuvelet.js). Futtatás: node tools/teszt/csatamuvelet.mjs
// A valódi szabályadattal (repón kívüli lapok.json) a varázslatok átalakítása is ellenőrződik:
//   FAGE_SZABALYOK=<lapok.json> node tools/teszt/csatamuvelet.mjs
import fs from 'fs';
import * as C from '../../web/js/jatek/csata.js';
import * as M from '../../web/js/jatek/csatamuvelet.js';
import * as O from '../../web/js/jatek/osszecsapas.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---- kiinduló csata ----
let o = O.uresOsszecsapas();
o = O.resztvevoHozzaadas(o, { tipus: 'karakter', id: 'k1', nev: 'Dorn' }, { oldal: O.CSAPAT }).o;
o = O.resztvevoHozzaadas(o, { tipus: 'karakter', id: 'k2', nev: 'Lia' }, { oldal: O.CSAPAT }).o;
o = O.resztvevoHozzaadas(o, { tipus: 'szorny', id: 'szo_ork', nev: 'Ork', db: 2 }, { oldal: O.ELLENFELEK }).o;
o = O.resztvevoHozzaadas(o, { tipus: 'njk', id: 'n_vezer', nev: 'Vezér' }, { oldal: O.ELLENFELEK, rejtett: true }).o;
const ADAT = {
  k1: { egeszseg: 25, egeszseg_max: 25, szivossag: 2, ertekek: { vedekezes: 13, pancelertek: 3 } },
  k2: { egeszseg: 18, egeszseg_max: 18, szivossag: 1, magiapont: 15, ertekek: { vedekezes: 11, pancelertek: 0, magiapont_max: 15, akaratero: 3 } },
  szo_ork: { egeszseg_max: 15, ertekek: { vedekezes: 11, pancelertek: 4 } },
  n_vezer: { egeszseg_max: 30, ertekek: { vedekezes: 12, pancelertek: 5 } }
};
let cs = C.csataOsszecsapasbol(o, (p) => ADAT[p.forras.id]);
const id = (nev) => cs.resztvevok.find((r) => r.nev === nev).id;
const D = id('Dorn'), L = id('Lia'), O1 = id('Ork 1'), O2 = id('Ork 2'), V = id('Vezér');
ellenoriz(C.resztvevo(cs, L).magiapont === 15 && C.resztvevo(cs, O1).ertekek.pancelertek === 4, 'a résztvevő Mágiapontja és csataértékei létrehozáskor');
ellenoriz(Array.isArray(cs.fuggo) && cs.fuggo.length === 0, 'üres függő próbalista');

// ---- varázslat kifejezések ----
ellenoriz(JSON.stringify(M.varazslatKifejezes('2d6+Akaraterő', 3)) === JSON.stringify({ kocka: 2, plusz: 3 }), '2d6+Akaraterő');
ellenoriz(JSON.stringify(M.varazslatKifejezes('1d6+Akaraterő', -1)) === JSON.stringify({ kocka: 1, plusz: -1 }), 'negatív Akaraterő');
ellenoriz(JSON.stringify(M.varazslatKifejezes('Akaraterő (legalább 1)', 0)) === JSON.stringify({ kocka: 0, plusz: 1 }), 'Akaraterő, legalább 1');
ellenoriz(JSON.stringify(M.varazslatKifejezes('0', 2)) === JSON.stringify({ kocka: 0, plusz: 0 }) && M.varazslatKifejezes(null) === null, '0 és hiányzó');
const villam = M.varazslatAdat({ id: 'v1', nev_hu: 'Villámcsapás', reszletek: JSON.stringify({ mp: { min: 7, max: 7, plusz: false }, celertek: { ertek: 15 },
  proba: { tulajdonsag: 'tul_constitution', fokusz: ['fok_constitution_stamina'], ellen: 'varazsero' }, ido_kod: 'fo', sebzes: '2d6+Akaraterő', sebzes_ellenallaskor: '1d6+Akaraterő', atuto: true }) }, { akarat: 3 });
ellenoriz(villam.fajta === 'fo' && villam.celertek === 15 && villam.mp.min === 7 && villam.proba.tul === 'tul_constitution' && villam.sebzes.plusz === 3 && villam.csokkentett.kocka === 1 && villam.atuto, 'varázslat adatai a sorból', villam);
const gyogy = M.varazslatAdat({ id: 'v2', nev_hu: 'Gyógyító érintés', reszletek: { mp: { min: 1, max: null, plusz: true }, celertek: { ertek: 10 }, proba: null, ido_kod: 'kis', gyogyitas: 'Mágiapontonként 1d6' } });
ellenoriz(gyogy.fajta === 'mellek' && gyogy.gyogyitas_mp && JSON.stringify(M.varazslatGyogyitasKocka(gyogy, 3)) === JSON.stringify({ kocka: 3, plusz: 0 }), 'gyógyítás Mágiapontonként, kis cselekvés');

const vm = M.varazsMutatvanyHatasok([{ id: 'mut_powerful_casting', nev: 'Erőteljes varázslás', mp: 2 }, { id: 'mut_skillful_casting', nev: 'Ügyes varázslás', mp: 2 },
  { id: 'mut_mighty_spell', nev: 'Hatalmas varázslat', mp: 2 }, { id: 'mut_magic_shield', nev: 'Mágikus védőpajzs', mp: 2 }, { id: 'mut_fast_casting', nev: 'Gyors varázslás', mp: 3 }]);
ellenoriz(vm.varazsero === 2 && vm.mp_kedvezmeny === 1 && vm.extra_kocka === 1 && vm.vedopajzs && vm.szoveges[0] === 'Gyors varázslás', 'varázslati mutatványok gépi hatása', vm);

// ---- kezdeményezés és indítás ----
const lep = (m, opciok) => { cs = M.muveletLepes(cs, m, C.ujKulcs(), opciok); return cs; };
lep({ tipus: 'kezdemenyezes', r: D, osszeg: 14, sarkany: 3, tul: 2, kockak: [4, 5, 3] }, { szerzo: 'u_anna' });
lep({ tipus: 'kezdemenyezes', r: L, osszeg: 16, sarkany: 5, tul: 2, kockak: [4, 5, 5] });
lep({ tipus: 'kezdemenyezes', r: O1, osszeg: 10, sarkany: 2, tul: 1, kockak: [3, 4, 2] });
ellenoriz(C.resztvevo(cs, O2).kezdemenyezes.osszeg === 10 && cs.sorrend[0] === L, 'kezdeményezés műveletként (a csoport együtt)');
ellenoriz(cs.visszavonas[0].szerzo === 'u_anna', 'a lépés szerzője rögzül');
cs = C.csataKezdes(cs);
ellenoriz(cs.soron === L, 'Lia kezd');

// ---- ellenőrzés ----
const ell = (m, iranyitott, extra) => M.muveletEllenorzes(cs, m, { iranyitott, ...extra });
ellenoriz(ell({ tipus: 'cselekves', r: L, kulcs: 'vedekezes' }, [D]) !== null, 'más résztvevőért nem cselekedhet');
ellenoriz(ell({ tipus: 'cselekves', r: D, kulcs: 'vedekezes' }, [D]) !== null, 'nem a saját körében nem cselekedhet');
ellenoriz(ell({ tipus: 'cselekves', r: L, kulcs: 'vedekezes' }, [L]) === null, 'a saját körében cselekedhet');
ellenoriz(ell({ tipus: 'tamadas', r: L, cel: V, cselekves: 'tamadas' }, [L]) !== null, 'rejtett célpont nem támadható');
ellenoriz(ell({ tipus: 'kezdemenyezes', r: L }, [L]) !== null, 'a futó csatában a játékos nem írja át a kezdeményezést');
ellenoriz(ell({ tipus: 'varazslat', r: L, mp: 20, celok: [O1] }, [L]) === 'Nincs elég Mágiapont.', 'nincs elég Mágiapont');
ellenoriz(ell({ tipus: 'cselekves', r: D, kulcs: 'vedekezes' }, [], { dm: true }) === null, 'a DM bármit megtehet');
ellenoriz(ell({ tipus: 'repules', r: L }, [L]) !== null, 'ismeretlen művelet');

// ---- varázslat célpont próbával, függő próba ----
lep({ tipus: 'varazslat', r: L, varazslat: { id: 'v1', nev: 'Villámcsapás' }, fajta: 'fo', mp: 7, siker: true, osszeg: 16, celok: [O1, O2],
  proba: { tul: 'tul_constitution', fokuszok: ['fok_constitution_stamina'], celertek: 14, nev: 'Szívósság (Állóképesség)' },
  sebzes: { teljes: 11, csokkentett: 5, atuto: true }, extra: { cel: O1, sebzes: 3 }, hatasok: { vedopajzs: true }, mutatvanyok: ['Hatalmas varázslat', 'Mágikus védőpajzs'] }, { szerzo: 'u_bence' });
ellenoriz(C.resztvevo(cs, L).magiapont === 8 && cs.fuggo.length === 2, 'a Mágiapont fogy, két függő célpont-próba');
ellenoriz(cs.fuggo.find((f) => f.cel === O1).teljes === 14 && cs.fuggo.find((f) => f.cel === O1).csokkentett === 8, 'a Hatalmas varázslat egy célpontnál emeli a sebzést');
ellenoriz(C.hatasOsszeg(C.resztvevo(cs, L), 'vedekezes') === 2, 'Mágikus védőpajzs: +2 Védekezés');
ellenoriz(ell({ tipus: 'celpont_proba', proba_id: cs.fuggo[0].id, osszeg: 10 }, [L]) !== null, 'a célpont próbáját csak az irányítója dobja');
const f1 = cs.fuggo.find((f) => f.cel === O1);
lep({ tipus: 'celpont_proba', proba_id: f1.id, osszeg: 9, kockak: [2, 3, 1] });
ellenoriz(C.resztvevo(cs, O1).egeszseg === 1 && cs.fuggo.length === 1, 'nem állt ellen: teljes, átütő sebzés (15 − 14)');
const f2 = cs.fuggo[0];
ellenoriz(cs.naplo.some((n) => n.szoveg.includes('nem állt ellen')), 'a célpont próbája a naplóban');
lep({ tipus: 'celpont_proba', proba_id: f2.id, osszeg: 15, kockak: [5, 5, 3] });
ellenoriz(C.resztvevo(cs, O2).egeszseg === 10 && !cs.fuggo.length, 'ellenállt: csökkentett sebzés (15 − 5)');
cs = C.visszavon(cs);
ellenoriz(cs.fuggo.length === 1 && C.resztvevo(cs, O2).egeszseg === 15, 'a célpont próbájának visszavonása a függő próbát is visszahozza');
lep({ tipus: 'celpont_proba', proba_id: f2.id, osszeg: 15, kockak: [5, 5, 3] });

// ---- támadás a háttér értékeivel ----
lep({ tipus: 'kovetkezo', r: L });
ellenoriz(cs.soron === D, 'Dorn következik');
let e = M.tamadasEredmeny(cs, { cel: O2, osszeg: 11, sebzes: 9, talalat: false });
ellenoriz(e.talalat && e.v1 === 5, 'a találatot és a páncélt a célpont csataértékei döntik (a kliens találata nem számít)', e);
e = M.tamadasEredmeny(cs, { cel: O2, osszeg: 10, sebzes: 9, talalat: true });
ellenoriz(!e.talalat, 'nem éri el a Védekezést: nem talált');
lep({ tipus: 'tamadas', r: D, cel: O2, cselekves: 'mindent_bele', tamadas: { nev: 'Pallos' }, osszeg: 13, sebzes: 9, kegyelem: false,
  masodik: { cel: O1, sebzes: 6 }, hatasok: { fekszik: true, villam: 1 }, mutatvanyok: ['Kettős csapás', 'Földre döntés', 'Villámtámadás'] });
ellenoriz(C.resztvevo(cs, O2).egeszseg === 5 && C.resztvevo(cs, O1).allapot === 'kiesett', 'támadás: sebzés, Kettős csapás a második célpontra');
ellenoriz(C.resztvevo(cs, O2).feltetelek.some((f) => f.kulcs === 'fekszik') && C.resztvevo(cs, D).cselekves.plusz === 1, 'Földre döntés és Villámtámadás');
ellenoriz(C.hatasOsszeg(C.resztvevo(cs, D), 'vedekezes') === -1, 'Mindent bele: −1 Védekezés');

// ---- gyógyítás ----
lep({ tipus: 'gyogyitas', r: D, cel: O2, mennyi: 3 });
ellenoriz(C.resztvevo(cs, O2).egeszseg === 8 && C.resztvevo(cs, O2).gyogyithato === false, 'Gyógyítás, a célpont addig nem kaphat újat');
ellenoriz(M.muveletEllenorzes(cs, { tipus: 'gyogyitas', r: D, cel: O2, mennyi: 2 }, { iranyitott: [D] }) !== null, 'újabb Gyógyítás tiltva');

// ---- szűrt nézet ----
cs = C.lepes(cs, 'Titkos jel', (x) => x, C.ujKulcs(), { dm: true });
const n = M.jatekosNezet(cs, { beallitas: { csata_egeszseg: 'leiro' }, iranyitott: [D], szerzo: 'u_x' });
ellenoriz(!n.resztvevok.some((r) => r.id === V) && !n.sorrend.includes(V), 'a rejtett résztvevő kimarad');
const nO2 = n.resztvevok.find((r) => r.id === O2);
ellenoriz(nO2.egeszseg === null && nO2.egeszseg_szoveg === 'sérült' && nO2.ertekek.vedekezes === 11, 'más oldal: leíró Egészség, a Védekezés megmarad', nO2);
ellenoriz(n.resztvevok.find((r) => r.id === L).egeszseg === 18 && n.resztvevok.find((r) => r.id === D).iranyithato, 'a saját oldal pontos, az irányított jelölve');
ellenoriz(!n.naplo.some((x) => x.szoveg === 'Titkos jel') && !n.visszavonas && n.utolso_lepes && !n.utolso_lepes.sajat, 'a DM naplósora és a visszavonás nem megy ki');
ellenoriz(n.vedekezes_rejtett === true && M.jatekosNezet(cs, { beallitas: { celertek_rejtett: false } }).vedekezes_rejtett === false, 'a Védekezés megjelenítése a Célérték beállítása szerint');
ellenoriz(M.jatekosNezet(cs, { beallitas: { csata_egeszseg: 'rejtett' }, iranyitott: [D] }).resztvevok.find((r) => r.id === O2).egeszseg_szoveg === '?', 'rejtett Egészség');
// optimista alkalmazás a szűrt nézeten: az ismeretlen Egészségű célpont nem változik
const n2 = M.muveletLepes(n, { tipus: 'tamadas', r: D, cel: O2, cselekves: 'tamadas', tamadas: { nev: 'Pallos' }, osszeg: 18, sebzes: 9 }, C.ujKulcs());
ellenoriz(n2.resztvevok.find((r) => r.id === O2).egeszseg === null && n2.resztvevok.find((r) => r.id === O2).allapot === 'aktiv', 'a szűrt nézeten az ismeretlen Egészség érintetlen');

// ---- játékos visszavonása ----
cs = M.muveletLepes(cs, { tipus: 'cselekves', r: D, szabad: { nev: 'Ital', fajta: 'szabad' } }, C.ujKulcs(), { szerzo: 'u_dorn' });
ellenoriz(M.muveletEllenorzes(cs, { tipus: 'visszavonas' }, { szerzo: 'u_dorn' }) === null && M.muveletEllenorzes(cs, { tipus: 'visszavonas' }, { szerzo: 'u_lia' }) !== null, 'csak a saját utolsó lépés vonható vissza');

// ---- lezárás ----
const nj = M.njkAllapotok({ resztvevok: [{ forras: { tipus: 'njk', id: 'n1' }, nev: 'A', egeszseg: 3, allapot: 'aktiv', feltetelek: [{ nev: 'Fekszik' }] }, { forras: { tipus: 'szorny', id: 's' } }] });
ellenoriz(nj.length === 1 && nj[0].egeszseg === 3 && nj[0].feltetelek[0] === 'Fekszik', 'az NJK állapota a lezáráshoz');
ellenoriz(M.csataKarakterei(cs).map((c) => c.id).join() === 'k1,k2', 'a csata karakterei az XP-hez');
const oc = M.osszecsapasCsatabol(cs);
ellenoriz(oc.resztvevok.length === cs.resztvevok.length && oc.resztvevok.every((r) => r.db === 1), 'a csata összecsapás-alakja a nehézséghez');
ellenoriz(M.XP_BESOROLAS['Átlagos'] === 'kozepes' && M.XP_BESOROLAS['Nagyon nehéz'] === 'nehez', 'XP-besorolás a nehézségből');
ellenoriz(JSON.stringify(cs).length < 48000, 'a csata állapota elfér egy cellában');

// ---- valódi szabályadat ----
if (process.env.FAGE_SZABALYOK) {
  const lapok = JSON.parse(fs.readFileSync(process.env.FAGE_SZABALYOK, 'utf8'));
  const vs = lapok['Varázslatok'].map((v) => M.varazslatAdat(v, { akarat: 2 }));
  ellenoriz(vs.every((v) => v && v.nev && Number.isFinite(v.mp.min)), 'minden varázslat átalakul');
  const sebzo = lapok['Varázslatok'].filter((v) => { const r = typeof v.reszletek === 'string' ? JSON.parse(v.reszletek) : v.reszletek; return r && r.sebzes; });
  ellenoriz(sebzo.every((v) => M.varazslatAdat(v, { akarat: 2 }).sebzes), 'minden sebző varázslat sebzése értelmezhető', sebzo.filter((v) => !M.varazslatAdat(v, { akarat: 2 }).sebzes).map((v) => v.nev_hu));
  const gy = lapok['Varázslatok'].filter((v) => { const r = typeof v.reszletek === 'string' ? JSON.parse(v.reszletek) : v.reszletek; return r && r.gyogyitas; });
  ellenoriz(gy.every((v) => { const a = M.varazslatAdat(v); return a.gyogyitas || a.gyogyitas_mp; }), 'a gyógyító varázslatok értelmezhetők');
}

console.log(hibak ? `\n${hibak} hiba (${db} ellenőrzésből).` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
