// Kampányépítő, 3. fejezet: jelenetek (Building Encounters). Tiszta függvények és a könyv szerinti állandók
// (rövid saját magyar összefoglalók, a könyv szövege nélkül). A jelenet saját mezői az elem adatában vannak, mezőnként
// öröklődnek (elem.js), a listás és összetett mezők egészben. Terv: claude/kampanyepito-terv.md, „3. fejezet”.
import { index, megjelenitett } from './elem.js';
import { kalandJelenetei, jelenetFelold } from './kaland.js';
import { KIHIVAS_TIPUSOK, kihivasArany } from './keret.js';
import { ujUrlap, probaCim, probaFeltetel } from '../jatek/probakeres.js';

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const van = (x) => !!szoveg(x).trim();
const egesz = (x, min, max, alap) => {
  const n = Number(x);
  if (x === '' || x === null || x === undefined || !Number.isFinite(n)) return alap;
  return Math.max(min, Math.min(max, Math.round(n)));
};

// A tervezés lépései a könyv sorrendjében (a jelenet szerkesztőjének lépései; oldalszám a könyv szerint).
// A típus a könyvben a 2. lépés után dől el („közelebb visz a típus kiválasztásához”), ezért ott áll.
export const JELENET_LEPESEK = {
  otlet: { nev: '1. Ötletelés', en: 'Brainstorm the Encounter', oldal: '37',
    utmutato: 'Írj fel minél több ötletet a jelenethez, ítélkezés nélkül: a mennyiség most fontosabb a minőségnél. Utána nézd át, mit lehet összekapcsolni, és válaszd ki, ami kell; a többi jó lesz máskor.' },
  hely: { nev: '2. Helye a történetben', en: 'Define its Place in the Story, Defining the Stakes', oldal: '37',
    utmutato: 'Mi a jelenet célja? Sorsdöntő a történetben, vagy egy karakter hátteréhez tartozik? Mi vezetett ide? És a tét: mi történik, ha a hősök kudarcot vallanak, és próbálkozhatnak-e újra? Egyalkalmas játéknál ez kihagyható.' },
  tipus: { nev: 'A jelenet típusa', en: 'Encounter Types, Using Encounters', oldal: '32–36',
    utmutato: 'A típus a jelenet fókuszát adja meg: harc és beszélgetés egy felfedező jelenetben is lehet, de a cél a felfedezés marad. Két vagy több típus együtt vegyes (hibrid) jelenet, két céllal. Váltogasd a típusokat, hogy mindenki megtalálja a kedvére valót.' },
  konfliktus: { nev: '3. A konfliktus', en: 'Define the Conflict', oldal: '37',
    utmutato: 'Mi a csapat célja, mi áll az útjában, és miért? A „miért” mutatja meg a más utakat: a pénzért harcoló zsoldost meg lehet vesztegetni, az ősei sírját védő harcost aligha. Egy jelenetben több konfliktus is lehet, akár a csapaton belül is.' },
  megoldas: { nev: '4. A konfliktus megoldása', en: 'Determine How to Resolve the Conflict', oldal: '37–38',
    utmutato: 'Nézd meg a konfliktust több oldalról: hogyan oldhatják meg, mi a siker és a kudarc feltétele, mi történik kudarc után. Legyen egynél több út. Ha a csapat mást talál ki, és van esélye, igazítsd hozzá a jelenetet.' },
  kihivasok: { nev: '5. A kihívások részletei', en: 'Detail the Challenges', oldal: '38–39',
    utmutato: 'A konfliktus játékszabályokban: ellenfelek, csapdák, veszélyek, akadályok. A legfontosabb az egyensúly. Harcnál a lények fenyegetési szintje csak tájékoztató; a próbáknál nézd meg a karakterlapokat, mekkora Célérték kihívás nekik.' },
  szinter: { nev: '6. A színtér', en: 'Set the Scene', oldal: '39',
    utmutato: 'Előbb a lényeges részletek (hány ellenfél, nyilvánvaló veszélyek, fények, a táj fő elemei), utána a hőmérséklet, a szagok, a hangok. Ebből két-három mondat felolvasandó szöveg elég. Ha a helynek több része van, mindegyikhez írj pár sort.' },
  terkep: { nev: '7. Térkép', en: 'Draw a Map', oldal: '39',
    utmutato: 'Harcnál és felfedezésnél különösen hasznos. Jelöld a fontos pontokat: ellenfelek, csapdák, veszélyek, titkos ajtók. A kép a Drive-ra kerül, a jelölések szövegesen a térkép mellé.' },
  jutalmak: { nev: '8. Jutalmak', en: 'Determine the Rewards', oldal: '39–40',
    utmutato: 'Az XP a nehézség szerint (Alapkönyv), de a végén az számít, hogyan zajlott: az ügyesen elkerült nehéz jelenet is járjon jutalommal. A kincset és a tárgyakat lehetőleg a karakterekre szabd, és nevezd meg, kinek szól.' }
};

// A jelenet típusai (Encounter Types). A könyv tanácsai a típusokhoz (Encounter Type Guidelines, 40–41. oldal).
export const JELENET_TIPUSOK = {
  uldozes: { nev: 'Üldözés', en: 'Chase', oldal: '33–34', kihivas: '',
    leiras: 'Az egyik fél el akarja kapni a másikat. Ellenpróbák (általában Szívósság (Futás)), aki előbb gyűjt öt sikert, nyer.',
    tanacs: 'Az izgalmat a környezet adja: akadályok mindkét félnek, és rövidítések (egy-két automatikus siker egy sikeres próbáért).' },
  harc: { nev: 'Harc', en: 'Combat', oldal: '34', kihivas: 'harc',
    leiras: 'Küzdelem az ellenfelekkel. Érdekes terep és szokatlan taktika nélkül hamar egyhangúvá válik.',
    tanacs: 'Kik az ellenfelek, mit akarnak, meddig harcolnak? Ebből derül ki, lehet-e velük alkudni. Utána a terep: akadályok, veszélyek, lehetőségek mindkét félnek.' },
  felfedezes: { nev: 'Felfedezés', en: 'Exploration', oldal: '34–35', kihivas: 'felfedezes',
    leiras: 'Városok, romok, barlangok felderítése, rejtvények: az öröm az akadályok legyőzéséből és a felfedezésből jön.',
    tanacs: 'Mit akarnak felfedezni, és mit kell tenniük érte? Megéri-e a kockázatot a jutalom? Miért van ott a csapda vagy a szörny, mit véd? Kell egy egyszerű térkép.' },
  veszely: { nev: 'Veszély', en: 'Hazard', oldal: '35', kihivas: '',
    leiras: 'Egy nagy természeti erő (erdőtűz, földrengés, vihar) maga a jelenet: nem lehet vele alkudni, és nehéz kikerülni.',
    tanacs: 'Személyesítsd meg a leírásban: a tűz „úgy bömböl, mint egy sárkány”. A hősök búvóhelyet keresnek, vagy bajba jutottakat mentenek.' },
  szerepjatek: { nev: 'Szerepjáték', en: 'Roleplaying', oldal: '35', kihivas: 'szerepjatek',
    leiras: 'A szereplők szavakkal érik el a céljukat. A próbák itt is előkerülnek; a szerényebb játékos elmondhatja, mit akar a karaktere, és dobhat.',
    tanacs: 'Mit akar az NJK, kinek az oldalán áll, mit nyer vagy veszít, mit érez a hősök iránt? Ha valamelyik fél elérte a célját, zárd le, amíg friss.' }
};
export const TIPUS_KULCSOK = Object.keys(JELENET_TIPUSOK);

// A harc két különleges formája (Battles, Duels).
export const HARC_FAJTAK = {
  '': 'Szokásos harc',
  csata: 'Csata, hadak között (Battles)',
  parbaj: 'Párbaj (Duels)'
};

// A jelenet viszonya a történethez (Encounter Purpose, One-Off, Incidental Encounters).
export const JELLEGEK = {
  tortenet: { nev: 'A történet része', en: 'Encounter Purpose', oldal: '32', leiras: 'Előre viszi a történetet vagy a csapat céljait. A jelenetek többsége ilyen legyen.' },
  egyszeri: { nev: 'Egyszeri', en: 'One-Off Encounters', oldal: '32–33', leiras: 'Független a fő száltól: véletlen találkozás, pihenő egy nehéz rész után, egy kis akció. Később akár új mellékszál is indulhat belőle.' },
  mellekes: { nev: 'Mellékes', en: 'Incidental Encounters', oldal: '33', leiras: 'Bolt, fogadós, őrség: röviden lezárható, hacsak nincs benne valódi nyereség (információ, szövetséges).' }
};

// Újrapróbálható-e kudarc után (Defining the Stakes).
export const UJRAPROBAK = {
  '': 'nincs megadva',
  igen: 'Újrapróbálható',
  mashogy: 'Csak más úton vagy később',
  nem: 'Nincs második esély'
};

// A megoldási utak gyakori módjai (a könyv példái), csipként; saját is írható.
export const MEGOLDAS_MODOK = ['harc', 'megvesztegetés', 'megfélemlítés', 'meggyőzés', 'megtévesztés', 'lopakodás', 'kikerülés', 'nyomozás', 'varázslat'];

// A nem harci kihívások fajtái (Detail the Challenges).
export const KIHIVAS_FAJTAK = {
  csapda: 'Csapda',
  veszely: 'Veszély',
  akadaly: 'Akadály',
  rejtveny: 'Rejtvény',
  egyeb: 'Egyéb'
};

// A jelenet résztvevői, ha nincs (vagy még nincs) összecsapás hozzá: honnan jön a lény.
export const LENY_FORRASOK = { szorny: 'Bestiárium', njk: 'NJK-tár', szabad: 'Szabad leírás' };

// Az XP-besorolás (Alapkönyv 117–118.), a karakterlap XP-kiosztásával azonos kulcsokkal.
export const NEHEZSEGEK = {
  rutin: { nev: 'Rutin', xp: 0 },
  konnyu: { nev: 'Könnyű', xp: 100 },
  kozepes: { nev: 'Közepes', xp: 250 },
  nehez: { nev: 'Nehéz', xp: 400 }
};
// Az összecsapás-építő becslése (web/js/jatek/osszecsapas.js NEHEZSEGEK) az XP-besorolásra fordítva.
const BECSLES_NEHEZSEG = { 'Könnyű': 'konnyu', 'Átlagos': 'kozepes', 'Nehéz': 'nehez', 'Nagyon nehéz': 'nehez' };
export const becslesbolNehezseg = (becsles) => BECSLES_NEHEZSEG[becsles] || '';

// ---------- Mezők normalizálása (régi, importált vagy hiányos adat is biztonságosan olvasható) ----------

export const tipusokOf = (adat) => Array.from(new Set(lista(obj(adat).tipusok).filter((t) => JELENET_TIPUSOK[t])));
export const jellegOf = (adat) => (JELLEGEK[obj(adat).jelleg] ? obj(adat).jelleg : 'tortenet');

// „Harc + Szerepjáték (vegyes)”; típus nélkül üres.
export function tipusFelirat(tipusok) {
  const t = (tipusok || []).filter((x) => JELENET_TIPUSOK[x]);
  if (!t.length) return '';
  return t.map((x) => JELENET_TIPUSOK[x].nev).join(' + ') + (t.length > 1 ? ' (vegyes)' : '');
}

export function konfliktusokNorm(x) {
  return lista(x).map((k, i) => {
    const o = obj(k);
    return { id: szoveg(o.id) || 'kf' + (i + 1), cel: szoveg(o.cel), akadaly: szoveg(o.akadaly), miert: szoveg(o.miert) };
  });
}

export function megoldasokNorm(x) {
  return lista(x).map((m, i) => {
    const o = obj(m);
    return { id: szoveg(o.id) || 'mo' + (i + 1), mod: szoveg(o.mod), szoveg: szoveg(o.szoveg), konfliktus_id: szoveg(o.konfliktus_id) };
  });
}

export function kihivasokNorm(x) {
  return lista(x).map((k, i) => {
    const o = obj(k);
    return { id: szoveg(o.id) || 'kh' + (i + 1), fajta: KIHIVAS_FAJTAK[o.fajta] ? o.fajta : 'egyeb', nev: szoveg(o.nev), leiras: szoveg(o.leiras) };
  });
}

export function lenyekNorm(x) {
  return lista(x).map((l, i) => {
    const o = obj(l);
    return { id: szoveg(o.id) || 'ly' + (i + 1), forras: LENY_FORRASOK[o.forras] ? o.forras : 'szabad', ref_id: szoveg(o.ref_id),
      nev: szoveg(o.nev), db: egesz(o.db, 1, 99, 1), jegyzet: szoveg(o.jegyzet) };
  });
}

export function teruletekNorm(x) {
  return lista(x).map((t, i) => {
    const o = obj(t);
    return { id: szoveg(o.id) || 'tr' + (i + 1), nev: szoveg(o.nev), leiras: szoveg(o.leiras) };
  });
}

export function erzekekNorm(x) {
  const o = obj(x);
  return { homerseklet: szoveg(o.homerseklet), szagok: szoveg(o.szagok), hangok: szoveg(o.hangok), fenyek: szoveg(o.fenyek) };
}

// A térkép jelölései: „A: az őrszoba, két íjász”.
export function jelolesekNorm(x) {
  return lista(x).map((j, i) => {
    const o = obj(j);
    return { id: szoveg(o.id) || 'jl' + (i + 1), jel: szoveg(o.jel) || String(i + 1), szoveg: szoveg(o.szoveg) };
  });
}

// A képek (közös mező minden elemen): a Drive-fájlok azonosítói, felirat, és hogy térkép-e.
export function kepekNorm(x) {
  return lista(x).map((k) => {
    const o = obj(k);
    return { kep: szoveg(o.kep), belyeg: szoveg(o.belyeg) || szoveg(o.kep), cim: szoveg(o.cim), terkep: o.terkep === true,
      szel: egesz(o.szel, 0, 10000, 0), mag: egesz(o.mag, 0, 10000, 0) };
  }).filter((k) => k.kep);
}
export const terkepek = (kepek) => kepekNorm(kepek).filter((k) => k.terkep);

// Az előkészített próba: a DM próbakérésének mezői (web/js/jatek/probakeres.js ujUrlap), címzettek és karakterenkénti
// módosítók nélkül (azok a játék közbeni kiküldéskor dőlnek el, 6. lépés), és hogy mikor kerül elő.
const PROBA_MEZOK = ['tipus', 'cim', 'tulajdonsag', 'fokuszok', 'fokusz_kotelezo', 'celertek', 'celertek_rejtett', 'kuszob', 'haladas',
  'idoegyseg', 'mutatvany_engedett', 'ellenfel_nev', 'ellenfel_bonusz'];
export function probaNorm(x, i) {
  const o = obj(x);
  const alap = ujUrlap({}, ['alap', 'ellen', 'osszetett', 'titkos'].includes(o.tipus) ? o.tipus : 'alap');
  const ki = { id: szoveg(o.id) || 'pr' + ((i || 0) + 1), mikor: szoveg(o.mikor) };
  PROBA_MEZOK.forEach((m) => { ki[m] = o[m] === undefined ? alap[m] : o[m]; });
  ki.fokuszok = lista(ki.fokuszok).map(szoveg).filter(Boolean);
  ki.fokusz_kotelezo = ki.fokusz_kotelezo === true;
  ki.celertek_rejtett = ki.celertek_rejtett !== false;
  ki.mutatvany_engedett = ki.mutatvany_engedett !== false;
  return ki;
}
export const probakNorm = (x) => lista(x).map(probaNorm);

// A próbakérés űrlapja egy előkészített próbából (a kiküldéshez és a szerkesztéshez): mindenkinek, módosítók nélkül.
export function probaUrlap(p) {
  const n = probaNorm(p);
  const u = ujUrlap({}, n.tipus);
  PROBA_MEZOK.forEach((m) => { u[m] = n[m]; });
  return { ...u, cimzettek: 'mindenki', modositok: {} };
}
// Az űrlapból vissza az előkészített próba (a címzettek és módosítók elhagyásával).
export function urlapbolProba(u, id, mikor) {
  const ki = { id, mikor: szoveg(mikor) };
  PROBA_MEZOK.forEach((m) => { ki[m] = u[m]; });
  return probaNorm(ki);
}
// A próba rövid leírása a listához: „Észlelés (Keresés) · Célérték 13 (Kihívó), rejtett”.
export function probaOsszegzes(p, fokuszNev) {
  const n = probaNorm(p);
  const cim = szoveg(n.cim).trim() || (n.tulajdonsag ? probaCim(n.tulajdonsag, n.fokuszok, fokuszNev) : 'Próba, még tulajdonság nélkül');
  const feltetel = probaFeltetel({ ...n, celertek: n.tipus === 'ellen' ? '' : n.celertek, mutatvany: { engedett: n.mutatvany_engedett },
    ellenfel: n.tipus === 'ellen' && van(n.ellenfel_nev) ? { nev: n.ellenfel_nev, bonusz: n.ellenfel_bonusz } : '' }, { dm: true });
  return { cim, feltetel };
}

export function jutalomNorm(adat) {
  const a = obj(adat);
  return { nehezseg: NEHEZSEGEK[a.nehezseg] ? a.nehezseg : '', xp_jegyzet: szoveg(a.xp_jegyzet), kincs: szoveg(a.kincs),
    targyak: szoveg(a.targyak), egyeb_jutalom: szoveg(a.egyeb_jutalom) };
}
export const jelenetXp = (adat) => (NEHEZSEGEK[obj(adat).nehezseg] ? NEHEZSEGEK[obj(adat).nehezseg].xp : null);

// ---------- Ellenőrzések (a könyv tanácsai, nem szabályok) ----------

export function figyelmeztetesek(adat) {
  const a = obj(adat);
  const ki = [];
  const konf = konfliktusokNorm(a.konfliktusok).filter((k) => van(k.cel) || van(k.akadaly));
  const megold = megoldasokNorm(a.megoldasok).filter((m) => van(m.mod) || van(m.szoveg));
  if (konf.length && megold.length < 2) {
    ki.push({ lepes: 'megoldas', szoveg: 'A könyv szerint egy jelenetnek legyen több lehetséges megoldása is (például harc mellett megvesztegetés vagy kikerülés).' });
  }
  konf.forEach((k, i) => {
    if (!van(k.miert) && (van(k.cel) || van(k.akadaly))) ki.push({ lepes: 'konfliktus', szoveg: 'A(z) ' + (i + 1) + '. konfliktusnál hiányzik a „miért”: ebből derülnek ki a harc nélküli utak.' });
  });
  if (megold.length && konf.length > 1) {
    const kotott = new Set(megold.map((m) => m.konfliktus_id).filter(Boolean));
    if (kotott.size) konf.filter((k) => !kotott.has(k.id)).forEach((k) => ki.push({ lepes: 'megoldas', szoveg: 'Ehhez a konfliktushoz még nincs megoldási út: ' + (k.cel || k.akadaly).slice(0, 60) + '.' }));
  }
  if (a.kiegyensulyozatlan === true && !van(a.kiegyensulyozatlan_ok)) {
    ki.push({ lepes: 'megoldas', szoveg: 'Szándékosan kiegyensúlyozatlan jelenet: a könyv szerint előre jelezd a veszélyt, és legyen kerülőút vagy menekülés.' });
  }
  if (tipusokOf(a).includes('felfedezes') && !terkepek(a.kepek).length && !jelolesekNorm(a.terkep_jelolesek).length) {
    ki.push({ lepes: 'terkep', szoveg: 'Felfedező jelenethez a könyv egy egyszerű térképet javasol (a fontos helyekkel, titkos ajtókkal).' });
  }
  return ki;
}

// A lépések kitöltöttsége ('ures' | 'resz' | 'kesz') a szerkesztő lépéslistájához.
export function lepesAllapot(adat) {
  const a = obj(adat);
  const allapot = (db, ossz) => (db === 0 ? 'ures' : db >= ossz ? 'kesz' : 'resz');
  const konf = konfliktusokNorm(a.konfliktusok);
  const meg = megoldasokNorm(a.megoldasok);
  const e = erzekekNorm(a.erzekek);
  return {
    otlet: lista(a.otletek).length || van(a.otlet_jegyzet) ? 'kesz' : 'ures',
    hely: allapot([a.tortenetben, a.tet].filter(van).length + (a.ujraproba ? 1 : 0), 3),
    tipus: tipusokOf(a).length ? 'kesz' : 'ures',
    konfliktus: !konf.length ? 'ures' : konf.every((k) => van(k.cel) && van(k.akadaly) && van(k.miert)) ? 'kesz' : 'resz',
    megoldas: allapot((meg.length ? 1 : 0) + (meg.length > 1 ? 1 : 0) + (van(a.siker) || van(a.kudarc) ? 1 : 0), 3),
    kihivasok: a.osszecsapas_id || probakNorm(a.probak).length || kihivasokNorm(a.kihivasok).length || lenyekNorm(a.lenyek).length ? 'kesz' : 'ures',
    szinter: allapot([a.fontos_reszletek, a.felolvasando, Object.values(e).some(van) ? 'x' : ''].filter(van).length, 3),
    terkep: terkepek(a.kepek).length || jelolesekNorm(a.terkep_jelolesek).length ? 'kesz' : 'ures',
    jutalmak: allapot([a.nehezseg, a.kincs || a.targyak || a.egyeb_jutalom].filter(van).length, 2)
  };
}

// ---------- A jelenettípusok aránya (Varying Encounters) ----------

// jelenetek: elemek (a megjelenített adatukkal számol). A vegyes jelenet súlya egyenlően oszlik a típusai közt.
// Visszaad: { db, tipizalt, vegyes, szamok: { tipus: jelenetek száma }, sulyok, szazalek: { tipus: % a típusos jelenetekből } }.
export function tipusArany(jelenetek, ix) {
  const szamok = {};
  const sulyok = {};
  TIPUS_KULCSOK.forEach((t) => { szamok[t] = 0; sulyok[t] = 0; });
  let tipizalt = 0;
  let vegyes = 0;
  (jelenetek || []).forEach((j) => {
    const t = tipusokOf(megjelenitett(j, ix));
    if (!t.length) return;
    tipizalt++;
    if (t.length > 1) vegyes++;
    t.forEach((x) => { szamok[x]++; sulyok[x] += 1 / t.length; });
  });
  const szazalek = {};
  TIPUS_KULCSOK.forEach((t) => { szazalek[t] = tipizalt ? Math.round((sulyok[t] / tipizalt) * 100) : 0; });
  return { db: (jelenetek || []).length, tipizalt, vegyes, szamok, sulyok, szazalek };
}

// A tervezett arány (a kampánykeret „Az út kihívásai” súlyai) és a jelenetek tényleges aránya a három alaptípusra
// (harc, felfedezés, szerepjáték; az Alapkönyv három típusa). Visszaad: [{ kulcs, nev, terv, teny, elteres }] vagy [].
export function kihivasOsszevetes(arany, keret) {
  const ossz = KIHIVAS_TIPUSOK.reduce((n, k) => n + (arany.sulyok[k.kulcs] || 0), 0);
  if (!ossz) return [];
  const terv = kihivasArany(keret);
  return KIHIVAS_TIPUSOK.map((k) => {
    const teny = Math.round(((arany.sulyok[k.kulcs] || 0) / ossz) * 100);
    return { kulcs: k.kulcs, nev: k.nev, terv: terv[k.kulcs], teny, elteres: teny - terv[k.kulcs] };
  });
}

// Egymás utáni azonos típusú jelenetek (a fa sorrendjében): háromtól jelez (Varying Encounters).
export function egyhanguSorok(jelenetek, ix) {
  const ki = [];
  let elozo = '';
  let kezdet = 0;
  let db = 0;
  const lezar = (i) => { if (db >= 3 && elozo) ki.push({ tol: kezdet, ig: i - 1, tipus: elozo, db }); };
  (jelenetek || []).forEach((j, i) => {
    const t = tipusokOf(megjelenitett(j, ix)).slice().sort().join('+');
    if (t && t === elozo) { db++; return; }
    lezar(i);
    elozo = t; kezdet = i; db = t ? 1 : 0;
  });
  lezar((jelenetek || []).length);
  return ki.map((x) => ({ ...x, szoveg: x.db + ' egymás utáni jelenet azonos típusú (' + tipusFelirat(x.tipus.split('+')) + '), a ' + (x.tol + 1) + '. jelenettől. A könyv a típusok váltogatását javasolja.' }));
}

// A kampány jelenetei a kalandjai sorrendjében (az aktív kalandok, a fa sorrendjében).
export function kampanyJelenetei(kalandok, elemek, ix) {
  const i = ix || index(elemek);
  return (kalandok || []).flatMap((k) => kalandJelenetei(k, elemek, i));
}

// ---------- Ütemek és jelenetek ----------

// A kaland ütemsora kiegészítve: az ütem nagy csatának számít, ha a hozzá kötött jelenet nagy csata (set piece).
// sor: kaland.js utemSor eredménye. Új sort ad, az ütemen jelenet_csata jelöléssel.
export function utemSorJelenettel(sor, kaland, elemek, ix) {
  return (sor || []).map((x) => {
    const j = jelenetFelold(x.utem.jelenet_id, kaland, elemek, ix);
    const nagy = !!j && megjelenitett(j, ix).nagy_csata === true;
    return nagy && !x.utem.nagy_csata ? { ...x, utem: { ...x.utem, nagy_csata: true, jelenet_csata: true } } : x;
  });
}
