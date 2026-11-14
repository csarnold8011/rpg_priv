// A szintlépés-varázsló kerete: szintenként öt lépés (Egészség, Tulajdonság, Fókusz, Képességek, Áttekintés).
// Útvonal: #/dm/karakter/<id>/szintlepes/<lepes> és #/jatekos/karakter/<id>/szintlepes/<lepes>.
// A nyitott szint a karakter szintek[] listájában a `kesz: false` bejegyzés; a cél: adat.szintlepes.cel.
// Ugyanaz a minta, mint a karakterkészítőnél (varazslo.js): mentés lépésváltáskor, telefonon lépéssáv
// és alsó gombsor, laptopon szintek és lépések, a lépés és élő karakterlap.
import { html, K, useApp, useState, useEffect, useMemo, useLekeres, navigal, Ikon, Betoltes, Uzenet, Parbeszed, Megerosites, temaBeallitasa } from './kozos.js';
import { karakterSzamol } from '../karakter/szamol.js';
import { index } from '../karakter/szabalyindex.js';
import { szurtLapok } from '../karakter/varazslo.js';
import * as S from '../karakter/szintlepes.js';
import { useVarazsloAdat, MentesJel } from './varazslo.js';
import { Elonezet } from './varazslo_lepesek.js';
import { SZINTLEPES_KOMPONENSEK } from './szintlepes_lepesek.js';

// A nyitott szint kész jellel: a hiányzó döntéseket így jelzi a számoló (a lezárás előtti ellenőrzés).
const keszKent = (adat) => ({ ...adat, szintek: adat.szintek.map((s) => (s.kesz === false ? { ...s, kesz: true } : s)) });

export function SzintlepesVarazslo({ id, lepes, birodalom, onValtozott }) {
  const { api, szabalyok, felhasznalo } = useApp();
  useEffect(() => { temaBeallitasa(birodalom); }, [birodalom]);
  const lekeres = useLekeres(async () => (await api.hivas('character.get', { id })).karakter, [id], 'kar.' + id);
  const alap = '/' + birodalom + '/karakter/' + id;
  const keret = (tartalom) => html`<div className="varazslo">
    <header className="varazslo__fej"><a className="ikongomb" href=${'#' + alap} aria-label="Vissza a karakterhez"><${Ikon} nev="vissza"/></a><h1 className="varazslo__cim">Szintlépés</h1></header>
    <main className="varazslo__lepes">${tartalom}</main>
  </div>`;
  if (!lekeres.adat || !szabalyok.adat) {
    return keret(lekeres.hiba ? html`<${Uzenet}>${lekeres.hiba.message}<//>`
      : szabalyok.hiba ? html`<${Uzenet}>A szabályadat nem töltődött be: ${szabalyok.hiba.message}<//>` : html`<${Betoltes}/>`);
  }
  const c = lekeres.adat;
  if (c.irhato === false) return keret(html`<${Uzenet}>Ezt a karaktert nem szerkesztheted.<//><a href=${'#' + alap}>Vissza</a>`);
  const k = (c.adat && c.adat.keszites) || {};
  if (k.allapot === 'piszkozat') {
    return keret(html`<${Uzenet} tonus="warning">A karakterkészítés még nem fejeződött be. A szintlépés az 1. szint után jön.<//>
      <div><${K.Button} variant="primary" onClick=${() => navigal(alap + '/keszites' + (k.lepes ? '/' + k.lepes : ''))}>Karakterkészítés folytatása<//></div>`);
  }
  if (!c.adat || !c.adat.osztaly && !c.osztaly) {
    return keret(html`<${Uzenet} tonus="warning">A karakternek nincs osztálya, ezért a szintlépés nem tudja, mi jár. Előbb válassz osztályt a karakterkészítőben.<//>`);
  }
  return html`<${SzintlepesTest} key=${id} karakter=${c} beallitKarakter=${lekeres.beallit} lepes=${lepes}
    lapok=${szabalyok.adat.lapok} alap=${alap} dm=${felhasznalo.szerep === 'dm'} onValtozott=${onValtozott} friss=${!lekeres.tolt}/>`;
}

function SzintlepesTest({ karakter, beallitKarakter, lepes, lapok, alap, dm, onValtozott, friss }) {
  const { uzen } = useApp();
  const v = useVarazsloAdat(karakter, lapok, beallitKarakter, onValtozott);
  const { adat, valtoztat, ment } = v;
  const [lepesekNyitva, setLepesekNyitva] = useState(false);
  const [karakterNyitva, setKarakterNyitva] = useState(false);
  const [elvetKerdes, setElvetKerdes] = useState(false);
  const [vege, setVege] = useState(false);

  // Belépéskor: ha nincs nyitott szint, a következő nyílik (a karakter oldaláról egy szint). Csak a friss
  // adat megérkezése után, hogy az eszközön tárolt régebbi példány ne nyisson egy már megnyitott szintet újra.
  const nyitott = S.felkeszSzint(adat);
  const csucs = !nyitott && S.lezartSzint(adat) >= S.MAX_SZINT;
  useEffect(() => { if (friss && !nyitott && !csucs && !vege) valtoztat((a) => { S.szintlepesIndit(a); }); }, [!!nyitott, friss]);

  const n = nyitott ? nyitott.szint : null;
  const sl = adat.szintlepes || {};
  const aktiv = S.SZINT_LEPESEK.some((l) => l.kulcs === lepes) ? lepes : (S.SZINT_LEPESEK.some((l) => l.kulcs === sl.lepes) ? sl.lepes : 'egeszseg');
  const i = S.szintLepesSzam(aktiv);

  // A megnyitott lépés és a legtávolabbi elért lépés rögzül (innen folytatható); lépésváltáskor mentés.
  useEffect(() => {
    if (!n) return;
    if (sl.lepes !== aktiv || (sl.elert || 0) < i) {
      valtoztat((a) => { a.szintlepes = { ...(a.szintlepes || {}), lepes: aktiv, elert: Math.max((a.szintlepes || {}).elert || 0, i) }; });
    }
    ment();
    window.scrollTo(0, 0);
  }, [aktiv, n]);
  // Új szint nyílásakor a „Specializáció új fokozata” előre kitöltődik.
  useEffect(() => { if (n) valtoztat((a) => S.automatikusKitoltes(a, index(lapok), n)); }, [n]);

  const forrasok = adat.keszites.forrasok || [];
  const szurt = useMemo(() => szurtLapok(lapok, forrasok), [lapok, forrasok.join('|')]);
  const ix = useMemo(() => index(szurt), [szurt]);
  const ixMind = useMemo(() => index(lapok), [lapok]);
  const lapElotte = useMemo(() => karakterSzamol(adat, lapok), [adat, lapok]);
  const lap = useMemo(() => karakterSzamol(adat, lapok, { felkesz: true }), [adat, lapok]);
  const lapKesz = useMemo(() => karakterSzamol(keszKent(adat), lapok, { felkesz: true }), [adat, lapok]);

  if (csucs || vege) {
    return html`<div className="varazslo"><header className="varazslo__fej"><a className="ikongomb" href=${'#' + alap} aria-label="Vissza a karakterhez"><${Ikon} nev="vissza"/></a><h1 className="varazslo__cim">Szintlépés</h1></header>
      <main className="varazslo__lepes">${csucs ? html`<${Uzenet} tonus="neutral">A karakter elérte a 20. szintet, ennél tovább nem léphet.<//>` : html`<${Betoltes}/>`}</main></div>`;
  }
  if (!n) return html`<div className="varazslo"><main className="varazslo__lepes"><${Betoltes}/></main></div>`;

  const cel = Math.max(n, sl.cel || n);
  const kezdo = Math.min(n, sl.kezdo || n);
  const elert = Math.max(sl.elert || 0, i);
  // Az ezen a szinten keletkezett figyelmeztetések (a DM által elfogadottak nélkül), lépésenként.
  const figyMind = S.szintFigyelmeztetesek(lapKesz, lapElotte).filter((f) => !f.elfogadott);
  const figyDb = {};
  figyMind.forEach((f) => { const k = S.szintFigyLepese(f); if (S.szintLepesSzam(k) < elert || elert >= 4) figyDb[k] = (figyDb[k] || 0) + 1; });

  const ugras = (kulcs) => { setLepesekNyitva(false); navigal(alap + '/szintlepes/' + kulcs); };
  const elozo = i > 0 ? S.SZINT_LEPESEK[i - 1].kulcs : null;
  const kovetkezo = i < S.SZINT_LEPESEK.length - 1 ? S.SZINT_LEPESEK[i + 1].kulcs : null;
  const nev = adat.nev || karakter.nev || 'A karakter';
  const kilepes = async () => { await ment(); navigal(alap); };
  const lezar = async () => {
    let kov = null;
    valtoztat((a) => { kov = S.szintLezar(a); });
    if (!kov) setVege(true);
    const ok = await ment();
    if (ok === false) return;
    if (kov) { uzen(`${n}. szint kész. Jöhet a ${kov}. szint.`); navigal(alap + '/szintlepes/egeszseg'); }
    else { uzen(`${nev} elérte a ${n}. szintet.`); navigal(alap); }
  };
  const elvet = async () => {
    setElvetKerdes(false);
    setVege(true);
    valtoztat((a) => S.szintElvet(a));
    await ment();
    uzen(`A ${n}. szint elvetve.`);
    navigal(alap);
  };

  const Lepes = SZINTLEPES_KOMPONENSEK[aktiv];
  const props = { adat, valtoztat, n, cel, kezdo, lap, lapElotte, lapKesz, ix, ixMind, forrasok, dm, ugras, figy: figyMind, karakter, elvetes: () => setElvetKerdes(true) };
  const szintek = [];
  for (let x = kezdo; x <= cel; x++) szintek.push(x);
  const lepesPont = (l, j) => {
    const kesz = j < elert && l.kulcs !== aktiv;
    return html`<span className=${'lepeslista__pont' + (kesz ? ' lepeslista__pont--kesz' : '')}>${kesz ? '✓' : j + 1}</span>`;
  };
  const lepesLista = html`<ul className="lepeslista">
    ${szintek.map((x) => (x !== n
      ? html`<li key=${'sz' + x}><span className="lepeslista__szint"><span className=${'lepeslista__pont' + (x < n ? ' lepeslista__pont--kesz' : '')}>${x < n ? '✓' : x}</span>${x}. szint</span></li>`
      : html`<li key=${'sz' + x}><span className="lepeslista__szint lepeslista__szint--most"><span className="lepeslista__pont">${x}</span>${x}. szint</span>
          <ul className="lepeslista lepeslista--al">${S.SZINT_LEPESEK.map((l, j) => html`<li key=${l.kulcs}><button type="button" aria-current=${l.kulcs === aktiv ? 'step' : undefined} onClick=${() => ugras(l.kulcs)}>
            ${lepesPont(l, j)}<span>${l.cim}</span>
            ${figyDb[l.kulcs] ? html`<span className="lepeslista__figy" aria-label=${figyDb[l.kulcs] + ' figyelmeztetés'}>⚠ ${figyDb[l.kulcs]}</span>` : null}
          </button></li>`)}</ul></li>`))}
  </ul>`;
  const tovabbFelirat = kovetkezo ? 'Tovább' : (n < cel ? `Tovább: ${n + 1}. szint` : 'Kész');
  const tovabbGomb = html`<${K.Button} variant="primary" size="lg" onClick=${() => (kovetkezo ? ugras(kovetkezo) : lezar())}>${tovabbFelirat}<//>`;

  return html`<div className="varazslo szintlepes">
    <header className="varazslo__fej">
      <button type="button" className="ikongomb" aria-label="Kilépés a szintlépésből" onClick=${kilepes}><${Ikon} nev="vissza"/></button>
      <h1 className="varazslo__cim">Szintlépés: ${nev}</h1>
      <${MentesJel} allapot=${v.allapot}/>
    </header>
    <div className="lepessav">
      ${cel > kezdo ? html`<div className="szintsor" aria-label="Szintek">
        <span className="szintsor__cim">Szintek</span>
        ${szintek.map((x) => html`<span key=${x} className=${'szintpont' + (x < n ? ' szintpont--kesz' : x === n ? ' szintpont--most' : '')}>${x < n ? '✓ ' : ''}${x}.</span>`)}
      </div>` : null}
      <div className="lepessav__sor">
        <span className="lepessav__cim">${n}. szint · ${i + 1} / 5 · ${S.SZINT_LEPESEK[i].cim}</span>
        <button type="button" className="lepessav__gomb" onClick=${() => setLepesekNyitva(true)}><${Ikon} nev="lepesek" meret=${20}/>Lépések</button>
      </div>
      <div className="szegmensek szegmensek--ot" aria-hidden="true">
        ${S.SZINT_LEPESEK.map((l, j) => html`<span key=${l.kulcs} className=${'szegmens' + (j === i ? ' szegmens--most' : j < elert ? ' szegmens--kesz' : '') + (figyDb[l.kulcs] ? ' szegmens--figy' : '')}></span>`)}
      </div>
    </div>
    <div className="varazslo__test">
      <nav className="varazslo__lepeslista" aria-label="Szintek és lépések">
        <p className="cimke" style=${{ paddingLeft: '10px' }}>${nev}: szintlépés</p>
        ${lepesLista}
      </nav>
      <main className="varazslo__lepes">
        <div>
          <p className="cimke szeles-blokk">${n}. szint · ${i + 1} / 5. lépés</p>
          <h2 className="lepescim">${S.SZINT_LEPESEK[i].cim}</h2>
        </div>
        <${Lepes} ...${props}/>
        <div className="lap__lab">
          ${elozo ? html`<${K.Button} variant="quiet" size="lg" onClick=${() => ugras(elozo)}>Vissza<//>` : html`<${K.Button} variant="quiet" size="lg" onClick=${kilepes}>Kilépés<//>`}
          ${tovabbGomb}
        </div>
      </main>
      <aside className="varazslo__elonezet" aria-label="Élő karakterlap">
        <${Elonezet} adat=${adat} lap=${lap} ix=${ixMind} figyHol="a karakter oldalán"/>
      </aside>
    </div>
    <footer className="alsogombok">
      <${K.Button} variant="quiet" size="lg" onClick=${() => (elozo ? ugras(elozo) : kilepes())}>${elozo ? 'Vissza' : 'Kilépés'}<//>
      <${K.Button} variant="secondary" size="lg" onClick=${() => setKarakterNyitva(true)}>Karakter<//>
      ${tovabbGomb}
    </footer>
    ${lepesekNyitva ? html`<${Parbeszed} cim=${n + '. szint lépései'} onBezar=${() => setLepesekNyitva(false)}>${lepesLista}<//>` : null}
    ${karakterNyitva ? html`<${Parbeszed} cim=${nev} onBezar=${() => setKarakterNyitva(false)}>
      <${Elonezet} adat=${adat} lap=${lap} ix=${ixMind} cimNelkul=${true} figyHol="a karakter oldalán"/>
    <//>` : null}
    ${elvetKerdes ? html`<${Megerosites} cim=${`A ${n}. szint elvetése`} gomb="Elvetés" veszelyes=${true}
      szoveg=${`A ${n}. szinten hozott döntések törlődnek (a dobásnapló megmarad), a karakter ${n - 1}. szintű marad.`}
      onMegse=${() => setElvetKerdes(false)} onIgen=${elvet}/>` : null}
    ${v.utkozes ? html`<${Parbeszed} cim="Máshol is módosították" onBezar=${v.sajatMarad} lab=${html`
      <${K.Button} variant="quiet" onClick=${v.masikBetolt}>A másikat töltöm be<//>
      <${K.Button} variant="primary" onClick=${v.sajatMarad}>Az enyém marad<//>`}>
      <p className="szoveg">Ezt a karaktert közben egy másik eszközön (vagy a DM) is mentette. Megtarthatod a saját változatodat (a másik felülíródik), vagy betöltheted a máshol mentettet (a te legutóbbi változtatásaid elvesznek).</p>
    <//>` : null}
  </div>`;
}
