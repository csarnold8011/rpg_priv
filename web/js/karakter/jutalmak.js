// Kampányjátszó 6.5: a karakter jutalmai (tiszta függvények).
// A kiosztott jutalmak a karakter adatában vannak (adat.jutalmak), a háttér írja őket (reward.give, Jutalmak.gs).
// Egy bejegyzés: { id, kiosztas_id, fajta: cim | tagsag | targy | ereklye | tars | egyeb, nev, leiras?, idopont, ki,
//   kampany_id, jutalom_id?, ... a fajta mezői (a jutalom elem adatából, lásd web/js/kampany/kioszt.js) }.
// A mágikus tárgy a leltárban egyedi azonosítóval van (`fgy_longsword~ko_abc123`); a ~ előtti rész a szabályadat
// eleme (fegyver, páncél, pajzs), így a fegyverek és a páncél számolása látja, a bejegyzés `targy_id` mezője köti össze.
import { ereklyeAllapot, EREKLYE_FAJTAK } from '../kampany/jutalom.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const szam = (x) => (Number.isFinite(Number(x)) ? Number(x) : 0);

export const FAJTA_NEVEK = { cim: 'Cím', tagsag: 'Tagság', targy: 'Mágikus tárgy', ereklye: 'Ereklye', tars: 'Társ', egyeb: 'Egyéb' };
export const FAJTA_SORREND = ['cim', 'tagsag', 'ereklye', 'targy', 'tars', 'egyeb'];

// A tárgy azonosítójából a szabályadat azonosítója (a ~ előtti rész).
export const alapId = (id) => String(id || '').split('~')[0];
export const egyediE = (id) => String(id || '').includes('~');

// A jutalmak a megjelenítés sorrendjében (fajta, azon belül a legújabb elöl).
export function jutalmak(adat) {
  return lista(adat && adat.jutalmak).filter((j) => j && typeof j === 'object').slice()
    .sort((a, b) => FAJTA_SORREND.indexOf(a.fajta) - FAJTA_SORREND.indexOf(b.fajta) || String(b.idopont || '').localeCompare(String(a.idopont || '')));
}

// Egy leltárbeli tárgy jutalombejegyzése (mágikus tárgy, ereklye), vagy null.
export function targyJutalma(adat, targyId) {
  if (!targyId) return null;
  return lista(adat && adat.jutalmak).find((j) => j && j.targy_id === targyId) || null;
}

// A tárgy számszerű mágikus előnyei, ha a tárgy nem ideiglenes: { tamadas, sebzes, pancel, vedekezes }.
// A többi előny (tulajdonság, fókusz, talentum, védelem stb.) csak leírás a lapon.
export function magikusBonuszok(j) {
  const o = { tamadas: 0, sebzes: 0, pancel: 0, vedekezes: 0 };
  if (!j || j.tartos === 'ideiglenes') return o;
  lista(j.elonyok).forEach((e) => { if (e && Object.prototype.hasOwnProperty.call(o, e.tipus)) o[e.tipus] += szam(e.ertek); });
  return o;
}

// Az ereklye képességei a viselő szintjén: [{ nev, leiras, szint, nyitva }]. A zárt és a vegyes ereklye feltételét a DM
// jelöli a karakterlapon (feltetel_teljesult).
export function ereklyeKepessegek(j, szint) {
  if (!j || !j.ereklye || !EREKLYE_FAJTAK[j.ereklye.fajta] || j.ereklye.fajta === 'nincs') return [];
  return ereklyeAllapot(j, szint, !!j.feltetel_teljesult);
}

// Szintlépéskor újonnan nyíló képességek: ami az új szinten nyitva van, a régin még nem.
export function ujKepessegek(j, regiSzint, ujSzint) {
  const regi = ereklyeKepessegek(j, regiSzint);
  return ereklyeKepessegek(j, ujSzint).filter((k, i) => k.nyitva && !(regi[i] && regi[i].nyitva));
}

// A karakter összes ereklyéjén a következő szinten nyíló képességek száma (a szintlépés jelzéséhez).
export function kovetkezoSzintenNyilik(adat, szint) {
  return lista(adat && adat.jutalmak).filter((j) => j && j.fajta === 'ereklye')
    .reduce((n, j) => n + ujKepessegek(j, szint, szint + 1).length, 0);
}

// Egy bejegyzés módosítása (a DM a karakterlapon: a feltétel teljesült, jegyzet). Azonosító szerint, összefésülhetően.
export function jutalomModosit(adat, id, x) {
  const j = lista(adat && adat.jutalmak).find((y) => y && y.id === id);
  if (!j) return false;
  if (x.feltetel_teljesult !== undefined) j.feltetel_teljesult = !!x.feltetel_teljesult;
  if (x.jegyzet !== undefined) j.jegyzet = String(x.jegyzet || '').slice(0, 1000);
  if (x.kezi_felveve !== undefined) j.kezi_felveve = !!x.kezi_felveve;
  return true;
}

// A cím bónuszának rövid szövege („+1 Meggyőzés nemesekkel”), vagy ''.
export function cimBonuszSzoveg(j) {
  if (!j || j.fajta !== 'cim') return '';
  const b = szam(j.bonusz);
  if (j.hatas_mod === 'bonusz' && b) return (b > 0 ? '+' : '−') + Math.abs(b) + (j.mire ? ' ' + j.mire : '');
  return '';
}
