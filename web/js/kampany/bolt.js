// Kampányépítő, 4. fejezet: boltgenerátor (Businesses). Tiszta függvények. Az üzlet a helyszín altípusa (fajta: 'uzlet');
// a mezői a helyszín elem adatában vannak, mezőnként öröklődnek (elem.js). A könyv eljárása: üzlettípus (3d6 vagy
// választás), üzletrészletek a sárkánykocka szerint, fizikai árunál kidolgozottság és árszint; a táblák a Szabályadatbázis
// Dobótáblák lapján (dt_uzlet és társai, Import 12). A kínálat a felszerelés típusai szerint a Felszerelés, Fegyverek és
// Páncélok lapról jön. Saját kiegészítés (Arnold kérésére): saját bolttípus kategóriákból, véletlen kínálat bőség szerint,
// árszorzó a településen vagy a világon. Terv: claude/kampanyepito-terv.md, „Boltgenerátor”.
//
// A bolt mezői (adat): uzlet_tipusok [kulcs], sajat_kategoriak [forráskulcs], pancel_max, pajzs_max (Páncélok id vagy ''),
// fegyvercsoportok [fcs_ id], fegyverek_konkret (bool), granat ('' | 'granat' | 'granat_alapanyag'), boseg, kidolgozottsag,
// arszint (százalék), uzlet_reszletek [{ id, e, en, hatas, modosito, szazalek }], magikus_db, felvasarlas (százalék),
// bizomany (bool), vandor (bool), kinalat [{ id, forras, tetel, nev, lista_rez, darab, ar_rez, megj }].
import { kockaDobas, eredmenyek } from './generator.js';

const lista = (x) => (Array.isArray(x) ? x : []);
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const szam = (x, alap) => { const n = Number(x); return x === '' || x === null || x === undefined || !Number.isFinite(n) ? alap : n; };
const reszl = (sor) => obj(sor && sor.reszletek);

export const UZLET_TABLA = 'dt_uzlet';

// A felszerelés kategóriái (a Felszerelés lap kategoria oszlopa) és a többi forrás. A forráskulcs: 'Felszerelés:<kategória>',
// 'Fegyverek:<csoport id>', 'Páncélok:pancel', 'Páncélok:pajzs', 'Fegyverek:granat'.
export const FELSZERELES_KATEGORIAK = ['Kereskedelmi áruk és nyersanyagok', 'Ruházat', 'Étel és szállás', 'Utazás és kaland', 'Otthon',
  'Szállítás és tárolás', 'Szerszámok', 'Szakmai felszerelés'];

const enIlleszt = (re) => (s) => re.test(String(s.nev_en || ''));
const nemIlleszt = (re) => (s) => !re.test(String(s.nev_en || ''));

// Az üzlettípusok a könyv sorrendjében (Businesses, 52. oldal), a kínálat forrásaival. fizikai: kidolgozottság és árszint jár.
// szabad: a felszerelésben nincs megfelelő kategória, a kínálat egyedi tételekből áll.
export const UZLET_TIPUSOK = {
  emlektargy: { nev: 'Emléktárgybolt', en: 'Souvenir Shop', fizikai: true, szabad: true, kinalat: [] },
  kereskedo: { nev: 'Kereskedő', en: 'Trader', fizikai: true, kinalat: [{ kulcs: 'Felszerelés:Kereskedelmi áruk és nyersanyagok' }] },
  ekszeresz: { nev: 'Ékszerész', en: 'Jeweler', fizikai: true, szabad: true, kinalat: [] },
  szabo: { nev: 'Szabó', en: 'Tailor', fizikai: true, kinalat: [{ kulcs: 'Felszerelés:Ruházat' }] },
  fogado: { nev: 'Fogadó', en: 'Inn', fizikai: false, kinalat: [{ kulcs: 'Felszerelés:Étel és szállás' }] },
  pancelkovacs: { nev: 'Páncélkovács', en: 'Armorsmith', fizikai: true, kinalat: [{ kulcs: 'Páncélok:pancel' }, { kulcs: 'Páncélok:pajzs' }] },
  kocsma: { nev: 'Kocsma', en: 'Tavern', fizikai: false, kinalat: [{ kulcs: 'Felszerelés:Étel és szállás', szuro: nemIlleszt(/lodging|bath|wash/i) }] },
  szatocs: { nev: 'Szatócs', en: 'General Store', fizikai: true,
    kinalat: [{ kulcs: 'Felszerelés:Utazás és kaland' }, { kulcs: 'Felszerelés:Otthon' }, { kulcs: 'Felszerelés:Szállítás és tárolás' }, { kulcs: 'Felszerelés:Szerszámok' }] },
  fegyverkovacs: { nev: 'Fegyverkovács', en: 'Weaponsmith', fizikai: true, kinalat: [{ kulcs: 'fegyvercsoportok' }] },
  elelmiszer: { nev: 'Élelmiszerbolt', en: 'Grocer', fizikai: true, kinalat: [{ kulcs: 'Felszerelés:Étel és szállás', szuro: nemIlleszt(/meal|lodging|bath|wash/i) }] },
  patikus: { nev: 'Patikus', en: 'Apothecary', fizikai: true, szabad: true, kinalat: [{ kulcs: 'Felszerelés:Szakmai felszerelés', szuro: enIlleszt(/healer/i) }] },
  konyvesbolt: { nev: 'Könyvesbolt', en: 'Bookstore', fizikai: true, kinalat: [{ kulcs: 'Felszerelés:Szakmai felszerelés', szuro: enIlleszt(/book|ink|paper|quill|scroll|seal/i) }] },
  hangszerbolt: { nev: 'Hangszerbolt', en: 'Music Store', fizikai: true, kinalat: [{ kulcs: 'Felszerelés:Szakmai felszerelés', szuro: enIlleszt(/instrument/i) }] }
};
export const UZLET_KULCSOK = Object.keys(UZLET_TIPUSOK);

// A páncélok és pajzsok sorrendje a könyv táblája szerint (a páncélkovács a kidobottat és minden alatta lévőt tart).
export const PANCEL_SOR = ['pan_light_leather', 'pan_heavy_leather', 'pan_light_mail', 'pan_heavy_mail', 'pan_light_plate', 'pan_heavy_plate'];
export const PAJZS_SOR = ['pan_light_shield', 'pan_medium_shield', 'pan_heavy_shield'];

export const GRANAT = { '': 'nincs', granat_alapanyag: 'gránát-alapanyagok', granat: 'kész gránátok' };

// A kínálat bősége (saját kiegészítés): esély tételenként és a darabszám a fegyvereknél és páncéloknál.
export const BOSEGEK = {
  teljes: { nev: 'Teljes', esely: 1, darab: '1d6', leiras: 'Minden tétel kapható, ami a típusához tartozik.' },
  bo: { nev: 'Bő', esely: 0.75, darab: '1d6', leiras: 'A tételek nagyjából háromnegyede.' },
  atlagos: { nev: 'Átlagos', esely: 0.5, darab: 'd3', leiras: 'A tételek nagyjából fele.' },
  szukos: { nev: 'Szűkös', esely: 0.25, darab: 1, leiras: 'A tételek nagyjából negyede, darabonként egy.' }
};

// A kidolgozottság fokozatai (Craftsmanship, 79. oldal), a dt_kidolgozottsag ertek.minoseg kulcsai.
export const KIDOLGOZOTTSAGOK = {
  silany: { nev: 'Silány', en: 'Shoddy', hatas: 'szinte használhatatlan' },
  atlag_alatti: { nev: 'Átlag alatti', en: 'Below Average', hatas: '−1 sebzés, Páncélérték, támadás vagy Védekezés' },
  atlagos: { nev: 'Átlagos', en: 'Average', hatas: 'a szokásos' },
  atlag_feletti: { nev: 'Átlag feletti', en: 'Above Average', hatas: '+1 sebzés vagy Páncélérték' },
  finom: { nev: 'Finom', en: 'Fine', hatas: '+1 támadás vagy Védekezés' },
  kivalo: { nev: 'Kiváló', en: 'Superior', hatas: '+2 sebzés vagy Páncélérték' },
  mesteri: { nev: 'Mesteri', en: 'Expert', hatas: '+2 támadás vagy Védekezés' },
  mestermu: { nev: 'Mesterremek', en: 'Masterwork', hatas: '+3 sebzés vagy Páncélérték' }
};

// Az üzletrészletek gépi hatásai (Business Details, 53–54. oldal).
export const HATASOK = {
  felar: 'mindent féláron ad (az árszint helyett 50%)',
  kiarusitas: 'végkiárusítás: mindent féláron, +2 alku, visszavásárlás nincs',
  csapat_kedvezmeny: 'kedvezmény a csapatnak',
  keves: 'alacsony készlet: tételenként 3d6, dupla nélkül elfogyott, duplánál a sárkánykocka a darabszám',
  csere: 'csak cserekereskedelem',
  bogo: 'két tételből az olcsóbb féláron',
  magikus: 'mágikus kínálat',
  alku: 'alkumódosító',
  bunfedezet: 'bűnszervezet fedőcége'
};

export const ALAP_FELVASARLAS = 25;

// ---------- Típusok és kínálati források ----------

export const tipusokOf = (a) => Array.from(new Set(lista(obj(a).uzlet_tipusok).filter((t) => UZLET_TIPUSOK[t])));
export const fizikai = (a) => tipusokOf(a).some((t) => UZLET_TIPUSOK[t].fizikai) || lista(obj(a).sajat_kategoriak).length > 0;
export const reszletekOf = (a) => lista(obj(a).uzlet_reszletek).filter((r) => r && (r.e || r.hatas));
export const hatasokOf = (a) => reszletekOf(a).map((r) => r.hatas).filter(Boolean);

export function tipusFelirat(a) {
  const t = tipusokOf(a).map((k) => UZLET_TIPUSOK[k].nev);
  if (lista(obj(a).sajat_kategoriak).length) t.push('saját típus');
  return t.join(' és ') || 'típus nélkül';
}

// Egy forráskulcs olvasható neve.
export function forrasNev(kulcs, lapok) {
  if (kulcs === 'Páncélok:pancel') return 'Páncélok';
  if (kulcs === 'Páncélok:pajzs') return 'Pajzsok';
  if (kulcs === 'Fegyverek:granat') return 'Gránátok';
  if (kulcs === 'egyedi') return 'Egyedi tételek';
  const [lap, kat] = String(kulcs).split(':');
  if (lap === 'Fegyverek') {
    const cs = lista(lapok && lapok['Fegyvercsoportok']).find((g) => g.id === kat);
    return 'Fegyverek: ' + (cs ? cs.nev_hu : kat);
  }
  return kat || kulcs;
}

// A választható saját kategóriák (saját bolttípushoz): a felszerelés kategóriái, a fegyvercsoportok, páncél, pajzs, gránát.
export function sajatKategoriaJeloltek(lapok) {
  const ki = FELSZERELES_KATEGORIAK.map((k) => ({ kulcs: 'Felszerelés:' + k, nev: k, csoport: 'Felszerelés' }));
  lista(lapok && lapok['Fegyvercsoportok']).forEach((g) => ki.push({ kulcs: 'Fegyverek:' + g.id, nev: g.nev_hu, csoport: 'Fegyverek' }));
  ki.push({ kulcs: 'Fegyverek:granat', nev: 'Gránátok', csoport: 'Fegyverek' });
  ki.push({ kulcs: 'Páncélok:pancel', nev: 'Páncélok', csoport: 'Páncélok' }, { kulcs: 'Páncélok:pajzs', nev: 'Pajzsok', csoport: 'Páncélok' });
  return ki;
}

const aktivSorok = (lapok, lap) => lista(lapok && lapok[lap]).filter((s) => s && s.aktiv !== false && s.id && !/_altalanos$/.test(s.id));
const granatE = (s) => reszl(s).tipus === 'granat';
const vanAra = (s) => listaAr(s) !== null;

// A rendelkezésre álló kínálati források: [{ kulcs, nev, sorok }], a típusok és a saját kategóriák szerint, ismétlés nélkül.
// A páncélkovács a kidobott páncélig és pajzsig, a fegyverkovács a kidobott csoportokból (konkrét fegyvereknél ezt a
// generálás szűkíti d3-mal), gránát a külön szabály szerint.
export function forrasok(a, lapok) {
  a = obj(a);
  const ki = new Map();
  const add = (kulcs, sorok, szuro) => {
    const regi = ki.get(kulcs);
    const uj = (szuro ? sorok.filter(szuro) : sorok);
    if (regi) uj.forEach((s) => { if (!regi.sorok.includes(s)) regi.sorok.push(s); });
    else ki.set(kulcs, { kulcs, nev: forrasNev(kulcs, lapok), sorok: uj.slice() });
  };
  const forrasSorok = (kulcs) => {
    const [lap, kat] = kulcs.split(':');
    if (lap === 'Felszerelés') return aktivSorok(lapok, 'Felszerelés').filter((s) => s.kategoria === kat && vanAra(s));
    if (kulcs === 'Páncélok:pancel') return aktivSorok(lapok, 'Páncélok').filter((s) => reszl(s).tipus === 'pancel');
    if (kulcs === 'Páncélok:pajzs') return aktivSorok(lapok, 'Páncélok').filter((s) => reszl(s).tipus === 'pajzs');
    if (kulcs === 'Fegyverek:granat') return aktivSorok(lapok, 'Fegyverek').filter(granatE);
    if (lap === 'Fegyverek') return aktivSorok(lapok, 'Fegyverek').filter((s) => s.csoport === kat && vanAra(s));
    return [];
  };
  const tipusok = tipusokOf(a);
  tipusok.forEach((t) => UZLET_TIPUSOK[t].kinalat.forEach((f) => {
    if (f.kulcs === 'fegyvercsoportok') {
      lista(a.fegyvercsoportok).forEach((cs) => add('Fegyverek:' + cs, forrasSorok('Fegyverek:' + cs)));
      if (a.granat === 'granat') add('Fegyverek:granat', forrasSorok('Fegyverek:granat'));
      return;
    }
    let sorok = forrasSorok(f.kulcs);
    if (t === 'pancelkovacs' && f.kulcs === 'Páncélok:pancel') sorok = sorok.filter((s) => PANCEL_SOR.indexOf(s.id) >= 0 && PANCEL_SOR.indexOf(s.id) <= PANCEL_SOR.indexOf(a.pancel_max));
    if (t === 'pancelkovacs' && f.kulcs === 'Páncélok:pajzs') sorok = sorok.filter((s) => PAJZS_SOR.indexOf(s.id) >= 0 && PAJZS_SOR.indexOf(s.id) <= PAJZS_SOR.indexOf(a.pajzs_max));
    add(f.kulcs, sorok, f.szuro);
  }));
  lista(a.sajat_kategoriak).forEach((k) => add(k, forrasSorok(k)));
  return Array.from(ki.values()).filter((f) => f.sorok.length);
}

// ---------- Árak ----------

// A tétel listaára rézben (a szabályadat ar_rez mezője vagy az ar szöveg), vagy null.
export function listaAr(sor) {
  if (!sor) return null;
  const r = reszl(sor);
  if (r.ar_rez !== undefined && r.ar_rez !== null && r.ar_rez !== '') return Number(r.ar_rez);
  const m = String(sor.ar || '').replace(',', '.').match(/([\d.]+)\s*(arany|ezüst|réz)/i);
  if (!m) return null;
  return Math.round(parseFloat(m[1]) * { arany: 100, ezüst: 10, réz: 1 }[m[2].toLowerCase()]);
}

// Az érvényes árszint százalékban: a félárú üzletrészletek felülírják a bolt árszintjét.
export function ervenyesArszint(a) {
  const h = hatasokOf(a);
  if (h.includes('felar') || h.includes('kiarusitas')) return 50;
  return szam(obj(a).arszint, 100);
}

// A csapatnak adott kedvezmény százalékban (a „Köszönet” üzletrészlet szerint), az árszinten felül.
export function csapatKedvezmeny(a) {
  return reszletekOf(a).filter((r) => r.hatas === 'csapat_kedvezmeny').reduce((m, r) => Math.max(m, szam(r.szazalek, 25)), 0);
}

// Egy ár a bolt szerint: listaár × település vagy világ szorzója × árszint (rézre kerekítve, legalább 1 réz).
export function boltAr(listaRez, a, szorzo = 100) {
  if (listaRez === null || listaRez === undefined || listaRez === '') return null;
  const n = Number(listaRez);
  if (!Number.isFinite(n)) return null;
  if (n === 0) return 0;
  return Math.max(1, Math.round(n * (szam(szorzo, 100) / 100) * (ervenyesArszint(a) / 100)));
}

// Egy kínálati tétel ára: a kézi ár nyer; különben a bolt ára. csapat: a csapat kedvezményes ára (ha van kedvezmény).
export function tetelAr(t, a, szorzo, lapok) {
  const sor = t.tetel ? sorKeres(lapok, t.tetel) : null;
  const lista_ = t.tetel ? listaAr(sor) : (t.lista_rez === '' || t.lista_rez === null || t.lista_rez === undefined ? null : Number(t.lista_rez));
  const kezi = t.ar_rez !== '' && t.ar_rez !== null && t.ar_rez !== undefined && Number.isFinite(Number(t.ar_rez));
  const ar = kezi ? Number(t.ar_rez) : boltAr(lista_, a, szorzo);
  const kedv = csapatKedvezmeny(a);
  return { lista: lista_, ar, kezi, csapat: ar !== null && kedv ? Math.max(ar ? 1 : 0, Math.round(ar * (100 - kedv) / 100)) : null };
}

// Felvásárlás: a listaár ennyi százaléka (alapból 25%).
export const felvasarlasAr = (listaRez, a) => (listaRez === null || listaRez === undefined ? null : Math.round(Number(listaRez) * szam(obj(a).felvasarlas, ALAP_FELVASARLAS) / 100));

export function sorKeres(lapok, id) {
  if (!id) return null;
  const lap = id.startsWith('fgy_') ? 'Fegyverek' : id.startsWith('pan_') ? 'Páncélok' : 'Felszerelés';
  return lista(lapok && lapok[lap]).find((s) => s.id === id) || null;
}

// Az árszorzó (saját kiegészítés): a legközelebbi fölérendelt helyszín (település, ország, régió) szorzója, különben a
// világé, különben 100%. ix: az elemek indexe; megj(e): a megjelenített adat (elem.js megjelenitett); vilag: a világ.
export function arszorzo(elem, ix, megj, vilag) {
  let x = elem && elem.szulo_id ? ix.get(elem.szulo_id) : null;
  let n = 0;
  while (x && n++ < 30) {
    const a = obj(megj(x));
    if (a.arszorzo !== undefined && a.arszorzo !== '' && a.arszorzo !== null && Number.isFinite(Number(a.arszorzo))) {
      return { szazalek: Number(a.arszorzo), honnan: 'helyszin', elem: x };
    }
    x = x.szulo_id ? ix.get(x.szulo_id) : null;
  }
  const w = obj(vilag && vilag.adat);
  if (w.arszorzo !== undefined && w.arszorzo !== '' && Number.isFinite(Number(w.arszorzo))) return { szazalek: Number(w.arszorzo), honnan: 'vilag', elem: null };
  return { szazalek: 100, honnan: null, elem: null };
}

// ---------- A dobás eredménye a bolt mezőibe ----------

// A dt_uzlet generátorfájából a bolt mezői (a DM elfogadása után íródnak be). Az első kidolgozottság és árszint számít;
// a félárú részletnél az árszint 50 (a könyv szerint ilyenkor nincs árszint-dobás, de a dobás látszik a menetben).
export function fabolBolt(fa) {
  const tipusok = [];
  const fcs = [];
  let pancel = null, pajzs = null, granat = '', kidolg = null, arszint = null;
  const reszletek = [];
  let magikus = 0;
  eredmenyek(fa).forEach((x, i) => {
    const e = obj(x.ertek);
    if (x.tabla === 'dt_uzlet' || x.tabla === 'dt_uzlet_alap') { if (e.uzlet && UZLET_TIPUSOK[e.uzlet] && !tipusok.includes(e.uzlet)) tipusok.push(e.uzlet); return; }
    if (x.tabla === 'dt_pancel' && pancel === null) pancel = e.pancel || '';
    else if (x.tabla === 'dt_pajzs' && pajzs === null) pajzs = e.pajzs || '';
    else if (x.tabla === 'dt_fegyvercsoport') {
      if (e.csoport === 'granat' || e.csoport === 'granat_alapanyag') { if (granat !== 'granat') granat = e.csoport; }
      else if (e.csoport && !fcs.includes(e.csoport)) fcs.push(e.csoport);
    } else if (x.tabla === 'dt_kidolgozottsag' && kidolg === null) kidolg = e.minoseg || null;
    else if (x.tabla === 'dt_arszint' && arszint === null) arszint = szam(e.szazalek, null);
    else if (x.tabla === 'dt_uzlet_reszlet') {
      reszletek.push({ id: 'ur' + i, e: x.eredmeny, en: x.en || '', hatas: e.hatas || '', modosito: e.modosito, szazalek: e.szazalek });
      if (e.hatas === 'magikus') magikus++;
    } else if (x.tabla === 'dt_fogado' || x.tabla === 'dt_kocsma') {
      reszletek.push({ id: 'ur' + i, e: (x.tabla === 'dt_fogado' ? 'Fogadó: ' : 'Kocsma: ') + x.eredmeny, en: x.en || '', hatas: '' });
    } else if (/^dt_bun/.test(x.tabla) && reszletek.length) {
      // a fedőcég bűnszervezete: a részlet szövegéhez
      const r = reszletek[reszletek.length - 1];
      r.e = r.e + ' (' + x.eredmeny + ')';
    }
  });
  const ki = { uzlet_tipusok: tipusok, uzlet_reszletek: reszletek };
  if (pancel !== null) ki.pancel_max = pancel;
  if (pajzs !== null) ki.pajzs_max = pajzs;
  if (tipusok.includes('fegyverkovacs')) { ki.fegyvercsoportok = fcs; ki.granat = granat; }
  if (kidolg) ki.kidolgozottsag = kidolg;
  if (arszint !== null) ki.arszint = arszint;
  if (magikus) ki.magikus_db = Math.min(5, magikus);
  return ki;
}

// A bolt figyelmeztetései (a könyv szabályai szerint).
export function figyelmeztetesek(a) {
  a = obj(a);
  const f = [];
  const t = tipusokOf(a);
  if (!t.length && !lista(a.sajat_kategoriak).length) f.push('Még nincs üzlettípus: dobj a könyv tábláján, vagy válassz.');
  if (t.includes('pancelkovacs') && !a.pancel_max && !a.pajzs_max) f.push('Páncélkovács páncél és pajzs nélkül: a könyv szerint ilyenkor újra kell dobni.');
  if (t.includes('fegyverkovacs') && !lista(a.fegyvercsoportok).length && !a.granat) f.push('Fegyverkovács fegyvercsoport nélkül: dobj 1d6-szor a fegyvercsoport-táblán, vagy válassz.');
  const h = hatasokOf(a);
  if (h.includes('felar') && h.includes('kiarusitas')) f.push('Két félárú részlet: az ár egyszer feleződik.');
  if (h.includes('csere')) f.push('Csak cserekereskedelem: az árak az áru értékét mutatják, pénzt a bolt nem fogad el.');
  return f;
}

// ---------- Véletlen kínálat ----------

function darabDobas(forma, rng) {
  if (typeof forma === 'number') return forma;
  return kockaDobas(forma, rng).osszeg;
}

// Alacsony készlet (Low Stock): 3d6, dupla nélkül elfogyott (0), duplánál a sárkánykocka a darabszám.
export function alacsonyKeszlet(rng) {
  const d = kockaDobas('3d6', rng);
  const [a, b, c] = d.kockak;
  return a === b || b === c || a === c ? d.sarkany : 0;
}

let szamlalo = 0;
const ujId = () => 'kt' + Date.now().toString(36) + (szamlalo++).toString(36);

// A kínálat generálása. opciok: { rng, csakForras (egy forráskulcs: csak azt generálja újra), azon }.
// A kézzel felvett (egyedi) tételek és a többi forrás tételei megmaradnak, ha csak egy forrás generálódik újra.
export function kinalatGeneral(a, lapok, opciok = {}) {
  a = obj(a);
  const rng = opciok.rng || Math.random;
  const azon = opciok.azon || ujId;
  const boseg = BOSEGEK[a.boseg] || BOSEGEK.atlagos;
  const keves = hatasokOf(a).includes('keves');
  const forr = forrasok(a, lapok).filter((f) => !opciok.csakForras || f.kulcs === opciok.csakForras);
  const ujak = [];
  forr.forEach((f) => {
    let sorok = f.sorok;
    // fegyverkovács konkrét fegyverekkel: csoportonként d3 a csoport fegyvertáblájáról (a könyv szerint)
    if (a.fegyverek_konkret && f.kulcs.startsWith('Fegyverek:fcs_')) {
      const v = [];
      const db = Math.max(1, Math.round(sorok.length / 3) || 1);
      for (let i = 0; i < db; i++) { const s = sorok[(kockaDobas('d3', rng).osszeg - 1) % sorok.length]; if (!v.includes(s)) v.push(s); }
      sorok = v;
    } else if (f.kulcs === 'Fegyverek:granat' && a.granat === 'granat' && boseg.esely < 1) {
      sorok = [sorok[(kockaDobas('1d6', rng).osszeg - 1) % sorok.length]];
    } else if (boseg.esely < 1) {
      sorok = sorok.filter(() => rng() < boseg.esely);
      if (!sorok.length && f.sorok.length) sorok = [f.sorok[Math.floor(rng() * f.sorok.length)]];
    }
    const darabos = f.kulcs.startsWith('Fegyverek:') || f.kulcs.startsWith('Páncélok:');
    sorok.forEach((s) => {
      let darab = darabos ? darabDobas(boseg.darab, rng) : null;
      if (keves) darab = alacsonyKeszlet(rng);
      ujak.push({ id: azon(), forras: f.kulcs, tetel: s.id, nev: '', lista_rez: null, darab, ar_rez: null, megj: '' });
    });
  });
  if (a.granat === 'granat_alapanyag' && tipusokOf(a).includes('fegyverkovacs') && (!opciok.csakForras || opciok.csakForras === 'egyedi')) {
    const van = lista(a.kinalat).some((t) => t.forras === 'egyedi' && /gránát/i.test(t.nev || ''));
    if (!van) ujak.push({ id: azon(), forras: 'egyedi', tetel: '', nev: 'Gránát-alapanyagok', lista_rez: null, darab: null, ar_rez: null, megj: 'a könyv szerint: alapanyag a gránátkészítéshez' });
  }
  const regi = lista(a.kinalat);
  const megmarad = opciok.csakForras
    ? regi.filter((t) => t.forras !== opciok.csakForras)
    : regi.filter((t) => t.forras === 'egyedi');
  return megmarad.concat(ujak.filter((u) => u.forras !== 'egyedi' || !megmarad.some((m) => m.nev === u.nev)));
}

// A kínálat forrásonként csoportosítva a felülethez: [{ kulcs, nev, tetelek }].
export function kinalatCsoportok(a, lapok) {
  const cs = new Map();
  lista(obj(a).kinalat).forEach((t) => {
    const k = t.forras || 'egyedi';
    if (!cs.has(k)) cs.set(k, { kulcs: k, nev: forrasNev(k, lapok), tetelek: [] });
    cs.get(k).tetelek.push(t);
  });
  return Array.from(cs.values());
}

// Egy tétel neve (a szabályadatból vagy egyedi).
export function tetelNev(t, lapok) {
  if (!t.tetel) return t.nev || 'Egyedi tétel';
  const s = sorKeres(lapok, t.tetel);
  return s ? s.nev_hu : t.tetel;
}

// A bolt rövid összefoglalója a listákhoz.
export function osszefoglalo(a) {
  a = obj(a);
  const r = [tipusFelirat(a)];
  r.push('árszint ' + ervenyesArszint(a) + '%');
  if (KIDOLGOZOTTSAGOK[a.kidolgozottsag]) r.push(KIDOLGOZOTTSAGOK[a.kidolgozottsag].nev.toLowerCase());
  const n = lista(a.kinalat).length;
  if (n) r.push(n + ' tétel');
  return r.join(', ');
}
