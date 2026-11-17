// Kampányépítő (5. lépés, 5.1 alépés): világok, elemek (sablon, világelem, kampányelem), kapcsolatok és a
// kampánykeret. Terv: claude/kampanyepito-terv.md. Minden művelet csak a DM-é. Az öröklés, a fa, a kapcsolatok
// és a keret logikája a felületen van (web/js/kampany/), itt tárolás, verziózás és a szerkezet ellenőrzése.
// Az előkészítés nem növeli a kampány verzióját (a játékosok state.poll hívását nem terheli), kivéve ha a keret
// játékosoknak szóló része (bemutatás, szintsáv, karakterkészítési ajánlások) változik.

const ELEM_SZULOK = {
  kaland: [], resz: ['kaland', 'resz'], jelenet: ['kaland', 'resz'], helyszin: ['helyszin'], csoport: ['csoport'],
  jutalom: [], istenseg: [], keret: []
};
const KAPCSOLAT_TIPUSOK = ['kovetkezik', 'feltetele', 'itt_tortenik', 'szerepel', 'jutalma', 'resze', 'tagja', 'vezeti',
  'tulajdonosa', 'imadja', 'szovetsegese', 'ellensege', 'baratja', 'szeretoje', 'hazastarsa', 'testvere', 'unokatestvere',
  'szulo_gyermek', 'nagyszulo_unoka', 'nagybacsi_unokaocs', 'egyeb'];
const MAX_ELEM_MERET = 48000;
const ELEM_ID_MINTA = /^el_[a-z0-9]{6,24}$/;
const VILAG_ID_MINTA = /^w_[a-z0-9]{6,24}$/;
const LINK_ID_MINTA = /^ln_[a-z0-9]{6,24}$/;
const SZINT_RANG_ = { sablon: 0, vilag: 1, kampany: 2 };

function epitoSorok_(nev) {
  try { return sorok_('jatek', nev); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function objektum_(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }

function vilagNezet_(w) {
  return { id: w.id, nev: w.nev || '', adat: objektum_(w.adat), verzio: Number(w.verzio) || 0, modositva: w.modositva || '',
    modositotta: w.modositotta || '', aktiv: igaz_(w.aktiv) };
}

function elemNezet_(e) {
  return { id: e.id, tipus: e.tipus, nev: e.nev || '', vilag_id: e.vilag_id || '', kampany_id: e.kampany_id || '',
    alap_id: e.alap_id || '', szulo_id: e.szulo_id || '', sorrend: Number(e.sorrend) || 0, adat: objektum_(e.adat),
    verzio: Number(e.verzio) || 0, modositva: e.modositva || '', modositotta: e.modositotta || '', aktiv: igaz_(e.aktiv) };
}

function kapcsolatNezet_(k) {
  return { id: k.id, honnan: k.honnan, hova: k.hova, tipus: k.tipus, megjegyzes: k.megjegyzes || '',
    vilag_id: k.vilag_id || '', kampany_id: k.kampany_id || '', aktiv: igaz_(k.aktiv) };
}

function elemSzint_(e) { return e.kampany_id ? 'kampany' : e.vilag_id ? 'vilag' : 'sablon'; }

// ---- A kampánykeret ----

function keretAdat_(kampany) {
  const k = objektum_(kampany && kampany.keret);
  const o = {};
  Object.keys(k).forEach(function (m) { if (m !== '_verzio') o[m] = k[m]; });
  return o;
}
function keretVerzio_(kampany) { return Number(objektum_(kampany && kampany.keret)._verzio) || 0; }

// A keret játékosoknak szóló része (ugyanaz, mint a felületen: web/js/kampany/keret.js jatekosoknak). Üresen null.
const AJANLAS_KATEGORIAK_ = ['fajok', 'hatterek', 'osztalyok', 'fokuszok', 'talentumok', 'arkanumok', 'specializaciok'];
function keretJatekosoknak_(k) {
  const lista = function (x) { return Array.isArray(x) ? x.filter(function (y) { return y !== null && y !== undefined && y !== ''; }).map(String) : []; };
  const aj = objektum_(k.ajanlasok);
  const ajanlasok = {};
  AJANLAS_KATEGORIAK_.forEach(function (c) {
    const x = objektum_(aj[c]);
    const a1 = lista(x.ajanlott), k1 = lista(x.kizart);
    if (a1.length || k1.length) ajanlasok[c] = { ajanlott: a1, kizart: k1 };
  });
  const o = { bemutatas: String(objektum_(k.kalandra_hivas).jatekosoknak || ''), ajanlasok: ajanlasok, jegyzet: String(aj.jegyzet || '') };
  const sav = objektum_(k.szintsav);
  const kezdo = Number(sav.kezdo) || 1, zaro = Number(sav.zaro) || 20;
  if (kezdo !== 1 || zaro !== 20) o.szintsav = { kezdo: kezdo, zaro: zaro };
  if (!o.bemutatas && !Object.keys(ajanlasok).length && !o.jegyzet && !o.szintsav) return null;
  return o;
}

// action: campaign.frame.save (DM)   adat: { id: kampány, verzio, keret }
// A keret saját verziót kap (a JSON _verzio mezője). Ütközésnél a válasz az aktuális keretet hozza.
function keretMentese_(a, felh) {
  return zarolva_(function () {
    const kampanyok = sorok_('jatek', 'Kampányok');
    const kampany = kampanyok.find(function (x) { return x.id === a.id; });
    if (!kampany) throw hiba_('nem_talalhato', 'Nincs ilyen kampány.');
    const regiVerzio = keretVerzio_(kampany);
    const regi = keretAdat_(kampany);
    if (a.verzio !== undefined && a.verzio !== null && Number(a.verzio) !== regiVerzio) {
      throw hiba_('utkozes', 'A kampánykeretet közben más is módosította.', { aktualis: { keret: regi, verzio: regiVerzio } });
    }
    if (!a.keret || typeof a.keret !== 'object' || Array.isArray(a.keret)) throw hiba_('hibas_adat', 'Hibás kampánykeret.');
    if (JSON.stringify(a.keret).length > MAX_ELEM_MERET) throw hiba_('tul_nagy', 'A kampánykeret túl nagy egy cellához.');
    if (a.keret.vilag_id && !epitoSorok_('Világok').some(function (w) { return w.id === a.keret.vilag_id; })) {
      throw hiba_('hibas_adat', 'Nincs ilyen világ.');
    }
    const uj = {};
    Object.keys(a.keret).forEach(function (m) { if (m !== '_verzio') uj[m] = a.keret[m]; });
    const jatekosValtozott = JSON.stringify(keretJatekosoknak_(regi)) !== JSON.stringify(keretJatekosoknak_(uj));
    uj._verzio = regiVerzio + 1;
    kampany.keret = uj;
    sorFrissitese_('jatek', 'Kampányok', kampany);
    const kv = jatekosValtozott ? kampanyVerziokNovelese_([kampany.id], kampanyok) : {};
    valtozasNaplozasa_(felh, 'keret.ment', kampany.id, regiVerzio, regiVerzio + 1);
    const o = { verzio: regiVerzio + 1, kampany_verziok: kv };
    if (jatekosValtozott) o.kampany = kampanyNezet_(kampany, 'dm');
    return o;
  });
}

// ---- Lekérés ----

// action: prep.get (DM)   adat: { vilag_id?, kampany_id? }
// Egy hívásban: a világok listája, a sablonok, a világ elemei (kampánynál a keret világáé), a kampány elemei,
// a hozzájuk tartozó kapcsolatok, és kampánynál a keret a verziójával. Az elemek alapjai és szülei mindig
// bekerülnek (a lánc és a fa teljes legyen).
function elokeszitesLekerese_(a) {
  let vilagId = a.vilag_id || '';
  let kampany = null;
  if (a.kampany_id) {
    kampany = kampanyKeresese_(a.kampany_id, { kampanyok: sorok_('jatek', 'Kampányok') });
    vilagId = keretAdat_(kampany).vilag_id || '';
  }
  const kell = function (x) {
    if (!x.vilag_id && !x.kampany_id) return true;
    if (vilagId && x.vilag_id === vilagId) return true;
    return !!kampany && x.kampany_id === kampany.id;
  };
  // a kiválasztott elemek alapjai és szülei is jönnek (például ha a kampány egy másik világ elemére épül)
  const mind = epitoSorok_('Elemek');
  const benne = {};
  mind.forEach(function (e) { if (kell(e)) benne[e.id] = true; });
  let valtozott = true, kor = 0;
  while (valtozott && kor++ < 10) {
    valtozott = false;
    mind.forEach(function (e) {
      if (!benne[e.id]) return;
      [e.alap_id, e.szulo_id].forEach(function (r) { if (r && !benne[r]) { benne[r] = true; valtozott = true; } });
    });
  }
  const o = {
    vilag_id: vilagId,
    vilagok: epitoSorok_('Világok').map(vilagNezet_),
    elemek: mind.filter(function (e) { return benne[e.id]; }).map(elemNezet_),
    kapcsolatok: epitoSorok_('Kapcsolatok').filter(kell).map(kapcsolatNezet_)
  };
  if (kampany) o.keret = { kampany_id: kampany.id, keret: keretAdat_(kampany), verzio: keretVerzio_(kampany) };
  return o;
}

// ---- Világ ----

// action: world.save (DM)   adat: { id, uj?, verzio?, nev?, adat?, aktiv? }
// Új világnál az azonosítót a felület adja (w_…), így a mentés optimista lehet; az ismételt küldés nem hoz létre újat.
function vilagMentese_(a, felh) {
  return zarolva_(function () {
    const vilagok = epitoSorok_('Világok');
    let w = vilagok.find(function (x) { return x.id === a.id; });
    if (a.uj) {
      if (w) return { vilag: vilagNezet_(w), verzio: Number(w.verzio) || 0 };
      if (!VILAG_ID_MINTA.test(String(a.id || ''))) throw hiba_('hibas_adat', 'Hibás világazonosító.');
      w = { id: a.id, nev: '', adat: {}, verzio: 0, aktiv: true };
    } else {
      if (!w) throw hiba_('nem_talalhato', 'Nincs ilyen világ.');
      if (a.verzio !== undefined && Number(a.verzio) !== (Number(w.verzio) || 0)) {
        throw hiba_('utkozes', 'A világot közben más is módosította.', { aktualis: vilagNezet_(w) });
      }
    }
    if (a.nev !== undefined) w.nev = String(a.nev || '').trim().slice(0, 120);
    if (a.adat !== undefined) {
      if (!a.adat || typeof a.adat !== 'object' || Array.isArray(a.adat)) throw hiba_('hibas_adat', 'Hibás világadat.');
      if (JSON.stringify(a.adat).length > MAX_ELEM_MERET) throw hiba_('tul_nagy', 'A világ adatai túl nagyok egy cellához.');
      w.adat = a.adat;
    }
    if (a.aktiv !== undefined) w.aktiv = !!a.aktiv;
    if (!w.nev) throw hiba_('hianyzo_adat', 'Adj nevet a világnak.');
    const regi = Number(w.verzio) || 0;
    w.verzio = regi + 1;
    w.modositva = most_();
    w.modositotta = felh.n;
    if (a.uj) sorHozzaadasa_('jatek', 'Világok', w); else sorFrissitese_('jatek', 'Világok', w);
    valtozasNaplozasa_(felh, a.uj ? 'vilag.letrehoz' : 'vilag.ment', w.id, regi, w.verzio);
    return { vilag: vilagNezet_(w), verzio: w.verzio };
  });
}

// ---- Elemek ----

function elemKeresese_(id, elemek) {
  const e = elemek.find(function (x) { return x.id === id; });
  if (!e) throw hiba_('nem_talalhato', 'Nincs ilyen elem.');
  return e;
}

// A szerkezet ellenőrzése (ugyanaz a szabály, mint a felületen: web/js/kampany/elem.js ellenoriz).
function elemEllenorzes_(e, elemek, kampanyok, vilagok) {
  if (!ELEM_SZULOK.hasOwnProperty(e.tipus)) throw hiba_('hibas_adat', 'Ismeretlen elemtípus.');
  if (e.vilag_id && e.kampany_id) throw hiba_('hibas_adat', 'Egy elem vagy világhoz, vagy kampányhoz tartozik.');
  if (e.tipus === 'keret' && (e.vilag_id || e.kampany_id)) throw hiba_('hibas_adat', 'A kampánykeret elemként csak sablon lehet.');
  if (e.vilag_id && !vilagok.some(function (w) { return w.id === e.vilag_id; })) throw hiba_('hibas_adat', 'Nincs ilyen világ.');
  if (e.kampany_id && !kampanyok.some(function (k) { return k.id === e.kampany_id; })) throw hiba_('hibas_adat', 'Nincs ilyen kampány.');
  if (e.alap_id) {
    const al = elemek.find(function (x) { return x.id === e.alap_id; });
    if (!al) throw hiba_('hibas_adat', 'Az alap elem nem található.');
    if (al.tipus !== e.tipus || al.id === e.id || SZINT_RANG_[elemSzint_(al)] >= SZINT_RANG_[elemSzint_(e)]) {
      throw hiba_('hibas_adat', 'Az alap csak azonos típusú, magasabb szintű elem lehet.');
    }
  }
  if (e.szulo_id) {
    const sz = elemek.find(function (x) { return x.id === e.szulo_id; });
    if (!sz) throw hiba_('hibas_adat', 'A szülő elem nem található.');
    if (ELEM_SZULOK[e.tipus].indexOf(sz.tipus) < 0) throw hiba_('hibas_adat', 'Ez az elem nem kerülhet ez alá.');
    const se = elemSzint_(e), ss = elemSzint_(sz);
    const illik = se === 'sablon' ? ss === 'sablon'
      : se === 'vilag' ? ss === 'vilag' && sz.vilag_id === e.vilag_id
      : ss === 'vilag' || (ss === 'kampany' && sz.kampany_id === e.kampany_id);
    if (!illik) throw hiba_('hibas_adat', 'A szülő szintje nem illik az elemhez.');
    let x = sz, n = 0;
    while (x && n++ < 30) {
      if (x.id === e.id) throw hiba_('hibas_adat', 'Az elem nem kerülhet a saját leszármazottja alá.');
      const sid = x.szulo_id;
      x = sid ? elemek.find(function (y) { return y.id === sid; }) : null;
    }
  }
}

function elemAdatEllenorzes_(adat) {
  if (!adat || typeof adat !== 'object' || Array.isArray(adat)) throw hiba_('hibas_adat', 'Hibás elemadat.');
  if (JSON.stringify(adat).length > MAX_ELEM_MERET) throw hiba_('tul_nagy', 'Az elem adatai túl nagyok egy cellához. Bontsd több elemre.');
}

// action: element.save (DM)
// adat: { id, uj?, verzio?, tipus (újnál), vilag_id, kampany_id (újnál), nev?, alap_id?, szulo_id?, sorrend?, adat? }
// A szint (sablon, világ, kampány) csak létrehozáskor adható meg; utána az element.promote vált.
function elemMentese_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    let e = elemek.find(function (x) { return x.id === a.id; });
    if (a.uj) {
      if (e) return { elem: elemNezet_(e), verzio: Number(e.verzio) || 0 }; // ismételt küldés
      if (!ELEM_ID_MINTA.test(String(a.id || ''))) throw hiba_('hibas_adat', 'Hibás elemazonosító.');
      e = { id: a.id, tipus: a.tipus, nev: '', vilag_id: a.vilag_id || '', kampany_id: a.kampany_id || '', alap_id: '',
        szulo_id: '', sorrend: 0, adat: {}, verzio: 0, aktiv: true };
    } else {
      if (!e) throw hiba_('nem_talalhato', 'Nincs ilyen elem.');
      if (a.verzio !== undefined && Number(a.verzio) !== (Number(e.verzio) || 0)) {
        throw hiba_('utkozes', 'Az elemet közben más is módosította.', { aktualis: elemNezet_(e) });
      }
    }
    if (a.nev !== undefined) e.nev = String(a.nev || '').slice(0, 160);
    if (a.alap_id !== undefined) e.alap_id = a.alap_id || '';
    if (a.szulo_id !== undefined) e.szulo_id = a.szulo_id || '';
    if (a.sorrend !== undefined) e.sorrend = Number(a.sorrend) || 0;
    if (a.adat !== undefined) { elemAdatEllenorzes_(a.adat); e.adat = a.adat; }
    elemEllenorzes_(e, elemek.concat(a.uj ? [e] : []), sorok_('jatek', 'Kampányok'), epitoSorok_('Világok'));
    const regi = Number(e.verzio) || 0;
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    if (a.uj) sorHozzaadasa_('jatek', 'Elemek', e); else sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, a.uj ? 'elem.letrehoz' : 'elem.ment', e.id, regi, e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio, modositva: e.modositva };
  });
}

// action: element.archive (DM)   adat: { id, aktiv }
function elemArchivalasa_(a, felh) {
  return zarolva_(function () {
    const e = elemKeresese_(a.id, epitoSorok_('Elemek'));
    e.aktiv = !!a.aktiv;
    e.verzio = (Number(e.verzio) || 0) + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, e.aktiv ? 'elem.visszaallit' : 'elem.archival', e.id, '', e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio };
  });
}

// action: element.delete (DM)   adat: { id }
// Csak archivált elem törölhető, és csak ha nincs gyereke és nem alapja más elemnek. A kapcsolatai is törlődnek.
function elemTorlese_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    const e = elemKeresese_(a.id, elemek);
    if (igaz_(e.aktiv)) throw hiba_('hibas_adat', 'Csak archivált elem törölhető. Előbb archiváld.');
    if (elemek.some(function (x) { return x.szulo_id === e.id; })) throw hiba_('hibas_adat', 'Az elemnek vannak gyerekei. Előbb helyezd át vagy töröld őket.');
    if (elemek.some(function (x) { return x.alap_id === e.id; })) throw hiba_('hibas_adat', 'Más elemek erre épülnek (alapjuk). Előbb válaszd le őket.');
    const kapcs = epitoSorok_('Kapcsolatok').filter(function (k) { return k.honnan === e.id || k.hova === e.id; });
    if (kapcs.length) sorokTorlese_('jatek', 'Kapcsolatok', kapcs.map(function (k) { return k._sor; }));
    sorTorlese_('jatek', 'Elemek', e._sor);
    valtozasNaplozasa_(felh, 'elem.torol', e.id, e.verzio, '');
    return { torolve: e.id, kapcsolatok: kapcs.map(function (k) { return k.id; }) };
  });
}

// action: element.detach (DM)   adat: { id, verzio? }
// Leválasztás: az öröklött értékek bemásolódnak (a lánc összefésülve, a saját értékek nyernek), az alap megszűnik.
function elemLevalasztasa_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    const e = elemKeresese_(a.id, elemek);
    if (a.verzio !== undefined && Number(a.verzio) !== (Number(e.verzio) || 0)) {
      throw hiba_('utkozes', 'Az elemet közben más is módosította.', { aktualis: elemNezet_(e) });
    }
    if (!e.alap_id) return { elem: elemNezet_(e), verzio: Number(e.verzio) || 0 };
    const lanc = [];
    let x = e;
    while (x && lanc.length < 4 && lanc.indexOf(x) < 0) {
      lanc.push(x);
      const aid = x.alap_id;
      x = aid ? elemek.find(function (y) { return y.id === aid; }) : null;
    }
    const adat = {};
    for (let i = lanc.length - 1; i >= 0; i--) {
      const d = objektum_(lanc[i].adat);
      Object.keys(d).forEach(function (m) { adat[m] = d[m]; });
    }
    elemAdatEllenorzes_(adat);
    e.adat = adat;
    e.alap_id = '';
    const regi = Number(e.verzio) || 0;
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, 'elem.levalaszt', e.id, regi, e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio };
  });
}

// action: element.promote (DM)   adat: { id, verzio?, vilag_id }
// Világelemmé emelés: a kampányelem a világ eleme lesz (ugyanazzal az azonosítóval, a kapcsolatai megmaradnak).
// Ha a szülője kampányelem, a fa gyökerébe kerül.
function elemEmelese_(a, felh) {
  return zarolva_(function () {
    const elemek = epitoSorok_('Elemek');
    const e = elemKeresese_(a.id, elemek);
    if (a.verzio !== undefined && Number(a.verzio) !== (Number(e.verzio) || 0)) {
      throw hiba_('utkozes', 'Az elemet közben más is módosította.', { aktualis: elemNezet_(e) });
    }
    if (!e.kampany_id) throw hiba_('hibas_adat', 'Csak kampányelem emelhető világelemmé.');
    if (!a.vilag_id) throw hiba_('hianyzo_adat', 'Melyik világba kerüljön? A kampánykeretben válassz világot.');
    e.vilag_id = a.vilag_id;
    e.kampany_id = '';
    const sz = e.szulo_id ? elemek.find(function (y) { return y.id === e.szulo_id; }) : null;
    if (sz && elemSzint_(sz) === 'kampany') e.szulo_id = '';
    elemEllenorzes_(e, elemek, sorok_('jatek', 'Kampányok'), epitoSorok_('Világok'));
    const regi = Number(e.verzio) || 0;
    e.verzio = regi + 1;
    e.modositva = most_();
    e.modositotta = felh.n;
    sorFrissitese_('jatek', 'Elemek', e);
    valtozasNaplozasa_(felh, 'elem.emel', e.id, regi, e.verzio);
    return { elem: elemNezet_(e), verzio: e.verzio };
  });
}

// ---- Kapcsolatok ----

// action: link.save (DM)   adat: { id, uj?, honnan, hova, tipus, megjegyzes?, vilag_id?, kampany_id? }
function kapcsolatMentese_(a, felh) {
  return zarolva_(function () {
    const sorok = epitoSorok_('Kapcsolatok');
    let k = sorok.find(function (x) { return x.id === a.id; });
    if (a.uj) {
      if (k) return { kapcsolat: kapcsolatNezet_(k) };
      if (!LINK_ID_MINTA.test(String(a.id || ''))) throw hiba_('hibas_adat', 'Hibás kapcsolatazonosító.');
      k = { id: a.id, aktiv: true };
    } else if (!k) throw hiba_('nem_talalhato', 'Nincs ilyen kapcsolat.');
    ['honnan', 'hova', 'tipus', 'vilag_id', 'kampany_id'].forEach(function (m) { if (a[m] !== undefined) k[m] = String(a[m] || ''); });
    if (a.megjegyzes !== undefined) k.megjegyzes = String(a.megjegyzes || '').slice(0, 300);
    if (!k.honnan || !k.hova || k.honnan === k.hova) throw hiba_('hibas_adat', 'A kapcsolat két különböző végét meg kell adni.');
    if (KAPCSOLAT_TIPUSOK.indexOf(k.tipus) < 0) throw hiba_('hibas_adat', 'Ismeretlen kapcsolattípus.');
    if (k.vilag_id && k.kampany_id) throw hiba_('hibas_adat', 'A kapcsolat vagy világhoz, vagy kampányhoz tartozik.');
    if (a.uj) sorHozzaadasa_('jatek', 'Kapcsolatok', k); else sorFrissitese_('jatek', 'Kapcsolatok', k);
    valtozasNaplozasa_(felh, a.uj ? 'kapcsolat.letrehoz' : 'kapcsolat.ment', k.id, '', '');
    return { kapcsolat: kapcsolatNezet_(k) };
  });
}

// action: link.delete (DM)   adat: { id }
function kapcsolatTorlese_(a, felh) {
  return zarolva_(function () {
    const k = epitoSorok_('Kapcsolatok').find(function (x) { return x.id === a.id; });
    if (!k) return { torolve: a.id }; // már törölve (ismételt küldés)
    sorTorlese_('jatek', 'Kapcsolatok', k._sor);
    valtozasNaplozasa_(felh, 'kapcsolat.torol', k.id, '', '');
    return { torolve: k.id };
  });
}

// A kampány törlésekor az elemei és a kapcsolatai is törlődnek (zárolás alatt hívandó). A kampányelemre épülő
// vagy alá tartozó világelem nem lehet, így a törlés nem hagy árva hivatkozást a világban.
function kampanyElokeszitesTorlese_(kampanyId) {
  const elemek = epitoSorok_('Elemek').filter(function (e) { return e.kampany_id === kampanyId; });
  const ids = elemek.map(function (e) { return e.id; });
  const kapcs = epitoSorok_('Kapcsolatok').filter(function (k) {
    return k.kampany_id === kampanyId || ids.indexOf(k.honnan) >= 0 || ids.indexOf(k.hova) >= 0;
  });
  if (kapcs.length) sorokTorlese_('jatek', 'Kapcsolatok', kapcs.map(function (k) { return k._sor; }));
  if (elemek.length) sorokTorlese_('jatek', 'Elemek', elemek.map(function (e) { return e._sor; }));
  return elemek.length;
}

// ---- Az elemek képei (5.3: jelenetképek és térképek; közös mező minden elemen) ----
// A képek a Drive „Kampányképek” mappájában vannak; az elem adatában csak a fájlazonosítók (adat.kepek:
// [{ kep, belyeg, cim, terkep, szel, mag }]). Csak a DM tölthet fel és kérhet le ilyen képet.

function kampanyKepMappa_() {
  const id = beallitas_('KAMPANYKEPMAPPA_ID');
  if (id) {
    try { return DriveApp.getFolderById(id); } catch (e) { /* törölték: újra létrehozzuk */ }
  }
  const mappa = mappa_(DriveApp.getFolderById(beallitas_('MAPPA_ID')), 'Kampányképek');
  PropertiesService.getScriptProperties().setProperty('KAMPANYKEPMAPPA_ID', mappa.getId());
  CacheService.getScriptCache().put('prop_KAMPANYKEPMAPPA_ID', mappa.getId(), BEALLITAS_CACHE_MP);
  return mappa;
}

// Az elemekben hivatkozott képfájlok azonosítói (a saját és az örökölt értékek is, hiszen mind az adatban vannak).
function elemKepei_(elemek) {
  const ki = {};
  (elemek || epitoSorok_('Elemek')).forEach(function (e) {
    const kepek = objektum_(e.adat).kepek;
    (Array.isArray(kepek) ? kepek : []).forEach(function (k) {
      if (k && k.kep) ki[k.kep] = true;
      if (k && k.belyeg) ki[k.belyeg] = true;
    });
  });
  return ki;
}

// action: element.image.add (DM)   adat: { kep, belyeg? }  (base64 JPEG)  → { kep: { kep, belyeg } }
// Csak a fájlokat hozza létre; az elem adatába a felület írja be (element.save), mert a képlista öröklődhet.
function elemKepFeltoltese_(a, felh) {
  if (!a.kep) throw hiba_('hianyzo_adat', 'Hiányzik a kép.');
  if (String(a.kep).length > MAX_KEP_MERET || String(a.belyeg || '').length > MAX_KEP_MERET) throw hiba_('tul_nagy', 'A kép túl nagy.');
  const mappa = kampanyKepMappa_();
  const azon = 'kep_' + Utilities.getUuid().slice(0, 8);
  const fajl = function (b64, nev) {
    return mappa.createFile(Utilities.newBlob(Utilities.base64Decode(b64), 'image/jpeg', azon + '_' + nev + '.jpg'));
  };
  const kep = fajl(a.kep, 'kep').getId();
  const belyeg = a.belyeg ? fajl(a.belyeg, 'belyeg').getId() : kep;
  valtozasNaplozasa_(felh, 'elem.kep', kep, 0, 1);
  return { kep: { kep: kep, belyeg: belyeg } };
}

// action: element.image.trash (DM)   adat: { kep: { kep, belyeg } }
// A fájlok a kukába kerülnek, de csak ha már egyetlen elem sem hivatkozik rájuk (a sablon képét a példányok is használják),
// és ha a Kampányképek mappában vannak (más képet így nem lehet törölni).
function elemKepTorlese_(a, felh) {
  const k = objektum_(a.kep);
  return zarolva_(function () {
    const hasznalt = elemKepei_();
    const mappaId = kampanyKepMappa_().getId();
    const torolt = [];
    [k.kep, k.belyeg].filter(Boolean).forEach(function (id) {
      if (hasznalt[id] || torolt.indexOf(id) >= 0) return;
      try {
        const f = DriveApp.getFileById(id);
        const szulok = f.getParents();
        let benne = false;
        while (szulok.hasNext()) if (szulok.next().getId() === mappaId) benne = true;
        if (!benne) return;
        f.setTrashed(true);
        torolt.push(id);
      } catch (e) { /* már nincs meg */ }
    });
    if (torolt.length) valtozasNaplozasa_(felh, 'elem.kep:torol', torolt[0], 1, 0);
    return { torolve: torolt };
  });
}

// Az image.get engedélylistájához: a DM az elemek képeit is lekérheti.
function elemKepekEngedese_(felh, engedett) {
  if (!felh || felh.r !== 'dm') return;
  const kepek = elemKepei_();
  Object.keys(kepek).forEach(function (id) { engedett[id] = true; });
}
