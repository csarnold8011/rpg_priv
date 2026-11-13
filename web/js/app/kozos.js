// Közös építőelemek: htm sablon, React horgok, útválasztás, téma, kisebb felületi elemek.
// A design system komponensei a window.Kaland névtérben vannak (web/kaland/bundle.js).
import htm from '../../vendor/htm.module.js';

const React = window.React;
export const html = htm.bind(React.createElement);
export const { useState, useEffect, useRef, useMemo, useCallback, useContext, createContext, Fragment } = React;
export const K = window.Kaland;

// ---- Alkalmazás-kontextus: api, sync, szabályok, üzenetek ----
export const AppKontextus = createContext(null);
export const useApp = () => useContext(AppKontextus);

// ---- Tárolás eszközönként (privát módban csak memóriában) ----
export function tarOlvas(kulcs, alap) {
  try { const v = localStorage.getItem(kulcs); return v === null ? alap : JSON.parse(v); } catch (e) { return alap; }
}
export function tarIr(kulcs, ertek) {
  try { localStorage.setItem(kulcs, JSON.stringify(ertek)); } catch (e) { /* nem baj */ }
}

// ---- Útválasztás (hash): #/dm/kampany/c_123 -> ['dm', 'kampany', 'c_123'] ----
function utvonalReszek() {
  const h = location.hash.replace(/^#\/?/, '');
  if (!h || h.includes('=')) return [];
  return h.split('/').filter(Boolean).map(decodeURIComponent);
}
export function useUtvonal() {
  const [ut, setUt] = useState(utvonalReszek);
  useEffect(() => {
    const fn = () => { setUt(utvonalReszek()); window.scrollTo(0, 0); };
    window.addEventListener('hashchange', fn);
    return () => window.removeEventListener('hashchange', fn);
  }, []);
  return ut;
}
export function navigal(ut) {
  const uj = '#/' + ut.replace(/^\//, '');
  if (location.hash !== uj) location.hash = uj;
}

// ---- Téma: DM birodalom (pergamen / gyertyafeny), játékos birodalom (erdo / holdfeny) ----
const TEMAK = { dm: ['pergamen', 'gyertyafeny'], jatekos: ['erdo', 'holdfeny'] };
export function temaBeallitasa(birodalom) {
  const sotet = tarOlvas('fage.sotet.' + birodalom, false);
  const tema = TEMAK[birodalom][sotet ? 1 : 0];
  document.documentElement.dataset.theme = tema;
  tarIr('fage.birodalom', birodalom);
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--surface').trim());
  return sotet;
}
export function useTema(birodalom) {
  const [sotet, setSotet] = useState(() => temaBeallitasa(birodalom));
  useEffect(() => { setSotet(temaBeallitasa(birodalom)); }, [birodalom]);
  const valt = () => {
    tarIr('fage.sotet.' + birodalom, !sotet);
    setSotet(temaBeallitasa(birodalom));
  };
  return [sotet, valt];
}

export function TemaKapcsolo({ birodalom, kicsi }) {
  const [sotet, valt] = useTema(birodalom);
  return html`<${K.Button} variant="quiet" size=${kicsi ? 'sm' : 'md'} onClick=${valt}
    icon=${html`<${Ikon} nev=${sotet ? 'nap' : 'hold'} meret=${20}/>`}>${sotet ? 'Világos téma' : 'Sötét téma'}<//>`;
}

// ---- Formázás ----
export const elojel = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
export function idopont(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const ido = d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
  const ma = new Date().toDateString() === d.toDateString();
  return ma ? ido : d.toLocaleDateString('hu-HU', { month: '2-digit', day: '2-digit' }) + ' ' + ido;
}
export const SZEREP_NEV = { dm: 'DM', jatekos: 'Játékos', mester: 'Mesterjátékos' };

// ---- Eszközön tárolt adatok (felhasználónként) ----
// A listák és a kampányállapot az eszközön is megmaradnak, így megnyitáskor azonnal látszik
// az előző állapot, a friss adat a háttérben érkezik. Kilépéskor törlődnek.
export const gyorsKulcs = (felhasznaloId, kulcs) => `fage.gy.${felhasznaloId}.${kulcs}`;
export function gyorsTorles(felhasznaloId) {
  try {
    const elotag = `fage.gy.${felhasznaloId}.`;
    Object.keys(localStorage).filter((k) => k.startsWith(elotag)).forEach((k) => localStorage.removeItem(k));
  } catch (e) { /* nem baj */ }
}

// Induló adatok egy hívással. Ha a háttér még a régi verzió (nincs init művelet),
// a korábbi külön hívásokkal kéri le, így a felület az Apps Script frissítése előtt is működik.
export async function indulasLekerese(api, dm) {
  try {
    return await api.hivas('init');
  } catch (e) {
    if (e.kod !== 'ismeretlen_muvelet') throw e;
    const [k, c, f] = await Promise.all([api.hivas('campaigns.list'), api.hivas('characters.list'),
      dm ? api.hivas('users.admin', { muvelet: 'lista' }) : Promise.resolve(null)]);
    return { kampanyok: k.kampanyok, karakterek: c.karakterek, felhasznalok: f ? f.felhasznalok : undefined };
  }
}

// ---- Lekérés horog: { adat, hiba, tolt, ujra, beallit } ----
// tarKulcs esetén az utolsó eredmény az eszközön is tárolódik, és azonnal megjelenik.
// beallit: a helyi adat módosítása (például mentés után) újabb lekérés nélkül.
export function useLekeres(fn, fuggosegek, tarKulcs) {
  const { felhasznalo } = useApp();
  const kulcs = tarKulcs && felhasznalo ? gyorsKulcs(felhasznalo.id, tarKulcs) : null;
  const [allapot, setAllapot] = useState(() => ({ adat: kulcs ? tarOlvas(kulcs, null) : null, hiba: null, tolt: true }));
  const szamlalo = useRef(0);
  const ujra = useCallback(async () => {
    const sajat = ++szamlalo.current;
    setAllapot((a) => ({ ...a, tolt: true, hiba: null }));
    try {
      const adat = await fn();
      if (sajat !== szamlalo.current) return;
      if (kulcs) tarIr(kulcs, adat);
      setAllapot({ adat, hiba: null, tolt: false });
    } catch (e) {
      if (sajat !== szamlalo.current) return;
      // törölt vagy már nem elérhető elem: a tárolt példány sem mutatható tovább
      const vegleges = e.kod === 'nem_talalhato' || e.kod === 'nincs_jogosultsag';
      if (vegleges && kulcs) { try { localStorage.removeItem(kulcs); } catch (x) { /* nem baj */ } }
      setAllapot((a) => ({ adat: vegleges ? null : a.adat, hiba: e, tolt: false }));
    }
  }, fuggosegek); // eslint-disable-line
  const beallit = useCallback((valtoztatas) => {
    setAllapot((a) => {
      const adat = typeof valtoztatas === 'function' ? valtoztatas(a.adat) : valtoztatas;
      if (kulcs) tarIr(kulcs, adat);
      return { ...a, adat };
    });
  }, [kulcs]);
  useEffect(() => { ujra(); }, [ujra]);
  return { ...allapot, ujra, beallit };
}

// Gombművelet: amíg fut, a gomb tiltott; hiba esetén üzenet.
export function useMuvelet() {
  const { uzen } = useApp();
  const [fut, setFut] = useState(false);
  const indit = async (fn, sikerSzoveg) => {
    setFut(true);
    try {
      const v = await fn();
      if (sikerSzoveg) uzen(sikerSzoveg);
      return v;
    } catch (e) {
      uzen(e.message || String(e), 'danger');
      return undefined;
    } finally {
      setFut(false);
    }
  };
  return [fut, indit];
}

// ---- Kisebb felületi elemek ----
import { Ikon } from './ikonok.js';
export { Ikon };

export function Betoltes({ szoveg = 'Betöltés…' }) {
  return html`<p className="betoltes" role="status">${szoveg}</p>`;
}

export function Uzenet({ tonus = 'danger', children }) {
  const jel = { danger: '✗', warning: '⚠', success: '✓', neutral: '' }[tonus];
  return html`<div className=${'uzenet uzenet--' + tonus} role=${tonus === 'danger' ? 'alert' : 'status'}>
    ${jel ? html`<span aria-hidden="true">${jel} </span>` : null}${children}</div>`;
}

export function HibaVagyBetoltes({ lekeres, children }) {
  if (lekeres.hiba && !lekeres.adat) return html`<${Uzenet}>${lekeres.hiba.message}<//>`;
  if (!lekeres.adat) return html`<${Betoltes}/>`;
  return children(lekeres.adat);
}

// Lenyíló lista a TextField megjelenésével.
export function Valaszto({ label, hint, value, onChange, opciok, ures, disabled, id }) {
  const azon = useMemo(() => id || 'valaszto-' + Math.random().toString(36).slice(2, 8), [id]);
  return html`<div className="ka-field">
    <label className="ka-field__label" htmlFor=${azon}>${label}</label>
    <select id=${azon} className="ka-field__input valaszto" value=${value} disabled=${disabled}
      onChange=${(e) => onChange(e.target.value)} aria-describedby=${hint ? azon + '-hint' : undefined}>
      ${ures !== undefined ? html`<option value="">${ures}</option>` : null}
      ${opciok.map((o) => html`<option key=${o.value} value=${o.value}>${o.label}</option>`)}
    </select>
    ${hint ? html`<div className="ka-field__msg" id=${azon + '-hint'}>${hint}</div>` : null}
  </div>`;
}

export function Jelolo({ checked, onChange, children }) {
  return html`<label className="jelolo">
    <input type="checkbox" checked=${checked} onChange=${(e) => onChange(e.target.checked)}/>
    <span>${children}</span>
  </label>`;
}

// Párbeszédablak (laptopon középen, telefonon alsó lap). Esc és a háttér bezárja.
export function Parbeszed({ cim, onBezar, children, lab }) {
  const doboz = useRef(null);
  useEffect(() => {
    const elozo = document.activeElement;
    const elso = doboz.current && doboz.current.querySelector('input, select, textarea, button:not(.parbeszed__bezar)');
    if (elso) elso.focus();
    const billentyu = (e) => { if (e.key === 'Escape') onBezar(); };
    document.addEventListener('keydown', billentyu);
    document.body.classList.add('nincs-gorgetes');
    return () => {
      document.removeEventListener('keydown', billentyu);
      document.body.classList.remove('nincs-gorgetes');
      if (elozo && elozo.focus) elozo.focus();
    };
  }, []);
  return html`<div className="parbeszed-hatter" onMouseDown=${(e) => { if (e.target === e.currentTarget) onBezar(); }}>
    <div className="parbeszed" role="dialog" aria-modal="true" aria-label=${cim} ref=${doboz}>
      <header className="parbeszed__fej">
        <h2 className="parbeszed__cim">${cim}</h2>
        <button type="button" className="ikongomb parbeszed__bezar" onClick=${onBezar} aria-label="Bezárás">
          <${Ikon} nev="bezar"/>
        </button>
      </header>
      <div className="parbeszed__torzs">${children}</div>
      ${lab ? html`<footer className="parbeszed__lab">${lab}</footer>` : null}
    </div>
  </div>`;
}

// Megerősítés visszafordíthatatlan vagy fontos művelet előtt.
export function Megerosites({ cim, szoveg, gomb, veszelyes, onIgen, onMegse }) {
  return html`<${Parbeszed} cim=${cim} onBezar=${onMegse} lab=${html`
      <${K.Button} variant="quiet" onClick=${onMegse}>Mégse<//>
      <${K.Button} variant=${veszelyes ? 'danger' : 'primary'} onClick=${onIgen}>${gomb}<//>`}>
    <p className="szoveg">${szoveg}</p>
  <//>`;
}

// Élő kapcsolat állapota a fejlécben.
export function SzinkronJelzo() {
  const { sync } = useApp();
  const [s, setS] = useState(sync.status());
  useEffect(() => sync.subscribe((e) => { if (e.tipus === 'statusz') setS(e.statusz); }), [sync]);
  if (!s.kampanyId && !s.varakozo) return null;
  const varo = s.varakozo ? ` · ${s.varakozo} mentés vár` : '';
  return s.online
    ? html`<span className="szinkron szinkron--jo" role="status">✓ Élő kapcsolat${varo}</span>`
    : html`<span className="szinkron szinkron--rossz" role="status">⚠ Nincs kapcsolat${varo}</span>`;
}
