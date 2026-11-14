// Arkánumok és varázslatok: egy arkánum egy fokozatához járó varázslatok.
// Ha a választási szabály forrása (Companion) aktív, a felsoroltak közül `db` választható (Kezdő fokon a
// Kezdő varázslatok, Haladó fokon a Kezdő és Haladó varázslatok közül, és így tovább); különben a fix
// varázslatok járnak (az Alapkönyv szerinti `alap_varazslatok`, vagy az Alapkönyvből származók).
import { szam, reszletek } from './szabalyindex.js';

export function fokozatVarazslatok(ix, arkanumId, fokozat, forrasok) {
  const r = reszletek(ix.elem('Arkánumok', arkanumId));
  const szabalyForras = r.valasztas_forras || 'Companion';
  const valaszthato = !forrasok || !forrasok.length || forrasok.includes(szabalyForras);
  const v = (r.valasztas || {})[fokozat] || {};
  const fokozatok = v.fokozatok || [fokozat];
  const osszes = (fok) => (r.varazslatok || {})[fok]
    || ix.lista('Varázslatok').filter((x) => x.arkanum === arkanumId && x.fokozat === fok).map((x) => x.id);
  const letezo = (lista) => lista.filter((id, i) => ix.elem('Varázslatok', id) && lista.indexOf(id) === i);
  if (valaszthato) return { valaszthato: true, db: szam(v.db, fokozat === 'Kezdő' ? 2 : 1), lista: letezo([].concat(...fokozatok.map(osszes))) };
  const alap = (r.alap_varazslatok || {})[fokozat];
  const fix = letezo(alap || osszes(fokozat).filter((id) => (ix.elem('Varázslatok', id) || {}).forras === 'Alapkönyv'));
  return { valaszthato: false, db: fix.length, lista: fix };
}
