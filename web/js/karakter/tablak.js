// A karakterkészítés rögzített táblái. Ahol a szabályadatbázis tartalmazza ugyanezt
// (például a Szintlépés lap szint_altalanos sora), onnan olvasunk, ez csak tartalék.
import { szam, reszletek, tartomanyban } from './szabalyindex.js';

export const SEMA_VERZIO = 1;

// A karakterlap sorrendje (a Tulajdonságok lap `sorrend` oszlopa szerint is ez).
export const TULAJDONSAGOK = [
  'tul_accuracy', 'tul_communication', 'tul_constitution', 'tul_dexterity', 'tul_fighting',
  'tul_intelligence', 'tul_perception', 'tul_strength', 'tul_willpower'
];

export const FOKOZATOK = ['Kezdő', 'Haladó', 'Mester'];
export const fokozatNev = (db) => FOKOZATOK[Math.max(0, Math.min(db, 3) - 1)] || null;
export const fokozatSzam = (nev) => FOKOZATOK.indexOf(nev) + 1; // Kezdő → 1, ismeretlen → 0

// 3d6 összegből kezdő tulajdonság (Alapkönyv 11. o.).
const TULAJDONSAG_DOBAS = { '3': -2, '4-5': -1, '6-8': 0, '9-11': 1, '12-14': 2, '15-17': 3, '18': 4 };

export function tulajdonsagDobasbol(osszeg, ix) {
  const alt = ix ? reszletek(ix.elem('Szintlépés', 'szint_altalanos')) : {};
  const tabla = alt.tulajdonsag_dobas || TULAJDONSAG_DOBAS;
  const kulcs = Object.keys(tabla).find((k) => tartomanyban(k, osszeg));
  return kulcs === undefined ? null : szam(tabla[kulcs]);
}

// Egy tulajdonság új értékének ára fejlesztésben (Alapkönyv 27. o.).
export function fejlesztesKoltseg(ujErtek) {
  if (ujErtek <= 5) return 1;
  if (ujErtek <= 8) return 2;
  return 3;
}

// Társadalmi osztály 1d6-ra (Alapkönyv 16. o.) és a kezdőpénz alapja ezüstben (28. o.), mindkettőhöz + 3d6.
export const TARSADALMI_OSZTALY = [
  { dobas: '1', osztaly: 'Kívülálló' }, { dobas: '2-3', osztaly: 'Alsó' },
  { dobas: '4-5', osztaly: 'Közép' }, { dobas: '6', osztaly: 'Felső' }
];
const KEZDO_PENZ_ALAP = { 'Kívülálló': 15, 'Alsó': 25, 'Közép': 50, 'Felső': 100 };

export function tarsadalmiOsztalyDobasbol(d6, ix) {
  const alt = ix ? reszletek(ix.elem('Szintlépés', 'szint_altalanos')) : {};
  const tabla = alt.tarsadalmi_osztaly_dobas || TARSADALMI_OSZTALY;
  const sor = tabla.find((s) => tartomanyban(s.dobas, d6));
  return sor ? sor.osztaly : null;
}

// Kezdőpénz rézben: (alap + 3d6) ezüst. A dobás a 3d6 összege.
export function kezdoPenzRez(osztaly, dobas3d6, ix) {
  const alt = ix ? reszletek(ix.elem('Szintlépés', 'szint_altalanos')) : {};
  const szoveg = (alt.kezdo_penz_ezust || {})[osztaly];
  const alap = szoveg !== undefined ? szam(String(szoveg).split('+')[0]) : KEZDO_PENZ_ALAP[osztaly];
  if (alap === undefined) return null;
  return (alap + szam(dobas3d6)) * 10;
}
