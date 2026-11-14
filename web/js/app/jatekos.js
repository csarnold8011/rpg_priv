// Játékos felület (telefon az elsődleges): egy hasáb, nagy gombok, erdő vagy holdfény téma.
import {
  html, K, useApp, useState, useEffect, temaBeallitasa, useLekeres, useMuvelet, navigal, Ikon, Betoltes, Uzenet, Parbeszed,
  TemaKapcsolo, SzinkronJelzo, HibaVagyBetoltes, indulasLekerese
} from './kozos.js';
import { useKampanyAllapot, useDobasok, DobasPanel, DobasNaplo, KarakterLap, KarakterFejlec, KampanyCimkek, KeszitesGomb, UjKampanyKarakter } from './jatek.js';
import { uresKarakter } from '../karakter/adat.js';
import { KarakterVarazslo, taroltKampanyok } from './varazslo.js';

export function JatekosFelulet({ ut }) {
  const { felhasznalo, kilepes } = useApp();
  const [menu, setMenu] = useState(false);
  useEffect(() => { temaBeallitasa('jatekos'); }, []);
  const [oldal, azon] = ut;
  // A karakterkészítő varázsló a teljes képernyőt kapja.
  if (oldal === 'karakter' && azon && ut[2] === 'keszites') {
    return html`<${KarakterVarazslo} key=${azon} id=${azon} lepes=${ut[3]} birodalom="jatekos" kampanyok=${taroltKampanyok(felhasznalo.id)}/>`;
  }
  let tartalom;
  if (oldal === 'kampany' && azon) tartalom = html`<${KampanyOldal} key=${azon} id=${azon}/>`;
  else if (oldal === 'karakter' && azon) tartalom = html`<${KarakterOldal} key=${azon} id=${azon}/>`;
  else tartalom = html`<${Kezdolap}/>`;

  return html`<div className="jatekos">
    <header className="fejlec">
      <a href="#/jatekos" className="fejlec__nev">Fantasy AGE</a>
      <div className="fejlec__jobb">
        <${SzinkronJelzo}/>
        <button type="button" className="ikongomb" aria-label="Menü" onClick=${() => setMenu(true)}><${Ikon} nev="menu"/></button>
      </div>
    </header>
    <main className="jatekos__tartalom">${tartalom}</main>
    ${menu ? html`<${Parbeszed} cim=${felhasznalo.nev} onBezar=${() => setMenu(false)}>
      <div className="verem">
        <${TemaKapcsolo} birodalom="jatekos"/>
        <${K.Button} variant="secondary" size="lg" onClick=${() => { setMenu(false); kilepes(); }}
          icon=${html`<${Ikon} nev="kilepes" meret=${20}/>`}>Kilépés<//>
      </div>
    <//>` : null}
  </div>`;
}

function Kezdolap() {
  const { api, felhasznalo } = useApp();
  // egyetlen hívás; az előző eredmény az eszközről azonnal látszik
  const init = useLekeres(() => indulasLekerese(api, false), [], 'init');
  const kampanyok = { ...init, adat: init.adat && init.adat.kampanyok };
  const karakterek = { ...init, adat: init.adat && init.adat.karakterek };
  const [uj, setUj] = useState(false);
  return html`<div className="verem verem--nagy">
    <h1 className="oldalcim">Szia, ${felhasznalo.nev}!</h1>
    <${K.Panel} title="Kampányaim">
      <${HibaVagyBetoltes} lekeres=${kampanyok}>${(lista) => lista.length ? html`<ul className="kartyalista">
        ${lista.map((k) => html`<li key=${k.id}><a className="kartya" href=${'#/jatekos/kampany/' + k.id}>
          <span className="kartya__cim">${k.cim}</span>
          <${KampanyCimkek} kampany=${k}/>
        </a></li>`)}
      </ul>` : html`<p className="halvany">Még nem vagy kampányban. Ha a DM hozzárendeli a karakteredet egy kampányhoz, itt megjelenik.</p>`}<//>
    <//>
    <${K.Panel} title="Karaktereim" actions=${html`<${K.Button} size="md" variant="quiet" onClick=${() => setUj(true)}
        icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új karakter<//>`}>
      <${HibaVagyBetoltes} lekeres=${karakterek}>${(lista) => lista.length ? html`<ul className="kartyalista">
        ${lista.map((c) => html`<li key=${c.id}><a className="kartya" href=${'#/jatekos/karakter/' + c.id}>
          <span className="kartya__cim">${c.nev}</span>
          <${KarakterFejlec} karakter=${c}/>
        </a></li>`)}
      </ul>` : html`<p className="halvany">Még nincs karaktered.</p>`}<//>
    <//>
    ${uj ? html`<${UjKarakter} onBezar=${() => setUj(false)}/>` : null}
  </div>`;
}

function UjKarakter({ onBezar }) {
  const { api } = useApp();
  const [nev, setNev] = useState('');
  const [fut, indit] = useMuvelet();
  const ment = () => indit(async () => {
    if (!nev.trim()) throw new Error('Adj nevet a karakternek.');
    const v = await api.hivas('character.create', { nev: nev.trim(), adat: uresKarakter({ nev: nev.trim() }) });
    onBezar();
    navigal('/jatekos/karakter/' + v.karakter.id + '/keszites');
  }, 'Létrejött a karakter, jöhet a karakterkészítés.');
  return html`<${Parbeszed} cim="Új karakter" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" size="lg" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" size="lg" disabled=${fut} onClick=${ment}>Létrehozás<//>`}>
    <div className="verem">
      <${K.TextField} label="A karakter neve" autoCapitalize="words" value=${nev} onChange=${(e) => setNev(e.target.value)}/>
      <p className="halvany kicsi">Létrehozás után a karakterkészítő varázsló nyílik meg. Kampányba a DM rendeli.</p>
    </div>
  <//>`;
}

function KampanyOldal({ id }) {
  const { allapot, hiba } = useKampanyAllapot(id);
  const [dobasok, naploz] = useDobasok(allapot);
  const [dobasNyitva, setDobasNyitva] = useState(false);
  if (hiba && !allapot) return html`<div className="verem"><a className="visszalink" href="#/jatekos"><${Ikon} nev="vissza" meret=${20}/>Kezdőlap</a><${Uzenet}>${hiba.message}<//></div>`;
  if (!allapot) return html`<${Betoltes} szoveg="Kampány betöltése…"/>`;
  const k = allapot.kampany;
  return html`<div className="verem verem--nagy van-alsosav">
    <div className="oldalfej">
      <a className="visszalink" href="#/jatekos"><${Ikon} nev="vissza" meret=${20}/>Kezdőlap</a>
      <h1 className="oldalcim">${k.cim}</h1>
      <${KampanyCimkek} kampany=${k}/>
    </div>
    <${K.Panel} title="Csapat">
      ${allapot.karakterek.length ? html`<ul className="kartyalista">
        ${allapot.karakterek.map((c) => {
          const belso = html`<span className="kartya__cim">${c.nev}</span>
            <${KarakterFejlec} karakter=${c}/>
            ${c.kampany_allapot && c.kampany_allapot !== 'aktív' ? html`<span className="halvany kicsi">${c.kampany_allapot}</span>` : null}`;
          return html`<li key=${c.id}>${c.irhato
            ? html`<a className="kartya" href=${'#/jatekos/karakter/' + c.id}>${belso}</a>`
            : html`<div className="kartya kartya--csak-olvas">${belso}</div>`}</li>`;
        })}
      </ul>` : html`<p className="halvany">Még nincs karakter a kampányban.</p>`}
    <//>
    ${k.sajat_szerep === 'mester' ? html`<${UjKampanyKarakter} kampanyId=${k.id} nagy=${true} onLetrejott=${(c) => navigal('/jatekos/karakter/' + c.id + '/keszites')}/>` : null}
    <${K.Panel} title="Dobásnapló"><${DobasNaplo} dobasok=${dobasok} karakterek=${allapot.karakterek}/><//>
    <div className="alsosav">
      <${K.Button} variant="primary" size="lg" onClick=${() => setDobasNyitva(true)} icon=${html`<${Ikon} nev="kocka" meret=${20}/>`}>Dobás<//>
    </div>
    ${dobasNyitva ? html`<${Parbeszed} cim="Dobás" onBezar=${() => setDobasNyitva(false)}>
      <${DobasPanel} allapot=${allapot} naploz=${naploz} nagy=${true}/>
    <//>` : null}
  </div>`;
}

function KarakterOldal({ id }) {
  const { api, szabalyok } = useApp();
  const lekeres = useLekeres(async () => (await api.hivas('character.get', { id })).karakter, [id], 'kar.' + id);
  return html`<div className="verem verem--nagy">
    <a className="visszalink" href="#/jatekos"><${Ikon} nev="vissza" meret=${20}/>Kezdőlap</a>
    <${HibaVagyBetoltes} lekeres=${lekeres}>${(c) => html`
      <div className="oldalfej">
        <h1 className="oldalcim">${c.nev}</h1>
        <${KarakterFejlec} karakter=${c}/>
        <div className="gombsor"><${KeszitesGomb} karakter=${c} alap=${'/jatekos/karakter/' + c.id}/></div>
      </div>
      <${KarakterLap} karakter=${c}/>`}
    <//>
  </div>`;
}
