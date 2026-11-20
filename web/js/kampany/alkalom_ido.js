// Kampányjátszó 6.4: az alkalom címe és időpontjai szövegként. Külön modul, hogy a játékos Kalandnapló füle a
// Játék nézet függvényei nélkül is betölthető legyen (a web/js/kampany/alkalom.js újraexportálja).

const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const van = (x) => !!szoveg(x).trim();

// „3. alkalom: A híd” (cím nélkül „3. alkalom”).
export const alkalomCim = (a) => (a ? (Number(a.sorszam) || 1) + '. alkalom' + (van(a.cim) ? ': ' + a.cim.trim() : '') : '');

const datumSz = (iso) => {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return '';
  const k = (n) => String(n).padStart(2, '0');
  return d.getFullYear() + '. ' + k(d.getMonth() + 1) + '. ' + k(d.getDate()) + '.';
};
const oraSz = (iso) => {
  const d = new Date(iso);
  if (!iso || isNaN(d)) return '';
  return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
};
export function valosIdoSzoveg(a) {
  if (!a || !a.kezdet) return '';
  const k = datumSz(a.kezdet);
  if (!a.veg) return k + ', ' + oraSz(a.kezdet) + ' óta';
  const v = datumSz(a.veg);
  return k + ', ' + oraSz(a.kezdet) + '–' + (v !== k ? v + ' ' : '') + oraSz(a.veg);
}
export function jatekbeliIdoSzoveg(a) {
  const k = szoveg(a && a.jatekbeli_datum).trim();
  const v = szoveg(a && a.jatekbeli_veg).trim();
  if (k && v && k !== v) return k + ' → ' + v;
  return k || v;
}
