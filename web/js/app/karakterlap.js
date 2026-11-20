// A karakterlap: játék mód (Egészség és Mágiapont számláló, próba előkészítése, fegyverek, varázslatok,
// felszerelés és pénz, XP) és szerkesztés mód (kép, leírás, a karakterkészítő lépései, szintek, kézi módosítók).
// A karakter adatai a karakterkészítő mentési horgán (useVarazsloAdat) keresztül mentődnek: optimistán,
// pár másodperc késleltetéssel, ütközéskor a saját módosítások a máshol mentett változatra kerülnek.
import { html, K, useApp, useState, useEffect, useMemo, useRef, Uzenet, Parbeszed, Megerosites, Valaszto, Sugo, Ikon, navigal, elojel } from './kozos.js';
import { karakterSzamol } from '../karakter/szamol.js';
import { atallit } from '../karakter/adat.js';
import { index, reszletek, szam } from '../karakter/szabalyindex.js';
import { TULAJDONSAGOK, fokozatSzam } from '../karakter/tablak.js';
import * as V from '../karakter/varazslo.js';
import * as L from '../karakter/leltar.js';
import { xpTipusNev } from '../karakter/xp.js';
import { felkeszSzint } from '../karakter/szintlepes.js';
import { useVarazsloAdat, MentesJel } from './varazslo.js';
import { ProbaLap, useKarakterKampanya, useProbaNaplo } from './proba.js';
import { KarakterKep, KepFeltolto } from './kepek.js';
import { XpKiosztas } from './xpkiosztas.js';
import { fokuszNev, Kapcsolo } from './varazslo_lepesek.js';
import { KeszitesGomb, SzintlepesGomb, KarakterFejlec } from './jatek.js';
import { KarakterDobasai } from './dobasnaplo.js';
import { CelpontProbaGomb } from './probakeres.js';
import * as J from '../karakter/jegyzet.js';

const TUL_NEV = {
  tul_accuracy: 'Pontosság', tul_communication: 'Kommunikáció', tul_constitution: 'Szívósság', tul_dexterity: 'Ügyesség',
  tul_fighting: 'Harc', tul_intelligence: 'Intelligencia', tul_perception: 'Észlelés', tul_strength: 'Erő', tul_willpower: 'Akaraterő'
};
const elemNev = (ix, lap, id, tartalek) => { const e = ix.elem(lap, id); return e ? e.nev_hu : (tartalek || id); };
const targyNev = (ix, t) => (t.nev ? t.nev : elemNev(ix, V.targyLap(t.id), t.id, String(t.id).replace(/^sajat:/, '').replace(/_/g, ' ')));
const rovid = (s, n = 200) => { const t = String(s || '').trim(); return t.length <= n ? t : t.slice(0, n).replace(/\s+\S*$/, '') + '…'; };
// A varázslat célpontjának próbája röviden: „Ügyesség (Lopakodás)”.
const celpontProbaNev = (pr, lapok) => TUL_NEV[pr.tulajdonsag] + ((pr.fokusz || []).length
  ? ' (' + pr.fokusz.map((id) => ((lapok && lapok['Fókuszok'] || []).find((f) => f.id === id) || {}).nev_hu || id).join(' vagy ') + ')' : '');
const datum = (iso) => { try { return new Date(iso).toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }); } catch (e) { return ''; } };

// ---- A lap belépési pontja ----
// karakter: a character.get eredménye, beallitKarakter: a lekérés helyi frissítése, alap: '/dm/karakter/<id>' vagy '/jatekos/…'.
export function KarakterLap({ karakter, beallitKarakter, alap, onValtozott }) {
  const { szabalyok } = useApp();
  if (!szabalyok.adat) return html`<${Uzenet} tonus="neutral">A szabályadat betöltése…<//>`;
  const lapok = szabalyok.adat.lapok;
  if (karakter.irhato === false) {
    const adat = atallit(karakter.adat || {});
    return html`<${LapTartalom} karakter=${karakter} adat=${adat} lap=${karakterSzamol(adat, lapok)} lapok=${lapok} alap=${alap} irhato=${false}/>`;
  }
  return html`<${SzerkeszthetoLap} key=${karakter.id} karakter=${karakter} beallitKarakter=${beallitKarakter} lapok=${lapok} alap=${alap} onValtozott=${onValtozott}/>`;
}

function SzerkeszthetoLap({ karakter, beallitKarakter, lapok, alap, onValtozott }) {
  const v = useVarazsloAdat(karakter, lapok, beallitKarakter, onValtozott);
  const { adat, ment, allapot } = v;
  // Játék közben sűrű a változás (Egészség, pénz): rövid várakozás után ment, nem minden koppintásra.
  useEffect(() => {
    if (allapot !== 'valtozott') return undefined;
    const t = setTimeout(() => ment(), 1500);
    return () => clearTimeout(t);
  }, [adat, allapot]);
  useEffect(() => () => { ment(); }, []);
  const lap = useMemo(() => karakterSzamol(adat, lapok), [adat, lapok]);
  return html`<${LapTartalom} karakter=${karakter} adat=${adat} lap=${lap} lapok=${lapok} alap=${alap} irhato=${true} v=${v}/>
    ${v.utkozes ? html`<${Parbeszed} cim="Máshol is módosították" onBezar=${v.sajatMarad} lab=${html`
      <${K.Button} variant="quiet" onClick=${v.masikBetolt}>A másikat töltöm be<//>
      <${K.Button} variant="primary" onClick=${v.sajatMarad}>Az enyém marad<//>`}>
      <p className="szoveg">A karaktert közben máshol is mentették, és a változások nem fésülhetők össze magától. Megtarthatod a sajátodat, vagy betöltheted a máshol mentettet.</p>
    <//>` : null}`;
}

function LapTartalom({ karakter, adat, lap, lapok, alap, irhato, v }) {
  const { felhasznalo } = useApp();
  const dm = felhasznalo && felhasznalo.szerep === 'dm';
  const ix = useMemo(() => index(lapok), [lapok]);
  const [mod, setMod] = useState('jatek');
  const valtoztat = irhato && v ? v.valtoztat : null;
  const p = { karakter, adat, lap, lapok, ix, alap, irhato, dm, valtoztat, v };
  return html`<div className="klap">
    <${LapFej} ...${p} mod=${mod} setMod=${setMod}/>
    ${mod === 'szerkesztes' && irhato ? html`<${SzerkesztoMod} ...${p}/>` : html`<${JatekMod} ...${p}/>`}
  </div>`;
}

// ---- Fejléc: kép, név, címkék, XP, gombok, módváltó ----
function LapFej({ karakter, adat, lap, ix, alap, irhato, dm, mod, setMod, v }) {
  const kep = adat.alap.kep || null;
  const [xpAblak, setXpAblak] = useState(false);
  const xp = lap.xp || { ertek: 0 };
  const kuszob = xp.kuszob || 0;
  const kov = xp.kovetkezo;
  const szazalek = kov ? Math.max(0, Math.min(100, Math.round(100 * (xp.ertek - kuszob) / Math.max(1, kov - kuszob)))) : 100;
  return html`<section className="klap__fej">
    <${KarakterKep} kep=${kep && kep.kep} nev=${adat.nev || karakter.nev} meret="nagy"/>
    <div className="klap__fejtest">
      <${KarakterFejlec} karakter=${{ ...karakter, adat }}/>
      <div className="xpsor" aria-label="Tapasztalat">
        <div className="xpsor__sor">
          <span className="cimke" style=${{ margin: 0 }}>Tapasztalat<${Sugo} cim="Tapasztalati pont (XP)">A DM találkozásonként oszt XP-t (rutin 0, könnyű 100, közepes 250, nehéz 400), a kaland végén bónuszt, vagy egy nagy esemény után szintjutalmat. Ha megvan a következő szint küszöbe, jöhet a szintlépés.<//></span>
          <span className="xpsor__szam">${xp.ertek}${kov ? html` <span className="halvany">/ ${kov} XP</span>` : ' XP'}</span>
        </div>
        <span className="csik" aria-hidden="true"><span style=${{ width: szazalek + '%' }}></span></span>
        ${xp.elerheto && !lap.felkesz_szint ? html`<span className="xpsor__jel">✓ A ${lap.szint + 1}. szint elérhető</span>` : null}
      </div>
      <div className="gombsor">
        ${irhato ? html`<div className="kapcsolo" role="group" aria-label="Mód">
          <button type="button" aria-pressed=${mod === 'jatek'} onClick=${() => setMod('jatek')}>Játék</button>
          <button type="button" aria-pressed=${mod === 'szerkesztes'} onClick=${() => setMod('szerkesztes')}>Szerkesztés</button>
        </div>` : null}
        ${irhato ? html`<${KeszitesGomb} karakter=${{ ...karakter, adat }} alap=${alap}/>` : null}
        <${SzintlepesGomb} karakter=${{ ...karakter, adat }} alap=${alap} kiemelt=${xp.elerheto}/>
        ${dm ? html`<${K.Button} variant="quiet" onClick=${() => setXpAblak(true)}>XP módosítása<//>` : null}
        ${v ? html`<${MentesJel} allapot=${v.allapot}/>` : null}
      </div>
      ${lap.felkesz_szint ? html`<${Uzenet} tonus="neutral">ⓘ A(z) ${lap.felkesz_szint}. szint szintlépése folyamatban: a lapon a lezárása után számít.<//>` : null}
      ${adat.keszites.allapot === 'piszkozat' ? html`<${Uzenet} tonus="neutral">ⓘ Piszkozat: a karakterkészítés még nem fejeződött be.<//>` : null}
    </div>
    ${xpAblak ? html`<${XpKiosztas} karakterek=${[{ id: karakter.id, nev: adat.nev || karakter.nev, xp: xp.ertek, szint: lap.szint }]}
      onBezar=${() => setXpAblak(false)}
      onKesz=${(valasz) => {
        setXpAblak(false);
        const x = (valasz.karakterek || [])[0];
        if (x && v) v.kulsoModositas(x.verzio, (a) => { a.allapot.xp = x.xp; a.xp_naplo = (a.xp_naplo || []).concat([x.bejegyzes]); });
      }}/>` : null}
  </section>`;
}

// =================== Játék mód ===================
function JatekMod(p) {
  const { lap, adat } = p;
  return html`<div className="klap__racs">
    <div className="verem verem--nagy">
      <${Eroforrasok} ...${p}/>
      <${Tulajdonsagok} ...${p}/>
      <${Fegyverek} ...${p}/>
      ${lap.varazslatok.length || lap.arkanumok.length ? html`<${Varazslatok} ...${p}/>` : null}
    </div>
    <div className="verem verem--nagy">
      <${Talentumok} ...${p}/>
      <${Felszereles} ...${p}/>
      <${Jegyzetek} ...${p}/>
      <${Tortenet} ...${p}/>
      <${Figyelmeztetesek} ...${p}/>
      <${Naplok} ...${p}/>
    </div>
  </div>`;
}

// Egészség és Mágiapont: koppintásra ±1, mezőbe írva sebzés vagy gyógyulás, „Teljes” visszaállítás.
function Szamlalo({ nev, kind, ertek, max, onAllit, csokkentFelirat, novelFelirat, sugo }) {
  const [mezo, setMezo] = useState('');
  const n = Math.max(0, parseInt(mezo, 10) || 0);
  const allit = (x) => onAllit(Math.max(0, Math.min(max, x)));
  return html`<div className="szamlalo">
    <${K.ResourceBar} kind=${kind} value=${ertek} max=${max} label=${nev}/>
    <div className="szamlalo__sor">
      <span className="lepteto">
        <button type="button" aria-label=${nev + ' −1'} onClick=${() => allit(ertek - 1)}>−</button>
        <span aria-live="polite">${ertek}</span>
        <button type="button" aria-label=${nev + ' +1'} onClick=${() => allit(ertek + 1)}>+</button>
      </span>
      <input className="szamlalo__mezo" inputMode="numeric" value=${mezo} aria-label=${nev + ': mennyiség'} placeholder="0"
        onChange=${(e) => setMezo(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!n} onClick=${() => { allit(ertek - n); setMezo(''); }}>${csokkentFelirat}<//>
      <${K.Button} size="sm" variant="secondary" disabled=${!n} onClick=${() => { allit(ertek + n); setMezo(''); }}>${novelFelirat}<//>
      ${ertek < max ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => allit(max)}>Teljes<//>` : null}
      ${sugo || null}
    </div>
  </div>`;
}

function Eroforrasok({ lap, adat, lapok, valtoztat, irhato }) {
  const allit = (kulcs) => (n) => valtoztat && valtoztat((a) => { a.allapot[kulcs] = n; });
  const [penzAblak, setPenzAblak] = useState(null); // 'be' | 'ki'
  const egyenleg = adat.felszereles.penz_rez || 0;
  return html`<${K.Panel} title="Erőforrások">
    <div className="verem">
      ${lap.egeszseg.ertek ? (irhato
        ? html`<${Szamlalo} nev="Egészség" kind="health" ertek=${lap.egeszseg.aktualis} max=${lap.egeszseg.ertek} onAllit=${allit('egeszseg')}
            csokkentFelirat="Sebzés" novelFelirat="Gyógyulás"/>`
        : html`<${K.ResourceBar} kind="health" value=${lap.egeszseg.aktualis} max=${lap.egeszseg.ertek}/>`)
        : html`<p className="halvany">Az Egészség még nincs megadva.</p>`}
      ${lap.magiapont && lap.magiapont.ertek ? (irhato
        ? html`<${Szamlalo} nev="Mágiapont" kind="magic" ertek=${lap.magiapont.aktualis} max=${lap.magiapont.ertek} onAllit=${allit('magiapont')}
            csokkentFelirat="Elkölt" novelFelirat="Visszanyer"
            sugo=${html`<${Sugo} cim="Mágiapont visszanyerése">Pihenéssel óránként 1d6 + Akaraterő, 8 óra zavartalan pihenés után mind visszajön.<//>`}/>`
        : html`<${K.ResourceBar} kind="magic" value=${lap.magiapont.aktualis} max=${lap.magiapont.ertek}/>`) : null}
      <div className="penzsor">
        <span className="penzsor__nev">Pénz</span>
        <span className=${'penzsor__ertek' + (egyenleg < 0 ? ' penzsor__ertek--minusz' : '')}>${V.penzSzoveg(egyenleg)}</span>
        ${irhato && valtoztat ? html`<span className="lepteto">
          <button type="button" aria-label="Pénz kiadása" onClick=${() => setPenzAblak('ki')}>−</button>
          <button type="button" aria-label="Pénz bevétele" onClick=${() => setPenzAblak('be')}>+</button>
        </span>` : null}
      </div>
      ${egyenleg < 0 ? html`<${Uzenet} tonus="warning">Mínuszban van a pénz (túlköltés).<//>` : null}
      <dl className="ertekek">
        <div><dt>Védekezés</dt><dd>${lap.vedekezes.ertek}</dd></div>
        <div><dt>Sebesség</dt><dd>${lap.sebesseg ? lap.sebesseg.ertek : '–'}</dd></div>
        <div><dt>Páncélérték</dt><dd>${lap.pancelertek.ertek}</dd></div>
      </dl>
      ${penzAblak ? html`<${PenzAblak} key=${penzAblak} kezdoIrany=${penzAblak} lapok=${lapok} adat=${adat} valtoztat=${valtoztat} onBezar=${() => setPenzAblak(null)}/>` : null}
      ${lap.pancel ? html`<p className="kicsi halvany" style=${{ margin: 0 }}>${lap.pancel.nev_hu}${lap.pancel.buntetes ? `, páncélbüntetés −${lap.pancel.buntetes} Sebesség${lap.pancel.ugyesseg_buntetes ? ' és Ügyesség alapú próbák' : ''}` : ''}.</p>` : null}
    </div>
  <//>`;
}

// ---- Próba: a közös Próba lap (web/js/app/proba.js), a dobás a karakter kampányának naplójába kerül ----
function ProbaAblak({ lap, kezdet, onBezar, karakter, adat, irhato, dm, valtoztat }) {
  const kampany = useKarakterKampanya(karakter);
  const naploz = useProbaNaplo();
  const mpLevon = valtoztat && lap.magiapont ? (ar) => valtoztat((d) => { d.allapot.magiapont = Math.max(0, lap.magiapont.aktualis - ar); }) : null;
  const valasztasok = (adat.jatek && adat.jatek.mutatvany_valasztasok) || {};
  const onValasztas = valtoztat ? (kulcs, ertek) => valtoztat((d) => {
    d.jatek = d.jatek || {};
    d.jatek.mutatvany_valasztasok = { ...(d.jatek.mutatvany_valasztasok || {}), [kulcs]: ertek };
  }) : null;
  const forrasok = (kampany && kampany.aktiv_forrasok && kampany.aktiv_forrasok.length ? kampany.aktiv_forrasok : (adat.keszites && adat.keszites.forrasok)) || [];
  return html`<${ProbaLap} lap=${lap} kezdet=${kezdet} onBezar=${onBezar}
    karakter=${{ id: karakter.id, nev: adat.nev || karakter.nev }} kampany=${kampany}
    naploz=${irhato ? naploz : null} rejtettLehet=${dm && !!kampany} onMpLevon=${mpLevon}
    forrasok=${forrasok} valasztasok=${valasztasok} onValasztas=${onValasztas}/>`;
}

function Tulajdonsagok(p) {
  const { lap } = p;
  const [proba, setProba] = useState(null);
  return html`<${K.Panel} title="Tulajdonságok">
    <p className="sugo kicsi" style=${{ margin: '0 0 8px' }}>Koppints egy tulajdonságra a próbához.</p>
    <dl className="ka-abilities tul-racs">${TULAJDONSAGOK.map((t) => {
      const fok = Object.values(lap.fokuszok).filter((f) => f.tulajdonsag === t);
      const x = lap.tulajdonsagok[t];
      return html`<div key=${t} className="ka-ability">
        <button type="button" className="tul-gomb" onClick=${() => setProba({ tul: t })}>
          <dt className="ka-ability__name">${TUL_NEV[t]}</dt>
          <dd className="ka-ability__value">${elojel(x.ertek)}</dd>
          ${fok.length ? html`<dd className="ka-ability__focus">${fok.map((f) => f.nev_hu + (f.bonusz === 3 ? ' (+3)' : '')).join(', ')}</dd>` : null}
          ${x.fejlesztes_fuggo ? html`<dd className="ka-ability__focus halvany">fejlesztés: ${x.fejlesztes_fuggo} kifizetve</dd>` : null}
        </button>
      </div>`;
    })}</dl>
    ${proba ? html`<${ProbaAblak} ...${p} kezdet=${proba} onBezar=${() => setProba(null)}/>` : null}
  <//>`;
}

function Fegyverek(p) {
  const { lap } = p;
  const [proba, setProba] = useState(null);
  const felszerelt = lap.fegyverek.filter((w) => w.felszerelve);
  const tobbi = lap.fegyverek.filter((w) => !w.felszerelve);
  const sor = (w) => html`<li key=${w.id} className="sorlista__sor">
    <button type="button" className="sorgomb-teljes" onClick=${() => setProba({ tul: w.tulajdonsag, fokusz: w.fokusz, tipus: 'tamadas',
      fegyver: { id: w.id, csoport: w.csoport, ketkezes: w.ketkezes, tavolsagi: w.tavolsagi },
      modositok: w.ismert ? [] : [{ ertek: -2, eredet: 'Nem ismert fegyvercsoport' }],
      hosszuTav: w.hosszu_tav, hosszuBuntetes: w.hosszu_buntetes,
      cim: 'Támadás: ' + w.nev_hu, megjegyzes: `Sebzés: ${w.sebzes}${w.hatotav ? ', hatótáv ' + w.hatotav : ''}.`
        + (w.ismert ? '' : ` Nem ismert fegyvercsoport: −2 a támadásra, fél sebzés${w.tavolsagi ? ' és fél hatótáv' : ''}.`)
        + (w.csoport_fokusz_nelkul ? ' Ehhez a fegyvercsoporthoz a könyv nem ad fókuszt. Ha a DM megengedi, fent választhatsz egy hasonlót (például Verekedés vagy Botok).' : '') })}>
      <span><strong>${w.nev_hu}</strong><br/><span className="halvany kicsi">${w.csoport_nev}${w.hatotav ? ' · ' + w.hatotav : ''}${w.ismert ? '' : ' · nem ismert csoport'}</span></span>
      <span className="fegyver-ertek"><span>${elojel(w.tamadas)}</span><span className="halvany kicsi">${w.sebzes}</span></span>
    </button>
  </li>`;
  // Arkánlövés (mágus, 1. szint): Pontosság (Arkánlövés), 16 yard, 1d6 + Akaraterő; mutatvány lehetséges.
  const arkan = lap.kepessegek.some((k) => k.nev_en === 'Arcane Blast');
  const arkanFok = lap.fokuszok.fok_accuracy_arcane_blast ? 'fok_accuracy_arcane_blast' : null;
  const arkanTamadas = (lap.tulajdonsagok.tul_accuracy ? lap.tulajdonsagok.tul_accuracy.ertek : 0) + (arkanFok ? lap.fokuszok[arkanFok].bonusz : 0);
  const akarat = lap.tulajdonsagok.tul_willpower ? lap.tulajdonsagok.tul_willpower.ertek : 0;
  const arkanSor = arkan ? html`<li key="arkan" className="sorlista__sor">
    <button type="button" className="sorgomb-teljes" onClick=${() => setProba({ tul: 'tul_accuracy', fokusz: arkanFok, tipus: 'tamadas', kepesseg: 'arkanloves',
      cim: 'Arkánlövés', megjegyzes: `Sebzés: 1d6${akarat ? ' ' + elojel(akarat) : ''}, hatótáv 16 yard. Az arkán eszköznek a kezedben kell lennie.` })}>
      <span><strong>Arkánlövés</strong><br/><span className="halvany kicsi">mágikus távolsági támadás · 16 yard</span></span>
      <span className="fegyver-ertek"><span>${elojel(arkanTamadas)}</span><span className="halvany kicsi">1d6${akarat ? elojel(akarat) : ''}</span></span>
    </button>
  </li>` : null;
  if (!lap.fegyverek.length && !arkan) return null;
  return html`<${K.Panel} title="Fegyverek">
    <ul className="sorlista">${arkanSor}${felszerelt.map(sor)}</ul>
    ${tobbi.length ? html`<details className="lenyilo"><summary>Nincs a kezében (${tobbi.length})</summary><ul className="sorlista">${tobbi.map(sor)}</ul></details>` : null}
    <p className="sugo kicsi" style=${{ margin: '8px 0 0' }}>Koppints egy fegyverre a támadópróbához. A kézben lévőket a Felszerelésnél állíthatod.</p>
    ${proba ? html`<${ProbaAblak} ...${p} kezdet=${proba} onBezar=${() => setProba(null)}/>` : null}
  <//>`;
}

function Varazslatok(p) {
  const { lap, lapok, valtoztat, irhato, karakter } = p;
  const kampany = useKarakterKampanya(karakter);
  const kerhet = !!kampany && (kampany.sajat_szerep === 'dm' || kampany.sajat_szerep === 'mester');
  const [proba, setProba] = useState(null);
  const [nyitott, setNyitott] = useState(null);
  const mp = lap.magiapont ? lap.magiapont.aktualis : 0;
  const akarat = lap.tulajdonsagok.tul_willpower.ertek;
  return html`<${K.Panel} title="Varázslatok">
    <div className="verem">
      ${lap.arkanumok.map((a) => {
        const fokId = reszletek(a.elem).fokusz;
        const fok = fokId && lap.fokuszok[fokId] ? lap.fokuszok[fokId].bonusz : 0;
        const vars = lap.varazslatok.filter((x) => x.arkanum === a.id);
        return html`<div key=${a.id} className="verem">
          <p className="cimke" style=${{ margin: 0 }}>${a.nev_hu} · ${a.fokozat} · Varázserő ${10 + akarat + fok}
            <${Sugo} cim="Varázslás">Varázslási próba: Intelligencia + az arkánum fókusza, legalább a varázslat Célértéke. A Mágiapontot sikertelen próbánál is ki kell fizetni. Varázserő: 10 + Akaraterő + az arkánum fókusza.<//></p>
          <ul className="sorlista">${vars.map((x) => {
            const r = reszletek(x.elem);
            const ar = r.mp && r.mp.min ? szam(r.mp.min) : szam(x.elem && x.elem.mp_koltseg);
            const cel = r.celertek && r.celertek.ertek ? r.celertek.ertek : (x.elem && x.elem.celertek);
            return html`<li key=${x.id} className="sorlista__sor sorlista__sor--fuggoleges">
              <button type="button" className="sorgomb-teljes" aria-expanded=${nyitott === x.id} onClick=${() => setNyitott(nyitott === x.id ? null : x.id)}>
                <span><strong>${x.nev_hu}</strong><br/><span className="halvany kicsi">${x.fokozat}${ar ? ` · ${ar}${r.mp && r.mp.plusz ? '+' : ''} MP` : ''}${cel ? ` · Célérték ${cel}` : ''}${x.elem && x.elem.varazslasi_ido ? ' · ' + x.elem.varazslasi_ido : ''}${r.proba && r.proba.tulajdonsag ? ' · célpont: ' + celpontProbaNev(r.proba, lapok) : ''}</span></span>
              </button>
              ${nyitott === x.id ? html`<div className="verem">
                ${x.elem && x.elem.leiras_hu ? html`<p className="kicsi" style=${{ margin: 0 }}>${x.elem.leiras_hu}</p>` : null}
                <div className="gombsor">
                  <${K.Button} size="sm" variant="secondary" onClick=${() => setProba({ tul: 'tul_intelligence', fokusz: fokId, celertek: cel, tipus: 'varazslas', mp_ar: ar || 0, cim: 'Varázslás: ' + x.nev_hu, megjegyzes: ar ? `Ára ${ar} Mágiapont (sikertelen próbánál is).` : '' })}>Varázslási próba<//>
                  ${irhato && ar ? html`<${K.Button} size="sm" variant=${mp >= ar ? 'primary' : 'quiet'} onClick=${() => valtoztat((d) => { d.allapot.magiapont = Math.max(0, mp - ar); })}>−${ar} MP${mp < ar ? ' (nincs elég)' : ''}<//>` : null}
                </div>
                <${CelpontProbaGomb} varazslat=${x.elem} varazsero=${10 + akarat + fok} kampany=${kampany} kerhet=${kerhet}/>
              </div>` : null}
            </li>`;
          })}</ul>
        </div>`;
      })}
    </div>
    ${proba ? html`<${ProbaAblak} ...${p} kezdet=${proba} onBezar=${() => setProba(null)}/>` : null}
  <//>`;
}

function Talentumok({ lap }) {
  const lista = lap.specializaciok.concat(lap.talentumok, lap.arkanumok);
  const fokSzoveg = (t) => { const e = t.elem || {}; return t.fokozat === 'Mester' ? e.mester : t.fokozat === 'Haladó' ? e.halado : e.kezdo; };
  return html`<${K.Panel} title="Talentumok és képességek">
    <div className="verem">
      ${lista.length ? html`<ul className="sorlista">${lista.map((t) => html`<li key=${t.id} className="sorlista__sor sorlista__sor--fuggoleges">
        <details className="lenyilo lenyilo--sor"><summary><strong>${t.nev_hu}</strong> <span className="halvany kicsi">${t.fokozat}</span></summary>
          ${['Kezdő', 'Haladó', 'Mester'].filter((f) => fokozatSzam(f) <= t.db).map((f) => {
            const e = t.elem || {};
            const sz = f === 'Mester' ? e.mester : f === 'Haladó' ? e.halado : e.kezdo;
            return sz ? html`<p key=${f} className="kicsi" style=${{ margin: '4px 0' }}><strong>${f}:</strong> ${sz}</p>` : null;
          })}
          ${!fokSzoveg(t) && t.elem && t.elem.leiras_hu ? html`<p className="kicsi">${t.elem.leiras_hu}</p>` : null}
        </details>
      </li>`)}</ul>` : html`<p className="halvany">Még nincs talentum.</p>`}
      ${lap.kepessegek.length ? html`<details className="lenyilo"><summary>Osztály- és faji képességek (${lap.kepessegek.length})</summary>
        <ul className="sorlista">${lap.kepessegek.map((k, i) => html`<li key=${i} className="sorlista__sor sorlista__sor--fuggoleges">
          <strong>${k.nev_hu}</strong><span className="halvany kicsi">${k.eredet}</span>${k.leiras ? html`<span className="kicsi">${rovid(k.leiras, 260)}</span>` : null}</li>`)}</ul>
      </details>` : null}
      ${lap.fegyvercsoportok.length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Fegyvercsoportok:</strong> ${lap.fegyvercsoportok.map((c) => c.nev_hu).join(', ')}</p>` : null}
      ${lap.nyelvek.length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Nyelvek:</strong> ${lap.nyelvek.join(', ')}</p>` : null}
    </div>
  <//>`;
}

// ---- Felszerelés és pénz ----
function PenzBevitel({ ertek, set, cimke }) {
  const mezo = (k, nev, max) => html`<${K.TextField} label=${nev} inputMode="numeric" aria-label=${cimke + ': ' + nev.toLowerCase()} value=${ertek[k] || ''}
    onChange=${(e) => set({ ...ertek, [k]: e.target.value.replace(/[^0-9]/g, '').slice(0, max) })}/>`;
  return html`<fieldset className="szakasz"><legend className="cimke">${cimke}</legend>
    <div className="penzbevitel">${mezo('a', 'Arany', 5)}${mezo('e', 'Ezüst', 6)}${mezo('r', 'Réz', 3)}</div>
  </fieldset>`;
}
const penzRezben = J.penzRezben;

function Bolt({ ix, lapok, adat, valtoztat, onBezar }) {
  const [kereso, setKereso] = useState('');
  const [kategoria, setKategoria] = useState('Mind');
  const [hol, setHol] = useState('');
  const [db, setDb] = useState(20);
  const kategoriak = ['Mind'].concat([...new Set(ix.lista('Felszerelés').map((x) => x.kategoria).filter((k) => k && k !== 'Kezdő felszerelés'))], ['Fegyverek', 'Páncélok']);
  const illik = (e) => !kereso || [e.nev_hu, e.nev_en].join(' ').toLowerCase().includes(kereso.trim().toLowerCase());
  const aruk = (kategoria === 'Fegyverek' ? ix.lista('Fegyverek') : kategoria === 'Páncélok' ? ix.lista('Páncélok')
    : kategoria === 'Mind' ? ix.lista('Felszerelés').concat(ix.lista('Fegyverek'), ix.lista('Páncélok')) : ix.lista('Felszerelés').filter((x) => x.kategoria === kategoria))
    .filter((x) => V.arRez(x) !== null && illik(x));
  return html`<${Parbeszed} cim="Vásárlás" onBezar=${onBezar} lab=${html`<span className="osszegsor__ertek">${V.penzSzoveg(adat.felszereles.penz_rez || 0)}</span><${K.Button} variant="primary" onClick=${onBezar}>Kész<//>`}>
    <div className="verem">
      <${K.TextField} label="Hol (nem kötelező)" hint="Például: Vásártér, Kovácsműhely. A későbbi boltokhoz is megmarad." value=${hol} onChange=${(e) => setHol(e.target.value)}/>
      <div className="csipek">${kategoriak.map((k) => html`<button key=${k} type="button" className="csip" aria-pressed=${kategoria === k} onClick=${() => { setKategoria(k); setDb(20); }}>${k}</button>`)}</div>
      <${K.TextField} label="Áru keresése" type="search" value=${kereso} onChange=${(e) => { setKereso(e.target.value); setDb(20); }}/>
      <ul className="sorlista">${aruk.slice(0, db).map((x) => html`<li key=${x.id} className="sorlista__sor">
        <span>${x.nev_hu}<br/><span className="halvany kicsi">${V.penzSzoveg(V.arRez(x))}</span></span>
        <span className="sorlista__muvelet"><${K.Button} size="sm" onClick=${() => valtoztat((a) => L.vetel(a, lapok, x.id, 1, null, hol))}>Vétel<//></span>
      </li>`)}</ul>
      ${aruk.length > db ? html`<div><${K.Button} variant="quiet" onClick=${() => setDb(db + 20)}>Továbbiak (${aruk.length - db})<//></div>` : null}
    </div>
  <//>`;
}

function EladasAblak({ ix, lapok, targy, valtoztat, onBezar }) {
  const lista = V.arRez(ix.elem(V.targyLap(targy.id), targy.id));
  const javasolt = lista ? Math.floor(lista * L.ELADASI_ARANY) : 0;
  const [ar, setAr] = useState({ e: String(Math.floor(javasolt / 10)), r: String(javasolt % 10) });
  return html`<${Parbeszed} cim=${'Eladás: ' + targyNev(ix, targy)} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" onClick=${() => { valtoztat((a) => L.eladas(a, lapok, targy.id, 1, penzRezben(ar), targy.nev)); onBezar(); }}>Eladás<//>`}>
    <div className="verem">
      <p className="sugo">${lista ? `Listaár: ${V.penzSzoveg(lista)}. A kereskedők általában a negyedét adják, ritka holmiért többet; a DM dönt.` : 'Ennek a tárgynak nincs listaára, írd be, mennyit kapsz érte.'}</p>
      <${PenzBevitel} ertek=${ar} set=${setAr} cimke="Kapott összeg"/>
    </div>
  <//>`;
}

function PenzAblak({ lapok, adat, valtoztat, onBezar, kezdoIrany = 'be' }) {
  const [irany, setIrany] = useState(kezdoIrany);
  const [osszeg, setOsszeg] = useState({ e: '', r: '' });
  const [megj, setMegj] = useState('');
  const rez = penzRezben(osszeg);
  return html`<${Parbeszed} cim="Pénz" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!rez} onClick=${() => { valtoztat((a) => L.penzValtozas(a, lapok, irany === 'be' ? rez : -rez, megj)); onBezar(); }}>Rögzítés<//>`}>
    <div className="verem">
      <div className="kapcsolo" role="group" aria-label="Irány">
        <button type="button" aria-pressed=${irany === 'be'} onClick=${() => setIrany('be')}>Bevétel</button>
        <button type="button" aria-pressed=${irany === 'ki'} onClick=${() => setIrany('ki')}>Kiadás</button>
      </div>
      <div className="csipek" role="group" aria-label="Gyorsösszegek">${[1, 5, 10, 50].map((n) => html`<button key=${n} type="button" className="csip"
        onClick=${() => setOsszeg(J.penzHozzaad(osszeg, n))}>+${n} ezüst</button>`)}
        ${rez ? html`<button type="button" className="csip" onClick=${() => setOsszeg({ a: '', e: '', r: '' })}>Törlés</button>` : null}</div>
      <${PenzBevitel} ertek=${osszeg} set=${setOsszeg} cimke="Összeg"/>
      ${rez ? html`<p className="kicsi">${irany === 'be' ? 'Bevétel' : 'Kiadás'}: <strong>${V.penzSzoveg(rez)}</strong>${adat ? html`, utána <strong>${V.penzSzoveg((adat.felszereles.penz_rez || 0) + (irany === 'be' ? rez : -rez))}</strong>` : null}</p>` : null}
      ${adat && irany === 'ki' && rez > (adat.felszereles.penz_rez || 0) ? html`<${Uzenet} tonus="warning">Ennyi pénze nincs: az egyenleg mínuszba megy (Pénz túlköltése).<//>` : null}
      <${K.TextField} label="Mire, honnan" hint="Például: zsákmány, jutalom, szállás." value=${megj} onChange=${(e) => setMegj(e.target.value)}/>
      <p className="sugo kicsi">1 arany = 10 ezüst = 100 réz.</p>
      ${adat && J.utolsoPenztetelek(adat).length ? html`<div><p className="cimke">Legutóbbi pénztételek</p><ul className="sorlista">
        ${J.utolsoPenztetelek(adat).map((t, i) => html`<li key=${i} className="sorlista__sor"><span>${t.megjegyzes || L.TETEL_NEV[t.tipus] || t.tipus}<br/><span className="halvany kicsi">${datum(t.idopont)}</span></span>
          <strong>${t.penz > 0 ? '+' : ''}${V.penzSzoveg(t.penz)}</strong></li>`)}</ul></div>` : null}
    </div>
  <//>`;
}

function TargyAblak({ ix, lapok, valtoztat, onBezar }) {
  const [kereso, setKereso] = useState('');
  const [sajat, setSajat] = useState('');
  const [megj, setMegj] = useState('');
  const illik = (e) => kereso.trim().length >= 2 && [e.nev_hu, e.nev_en].join(' ').toLowerCase().includes(kereso.trim().toLowerCase());
  const talalat = ix.lista('Felszerelés').concat(ix.lista('Fegyverek'), ix.lista('Páncélok')).filter(illik).slice(0, 20);
  const hozzaad = (x) => { valtoztat((a) => L.targyHozzaad(a, lapok, x, 1, megj)); onBezar(); };
  return html`<${Parbeszed} cim="Tárgy hozzáadása" onBezar=${onBezar}>
    <div className="verem">
      <p className="sugo">Talált, kapott vagy zsákmányolt holmi, pénz nélkül. Válassz a szabálykönyv tárgyai közül, vagy írj saját nevet.</p>
      <${K.TextField} label="Megjegyzés (nem kötelező)" value=${megj} onChange=${(e) => setMegj(e.target.value)}/>
      <${K.TextField} label="Keresés a tárgyak között" type="search" value=${kereso} onChange=${(e) => setKereso(e.target.value)}/>
      ${talalat.length ? html`<ul className="sorlista">${talalat.map((x) => html`<li key=${x.id} className="sorlista__sor">
        <span>${x.nev_hu}</span><span className="sorlista__muvelet"><${K.Button} size="sm" onClick=${() => hozzaad({ id: x.id })}>Hozzáadás<//></span></li>`)}</ul>` : null}
      <div className="sorban" style=${{ alignItems: 'flex-end' }}>
        <${K.TextField} label="Saját tárgy neve" value=${sajat} onChange=${(e) => setSajat(e.target.value)}/>
        <${K.Button} disabled=${!sajat.trim()} onClick=${() => hozzaad({ nev: sajat })}>Hozzáadás<//>
      </div>
    </div>
  <//>`;
}

function Felszereles({ adat, lap, ix, lapok, valtoztat, irhato }) {
  const [ablak, setAblak] = useState(null); // bolt | penz | targy | { eladas: targy }
  const [elvesz, setElvesz] = useState(null);
  const f = adat.felszereles;
  const targyak = f.targyak || [];
  const jatek = f.jatek || [];
  const viselheto = (t) => t.id.startsWith('pan_') || t.id.startsWith('fgy_');
  return html`<${K.Panel} title="Felszerelés és pénz">
    <div className="verem">
      <div className="osszegsor"><span className="osszegsor__nev">Pénz</span><span className="osszegsor__ertek">${V.penzSzoveg(f.penz_rez || 0)}</span></div>
      ${irhato ? html`<div className="gombsor">
        <${K.Button} size="sm" variant="secondary" onClick=${() => setAblak('bolt')}>Vásárlás<//>
        <${K.Button} size="sm" variant="secondary" onClick=${() => setAblak('penz')}>Pénz ±<//>
        <${K.Button} size="sm" variant="secondary" onClick=${() => setAblak('targy')}>Tárgy hozzáadása<//>
      </div>` : null}
      <ul className="sorlista">${targyak.map((t) => html`<li key=${t.id} className="sorlista__sor">
        <span>${targyNev(ix, t)}${t.db > 1 ? html` <strong>× ${t.db}</strong>` : null}</span>
        ${irhato ? html`<span className="sorlista__muvelet">
          ${viselheto(t) ? html`<button type="button" className="csip csip--kicsi" aria-pressed=${!!t.felszerelve}
            onClick=${() => valtoztat((a) => { const x = a.felszereles.targyak.find((y) => y.id === t.id); if (x) x.felszerelve = !x.felszerelve; })}>${t.felszerelve ? '✓ Rajta' : 'Felvesz'}</button>` : null}
          <button type="button" className="sorgomb" onClick=${() => setElvesz(t)} aria-label=${targyNev(ix, t) + ': eladás vagy elvesztés'}>…</button>
        </span>` : (t.felszerelve ? html`<span className="halvany kicsi">rajta</span>` : null)}
      </li>`)}</ul>
      ${!targyak.length ? html`<p className="halvany">Nincs felszerelés.</p>` : null}
      ${jatek.length ? html`<details className="lenyilo"><summary>Játék közbeni tételek (${jatek.length})</summary>
        <ul className="sorlista">${jatek.slice().reverse().map((t, ri) => {
          const i = jatek.length - 1 - ri;
          const tt = L.tetelTargyai(t);
          return html`<li key=${i} className="sorlista__sor">
            <span><strong>${L.TETEL_NEV[t.tipus] || t.tipus}</strong>${tt.length ? ': ' + tt.map((x) => `${x.db > 0 ? '+' : ''}${x.db} ${targyNev(ix, x)}`).join(', ') : ''}
              ${t.megjegyzes ? html` <span className="halvany">(${t.megjegyzes})</span>` : null}${t.hol ? html` <span className="halvany">· ${t.hol}</span>` : null}<br/>
              <span className="halvany kicsi">${datum(t.idopont)}${t.penz ? ' · ' + (t.penz > 0 ? '+' : '') + V.penzSzoveg(t.penz) : ''}</span></span>
            ${irhato && t.tipus !== 'osszevont' ? html`<span className="sorlista__muvelet"><${K.Button} size="sm" variant="quiet" onClick=${() => valtoztat((a) => L.tetelTorol(a, lapok, i))}>Visszavonás<//></span>` : null}
          </li>`;
        })}</ul>
      </details>` : null}
    </div>
    ${ablak === 'bolt' ? html`<${Bolt} ix=${ix} lapok=${lapok} adat=${adat} valtoztat=${valtoztat} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak === 'penz' ? html`<${PenzAblak} lapok=${lapok} adat=${adat} valtoztat=${valtoztat} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak === 'targy' ? html`<${TargyAblak} ix=${ix} lapok=${lapok} valtoztat=${valtoztat} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.eladas ? html`<${EladasAblak} ix=${ix} lapok=${lapok} targy=${ablak.eladas} valtoztat=${valtoztat} onBezar=${() => setAblak(null)}/>` : null}
    ${elvesz ? html`<${Parbeszed} cim=${targyNev(ix, elvesz)} onBezar=${() => setElvesz(null)} lab=${html`<${K.Button} variant="quiet" onClick=${() => setElvesz(null)}>Mégse<//>`}>
      <div className="verem">
        <${K.Button} variant="secondary" onClick=${() => { setAblak({ eladas: elvesz }); setElvesz(null); }}>Eladás<//>
        <${K.Button} variant="secondary" onClick=${() => { valtoztat((a) => L.targyElvesz(a, lapok, elvesz.id, 1, 'elhasználva', elvesz.nev)); setElvesz(null); }}>Elhasználtam (−1)<//>
        <${K.Button} variant="secondary" onClick=${() => { valtoztat((a) => L.targyElvesz(a, lapok, elvesz.id, 1, 'elveszett', elvesz.nev)); setElvesz(null); }}>Elveszett vagy odaadtam (−1)<//>
      </div>
    <//>` : null}
  <//>`;
}

// ---- Jegyzetek (6.1): a karakterrel utaznak, aki a karaktert szerkesztheti, írhatja ----
function Jegyzetek({ adat, valtoztat, irhato }) {
  const { felhasznalo } = useApp();
  const [szerk, setSzerk] = useState(null); // a szerkesztett jegyzet azonosítója
  const [torolt, setTorolt] = useState(null);
  const lista = J.jegyzetek(adat);
  const lehet = irhato && valtoztat;
  const meret = J.jegyzetMeret(adat);
  const uj = () => {
    const id = J.ujJegyzetId();
    const idopont = new Date().toISOString();
    valtoztat((a) => { J.jegyzetHozzaad(a, { id, ki: felhasznalo.nev, idopont }); });
    setTorolt(null);
    setSzerk(id);
  };
  const torol = (j) => { valtoztat((a) => { J.jegyzetTorol(a, j.id); }); setTorolt(j); setSzerk(null); };
  return html`<${K.Panel} title="Jegyzetek" actions=${lehet ? html`<${K.Button} size="sm" variant="secondary" onClick=${uj} icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Jegyzet<//>` : null}>
    <div className="verem">
      ${torolt ? html`<div className="sorban sorban--kozep visszavonosor"><span className="kicsi">Jegyzet törölve${torolt.cim ? ': ' + torolt.cim : ''}.</span>
        <button type="button" className="szoveggomb" onClick=${() => { const j = torolt; valtoztat((a) => J.jegyzetVissza(a, j)); setTorolt(null); }}>Visszavonás</button></div>` : null}
      ${lista.length ? html`<ul className="jegyzetlista">${lista.map((j) => html`<li key=${j.id} className=${'jegyzet' + (j.rogzitett ? ' jegyzet--rogzitett' : '')}>
        ${szerk === j.id && lehet ? html`<div className="verem verem--kicsi">
          <${K.TextField} label="Cím (nem kötelező)" value=${j.cim || ''} onChange=${(e) => { const x = e.target.value; valtoztat((a) => { J.jegyzetModosit(a, j.id, { cim: x }); }); }}/>
          <${K.TextField} label="Jegyzet" multiline=${true} rows=${4} value=${j.szoveg || ''} onChange=${(e) => { const x = e.target.value; valtoztat((a) => { J.jegyzetModosit(a, j.id, { szoveg: x }); }); }}/>
          <div className="gombsor gombsor--szoros">
            <${K.Button} size="sm" variant="primary" onClick=${() => { if (!String(j.cim || '').trim() && !String(j.szoveg || '').trim()) torol(j); else setSzerk(null); }}>Kész<//>
            <${K.Button} size="sm" variant="quiet" onClick=${() => torol(j)}>Törlés<//>
          </div>
        </div>` : html`<div className="jegyzet__test">
          ${j.cim ? html`<p className="jegyzet__cim">${j.cim}</p>` : null}
          ${j.szoveg ? html`<p className="jegyzet__szoveg">${j.szoveg}</p>` : html`<p className="halvany kicsi">(üres jegyzet)</p>`}
          <div className="sorban sorban--kozep">
            <span className="halvany kicsi">${j.ki ? j.ki + ' · ' : ''}${datum(j.modositva || j.idopont)}</span>
            ${lehet ? html`<span className="gombsor gombsor--szoros">
              <button type="button" className="csip csip--kicsi" aria-pressed=${!!j.rogzitett} onClick=${() => valtoztat((a) => { J.jegyzetModosit(a, j.id, { rogzitett: !j.rogzitett }); })}>${j.rogzitett ? '✓ Rögzítve' : 'Rögzítés'}</button>
              <button type="button" className="szoveggomb" onClick=${() => { setSzerk(j.id); setTorolt(null); }}>Szerkesztés</button>
            </span>` : null}
          </div>
        </div>`}
      </li>`)}</ul>` : html`<p className="halvany">${lehet ? 'Ide írhatod, amit a karakter tud, gyanít vagy meg akar jegyezni. A jegyzetek a karakterrel maradnak minden kampányban.' : 'Nincs jegyzet.'}</p>`}
      ${meret > J.FIGYELMEZTETES_HATAR ? html`<${Uzenet} tonus="warning">Sok a jegyzet: érdemes a régieket törölni vagy összevonni, mert a karakter adata korlátos méretű.<//>` : null}
    </div>
  <//>`;
}

function Tortenet({ adat, lap, ix }) {
  const celok = adat.alap.celok || [];
  const kotelekek = (adat.alap.kotelekek || []).filter((k) => k.nev);
  return html`<${K.Panel} title="Háttér és történet">
    <div className="verem">
      ${lap.hatter ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Háttér:</strong> ${lap.hatter.nev_hu}${lap.hatter.tarsadalmi_osztaly ? ` (${lap.hatter.tarsadalmi_osztaly} osztály)` : ''}</p>` : null}
      ${adat.alap.koncepcio ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Koncepció:</strong> ${adat.alap.koncepcio}</p>` : null}
      ${adat.alap.megjelenes ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Megjelenés:</strong> ${adat.alap.megjelenes}</p>` : null}
      ${celok.map((c, i) => html`<p key=${i} className="kicsi" style=${{ margin: 0 }}><strong>${c.tipus === 'rovid' ? 'Rövid távú cél' : 'Hosszú távú cél'}:</strong> ${c.szoveg}</p>`)}
      ${kotelekek.length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Kötelékek:</strong> ${kotelekek.map((k) => k.nev + (k.leiras ? ' (' + k.leiras + ')' : '')).join('; ')}</p>` : null}
      ${!lap.hatter && !adat.alap.koncepcio && !celok.length ? html`<p className="halvany">Még nincs leírás. A Szerkesztés módban pótolható.</p>` : null}
    </div>
  <//>`;
}

function Figyelmeztetesek({ lap, dm, valtoztat }) {
  const lista = lap.figyelmeztetesek.filter((f) => f.szint === 'figyelmeztetes');
  if (!lista.length) return null;
  const elfogad = (kulcs, be) => valtoztat && valtoztat((a) => { const s = new Set(a.elfogadott || []); be ? s.add(kulcs) : s.delete(kulcs); a.elfogadott = [...s]; });
  const nyitott = lista.filter((f) => !f.elfogadott).length;
  return html`<${K.Panel} title=${`Figyelmeztetések (${nyitott})`}>
    <div className="verem">${lista.map((f) => html`<div key=${f.kulcs} className=${'uzenet ' + (f.elfogadott ? 'uzenet--elfogadott' : 'uzenet--warning') + ' figyuzenet'} role="status">
      <span>${f.elfogadott ? '✓ Elfogadva: ' : '⚠ '}${f.uzenet}</span>
      ${dm && valtoztat ? html`<span className="figyuzenet__gombok"><button type="button" className="figygomb figygomb--halk" onClick=${() => elfogad(f.kulcs, !f.elfogadott)}>${f.elfogadott ? 'Elfogadás visszavonása' : 'Elfogadom (DM)'}</button></span>` : null}
    </div>`)}</div>
  <//>`;
}

const MIRE = (m) => {
  const [a, b] = String(m || '').split(':');
  return { tul: 'Tulajdonság', dobas: 'Elrendezés', elony: 'Faji előny', fajta: 'Fajta', hatter: 'Háttér', egeszseg: 'Egészség', mp: 'Mágiapont', penz: 'Kezdőpénz' }[a] + (b && /^\d+$/.test(b) && (a === 'egeszseg' || a === 'mp') ? ` (${b}. szint)` : '');
};
function Naplok({ karakter, adat, lap, lapok, irhato, dm, valtoztat }) {
  const xp = (adat.xp_naplo || []).slice().reverse();
  const dobasok = (adat.dobasok || []).slice().reverse();
  const kampany = useKarakterKampanya(karakter);
  // a mutatványok utólagos rögzítéséhez (csak aki a karaktert szerkesztheti)
  const kornyezet = irhato && lapok ? {
    lapok, lap, beallitas: kampany && kampany.beallitasok,
    forrasok: (kampany && kampany.aktiv_forrasok && kampany.aktiv_forrasok.length ? kampany.aktiv_forrasok : (adat.keszites && adat.keszites.forrasok)) || [],
    valasztasok: (adat.jatek && adat.jatek.mutatvany_valasztasok) || {},
    onValasztas: valtoztat ? (kulcs, ertek) => valtoztat((d) => {
      d.jatek = d.jatek || {};
      d.jatek.mutatvany_valasztasok = { ...(d.jatek.mutatvany_valasztasok || {}), [kulcs]: ertek };
    }) : null
  } : null;
  return html`<${K.Panel} title="Napló">
    <div className="verem">
      <${KarakterDobasai} karakter=${karakter} adat=${adat} dm=${dm} kampany=${kampany} kornyezet=${kornyezet}/>
      ${xp.length ? html`<details className="lenyilo"><summary>Tapasztalat (${xp.length})</summary>
        <ul className="sorlista">${xp.map((x, i) => html`<li key=${i} className="sorlista__sor">
          <span>${xpTipusNev(x.tipus)}${x.ok ? ': ' + x.ok : ''}<br/><span className="halvany kicsi">${datum(x.idopont)}${x.ki ? ' · ' + x.ki : ''}</span></span>
          <strong>${x.xp > 0 ? '+' : ''}${x.xp} XP</strong></li>`)}</ul>
      </details>` : null}
      ${dobasok.length ? html`<details className="lenyilo"><summary>Készítés és szintlépés dobásai (${dobasok.length})</summary>
        <ul className="sorlista">${dobasok.slice(0, 80).map((d, i) => html`<li key=${i} className="sorlista__sor">
          <span>${MIRE(d.mire)}${d.kezi ? html` <span className="kezijel">beírt</span>` : null}</span>
          <span className="halvany">${(d.kockak || []).join(' + ')}</span></li>`)}</ul>
      </details>` : null}
    </div>
  <//>`;
}

// =================== Szerkesztés mód ===================
const KESZITO_LEPESEK = [['keret', 'Keret és források'], ['tulajdonsagok', 'Tulajdonságok'], ['faj', 'Faj'], ['hatter', 'Háttér'],
  ['osztaly', 'Osztály (1. szint)'], ['felszereles', 'Kezdő felszerelés'], ['nev', 'Név és célok']];
const KEZI_CELOK = [['egeszseg_max', 'Egészség (maximum)'], ['magiapont_max', 'Mágiapont (maximum)'], ['vedekezes', 'Védekezés'], ['sebesseg', 'Sebesség'], ['pancelertek', 'Páncélérték']];

function SzerkesztoMod({ karakter, adat, lap, ix, alap, valtoztat, v, dm }) {
  const [ujraNyit, setUjraNyit] = useState(false);
  const cel = (tipus) => ((adat.alap.celok || []).find((c) => c.tipus === tipus) || {}).szoveg || '';
  const celBeallit = (tipus, szoveg) => valtoztat((a) => {
    const c = (a.alap.celok || []).filter((x) => x.tipus !== tipus);
    if (szoveg) c.push({ tipus, szoveg });
    a.alap.celok = c;
  });
  const kotelekek = adat.alap.kotelekek || [];
  const utolso = adat.szintek[adat.szintek.length - 1];
  const javithato = utolso && utolso.szint >= 2 && utolso.kesz === true && !felkeszSzint(adat);
  return html`<div className="klap__racs">
    <div className="verem verem--nagy">
      <${K.Panel} title="Kép">
        <${KepFeltolto} karakterId=${karakter.id} kep=${adat.alap.kep} nev=${adat.nev}
          onKesz=${(valasz) => v.kulsoModositas(valasz.verzio, (a) => { a.alap.kep = valasz.kep; })}/>
        <p className="sugo kicsi" style=${{ marginTop: '8px' }}>Telefonon fényképezhetsz is. A kép négyzetesre vágva, kicsinyítve kerül a Drive-ra; csak a DM és a kampányok tagjai látják.</p>
      <//>
      <${K.Panel} title="Leírás">
        <div className="verem">
          <${K.TextField} label="Név" value=${adat.nev} onChange=${(e) => { const x = e.target.value; valtoztat((a) => { a.nev = x; }); }}/>
          <${K.TextField} label="Koncepció" multiline=${true} rows=${2} value=${adat.alap.koncepcio || ''} onChange=${(e) => { const x = e.target.value; valtoztat((a) => { a.alap.koncepcio = x; }); }}/>
          <${K.TextField} label="Megjelenés" multiline=${true} rows=${2} value=${adat.alap.megjelenes || ''} onChange=${(e) => { const x = e.target.value; valtoztat((a) => { a.alap.megjelenes = x; }); }}/>
          <${K.TextField} label="Rövid távú cél" value=${cel('rovid')} onChange=${(e) => celBeallit('rovid', e.target.value)}/>
          <${K.TextField} label="Hosszú távú cél" value=${cel('hosszu')} onChange=${(e) => celBeallit('hosszu', e.target.value)}/>
          <p className="cimke" style=${{ margin: 0 }}>Kötelékek</p>
          ${kotelekek.map((k, i) => html`<div key=${i} className="sorban" style=${{ alignItems: 'flex-end' }}>
            <${K.TextField} label="Kivel" value=${k.nev || ''} onChange=${(e) => { const x = e.target.value; valtoztat((a) => { a.alap.kotelekek[i].nev = x; }); }}/>
            <${K.TextField} label="A kötelék" value=${k.leiras || ''} onChange=${(e) => { const x = e.target.value; valtoztat((a) => { a.alap.kotelekek[i].leiras = x; }); }}/>
            <${K.Button} size="sm" variant="quiet" onClick=${() => valtoztat((a) => { a.alap.kotelekek = a.alap.kotelekek.filter((_, j) => j !== i); })}>Törlés<//>
          </div>`)}
          <div><${K.Button} variant="quiet" onClick=${() => valtoztat((a) => { a.alap.kotelekek = (a.alap.kotelekek || []).concat([{ nev: '', leiras: '' }]); })}
            icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Kötelék hozzáadása<//></div>
        </div>
      <//>
    </div>
    <div className="verem verem--nagy">
      <${K.Panel} title="A karakterkészítő lépései">
        <p className="sugo kicsi" style=${{ margin: '0 0 8px' }}>Egy lépés újranyitásakor a függő értékek újraszámolódnak; a játék közbeni vásárlások és a pénz megmaradnak.</p>
        <div className="csipek">${KESZITO_LEPESEK.map(([k, n]) => html`<button key=${k} type="button" className="csip" onClick=${() => navigal(alap + '/keszites/' + k)}>${n}</button>`)}</div>
      <//>
      <${K.Panel} title="Szintek">
        <div className="verem">
          <ul className="sorlista">${adat.szintek.map((s) => html`<li key=${s.szint} className="sorlista__sor">
            <span>${s.szint}. szint${s.kesz === false ? html` <span className="halvany">(folyamatban)</span>` : null}</span>
            <span className="halvany kicsi">${[s.fejlesztes ? TUL_NEV[s.fejlesztes] : '', s.fokusz ? fokuszNev(ix, s.fokusz) : ''].filter(Boolean).join(' · ')}</span>
          </li>`)}</ul>
          <div className="gombsor">
            <${SzintlepesGomb} karakter=${{ ...karakter, adat }} alap=${alap}/>
            ${javithato ? html`<${K.Button} variant="quiet" onClick=${() => setUjraNyit(true)}>A ${utolso.szint}. szint javítása<//>` : null}
          </div>
        </div>
      <//>
      <${Jegyzetek} adat=${adat} valtoztat=${valtoztat} irhato=${true}/>
      <${KeziModositok} adat=${adat} ix=${ix} valtoztat=${valtoztat} dm=${dm}/>
      <${Figyelmeztetesek} lap=${lap} dm=${dm} valtoztat=${valtoztat}/>
    </div>
    ${ujraNyit ? html`<${Megerosites} cim=${`A ${utolso.szint}. szint javítása`} gomb="Újranyitás"
      szoveg=${`A ${utolso.szint}. szint újra nyitott lesz a szintlépés-varázslóban, a döntései megmaradnak. A lezárásig a karakterlap ${utolso.szint - 1}. szintű karakterként számol.`}
      onMegse=${() => setUjraNyit(false)}
      onIgen=${async () => {
        setUjraNyit(false);
        valtoztat((a) => { const s = a.szintek[a.szintek.length - 1]; s.kesz = false; a.szintlepes = { cel: s.szint, kezdo: s.szint, lepes: 'attekintes', elert: 4 }; });
        await v.ment();
        navigal(alap + '/szintlepes/attekintes');
      }}/>` : null}
  </div>`;
}

function KeziModositok({ adat, ix, valtoztat, dm }) {
  const [uj, setUj] = useState({ cel: 'egeszseg_max', ertek: '', mod: 'hozzaad', megjegyzes: '' });
  const celNev = (c) => {
    if (TUL_NEV[c]) return TUL_NEV[c];
    if (String(c).startsWith('fok_')) return 'Fókusz: ' + fokuszNev(ix, c);
    if (String(c).startsWith('fcs_')) return 'Fegyvercsoport: ' + elemNev(ix, 'Fegyvercsoportok', c);
    return (KEZI_CELOK.find(([k]) => k === c) || [c, c])[1];
  };
  const opciok = KEZI_CELOK.map(([v, l]) => ({ value: v, label: l }))
    .concat(TULAJDONSAGOK.map((t) => ({ value: t, label: TUL_NEV[t] })))
    .concat(ix.lista('Fókuszok').map((f) => ({ value: f.id, label: 'Fókusz: ' + fokuszNev(ix, f.id) })).sort((a, b) => a.label.localeCompare(b.label, 'hu')))
    .concat(ix.lista('Fegyvercsoportok').map((c) => ({ value: c.id, label: 'Fegyvercsoport: ' + c.nev_hu })));
  const fokuszE = String(uj.cel).startsWith('fok_') || String(uj.cel).startsWith('fcs_');
  const hozzaad = () => valtoztat((a) => {
    a.kezi = (a.kezi || []).concat([{ cel: uj.cel, ertek: fokuszE ? (szam(uj.ertek) >= 3 ? 3 : 2) : szam(uj.ertek), mod: fokuszE ? 'hozzaad' : uj.mod, megjegyzes: uj.megjegyzes, ki: dm ? 'dm' : 'jatekos' }]);
  });
  return html`<${K.Panel} title="Kézi módosítók">
    <div className="verem">
      <p className="sugo kicsi" style=${{ margin: 0 }}>Bármire tehető módosító (mágikus tárgy, DM ajándéka, sérülés). A lapon tájékoztatásként jelölve marad.</p>
      ${(adat.kezi || []).length ? html`<ul className="sorlista">${adat.kezi.map((k, i) => html`<li key=${i} className="sorlista__sor">
        <span>${celNev(k.cel)} ${k.mod === 'felulir' ? '= ' : (szam(k.ertek) >= 0 ? '+' : '')}${k.ertek}${k.megjegyzes ? html`<br/><span className="halvany kicsi">${k.megjegyzes}</span>` : null}</span>
        <span className="sorlista__muvelet"><${K.Button} size="sm" variant="quiet" onClick=${() => valtoztat((a) => { a.kezi = a.kezi.filter((_, j) => j !== i); })}>Törlés<//></span>
      </li>`)}</ul>` : null}
      <${Valaszto} label="Mire" value=${uj.cel} onChange=${(x) => setUj({ ...uj, cel: x })} opciok=${opciok}/>
      ${fokuszE ? html`<p className="sugo kicsi" style=${{ margin: 0 }}>A fókusz vagy fegyvercsoport megkapását rögzíti (3-at írva +3 fókusz).</p>` : html`
        <div className="kapcsolo" role="group" aria-label="Mód">
          <button type="button" aria-pressed=${uj.mod === 'hozzaad'} onClick=${() => setUj({ ...uj, mod: 'hozzaad' })}>Hozzáad</button>
          <button type="button" aria-pressed=${uj.mod === 'felulir'} onClick=${() => setUj({ ...uj, mod: 'felulir' })}>Felülír</button>
        </div>`}
      <div className="sorban" style=${{ alignItems: 'flex-end' }}>
        <${K.TextField} label="Érték" inputMode="numeric" value=${uj.ertek} onChange=${(e) => setUj({ ...uj, ertek: e.target.value.replace(/[^0-9−-]/g, '').replace('−', '-').slice(0, 4) })}/>
        <${K.TextField} label="Megjegyzés" value=${uj.megjegyzes} onChange=${(e) => setUj({ ...uj, megjegyzes: e.target.value })}/>
      </div>
      <div><${K.Button} disabled=${!fokuszE && uj.ertek === ''} onClick=${() => { hozzaad(); setUj({ ...uj, ertek: '', megjegyzes: '' }); }}>Módosító hozzáadása<//></div>
    </div>
  <//>`;
}
