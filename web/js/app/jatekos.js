// Játékos felület (telefon az elsődleges): egy hasáb, nagy gombok, erdő vagy holdfény téma.
import {
  html, K, useApp, useState, useEffect, temaBeallitasa, useLekeres, useMuvelet, navigal, Ikon, Betoltes, Uzenet, Parbeszed,
  TemaKapcsolo, SzinkronJelzo, HibaVagyBetoltes, indulasLekerese
} from './kozos.js';
import { KampanyNaplo } from './dobasnaplo.js';
import { JatekosProbak } from './probakeres.js';
import { useKampanyAllapot, useDobasok, DobasPanel, KarakterFejlec, KampanyCimkek, UjKampanyKarakter } from './jatek.js';
import { KarakterLap } from './karakterlap.js';
import { KarakterKep } from './kepek.js';
import { JatekosNjkPanel } from './njk.js';
import { JatekosCsatak } from './csatasav.js';
import { uresKarakter } from '../karakter/adat.js';
import { KarakterVarazslo, taroltKampanyok } from './varazslo.js';
import { SzintlepesVarazslo } from './szintlepes.js';
import { JatekosAnyagok, AnyagMegnyitoReteg, useAnyagMegnyitas, anyagUjak } from './anyagok.js';
import { useJegyzetfuzet, Jegyzetfuzet, KapcsolodoJegyzetek, useJegyzetJelveny } from './jegyzetfuzet.js';
import { alanyCel } from '../kampany/anyag.js';
import { JatekosKalandnaplo, useKalandnaploJelveny } from './kalandnaplo.js';

export function JatekosFelulet({ ut }) {
  const { felhasznalo, kilepes } = useApp();
  const [menu, setMenu] = useState(false);
  useEffect(() => { temaBeallitasa('jatekos'); }, []);
  const [oldal, azon] = ut;
  // A karakterkészítő varázsló a teljes képernyőt kapja.
  if (oldal === 'karakter' && azon && ut[2] === 'keszites') {
    return html`<${KarakterVarazslo} key=${azon} id=${azon} lepes=${ut[3]} birodalom="jatekos" kampanyok=${taroltKampanyok(felhasznalo.id)}/>`;
  }
  if (oldal === 'karakter' && azon && ut[2] === 'szintlepes') {
    return html`<${SzintlepesVarazslo} key=${azon} id=${azon} lepes=${ut[3]} birodalom="jatekos"/>`;
  }
  let tartalom;
  if (oldal === 'kampany' && azon) tartalom = html`<${KampanyOldal} key=${azon} id=${azon} ful=${['anyagok', 'jegyzetek', 'naplo'].includes(ut[2]) ? ut[2] : ''}/>`;
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
        ${lista.map((c) => html`<li key=${c.id}><a className="kartya kartya--kepes" href=${'#/jatekos/karakter/' + c.id}>
          <${KarakterKep} kep=${c.kep} nev=${c.nev}/>
          <span className="kartya__test"><span className="kartya__cim">${c.nev}</span>
          <${KarakterFejlec} karakter=${c}/></span>
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

function KampanyOldal({ id, ful }) {
  const { allapot, hiba } = useKampanyAllapot(id);
  if (hiba && !allapot) return html`<div className="verem"><a className="visszalink" href="#/jatekos"><${Ikon} nev="vissza" meret=${20}/>Kezdőlap</a><${Uzenet}>${hiba.message}<//></div>`;
  if (!allapot) return html`<${Betoltes} szoveg="Kampány betöltése…"/>`;
  return html`<${KampanyTartalom} allapot=${allapot} ful=${ful}/>`;
}

// Fülek: Kampány (csata, próbák, csapat, dobás), Anyagok (a DM-től kapott levelek, nyomok, képek), Jegyzetek
// (a kampány jegyzetfüzete, 6.3) és Napló (a DM által közzétett kalandnapló, 6.4).
function KampanyTartalom({ allapot, ful }) {
  const { felhasznalo } = useApp();
  const megnyitas = useAnyagMegnyitas(allapot);
  const fuzet = useJegyzetfuzet(allapot);
  const ujak = anyagUjak(megnyitas.megosztasok, felhasznalo.id);
  const ujJegyzet = useJegyzetJelveny(allapot, fuzet, ful === 'jegyzetek');
  const ujNaplo = useKalandnaploJelveny(allapot, ful === 'naplo');
  const k = allapot.kampany;
  const fulGomb = (f, nev, jel) => html`<button type="button" aria-pressed=${ful === f}
    onClick=${() => navigal('/jatekos/kampany/' + k.id + (f ? '/' + f : ''))}>${nev}${jel ? html` <span className="jelveny" aria-label=${jel + ' új'}>${jel}</span>` : null}</button>`;
  const fulek = html`<nav className="kapcsolo kapcsolo--teljes jatekos__fulek" aria-label="A kampány részei">
    ${fulGomb('', 'Kampány')}${fulGomb('anyagok', 'Anyagok', ujak)}${fulGomb('jegyzetek', 'Jegyzetek', ujJegyzet)}${fulGomb('naplo', 'Napló', ujNaplo)}
  </nav>`;
  const anyagJegyzetei = (m) => html`<${KapcsolodoJegyzetek} allapot=${allapot} fuzet=${fuzet} idk=${[m.id]} ujKapcsolodik=${m.id}/>`;
  const alanyJegyzetei = (c) => html`<${KapcsolodoJegyzetek} allapot=${allapot} fuzet=${fuzet} cim="Jegyzetek róla"
    idk=${c.alanyIdk.concat(c.anyagok.map((m) => m.id))} ujKapcsolodik=${alanyCel(allapot.alanyok || [], c.alany.id)}/>`;
  const reteg = html`<${AnyagMegnyitoReteg} allapot=${allapot} megnyitas=${megnyitas} kiegeszites=${anyagJegyzetei}/>`;
  const fej = html`<div className="oldalfej">
    <a className="visszalink" href="#/jatekos"><${Ikon} nev="vissza" meret=${20}/>Kezdőlap</a>
    <h1 className="oldalcim">${k.cim}</h1>
  </div>`;
  if (ful === 'anyagok') {
    return html`<div className="verem verem--nagy">
      ${fej}
      ${fulek}
      <${JatekosAnyagok} allapot=${allapot} megnyitas=${megnyitas} alanyJegyzetek=${alanyJegyzetei}/>
      ${reteg}
    </div>`;
  }
  if (ful === 'naplo') {
    return html`<div className="verem verem--nagy">
      ${fej}
      ${fulek}
      <h2 className="lathatatlan">Kalandnapló</h2>
      <${JatekosKalandnaplo} allapot=${allapot}/>
      ${reteg}
    </div>`;
  }
  if (ful === 'jegyzetek') {
    return html`<div className="verem verem--nagy">
      ${fej}
      ${fulek}
      <${Jegyzetfuzet} allapot=${allapot} fuzet=${fuzet} onAnyag=${megnyitas.nyit}/>
      ${reteg}
    </div>`;
  }
  return html`<${KampanyFo} allapot=${allapot} fulek=${fulek} reteg=${reteg}/>`;
}

function KampanyFo({ allapot, fulek, reteg }) {
  const [dobasok, naploz] = useDobasok(allapot);
  const [dobasNyitva, setDobasNyitva] = useState(false);
  const k = allapot.kampany;
  return html`<div className="verem verem--nagy van-alsosav">
    <div className="oldalfej">
      <a className="visszalink" href="#/jatekos"><${Ikon} nev="vissza" meret=${20}/>Kezdőlap</a>
      <h1 className="oldalcim">${k.cim}</h1>
      <${KampanyCimkek} kampany=${k}/>
    </div>
    ${fulek}
    <${JatekosCsatak} allapot=${allapot} naploz=${naploz}/>
    <${JatekosProbak} allapot=${allapot} naploz=${naploz}/>
    <${K.Panel} title="Csapat">
      ${allapot.karakterek.length ? html`<ul className="kartyalista">
        ${allapot.karakterek.map((c) => {
          const belso = html`<${KarakterKep} kep=${c.kep} nev=${c.nev}/><span className="kartya__test"><span className="kartya__cim">${c.nev}</span>
            <${KarakterFejlec} karakter=${c}/>
            ${c.kampany_allapot && c.kampany_allapot !== 'aktív' ? html`<span className="halvany kicsi">${c.kampany_allapot}</span>` : null}</span>`;
          return html`<li key=${c.id}>${c.irhato
            ? html`<a className="kartya kartya--kepes" href=${'#/jatekos/karakter/' + c.id}>${belso}</a>`
            : html`<div className="kartya kartya--kepes kartya--csak-olvas">${belso}</div>`}</li>`;
        })}
      </ul>` : html`<p className="halvany">Még nincs karakter a kampányban.</p>`}
    <//>
    <${JatekosNjkPanel} allapot=${allapot} naploz=${naploz}/>
    ${k.sajat_szerep === 'mester' ? html`<${UjKampanyKarakter} kampanyId=${k.id} nagy=${true} onLetrejott=${(c) => navigal('/jatekos/karakter/' + c.id + '/keszites')}/>` : null}
    <${K.Panel} title="Dobásnapló"><${KampanyNaplo} allapot=${allapot} dobasok=${dobasok}/><//>
    <div className="alsosav">
      <${K.Button} variant="primary" size="lg" onClick=${() => setDobasNyitva(true)} icon=${html`<${Ikon} nev="kocka" meret=${20}/>`}>Dobás<//>
    </div>
    ${dobasNyitva ? html`<${Parbeszed} cim="Dobás" onBezar=${() => setDobasNyitva(false)}>
      <${DobasPanel} allapot=${allapot} naploz=${naploz} nagy=${true}/>
    <//>` : null}
    ${reteg}
  </div>`;
}

function KarakterOldal({ id }) {
  const { api } = useApp();
  const lekeres = useLekeres(async () => (await api.hivas('character.get', { id })).karakter, [id], 'kar.' + id);
  return html`<div className="verem verem--nagy">
    <a className="visszalink" href="#/jatekos"><${Ikon} nev="vissza" meret=${20}/>Kezdőlap</a>
    <${HibaVagyBetoltes} lekeres=${lekeres}>${(c) => html`
      <h1 className="oldalcim">${c.nev}</h1>
      <${KarakterLap} karakter=${c} beallitKarakter=${lekeres.beallit} alap=${'/jatekos/karakter/' + c.id}/>`}
    <//>
  </div>`;
}
