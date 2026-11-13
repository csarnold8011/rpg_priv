// A karakter végértékeinek számolása a döntésekből és a szabályadatból.
// Tiszta függvény: karakterSzamol(adat, lapok) → lap. Minden számhoz megadja az összetevőit
// (reszek: [{ ertek, eredet }]), így a karakterlap meg tudja mutatni, honnan jön egy érték.
// A szabályeltéréseket nem tiltja, csak figyelmeztetésként jelzi (lásd ellenoriz.js).
import { szam, reszletek, tartomanyban, index } from './szabalyindex.js';
import { TULAJDONSAGOK, fejlesztesKoltseg, fokozatNev, fokozatSzam } from './tablak.js';
import { atallit } from './adat.js';
import { ellenorzes, gyujto } from './ellenoriz.js';

const ertekBol = (reszek) => reszek.reduce((a, r) => a + r.ertek, 0);
const nevE = (e, tartalek) => (e ? e.nev_hu || e.nev_en || e.id : tartalek || '');

// Kockakifejezés + állandó: "2d6+3" és 4 → "2d6+7"
export function sebzesSzoveg(kifejezes, plusz) {
  const s = String(kifejezes || '').replace(/\s/g, '').replace(/[−–]/g, '-');
  const m = s.match(/^(\d*d\d+)([+-]\d+)?$/i);
  if (!m) return s ? `${s}${plusz >= 0 ? '+' : ''}${plusz}` : '';
  const ossz = (m[2] ? parseInt(m[2], 10) : 0) + plusz;
  return m[1] + (ossz === 0 ? '' : (ossz > 0 ? '+' : '') + ossz);
}

// A tulajdonság neve szerint (a fegyverek reszletek mezője így hivatkozik rá) az azonosító.
function tulajdonsagNevbol(ix, nev) {
  if (!nev) return null;
  if (TULAJDONSAGOK.includes(nev)) return nev;
  const t = (ix.lapok['Tulajdonságok'] || []).find((x) => x.nev_hu === nev || x.nev_en === nev);
  return t ? t.id : null;
}

export function karakterSzamol(nyers, lapok) {
  const adat = atallit(nyers);
  const ix = index(lapok);
  const f0 = gyujto(adat);
  // Az átvett (korábbi szerkezetű) karakternél nincsenek szintenkénti dobások, ezek hiányát nem jelezzük.
  const atvett = adat.keszites.allapot === 'atvett';
  const f = Object.assign((kod, ...m) => (atvett && kod === 'hianyzo_dobas' ? undefined : f0(kod, ...m)), { lista: f0.lista });

  const faj = ix.elem('Fajok', adat.faj);
  const fr = reszletek(faj);
  const osztaly = ix.elem('Osztályok', adat.osztaly);
  const or = reszletek(osztaly);
  if (adat.faj && !faj) f('ismeretlen_faj', adat.faj, `A faj („${adat.faj}”) nincs a szabályadatbázisban, a faji értékek nem számolódnak.`, 'faj', 'info');
  if (adat.osztaly && !osztaly) f('ismeretlen_osztaly', adat.osztaly, `Az osztály („${adat.osztaly}”) nincs a szabályadatbázisban, az osztályértékek nem számolódnak.`, 'osztaly', 'info');

  // ---- Tulajdonságok: alap és faj ----
  const tul = {};
  TULAJDONSAGOK.forEach((t) => {
    tul[t] = { reszek: [{ ertek: szam(adat.tulajdonsag_alap[t]), eredet: 'Alapérték' }], fejlesztes_fuggo: 0 };
  });
  const tulAd = (t, ertek, eredet) => { if (tul[t]) tul[t].reszek.push({ ertek, eredet }); };
  const tulErtek = (t) => (tul[t] ? ertekBol(tul[t].reszek) : 0);
  Object.entries(fr.tulajdonsag_bonusz || {}).forEach(([t, n]) => tulAd(t, szam(n), 'Faj: ' + nevE(faj)));

  // ---- Fegyvercsoportok ----
  const csoportok = new Map(); // id → [eredet]
  const csoportAd = (id, eredet) => { if (!id) return; if (!csoportok.has(id)) csoportok.set(id, []); csoportok.get(id).push(eredet); };
  (or.fegyvercsoportok || []).forEach((c) => csoportAd(c, 'Osztály: ' + nevE(osztaly)));
  (adat.osztaly_dontes.fegyvercsoportok || []).forEach((c) => csoportAd(c, 'Osztály, választott'));

  // ---- Fókuszok ----
  const fokuszok = new Map(); // id → [{ eredet, szint }]
  const fokuszAd = (id, eredet, szint, bonusz) => {
    if (!id) return;
    if (!fokuszok.has(id)) fokuszok.set(id, []);
    fokuszok.get(id).push({ eredet, szint: szint || 1, bonusz });
  };
  if (adat.faj_dontes.fokusz) fokuszAd(adat.faj_dontes.fokusz, 'Faj: ' + nevE(faj), 1);

  // ---- Faji előnyök ----
  const kepessegek = [];
  let fajiPancel = 0;
  const elonyok = adat.faj_dontes.elonyok || [];
  elonyok.forEach((e, i) => {
    const sor = e.sajat || (fr.elonytabla || []).find((s) => tartomanyban(s.dobas, szam(e.dobas)));
    const eredet = `Faji előny (${i + 1}. dobás${e.dobas ? ': ' + e.dobas : ''})`;
    if (!sor) {
      if (faj) f('faji_elony_hianyzik', String(i), `A ${i + 1}. faji előnydobás (${e.dobas || 'nincs megadva'}) nem illik az előnytáblára.`, 'faj');
      return;
    }
    if (sor.tipus === 'tulajdonsag') tulAd(sor.ertek, szam(sor.mertek, 1), eredet);
    else if (sor.tipus === 'fokusz') fokuszAd(sor.ertek, eredet, 1);
    else if (sor.tipus === 'fegyvercsoport') {
      const cs = ix.csoportFokuszbol(sor.helyettes);
      const id = cs ? cs.id : (sor.id || 'fcs_' + String(sor.ertek || '').toLowerCase().replace(/[^a-z]+/g, '_'));
      // Ha az osztály már adja (vagy a készítő így döntött), a csoporthoz tartozó fókusz jár helyette.
      if (e.csere_fokusz || csoportok.has(id)) fokuszAd(e.csere_fokusz || sor.helyettes, eredet + ', fegyvercsoport helyett', 1);
      else csoportAd(id, eredet);
    } else {
      const leiras = sor.leiras || '';
      kepessegek.push({ nev_hu: sor.nev_hu || 'Faji előny', leiras, eredet, tipus: sor.tipus });
      const pm = leiras.match(/Páncélérték \+(\d+)/);
      if (szam(sor.pancelertek_bonusz) || pm) fajiPancel += szam(sor.pancelertek_bonusz) || Number(pm[1]);
      if (sor.tipus === 'szoveg') f('faji_elony_kezi', String(i), `A(z) ${i + 1}. faji előny („${leiras}”) hatását kézi módosítóként kell felvenni.`, 'faj', 'info');
    }
  });
  if (faj && fr.sotetlatas) kepessegek.push({ nev_hu: 'Sötétlátás', leiras: '20 yardig lát sötétben fényforrás nélkül.', eredet: 'Faj: ' + nevE(faj), tipus: 'faj' });

  // ---- Háttér ----
  const hatter = ix.elem('Hátterek', adat.hatter.id);
  if (adat.hatter.fokusz) fokuszAd(adat.hatter.fokusz, 'Háttér: ' + nevE(hatter, 'háttér'), 1);
  const tarsadalmiOsztaly = reszletek(hatter).tarsadalmi_osztaly || adat.hatter.tarsadalmi_osztaly || null;

  // ---- Szintek: Egészség, Mágiapont, fejlesztések, fókuszok, kapott elemek ----
  const szint1 = osztaly ? ix.szintSor(osztaly.id, 1) : null;
  const magus = !!(reszletek(szint1).kepessegek || []).find((k) => k.tipus === 'mp');
  const arkAlt = reszletek(ix.elem('Arkánumok', 'ark_altalanos'));
  const mpAlap = szam(String(arkAlt.mp_kezdo || '10').split('+')[0], 10);
  const eg = [];
  const mp = [];
  const kapott = []; // { tipus, id, szint }
  const fuggo = {}; // tulajdonság → félig fizetett fejlesztés
  adat.szintek.forEach((s) => {
    const n = s.szint;
    const szov = `${n}. szint`;
    const szv = tulErtek('tul_constitution');
    const akv = tulErtek('tul_willpower');
    if (n === 1) {
      if (or.kezdo_egeszseg) {
        eg.push({ ertek: szam(or.kezdo_egeszseg.alap), eredet: 'Osztály: ' + nevE(osztaly) });
        eg.push({ ertek: szv, eredet: 'Szívósság (1. szint)' });
        eg.push({ ertek: szam(s.egeszseg_dobas), eredet: 'Dobás (1. szint)' });
        if (s.egeszseg_dobas === null || s.egeszseg_dobas === undefined) f('hianyzo_dobas', 'egeszseg:1', 'Hiányzik a kezdő Egészség dobása (1d6).', 'osztaly');
      }
      if (magus) {
        mp.push({ ertek: mpAlap, eredet: 'Mágikus képzés' }, { ertek: akv, eredet: 'Akaraterő (1. szint)' }, { ertek: szam(s.mp_dobas), eredet: 'Dobás (1. szint)' });
        if (s.mp_dobas === null || s.mp_dobas === undefined) f('hianyzo_dobas', 'mp:1', 'Hiányzik a kezdő Mágiapont dobása (1d6).', 'osztaly');
      }
    } else {
      if (n <= 10) {
        eg.push({ ertek: szam(s.egeszseg_dobas) + szv, eredet: `${szov}: dobás ${szam(s.egeszseg_dobas)} + Szívósság ${szv}` });
        if (s.egeszseg_dobas === null || s.egeszseg_dobas === undefined) f('hianyzo_dobas', 'egeszseg:' + n, `Hiányzik az Egészség dobása (${szov}).`, 'szintlepes');
      } else eg.push({ ertek: Math.max(1, szv), eredet: `${szov}: Szívósság (legalább 1)` });
      if (magus) {
        if (n <= 10) {
          mp.push({ ertek: szam(s.mp_dobas) + akv, eredet: `${szov}: dobás ${szam(s.mp_dobas)} + Akaraterő ${akv}` });
          if (s.mp_dobas === null || s.mp_dobas === undefined) f('hianyzo_dobas', 'mp:' + n, `Hiányzik a Mágiapont dobása (${szov}).`, 'szintlepes');
        } else mp.push({ ertek: akv, eredet: `${szov}: Akaraterő` });
      }
      if (s.fejlesztes && tul[s.fejlesztes]) {
        const t = s.fejlesztes;
        fuggo[t] = (fuggo[t] || 0) + 1;
        const cel = tulErtek(t) + 1;
        if (fuggo[t] >= fejlesztesKoltseg(cel)) {
          fuggo[t] -= fejlesztesKoltseg(cel);
          tulAd(t, 1, `Fejlesztés (${szov})`);
        }
      }
    }
    if (s.fokusz) fokuszAd(s.fokusz, `Szintlépés (${szov})`, n);
    (s.kapott || []).forEach((k) => {
      if (!k || !k.id) return;
      if (k.tipus === 'fokusz') fokuszAd(k.id, `Osztály (${szov})`, n);
      else if (k.tipus === 'fegyvercsoport') csoportAd(k.id, `Osztály (${szov})`);
      else kapott.push({ tipus: k.tipus, id: k.id, szint: n });
    });
  });
  TULAJDONSAGOK.forEach((t) => { tul[t].fejlesztes_fuggo = fuggo[t] || 0; });
  const szint = adat.szintek.length ? adat.szintek[adat.szintek.length - 1].szint : 1;

  // ---- Talentumok, arkánumok, specializációk, varázslatok ----
  const fokozatos = (tipus, lap) => {
    const db = new Map();
    kapott.filter((k) => k.tipus === tipus).forEach((k) => {
      if (!db.has(k.id)) db.set(k.id, { id: k.id, elem: ix.elem(lap, k.id), szintek: [] });
      db.get(k.id).szintek.push(k.szint);
    });
    return [...db.values()].map((x) => ({ ...x, nev_hu: nevE(x.elem, x.id), fokozat: fokozatNev(x.szintek.length), db: x.szintek.length }));
  };
  const talentumok = fokozatos('talentum', 'Talentumok');
  const arkanumok = fokozatos('arkanum', 'Arkánumok');
  const specializaciok = fokozatos('specializacio', 'Specializációk');
  const varazslatok = kapott.filter((k) => k.tipus === 'varazslat').map((k) => {
    const e = ix.elem('Varázslatok', k.id);
    return { id: k.id, elem: e, nev_hu: nevE(e, k.id), szint: k.szint, arkanum: e ? e.arkanum : null, fokozat: e ? e.fokozat : null };
  });
  // Arkánumfókusz: az arkánum megadott fokozatától (Alapkönyv: Haladó) jár.
  arkanumok.forEach((a) => {
    const r = reszletek(a.elem);
    if (r.fokusz && a.db >= (fokozatSzam(r.fokusz_fokozat || 'Haladó') || 2)) fokuszAd(r.fokusz, `${a.nev_hu} (${r.fokusz_fokozat || 'Haladó'})`, Math.max(...a.szintek));
  });
  const talentumFokozat = (id) => { const t = talentumok.find((x) => x.id === id); return t ? t.db : 0; };

  // ---- Kézi módosítók ----
  const kezi = { egeszseg_max: [], magiapont_max: [], vedekezes: [], sebesseg: [], pancelertek: [] };
  const felulir = {};
  (adat.kezi || []).forEach((k, i) => {
    if (!k || !k.cel) return;
    const eredet = 'Kézi' + (k.megjegyzes ? ': ' + k.megjegyzes : '');
    const ertek = szam(k.ertek);
    if (k.cel.startsWith('tul_')) {
      if (k.mod === 'felulir') tul[k.cel] && (tul[k.cel].reszek.push({ ertek: ertek - tulErtek(k.cel), eredet: eredet + ' (felülírás)' }));
      else tulAd(k.cel, ertek, eredet);
    } else if (k.cel.startsWith('fok_')) fokuszAd(k.cel, eredet, 1, ertek >= 3 ? 3 : undefined);
    else if (k.cel.startsWith('fcs_')) csoportAd(k.cel, eredet);
    else if (kezi[k.cel]) {
      if (k.mod === 'felulir') felulir[k.cel] = { ertek, eredet: eredet + ' (felülírás)' };
      else kezi[k.cel].push({ ertek, eredet });
    }
    f('kezi_modosito', String(i), `Kézi módosító: ${k.cel} ${k.mod === 'felulir' ? '= ' : (ertek >= 0 ? '+' : '')}${ertek}${k.megjegyzes ? ' (' + k.megjegyzes + ')' : ''}.`, 'karakterlap', 'info');
  });
  const vegso = (kulcs, reszek) => {
    const r = reszek.concat(kezi[kulcs] || []);
    if (felulir[kulcs]) return { ertek: felulir[kulcs].ertek, reszek: [felulir[kulcs]], szamolt: ertekBol(r) };
    return { ertek: ertekBol(r), reszek: r };
  };

  // ---- Végső tulajdonságok és fókuszok ----
  const tulajdonsagok = {};
  TULAJDONSAGOK.forEach((t) => { tulajdonsagok[t] = { ertek: tulErtek(t), reszek: tul[t].reszek, fejlesztes_fuggo: tul[t].fejlesztes_fuggo }; });
  const fokuszLista = {};
  fokuszok.forEach((forrasok, id) => {
    const e = ix.elem('Fókuszok', id);
    const ketszer = forrasok.length >= 2 && forrasok.some((x) => x.szint >= 11 && /^Szintlépés/.test(x.eredet));
    const keziHarom = forrasok.some((x) => x.bonusz === 3);
    fokuszLista[id] = {
      id, nev_hu: nevE(e, id), tulajdonsag: e ? e.tulajdonsag : null,
      bonusz: ketszer || keziHarom ? 3 : 2, forrasok
    };
  });

  // ---- Felszerelés: páncél, pajzs, fegyverek ----
  const targyElem = (id) => ix.elem(id.startsWith('fgy_') ? 'Fegyverek' : id.startsWith('pan_') ? 'Páncélok' : 'Felszerelés', id);
  const targyak = (adat.felszereles.targyak || []).filter((t) => t && t.id).map((t) => ({ ...t, elem: targyElem(t.id) }));
  const viselt = targyak.filter((t) => t.felszerelve && t.elem && t.id.startsWith('pan_'));
  const pancelT = viselt.find((t) => reszletek(t.elem).tipus === 'pancel') || null;
  const pajzsT = viselt.find((t) => reszletek(t.elem).tipus === 'pajzs') || null;

  let sebessegBuntetes = 0;
  let ugyessegBuntetes = 0;
  const pancelReszek = [];
  if (pancelT) {
    const b = Math.abs(szam(pancelT.elem.buntetes));
    pancelReszek.push({ ertek: szam(pancelT.elem.pancelertek), eredet: nevE(pancelT.elem) });
    // Zsiványpáncél: bőrpáncélban nincs büntetés (Alapkönyv 23. o.).
    const zsivanyPancel = (reszletek(szint1).kepessegek || []).some((k) => k.nev_en === "Rogue's Armor" || k.pancel_buntetes_nincs);
    const bor = /leather/.test(pancelT.id);
    if (!(zsivanyPancel && bor)) {
      sebessegBuntetes = b;
      // Páncélviselet: Kezdő fokon bőr- és sodronypáncélban, Haladó fokon lemezpáncélban sincs Ügyesség-büntetés.
      const lemez = /plate/.test(pancelT.id);
      const kepzett = talentumFokozat('tal_armor_training') >= (lemez ? 2 : 1);
      if (!kepzett) ugyessegBuntetes = b;
    }
  }
  if (fajiPancel) pancelReszek.push({ ertek: fajiPancel, eredet: 'Faji előny (Páncélos)' });

  const ugyesseg = tulErtek('tul_dexterity');
  const vedReszek = [{ ertek: 10, eredet: 'Alap' }, { ertek: ugyesseg, eredet: 'Ügyesség' }];
  if (pajzsT) {
    const pr = reszletek(pajzsT.elem);
    const alt = reszletek(ix.elem('Páncélok', 'pan_altalanos'));
    const talentum = alt.pajzs_talentum || 'tal_weapon_and_shield_style';
    let bonusz = szam(pr.pajzs_bonusz);
    if (!talentumFokozat(talentum) && alt.pajzs_max_talentum_nelkul !== undefined) bonusz = Math.min(bonusz, szam(alt.pajzs_max_talentum_nelkul));
    vedReszek.push({ ertek: bonusz, eredet: nevE(pajzsT.elem) });
  }
  const sebReszek = faj ? [{ ertek: szam(fr.sebesseg_alap, 10), eredet: 'Faj: ' + nevE(faj) }, { ertek: ugyesseg, eredet: 'Ügyesség' }] : [];
  if (faj && sebessegBuntetes) sebReszek.push({ ertek: -sebessegBuntetes, eredet: 'Páncélbüntetés' });

  const fegyverAlt = reszletek(ix.elem('Fegyverek', 'fgy_altalanos'));
  const eszlelesCsoportok = fegyverAlt.eszleles_sebzes_csoportok || ['fcs_black_powder', 'fcs_bows'];
  const fegyverek = targyak.filter((t) => t.id.startsWith('fgy_') && t.elem).map((t) => {
    const e = t.elem;
    const r = reszletek(e);
    const cs = ix.elem('Fegyvercsoportok', e.csoport);
    const csr = reszletek(cs);
    const tulId = csr.tulajdonsag || tulajdonsagNevbol(ix, r.tulajdonsag) || 'tul_fighting';
    const fok = csr.fokusz && fokuszLista[csr.fokusz] ? fokuszLista[csr.fokusz].bonusz : 0;
    const ismert = csoportok.has(e.csoport);
    const tamadas = tulErtek(tulId) + fok + (ismert ? 0 : szam((fegyverAlt.kepzetlen || {}).tamadas, -2));
    const sebzesTul = eszlelesCsoportok.includes(e.csoport) ? 'tul_perception' : (tulajdonsagNevbol(ix, r.sebzes_tulajdonsag) || 'tul_strength');
    let sebzes = sebzesSzoveg(e.sebzes, tulErtek(sebzesTul));
    if (!ismert) sebzes = `(${sebzes}) / 2`;
    const minEro = e.min_ero === '' || e.min_ero === null || e.min_ero === undefined ? null : szam(e.min_ero);
    return {
      id: t.id, nev_hu: nevE(e), csoport: e.csoport, csoport_nev: nevE(cs, e.csoport), felszerelve: !!t.felszerelve,
      tulajdonsag: tulId, fokusz: csr.fokusz && fokuszLista[csr.fokusz] ? csr.fokusz : null,
      tamadas, sebzes, sebzes_tulajdonsag: sebzesTul, ismert, min_ero: minEro,
      min_ero_alatt: minEro !== null && tulErtek('tul_strength') < minEro,
      hatotav: e.hatotav || null, ketkezes: !!r.ketkezes, tavolsagi: !!r.tavolsagi
    };
  });

  // ---- Osztályképességek a szintig ----
  if (osztaly) {
    for (let n = 1; n <= szint; n++) {
      const sor = ix.szintSor(osztaly.id, n);
      (reszletek(sor).kepessegek || []).forEach((k) => {
        if (['kepesseg', 'mutatvany_kedvezmeny', 'mp'].includes(k.tipus)) kepessegek.push({ nev_hu: k.nev_hu, nev_en: k.nev_en, leiras: k.leiras || '', eredet: `${nevE(osztaly)}, ${n}. szint`, tipus: k.tipus, szint: n });
      });
    }
  }

  const lap = {
    sema: adat.sema,
    nev: adat.nev, szint,
    faj: faj ? { id: faj.id, nev_hu: nevE(faj) } : (adat.faj ? { id: null, nev_hu: adat.faj } : null),
    osztaly: osztaly ? { id: osztaly.id, nev_hu: nevE(osztaly) } : (adat.osztaly ? { id: null, nev_hu: adat.osztaly } : null),
    hatter: hatter ? { id: hatter.id, nev_hu: nevE(hatter), tarsadalmi_osztaly: tarsadalmiOsztaly } : null,
    elsodleges: or.elsodleges || [], masodlagos: or.masodlagos || [],
    tulajdonsagok, fokuszok: fokuszLista,
    fegyvercsoportok: [...csoportok.entries()].map(([id, eredet]) => ({ id, nev_hu: nevE(ix.elem('Fegyvercsoportok', id), id), eredet })),
    talentumok, arkanumok, specializaciok, varazslatok,
    egeszseg: vegso('egeszseg_max', eg),
    magiapont: magus || felulir.magiapont_max || kezi.magiapont_max.length ? vegso('magiapont_max', mp) : null,
    vedekezes: vegso('vedekezes', vedReszek),
    sebesseg: faj || felulir.sebesseg ? vegso('sebesseg', sebReszek) : null,
    pancelertek: vegso('pancelertek', pancelReszek),
    pancel: pancelT ? { id: pancelT.id, nev_hu: nevE(pancelT.elem), buntetes: sebessegBuntetes, ugyesseg_buntetes: ugyessegBuntetes } : null,
    pajzs: pajzsT ? { id: pajzsT.id, nev_hu: nevE(pajzsT.elem) } : null,
    fegyverek,
    nyelvek: [...new Set([...(fr.nyelvek || []), ...(adat.alap.nyelvek || [])])],
    kepessegek,
    penz_rez: szam(adat.felszereles.penz_rez),
    allapot: adat.allapot
  };
  // Aktuális értékek: ha nincs megadva, a maximum.
  lap.egeszseg.aktualis = adat.allapot.egeszseg === null || adat.allapot.egeszseg === undefined ? lap.egeszseg.ertek : szam(adat.allapot.egeszseg);
  if (lap.magiapont) lap.magiapont.aktualis = adat.allapot.magiapont === null || adat.allapot.magiapont === undefined ? lap.magiapont.ertek : szam(adat.allapot.magiapont);

  ellenorzes(adat, ix, lap, { f, faj, fr, osztaly, or, hatter, magus, talentumFokozat });
  lap.figyelmeztetesek = f.lista();
  return lap;
}

// A karakter mentéskor eltárolt rövid kivonata (listákhoz, a kampány élő nézetéhez).
export function szamitottKivonat(lap) {
  const t = {};
  Object.entries(lap.tulajdonsagok).forEach(([k, v]) => { t[k] = v.ertek; });
  return {
    tulajdonsagok: t,
    fokuszok: Object.values(lap.fokuszok).map((x) => x.id),
    egeszseg_max: lap.egeszseg.ertek,
    magiapont_max: lap.magiapont ? lap.magiapont.ertek : null,
    vedekezes: lap.vedekezes.ertek,
    sebesseg: lap.sebesseg ? lap.sebesseg.ertek : null,
    pancelertek: lap.pancelertek.ertek,
    figyelmeztetes_db: lap.figyelmeztetesek.filter((x) => x.szint === 'figyelmeztetes' && !x.elfogadott).length
  };
}
