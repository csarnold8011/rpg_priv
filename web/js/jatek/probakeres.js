// DM próbakérés: űrlap, ellenőrzés, élő tábla, a játékos kártyái, titkos próba, a Próba lap kitöltése.
// Tiszta függvények (böngészőben és Node-ban is futnak). Teszt: node tools/teszt/probakeres.mjs
// A felület: web/js/app/probakeres.js. A háttér: backend/Dobasok.gs (test.request, test.update, test.close).
import { TUL_NEV, celertekNev, probaOsszeallit, probaKiertekel, fokuszAjanlas, ellenprobaSorrend, naploDobas, KUSZOBOK } from './proba.js';

export const PROBA_TIPUSOK = [
  { value: 'alap', label: 'Alap' }, { value: 'ellen', label: 'Ellenpróba' },
  { value: 'osszetett', label: 'Összetett' }, { value: 'titkos', label: 'Titkos' }
];
export const tipusNev = (t) => (PROBA_TIPUSOK.find((x) => x.value === t) || {}).label || 'Próba';
const szamE = (x) => x !== '' && x !== null && x !== undefined && Number.isFinite(Number(x));
export const kuszobNev = (k) => (KUSZOBOK.find((x) => x.ertek === Number(k)) || {}).nev || '';

// Az „Új próba” űrlap kiinduló értéke. beallitas: a kampány beállításai (a Célérték rejtettsége innen jön).
export function ujUrlap(beallitas, tipus = 'alap') {
  return {
    tipus, cim: '', tulajdonsag: '', fokuszok: [], fokusz_kotelezo: false,
    celertek: 11, celertek_rejtett: !(beallitas && beallitas.celertek_rejtett === false),
    kuszob: 10, haladas: 'egyeni', idoegyseg: '',
    cimzettek: 'mindenki', modositok: {}, mutatvany_engedett: true,
    ellenfel_nev: '', ellenfel_bonusz: 0
  };
}

// A próba neve: „Észlelés (Keresés vagy Látás)”. fokuszNev(id) a fókusz magyar neve.
export function probaCim(tul, fokuszok, fokuszNev) {
  const f = (fokuszok || []).map((id) => (fokuszNev ? fokuszNev(id) : id)).filter(Boolean);
  return (TUL_NEV[tul] || 'Próba') + (f.length ? ` (${f.join(' vagy ')})` : '');
}

// Az űrlap hibái (üres lista: küldhető). karakterek: a kampány aktív karakterei.
export function urlapHibak(u, karakterek = []) {
  const h = [];
  if (!TUL_NEV[u.tulajdonsag]) h.push('Válassz tulajdonságot.');
  if ((u.tipus === 'alap' || u.tipus === 'osszetett' || u.tipus === 'titkos') && !szamE(u.celertek)) h.push('Adj meg Célértéket.');
  if (u.tipus === 'osszetett' && !(Number(u.kuszob) > 0)) h.push('Adj meg Sikerküszöböt.');
  if (u.fokusz_kotelezo && !(u.fokuszok || []).length) h.push('Kötelező fókuszhoz legalább egy fókuszt jelölj ki.');
  const c = cimzettLista(u.cimzettek, karakterek);
  if (!c.length) h.push(karakterek.length ? 'Válassz legalább egy karaktert.' : 'Nincs karakter a kampányban.');
  return h;
}

// A test.request adata az űrlapból.
export function keresAdat(u, kampanyId, fokuszNev) {
  const a = {
    kampany_id: kampanyId, tipus: u.tipus,
    cim: (u.cim || '').trim() || probaCim(u.tulajdonsag, u.fokuszok, fokuszNev),
    tulajdonsag: u.tulajdonsag, fokuszok: (u.fokuszok || []).slice(), fokusz_kotelezo: !!u.fokusz_kotelezo,
    celertek: u.tipus === 'ellen' ? '' : Number(u.celertek),
    celertek_rejtett: u.tipus === 'ellen' ? false : !!u.celertek_rejtett,
    cimzettek: Array.isArray(u.cimzettek) ? u.cimzettek.slice() : 'mindenki',
    modositok: {}, mutatvany: { engedett: u.mutatvany_engedett !== false }
  };
  Object.keys(u.modositok || {}).forEach((k) => { const n = Number(u.modositok[k]); if (n) a.modositok[k] = n; });
  if (u.tipus === 'osszetett') {
    a.kuszob = Number(u.kuszob);
    a.haladas = u.haladas === 'kozos' ? 'kozos' : 'egyeni';
    a.idoegyseg = (u.idoegyseg || '').trim();
  }
  if (u.tipus === 'ellen') a.ellenfel = (u.ellenfel_nev || '').trim() ? { nev: u.ellenfel_nev.trim(), bonusz: Number(u.ellenfel_bonusz) || 0 } : '';
  return a;
}

// A címzett karakterek azonosítói ('mindenki': a kampány összes aktív karaktere).
export function cimzettLista(cimzettek, karakterek) {
  const aktiv = (karakterek || []).filter((c) => !c.kampany_allapot || c.kampany_allapot === 'aktív').map((c) => c.id);
  if (!Array.isArray(cimzettek)) return aktiv;
  const minden = new Set((karakterek || []).map((c) => c.id));
  return cimzettek.filter((id) => minden.has(id));
}

// A próba rövid leírása: „Célérték 13 (Kihívó)”, „Sikerküszöb 15, óránként”, „Ellenfél: Őr (+4)”.
export function probaFeltetel(p, { dm } = {}) {
  const r = [];
  if (p.tipus === 'ellen') {
    const e = p.ellenfel && typeof p.ellenfel === 'object' ? p.ellenfel : null;
    r.push(e && e.nev ? `Ellenfél: ${e.nev}${dm && szamE(e.bonusz) ? ` (${Number(e.bonusz) >= 0 ? '+' : '−'}${Math.abs(Number(e.bonusz))})` : ''}` : 'Ellenpróba');
  } else if (szamE(p.celertek)) {
    r.push(`Célérték ${p.celertek}${celertekNev(p.celertek) ? ` (${celertekNev(p.celertek)})` : ''}${dm && p.celertek_rejtett ? ', rejtett' : ''}`);
  } else if (p.celertek_rejtett) r.push('A Célértéket a DM tudja');
  if (p.tipus === 'osszetett' && szamE(p.kuszob)) {
    r.push(`Sikerküszöb ${p.kuszob}${p.haladas === 'kozos' ? ', közös' : ''}${p.idoegyseg ? ', ' + p.idoegyseg : ''}`);
  }
  if (p.fokusz_kotelezo) r.push('fókusz kötelező');
  if (p.mutatvany && p.mutatvany.engedett === false) r.push('Mutatványpont nélkül');
  return r.join(' · ');
}

// Az élő tábla. karakterek: [{ id, nev, kep, tulajdonsagok? }]; tul(id): a karakter tulajdonsága az ellenpróba döntetlenjéhez.
// Visszaad: { sorok: [{ kulcs, nev, kep, ellenfel, allapot: 'var' | 'dobott' | 'kesz', osszeg, eredmeny, mutatvanypont,
//   probak, gyujtott, szazalek, kesz_sorszam, hely, ujradobas, mp_koltheto }], kozos: { gyujtott, kuszob, szazalek, kesz } | null,
//   dobott, osszes }
export function probaTabla(p, karakterek = [], { tul } = {}) {
  const allas = p.allas && typeof p.allas === 'object' ? p.allas : {};
  const kuszob = Number(p.kuszob) || 0;
  const ids = cimzettLista(p.cimzettek, karakterek);
  // aki dobott, de már nem címzett (például a DM utólag szűkítette), az is látszik
  Object.keys(allas).forEach((k) => { if (k !== '_ellenfel' && k !== '_dm' && ids.indexOf(k) < 0 && karakterek.some((c) => c.id === k)) ids.push(k); });
  const sor = (kulcs, nev, kep, ellenfel) => {
    const a = allas[kulcs];
    const u = a && a.utolso;
    const gyujtott = a ? Number(a.osszeg) || 0 : 0;
    return {
      kulcs, nev, kep: kep || '', ellenfel: !!ellenfel,
      allapot: !u ? 'var' : (a.kesz ? 'kesz' : 'dobott'),
      osszeg: u ? Number(u.osszeg) : null, sarkany: u ? Number(u.sarkany) || 0 : 0,
      eredmeny: u ? u.eredmeny || '' : '', mutatvanypont: u ? Number(u.mutatvanypont) || 0 : 0,
      probak: a ? (a.dobasok || []).length : 0,
      gyujtott, szazalek: kuszob ? Math.min(100, Math.round(gyujtott / kuszob * 100)) : 0,
      kesz_sorszam: a && a.kesz ? a.kesz_sorszam || null : null, probak_szama: a && a.kesz ? a.probak_szama || null : null,
      hely: null, ujradobas: false, mp_koltheto: u ? (Number(u.mutatvanypont) || 0) > 0 : false
    };
  };
  const sorok = ids.map((id) => { const c = karakterek.find((x) => x.id === id) || {}; return sor(id, c.nev || 'Ismeretlen', c.kep); });
  if (p.tipus === 'ellen') {
    const e = p.ellenfel && typeof p.ellenfel === 'object' && p.ellenfel.nev ? p.ellenfel : null;
    if (e || allas._ellenfel) sorok.push(sor('_ellenfel', (e && e.nev) || 'Ellenfél', '', true));
    const dobottak = sorok.filter((s) => s.osszeg !== null);
    if (dobottak.length > 1) {
      const rend = ellenprobaSorrend(dobottak.map((s) => ({ kulcs: s.kulcs, osszeg: s.osszeg, sarkany: s.sarkany, tulajdonsag: tul ? tul(s.kulcs) : 0 })));
      rend.forEach((r) => { const s = sorok.find((x) => x.kulcs === r.kulcs); s.hely = r.hely; s.ujradobas = r.ujradobas; });
    }
    // ellenpróbánál csak a győztes költhet Mutatványpontot (és csak, ha már mindenki dobott)
    const mindenki = sorok.every((s) => s.osszeg !== null);
    sorok.forEach((s) => { s.mp_koltheto = s.mp_koltheto && mindenki && s.hely === 1 && !s.ujradobas; });
  }
  let kozos = null;
  if (p.tipus === 'osszetett' && p.haladas === 'kozos') {
    const gyujtott = sorok.reduce((a, s) => a + s.gyujtott, 0);
    kozos = { gyujtott, kuszob, szazalek: kuszob ? Math.min(100, Math.round(gyujtott / kuszob * 100)) : 0, kesz: !!kuszob && gyujtott >= kuszob };
  }
  const karSorok = sorok.filter((s) => !s.ellenfel);
  return { sorok, kozos, dobott: karSorok.filter((s) => s.allapot !== 'var').length, osszes: karSorok.length };
}

// A játékos (vagy mesterjátékos) kártyái: a nyitott, nem titkos kérések a saját karaktereire, karakterenként egy.
// karakterek: a kampány karakterei (irhato: a felhasználó dobhat a nevében).
export function jatekosKartyak(probak, karakterek) {
  const sajat = (karakterek || []).filter((c) => c.irhato);
  const ki = [];
  (probak || []).filter((p) => p.allapot !== 'lezart' && p.tipus !== 'titkos').forEach((p) => {
    const ids = cimzettLista(p.cimzettek, karakterek);
    const allas = p.allas && typeof p.allas === 'object' ? p.allas : {};
    // közös haladásnál a csapat együtt gyűjt: a kártya a közös állást mutatja
    const kozos = p.tipus === 'osszetett' && p.haladas === 'kozos'
      ? Object.keys(allas).filter((k) => k !== '_ellenfel').reduce((x, k) => x + (Number(allas[k].osszeg) || 0), 0) : null;
    sajat.filter((c) => ids.indexOf(c.id) >= 0).forEach((c) => {
      const a = allas[c.id];
      const gyujtott = kozos !== null ? kozos : (a ? Number(a.osszeg) || 0 : 0);
      ki.push({ kulcs: p.id + ':' + c.id, proba: p, karakter: c, dobott: !!(a && a.utolso), utolso: a && a.utolso ? a.utolso : null,
        kesz: kozos !== null ? !!Number(p.kuszob) && kozos >= Number(p.kuszob) : !!(a && a.kesz), gyujtott, kozos: kozos !== null });
    });
  });
  return ki;
}

// A Próba lap kezdőértékei egy kéréshez (ProbaUrlap kezdet). A módosító a kérésben karakterenként adott.
export function probaKezdet(p, karakterId) {
  const mod = p.modositok && typeof p.modositok === 'object' ? Number(p.modositok[karakterId]) || 0 : 0;
  return {
    cim: p.cim || probaCim(p.tulajdonsag, p.fokuszok), tul: p.tulajdonsag || 'tul_accuracy', fokuszok: Array.isArray(p.fokuszok) ? p.fokuszok : [],
    celertek: szamE(p.celertek) ? Number(p.celertek) : undefined, celertek_rejtett: !!p.celertek_rejtett && !szamE(p.celertek),
    modositok: mod ? [{ ertek: mod, eredet: 'DM módosító' }] : [], proba_id: p.id, tipus: 'alap',
    fokusz_kotelezo: !!p.fokusz_kotelezo, mutatvany_tiltva: !!(p.mutatvany && p.mutatvany.engedett === false),
    ellenproba: p.tipus === 'ellen', osszetett: p.tipus === 'osszetett' ? { kuszob: Number(p.kuszob) || 0, idoegyseg: p.idoegyseg || '' } : null,
    megjegyzes: p.tipus === 'ellen' ? 'Ellenpróba: a nagyobb eredmény nyer. Mutatványpontot csak a győztes költhet, a naplóból rögzítheted, ha nyertél.'
      : p.tipus === 'osszetett' ? `Összetett próba: a sikeres dobások sárkánykockái gyűlnek a ${p.kuszob}-es Sikerküszöbig${p.idoegyseg ? ' (egy próba: ' + p.idoegyseg + ')' : ''}.` : ''
  };
}

// Titkos próba: a DM a karakterek helyett dob, a lapjuk értékeivel. lapok: { [karakter id]: lap } (karakterSzamol).
// kocka(): egy d6 (a tesztben rögzített). Visszaad: [{ karakter_id, dobas (a roll.log adata), kiertekeles }]
export function titkosDobasok(p, karakterIds, lapok, kocka, dobta) {
  return karakterIds.map((id) => {
    const lap = lapok[id];
    const k = probaKezdet(p, id);
    const fok = lap ? fokuszAjanlas(lap, k.fokuszok, k.tul) : null;
    const ossz = probaOsszeallit(lap, { tul: k.tul, fokusz: fok || undefined, modositok: k.modositok });
    const kockak = [kocka(), kocka(), kocka()];
    const ert = probaKiertekel(kockak, ossz.bonusz, { celertek: k.celertek, fokusz_kotelezo: k.fokusz_kotelezo, van_fokusz: ossz.van_fokusz, mutatvany_tiltva: k.mutatvany_tiltva });
    const dobas = naploDobas({ kampany_id: p.kampany_id, karakter_id: id, mire: k.cim, kockak, osszeallitas: ossz, kiertekeles: ert,
      celertek: k.celertek, tipus: 'titkos', tul: k.tul, fokusz: fok || '', proba_id: p.id, rejtett: true });
    if (dobta) dobas.dobta = dobta;
    return { karakter_id: id, dobas, kiertekeles: ert };
  });
}

// Az ellenfél dobása (ellenpróba, a DM dobja): 3d6 + az ellenfél bónusza.
export function ellenfelDobas(p, kockak, kezi) {
  const e = p.ellenfel && typeof p.ellenfel === 'object' ? p.ellenfel : {};
  const b = Number(e.bonusz) || 0;
  const ert = probaKiertekel(kockak, b, {});
  const d = naploDobas({ kampany_id: p.kampany_id, mire: (e.nev || 'Ellenfél') + ': ' + (p.cim || 'ellenpróba'), kockak,
    osszeallitas: { bonusz: b, reszek: b ? [{ ertek: b, eredet: e.nev || 'Ellenfél' }] : [] }, kiertekeles: ert, tipus: 'alap', kezi, proba_id: p.id });
  d.ellenfel = true;
  return d;
}

// A nyitott és a lezárt kérések (újabbak elöl), a helyi (optimista) változásokkal.
// fuggo: [{ ...proba, _fuggo: true }] a még fel nem ért új kérések; felul: { [id]: { allapot } }.
export function probaListak(probak, fuggo = [], felul = {}) {
  const megvan = new Set((probak || []).map((p) => p.id));
  const mind = (probak || []).map((p) => (felul[p.id] ? { ...p, ...felul[p.id] } : p))
    .concat((fuggo || []).filter((p) => !megvan.has(p.id)));
  const rend = (a, b) => String(b.letrehozva || '').localeCompare(String(a.letrehozva || ''));
  return { nyitott: mind.filter((p) => p.allapot !== 'lezart').sort(rend), lezart: mind.filter((p) => p.allapot === 'lezart').sort(rend) };
}

// A varázslat célpontjának próbája (a varázslat adatai: reszletek.proba { tulajdonsag, fokusz: [], ellen: 'varazsero' }).
// Visszaad: az „Új próba” űrlap kitöltése, vagy null, ha a varázslat nem kér próbát.
export function varazslatProba(varazslat, varazsero, beallitas, fokuszNev) {
  const r = varazslat && varazslat.reszletek && typeof varazslat.reszletek === 'object' ? varazslat.reszletek : {};
  const pr = r.proba;
  if (!pr || !TUL_NEV[pr.tulajdonsag]) return null;
  const u = ujUrlap(beallitas, 'alap');
  u.tulajdonsag = pr.tulajdonsag;
  u.fokuszok = Array.isArray(pr.fokusz) ? pr.fokusz.slice() : (pr.fokusz ? [pr.fokusz] : []);
  u.celertek = Number(varazsero) || 10;
  u.celertek_rejtett = false;
  u.cim = `${varazslat.nev_hu ? varazslat.nev_hu + ': ' : ''}${probaCim(u.tulajdonsag, u.fokuszok, fokuszNev)} a Varázserő (${u.celertek}) ellen`;
  return u;
}

// A beállítások mentendő alakja (a háttér felülről fésül össze, ezért a mutatványok teljes objektuma megy).
export function beallitasValtozas(beallitas, kulcs, ertek) {
  const b = beallitas || {};
  const m = { felfedezes: true, szerepjatek: true, isteni: false, nyomozas: false, ...(b.mutatvanyok || {}) };
  if (kulcs.startsWith('mutatvanyok.')) return { mutatvanyok: { ...m, [kulcs.slice(12)]: !!ertek } };
  return { [kulcs]: !!ertek };
}
