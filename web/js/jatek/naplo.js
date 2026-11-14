// A dobásnapló tiszta függvényei: a sorok adatainak előkészítése, szűrés, helyi felülírások.
// A felület: web/js/app/dobasnaplo.js. A terv: claude/probak-terv.md (3. ütem). Teszt: tools/teszt/naplo.mjs
import { TUL_NEV, celertekNev } from './proba.js';

const szamE = (x) => x !== '' && x !== null && x !== undefined && Number.isFinite(Number(x));

// A dobás részletei objektumként (a háttér JSON-t ad, régi soroknál szöveg is lehet).
export function reszletekBol(d) {
  const r = d && d.reszletek;
  if (r && typeof r === 'object') return r;
  if (typeof r === 'string' && r.trim().startsWith('{')) { try { return JSON.parse(r); } catch (e) { /* nem baj */ } }
  return {};
}

export const igaz = (x) => x === true || ['true', 'igen', '1'].indexOf(String(x).toLowerCase()) >= 0;
export const dobasOsszege = (d) => (d.kockak || []).reduce((a, b) => a + (Number(b) || 0), 0) + (Number(d.modosito) || 0);

// Az elköltött mutatványok szövege: „Hatalmas csapás (1), Helyezkedés × 2 (2)”.
export function mutatvanyokSzovege(lista) {
  return (lista || []).map((x) => `${x.nev || x.id}${x.db > 1 ? ' × ' + x.db : ''} (${x.mp})`).join(', ');
}

// ctx: { felhasznalo: { id, nev }, szerep: 'dm' | 'mester' | 'jatekos', karakterek: [{ id, nev, kep, jatekos_id, irhato }],
//        probak: [{ id, cim }], reszletekLathatok: bool (a kampány beállítása) }
// A saját dobás: én dobtam, vagy a karakter az enyém (a játékosa vagyok).
export function sajatDobasE(d, ctx) {
  const f = (ctx && ctx.felhasznalo) || {};
  if (f.nev && d.dobta === f.nev) return true;
  const k = karakterTerkep(ctx)[d.karakter_id];
  return !!(k && f.id && k.jatekos_id === f.id);
}

function karakterTerkep(ctx) {
  const m = {};
  ((ctx && ctx.karakterek) || []).forEach((c) => { m[c.id] = c; });
  return m;
}

// Egy naplósor megjelenítendő adatai.
export function naploSor(d, ctx = {}) {
  const r = reszletekBol(d);
  const kar = karakterTerkep(ctx)[d.karakter_id] || null;
  const szerep = ctx.szerep || 'jatekos';
  const sajat = sajatDobasE(d, ctx);
  const mindentLat = szerep === 'dm' || szerep === 'mester';
  const korlatozott = !mindentLat && !sajat && ctx.reszletekLathatok === false;
  const mutatvanyok = Array.isArray(r.mutatvanyok) ? r.mutatvanyok : null;
  const plusz = Array.isArray(r.mp_plusz) ? r.mp_plusz : [];
  const mp = Number(d.mutatvanypont) || 0;
  const proba = d.proba_id ? ((ctx.probak || []).find((p) => p.id === d.proba_id) || null) : null;
  const celertek = szamE(d.celertek) ? Number(d.celertek) : null;
  // a karakter szerkesztője (irhato) vagy a dobó rögzítheti utólag a mutatványokat
  const rogzitheto = !d._fuggo && mp > 0 && !mutatvanyok && (sajat || !!(kar && kar.irhato) || szerep === 'dm');
  const sor = {
    id: d.id,
    nev: (kar && kar.nev) || d.dobta || '',
    kep: (kar && kar.kep) || '',
    mire: d.mire || 'Próba',
    idopont: d.idopont,
    fuggo: !!d._fuggo,
    osszeg: dobasOsszege(d),
    eredmeny: d.eredmeny === 'siker' || d.eredmeny === 'kudarc' ? d.eredmeny : '',
    sajat,
    korlatozott,
    rejtett: szerep === 'dm' && igaz(d.rejtett),
    felfedve: igaz(d.felfedve),
    felfedheto: szerep === 'dm' && igaz(d.rejtett) && !d._fuggo,
    mutatvanyRogzitheto: rogzitheto
  };
  if (korlatozott) return { ...sor, kockak: [], modosito: 0, mutatvanypont: 0, mutatvanyok: '', kezi: false, ujradobas: false, reszletek: null };
  const osszetevok = (r.osszetevok || []).filter((o) => Number(o.ertek));
  return {
    ...sor,
    kockak: (d.kockak || []).map((k) => Number(k) || 0),
    modosito: Number(d.modosito) || 0,
    mutatvanypont: mp,
    mutatvanyok: mutatvanyok ? (mutatvanyok.length ? mutatvanyokSzovege(mutatvanyok) : 'nem költött pontot') : '',
    kezi: igaz(d.kezi),
    ujradobas: !!r.ujradobas,
    reszletek: {
      osszetevok: osszetevok.map((o) => ({ ertek: Number(o.ertek), eredet: o.eredet || '' })),
      celertek,
      celertekNev: celertek !== null ? celertekNev(celertek) : '',
      celertekRejtett: celertek === null && !!d.proba_id && !mindentLat,
      fok: r.fok || '',
      plusz: plusz.filter((p) => Number(p.ertek)).map((p) => ({ ertek: Number(p.ertek), eredet: p.eredet || '' })),
      probaCim: proba ? (proba.cim || 'Próbakérés') : '',
      tulajdonsag: TUL_NEV[d.tulajdonsag] || ''
    }
  };
}

// Van-e mit lenyitni a soron.
export function vanReszlet(sor) {
  const r = sor && sor.reszletek;
  if (!r) return false;
  return !!(r.osszetevok.length || r.celertek !== null || r.celertekRejtett || r.fok || r.plusz.length || r.probaCim);
}

// Szűrő: 'mindenki' | 'sajat' | 'k:<karakter azonosító>' | 'p:<próbakérés azonosító>'.
export function naploSzur(dobasok, szuro, ctx = {}) {
  const s = szuro || 'mindenki';
  if (s === 'mindenki') return dobasok;
  if (s === 'sajat') return dobasok.filter((d) => sajatDobasE(d, ctx));
  if (s.startsWith('k:')) return dobasok.filter((d) => d.karakter_id === s.slice(2));
  if (s.startsWith('p:')) return dobasok.filter((d) => d.proba_id === s.slice(2));
  return dobasok;
}

// A szűrőcsipek: mindenki, csak az enyém (ha van sajátom), a karakterek, akiknek van dobása (a csapat sorrendjében),
// végül a próbakérések, amelyekhez van dobás.
export function szuroOpciok(dobasok, ctx = {}) {
  const opciok = [{ value: 'mindenki', label: 'Mindenki' }];
  if (dobasok.some((d) => sajatDobasE(d, ctx))) opciok.push({ value: 'sajat', label: 'Csak az enyém' });
  const van = new Set(dobasok.map((d) => d.karakter_id).filter(Boolean));
  ((ctx && ctx.karakterek) || []).forEach((c) => { if (van.has(c.id)) opciok.push({ value: 'k:' + c.id, label: c.nev }); });
  // a próbakérések, amelyekhez már van dobás (a próba címével)
  const probas = new Set(dobasok.map((d) => d.proba_id).filter(Boolean));
  ((ctx && ctx.probak) || []).forEach((p) => { if (probas.has(p.id)) opciok.push({ value: 'p:' + p.id, label: 'Próba: ' + (p.cim || 'kérés') }); });
  return opciok;
}

// Érvényes-e még a választott szűrő (a karakter kikerülhetett a kampányból).
export function szuroErvenyes(szuro, opciok) {
  return opciok.some((o) => o.value === szuro) ? szuro : 'mindenki';
}

// Helyi (optimista) felülírások: { [dobás id]: { rejtett, felfedve, reszletek: {...} } }.
export function felulirasAlkalmaz(dobasok, felul) {
  if (!felul || !Object.keys(felul).length) return dobasok;
  return dobasok.map((d) => {
    const f = felul[d.id];
    if (!f) return d;
    const uj = { ...d, ...f };
    if (f.reszletek) uj.reszletek = { ...reszletekBol(d), ...f.reszletek };
    return uj;
  });
}

// A felülírás elhagyható, ha a szerver már ugyanazt adja vissza.
export function felulirasTisztit(dobasok, felul) {
  const ki = {};
  Object.keys(felul || {}).forEach((id) => {
    const d = dobasok.find((x) => x.id === id);
    if (!d) { ki[id] = felul[id]; return; }
    const f = felul[id];
    const r = reszletekBol(d);
    const kesz = (f.felfedve === undefined || igaz(d.felfedve) === f.felfedve)
      && (!f.reszletek || !f.reszletek.mutatvanyok || Array.isArray(r.mutatvanyok));
    if (!kesz) ki[id] = f;
  });
  return ki;
}

// A mutatványválasztó kontextusa egy naplózott dobásból (a fegyver adatai nincsenek a naplóban).
export function mutatvanyKontextus(d) {
  const tipus = d.tipus === 'tamadas' || d.tipus === 'varazslas' ? d.tipus : 'alap';
  return { tipus, tul: d.tulajdonsag || undefined, fokusz: d.fokusz || undefined };
}

// A karakter oldalának „Továbbiak” lapozása: a következő lekérés kezdőpontja és az összefésülés.
export function lapozasFuz(eddig, uj) {
  const megvan = new Set((eddig || []).map((d) => d.id));
  return (eddig || []).concat((uj || []).filter((d) => !megvan.has(d.id)));
}
export function kovetkezoElotte(lista) {
  const l = lista || [];
  return l.length ? l[l.length - 1].idopont : undefined;
}
