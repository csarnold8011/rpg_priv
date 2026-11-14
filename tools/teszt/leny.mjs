// A közös lény-nézet tesztje (web/js/jatek/leny.js). Futtatás: node tools/teszt/leny.mjs
// A minta szörny kitalált, csak számok és azonosítók (szabálykönyvszöveg nem kerülhet a repóba).
import * as LN from '../../web/js/jatek/leny.js';
import * as P from '../../web/js/jatek/proba.js';
import { uresKarakter, uresSzint } from '../../web/js/karakter/adat.js';
import { felszerelesFrissit } from '../../web/js/karakter/varazslo.js';
import { LAPOK as ALAP } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

const minta = {
  tulajdonsagok: { tul_accuracy: 2, tul_communication: -1, tul_constitution: 4, tul_dexterity: 2, tul_fighting: 3, tul_intelligence: -1, tul_perception: 2, tul_strength: 4, tul_willpower: 1 },
  fokuszok: ['fok_accuracy_bite', 'fok_fighting_claws', 'fok_perception_searching'],
  fokusz_bonusz: { fok_perception_searching: 3 },
  sebesseg: 12, mozgas: [{ tipus: 'repülés', ertek: 15 }], egeszseg: 40, vedekezes: 12, pancelertek: 3,
  tamadasok: [
    { nev_en: 'Bite', nev_hu: 'Harapás', bonusz: 4, sebzes: '2d6+4', tul: 'tul_accuracy', fokusz: 'fok_accuracy_bite' },
    { nev_en: 'Claws', nev_hu: 'Karmok', bonusz: 5, sebzes: '1d6+4', tul: 'tul_fighting', fokusz: 'fok_fighting_claws' },
    { nev_en: 'Spit', nev_hu: 'Köpés', bonusz: 2, sebzes: '1d6', tul: 'tul_accuracy', hatotav: '10 yard', atuto: true }
  ],
  kepessegek: [
    { nev_hu: 'Sötétlátás', tipus: 'passzív', leiras: 'x', gepi: { sotetlatas: true } },
    { nev_hu: 'Páncélos', tipus: 'passzív', leiras: 'x', gepi: { pancel_atuto_ellen: true } },
    { nev_hu: 'Hosszú nyak', tipus: 'passzív', leiras: 'x', gepi: { kozelharc_tav: 3 } }
  ],
  sajat_mutatvanyok: [{ kulcs: 'tail', nev_hu: 'Farok', nev_en: 'Tail', mp: 2, leiras: 'x' }],
  kedvelt_mutatvanyok: [{ id: 'mut_mighty_blow', mp: 1 }, { sajat: 'tail' }],
  mutatvany_ar_modositok: [
    { mutatvanyok: ['mut_knock_prone', 'mut_skirmish'], mod: 1, kinek: 'ellene', feltetel: 'ellene (Nagy termet)' },
    { mutatvanyok: ['mut_mighty_blow'], mod: -1, kinek: 'sajat', feltetel: 'a lény maga' },
    { mutatvanyok: ['*'], mod: -1, kinek: 'sajat', feltetel: 'falkában' }
  ],
  magiapont: 20, varazsero: 12, csoport: 'szörnyeteg'
};
const LAPOK = {
  ...ALAP,
  'Fókuszok': [...ALAP['Fókuszok'], { id: 'fok_accuracy_bite', nev_hu: 'Harapás', tulajdonsag: 'tul_accuracy', reszletek: { csak_ellenfel: true } }],
  'Mutatványok': [{ id: 'mut_mighty_blow', nev_hu: 'Hatalmas csapás', nev_en: 'Mighty Blow', mutatvanypont: '2' }, { id: 'mut_knock_prone', nev_hu: 'Földre döntés', mutatvanypont: '2' }],
  'Szörnyek': [
    { id: 'szo_minta', nev_hu: 'Mintalény', nev_en: 'Sample', forras: 'Bestiárium', oldal: 1, fenyegetes: 'Mérsékelt', tipus: 'szörny', aktiv: true, reszletek: JSON.stringify(minta) },
    { id: 'szo_kicsi', nev_hu: 'Apró rém', nev_en: 'Tiny', forras: 'Alapkönyv', oldal: 2, fenyegetes: 'Csekély', tipus: 'állat', aktiv: true, reszletek: { csoport: 'állat', mas_nevek: 'Kisördög' } },
    { id: 'szo_rejtett', nev_hu: 'Rejtett', forras: 'Alapkönyv', fenyegetes: 'Csekély', aktiv: false, reszletek: {} }
  ]
};

// ---------- Szörny a bestiáriumból ----------
const n = LN.lenyNezet({ tipus: 'szorny', sor: 'szo_minta' }, LAPOK);
ellenoriz(n && n.nev === 'Mintalény' && n.csoport === 'szörnyeteg' && n.fenyegetes === 'Mérsékelt', 'szörny azonosító alapján, a csoport a részletekből', n && n.csoport);
ellenoriz(n.tulajdonsagok.tul_strength.ertek === 4 && n.egeszseg.ertek === 40 && n.egeszseg.aktualis === 40, 'tulajdonság és Egészség');
ellenoriz(n.fokuszok.fok_accuracy_bite.bonusz === 2 && n.fokuszok.fok_perception_searching.bonusz === 3, 'fókuszok (a +3 is)');
ellenoriz(n.sebesseg.ertek === 12 && n.sebesseg.mozgas[0].ertek === 15 && n.vedekezes.ertek === 12 && n.pancelertek.ertek === 3, 'harci értékek');
ellenoriz(n.sotetlatas && n.pancelertek.atuto_ellen && n.kozelharc_tav === 3, 'gépi képességek: sötétlátás, páncél átütő ellen, elérés');
ellenoriz(n.tamadasok.length === 3 && n.tamadasok[0].tamadas === 4 && n.tamadasok[2].tavolsagi && n.tamadasok[2].atuto, 'támadások', n.tamadasok);
ellenoriz(n.kedvelt_mutatvanyok[0].nev_hu === 'Hatalmas csapás' && n.kedvelt_mutatvanyok[0].mp === 1 && n.kedvelt_mutatvanyok[1].sajat && n.kedvelt_mutatvanyok[1].mp === 2, 'kedvelt mutatványok feloldása', n.kedvelt_mutatvanyok);
ellenoriz(n.magiapont.ertek === 20 && n.varazsero.ertek === 12, 'Mágiapont és Varázserő');

// A próbamotor változtatás nélkül dolgozik vele
const pr = P.probaOsszeallit(n, { tul: 'tul_perception', fokusz: 'fok_perception_searching' });
ellenoriz(pr.bonusz === 5 && pr.van_fokusz, 'probaOsszeallit a nézettel (Észlelés 2 + 3)', pr);
ellenoriz(P.probaOsszeallit(n, { tul: 'tul_dexterity' }).bonusz === 2, 'nincs páncélbüntetés a statblokknál');

// ---------- Mutatvány ár-módosítók ----------
let m = LN.mutatvanyArModositas(n, 'mut_knock_prone', 'ellene');
ellenoriz(m.mod === 1 && !m.immunis, 'ellene a Földre döntés +1 MP', m);
m = LN.mutatvanyArModositas(n, 'mut_mighty_blow', 'sajat');
ellenoriz(m.mod === -2 && m.reszek.length === 2, 'saját Hatalmas csapás −1, és a falka −1 (minden mutatványra)', m);
ellenoriz(LN.mutatvanyArModositas(n, 'mut_knock_prone', 'sajat').mod === -1, 'a „*” módosító a saját mutatványokra');
ellenoriz(LN.mutatvanyArModositas({ mutatvany_ar_modositok: [{ mutatvanyok: ['mut_skirmish'], mod: 'immunis' }] }, 'mut_skirmish', 'ellene').immunis, 'immunitás (kinek nélkül: ellene)');

// ---------- Erősítés ----------
const er = { fok: 'elit', tulajdonsagok: { tul_strength: 1, tul_dexterity: 1, tul_accuracy: 1 }, fokuszok: ['fok_dexterity_stealth', 'fok_accuracy_brawling'] };
const e = LN.lenyNezet({ tipus: 'szorny', sor: 'szo_minta' }, LAPOK, { erosites: er });
ellenoriz(e.egeszseg.ertek === 45 && e.erosites.nev === 'Elit', 'elit: +5 Egészség');
ellenoriz(e.tulajdonsagok.tul_strength.ertek === 5 && e.tulajdonsagok.tul_strength.reszek.length === 2, 'elit: +1 Erő, összetevőkkel');
ellenoriz(e.vedekezes.ertek === 13 && e.sebesseg.ertek === 13, 'az Ügyesség növelése a Védekezést és a Sebességet is emeli');
ellenoriz(e.tamadasok[0].tamadas === 5 && e.tamadasok[0].sebzes === '2d6+5', 'a harapás bónusza és sebzése követi a Pontosságot és az Erőt', e.tamadasok[0]);
ellenoriz(e.fokuszok.fok_dexterity_stealth && e.fokuszok.fok_dexterity_stealth.bonusz === 2, 'elit: új fókusz');
const ep = LN.lenyNezet({ tipus: 'szorny', sor: 'szo_minta' }, LAPOK, { erosites: { fok: 'epikus', tulajdonsagok: {} } });
ellenoriz(ep.pancelertek.ertek === 6 && ep.egeszseg.ertek === 60, 'epikus: +3 Páncélérték, +20 Egészség');
let a = LN.erositesAllas(er);
ellenoriz(!a.hibak.length && a.maradek.fokusz === 0 && a.maradek.tul[0].db === 0 && a.maradek.talentum === 1, 'elit kiosztás rendben, egy talentumfokozat maradt', a);
a = LN.erositesAllas({ fok: 'hosi', tulajdonsagok: { tul_strength: 2, tul_fighting: 2, tul_willpower: 2, tul_accuracy: 3 }, fokuszok: [] });
ellenoriz(a.hibak.length === 2 && a.maradek.fokusz === 4, 'hősi: túl sok +2 és nem illő +3 jelzés', a);
const kz = LN.lenyNezet({ tipus: 'szorny', sor: 'szo_minta' }, LAPOK, { kezi: [{ cel: 'egeszseg_max', ertek: 10 }, { cel: 'fok_strength_might', ertek: 0 }], allapot: { egeszseg: 12, magiapont: 5 } });
ellenoriz(kz.egeszseg.ertek === 50 && kz.egeszseg.aktualis === 12 && kz.magiapont.aktualis === 5 && kz.fokuszok.fok_strength_might, 'kézi módosítás és megmaradó állapot');

// ---------- NJK (2. ütemhez előkészítve) ----------
const njk = LN.lenyNezet({ tipus: 'njk', sor: { id: 'njk_1', nev: 'Falkavezér', adat: JSON.stringify({ statblokk: minta, erosites: er }) } }, LAPOK);
ellenoriz(njk.nev === 'Falkavezér' && njk.egeszseg.ertek === 45 && njk.forras.tipus === 'njk', 'NJK statblokk erősítéssel');

// ---------- Karakter ----------
const k = uresKarakter({ nev: 'Brigitte', forrasok: ['Alapkönyv', 'Companion'] });
Object.assign(k, { faj: 'faj_human', osztaly: 'osz_warrior' });
k.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 2, tul_dexterity: 1, tul_fighting: 2, tul_intelligence: 0, tul_perception: 2, tul_strength: 3, tul_willpower: 2 };
k.hatter = { rendszer: 'alap', id: 'hat_soldier', mod: 'dobas', osztaly_dobas: 2, hatter_dobas: 5, fokusz: 'fok_communication_gambling' };
k.faj_dontes = { fokusz: 'fok_dexterity_riding', elonyok: [{ dobas: 5 }, { dobas: 7 }] };
k.szintek = [{ ...uresSzint(1), egeszseg_dobas: 4, kapott: [{ tipus: 'talentum', id: 'tal_armor_training' }] }];
k.felszereles = { targyak: [], kezdo_fegyverek: ['fgy_two_handed_axe'], vasarolt: [], penz_dobas: 12 };
k.keszites.allapot = 'kesz';
felszerelesFrissit(k, LAPOK);
const kn = LN.lenyNezet({ tipus: 'karakter', adat: k, id: 'k1' }, LAPOK);
ellenoriz(kn.tipus === 'karakter' && kn.nev === 'Brigitte' && kn.egeszseg.ertek === kn.lap.egeszseg.ertek && kn.vedekezes.ertek === kn.lap.vedekezes.ertek, 'karakter: a számoló értékei');
ellenoriz(kn.tamadasok.length === kn.lap.fegyverek.filter((w) => w.felszerelve !== false).length && kn.tamadasok.every((t) => t.tamadas !== undefined), 'karakter: a fegyverekből támadások', kn.tamadasok);

// ---------- Lista és szűrés ----------
let l = LN.szornySzures(LAPOK['Szörnyek']);
ellenoriz(l.length === 2 && l[0].id === 'szo_kicsi', 'az inaktív kimarad, a Csekély előbb');
ellenoriz(LN.szornySzures(LAPOK['Szörnyek'], { szoveg: 'kisördög' }).length === 1, 'keresés a más nevekben is');
ellenoriz(LN.szornySzures(LAPOK['Szörnyek'], { csoport: ['szörnyeteg'] })[0].id === 'szo_minta', 'szűrés csoportra (a részletekből)');
ellenoriz(LN.szornySzures(LAPOK['Szörnyek'], { fenyegetes: ['Csekély'], forras: ['Bestiárium'] }).length === 0, 'fenyegetés és forrás együtt');
ellenoriz(LN.fenyegetesSorszam('Súlyos') === 3 && LN.fenyegetesSorszam('Major') === 2, 'fenyegetés sorszáma magyar és angol névvel');
const kiv = LN.lenyKivonat(n);
ellenoriz(kiv.egeszseg === 40 && kiv.legjobb_tamadas === 5, 'kivonat a kártyához', kiv);

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzés)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
