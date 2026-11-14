// A DM és a játékos felület közös játékelemei: kampány élő állapota, dobás, dobásnapló, karakterlap.
import { html, K, useApp, useState, useEffect, useMemo, useRef, Uzenet, Valaszto, Jelolo, Ikon, idopont, elojel, SZEREP_NEV, tarOlvas, tarIr, gyorsKulcs, navigal, Parbeszed, useMuvelet } from './kozos.js';
import { uresKarakter, atallit, kulcsmezok } from '../karakter/adat.js';
import { megjelenitettNev } from '../szabalyok.js';
import { karakterSzamol } from '../karakter/szamol.js';
import { probaKiertekel, naploDobas } from '../jatek/proba.js';
import { ProbaUrlap } from './proba.js';

// ---- Kampány élő állapota a szinkronrétegen keresztül ----
// Visszaadja: { allapot, hiba, frissit }. Megnyitáskor kapcsolódik, elhagyáskor bont.
// Az utolsó ismert állapot az eszközön is megmarad, így a kampány azonnal megnyílik.
export function useKampanyAllapot(kampanyId) {
  const { sync, felhasznalo } = useApp();
  const kulcs = gyorsKulcs(felhasznalo.id, 'allapot.' + kampanyId);
  const [allapot, setAllapot] = useState(() => tarOlvas(kulcs, null));
  const [hiba, setHiba] = useState(null);
  useEffect(() => {
    setHiba(null);
    const leiratkozas = sync.subscribe((e) => {
      if (e.tipus === 'allapot' && e.allapot.kampany && e.allapot.kampany.id === kampanyId) {
        setAllapot(e.allapot);
        tarIr(kulcs, e.allapot);
      }
    });
    sync.connect(kampanyId).catch((e) => {
      setHiba(e);
      // törölt, archivált vagy elérhetetlen kampány: a tárolt állapot sem mutatható tovább
      if (e.kod !== 'halozat') { setAllapot(null); try { localStorage.removeItem(kulcs); } catch (x) { /* nem baj */ } }
    });
    return () => { leiratkozas(); sync.disconnect(); };
  }, [kampanyId]);
  const frissit = () => sync.pull().catch((e) => setHiba(e));
  return { allapot, hiba, frissit };
}

// ---- Kocka ----
export const kocka = () => 1 + Math.floor(Math.random() * 6);
export const dobasOsszeg = (d) => (d.kockak || []).reduce((a, b) => a + Number(b || 0), 0) + (Number(d.modosito) || 0);
export const dupla = (k) => k.length === 3 && (k[0] === k[1] || k[0] === k[2] || k[1] === k[2]);

// Dobásnapló a szerver állapotából és a még fel nem ért (optimista) dobásokból.
// A dobás azonnal megjelenik; a szerver válasza után az állapotfrissítés váltja le.
export function useDobasok(allapot) {
  const { sync, uzen } = useApp();
  const [fuggo, setFuggo] = useState([]);
  const szerverDobasok = (allapot && allapot.dobasok) || [];
  useEffect(() => {
    const megvan = new Set(szerverDobasok.map((d) => d.id));
    setFuggo((f) => f.filter((d) => !megvan.has(d.id)));
  }, [allapot]);
  const osszes = useMemo(() => {
    const megvan = new Set(szerverDobasok.map((d) => d.id));
    return szerverDobasok.concat(fuggo.filter((d) => !megvan.has(d.id))).slice().reverse();
  }, [allapot, fuggo]);

  const naploz = (dobas) => {
    setFuggo((f) => f.concat([{ ...dobas, _fuggo: true }]));
    sync.push({ action: 'roll.log', adat: dobas })
      .then(() => sync.pull().catch(() => {}))
      .catch((e) => {
        setFuggo((f) => f.filter((d) => d.id !== dobas.id));
        uzen('A dobás nem került a naplóba: ' + e.message, 'danger');
      });
  };
  return [osszes, naploz];
}

// Dobás a kampány nézetéből. Karakter választásakor a közös Próba lap (a karakter lapjának értékeivel),
// karakter nélkül (DM: nem játékos karakter) szabad dobás kézzel beírt módosítóval.
export function DobasPanel({ allapot, naploz, dm, nagy }) {
  const { szabalyok } = useApp();
  const dobhato = (allapot.karakterek || []).filter((c) => c.irhato && c.adat);
  const [karakterId, setKarakterId] = useState(dobhato.length === 1 && !dm ? dobhato[0].id : '');
  const kar = dobhato.find((c) => c.id === karakterId) || null;
  const lapok = szabalyok && szabalyok.adat && szabalyok.adat.lapok;
  const lap = useMemo(() => (kar && lapok ? karakterSzamol(atallit(kar.adat || {}), lapok) : null), [kar, lapok]);
  const kampany = { id: allapot.kampany.id, cim: allapot.kampany.cim };
  const opciok = dobhato.map((c) => ({ value: c.id, label: c.nev }));
  return html`<div className="dobas verem">
    ${opciok.length ? html`<${Valaszto} label="Ki dob" value=${karakterId} onChange=${setKarakterId}
      opciok=${opciok} ures=${dm ? 'A DM (szabad dobás)' : 'Szabad dobás'}/>` : null}
    ${lap ? html`<${ProbaUrlap} key=${kar.id} lap=${lap} karakter=${{ id: kar.id, nev: kar.nev }} kampany=${kampany}
        naploz=${naploz} rejtettLehet=${dm}/>`
      : html`<${SzabadDobas} allapot=${allapot} naploz=${naploz} dm=${dm} nagy=${nagy}/>`}
  </div>`;
}

// Szabad dobás: kézzel beírt név, módosító és Célérték (a DM nem játékos karaktereihez is).
function SzabadDobas({ allapot, naploz, dm, nagy }) {
  const { felhasznalo } = useApp();
  const [mire, setMire] = useState('');
  const [mod, setMod] = useState('0');
  const [cel, setCel] = useState('');
  const [rejtett, setRejtett] = useState(false);
  const [eredmeny, setEredmeny] = useState(null);
  const [sorszam, setSorszam] = useState(0);

  const dob = () => {
    const kockak = [kocka(), kocka(), kocka()];
    const modosito = parseInt(String(mod).replace('−', '-'), 10) || 0;
    const celertek = cel === '' ? undefined : parseInt(cel, 10);
    const ert = probaKiertekel(kockak, modosito, { celertek });
    const dobas = naploDobas({
      kampany_id: allapot.kampany.id, mire: mire.trim() || 'Próba', kockak, tipus: 'szabad',
      osszeallitas: { bonusz: modosito, reszek: modosito ? [{ ertek: modosito, eredet: 'Módosító' }] : [] },
      kiertekeles: ert, celertek, rejtett: dm && rejtett
    });
    dobas.dobta = felhasznalo.nev;
    setEredmeny(dobas);
    setSorszam((s) => s + 1);
    naploz(dobas);
  };

  return html`<div className="verem">
    <div className="urlap-racs">
      <${K.TextField} label="Próba" placeholder="például Észlelés (Keresés)" value=${mire} onChange=${(e) => setMire(e.target.value)}/>
      <${K.TextField} label="Módosító" hint="Tulajdonság és fókusz" inputMode="numeric" value=${mod} onChange=${(e) => setMod(e.target.value)}/>
      <${K.TextField} label="Célérték" hint="Üresen nincs siker vagy kudarc" inputMode="numeric" value=${cel} onChange=${(e) => setCel(e.target.value)}/>
    </div>
    ${dm ? html`<${Jelolo} checked=${rejtett} onChange=${setRejtett}>Rejtett dobás (a játékosok nem látják)<//>` : null}
    <div className="dobas__gomb">
      <${K.Button} variant="primary" size=${nagy ? 'lg' : 'md'} onClick=${dob} icon=${html`<${Ikon} nev="kocka" meret=${20}/>`}>Dobás<//>
    </div>
    ${eredmeny ? html`<div className="dobas__eredmeny friss" key=${sorszam} aria-live="polite">
      <${K.DiceRoll} dice=${eredmeny.kockak} bonus=${eredmeny.modosito}
        target=${eredmeny.eredmeny ? eredmeny.celertek : undefined} label=${eredmeny.mire + (eredmeny.rejtett ? ' (rejtett)' : '')}/>
    </div>` : null}
  </div>`;
}

export function DobasNaplo({ dobasok, karakterek, dm, max = 30 }) {
  const nevek = {};
  (karakterek || []).forEach((c) => { nevek[c.id] = c.nev; });
  if (!dobasok.length) return html`<p className="halvany">Még nincs dobás ebben a kampányban.</p>`;
  return html`<ol className="naplo">
    ${dobasok.slice(0, max).map((d) => {
      const kockak = d.kockak || [];
      return html`<li key=${d.id} className=${'naplo__sor' + (d._fuggo ? ' naplo__sor--fuggo' : '')}>
        <div className="naplo__fej">
          <span className="naplo__ki">${nevek[d.karakter_id] || d.dobta}</span>
          <span className="naplo__mire">${d.mire}</span>
          <span className="naplo__ido">${d._fuggo ? 'küldés…' : idopont(d.idopont)}</span>
        </div>
        <div className="naplo__test">
          <span className="mini-kockak" aria-label=${'Kockák: ' + kockak.join(', ')}>
            ${kockak.map((k, i) => html`<span key=${i} className=${'mini-kocka' + (i === 2 ? ' mini-kocka--sarkany' : '')}>${k}</span>`)}
          </span>
          ${Number(d.modosito) ? html`<span className="naplo__mod">${elojel(Number(d.modosito))}</span>` : null}
          <span className="naplo__osszeg">= ${dobasOsszeg(d)}</span>
          ${d.eredmeny === 'siker' ? html`<${K.Badge} tone="success">✓ Siker<//>` : null}
          ${d.eredmeny === 'kudarc' ? html`<${K.Badge} tone="danger">✗ Kudarc<//>` : null}
          ${Number(d.mutatvanypont) ? html`<${K.Badge} tone="dragon">${d.mutatvanypont} mutatványpont<//>` : null}
          ${dm && d.rejtett ? html`<${K.Badge}>Rejtett<//>` : null}
        </div>
      </li>`;
    })}
  </ol>`;
}

// ---- Karakterlap ----
// A karakter adatszerkezete és a számolás: web/js/karakter/ (adat.js, szamol.js). A korábbi, ideiglenes
// szerkezetű karaktereket a számoló beolvasáskor átalakítja (atallit), így azok értékei is látszanak.
export const TULAJDONSAGOK = [
  ['tul_accuracy', 'Pontosság'], ['tul_communication', 'Kommunikáció'], ['tul_constitution', 'Szívósság'],
  ['tul_dexterity', 'Ügyesség'], ['tul_fighting', 'Harc'], ['tul_intelligence', 'Intelligencia'],
  ['tul_perception', 'Észlelés'], ['tul_strength', 'Erő'], ['tul_willpower', 'Akaraterő']
];

function szabalyElem(szabalyok, lap, id) {
  if (!szabalyok || !id) return null;
  return (szabalyok.lapok[lap] || []).find((e) => e.id === id) || null;
}
// Faj, osztály: azonosító (faj_dwarf) vagy szabad szöveg is lehet.
export function elemNev(szabalyok, lap, ertek) {
  const e = szabalyElem(szabalyok, lap, ertek);
  return e ? e.nev_hu : (ertek || '');
}

// Félbehagyott karakterkészítés: a teljes adatból, vagy a listák összefoglalójának `keszites` mezőjéből.
export function piszkozatE(karakter) {
  const k = karakter && karakter.adat && karakter.adat.keszites;
  return k ? k.allapot === 'piszkozat' : !!(karakter && karakter.keszites === 'piszkozat');
}

// A karakterlap fejlécébe: a varázsló folytatása (piszkozatnál a félbehagyott lépésnél) vagy újranyitása.
export function KeszitesGomb({ karakter, alap }) {
  if (!karakter || karakter.irhato === false) return null;
  const k = karakter.adat && karakter.adat.keszites;
  const piszkozat = piszkozatE(karakter);
  const ut = alap + '/keszites' + (piszkozat && k && k.lepes ? '/' + k.lepes : '');
  return html`<${K.Button} variant=${piszkozat ? 'primary' : 'secondary'} onClick=${() => navigal(ut)}>${piszkozat ? 'Karakterkészítés folytatása' : 'Karakterkészítő megnyitása'}<//>`;
}

// Folyamatban lévő szintlépés (a félkész szint), vagy null.
export function felkeszSzintE(karakter) {
  const a = karakter && karakter.adat;
  const sz = a && Array.isArray(a.szintek) ? a.szintek.find((s) => s.kesz === false) : null;
  return sz ? sz.szint : null;
}

// A karakterlap fejlécébe: szintlépés indítása (egy szint), vagy a félbehagyott folytatása.
// Bárki indíthatja, aki a karaktert szerkesztheti; a Fejlődés modul (XP) később erre épül.
export function SzintlepesGomb({ karakter, alap, kiemelt }) {
  if (!karakter || karakter.irhato === false || !karakter.adat || piszkozatE(karakter)) return null;
  const a = atallit(karakter.adat);
  if (!a.osztaly) return null;
  const fk = felkeszSzintE({ adat: a });
  const lezart = kulcsmezok(a).szint;
  if (!fk && lezart >= 20) return null;
  const lepes = fk && a.szintlepes && a.szintlepes.lepes ? '/' + a.szintlepes.lepes : '';
  return html`<${K.Button} variant=${fk || kiemelt ? 'primary' : 'secondary'} onClick=${() => navigal(alap + '/szintlepes' + lepes)}>${fk ? `Szintlépés folytatása (${fk}. szint)` : `Szintlépés: ${lezart + 1}. szint`}<//>`;
}

// Új karakter egy kampányba (DM, mesterjátékos): név, létrehozás, utána a varázsló.
export function UjKampanyKarakter({ kampanyId, onLetrejott, nagy }) {
  const { api } = useApp();
  const [nyitva, setNyitva] = useState(false);
  const [nev, setNev] = useState('');
  const [fut, indit] = useMuvelet();
  const ment = () => indit(async () => {
    if (!nev.trim()) throw new Error('Adj nevet a karakternek.');
    const v = await api.hivas('character.create', { nev: nev.trim(), kampany_id: kampanyId, adat: uresKarakter({ nev: nev.trim() }) });
    setNyitva(false);
    setNev('');
    onLetrejott(v.karakter);
  }, 'Létrejött a karakter, jöhet a karakterkészítés.');
  return html`<div>
    <${K.Button} variant="quiet" size=${nagy ? 'lg' : 'md'} onClick=${() => setNyitva(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új karakter ebbe a kampányba<//>
    ${nyitva ? html`<${Parbeszed} cim="Új karakter a kampányba" onBezar=${() => setNyitva(false)} lab=${html`
      <${K.Button} variant="quiet" onClick=${() => setNyitva(false)}>Mégse<//>
      <${K.Button} variant="primary" disabled=${fut} onClick=${ment}>Létrehozás<//>`}>
      <div className="verem">
        <${K.TextField} label="A karakter neve" hint="Ideiglenes is lehet." autoCapitalize="words" value=${nev} onChange=${(e) => setNev(e.target.value)}/>
        <p className="halvany kicsi">A karakter rögtön a kampányba kerül, utána a karakterkészítő varázsló nyílik meg.</p>
      </div>
    <//>` : null}
  </div>`;
}

export function KarakterFejlec({ karakter, jatekosNev }) {
  const { szabalyok: sz } = useApp();
  const szabalyok = sz.adat;
  const faj = elemNev(szabalyok, 'Fajok', karakter.faj);
  const osztaly = elemNev(szabalyok, 'Osztályok', karakter.osztaly);
  return html`<div className="cimkek">
    ${piszkozatE(karakter) ? html`<${K.Badge} tone="warning">Piszkozat<//>` : null}
    ${felkeszSzintE(karakter) ? html`<${K.Badge} tone="warning">Szintlépés folyamatban<//>` : null}
    ${faj ? html`<${K.Badge}>${faj}<//>` : null}
    ${osztaly ? html`<${K.Badge}>${osztaly}${karakter.szint ? ', ' + karakter.szint + '. szint' : ''}<//>` : null}
    ${jatekosNev !== undefined ? html`<span className="halvany kicsi">${jatekosNev ? 'Játékos: ' + jatekosNev : 'Játékos nélkül'}</span>` : null}
  </div>`;
}

// Kampány fejléce: cím, saját szerep, állapot.
export function KampanyCimkek({ kampany }) {
  return html`<div className="cimkek">
    <${K.Badge} tone="accent">${SZEREP_NEV[kampany.sajat_szerep] || kampany.sajat_szerep}<//>
    ${kampany.allapot ? html`<${K.Badge}>${kampany.allapot}<//>` : null}
  </div>`;
}

export { megjelenitettNev };
