// Dobásnapló és megosztások. A kocka a böngészőben gurul, ide csak az eredmény érkezik.

// action: roll.log
// adat: { kampany_id, karakter_id?, mire, kockak: [k1, k2, sarkanykocka], modosito, celertek?, eredmeny?, mutatvanypont?, rejtett? }
function dobasNaplozasa_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  if (!Array.isArray(a.kockak) || a.kockak.length < 1) throw hiba_('hianyzo_adat', 'Hiányoznak a kockák.');
  return zarolva_(function () {
    const k = kornyezet_();
    const kampany = kampanyKeresese_(a.kampany_id, k);
    const szerep = kampanySzerep_(felh, kampany, k);
    if (!szerep) throw hiba_('nincs_jogosultsag', 'Nem vagy tagja ennek a kampánynak.');
    // kiesés utáni újraküldésnél ne kerüljön be kétszer ugyanaz a dobás
    if (a.id) {
      const megvan = utolsoSorok_('jatek', 'Dobásnapló', 200).find(function (d) { return d.id === a.id; });
      if (megvan) { delete megvan._sor; return { dobas: megvan, kampany_verziok: {} }; }
    }
    const dobas = {
      id: a.id || ujId_('d'), idopont: most_(), kampany_id: kampany.id, karakter_id: a.karakter_id || '',
      dobta: felh.n, mire: a.mire || '', kockak: a.kockak, modosito: Number(a.modosito) || 0,
      celertek: a.celertek === undefined ? '' : a.celertek, eredmeny: a.eredmeny || '',
      mutatvanypont: Number(a.mutatvanypont) || 0,
      rejtett: szerep === 'dm' && !!a.rejtett // rejtett dobás csak a DM-é lehet
    };
    sorHozzaadasa_('jatek', 'Dobásnapló', dobas);
    // a rejtett dobás nem jelez változást a játékosoknak
    const verziok = dobas.rejtett ? {} : kampanyVerziokNovelese_([kampany.id], k.kampanyok);
    return { dobas: dobas, kampany_verziok: verziok };
  });
}

// action: share.send (DM)
// adat: { kampany_id, cimzett: 'mindenki' | karakter_id, tipus: 'kep' | 'level' | 'szoveg', cim, hivatkozas }
function megosztasKuldese_(a, felh) {
  if (!a.kampany_id) throw hiba_('hianyzo_adat', 'Hiányzik a kampány azonosítója.');
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    if (!kampanyok.some(function (x) { return x.id === a.kampany_id; })) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    const m = {
      id: ujId_('m'), kampany_id: a.kampany_id, cimzett: a.cimzett || 'mindenki', tipus: a.tipus || 'szoveg',
      cim: a.cim || '', hivatkozas: a.hivatkozas || '', idopont: most_()
    };
    sorHozzaadasa_('jatek', 'Megosztások', m);
    kampanyVerziokNovelese_([a.kampany_id], kampanyok);
    return { megosztas: m };
  });
}
