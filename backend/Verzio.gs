// Kampányverziók: minden változás növeli az érintett kampány verziószámát.
// A felületek csak ezt kérdezik pár másodpercenként (state.poll), gyorsítótárból.

function kampanyVerzio_(id) {
  const c = CacheService.getScriptCache();
  const v = c.get('kv_' + id);
  if (v !== null) return Number(v);
  const kampany = sorok_('jatek', 'Kampányok').find(function (x) { return x.id === id; });
  if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
  const szam = Number(kampany.verzio) || 0;
  c.put('kv_' + id, String(szam), 21600);
  return szam;
}

// Zárolás alatt hívandó. kampanyok: a már beolvasott Kampányok sorok (ha van), ids: érintett kampányok.
function kampanyVerziokNovelese_(ids, kampanyok) {
  if (!ids || !ids.length) return {};
  const lista = kampanyok || sorok_('jatek', 'Kampányok');
  const c = CacheService.getScriptCache();
  const uj = {};
  ids.forEach(function (id) {
    const kampany = lista.find(function (x) { return x.id === id; });
    if (!kampany) return;
    const v = (Number(kampany.verzio) || 0) + 1;
    kampany.verzio = v;
    cellaIrasa_('jatek', 'Kampányok', kampany._sor, 'verzio', v);
    c.put('kv_' + id, String(v), 21600);
    uj[id] = v;
  });
  return uj;
}

// action: state.poll   adat: { kampany_id }
// adat: { kampany_id, ismert?: a kliens verziója, teljes?: igaz }. Ha a teljes kérés és a verzió eltér az ismerttől,
// a válasz rögtön a kampány állapotát is hozza (state.get), így a változás egy hívással megérkezik.
function allapotFigyeles_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  const verzio = kampanyVerzio_(a.kampany_id);
  if (a.teljes && a.ismert !== undefined && a.ismert !== null && Number(a.ismert) !== Number(verzio)) {
    return { verzio: verzio, allapot: allapotLekerese_({ kampany_id: a.kampany_id }, felh) };
  }
  return { verzio: verzio };
}
