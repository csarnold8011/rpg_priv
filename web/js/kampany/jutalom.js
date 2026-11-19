// Kampányépítő, 6. fejezet: jutalmak (Building Rewards), a Companion haladó jutalmaival (címek, tagságok, ereklyék) és az
// Alapkönyv 10. fejezetével (mágikus tárgyak, kincs). Tiszta függvények és a könyvek szerinti állandók (rövid saját magyar
// összefoglalók, a könyvek szövege nélkül). A jutalom elem saját mezői az elem adatában vannak, mezőnként öröklődnek
// (elem.js), a listák egészben. Itt csak a terv készül: a kiosztás és a karakterlapra írás a 6. lépés.
// Terv: claude/kampanyepito-terv.md, „6. fejezet”.
import { IVEK } from './keret.js';
import { general, tablaKeres, kockaDobas, bejar } from './generator.js';

const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const szoveg = (x) => (x === null || x === undefined ? '' : String(x));
const van = (x) => !!szoveg(x).trim();
const szam = (x, alap = null) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));

export const MAGIKUS_TABLA = 'dt_magikus_tulajdonsag';
export const CIM_MINTAK = 'dt_minta_cim';
export const TARS_MINTAK = 'dt_tars_minta';
export const EREKLYE_MINTAK = 'dt_ereklye_kepesseg';

// A jutalom fajtái (a munkalap jutalomtérképének oszlopai, 72–78. oldal).
export const FAJTAK = {
  cim: { nev: 'Cím', tobbes: 'Címek', en: 'Honorifics', oldal: '72–74',
    leiras: 'Kitüntető név, titulus vagy hírnév, amely valódi játékbeli előnnyel jár (bónusz egy próbafajtára, büntetés az ellenfeleknek vagy alkalmanként egyszeri különleges előny).' },
  tagsag: { nev: 'Tagság', tobbes: 'Tagságok', en: 'Membership', oldal: '74–75',
    leiras: 'Felvétel egy szervezetbe és előrelépés a rangjaiban (újonc, megbecsült tag, vezető, esetleg följebb): erőforrás, befolyás, információ, de kötelességek is.' },
  tars: { nev: 'Társ', tobbes: 'Társak', en: 'Companions', oldal: '75–77',
    leiras: 'Egy NJK (vagy állat), aki hűséggel és szolgálattal tartozik egy hősnek vagy a csapatnak. Néhány tulajdonság és fókusz, és hasznos feladatok, amelyeket magától elvégez.' },
  targy: { nev: 'Mágikus tárgy', tobbes: 'Mágikus tárgyak', en: 'Magic Items', oldal: '77–78',
    leiras: 'Ideiglenes (egyszer használatos) vagy állandó tárgy egy-két előnnyel; a ritkasága a szintsávhoz illeszkedjen. Az ereklye a Companion szerint a viselőjével együtt erősödik.' },
  kincs: { nev: 'Kincs', tobbes: 'Kincsek', en: 'Wealth and Treasure', oldal: '77–78',
    leiras: 'Pénz és értéktárgyak a kincskategória szerint; a magasabb kategóriák értékét érdemes kisebb, hordozható értékekbe (ékszer, drágakő, műtárgy) sűríteni.' }
};
export const FAJTA_KULCSOK = Object.keys(FAJTAK);
export const fajtaOf = (a) => (FAJTAK[obj(a).fajta] ? obj(a).fajta : '');

// A mágikus tárgyak ritkasága (Alapkönyv 119.); rang szerint növekvő.
export const RITKASAGOK = {
  gyakori: { nev: 'Gyakori', en: 'Common', rang: 0, leiras: 'Szinte mindig ideiglenes, könnyen készül, néhol meg is vehető.' },
  ritkas: { nev: 'Ritkás', en: 'Uncommon', rang: 1, leiras: 'Kincsként vagy küldetés jutalmaként kerül elő; ritkán és drágán árulják.' },
  ritka: { nev: 'Ritka', en: 'Rare', rang: 2, leiras: 'Feltűnést kelt; szinte sosem eladó, kalandból vagy rejtett kincsből jön.' },
  legendas: { nev: 'Legendás', en: 'Legendary', rang: 3, leiras: 'Egyedi, egy pályafutás alatt legfeljebb egy; nagy küldetések tárgya.' }
};
const RITKASAG_SOR = ['gyakori', 'ritkas', 'ritka', 'legendas'];

// A kincskategóriák (Alapkönyv 118.): az érték ezüstben, kockával és szorzóval.
export const KINCS_KATEGORIAK = {
  csekely: { nev: 'Csekély', en: 'Trifling', kocka: '1d6', szorzo: 1 },
  szereny: { nev: 'Szerény', en: 'Paltry', kocka: '3d6', szorzo: 1 },
  kozepes: { nev: 'Közepes', en: 'Middling', kocka: '2d6', szorzo: 10 },
  jelentos: { nev: 'Jelentős', en: 'Substantial', kocka: '2d6', szorzo: 100 },
  boseges: { nev: 'Bőséges', en: 'Abundant', kocka: '4d6', szorzo: 100 },
  fenyuzo: { nev: 'Fényűző', en: 'Lavish', kocka: '6d6', szorzo: 100 }
};
export const kincsKepletSzoveg = (k) => { const x = KINCS_KATEGORIAK[k]; return x ? x.kocka + (x.szorzo > 1 ? ' × ' + x.szorzo : '') + ' ezüst' : ''; };

// A szintsávok (Character Achievement Levels, 70. oldal) a kampánykeret íveivel azonosak; mellettük a könyv szerint
// illő tárgyritkaság (77. oldal), kincskategória (78. oldal) és a szintek mérföldkövei (71. oldal).
export const SAVOK = IVEK.map((iv) => ({ ...iv }));
export const SAV_RITKASAG = { kezdo: ['gyakori'], gyakorlott: ['gyakori', 'ritkas'], szakerto: ['ritkas'], mester: ['ritka'], legendas: ['legendas'] };
export const SAV_KINCS = { kezdo: ['csekely', 'szereny'], gyakorlott: ['kozepes'], szakerto: ['jelentos'], mester: ['boseges'], legendas: ['fenyuzo'] };
export const SAV_MERFOLDKO = {
  kezdo: 'A 4. szint végén jön az első specializáció: az ehhez kötődő tagságot (rend, céh) a 3. szint körül érdemes felkínálni.',
  gyakorlott: 'A 8. szint végére a specializáció mesterfokig juthat; a hősöknek már múltjuk van, így illenek hozzájuk a címek és a titulusok.',
  szakerto: 'A 12. szinten a tolvaj Csúszós, a harcos Veterán képességet kap, a mágus elkezdheti a második specializációt: a valódi mesterség kezdete. A szakértelmet jelző cím ettől a sávtól illik.',
  mester: 'A mester sáv a szakértelemből a mesterségbe vezet; a ritka tárgyak és a nagy szervezetek vezetői rangja ide illik.',
  legendas: 'A 18. szinttől minden osztály jelentős képességeket kap, a 20. szinten epikusat; a jutalmak itt már a világot formálják (10. fejezet, epikus jutalmak).'
};
export const savOf = (k) => SAVOK.find((s) => s.kulcs === k) || null;

// Mire szolgál a jutalom (Using Rewards, 69–70. oldal). Több is lehet.
export const SZEREPEK = {
  cel: { nev: 'Cél', en: 'Rewards as Goals', oldal: '70', leiras: 'Amire a hős tudatosan törekszik: ehhez a karakternek tudnia kell róla, legalább mint lehetőségről. Elérése után új célt nyithat (előrelépés, az ereklye további titkai).' },
  elismeres: { nev: 'Elismerés', en: 'Rewards as Achievements', oldal: '70', leiras: 'Emlékeztet arra, mit vittek véghez a hősök; a címek a legtisztább ilyenek, de a tagság rangja is ide tartozik.' },
  eroforras: { nev: 'Erőforrás', en: 'Rewards as Resources', oldal: '70–71', leiras: 'Játékbeli előnyt ad, ezért nem érdemes ötletszerűen osztani. Elfogyhat, elveszhet, visszavonható, vagy átmenetileg elérhetetlen lehet (például távoli földön).' }
};

// Hogyan nyílik meg (Unlocking Rewards, 71–72. oldal). A „történet” saját kiegészítés a könyv első mondata szerint.
export const MEGNYITASOK = {
  tortenet: { nev: 'A történet hozza', en: 'Unlocking Rewards', oldal: '71', leiras: 'Egy esemény nyomán egyszerűen megtörténik (például megtalálják az elveszett kincset).' },
  hangolodas: { nev: 'Ráhangolódás', en: 'Attunement', oldal: '71', leiras: 'A tárgy csak idővel (percek, napok, akár egy holdhónap) vagy szertartással, összetevőkkel, összetett próbával adja ki az előnyeit.' },
  adomanyozas: { nev: 'Adományozás', en: 'Bestowal', oldal: '71', leiras: 'Valaki adja: uralkodó, nemes, egy szervezet vezetői vagy természetfeletti lény. Feltételekkel járhat (eskü, kötelesség), és az adományozó vissza is vonhatja.' },
  kepzes: { nev: 'Képzés', en: 'Training', oldal: '72', leiras: 'Idő (általában két kaland között) és erőforrás (mester, könyv, eszköz, hely) kell hozzá; a mester megtalálása maga is jutalom lehet. Próbához is köthető.' }
};

// A cím fajtái (Companion 58–59., Kampányépítő 73.) és a hatás módjai (73. oldal).
export const CIM_FAJTAK = {
  hirnev: { nev: 'Hírnév, ragadványnév', leiras: 'A hős tetteiből születő név, amelyet mások adnak (Goblinölő, Hordatörő).' },
  nemesi: { nev: 'Nemesi cím', leiras: 'Örökölt vagy adományozott (lovag, báró); birtokkal, jövedelemmel és kötelességgel járhat.' },
  szakmai: { nev: 'Szakmai cím', leiras: 'Céhek, hadseregek, szervezetek adják (mester, kapitány); néhol megvásárolható.' },
  vallasi: { nev: 'Vallási cím', leiras: 'Az egyház vagy maga az istenség adja („kiválasztott”).' },
  magikus: { nev: 'Mágikus cím', leiras: 'A mágia mesterségének rangja, egy rend vagy iskola hierarchiájában.' },
  teljesitmeny: { nev: 'Teljesítményen alapuló cím', leiras: 'Egy ritka tettért jár (szörny legyőzése, ritka tárgy megszerzése), gyakran más címmel együtt.' }
};
export const CIM_HATASOK = {
  bonusz: { nev: 'Bónusz próbákra', leiras: '+1 tág helyzetre (minden társasági próba egy csoporttal), +2 gyakori, de szűkebb helyzetre (élőholtak ellen, goblinok nyomában), +3 egészen szűkre.' },
  ellenfel: { nev: 'Büntetés az ellenfeleknek', leiras: 'Az ellenfél kap büntetést (például −1 Akaraterő (Morál) egy híres harcos ellen), vagy a hős egy büntetést figyelmen kívül hagyhat.' },
  kulonleges: { nev: 'Különleges előny', leiras: 'Egyedi, a cím természetéből fakadó előny; általában alkalmanként egyszer használható, gondosan mérlegelve.' }
};

// A szervezetek típusai (Organization Types, 75. oldal).
export const SZERVEZET_TIPUSOK = {
  ceh: { nev: 'Céh', en: 'Guild', leiras: 'Egy szakma szövetsége: szabályoz, képez, tudást oszt meg. Szakmai tanács, szerszámok, munka, információ.' },
  harci_rend: { nev: 'Harci rend', en: 'Fighting Order', leiras: 'Lovagrend vagy zsoldoscsapat címerrel, parancsláncal. Csapatok, fegyverek, páncél, kiképzés, szállás.' },
  vallasi_rend: { nev: 'Vallási rend', en: 'Religious Order', leiras: 'Papság vagy kolostori közösség. Menedék, a vallás erőforrásai, könyvtárak, a hit mágiája.' },
  titkos: { nev: 'Titkos társaság', en: 'Secret Society', leiras: 'Tiltott kultusz, bűnszervezet, lázadók vagy titkos tudás őrei. Rejtett kapcsolatok és források, de a tagság veszélyes.' },
  egyesulet: { nev: 'Egyesület', en: 'Social Club', leiras: 'Nyíltan működő közös érdeklődésű kör (felfedezők, művészek, politikusok). Szívességek, információ, közös erőforrások.' }
};

// A tagság alap rangjai (Companion 59–60.): a rang előnyei és kötelességei.
export const ALAP_RANGOK = [
  { szint: 1, nev: 'Újonc', elonyok: 'A tagok alapfelszerelése, jelvénye és kiváltságai; számíthat a társaira. Kapcsolat szabálynál 1-es intenzitású kapcsolat a szervezettel.', kotelessegek: 'Segíti a társait, engedelmeskedik a feljebbvalóinak, feladatokat kap.' },
  { szint: 2, nev: 'Megbecsült tag', elonyok: '+2 a tagokkal, +1 a szervezetet tisztelő kívülállókkal szemben, ha a tisztelet számít; több támogatás, mágikus felszerelés igényelhető.', kotelessegek: 'Példát mutat; küldetéseket javasolhat a vezetésnek.' },
  { szint: 3, nev: 'Vezető', elonyok: 'Tagokat vehet fel, gyűlést hívhat össze, irányt szab; kalandonként egyszer a szervezet tagjaiból segítőket hívhat.', kotelessegek: 'Sok elfoglaltság; a rossz vezetőt a szervezet a maga módján eltávolíthatja.' }
];

// A mágikus tárgy fajtái és az előnyök (Alapkönyv 119.; a mágikus tulajdonságok táblája, 80. oldal).
export const TARGY_FAJTAK = { fegyver: 'Fegyver', pancel: 'Páncél', pajzs: 'Pajzs', egyeb: 'Egyéb tárgy' };
export const TARTOSSAG = { allando: 'Állandó', ideiglenes: 'Ideiglenes (egyszer használatos, elfogy)' };
// ertekes: számmal megadott bónusz (+1 ritkás, +2 ritka, +3 legendás, Alapkönyv 119.). alap: a ritkaság, ha nincs szám.
export const ELONY_TIPUSOK = {
  tulajdonsag: { nev: 'Tulajdonság', mire: 'melyik tulajdonság', ertekes: true },
  pancel: { nev: 'Páncélérték', ertekes: true },
  tamadas: { nev: 'Támadás', ertekes: true },
  sebzes: { nev: 'Sebzés', ertekes: true },
  vedekezes: { nev: 'Védekezés', ertekes: true },
  fokusz: { nev: 'Fókusz', mire: 'melyik fókusz (új, vagy +1 a meglévőre)', alap: 'ritkas' },
  talentum: { nev: 'Talentum', mire: 'melyik talentum, hány fok', alap: 'ritkas' },
  mutatvany: { nev: 'Mutatvány', mire: 'melyik mutatvány olcsóbb (vagy egyedi mutatvány)', alap: 'ritkas' },
  varazslat: { nev: 'Varázslat', mire: 'melyik varázslat', alap: 'ritkas' },
  veszely_vedelem: { nev: 'Védelem (fele sebzés)', mire: 'milyen sebzés ellen', alap: 'ritkas' },
  arkanum_vedelem: { nev: 'Arkánum elleni védelem (fele sebzés)', mire: 'melyik arkánum', alap: 'ritkas' },
  veszely_immunitas: { nev: 'Immunitás', mire: 'milyen sebzés vagy veszély ellen', alap: 'ritka' },
  arkanum_immunitas: { nev: 'Arkánum elleni immunitás', mire: 'melyik arkánum', alap: 'ritka' },
  egyedi: { nev: 'Egyedi előny', mire: 'mi az előny', alap: 'ritkas' }
};
export const KORLATOZASOK = {
  kepzettseg: { nev: 'Képzettség (talentum, osztály, képesség)', leiras: 'Csak az használja, akinek megvan a szükséges talentum vagy képzettség (például a páncélviselet).' },
  kuszob: { nev: 'Használati küszöb', leiras: 'A tulajdonság és a fókusz együtt legalább ennyi legyen (például 5).' },
  hatter: { nev: 'Háttér', leiras: 'Csak egy nép vagy hit tagjánál működik (törp kalapács, szent fegyver).' },
  egyeb: { nev: 'Egyéb feltétel', leiras: '' }
};
export const ATOK_JELENETEK = { harc: 'harc', felfedezes: 'felfedezés', szerepjatek: 'szerepjáték' };

// Ereklyék (Companion 61–63.).
export const EREKLYE_FAJTAK = {
  nincs: { nev: 'Nem ereklye' },
  lepcsos: { nev: 'Lépcsős', en: 'Tiered', leiras: 'Egy képességgel indul, és újat kap, valahányszor a viselője specializációs talentumhoz jutna: az 1., 4., 6., 8., 12., 14. és 16. szinten (legfeljebb hét).' },
  zart: { nev: 'Zárt', en: 'Locked', leiras: 'Három-öt képessége egyszerre nyílik meg, amint teljesül a feltétel (a nehezebb feltétel erősebb ereklyéhez illik).' },
  vegyes: { nev: 'Vegyes', en: 'Combination', leiras: 'Egyes képességei a szinttel, mások egy feltétel teljesülésekor nyílnak meg.' }
};
export const LEPCSOS_SZINTEK = [1, 4, 6, 8, 12, 14, 16];

// ---------- Normalizálók ----------

const nId = (x, i, p) => szoveg(x.id) || p + i;
export const elonyokNorm = (x) => lista(x).map((g, i) => {
  const o = obj(g);
  return { id: nId(o, i, 'me'), tipus: ELONY_TIPUSOK[o.tipus] ? o.tipus : 'egyedi', ertek: szam(o.ertek, ''), mire: szoveg(o.mire), ideiglenes: !!o.ideiglenes, jegyzet: szoveg(o.jegyzet) };
});
export const korlatozasokNorm = (x) => lista(x).map((g, i) => {
  const o = obj(g);
  return { id: nId(o, i, 'mk'), tipus: KORLATOZASOK[o.tipus] ? o.tipus : 'egyeb', szoveg: szoveg(o.szoveg), kuszob: szam(o.kuszob, '') };
});
export const rangokNorm = (x) => lista(x).map((g, i) => {
  const o = obj(g);
  return { id: nId(o, i, 'rg'), nev: szoveg(o.nev), elonyok: szoveg(o.elonyok), kotelessegek: szoveg(o.kotelessegek) };
});
export const kepessegekNorm = (x) => lista(x).map((g, i) => {
  const o = obj(g);
  const sz = szam(o.szint, '');
  return { id: nId(o, i, 'ek'), nev: szoveg(o.nev), kulcs: szoveg(o.kulcs), szint: sz === '' ? '' : Math.max(1, Math.min(20, Math.round(sz))), feltetel: szoveg(o.feltetel), leiras: szoveg(o.leiras) };
});
export const atokNorm = (x) => { const o = obj(x); return { van: !!o.van, jelenet: ATOK_JELENETEK[o.jelenet] ? o.jelenet : '', buntetes: szam(o.buntetes, ''), jegyzet: szoveg(o.jegyzet) }; };
export const toltesNorm = (x) => { const o = obj(x); return { mp: szam(o.mp, ''), visszatoltes: szoveg(o.visszatoltes) }; };
export const alapRangok = () => ALAP_RANGOK.map((r, i) => ({ id: 'rg' + i, nev: r.nev, elonyok: r.elonyok, kotelessegek: r.kotelessegek }));

// ---------- Ritkaság és illeszkedés ----------

const egyLepesselGyakoribb = (k) => RITKASAG_SOR[Math.max(0, RITKASAG_SOR.indexOf(k) - 1)];

// Egy előny ritkasága (Alapkönyv 119.): +1 ritkás, +2 ritka, +3 vagy több legendás; az ideiglenes egy fokkal gyakoribb.
export function elonyRitkasag(e) {
  const t = ELONY_TIPUSOK[e.tipus] || ELONY_TIPUSOK.egyedi;
  let r;
  if (t.ertekes) { const n = szam(e.ertek, 1); r = n >= 3 ? 'legendas' : n === 2 ? 'ritka' : 'ritkas'; } else r = t.alap || 'ritkas';
  return e.ideiglenes ? egyLepesselGyakoribb(r) : r;
}

// A tárgy javasolt ritkasága: a legritkább előnye; ideiglenes tárgynál és korlátozásnál egy fokkal gyakoribb (77. oldal).
// Előny nélkül (vagy csak a kidolgozottsága miatt különleges tárgynál) gyakori.
export function targyRitkasag(a) {
  a = obj(a);
  const el = elonyokNorm(a.elonyok);
  if (!el.length) return 'gyakori';
  let r = el.map(elonyRitkasag).reduce((m, x) => (RITKASAGOK[x].rang > RITKASAGOK[m].rang ? x : m), 'gyakori');
  if (a.tartos === 'ideiglenes') r = egyLepesselGyakoribb(r);
  if (korlatozasokNorm(a.korlatozasok).length) r = egyLepesselGyakoribb(r);
  return r;
}
export const ervenyesRitkasag = (a) => (RITKASAGOK[obj(a).ritkasag] ? obj(a).ritkasag : targyRitkasag(a));

// A szintsávhoz illő legmagasabb ritkaság rangja.
export const savMaxRitkasag = (sav) => Math.max(...(SAV_RITKASAG[sav] || ['legendas']).map((k) => RITKASAGOK[k].rang));

// A lépcsős ereklye megnyitott képességeinek száma egy szinten (1. szinten egy, utána a LEPCSOS_SZINTEK szerint).
export function lepcsosNyitott(szint) {
  const sz = szam(szint, 1);
  return LEPCSOS_SZINTEK.filter((x) => x <= sz).length;
}

// Az ereklye képességei a viselő szintjén: [{ ...kepesseg, nyitva }]. Lépcsős: a sorrend és a szint dönt; zárt: a
// feltétel teljesülése; vegyes: a szinttel jelölt a szint szerint, a többi a feltételtől.
export function ereklyeAllapot(a, szint, feltetelTeljesult) {
  const e = obj(obj(a).ereklye);
  const k = kepessegekNorm(e.kepessegek);
  const f = EREKLYE_FAJTAK[e.fajta] ? e.fajta : 'nincs';
  if (f === 'zart') return k.map((x) => ({ ...x, nyitva: !!feltetelTeljesult }));
  if (f === 'lepcsos') {
    const n = lepcsosNyitott(szint);
    return k.map((x, i) => ({ ...x, nyitva: x.szint !== '' ? x.szint <= szam(szint, 1) : i < n }));
  }
  if (f === 'vegyes') return k.map((x) => ({ ...x, nyitva: x.szint !== '' ? x.szint <= szam(szint, 1) : !!feltetelTeljesult }));
  return k.map((x) => ({ ...x, nyitva: true }));
}

// ---------- Kincs ----------

export function kincsDobas(kategoria, rng = Math.random) {
  const k = KINCS_KATEGORIAK[kategoria];
  if (!k) return null;
  const d = kockaDobas(k.kocka, rng);
  return { kockak: d.kockak, osszeg: d.osszeg, ezust: d.osszeg * k.szorzo, szoveg: k.kocka + ' (' + d.kockak.join('+') + ' = ' + d.osszeg + ')' + (k.szorzo > 1 ? ' × ' + k.szorzo : '') + ' = ' + d.osszeg * k.szorzo + ' ezüst' };
}

// A kincs „bankolása” (78. oldal): ha a hős egy kategória legkisebb értékét tízszer befekteti, havonta az eggyel kisebb
// kategória szerinti jövedelme lesz. Visszaad: { kell: ezüst egyszerre, osszesen, jovedelem: kategória kulcs vagy null }.
export function bankolas(kategoria) {
  const kulcsok = Object.keys(KINCS_KATEGORIAK);
  const i = kulcsok.indexOf(kategoria);
  if (i < 0) return null;
  const k = KINCS_KATEGORIAK[kategoria];
  const min = k.kocka.startsWith('1') ? 1 * k.szorzo : Number(k.kocka[0]) * k.szorzo;
  return { kell: min, osszesen: min * 10, jovedelem: i > 0 ? kulcsok[i - 1] : null };
}

// ---------- Kitöltöttség és figyelmeztetések ----------

const allapot = (kesz, resz) => (kesz ? 'kesz' : resz ? 'resz' : 'ures');

export const JUTALOM_LEPESEK = {
  hasznalat: { nev: 'Fajta, szintsáv és szerep', en: 'Using Rewards, Reward Mapping', oldal: '69–71',
    utmutato: 'Milyen jutalom ez, melyik szintsávba illik (a jutalomtérkép rácsa), és kinek szól? A könyv szerint a jutalom mérföldkő: cél, amiért küzdenek, elismerés, ami emlékeztet, és erőforrás, ami valódi előnyt ad. Nem kell mindenkinek ugyanolyan jutalom, de mindegyik illjen a karakterekhez és a céljaikhoz.' },
  cim: { nev: 'A cím', en: 'Honorifics', oldal: '72–74',
    utmutato: 'Ki adja, és mivel jár? A cím valódi előny: bónusz egy szűk helyzetre (minél szűkebb, annál nagyobb), büntetés az ellenfeleknek, vagy alkalmanként egyszeri különleges előny. A nemesi és hivatali titulus jövedelemmel és kötelességgel is járhat; az örökölt cím a szintekkel együtt „érik be”.' },
  tagsag: { nev: 'A tagság', en: 'Membership', oldal: '74–75',
    utmutato: 'Milyen szervezet, és mit ad a tagjainak? Csak olyan szervezetet érdemes kidolgozni, amelyhez a hősök csatlakoznának (vagy a specializációjukhoz kell). A rangok: újonc, megbecsült tag, vezető; a 3. fölött a DM dönt (egészen a szervezet csúcsáig).' },
  tars: { nev: 'A társ', en: 'Companions', oldal: '75–77',
    utmutato: 'Egy NJK, aki egy hősnek vagy a csapatnak szolgál: általában két tulajdonság 2-es, néhány 1-es, két-három fókusz, és feladatok, amelyeket magától elvégez. Egészsége a gazda felének (csapatnál a második legkisebb Egészségű hős felének) felel meg. Ne lopja el a rivaldafényt; a képességei ne haladják meg a második legalacsonyabb szintű hős szintjének felét.' },
  targy: { nev: 'A tárgy', en: 'Magic Items, Random Items', oldal: '77–80',
    utmutato: 'Ideiglenes vagy állandó? Az állandó tárgy egyedi: adj neki nevet, történetet, külsőt. Egy-két előny elég; a ritkaság a legerősebb előnyből jön (+1 ritkás, +2 ritka, +3 legendás), az ideiglenes és a korlátozott tárgy egy fokkal gyakoribb. A véletlen fegyver, páncél és mágikus tulajdonság a könyv tábláival dobható.' },
  ereklye: { nev: 'Ereklye', en: 'Artifacts (Companion)', oldal: 'Companion 61–63',
    utmutato: 'Az ereklye a viselőjével együtt erősödik. Lépcsős: a specializációs szinteken új képesség nyílik; zárt: egy feltétel egyszerre nyitja meg mind; vegyes: a kettő együtt. Ráhangolódásnál alkalmanként egy újabb képesség nyílik meg, amíg el nem éri a szint szerintit. A korlátok: csak bizonyos körülmények között működik.' },
  kincs: { nev: 'A kincs', en: 'Wealth and Treasure', oldal: '77–78',
    utmutato: 'A kincskategória a szintsávhoz illik (kezdő: csekély és szerény, legendás: fényűző). Az érték ezüstben van, de a kincs lehet érme, ékszer, drágakő, műtárgy, ritka fűszer vagy kézirat. A könyv laza vagyonrendszere: a befektetett kincsből havi jövedelem lesz.' },
  megnyitas: { nev: 'Megnyitás és elvesztés', en: 'Unlocking Rewards, Rewards as Resources', oldal: '70–72',
    utmutato: 'Hogyan jutnak hozzá: a történet hozza, ráhangolódás, adományozás vagy képzés? Az adományozott jutalom feltételekkel járhat és visszavonható. Mi történhet vele később: elfogy, ellopják, elveszik, vagy egy helyen nem ér semmit? A kampányban akár egy pont is tervezhető, ahol a hősök sok jutalmukat elvesztik.' }
};

export function lepesKulcsok(a) {
  const f = fajtaOf(a);
  const ki = ['hasznalat'];
  if (f) ki.push(f);
  if (f === 'targy' && obj(a).tartos !== 'ideiglenes') ki.push('ereklye');
  ki.push('megnyitas');
  return ki;
}

export function lepesAllapot(a) {
  a = obj(a);
  const e = obj(a.ereklye);
  return {
    hasznalat: allapot(!!fajtaOf(a) && !!a.iv && lista(a.szerepek).length > 0, !!fajtaOf(a) || !!a.iv || lista(a.szerepek).length > 0),
    cim: allapot(!!a.cim_fajta && (van(a.hatas) || van(a.mire)), !!a.cim_fajta || van(a.hatas) || van(a.adomanyozo)),
    tagsag: allapot(!!a.szervezet_tipus && rangokNorm(a.rangok).length > 0, !!a.szervezet_tipus || van(a.szervezet) || !!a.csoport_id),
    tars: allapot(!!a.njk_id || (van(a.tars_tulajdonsagok) && van(a.feladatok)), van(a.tars_tulajdonsagok) || van(a.feladatok) || !!a.njk_id),
    targy: allapot(!!a.targy_fajta && elonyokNorm(a.elonyok).length > 0, !!a.targy_fajta || elonyokNorm(a.elonyok).length > 0 || !!a.kidolgozottsag),
    ereklye: allapot(EREKLYE_FAJTAK[e.fajta] && e.fajta !== 'nincs' && kepessegekNorm(e.kepessegek).length > 0, !!e.fajta && e.fajta !== 'nincs'),
    kincs: allapot(!!KINCS_KATEGORIAK[a.kategoria] && szam(a.ertek_ezust) !== null, !!a.kategoria || van(a.forma)),
    megnyitas: allapot(lista(a.megnyitas).length > 0, lista(a.megnyitas).length > 0 || van(a.elveszhet) || van(a.feltetelek))
  };
}

// Figyelmeztetések: { lepes, szoveg }. A könyv tanácsai és az illeszkedés a szintsávhoz.
export function figyelmeztetesek(a) {
  a = obj(a);
  const f = [];
  const fajta = fajtaOf(a);
  if (!fajta) f.push({ lepes: 'hasznalat', szoveg: 'Válaszd ki a jutalom fajtáját (cím, tagság, társ, mágikus tárgy, kincs).' });
  if (!a.iv) f.push({ lepes: 'hasznalat', szoveg: 'Szintsáv nélkül nem kerül a jutalomtérképre.' });
  if (lista(a.szerepek).includes('cel') && !lista(a.kinek).length) f.push({ lepes: 'hasznalat', szoveg: 'Célként a karakternek tudnia kell a jutalomról: kinek szól?' });
  const megny = lista(a.megnyitas);
  if (megny.includes('adomanyozas') && !van(a.adomanyozo) && !a.adomanyozo_njk) f.push({ lepes: 'megnyitas', szoveg: 'Adományozott jutalom: ki adja?' });
  if (megny.includes('kepzes') && !van(a.kepzes)) f.push({ lepes: 'megnyitas', szoveg: 'Képzés: mennyi idő és milyen erőforrás (mester, könyv, eszköz) kell hozzá?' });
  if (fajta === 'cim') {
    const b = szam(a.bonusz);
    if (b !== null && b > 3) f.push({ lepes: 'cim', szoveg: 'A könyv szerint a cím bónusza legfeljebb +3, és az is csak egészen szűk helyzetre.' });
    if (a.hatas_mod === 'kulonleges' && !a.alkalmankent) f.push({ lepes: 'cim', szoveg: 'A különleges előny a könyv szerint általában alkalmanként egyszer használható.' });
    if (['szakerto', 'mester', 'legendas'].indexOf(a.iv) < 0 && a.iv && /szak|mester/i.test(szoveg(a.nev))) f.push({ lepes: 'cim', szoveg: 'A szakértelmet jelző cím a könyv szerint a 9. szint körül (szakértő sáv) illik.' });
  }
  if (fajta === 'tagsag' && !a.csoport_id && !van(a.szervezet)) f.push({ lepes: 'tagsag', szoveg: 'Melyik szervezetbe szól a tagság? (csoportelem vagy név)' });
  if (fajta === 'tars' && !a.njk_id && !van(a.tars_tulajdonsagok)) f.push({ lepes: 'tars', szoveg: 'A társnak kell néhány tulajdonság és fókusz, vagy egy NJK-tárbeli NJK.' });
  if (fajta === 'targy') {
    const r = ervenyesRitkasag(a);
    if (a.iv && RITKASAGOK[r].rang > savMaxRitkasag(a.iv)) f.push({ lepes: 'targy', szoveg: 'Ez a tárgy ' + RITKASAGOK[r].nev.toLowerCase() + ', a ' + savOf(a.iv).nev.toLowerCase() + ' sávba a könyv szerint ' + SAV_RITKASAG[a.iv].map((k) => RITKASAGOK[k].nev.toLowerCase()).join(' vagy ') + ' illik.' });
    if (elonyokNorm(a.elonyok).length > 2) f.push({ lepes: 'targy', szoveg: 'A legtöbb tárgy egy-két előnyt ad (az ideiglenes általában egyet).' });
    const at = atokNorm(a.atok);
    if (at.van && (!at.jelenet || at.buntetes === '')) f.push({ lepes: 'targy', szoveg: 'Átkozott tárgy: add meg, melyik jelenettípusban és mekkora (−1 és −3 közötti) büntetést okoz.' });
    if (a.tartos !== 'ideiglenes' && !van(a.leiras) && !van(a.tortenet)) f.push({ lepes: 'targy', szoveg: 'Az állandó tárgy egyedi: adj neki történetet és külsőt (a leírásban vagy itt).' });
    if (a.tartos === 'ideiglenes' && obj(a.ereklye).fajta && obj(a.ereklye).fajta !== 'nincs') f.push({ lepes: 'targy', szoveg: 'Ideiglenes tárgy nem lehet ereklye.' });
  }
  if (fajta === 'targy' && obj(a.ereklye).fajta && obj(a.ereklye).fajta !== 'nincs') {
    const e = obj(a.ereklye);
    const k = kepessegekNorm(e.kepessegek);
    if ((e.fajta === 'zart' || e.fajta === 'vegyes') && !van(e.feltetel)) f.push({ lepes: 'ereklye', szoveg: 'Mi nyitja meg az ereklyét? (feltétel)' });
    if (e.fajta === 'zart' && k.length && (k.length < 3 || k.length > 5)) f.push({ lepes: 'ereklye', szoveg: 'A zárt ereklyének általában három-öt képessége van.' });
    if (e.fajta === 'lepcsos' && k.length > 7) f.push({ lepes: 'ereklye', szoveg: 'A lépcsős ereklye legfeljebb hét képességet nyit meg (1., 4., 6., 8., 12., 14., 16. szint).' });
  }
  if (fajta === 'kincs' && a.iv && a.kategoria && !(SAV_KINCS[a.iv] || []).includes(a.kategoria)) {
    f.push({ lepes: 'kincs', szoveg: 'A ' + savOf(a.iv).nev.toLowerCase() + ' sávba a könyv szerint ' + SAV_KINCS[a.iv].map((k) => KINCS_KATEGORIAK[k].nev.toLowerCase()).join(' vagy ') + ' kincs illik.' });
  }
  return f;
}

// A jutalom rövid összefoglalója a listákhoz.
export function osszefoglalo(a, nevek = {}) {
  a = obj(a);
  const f = fajtaOf(a);
  const r = [f ? FAJTAK[f].nev : 'fajta nélkül'];
  if (f === 'cim' && CIM_FAJTAK[a.cim_fajta]) r.push(CIM_FAJTAK[a.cim_fajta].nev.toLowerCase());
  if (f === 'tagsag') { if (nevek.csoport || van(a.szervezet)) r.push(nevek.csoport || szoveg(a.szervezet)); if (szam(a.rang)) r.push(szam(a.rang) + '. rang'); }
  if (f === 'tars' && nevek.njk) r.push(nevek.njk);
  if (f === 'targy') {
    r.push(RITKASAGOK[ervenyesRitkasag(a)].nev.toLowerCase());
    if (a.tartos === 'ideiglenes') r.push('ideiglenes');
    if (obj(a.ereklye).fajta && obj(a.ereklye).fajta !== 'nincs') r.push('ereklye');
    if (atokNorm(a.atok).van) r.push('átkozott');
  }
  if (f === 'kincs') { if (KINCS_KATEGORIAK[a.kategoria]) r.push(KINCS_KATEGORIAK[a.kategoria].nev.toLowerCase()); if (szam(a.ertek_ezust) !== null) r.push(szam(a.ertek_ezust) + ' ezüst'); }
  return r.join(', ');
}

// ---------- A jutalomtérkép ----------

// A jutalom elemek rácsa: { [sav]: { [fajta]: [elem] } }, plusz _nincs (szintsáv nélküliek) fajtánként.
// megj: (elem) => megjelenített adat.
export function terkep(elemek, megj) {
  const ki = {};
  SAVOK.concat([{ kulcs: '_nincs' }]).forEach((s) => { ki[s.kulcs] = Object.fromEntries(FAJTA_KULCSOK.concat(['_nincs']).map((f) => [f, []])); });
  lista(elemek).filter((e) => e.tipus === 'jutalom').forEach((e) => {
    const a = obj(megj(e));
    const s = savOf(a.iv) ? a.iv : '_nincs';
    const f = fajtaOf(a) || '_nincs';
    ki[s][f].push(e);
  });
  return ki;
}

// A jutalomhoz kötött kalandok és jelenetek (kapcsolat: jutalma; honnan a jutalom, hova a kaland vagy jelenet).
export const holSzerzik = (jutalomId, kapcsolatok) => lista(kapcsolatok).filter((k) => k.aktiv !== false && k.tipus === 'jutalma' && k.honnan === jutalomId);
export const jutalmaiOf = (elemId, kapcsolatok) => lista(kapcsolatok).filter((k) => k.aktiv !== false && k.tipus === 'jutalma' && k.hova === elemId);

// ---------- Véletlen tárgyak (Random Items, 78–80. oldal) ----------

// Egy fegyvercsoport fegyverei közül d3 (a könyv szerint a fegyvertábla). A gránátnál 1d6 a gránátok közül.
export function fegyverValaszt(csoport, lapok, rng = Math.random) {
  const fegyverek = lista(obj(lapok)['Fegyverek']).filter((s) => s.aktiv !== false);
  if (csoport === 'granat') {
    const g = fegyverek.filter((s) => obj(s.reszletek).tipus === 'granat');
    return g.length ? g[(kockaDobas('1d6', rng).osszeg - 1) % g.length] : null;
  }
  const s = fegyverek.filter((x) => x.csoport === csoport);
  if (!s.length) return null;
  return s[(kockaDobas('d3', rng).osszeg - 1) % s.length];
}

// A mágikus tulajdonságok dobásfájából az előnyök és az átok (a sárkánykocka szerinti értékekkel).
export function magikusFabol(fa) {
  const elonyok = [];
  let atok = false;
  if (!fa || fa.hiba) return { elonyok, atok };
  bejar(fa, (cs) => {
    if (!cs || cs.hiba || cs.tabla !== MAGIKUS_TABLA) return;
    const t = obj(cs.ertek).tipus;
    if (t === 'atok') { atok = true; return; }
    if (!t || t === 'tobb') return;
    const e = { id: 'me' + elonyok.length, tipus: ELONY_TIPUSOK[t] ? t : 'egyedi', ertek: ELONY_TIPUSOK[t] && ELONY_TIPUSOK[t].ertekes ? cs.szam : '', mire: '', jegyzet: cs.eredmeny };
    if (t === 'talentum') e.mire = (cs.szam || 1) + ' fok';
    if ((t === 'mutatvany' || t === 'varazslat') && cs.sarkany === 6) e.jegyzet += t === 'mutatvany' ? ' (0 MP-ig)' : ' (Mágiapont nélkül is)';
    elonyok.push(e);
  });
  return { elonyok, atok };
}

// Véletlen tárgy a könyv tábláival: fajta 'fegyver' | 'pancel' | 'pajzs'. Visszaadja a dobásfákat (a felület
// soronként újradobhatja őket) és a belőlük számolt mezőket. korny: a generator korny ({ tablak, rng, kikapcsolt }).
export function veletlenTargyFak(fajta, korny, opciok = {}) {
  const fak = {};
  if (fajta === 'fegyver') fak.alap = general('dt_fegyvercsoport', korny);
  if (fajta === 'pancel') fak.alap = general('dt_pancel', korny);
  if (fajta === 'pajzs') fak.alap = general('dt_pajzs', korny);
  if (opciok.kidolgozottsag !== false) fak.kidolgozottsag = general('dt_kidolgozottsag', korny);
  if (opciok.magikus && tablaKeres(korny.tablak, MAGIKUS_TABLA)) fak.magikus = general(MAGIKUS_TABLA, korny);
  return fak;
}

// A dobásfákból a tárgy mezői: { targy_fajta, alap_id, alap_nev, kidolgozottsag, elonyok, atok, nev, jegyzet }.
export function targyFakbol(fajta, fak, lapok, rng = Math.random) {
  const ki = { targy_fajta: fajta, alap_id: '', alap_nev: '', kidolgozottsag: '', elonyok: [], atok: { van: false } };
  const alap = fak.alap && !fak.alap.hiba ? obj(fak.alap.ertek) : {};
  if (fajta === 'fegyver') {
    if (alap.csoport === 'granat_alapanyag') { ki.targy_fajta = 'egyeb'; ki.alap_nev = 'Gránát-alapanyagok'; }
    else {
      const f = fegyverValaszt(alap.csoport, lapok, rng);
      if (f) { ki.alap_id = f.id; ki.alap_nev = f.nev_hu; }
    }
  }
  if (fajta === 'pancel' || fajta === 'pajzs') {
    const id = fajta === 'pancel' ? alap.pancel : alap.pajzs;
    const p = lista(obj(lapok)['Páncélok']).find((s) => s.id === id);
    if (p) { ki.alap_id = p.id; ki.alap_nev = p.nev_hu; }
  }
  if (fak.kidolgozottsag && !fak.kidolgozottsag.hiba) ki.kidolgozottsag = obj(fak.kidolgozottsag.ertek).minoseg || '';
  if (fak.magikus) { const m = magikusFabol(fak.magikus); ki.elonyok = m.elonyok; ki.atok = { van: m.atok }; }
  ki.nincs = !ki.alap_id && !ki.alap_nev; // „nincs páncél” vagy „nincs pajzs”
  return ki;
}

// ---------- A jutalomtérkép tippjei és a hősönkénti nézet ----------

// Cellánkénti rövid tipp (szintsáv × fajta) a könyv tanácsai alapján: a kezdő és a gyakorlott sáv a könyv példája
// (Highfalls Swale, 77–78. oldal), a többi a fejezet általános tanácsaiból (ritkaság, kincskategória, rangok, titulusok).
export const CELLA_TIPPEK = {
  kezdo: {
    cim: 'Egy név az első tettekért (a könyv példájában a „Kiválasztottak”, a Szerencse kegyeltje mintájára).',
    tagsag: 'Ajánlat egy szervezettől a 3. szint körül, a 4. szintes specializáció előtt; a város céhei is toborozhatnak.',
    tars: 'Csak kevés: az első kalandok a csapat tagjai közti kötelékről szólnak.',
    targy: 'Gyakori, főleg ideiglenes tárgyak; egy később ébredő ereklye is elrejthető (eleinte csak finom kidolgozású trófea).',
    kincs: 'Csekély és szerény kincs; a pénz inkább a megbízóktól jön, a kezdéshez egy felszerelésnyi.'
  },
  gyakorlott: {
    cim: 'Titulus a vidék hálájából (a példában a térség lovag-védelmezői); a hősöknek már van múltjuk.',
    tagsag: 'Előléptetés a 2. rangra; egy korruptnak bizonyult szervezetből máshová léphetnek át.',
    tars: 'Most jöhet egy-kettő: egy megmentett NJK, vagy egy jóvátételt kereső volt tag, aki információt hoz.',
    targy: 'Hősönként nagyjából három-négy állandó tárgy, az ideiglenesek helyett; az ereklyék első képességei megnyílnak.',
    kincs: 'Közepes kincs; a megbízói fizetség helyett egyre inkább talált kincs.'
  },
  szakerto: {
    cim: 'A szakértelmet jelző cím ettől a sávtól illik.',
    tagsag: 'A vezető rang (3.) felé; a második specializációhoz új szervezet is kellhet.',
    tars: 'A társak fejlődhetnek (egy talentum), de maradjanak a második legalacsonyabb szintű hős szintjének fele alatt.',
    targy: 'Ritkás tárgyak (+1-es bónuszok).',
    kincs: 'Jelentős kincs; érdemes hordozható értékekbe (ékszer, drágakő, műtárgy) sűríteni.'
  },
  mester: {
    cim: 'Nemesi vagy hivatali titulus birtokkal és kötelességgel; az örökölt cím itt teljesedhet be.',
    tagsag: 'Vezető rang, vagy a 3. fölötti rangok a szervezet csúcsáig.',
    tars: 'Egy kiemelt társ teljes statblokkot is kaphat (a könyv szerint ritkán kell).',
    targy: 'Ritka tárgyak (+2-es bónuszok), több képességű ereklyék.',
    kincs: 'Bőséges kincs; a befektetett vagyonból havi jövedelem lehet.'
  },
  legendas: {
    cim: 'A világ ismeri a nevüket; az epikus jutalomnál a történet és a kötelezettség számít.',
    tagsag: 'A szervezet vezetése a csúcson.',
    tars: 'Legendás társ is lehet, de ne vegye át a főszerepet.',
    targy: 'Legendás tárgyak és ereklyék, céllal megalkotva, nem dobással.',
    kincs: 'Fényűző kincs.'
  }
};

// A jutalom figyelmeztetései a térképhez (a szintsáv hiányát a rács maga mutatja).
export const terkepFigyelmeztetesek = (a) => figyelmeztetesek(a).filter((f) => !/^Szintsáv nélkül/.test(f.szoveg));

// Hősönkénti nézet: { [kulcs]: { [sav|'_nincs']: [elem] } }, ahol a kulcs egy karakter azonosítója, 'csapat', vagy
// '_senki' (kinek nélkül). karakterIdk: a kampány karakterei (a sorrendhez és az ismeretlenek kiszűréséhez).
export function hosonkent(elemek, megj, karakterIdk) {
  const kulcsok = lista(karakterIdk).concat(['csapat', '_senki']);
  const ki = Object.fromEntries(kulcsok.map((k) => [k, Object.fromEntries(SAVOK.map((s) => s.kulcs).concat(['_nincs']).map((s) => [s, []]))]));
  lista(elemek).filter((e) => e.tipus === 'jutalom').forEach((e) => {
    const a = obj(megj(e));
    const sav = savOf(a.iv) ? a.iv : '_nincs';
    const kinek = lista(a.kinek).filter((k) => ki[k]);
    (kinek.length ? kinek : ['_senki']).forEach((k) => ki[k][sav].push(e));
  });
  return ki;
}
