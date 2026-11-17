// Kampányépítő, 4. fejezet: helyszínek (Building Locations) és a világ földrajza. Tiszta függvények és a könyv szerinti
// állandók (rövid saját magyar összefoglalók, a könyv szövege nélkül). A helyszín saját mezői az elem adatában vannak,
// mezőnként öröklődnek (elem.js), a listák egészben. A helyszín a helyszín alá kerülhet (régió, ország, település, hely,
// üzlet): ez a fa adja a világ földrajzát. Az üzlet mezői: bolt.js. Terv: claude/kampanyepito-terv.md, „4. fejezet”.

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const van = (x) => !!szoveg(x).trim();

// A helyszín fajtája (saját kiegészítés a fához: a könyv szerint egy hely egy másikban van, például labor a városban,
// a város a báróságban). rang: a földrajzi szint, a fában felülről lefelé.
export const FAJTAK = {
  regio: { nev: 'Régió', leiras: 'Táj, tartomány, félsziget, vadon: több ország vagy település tájegysége.', rang: 0 },
  orszag: { nev: 'Ország', leiras: 'Királyság, báróság, városállam: saját kormányzattal (Alapkönyv, 11. fejezet).', rang: 1 },
  telepules: { nev: 'Település', leiras: 'Város, falu, tábor, kikötő.', rang: 2 },
  hely: { nev: 'Hely', leiras: 'Épület, rom, barlang, erdő, piac, szentély: bármi, ami bejárható.', rang: 3 },
  uzlet: { nev: 'Üzlet', leiras: 'Bolt, fogadó, kocsma vagy úton járó kereskedő (a könyv üzletgenerátora szerint).', rang: 4 }
};
export const fajtaOf = (a) => (FAJTAK[obj(a).fajta] ? obj(a).fajta : 'hely');

// A helyszín szerepe a játékban (44–45. oldal). Több is lehet.
export const SZEREPEK = {
  ismeros: { nev: 'Ismerős', en: 'Familiar Locations', oldal: '44', leiras: 'Biztonságos, otthonos hely (kedvenc kocsma, védett tábor), ahová a hősök visszatérnek, és ami emlékezteti őket, miért harcolnak.' },
  hangulati: { nev: 'Hangulati', en: 'Mood Pieces', oldal: '44', leiras: 'A hely maga adja meg a kaland vagy a kampány hangulatát és témáját (magányos, omladozó torony; nyüzsgő város).' },
  visszatero: { nev: 'Visszatérő', en: 'Recurring Locations', oldal: '44', leiras: 'Állandó „díszlet”: a hősök megszokják, így a legkisebb változás (új szag, új bolt) is jelez valamit.' },
  titokzatos: { nev: 'Titokzatos', en: 'Mysterious Places', oldal: '45', leiras: 'Minden helyszínhez tartozzon titok: így mindig marad mit kideríteni.' }
};

// A helyszínhez tervezett kihívások fő iránya (Concept, 45. oldal).
export const FOKUSZOK = { harc: 'Harc', felfedezes: 'Felfedezés', szerepjatek: 'Szerepjáték' };

// A könyv lépései (Creating Locations, 45–47. oldal) és a kiegészítő részek.
export const HELYSZIN_LEPESEK = {
  fajta: { nev: 'Fajta, szerep és elhelyezés', en: 'Location Types, Placement', oldal: '44–45, 47',
    utmutato: 'Hová kerül a helyszín a világban (régió, ország, település, hely, üzlet), és mire használod a játékban? Egy hely gyakran egy másikban van: a labor a városban, a város a báróságban. Tartsd szem előtt, hogy a hely és a környéke együtt is hihető legyen.' },
  koncepcio: { nev: '1. Koncepció', en: 'Concept', oldal: '45',
    utmutato: 'Egy mondat arról, mi ez a hely. Gondold végig a célját: a hősök bázisa lesz, intrikák színtere, vagy felfedezésre váró ismeretlen? Milyen kihívások jellemzőek rá (harc, felfedezés, szerepjáték)? A szokatlan ötleteket is érdemes kidolgozni.' },
  tortenet: { nev: '2. Történet', en: 'History', oldal: '45',
    utmutato: 'Építették vagy természetes? Mire használták az eredeti lakói, és ők vannak-e még ott? Mikor és miért cserélt gazdát? Hogyan jutott a mai állapotába? A múlt adja a stílust, és nyomokat (titkos járat, jelszó, rejtvény) a hősöknek.' },
  lakok: { nev: '3. Lakók', en: 'Inhabitants', oldal: '46',
    utmutato: 'Kik élnek vagy dolgoznak itt, és ki irányít? A csoportokból jönnek a fontos szereplők (egy-két mondat: szerepük és tekintélyük forrása), a céljaikból a konfliktusok. Végül apró részletek: szokások, furcsaságok, hogyan fogadják az idegeneket.' },
  helyzet: { nev: '4. Jelenlegi helyzet', en: 'Current Situation', oldal: '46–47',
    utmutato: 'Mi történt mostanában, és milyen külső konfliktusok érik? Ebből lesznek a horgok. Végül a szolgáltatások: szállás, piac, mesteremberek, varázslás, információ; ez a visszatérő helyeknél fontos.' },
  fizikai: { nev: '5. Fizikai leírás', en: 'Physical Description', oldal: '47–48',
    utmutato: 'Nem kell szobáról szobára. A múlt, a lakók és a mai használat mind hat a leírásra. Gondolj a méretre és a léptékre, a veszélyekre (omlás, tűz, csapda, riasztó), a fedezékre és a bejárhatóságra, különösen ha harc várható. Kell-e térkép?' },
  mutatvanyok: { nev: 'Helyszín-mutatványok', en: 'Location Stunts & Mechanics', oldal: '48–49',
    utmutato: 'A hely sajátos mutatványai: egy meglévő mutatvány módosítva (jeges barlangban olcsóbb a Leterítés) vagy új hatás („rád omlik a ház”), a meglévőkhöz hasonló áron. Körülményi módosító: általában +1 vagy +2 (vagy −1, −2) a próbára.' },
  orszag: { nev: 'Ország', en: 'Building a Setting (Alapkönyv, 11. fejezet)', oldal: 'Alapkönyv',
    utmutato: 'Kormányzat, kultúra, nyelvek, hit, gazdaság. A viszony más országokhoz kapcsolatként rögzíthető (szövetségese, ellensége, része) az Alapadatok lépés Kapcsolatok panelén.' },
  bolt: { nev: 'Az üzlet', en: 'Businesses', oldal: '52–55',
    utmutato: 'Üzlettípus (3d6 vagy választás), utána annyi üzletrészlet, amennyi a sárkánykocka; fizikai árunál kidolgozottság és árszint. Ami nem illik a helyzethez, azt dobd újra. A kereskedők a listaár negyedét adják a hősök holmijáért; bizományos eladás is lehet.' },
  kinalat: { nev: 'Kínálat és árak', en: 'Businesses', oldal: '52',
    utmutato: 'A kínálat a felszerelés típusai szerint jön; a bőség dönti el, mennyi kapható belőle (saját kiegészítés). A tételek kézzel bővíthetők, törölhetők, az ár tételenként átírható. Ár: listaár × a település vagy a világ szorzója × a bolt árszintje.' }
};

export const SZOLGALTATASOK = {
  szallas: 'Szállás', piac: 'Piac, adás-vétel', mesteremberek: 'Mesteremberek, különleges áru', varazslas: 'Varázslás', informacio: 'Információ', egyeb: 'Egyéb'
};

// Az ország kiegészítő mezői (Alapkönyv, 11. fejezet).
export const ORSZAG_MEZOK = {
  kormanyzat: 'Kormányzat és uralkodó', kultura: 'Kultúra és szokások', nyelvek: 'Nyelvek', hit: 'Hit és vallás', gazdasag: 'Gazdaság és kereskedelem', hadero: 'Haderő és veszélyek'
};

// ---------- Normalizálók ----------

const nId = (x, i, p) => szoveg(x.id) || p + i;
export const gazdavaltasokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'gv'), mikor: szoveg(obj(g).mikor), mi: szoveg(obj(g).mi) }));
export const csoportokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'lc'), nev: szoveg(obj(g).nev), szervezet: szoveg(obj(g).szervezet), csoport_id: szoveg(obj(g).csoport_id) }));
export const szereplokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'sz'), nev: szoveg(obj(g).nev), njk_id: szoveg(obj(g).njk_id), szerep: szoveg(obj(g).szerep), tekintely: szoveg(obj(g).tekintely), titok: szoveg(obj(g).titok) }));
export const konfliktusokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'kf'), kik: szoveg(obj(g).kik), miert: szoveg(obj(g).miert), hogyan: szoveg(obj(g).hogyan) }));
export const horgokNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'hg'), szoveg: szoveg(obj(g).szoveg) }));
export const veszelyekNorm = (x) => lista(x).map((g, i) => ({ id: nId(obj(g), i, 'vs'), nev: szoveg(obj(g).nev), hatas: szoveg(obj(g).hatas) }));
export const mutatvanyokNorm = (x) => lista(x).map((g, i) => {
  const o = obj(g);
  const ar = Number(o.ar);
  return { id: nId(o, i, 'hm'), nev: szoveg(o.nev), fajta: o.fajta === 'uj' ? 'uj' : 'modositott', ar: Number.isFinite(ar) && o.ar !== '' && o.ar !== null ? Math.max(0, Math.min(6, Math.round(ar))) : '', hatas: szoveg(o.hatas) };
});
export const korulmenyekNorm = (x) => lista(x).map((g, i) => {
  const o = obj(g);
  const m = Number(o.modosito);
  return { id: nId(o, i, 'km'), mire: szoveg(o.mire), modosito: Number.isFinite(m) ? Math.max(-5, Math.min(5, Math.round(m))) : 0 };
});
export const szolgaltatasNorm = (x) => {
  const o = obj(x);
  const ki = {};
  Object.keys(SZOLGALTATASOK).forEach((k) => { if (van(o[k])) ki[k] = szoveg(o[k]); });
  return ki;
};

// ---------- Kitöltöttség és figyelmeztetések ----------

const allapot = (kesz, resz) => (kesz ? 'kesz' : resz ? 'resz' : 'ures');

export function lepesAllapot(a) {
  a = obj(a);
  const szolg = szolgaltatasNorm(a.szolgaltatasok);
  return {
    fajta: allapot(lista(a.szerepek).length > 0, !!a.fajta),
    koncepcio: allapot(van(a.koncepcio) && van(a.titkok), van(a.koncepcio) || van(a.cel) || lista(a.fokusz).length > 0),
    tortenet: allapot(van(a.eredeti_cel) && van(a.mai_allapot), van(a.eredeti_cel) || van(a.epitok) || gazdavaltasokNorm(a.gazdavaltasok).length > 0 || van(a.mai_allapot)),
    lakok: allapot(csoportokNorm(a.lakok).length > 0 && szereplokNorm(a.szereplok).length > 0,
      van(a.vezetes) || csoportokNorm(a.lakok).length > 0 || szereplokNorm(a.szereplok).length > 0 || konfliktusokNorm(a.konfliktusok).length > 0 || van(a.szokasok)),
    helyzet: allapot(van(a.friss_esemenyek) && horgokNorm(a.horgok).length > 0, van(a.friss_esemenyek) || horgokNorm(a.horgok).length > 0 || Object.keys(szolg).length > 0),
    fizikai: allapot(van(a.fizikai) && van(a.elhelyezes), van(a.fizikai) || van(a.elhelyezes) || van(a.meret) || veszelyekNorm(a.veszelyek).length > 0 || van(a.terep)),
    mutatvanyok: allapot(mutatvanyokNorm(a.mutatvanyok).length > 0 || korulmenyekNorm(a.korulmenyek).length > 0, false),
    orszag: allapot(van(a.kormanyzat) && van(a.kultura), Object.keys(ORSZAG_MEZOK).some((k) => van(a[k]))),
    bolt: allapot(lista(a.uzlet_tipusok).length > 0 || lista(a.sajat_kategoriak).length > 0, lista(a.uzlet_reszletek).length > 0),
    kinalat: allapot(lista(a.kinalat).length > 0, false)
  };
}

// A helyszín lépései a fajta szerint (a szerkesztő lépéslistájához).
export function lepesKulcsok(a) {
  const f = fajtaOf(a);
  const ki = ['fajta'];
  if (f === 'uzlet') ki.push('bolt', 'kinalat');
  if (f === 'orszag') ki.push('orszag');
  return ki.concat(['koncepcio', 'tortenet', 'lakok', 'helyzet', 'fizikai', 'mutatvanyok']);
}

// Figyelmeztetések: { lepes, szoveg }. A titok hiányát az általános szerkesztő is jelzi.
// szulo: a szülő elem megjelenített adata (ha van), a földrajzi szint ellenőrzéséhez.
export function figyelmeztetesek(a, szulo) {
  a = obj(a);
  const f = [];
  if (!van(a.titkok)) f.push({ lepes: 'koncepcio', szoveg: 'A könyv tanácsa: minden helyszínnek legyen titka (a DM titkai mezőben).' });
  if (szulo && FAJTAK[fajtaOf(szulo)].rang > FAJTAK[fajtaOf(a)].rang) {
    f.push({ lepes: 'fajta', szoveg: FAJTAK[fajtaOf(a)].nev + ' egy ' + FAJTAK[fajtaOf(szulo)].nev.toLowerCase() + ' alatt: biztosan jó helyen van a fában?' });
  }
  if (fajtaOf(szulo || {}) === 'uzlet') f.push({ lepes: 'fajta', szoveg: 'Egy üzlet alatt áll: az üzlet szobái lehetnek ilyenek, de egy újabb helynek általában a település a helye.' });
  const kf = konfliktusokNorm(a.konfliktusok);
  if (szereplokNorm(a.szereplok).length >= 2 && !kf.length) f.push({ lepes: 'lakok', szoveg: 'Több fontos szereplő, de nincs köztük konfliktus: a könyv szerint a céljaikból születik az a helyzet, amibe a hősök belépnek.' });
  if (kf.some((k) => van(k.kik) && !van(k.miert))) f.push({ lepes: 'lakok', szoveg: 'Egy konfliktusnál hiányzik, mit akarnak és miért.' });
  if (lista(a.fokusz).includes('harc') && !van(a.terep) && !veszelyekNorm(a.veszelyek).length) {
    f.push({ lepes: 'fizikai', szoveg: 'Harcra szánt hely: érdemes megadni a terepet és a veszélyeket (fedezék, külön részek, mozgás), hogy a harc ne álljon egy helyben.' });
  }
  return f;
}

// ---------- Földrajz ----------

// Az elem fölötti helyszínek (a gyökértől lefelé), az elem nélkül.
export function osok(elem, ix) {
  const ki = [];
  let x = elem && elem.szulo_id ? ix.get(elem.szulo_id) : null;
  let n = 0;
  while (x && n++ < 30) { if (x.tipus === 'helyszin') ki.unshift(x); x = x.szulo_id ? ix.get(x.szulo_id) : null; }
  return ki;
}

// A legközelebbi adott fajtájú ős (például a bolt települése).
export function legkozelebbi(elem, ix, megj, fajtak) {
  const o = osok(elem, ix);
  for (let i = o.length - 1; i >= 0; i--) if (fajtak.includes(fajtaOf(megj(o[i])))) return o[i];
  return null;
}

// Földrajzi fa: a helyszín elemek fája (gyökerek a nem helyszín alatt állók), fajta szerint csoportosítható a felületen.
// Visszaad: [{ elem, gyerekek: [...] }], a sorrend szerint, a fa.js-től függetlenül (itt csak helyszínek).
export function foldrajziFa(elemek, ix) {
  const helyek = lista(elemek).filter((e) => e.tipus === 'helyszin');
  const azonok = new Set(helyek.map((e) => e.id));
  const gyerek = new Map();
  helyek.forEach((e) => {
    const sz = e.szulo_id && azonok.has(e.szulo_id) ? e.szulo_id : '';
    if (!gyerek.has(sz)) gyerek.set(sz, []);
    gyerek.get(sz).push(e);
  });
  const rendez = (l) => l.slice().sort((a, b) => (Number(a.sorrend) || 0) - (Number(b.sorrend) || 0));
  const epit = (id, m) => (m > 30 ? [] : rendez(gyerek.get(id) || []).map((e) => ({ elem: e, gyerekek: epit(e.id, m + 1) })));
  return epit('', 0);
}

// Egy helyszín leszármazottai közül az üzletek (a jelenlegi helyzet szolgáltatásaihoz).
export function uzletei(elem, elemek, megj) {
  const ki = [];
  const bejar = (id, m) => {
    if (m > 30) return;
    lista(elemek).filter((e) => e.szulo_id === id && e.tipus === 'helyszin' && e.aktiv !== false).forEach((e) => {
      if (fajtaOf(megj(e)) === 'uzlet') ki.push(e);
      bejar(e.id, m + 1);
    });
  };
  bejar(elem.id, 0);
  return ki;
}

// A fajták száma egy elemlistában (a Helyszínek nézet fejlécéhez).
export function fajtaSzamok(elemek, megj) {
  const ki = {};
  lista(elemek).filter((e) => e.tipus === 'helyszin' && e.aktiv !== false).forEach((e) => { const f = fajtaOf(megj(e)); ki[f] = (ki[f] || 0) + 1; });
  return ki;
}

// A helyszínhez kötött jelenetek és részek (kapcsolat: itt történik; honnan a jelenet, hova a helyszín).
export function ittTortenik(helyszinId, kapcsolatok) {
  return lista(kapcsolatok).filter((k) => k.aktiv !== false && k.tipus === 'itt_tortenik' && k.hova === helyszinId).map((k) => k.honnan);
}
export function helyszineiOf(elemId, kapcsolatok) {
  return lista(kapcsolatok).filter((k) => k.aktiv !== false && k.tipus === 'itt_tortenik' && k.honnan === elemId);
}
