// Kampányépítő, 1. fejezet: a kampánykeret (Building the Campaign Framework) és a kampány-munkalap
// (Campaign Worksheet) mezői. Tiszta függvények és a könyv szerinti állandók (rövid saját magyar összefoglalók,
// a könyv szövege nélkül). A keret a Kampányok lap keret oszlopában van (JSON), csak a DM látja; a játékosoknak
// szóló része (bemutatás, szintsáv, karakterkészítési ajánlások) a kampány nézetében is megjelenik.
// Terv: claude/kampanyepito-terv.md, „1. fejezet”.

const masol = (x) => JSON.parse(JSON.stringify(x));
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x.filter((y) => y !== null && y !== undefined && y !== '') : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));

// A könyv lépései a felület sorrendjében (a munkalap fejléce, majd az 1. fejezet lépései).
export const LEPESEK = [
  { kulcs: 'alapok', nev: 'Keret, alműfaj, világ', en: 'Campaign Framework, Subgenre, Setting', oldal: '8, 123',
    utmutato: 'A munkalap fejléce: milyen keretben játszotok, milyen alműfajban, melyik világban és honnan indultok. A könyv keret-példái kiindulópontnak választhatók.' },
  { kulcs: 'tema', nev: 'Téma', en: 'Choose a Theme', oldal: '5',
    utmutato: 'Egy mondat arról, mit várnak a hősöktől: a világ megmondja, hol vannak, a stílus, milyen kalandok jönnek, a téma, hogy mit kell tenniük. Minél erősebb a téma, annál könnyebb hozzá karaktert alkotni.' },
  { kulcs: 'jatekosok', nev: 'Ismerd a játékosaidat', en: 'Know Your Players', oldal: '5–6',
    utmutato: 'Nem csak az számít, mit mondanak, hanem az is, mit élveznek valójában. Jegyezd fel, ki mit szeret (harc, felfedezés, szerepjáték), és mire kell figyelni.' },
  { kulcs: 'veg', nev: 'Kezdd a végével', en: 'Start with the End', oldal: '6',
    utmutato: 'Hol és hogyan érhet véget a kampány? Minél részletesebb a záró jelenet, annál több kérdést ad, amelyből visszafelé építkezhetsz.' },
  { kulcs: 'visszafele', nev: 'Haladj visszafelé', en: 'Work Your Way Backwards', oldal: '6–7',
    utmutato: 'Gondold végig a végső ellenfelet: mi a célja, hogyan dolgozik, kikre támaszkodik. Döntsd el azt is, hány szinten át tart a kampány, és ehhez illik-e az ellenfél ereje.' },
  { kulcs: 'kihivasok', nev: 'Az út kihívásai', en: 'The Challenges of the Road', oldal: '7',
    utmutato: 'A kihívások harci, felfedezési és szerepjátékos jellegűek; a keret szerint más az arányuk. Itt gyűjtsd össze az ellenfél embereit is (a gonosztevők képtára).' },
  { kulcs: 'ivek', nev: 'A kampány ívei', en: 'Campaign Arcs', oldal: '14',
    utmutato: 'A karakterek nagyjából négyszintenként változnak meg, ezért a kampány öt ívre bontható. Ívenként: cél, fő ellenfél, fő kihívások, fő helyszínek. Itt tervezhető a keret szándékos váltása is.' },
  { kulcs: 'jutalmak', nev: 'Jutalomtérkép', en: 'Reward Mapping', oldal: '69–71, 125',
    utmutato: 'A munkalap második oldala: szintsávonként milyen címeket, tagságokat, társakat, mágikus tárgyakat és kincset terveznek a hősök elérni. Mérföldkövek ezek, és célt adnak a játékosoknak. Ne tervezz túl sokat: csak ami a karakterekhez és a céljaikhoz illik; a váratlanhoz később is alkothatsz jutalmat.' },
  { kulcs: 'kalandra_hivas', nev: 'Kalandra hívás', en: 'A Call to Adventure', oldal: '7',
    utmutato: 'Most indulj az elejéről: hol kapcsolódnak be a hősök? A karakterkészítéshez ajánlásokat adhatsz (biztatni jobb, mint tiltani). A bemutatást és az ajánlásokat a játékosok a karakterkészítőben látják.' },
  { kulcs: 'szabalyok', nev: 'Választható szabályok és mutatványok', en: 'Optional Rules, Stunt Additions', oldal: '111–114, 124',
    utmutato: 'A munkalap jelölőnégyzetei. Amit az app már ismer (isteni és nyomozási mutatványok), az itt be is kapcsolható; a többi emlékeztető jelölés.' }
];

// A könyv keret-példái (Campaign Framework Examples), rövid saját összefoglalóval.
export const KERET_PELDAK = [
  { id: 'zsoldosok', nev_hu: 'Zsoldosok', nev_en: 'Mercenaries', oldal: 8,
    osszefoglalo: 'A hősök egy zsoldoscsapat tagjai, akik a nevükért és pénzért vállalnak megbízást. Érdemes nevet adni a csapatnak, és eldönteni, mit nem vállalnak el; a kampány gyakran arról szól, hogyan sodorja bajba őket egy rossz megbízás.' },
  { id: 'nyilt_tenger', nev_hu: 'Kalandok a nyílt tengeren', nev_en: 'High-Seas Adventure', oldal: 8,
    osszefoglalo: 'Kalózok vagy kaperek a saját hajójukon: zsákmány, elfeledett földek, kincs. A hajó neve és lobogója a hírnevük, a tenger maga is ellenfél, és kell egy szabad kikötő, ahol megpihenhetnek.' },
  { id: 'pusztasag', nev_hu: 'A pusztaság', nev_en: 'The Wasteland', oldal: 9,
    osszefoglalo: 'Egy egykori birodalom romba dőlt földjén járnak, kincset keresnek vagy másokat vezetnek át rajta. A régi és a mostani világ különbsége (technika, mágia, nyelv) adja a keret ízét.' },
  { id: 'huberbirtokok', nev_hu: 'Hűbérbirtokok játszmája', nev_en: 'A Game of Fiefs', oldal: 9,
    osszefoglalo: 'Egy nemesi ház tagjai vagy hívei a hűbéri cselszövések közepén: szövetségek, belső és külső fenyegetés, és a birtok mindennapi gondjai. Vigyázni kell, hogy a rangok ne bontsák meg a csapatot.' },
  { id: 'csatornak_cehek', nev_hu: 'Csatornák és céhek', nev_en: 'Gutters & Guilds', oldal: 10,
    osszefoglalo: 'Az egész kampány egy városban zajlik, a hősök legális és illegális megbízásokat teljesítenek. A megbízók és az áldozatok gyakran egyformák, a kapcsolatok hálója fontos, és minden küldetésnek ára van.' },
  { id: 'homokozo', nev_hu: 'Homokozó', nev_en: 'Sandbox Campaigns', oldal: 11,
    osszefoglalo: 'Nincs rögzített keret: a DM megadja a világ határait és a benne lévő lehetőségeket, a játékosok döntik el, merre indulnak. Lehet egy egész kontinens vagy egyetlen falu is.' },
  { id: 'pengek_borzalmak', nev_hu: 'Pengék a borzalmak ellen', nev_en: 'Blades against the Horrors', oldal: 11,
    osszefoglalo: 'Történelmi hangulatú világ, ahol a csoda és a mágia ritka és félelmetes. A hősök azon kevesek közé tartoznak, akik szembeszállnak a természetfeletti fenyegetéssel; a hangulat és az elszigetelt helyszín a lényeg.' },
  { id: 'szabadsag', nev_hu: 'Szabadságot!', nev_en: 'Cry Freedom!', oldal: 12,
    osszefoglalo: 'Egy elnyomó birodalom alatt kezdenek, és fellázadnak ellene. Nem kell mindenkinek idealistának lennie; a kalandok közvetlen és közvetett csapások a birodalom ellen, a kép lehet fekete-fehér vagy árnyaltabb is.' },
  { id: 'kuldetes', nev_hu: 'A küldetés', nev_en: 'The Quest', oldal: 12,
    osszefoglalo: 'A klasszikus nagy küldetés, amely az egész világot megváltoztatja, és jól társítható a többi kerettel. Megbízás, teljesítés, szembenézés a valódi fenyegetéssel, végül a következmények.' }
];

// Alműfajok (9. fejezet, Subgenre Types). A keverék (Mash-Up) több alműfaj együtt.
export const ALMUFAJOK = [
  { id: 'horror', nev_hu: 'Horrorfantasy', nev_en: 'Fantasy Horror', oldal: 106 },
  { id: 'varosi', nev_hu: 'Városi fantasy', nev_en: 'Urban Fantasy', oldal: 107 },
  { id: 'utvesztok', nev_hu: 'Útvesztők és szörnyek', nev_en: 'Mazes & Monsters', oldal: 107 },
  { id: 'kard_magia', nev_hu: 'Kard és mágia', nev_en: 'Sword & Sorcery', oldal: 107 },
  { id: 'harcmuveszet', nev_hu: 'Harcművészeti fantasy', nev_en: 'Martial Arts Fantasy', oldal: 107 },
  { id: 'kulonos', nev_hu: 'Különös fantasy', nev_en: 'Weird Fantasy', oldal: 108 },
  { id: 'vilagvege_utan', nev_hu: 'Világvége utáni fantasy', nev_en: 'Post-Apocalyptic Fantasy', oldal: 108 },
  { id: 'tortenelmi', nev_hu: 'Történelmi fantasy', nev_en: 'Historical Fantasy', oldal: 108 },
  { id: 'kardforgato', nev_hu: 'Kardforgató fantasy', nev_en: 'Swashbuckling Fantasy', oldal: 109 }
];

// Kampánystílusok (Alapkönyv, Campaign Style).
export const STILUSOK = [
  { id: 'sotet', nev_hu: 'Sötét fantasy', nev_en: 'Dark Fantasy' },
  { id: 'magas', nev_hu: 'Magas fantasy', nev_en: 'High Fantasy' },
  { id: 'horror', nev_hu: 'Horror', nev_en: 'Horror' },
  { id: 'alacsony', nev_hu: 'Alacsony fantasy', nev_en: 'Low Fantasy' },
  { id: 'kardforgato', nev_hu: 'Kardforgató kaland', nev_en: 'Swashbuckling Adventure' }
];

// A kampány ívei szintsávonként (Campaign Arcs, a munkalap szerint).
export const IVEK = [
  { kulcs: 'kezdo', nev: 'Kezdő', en: 'Beginner', tol: 1, ig: 4 },
  { kulcs: 'gyakorlott', nev: 'Gyakorlott', en: 'Adept', tol: 5, ig: 8 },
  { kulcs: 'szakerto', nev: 'Szakértő', en: 'Expert', tol: 9, ig: 12 },
  { kulcs: 'mester', nev: 'Mester', en: 'Master', tol: 13, ig: 17 },
  { kulcs: 'legendas', nev: 'Legendás', en: 'Legendary', tol: 18, ig: 20 }
];

export const KIHIVAS_TIPUSOK = [
  { kulcs: 'harc', nev: 'Harc' }, { kulcs: 'felfedezes', nev: 'Felfedezés' }, { kulcs: 'szerepjatek', nev: 'Szerepjáték' }
];

// Hogyan futnak a szerepjátékos kihívások (a könyv két szélső példája között).
export const SZEREPJATEK_MODOK = {
  vegyes: 'Szerepjáték és próbák vegyesen',
  jatek: 'Inkább a kijátszás dönt',
  proba: 'Inkább a próbák döntenek'
};

export const KEPTAR_SZEREPEK = {
  ellenfel: 'Ellenfél', hadnagy: 'Hadnagy', csatlos: 'Csatlós', leny: 'Lény', egyeb: 'Egyéb'
};

// A munkalap választható szabályai. beallitas: ha az app már ismeri, a kampánybeállítás kulcsa.
export const VALASZTHATO_SZABALYOK = [
  { kulcs: 'filmszeru_akrobatika', nev: 'Filmbe illő akrobatika (javaslat)', en: 'Cinematic Acrobatics', oldal: 114 },
  { kulcs: 'romlast_hozo_hatalom', nev: 'Romlást hozó hatalom (javaslat)', en: 'Corrupting Power', oldal: 112 },
  { kulcs: 'sulyos_sebek', nev: 'Súlyos sebek (javaslat)', en: 'Grave Wounds', oldal: 111 },
  { kulcs: 'egeszseg_minden', nev: 'Az Egészség minden (javaslat)', en: 'Health is Everything', oldal: 112 },
  { kulcs: 'nyomozasi_mutatvanyok', nev: 'Nyomozási mutatványok', en: 'Investigation Stunts', oldal: 114, beallitas: 'mutatvanyok.nyomozas' },
  { kulcs: 'ellatmanyszint', nev: 'Ellátmányszint (javaslat)', en: 'Supply Rating', oldal: 113 }
];

// A munkalap mutatványkiegészítései (Stunt Additions & Modifications).
export const MUTATVANY_KIEGESZITESEK = [
  { kulcs: 'harci', nev: 'További harci mutatványok', en: 'Additional Combat Stunts' },
  { kulcs: 'isteni', nev: 'Isteni mutatványok', en: 'Divine Stunts', beallitas: 'mutatvanyok.isteni' },
  { kulcs: 'helyszin', nev: 'Helyszín-mutatványok', en: 'Location Stunts' },
  { kulcs: 'felfedezes_szerepjatek', nev: 'További felfedezési vagy szerepjátékos mutatványok', en: 'Additional Exploration or Roleplaying Stunts' }
];

// A karakterkészítési ajánlások kategóriái: a Szabályadatbázis lapja, és hogy kizárható-e (a könyv szerint
// a keret a fajok és a hátterek elérhetőségét korlátozhatja, a többinél biztatni érdemes).
export const AJANLAS_KATEGORIAK = [
  { kulcs: 'fajok', nev: 'Fajok', lap: 'Fajok', kizarhato: true },
  { kulcs: 'hatterek', nev: 'Hátterek', lap: 'Hátterek', kizarhato: true },
  { kulcs: 'osztalyok', nev: 'Osztályok', lap: 'Osztályok', kizarhato: true },
  { kulcs: 'fokuszok', nev: 'Fókuszok', lap: 'Fókuszok' },
  { kulcs: 'talentumok', nev: 'Talentumok', lap: 'Talentumok' },
  { kulcs: 'arkanumok', nev: 'Arkánumok (varázslatok)', lap: 'Arkánumok' },
  { kulcs: 'specializaciok', nev: 'Specializációk', lap: 'Specializációk', kizarhato: true }
];

// Üres keret.
export function uresKeret() {
  return normalizal({});
}

// Hiányzó mezők pótlása, típusok rendbetétele (régi vagy importált keret is biztonságosan olvasható).
export function normalizal(k0) {
  const k = obj(k0);
  const ivek = {};
  IVEK.forEach((iv) => {
    const x = obj(obj(k.ivek)[iv.kulcs]);
    ivek[iv.kulcs] = { cel: szoveg(x.cel), ellenfel: szoveg(x.ellenfel), kihivasok: szoveg(x.kihivasok), helyszinek: szoveg(x.helyszinek), keretvaltas: szoveg(x.keretvaltas) };
  });
  const ajanlasok = {};
  AJANLAS_KATEGORIAK.forEach((c) => {
    const x = obj(obj(k.ajanlasok)[c.kulcs]);
    ajanlasok[c.kulcs] = { ajanlott: lista(x.ajanlott), kizart: c.kizarhato ? lista(x.kizart) : [] };
  });
  ajanlasok.jegyzet = szoveg(obj(k.ajanlasok).jegyzet);
  const veg = obj(k.veg);
  const ell = obj(veg.ellenfel);
  const kih = obj(k.kihivasok);
  const sav = obj(k.szintsav);
  const kezdo = korlat(sav.kezdo, 1, 20, 1);
  const szabalyok = {};
  VALASZTHATO_SZABALYOK.forEach((s) => { if (!s.beallitas) szabalyok[s.kulcs] = obj(k.szabalyok)[s.kulcs] === true; });
  const kieg = {};
  MUTATVANY_KIEGESZITESEK.forEach((m) => { kieg[m.kulcs] = szoveg(obj(k.mutatvany_kiegeszitesek)[m.kulcs]); });
  const kikapcsolt = {};
  Object.entries(obj(k.generator_kikapcsolt)).forEach(([t, sorok]) => {
    const s = lista(sorok).map(Number).filter(Number.isFinite);
    if (s.length) kikapcsolt[t] = Array.from(new Set(s)).sort((a, b) => a - b);
  });
  return {
    sablon_id: szoveg(k.sablon_id),
    peldakeret: szoveg(k.peldakeret),
    sajat_keret: szoveg(k.sajat_keret),
    kezdes_datum: szoveg(k.kezdes_datum),
    almufajok: lista(k.almufajok).map(String),
    stilus: szoveg(k.stilus),
    vilag_id: szoveg(k.vilag_id),
    alapkoncepcio: szoveg(k.alapkoncepcio),
    kiindulo_helyszinek: szoveg(k.kiindulo_helyszinek),
    kiindulo_helyszin_idk: lista(k.kiindulo_helyszin_idk).map(String).filter(Boolean),
    fontos_jellemzok: szoveg(k.fontos_jellemzok),
    tema: szoveg(k.tema),
    jatekosok: jatekosNormalizal(k.jatekosok),
    karakterek: Object.fromEntries(Object.entries(obj(k.karakterek)).map(([id, x]) => [id, { osszefoglalo: szoveg(obj(x).osszefoglalo) }])),
    veg: { zaro_jelenet: szoveg(veg.zaro_jelenet), tet: szoveg(veg.tet),
      ellenfel: { nev: szoveg(ell.nev), njk_id: szoveg(ell.njk_id), cel: szoveg(ell.cel), modszer: szoveg(ell.modszer),
        csatlosok: szoveg(ell.csatlosok), mas_gonoszok: szoveg(ell.mas_gonoszok), onkep: szoveg(ell.onkep) } },
    szintsav: { kezdo, zaro: korlat(sav.zaro, kezdo, 20, 20), megjegyzes: szoveg(sav.megjegyzes) },
    ivek,
    kihivasok: { harc: korlat(kih.harc, 0, 5, 3), felfedezes: korlat(kih.felfedezes, 0, 5, 2), szerepjatek: korlat(kih.szerepjatek, 0, 5, 2),
      szerepjatek_mod: SZEREPJATEK_MODOK[kih.szerepjatek_mod] ? kih.szerepjatek_mod : 'vegyes', jegyzet: szoveg(kih.jegyzet) },
    keptar: (Array.isArray(k.keptar) ? k.keptar : []).map((x, i) => {
      const o = obj(x);
      return { id: szoveg(o.id) || 'kt' + (i + 1), nev: szoveg(o.nev), szerep: KEPTAR_SZEREPEK[o.szerep] ? o.szerep : 'egyeb',
        njk_id: szoveg(o.njk_id), szorny_id: szoveg(o.szorny_id), jegyzet: szoveg(o.jegyzet) };
    }),
    kalandra_hivas: { kezdes: szoveg(obj(k.kalandra_hivas).kezdes), jatekosoknak: szoveg(obj(k.kalandra_hivas).jatekosoknak) },
    ajanlasok,
    szabalyok,
    mutatvany_kiegeszitesek: kieg,
    generator_kikapcsolt: kikapcsolt,
    jutalomterkep: jutalomterkepNormalizal(k.jutalomterkep)
  };
}

// A jutalomtérkép szövegei szintsávonként és fajtánként (a munkalap mezői, 125. oldal).
export const JUTALOM_OSZLOPOK = [
  { kulcs: 'cim', nev: 'Címek', en: 'Honorifics' }, { kulcs: 'tagsag', nev: 'Tagságok', en: 'Memberships' },
  { kulcs: 'tars', nev: 'Társak', en: 'Companions' }, { kulcs: 'targy', nev: 'Mágikus tárgyak', en: 'Magic Items' },
  { kulcs: 'kincs', nev: 'Kincs', en: 'Treasure' }
];
function jutalomterkepNormalizal(x) {
  const ki = {};
  IVEK.forEach((iv) => {
    const o = obj(obj(x)[iv.kulcs]);
    ki[iv.kulcs] = Object.fromEntries(JUTALOM_OSZLOPOK.map((c) => [c.kulcs, szoveg(o[c.kulcs])]));
  });
  return ki;
}

function korlat(x, min, max, alap) {
  const n = Number(x);
  if (x === '' || x === null || x === undefined || !Number.isFinite(n)) return alap;
  return Math.max(min, Math.min(max, Math.round(n)));
}

const KEDVELT = ['harc', 'felfedezes', 'szerepjatek'];
function jatekosNormalizal(x) {
  const ki = {};
  Object.entries(obj(x)).forEach(([kulcs, j]) => {
    const o = obj(j);
    ki[kulcs] = { kedvel: lista(o.kedvel).filter((y) => KEDVELT.includes(y)), jegyzet: szoveg(o.jegyzet) };
  });
  return ki;
}

// A játékos kulcsa a jegyzetekhez: a felhasználó, vagy játékos nélküli karakternél a karakter.
export const jatekosKulcs = (karakter) => (karakter.jatekos_id ? 'f:' + karakter.jatekos_id : 'k:' + karakter.id);

// Mezőírás útvonallal: beallit(keret, 'veg.ellenfel.nev', 'X') → új keret (a régi nem változik).
export function beallit(k, ut, ertek) {
  const uj = masol(k);
  const reszek = ut.split('.');
  let x = uj;
  reszek.slice(0, -1).forEach((r) => { if (!x[r] || typeof x[r] !== 'object') x[r] = {}; x = x[r]; });
  x[reszek[reszek.length - 1]] = ertek;
  return uj;
}

// Az ív beleesik-e a kampány tervezett szintsávjába.
export function ivAktiv(iv, k) {
  const s = normalizal(k).szintsav;
  return iv.ig >= s.kezdo && iv.tol <= s.zaro;
}

// A kihívások tervezett aránya százalékban (a 0–5 súlyokból).
export function kihivasArany(k) {
  const x = normalizal(k).kihivasok;
  const ossz = x.harc + x.felfedezes + x.szerepjatek;
  if (!ossz) return { harc: 0, felfedezes: 0, szerepjatek: 0 };
  const harc = Math.round((x.harc / ossz) * 100);
  const felfedezes = Math.round((x.felfedezes / ossz) * 100);
  return { harc, felfedezes, szerepjatek: 100 - harc - felfedezes };
}

// A lépések kitöltöttsége: 'ures' | 'resz' | 'kesz'. karakterek: a kampány karakterei (a játékos-lépéshez).
export function lepesAllapot(k0, karakterek) {
  const k = normalizal(k0);
  const van = (x) => !!String(x || '').trim();
  const allapot = (db, ossz) => (db === 0 ? 'ures' : db >= ossz ? 'kesz' : 'resz');
  const ivDb = IVEK.filter((iv) => ivAktiv(iv, k));
  const kulcsok = Array.from(new Set((karakterek || []).map(jatekosKulcs)));
  const ajDb = AJANLAS_KATEGORIAK.filter((c) => k.ajanlasok[c.kulcs].ajanlott.length || k.ajanlasok[c.kulcs].kizart.length).length;
  return {
    alapok: allapot([k.peldakeret || k.sajat_keret, k.almufajok.length || k.stilus, k.vilag_id || k.alapkoncepcio, k.kiindulo_helyszinek || (k.kiindulo_helyszin_idk.length ? 'x' : '')].filter((x) => (typeof x === 'number' ? x > 0 : van(x))).length, 4),
    tema: van(k.tema) ? 'kesz' : 'ures',
    jatekosok: kulcsok.length ? allapot(kulcsok.filter((x) => k.jatekosok[x] && (k.jatekosok[x].kedvel.length || van(k.jatekosok[x].jegyzet))).length, kulcsok.length) : 'ures',
    veg: allapot([k.veg.zaro_jelenet, k.veg.tet, k.veg.ellenfel.nev || k.veg.ellenfel.njk_id].filter(van).length, 3),
    visszafele: allapot([k.veg.ellenfel.cel, k.veg.ellenfel.modszer, k.veg.ellenfel.csatlosok].filter(van).length, 3),
    kihivasok: allapot((van(k.kihivasok.jegyzet) ? 1 : 0) + (k.keptar.length ? 1 : 0), 2),
    ivek: allapot(ivDb.filter((iv) => van(k.ivek[iv.kulcs].cel)).length, ivDb.length || 1),
    jutalmak: allapot(ivDb.filter((iv) => JUTALOM_OSZLOPOK.some((c) => van(k.jutalomterkep[iv.kulcs][c.kulcs]))).length, ivDb.length || 1),
    kalandra_hivas: allapot([van(k.kalandra_hivas.kezdes), van(k.kalandra_hivas.jatekosoknak), ajDb > 0].filter(Boolean).length, 3),
    szabalyok: Object.values(k.szabalyok).some(Boolean) || Object.values(k.mutatvany_kiegeszitesek).some(van) ? 'kesz' : 'ures'
  };
}

// A játékosoknak szóló rész (a kampány nézetében és a karakterkészítőben). Üres keretnél null.
export function jatekosoknak(k0) {
  const k = normalizal(k0);
  const aj = {};
  AJANLAS_KATEGORIAK.forEach((c) => {
    const x = k.ajanlasok[c.kulcs];
    if (x.ajanlott.length || x.kizart.length) aj[c.kulcs] = { ajanlott: x.ajanlott, kizart: x.kizart };
  });
  const sav = k.szintsav.kezdo !== 1 || k.szintsav.zaro !== 20;
  const o = {
    bemutatas: k.kalandra_hivas.jatekosoknak,
    ajanlasok: aj,
    jegyzet: k.ajanlasok.jegyzet
  };
  if (sav) o.szintsav = { kezdo: k.szintsav.kezdo, zaro: k.szintsav.zaro };
  if (!o.bemutatas && !Object.keys(aj).length && !o.jegyzet && !sav) return null;
  return o;
}

// Egy szabályelem jelölése a karakterkészítőben: 'ajanlott' | 'kizart' | null.
export function ajanlasJel(jatekosResz, kategoria, id) {
  const x = jatekosResz && jatekosResz.ajanlasok && jatekosResz.ajanlasok[kategoria];
  if (!x || !id) return null;
  if ((x.kizart || []).includes(id)) return 'kizart';
  if ((x.ajanlott || []).includes(id)) return 'ajanlott';
  return null;
}

// Ajánlás váltása egy elemre: semleges → ajánlott → kizárt (ha kizárható) → semleges.
export function ajanlasValt(k0, kategoria, id) {
  const k = normalizal(k0);
  const c = AJANLAS_KATEGORIAK.find((x) => x.kulcs === kategoria);
  if (!c) return k;
  const x = k.ajanlasok[kategoria];
  if (x.ajanlott.includes(id)) {
    x.ajanlott = x.ajanlott.filter((y) => y !== id);
    if (c.kizarhato) x.kizart = x.kizart.concat([id]);
  } else if (x.kizart.includes(id)) {
    x.kizart = x.kizart.filter((y) => y !== id);
  } else {
    x.ajanlott = x.ajanlott.concat([id]);
  }
  return k;
}

// A kampányhoz kötött mezők, amelyek sablonba nem kerülnek.
const KAMPANYHOZ_KOTOTT = ['sablon_id', 'vilag_id', 'kezdes_datum', 'jatekosok', 'karakterek', 'generator_kikapcsolt', 'kiindulo_helyszin_idk'];

// Keret sablonként (Sablontár, kampánykeret típusú sablon adata).
export function sablonAdat(k0, nevSzoveg) {
  const k = normalizal(k0);
  KAMPANYHOZ_KOTOTT.forEach((m) => { delete k[m]; });
  k.keptar = k.keptar.map((x) => ({ ...x, njk_id: '' }));
  k.veg.ellenfel.njk_id = '';
  return { nev: nevSzoveg || '', allapot: 'kesz', keret: k };
}

// Sablon alkalmazása kiindulópontnak: a sablon mezői a kampányhoz kötött mezők kivételével felülírják a keretet.
export function sablonAlkalmaz(k0, sablon) {
  const k = normalizal(k0);
  const s = normalizal(obj(obj(sablon && sablon.adat).keret));
  const ki = { ...s };
  KAMPANYHOZ_KOTOTT.forEach((m) => { ki[m] = k[m]; });
  ki.sablon_id = sablon.id || '';
  return normalizal(ki);
}

// A könyv keret-példájának kiválasztása: a keret neve, és ha a téma még üres, az összefoglaló kiindulásnak.
export function peldaAlkalmaz(k0, peldaId) {
  const k = normalizal(k0);
  const p = KERET_PELDAK.find((x) => x.id === peldaId);
  k.peldakeret = p ? p.id : '';
  if (p && !k.tema.trim()) k.tema = p.osszefoglalo;
  return k;
}

export function keretNev(k0) {
  const k = normalizal(k0);
  const p = KERET_PELDAK.find((x) => x.id === k.peldakeret);
  return k.sajat_keret || (p ? p.nev_hu : '');
}
