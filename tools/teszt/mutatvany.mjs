// A mutatványkezelő szabályainak helyi tesztje (web/js/jatek/mutatvany.js). Futtatás: node tools/teszt/mutatvany.mjs
// Valódi szabályadattal is (a fájl a repón kívül marad): FAGE_SZABALYOK=/út/lapok.json node tools/teszt/mutatvany.mjs
import fs from 'node:fs';
import * as M from '../../web/js/jatek/mutatvany.js';

let hibak = 0;
let db = 0;
function ellenoriz(feltetel, leiras, extra) {
  db++;
  console.log((feltetel ? '✓ ' : '✗ ') + leiras + (feltetel || extra === undefined ? '' : '  ' + JSON.stringify(extra)));
  if (!feltetel) hibak++;
}

// ---------- Kitalált szabályadat (saját rövid leírásokkal, a szerkezet az Import 09 szerinti) ----------
const mut = (id, nev, tipus, min, max = min, extra = {}) => ({ id, nev_hu: nev, nev_en: nev, forras: extra.forras || 'Alapkönyv', tipus, aktiv: extra.aktiv !== false,
  leiras_hu: 'Teszt.', reszletek: { mp: { min, max, plusz: max === null }, ...(extra.r || {}) } });
const LAPOK = {
  'Mutatványok': [
    { id: 'mut_altalanos', nev_hu: 'Általános', tipus: 'szabály', reszletek: { szabaly: true } },
    mut('mut_skirmish', 'Helyezkedés', 'harc', 1, null, { r: { ismetelheto: true } }),
    mut('mut_mighty_blow', 'Hatalmas csapás', 'harc', 2),
    mut('mut_knock_prone', 'Földre döntés', 'harc', 2),
    mut('mut_lightning_attack', 'Villámtámadás', 'harc', 3),
    mut('mut_pierce_armor', 'Páncéltörés', 'harc', 2),
    mut('mut_threaten', 'Fenyegetés', 'harc', 2),
    mut('mut_lethal_blow', 'Halálos csapás', 'harc', 5),
    mut('mut_perforate', 'Átdöfés', 'harc', 2, 2, { r: { feltetel: { tipus: 'szint', id: 'szint_rogue_15' } } }),
    mut('mut_inspire', 'Lelkesítés', 'harc', 2, 2, { forras: 'Companion', r: { feltetel: { tipus: 'specializacio', id: 'spec_commander', fokozat: 'Kezdő' } } }),
    mut('mut_powerful_casting', 'Erőteljes varázslás', 'varázslat', 1, 3, { r: { ismetelheto: true } }),
    mut('mut_mighty_spell', 'Hatalmas varázslat', 'varázslat', 2),
    mut('mut_that_makes_me_wonder', 'Ez elgondolkodtat', 'felfedezés', 3),
    mut('mut_speedy_search', 'Gyors keresés', 'felfedezés', 2),
    mut('mut_jest', 'Tréfa', 'szerepjáték', 3),
    mut('mut_sway_the_crowd', 'Tömeg megnyerése', 'szerepjáték', 2, 2, { r: { ismetelheto: true } }),
    mut('mut_flirt', 'Flört', 'szerepjáték', 4),
    mut('mut_aha', 'Aha!', 'nyomozás', 1, 3, { forras: 'Kampányépítő', aktiv: false, r: { valaszthato_szabaly: true } }),
    mut('mut_mob_attack', 'Hordatámadás', 'horda', 1, null, { forras: 'Companion', aktiv: false }),
    mut('mut_cs_rending_blow', 'Hasító csapás', 'csomag', 4, 4, { forras: 'Companion', r: { osszetevok: ['mut_pierce_armor', 'mut_mighty_blow'], csomag_tipus: 'harc' } }),
    mut('mut_cs_take_point', 'Előretolt figyelő', 'csomag', 3, 3, { forras: 'Companion', r: { osszetevok: ['mut_speedy_search'], csomag_tipus: 'felfedezés' } })
  ],
  'Talentumok': [
    { id: 'tal_two_hander_style', nev_hu: 'Kétkezes stílus', reszletek: { mutatvany_hatasok: { halado: [{ tipus: 'ar', mutatvany: 'mut_mighty_blow', koltseg: 1, feltetel: 'kétkezes fegyverrel', feltetel_gepi: { ketkezes: true, tamadas: 'kozelharci' } }] } } },
    { id: 'tal_performance', nev_hu: 'Előadóművészet', reszletek: { mutatvany_hatasok: {
      kezdo: [{ tipus: 'valasztas', kulcs: 'tal_performance:kezdo', kerdes: '?', lehetosegek: [{ id: 'mut_jest', nev: 'Tréfa', mutatvanyok: ['mut_jest'] }, { id: 'mut_sway_the_crowd', nev: 'Tömeg', mutatvanyok: ['mut_sway_the_crowd'] }], hatas: { tipus: 'csokkent', mertek: 1, min: 0 } }],
      halado: [{ tipus: 'valasztas', kulcs: 'tal_performance:halado', kizar: 'tal_performance:kezdo', kerdes: '?', lehetosegek: [{ id: 'mut_jest', nev: 'Tréfa', mutatvanyok: ['mut_jest'] }, { id: 'mut_sway_the_crowd', nev: 'Tömeg', mutatvanyok: ['mut_sway_the_crowd'] }], hatas: { tipus: 'csokkent', mertek: 1, min: 0 } }] } } },
    { id: 'tal_observation', nev_hu: 'Megfigyelés', reszletek: { mutatvany_hatasok: { halado: [{ tipus: 'ar', mutatvany: 'mut_that_makes_me_wonder', koltseg: 2 }] } } }
  ],
  'Specializációk': [
    { id: 'spec_berserker', nev_hu: 'Berszerker', reszletek: { mutatvany_hatasok: { mester: [{ tipus: 'ar', mutatvany: 'mut_lethal_blow', koltseg: 4, feltetel: 'dühben' }] } } },
    { id: 'spec_swashbuckler', nev_hu: 'Vakmerő', reszletek: { mutatvany_hatasok: { mester: [{ tipus: 'csokkent', mutatvanyok: ['mut_lightning_attack'], mertek: 1, min: 1 }] } } },
    { id: 'spec_soulbound', nev_hu: 'Lélekkötött', reszletek: { mutatvany_hatasok: { kezdo: [{ tipus: 'csokkent', mutatvanyok: ['mut_mighty_spell', 'mut_powerful_casting'], mertek: 1, min: 0 }] } } },
    { id: 'spec_gangster', nev_hu: 'Gengszter', reszletek: { mutatvany_hatasok: { halado: [{ tipus: 'mp_plusz', ertek: 1, kinek: 'sajat', feltetel: 'Megtévesztés vagy Megfélemlítés', feltetel_gepi: { fokusz: ['fok_communication_deception', 'fok_strength_intimidation'] } }] } } },
    { id: 'spec_commander', nev_hu: 'Hadvezér', reszletek: { mutatvany_hatasok: { kezdo: [{ tipus: 'uj_mutatvany', mutatvany: 'mut_inspire' }] } } },
    { id: 'spec_paladin', nev_hu: 'Paladin', reszletek: { mutatvany_hatasok: { kezdo: [{ tipus: 'szoveg', mutatvanyok: ['mut_mighty_blow'], szoveg: '+ Akaraterő', feltetel: 'hited ellenségei ellen' }] } } }
  ],
  'Szintlépés': [
    { id: 'szint_rogue_02', osztaly: 'osz_rogue', szint: 2, reszletek: { kepessegek: [{ tipus: 'mutatvany_kedvezmeny', nev_hu: 'Mutatványkedvezmény', mutatvany: 'mut_pierce_armor', koltseg: 1 }] } },
    { id: 'szint_rogue_15', osztaly: 'osz_rogue', szint: 15, reszletek: { kepessegek: [{ tipus: 'kepesseg', nev_hu: 'Átdöfés' }] } },
    { id: 'szint_rogue_20', osztaly: 'osz_rogue', szint: 20, reszletek: { kepessegek: [{ tipus: 'kepesseg', nev_hu: 'Legendás zsivány', mutatvany_hatas: { tipus: 'valasztas', kulcs: 'legendas', kerdes: '?',
      lehetosegek: [{ id: 'harc', nev: 'harci' }, { id: 'felfedezés', nev: 'felfedezési' }], hatas: { tipus: 'mp_plusz', ertek: 1, kinek: 'sajat', mutatvany_tipus: true } } }] } },
    { id: 'szint_mage_13', osztaly: 'osz_mage', szint: 13, reszletek: { kepessegek: [{ tipus: 'mutatvany_kedvezmeny', nev_hu: 'Mutatványkedvezmény', mutatvany: 'mut_lightning_attack', koltseg: 2, feltetel: 'arkánlövésnél', feltetel_gepi: { kepesseg: 'arkanloves' } }] } }
  ]
};
const t = (id, n) => ({ id, nev_hu: LAPOK['Talentumok'].concat(LAPOK['Specializációk']).find((x) => x.id === id).nev_hu, db: n });
const harcos = { osztaly: { id: 'osz_warrior', nev_hu: 'Harcos' }, szint: 4, talentumok: [t('tal_two_hander_style', 2)], specializaciok: [] };
const kartya = (k, id) => { for (const cs of k.csoportok) { const m = cs.mutatvanyok.find((x) => x.id === id); if (m) return m; } return null; };
const csoport = (k, tipus) => k.csoportok.find((c) => c.tipus === tipus);

// ---------- Kínálat és sorrend ----------
let k = M.mutatvanyKinalat(LAPOK, harcos, { kontextus: { tipus: 'tamadas', fegyver: 'fgy_two_handed_axe', fegyvercsoport: 'fcs_axes', ketkezes: true, tamadas: 'kozelharci' } });
ellenoriz(k.elso === 'harc' && k.csoportok[0].tipus === 'harc', 'támadásnál a harci mutatványok elöl');
ellenoriz(kartya(k, 'mut_mighty_blow').ar.min === 1 && kartya(k, 'mut_mighty_blow').kedvezmenyek[0].eredet === 'Kétkezes stílus (Haladó)', 'kétkezes fegyverrel a Hatalmas csapás 1 pont (Kétkezes stílus, Haladó)', kartya(k, 'mut_mighty_blow'));
ellenoriz(!kartya(k, 'mut_mob_attack') && !kartya(k, 'mut_altalanos') && !kartya(k, 'mut_aha'), 'horda, szabálysor és kikapcsolt nyomozás nincs a kínálatban');
ellenoriz(!kartya(k, 'mut_perforate') && !kartya(k, 'mut_inspire'), 'szinthez vagy specializációhoz kötött mutatvány csak annak, akinek megvan');
ellenoriz(!!csoport(k, 'felfedezés') && !!csoport(k, 'szerepjáték') && !!csoport(k, 'csomag'), 'felfedezés, szerepjáték és csomagok alapból elérhetők');
k = M.mutatvanyKinalat(LAPOK, harcos, { kontextus: { tipus: 'tamadas', fegyver: 'fgy_long_sword', ketkezes: false, tamadas: 'kozelharci' } });
ellenoriz(kartya(k, 'mut_mighty_blow').ar.min === 2 && kartya(k, 'mut_mighty_blow').feltetelesek.length === 0, 'egykezes fegyverrel nincs kedvezmény (gépi feltétel)');
k = M.mutatvanyKinalat(LAPOK, harcos, { kontextus: { tipus: 'alap', tul: 'tul_perception' } });
ellenoriz(k.elso === 'felfedezés' && kartya(k, 'mut_mighty_blow').ar.min === 2, 'nem támadásnál a fegyveres kedvezmény nem él; Észlelésnél a felfedezés elöl');
k = M.mutatvanyKinalat(LAPOK, harcos, {});
const mb = kartya(k, 'mut_mighty_blow');
ellenoriz(mb.ar.min === 2 && mb.feltetelesek.length === 1 && mb.feltetelesek[0].feltetel === 'kétkezes fegyverrel', 'ismeretlen helyzetben a feltételes kedvezmény kapcsolóként jelenik meg', mb);
k = M.mutatvanyKinalat(LAPOK, harcos, { kapcsolok: { [mb.feltetelesek[0].kulcs]: true } });
ellenoriz(kartya(k, 'mut_mighty_blow').ar.min === 1, 'a bekapcsolt feltétellel érvényes a kedvezmény');
k = M.mutatvanyKinalat(LAPOK, harcos, { kontextus: { tul: 'tul_communication' } });
ellenoriz(k.elso === 'szerepjáték', 'Kommunikáció próbánál a szerepjáték elöl');

// ---------- Kampány beállítás és források ----------
k = M.mutatvanyKinalat(LAPOK, harcos, { beallitas: { mutatvanyok: { felfedezes: false, szerepjatek: false, nyomozas: true } } });
ellenoriz(!csoport(k, 'felfedezés') && !csoport(k, 'szerepjáték') && kartya(k, 'mut_aha'), 'a kampány kikapcsolhatja a felfedezést és a szerepjátékot, bekapcsolhatja a nyomozást');
ellenoriz(!kartya(k, 'mut_cs_take_point') && !!kartya(k, 'mut_cs_rending_blow'), 'kikapcsolt típus csomagja sem jelenik meg');
k = M.mutatvanyKinalat(LAPOK, harcos, { forrasok: ['Alapkönyv'] });
ellenoriz(!csoport(k, 'csomag') && !kartya(k, 'mut_inspire'), 'csak Alapkönyv: nincs Companion-csomag');

// ---------- Osztály, specializáció, választás ----------
const zsivany = { osztaly: { id: 'osz_rogue', nev_hu: 'Zsivány' }, szint: 20, talentumok: [t('tal_performance', 2), t('tal_observation', 2)],
  specializaciok: [t('spec_swashbuckler', 3), t('spec_gangster', 2), t('spec_berserker', 3), t('spec_commander', 1)] };
k = M.mutatvanyKinalat(LAPOK, zsivany, { kontextus: { tipus: 'tamadas', tamadas: 'kozelharci', fegyver: 'fgy_dagger' } });
ellenoriz(kartya(k, 'mut_pierce_armor').ar.min === 1, 'zsivány 2. szint: Páncéltörés 1 pont (Szintlépés lap)');
ellenoriz(kartya(k, 'mut_lightning_attack').ar.min === 2, 'Vakmerő Mester: Villámtámadás 1-gyel olcsóbb');
ellenoriz(!!kartya(k, 'mut_perforate') && kartya(k, 'mut_perforate').sajat && !!kartya(k, 'mut_inspire') && kartya(k, 'mut_inspire').sajat, 'saját mutatványok (Átdöfés, Lelkesítés) elérhetők és elöl jelölve');
ellenoriz(kartya(k, 'mut_lethal_blow').ar.min === 5 && kartya(k, 'mut_lethal_blow').feltetelesek[0].feltetel === 'dühben', 'szöveges feltétel (dühben) mindig kapcsoló');
ellenoriz(k.valasztandok.map((v) => v.kulcs).sort().join() === 'legendas,tal_performance:halado,tal_performance:kezdo', 'a még nem választott karakterdöntések', k.valasztandok);
ellenoriz(kartya(k, 'mut_that_makes_me_wonder').ar.min === 2, 'Megfigyelés Haladó: Ez elgondolkodtat 2 pont');
k = M.mutatvanyKinalat(LAPOK, zsivany, { valasztasok: { 'tal_performance:kezdo': 'mut_jest', 'tal_performance:halado': 'mut_jest', legendas: 'felfedezés' }, kontextus: { tul: 'tul_communication' } });
ellenoriz(kartya(k, 'mut_jest').ar.min === 2 && kartya(k, 'mut_sway_the_crowd').ar.min === 2, 'Előadóművészet: a Haladó választás nem lehet ugyanaz, mint a Kezdő (kizárva, újra kérdezi)');
ellenoriz(k.valasztandok.length === 1 && k.valasztandok[0].kulcs === 'tal_performance:halado' && k.valasztandok[0].lehetosegek.every((l) => l.id !== 'mut_jest'), 'a kizárt lehetőség nem választható');
k = M.mutatvanyKinalat(LAPOK, zsivany, { valasztasok: { 'tal_performance:kezdo': 'mut_jest', 'tal_performance:halado': 'mut_sway_the_crowd', legendas: 'felfedezés' } });
ellenoriz(kartya(k, 'mut_jest').ar.min === 2 && kartya(k, 'mut_sway_the_crowd').ar.min === 1 && k.valasztandok.length === 0, 'Előadóművészet: Tréfa és Tömeg megnyerése 1-gyel olcsóbb');

// ---------- Plusz pontok ----------
let p = M.pluszPontok(LAPOK, zsivany, { kontextus: { tipus: 'alap', tul: 'tul_communication', fokusz: 'fok_communication_deception' }, valasztasok: { legendas: 'felfedezés' } });
ellenoriz(p.some((x) => x.eredet.startsWith('Gengszter') && x.be && x.ertek === 1), 'Gengszter Haladó: Megtévesztésnél magától +1', p);
ellenoriz(p.some((x) => x.eredet.includes('Legendás') && !x.be && x.kapcsolhato), 'Legendás (felfedezés): szerepjátékos helyzetben kapcsolható, de nem bekapcsolt');
p = M.pluszPontok(LAPOK, zsivany, { kontextus: { tipus: 'alap', tul: 'tul_perception', fokusz: 'fok_perception_searching' }, valasztasok: { legendas: 'felfedezés' } });
ellenoriz(!p.some((x) => x.eredet.startsWith('Gengszter')) && p.some((x) => x.eredet.includes('Legendás') && x.be), 'Észlelésnél nincs Gengszter-pont, a Legendás felfedezési +1 bekapcsolva', p);

// ---------- Változó árak és kedvezmények ----------
const mago = { osztaly: { id: 'osz_mage', nev_hu: 'Mágus' }, szint: 13, talentumok: [], specializaciok: [t('spec_soulbound', 1)] };
k = M.mutatvanyKinalat(LAPOK, mago, { kontextus: { tipus: 'varazslas' } });
ellenoriz(k.elso === 'varázslat' && kartya(k, 'mut_powerful_casting').ar.min === 0 && kartya(k, 'mut_powerful_casting').ar.max === 2 && kartya(k, 'mut_mighty_spell').ar.min === 1, 'Lélekkötött: a változó árú Erőteljes varázslás is eltolódik (0–2), a Hatalmas varázslat 1', kartya(k, 'mut_powerful_casting').ar);
ellenoriz(kartya(k, 'mut_lightning_attack').ar.min === 3, 'varázslásnál az arkánlövés-kedvezmény nem él');
k = M.mutatvanyKinalat(LAPOK, mago, { kontextus: { tipus: 'tamadas', kepesseg: 'arkanloves', tamadas: 'tavolsagi' } });
ellenoriz(kartya(k, 'mut_lightning_attack').ar.min === 2, 'mágus 13. szint: arkánlövésnél Villámtámadás 2 pont');
k = M.mutatvanyKinalat(LAPOK, { ...harcos, specializaciok: [t('spec_paladin', 1)] }, { kapcsolok: {} });
ellenoriz(kartya(k, 'mut_mighty_blow').feltetelesek.some((f) => f.eredet.startsWith('Paladin')), 'feltételes szöveges hatás (Paladin) kapcsolóként');

// ---------- Kosár ----------
k = M.mutatvanyKinalat(LAPOK, harcos, { kontextus: { tipus: 'tamadas', ketkezes: true, tamadas: 'kozelharci', fegyver: 'fgy_two_handed_axe' } });
let kosar = M.kosarba([], kartya(k, 'mut_mighty_blow'));
kosar = M.kosarba(kosar, kartya(k, 'mut_skirmish'));
kosar = M.kosarba(kosar, kartya(k, 'mut_skirmish'));
let e = M.kosarEllenoriz(kosar, 4, k);
ellenoriz(e.osszes === 3 && e.maradt === 1 && e.hibak.length === 0 && kosar.find((x) => x.id === 'mut_skirmish').mp === 2, 'kosár: Hatalmas csapás 1 + Helyezkedés 2 pont, 1 maradt', { kosar, e });
ellenoriz(M.kosarba(kosar, kartya(k, 'mut_mighty_blow')).length === 2 && M.kosarba(kosar, kartya(k, 'mut_mighty_blow'))[0].db === 1, 'nem ismételhető mutatvány nem kerül be kétszer');
e = M.kosarEllenoriz(M.kosarba(kosar, kartya(k, 'mut_lethal_blow')), 4, k);
ellenoriz(e.maradt === -4 && e.hibak.some((h) => h.startsWith('Több pontot')), 'túlköltés jelzése');
e = M.kosarEllenoriz([{ id: 'mut_cs_rending_blow', mp: 4 }, { id: 'mut_pierce_armor', mp: 2 }], 6, k);
ellenoriz(e.hibak.some((h) => h.includes('Hasító csapás')), 'a csomag és a benne lévő mutatvány nem választható együtt');
e = M.kosarEllenoriz([{ id: 'mut_skirmish', mp: 0 }], 3, k);
ellenoriz(e.hibak.some((h) => h.includes('legalább')), 'változó árú mutatványnál a legkisebb ár');

// ---------- Valódi szabályadattal (ha meg van adva) ----------
const fajl = process.env.FAGE_SZABALYOK;
if (fajl && fs.existsSync(fajl)) {
  const L = JSON.parse(fs.readFileSync(fajl, 'utf8'));
  const harcos2 = { osztaly: { id: 'osz_warrior', nev_hu: 'Harcos' }, szint: 7, talentumok: [{ id: 'tal_two_hander_style', nev_hu: 'Kétkezes stílus', db: 2 }, { id: 'tal_pole_weapon_style', nev_hu: 'Szálfegyveres stílus', db: 3 }],
    specializaciok: [{ id: 'spec_knight', nev_hu: 'Lovag', db: 1 }] };
  const kv = M.mutatvanyKinalat(L, harcos2, { forrasok: ['Alapkönyv', 'Companion'], kontextus: { tipus: 'tamadas', fegyver: 'fgy_halberd', fegyvercsoport: 'fcs_polearms', ketkezes: true, tamadas: 'kozelharci' } });
  ellenoriz(kartya(kv, 'mut_mighty_blow').ar.min === 1 && kartya(kv, 'mut_knock_prone').ar.min === 1 && kartya(kv, 'mut_pierce_armor').ar.min === 2, 'valódi adat: alabárddal Hatalmas csapás 1, Földre döntés 1, Páncéltörés 2');
  ellenoriz(kartya(kv, 'mut_threaten').ar.min === 1 && kartya(kv, 'mut_dual_strike').ar.min === 3, 'valódi adat: Lovag Fenyegetés 1, harcos 5. szint Kettős csapás 3');
  ellenoriz(kv.csoportok.reduce((a, c) => a + c.mutatvanyok.length, 0) > 80, 'valódi adat: a kínálat elemszáma ' + kv.csoportok.reduce((a, c) => a + c.mutatvanyok.length, 0));
  const nev = new Set(); let rossz = [];
  ['Talentumok', 'Specializációk'].forEach((lap) => L[lap].forEach((x) => Object.values((x.reszletek || {}).mutatvany_hatasok || {}).flat().forEach((h) => {
    [h.mutatvany].concat(h.mutatvanyok || []).concat((h.lehetosegek || []).flatMap((l) => l.mutatvanyok || [])).filter(Boolean).forEach((id) => { nev.add(id); if (!L['Mutatványok'].some((m) => m.id === id)) rossz.push(id); });
  })));
  ellenoriz(nev.size > 25 && rossz.length === 0, `valódi adat: a hatások ${nev.size} mutatványra hivatkoznak, mind létezik`, rossz);
} else console.log('(valódi szabályadat nélkül: FAGE_SZABALYOK nincs megadva)');

console.log(hibak ? `\n${hibak} HIBA (${db} ellenőrzés)` : `\nMind a ${db} ellenőrzés sikeres.`);
process.exit(hibak ? 1 : 0);
