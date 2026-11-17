// Csatamotor (3. lépés, 4. ütem): a csata állapota és minden lépése tiszta függvényként.
// Böngészőben és Node-ban is fut. Teszt: node tools/teszt/csata.mjs. Terv: claude/csata-terv.md
// („Csataállapot”, „A csata menete”). Szabályok: AK 33–37., 100–101.
//
// A csata állapota (a Csaták lap `adat` mezője):
//   { v, allapot: 'kezdemenyezes' | 'fut' | 'lezart', kor, soron, sorrend: [id], leptek: [id],
//     oldalak, viszonyok, csoportok, resztvevok: [résztvevő], naplo: [{ kor, szoveg }],
//     visszavonas: [lépés], kulcsok: [a már feldolgozott lépések kulcsai] }
// Egy résztvevő:
//   { id, resztvevo_id, forras: { tipus: karakter | njk | szorny, id }, nev, oldal, csoport, fontos, rejtett, meglepett,
//     kezdemenyezes: null | { osszeg, sarkany, tul, kockak, kezi }, egeszseg, egeszseg_max, szivossag,
//     allapot: 'aktiv' | 'haldoklik' | 'kiesett' | 'halott', haldoklas_kor,
//     feltetelek: [{ id, kulcs, nev, lejar_kor, lejar?, forras?, elkezdve? }], hatasok: [{ id, nev, cel, ertek, lejar, kor, fogy?, elkezdve? }],
// A `lejar: 'sajat_kor_vege'` feltétel vagy hatás a gazdája következő körének végén jár le (Megfélemlítve, Gúnyolva,
// Éberség); a `fogy` hatás (cel: 'proba') a következő próbánál elfogy.
//     cselekves: { fo, mellek, plusz, lista }, gyogyithato,
//     magiapont: null | szám, ertekek: { vedekezes, pancelertek, atuto_ellen, magiapont_max, akaratero } }
// Az `ertekek` a lény nézetének csatához kellő része (a DM és a játékos felülete írja); ebből dolgozik a háttér
// a játékos lépéseinél (csatamuvelet.js), mert ott nincs lény-nézet.
// A játékos karakter Egészsége és Mágiapontja a karakter saját állapotában él: a felület minden lépés után
// elküldi a változását (karakterValtozasok), és betöltéskor átveszi a karakterlap értékét (karakterekFrissitese).
// A naplósor { kor, szoveg, dm? }: a dm jelölésűt a játékosok nem látják (például rejtett erősítés felvétele).
import { resztvevokKibontasa, normalizal } from './osszecsapas.js';

export const MAX_NAPLO = 80;
export const MAX_VISSZAVONAS = 15;
const MAX_KULCS = 40;
export const KEZDEMENYEZES_FOKUSZ = 'fok_dexterity_initiative';
export const GYOGYITAS_FOKUSZ = 'fok_intelligence_healing';
export const GYOGYITAS_CELERTEK = 11;

const masol = (x) => JSON.parse(JSON.stringify(x));
const szam = (x, alap = 0) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));
let szamlalo = 0;
const ujId = (elotag) => { szamlalo = (szamlalo + 1) % 1000; return `${elotag}_${Date.now().toString(36).slice(-4)}${Math.random().toString(36).slice(2, 5)}${szamlalo}`; };
export const ujKulcs = () => ujId('l');

// Állapotok neve a felületen.
export const ALLAPOT_NEV = { aktiv: 'harcol', haldoklik: 'haldoklik', kiesett: 'kiesett', halott: 'meghalt' };

// Feltételek alaplistája (AK 36., 101., mutatványok). Az időtartamot a DM adja körökben (üres: amíg le nem veszik).
export const FELTETELEK = [
  { kulcs: 'fekszik', nev: 'Fekszik', en: 'Prone', leiras: 'Közelharcban +1 a támadás ellene (gépi). Fekve nem futhat; a Mozgás felállítja (gépi).' },
  { kulcs: 'kabult', nev: 'Kábult', en: 'Stunned', leiras: 'A DM dönti el a hatását.' },
  { kulcs: 'lefegyverezve', nev: 'Lefegyverezve', en: 'Disarmed', leiras: 'A fegyvere 1d6 + Erő yardra repült; a támadásnál figyelmeztetés, az Előkészítés leveszi (gépi).' },
  { kulcs: 'megragadva', nev: 'Megragadva', en: 'Grappled', leiras: '' },
  { kulcs: 'vak', nev: 'Vak', en: 'Blinded', leiras: '' },
  { kulcs: 'eszmeletlen', nev: 'Eszméletlen', en: 'Unconscious', leiras: '1 Egészséggel, a kegyelemdöfés elmaradt.' },
  { kulcs: 'megfelemlitve', nev: 'Megfélemlítve', en: 'Threatened', leiras: 'A következő körében a fenyegetőt kell támadnia: a támadás célpontja ő (gépi), a köre végén lejár.' },
  { kulcs: 'gunyolva', nev: 'Gúnyolva', en: 'Taunted', leiras: '−1 a támadásra és a varázslásra a következő körében (gépi), a köre végén lejár.' }
];

// Cselekvések (AK 33–34.). gepi: a felület alkalmazza a hatását; a többi csak jelölés, amely elfogyasztja a cselekvést.
export const CSELEKVESEK = [
  { kulcs: 'tamadas', nev: 'Támadás', en: 'Melee / Ranged Attack', fajta: 'fo', tamadas: true },
  { kulcs: 'roham', nev: 'Rohamozás', en: 'Charge', fajta: 'fo', tamadas: true, leiras: 'Fél Sebességnyi mozgás, utána közelharci támadás +1-gyel.' },
  { kulcs: 'mindent_bele', nev: 'Mindent bele támadás', en: 'All-Out Attack', fajta: 'fo', tamadas: true, leiras: 'Találatnál +1 sebzés, de −1 Védekezés a következő köréig.' },
  { kulcs: 'vedekezes', nev: 'Védekezés', en: 'Defend', fajta: 'fo', gepi: true, leiras: '+2 Védekezés a következő köre elejéig.' },
  { kulcs: 'gyogyitas', nev: 'Gyógyítás', en: 'Heal', fajta: 'fo', gepi: true, leiras: 'Intelligencia (Gyógyítás) 11: siker esetén sárkánykocka + Intelligencia Egészség.' },
  { kulcs: 'futas', nev: 'Futás', en: 'Run', fajta: 'fo', leiras: 'Kétszeres Sebességnyi mozgás. Fekve nem lehet.' },
  { kulcs: 'celzas', nev: 'Célzás', en: 'Aim', fajta: 'mellek', gepi: true, leiras: '+1 a következő támadásra, ha a következő cselekvés támadás.' },
  { kulcs: 'mozgas', nev: 'Mozgás', en: 'Move', fajta: 'mellek', leiras: 'Sebességnyi mozgás; felállás, lefekvés, nyeregbe szállás fél Sebességgel.' },
  { kulcs: 'aktivalas', nev: 'Aktiválás', en: 'Activate', fajta: 'mellek', leiras: 'Harcmodor, ital vagy tárgy használatának megkezdése.' },
  { kulcs: 'keszenlet', nev: 'Előkészítés', en: 'Ready', fajta: 'mellek', leiras: 'Fegyver vagy tárgy elővétele, közben egy eltehető.' },
  { kulcs: 'felkeszules', nev: 'Felkészülés', en: 'Prepare', fajta: 'mellek', leiras: 'Egy fő cselekvés kitartása a következő köréig; a köre véget ér.' },
  { kulcs: 'oldalvedelem', nev: 'Résen lét', en: 'Guard Up', fajta: 'mellek', leiras: '+1 vagy +2 Védekezés a kör végéig, ugyanennyi büntetés a próbákra. Fő cselekvés előtt.' },
  { kulcs: 'nyomulas', nev: 'Nyomulás', en: 'Press the Attack', fajta: 'mellek', leiras: 'Ha a megtámadott ellenfél elhátrál, azonnal követheted.' },
  { kulcs: 'ujratoltes', nev: 'Újratöltés', en: 'Reload', fajta: 'mellek', leiras: 'A fegyvertől függően fő, mellék vagy szabad cselekvés.' }
];
export const cselekvesAdat = (kulcs) => CSELEKVESEK.find((c) => c.kulcs === kulcs) || null;

// A harci mutatványok gépi hatása (azonosító szerint). A csomagok összetevőit is kibontja.
const MUTATVANY_HATAS = {
  mut_mighty_blow: { sebzes_kocka: 1 },
  mut_lethal_blow: { sebzes_kocka: 2 },
  mut_pierce_armor: { fel_pancel: true },
  mut_knock_prone: { fekszik: true },
  mut_defensive_stance: { vedoallas: true },
  mut_dual_strike: { kettos: true },
  mut_seize_the_initiative: { atvetel: true },
  mut_lightning_attack: { villam: true }
};
export function mutatvanyHatasok(mutatvanyok, lapok) {
  const ki = { sebzes_kocka: 0, fel_pancel: false, fekszik: false, vedoallas: false, kettos: false, atvetel: false, villam: 0, szoveges: [] };
  const sorok = (lapok && lapok['Mutatványok']) || [];
  const bont = (id, nev, db) => {
    const sor = sorok.find((m) => m.id === id);
    const r = sor && (typeof sor.reszletek === 'string' ? (() => { try { return JSON.parse(sor.reszletek); } catch (e) { return {}; } })() : sor.reszletek) || {};
    if (Array.isArray(r.osszetevok) && r.osszetevok.length) { r.osszetevok.forEach((x) => bont(x, null, 1)); return; }
    const h = MUTATVANY_HATAS[id];
    if (!h) { ki.szoveges.push(nev || (sor && sor.nev_hu) || id); return; }
    for (let i = 0; i < Math.max(1, db || 1); i++) {
      if (h.sebzes_kocka) ki.sebzes_kocka += h.sebzes_kocka;
      if (h.villam) ki.villam += 1;
    }
    ['fel_pancel', 'fekszik', 'vedoallas', 'kettos', 'atvetel'].forEach((k) => { if (h[k]) ki[k] = true; });
  };
  (mutatvanyok || []).forEach((m) => bont(m.id, m.nev, m.db));
  return ki;
}

// ---------------- Sebzés ----------------

// „2d6+3”, „1d6 − 1”, „3” → { kocka: 2, plusz: 3 } (hatoldalú kockák). Ismeretlen formánál null.
export function sebzesKifejezes(s) {
  const t = String(s === undefined || s === null ? '' : s).replace(/\s/g, '').replace(/[−–]/g, '-').toLowerCase();
  if (!t) return null;
  let m = t.match(/^(\d*)d6([+-]\d+)?$/);
  if (m) return { kocka: m[1] === '' ? 1 : Number(m[1]), plusz: m[2] ? Number(m[2]) : 0 };
  m = t.match(/^([+-]?\d+)$/);
  if (m) return { kocka: 0, plusz: Number(m[1]) };
  return null;
}

// A tényleges sebzés: a dobás és a bónuszok összege, a Páncélérték levonásával (átütő sebzésnél nem, kivéve az
// átütő ellen is védő lényt; Páncéltörés: fél Páncélérték, lefelé kerekítve). Soha nem negatív.
export function sebzesSzamol({ osszeg, pancelertek = 0, atuto = false, atuto_ellen = false, fel_pancel = false }) {
  let pe = Math.max(0, szam(pancelertek));
  if (atuto && !atuto_ellen) pe = 0;
  if (fel_pancel) pe = Math.floor(pe / 2);
  const nyers = Math.max(0, szam(osszeg));
  return { nyers, pancel: pe, vegso: Math.max(0, nyers - pe) };
}

// ---------------- Létrehozás ----------------

// Csata egy összecsapás adatából. adatok(peldany) → { egeszseg, egeszseg_max, szivossag } a lény nézetéből.
// meglepettOldalak: az első körben nem cselekvő oldalak (AK 101.).
export function csataOsszecsapasbol(osszecsapasAdat, adatok, { meglepettOldalak = [] } = {}) {
  const o = normalizal(osszecsapasAdat);
  const resztvevok = resztvevokKibontasa(o).map((p) => {
    const a = (adatok && adatok(p)) || {};
    const max = Math.max(0, szam(a.egeszseg_max, 0));
    return {
      id: p.id, resztvevo_id: p.resztvevo_id, forras: { ...p.forras }, nev: p.nev, oldal: p.oldal, csoport: p.csoport || '',
      fontos: !!p.fontos, rejtett: !!p.rejtett, meglepett: meglepettOldalak.includes(p.oldal),
      kezdemenyezes: null, egeszseg: Math.min(max, Math.max(0, szam(a.egeszseg, max))), egeszseg_max: max, szivossag: szam(a.szivossag),
      allapot: szam(a.egeszseg, max) <= 0 && max > 0 ? (p.forras.tipus === 'karakter' || p.fontos ? 'haldoklik' : 'kiesett') : 'aktiv',
      haldoklas_kor: null, feltetelek: [], hatasok: [], cselekves: uresCselekves(), gyogyithato: true,
      magiapont: a.magiapont === undefined || a.magiapont === null ? null : szam(a.magiapont), ertekek: a.ertekek ? { ...a.ertekek } : null
    };
  });
  return {
    v: 1, allapot: 'kezdemenyezes', kor: 0, soron: null, sorrend: [], leptek: [],
    oldalak: o.oldalak, viszonyok: o.viszonyok, csoportok: o.csoportok, resztvevok,
    naplo: [{ kor: 0, szoveg: 'A csata előkészítve: kezdeményezés.' }], visszavonas: [], kulcsok: [], fuggo: []
  };
}

const uresCselekves = () => ({ fo: 0, mellek: 0, plusz: 0, lista: [] });
export const resztvevo = (cs, id) => (cs.resztvevok || []).find((r) => r.id === id) || null;
const naplozas = (cs, szoveg, dm) => { cs.naplo = (cs.naplo || []).concat([dm ? { kor: cs.kor, szoveg, dm: true } : { kor: cs.kor, szoveg }]).slice(-MAX_NAPLO); };

// ---------------- Lépések és visszavonás ----------------

// Egy lépés: a változás előtti állapot elmentése (csak a megváltozott résztvevők), hogy visszavonható legyen.
// fn a másolaton dolgozik (módosíthatja vagy újat adhat vissza). leiras: a napló és a Visszavonás gomb szövege.
// opciok.szerzo: ki lépett (a játékos a saját utolsó lépését visszavonhatja); opciok.dm: a naplósor csak a DM-é.
export function lepes(cs, leiras, fn, kulcs, { szerzo = '', dm = false } = {}) {
  const elotte = masol(cs);
  const uj = masol(cs);
  const eredmeny = fn(uj) || uj;
  const regiR = new Map(elotte.resztvevok.map((r) => [r.id, r]));
  const valtozott = {};
  eredmeny.resztvevok.forEach((r) => {
    const v = regiR.get(r.id);
    if (!v) valtozott[r.id] = null;
    else if (JSON.stringify(v) !== JSON.stringify(r)) valtozott[r.id] = v;
  });
  elotte.resztvevok.forEach((r) => { if (!eredmeny.resztvevok.some((x) => x.id === r.id)) valtozott[r.id] = r; });
  const rekord = {
    leiras, kor: elotte.kor, soron: elotte.soron, sorrend: elotte.sorrend, leptek: elotte.leptek, allapot: elotte.allapot,
    oldalak: JSON.stringify(elotte.oldalak) !== JSON.stringify(eredmeny.oldalak) ? elotte.oldalak : undefined,
    viszonyok: JSON.stringify(elotte.viszonyok) !== JSON.stringify(eredmeny.viszonyok) ? elotte.viszonyok : undefined,
    resztvevok: valtozott, naplo_hossz: elotte.naplo.length, sorrend_r: elotte.resztvevok.map((r) => r.id),
    fuggo: JSON.stringify(elotte.fuggo || []) !== JSON.stringify(eredmeny.fuggo || []) ? (elotte.fuggo || []) : undefined
  };
  if (szerzo) rekord.szerzo = szerzo;
  if (leiras) naplozas(eredmeny, leiras, dm);
  rekord.naplo_utana = eredmeny.naplo.length;
  eredmeny.visszavonas = (eredmeny.visszavonas || []).concat([rekord]).slice(-MAX_VISSZAVONAS);
  if (kulcs) eredmeny.kulcsok = (eredmeny.kulcsok || []).concat([kulcs]).slice(-MAX_KULCS);
  return eredmeny;
}

export const visszavonhato = (cs) => (cs.visszavonas || []).length > 0;
export const utolsoLepes = (cs) => { const v = cs.visszavonas || []; return v.length ? v[v.length - 1].leiras : ''; };

// Az utolsó lépés visszavonása.
export function visszavon(cs, kulcs) {
  const uj = masol(cs);
  const rek = (uj.visszavonas || []).pop();
  if (!rek) return uj;
  ['kor', 'soron', 'sorrend', 'leptek', 'allapot'].forEach((k) => { uj[k] = rek[k]; });
  if (rek.oldalak) uj.oldalak = rek.oldalak;
  if (rek.viszonyok) uj.viszonyok = rek.viszonyok;
  if (rek.fuggo) uj.fuggo = rek.fuggo;
  const r = rek.resztvevok || {};
  const meglevo = new Map(uj.resztvevok.map((x) => [x.id, x]));
  Object.keys(r).forEach((id) => { if (r[id]) meglevo.set(id, r[id]); else meglevo.delete(id); });
  uj.resztvevok = (rek.sorrend_r || [...meglevo.keys()]).map((id) => meglevo.get(id)).filter(Boolean);
  // a lépés naplósorait levesszük, a visszavonás maga is bekerül
  if (uj.naplo.length === rek.naplo_utana) uj.naplo = uj.naplo.slice(0, rek.naplo_hossz);
  naplozas(uj, `Visszavonva: ${rek.leiras || 'az utolsó lépés'}.`);
  if (kulcs) uj.kulcsok = (uj.kulcsok || []).concat([kulcs]).slice(-MAX_KULCS);
  return uj;
}

// ---------------- Kezdeményezés ----------------

// A kezdeményezési próba bónusza: Ügyesség (Kezdeményezés), a páncélbüntetéssel (proba.js probaOsszeallit adja).
export function kezdemenyezesHianyzik(cs) {
  return cs.resztvevok.filter((r) => !r.rejtett && r.allapot !== 'halott' && !r.kezdemenyezes);
}

// A kezdeményezés rögzítése; csoporttagnál az egész csoport ugyanazt kapja (AK 100.: a csoport egyszer dob).
export function kezdemenyezesBeallitas(cs, id, { osszeg, sarkany, tul, kockak, kezi } = {}) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const k = { osszeg: szam(osszeg), sarkany: szam(sarkany), tul: szam(tul), kockak: kockak || null, kezi: !!kezi };
  const celok = r.csoport ? cs.resztvevok.filter((x) => x.csoport === r.csoport) : [r];
  celok.forEach((x) => { x.kezdemenyezes = { ...k }; });
  if (cs.allapot === 'fut') sorrendBeillesztes(cs, celok.map((x) => x.id));
  else cs.sorrend = sorrendSzamol(cs).sorrend;
  return cs;
}

const kezdKulcs = (r) => [szam(r.kezdemenyezes && r.kezdemenyezes.osszeg, -99), szam(r.kezdemenyezes && r.kezdemenyezes.sarkany), szam(r.kezdemenyezes && r.kezdemenyezes.tul)];
function hasonlit(a, b) {
  const x = kezdKulcs(a), y = kezdKulcs(b);
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return y[i] - x[i];
  // a csoport tagjai egymás mellé
  if ((a.csoport || '') !== (b.csoport || '')) return String(a.csoport || a.id).localeCompare(String(b.csoport || b.id));
  return 0;
}

// A kezdeményezés szerinti sorrend (a rejtettek nélkül). Holtversenyben: sárkánykocka, aztán Ügyesség;
// ha az is egyezik (és nem egy csoport), a DM kézzel rendez: ezeket a holtversenyek lista mutatja.
export function sorrendSzamol(cs) {
  const lista = cs.resztvevok.filter((r) => !r.rejtett && r.kezdemenyezes).slice();
  const eredeti = new Map(lista.map((r, i) => [r.id, i]));
  lista.sort((a, b) => hasonlit(a, b) || eredeti.get(a.id) - eredeti.get(b.id));
  const holtversenyek = [];
  for (let i = 1; i < lista.length; i++) {
    const a = lista[i - 1], b = lista[i];
    if (hasonlit(a, b) === 0 && !(a.csoport && a.csoport === b.csoport)) holtversenyek.push([a.id, b.id]);
  }
  return { sorrend: lista.map((r) => r.id), holtversenyek };
}

// Új résztvevők beillesztése a futó sorrendbe a kezdeményezésük szerint (a már meglévők sorrendje nem változik).
function sorrendBeillesztes(cs, ids) {
  ids.forEach((id) => {
    cs.sorrend = cs.sorrend.filter((x) => x !== id);
    const r = resztvevo(cs, id);
    if (!r || r.rejtett || !r.kezdemenyezes) return;
    let hely = cs.sorrend.findIndex((x) => { const m = resztvevo(cs, x); return m && hasonlit(r, m) < 0; });
    if (hely < 0) hely = cs.sorrend.length;
    cs.sorrend.splice(hely, 0, id);
  });
}

// Kézi átrendezés: egy hellyel feljebb (-1) vagy lejjebb (+1).
export function athelyezes(cs, id, irany) {
  const i = cs.sorrend.indexOf(id);
  const j = i + irany;
  if (i < 0 || j < 0 || j >= cs.sorrend.length) return cs;
  const s = cs.sorrend.slice();
  [s[i], s[j]] = [s[j], s[i]];
  cs.sorrend = s;
  return cs;
}

// ---------------- Körök ----------------

// Cselekedhet-e (a körben sorra kerülhet): nem rejtett, nem esett ki, nem halt meg, nem haldoklik.
const cselekvoke = (cs, r) => r && !r.rejtett && r.allapot === 'aktiv' && !(cs.kor === 1 && r.meglepett);

// A csata indítása a kezdeményezés után: 1. kör, az első cselekvő jön.
export function csataKezdes(cs) {
  const hiany = kezdemenyezesHianyzik(cs);
  if (hiany.length) throw new Error('Még nincs kezdeményezése: ' + hiany.map((r) => r.nev).join(', ') + '.');
  // a DM kézi átrendezése megmarad, ha a sorrend a kezdeményezéssel rendelkezők teljes listája
  const sz = sorrendSzamol(cs).sorrend;
  if (!(cs.sorrend.length === sz.length && sz.every((x) => cs.sorrend.includes(x)))) cs.sorrend = sz;
  cs.allapot = 'fut';
  cs.kor = 1;
  cs.leptek = [];
  cs.soron = null;
  korKezdete(cs);
  return kovetkezoKeres(cs);
}

// A kör eleje: lejárnak az időtartamos feltételek és hatások.
function korKezdete(cs) {
  cs.resztvevok.forEach((r) => {
    const f = r.feltetelek.filter((x) => x.lejar_kor && cs.kor >= x.lejar_kor);
    if (f.length) naplozas(cs, `${r.nev}: lejárt (${f.map((x) => x.nev).join(', ')}).`);
    r.feltetelek = r.feltetelek.filter((x) => !(x.lejar_kor && cs.kor >= x.lejar_kor));
    r.hatasok = r.hatasok.filter((x) => !(x.lejar === 'kor' && cs.kor > x.kor));
    if (cs.kor === 2 && r.meglepett) r.meglepett = false;
  });
}

// A saját kör eleje: a „következő köröd elejéig” tartó hatások lejárnak, a cselekvések nullázódnak,
// a haldokló a végső kör elején meghal.
function sajatKorKezdete(cs, r) {
  // a Célzás is csak a köre végéig él, ha nem követte támadás
  r.hatasok = r.hatasok.filter((x) => !((x.lejar === 'sajat' || x.lejar === 'kovetkezo_tamadas') && cs.kor > x.kor));
  // a „következő köröd végéig” tartók ettől a körtől élnek, és a kör végén járnak le
  r.feltetelek.forEach((f) => { if (f.lejar === 'sajat_kor_vege') f.elkezdve = true; });
  r.hatasok.forEach((h) => { if (h.lejar === 'sajat_kor_vege') h.elkezdve = true; });
  r.cselekves = uresCselekves();
}

// A saját kör vége: lejárnak a „következő köröd végéig” tartó feltételek és hatások.
function sajatKorVege(cs, r) {
  const f = r.feltetelek.filter((x) => x.lejar === 'sajat_kor_vege' && x.elkezdve);
  const h = r.hatasok.filter((x) => x.lejar === 'sajat_kor_vege' && x.elkezdve);
  if (f.length || h.length) naplozas(cs, `${r.nev}: lejárt (${f.map((x) => x.nev).concat(h.map((x) => x.nev)).join(', ')}).`);
  r.feltetelek = r.feltetelek.filter((x) => !(x.lejar === 'sajat_kor_vege' && x.elkezdve));
  r.hatasok = r.hatasok.filter((x) => !(x.lejar === 'sajat_kor_vege' && x.elkezdve));
}

// A következő cselekvő keresése (a soron lévő utáni első, aki ebben a körben még nem lépett).
// A haldoklókat is végigveszi: a végső körük elején meghalnak (AK 36.).
function kovetkezoKeres(cs) {
  for (let fordulo = 0; fordulo < 3; fordulo++) {
    for (const id of cs.sorrend) {
      if (cs.leptek.includes(id)) continue;
      const r = resztvevo(cs, id);
      if (!r) continue;
      if (r.allapot === 'haldoklik' && !r.rejtett) {
        cs.leptek.push(id);
        if (r.haldoklas_kor && cs.kor >= r.haldoklas_kor) {
          r.allapot = 'halott';
          r.feltetelek = r.feltetelek.filter((f) => f.kulcs !== 'haldoklik');
          naplozas(cs, `${r.nev} meghalt.`);
        }
        continue;
      }
      if (!cselekvoke(cs, r)) { cs.leptek.push(id); continue; }
      cs.soron = id;
      sajatKorKezdete(cs, r);
      return cs;
    }
    // új kör
    if (!cs.sorrend.some((id) => { const r = resztvevo(cs, id); return r && (r.allapot === 'aktiv' || r.allapot === 'haldoklik') && !r.rejtett; })) {
      cs.soron = null;
      return cs;
    }
    cs.kor += 1;
    cs.leptek = [];
    korKezdete(cs);
    naplozas(cs, `${cs.kor}. kör.`);
  }
  cs.soron = null;
  return cs;
}

// „Kész, következő”: a soron lévő köre véget ér.
export function kovetkezo(cs) {
  if (cs.allapot !== 'fut') return cs;
  const soron = resztvevo(cs, cs.soron);
  if (soron) sajatKorVege(cs, soron);
  if (cs.soron && !cs.leptek.includes(cs.soron)) cs.leptek.push(cs.soron);
  return kovetkezoKeres(cs);
}

// Kezdeményezés átvétele (Seize the Initiative): a résztvevő a sorrend élére kerül; a körben még nem lépettek
// ebben a körben is sorra kerülnek, a következő kört ő kezdi.
export function sorrendElere(cs, id) {
  if (!cs.sorrend.includes(id)) return cs;
  cs.sorrend = [id].concat(cs.sorrend.filter((x) => x !== id));
  return cs;
}

// ---------------- Cselekvések ----------------

// Körönként egy fő és egy mellék, vagy két mellék cselekvés (AK 33.). A plusz a mutatványból (Villámtámadás)
// vagy a DM feloldásából jön. A szabad cselekvés nem számít.
export function cselekvesEngedett(r, fajta) {
  if (!r) return false;
  const c = r.cselekves || uresCselekves();
  if (fajta === 'szabad') return true;
  if (c.plusz > 0) return true;
  if (fajta === 'fo') return c.fo < 1 && c.fo + c.mellek < 2;
  return c.fo + c.mellek < 2;
}

export function cselekvesRogzites(cs, id, fajta, nev) {
  const r = resztvevo(cs, id);
  if (!r || fajta === 'szabad') { if (r && nev) r.cselekves.lista = (r.cselekves.lista || []).concat([nev]); return cs; }
  const c = r.cselekves || (r.cselekves = uresCselekves());
  const alap = fajta === 'fo' ? c.fo < 1 && c.fo + c.mellek < 2 : c.fo + c.mellek < 2;
  if (!alap && c.plusz > 0) c.plusz -= 1;
  else if (fajta === 'fo') c.fo += 1; else c.mellek += 1;
  if (nev) c.lista = (c.lista || []).concat([nev]);
  return cs;
}

export function cselekvesFeloldas(cs, id, db = 1) {
  const r = resztvevo(cs, id);
  if (r) r.cselekves.plusz = Math.max(0, (r.cselekves.plusz || 0) + db);
  return cs;
}

export function cselekvesSzoveg(r) {
  const c = (r && r.cselekves) || uresCselekves();
  const reszek = [];
  if (c.fo) reszek.push(`fő ${c.fo}`);
  if (c.mellek) reszek.push(`mellék ${c.mellek}`);
  if (c.plusz) reszek.push(`+${c.plusz} további`);
  return reszek.join(', ') || 'még nem cselekedett';
}

// Hatás felvétele (cel: 'vedekezes' | 'tamadas' | 'sebzes'). lejar: 'sajat' (a következő köre elejéig),
// 'kor' (a kör végéig), 'kovetkezo_tamadas' (a következő támadásig, de legfeljebb a köre végéig).
export function hatasHozzaadas(cs, id, { nev, cel, ertek, lejar = 'sajat', fogy = false }) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const h = { id: ujId('h'), nev, cel, ertek: szam(ertek), lejar, kor: cs.kor };
  if (fogy) h.fogy = true;
  r.hatasok = r.hatasok.filter((x) => x.nev !== nev).concat([h]);
  return cs;
}

// A következő próbára szóló bónuszok (cel: 'proba', például Éberség): [{ ertek, eredet }].
export const probaBonuszok = (r) => ((r && r.hatasok) || []).filter((h) => h.cel === 'proba' && szam(h.ertek)).map((h) => ({ ertek: szam(h.ertek), eredet: h.nev }));
// A próba után elfogynak.
export function probaBonuszFogyasztas(cs, id) {
  const r = resztvevo(cs, id);
  if (r) r.hatasok = r.hatasok.filter((h) => !(h.cel === 'proba' && h.fogy));
  return cs;
}
export const vanFeltetel = (r, kulcs) => ((r && r.feltetelek) || []).some((f) => f.kulcs === kulcs);

export const hatasOsszeg = (r, cel) => ((r && r.hatasok) || []).filter((h) => h.cel === cel).reduce((a, h) => a + szam(h.ertek), 0);

// A célpont Védekezése a csatában: a nézet értéke és a csata hatásai (Védekezés, Védőállás, Mindent bele).
export function vedekezes(r, alap) {
  return szam(alap, 10) + hatasOsszeg(r, 'vedekezes');
}

// A támadás módosítói a csata állapotából: a támadó hatásai (Célzás) és a célpont feltételei (fekvő: +1 közelharcban).
export function tamadasModositok(tamado, cel, { tavolsagi = false } = {}) {
  const ki = [];
  ((tamado && tamado.hatasok) || []).filter((h) => (h.cel === 'tamadas' || h.cel === 'proba') && szam(h.ertek)).forEach((h) => ki.push({ ertek: szam(h.ertek), eredet: h.nev, hatas: h.id }));
  if (vanFeltetel(tamado, 'gunyolva')) ki.push({ ertek: -1, eredet: 'Gúnyolva' });
  if (cel && !tavolsagi && (cel.feltetelek || []).some((f) => f.kulcs === 'fekszik')) ki.push({ ertek: 1, eredet: 'Fekvő célpont' });
  return ki;
}

// A támadás után a „következő támadásig” szóló hatások (Célzás) elfogynak.
export function tamadasUtan(cs, id) {
  const r = resztvevo(cs, id);
  if (r) r.hatasok = r.hatasok.filter((h) => h.lejar !== 'kovetkezo_tamadas' && !(h.cel === 'proba' && h.fogy));
  return cs;
}

// ---------------- Egészség, haldoklás ----------------

// Egészség beállítása a szabályok szerint: nulla alatt nincs, nullánál a játékos karakter és a fontos NJK
// haldoklik (2 + Szívósság kör múlva, a saját köre elején hal meg), a többi kiesik (AK 36., 101.).
// A haldokló gyógyulása (Egészség nulla fölött) megszünteti a haldoklást.
export function egeszsegBeallitas(cs, id, ertek) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const regi = r.egeszseg;
  r.egeszseg = Math.max(0, Math.min(r.egeszseg_max || szam(ertek), Math.round(szam(ertek))));
  if (r.egeszseg <= 0 && regi > 0 && r.allapot === 'aktiv') {
    if (r.forras.tipus === 'karakter' || r.fontos) {
      r.allapot = 'haldoklik';
      r.haldoklas_kor = (cs.kor || 0) + 2 + Math.max(0, r.szivossag);
      naplozas(cs, `${r.nev} haldoklik: a ${r.haldoklas_kor}. kör saját köre elején meghal, ha addig nem gyógyítják.`);
    } else {
      r.allapot = 'kiesett';
      naplozas(cs, `${r.nev} kiesett.`);
    }
  } else if (r.egeszseg > 0 && (r.allapot === 'haldoklik' || (r.allapot === 'kiesett' && regi <= 0))) {
    r.allapot = 'aktiv';
    r.haldoklas_kor = null;
    naplozas(cs, `${r.nev} újra harcol.`);
  }
  if (r.egeszseg < regi) r.gyogyithato = true;
  return cs;
}

export function sebzesAlkalmazas(cs, id, mennyi) {
  const r = resztvevo(cs, id);
  if (!r || !(szam(mennyi) > 0)) return cs;
  return egeszsegBeallitas(cs, id, r.egeszseg - szam(mennyi));
}

// Gyógyítás (Heal cselekvés, ital, varázslat): legfeljebb a maximumig. heal: a Gyógyítás cselekvésből jön
// (a célpont addig nem kaphat újabbat, amíg újabb sebzést nem szenved).
export function gyogyitas(cs, id, mennyi, { heal = false } = {}) {
  const r = resztvevo(cs, id);
  if (!r || !(szam(mennyi) > 0)) return cs;
  egeszsegBeallitas(cs, id, Math.min(r.egeszseg_max, r.egeszseg + szam(mennyi)));
  if (heal) r.gyogyithato = false;
  return cs;
}

// A DM kézi döntése: kiesett, haldoklik, halott vagy újra harcol.
export function allapotBeallitas(cs, id, allapot) {
  const r = resztvevo(cs, id);
  if (!r || !ALLAPOT_NEV[allapot]) return cs;
  r.allapot = allapot;
  if (allapot === 'haldoklik' && !r.haldoklas_kor) r.haldoklas_kor = (cs.kor || 0) + 2 + Math.max(0, r.szivossag);
  if (allapot !== 'haldoklik') r.haldoklas_kor = null;
  if (allapot === 'aktiv' && r.egeszseg <= 0) r.egeszseg = 1;
  return cs;
}

export function fontosBeallitas(cs, id, fontos) {
  const r = resztvevo(cs, id);
  if (r) r.fontos = !!fontos;
  return cs;
}

// ---------------- Feltételek ----------------

// korok: hány körig tart (a kör elején jár le); üres vagy 0: amíg le nem veszik.
// lejar: 'sajat_kor_vege' (a gazdája következő körének végén jár le); forras: ki okozta (Megfélemlítve: a fenyegető).
export function feltetelHozzaadas(cs, id, { kulcs, nev, korok, lejar, forras }) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const alap = FELTETELEK.find((f) => f.kulcs === kulcs);
  const n = String(nev || (alap && alap.nev) || '').trim().slice(0, 60);
  if (!n) return cs;
  const k = szam(korok);
  const f = { id: ujId('f'), kulcs: alap ? alap.kulcs : '', nev: n, lejar_kor: k > 0 ? (cs.kor || 0) + k : null };
  if (lejar) f.lejar = lejar;
  if (forras) f.forras = forras;
  r.feltetelek = r.feltetelek.filter((x) => (alap ? x.kulcs !== alap.kulcs : x.nev !== n)).concat([f]);
  return cs;
}

export function feltetelTorles(cs, id, feltetelId) {
  const r = resztvevo(cs, id);
  if (r) r.feltetelek = r.feltetelek.filter((f) => f.id !== feltetelId);
  return cs;
}

// ---------------- Résztvevők csata közben ----------------

// Rejtett résztvevő belépése: a kezdeményezésével bekerül a sorrendbe, és a következő körtől cselekszik.
export function belepes(cs, id, kezdemenyezes) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  r.rejtett = false;
  if (kezdemenyezes) r.kezdemenyezes = { ...kezdemenyezes };
  if (cs.allapot === 'fut') {
    sorrendBeillesztes(cs, [id]);
    if (!cs.leptek.includes(id)) cs.leptek.push(id);
  }
  return cs;
}

// Új résztvevő a csata közben (gyors hozzáadás): a felület adja az alapadatait. csoportNev: a több példányban
// felvett lény közös kezdeményezési csoportja (azonos néven egy csoport). A futó csatában az új résztvevő
// a belépésre vár (rejtett), amíg kezdeményezést nem kap.
export function resztvevoHozzaadas(cs, { forras, nev, oldal, fontos = false, rejtett = false, egeszseg, egeszseg_max, szivossag, kezdemenyezes = null, csoportNev = '', magiapont = null, ertekek = null }) {
  const id = ujId('cs');
  let csoport = '';
  if (csoportNev) {
    const meglevo = (cs.csoportok || []).find((g) => g.nev === csoportNev);
    if (meglevo) csoport = meglevo.id;
    else { csoport = ujId('g'); cs.csoportok = (cs.csoportok || []).concat([{ id: csoport, nev: csoportNev }]); }
  }
  const max = Math.max(0, szam(egeszseg_max));
  cs.resztvevok.push({
    id, resztvevo_id: id, forras: { ...forras }, nev: String(nev || 'Új résztvevő'), oldal: oldal || (cs.oldalak[0] && cs.oldalak[0].id), csoport,
    fontos: !!fontos, rejtett: !!rejtett, meglepett: false, kezdemenyezes, egeszseg: Math.min(max, szam(egeszseg, max)), egeszseg_max: max,
    szivossag: szam(szivossag), allapot: 'aktiv', haldoklas_kor: null, feltetelek: [], hatasok: [], cselekves: uresCselekves(), gyogyithato: true,
    magiapont: magiapont === null || magiapont === undefined ? null : szam(magiapont), ertekek: ertekek ? { ...ertekek } : null
  });
  if (kezdemenyezes && !rejtett) belepes(cs, id, kezdemenyezes);
  else if (cs.allapot === 'fut' && !kezdemenyezes) resztvevo(cs, id).rejtett = true;
  return cs;
}

// A résztvevő eltávolítása (tévedésből felvett lény); a csata sorrendjéből is kikerül.
export function resztvevoTorles(cs, id) {
  cs.resztvevok = cs.resztvevok.filter((r) => r.id !== id);
  cs.sorrend = cs.sorrend.filter((x) => x !== id);
  cs.leptek = cs.leptek.filter((x) => x !== id);
  if (cs.soron === id) { cs.soron = null; kovetkezoKeres(cs); }
  return cs;
}

export function oldalValtas(cs, id, oldal) {
  const r = resztvevo(cs, id);
  if (r && cs.oldalak.some((o) => o.id === oldal)) r.oldal = oldal;
  return cs;
}

// ---------------- Karakterek Egészsége ----------------

// A játékos karakterek aktuális értékei a karakterlapról (betöltéskor, nem lépés):
// { [karakter id]: { egeszseg, egeszseg_max, szivossag, magiapont, ertekek } }.
// Csak az eltérőt írja át; az állapot (haldoklás) a szabály szerint igazodik.
export function karakterekFrissitese(cs, ertekek) {
  let valtozott = false;
  cs.resztvevok.forEach((r) => {
    if (r.forras.tipus !== 'karakter') return;
    const e = ertekek && ertekek[r.forras.id];
    if (!e) return;
    if (Number.isFinite(Number(e.egeszseg_max)) && r.egeszseg_max !== Number(e.egeszseg_max)) { r.egeszseg_max = Number(e.egeszseg_max); valtozott = true; }
    if (Number.isFinite(Number(e.szivossag)) && r.szivossag !== Number(e.szivossag)) { r.szivossag = Number(e.szivossag); valtozott = true; }
    if (e.magiapont !== undefined && e.magiapont !== null && Number.isFinite(Number(e.magiapont)) && r.magiapont !== Number(e.magiapont)) { r.magiapont = Number(e.magiapont); valtozott = true; }
    if (e.ertekek && ertekekBeallitas(cs, r.id, e.ertekek)) valtozott = true;
    if (Number.isFinite(Number(e.egeszseg)) && r.egeszseg !== Number(e.egeszseg)) {
      const ertek = Number(e.egeszseg);
      if (r.allapot === 'halott') { r.egeszseg = ertek; valtozott = true; return; }
      egeszsegBeallitas(cs, r.id, ertek);
      valtozott = true;
    }
  });
  return valtozott;
}

// A résztvevő csataértékeinek (Védekezés, Páncélérték, Mágiapont maximuma, Akaraterő) frissítése a nézetből.
// Igazat ad, ha változott valami.
export function ertekekBeallitas(cs, id, e) {
  const r = resztvevo(cs, id);
  if (!r || !e) return false;
  const uj = { ...(r.ertekek || {}) };
  Object.keys(e).forEach((k) => { if (e[k] !== undefined) uj[k] = e[k]; });
  if (JSON.stringify(uj) === JSON.stringify(r.ertekek || null)) return false;
  r.ertekek = uj;
  if ((r.magiapont === null || r.magiapont === undefined) && Number.isFinite(Number(uj.magiapont_max)) && Number(uj.magiapont_max) > 0) r.magiapont = Number(uj.magiapont_max);
  return true;
}

// Mágiapont beállítása (0 és a maximum között).
export function magiapontBeallitas(cs, id, ertek) {
  const r = resztvevo(cs, id);
  if (!r) return cs;
  const max = r.ertekek && Number.isFinite(Number(r.ertekek.magiapont_max)) ? Number(r.ertekek.magiapont_max) : Infinity;
  r.magiapont = Math.max(0, Math.min(max, Math.round(szam(ertek))));
  return cs;
}

// A lépés során megváltozott karakter-értékek (a háttér ezeket a karakter állapotába írja):
// { [karakter id]: { egeszseg, magiapont? } }.
export function karakterValtozasok(elotte, utana) {
  const ki = {};
  (utana.resztvevok || []).forEach((r) => {
    if (r.forras.tipus !== 'karakter') return;
    const v = (elotte.resztvevok || []).find((x) => x.id === r.id);
    const mpValt = r.magiapont !== null && r.magiapont !== undefined && (!v || v.magiapont !== r.magiapont);
    if (!v || v.egeszseg !== r.egeszseg || mpValt) {
      ki[r.forras.id] = { egeszseg: r.egeszseg };
      if (r.magiapont !== null && r.magiapont !== undefined) ki[r.forras.id].magiapont = r.magiapont;
    }
  });
  return ki;
}

// ---------------- Összegzés ----------------

export function csataOsszegzes(cs) {
  const oldalak = (cs.oldalak || []).map((o) => {
    const tagok = cs.resztvevok.filter((r) => r.oldal === o.id && !r.rejtett);
    return { id: o.id, nev: o.nev, harcol: tagok.filter((r) => r.allapot === 'aktiv').length, osszes: tagok.length };
  });
  return {
    oldalak,
    kiesettek: cs.resztvevok.filter((r) => r.allapot === 'kiesett' || r.allapot === 'halott').map((r) => r.nev),
    haldoklok: cs.resztvevok.filter((r) => r.allapot === 'haldoklik').map((r) => r.nev),
    serultek: cs.resztvevok.filter((r) => r.allapot === 'aktiv' && r.egeszseg < r.egeszseg_max).map((r) => r.nev),
    rejtettek: cs.resztvevok.filter((r) => r.rejtett).map((r) => r.nev)
  };
}

// A soron lévő és a következő nevei (a fejléchez).
export function kovetkezoNev(cs) {
  if (cs.allapot !== 'fut') return '';
  const proba = masol({ ...cs, naplo: [], visszavonas: [] });
  kovetkezo(proba);
  const r = resztvevo(proba, proba.soron);
  return r ? (proba.kor > cs.kor ? `${r.nev} (új kör)` : r.nev) : '';
}
