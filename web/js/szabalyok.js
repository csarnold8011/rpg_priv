// A szabályadatbázis böngészőbeli tárolása (IndexedDB). Az oldal megnyitásakor csak a
// verziószámot kérdezi le; teljes letöltés csak akkor van, ha a verzió változott.

const DB_NEV = 'fage';
const TAR = 'szabalyok';

function dbNyitas() {
  return new Promise((ok, hiba) => {
    const k = indexedDB.open(DB_NEV, 1);
    k.onupgradeneeded = () => k.result.createObjectStore(TAR);
    k.onsuccess = () => ok(k.result);
    k.onerror = () => hiba(k.error);
  });
}

async function helyiOlvasas() {
  try {
    const db = await dbNyitas();
    return await new Promise((ok) => {
      const k = db.transaction(TAR).objectStore(TAR).get('aktualis');
      k.onsuccess = () => ok(k.result || null);
      k.onerror = () => ok(null);
    });
  } catch (e) { return null; }
}

async function helyiIras(ertek) {
  try {
    const db = await dbNyitas();
    db.transaction(TAR, 'readwrite').objectStore(TAR).put(ertek, 'aktualis');
  } catch (e) { /* ha nincs IndexedDB, legközelebb újra letölti */ }
}

// Visszaadja: { verzio, lapok, forras: 'helyi' | 'letoltve' }
export async function szabalyokBetoltese(api) {
  const helyi = await helyiOlvasas();
  let szerverVerzio = null;
  try {
    szerverVerzio = (await api.hivas('rules.version')).verzio;
  } catch (e) {
    if (helyi) return Object.assign({ forras: 'helyi' }, helyi); // kiesés alatt a helyi példány is jó
    throw e;
  }
  if (helyi && helyi.verzio === szerverVerzio) return Object.assign({ forras: 'helyi' }, helyi);
  const v = await api.hivas('rules.get');
  const uj = { verzio: v.verzio, lapok: v.lapok };
  await helyiIras(uj);
  return Object.assign({ forras: 'letoltve' }, uj);
}

// Egy kampány aktív forrásai szerint szűr (forráscímke: Alapkönyv, Companion, Bestiárium, Kampányépítő, Házi).
export function forrasSzerint(lapok, aktivForrasok) {
  if (!aktivForrasok || !aktivForrasok.length) return lapok;
  const ki = {};
  Object.keys(lapok).forEach(nev => {
    ki[nev] = lapok[nev].filter(e => !e.forras || e.forras === 'Házi' || aktivForrasok.includes(e.forras));
  });
  return ki;
}

// Megjelenítési név: „magyar név (angol név)”
export function megjelenitettNev(elem) {
  if (!elem) return '';
  return elem.nev_en && elem.nev_en !== elem.nev_hu ? `${elem.nev_hu} (${elem.nev_en})` : (elem.nev_hu || elem.nev_en || '');
}
