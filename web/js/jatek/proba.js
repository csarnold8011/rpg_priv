// Próbák szabályai (Alapkönyv 31–33., 98–99. o.): összeállítás, kiértékelés, ellenpróba, összetett próba.
// Tiszta függvények, böngészőben és Node-ban is futnak. Teszt: node tools/teszt/proba.mjs
// A karakter értékei a számolóból jönnek (web/js/karakter/szamol.js, karakterSzamol eredménye: „lap”).

export const TUL_NEV = {
  tul_accuracy: 'Pontosság', tul_communication: 'Kommunikáció', tul_constitution: 'Szívósság',
  tul_dexterity: 'Ügyesség', tul_fighting: 'Harc', tul_intelligence: 'Intelligencia',
  tul_perception: 'Észlelés', tul_strength: 'Erő', tul_willpower: 'Akaraterő'
};

// Alap próba Célértékei (a nevek javaslatok, a Szótárba kerülnek).
export const CELERTEKEK = [
  { ertek: 7, nev: 'Rutin' }, { ertek: 9, nev: 'Könnyű' }, { ertek: 11, nev: 'Átlagos' }, { ertek: 13, nev: 'Kihívó' },
  { ertek: 15, nev: 'Nehéz' }, { ertek: 17, nev: 'Félelmetes' }, { ertek: 19, nev: 'Rendkívüli' }, { ertek: 21, nev: 'Szinte lehetetlen' }
];
// Összetett próba Sikerküszöbei.
export const KUSZOBOK = [
  { ertek: 5, nev: 'Könnyű' }, { ertek: 10, nev: 'Átlagos' }, { ertek: 15, nev: 'Kihívó' }, { ertek: 20, nev: 'Nehéz' }, { ertek: 25, nev: 'Félelmetes' }
];
export const celertekNev = (cel) => (CELERTEKEK.find((c) => c.ertek === Number(cel)) || {}).nev || '';

// A siker foka a sárkánykocka szerint (Alapkönyv 98. o., a könyv példája alapján).
export function sikerFoka(sarkany) {
  const s = Number(sarkany) || 0;
  if (s <= 1) return 'épp hogy';
  if (s <= 3) return 'nehezen';
  if (s <= 5) return 'szépen';
  return 'lenyűgözően';
}

const szamE = (x) => x !== '' && x !== null && x !== undefined && Number.isFinite(Number(x));
export const kockaOsszeg = (k) => (k || []).reduce((a, b) => a + (Number(b) || 0), 0);
export const duplaE = (k) => Array.isArray(k) && k.length === 3 && (k[0] === k[1] || k[0] === k[2] || k[1] === k[2]);

// A karakter fókuszai egy tulajdonsághoz (a lap.fokuszok értékei: { id, nev_hu, tulajdonsag, bonusz }).
export function tulajdonsagFokuszai(lap, tul) {
  return Object.values((lap && lap.fokuszok) || {}).filter((f) => f.tulajdonsag === tul);
}

// A kért fókuszok közül a karakter legjobbja (vagy null). Kérés nélkül a megadott fókusz, ha a karakternek megvan.
export function fokuszAjanlas(lap, keresFokuszai, tul) {
  const sajat = (lap && lap.fokuszok) || {};
  const jelolt = (keresFokuszai || []).map((id) => sajat[id]).filter((f) => f && (!tul || f.tulajdonsag === tul));
  if (!jelolt.length) return null;
  return jelolt.reduce((a, b) => (b.bonusz > a.bonusz ? b : a)).id;
}

// A próba bónusza és összetevői.
//   tul, fokusz:   tulajdonság és (legfeljebb egy) fókusz azonosítója
//   modositok:     [{ ertek, eredet }] (fegyver, hosszú táv, DM módosító, kézi)
// Ügyesség alapú próbánál a páncélbüntetés is levonódik, ha a karakter nem képzett a páncélban.
export function probaOsszeallit(lap, { tul, fokusz, modositok = [] } = {}) {
  const t = lap && lap.tulajdonsagok && lap.tulajdonsagok[tul];
  const reszek = [{ ertek: t ? Number(t.ertek) || 0 : 0, eredet: TUL_NEV[tul] || 'Tulajdonság', tipus: 'tulajdonsag' }];
  const f = fokusz && lap && lap.fokuszok ? lap.fokuszok[fokusz] : null;
  if (f && f.tulajdonsag === tul) reszek.push({ ertek: Number(f.bonusz) || 2, eredet: f.nev_hu || 'Fókusz', tipus: 'fokusz' });
  const pb = lap && lap.pancel && Number(lap.pancel.ugyesseg_buntetes);
  if (tul === 'tul_dexterity' && pb) reszek.push({ ertek: -Math.abs(pb), eredet: 'Páncélbüntetés', tipus: 'pancel' });
  modositok.forEach((m) => { if (m && Number(m.ertek)) reszek.push({ ertek: Number(m.ertek), eredet: m.eredet || 'Módosító', tipus: m.tipus || 'modosito' }); });
  return {
    bonusz: reszek.reduce((a, r) => a + r.ertek, 0),
    reszek,
    van_fokusz: !!(f && f.tulajdonsag === tul),
    tulajdonsag_ertek: reszek[0].ertek
  };
}

// Egy dobás kiértékelése.
//   celertek:          alap próbánál (üres: nincs siker vagy kudarc, csak összeg)
//   fokusz_kotelezo:   ha igaz és nincs fókusz, automatikus kudarc
//   mutatvany_tiltva:  a DM kizárta a Mutatványpontot
// Visszaad: { osszeg, eredmeny: 'siker' | 'kudarc' | '', dupla, mutatvanypont, sarkany, fok }
export function probaKiertekel(kockak, bonusz, { celertek, fokusz_kotelezo, van_fokusz, mutatvany_tiltva } = {}) {
  const k = (kockak || []).map((x) => Number(x) || 0);
  const osszeg = kockaOsszeg(k) + (Number(bonusz) || 0);
  let eredmeny = '';
  if (fokusz_kotelezo && !van_fokusz) eredmeny = 'kudarc';
  else if (szamE(celertek)) eredmeny = osszeg >= Number(celertek) ? 'siker' : 'kudarc';
  const dupla = duplaE(k);
  const sarkany = k[2] || 0;
  const mutatvanypont = !mutatvany_tiltva && dupla && eredmeny !== 'kudarc' ? sarkany : 0;
  return { osszeg, eredmeny, dupla, mutatvanypont, sarkany, fok: eredmeny === 'kudarc' ? '' : sikerFoka(sarkany), fokusz_hianyzik: !!(fokusz_kotelezo && !van_fokusz) };
}

// Ellenpróba helyezései. eredmenyek: [{ kulcs, osszeg, sarkany, tulajdonsag }]
// Döntetlennél a nagyobb sárkánykocka, utána a nagyobb tulajdonság nyer; ha az is egyezik, újradobás kell.
// Visszaad: [{ ...e, hely, ujradobas }] a helyezés szerint; a győztes(ek) hely = 1.
export function ellenprobaSorrend(eredmenyek) {
  const kulcs = (e) => [Number(e.osszeg) || 0, Number(e.sarkany) || 0, Number(e.tulajdonsag) || 0];
  const hasonlit = (a, b) => {
    const x = kulcs(a), y = kulcs(b);
    for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i];
    return 0;
  };
  const rendezett = (eredmenyek || []).slice().sort(hasonlit);
  let hely = 0;
  return rendezett.map((e, i) => {
    if (i === 0 || hasonlit(rendezett[i - 1], e) !== 0) hely = i + 1;
    const holtverseny = rendezett.some((m, j) => j !== i && hasonlit(m, e) === 0);
    return { ...e, hely, ujradobas: holtverseny };
  });
}

// Összetett próba állása. dobasok: [{ kulcs, eredmeny, kockak }] időrendben.
// A sikeres dobások sárkánykockái adódnak össze; aki eléri a küszöböt, kész (a beérkezés sorrendjével).
export function osszetettAllas(dobasok, kuszob) {
  const k = Number(kuszob) || 0;
  const allas = {};
  let sorrend = 0;
  (dobasok || []).forEach((d) => {
    const a = allas[d.kulcs] || (allas[d.kulcs] = { osszeg: 0, probak: 0, kesz: false, hely: null });
    if (a.kesz) return;
    a.probak += 1;
    if (d.eredmeny === 'siker') a.osszeg += Number((d.kockak || [])[2]) || 0;
    if (k && a.osszeg >= k) { a.kesz = true; a.hely = ++sorrend; }
  });
  return allas;
}

// A próba szöveges neve: „Észlelés (Keresés)”.
export function probaNev(lap, tul, fokusz) {
  const f = fokusz && lap && lap.fokuszok ? lap.fokuszok[fokusz] : null;
  return (TUL_NEV[tul] || 'Próba') + (f ? ` (${f.nev_hu})` : '');
}

// A naplóba küldött dobás összeállítása (a roll.log adata). A Célérték csak akkor kerül bele, ha ismert.
export function naploDobas({ id, kampany_id, karakter_id, mire, kockak, osszeallitas, kiertekeles, celertek, tipus, tul, fokusz, kezi, proba_id, rejtett, extra }) {
  return {
    id: id || ujDobasId(),
    kampany_id: kampany_id || '', karakter_id: karakter_id || '', mire: mire || 'Próba',
    kockak, modosito: osszeallitas ? osszeallitas.bonusz : 0,
    celertek: szamE(celertek) ? Number(celertek) : undefined,
    eredmeny: kiertekeles ? kiertekeles.eredmeny : '', mutatvanypont: kiertekeles ? kiertekeles.mutatvanypont : 0,
    tipus: tipus || 'alap', tulajdonsag: tul || '', fokusz: fokusz || '', kezi: !!kezi, proba_id: proba_id || undefined, rejtett: !!rejtett,
    reszletek: { osszetevok: osszeallitas ? osszeallitas.reszek.map(({ ertek, eredet }) => ({ ertek, eredet })) : [], fok: kiertekeles ? kiertekeles.fok : '', ...(extra || {}) },
    idopont: new Date().toISOString()
  };
}

export function ujDobasId() {
  try { if (globalThis.crypto && globalThis.crypto.randomUUID) return 'd_' + globalThis.crypto.randomUUID().replace(/-/g, '').slice(0, 16); } catch (e) { /* tovább */ }
  return 'd_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

// A karakter kampánya a naplózáshoz: egy karakter egyszerre egy kampányban szerepel (Arnold döntése);
// ha régi adat miatt több is van, az utolsó nem archivált a listából.
export function karakterKampanya(karakter, kampanyok) {
  const ids = (karakter && karakter.kampanyok) || [];
  const aktiv = (kampanyok || []).filter((k) => ids.includes(k.id) && k.allapot !== 'archivált');
  if (aktiv.length) return aktiv[aktiv.length - 1];
  return null;
}
