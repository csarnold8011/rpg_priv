// Karakterképek: megjelenítés gyorsítótárral, feltöltés négyzetes kivágással.
// A képek a Drive-on vannak, csak az Apps Script mögül érhetők el (image.get, character.image.set).
// A böngésző IndexedDB-ben tárolja őket fájlazonosító szerint (csere után új azonosító jön),
// így egy képet csak egyszer tölt le. A listák bélyegei egy hívásban érkeznek (kötegelve).
import { html, K, useApp, useState, useEffect, useRef, Parbeszed, Uzenet } from './kozos.js';

const DB_NEV = 'fage-kepek';
const TAR = 'kepek';
const memoria = new Map(); // id → dataURL
let dbIgeret = null;

function db() {
  if (!dbIgeret) {
    dbIgeret = new Promise((teljesul) => {
      try {
        const k = indexedDB.open(DB_NEV, 1);
        k.onupgradeneeded = () => k.result.createObjectStore(TAR);
        k.onsuccess = () => teljesul(k.result);
        k.onerror = () => teljesul(null);
      } catch (e) { teljesul(null); }
    });
  }
  return dbIgeret;
}
async function tarOlvas(id) {
  const d = await db();
  if (!d) return null;
  return new Promise((teljesul) => {
    try {
      const r = d.transaction(TAR, 'readonly').objectStore(TAR).get(id);
      r.onsuccess = () => teljesul(r.result || null);
      r.onerror = () => teljesul(null);
    } catch (e) { teljesul(null); }
  });
}
async function tarIr(id, ertek) {
  const d = await db();
  if (!d) return;
  try { d.transaction(TAR, 'readwrite').objectStore(TAR).put(ertek, id); } catch (e) { /* tele a tár: csak memóriában marad */ }
}

// Kilépéskor az eszközön tárolt képek is törlődnek (közös eszközön a következő belépő ne lássa őket).
export function kepTarTorles() {
  memoria.clear();
  const torol = () => { try { indexedDB.deleteDatabase(DB_NEV); } catch (e) { /* nem baj */ } };
  if (dbIgeret) dbIgeret.then((d) => { if (d) d.close(); dbIgeret = null; torol(); });
  else torol();
}

// Kötegelt letöltés: a 40 ms-on belül kért képek egy image.get hívásban mennek.
const varo = new Map(); // id → [teljesul]
let idozito = null;
function kotegKuldes(api) {
  idozito = null;
  const idk = [...varo.keys()];
  const hivok = new Map(varo);
  varo.clear();
  for (let i = 0; i < idk.length; i += 40) {
    const resz = idk.slice(i, i + 40);
    api.hivas('image.get', { idk: resz }).then((v) => {
      resz.forEach((id) => {
        const b64 = (v.kepek || {})[id];
        const url = b64 ? 'data:image/jpeg;base64,' + b64 : null;
        if (url) { memoria.set(id, url); tarIr(id, url); }
        (hivok.get(id) || []).forEach((fn) => fn(url));
      });
    }).catch(() => resz.forEach((id) => (hivok.get(id) || []).forEach((fn) => fn(null))));
  }
}
function letoltes(api, id) {
  return new Promise((teljesul) => {
    if (!varo.has(id)) varo.set(id, []);
    varo.get(id).push(teljesul);
    if (!idozito) idozito = setTimeout(() => kotegKuldes(api), 40);
  });
}
export async function kepBetoltes(api, id) {
  if (!id) return null;
  if (memoria.has(id)) return memoria.get(id);
  const t = await tarOlvas(id);
  if (t) { memoria.set(id, t); return t; }
  return letoltes(api, id);
}
// Feltöltés után a saját képet rögtön a tárba tesszük (nem kell letölteni).
export function kepElore(id, url) { if (id && url) { memoria.set(id, url); tarIr(id, url); } }

export function useKep(id) {
  const { api } = useApp();
  const [url, setUrl] = useState(() => (id ? memoria.get(id) || null : null));
  useEffect(() => {
    let el = true;
    if (!id) { setUrl(null); return undefined; }
    if (memoria.has(id)) { setUrl(memoria.get(id)); return undefined; }
    kepBetoltes(api, id).then((u) => { if (el) setUrl(u); });
    return () => { el = false; };
  }, [id]);
  return url;
}

// A karakter képe vagy monogramos helyőrző. kep: a fájlazonosító (bélyeghez a belyeg, nagy képhez a kep).
// meret: kicsi (36 px, listák), kozep (64 px), nagy (112 px, a karakterlap fejléce).
export function KarakterKep({ kep, nev, meret = 'kicsi' }) {
  const url = useKep(kep || null);
  const betu = String(nev || '?').trim().charAt(0).toUpperCase() || '?';
  if (url) return html`<img className=${'karakterkep karakterkep--' + meret} src=${url} alt=${nev ? nev + ' képe' : 'Karakterkép'}/>`;
  return html`<span className=${'karakterkep karakterkep--' + meret + ' karakterkep--monogram'} aria-hidden="true">${betu}</span>`;
}

// ---- Feltöltés négyzetes kivágással ----
const NAGY = 768;
const BELYEG = 128;

function rajzol(kep, nezet, cel) {
  const v = document.createElement('canvas');
  v.width = cel; v.height = cel;
  const c = v.getContext('2d');
  c.imageSmoothingQuality = 'high';
  // nezet: a négyzetes kivágás a kép képpontjaiban { x, y, oldal }
  c.drawImage(kep, nezet.x, nezet.y, nezet.oldal, nezet.oldal, 0, 0, cel, cel);
  return v.toDataURL('image/jpeg', cel > 200 ? 0.85 : 0.8);
}

// Kivágás: a kép egy négyzetes ablakban, húzással mozgatható, a csúszkával nagyítható.
function Kivago({ forras, onMegse, onKesz, fut }) {
  const [kep, setKep] = useState(null);
  const [nagyitas, setNagyitas] = useState(1);
  const [eltolas, setEltolas] = useState({ x: 0, y: 0 }); // a kivágás közepe a kép közepéhez képest, 0..1 arányban
  const huzas = useRef(null);
  const ABLAK = 280;
  useEffect(() => {
    const i = new Image();
    i.onload = () => setKep(i);
    i.src = forras;
  }, [forras]);
  if (!kep) return html`<p className="sugo">A kép betöltése…</p>`;
  const kisebb = Math.min(kep.naturalWidth, kep.naturalHeight);
  const oldal = kisebb / nagyitas; // a kivágás oldala a kép képpontjaiban
  const maxX = (kep.naturalWidth - oldal) / 2;
  const maxY = (kep.naturalHeight - oldal) / 2;
  const kozep = { x: kep.naturalWidth / 2 + Math.max(-maxX, Math.min(maxX, eltolas.x)), y: kep.naturalHeight / 2 + Math.max(-maxY, Math.min(maxY, eltolas.y)) };
  const nezet = { x: kozep.x - oldal / 2, y: kozep.y - oldal / 2, oldal };
  const arany = ABLAK / oldal;
  const le = (e) => { e.currentTarget.setPointerCapture(e.pointerId); huzas.current = { x: e.clientX, y: e.clientY, e: { ...eltolas } }; };
  const mozog = (e) => {
    if (!huzas.current) return;
    const dx = (e.clientX - huzas.current.x) / arany;
    const dy = (e.clientY - huzas.current.y) / arany;
    setEltolas({ x: Math.max(-maxX, Math.min(maxX, huzas.current.e.x - dx)), y: Math.max(-maxY, Math.min(maxY, huzas.current.e.y - dy)) });
  };
  const fel = () => { huzas.current = null; };
  return html`<div className="verem">
    <div className="kivago" style=${{ width: ABLAK + 'px', height: ABLAK + 'px' }}
      onPointerDown=${le} onPointerMove=${mozog} onPointerUp=${fel} onPointerCancel=${fel}>
      <img src=${forras} alt="" draggable=${false} style=${{
        width: kep.naturalWidth * arany + 'px', height: kep.naturalHeight * arany + 'px',
        transform: `translate(${-nezet.x * arany}px, ${-nezet.y * arany}px)` }}/>
    </div>
    <label className="mezo-csuszka">Nagyítás
      <input type="range" min="1" max="4" step="0.05" value=${nagyitas} onInput=${(e) => setNagyitas(Number(e.target.value))}/>
    </label>
    <p className="sugo">Húzd a képet, hogy a fontos rész a négyzetbe kerüljön.</p>
    <div className="gombsor">
      <${K.Button} variant="quiet" onClick=${onMegse}>Mégse<//>
      <${K.Button} variant="primary" disabled=${fut} onClick=${() => onKesz(rajzol(kep, nezet, NAGY), rajzol(kep, nezet, BELYEG))}>${fut ? 'Feltöltés…' : 'Mentés'}<//>
    </div>
  </div>`;
}

// Kép feltöltése, cseréje és törlése. karakterId: a karakter, kep: az adat.alap.kep (vagy null).
// onKesz(valasz): a háttér válasza ({ verzio, modositva, kep }), a hívó ezzel frissíti a karaktert.
export function KepFeltolto({ karakterId, kep, nev, onKesz }) {
  const { api, uzen } = useApp();
  const [forras, setForras] = useState(null);
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);
  const input = useRef(null);
  const valaszt = (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { setHiba('Ez nem kép.'); return; }
    setHiba(null);
    const r = new FileReader();
    r.onload = () => setForras(r.result);
    r.readAsDataURL(f);
  };
  const kuld = async (nagy, belyeg) => {
    setFut(true);
    try {
      const v = await api.hivas('character.image.set', { id: karakterId, kep: nagy.split(',')[1], belyeg: belyeg.split(',')[1] });
      if (v.kep) { kepElore(v.kep.kep, nagy); kepElore(v.kep.belyeg, belyeg); }
      setForras(null);
      uzen('A kép elmentve.');
      if (onKesz) onKesz(v);
    } catch (e) {
      setHiba(e.kod === 'halozat' ? 'Nincs kapcsolat a szerverrel, a kép most nem tölthető fel.' : (e.message || String(e)));
    } finally { setFut(false); }
  };
  const torol = async () => {
    setFut(true);
    try {
      const v = await api.hivas('character.image.set', { id: karakterId, kep: null });
      uzen('A kép törölve.');
      if (onKesz) onKesz(v);
    } catch (e) { setHiba(e.message || String(e)); } finally { setFut(false); }
  };
  return html`<div className="kepfeltolto">
    <div className="fejsor">
      <${KarakterKep} kep=${kep && kep.kep} nev=${nev} meret="kozep"/>
      <div className="gombsor">
        <${K.Button} variant="secondary" disabled=${fut} onClick=${() => input.current && input.current.click()}>${kep ? 'Kép cseréje' : 'Kép feltöltése'}<//>
        ${kep ? html`<${K.Button} variant="quiet" disabled=${fut} onClick=${torol}>Kép törlése<//>` : null}
      </div>
    </div>
    <input ref=${input} type="file" accept="image/*" className="lathatatlan" onChange=${valaszt} aria-label="Kép kiválasztása"/>
    ${hiba ? html`<${Uzenet}>${hiba}<//>` : null}
    ${forras ? html`<${Parbeszed} cim="A kép kivágása" onBezar=${() => setForras(null)}>
      <${Kivago} forras=${forras} fut=${fut} onMegse=${() => setForras(null)} onKesz=${kuld}/>
    <//>` : null}
  </div>`;
}
