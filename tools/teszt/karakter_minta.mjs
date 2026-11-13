// Minimális szabályadat a karakterszámoló tesztjéhez. Csak játékmechanikai számok és azonosítók,
// leírások nélkül (a szabálykönyvek szövege nem kerülhet a repóba). Szerkezete a valódi
// Szabályadatbázisé (schema/sema.json, reszletek mező).

const T = [
  ['accuracy', 'Pontosság'], ['communication', 'Kommunikáció'], ['constitution', 'Szívósság'], ['dexterity', 'Ügyesség'],
  ['fighting', 'Harc'], ['intelligence', 'Intelligencia'], ['perception', 'Észlelés'], ['strength', 'Erő'], ['willpower', 'Akaraterő']
];
const fok = (t, nev, hu, forras = 'Alapkönyv', r = {}) => ({ id: `fok_${t}_${nev}`, nev_hu: hu, nev_en: nev, forras, tulajdonsag: `tul_${t}`, reszletek: r });
const fcs = (nev, hu, t) => ({ id: `fcs_${nev}`, nev_hu: hu, nev_en: nev, forras: 'Alapkönyv', reszletek: { tulajdonsag: `tul_${t}`, fokusz: `fok_${t}_${nev}` } });
const tal = (nev, hu, osztalyok, elofeltetel = [], forras = 'Alapkönyv') => ({ id: `tal_${nev}`, nev_hu: hu, nev_en: nev, forras, reszletek: { osztalyok, elofeltetel } });
const ELONY_EMBER = [
  { dobas: '2', tipus: 'tulajdonsag', ertek: 'tul_intelligence', mertek: 1 },
  { dobas: '3-4', tipus: 'fokusz', ertek: 'fok_constitution_stamina' },
  { dobas: '5', tipus: 'fokusz', ertek: 'fok_perception_searching' },
  { dobas: '6', tipus: 'fokusz', ertek: 'fok_communication_persuasion' },
  { dobas: '7-8', tipus: 'tulajdonsag', ertek: 'tul_constitution', mertek: 1 },
  { dobas: '9', tipus: 'fokusz', ertek: 'fok_communication_deception' },
  { dobas: '10-11', tipus: 'fokusz', ertek: 'fok_accuracy_brawling' },
  { dobas: '12', tipus: 'tulajdonsag', ertek: 'tul_dexterity', mertek: 1 }
];
const ELONY_ORK = [
  { dobas: '2', tipus: 'tulajdonsag', ertek: 'tul_constitution', mertek: 1 },
  { dobas: '7-8', tipus: 'tulajdonsag', ertek: 'tul_fighting', mertek: 1 },
  { dobas: '9', tipus: 'fegyvercsoport', ertek: 'Bludgeons', nev_hu: 'Zúzófegyverek', helyettes: 'fok_fighting_bludgeons' },
  { dobas: '10-11', tipus: 'fokusz', ertek: 'fok_accuracy_brawling' }
];
const MP = { tipus: 'mp', nev_hu: 'Mágiapont', nev_en: 'Magic Points', alap: 10, tulajdonsag: 'tul_willpower', kocka: '1d6' };
const CSOMAG = (db, pancel, extra = []) => ({ targyak: ['fel_backpack', 'fel_travelers_garb', 'fel_skin', ...extra], fegyver_db: db, pancel, feltetelek: [
  { ha_fegyver: ['fgy_long_bow'], targyak: ['fel_quiver', 'fel_arrows'] }, { ha_fegyver: ['fgy_crossbow'], targyak: ['fel_quiver', 'fel_bolts'] },
  { ha_talentum: 'tal_weapon_and_shield_style', targyak: ['pan_medium_shield'] }] });

export const LAPOK = {
  'Tulajdonságok': T.map(([id, hu], i) => ({ id: 'tul_' + id, nev_hu: hu, nev_en: id, forras: 'Alapkönyv', sorrend: i + 1, reszletek: {} })),
  'Fókuszok': [
    fok('accuracy', 'brawling', 'Verekedés'), fok('accuracy', 'bows', 'Íjak'), fok('accuracy', 'staves', 'Botok'),
    fok('communication', 'gambling', 'Szerencsejáték'), fok('communication', 'persuasion', 'Meggyőzés'), fok('communication', 'deception', 'Megtévesztés'),
    fok('constitution', 'swimming', 'Úszás'), fok('constitution', 'stamina', 'Állóképesség'), fok('constitution', 'drinking', 'Italbírás'),
    fok('dexterity', 'riding', 'Lovaglás'), fok('dexterity', 'stealth', 'Lopakodás'), fok('fighting', 'claws', 'Karmok'), fok('fighting', 'lances', 'Kopják'), fok('willpower', 'self_discipline', 'Önfegyelem'), fok('fighting', 'axes', 'Fejszék'), fok('fighting', 'bludgeons', 'Zúzófegyverek'),
    fok('intelligence', 'military_lore', 'Hadtudomány'), fok('intelligence', 'fire_arcana', 'Tűz arkánum', 'Alapkönyv', { arkanum: 'ark_fire' }),
    fok('intelligence', 'arcane_lore', 'Mágiaismeret'), fok('perception', 'searching', 'Keresés'), fok('strength', 'climbing', 'Mászás'),
    fok('strength', 'might', 'Erőkifejtés'), fok('willpower', 'courage', 'Bátorság')
  ],
  'Fajok': [
    { id: 'faj_human', nev_hu: 'Ember', nev_en: 'Human', forras: 'Alapkönyv', reszletek: { tulajdonsag_bonusz: { tul_fighting: 1 }, fokusz_valasztas: ['fok_dexterity_riding', 'fok_constitution_swimming'], sebesseg_alap: 10, sotetlatas: false, nyelvek: ['Közös nyelv'], elonydobasok: 2, elonytabla: ELONY_EMBER } },
    { id: 'faj_orc', nev_hu: 'Ork', nev_en: 'Orc', forras: 'Alapkönyv', reszletek: { tulajdonsag_bonusz: { tul_strength: 1 }, fokusz_valasztas: ['fok_constitution_stamina', 'fok_strength_might'], sebesseg_alap: 10, sotetlatas: true, nyelvek: ['Ork', 'Közös nyelv'], elonydobasok: 2, elonytabla: ELONY_ORK } },
    { id: 'faj_draak', nev_hu: 'Draak', nev_en: 'Draak', forras: 'Companion', reszletek: { tulajdonsag_bonusz: { tul_willpower: 1 }, fokusz_valasztas: ['fok_willpower_courage'], sebesseg_alap: 10, nyelvek: ['Draak', 'Közös nyelv'], elonydobasok: 2, elonytabla: [{ dobas: '3-4', tipus: 'kulonleges', nev_hu: 'Páncélos', leiras: 'Kemény pikkelyek.', pancelertek_bonusz: 2 }, { dobas: '7-8', tipus: 'tulajdonsag', ertek: 'tul_intelligence', mertek: 1 }], vegleges_valasztas: { nev_hu: 'Ellenállás a mágiával szemben', valaszthato: ['fok_intelligence_arcane_lore', 'fok_willpower_self_discipline'] } } },
    { id: 'faj_beastfolk', nev_hu: 'Vadnép', nev_en: 'Beastfolk', forras: 'Companion', reszletek: { tulajdonsag_bonusz: { tul_perception: 1 }, fokusz_valasztas: ['fok_perception_searching'], sebesseg_alap: 10, nyelvek: ['Vadnyelv', 'Közös nyelv'], elonydobasok: 1, elonytabla: ELONY_EMBER, fajta_valasztando: 2,
      fajtatabla: [
        { dobas: '5', nev_hu: 'Rágcsáló', elonyok_gepi: [{ tipus: 'kulonleges', nev_hu: '+1 Védekezés', vedekezes_bonusz: 1 }, { tipus: 'kulonleges', nev_hu: 'Sötétlátás', sotetlatas: true }, { tipus: 'fokusz', ertek: 'fok_dexterity_stealth' }] },
        { dobas: '6', nev_hu: 'Macskaféle', elonyok_gepi: [{ tipus: 'kulonleges', nev_hu: 'Karmok', termeszetes_fegyver: { sebzes: '1d6', tulajdonsag: 'tul_fighting', fokusz: 'fok_fighting_claws' } }, { tipus: 'fokusz', ertek: 'fok_fighting_claws' }] },
        { dobas: '7', nev_hu: 'Kutyaféle', elonyok_gepi: [{ tipus: 'kulonleges', nev_hu: '+2 Sebesség', sebesseg_bonusz: 2 }, { tipus: 'fokusz', ertek: 'fok_perception_searching', ha_megvan: { tipus: 'talentum', ertek: 'tal_lore' } }] }] } },
    { id: 'faj_blooded', nev_hu: 'Félvér', nev_en: 'Blooded', forras: 'Companion', reszletek: { tulajdonsag_bonusz: {}, fokusz_valasztas: [], sebesseg_alap: 10, nyelvek: ['Közös nyelv'], elonydobasok: 2,
      elonytabla: [{ dobas: '2', tipus: 'valasztas', jelleg: 'tulajdonsag', sorrend: 1, mertek: 1, leiras: '+1 a legmagasabb tulajdonsághoz' }, { dobas: '9', tipus: 'valasztas', jelleg: 'fokusz', sorrend: 1, leiras: 'Fókusz: a legmagasabb tulajdonság egy fókusza' }],
      alap_valasztas: [{ jelleg: 'tulajdonsag', sorrend: 1, mertek: 1, leiras: '+1 a legmagasabb tulajdonsághoz' }, { jelleg: 'fokusz', leiras: 'Egy fókusz' }] } }
  ],
  'Hátterek': [
    { id: 'hat_soldier', nev_hu: 'Katona', nev_en: 'Soldier', forras: 'Alapkönyv', csoport: 'Alsó osztály', reszletek: { tarsadalmi_osztaly: 'Alsó', dobas: '1d6: 5', fokusz_valasztas: ['fok_accuracy_brawling', 'fok_communication_gambling'] } },
    { id: 'hat_c_scholar', nev_hu: 'Tudós', nev_en: 'Scholar', forras: 'Companion', csoport: 'Arkán', reszletek: { tarsadalmi_osztaly: 'Közép', fokusz_valasztas: ['fok_intelligence_arcane_lore', 'fok_intelligence_military_lore'] } }
  ],
  'Osztályok': [
    { id: 'osz_warrior', nev_hu: 'Harcos', nev_en: 'Warrior', forras: 'Alapkönyv', reszletek: { elsodleges: ['tul_constitution', 'tul_dexterity', 'tul_fighting', 'tul_strength'], masodlagos: ['tul_accuracy', 'tul_communication', 'tul_intelligence', 'tul_perception', 'tul_willpower'], kezdo_egeszseg: { alap: 30, tulajdonsag: 'tul_constitution', kocka: '1d6' }, fegyvercsoportok: ['fcs_brawling'], fegyvercsoport_valasztas: { valaszthato: ['fcs_axes', 'fcs_bludgeons', 'fcs_bows', 'fcs_staves'], db: 3 }, kezdo_csomag: CSOMAG(3, 'pan_heavy_leather') } },
    { id: 'osz_rogue', nev_hu: 'Zsivány', nev_en: 'Rogue', forras: 'Alapkönyv', reszletek: { elsodleges: ['tul_accuracy', 'tul_communication', 'tul_dexterity', 'tul_perception'], masodlagos: ['tul_constitution', 'tul_fighting', 'tul_intelligence', 'tul_strength', 'tul_willpower'], kezdo_egeszseg: { alap: 25, tulajdonsag: 'tul_constitution', kocka: '1d6' }, fegyvercsoportok: ['fcs_brawling', 'fcs_staves'], fegyvercsoport_valasztas: { valaszthato: ['fcs_bows'], db: 1 }, kezdo_csomag: CSOMAG(2, 'pan_light_leather') } },
    { id: 'osz_mage', nev_hu: 'Mágus', nev_en: 'Mage', forras: 'Alapkönyv', reszletek: { elsodleges: ['tul_accuracy', 'tul_intelligence', 'tul_perception', 'tul_willpower'], masodlagos: ['tul_communication', 'tul_constitution', 'tul_dexterity', 'tul_fighting', 'tul_strength'], kezdo_egeszseg: { alap: 20, tulajdonsag: 'tul_constitution', kocka: '1d6' }, fegyvercsoportok: ['fcs_brawling', 'fcs_staves'], fegyvercsoport_valasztas: null, kezdo_csomag: CSOMAG(1, null, ['fel_arcane_device']) } }
  ],
  'Szintlépés': [
    { id: 'szint_altalanos', nev_hu: 'Szintlépés', reszletek: { tarsadalmi_osztaly_dobas: [{ dobas: '1', osztaly: 'Kívülálló' }, { dobas: '2-3', osztaly: 'Alsó' }, { dobas: '4-5', osztaly: 'Közép' }, { dobas: '6', osztaly: 'Felső' }], tulajdonsag_dobas: { '3': -2, '4-5': -1, '6-8': 0, '9-11': 1, '12-14': 2, '15-17': 3, '18': 4 }, kezdo_penz_ezust: { 'Kívülálló': '15 + 3d6', 'Alsó': '25 + 3d6', 'Közép': '50 + 3d6', 'Felső': '100 + 3d6' } } },
    { id: 'szint_warrior_01', osztaly: 'osz_warrior', szint: 1, reszletek: { kepessegek: [{ tipus: 'talentum_valasztas', nev_hu: 'Kezdő talentumok', valaszthato: ['tal_archery_style', 'tal_single_weapon_style', 'tal_two_hander_style', 'tal_weapon_and_shield_style'], valasztando: 2, kotelezo: ['tal_armor_training'] }] } },
    { id: 'szint_warrior_02', osztaly: 'osz_warrior', szint: 2, reszletek: { kepessegek: [{ tipus: 'fokusz_valasztas', nev_hu: 'Új fókusz', valaszthato: ['fok_dexterity_riding', 'fok_intelligence_military_lore', 'fok_strength_climbing'] }] } },
    { id: 'szint_warrior_03', osztaly: 'osz_warrior', szint: 3, reszletek: { kepessegek: [{ tipus: 'talentum', nev_hu: 'Új talentum' }] } },
    { id: 'szint_rogue_01', osztaly: 'osz_rogue', szint: 1, reszletek: { kepessegek: [{ tipus: 'kepesseg', nev_hu: 'Zsiványpáncél', nev_en: "Rogue's Armor", pancel_buntetes_nincs: ['pan_light_leather', 'pan_heavy_leather'] }] } },
    { id: 'szint_mage_01', osztaly: 'osz_mage', szint: 1, reszletek: { kepessegek: [{ tipus: 'kepesseg', nev_hu: 'Arkánlövés', nev_en: 'Arcane Blast' }, MP] } },
    { id: 'szint_mage_02', osztaly: 'osz_mage', szint: 2, reszletek: { kepessegek: [{ tipus: 'talentum', nev_hu: 'Új talentum' }] } }
  ],
  'Talentumok': [
    tal('armor_training', 'Páncélviselet', ['osz_warrior']),
    tal('archery_style', 'Íjász stílus', ['osz_rogue', 'osz_warrior'], [{ tipus: 'fegyvercsoport', egyik: ['fcs_bows'] }]),
    tal('single_weapon_style', 'Egyfegyveres stílus', ['osz_rogue', 'osz_warrior'], [{ tipus: 'tulajdonsag', ertek: 'tul_perception', min: 2 }]),
    tal('two_hander_style', 'Kétkezes stílus', ['osz_warrior'], [{ tipus: 'tulajdonsag', ertek: 'tul_strength', min: 3 }, { tipus: 'fegyvercsoport', egyik: ['fcs_axes', 'fcs_bludgeons'] }]),
    tal('weapon_and_shield_style', 'Fegyver és pajzs stílus', ['osz_rogue', 'osz_warrior'], [{ tipus: 'tulajdonsag', ertek: 'tul_strength', min: 2 }]),
    tal('lore', 'Műveltség', ['osz_mage', 'osz_rogue', 'osz_warrior'], [{ tipus: 'tulajdonsag', ertek: 'tul_intelligence', min: 2 }])
  ],
  'Specializációk': [
    { id: 'spec_knight', nev_hu: 'Lovag', nev_en: 'Knight', forras: 'Alapkönyv', osztaly: 'Harcos', reszletek: { osztalyok: ['osz_warrior'], elofeltetel: [{ tipus: 'tulajdonsag', ertek: 'tul_strength', min: 2 }, { tipus: 'talentum', egyik: ['tal_single_weapon_style', 'tal_archery_style'], fokozat: 'Kezdő' }], ad: { 'Kezdő': [{ tipus: 'fegyvercsoport', id: 'fcs_lances' }] } } }
  ],
  'Arkánumok': [
    { id: 'ark_altalanos', nev_hu: 'Mágia', reszletek: { mp_kezdo: '10 + Akaraterő + 1d6' } },
    { id: 'ark_fire', nev_hu: 'Tűz arkánum', nev_en: 'Fire Arcana', forras: 'Alapkönyv', reszletek: { osztalyok: ['osz_mage'], fokusz: 'fok_intelligence_fire_arcana', fokusz_fokozat: 'Haladó', valasztas: { 'Kezdő': { db: 2 }, 'Haladó': { db: 1 }, 'Mester': { db: 1 } } } },
    { id: 'ark_water', nev_hu: 'Víz arkánum', nev_en: 'Water Arcana', forras: 'Alapkönyv', reszletek: { osztalyok: ['osz_mage'], fokusz: 'fok_intelligence_water_arcana', fokusz_fokozat: 'Haladó', valasztas: { 'Kezdő': { db: 2 } } } }
  ],
  'Varázslatok': [
    { id: 'var_fire_a', nev_hu: 'Tűz A', forras: 'Alapkönyv', arkanum: 'ark_fire', fokozat: 'Kezdő', reszletek: {} },
    { id: 'var_fire_b', nev_hu: 'Tűz B', forras: 'Alapkönyv', arkanum: 'ark_fire', fokozat: 'Kezdő', reszletek: {} },
    { id: 'var_fire_c', nev_hu: 'Tűz C', forras: 'Alapkönyv', arkanum: 'ark_fire', fokozat: 'Haladó', reszletek: {} },
    { id: 'var_water_a', nev_hu: 'Víz A', forras: 'Alapkönyv', arkanum: 'ark_water', fokozat: 'Kezdő', reszletek: {} },
    { id: 'var_water_b', nev_hu: 'Víz B', forras: 'Alapkönyv', arkanum: 'ark_water', fokozat: 'Kezdő', reszletek: {} }
  ],
  'Fegyvercsoportok': [
    fcs('axes', 'Fejszék', 'fighting'), fcs('bludgeons', 'Zúzófegyverek', 'fighting'), fcs('bows', 'Íjak', 'accuracy'),
    fcs('brawling', 'Verekedés', 'accuracy'), fcs('staves', 'Botok', 'accuracy'), fcs('heavy_blades', 'Nehéz pengék', 'fighting'), fcs('lances', 'Kopják', 'fighting')
  ],
  'Fegyverek': [
    { id: 'fgy_altalanos', nev_hu: 'Fegyverhasználat', reszletek: { kepzetlen: { tamadas: -2, sebzes: 'fele' }, eszleles_sebzes_csoportok: ['fcs_black_powder', 'fcs_bows'] } },
    { id: 'fgy_two_handed_axe', nev_hu: 'Kétkezes fejsze', forras: 'Alapkönyv', csoport: 'fcs_axes', sebzes: '3d6', min_ero: '3', reszletek: { tulajdonsag: 'Harc', sebzes_tulajdonsag: 'Erő', ketkezes: true } },
    { id: 'fgy_mace', nev_hu: 'Buzogány', forras: 'Alapkönyv', csoport: 'fcs_bludgeons', sebzes: '2d6', min_ero: '1', reszletek: { tulajdonsag: 'Harc', sebzes_tulajdonsag: 'Erő' } },
    { id: 'fgy_crossbow', nev_hu: 'Számszeríj', forras: 'Alapkönyv', csoport: 'fcs_bows', sebzes: '2d6+1', min_ero: '1', reszletek: { tulajdonsag: 'Pontosság', sebzes_tulajdonsag: 'Észlelés', tavolsagi: true } },
    { id: 'fgy_long_bow', nev_hu: 'Hosszú íj', forras: 'Alapkönyv', csoport: 'fcs_bows', sebzes: '1d6+3', min_ero: '1', reszletek: { tulajdonsag: 'Pontosság', sebzes_tulajdonsag: 'Észlelés', tavolsagi: true } },
    { id: 'fgy_long_sword', nev_hu: 'Hosszú kard', forras: 'Alapkönyv', csoport: 'fcs_heavy_blades', sebzes: '2d6', min_ero: '1', reszletek: { tulajdonsag: 'Harc', sebzes_tulajdonsag: 'Erő' } }
  ],
  'Páncélok': [
    { id: 'pan_altalanos', nev_hu: 'Páncél', reszletek: { pajzs_max_talentum_nelkul: 1, pajzs_talentum: 'tal_weapon_and_shield_style' } },
    { id: 'pan_light_leather', nev_hu: 'Könnyű bőrpáncél', forras: 'Alapkönyv', pancelertek: '3', buntetes: '0', reszletek: { tipus: 'pancel' } },
    { id: 'pan_heavy_leather', nev_hu: 'Nehéz bőrpáncél', forras: 'Alapkönyv', pancelertek: '4', buntetes: '−1', reszletek: { tipus: 'pancel' } },
    { id: 'pan_heavy_mail', nev_hu: 'Nehéz sodronypáncél', forras: 'Alapkönyv', pancelertek: '7', buntetes: '−3', reszletek: { tipus: 'pancel' } },
    { id: 'pan_medium_shield', nev_hu: 'Közepes pajzs', forras: 'Alapkönyv', reszletek: { tipus: 'pajzs', pajzs_bonusz: 2 } }
  ],
  'Felszerelés': ['rope', 'backpack', 'travelers_garb', 'skin', 'quiver', 'arrows', 'bolts', 'arcane_device'].map((x) => ({ id: 'fel_' + x, nev_hu: x, forras: 'Alapkönyv', reszletek: {} }))
};
