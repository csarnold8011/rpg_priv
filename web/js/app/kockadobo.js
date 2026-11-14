// Kockadobó: „Dobj” (az app gurít) vagy „Beírom” (fizikai kockával dobtál, te írod be).
// Közös komponens: a karakterkészítő minden dobása ezt használja, később a próbák is.
//   db, oldal:     a kockák száma és oldala (alapból 3d6)
//   kockak, kezi:  az utolsó rögzített dobás (megjelenítéshez), vagy null
//   onDobas(kockak, kezi): új dobás rögzítése (a hívó naplózza a karakteren)
//   felirat:       a dobógomb szövege (alapból „Dobj 3d6-tal”)
//   eredmeny:      (osszeg) => tartalom a kockák mellé, például „→ +3”
//   ujradobhato:   lehet-e új dobást kérni, ha már van eredmény (a napló mindkettőt őrzi)
import { html, K, useState, useEffect, tarOlvas, tarIr } from './kozos.js';
import { dobas, osszeg } from '../karakter/varazslo.js';

// A Dobj vagy Beírom választás eszközönként megmarad, hogy ne kelljen minden dobásnál átkapcsolni.
const MOD_KULCS = 'fage.dobasmod';
const modOlvas = () => (tarOlvas(MOD_KULCS, 'dobj') === 'beirom' ? 'beirom' : 'dobj');

export function DobasMod({ mod, setMod, kicsi }) {
  return html`<div className="kapcsolo" role="group" aria-label="Dobás módja">
    <button type="button" aria-pressed=${mod === 'dobj'} onClick=${() => setMod('dobj')}>Dobj</button>
    <button type="button" aria-pressed=${mod === 'beirom'} onClick=${() => setMod('beirom')}>Beírom</button>
  </div>`;
}

export function useDobasMod() {
  const [mod, setModAllapot] = useState(modOlvas);
  useEffect(() => {
    const fn = (e) => { if (e.detail) setModAllapot(e.detail); };
    window.addEventListener('fage-dobasmod', fn);
    return () => window.removeEventListener('fage-dobasmod', fn);
  }, []);
  const setMod = (m) => { tarIr(MOD_KULCS, m); setModAllapot(m); window.dispatchEvent(new CustomEvent('fage-dobasmod', { detail: m })); };
  return [mod, setMod];
}

export function Kockak({ kockak, nagy, friss }) {
  if (!kockak || !kockak.length) return null;
  return html`<span className=${'kockak' + (friss ? ' friss' : '')} aria-label=${'Kockák: ' + kockak.join(', ')}>
    ${kockak.map((k, i) => html`<span key=${i} className=${'kocka' + (nagy ? ' kocka--nagy' : '')}>${k}</span>`)}
  </span>`;
}

export function Kockadobo({ db = 3, oldal = 6, kockak, kezi, onDobas, felirat, eredmeny, ujradobhato = true, modValto = true, kicsi }) {
  const [mod, setMod] = useDobasMod();
  const [mezok, setMezok] = useState(() => Array(db).fill(''));
  const [hiba, setHiba] = useState(null);
  const [sorszam, setSorszam] = useState(0);
  const van = Array.isArray(kockak) && kockak.length > 0;

  const dob = () => {
    const k = dobas(db, oldal);
    setSorszam((s) => s + 1);
    onDobas(k, false);
  };
  const rogzit = () => {
    const k = mezok.map((m) => parseInt(String(m).trim(), 10));
    if (k.some((x) => !(x >= 1 && x <= oldal))) { setHiba(`Minden kockához írj be egy számot 1 és ${oldal} között.`); return; }
    setHiba(null);
    setMezok(Array(db).fill(''));
    onDobas(k, true);
  };
  const mezo = (i, v) => { const uj = mezok.slice(); uj[i] = v.replace(/[^0-9]/g, '').slice(0, 2); setMezok(uj); if (hiba) setHiba(null); };
  const kocka = db === 1 ? `1d${oldal}` : `${db}d${oldal}`;

  return html`<div className="kockadobo">
    ${van ? html`<div className="kockadobo__sor" aria-live="polite">
      <${Kockak} kockak=${kockak} nagy=${!kicsi} friss=${sorszam > 0} key=${sorszam}/>
      ${db > 1 ? html`<span className="ertek">= ${osszeg(kockak)}</span>` : null}
      ${eredmeny ? eredmeny(osszeg(kockak)) : null}
      ${kezi ? html`<span className="kezijel">beírt</span>` : null}
    </div>` : null}
    ${!van || ujradobhato ? html`<div className="kockadobo__sor">
      ${modValto ? html`<${DobasMod} mod=${mod} setMod=${setMod}/>` : null}
      ${mod === 'dobj'
        ? html`<${K.Button} variant=${van ? 'quiet' : 'primary'} size=${kicsi ? 'sm' : 'md'} onClick=${dob}>${van ? 'Újradobás' : (felirat || 'Dobj ' + kocka + '-tal')}<//>`
        : html`<span className="kockadobo__sor" role="group" aria-label=${kocka + ' beírása'}>
            ${mezok.map((m, i) => html`<input key=${i} className="kockadobo__mezo" inputMode="numeric" value=${m}
              aria-label=${db === 1 ? 'A kocka' : (i + 1) + '. kocka'} onChange=${(e) => mezo(i, e.target.value)}
              onKeyDown=${(e) => { if (e.key === 'Enter') rogzit(); }}/>`)}
            <${K.Button} size=${kicsi ? 'sm' : 'md'} onClick=${rogzit}>${van ? 'Javítás' : 'Rögzítés'}<//>
          </span>`}
    </div>` : null}
    ${hiba ? html`<p className="kockadobo__hiba" role="alert">✗ ${hiba}</p>` : null}
  </div>`;
}

// Kis tábla egy sorban (például 3d6 → kezdő érték), a dobás sorának kiemelésével.
export function RovidTabla({ cim, sorok, kiemelt }) {
  return html`<table className="tabla tabla--rovid">
    ${cim ? html`<caption className="cimke">${cim}</caption>` : null}
    <tbody><tr>${sorok.map((s) => html`<td key=${s.kulcs} className=${s.kulcs === kiemelt ? 'kiemelt' : ''}>${s.felso}<br/><strong>${s.also}</strong></td>`)}</tr></tbody>
  </table>`;
}
