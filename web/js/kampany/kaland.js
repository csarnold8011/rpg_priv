// Kampányépítő, 2. fejezet: kalandok (Building the Adventure). Tiszta függvények és a könyv szerinti állandók
// (rövid saját magyar összefoglalók, a könyv szövege nélkül). A kaland és a rész saját mezői az elem adatában
// vannak, mezőnként öröklődnek (elem.js), a listás és összetett mezők (ütemek, horgok, NJK-k, ellenfél, hossz)
// egészben. Terv: claude/kampanyepito-terv.md, „2. fejezet”.
import { index, nev, megjelenitett, peldany, sablonbol } from './elem.js';
import { gyerekek, leszarmazottak } from './fa.js';
import { IVEK } from './keret.js';

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const egesz = (x, min, max, alap) => {
  const n = Number(x);
  if (x === '' || x === null || x === undefined || !Number.isFinite(n)) return alap;
  return Math.max(min, Math.min(max, Math.round(n)));
};

// A tervezés lépései a könyv sorrendjében (a szerkesztő panelei; oldalszám a könyv szerint).
export const KALAND_LEPESEK = {
  hasznalat: { nev: 'Formátum és használat', en: 'Using Adventures, Adventure Format', oldal: '17–21',
    utmutato: 'Hogyan használod a kalandot (kampány része, egyalkalmas, kiadott kaland), és milyen formában építed fel. A formátum csak a kiinduló részeket hozza létre, utána a fa szabadon alakítható.' },
  otlet: { nev: '1. Ötletelés', en: 'Brainstorm', oldal: '22',
    utmutato: 'Írj fel szavakat, ötleteket: a cselekmény, a konfliktus, a gonosztevő, egy ősi kincs, egy átok. Keresd, melyik izgat a legjobban, és mire építhetsz a saját erősségeidből.' },
  jatekosok: { nev: '2. Beszélj a játékosaiddal', en: 'Speak to Your Players', oldal: '23–24',
    utmutato: 'Titok nélkül, általánosságban: mit élveznek, mit szeretnének, milyen elvarratlan szálak maradtak. Gondold végig azt is, mennyi befolyást adsz nekik a történetre, és mit teszel, ha váratlant tesznek.' },
  tortenet: { nev: '3. A történet', en: 'Define the Story', oldal: '24–25',
    utmutato: 'Hangulat és téma, a központi konfliktus és a horgok, a kaland célja és megoldása. A csapatnak mindig világosan tudnia kell, mi a cél; a csavarnak legyen belső logikája.' },
  utemek: { nev: 'Ütemek és hossz', en: 'Story Beats, Adventure Length', oldal: '25–26',
    utmutato: 'Az ütem a történetet előre vivő esemény; az ütemsor a kaland vázlata. Három ütem, aztán egy pihenő: ismerős ritmus. Ötnél több egymás után kifárasztja a játékosokat. Az ütemek jelenetekké válnak.' },
  ellenfel: { nev: 'Proaktív ellenfél', en: 'Proactive Antagonists', oldal: '26',
    utmutato: 'Mit akar az ellenfél, mi a terve, mit tesz, ha kudarcot vall, és meddig hajlandó elmenni? Ha jól ismered, a hősök lépéseire válaszolva sok más előkészítést kivált. Ne legyen a kedvenced: nem ő a főszereplő.' },
  njkk: { nev: '4. Fontos NJK-k', en: 'Define Important NPCs', oldal: '26–27',
    utmutato: 'Néhány fontos szereplő: megbízók, ellenfelek és gonosztevők, szövetségesek, kapcsolatok és társak. Mindegyiknek legyen saját háttere, személyisége és külseje.' },
  jutalmak: { nev: '5. Jutalmak', en: 'Player Rewards', oldal: '27',
    utmutato: 'Mit nyernek a hősök: pénz, hírnév, tárgyak, szövetségesek, tapasztalat. A jutalomelemek a 6. fejezettel (5.6 alépés) kapcsolhatók ide.' },
  plotpont: { nev: 'Plot-point kaland', en: 'Plot-Point Adventures', oldal: '20–21',
    utmutato: 'Fontos helyszínek listája (a világ útikönyve), mindegyikben horog egy rövid, egy-két alkalmas mini kalandhoz, amely az átfogó szálhoz kapcsolódik. Kaland köthető feltételhez is (szint, specializáció, esemény). Minden mini kaland után legyen két-három irány, merre tovább.' },
  letere: { nev: 'Ha a csapat letér', en: 'Going Off the Rails', oldal: '18–19',
    utmutato: 'Menj bele, légy őszinte, igazodj: a mellékszálat kösd vissza a történethez (például a mellékes NJK ugyanoda tart). Ide jegyezd a lehetséges kerülőutakat és visszavezető ötleteket.' }
};

// A kaland használata (Using Adventures).
export const JELLEGEK = {
  kampany: 'A kampány része (Campaigns)',
  egyalkalmas: 'Egyalkalmas kaland (One-Shot Adventures)',
  kiadott: 'Kiadott kaland átdolgozva (Using Published Adventures)'
};

// Formátumok (Adventure Format). reszek: a kiinduló részek (felvonások) a könyv szerint.
export const FORMATUMOK = {
  harom: {
    nev: 'Három felvonás', en: 'Three-Act Adventures', oldal: '19–20',
    leiras: 'Kiegyensúlyozott tempó, kiszámítható sorrend a záró összecsapásig. Kezdő mesélőnek a legegyszerűbb.',
    reszek: [
      { kulcs: 'expozicio', nev: '1. felvonás: Expozíció', en: 'Act One: Exposition',
        utmutato: 'A szereplők, a helyzet és a háttér bemutatása; a központi konfliktus, amely kitart a tetőpontig, és a kiváltó esemény (horog), amely mindenkit bevon.' },
      { kulcs: 'bonyodalom', nev: '2. felvonás: Bonyodalom', en: 'Act Two: Rising Action',
        utmutato: 'Az első találkozás az ellenféllel vagy az embereivel. A fenyegetés egyre nő, de a hősök kisebb győzelmeket, nyomokat, gyenge pontokat, felszerelést és szövetségeseket szerezhetnek.' },
      { kulcs: 'megoldas', nev: '3. felvonás: Megoldás', en: 'Act Three: Resolution',
        utmutato: 'A tetőpont: a központi konfliktus megoldódik, gyakran a 2. felvonásban szerzett segítséggel. A mellékszálak is lezárulnak, jönnek a jutalmak.' }
    ]
  },
  ot: {
    nev: 'Öt felvonás', en: 'Five-Act Adventures', oldal: '20',
    leiras: 'A három felvonás finomabb bontása: külön tetőpont, hanyatló cselekmény és lecsengés.',
    reszek: [
      { kulcs: 'expozicio', nev: '1. felvonás: Expozíció', en: 'Exposition', utmutato: 'A szereplők, a helyzet és a konfliktus bemutatása, mint a három felvonásnál.' },
      { kulcs: 'felivelo', nev: '2. felvonás: Felívelő cselekmény', en: 'Rising Action',
        utmutato: 'A kiváltó esemény, amely elindítja a felívelő cselekményt; a fenyegetés nő.' },
      { kulcs: 'tetopont', nev: '3. felvonás: Tetőpont', en: 'Climax', utmutato: 'A várva várt végső összecsapás.' },
      { kulcs: 'hanyatlo', nev: '4. felvonás: Hanyatló cselekmény', en: 'Falling Action',
        utmutato: 'A fő konfliktus megoldódik: győzelem vagy vereség. A végkimenetelben maradhat még kétség.' },
      { kulcs: 'lecsenges', nev: '5. felvonás: Lecsengés', en: 'Denouement',
        utmutato: 'A többi konfliktus is lezárul, a feszültség oldódik, a hősök visszatérnek a maguk (kalandozó) hétköznapjaiba.' }
    ]
  },
  plotpont: {
    nev: 'Plot-point', en: 'Plot-Point Adventures', oldal: '20–21',
    leiras: 'Homokozószerű: helyszínenként mini kalandok, amelyek egy átfogó szálhoz kapcsolódnak, és a végén a lezárás.',
    reszek: [
      { kulcs: 'lezaras', nev: 'Lezárás: a végső összecsapás', en: 'Wrapping it all Up',
        utmutato: 'Ha a mini kalandok elkészültek, az átfogó szál lezárása: itt használják fel mindazt, amit útközben szereztek. Legyen olyan epikus és emlékezetes, amennyire csak lehet.' }
    ]
  },
  szabad: {
    nev: 'Szabad', en: 'Freeform Adventures', oldal: '20',
    leiras: 'Kevés előre megírt rész: a hősök maguk keresik az útjukat, te a jelzéseikre és a hátterükre építesz. Nincsenek kiinduló részek.',
    reszek: []
  }
};

// A rész szerepe a kalandban.
export const RESZ_SZEREPEK = {
  felvonas: 'Felvonás',
  szal: 'Szál vagy epizód',
  mini: 'Mini kaland (plot-point)'
};

// A plot-point mini kaland feltétele (a könyv: szint, képesség vagy specializáció, esemény).
export const FELTETEL_TIPUSOK = {
  '': 'nincs (helyszínhez kötött)',
  szint: 'Szint elérése',
  specializacio: 'Specializáció, képesség',
  esemeny: 'Esemény',
  egyeb: 'Egyéb'
};

// A fontos NJK-k szerepei (Define Important NPCs).
export const NJK_SZEREPEK = {
  megbizo: { nev: 'Megbízók', egyes: 'Megbízó', en: 'Quest Givers' },
  ellenfel: { nev: 'Ellenfelek és gonosztevők', egyes: 'Ellenfél', en: 'Adversaries and Villains' },
  segito: { nev: 'Szövetségesek, kapcsolatok, társak', egyes: 'Segítő', en: 'Allies, Contacts, and Peers' }
};

// A könyv témapéldái (Atmosphere and Theme), csipként; saját téma is írható.
export const TEMA_PELDAK = ['árulás', 'hódítás', 'felfedezés', 'félelem', 'kapzsiság', 'szerelem', 'kötelesség'];

// ---------- Mezők normalizálása (régi, importált vagy hiányos adat is biztonságosan olvasható) ----------

export function utemNorm(x, i) {
  const o = obj(x);
  return { id: szoveg(o.id) || 'ut' + (i + 1), szoveg: szoveg(o.szoveg), jelenet_id: szoveg(o.jelenet_id),
    kotetlen: o.kotetlen === true, szunet: o.szunet === true, nagy_csata: o.nagy_csata === true };
}
export const utemekNorm = (x) => lista(x).map(utemNorm);

export function hosszNorm(x) {
  const o = obj(x);
  return { alkalmak: egesz(o.alkalmak, 0, 99, 0), jelenet_alkalom: egesz(o.jelenet_alkalom, 0, 30, 0) };
}

export function ellenfelNorm(x) {
  const o = obj(x);
  return {
    nev: szoveg(o.nev), njk_id: szoveg(o.njk_id), cel: szoveg(o.cel), szemelyiseg: szoveg(o.szemelyiseg),
    terv: lista(o.terv).map((t, i) => ({ id: szoveg(obj(t).id) || 'tl' + (i + 1), szoveg: szoveg(obj(t).szoveg) })),
    kudarc: szoveg(o.kudarc), meddig: szoveg(o.meddig)
  };
}

export function njkkNorm(x) {
  return lista(x).map((n, i) => {
    const o = obj(n);
    return { id: szoveg(o.id) || 'nj' + (i + 1), szerep: NJK_SZEREPEK[o.szerep] ? o.szerep : 'segito',
      nev: szoveg(o.nev), njk_id: szoveg(o.njk_id), jegyzet: szoveg(o.jegyzet) };
  });
}

export function horgokNorm(x) {
  return lista(x).map((h, i) => {
    const o = obj(h);
    return { id: szoveg(o.id) || 'hh' + (i + 1), karakter_id: szoveg(o.karakter_id), kinek: szoveg(o.kinek), szoveg: szoveg(o.szoveg) };
  });
}

export function feltetelNorm(x) {
  const o = obj(x);
  return { tipus: FELTETEL_TIPUSOK[o.tipus] !== undefined ? szoveg(o.tipus) : '', ertek: szoveg(o.ertek) };
}

export function merreTovabbNorm(x) {
  return lista(x).map((m, i) => {
    const o = obj(m);
    return { id: szoveg(o.id) || 'mt' + (i + 1), resz_id: szoveg(o.resz_id), szoveg: szoveg(o.szoveg) };
  });
}

export const formatumOf = (adat) => (FORMATUMOK[obj(adat).formatum] ? obj(adat).formatum : '');

// ---------- Formátum ----------

// A formátum kiinduló részei új rész-elemként a kaland alá. ujId: azonosító-gyártó (például () => 'el_…').
// Csak akkor ad részeket, ha a kalandnak még nincs rész-gyereke (utána a fa szabadon szerkeszthető).
export function formatumReszek(kaland, formatum, elemek, ujId) {
  const f = FORMATUMOK[formatum];
  if (!f || !kaland) return [];
  if ((elemek || []).some((e) => e.szulo_id === kaland.id && e.tipus === 'resz')) return [];
  return f.reszek.map((r, i) => ({
    id: ujId(), tipus: 'resz', nev: r.nev, vilag_id: kaland.vilag_id || '', kampany_id: kaland.kampany_id || '', alap_id: '',
    szulo_id: kaland.id, sorrend: (i + 1) * 10,
    adat: { nev: r.nev, allapot: 'vazlat', szerep: formatum === 'plotpont' && r.kulcs !== 'lezaras' ? 'mini' : 'felvonas', formatum_resz: r.kulcs },
    verzio: 0, aktiv: true
  }));
}

// A rész útmutatója a kalandja formátuma szerint (ha a rész a formátumból jött).
export function reszUtmutato(resz, kaland, ix) {
  const kulcs = megjelenitett(resz, ix).formatum_resz;
  const f = FORMATUMOK[formatumOf(kaland ? megjelenitett(kaland, ix) : {})];
  const minden = f ? f.reszek : Object.values(FORMATUMOK).flatMap((x) => x.reszek);
  return kulcs ? minden.find((r) => r.kulcs === kulcs) || null : null;
}

// A rész (vagy jelenet) kalandja: az első kaland típusú ős.
export function kalandja(e, ix) {
  let x = e;
  const latott = new Set();
  while (x && !latott.has(x.id)) {
    if (x.tipus === 'kaland') return x;
    latott.add(x.id);
    x = x.szulo_id ? ix.get(x.szulo_id) : null;
  }
  return null;
}

// ---------- Ütemek ----------

// A kaland teljes ütemsora: a kaland saját ütemei, majd a részeké a fa sorrendjében (mélységi bejárás).
// Visszaad: [{ utem, gazda (a kaland vagy a rész), szint (mélység) }].
export function utemSor(kaland, elemek, ix) {
  const i = ix || index(elemek);
  const ki = [];
  const latott = new Set();
  const bejar = (e, melyseg) => {
    if (!e || latott.has(e.id) || melyseg > 30) return;
    latott.add(e.id);
    utemekNorm(megjelenitett(e, i).utemek).forEach((u) => ki.push({ utem: u, gazda: e, melyseg }));
    gyerekek(elemek, e.id, i).filter((g) => g.tipus === 'resz' && g.aktiv !== false).forEach((g) => bejar(g, melyseg + 1));
  };
  bejar(kaland, 0);
  return ki;
}

// Az ütemsor csoportjai a megjelenítéshez: az egymást követő kötetlen ütemek egy „tetszőleges sorrendben” csoportot
// alkotnak. Visszaad: [{ kotetlen: bool, utemek: [index a sorban] }].
export function utemCsoportok(utemek) {
  const ki = [];
  (utemek || []).forEach((u, i) => {
    const kot = !!(u.utem ? u.utem.kotetlen : u.kotetlen);
    const utolso = ki[ki.length - 1];
    if (kot && utolso && utolso.kotetlen) utolso.utemek.push(i);
    else ki.push({ kotetlen: kot, utemek: [i] });
  });
  return ki;
}

// Figyelmeztetések az ütemsorra (a könyv irányelve, nem szabály): öt ütemnél több egymás után pihenő nélkül.
export function utemFigyelmeztetesek(sor) {
  const ki = [];
  let egymasutan = 0;
  let kezdet = 0;
  (sor || []).forEach((x, i) => {
    const u = x.utem || x;
    if (u.szunet) { egymasutan = 0; return; }
    if (egymasutan === 0) kezdet = i;
    egymasutan++;
    if (egymasutan === 6) ki.push({ tipus: 'tul_hosszu', tol: kezdet, szoveg: 'Hat vagy több ütem jön egymás után pihenő nélkül (a ' + (kezdet + 1) + '. ütemtől). A könyv szerint ötnél több kifárasztja a játékosokat; tegyél be egy pihenőt.' });
  });
  return ki;
}

// Alkalmakra bontás (Adventure Length): az ütemek sorban, alkalmanként jelenetAlkalom darab.
// Visszaad: { alkalmak: [{ szam, utemek: [index] }], becsult, figyelmeztetesek: [{ index, szoveg }] }.
// A nagy csata (set piece) ne essen egy alkalom végére: a könyv szerint ne kezdődjön az alkalom vége felé.
export function alkalomBeosztas(sor, hossz) {
  const h = hosszNorm(hossz);
  const n = h.jelenet_alkalom;
  const db = (sor || []).length;
  if (!n || !db) return { alkalmak: [], becsult: 0, figyelmeztetesek: [] };
  const alkalmak = [];
  const fig = [];
  (sor || []).forEach((x, i) => {
    const szam = Math.floor(i / n) + 1;
    if (!alkalmak[szam - 1]) alkalmak[szam - 1] = { szam, utemek: [] };
    alkalmak[szam - 1].utemek.push(i);
    const u = x.utem || x;
    if (u.nagy_csata && n > 1 && i % n === n - 1) {
      fig.push({ index: i, szoveg: 'A nagy csata („' + (u.szoveg || 'ütem').slice(0, 40) + '”) a(z) ' + szam + '. alkalom végére esik. Hosszú lehet: jobb, ha nem az alkalom vége felé kezdődik.' });
    }
  });
  const becsult = alkalmak.length;
  if (h.alkalmak && becsult > h.alkalmak) fig.push({ index: -1, szoveg: 'Az ütemek alapján ' + becsult + ' alkalom kell, a terv ' + h.alkalmak + '. Kevesebb ütem, vagy több jelenet egy alkalomra?' });
  return { alkalmak, becsult, figyelmeztetesek: fig };
}

// Ütem mozgatása a listában (irany: −1 fel, +1 le). Új listát ad.
export function utemMozgat(utemek, i, irany) {
  const u = (utemek || []).slice();
  const j = i + irany;
  if (i < 0 || j < 0 || i >= u.length || j >= u.length) return u;
  const t = u[i]; u[i] = u[j]; u[j] = t;
  return u;
}

// A kaland jelenetei (leszármazottak), a fa sorrendjében.
export function kalandJelenetei(kaland, elemek, ix) {
  const i = ix || index(elemek);
  const ki = [];
  const bejar = (id, m) => gyerekek(elemek, id, i).forEach((g) => {
    if (g.aktiv === false) return;
    if (g.tipus === 'jelenet') ki.push(g);
    if (m < 30) bejar(g.id, m + 1);
  });
  if (kaland) bejar(kaland.id, 0);
  return ki;
}

// Egy ütem jelenetének feloldása a kaland fáján belül. Örökölt ütemnél (sablonból vagy világból jött kaland) a
// jelenet azonosítója az alap jelenetére mutat: ilyenkor a kaland azon jelenete a válasz, amely arra épül.
export function jelenetFelold(jelenetId, kaland, elemek, ix) {
  if (!jelenetId || !kaland) return null;
  const jelenetek = kalandJelenetei(kaland, elemek, ix);
  return jelenetek.find((j) => j.id === jelenetId) || jelenetek.find((j) => j.alap_id === jelenetId) || null;
}

// ---------- Ívek ----------

// A kampány kalandjai ív szerint: [{ iv (IVEK eleme vagy null: ívhez nem kötött), kalandok }].
export function ivSzerint(kalandok, ix) {
  const csoport = IVEK.map((iv) => ({ iv, kalandok: [] })).concat([{ iv: null, kalandok: [] }]);
  (kalandok || []).forEach((k) => {
    const iv = megjelenitett(k, ix).iv;
    const cs = csoport.find((c) => c.iv && c.iv.kulcs === iv) || csoport[csoport.length - 1];
    cs.kalandok.push(k);
  });
  const rend = (a, b) => (Number(a.sorrend) || 0) - (Number(b.sorrend) || 0) || nev(a, ix).localeCompare(nev(b, ix), 'hu');
  csoport.forEach((c) => c.kalandok.sort(rend));
  return csoport;
}

// ---------- Sorrend ----------

// Egy elem helycseréje a megadott (már rendezett) testvérlistában: az elem az új helyre kerül, a lista újraszámozódik.
// Csak a ténylegesen változó elemeket adja vissza (új sorrenddel).
export function sorrendCsere(testverek, id, irany) {
  const t = (testverek || []).slice();
  const i = t.findIndex((x) => x.id === id);
  const j = i + irany;
  if (i < 0 || j < 0 || j >= t.length) return [];
  const x = t[i]; t[i] = t[j]; t[j] = x;
  const ki = [];
  t.forEach((e, k) => { const s = (k + 1) * 10; if (Number(e.sorrend) !== s) ki.push({ ...e, sorrend: s }); });
  return ki;
}

// ---------- Kiindulás egy sablon vagy világ kalandjából, a részeivel és jeleneteivel ----------

// A gyökér és minden leszármazottja új példányként (üres felülírással, az alapjukra hivatkozva), a fa szerkezetével.
// cel: { vilag_id, kampany_id, szulo_id, sorrend }. ujId: azonosító-gyártó. Az archivált leszármazottak kimaradnak.
// Visszaad: a létrehozandó elemek listája szülő előtt gyerek sorrendben (a mentés sorrendje).
export function peldanyFa(gyoker, elemek, cel, ujId) {
  const terkep = new Map();
  const gy = peldany(gyoker, cel, ujId());
  terkep.set(gyoker.id, gy.id);
  const ki = [gy];
  const ix = index(elemek);
  const bejar = (id, m) => gyerekek(elemek, id, ix).forEach((g) => {
    if (g.aktiv === false || terkep.has(g.id) || m > 30) return;
    const p = peldany(g, { vilag_id: cel.vilag_id, kampany_id: cel.kampany_id, szulo_id: terkep.get(id), sorrend: Number(g.sorrend) || 0 }, ujId());
    terkep.set(g.id, p.id);
    ki.push(p);
    bejar(g.id, m + 1);
  });
  bejar(gyoker.id, 0);
  return ki;
}

// Sablon a gyökérből és minden (nem archivált) leszármazottjából: a megjelenített tartalom önálló sablonokként, a fa
// szerkezetével. Az ütemek jelenet-hivatkozásai az új sablonjelenetekre mutatnak. Visszaad: szülő előtt gyerek sorrendben.
export function sablonFa(gyoker, elemek, ix, ujId) {
  const i = ix || index(elemek);
  const terkep = new Map();
  const ki = [];
  const bejar = (e, szuloId, m) => {
    if (!e || terkep.has(e.id) || m > 30) return;
    const s = sablonbol(e, i, ujId());
    s.szulo_id = szuloId;
    s.sorrend = szuloId ? Number(e.sorrend) || 0 : 0;
    terkep.set(e.id, s.id);
    ki.push(s);
    gyerekek(elemek, e.id, i).filter((g) => g.aktiv !== false).forEach((g) => bejar(g, s.id, m + 1));
  };
  bejar(gyoker, '', 0);
  // a jelenet-hivatkozások átírása (az örökölt hivatkozás az alap jelenetére is mutathat)
  const jelenetUj = (id) => {
    if (!id) return '';
    if (terkep.has(id)) return terkep.get(id);
    const pl = (elemek || []).find((x) => x.alap_id === id && terkep.has(x.id));
    return pl ? terkep.get(pl.id) : '';
  };
  ki.forEach((s) => {
    if (Array.isArray(s.adat.utemek)) s.adat.utemek = utemekNorm(s.adat.utemek).map((u) => ({ ...u, jelenet_id: jelenetUj(u.jelenet_id) }));
  });
  return ki;
}

// Rövid összegzés a fa sorához: részek, jelenetek és ütemek száma.
export function kalandOsszegzes(kaland, elemek, ix) {
  const i = ix || index(elemek);
  const l = leszarmazottak(kaland, elemek).filter((e) => e.aktiv !== false);
  return {
    reszek: l.filter((e) => e.tipus === 'resz').length,
    jelenetek: l.filter((e) => e.tipus === 'jelenet').length,
    utemek: utemSor(kaland, elemek, i).length
  };
}

// A kaland lépéseinek kitöltöttsége ('ures' | 'resz' | 'kesz') a szerkesztő panelcímeihez.
export function lepesAllapot(adat) {
  const a = obj(adat);
  const van = (x) => !!szoveg(x).trim();
  const allapot = (db, ossz) => (db === 0 ? 'ures' : db >= ossz ? 'kesz' : 'resz');
  const ell = ellenfelNorm(a.ellenfel);
  return {
    hasznalat: allapot([a.formatum, a.jelleg, a.iv].filter(van).length, 3),
    otlet: lista(a.otletek).length || van(a.otlet_jegyzet) ? 'kesz' : 'ures',
    jatekosok: allapot([a.jatekosok, a.befolyas].filter(van).length, 2),
    tortenet: allapot([a.hangulat || lista(a.temak).length ? 'x' : '', a.konfliktus, a.horog, a.cel, a.megoldas].filter(van).length, 5),
    utemek: utemekNorm(a.utemek).length ? 'kesz' : 'ures',
    ellenfel: allapot([ell.cel, ell.terv.length ? 'x' : '', ell.kudarc].filter(van).length, 3),
    njkk: njkkNorm(a.njkk).length ? 'kesz' : 'ures',
    jutalmak: van(a.jutalmak) ? 'kesz' : 'ures',
    plotpont: allapot([a.atfogo_szal, a.lezaras].filter(van).length, 2),
    letere: van(a.letere) ? 'kesz' : 'ures'
  };
}

