// Kampányépítő 5.5: szereplők (a Kampányépítő könyv 5. fejezete, Building Characters, és a Companion NJK-része).
// Az NJK-tár bővítése: szintek (sablon, világ, szabad), öröklés egy alap NJK-ról, a könyv tervezési lépései, rejtett
// vonások, és a hivatkozások a Kampányépítő elemeiből. Tiszta függvények. Teszt: node tools/teszt/kampany.mjs.
// Terv: claude/kampanyepito-terv.md, „5. fejezet: Szereplők”.
//
// Öröklés (materializált): az NJK sora mindig a teljes, megjelenített adatot tárolja, és adat.felulirt sorolja fel,
// mely mezők a sajátjai. A többi az alapé (alap_id): a háttér mentéskor kiszámolja a felülírásokat, és az alap
// módosításakor a rá épülő NJK-kat is frissíti (backend/Njk.gs, ugyanezzel a mezőlistával). Így minden más rész
// (csata, játékosnézet, Bestiárium-nézet) változatlanul a teljes adatot kapja.
//
// Az NJK szerepjátékos tervezése az adat.szereplo mezőben van (csak a DM látja):
// { szerepek, szerep_jegyzet, ellenpolus_id, epitesi_mod, epites_jegyzet, cel, indok, vonas, arnyalatok, hang, hibak,
//   elet, gyerekkor, ma, kapcsolat_jegyzet, rejtett, kulcspontok, monologus, kerdesek, fejlodes_terv, valtozasok }

const szoveg = (x) => (x === undefined || x === null ? '' : String(x));
const lista = (x) => (Array.isArray(x) ? x : []);
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const masol = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
const van = (x) => (Array.isArray(x) ? x.length > 0 : !!String(x === undefined || x === null ? '' : x).trim());

// ---- A könyv szerepei (59–61. oldal) ----
export const SZEREPEK = {
  megbizo: { nev: 'Megbízó', en: 'Benefactor', oldal: 59, rovid: 'Megbízást ad és fizet, de maga nem tudja vagy nem akarja elvégezni.',
    tanacs: 'Rendszerint magasabb rangú a hősöknél, és az is akar maradni: tisztességesen fizet, de nem lesz a barátjuk. Vigyázz, hogy a vagyona ne tűnjön a hősök kasszájának.' },
  szemlelo: { nev: 'Szemlélő', en: 'Bystander', oldal: 59, rovid: 'Színt ad a helynek, céljai nem kötődnek a hősökhöz.',
    tanacs: 'Elég néhány emlékezetes vonás, statblokk sem kell; ha mégis próbát dob, találj ki értéket és írd fel. Bármilyen más szereplővé válhat.' },
  ellenpolus: { nev: 'Ellenpólus', en: 'Foil', oldal: 59, rovid: 'A csapat segítője, de egy hős idegeire megy, és a különbségükkel kiemeli a hős jellemét.',
    tanacs: 'Kösd egy konkrét hőshöz: mi az a vonás, amelyet a különbségük kiemel?' },
  barat: { nev: 'Barát', en: 'Friend', oldal: 60, rovid: 'Motiváció és segítség forrása, észszerű keretek között.',
    tanacs: 'Nem kell minden alkalommal veszélybe sodorni; egy hétköznapi kérése is új kalandba vezethet.' },
  alvezer: { nev: 'Alvezér', en: 'Henchman', oldal: 60, rovid: 'A főgonosz legfontosabb embere, saját, hozzá illő céllal.',
    tanacs: 'Adj neki egyedi képességet vagy felszerelést, de a személyisége és a tettei maradnak emlékezetesek.' },
  csatlos: { nev: 'Csatlós', en: 'Lackey', oldal: 60, rovid: 'Névtelen, parancsra cselekvő ellenfél (bandita, zsoldos, haramia).',
    tanacs: 'Gyorsan elkészíthető közös mintára építsd, és egy különleges képesség vagy helyzet tegye érdekessé (például mindegyiknél gránát).' },
  fogonosz: { nev: 'Főgonosz', en: 'Mastermind', oldal: 60, rovid: 'Mindennek a kitervelője, gyakran egy egész kampány hajtóereje.',
    tanacs: 'A kihívás nem csak a nyers erő: lehet, hogy eljutni hozzá vagy kideríteni, ki ő, a nehéz. Sokáig szövetségesnek is mutathatja magát.' },
  csapattag: { nev: 'Csapattag', en: 'Party Member', oldal: 61, rovid: 'Egy alkalomra, kalandra vagy hosszabb időre a csapattal tartó szövetséges.',
    tanacs: 'A könyv szerint (karakterként) építsd, hogy a hősökkel egy szinten legyen. Ne ő oldja meg a gondokat, ne ő adja a döntő csapást; vendégjátékos is viheti.' }
};

// ---- Az építés módjai (57–58. oldal, Companion 103–104.) ----
export const EPITESI_MODOK = {
  konyv: { nev: 'A könyv szerint', en: 'By-the-Book', oldal: '57', forras: 'Kampányépítő',
    leiras: 'Karakterként, a karakterkészítővel, majd szintenként fejlesztve. Szövetségesnek, csapattagnak, vagy ha biztosan a hősökhöz kell mérni. A fenyegetési szint adja a szintet (Alapkönyv 104.).' },
  szabad: { nev: 'Szabad tervezés', en: 'Freeform Design', oldal: '58', forras: 'Kampányépítő',
    leiras: 'Nem kell követni a szintlépést és az osztályokat: azt kapja, amit a történet kíván. A Companion fenyegetési táblázata (104.) ad hozzá kiindulást.' },
  atalakitas: { nev: 'Meglévő átalakítása', en: 'Modifying Existing Characters', oldal: '58', forras: 'Kampányépítő',
    leiras: 'Egy meglévő szereplő vagy lény másolata, utána módosítva. Ha az eredeti kiegyensúlyozott, minden hozzáadott dologért vegyél el valami hasonlót.' }
};

// ---- A szerkesztő lépései (a könyv sorrendjében) ----
export const LEPESEK = [
  { kulcs: 'alap', nev: 'Alapadatok', utmutato: 'Név, fajta, fenyegetés, kampányok, kép, és hogy mire épül (öröklés).' },
  { kulcs: 'szerep', nev: 'Szerep a történetben', en: 'Using Characters, Roles', oldal: '56–61',
    utmutato: 'Szövetséges vagy ellenfél, barát vagy ellenpólus: mire kell a történetben? Egy szereplőnek több szerepe is lehet, és a szerep változhat.' },
  { kulcs: 'kepessegek', nev: 'Képességek és erő', en: 'Abilities & Powers', oldal: '57–58',
    utmutato: 'Három jó út van: a könyv szerint, szabad tervezéssel, vagy egy meglévő átalakításával; gyakran ezek keverékével.' },
  { kulcs: 'szemelyiseg', nev: 'Személyiség', en: 'Personality', oldal: '58–59',
    utmutato: 'Ne legyen egyoldalú: legyen célja és indítéka, a gonosztevőnek is. A visszatérő szereplőnek adj egy eltúlzott, emlékezetes vonást.' },
  { kulcs: 'hatter', nev: 'Háttér', en: 'Background', oldal: '59',
    utmutato: 'Mi vezette idáig? Minél fontosabb a szereplő, annál több időt érdemes a múltjára szánni.' },
  { kulcs: 'kapcsolatok', nev: 'Kapcsolatok', en: 'Relationships', oldal: '57',
    utmutato: 'Kihez kötődik? A kapcsolattábla akkor való, ha már feltételezhető valamilyen kötelék (család, rend, panteon).' },
  { kulcs: 'rejtett', nev: 'Titkok és rejtett vonások', en: 'Hidden Aspects', oldal: 'Companion 101–103',
    utmutato: 'Olyan vonások, amelyek csak akkor derülnek ki, amikor a történet felszínre hozza. Leginkább akkor dobj, ha egy játékos rákérdez, mit tud még az NJK.' },
  { kulcs: 'parbeszed', nev: 'A szereplő játszása', en: 'The Art of Playing Characters', oldal: '60–61',
    utmutato: 'Írd le, amit mondania kell, aztán tanuld meg annyira, hogy a váratlan kérdésekre is felelni tudj. Elég a kulcspontok listája is, amit kihúzol.' },
  { kulcs: 'fejlodes', nev: 'Fejlődés', en: 'Character Development', oldal: '62',
    utmutato: 'Az emberek változnak. Minden alkalom után gondold végig, mit tett vele, amit átélt; és engedd, hogy a történet felülírja a tervet.' },
  { kulcs: 'allapot', nev: 'Állapot és szereplések', utmutato: 'A csatán túli állapot, a szereplések naplója, próba a statblokkból, másolat és archiválás.' }
];

export const REJTETT_OSZLOPOK = {
  fokusz: { nev: 'Új fókusz', en: 'New Focus' },
  informacio: { nev: 'Információ', en: 'Information' },
  szerepjatek: { nev: 'Szerepjátékos jellemző', en: 'Roleplaying Feature' }
};

const nId = (o, i, elotag) => szoveg(o.id) || elotag + (i + 1);

export function rejtettNorm(x) {
  return lista(x).map((r, i) => {
    const o = obj(r);
    return { id: nId(o, i, 'rv'), oszlop: REJTETT_OSZLOPOK[o.oszlop] ? o.oszlop : 'informacio', nev: szoveg(o.nev), leiras: szoveg(o.leiras),
      jelek: szoveg(o.jelek), fokusz_id: szoveg(o.fokusz_id), felfedve: !!o.felfedve };
  });
}

// Az adat.szereplo normalizálva (minden mező megvan).
export function szereploNorm(x) {
  const o = obj(x);
  return {
    szerepek: lista(o.szerepek).filter((s) => SZEREPEK[s]),
    szerep_jegyzet: szoveg(o.szerep_jegyzet),
    ellenpolus_id: szoveg(o.ellenpolus_id),
    epitesi_mod: EPITESI_MODOK[o.epitesi_mod] ? o.epitesi_mod : '',
    epites_jegyzet: szoveg(o.epites_jegyzet),
    cel: szoveg(o.cel), indok: szoveg(o.indok), vonas: szoveg(o.vonas),
    arnyalatok: lista(o.arnyalatok).map(szoveg).filter(Boolean),
    hang: szoveg(o.hang), hibak: szoveg(o.hibak),
    elet: szoveg(o.elet), gyerekkor: szoveg(o.gyerekkor), ma: szoveg(o.ma), kapcsolat_jegyzet: szoveg(o.kapcsolat_jegyzet),
    rejtett: rejtettNorm(o.rejtett),
    kulcspontok: lista(o.kulcspontok).map((k, i) => ({ id: nId(obj(k), i, 'kp'), szoveg: szoveg(obj(k).szoveg), elmondva: !!obj(k).elmondva })),
    monologus: szoveg(o.monologus),
    kerdesek: lista(o.kerdesek).map((k, i) => ({ id: nId(obj(k), i, 'kq'), kerdes: szoveg(obj(k).kerdes), valasz: szoveg(obj(k).valasz) })),
    fejlodes_terv: szoveg(o.fejlodes_terv),
    valtozasok: lista(o.valtozasok).map((k, i) => ({ id: nId(obj(k), i, 'vt'), mikor: szoveg(obj(k).mikor), szoveg: szoveg(obj(k).szoveg) }))
  };
}
export const SZEREPLO_MEZOK = Object.keys(szereploNorm({}));

// ---- Szintek és öröklés ----

export const SZINTEK = { sablon: 'Sablon', vilag: 'Világ', szabad: 'Kampány' };
export const MAX_LANC = 4;

// Az örökölhető mezők útvonalai. Nem öröklődik: a kép, az állapot, a szereplések, a kampányok, a kötődés, az irányító.
// A háttér (backend/Njk.gs, NJK_OROKOLHETO) ugyanezt a listát használja; a teszt összeveti a kettőt.
export const OROKOLHETO = [
  'nev', 'fajta', 'fenyegetes', 'alap_szorny',
  'adat.statblokk', 'adat.erosites', 'adat.kezi',
  'adat.szerep.koncepcio', 'adat.szerep.megjelenes', 'adat.szerep.motivacio', 'adat.szerep.nyilvanos', 'adat.szerep.titkok',
  'adat.szerep.kapcsolatok', 'adat.szerep.dm_jegyzet', 'adat.szerep.feladatok'
].concat(SZEREPLO_MEZOK.map((m) => 'adat.szereplo.' + m));

export const MEZO_NEVEK = {
  nev: 'Név', fajta: 'Fajta', fenyegetes: 'Fenyegetés', alap_szorny: 'Alap lény', 'adat.statblokk': 'Statblokk', 'adat.erosites': 'Erősítés',
  'adat.kezi': 'Kézi módosítók'
};

export function njkSzint(n) {
  if (!n) return 'szabad';
  if (obj(n.adat).sablon || n.sablon === true) return 'sablon';
  return n.vilag_id ? 'vilag' : 'szabad';
}

export function ertekUt(n, ut) {
  let x = n;
  for (const r of ut.split('.')) { if (!x || typeof x !== 'object') return undefined; x = x[r]; }
  return x;
}

export function utBeallit(n, ut, ertek) {
  const ki = masol(n || {});
  const r = ut.split('.');
  let x = ki;
  for (let i = 0; i < r.length - 1; i++) { if (!x[r[i]] || typeof x[r[i]] !== 'object') x[r[i]] = {}; x = x[r[i]]; }
  if (ertek === undefined) delete x[r[r.length - 1]]; else x[r[r.length - 1]] = masol(ertek);
  return ki;
}

// Az üres értékek egyformák (undefined, null, '', [], {}), így a hiányzó mező nem számít felülírásnak.
const uresE = (x) => x === undefined || x === null || x === '' || (Array.isArray(x) && !x.length) || (typeof x === 'object' && !Array.isArray(x) && !Object.keys(x).length);
export const azonos = (a, b) => (uresE(a) && uresE(b)) || JSON.stringify(a) === JSON.stringify(b);

// A felülírt mezők: amelyek eltérnek az alap (már feloldott) értékétől.
export function felulirasok(n, alap) {
  if (!alap) return [];
  return OROKOLHETO.filter((ut) => !azonos(ertekUt(n, ut), ertekUt(alap, ut)));
}

// Az NJK feloldva az alapjáról: a nem felülírt mezők az alap értékét kapják. felulirt: ha nincs megadva, az NJK sajátja.
export function feloldas(n, alap, felulirt) {
  if (!alap) return masol(n);
  const f = new Set(felulirt || lista(obj(n.adat).felulirt));
  let ki = masol(n);
  OROKOLHETO.forEach((ut) => { if (!f.has(ut)) ki = utBeallit(ki, ut, ertekUt(alap, ut)); });
  ki.adat = ki.adat || {};
  ki.adat.felulirt = OROKOLHETO.filter((ut) => f.has(ut));
  return ki;
}

// Egy mező az örökléssel: { ertek, sajat (felülírt), orokolt (az alap értéke), honnan (az alap szintje) }.
export function mezoInfo(n, ut, alap) {
  const ertek = ertekUt(n, ut);
  if (!alap || !n.alap_id) return { ertek, sajat: false, orokolt: undefined, honnan: null };
  const orokolt = ertekUt(alap, ut);
  return { ertek, sajat: !azonos(ertek, orokolt), orokolt, honnan: njkSzint(alap) };
}

export function visszaallit(n, ut, alap) {
  if (!alap) return n;
  const ki = utBeallit(n, ut, ertekUt(alap, ut));
  ki.adat = ki.adat || {};
  ki.adat.felulirt = lista(ki.adat.felulirt).filter((x) => x !== ut);
  return ki;
}

// Az alapok lánca (az NJK-val kezdve). byId: Map vagy függvény. Körre és hosszra védett.
export function lanc(n, byId) {
  const get = typeof byId === 'function' ? byId : (id) => byId.get(id);
  const ki = [n];
  const volt = new Set([n.id]);
  let x = n;
  while (x && x.alap_id && ki.length <= MAX_LANC + 1) {
    const a = get(x.alap_id);
    if (!a || volt.has(a.id)) break;
    ki.push(a); volt.add(a.id); x = a;
  }
  return ki;
}

// Lehet-e az alapja: { hiba } vagy null.
export function alapHiba(n, alap, byId) {
  if (!alap) return null;
  if (alap.id === n.id) return 'Egy NJK nem épülhet önmagára.';
  const nsz = njkSzint(n);
  const asz = njkSzint(alap);
  if (nsz === 'sablon' && asz !== 'sablon') return 'Sablon csak sablonra épülhet.';
  if (nsz === 'vilag' && !(asz === 'sablon' || (asz === 'vilag' && alap.vilag_id === n.vilag_id))) return 'Világ-NJK csak sablonra vagy ugyanannak a világnak az NJK-jára épülhet.';
  const l = lanc(alap, byId);
  if (l.some((x) => x.id === n.id)) return 'Körbe érne az öröklés.';
  if (l.length >= MAX_LANC) return 'Legfeljebb ' + MAX_LANC + ' szint örökölhető egymásra.';
  return null;
}

// Akikre épülhet (a listából): aktív, nem önmaga, és az alapHiba szerint megengedett.
export function alapJeloltek(n, osszes, byId) {
  return lista(osszes).filter((a) => a.aktiv !== false && a.id !== n.id && !alapHiba(n, a, byId))
    .sort((a, b) => ['sablon', 'vilag', 'szabad'].indexOf(njkSzint(a)) - ['sablon', 'vilag', 'szabad'].indexOf(njkSzint(b)) || szoveg(a.nev).localeCompare(szoveg(b.nev), 'hu'));
}

// Új NJK, amely az alapra épül (még azonosító nélkül, az npc.save adja). cel: { vilag_id?, sablon?, kampanyok?, nev? }
export function peldany(alap, cel = {}) {
  const ki = masol({ nev: alap.nev, fajta: alap.fajta, fenyegetes: alap.fenyegetes || '', alap_szorny: alap.alap_szorny || '', adat: alap.adat || {} });
  ki.adat.szerep = { ...(ki.adat.szerep || {}), kep: null };
  ki.adat.allapot = {};
  ki.adat.szereplesek = [];
  ki.adat.felulirt = [];
  delete ki.adat.sablon;
  ki.alap_id = alap.id;
  ki.vilag_id = cel.sablon ? '' : szoveg(cel.vilag_id);
  ki.sablon = !!cel.sablon;
  ki.kampanyok = cel.sablon ? [] : lista(cel.kampanyok);
  ki.kotodes = '';
  ki.iranyito = '';
  if (cel.nev && cel.nev.trim() && cel.nev.trim() !== alap.nev) { ki.nev = cel.nev.trim(); ki.adat.felulirt = ['nev']; }
  return ki;
}

// Sablon bármely NJK-ból: teljes, önálló másolat (alap nélkül), állapot, kép, kampányok nélkül.
export function sablonbol(n, nev) {
  const ki = peldany(n, { sablon: true });
  ki.alap_id = '';
  ki.adat.felulirt = [];
  ki.nev = nev || n.nev;
  return ki;
}

export function levalaszt(n) {
  const ki = masol(n);
  ki.alap_id = '';
  ki.adat = ki.adat || {};
  ki.adat.felulirt = [];
  return ki;
}

// Akik közvetlenül vagy közvetve erre épülnek.
export function peldanyai(id, osszes) {
  const ki = [];
  const sor = [id];
  const volt = new Set([id]);
  while (sor.length) {
    const x = sor.shift();
    lista(osszes).forEach((n) => { if (n.alap_id === x && !volt.has(n.id)) { volt.add(n.id); ki.push(n); sor.push(n.id); } });
  }
  return ki;
}

// ---- Figyelmeztetések és lépések állapota ----

export function figyelmeztetesek(n) {
  const sz = szereploNorm(obj(n && n.adat).szereplo);
  const fig = [];
  const r = new Set(sz.szerepek);
  if (!sz.szerepek.length) fig.push({ lepes: 'szerep', szoveg: 'Még nincs szerepe a történetben (megbízó, barát, alvezér…).' });
  if ((r.has('fogonosz') || r.has('alvezer')) && !sz.indok.trim()) {
    fig.push({ lepes: 'szemelyiseg', szoveg: 'A gonosztevő ritkán tartja magát gonosznak: adj neki indítékot, akár rossz okot is, de neki legyen értelme (59. oldal).' });
  }
  if (sz.cel.trim() && !sz.indok.trim() && !(r.has('fogonosz') || r.has('alvezer'))) {
    fig.push({ lepes: 'szemelyiseg', szoveg: 'Van célja, de nincs indítéka: mi hajtja a cél felé?' });
  }
  if (r.has('ellenpolus') && !sz.ellenpolus_id) fig.push({ lepes: 'szerep', szoveg: 'Az ellenpólus egy hős jellemét emeli ki: válaszd ki, melyikét.' });
  if (r.has('csapattag')) {
    fig.push({ lepes: 'szerep', szoveg: 'Csapattag: ne ő oldja meg a gondokat, és ne ő adja a döntő csapást; a történet a hősöké (61–62. oldal).' });
    if (sz.epitesi_mod && sz.epitesi_mod !== 'konyv') fig.push({ lepes: 'kepessegek', szoveg: 'A csapattagot a könyv a karakterkészítő szabályai szerint javasolja építeni, hogy a hősökkel egy szinten legyen.' });
  }
  if ((r.has('fogonosz') || r.has('alvezer') || r.has('barat')) && !sz.vonas.trim()) {
    fig.push({ lepes: 'szemelyiseg', szoveg: 'Visszatérő szereplő: egy eltúlzott, egyedi vonás teszi emlékezetessé (59. oldal).' });
  }
  return fig;
}

export function lepesAllapot(n) {
  const a = obj(n && n.adat);
  const sz = szereploNorm(a.szereplo);
  const sb = obj(a.statblokk);
  const szerep = obj(a.szerep);
  const darab = (xs) => xs.filter(van).length;
  const allapot = (db, ossz) => (db >= ossz ? 'kesz' : db ? 'resz' : 'ures');
  const tul = Object.values(obj(sb.tulajdonsagok)).some((x) => Number(x));
  return {
    alap: van(n && n.nev) ? 'kesz' : 'ures',
    szerep: allapot(darab([sz.szerepek, sz.szerep_jegyzet]), 1),
    kepessegek: allapot(darab([sz.epitesi_mod, tul ? 'x' : '']), 2),
    szemelyiseg: allapot(darab([sz.cel, sz.indok, sz.vonas || sz.hang || szerep.motivacio]), 3),
    hatter: allapot(darab([sz.elet, sz.gyerekkor, sz.ma]), 1),
    kapcsolatok: van(sz.kapcsolat_jegyzet) || van(szerep.kapcsolatok) ? 'kesz' : 'ures',
    rejtett: allapot(darab([sz.rejtett, szerep.titkok]), 1),
    parbeszed: allapot(darab([sz.kulcspontok, sz.monologus, sz.kerdesek]), 1),
    fejlodes: allapot(darab([sz.fejlodes_terv, sz.valtozasok]), 1),
    allapot: van(lista(a.szereplesek)) || Object.keys(obj(a.allapot)).length ? 'kesz' : 'ures'
  };
}

// ---- Dobótáblák ----

// A rejtett vonás a generátor eredményfájából (dt_rejtett_vonas, vagy közvetlenül egy oszlop táblája).
export function rejtettFabol(fa) {
  const ki = [];
  const bejar = (cs) => {
    if (!cs || cs.hiba) return;
    const e = obj(cs.ertek);
    if (cs.tabla === 'dt_rv_fokusz') ki.push({ oszlop: 'fokusz', nev: cs.eredmeny, leiras: '', jelek: '', fokusz_tul: e.tul || '', fokusz_jeloltek: lista(e.fokuszok) });
    else if (cs.tabla === 'dt_rv_informacio') ki.push({ oszlop: 'informacio', nev: cs.eredmeny.split(':')[0], leiras: cs.eredmeny.split(':').slice(1).join(':').trim(), jelek: szoveg(e.jelek) });
    else if (cs.tabla === 'dt_rv_szerepjatek') ki.push({ oszlop: 'szerepjatek', nev: cs.eredmeny.split(':')[0], leiras: cs.eredmeny.split(':').slice(1).join(':').trim(), jelek: '' });
    lista(cs.hivasok).forEach((h) => lista(h.gyerekek).forEach(bejar));
  };
  bejar(fa);
  return ki;
}

// A kapcsolattípus a kapcsolattábla eredményéből (dt_kapcsolat); null: nincs kapcsolatuk.
export function kapcsolatTipusFabol(fa) {
  return fa && !fa.hiba && fa.tabla === 'dt_kapcsolat' ? (obj(fa.ertek).tipus || null) : null;
}

// Követő NJK egy Companion-mintából (dt_koveto_minta sorának ertek mezője). Az njkKovetoSablon eredményét egészíti ki.
export function kovetoMintabol(n, minta) {
  const m = obj(minta);
  const ki = masol(n);
  ki.adat.statblokk.tulajdonsagok = { ...ki.adat.statblokk.tulajdonsagok, ...obj(m.tulajdonsagok) };
  ki.adat.statblokk.fokuszok = lista(m.fokuszok).slice();
  ki.adat.szerep = { ...(ki.adat.szerep || {}), feladatok: lista(m.feladatok).slice(),
    koncepcio: szoveg(m.nev) + (m.megjegyzes ? '. ' + m.megjegyzes : '') };
  return ki;
}

// ---- Hol szerepel: a Kampányépítő hivatkozásai egy NJK-ra ----
// elemek: a megjelenített (feloldott) adatukkal: [{ elem, adat }]; keret: a kampánykeret normalizálva (vagy null);
// kapcsolatok: a Kapcsolatok sorai. Visszaad: [{ elem_id, tipus, hol, szoveg }].
export function hivatkozasok(njkId, elemek, keret, kapcsolatok) {
  const ki = [];
  if (!njkId) return ki;
  lista(elemek).forEach(({ elem, adat }) => {
    const a = obj(adat);
    const nev = szoveg(a.nev) || 'névtelen';
    if (elem.tipus === 'helyszin') lista(a.szereplok).forEach((s) => { if (obj(s).njk_id === njkId) ki.push({ elem_id: elem.id, tipus: elem.tipus, hol: nev, szoveg: 'fontos szereplő' + (s.szerep ? ': ' + s.szerep : '') }); });
    if (elem.tipus === 'kaland') {
      if (obj(a.ellenfel).njk_id === njkId) ki.push({ elem_id: elem.id, tipus: elem.tipus, hol: nev, szoveg: 'proaktív ellenfél' });
      lista(a.njkk).forEach((s) => { if (obj(s).njk_id === njkId) ki.push({ elem_id: elem.id, tipus: elem.tipus, hol: nev, szoveg: 'fontos NJK' }); });
    }
    if (elem.tipus === 'jelenet') lista(a.lenyek).forEach((l) => { if (obj(l).forras === 'njk' && obj(l).ref_id === njkId) ki.push({ elem_id: elem.id, tipus: elem.tipus, hol: nev, szoveg: 'a jelenet szereplője' }); });
  });
  if (keret) {
    if (obj(obj(keret.veg).ellenfel).njk_id === njkId) ki.push({ elem_id: '', tipus: 'keret', hol: 'Kampánykeret', szoveg: 'a végső ellenfél' });
    lista(keret.keptar).forEach((x) => { if (obj(x).njk_id === njkId) ki.push({ elem_id: '', tipus: 'keret', hol: 'Kampánykeret', szoveg: 'a gonosztevők képtárában' }); });
  }
  lista(kapcsolatok).forEach((k) => {
    if (k.aktiv === false || k.tipus !== 'tulajdonosa' || k.honnan !== njkId) return;
    const e = lista(elemek).find((x) => x.elem.id === k.hova);
    if (e) ki.push({ elem_id: e.elem.id, tipus: e.elem.tipus, hol: szoveg(obj(e.adat).nev), szoveg: 'tulajdonosa' });
  });
  return ki;
}

// A Szereplők nézet csoportjai: szerep szerint (egy NJK több csoportban is lehet), a szerep nélküliek külön.
export function szerepSzerint(njkk) {
  const cs = Object.fromEntries(Object.keys(SZEREPEK).map((k) => [k, []]));
  cs._nincs = [];
  lista(njkk).forEach((n) => {
    const r = lista(n.szerepek).filter((s) => SZEREPEK[s]);
    if (!r.length) cs._nincs.push(n); else r.forEach((s) => cs[s].push(n));
  });
  return cs;
}
