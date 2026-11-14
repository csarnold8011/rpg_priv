// A próbák szabályainak helyi tesztje (web/js/jatek/proba.js). Futtatás: node tools/teszt/proba.mjs
import * as P from '../../web/js/jatek/proba.js';
import { uresKarakter, uresSzint } from '../../web/js/karakter/adat.js';
import { karakterSzamol } from '../../web/js/karakter/szamol.js';
import { felszerelesFrissit } from '../../web/js/karakter/varazslo.js';
import { LAPOK } from './karakter_minta.mjs';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---------- Egy kitalált lap (a számoló eredményének szerkezete) ----------
const lap = {
  tulajdonsagok: { tul_perception: { ertek: 2 }, tul_dexterity: { ertek: 3 }, tul_intelligence: { ertek: 1 }, tul_communication: { ertek: -1 } },
  fokuszok: {
    fok_perception_searching: { id: 'fok_perception_searching', nev_hu: 'Keresés', tulajdonsag: 'tul_perception', bonusz: 2 },
    fok_perception_seeing: { id: 'fok_perception_seeing', nev_hu: 'Látás', tulajdonsag: 'tul_perception', bonusz: 3 },
    fok_dexterity_stealth: { id: 'fok_dexterity_stealth', nev_hu: 'Lopakodás', tulajdonsag: 'tul_dexterity', bonusz: 2 }
  },
  pancel: null
};

// ---------- Összeállítás ----------
let o = P.probaOsszeallit(lap, { tul: 'tul_perception', fokusz: 'fok_perception_searching' });
ellenoriz(o.bonusz === 4 && o.reszek.length === 2 && o.van_fokusz, 'Észlelés (Keresés): 2 + 2', o);
o = P.probaOsszeallit(lap, { tul: 'tul_perception', fokusz: 'fok_dexterity_stealth' });
ellenoriz(o.bonusz === 2 && !o.van_fokusz, 'más tulajdonság fókusza nem számít');
o = P.probaOsszeallit(lap, { tul: 'tul_perception', fokusz: 'fok_perception_seeing', modositok: [{ ertek: -2, eredet: 'Sötét' }, { ertek: 0, eredet: 'semmi' }, { ertek: 1, eredet: 'Segítség' }] });
ellenoriz(o.bonusz === 4 && o.reszek.length === 4, 'a 11. szint utáni +3 fókusz és a módosítók (a nulla kimarad)', o);
o = P.probaOsszeallit({ ...lap, pancel: { ugyesseg_buntetes: 3 } }, { tul: 'tul_dexterity', fokusz: 'fok_dexterity_stealth' });
ellenoriz(o.bonusz === 2 && o.reszek.some((r) => r.eredet === 'Páncélbüntetés' && r.ertek === -3), 'képzetlen páncélban az Ügyesség alapú próba büntetést kap', o);
ellenoriz(P.probaOsszeallit({ ...lap, pancel: { ugyesseg_buntetes: 3 } }, { tul: 'tul_perception' }).bonusz === 2, 'a páncélbüntetés más tulajdonságot nem érint');
ellenoriz(P.probaOsszeallit(lap, { tul: 'tul_strength' }).bonusz === 0, 'hiányzó tulajdonság 0');

// ---------- Fókusz ajánlása ----------
ellenoriz(P.fokuszAjanlas(lap, ['fok_perception_searching', 'fok_perception_seeing']) === 'fok_perception_seeing', 'a kért fókuszok közül a legjobb');
ellenoriz(P.fokuszAjanlas(lap, ['fok_perception_hearing']) === null, 'ha egyik sincs meg, nincs ajánlás');
ellenoriz(P.fokuszAjanlas(lap, ['fok_dexterity_stealth'], 'tul_perception') === null, 'más tulajdonság fókusza nem ajánlható');
ellenoriz(P.tulajdonsagFokuszai(lap, 'tul_perception').length === 2, 'a tulajdonság fókuszai');

// ---------- Kiértékelés ----------
let e = P.probaKiertekel([3, 3, 4], 4, { celertek: 13 });
ellenoriz(e.osszeg === 14 && e.eredmeny === 'siker' && e.dupla && e.mutatvanypont === 4 && e.fok === 'szépen', 'siker duplával: 4 Mutatványpont (a sárkánykocka)', e);
e = P.probaKiertekel([3, 3, 4], 4, { celertek: 15 });
ellenoriz(e.eredmeny === 'kudarc' && e.mutatvanypont === 0 && e.fok === '', 'kudarcnál nincs Mutatványpont');
e = P.probaKiertekel([2, 5, 6], 2, { celertek: 15 });
ellenoriz(e.eredmeny === 'siker' && !e.dupla && e.mutatvanypont === 0, 'pont eléri: siker, dupla nélkül nincs pont');
e = P.probaKiertekel([6, 1, 6], 0, {});
ellenoriz(e.eredmeny === '' && e.dupla && e.mutatvanypont === 6, 'Célérték nélkül nincs siker vagy kudarc, de a dupla pontot ad (a DM dönt)');
e = P.probaKiertekel([6, 6, 6], 9, { celertek: 9, fokusz_kotelezo: true, van_fokusz: false });
ellenoriz(e.eredmeny === 'kudarc' && e.fokusz_hianyzik && e.mutatvanypont === 0, 'kötelező fókusz nélkül automatikus kudarc');
e = P.probaKiertekel([5, 5, 5], 0, { celertek: 9, mutatvany_tiltva: true });
ellenoriz(e.eredmeny === 'siker' && e.mutatvanypont === 0, 'a DM kizárhatja a Mutatványpontot');
ellenoriz(P.sikerFoka(1) === 'épp hogy' && P.sikerFoka(6) === 'lenyűgözően', 'a siker foka a sárkánykockából');

// ---------- Ellenpróba ----------
let s = P.ellenprobaSorrend([{ kulcs: 'or', osszeg: 12, sarkany: 4, tulajdonsag: 2 }, { kulcs: 'morg', osszeg: 14, sarkany: 1, tulajdonsag: 1 }]);
ellenoriz(s[0].kulcs === 'morg' && s[0].hely === 1 && s[1].hely === 2, 'ellenpróba: a nagyobb eredmény nyer');
s = P.ellenprobaSorrend([{ kulcs: 'a', osszeg: 13, sarkany: 2, tulajdonsag: 3 }, { kulcs: 'b', osszeg: 13, sarkany: 5, tulajdonsag: 0 }]);
ellenoriz(s[0].kulcs === 'b' && !s[0].ujradobas, 'döntetlennél a nagyobb sárkánykocka nyer');
s = P.ellenprobaSorrend([{ kulcs: 'a', osszeg: 13, sarkany: 5, tulajdonsag: 3 }, { kulcs: 'b', osszeg: 13, sarkany: 5, tulajdonsag: 1 }]);
ellenoriz(s[0].kulcs === 'a', 'utána a nagyobb tulajdonság');
s = P.ellenprobaSorrend([{ kulcs: 'a', osszeg: 13, sarkany: 5, tulajdonsag: 1 }, { kulcs: 'b', osszeg: 13, sarkany: 5, tulajdonsag: 1 }, { kulcs: 'c', osszeg: 9, sarkany: 1, tulajdonsag: 0 }]);
ellenoriz(s[0].hely === 1 && s[1].hely === 1 && s[0].ujradobas && s[1].ujradobas && s[2].hely === 3 && !s[2].ujradobas, 'teljes egyezésnél újradobás, több résztvevővel is', s);

// ---------- Összetett próba (a könyv példája: Varuker, küszöb 15) ----------
const varuker = [[[1, 2, 3], 'kudarc'], [[4, 1, 2], 'siker'], [[2, 6, 5], 'siker'], [[3, 3, 4], 'siker'], [[1, 1, 1], 'kudarc'], [[5, 2, 6], 'siker']]
  .map(([kockak, eredmeny]) => ({ kulcs: 'varuker', kockak, eredmeny }));
let a = P.osszetettAllas(varuker, 15).varuker;
ellenoriz(a.osszeg === 17 && a.kesz && a.probak === 6 && a.hely === 1, 'Varuker: hat próba, 2 + 5 + 4 + 6 = 17 ≥ 15', a);
a = P.osszetettAllas([{ kulcs: 'x', kockak: [1, 1, 6], eredmeny: 'siker' }, { kulcs: 'y', kockak: [1, 1, 6], eredmeny: 'siker' }, { kulcs: 'x', kockak: [1, 1, 5], eredmeny: 'siker' }, { kulcs: 'y', kockak: [1, 1, 6], eredmeny: 'siker' }, { kulcs: 'x', kockak: [6, 6, 6], eredmeny: 'siker' }], 10);
ellenoriz(a.x.hely === 1 && a.y.hely === 2 && a.x.probak === 2 && a.x.osszeg === 11, 'verseny: aki előbb éri el, nyer; a kész résztvevő további dobásai nem számítanak', a);

// ---------- Napló, kampány, név ----------
o = P.probaOsszeallit(lap, { tul: 'tul_perception', fokusz: 'fok_perception_searching' });
e = P.probaKiertekel([3, 3, 4], o.bonusz, { celertek: 13 });
const d = P.naploDobas({ kampany_id: 'c1', karakter_id: 'k1', mire: P.probaNev(lap, 'tul_perception', 'fok_perception_searching'), kockak: [3, 3, 4], osszeallitas: o, kiertekeles: e, celertek: 13, tul: 'tul_perception', fokusz: 'fok_perception_searching', kezi: true });
ellenoriz(d.mire === 'Észlelés (Keresés)' && d.modosito === 4 && d.eredmeny === 'siker' && d.mutatvanypont === 4 && d.kezi && d.reszletek.osszetevok.length === 2 && d.id.startsWith('d_'), 'a naplóba küldött dobás', d);
ellenoriz(P.naploDobas({ kockak: [1, 2, 3] }).celertek === undefined, 'ismeretlen Célérték nem kerül a dobásba');
ellenoriz(P.karakterKampanya({ kampanyok: ['c2'] }, [{ id: 'c1', allapot: 'folyamatban' }, { id: 'c2', allapot: 'folyamatban' }]).id === 'c2', 'a karakter kampánya');
ellenoriz(P.karakterKampanya({ kampanyok: ['c1'] }, [{ id: 'c1', allapot: 'archivált' }]) === null && P.karakterKampanya({ kampanyok: [] }, []) === null, 'archivált vagy hiányzó kampány: nincs');
ellenoriz(P.celertekNev(13) === 'Kihívó' && P.CELERTEKEK.length === 8 && P.KUSZOBOK.length === 5, 'Célérték- és küszöbtáblák');

// ---------- Valódi számolóval: ember harcos ----------
const k = uresKarakter({ nev: 'Brigitte', forrasok: ['Alapkönyv', 'Companion'] });
Object.assign(k, { faj: 'faj_human', osztaly: 'osz_warrior' });
k.tulajdonsag_alap = { tul_accuracy: 1, tul_communication: 0, tul_constitution: 2, tul_dexterity: 1, tul_fighting: 2, tul_intelligence: 0, tul_perception: 2, tul_strength: 3, tul_willpower: 2 };
k.hatter = { rendszer: 'alap', id: 'hat_soldier', mod: 'dobas', osztaly_dobas: 2, hatter_dobas: 5, fokusz: 'fok_communication_gambling' };
k.faj_dontes = { fokusz: 'fok_dexterity_riding', elonyok: [{ dobas: 5 }, { dobas: 7 }] };
k.szintek = [{ ...uresSzint(1), egeszseg_dobas: 4, kapott: [{ tipus: 'talentum', id: 'tal_armor_training' }] }];
k.felszereles = { targyak: [], kezdo_fegyverek: ['fgy_two_handed_axe'], vasarolt: [], penz_dobas: 12 };
k.keszites.allapot = 'kesz';
felszerelesFrissit(k, LAPOK);
const valodi = karakterSzamol(k, LAPOK);
const keres = P.probaOsszeallit(valodi, { tul: 'tul_perception', fokusz: P.fokuszAjanlas(valodi, ['fok_perception_searching', 'fok_perception_hearing']) });
ellenoriz(keres.van_fokusz && keres.bonusz === valodi.tulajdonsagok.tul_perception.ertek + 2, 'a harcos Keresés fókusza (faji előny) az ajánlásban és a bónuszban', keres);
ellenoriz(!P.probaOsszeallit(valodi, { tul: 'tul_dexterity' }).reszek.some((r) => r.eredet === 'Páncélbüntetés'), 'Páncélviselettel nincs Ügyesség-büntetés');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzés)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
