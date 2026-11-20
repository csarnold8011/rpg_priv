// Kampányjátszó 6.1: a karakterlap jegyzetei és a pénz bevitele (tiszta függvények).
// A jegyzetek a karakter adatában vannak (adat.jegyzetek), így a karakterrel utaznak (minden kampányban ugyanazok).
// A módosítások azonosító szerint dolgoznak, így a karakterlap ütközéskori összefésülése (a függő módosítások újra
// alkalmazása a máshol mentett változatra) jegyzetenként működik: két eszközön írt két jegyzet mind megmarad.

export const MAX_JEGYZET_SZOVEG = 5000;
export const FIGYELMEZTETES_HATAR = 30000; // karakter: e fölött figyelmeztet (a táblázat cellája 50 000)

const str = (x) => (x === undefined || x === null ? '' : String(x));
const lista = (adat) => (Array.isArray(adat.jegyzetek) ? adat.jegyzetek : (adat.jegyzetek = []));

export const ujJegyzetId = () => 'j' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// A jegyzetek megjelenítési sorrendben: a rögzítettek elöl, azon belül a legújabb elöl.
export function jegyzetek(adat) {
  return (Array.isArray(adat && adat.jegyzetek) ? adat.jegyzetek : []).slice()
    .sort((a, b) => (b.rogzitett ? 1 : 0) - (a.rogzitett ? 1 : 0) || str(b.idopont).localeCompare(str(a.idopont)));
}

export function jegyzetHozzaad(adat, { id, cim = '', szoveg = '', ki = '', idopont } = {}) {
  const l = lista(adat);
  const azon = id || ujJegyzetId();
  if (l.some((j) => j.id === azon)) return azon; // ismételt alkalmazás (összefésülés)
  l.push({ id: azon, cim: str(cim).slice(0, 200), szoveg: str(szoveg).slice(0, MAX_JEGYZET_SZOVEG), idopont: idopont || new Date().toISOString(), ki: str(ki), rogzitett: false });
  return azon;
}

export function jegyzetModosit(adat, id, x) {
  const j = lista(adat).find((y) => y.id === id);
  if (!j) return false; // máshol törölték: nincs mit módosítani
  if (x.cim !== undefined) j.cim = str(x.cim).slice(0, 200);
  if (x.szoveg !== undefined) j.szoveg = str(x.szoveg).slice(0, MAX_JEGYZET_SZOVEG);
  if (x.rogzitett !== undefined) j.rogzitett = !!x.rogzitett;
  if (x.ki !== undefined) j.ki = str(x.ki);
  j.modositva = x.modositva || new Date().toISOString();
  return true;
}

export function jegyzetTorol(adat, id) {
  const l = lista(adat);
  const i = l.findIndex((j) => j.id === id);
  if (i < 0) return null;
  return l.splice(i, 1)[0];
}

// Visszavonás: a törölt jegyzet visszakerül (ha közben nem került vissza).
export function jegyzetVissza(adat, jegyzet) {
  const l = lista(adat);
  if (jegyzet && !l.some((j) => j.id === jegyzet.id)) l.push({ ...jegyzet });
}

export function jegyzetMeret(adat) {
  return (Array.isArray(adat && adat.jegyzetek) ? adat.jegyzetek : []).reduce((n, j) => n + str(j.cim).length + str(j.szoveg).length + 80, 0);
}

// ---- Pénz ----

const nemNeg = (x) => Math.max(0, parseInt(String(x === undefined || x === null ? '' : x).replace(/[^0-9]/g, ''), 10) || 0);

// Arany, ezüst, réz mezőkből rézben (1 arany = 10 ezüst = 100 réz).
export function penzRezben(x) {
  const o = x || {};
  return nemNeg(o.a) * 100 + nemNeg(o.e) * 10 + nemNeg(o.r);
}

// Gyorsösszeg hozzáadása a bevitelhez (ezüstben), a mezők szövegesek maradnak.
export function penzHozzaad(x, ezust) {
  const o = x || {};
  return { ...o, e: String(nemNeg(o.e) + ezust) };
}

// A legutóbbi pénztételek (a felszerelés játék közbeni naplójából), a legújabb elöl.
export function utolsoPenztetelek(adat, n = 3) {
  const t = (adat && adat.felszereles && Array.isArray(adat.felszereles.jatek) ? adat.felszereles.jatek : []);
  return t.filter((x) => x && x.penz).slice(-n).reverse();
}
