// Kampányépítő: a könyvek dobótábláinak generátora (DM). A dobás helyben gurul (web/js/kampany/generator.js).
// A DM soronként elfogad, újradob, maga választ a táblából (Dobj vagy Beírom), vagy elhagy egy láncolt dobást.
// Kampányban a táblasorok kikapcsolhatók (a kampánykeretben tárolva). Terv: claude/kampanyepito-terv.md, „Generátorok”.
import { html, K, useState, useMemo, Ikon, Uzenet, Valaszto, Parbeszed, Jelolo } from './kozos.js';
import * as G from '../kampany/generator.js';
import { megjelenitettNev } from '../szabalyok.js';

export const tablakBol = (lapok) => ((lapok && lapok['Dobótáblák']) || []).filter((t) => t.aktiv !== false);

const CELMEZOK = [
  { value: 'leiras', label: 'Leírás' }, { value: 'titkok', label: 'A DM titkai' }, { value: 'felolvasando', label: 'Felolvasandó szöveg' }
];

function Kockak({ cs }) {
  if (cs.kezi) return html`<span className="halvany kicsi">választva</span>`;
  if (!cs.kockak) return null;
  return html`<span className="mini-kockak" aria-label=${G.dobasSzoveg(cs)}>${cs.kockak.map((k, i) => html`<span key=${i}
    className=${'mini-kocka' + (cs.kocka === '3d6' && i === 2 ? ' mini-kocka--sarkany' : '')}>${k}</span>`)}</span>`;
}

// Az eredményfa sorai (újradobás, választás, elhagyás).
export function FaSor({ cs, ut, melyseg, tablak, onUjra, onValaszt, onElhagy }) {
  const [valaszt, setValaszt] = useState(false);
  const tabla = G.tablaKeres(tablak, cs.tabla);
  return html`<li className="generator__sor" style=${{ marginLeft: melyseg * 20 + 'px' }}>
    <div className="generator__fej">
      <span className="generator__tabla">${cs.nev}</span>
      <${Kockak} cs=${cs}/>
      <span className="generator__eredmeny">${cs.hiba || cs.eredmeny}${cs.en ? html` <span className="halvany">(${cs.en})</span>` : null}</span>
      <span className="gombsor gombsor--szoros generator__gombok">
        ${tabla ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => onUjra(ut)} icon=${html`<${Ikon} nev="csere" meret=${16}/>`}>Újra<//>
          <${K.Button} size="sm" variant="quiet" onClick=${() => setValaszt(!valaszt)}>Választok<//>` : null}
        ${ut.length ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => onElhagy(ut)}>Elhagy<//>` : null}
      </span>
    </div>
    ${cs.figyelmeztetes ? html`<${Uzenet} tonus="warning">${cs.figyelmeztetes}<//>` : null}
    ${cs.kikapcsoltUjra ? html`<span className="halvany kicsi">A kampányban kikapcsolt sor miatt ${cs.kikapcsoltUjra}× újradobva.</span>` : null}
    ${valaszt && tabla ? html`<div className="generator__valaszt">
      <select className="ka-field__input valaszto" aria-label=${cs.nev + ': választás'} value=${String(cs.sor)}
        onChange=${(e) => { setValaszt(false); onValaszt(ut, Number(e.target.value)); }}>
        ${G.sorLista(tabla).map((s) => html`<option key=${s.index} value=${String(s.index)}>${s.tartomany}: ${s.eredmeny}</option>`)}
      </select></div>` : null}
    ${(cs.hivasok || []).map((h, i) => html`<ul key=${i} className="generator__fa">
      ${h.darab !== 1 ? html`<li className="halvany kicsi" style=${{ marginLeft: (melyseg + 1) * 20 + 'px' }}>${h.nev}: ${
        h.darab === 'sarkany' ? 'a sárkánykocka szerint ' + h.gyerekek.length + ' dobás'
        : h.darabDobas ? h.darabDobas.forma + (h.darab_plusz ? '+' + h.darab_plusz : '') + ' = ' + (h.darabDobas.osszeg + (h.darab_plusz || 0)) + ' dobás' : h.gyerekek.length + ' dobás'}</li>` : null}
      ${h.gyerekek.map((g, j) => html`<${FaSor} key=${j} cs=${g} ut=${ut.concat([i, j])} melyseg=${melyseg + 1} tablak=${tablak}
        onUjra=${onUjra} onValaszt=${onValaszt} onElhagy=${onElhagy}/>`)}
    </ul>`)}
  </li>`;
}

// A tábla sorai: tartomány, eredmény, esély; kampányban kikapcsolható sorokkal.
function SorTabla({ tabla, kikapcsolt, onKikapcsol }) {
  const sorok = G.sorLista(tabla, kikapcsolt);
  return html`<div className="tablazat-keret"><table className="tablazat">
    <thead><tr><th>${G.KOCKAFORMAK[G.reszletek(tabla).kocka] ? G.KOCKAFORMAK[G.reszletek(tabla).kocka].nev : ''}</th><th>Eredmény</th><th>Esély</th>${onKikapcsol ? html`<th>Ebben a kampányban</th>` : null}</tr></thead>
    <tbody>${sorok.map((s) => html`<tr key=${s.index} className=${s.kikapcsolt ? 'tablazat__sor--halvany' : ''}>
      <td>${s.tartomany}</td><td>${s.eredmeny}${s.en ? html` <span className="halvany">(${s.en})</span>` : null}</td>
      <td>${String(G.sorEsely(tabla, s.index)).replace('.', ',')}%</td>
      ${onKikapcsol ? html`<td><${Jelolo} checked=${!s.kikapcsolt} onChange=${() => onKikapcsol(tabla.id, s.index)}>${s.kikapcsolt ? 'kikapcsolva' : 'használható'}<//></td>` : null}
    </tr>`)}</tbody>
  </table></div>`;
}

// A generátor: táblaválasztás, dobás, az eredményfa, a dobás menete. onElfogad esetén az eredmény egy mezőbe írható.
export function GeneratorPanel({ lapok, tablaId, kikapcsolt, onKikapcsol, onElfogad }) {
  // a választható mintalisták (kocka: lista) nem dobhatók, a választóban nem szerepelnek
  const tablak = useMemo(() => tablakBol(lapok).filter((t) => !G.listaE(t) || t.id === tablaId), [lapok, tablaId]);
  const [valasztott, setValasztott] = useState(tablaId || (tablak[0] && tablak[0].id) || '');
  const [fa, setFa] = useState(null);
  const [mezo, setMezo] = useState('leiras');
  const [sorok, setSorok] = useState(false);
  const korny = { tablak, kikapcsolt: kikapcsolt || {} };
  const tabla = G.tablaKeres(tablak, valasztott);
  if (!tablak.length) {
    return html`<p className="halvany">Még nincs dobótábla a Szabályadatbázisban. A könyvek táblái fejezetenként, a megfelelő alépésben kerülnek be
      (az üzletek, helyszínek és bűnszervezetek táblái az Import 12-ben).</p>`;
  }
  const csoportok = Array.from(new Set(tablak.map((t) => t.csoport || 'egyéb')));
  const hibak = tabla ? G.tablaHibak(tabla, tablak) : [];
  return html`<div className="verem generator">
    ${!tablaId ? html`<div className="ka-field">
      <label className="ka-field__label" htmlFor="gen-tabla">Dobótábla</label>
      <select id="gen-tabla" className="ka-field__input valaszto" value=${valasztott} onChange=${(e) => { setValasztott(e.target.value); setFa(null); }}>
        ${csoportok.map((cs) => html`<optgroup key=${cs} label=${cs}>${tablak.filter((t) => (t.csoport || 'egyéb') === cs)
          .map((t) => html`<option key=${t.id} value=${t.id}>${megjelenitettNev(t)}</option>`)}</optgroup>`)}
      </select>
    </div>` : null}
    ${tabla ? html`<p className="halvany kicsi">${[tabla.forras, tabla.oldal ? tabla.oldal + '. oldal' : '', G.KOCKAFORMAK[G.reszletek(tabla).kocka] ? G.KOCKAFORMAK[G.reszletek(tabla).kocka].nev : ''].filter(Boolean).join(' · ')}
      ${tabla.leiras_hu ? html`<br/>${tabla.leiras_hu}` : null}</p>` : null}
    ${hibak.length ? html`<${Uzenet} tonus="warning">A tábla adatai hibásak: ${hibak.join(' ')}<//>` : null}
    <div className="gombsor gombsor--szoros">
      <${K.Button} variant="primary" disabled=${!tabla} onClick=${() => setFa(G.general(valasztott, korny))} icon=${html`<${Ikon} nev="sarkanykocka" meret=${18}/>`}>${fa ? 'Új dobás' : 'Dobás'}<//>
      <${K.Button} variant="quiet" disabled=${!tabla} onClick=${() => setSorok(!sorok)}>${sorok ? 'Sorok elrejtése' : 'A tábla sorai'}<//>
    </div>
    ${sorok && tabla ? html`<${SorTabla} tabla=${tabla} kikapcsolt=${(kikapcsolt || {})[tabla.id]} onKikapcsol=${onKikapcsol}/>` : null}
    ${fa ? html`<ul className="generator__fa">
      <${FaSor} cs=${fa} ut=${[]} melyseg=${0} tablak=${tablak}
        onUjra=${(ut) => setFa(G.ujradob(fa, ut, korny))} onValaszt=${(ut, i) => setFa(G.valaszt(fa, ut, i, korny))} onElhagy=${(ut) => setFa(G.elhagy(fa, ut))}/>
    </ul>
    <details className="lenyilo"><summary>A dobás menete</summary><pre className="dobasmenet">${G.jegyzet(fa)}</pre></details>
    ${onElfogad ? html`<div className="sorban">
      <${Valaszto} label="Hova kerüljön?" value=${mezo} onChange=${setMezo} opciok=${CELMEZOK}/>
      <${K.Button} variant="primary" onClick=${() => onElfogad(G.eredmenySzoveg(fa), G.jegyzet(fa), mezo, fa.nev)}>Beírás<//>
    </div>
    <p className="halvany kicsi">Az eredmény a mező végére kerül, a dobás menete az elem dobásai közé.</p>` : null}` : null}
  </div>`;
}

export function DobotablaParbeszed({ lapok, kikapcsolt, onElfogad, onBezar }) {
  return html`<${Parbeszed} cim="Dobótábla" onBezar=${onBezar}>
    <${GeneratorPanel} lapok=${lapok} kikapcsolt=${kikapcsolt} onElfogad=${onElfogad}/>
  <//>`;
}

// Önálló oldal: a dobótáblák böngészése és dobás, kötetlenül (#/dm/dobotablak).
export function DobotablakOldal({ Oldalfej, lapok }) {
  return html`<div>
    <${Oldalfej} cim="Dobótáblák"/>
    <div className="ket-hasab">
      <${K.Panel} title="Dobás"><${GeneratorPanel} lapok=${lapok}/><//>
      <${K.Panel} title="Hogyan működik?">
        <p className="szoveg">A könyvek dobótábláit (üzlettípus, üzletrészletek, kapcsolatok, véletlen tárgyak és a többi) itt próbálhatod ki.
          Egy eredmény újabb táblát is hívhat, a darabszám lehet kocka vagy a sárkánykocka. Minden sor újradobható, vagy magad választhatsz helyette
          a táblából. Egy elem szerkesztőjében a „Dobótábla” gombbal az eredmény az elem mezőjébe kerül; kampányban a nem illő sorok kikapcsolhatók
          (a kampánykeret „Dobótáblák” részén), ilyenkor a generátor újradob.</p>
      <//>
    </div>
  </div>`;
}
