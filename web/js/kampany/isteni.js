// Kampányépítő, 8. fejezet: isteni (Building the Divine), a Companion isteni mágiájával (Option: Divine Magic, 55–56. oldal).
// Tiszta függvények és a könyvek szerinti állandók (rövid saját magyar összefoglalók, a könyvek szövege nélkül).
// Az elem típusa `istenseg`, a fajtája az adatban: vallás (vagy panteon), isten, kultusz. A fában az istenek és a
// felekezetek a vallás alatt állnak (a kultusz a kultusz alatt is). A saját mezők mezőnként öröklődnek (elem.js), a
// listák egészben. Az imádók `imadja` kapcsolattal kötődnek (honnan az imádó, hova az isteni elem); a panteon istenei
// közti kötelékek a személyes kapcsolattípusok. Terv: claude/kampanyepito-terv.md, „8. fejezet”.

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const van = (x) => !!szoveg(x).trim();

export const SZERKEZET_TABLA = 'dt_vallas_szerkezet';
export const TARTOMANY_TABLA = 'dt_tartomany';
export const ISTEN_TABLA = 'dt_isten';
export const KULTUSZ_TABLA = 'dt_kultusz';
export const TEVEKENYSEG_TABLA = 'dt_kultusz_tevekenyseg';
export const UNNEP_TABLA = 'dt_unnep';
export const KAPCSOLAT_TABLA = 'dt_kapcsolat';

// Az isteni elem fajtája.
export const FAJTAK = {
  vallas: { nev: 'Vallás', leiras: 'Egy hit egésze: egy isten, két isten vagy egy panteon, a gyakorlatával, a híveivel és a felekezeteivel.' },
  isten: { nev: 'Isten', leiras: 'Egy istenség, vagy hozzá hasonló hatalom (démonúr, szent, élő isten, elvont erő). Egy vallás alá is kerülhet.' },
  kultusz: { nev: 'Kultusz', leiras: 'Kultusz, felekezet, szekta vagy egy vallás leágazása. Egy vallás vagy egy másik kultusz alá is kerülhet.' }
};
export const fajtaOf = (a) => (FAJTAK[obj(a).fajta] ? obj(a).fajta : 'isten');

// A vallás szerkezete (Religion Structure, 105. oldal).
export const SZERKEZETEK = {
  egy: { nev: 'Egyistenhit', en: 'Monotheistic', leiras: 'Egyetlen istenség (Teremtő, Mindenanya, Az Egy, vagy a nevét senki sem ismeri).' },
  ketto: { nev: 'Kettős istenhit', en: 'Bitheistic', leiras: 'Két isten egymással ellentétes tartománnyal (nappal és éjszaka, nyár és tél); lehetnek jó és rossz, vagy egyik sem; örök harcban vagy örök szerelemben.' },
  panteon: { nev: 'Panteon', en: 'Pantheon', leiras: '3d6 isten (vagy amennyi kell), mindegyik 1d3 tartománnyal.' },
  csaladi: { nev: 'Családi panteon', en: 'Familial Pantheon', leiras: 'Panteon, amelynek istenei rokonok: páronként dobás a kapcsolattáblán (56. oldal). A családfa a mitológiákhoz hasonlóan kusza lehet.' }
};

// Az isten szerepe (saját bontás a könyv példái szerint: Gods & Monsters, Divine Variations, Random Religions).
export const SZEREPEK = {
  isten: { nev: 'Istenség', leiras: 'A hívek által imádott isten.' },
  ellenhatalom: { nev: 'Ellenhatalom', en: 'Gods & Monsters', oldal: '94–95', leiras: 'Démon, ördög, sötét erő vagy az istenek ellenfele; a könyv szerint ugyanazokkal a táblákkal készül.' },
  szent: { nev: 'Szent vagy félisten', en: 'Divine Variations', oldal: '96–97', leiras: 'Felemelkedett halandó, szent, mártír vagy egy isten gyermeke.' },
  elo_isten: { nev: 'Élő isten', en: 'Divine Variations', oldal: '96–97', leiras: 'Halandó, akiben az isteni lakozik vagy annak hiszik (a fáraók, egy gyermekistennő).' },
  fogalom: { nev: 'Elvont erő', en: 'Random Religions', oldal: '104', leiras: 'Nem isten, hanem maga a fogalom (nem a szépség istene, hanem a Szépség).' }
};

// Mennyire valódiak (How Real Are Your Deities?, 94. oldal).
export const VALOSAG = {
  valodi: { nev: 'Valóban léteznek', leiras: 'Az istenek valódi hatalmak.' },
  mitikus: { nev: 'Csak mítosz', leiras: 'Régi történetek szereplői, akik talán sosem léteztek.' },
  egykori: { nev: 'Egykori hatalmasok', leiras: 'Hatalmas lények vagy hősök voltak, akik már nem élnek.' },
  termeszet: { nev: 'A természet erői', leiras: 'Maguk a természet erői, nem személyek.' }
};
// Mennyire vannak jelen (How Present Are Your Gods?, 94. oldal).
export const JELENLET = {
  jelen: { nev: 'Mindig jelen vannak', leiras: 'Figyelnek, beavatkoznak, akár a halandók közt járnak.' },
  jelek: { nev: 'Jelekben szólnak', leiras: 'Jelek, álmok, rejtett ügynökök, próféciák útján (Ever-Present Without Words, 95. oldal).' },
  tavol: { nev: 'Feltűnően távol', leiras: 'Elfordultak a világtól: megsértették, becsapták vagy elűzték őket.' },
  elveszett: { nev: 'Eltűntek vagy foglyok', leiras: 'Bajban vannak; meg kell menteni, vissza kell hívni őket.' },
  nincs: { nev: 'Nincsenek jelen', leiras: 'Nincs isteni jelenlét a világban, csak a hit.' }
};
// Mit tudnak erről a világ lakói (95. oldal: a DM tudja az igazat, a lakóknak nem kell).
export const TUDAS = {
  bizonyos: { nev: 'Bizonyosak benne', leiras: 'Bizonyítékuk van, látják a jeleket vagy magukat az isteneket.' },
  hit: { nev: 'Csak hitből', leiras: 'Nincs bizonyítékuk; a hit és a régiek történetei tartják meg őket.' },
  tevhit: { nev: 'Tévesen hiszik', leiras: 'Mindenütt jeleket látnak, pedig nincs isteni jelenlét.' },
  nem_tudjak: { nev: 'Nem tudnak róla', leiras: 'Az istenek valódiak, de a lakók nem tudják.' }
};
// Miért követik az isteneket (95. oldal).
export const MIERT = {
  szeretet: { nev: 'Szeretetből', leiras: 'Mély szeretet a magasabb lények iránt.' },
  felelem: { nev: 'Félelemből', leiras: 'Az isteni harag és büntetés félelme.' },
  vegyes: { nev: 'Szeretet és félelem', leiras: 'A történelemben a kettő keveredik.' },
  hagyomany: { nev: 'Szokásból', leiras: 'Mert mindig így volt; a hit a mindennapok része.' }
};
// Hogyan fogadják a kívülállókat (Love Thy Neighbor or Smite Thy Enemy?, 99. oldal).
export const IDEGENEK = {
  befogado: { nev: 'Befogadó', leiras: 'Bárkit befogad, menedéket és gyógyítást ad, bármilyen hitű is.' },
  valogatos: { nev: 'Válogatós', leiras: 'Gondosan megválogatja, kit enged a küszöbén túlra.' },
  ellenseges: { nev: 'Ellenséges', leiras: 'A hitetleneket nyílt ellenségességgel fogadja.' }
};
// A hit viselése (Trappings of Faith, 99. oldal).
export const VISELET = {
  batoritott: { nev: 'Bátorított', leiras: 'Ajánlott, de nem kötelező a jelkép viselése.' },
  kotelezo: { nev: 'Kötelező', leiras: 'Minden hívő viseli a jelet (akár beégetve, hegként).' },
  tilos: { nev: 'Tilos', leiras: 'Látható jelet viselni büntetendő (titkos hit).' },
  szabad: { nev: 'Mindegy', leiras: 'A hívő döntése.' }
};
// A mágia megítélése (The Magic of Belief, 99–100. oldal).
export const MAGIA_MEGITELES = {
  ajandek: { nev: 'Isteni ajándék', leiras: 'A mágia az istenek ajándéka, létezésük bizonyítéka.' },
  felelem: { nev: 'Félelmetes', leiras: 'A mágia ijesztő bizonyítéka a halandók kiszolgáltatottságának.' },
  tiltott: { nev: 'Tiltott, üldözött', leiras: 'A mágusok kezelése a hit legvitatottabb pontja, háborúk tárgya.' },
  szabalyozott: { nev: 'Szabályozott', leiras: 'Egyes arkánumokat csak a papság rendjei tanulhatnak, másokat egy pap sem érinthet.' },
  kozombos: { nev: 'Közömbös', leiras: 'A mágia a világ természetes része, a hitnek nincs köze hozzá.' }
};
// A hit elvesztésének hatása (Divine Attitudes, 102. oldal).
export const HITEHAGYAS = {
  nincs: { nev: 'Nincs gépi hatása', leiras: 'Az isten elfogadó; a hitét vesztett hős ugyanolyan hatékony marad.' },
  kegyvesztes: { nev: 'Kegyvesztés', leiras: 'Elveszti az isteni mágiát vagy az isteni mutatványokat, amíg vissza nem tér.' },
  buntetes: { nev: 'Büntetés', leiras: 'Az isten megtorol: átok, jel, üldözés a hívek részéről.' }
};

// A Companion isteni mágiája (Option: Divine Magic, 55–56. oldal): a vallásra vagy az istenre vonatkozó választások.
export const ISTENI_SZABALYOK = {
  isteni_magia: { nev: 'Isteni mágia', en: 'Divine Magic', oldal: '55', leiras: 'A papok mágiája az istenük ajándéka; gépileg ugyanaz, mint a többi arkánum, de az istenhez illő arkánumokat tanulják először.' },
  isteni_mutatvanyok: { nev: 'Isteni mutatványok', en: 'Divine Stunts', oldal: '55–56', leiras: 'Csak isteni varázslóknak, általában Akaraterő (Hit) fókusszal, jó viszonyban az istenükkel; a DM tagságot is megkövetelhet. A kampánybeállítások közt kapcsolható.' },
  hitvalsag: { nev: 'Hitválság', en: 'Crisis of Faith', oldal: '56', leiras: 'Sikertelen varázslás után a sárkánykocka értékének megfelelő körig nincs isteni varázslat és mutatvány; 1 MP-ért feloldható. A könyv szerint csak az isteni mutatványokkal együtt ajánlott.' },
  isteni_mas: { nev: 'Az isteni más', en: 'Divine Is Different', oldal: '56', leiras: 'Az isteni és az arkán mágia nem érzékeli és nem oltja ki egymást; a tárgyak is egyik vagy másik fajtájúak; egyes arkánumok csak isteniek (például sors, gyógyító, hősi) vagy csak arkánok (elemi, tárgybűvölés, illúzió).' },
  hit_fokusz: { nev: 'Akaraterő (Hit) kell', en: 'Divine Is Different', oldal: '56', leiras: 'Az isteni varázsló csak Akaraterő (Hit) fókusszal varázsolhat.' },
  jamborsag: { nev: 'Jámborság', en: 'Piety', oldal: '56', leiras: 'Az isteni varázslat ellenállási célértéke 10 + Akaraterő + a Hit fókusz (a Varázserő helyett).' }
};

// A tartományokhoz illő arkánumok (saját javaslat a Companion 55. oldali példája szerint: a hold papnője állat, jóslás,
// sors, árnyék és víz, a háborúisten papja tűz és hősi arkánumot tanul). Kulcs: a tartomány angol neve.
const ARK = {
  ark_death: ['Death', 'Slaughter', 'Killing/Murder', 'Spirits/Ghosts', 'Saints/Martyrs', 'Disease', 'Flesh'],
  ark_fire: ['Fire', 'Smiths/Smithing', 'The Sun', 'Destruction', 'Summer'],
  ark_healing: ['Medicine', 'Fertility', 'Infirmities', 'Youth', 'Milk/Cheese', 'Saints/Martyrs', 'Love'],
  ark_heroic: ['War', 'Warriors', 'Martial Arts', 'Nobility', 'Light', 'Day', 'Dawn', 'Bladed Weapons', 'Blunt Weapons', 'Weapons', 'Friendship'],
  ark_power: ['Brutality', 'Chaos', 'Destruction', 'Creation', 'Mages'],
  ark_water: ['Water', 'Rivers', 'Sailors/Sailing', 'Fish', 'Beaches', 'The Moon', 'Amphibians'],
  ark_earth: ['Earth', 'Gemstones', 'Bricklaying', 'Stillness'],
  ark_air: ['Wind', 'Flight', 'Birds'],
  ark_lightning: ['Lightning'],
  ark_wood: ['Plants', 'Wood', 'Woodcutters', 'Harvest', 'Spring', 'Autumn', 'Fertility', 'Spices'],
  ark_beast: ['Beasts', 'Hunting', 'Birds', 'Fish', 'Insects', 'Reptiles', 'Amphibians', 'Monsters', 'Dragons', 'The Moon'],
  ark_cold: ['Winter', 'Stillness'],
  ark_shadow: ['Shadows', 'Night', 'Secrets', 'Assassins', 'Rogues', 'The Moon', 'Evil', 'Demons'],
  ark_psychic: ['Dreams', 'Nightmares', 'Sleep', 'Emotions', 'Fear', 'Despair', 'Desire', 'Lust', 'Joy', 'Woe/Sorrow', 'Politics'],
  ark_illusion: ['Trickery', 'Pranks/Practical Jokes', 'Acting/Actors', 'Jokes/Riddles', 'Dancing', 'Beauty', 'Bards'],
  ark_fate: ['Luck', 'Time', 'Unfortunate Events', 'The Moon', 'Plots/Plans'],
  ark_divination: ['Literacy', 'Finding Lost Things', 'Secrets', 'Time', 'Mages', 'Dreams'],
  ark_enchantment: ['Smiths/Smithing', 'Tailoring', 'Knitting/Weaving', 'Innovation', 'Gemstones', 'Wealth'],
  ark_protection: ['Innocence', 'Friendship', 'Saints/Martyrs', 'Travel', 'Taverns/Inns']
};

// A könyv lépései és kérdései (93–106. oldal). Fajtánként más-más lépéssor (lepesKulcsok).
export const ISTENI_LEPESEK = {
  fajta: { nev: 'Fajta és szerkezet', en: 'Designing Deities, Religion Structure', oldal: '94, 105',
    utmutato: 'Bontsd kisebb kérdésekre: egy isten, két isten vagy egy panteon? Merítenél a valódi mitológiából vagy a Bestiáriumból (a régi nevek új alakot kaphatnak)? A vallásszerkezet dobható is.' },
  isten_fajta: { nev: 'Az isten és a tartományai', en: 'Designing Deities, Domain', oldal: '94, 104–105',
    utmutato: 'Mi az isten (istenség, ellenhatalom, szent, élő isten, elvont erő), és miért felel? Istenenként 1d3 dobás a tartománytáblán; ha valami nevetséges, dobj még egyet hozzá (a fűszeres sajtok istene nevetséges, a testi szerelem és a fűszeres sajtok istene már érdekes).' },
  kultusz_fajta: { nev: 'A kultusz és amit imád', en: 'Designing Cults & Religions, Random Religions', oldal: '98, 104',
    utmutato: 'Mit imád a kultusz: egy istent, vagy magát a fogalmat (nem a szépség istenét, hanem a Szépséget)? Ha egy vallásból ágazott le, a vallás alá kerül. Az ihlet bármi lehet: kérdezd meg, „mi lenne, ha ezt imádnák?”' },
  valosag: { nev: 'Valóság és jelenlét', en: 'How Real? How Present?', oldal: '94',
    utmutato: 'Valóban léteznek-e az istenek, és mennyire vannak jelen? A lakóknak nem kell tudniuk az igazat, de a DM tudja. Ha távol vannak, miért, és hogyan térhetnének vissza? Ez dönti el, hogyan látják a lakók a hitet.' },
  panteon: { nev: 'A panteon', en: 'History as Thematic Inspiration, Familial Pantheon', oldal: '95–96, 105',
    utmutato: 'Az istenek rokonsága emberközelivé teszi őket, és a hívekben is visszhangzik: ikeristenek papjai lehetnek szövetségesek, barátságos riválisok vagy elkeseredett ellenségek. Családi panteonnál páronként dobás a kapcsolattáblán; a kötelékek kapcsolatként mentődnek.' },
  ellenerok: { nev: 'Ellenerők', en: 'Gods & Monsters', oldal: '94–95',
    utmutato: 'Milyen erők állnak szemben az istenekkel (angyalok és démonok, fény és sötétség)? Van-e hierarchiájuk, milyen síkokról jönnek? Egyszerű válaszok is elegendők. Fordítsd ki a megszokottat: mi van, ha egy démon trónra ül a halandók világában?' },
  hivek: { nev: 'Hívek és viszonyok', en: 'Love Thy Neighbor or Smite Thy Enemy?, Challenges of the Faith', oldal: '95, 97–99',
    utmutato: 'Kik imádják, és hogyan fogadják a kívülállókat? Kiválasztott népnek tartják magukat? Milyen szerepe van a politikában? Miért követik: szeretetből vagy félelemből? A hit konfliktusai (háborúk, belső viták, egy esküvő borát ki tölti) kalandot adnak; de a barátságos rivalizálás is belefér.' },
  agak: { nev: 'Felekezetek és misztériumok', en: 'Designing Cults & Religions, Divine Mysteries', oldal: '97–98',
    utmutato: 'Egy fő hit, vagy több felekezet? Hol ágaznak el, miben értenek egyet, hol térnek el a legjobban? Vannak-e elfeledett titkok, kitörölt nevek, lerombolt templomok, elveszett próféciák vagy eretnek iratok? Ezek kiváló horgok.' },
  tevekenysegek: { nev: 'Kultusztevékenységek', en: 'Cult Activities', oldal: '104, 106',
    utmutato: 'Hogyan imádja istenét a kultusz? 1d3 dobás a táblán, vagy válassz. A kultisták megszállottak, de nem gyengék: egy gonosz isten főpapja is gondosan védi magát (Errant Gods, 98. oldal).' },
  elteres: { nev: 'Eltérések az anyavallástól', en: 'Reflections & Distortions, Ancestry & Politics', oldal: '103–104',
    utmutato: 'Miben hasonlít és miben tér el a fő hittől (jelképek, dalok, szertartások)? Az apró eltérésekből ismerhető fel egy kultista (nehéz próba). Hogyan tekint más népekre és a politikára? A legjobb gonosztevő az, aki hősnek hiszi magát.' },
  kulsosegek: { nev: 'A hit külsőségei', en: 'Trappings of Faith, Icons & Symbols', oldal: '99, 101–102',
    utmutato: 'A nem hívő is felismeri egy hit jeleit. Hogyan tanítanak (szent irat, ének, tánc)? Milyen jelkép, szent állat, napszak, eszköz? Hol és hogyan imádkoznak, közösen és egyedül? Milyen szólások, felkiáltások születtek? Kell, szabad vagy tilos-e a hit jelét viselni? Milyen tanokat követnek, hogyan búcsúznak a halottaktól?' },
  unnepek: { nev: 'Ünnepek', en: 'Festival', oldal: '101–102, 104, 106',
    utmutato: 'A szent napok és a közösségi ünnepek. A táblán a központi szokás és egy téma (tartomány) dobható; az ünnep általában az isten tartományához kötődik, de lehet fordítva is (az aratóünnep a halálistent engeszteli). Ha nem áll össze, dobj újra.' },
  nezetek: { nev: 'Isteni nézetek', en: 'Divine Attitudes', oldal: '102',
    utmutato: 'Hogyan tekint az isten (és a hit) a népekre, és ki imádhatja? Hogyan látja a mágiát? Mi történik azzal, aki elveszíti a hitét: semmi, vagy kegyvesztés, büntetés?' },
  magia: { nev: 'Mágia és hit', en: 'The Magic of Belief, Option: Divine Magic', oldal: '99–100; Companion 55–56',
    utmutato: 'A Fantasy AGE-ben a vallás nincs a mágiához kötve, de köthető: egyes arkánumok csak a papság bizonyos rendjeinek, mások tiltottak; a papok különleges fókuszt vagy bónuszt kaphatnak; egy szent fegyver figyelheti és jutalmazhatja a viselőjét. A Companion isteni mágiája választható szabályokat ad.' },
  jatekosok: { nev: 'Hatás a kampányra', en: 'Possible Campaign Effects', oldal: '102',
    utmutato: 'Mit tudnak erről a hősök a mindennapokból (ünnepek, jelek, szokások), akkor is, ha nem hívők? Mi marad egyelőre rejtve előttük (a DM titkai)? Mit lát meg egy hívő hős többet, ahogy hűséges szolgának bizonyul?' }
};

// A fajta szerinti lépések (a szerkesztő lépéslistájához).
export function lepesKulcsok(a, opciok = {}) {
  const f = fajtaOf(a);
  if (f === 'vallas') {
    const ki = ['fajta', 'valosag'];
    if (opciok.istenekSzama >= 2 || ['ketto', 'panteon', 'csaladi'].includes(obj(a).szerkezet)) ki.push('panteon');
    return ki.concat(['ellenerok', 'hivek', 'agak', 'kulsosegek', 'unnepek', 'nezetek', 'magia', 'jatekosok']);
  }
  if (f === 'kultusz') return ['kultusz_fajta', 'tevekenysegek', 'elteres', 'hivek', 'kulsosegek', 'unnepek', 'nezetek', 'magia', 'jatekosok'];
  const ki = ['isten_fajta', 'valosag'];
  if (opciok.testverekSzama >= 1) ki.push('panteon');
  return ki.concat(['hivek', 'kulsosegek', 'unnepek', 'nezetek', 'magia', 'jatekosok']);
}

// ---------- Normalizálók ----------

const nId = (x, i, p) => szoveg(x.id) || p + i;
export const tartomanyokNorm = (x) => lista(x).map((g, i) => (typeof g === 'string' ? { id: 'tm' + i, nev: g, en: '' }
  : { id: nId(obj(g), i, 'tm'), nev: szoveg(obj(g).nev), en: szoveg(obj(g).en) })).filter((t) => van(t.nev));
export const tevekenysegekNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'kt'), nev: szoveg(obj(g).nev), leiras: szoveg(obj(g).leiras), en: szoveg(obj(g).en) }));
export const unnepekNorm = (x) => lista(x).map((g, i) => {
  const o = obj(g);
  return { id: nId(o, i, 'un'), nev: szoveg(o.nev), mikor: szoveg(o.mikor), szokas: szoveg(o.szokas), tema: szoveg(o.tema), isten_id: szoveg(o.isten_id), leiras: szoveg(o.leiras) };
});
export const konfliktusokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'kf'), kik: szoveg(obj(g).kik), miert: szoveg(obj(g).miert), hol: szoveg(obj(g).hol) }));
export const miszteriumokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'ms'), nev: szoveg(obj(g).nev), leiras: szoveg(obj(g).leiras), horog: szoveg(obj(g).horog) }));
export const elteresekNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'el'), miben: szoveg(obj(g).miben), fo: szoveg(obj(g).fo), kultusz: szoveg(obj(g).kultusz) }));
export const szolasokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'sz'), szoveg: szoveg(obj(g).szoveg), ki: szoveg(obj(g).ki) }));
const kulcsLista = (x, tabla) => lista(x).filter((k) => tabla[k]);
export const isteniSzabalyokOf = (a) => kulcsLista(obj(a).isteni_szabalyok, ISTENI_SZABALYOK);
export const arkanumokOf = (a) => lista(obj(a).arkanumok).filter((x) => typeof x === 'string' && x);
export const tiltottArkanumokOf = (a) => lista(obj(a).tiltott_arkanumok).filter((x) => typeof x === 'string' && x);

// ---------- Fa és kapcsolatok ----------

const megjOf = (megj) => megj || ((e) => obj(e && e.adat));
const aktivIsteni = (e) => e && e.tipus === 'istenseg' && e.aktiv !== false;

// A vallás (vagy kultusz) közvetlen gyerekei fajta szerint.
export function gyerekek(id, elemek, megj) {
  const m = megjOf(megj);
  const l = lista(elemek).filter((e) => aktivIsteni(e) && e.szulo_id === id).sort((a, b) => (Number(a.sorrend) || 0) - (Number(b.sorrend) || 0));
  return { istenek: l.filter((e) => fajtaOf(m(e)) === 'isten'), kultuszok: l.filter((e) => fajtaOf(m(e)) === 'kultusz'), vallasok: l.filter((e) => fajtaOf(m(e)) === 'vallas') };
}

// A legközelebbi fölérendelt vallás (a fában).
export function vallasa(elem, ix, megj) {
  const m = megjOf(megj);
  let x = elem && elem.szulo_id ? ix.get(elem.szulo_id) : null;
  for (let i = 0; x && i < 30; i++) {
    if (x.tipus === 'istenseg' && fajtaOf(m(x)) === 'vallas') return x;
    x = x.szulo_id ? ix.get(x.szulo_id) : null;
  }
  return null;
}

// Az isten testvérei a panteonban: ugyanazon szülő alatti istenek.
export function testverek(elem, elemek, megj) {
  if (!elem || !elem.szulo_id) return [];
  return gyerekek(elem.szulo_id, elemek, megj).istenek.filter((e) => e.id !== elem.id);
}

// A panteon párjai a meglévő személyes kötelékkel (vagy null). istenek: elemek listája.
export const PANTEON_TIPUSOK = ['szovetsegese', 'ellensege', 'baratja', 'szeretoje', 'hazastarsa', 'testvere', 'unokatestvere',
  'szulo_gyermek', 'nagyszulo_unoka', 'nagybacsi_unokaocs', 'egyeb'];
export function panteonParok(istenek, kapcsolatok) {
  const l = lista(istenek);
  const ki = [];
  for (let i = 0; i < l.length; i++) {
    for (let j = i + 1; j < l.length; j++) {
      const a = l[i].id; const b = l[j].id;
      const k = lista(kapcsolatok).filter((x) => x.aktiv !== false && PANTEON_TIPUSOK.includes(x.tipus)
        && ((x.honnan === a && x.hova === b) || (x.honnan === b && x.hova === a)));
      ki.push({ a: l[i], b: l[j], kapcsolatok: k });
    }
  }
  return ki;
}

// Az elem imádói (kapcsolat: imadja, honnan az imádó, hova az isteni elem), és amit az elem imád.
export const imadoi = (id, kapcsolatok) => lista(kapcsolatok).filter((k) => k.aktiv !== false && k.tipus === 'imadja' && k.hova === id);
export const imadja = (id, kapcsolatok) => lista(kapcsolatok).filter((k) => k.aktiv !== false && k.tipus === 'imadja' && k.honnan === id);

// A vallásfa: a gyökerek a vallások és a szülő nélküli istenek, kultuszok. [{ elem, gyerekek: [...] }]
export function isteniFa(elemek, megj) {
  const l = lista(elemek).filter((e) => e.tipus === 'istenseg');
  const idk = new Set(l.map((e) => e.id));
  const m = megjOf(megj);
  const rend = (a, b) => (Number(a.sorrend) || 0) - (Number(b.sorrend) || 0) || szoveg(m(a).nev || a.nev).localeCompare(szoveg(m(b).nev || b.nev), 'hu');
  const epit = (e, mely) => ({ elem: e, gyerekek: mely > 20 ? [] : l.filter((x) => x.szulo_id === e.id).sort(rend).map((x) => epit(x, mely + 1)) });
  const fajtaRang = { vallas: 0, isten: 1, kultusz: 2 };
  return l.filter((e) => !e.szulo_id || !idk.has(e.szulo_id))
    .sort((a, b) => fajtaRang[fajtaOf(m(a))] - fajtaRang[fajtaOf(m(b))] || rend(a, b)).map((e) => epit(e, 0));
}

// Fajtánkénti darabszám (a nézet fejlécéhez).
export function fajtaSzamok(elemek, megj) {
  const m = megjOf(megj);
  const ki = { vallas: 0, isten: 0, kultusz: 0 };
  lista(elemek).filter((e) => e.tipus === 'istenseg').forEach((e) => { ki[fajtaOf(m(e))]++; });
  return ki;
}

// ---------- Arkánumok ----------

// Az isten tartományaihoz illő arkánumok (gyakoriság szerint): [{ id, db, tartomanyok }].
export function arkanumJavaslat(tartomanyok) {
  const t = tartomanyokNorm(tartomanyok);
  const ki = [];
  Object.entries(ARK).forEach(([id, l]) => {
    const talalat = t.filter((x) => l.includes(x.en));
    if (talalat.length) ki.push({ id, db: talalat.length, tartomanyok: talalat.map((x) => x.nev) });
  });
  return ki.sort((a, b) => b.db - a.db || a.id.localeCompare(b.id));
}

// ---------- A dobótáblák eredményei ----------

const eredmenyek = (fa) => {
  const ki = [];
  const bejar = (cs) => {
    if (!cs || cs.hiba) return;
    ki.push(cs);
    lista(cs.hivasok).forEach((h) => lista(h.gyerekek).forEach(bejar));
  };
  bejar(fa);
  return ki;
};
const tartomanyBol = (cs) => ({ id: 'tm_' + Math.random().toString(36).slice(2, 9), nev: cs.eredmeny, en: cs.en || '' });
const elsoMondat = (s) => { const i = s.indexOf(':'); return i < 0 ? { nev: s, leiras: '' } : { nev: s.slice(0, i).trim(), leiras: s.slice(i + 1).trim() }; };

// A tartományok egy dobásfából (dt_isten, dt_kultusz, dt_tartomany, dt_unnep).
export function tartomanyokFabol(fa) {
  return eredmenyek(fa).filter((cs) => cs.tabla === TARTOMANY_TABLA).map(tartomanyBol);
}

// A kultusz tevékenységei egy dobásfából.
export function tevekenysegekFabol(fa) {
  return eredmenyek(fa).filter((cs) => cs.tabla === TEVEKENYSEG_TABLA)
    .map((cs) => ({ id: 'kt_' + Math.random().toString(36).slice(2, 9), ...elsoMondat(cs.eredmeny), en: cs.en || '' }));
}

// Egy ünnep a dobásfából (a központi szokás és a téma).
export function unnepFabol(fa) {
  const l = eredmenyek(fa);
  const u = l.find((cs) => cs.tabla === UNNEP_TABLA);
  if (!u) return null;
  const sz = elsoMondat(u.eredmeny);
  const tema = l.filter((cs) => cs.tabla === TARTOMANY_TABLA).map((cs) => cs.eredmeny).join(', ');
  return { id: 'un_' + Math.random().toString(36).slice(2, 9), nev: tema ? sz.nev + ' (' + tema.toLowerCase() + ')' : sz.nev,
    mikor: '', szokas: sz.nev + (sz.leiras ? ': ' + sz.leiras : ''), tema, isten_id: '', leiras: '' };
}

// A vallásszerkezet a dobásfából: { szerkezet, istenek_szama }.
export function szerkezetFabol(fa) {
  if (!fa || fa.hiba || fa.tabla !== SZERKEZET_TABLA) return null;
  const sz = obj(fa.ertek).szerkezet;
  if (!SZERKEZETEK[sz]) return null;
  return { szerkezet: sz, istenek_szama: sz === 'egy' ? 1 : sz === 'ketto' ? 2 : (Number(fa.szam) || '') };
}

// ---------- Kitöltöttség és figyelmeztetések ----------

const allapot = (kesz, resz) => (kesz ? 'kesz' : resz ? 'resz' : 'ures');

// opciok: { istenekSzama, parokSzama, kotottParok, imadokSzama }
export function lepesAllapot(a, opciok = {}) {
  a = obj(a);
  const o = { istenekSzama: 0, parokSzama: 0, kotottParok: 0, imadokSzama: 0, ...opciok };
  const tart = tartomanyokNorm(a.tartomanyok).length;
  const kulsok = ['jelkep', 'szent_allat', 'szent_ido', 'eszkozok', 'istentisztelet', 'tanitas', 'tanok', 'halotti', 'egyeni_ima', 'otthoni', 'muveszet'];
  return {
    fajta: allapot(!!SZERKEZETEK[a.szerkezet] && (a.szerkezet === 'egy' || o.istenekSzama >= 1), !!a.szerkezet || van(a.ihlet)),
    isten_fajta: allapot(tart > 0 && !!a.szerep, tart > 0 || !!a.szerep || van(a.ihlet)),
    kultusz_fajta: allapot(van(a.imadott) || tart > 0 || !!a.imadott_id, van(a.ihlet)),
    valosag: allapot(!!a.valosag && !!a.jelenlet && !!a.tudas, !!a.valosag || !!a.jelenlet || !!a.tudas || van(a.valosag_jegyzet)),
    panteon: allapot(o.parokSzama > 0 && o.kotottParok >= o.parokSzama, o.kotottParok > 0 || van(a.panteon_jegyzet)),
    ellenerok: allapot(van(a.ellenerok) && van(a.hierarchia), van(a.ellenerok) || van(a.hierarchia) || van(a.sikok) || van(a.csavar)),
    hivek: allapot((van(a.hivek) || o.imadokSzama > 0) && !!a.idegenek,
      van(a.hivek) || o.imadokSzama > 0 || !!a.idegenek || !!a.miert || van(a.politika) || konfliktusokNorm(a.konfliktusok).length > 0),
    agak: allapot(van(a.agak) || miszteriumokNorm(a.miszteriumok).length > 0, van(a.elfeledett)),
    tevekenysegek: allapot(tevekenysegekNorm(a.tevekenysegek).length > 0, false),
    elteres: allapot(elteresekNorm(a.elteresek).length > 0 && van(a.igaz_hit), van(a.igaz_hit) || elteresekNorm(a.elteresek).length > 0 || van(a.felismeres) || van(a.nepek_politika)),
    kulsosegek: allapot(van(a.jelkep) && van(a.tanok), kulsok.some((k) => van(a[k])) || szolasokNorm(a.szolasok).length > 0 || !!a.viselet),
    unnepek: allapot(unnepekNorm(a.unnepek).length > 0, false),
    nezetek: allapot(van(a.nepek) && !!a.magia_megiteles && !!a.hitehagyas, van(a.nepek) || !!a.magia_megiteles || !!a.hitehagyas || van(a.elvarasok)),
    magia: allapot(arkanumokOf(a).length > 0 || isteniSzabalyokOf(a).length > 0, van(a.papok) || van(a.szent_fegyver) || tiltottArkanumokOf(a).length > 0),
    jatekosok: allapot(van(a.mindennapok) && van(a.titkok), van(a.mindennapok) || van(a.hivo_hos))
  };
}

// Figyelmeztetések: [{ lepes, szoveg }]. opciok: { istenekSzama, parokSzama, kotottParok, szuloFajta, vanAnyavallas }
export function figyelmeztetesek(a, opciok = {}) {
  a = obj(a);
  const o = { istenekSzama: 0, parokSzama: 0, kotottParok: 0, ...opciok };
  const f = fajtaOf(a);
  const ki = [];
  if (f === 'vallas') {
    if (['panteon', 'csaladi'].includes(a.szerkezet) && o.istenekSzama < 2) ki.push({ lepes: 'fajta', szoveg: 'A panteonnak még ' + (o.istenekSzama ? 'csak egy istene van' : 'nincs istene') + ' a fában; az istenek a „+ isten” gombbal kerülnek a vallás alá.' });
    if (a.szerkezet === 'ketto' && o.istenekSzama !== 2 && o.istenekSzama > 0) ki.push({ lepes: 'fajta', szoveg: 'Kettős istenhit, de ' + o.istenekSzama + ' isten van a vallás alatt.' });
    if (a.szerkezet === 'egy' && o.istenekSzama > 1) ki.push({ lepes: 'fajta', szoveg: 'Egyistenhit, de ' + o.istenekSzama + ' isten van a vallás alatt (szentek, ellenhatalmak rendben vannak, ha a szerepük ezt jelzi).' });
    if (a.szerkezet === 'csaladi' && o.parokSzama > o.kotottParok) ki.push({ lepes: 'panteon', szoveg: 'Családi panteon: ' + (o.parokSzama - o.kotottParok) + ' istenpárnak még nincs kötelék (a könyv szerint páronként dobás a kapcsolattáblán).' });
  }
  if (f === 'isten' && !tartomanyokNorm(a.tartomanyok).length && a.szerep !== 'elo_isten') ki.push({ lepes: 'isten_fajta', szoveg: 'Még nincs tartománya: mi az, amiért az isten felel?' });
  if (f === 'kultusz') {
    if (!van(a.imadott) && !a.imadott_id && !tartomanyokNorm(a.tartomanyok).length && o.szuloFajta !== 'vallas' && o.szuloFajta !== 'kultusz')
      ki.push({ lepes: 'kultusz_fajta', szoveg: 'Nem látszik, mit imád a kultusz (egy istent, egy fogalmat, vagy egy vallásból ágazott le).' });
    if (!tevekenysegekNorm(a.tevekenysegek).length) ki.push({ lepes: 'tevekenysegek', szoveg: 'Még nincs tevékenysége: hogyan imádja istenét a kultusz?' });
    if (o.szuloFajta && !elteresekNorm(a.elteresek).length) ki.push({ lepes: 'elteres', szoveg: 'Leágazás, de még nincs leírva, miben tér el az anyavallástól.' });
  }
  if (['tavol', 'elveszett'].includes(a.jelenlet) && !van(a.jelenlet_miert)) ki.push({ lepes: 'valosag', szoveg: 'Az istenek távol vannak vagy eltűntek: a könyv szerint érdemes eldönteni, miért, ki tehette ezt velük, és hogyan térhetnének vissza.' });
  if (a.tudas === 'nem_tudjak' && a.valosag && a.valosag !== 'valodi') ki.push({ lepes: 'valosag', szoveg: '„Nem tudnak róla” azt jelenti, hogy az istenek valódiak, a valóság mégsem „valóban léteznek”.' });
  if (a.tudas === 'tevhit' && a.jelenlet === 'jelen') ki.push({ lepes: 'valosag', szoveg: '„Tévesen hiszik” azt jelenti, hogy nincs isteni jelenlét, a jelenlét mégis „mindig jelen vannak”.' });
  const szab = isteniSzabalyokOf(a);
  if (szab.includes('hitvalsag') && !szab.includes('isteni_mutatvanyok')) ki.push({ lepes: 'magia', szoveg: 'A Companion szerint a hitválság mellé érdemes egy kedvező szabályt is adni, például az isteni mutatványokat.' });
  if (szab.includes('jamborsag') && !szab.includes('hit_fokusz')) ki.push({ lepes: 'magia', szoveg: 'A jámborság az Akaraterő (Hit) fókuszra épül; érdemes azt is megkövetelni.' });
  const tilt = new Set(tiltottArkanumokOf(a));
  if (arkanumokOf(a).some((x) => tilt.has(x))) ki.push({ lepes: 'magia', szoveg: 'Egy arkánum egyszerre ajánlott és tiltott.' });
  if (a.viselet === 'tilos' && van(a.jelkep) && !van(a.titkok)) ki.push({ lepes: 'kulsosegek', szoveg: 'A jel viselése tilos: a hit titkos, érdemes a DM titkai közé is írni, hogyan ismerik fel egymást a hívek.' });
  return ki;
}

// Rövid összefoglaló a listákhoz.
export function osszefoglalo(a, opciok = {}) {
  a = obj(a);
  const f = fajtaOf(a);
  const r = [FAJTAK[f].nev];
  if (f === 'vallas' && SZERKEZETEK[a.szerkezet]) r.push(SZERKEZETEK[a.szerkezet].nev.toLowerCase());
  if (f === 'isten' && a.szerep && a.szerep !== 'isten' && SZEREPEK[a.szerep]) r.push(SZEREPEK[a.szerep].nev.toLowerCase());
  const t = tartomanyokNorm(a.tartomanyok);
  if (t.length) r.push(t.map((x) => x.nev.toLowerCase()).join(', '));
  if (f === 'kultusz' && van(a.imadott)) r.push('imádja: ' + szoveg(a.imadott));
  if (opciok.imadokSzama) r.push(opciok.imadokSzama + ' imádó');
  return r.join(', ');
}
