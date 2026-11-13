// A kezdő felszerelés összeállítása az osztály `kezdo_csomag` adatából (Import 08, Alapkönyv 28. o.).
import { reszletek, index } from './szabalyindex.js';

// Visszaadja: { targyak: [{ id, db, felszerelve }], fegyver_db, pancel, hianyzo: [id] }
// fegyverek: a választott fegyverek azonosítói; talentumok: a karakter talentumainak azonosítói.
export function kezdoCsomag(lapok, osztalyId, fegyverek = [], talentumok = []) {
  const ix = index(lapok);
  const cs = reszletek(ix.elem('Osztályok', osztalyId)).kezdo_csomag;
  if (!cs) return { targyak: [], fegyver_db: 0, pancel: null, hianyzo: [] };
  const targyak = [];
  const ad = (id, felszerelve) => {
    const meglevo = targyak.find((t) => t.id === id);
    if (meglevo) meglevo.db += 1;
    else targyak.push({ id, db: 1, felszerelve: !!felszerelve });
  };
  (cs.targyak || []).forEach((id) => ad(id, false));
  if (cs.pancel) ad(cs.pancel, true);
  fegyverek.slice(0, cs.fegyver_db || 0).forEach((id, i) => ad(id, i === 0));
  (cs.feltetelek || []).forEach((f) => {
    const teljesul = (f.ha_fegyver && f.ha_fegyver.some((id) => fegyverek.includes(id)))
      || (f.ha_talentum && talentumok.includes(f.ha_talentum));
    if (teljesul) (f.targyak || []).forEach((id) => { if (!targyak.some((t) => t.id === id)) ad(id, id.startsWith('pan_')); });
  });
  const hianyzo = targyak.map((t) => t.id).filter((id) => !ix.elem(id.startsWith('fgy_') ? 'Fegyverek' : id.startsWith('pan_') ? 'Páncélok' : 'Felszerelés', id));
  return { targyak, fegyver_db: cs.fegyver_db || 0, pancel: cs.pancel || null, hianyzo };
}
