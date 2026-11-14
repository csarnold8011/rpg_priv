// A karakterkészítő varázsló kerete: betöltés, lépések, mentés lépésváltáskor, telefonos és laptopos elrendezés.
// Útvonal: #/dm/karakter/<id>/keszites/<lepes> és #/jatekos/karakter/<id>/keszites/<lepes>.
// A lépések tartalma: varazslo_lepesek.js. A logika: web/js/karakter/varazslo.js.
import {
  html, K, useApp, useState, useEffect, useMemo, useRef, useCallback, useLekeres, navigal, Ikon, Betoltes, Uzenet,
  Parbeszed, temaBeallitasa, tarOlvas, gyorsKulcs
} from './kozos.js';
import { karakterSzamol, szamitottKivonat } from '../karakter/szamol.js';
import { atallit } from '../karakter/adat.js';
import { index } from '../karakter/szabalyindex.js';
import { LEPESEK, lepesSzam, lepesFigyelmeztetesek, szurtLapok, elerhetoForrasok, kulcsmezokFrissit } from '../karakter/varazslo.js';
import { LEPES_KOMPONENSEK, Elonezet } from './varazslo_lepesek.js';

const lemasol = (x) => JSON.parse(JSON.stringify(x));

// A karakter adatainak helyi példánya és a mentés. Mentés: lépésváltáskor, kilépéskor és a végén.
function useVarazsloAdat(karakter, lapok, beallitKarakter, onValtozott) {
  const { sync, uzen } = useApp();
  const [adat, setAdat] = useState(() => atallit(karakter.adat || {}));
  const adatRef = useRef(adat);
  const verzioRef = useRef(karakter.verzio);
  const piszkosRef = useRef(false);
  const [allapot, setAllapot] = useState('mentve'); // mentve | ment | var | hiba
  const [utkozes, setUtkozes] = useState(null);
  const futRef = useRef(null);

  // Ha a karakter máshonnan frissült (például a DM közben mentett) és nincs helyi változás, átvesszük.
  useEffect(() => {
    if (!piszkosRef.current && karakter.verzio !== verzioRef.current) {
      verzioRef.current = karakter.verzio;
      const uj = atallit(karakter.adat || {});
      adatRef.current = uj;
      setAdat(uj);
    }
  }, [karakter.verzio]);

  const valtoztat = useCallback((fn) => {
    const uj = lemasol(adatRef.current);
    fn(uj);
    kulcsmezokFrissit(uj);
    adatRef.current = uj;
    piszkosRef.current = true;
    setAdat(uj);
    setAllapot((a) => (a === 'mentve' ? 'valtozott' : a));
  }, []);

  const ment = useCallback(async () => {
    if (!piszkosRef.current) return true;
    if (futRef.current) { await futRef.current.catch(() => {}); if (!piszkosRef.current) return true; }
    const kuldott = lemasol(adatRef.current);
    try { kuldott.szamitott = szamitottKivonat(karakterSzamol(kuldott, lapok)); } catch (e) { /* a kivonat csak gyorsítótár */ }
    piszkosRef.current = false;
    setAllapot(sync.status().online ? 'ment' : 'var');
    const ig = sync.push({ action: 'character.save', adat: { id: karakter.id, verzio: verzioRef.current, adat: kuldott } });
    futRef.current = ig;
    try {
      const v = await ig;
      verzioRef.current = v.verzio;
      const ossz = { adat: kuldott, verzio: v.verzio, modositva: v.modositva, nev: kuldott.nev || karakter.nev, faj: kuldott.faj, osztaly: kuldott.osztaly, szint: kuldott.szint, keszites: kuldott.keszites.allapot };
      beallitKarakter((c) => ({ ...c, ...ossz }));
      if (onValtozott) onValtozott({ ...karakter, ...ossz });
      setAllapot(piszkosRef.current ? 'valtozott' : 'mentve');
      return true;
    } catch (e) {
      piszkosRef.current = true;
      if (e.kod === 'utkozes') { setUtkozes((e.valasz && e.valasz.aktualis) || { verzio: null }); setAllapot('hiba'); }
      else { setAllapot('hiba'); uzen('A mentés nem sikerült: ' + e.message, 'danger'); }
      return false;
    } finally {
      if (futRef.current === ig) futRef.current = null;
    }
  }, [karakter.id, lapok]);

  // Ütközés feloldása: a saját változat marad (ráírjuk a frissre), vagy a máshol mentettet töltjük be.
  const sajatMarad = async () => {
    const a = utkozes;
    setUtkozes(null);
    if (a && a.verzio) verzioRef.current = a.verzio;
    piszkosRef.current = true;
    await ment();
  };
  const masikBetolt = () => {
    const a = utkozes;
    setUtkozes(null);
    if (!a || !a.adat) return;
    verzioRef.current = a.verzio;
    const uj = atallit(a.adat);
    adatRef.current = uj;
    piszkosRef.current = false;
    setAdat(uj);
    setAllapot('mentve');
    beallitKarakter((c) => ({ ...c, ...a }));
  };

  // Ha a lap bezárul vagy háttérbe kerül, a változás még elindul (kiesés alatt a szinkronréteg sorba teszi).
  useEffect(() => {
    const fn = () => { if (document.visibilityState === 'hidden') ment(); };
    document.addEventListener('visibilitychange', fn);
    return () => document.removeEventListener('visibilitychange', fn);
  }, [ment]);

  return { adat, valtoztat, ment, allapot, utkozes, sajatMarad, masikBetolt };
}

function MentesJel({ allapot }) {
  const { sync } = useApp();
  const [online, setOnline] = useState(sync.status().online);
  useEffect(() => sync.subscribe((e) => { if (e.tipus === 'statusz') setOnline(e.statusz.online); }), [sync]);
  if (allapot === 'ment') return html`<span className="mentesjel mentesjel--var" role="status">Mentés…</span>`;
  if (allapot === 'var' || (!online && allapot !== 'mentve')) return html`<span className="mentesjel mentesjel--rossz" role="status">⚠ Nincs kapcsolat, a mentés vár</span>`;
  if (allapot === 'hiba') return html`<span className="mentesjel mentesjel--rossz" role="status">⚠ Nincs mentve</span>`;
  if (allapot === 'valtozott') return html`<span className="mentesjel mentesjel--var" role="status">Lépésváltáskor ment</span>`;
  return html`<span className="mentesjel mentesjel--jo" role="status">✓ Mentve</span>`;
}

// birodalom: 'dm' vagy 'jatekos'. kampanyok: a felhasználó kampányai (cím, aktív források).
// extra: DM-nek a játékosok listája és a társítás (lásd dm.js).
export function KarakterVarazslo({ id, lepes, birodalom, kampanyok, extra, onValtozott }) {
  const { api, szabalyok, felhasznalo } = useApp();
  useEffect(() => { temaBeallitasa(birodalom); }, [birodalom]);
  const lekeres = useLekeres(async () => (await api.hivas('character.get', { id })).karakter, [id], 'kar.' + id);
  const alap = '/' + birodalom + '/karakter/' + id;
  if (!lekeres.adat || !szabalyok.adat) {
    return html`<div className="varazslo">
      <header className="varazslo__fej"><a className="ikongomb" href=${'#' + alap} aria-label="Vissza a karakterhez"><${Ikon} nev="vissza"/></a><h1 className="varazslo__cim">Karakterkészítés</h1></header>
      <main className="varazslo__lepes">${lekeres.hiba ? html`<${Uzenet}>${lekeres.hiba.message}<//>`
        : szabalyok.hiba ? html`<${Uzenet}>A szabályadat nem töltődött be: ${szabalyok.hiba.message}<//>` : html`<${Betoltes}/>`}</main>
    </div>`;
  }
  if (lekeres.adat.irhato === false) {
    return html`<div className="varazslo"><main className="varazslo__lepes"><${Uzenet}>Ezt a karaktert nem szerkesztheted.<//><a href=${'#' + alap}>Vissza</a></main></div>`;
  }
  return html`<${VarazsloTest} key=${id} karakter=${lekeres.adat} beallitKarakter=${lekeres.beallit} lepes=${lepes}
    lapok=${szabalyok.adat.lapok} alap=${alap} dm=${felhasznalo.szerep === 'dm'} kampanyok=${kampanyok || []} extra=${extra} onValtozott=${onValtozott}/>`;
}

function VarazsloTest({ karakter, beallitKarakter, lepes, lapok, alap, dm, kampanyok, extra, onValtozott }) {
  const { uzen } = useApp();
  const v = useVarazsloAdat(karakter, lapok, beallitKarakter, onValtozott);
  const { adat, valtoztat, ment } = v;
  const [lepesekNyitva, setLepesekNyitva] = useState(false);
  const [karakterNyitva, setKarakterNyitva] = useState(false);

  // Kampányból indított karakternél a kampány aktív forrásai, egyébként minden forrás.
  const kampany = kampanyok.find((k) => (karakter.kampanyok || []).includes(k.id)) || null;
  useEffect(() => {
    if (!(adat.keszites.forrasok || []).length) {
      const f = kampany && (kampany.aktiv_forrasok || []).length ? kampany.aktiv_forrasok : elerhetoForrasok(lapok);
      valtoztat((a) => { a.keszites.forrasok = f.slice(); });
    }
  }, []);

  const aktiv = LEPESEK.some((l) => l.kulcs === lepes) ? lepes : (adat.keszites.lepes && LEPESEK.some((l) => l.kulcs === adat.keszites.lepes) ? adat.keszites.lepes : 'keret');
  const n = lepesSzam(aktiv);
  // A megnyitott lépés a karakteren is rögzül (innen folytatható), a legtávolabbi elért lépés a lépéssávhoz.
  useEffect(() => {
    const piszkozat = adat.keszites.allapot === 'piszkozat';
    if ((piszkozat && adat.keszites.lepes !== aktiv) || (adat.keszites.elert || 0) < n) {
      valtoztat((a) => {
        if (piszkozat) a.keszites.lepes = aktiv;
        a.keszites.elert = Math.max(a.keszites.elert || 0, n);
      });
    }
    ment();
    window.scrollTo(0, 0);
  }, [aktiv]);

  const lap = useMemo(() => karakterSzamol(adat, lapok), [adat, lapok]);
  const forrasok = adat.keszites.forrasok || [];
  const szurt = useMemo(() => szurtLapok(lapok, forrasok), [lapok, forrasok.join('|')]);
  const ix = useMemo(() => index(szurt), [szurt]);
  const ixMind = useMemo(() => index(lapok), [lapok]);
  const figy = lepesFigyelmeztetesek(lap);
  const elert = Math.max(adat.keszites.elert || 0, n);

  const ugras = (kulcs) => { setLepesekNyitva(false); navigal(alap + '/keszites/' + kulcs); };
  const elozo = n > 0 ? LEPESEK[n - 1].kulcs : null;
  const kovetkezo = n < LEPESEK.length - 1 ? LEPESEK[n + 1].kulcs : null;
  const kilepes = async () => { await ment(); navigal(alap); };
  const kesz = async () => {
    valtoztat((a) => { a.keszites.allapot = 'kesz'; a.keszites.lepes = null; a.keszites.elert = LEPESEK.length - 1; });
    const ok = await ment();
    if (ok !== false) {
      uzen((adat.nev || 'A karakter') + ' elkészült.' + ((adat.keszites.cel_szint || 1) > 1 ? ' A szintlépés-varázsló hamarosan érkezik, addig 1. szinten marad.' : ''));
      navigal(alap);
    }
  };

  // DM: a játékos társítása azonnal mentődik (külön végpont, nem a karakter adata).
  const extraKesz = extra && extra.tarsit ? { ...extra, tarsit: async (jatekosId) => {
    try {
      const c = await extra.tarsit(karakter.id, jatekosId);
      beallitKarakter((x) => ({ ...x, ...(c || {}), jatekos_id: jatekosId }));
      uzen(jatekosId ? 'Társítás kész.' : 'A karakter játékos nélküli lett.');
    } catch (e) { uzen(e.message || String(e), 'danger'); }
  } } : extra;
  const Lepes = LEPES_KOMPONENSEK[aktiv];
  const props = { adat, valtoztat, lap, ix, ixMind, szurt, lapok, forrasok, dm, karakter, kampany, kampanyok, extra: extraKesz, ugras, kesz, ment };
  const cim = adat.nev || karakter.nev || 'Új karakter';
  const lepesLista = html`<ul className="lepeslista">
    ${LEPESEK.map((l, i) => html`<li key=${l.kulcs}><button type="button" aria-current=${l.kulcs === aktiv ? 'step' : undefined} onClick=${() => ugras(l.kulcs)}>
      <span className=${'lepeslista__pont' + (i < elert && l.kulcs !== aktiv ? ' lepeslista__pont--kesz' : '')}>${i < elert && l.kulcs !== aktiv ? '✓' : i + 1}</span>
      <span>${l.cim}</span>
      ${figy[l.kulcs] ? html`<span className="lepeslista__figy" aria-label=${figy[l.kulcs] + ' figyelmeztetés'}>⚠ ${figy[l.kulcs]}</span>` : null}
    </button></li>`)}
  </ul>`;
  const tovabbGomb = kovetkezo
    ? html`<${K.Button} variant="primary" size="lg" onClick=${() => ugras(kovetkezo)}>Tovább<//>`
    : html`<${K.Button} variant="primary" size="lg" onClick=${kesz}>Kész<//>`;

  return html`<div className="varazslo">
    <header className="varazslo__fej">
      <button type="button" className="ikongomb" aria-label="Kilépés a varázslóból" onClick=${kilepes}><${Ikon} nev="vissza"/></button>
      <h1 className="varazslo__cim">${adat.keszites.allapot === 'piszkozat' ? 'Új karakter' : cim}</h1>
      <${MentesJel} allapot=${v.allapot}/>
    </header>
    <div className="lepessav">
      <div className="lepessav__sor">
        <span className="lepessav__cim">${n + 1} / ${LEPESEK.length} · ${LEPESEK[n].cim}</span>
        <button type="button" className="lepessav__gomb" onClick=${() => setLepesekNyitva(true)}><${Ikon} nev="lepesek" meret=${20}/>Lépések</button>
      </div>
      <div className="szegmensek" aria-hidden="true">
        ${LEPESEK.map((l, i) => html`<span key=${l.kulcs} className=${'szegmens' + (i === n ? ' szegmens--most' : i < elert ? ' szegmens--kesz' : '') + (figy[l.kulcs] ? ' szegmens--figy' : '')}></span>`)}
      </div>
    </div>
    <div className=${'varazslo__test' + (aktiv === 'osszegzes' ? ' varazslo__test--osszegzes' : '')}>
      <nav className="varazslo__lepeslista" aria-label="Lépések">
        <p className="cimke" style=${{ paddingLeft: '10px' }}>${cim}</p>
        ${lepesLista}
      </nav>
      <main className="varazslo__lepes">
        <div>
          <p className="cimke szeles-blokk">${n + 1} / ${LEPESEK.length}. lépés</p>
          <h2 className="lepescim">${LEPESEK[n].cim}</h2>
        </div>
        <${Lepes} ...${props}/>
        <div className="lap__lab">
          ${elozo ? html`<${K.Button} variant="quiet" size="lg" onClick=${() => ugras(elozo)}>Vissza<//>` : html`<span></span>`}
          ${tovabbGomb}
        </div>
      </main>
      <aside className="varazslo__elonezet" aria-label="Élő karakterlap">
        <${Elonezet} adat=${adat} lap=${lap} ix=${ixMind}/>
      </aside>
    </div>
    <footer className="alsogombok">
      <${K.Button} variant="quiet" size="lg" onClick=${() => (elozo ? ugras(elozo) : kilepes())}>${elozo ? 'Vissza' : 'Kilépés'}<//>
      <${K.Button} variant="secondary" size="lg" onClick=${() => setKarakterNyitva(true)}>Karakter<//>
      ${tovabbGomb}
    </footer>
    ${lepesekNyitva ? html`<${Parbeszed} cim="Lépések" onBezar=${() => setLepesekNyitva(false)}>${lepesLista}<//>` : null}
    ${karakterNyitva ? html`<${Parbeszed} cim=${cim} onBezar=${() => setKarakterNyitva(false)}>
      <${Elonezet} adat=${adat} lap=${lap} ix=${ixMind} cimNelkul=${true}/>
    <//>` : null}
    ${v.utkozes ? html`<${Parbeszed} cim="Máshol is módosították" onBezar=${v.sajatMarad} lab=${html`
      <${K.Button} variant="quiet" onClick=${v.masikBetolt}>A másikat töltöm be<//>
      <${K.Button} variant="primary" onClick=${v.sajatMarad}>Az enyém marad<//>`}>
      <p className="szoveg">Ezt a karaktert közben egy másik eszközön (vagy a DM) is mentette. Megtarthatod a saját változatodat (a másik felülíródik), vagy betöltheted a máshol mentettet (a te legutóbbi változtatásaid elvesznek).</p>
    <//>` : null}
  </div>`;
}

// A felhasználó kampányai az eszközön tárolt induló adatokból (a kampány címéhez és aktív forrásaihoz).
export function taroltKampanyok(felhasznaloId) {
  const init = tarOlvas(gyorsKulcs(felhasznaloId, 'init'), null);
  return (init && init.kampanyok) || [];
}
