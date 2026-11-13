// A felület belépési pontja: kontextus (api, sync, szabályok, üzenetek), belépés, és a szerep
// szerinti nézet (DM: #/dm/..., játékos: #/jatekos/...).
import { html, K, AppKontextus, useState, useEffect, useCallback, useUtvonal, navigal, Uzenet, Megerosites } from './kozos.js';
import { Api } from '../api.js';
import { AppsScriptSync } from '../sync.js';
import { szabalyokBetoltese } from '../szabalyok.js';
import { Belepes } from './belepes.js';
import { DmFelulet } from './dm.js';
import { JatekosFelulet } from './jatekos.js';

// Meghívó link (index.html#kapcsolat=<cím>): beállítja a szerver címét ezen az eszközön,
// majd eltünteti a címsorból.
(function meghivo() {
  const m = location.hash.match(/kapcsolat=([^&]+)/);
  if (!m) return;
  try { localStorage.setItem('fage.api_url', JSON.stringify(decodeURIComponent(m[1]))); } catch (e) { /* privát mód */ }
  window.FAGE_API_URL = decodeURIComponent(m[1]);
  history.replaceState(null, '', location.pathname + location.search);
})();

const api = new Api();
const sync = new AppsScriptSync(api);

function App() {
  const [felhasznalo, setFelhasznalo] = useState(api.felhasznalo);
  const [uzenetek, setUzenetek] = useState([]);
  const [szabalyok, setSzabalyok] = useState({ allapot: 'nincs', adat: null, hiba: null });
  const [kilepesKerdes, setKilepesKerdes] = useState(false);
  const ut = useUtvonal();

  const uzen = useCallback((szoveg, tonus = 'success') => {
    const id = Date.now() + Math.random();
    setUzenetek((u) => u.concat([{ id, szoveg, tonus }]));
    setTimeout(() => setUzenetek((u) => u.filter((x) => x.id !== id)), tonus === 'danger' ? 7000 : 3500);
  }, []);

  // A szabályadat belépés után egyszer töltődik be (verzióváltáskor újra letölti).
  const szabalyBetoltes = useCallback(async () => {
    setSzabalyok((s) => ({ ...s, allapot: 'tolt', hiba: null }));
    try {
      const adat = await szabalyokBetoltese(api);
      setSzabalyok({ allapot: 'kesz', adat, hiba: null });
    } catch (e) {
      setSzabalyok((s) => ({ ...s, allapot: 'hiba', hiba: e }));
    }
  }, []);

  useEffect(() => {
    api.onKijelentkezes(() => { sync.disconnect(); setFelhasznalo(null); setSzabalyok({ allapot: 'nincs', adat: null, hiba: null }); navigal('/'); });
  }, []);
  useEffect(() => { if (felhasznalo) szabalyBetoltes(); }, [felhasznalo && felhasznalo.id]);

  // A szerep dönti el, melyik felület nyílik.
  const birodalom = felhasznalo ? (felhasznalo.szerep === 'dm' ? 'dm' : 'jatekos') : null;
  useEffect(() => {
    if (birodalom && ut[0] !== birodalom) navigal('/' + birodalom);
  }, [birodalom, ut[0]]);

  const kilepes = () => {
    if (sync.status().varakozo > 0) setKilepesKerdes(true);
    else api.kijelentkezes();
  };

  const kontextus = { api, sync, felhasznalo, szabalyok, szabalyBetoltes, uzen, kilepes };

  let tartalom;
  if (!felhasznalo) {
    tartalom = html`<${Belepes} onBelepett=${(v) => {
      setFelhasznalo(v.felhasznalo);
      if (v.elso_belepes) uzen('Létrejött a DM fiók. Üdv a kalandkönyvben!');
      navigal(v.felhasznalo.szerep === 'dm' ? '/dm' : '/jatekos');
    }}/>`;
  } else if (birodalom === 'dm') {
    tartalom = html`<${DmFelulet} ut=${ut[0] === 'dm' ? ut.slice(1) : []}/>`;
  } else {
    tartalom = html`<${JatekosFelulet} ut=${ut[0] === 'jatekos' ? ut.slice(1) : []}/>`;
  }

  return html`<${AppKontextus.Provider} value=${kontextus}>
    ${tartalom}
    <div className="uzenetsav" aria-live="polite">
      ${uzenetek.map((u) => html`<${Uzenet} key=${u.id} tonus=${u.tonus}>${u.szoveg}<//>`)}
    </div>
    ${kilepesKerdes ? html`<${Megerosites} cim="Kilépés" veszelyes=${true}
      szoveg=${`Még ${sync.status().varakozo} mentés vár feltöltésre, mert nincs kapcsolat a szerverrel. Ha most kilépsz, ezek elvesznek. Ha várhatsz, maradj bent, amíg a kapcsolat visszatér.`}
      gomb="Kilépés mentés nélkül" onMegse=${() => setKilepesKerdes(false)}
      onIgen=${() => { setKilepesKerdes(false); sync.elvetes(); api.kijelentkezes(); }}/>` : null}
  <//>`;
}

window.ReactDOM.createRoot(document.getElementById('app')).render(html`<${App}/>`);
