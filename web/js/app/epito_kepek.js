// Kampányépítő: az elemek képei (5.3; közös mező minden elemen, a jelenet térképe is ez). A fájlok a Drive
// „Kampányképek” mappájába kerülnek (element.image.add), az elem adatában csak az azonosítók vannak (adat.kepek), így a
// képlista öröklődik, mint a többi mező. Megjelenítés a karakterképek gyorsítótárával (kepek.js, image.get).
import { html, K, useApp, useState, useRef, Ikon, Parbeszed, Uzenet, Jelolo } from './kozos.js';
import { useKep, kepElore } from './kepek.js';
import * as E from '../kampany/elem.js';
import * as JL from '../kampany/jelenet.js';
import { OroklesJel } from './epito.js';

const NAGY = 1600;
const BELYEG = 320;

// Átméretezés a hosszabb oldal szerint (a térkép nem vágható négyzetesre). Visszaad: { url, szel, mag }.
function meretez(kep, max, minoseg) {
  const arany = Math.min(1, max / Math.max(kep.naturalWidth, kep.naturalHeight));
  const szel = Math.max(1, Math.round(kep.naturalWidth * arany));
  const mag = Math.max(1, Math.round(kep.naturalHeight * arany));
  const v = document.createElement('canvas');
  v.width = szel; v.height = mag;
  const c = v.getContext('2d');
  c.imageSmoothingQuality = 'high';
  c.fillStyle = '#fff';
  c.fillRect(0, 0, szel, mag);
  c.drawImage(kep, 0, 0, szel, mag);
  return { url: v.toDataURL('image/jpeg', minoseg), szel, mag };
}

function fajlbolKep(f) {
  return new Promise((teljesul, elutasit) => {
    const r = new FileReader();
    r.onload = () => {
      const i = new Image();
      i.onload = () => teljesul(i);
      i.onerror = () => elutasit(new Error('A kép nem olvasható.'));
      i.src = r.result;
    };
    r.onerror = () => elutasit(new Error('A fájl nem olvasható.'));
    r.readAsDataURL(f);
  });
}

function Belyeg({ k, onClick }) {
  const url = useKep(k.belyeg || k.kep);
  return html`<button type="button" className="elemkep__belyeg" onClick=${onClick} aria-label=${'Megnyitás: ' + (k.cim || 'kép')}>
    ${url ? html`<img src=${url} alt=${k.cim || 'Kép'}/>` : html`<span className="halvany kicsi">betöltés…</span>`}
  </button>`;
}

function NagyKep({ k, onBezar }) {
  const url = useKep(k.kep);
  return html`<${Parbeszed} cim=${k.cim || (k.terkep ? 'Térkép' : 'Kép')} onBezar=${onBezar}>
    ${url ? html`<img className="elemkep__nagy" src=${url} alt=${k.cim || 'Kép'}/>` : html`<p className="halvany">A kép betöltése…</p>`}
  <//>`;
}

// elem, ix, valt: az elemszerkesztő vázlata. terkep: a feltöltött kép térképként kerül be (a jelenet 7. lépése), és
// csak a térképek látszanak. prep: a törléshez (a kép csak a mentés után kerülhet a kukába, ha már senki sem használja).
export function KepekPanel({ elem, ix, valt, prep, terkep = false, cim }) {
  const { api, uzen } = useApp();
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);
  const [nyitott, setNyitott] = useState(null);
  const input = useRef(null);
  const info = E.mezoErtek(elem, 'kepek', ix);
  const mind = JL.kepekNorm(info.ertek);
  const lathato = mind.map((k, i) => ({ k, i })).filter((x) => !terkep || x.k.terkep);
  const allit = (lista) => valt(E.mezoBeallit(elem, 'kepek', lista, ix));
  const modosit = (i, x) => allit(mind.map((k, j) => (j === i ? { ...k, ...x } : k)));

  const valaszt = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { setHiba('Ez nem kép.'); return; }
    setHiba(null);
    setFut(true);
    try {
      const kep = await fajlbolKep(f);
      const nagy = meretez(kep, NAGY, 0.85);
      const kicsi = meretez(kep, BELYEG, 0.8);
      const v = await api.hivas('element.image.add', { kep: nagy.url.split(',')[1], belyeg: kicsi.url.split(',')[1] });
      kepElore(v.kep.kep, nagy.url);
      kepElore(v.kep.belyeg, kicsi.url);
      const cimSzoveg = f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 80);
      allit(mind.concat([{ kep: v.kep.kep, belyeg: v.kep.belyeg, cim: cimSzoveg, terkep: !!terkep, szel: nagy.szel, mag: nagy.mag }]));
      uzen(terkep ? 'A térkép feltöltve.' : 'A kép feltöltve.');
    } catch (err) {
      setHiba(err.kod === 'halozat' ? 'Nincs kapcsolat a szerverrel, a kép most nem tölthető fel.' : (err.message || String(err)));
    } finally { setFut(false); }
  };

  // Törlés: az elem mentése után a fájlok a kukába kerülnek, ha már egyetlen elem sem hivatkozik rájuk
  // (például egy sablon képe a példányaiban tovább él).
  const torol = (i) => {
    const k = mind[i];
    const uj = E.mezoBeallit(elem, 'kepek', mind.filter((_, j) => j !== i), ix);
    valt(uj);
    prep.elemMent({ ...prep.elem(uj.id), ...uj, verzio: undefined })
      .then(() => api.hivas('element.image.trash', { kep: { kep: k.kep, belyeg: k.belyeg } }))
      .catch(() => {});
  };

  return html`<${K.Panel} title=${html`${cim || (terkep ? 'Térkép' : 'Képek')} <${OroklesJel} info=${info} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'kepek'))}/>`}
    actions=${html`<${K.Button} size="sm" variant="secondary" disabled=${fut} onClick=${() => input.current && input.current.click()}
      icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>${fut ? 'Feltöltés…' : terkep ? 'Térkép feltöltése' : 'Kép feltöltése'}<//>`}>
    <input ref=${input} type="file" accept="image/*" hidden onChange=${valaszt}/>
    ${lathato.length ? html`<ul className="elemkepek">${lathato.map(({ k, i }) => html`<li key=${k.kep} className="elemkep">
      <${Belyeg} k=${k} onClick=${() => setNyitott(k)}/>
      <div className="elemkep__adat">
        <input className="ka-field__input" value=${k.cim} aria-label="A kép felirata" placeholder="felirat" onChange=${(e) => modosit(i, { cim: e.target.value })}/>
        <div className="sorban sorban--kozep">
          <${Jelolo} checked=${k.terkep} onChange=${(x) => modosit(i, { terkep: x })}>térkép<//>
          <button type="button" className="szoveggomb" onClick=${() => torol(i)}>Törlés</button>
        </div>
      </div>
    </li>`)}</ul>`
      : html`<p className="halvany kicsi">${terkep ? 'Még nincs térkép. Rajzold papírra vagy egy térképrajzolóval, és töltsd fel képként (fotó is jó).'
        : 'Még nincs kép. A képek a Drive-ra kerülnek, csak a DM látja őket (a játékosoknak a 6. lépésben lehet majd megmutatni).'}</p>`}
    ${hiba ? html`<${Uzenet}>${hiba}<//>` : null}
    ${nyitott ? html`<${NagyKep} k=${nyitott} onBezar=${() => setNyitott(null)}/>` : null}
  <//>`;
}
