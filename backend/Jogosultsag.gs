// Jogosultsági szabályok (lásd claude/alapozas-terv.md, 1. pont).
//
// DM: mindent lát és szerkeszt.
// Mesterjátékos: kampányonkénti szerep; a kampány összes karakterét látja és szerkeszti.
// Játékos: a hozzá társított karaktereket látja és szerkeszti.
// Játékos nélküli karakter: a DM és a kampány mesterjátékosa kezeli.

// Egyszerre olvassa be a jogosultsághoz kellő lapokat, hogy egy kérés ne olvassa többször ugyanazt.
function kornyezet_() {
  return {
    karakterek: sorok_('jatek', 'Karakterek'),
    kampanyok: sorok_('jatek', 'Kampányok'),
    kapcsolatok: sorok_('jatek', 'Kampánykarakterek')
  };
}

function mesterKampanyai_(felh, k) {
  return k.kampanyok.filter(function (x) { return x.mesterjatekos_id && x.mesterjatekos_id === felh.u; })
    .map(function (x) { return x.id; });
}

function karakterKampanyai_(karakterId, k) {
  return k.kapcsolatok.filter(function (x) { return x.karakter_id === karakterId; })
    .map(function (x) { return x.kampany_id; });
}

function karakterIrhato_(felh, kar, k) {
  if (felh.r === 'dm') return true;
  if (kar.jatekos_id && kar.jatekos_id === felh.u) return true;
  const mester = mesterKampanyai_(felh, k);
  return karakterKampanyai_(kar.id, k).some(function (id) { return mester.indexOf(id) >= 0; });
}

// A felhasználó szerepe egy kampányban: 'dm', 'mester', 'jatekos' vagy null (nincs köze hozzá).
function kampanySzerep_(felh, kampany, k) {
  if (felh.r === 'dm') return 'dm';
  if (kampany.mesterjatekos_id && kampany.mesterjatekos_id === felh.u) return 'mester';
  const sajat = k.karakterek.filter(function (c) { return c.jatekos_id === felh.u; }).map(function (c) { return c.id; });
  const benne = k.kapcsolatok.some(function (x) { return x.kampany_id === kampany.id && sajat.indexOf(x.karakter_id) >= 0; });
  return benne ? 'jatekos' : null;
}

function kampanyKeresese_(id, k) {
  const kampany = k.kampanyok.find(function (x) { return x.id === id; });
  if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
  return kampany;
}

function karakterKeresese_(id, k) {
  const kar = k.karakterek.find(function (x) { return x.id === id; });
  if (!kar) throw hiba_('nem_talalhato', 'Nincs ilyen karakter.');
  return kar;
}
