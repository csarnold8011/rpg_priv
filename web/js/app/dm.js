// DM felület (laptop az elsődleges): oldalsáv és tartalmi hasábok, pergamen vagy gyertyafény téma.
import {
  html, K, useApp, useState, useEffect, useMemo, createContext, useContext, useLekeres, useMuvelet,
  navigal, Ikon, Betoltes, Uzenet, Valaszto, Jelolo, Parbeszed, Megerosites, TemaKapcsolo, SzinkronJelzo,
  HibaVagyBetoltes, SZEREP_NEV, idopont, temaBeallitasa, gyorsKulcs, indulasLekerese
} from './kozos.js';
import {
  useKampanyAllapot, useDobasok, DobasPanel, DobasNaplo, KarakterLap, KarakterFejlec, KampanyCimkek, megjelenitettNev,
  KeszitesGomb, UjKampanyKarakter
} from './jatek.js';
import { uresKarakter } from '../karakter/adat.js';
import { KarakterVarazslo } from './varazslo.js';

const FORRASOK = ['Alapkönyv', 'Companion', 'Bestiárium', 'Kampányépítő'];
const ALLAPOTOK = ['előkészítés', 'folyamatban', 'szünetel', 'lezárva'];
const ARCHIVALT = 'archivált';
const futo = (k) => k.allapot !== 'lezárva' && k.allapot !== ARCHIVALT;
const KARAKTER_ALLAPOTOK = ['aktív', 'távol', 'kilépett', 'elhunyt'];

// A DM nézetek közös adatai: kampányok, karakterek, felhasználók.
const DmKontextus = createContext(null);
const useDm = () => useContext(DmKontextus);

export function DmFelulet({ ut }) {
  const { api, felhasznalo, kilepes } = useApp();
  const [menu, setMenu] = useState(false);
  useEffect(() => { temaBeallitasa('dm'); }, []);
  // Egyetlen induló hívás; az előző eredmény az eszközről azonnal látszik.
  const init = useLekeres(() => indulasLekerese(api, true), [], 'init');
  useEffect(() => { setMenu(false); }, [ut.join('/')]);

  const adat = init.adat || {};
  // Helyi módosítás mentés után: csak a változott elem frissül, újabb lekérés nélkül.
  const listaModositas = (lista, elem, torles) => init.beallit((a) => {
    const regi = (a && a[lista]) || [];
    const tobbi = regi.filter((x) => x.id !== (torles || elem.id));
    if (torles) return { ...a, [lista]: tobbi };
    const helye = regi.findIndex((x) => x.id === elem.id);
    const uj = helye >= 0 ? regi.map((x) => (x.id === elem.id ? { ...x, ...elem } : x)) : regi.concat([elem]);
    return { ...a, [lista]: uj };
  });
  const osszefoglalo = (c) => { const o = { ...c }; delete o.adat; return o; };
  const dm = {
    kampanyok: adat.kampanyok || [], karakterek: adat.karakterek || [], felhasznalok: adat.felhasznalok || [],
    betoltve: !!init.adat,
    hiba: init.hiba,
    ujratolt: init.ujra,
    kampanyFrissit: (k) => listaModositas('kampanyok', k),
    kampanyTorol: (id) => listaModositas('kampanyok', null, id),
    karakterFrissit: (c) => listaModositas('karakterek', osszefoglalo(c)),
    karakterTorol: (id) => listaModositas('karakterek', null, id),
    felhasznaloFrissit: (f) => listaModositas('felhasznalok', f),
    felhasznaloTorol: (id) => listaModositas('felhasznalok', null, id),
    // karakter kampányba kerülése vagy kikerülése
    karakterKampany: (karakterId, kampanyId, bent) => init.beallit((a) => ({
      ...a, karakterek: ((a && a.karakterek) || []).map((c) => c.id !== karakterId ? c : {
        ...c, kampanyok: bent ? Array.from(new Set((c.kampanyok || []).concat([kampanyId]))) : (c.kampanyok || []).filter((x) => x !== kampanyId)
      })
    })),
    felhasznaloNev: (id) => { const f = (adat.felhasznalok || []).find((x) => x.id === id); return f ? f.nev : ''; }
  };

  const [oldal, azon] = ut;
  // A karakterkészítő varázsló a teljes képernyőt kapja (saját fejléc, lépéslista, élő karakterlap).
  if (oldal === 'karakter' && azon && ut[2] === 'keszites') {
    return html`<${DmKontextus.Provider} value=${dm}>
      <${KarakterVarazslo} key=${azon} id=${azon} lepes=${ut[3]} birodalom="dm" kampanyok=${dm.kampanyok}
        extra=${{ jatekosok: dm.felhasznalok.filter((f) => f.aktiv), tarsit: async (karakterId, jatekosId) => {
          const v = await api.hivas('character.assign', { karakter_id: karakterId, jatekos_id: jatekosId });
          dm.karakterFrissit(v.karakter);
          return v.karakter;
        } }}
        onValtozott=${(c) => dm.karakterFrissit(c)}/>
    <//>`;
  }
  let tartalom;
  if (oldal === 'kampanyok') tartalom = html`<${KampanyokOldal}/>`;
  else if (oldal === 'kampany' && azon) tartalom = html`<${KampanyOldal} key=${azon} id=${azon}/>`;
  else if (oldal === 'karakterek') tartalom = html`<${KarakterekOldal}/>`;
  else if (oldal === 'karakter' && azon) tartalom = html`<${KarakterOldal} key=${azon} id=${azon}/>`;
  else if (oldal === 'felhasznalok') tartalom = html`<${FelhasznalokOldal}/>`;
  else if (oldal === 'szabalyok') tartalom = html`<${SzabalyokOldal}/>`;
  else tartalom = html`<${Attekintes}/>`;

  const menupont = (cel, ikon, felirat, aktiv) => html`<a href=${'#/dm' + cel} className=${'menupont' + (aktiv ? ' menupont--aktiv' : '')}
    aria-current=${aktiv ? 'page' : undefined}><${Ikon} nev=${ikon} meret=${20}/><span>${felirat}</span></a>`;

  return html`<${DmKontextus.Provider} value=${dm}>
    <div className="dm">
      <header className="fejlec">
        <button type="button" className="ikongomb fejlec__menu" aria-label="Menü" aria-expanded=${menu} onClick=${() => setMenu(!menu)}>
          <${Ikon} nev=${menu ? 'bezar' : 'menu'}/>
        </button>
        <a href="#/dm" className="fejlec__nev">Fantasy AGE</a>
        <${K.Badge} tone="accent">DM<//>
        <div className="fejlec__jobb">
          <${SzinkronJelzo}/>
          <span className="fejlec__felh">${felhasznalo.nev}</span>
          <${TemaKapcsolo} birodalom="dm" kicsi=${true}/>
          <${K.Button} variant="quiet" size="sm" onClick=${kilepes} icon=${html`<${Ikon} nev="kilepes" meret=${20}/>`}>Kilépés<//>
        </div>
      </header>
      <div className="dm__test">
        <nav className=${'oldalsav' + (menu ? ' oldalsav--nyitva' : '')} aria-label="DM menü">
          ${menupont('', 'torony', 'Áttekintés', !oldal)}
          ${menupont('/kampanyok', 'terkep', 'Kampányok', oldal === 'kampanyok')}
          ${menupont('/karakterek', 'kard', 'Karakterek', oldal === 'karakterek' || oldal === 'karakter')}
          ${menupont('/felhasznalok', 'felhasznalo', 'Felhasználók', oldal === 'felhasznalok')}
          ${menupont('/szabalyok', 'konyv', 'Szabályok', oldal === 'szabalyok')}
          <${K.Divider} ornament=${false}/>
          <div className="oldalsav__cim">Kampányok</div>
          ${dm.kampanyok.filter(futo).map((k) => html`<a key=${k.id} href=${'#/dm/kampany/' + k.id}
            className=${'menupont menupont--kampany' + (oldal === 'kampany' && azon === k.id ? ' menupont--aktiv' : '')}>${k.cim}</a>`)}
          ${dm.betoltve && !dm.kampanyok.filter(futo).length ? html`<p className="halvany kicsi oldalsav__ures">Még nincs kampány.</p>` : null}
          <div className="oldalsav__lab">
            <${K.Divider} ornament=${false}/>
            <span className="fejlec__felh oldalsav__felh">${felhasznalo.nev}</span>
            <${TemaKapcsolo} birodalom="dm"/>
            <${K.Button} variant="quiet" onClick=${kilepes} icon=${html`<${Ikon} nev="kilepes" meret=${20}/>`}>Kilépés<//>
          </div>
        </nav>
        ${menu ? html`<div className="oldalsav-hatter" onClick=${() => setMenu(false)}></div>` : null}
        <main className="dm__tartalom">
          ${dm.hiba ? html`<${Uzenet}>${dm.hiba.message}<//>` : null}
          ${tartalom}
        </main>
      </div>
    </div>
  <//>`;
}

function Oldalfej({ cim, children, vissza }) {
  return html`<div className="oldalfej">
    ${vissza ? html`<a className="visszalink" href=${vissza[0]}><${Ikon} nev="vissza" meret=${20}/>${vissza[1]}</a>` : null}
    <div className="oldalfej__sor">
      <h1 className="oldalcim">${cim}</h1>
      ${children ? html`<div className="oldalfej__muveletek">${children}</div>` : null}
    </div>
  </div>`;
}

// ---------------- Áttekintés ----------------

function Attekintes() {
  const dm = useDm();
  const { szabalyok } = useApp();
  const [uj, setUj] = useState(false);
  const aktiv = dm.kampanyok.filter(futo);
  return html`<div>
    <${Oldalfej} cim="Áttekintés">
      <${K.Button} variant="primary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új kampány<//>
    <//>
    <div className="ket-hasab">
      <${K.Panel} title="Kampányok">
        ${!dm.betoltve ? html`<${Betoltes}/>` : aktiv.length ? html`<ul className="sorlista">
          ${aktiv.map((k) => html`<li key=${k.id} className="sorlista__sor">
            <div><a className="sorlista__nev" href=${'#/dm/kampany/' + k.id}>${k.cim}</a>
              <div className="cimkek">${k.allapot ? html`<${K.Badge}>${k.allapot}<//>` : null}
                ${k.mesterjatekos_id ? html`<span className="halvany kicsi">Mesterjátékos: ${dm.felhasznaloNev(k.mesterjatekos_id)}</span>` : null}</div></div>
            <${K.Button} size="sm" onClick=${() => navigal('/dm/kampany/' + k.id)}>Megnyitás<//>
          </li>`)}
        </ul>` : html`<p className="halvany">Még nincs kampány. Hozd létre az elsőt, aztán rendelj hozzá karaktereket.</p>`}
      <//>
      <div className="verem">
        <${K.Panel} title="Csapat">
          <dl className="ertekek">
            <div><dt>Felhasználó</dt><dd>${dm.betoltve ? dm.felhasznalok.length : '…'}</dd></div>
            <div><dt>Karakter</dt><dd>${dm.betoltve ? dm.karakterek.length : '…'}</dd></div>
            <div><dt>Kampány</dt><dd>${dm.betoltve ? dm.kampanyok.length : '…'}</dd></div>
          </dl>
          <div className="gombsor">
            <${K.Button} size="sm" onClick=${() => navigal('/dm/felhasznalok')}>Felhasználók<//>
            <${K.Button} size="sm" onClick=${() => navigal('/dm/karakterek')}>Karakterek<//>
          </div>
        <//>
        <${K.Panel} title="Szabályadatbázis">
          <${SzabalyAllapot} szabalyok=${szabalyok}/>
        <//>
      </div>
    </div>
    ${uj ? html`<${KampanyParbeszed} onBezar=${() => setUj(false)}/>` : null}
  </div>`;
}

function SzabalyAllapot({ szabalyok }) {
  if (szabalyok.allapot === 'tolt' && !szabalyok.adat) return html`<${Betoltes} szoveg="Szabályok betöltése…"/>`;
  if (szabalyok.allapot === 'hiba') return html`<${Uzenet}>A szabályadat nem töltődött be: ${szabalyok.hiba.message}<//>`;
  if (!szabalyok.adat) return null;
  const lapok = szabalyok.adat.lapok;
  const db = Object.values(lapok).reduce((a, l) => a + l.length, 0);
  return html`<p className="szoveg">${'✓ '}${db} szabályelem, ${szabalyok.adat.verzio}. verzió${' '}<span className="halvany">(${szabalyok.adat.forras === 'helyi' ? 'ezen az eszközön tárolt példány' : 'most letöltve'})</span>.</p>`;
}

// ---------------- Kampányok ----------------

function KampanyokOldal() {
  const dm = useDm();
  const [uj, setUj] = useState(false);
  const [archivaltak, setArchivaltak] = useState(false);
  const archivDb = dm.kampanyok.filter((k) => k.allapot === ARCHIVALT).length;
  const lista = dm.kampanyok.filter((k) => archivaltak || k.allapot !== ARCHIVALT);
  return html`<div>
    <${Oldalfej} cim="Kampányok">
      <${K.Button} variant="primary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új kampány<//>
    <//>
    <${K.Panel}>
      ${archivDb ? html`<${Jelolo} checked=${archivaltak} onChange=${setArchivaltak}>Archivált kampányok mutatása (${archivDb})<//>` : null}
      ${!dm.betoltve ? html`<${Betoltes}/>` : !lista.length ? html`<p className="halvany">Még nincs kampány.</p>` : html`
      <div className="tablazat-keret"><table className="tablazat">
        <thead><tr><th>Cím</th><th>Állapot</th><th>Mesterjátékos</th><th>Aktív források</th><th><span className="lathatatlan">Művelet</span></th></tr></thead>
        <tbody>${lista.map((k) => html`<tr key=${k.id} className=${k.allapot === ARCHIVALT ? 'tablazat__sor--halvany' : ''}>
          <td><a href=${'#/dm/kampany/' + k.id}>${k.cim}</a></td>
          <td>${k.allapot}</td>
          <td>${k.mesterjatekos_id ? dm.felhasznaloNev(k.mesterjatekos_id) : html`<span className="halvany">nincs</span>`}</td>
          <td>${(k.aktiv_forrasok || []).join(', ')}</td>
          <td className="jobbra"><${K.Button} size="sm" onClick=${() => navigal('/dm/kampany/' + k.id)}>Megnyitás<//></td>
        </tr>`)}</tbody>
      </table></div>`}
    <//>
    ${uj ? html`<${KampanyParbeszed} onBezar=${() => setUj(false)}/>` : null}
  </div>`;
}

function KampanyMezok({ ertek, set, jegyzettel }) {
  const dm = useDm();
  const valt = (m) => (v) => set({ ...ertek, [m]: v });
  return html`<div className="verem">
    <${K.TextField} label="Cím" value=${ertek.cim} onChange=${(e) => valt('cim')(e.target.value)}/>
    <${Valaszto} label="Mesterjátékos" hint="Közös eszközös játéknál ő kezeli a kampány összes karakterét."
      value=${ertek.mesterjatekos_id} onChange=${valt('mesterjatekos_id')} ures="nincs"
      opciok=${dm.felhasznalok.filter((f) => f.aktiv && f.szerep !== 'dm').map((f) => ({ value: f.id, label: f.nev }))}/>
    <${Valaszto} label="Állapot" value=${ertek.allapot} onChange=${valt('allapot')} opciok=${(ertek.allapot === ARCHIVALT ? ALLAPOTOK.concat([ARCHIVALT]) : ALLAPOTOK).map((a) => ({ value: a, label: a }))}/>
    <fieldset className="mezocsoport">
      <legend className="ka-field__label">Aktív források</legend>
      ${FORRASOK.map((f) => html`<${Jelolo} key=${f} checked=${ertek.aktiv_forrasok.includes(f)}
        onChange=${(be) => set({ ...ertek, aktiv_forrasok: be ? ertek.aktiv_forrasok.concat([f]) : ertek.aktiv_forrasok.filter((x) => x !== f) })}>${f}<//>`)}
      <p className="ka-field__msg">A házi szabályok mindig aktívak.</p>
    </fieldset>
    ${jegyzettel ? html`<${K.TextField} label="DM jegyzet" multiline=${true} hint="Csak te látod."
      value=${ertek.dm_jegyzet} onChange=${(e) => valt('dm_jegyzet')(e.target.value)}/>` : null}
  </div>`;
}

function KampanyParbeszed({ onBezar }) {
  const { api } = useApp();
  const dm = useDm();
  const [ertek, set] = useState({ cim: '', mesterjatekos_id: '', allapot: 'előkészítés', aktiv_forrasok: ['Alapkönyv', 'Companion'] });
  const [fut, indit] = useMuvelet();
  const ment = () => indit(async () => {
    if (!ertek.cim.trim()) throw new Error('Adj címet a kampánynak.');
    const v = await api.hivas('campaign.create', ertek);
    dm.kampanyFrissit(v.kampany);
    onBezar();
    navigal('/dm/kampany/' + v.kampany.id);
  }, 'Létrejött a kampány.');
  return html`<${Parbeszed} cim="Új kampány" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${ment}>Kampány létrehozása<//>`}>
    <${KampanyMezok} ertek=${ertek} set=${set}/>
  <//>`;
}

// ---------------- Egy kampány (élő nézet) ----------------

function KampanyOldal({ id }) {
  const { allapot, hiba, frissit } = useKampanyAllapot(id);
  const [dobasok, naploz] = useDobasok(allapot);
  if (hiba && !allapot) return html`<div><${Oldalfej} cim="Kampány" vissza=${['#/dm/kampanyok', 'Kampányok']}/><${Uzenet}>${hiba.message}<//></div>`;
  if (!allapot) return html`<${Betoltes} szoveg="Kampány betöltése…"/>`;
  const k = allapot.kampany;
  return html`<div>
    <${Oldalfej} cim=${k.cim} vissza=${['#/dm/kampanyok', 'Kampányok']}><${KampanyCimkek} kampany=${k}/><//>
    ${k.allapot === ARCHIVALT ? html`<div className="oldalfej__uzenet"><${Uzenet} tonus="warning">Archivált kampány: a játékosok nem látják.<//></div>` : null}
    <div className="ket-hasab">
      <div className="verem">
        <${CsapatPanel} allapot=${allapot} frissit=${frissit}/>
        <${KampanyBeallitasok} kampany=${k} frissit=${frissit}/>
        <${KampanyArchivPanel} kampany=${k} frissit=${frissit}/>
      </div>
      <div className="verem">
        <${K.Panel} title="Dobás"><${DobasPanel} allapot=${allapot} naploz=${naploz} dm=${true}/><//>
        <${K.Panel} title="Dobásnapló"><${DobasNaplo} dobasok=${dobasok} karakterek=${allapot.karakterek} dm=${true}/><//>
      </div>
    </div>
  </div>`;
}

function CsapatPanel({ allapot, frissit }) {
  const { api } = useApp();
  const dm = useDm();
  const [ujKarakter, setUjKarakter] = useState('');
  const [kivesz, setKivesz] = useState(null);
  const [fut, indit] = useMuvelet();
  const kampanyId = allapot.kampany.id;
  const bent = new Set(allapot.karakterek.map((c) => c.id));
  const szabad = dm.karakterek.filter((c) => !bent.has(c.id) && c.aktiv);
  const hozzaad = () => indit(async () => {
    if (!ujKarakter) throw new Error('Válassz karaktert.');
    await api.hivas('campaign.addCharacter', { kampany_id: kampanyId, karakter_id: ujKarakter });
    dm.karakterKampany(ujKarakter, kampanyId, true);
    setUjKarakter('');
    await frissit();
  }, 'A karakter a kampányba került.');
  const allapotValtas = (c, a) => indit(async () => {
    await api.hivas('campaign.addCharacter', { kampany_id: kampanyId, karakter_id: c.id, allapot: a });
    await frissit();
  });

  return html`<${K.Panel} title="Csapat">
    ${allapot.karakterek.length ? html`<ul className="sorlista">
      ${allapot.karakterek.map((c) => html`<li key=${c.id} className="sorlista__sor">
        <div>
          <a className="sorlista__nev" href=${'#/dm/karakter/' + c.id}>${c.nev}</a>
          <${KarakterFejlec} karakter=${c} jatekosNev=${dm.felhasznaloNev(c.jatekos_id)}/>
        </div>
        <div className="sorlista__muvelet">
          <select className="ka-field__input valaszto valaszto--kicsi" aria-label=${c.nev + ' állapota'} value=${c.kampany_allapot}
            disabled=${fut} onChange=${(e) => allapotValtas(c, e.target.value)}>
            ${KARAKTER_ALLAPOTOK.map((a) => html`<option key=${a} value=${a}>${a}</option>`)}
          </select>
          <${K.Button} variant="quiet" size="sm" onClick=${() => setKivesz(c)}>Kivétel<//>
        </div>
      </li>`)}
    </ul>` : html`<p className="halvany">Még nincs karakter a kampányban.</p>`}
    <${K.Divider} ornament=${false}/>
    <${UjKampanyKarakter} kampanyId=${kampanyId} onLetrejott=${(c) => { dm.karakterFrissit(c); dm.karakterKampany(c.id, kampanyId, true); navigal('/dm/karakter/' + c.id + '/keszites'); }}/>
    <div className="sorban">
      <${Valaszto} label="Karakter hozzáadása" value=${ujKarakter} onChange=${setUjKarakter} ures="Válassz…"
        opciok=${szabad.map((c) => ({ value: c.id, label: c.nev + (c.jatekos_id ? ' (' + dm.felhasznaloNev(c.jatekos_id) + ')' : '') }))}/>
      <${K.Button} disabled=${fut || !ujKarakter} onClick=${hozzaad}>Hozzáadás<//>
    </div>
    ${kivesz ? html`<${Megerosites} cim="Kivétel a kampányból" gomb="Kivétel" veszelyes=${true}
      szoveg=${kivesz.nev + ' kikerül ebből a kampányból. A karakter megmarad, később visszarendelheted. Ha csak elment vagy meghalt, inkább az állapotát állítsd át.'}
      onMegse=${() => setKivesz(null)}
      onIgen=${() => { const c = kivesz; setKivesz(null); indit(async () => { await api.hivas('campaign.removeCharacter', { kampany_id: kampanyId, karakter_id: c.id }); dm.karakterKampany(c.id, kampanyId, false); await frissit(); }, 'A karakter kikerült a kampányból.'); }}/>` : null}
  <//>`;
}

function KampanyBeallitasok({ kampany, frissit }) {
  const { api } = useApp();
  const dm = useDm();
  const kiindulo = () => ({ cim: kampany.cim, mesterjatekos_id: kampany.mesterjatekos_id || '', allapot: kampany.allapot || 'előkészítés',
    aktiv_forrasok: kampany.aktiv_forrasok || [], dm_jegyzet: kampany.dm_jegyzet || '' });
  const [ertek, set] = useState(kiindulo);
  const [alap, setAlap] = useState(kiindulo);
  const [fut, indit] = useMuvelet();
  // ha a kampány máshol változott (archiválás, másik eszköz), a még nem szerkesztett űrlap követi
  const friss = JSON.stringify(kiindulo());
  useEffect(() => {
    if (JSON.stringify(ertek) === JSON.stringify(alap)) set(kiindulo());
    setAlap(kiindulo());
  }, [friss]);
  const valtozott = JSON.stringify(ertek) !== JSON.stringify(alap);
  const ment = () => indit(async () => {
    const v = await api.hivas('campaign.update', { id: kampany.id, ...ertek });
    dm.kampanyFrissit(v.kampany);
    await frissit();
  }, 'Kampány mentve.');
  return html`<${K.Panel} title="Beállítások">
    <details className="lenyilo" open=${valtozott || undefined}>
      <summary>Cím, mesterjátékos, források, DM jegyzet</summary>
      <${KampanyMezok} ertek=${ertek} set=${set} jegyzettel=${true}/>
      <div className="gombsor">
        <${K.Button} disabled=${fut || !valtozott} onClick=${ment}>Mentés<//>
        ${valtozott ? html`<${K.Button} variant="quiet" onClick=${() => set(alap)}>Visszaállítás<//>` : null}
      </div>
    </details>
  <//>`;
}

function KampanyArchivPanel({ kampany, frissit }) {
  const { api } = useApp();
  const dm = useDm();
  const [kerdes, setKerdes] = useState(null);
  const [fut, indit] = useMuvelet();
  const archivalt = kampany.allapot === ARCHIVALT;
  const allapot = (uj, siker) => indit(async () => {
    const v = await api.hivas('campaign.update', { id: kampany.id, allapot: uj });
    dm.kampanyFrissit(v.kampany);
    await frissit();
  }, siker);
  const torol = () => indit(async () => {
    await api.hivas('campaign.delete', { id: kampany.id });
    dm.kampanyTorol(kampany.id);
    dm.karakterek.forEach((c) => { if ((c.kampanyok || []).includes(kampany.id)) dm.karakterKampany(c.id, kampany.id, false); });
    navigal('/dm/kampanyok');
  }, kampany.cim + ' véglegesen törölve.');
  return html`<${K.Panel} title="Archiválás és törlés">
    ${archivalt
      ? html`<p className="szoveg">A kampány archivált. Visszaállítva lezárt állapotba kerül, véglegesen törölve a karakterek megmaradnak.</p>
        <div className="gombsor">
          <${K.Button} disabled=${fut} onClick=${() => allapot('lezárva', 'A kampány visszaállítva (lezárva).')}>Visszaállítás<//>
          <${K.Button} variant="danger" disabled=${fut} onClick=${() => setKerdes('torol')}>Végleges törlés<//>
        </div>`
      : html`<p className="szoveg">Archiválva eltűnik a játékosok elől és a menüből, de megmarad, és visszaállítható. Véglegesen csak archivált kampányt lehet törölni.</p>
        <div className="gombsor"><${K.Button} disabled=${fut} onClick=${() => setKerdes('archival')}>Archiválás<//></div>`}
    ${kerdes === 'archival' ? html`<${Megerosites} cim="Archiválás" gomb="Archiválás"
      szoveg=${kampany.cim + ' eltűnik a játékosok nézetéből és a menüből. Később visszaállíthatod.'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); allapot(ARCHIVALT, 'A kampány archiválva.'); }}/>` : null}
    ${kerdes === 'torol' ? html`<${Megerosites} cim="Végleges törlés" gomb="Végleges törlés" veszelyes=${true}
      szoveg=${kampany.cim + ' véglegesen törlődik. A karakterek megmaradnak, csak kikerülnek belőle. A dobásnapló bejegyzései a táblázatban maradnak. Ezt nem lehet visszavonni (csak a napi mentésből).'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); torol(); }}/>` : null}
  <//>`;
}

// ---------------- Karakterek ----------------

function KarakterekOldal() {
  const dm = useDm();
  const { szabalyok } = useApp();
  const [kereses, setKereses] = useState('');
  const [uj, setUj] = useState(false);
  const kampanyCim = (id) => { const k = dm.kampanyok.find((x) => x.id === id); return k ? k.cim : ''; };
  const [archivaltak, setArchivaltak] = useState(false);
  const szo = kereses.trim().toLowerCase();
  const archivDb = dm.karakterek.filter((c) => !c.aktiv).length;
  const lista = dm.karakterek.filter((c) => (archivaltak || c.aktiv) &&
    (!szo || [c.nev, dm.felhasznaloNev(c.jatekos_id)].join(' ').toLowerCase().includes(szo)));
  return html`<div>
    <${Oldalfej} cim="Karakterek">
      <${K.Button} variant="primary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új karakter<//>
    <//>
    <${K.Panel}>
      <div className="szuro"><${K.TextField} label="Keresés" placeholder="Karakter vagy játékos neve" value=${kereses} onChange=${(e) => setKereses(e.target.value)}/></div>
      ${archivDb ? html`<${Jelolo} checked=${archivaltak} onChange=${setArchivaltak}>Archivált karakterek mutatása (${archivDb})<//>` : null}
      ${!dm.betoltve ? html`<${Betoltes}/>` : !lista.length ? html`<p className="halvany">${dm.karakterek.length ? 'Nincs találat.' : 'Még nincs karakter.'}</p>` : html`
      <div className="tablazat-keret"><table className="tablazat">
        <thead><tr><th>Név</th><th>Faj és osztály</th><th>Játékos</th><th>Kampányok</th></tr></thead>
        <tbody>${lista.map((c) => html`<tr key=${c.id} className=${c.aktiv ? '' : 'tablazat__sor--halvany'}>
          <td><a href=${'#/dm/karakter/' + c.id}>${c.nev}</a>${c.aktiv ? null : html` <${K.Badge}>Archivált<//>`}</td>
          <td><${KarakterFejlec} karakter=${c}/></td>
          <td>${c.jatekos_id ? dm.felhasznaloNev(c.jatekos_id) : html`<span className="halvany">nincs</span>`}</td>
          <td>${(c.kampanyok || []).map(kampanyCim).filter(Boolean).join(', ') || html`<span className="halvany">nincs</span>`}</td>
        </tr>`)}</tbody>
      </table></div>`}
    <//>
    ${uj ? html`<${UjKarakterParbeszed} onBezar=${() => setUj(false)}/>` : null}
  </div>`;
}

function UjKarakterParbeszed({ onBezar }) {
  const { api } = useApp();
  const dm = useDm();
  const [nev, setNev] = useState('');
  const [jatekos, setJatekos] = useState('');
  const [kampany, setKampany] = useState('');
  const [fut, indit] = useMuvelet();
  const ment = () => indit(async () => {
    if (!nev.trim()) throw new Error('Adj nevet a karakternek.');
    const v = await api.hivas('character.create', { nev: nev.trim(), adat: uresKarakter({ nev: nev.trim() }), jatekos_id: jatekos, kampany_id: kampany || undefined });
    dm.karakterFrissit(v.karakter);
    onBezar();
    navigal('/dm/karakter/' + v.karakter.id + '/keszites');
  }, 'Létrejött a karakter, jöhet a karakterkészítés.');
  return html`<${Parbeszed} cim="Új karakter" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${ment}>Karakter létrehozása<//>`}>
    <div className="verem">
      <${K.TextField} label="Név" value=${nev} onChange=${(e) => setNev(e.target.value)}/>
      <${Valaszto} label="Játékos" hint="Üresen is hagyhatod (például a gyerekek karakterei). Később is társíthatod."
        value=${jatekos} onChange=${setJatekos} ures="nincs" opciok=${dm.felhasznalok.filter((f) => f.aktiv).map((f) => ({ value: f.id, label: f.nev }))}/>
      <${Valaszto} label="Kampány" value=${kampany} onChange=${setKampany} ures="nincs"
        opciok=${dm.kampanyok.map((k) => ({ value: k.id, label: k.cim }))}/>
      <p className="halvany kicsi">Létrehozás után a karakterkészítő varázsló nyílik meg (faj, osztály, tulajdonságok és a többi).</p>
    </div>
  <//>`;
}

function KarakterOldal({ id }) {
  const { api } = useApp();
  const dm = useDm();
  const lekeres = useLekeres(async () => (await api.hivas('character.get', { id })).karakter, [id], 'kar.' + id);
  // a karakter változása (mentés, társítás, archiválás) a listában is látszódjon
  const valtozott = (uj) => { lekeres.beallit((c) => ({ ...c, ...uj })); dm.karakterFrissit({ ...lekeres.adat, ...uj }); };
  return html`<div>
    <${HibaVagyBetoltes} lekeres=${lekeres}>${(c) => html`
      <${Oldalfej} cim=${c.nev} vissza=${['#/dm/karakterek', 'Karakterek']}>
        <${KarakterFejlec} karakter=${c}/>
        ${c.aktiv === false ? html`<${K.Badge} tone="warning">⚠ Archivált<//>` : null}
        <${KeszitesGomb} karakter=${c} alap=${'/dm/karakter/' + c.id}/>
      <//>
      <div className="ket-hasab">
        <${KarakterLap} karakter=${c}/>
        <div className="verem">
          <${TarsitasPanel} karakter=${c} valtozott=${valtozott}/>
          <${NyersAdatPanel} karakter=${c} valtozott=${valtozott} ujra=${lekeres.ujra}/>
          <${KarakterArchivPanel} karakter=${c} valtozott=${valtozott}/>
        </div>
      </div>`}
    <//>
  </div>`;
}

function KarakterArchivPanel({ karakter, valtozott }) {
  const { api } = useApp();
  const dm = useDm();
  const [kerdes, setKerdes] = useState(null);
  const [fut, indit] = useMuvelet();
  const archival = (aktiv) => indit(async () => {
    const v = await api.hivas('character.archive', { id: karakter.id, aktiv });
    valtozott(v.karakter);
  }, aktiv ? 'A karakter visszaállítva.' : 'A karakter archiválva.');
  const torol = () => indit(async () => {
    await api.hivas('character.delete', { id: karakter.id });
    dm.karakterTorol(karakter.id);
    try { localStorage.removeItem(gyorsKulcs(api.felhasznalo.id, 'kar.' + karakter.id)); } catch (e) { /* nem baj */ }
    navigal('/dm/karakterek');
  }, karakter.nev + ' véglegesen törölve.');
  const archivalt = karakter.aktiv === false;
  return html`<${K.Panel} title="Archiválás és törlés">
    ${archivalt
      ? html`<p className="szoveg">A karakter archivált: a játékosok és a kampányok nézete nem mutatja. Visszaállíthatod, vagy véglegesen törölheted.</p>
        <div className="gombsor">
          <${K.Button} disabled=${fut} onClick=${() => archival(true)}>Visszaállítás<//>
          <${K.Button} variant="danger" disabled=${fut} onClick=${() => setKerdes('torol')}>Végleges törlés<//>
        </div>`
      : html`<p className="szoveg">Archiválva eltűnik a játékosok és a kampányok nézetéből, de megmarad, és bármikor visszaállítható. Véglegesen csak archivált karaktert lehet törölni.</p>
        <div className="gombsor"><${K.Button} disabled=${fut} onClick=${() => setKerdes('archival')}>Archiválás<//></div>`}
    ${kerdes === 'archival' ? html`<${Megerosites} cim="Archiválás" gomb="Archiválás"
      szoveg=${karakter.nev + ' eltűnik a játékosok és a kampányok nézetéből. Később visszaállíthatod.'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); archival(false); }}/>` : null}
    ${kerdes === 'torol' ? html`<${Megerosites} cim="Végleges törlés" gomb="Végleges törlés" veszelyes=${true}
      szoveg=${karakter.nev + ' véglegesen törlődik, a kampánykapcsolataival együtt. A dobásnapló bejegyzései megmaradnak. Ezt nem lehet visszavonni (csak a napi mentésből).'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); torol(); }}/>` : null}
  <//>`;
}

function TarsitasPanel({ karakter, valtozott }) {
  const { api } = useApp();
  const dm = useDm();
  const [jatekos, setJatekos] = useState(karakter.jatekos_id || '');
  const [kampany, setKampany] = useState('');
  const [fut, indit] = useMuvelet();
  const tarsit = () => indit(async () => {
    const v = await api.hivas('character.assign', { karakter_id: karakter.id, jatekos_id: jatekos });
    valtozott(v.karakter);
  }, jatekos ? 'Társítás kész.' : 'A karakter játékos nélküli lett.');
  const kampanyba = () => indit(async () => {
    await api.hivas('campaign.addCharacter', { kampany_id: kampany, karakter_id: karakter.id });
    valtozott({ kampanyok: Array.from(new Set((karakter.kampanyok || []).concat([kampany]))) });
    setKampany('');
  }, 'A karakter a kampányba került.');
  const kampanyai = karakter.kampanyok || [];
  return html`<${K.Panel} title="Játékos és kampányok">
    <div className="verem">
      <div className="sorban">
        <${Valaszto} label="Játékos" value=${jatekos} onChange=${setJatekos} ures="nincs (játékos nélküli)"
          opciok=${dm.felhasznalok.filter((f) => f.aktiv || f.id === karakter.jatekos_id).map((f) => ({ value: f.id, label: f.nev }))}/>
        <${K.Button} disabled=${fut || jatekos === (karakter.jatekos_id || '')} onClick=${tarsit}>Társítás<//>
      </div>
      <div>
        <div className="ka-field__label">Kampányai</div>
        ${kampanyai.length ? html`<ul className="egyszeru-lista">${kampanyai.map((kid) => {
          const k = dm.kampanyok.find((x) => x.id === kid);
          return html`<li key=${kid}><a href=${'#/dm/kampany/' + kid}>${k ? k.cim : kid}</a></li>`;
        })}</ul>` : html`<p className="halvany">Még egy kampányban sincs.</p>`}
      </div>
      <div className="sorban">
        <${Valaszto} label="Kampányba rendelés" value=${kampany} onChange=${setKampany} ures="Válassz…"
          opciok=${dm.kampanyok.filter((k) => !kampanyai.includes(k.id)).map((k) => ({ value: k.id, label: k.cim }))}/>
        <${K.Button} disabled=${fut || !kampany} onClick=${kampanyba}>Hozzáadás<//>
      </div>
    </div>
  <//>`;
}

// Átmeneti eszköz a karakterkészítő elkészültéig: a karakter adatai JSON-ban.
function NyersAdatPanel({ karakter, valtozott, ujra }) {
  const { sync } = useApp();
  const [szoveg, setSzoveg] = useState(() => JSON.stringify(karakter.adat || {}, null, 2));
  const [hiba, setHiba] = useState(null);
  const [fut, indit] = useMuvelet();
  useEffect(() => { setSzoveg(JSON.stringify(karakter.adat || {}, null, 2)); }, [karakter.verzio]);
  const ment = () => {
    let adat;
    try { adat = JSON.parse(szoveg); } catch (e) { setHiba('Nem érvényes JSON. Ellenőrizd a vesszőket és az idézőjeleket.'); return; }
    if (!adat || typeof adat !== 'object' || Array.isArray(adat)) { setHiba('Az adat egy { } közé zárt objektum legyen.'); return; }
    setHiba(null);
    indit(async () => {
      let v;
      try {
        v = await sync.push({ action: 'character.save', adat: { id: karakter.id, verzio: karakter.verzio, adat } });
      } catch (e) {
        if (e.kod === 'utkozes') { await ujra(); throw new Error('Közben más is módosította a karaktert. Betöltöttem a frisset, nézd át, és mentsd újra.'); }
        throw e;
      }
      valtozott({ adat, verzio: v.verzio, modositva: v.modositva, nev: adat.nev || karakter.nev,
        faj: adat.faj !== undefined ? adat.faj : karakter.faj, osztaly: adat.osztaly !== undefined ? adat.osztaly : karakter.osztaly,
        szint: adat.szint !== undefined ? adat.szint : karakter.szint });
    }, 'Karakter mentve.');
  };
  return html`<${K.Panel} title="Adatok (haladó)">
    <details className="lenyilo">
      <summary>Nyers adatok megnyitása</summary>
      <p className="halvany kicsi">Átmeneti eszköz a karakterkészítő elkészültéig. ${karakter.verzio}. verzió, utoljára módosítva: ${idopont(karakter.modositva)}.</p>
      <${K.TextField} label="Karakter adatai (JSON)" multiline=${true} className="kodmezo" spellCheck=${false}
        value=${szoveg} onChange=${(e) => setSzoveg(e.target.value)} error=${hiba || undefined}/>
      <div className="gombsor"><${K.Button} disabled=${fut} onClick=${ment}>Mentés<//></div>
    </details>
  <//>`;
}

// ---------------- Felhasználók ----------------

function FelhasznalokOldal() {
  const { api, felhasznalo, uzen } = useApp();
  const dm = useDm();
  const [uj, setUj] = useState(false);
  const [jelszoNeki, setJelszoNeki] = useState(null);
  const [tiltas, setTiltas] = useState(null);
  const [torles, setTorles] = useState(null);
  const [fut, indit] = useMuvelet();
  const allit = (f, muvelet, siker) => indit(async () => {
    const v = await api.hivas('users.admin', { muvelet, id: f.id });
    if (v.torolve) dm.felhasznaloTorol(f.id); else dm.felhasznaloFrissit(v.felhasznalo);
  }, siker);
  return html`<div>
    <${Oldalfej} cim="Felhasználók">
      <${K.Button} variant="primary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új felhasználó<//>
    <//>
    <div className="ket-hasab ket-hasab--szeles-bal">
      <${K.Panel}>
        ${!dm.betoltve ? html`<${Betoltes}/>` : html`<div className="tablazat-keret"><table className="tablazat">
          <thead><tr><th>Név</th><th>Szerep</th><th>Állapot</th><th><span className="lathatatlan">Műveletek</span></th></tr></thead>
          <tbody>${dm.felhasznalok.map((f) => html`<tr key=${f.id} className=${f.aktiv ? '' : 'tablazat__sor--halvany'}>
            <td>${f.nev}${f.id === felhasznalo.id ? html` <span className="halvany kicsi">(te)</span>` : null}</td>
            <td>${SZEREP_NEV[f.szerep] || f.szerep}</td>
            <td>${f.aktiv ? html`<${K.Badge} tone="success">✓ Aktív<//>` : html`<${K.Badge} tone="danger">✗ Letiltva<//>`}</td>
            <td className="jobbra"><div className="gombsor gombsor--jobbra">
              <${K.Button} size="sm" onClick=${() => setJelszoNeki(f)}>Jelszó beállítása<//>
              ${f.id === felhasznalo.id ? null : f.aktiv
                ? html`<${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => setTiltas(f)}>Letiltás<//>`
                : html`<${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => allit(f, 'engedelyez', f.nev + ' újra beléphet.')}>Engedélyezés<//>
                  <${K.Button} size="sm" variant="danger" disabled=${fut} onClick=${() => setTorles(f)}>Törlés<//>`}
            </div></td>
          </tr>`)}</tbody>
        </table></div>`}
      <//>
      <${MeghivoPanel}/>
    </div>
    ${uj ? html`<${UjFelhasznaloParbeszed} onBezar=${() => setUj(false)}/>` : null}
    ${jelszoNeki ? html`<${JelszoParbeszed} felh=${jelszoNeki} onBezar=${() => setJelszoNeki(null)}/>` : null}
    ${tiltas ? html`<${Megerosites} cim="Letiltás" gomb="Letiltás" veszelyes=${true}
      szoveg=${tiltas.nev + ' azonnal kijelentkezik minden eszközén, és nem léphet be, amíg újra nem engedélyezed. A karakterei megmaradnak.'}
      onMegse=${() => setTiltas(null)} onIgen=${() => { const f = tiltas; setTiltas(null); allit(f, 'letilt', f.nev + ' letiltva.'); }}/>` : null}
    ${torles ? html`<${Megerosites} cim="Felhasználó törlése" gomb="Végleges törlés" veszelyes=${true}
      szoveg=${torles.nev + ' fiókja véglegesen törlődik. Ha mesterjátékos volt, a kampányai mesterjátékos nélkül maradnak. Ha még vannak karakterei, előbb társítsd őket másnak, vagy tedd őket játékos nélkülivé.'}
      onMegse=${() => setTorles(null)} onIgen=${() => { const f = torles; setTorles(null); allit(f, 'torol', f.nev + ' törölve.'); }}/>` : null}
  </div>`;
}

function UjFelhasznaloParbeszed({ onBezar }) {
  const { api } = useApp();
  const dm = useDm();
  const [nev, setNev] = useState('');
  const [jelszo, setJelszo] = useState('');
  const [szerep, setSzerep] = useState('jatekos');
  const [fut, indit] = useMuvelet();
  const ment = () => indit(async () => {
    if (!nev.trim()) throw new Error('Add meg a nevet.');
    if (jelszo.length < 4) throw new Error('A jelszó legalább 4 karakter legyen.');
    const v = await api.hivas('users.admin', { muvelet: 'letrehoz', nev: nev.trim(), jelszo, szerep });
    dm.felhasznaloFrissit(v.felhasznalo);
    onBezar();
  }, 'Létrejött a felhasználó.');
  return html`<${Parbeszed} cim="Új felhasználó" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${ment}>Felhasználó létrehozása<//>`}>
    <div className="verem">
      <${K.TextField} label="Név" hint="Ezzel lép be. A kis- és nagybetű mindegy." value=${nev} onChange=${(e) => setNev(e.target.value)}/>
      <${K.TextField} label="Jelszó" hint="Legalább 4 karakter. Add át neki személyesen." value=${jelszo} autoComplete="new-password"
        onChange=${(e) => setJelszo(e.target.value)}/>
      <${Valaszto} label="Szerep" value=${szerep} onChange=${setSzerep}
        opciok=${[{ value: 'jatekos', label: 'Játékos' }, { value: 'dm', label: 'DM (mindent lát és szerkeszt)' }]}/>
    </div>
  <//>`;
}

function JelszoParbeszed({ felh, onBezar }) {
  const { api } = useApp();
  const [jelszo, setJelszo] = useState('');
  const [fut, indit] = useMuvelet();
  const ment = () => indit(async () => {
    if (jelszo.length < 4) throw new Error('A jelszó legalább 4 karakter legyen.');
    await api.hivas('users.admin', { muvelet: 'jelszo', id: felh.id, jelszo });
    onBezar();
  }, 'Az új jelszó beállítva.');
  return html`<${Parbeszed} cim=${'Jelszó: ' + felh.nev} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${ment}>Jelszó beállítása<//>`}>
    <${K.TextField} label="Új jelszó" hint="Legalább 4 karakter. A régi jelszó ezzel érvényét veszti." value=${jelszo}
      autoComplete="new-password" onChange=${(e) => setJelszo(e.target.value)}/>
  <//>`;
}

function MeghivoPanel() {
  const { api, uzen } = useApp();
  const link = location.origin + location.pathname + '#kapcsolat=' + encodeURIComponent(api.url || '');
  const masol = async () => {
    try { await navigator.clipboard.writeText(link); uzen('A link a vágólapra került.'); }
    catch (e) { uzen('Nem sikerült másolni. Jelöld ki a linket, és másold kézzel.', 'warning'); }
  };
  return html`<${K.Panel} title="Meghívó link">
    <div className="verem">
      <p className="szoveg">Ezt a linket küldd el a játékosoknak. Az első megnyitáskor beállítja a szerver címét az eszközükön, utána csak a nevüket és a jelszavukat kell beírniuk.</p>
      <${K.TextField} label="Link" readOnly=${true} value=${link} onFocus=${(e) => e.target.select()}/>
      <${Uzenet} tonus="warning">A link a háttér címét tartalmazza. Csak családtagoknak és barátoknak küldd el.<//>
      <div className="gombsor"><${K.Button} onClick=${masol}>Link másolása<//></div>
    </div>
  <//>`;
}

// ---------------- Szabályok ----------------

function SzabalyokOldal() {
  const { szabalyok, szabalyBetoltes } = useApp();
  const [kereses, setKereses] = useState('');
  const adat = szabalyok.adat;
  const talalatok = useMemo(() => {
    const szo = kereses.trim().toLowerCase();
    if (!adat || szo.length < 2) return [];
    const ki = [];
    Object.entries(adat.lapok).forEach(([lap, elemek]) => elemek.forEach((e) => {
      if (String(e.id || '').endsWith('_altalanos')) return;
      if ([e.nev_hu, e.nev_en, e.projektben, e.eredeti].join(' ').toLowerCase().includes(szo)) ki.push({ lap, e });
    }));
    return ki.slice(0, 60);
  }, [adat, kereses]);
  return html`<div>
    <${Oldalfej} cim="Szabályok">
      <${K.Button} onClick=${szabalyBetoltes} disabled=${szabalyok.allapot === 'tolt'}>Frissítés keresése<//>
    <//>
    <div className="ket-hasab ket-hasab--szeles-bal">
      <${K.Panel} title="Keresés">
        <${K.TextField} label="Név magyarul vagy angolul" placeholder="például Észlelés, Dwarf, Tűzlövés" value=${kereses}
          onChange=${(e) => setKereses(e.target.value)} disabled=${!adat}/>
        ${kereses.trim().length >= 2 ? html`<p className="halvany kicsi">${talalatok.length === 60 ? 'Az első 60 találat.' : talalatok.length + ' találat.'}</p>` : null}
        <ul className="sorlista">${talalatok.map(({ lap, e }) => html`<li key=${lap + e.id} className="sorlista__sor sorlista__sor--fuggoleges">
          <div className="sorlista__nev">${megjelenitettNev(e) || (e.projektben ? e.projektben + (e.eredeti ? ' (' + e.eredeti + ')' : '') : e.id)}</div>
          <div className="cimkek"><${K.Badge}>${lap}<//>${e.forras ? html`<${K.Badge} tone="accent">${e.forras}${e.oldal ? ', ' + e.oldal + '. o.' : ''}<//>` : null}</div>
          ${e.leiras_hu ? html`<p className="szoveg kicsi">${e.leiras_hu}</p>` : null}
        </li>`)}</ul>
      <//>
      <${K.Panel} title="Tartalom">
        <${SzabalyAllapot} szabalyok=${szabalyok}/>
        ${adat ? html`<dl className="ertekek ertekek--lista">${Object.entries(adat.lapok).map(([lap, l]) => html`<div key=${lap}><dt>${lap}</dt><dd>${l.length}</dd></div>`)}</dl>` : null}
      <//>
    </div>
  </div>`;
}
