// Kampányjátszó 6.2: kiosztható anyagok (levél, irat, nyom, kép, képrészlet, részlet), alanyok, megmutatás.
// A DM az előkészítő elemen készíti elő az anyagot (AnyagokPanel, az elem adat.anyagok listája), vagy játék közben
// a kampány nézetéből ír újat (KampanyAnyagokPanel). Kiosztáskor pillanatkép megy a háttérnek (share.send): a szöveg és
// a böngészőben kivágott, átméretezett kép másolata (share.image.add, a Drive „Kiosztások” mappájába); a teljes kép soha
// nem jut el a játékoshoz. A játékos a kampánynézet Anyagok fülén látja (JatekosAnyagok), a megmutatott anyag felugrik
// (MegmutatasFigyelo), a DM laptopján pedig kivetítő mód nyílik (Kivetito).
import { html, K, useApp, useState, useEffect, useRef, useMemo, Ikon, Parbeszed, Uzenet, Valaszto, Jelolo, Megerosites, idopont, tarOlvas, tarIr, gyorsKulcs } from './kozos.js';
import { useKep, kepBetoltes, kepElore } from './kepek.js';
import * as A from '../kampany/anyag.js';
import * as E from '../kampany/elem.js';
import { OroklesJel } from './epito.js';

const NAGY = 1600;      // egész kép másolata
const RESZLET = 768;    // kivágott részlet
const BELYEG = 320;

// ---------------- Képek a böngészőben ----------------

function urlbolKep(url) {
  return new Promise((teljesul, elutasit) => {
    const i = new Image();
    i.onload = () => teljesul(i);
    i.onerror = () => elutasit(new Error('A kép nem olvasható.'));
    i.src = url;
  });
}
function fajlbolUrl(f) {
  return new Promise((teljesul, elutasit) => {
    const r = new FileReader();
    r.onload = () => teljesul(r.result);
    r.onerror = () => elutasit(new Error('A fájl nem olvasható.'));
    r.readAsDataURL(f);
  });
}
// A kép (vagy a kivágott része) JPEG-ként, a hosszabb oldal legfeljebb max.
function rajzol(kep, vagas, max, minoseg) {
  const p = A.vagasPixel(vagas, kep.naturalWidth, kep.naturalHeight, max);
  const v = document.createElement('canvas');
  v.width = p.szel; v.height = p.mag;
  const c = v.getContext('2d');
  c.imageSmoothingQuality = 'high';
  c.fillStyle = '#fff';
  c.fillRect(0, 0, p.szel, p.mag);
  c.drawImage(kep, p.sx, p.sy, p.sw, p.sh, 0, 0, p.szel, p.mag);
  return { url: v.toDataURL('image/jpeg', minoseg), szel: p.szel, mag: p.mag };
}

// Helyben választott (még fel nem töltött) képek: a vázlatban „helyi_…” azonosítóval, az adat itt.
const helyiKepek = new Map();
const helyiE = (id) => String(id || '').startsWith('helyi_');

function useKepUrl(id) {
  const tavoli = useKep(helyiE(id) ? null : id);
  return helyiE(id) ? helyiKepek.get(id) || null : tavoli;
}

// A vázlat képeinek feldolgozása kiosztáshoz: vágás, méretezés, feltöltés. A már kiosztott másolatok (kesz) maradnak.
async function kepekFeltoltese(api, kepek, jelez) {
  const ki = [];
  for (let i = 0; i < kepek.length; i++) {
    const k = kepek[i];
    if (k.kesz) { ki.push({ kep: k.kep, belyeg: k.belyeg, szel: k.szel, mag: k.mag, cim: k.cim }); continue; }
    jelez(`Kép előkészítése (${i + 1}/${kepek.length})…`);
    const url = helyiE(k.kep) ? helyiKepek.get(k.kep) : await kepBetoltes(api, k.kep);
    if (!url) throw new Error('A kép nem tölthető be: ' + (k.cim || 'névtelen kép'));
    const kep = await urlbolKep(url);
    const nagy = rajzol(kep, k.vagas, k.vagas ? RESZLET : NAGY, 0.85);
    const kicsi = rajzol(kep, k.vagas, BELYEG, 0.8);
    jelez(`Kép feltöltése (${i + 1}/${kepek.length})…`);
    const v = await api.hivas('share.image.add', { kep: nagy.url.split(',')[1], belyeg: kicsi.url.split(',')[1] });
    kepElore(v.kep.kep, nagy.url);
    kepElore(v.kep.belyeg, kicsi.url);
    ki.push({ kep: v.kep.kep, belyeg: v.kep.belyeg, szel: nagy.szel, mag: nagy.mag, cim: k.cim });
  }
  return ki;
}

const ujAzon = () => 'm_' + Math.random().toString(36).slice(2, 12).padEnd(10, '0');

// ---------------- Megjelenítés (DM, játékos, kivetítő) ----------------

function Bekezdesek({ szoveg }) {
  const sorok = String(szoveg || '').split(/\n{2,}/);
  return sorok.map((b, i) => html`<p key=${i}>${A.szovegReszek(b).map((r, j) => (r.olvashatatlan
    ? html`<span key=${j} className="olvashatatlan" title="olvashatatlan"><span aria-hidden="true">${r.szoveg}</span><span className="lathatatlan">olvashatatlan rész</span></span>`
    : html`<span key=${j}>${r.szoveg}</span>`))}</p>`);
}

function AnyagKep({ k, vagas, nagy, onNagyit }) {
  const url = useKepUrl(nagy ? k.kep : (k.belyeg || k.kep));
  if (!url) return html`<div className="anyag__kep anyag__kep--tolt"><span className="halvany kicsi">a kép betöltése…</span></div>`;
  // előkészítésnél a kivágás még nem készült el: a kijelölt rész látszik (CSS-sel kivágva)
  if (vagas) {
    const v = A.vagasNorm(vagas);
    return html`<div className="anyag__kep anyag__kep--vagott" style=${{ aspectRatio: `${(v.w * (k.szel || 4))} / ${(v.h * (k.mag || 3))}` }}>
      <img src=${url} alt=${k.cim || 'Képrészlet'} style=${{ width: (100 / v.w) + '%', left: (-v.x / v.w * 100) + '%', top: (-v.y / v.h * 100) + '%', height: (100 / v.h) + '%' }}/>
    </div>`;
  }
  const kep = html`<img src=${url} alt=${k.cim || 'Kép'}/>`;
  return html`<figure className="anyag__kep">
    ${onNagyit ? html`<button type="button" className="anyag__kepgomb" onClick=${onNagyit} aria-label=${'Nagyítás: ' + (k.cim || 'kép')}>${kep}</button>` : kep}
    ${k.cim ? html`<figcaption className="halvany kicsi">${k.cim}</figcaption>` : null}
  </figure>`;
}

// Egy anyag tartalma. a: kiosztott sor ({ cim, adat }) vagy előkészített vázlat (anyagNorm). nagy: a teljes nézet
// (kivetítő, megnyitás), különben kártya méret.
export function AnyagNezet({ a, nagy = false }) {
  const d = a.adat ? a.adat : a;
  const fajta = A.FAJTAK[d.fajta] ? d.fajta : 'nyom';
  const [nagyitott, setNagyitott] = useState(null);
  const kepek = (d.kepek || []).map((k, i) => html`<${AnyagKep} key=${k.kep + i} k=${k} vagas=${a.adat ? null : k.vagas} nagy=${nagy}
    onNagyit=${nagy ? null : () => setNagyitott(k)}/>`);
  let tartalom;
  if (fajta === 'level') {
    const l = d.level || {};
    tartalom = html`<div data-theme="pergamen" className=${'level level--' + (l.kezires || 'gondos') + ' level--' + (l.allapot || 'ep') + (nagy ? ' level--nagy' : '')}>
      ${l.felado || l.cimzett ? html`<div className="level__fej">
        ${l.cimzett ? html`<span>${l.cimzett}</span>` : null}${l.felado ? html`<span className="level__felado">${l.felado}</span>` : null}</div>` : null}
      <div className="level__torzs"><${Bekezdesek} szoveg=${d.szoveg}/></div>
      ${l.alairas ? html`<p className="level__alairas">${l.alairas}</p>` : null}
      ${l.pecset ? html`<p className="level__pecset">Pecsét: ${l.pecset}</p>` : null}
      ${kepek.length ? html`<div className="anyag__kepek">${kepek}</div>` : null}
    </div>`;
  } else if (fajta === 'kep' || fajta === 'kepreszlet') {
    tartalom = html`<div className="anyag__kepek anyag__kepek--fo">${kepek}</div>
      ${d.szoveg ? html`<div className="anyag__szoveg"><${Bekezdesek} szoveg=${d.szoveg}/></div>` : null}`;
  } else {
    tartalom = html`<div className=${'nyomkartya' + (fajta === 'reszlet' ? ' nyomkartya--reszlet' : '')}>
      ${d.szoveg ? html`<div className="anyag__szoveg"><${Bekezdesek} szoveg=${d.szoveg}/></div>` : null}
      ${kepek.length ? html`<div className="anyag__kepek">${kepek}</div>` : null}
    </div>`;
  }
  return html`<div className=${'anyag' + (nagy ? ' anyag--nagy' : '')}>
    ${tartalom}
    ${nagyitott ? html`<${NagyKep} k=${nagyitott} onBezar=${() => setNagyitott(null)}/>` : null}
  </div>`;
}

function NagyKep({ k, onBezar }) {
  const url = useKepUrl(k.kep);
  return html`<${Parbeszed} cim=${k.cim || 'Kép'} onBezar=${onBezar}>
    ${url ? html`<img className="elemkep__nagy" src=${url} alt=${k.cim || 'Kép'}/>` : html`<p className="halvany">A kép betöltése…</p>`}
  <//>`;
}

// Teljes képernyős megnyitás (a játékos telefonján és a DM kivetítőjén).
export function AnyagMegnyito({ a, cim, alcim, onBezar, kivetito = false }) {
  const doboz = useRef(null);
  useEffect(() => {
    const billentyu = (e) => { if (e.key === 'Escape') onBezar(); };
    document.addEventListener('keydown', billentyu);
    document.body.classList.add('nincs-gorgetes');
    if (doboz.current) doboz.current.focus();
    return () => {
      document.removeEventListener('keydown', billentyu);
      document.body.classList.remove('nincs-gorgetes');
      if (kivetito && document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, []);
  const teljes = () => {
    const el = doboz.current;
    if (!el || !el.requestFullscreen) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else el.requestFullscreen().catch(() => {});
  };
  return html`<div className=${'megnyito' + (kivetito ? ' megnyito--kivetito' : '')} role="dialog" aria-modal="true" aria-label=${cim} tabIndex="-1" ref=${doboz}>
    <header className="megnyito__fej">
      <div><h2 className="megnyito__cim">${cim}</h2>${alcim ? html`<p className="halvany kicsi">${alcim}</p>` : null}</div>
      <div className="gombsor gombsor--szoros">
        ${kivetito ? html`<${K.Button} size="sm" variant="secondary" onClick=${teljes}>Teljes képernyő<//>` : null}
        <button type="button" className="ikongomb" onClick=${onBezar} aria-label="Bezárás"><${Ikon} nev="bezar"/></button>
      </div>
    </header>
    <div className="megnyito__torzs"><${AnyagNezet} a=${a} nagy=${true}/></div>
  </div>`;
}

// A DM laptopján: csak az anyag, a közös eszközös játékhoz (a játékosok neve és a DM adatai nélkül).
export function Kivetito({ a, onBezar }) {
  return html`<${AnyagMegnyito} a=${a} cim=${A.anyagCim(a)} onBezar=${onBezar} kivetito=${true}/>`;
}

// ---------------- Szerkesztő ----------------

function Kapcsolo({ ertek, opciok, onValt, cimke }) {
  return html`<div className="kapcsolo kapcsolo--teljes anyag__fajtak" role="group" aria-label=${cimke}>
    ${opciok.map((o) => html`<button key=${o.value} type="button" aria-pressed=${ertek === o.value} onClick=${() => onValt(o.value)}>${o.label}</button>`)}
  </div>`;
}

// Kivágás kijelölése: húzással téglalap a képen. vagas: { x, y, w, h } 0..1 arányban vagy null (az egész kép).
export function Vago({ url, vagas, onValt }) {
  const doboz = useRef(null);
  const [huz, setHuz] = useState(null);
  const pont = (e) => {
    const r = doboz.current.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const le = (e) => { e.preventDefault(); e.currentTarget.setPointerCapture(e.pointerId); const p = pont(e); setHuz({ a: p, b: p }); };
  const mozog = (e) => { if (huz) setHuz({ ...huz, b: pont(e) }); };
  const fel = () => {
    if (!huz) return;
    const v = A.vagasPontokbol(huz.a, huz.b);
    setHuz(null);
    if (v) onValt(v);
  };
  const lathato = huz ? A.vagasPontokbol(huz.a, huz.b) : A.vagasNorm(vagas);
  return html`<div className="verem">
    <div className="vago" ref=${doboz} onPointerDown=${le} onPointerMove=${mozog} onPointerUp=${fel} onPointerCancel=${() => setHuz(null)}>
      <img src=${url} alt="A kivágandó kép" draggable=${false}/>
      ${lathato ? html`<div className="vago__keret" style=${{ left: lathato.x * 100 + '%', top: lathato.y * 100 + '%', width: lathato.w * 100 + '%', height: lathato.h * 100 + '%' }}></div>` : null}
    </div>
    <div className="sorban sorban--kozep">
      <p className="sugo kicsi">Húzással jelöld ki a részt, amit a játékosok megkapnak. A kép többi része nem jut el hozzájuk.</p>
      ${vagas ? html`<button type="button" className="szoveggomb" onClick=${() => onValt(null)}>Kijelölés törlése</button>` : null}
    </div>
  </div>`;
}

function KepSor({ k, i, fajta, onValt, onTorol }) {
  const url = useKepUrl(k.kep);
  const [vag, setVag] = useState(fajta === 'kepreszlet' && !k.vagas && !k.kesz);
  return html`<li className="anyagkep">
    <div className="anyagkep__fej">
      <${AnyagKep} k=${k} vagas=${k.vagas}/>
      <div className="verem verem--kicsi anyagkep__adat">
        <input className="ka-field__input" value=${k.cim} aria-label="A kép felirata" placeholder="felirat (a játékos is látja)"
          onChange=${(e) => onValt({ ...k, cim: e.target.value })}/>
        <div className="sorban sorban--kozep">
          ${!k.kesz && url ? html`<button type="button" className="szoveggomb" onClick=${() => setVag(!vag)}>${vag ? 'Kivágás kész' : k.vagas ? 'Kivágás módosítása' : 'Részlet kivágása'}</button>` : null}
          ${k.kesz ? html`<span className="halvany kicsi">már kiosztott másolat</span>` : null}
          <button type="button" className="szoveggomb" onClick=${onTorol}>Eltávolítás</button>
        </div>
      </div>
    </div>
    ${vag && url ? html`<${Vago} url=${url} vagas=${k.vagas} onValt=${(v) => onValt({ ...k, vagas: v })}/>` : null}
    ${fajta === 'kepreszlet' && !k.vagas && !k.kesz && !vag ? html`<${Uzenet} tonus="warning">Jelöld ki a kivágandó részt.<//>` : null}
    ${i === undefined ? null : null}
  </li>`;
}

// Kép hozzáadása: a forrás képei közül (elem képei, NJK képe), vagy helyben (feltöltés, telefon kamerája).
function KepHozzaado({ forrasKepek, helyi, onValaszt }) {
  const input = useRef(null);
  const kamera = useRef(null);
  const [hiba, setHiba] = useState(null);
  const valaszt = async (e) => {
    const f = e.target.files && e.target.files[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { setHiba('Ez nem kép.'); return; }
    setHiba(null);
    try {
      const url = await fajlbolUrl(f);
      const kep = await urlbolKep(url);
      // a nagy fotókat már itt kisebbre vesszük (a kivágás így is éles marad)
      const kicsinyitett = Math.max(kep.naturalWidth, kep.naturalHeight) > 2400 ? rajzol(kep, null, 2400, 0.9) : { url, szel: kep.naturalWidth, mag: kep.naturalHeight };
      const id = 'helyi_' + Math.random().toString(36).slice(2, 10);
      helyiKepek.set(id, kicsinyitett.url);
      onValaszt({ kep: id, belyeg: id, cim: f.name.replace(/\.[a-z0-9]+$/i, '').slice(0, 80), szel: kicsinyitett.szel, mag: kicsinyitett.mag, vagas: null });
    } catch (err) { setHiba(err.message || String(err)); }
  };
  return html`<div className="verem verem--kicsi">
    ${forrasKepek && forrasKepek.length ? html`<div>
      <p className="cimke">Az elem képei</p>
      <ul className="anyag__forraskepek">${forrasKepek.map((k) => html`<li key=${k.kep}>
        <button type="button" className="anyag__forraskep" onClick=${() => onValaszt({ ...k, vagas: null })} aria-label=${'Kiválasztás: ' + (k.cim || 'kép')}>
          <${AnyagKep} k=${k}/></button></li>`)}</ul>
    </div>` : null}
    ${helyi ? html`<div className="gombsor gombsor--szoros">
      <${K.Button} size="sm" variant="secondary" onClick=${() => input.current && input.current.click()} icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Kép választása<//>
      <${K.Button} size="sm" variant="quiet" onClick=${() => kamera.current && kamera.current.click()}>Fotó a kamerával<//>
      <input ref=${input} type="file" accept="image/*" hidden onChange=${valaszt}/>
      <input ref=${kamera} type="file" accept="image/*" capture="environment" hidden onChange=${valaszt}/>
    </div>` : !(forrasKepek && forrasKepek.length) ? html`<p className="halvany kicsi">Az elemnek még nincs képe. A Képek panelen tölthetsz fel, utána itt választhatod ki.</p>` : null}
    ${hiba ? html`<${Uzenet}>${hiba}<//>` : null}
  </div>`;
}

// Az anyag szerkesztője (előkészítéskor és játék közben is). ertek: anyagNorm vázlat; alanyMezo: az előkészítésnél
// javasolt alany (ismert név, kategória) is szerkeszthető.
export function AnyagSzerkeszto({ ertek, onValt, forrasKepek, helyi = false, alanyMezo = false }) {
  const a = ertek;
  const f = A.FAJTAK[a.fajta];
  const set = (x) => onValt({ ...a, ...x });
  const setLevel = (x) => set({ level: { ...a.level, ...x } });
  const fajtaValt = (fajta) => {
    const uj = A.anyagNorm({ ...a, fajta });
    if (fajta !== 'level') delete uj.level;
    onValt({ ...uj, id: a.id, elozo: a.elozo });
  };
  return html`<div className="verem">
    <${Kapcsolo} cimke="Fajta" ertek=${a.fajta} onValt=${fajtaValt} opciok=${A.FAJTA_SORREND.map((v) => ({ value: v, label: A.FAJTAK[v].nev }))}/>
    <p className="sugo kicsi">${{
      level: 'Levél, irat, napló, hirdetmény: a játékos pergamenen látja, a választott kézírással.',
      nyom: 'Amit a hősök észrevettek, hallottak vagy kiderítettek, röviden.',
      kep: 'Egy kép vagy térkép egészében.',
      kepreszlet: 'Egy kép kivágott darabja: a térkép egy szelete, egy festmény sarka, egy arc. Csak a kivágás jut el a játékosokhoz.',
      reszlet: 'Egy személy, hely vagy tárgy egy darabja (egy mondat, egy kép vagy képrészlet). A játékosoknál az alanya alatt gyűlik.'
    }[a.fajta]}</p>
    <${K.TextField} label="Cím" hint="A játékos is ezt látja a listában. Üresen a fajta és a szöveg eleje." value=${a.cim} onChange=${(e) => set({ cim: e.target.value })}/>
    ${a.fajta === 'level' ? html`<div className="urlap-racs">
      <${K.TextField} label="Címzett (ahogy a levélen áll)" value=${a.level.cimzett} onChange=${(e) => setLevel({ cimzett: e.target.value })}/>
      <${K.TextField} label="Feladó (ahogy a levélen áll)" value=${a.level.felado} onChange=${(e) => setLevel({ felado: e.target.value })}/>
    </div>` : null}
    ${f.szoveg || a.fajta === 'kep' || a.fajta === 'kepreszlet' ? html`<${K.TextField} label=${f.szoveg ? 'Szöveg' : 'Kísérőszöveg (nem kötelező)'} multiline=${true} rows=${a.fajta === 'level' ? 8 : 4}
      hint=${a.fajta === 'level' ? 'Az olvashatatlan részt tedd dupla szögletes zárójelbe: [[így]]. A játékosnál elmosódik.' : 'Üres sor új bekezdést kezd.'}
      value=${a.szoveg} onChange=${(e) => set({ szoveg: e.target.value })}/>` : null}
    ${a.fajta === 'level' ? html`<div className="urlap-racs">
      <${K.TextField} label="Aláírás" value=${a.level.alairas} onChange=${(e) => setLevel({ alairas: e.target.value })}/>
      <${K.TextField} label="Pecsét leírása" placeholder="például vörös viasz, holló" value=${a.level.pecset} onChange=${(e) => setLevel({ pecset: e.target.value })}/>
      <${Valaszto} label="Kézírás" value=${a.level.kezires} onChange=${(x) => setLevel({ kezires: x })} opciok=${Object.entries(A.KEZIRASOK).map(([value, label]) => ({ value, label }))}/>
      <${Valaszto} label="Állapot" value=${a.level.allapot} onChange=${(x) => setLevel({ allapot: x })} opciok=${Object.entries(A.LEVEL_ALLAPOTOK).map(([value, label]) => ({ value, label }))}/>
    </div>` : null}
    <div className="verem verem--kicsi">
      <p className="cimke">${f.kep ? 'Kép' : 'Kép (nem kötelező)'}</p>
      ${a.kepek.length ? html`<ul className="anyagkepek">${a.kepek.map((k, i) => html`<${KepSor} key=${k.kep + '_' + i} k=${k} fajta=${a.fajta}
        onValt=${(x) => set({ kepek: a.kepek.map((y, j) => (j === i ? x : y)) })} onTorol=${() => set({ kepek: a.kepek.filter((_, j) => j !== i) })}/>`)}</ul>` : null}
      ${a.kepek.length < A.MAX_KEP && (!(a.fajta === 'kep' || a.fajta === 'kepreszlet') || !a.kepek.length) ? html`<${KepHozzaado} forrasKepek=${forrasKepek} helyi=${helyi}
        onValaszt=${(k) => set({ kepek: a.kepek.concat([k]) })}/>` : null}
    </div>
    ${alanyMezo ? html`<div className="verem verem--kicsi">
      <p className="cimke">Kiről vagy miről szól (alany, nem kötelező)</p>
      <div className="urlap-racs">
        <${K.TextField} label="Ismert név" hint="Ahogy a hősök ismerik, például „a kapucnis idegen”." value=${(a.alany && a.alany.ismert_nev) || ''}
          onChange=${(e) => set({ alany: e.target.value ? { kategoria: 'egyeb', ...(a.alany || {}), ismert_nev: e.target.value } : null })}/>
        <${Valaszto} label="Fajtája" value=${(a.alany && a.alany.kategoria) || 'egyeb'} disabled=${!a.alany}
          onChange=${(x) => set({ alany: { ...(a.alany || { ismert_nev: '' }), kategoria: x } })} opciok=${Object.entries(A.KATEGORIA_EGYES).map(([value, label]) => ({ value, label }))}/>
      </div>
    </div>` : null}
  </div>`;
}

// ---------------- Kiosztás ----------------

// Kiosztás egy kampányba: címzettek, alany, megmutatás. vazlat: az anyag; forras: { tipus, id, nev, anyag } (csak a DM
// látja); alanyJavaslat: { ismert_nev, kategoria, valodi: { tipus, id, nev } } új alanyhoz. kampanyId üresen választható.
export function KiosztasParbeszed({ vazlat, forras, alanyJavaslat, kampanyId: kezdoKampany, kampanyok, onBezar, onKesz, kezdo }) {
  const { api, uzen } = useApp();
  const [kampanyId, setKampanyId] = useState(kezdoKampany || '');
  const [allapot, setAllapot] = useState(null);
  const [hiba, setHiba] = useState(null);
  const [cimzettek, setCimzettek] = useState((kezdo && kezdo.cimzettek && kezdo.cimzettek.length) ? kezdo.cimzettek : ['mindenki']);
  const [alanyValasz, setAlanyValasz] = useState(kezdo && kezdo.alany_id ? kezdo.alany_id : alanyJavaslat ? 'uj' : '');
  const [ujAlany, setUjAlany] = useState(() => ({ ismert_nev: '', kategoria: 'egyeb', valodi: { tipus: 'szabad', id: '', nev: '' }, ...(alanyJavaslat || {}) }));
  const [megmutat, setMegmutat] = useState(false);
  const [fut, setFut] = useState(null);
  useEffect(() => {
    if (!kampanyId) { setAllapot(null); return; }
    let el = true;
    setAllapot(null);
    api.hivas('state.get', { kampany_id: kampanyId }).then((v) => { if (el) setAllapot(v); }).catch((e) => { if (el) setHiba(e.message); });
    return () => { el = false; };
  }, [kampanyId]);
  // ha már van ugyanarra az elemre vagy NJK-ra mutató alany, az a javaslat
  useEffect(() => {
    if (!allapot || !alanyJavaslat || !alanyJavaslat.valodi || !alanyJavaslat.valodi.id) return;
    const meglevo = (allapot.alanyok || []).map(A.alanyNezet).find((x) => x.valodi && x.valodi.id === alanyJavaslat.valodi.id);
    if (meglevo) setAlanyValasz(meglevo.id);
  }, [allapot]);
  const hibak = A.anyagHibak(vazlat);
  const karakterek = (allapot && allapot.karakterek) || [];
  const mindenki = cimzettek.includes('mindenki');
  const cimzettValt = (id, be) => {
    const most = cimzettek.filter((x) => x !== 'mindenki' && x !== id);
    setCimzettek(be ? most.concat([id]) : most.length ? most : ['mindenki']);
  };
  const njkk = (allapot && allapot.njkk) || [];
  const kuld = async () => {
    setHiba(null);
    try {
      if (!kampanyId) throw new Error('Válassz kampányt.');
      if (hibak.length) throw new Error(hibak.join(' '));
      if (!mindenki && !cimzettek.length) throw new Error('Válassz címzettet.');
      if (alanyValasz === 'uj' && !String(ujAlany.ismert_nev || '').trim()) throw new Error('Add meg az alany ismert nevét.');
      const kepek = await kepekFeltoltese(api, vazlat.kepek, setFut);
      let alanyId = alanyValasz && alanyValasz !== 'uj' ? alanyValasz : '';
      if (alanyValasz === 'uj') {
        setFut('Az alany létrehozása…');
        alanyId = ujAzon();
        await api.hivas('share.send', { kampany_id: kampanyId, tipus: 'alany', id: alanyId, cim: ujAlany.ismert_nev.trim(),
          adat: { kategoria: ujAlany.kategoria, valodi: ujAlany.valodi } });
      }
      setFut('Kiosztás…');
      const v = await api.hivas('share.send', { kampany_id: kampanyId, tipus: 'anyag', id: ujAzon(), cim: vazlat.cim.trim(),
        cimzettek: mindenki ? ['mindenki'] : cimzettek, alany_id: alanyId, megmutat, adat: A.kiosztasAdat(vazlat, kepek, forras) });
      uzen(megmutat ? 'Kiosztva és megmutatva.' : 'Kiosztva.');
      onKesz(v.megosztas, megmutat);
    } catch (e) {
      setHiba(e.kod === 'halozat' ? 'Nincs kapcsolat a szerverrel, most nem osztható ki.' : (e.message || String(e)));
    } finally { setFut(null); }
  };
  const alanyok = ((allapot && allapot.alanyok) || []).filter((x) => x.allapot !== 'visszavont');
  const valodiOpciok = [{ value: 'szabad', label: 'nincs kötve (szabad alany)' }]
    .concat(forras && forras.id ? [{ value: 'forras', label: 'ez az elem: ' + (forras.nev || '') }] : [])
    .concat(njkk.map((n) => ({ value: 'njk:' + n.id, label: 'NJK: ' + n.nev })));
  const valodiErtek = ujAlany.valodi.tipus === 'njk' ? 'njk:' + ujAlany.valodi.id : forras && ujAlany.valodi.id && ujAlany.valodi.id === forras.id ? 'forras' : 'szabad';
  const valodiValt = (x) => {
    if (x === 'szabad') setUjAlany({ ...ujAlany, valodi: { tipus: 'szabad', id: '', nev: '' } });
    else if (x === 'forras') setUjAlany({ ...ujAlany, valodi: { tipus: forras.tipus, id: forras.id, nev: forras.nev } });
    else {
      const n = njkk.find((y) => 'njk:' + y.id === x);
      if (n) setUjAlany({ ...ujAlany, valodi: { tipus: 'njk', id: n.id, nev: n.nev }, kategoria: 'szemely', ismert_nev: ujAlany.ismert_nev || n.nev });
    }
  };
  return html`<${Parbeszed} cim=${'Kiosztás: ' + A.anyagCim(vazlat)} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!!fut || !allapot} onClick=${kuld}>${fut || (megmutat ? 'Kiosztom és megmutatom' : 'Kiosztom')}<//>`}>
    <div className="verem">
      ${!kezdoKampany ? html`<${Valaszto} label="Kampány" value=${kampanyId} onChange=${setKampanyId} ures="Válassz…"
        opciok=${(kampanyok || []).map((k) => ({ value: k.id, label: k.cim }))}/>` : null}
      ${hibak.length ? html`<${Uzenet} tonus="warning">${hibak.join(' ')}<//>` : null}
      ${kampanyId && !allapot && !hiba ? html`<p className="halvany">A kampány betöltése…</p>` : null}
      ${allapot ? html`<fieldset className="szakasz"><legend className="cimke">Kinek</legend>
        <div className="verem verem--kicsi">
          <${Jelolo} checked=${mindenki} onChange=${(x) => setCimzettek(x ? ['mindenki'] : [])}>Mindenkinek<//>
          ${karakterek.map((c) => html`<${Jelolo} key=${c.id} checked=${!mindenki && cimzettek.includes(c.id)} onChange=${(x) => cimzettValt(c.id, x)}>${c.nev}<//>`)}
          ${!mindenki ? html`<p className="sugo kicsi">Titkos anyag: csak a kiválasztott hősök játékosa és a mesterjátékos látja.</p>` : null}
        </div>
      </fieldset>
      <fieldset className="szakasz"><legend className="cimke">Kiről vagy miről szól</legend>
        <div className="verem verem--kicsi">
          <${Valaszto} label="Alany" value=${alanyValasz} onChange=${setAlanyValasz} ures="nincs alany (csak időrendben)"
            opciok=${alanyok.map((x) => ({ value: x.id, label: A.alanyNevDm(x) })).concat([{ value: 'uj', label: '+ Új alany…' }])}/>
          ${alanyValasz === 'uj' ? html`<div className="urlap-racs">
            <${K.TextField} label="Ismert név" hint="Ahogy a hősök ismerik. Később felfedheted a valódit." value=${ujAlany.ismert_nev}
              onChange=${(e) => setUjAlany({ ...ujAlany, ismert_nev: e.target.value })}/>
            <${Valaszto} label="Fajtája" value=${ujAlany.kategoria} onChange=${(x) => setUjAlany({ ...ujAlany, kategoria: x })}
              opciok=${Object.entries(A.KATEGORIA_EGYES).map(([value, label]) => ({ value, label }))}/>
            <${Valaszto} label="Valójában (csak te látod)" value=${valodiErtek} onChange=${valodiValt} opciok=${valodiOpciok}/>
          </div>` : null}
          <p className="sugo kicsi">A játékosoknál az Ismeretek nézetben az alany alatt gyűlnek a részletek, az ismert néven.</p>
        </div>
      </fieldset>
      <${Jelolo} checked=${megmutat} onChange=${setMegmutat}>Megmutatom most (a címzettek telefonján felugrik, itt kivetítő nyílik)<//>` : null}
      <details className="anyag__elonezet"><summary>Előnézet (így látják)</summary><${AnyagNezet} a=${vazlat}/></details>
      ${hiba ? html`<${Uzenet}>${hiba}<//>` : null}
    </div>
  <//>`;
}

// ---------------- Előkészítés az elemen (Kampányépítő) ----------------

export function AnyagokPanel({ elem, ix, valt, cel }) {
  const { uzen } = useApp();
  const [szerk, setSzerk] = useState(null); // { vazlat, uj }
  const [kioszt, setKioszt] = useState(null);
  const [kivetit, setKivetit] = useState(null);
  const [torol, setTorol] = useState(null);
  const info = E.mezoErtek(elem, 'anyagok', ix);
  const lista = A.anyagokNorm(info.ertek);
  const allit = (l) => valt(E.mezoBeallit(elem, 'anyagok', l, ix));
  const forrasKepek = ((E.mezoErtek(elem, 'kepek', ix).ertek) || []).filter((k) => k && k.kep);
  const nev = E.nev(elem, ix);
  const ment = () => {
    const v = A.anyagNorm(szerk.vazlat);
    allit(szerk.uj ? lista.concat([v]) : lista.map((x) => (x.id === v.id ? v : x)));
    setSzerk(null);
  };
  const forras = (a) => ({ tipus: elem.tipus, id: elem.id, nev, anyag: a.id });
  const alanyJavaslat = (a) => (a.alany && a.alany.ismert_nev ? { ismert_nev: a.alany.ismert_nev, kategoria: a.alany.kategoria, valodi: { tipus: elem.tipus, id: elem.id, nev } }
    : a.fajta === 'reszlet' ? { ismert_nev: nev, kategoria: A.alanyKategoriaElemhez(elem.tipus), valodi: { tipus: elem.tipus, id: elem.id, nev } } : null);
  return html`<${K.Panel} title=${html`Kiosztható anyagok <${OroklesJel} info=${info} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'anyagok'))}/>`}
    actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => setSzerk({ vazlat: A.ujAnyag('nyom'), uj: true })}
      icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Anyag<//>`}>
    ${lista.length ? html`<ul className="sorlista">${lista.map((a) => {
      const hibak = A.anyagHibak(a);
      return html`<li key=${a.id} className="sorlista__sor">
        <div className="anyagsor">
          <span className="sorlista__nev">${A.anyagCim(a)}</span>
          <span className="cimkek"><${K.Badge}>${A.FAJTAK[a.fajta].nev}<//>${a.alany ? html`<span className="halvany kicsi">alany: ${a.alany.ismert_nev}</span>` : null}
            ${hibak.length ? html`<${K.Badge} tone="warning">hiányos<//>` : null}</span>
        </div>
        <div className="sorlista__muvelet">
          <${K.Button} size="sm" variant="quiet" onClick=${() => setSzerk({ vazlat: a, uj: false })}>Szerkesztés<//>
          <${K.Button} size="sm" disabled=${hibak.length > 0} onClick=${() => setKioszt(a)}>Kiosztom<//>
        </div>
      </li>`;
    })}</ul>` : html`<p className="halvany kicsi">Levél, nyom, kép vagy képrészlet, amit játék közben a játékosoknak adhatsz. Előre senki sem látja.</p>`}
    ${szerk ? html`<${Parbeszed} cim=${szerk.uj ? 'Új kiosztható anyag' : 'Anyag szerkesztése'} onBezar=${() => setSzerk(null)} lab=${html`
        ${!szerk.uj ? html`<${K.Button} variant="danger" onClick=${() => { setTorol(szerk.vazlat); setSzerk(null); }}>Törlés<//>` : null}
        <${K.Button} variant="quiet" onClick=${() => setSzerk(null)}>Mégse<//>
        <${K.Button} variant="primary" onClick=${ment}>Mentés<//>`}>
      <div className="anyag-szeles"><${AnyagSzerkeszto} ertek=${szerk.vazlat} onValt=${(v) => setSzerk({ ...szerk, vazlat: v })} forrasKepek=${forrasKepek} alanyMezo=${true}/></div>
    <//>` : null}
    ${torol ? html`<${Megerosites} cim="Az anyag törlése" gomb="Törlés" veszelyes=${true} szoveg=${'Törlöd az előkészített anyagot: ' + A.anyagCim(torol) + '. A már kiosztott példányok megmaradnak.'}
      onMegse=${() => setTorol(null)} onIgen=${() => { allit(lista.filter((x) => x.id !== torol.id)); setTorol(null); uzen('Az anyag törölve.'); }}/>` : null}
    ${kioszt ? html`<${KiosztasDm} vazlat=${kioszt} forras=${forras(kioszt)} alanyJavaslat=${alanyJavaslat(kioszt)}
      kampanyId=${cel && cel.szint === 'kampany' ? cel.kampany_id : ''} onBezar=${() => setKioszt(null)}
      onKesz=${(m, mutat) => { setKioszt(null); if (mutat) setKivetit(m); }}/>` : null}
    ${kivetit ? html`<${Kivetito} a=${kivetit} onBezar=${() => setKivetit(null)}/>` : null}
  <//>`;
}

// A kiosztás párbeszéd a DM kampánylistájával (világ- vagy sablonelemnél a kampányt is választani kell).
function KiosztasDm(props) {
  const { api } = useApp();
  const [kampanyok, setKampanyok] = useState(null);
  useEffect(() => {
    if (props.kampanyId) return;
    api.hivas('campaigns.list', {}).then((v) => setKampanyok((v.kampanyok || []).filter((k) => k.allapot !== 'archivált' && k.allapot !== 'lezárva'))).catch(() => setKampanyok([]));
  }, []);
  return html`<${KiosztasParbeszed} ...${props} kampanyok=${kampanyok || []}/>`;
}

// ---------------- A DM kampánynézete: kiosztott anyagok és alanyok ----------------

export function KampanyAnyagokPanel({ allapot, frissit, felhasznaloNev }) {
  const { api, uzen } = useApp();
  const [uj, setUj] = useState(null);       // szerkesztés alatt álló új anyag (játék közben)
  const [ujKezdo, setUjKezdo] = useState(null); // újabb változatnál az előző címzettjei és alanya
  const [kioszt, setKioszt] = useState(null);
  const [nyitott, setNyitott] = useState(null);
  const [kivetit, setKivetit] = useState(null);
  const [mind, setMind] = useState(false);
  const [alanyNyitva, setAlanyNyitva] = useState(false);
  const [fut, setFut] = useState(false);
  const kampanyId = allapot.kampany.id;
  const anyagok = A.idorendben(allapot.megosztasok);
  const ujabb = A.ujabbValtozatok(allapot.megosztasok);
  const alanyok = allapot.alanyok || [];
  const alanyIx = new Map(alanyok.map((x) => [x.id, x]));
  const latszo = mind ? anyagok : anyagok.slice(0, 8);
  const muvelet = async (adat, siker) => {
    setFut(true);
    try { const v = await api.hivas('share.update', adat); await frissit(); if (siker) uzen(siker); return v.megosztas; } catch (e) { uzen(e.message, 'danger'); return null; } finally { setFut(false); }
  };
  const megmutat = async (m) => { setKivetit(m); await muvelet({ id: m.id, megmutat: true }, 'Megmutatva a címzetteknek.'); };
  return html`<${K.Panel} title="Kiosztott anyagok" actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => { setUjKezdo(null); setUj(A.ujAnyag('nyom')); }}
      icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új anyag<//>`}>
    ${anyagok.length ? html`<ul className="sorlista">${latszo.map((m) => {
      const visszavont = A.visszavontE(m);
      const lattak = A.lattak(m, felhasznaloNev);
      const alany = m.alany_id && alanyIx.get(m.alany_id);
      return html`<li key=${m.id} className=${'sorlista__sor' + (visszavont ? ' sorlista__sor--halvany' : '')}>
        <div className="anyagsor">
          <button type="button" className="szoveggomb sorlista__nev" onClick=${() => setNyitott(m)}>${A.anyagCim(m)}</button>
          <span className="cimkek">
            <${K.Badge}>${(A.FAJTAK[m.adat && m.adat.fajta] || A.FAJTAK.nyom).nev}<//>
            ${!A.mindenkinekE(m) ? html`<${K.Badge} tone="accent">titkos<//>` : null}
            ${visszavont ? html`<${K.Badge} tone="warning">visszavonva<//>` : null}
            ${ujabb.has(m.id) ? html`<${K.Badge}>van újabb változata<//>` : null}
            ${m.adat && m.adat.elozo ? html`<${K.Badge}>újabb változat<//>` : null}
          </span>
          <span className="halvany kicsi">${idopont(m.idopont)} · ${A.cimzettSzoveg(m.cimzettek, allapot.karakterek)}${alany ? ' · ' + A.alanyNevDm(alany) : ''}${m.adat && m.adat.forras && m.adat.forras.nev ? ' · innen: ' + m.adat.forras.nev : ''}</span>
          <span className="halvany kicsi">${lattak.length ? 'Megnyitotta: ' + lattak.join(', ') : 'Még senki sem nyitotta meg.'}</span>
        </div>
        <div className="sorlista__muvelet sorlista__muvelet--tores">
          ${!visszavont ? html`<${K.Button} size="sm" disabled=${fut} onClick=${() => megmutat(m)}>Megmutatom<//>` : null}
          <${K.Button} size="sm" variant="quiet" onClick=${() => setKivetit(m)}>Kivetítés<//>
        </div>
      </li>`;
    })}</ul>` : html`<p className="halvany kicsi">Még nincs kiosztott anyag. Az előkészítő elemek „Kiosztható anyagok” paneléről, vagy itt az „Új anyag” gombbal oszthatsz ki.</p>`}
    ${anyagok.length > 8 ? html`<button type="button" className="szoveggomb" onClick=${() => setMind(!mind)}>${mind ? 'Kevesebb' : `Mind a ${anyagok.length} anyag`}</button>` : null}
    ${alanyok.length ? html`<${K.Divider} ornament=${false}/>
      <button type="button" className="szoveggomb" aria-expanded=${alanyNyitva} onClick=${() => setAlanyNyitva(!alanyNyitva)}>${alanyNyitva ? 'Alanyok elrejtése' : `Alanyok (${alanyok.length}): név, felfedés, összekapcsolás`}</button>
      ${alanyNyitva ? html`<${AlanyLista} alanyok=${alanyok} muvelet=${muvelet} fut=${fut}/>` : null}` : null}
    ${nyitott ? html`<${KiosztottAnyagAblak} m=${anyagok.find((x) => x.id === nyitott.id) || nyitott} allapot=${allapot} fut=${fut} muvelet=${muvelet}
      onBezar=${() => setNyitott(null)} onKivetit=${(m) => { setNyitott(null); setKivetit(m); }}
      onUjabb=${(m) => { setNyitott(null); setUjKezdo({ alany_id: m.alany_id || '', cimzettek: m.cimzettek }); setUj(A.kiosztottbolVazlat(m)); }}/>` : null}
    ${uj && !kioszt ? html`<${Parbeszed} cim=${uj.elozo ? 'Újabb változat' : 'Új anyag'} onBezar=${() => setUj(null)} lab=${html`
        <${K.Button} variant="quiet" onClick=${() => setUj(null)}>Mégse<//>
        <${K.Button} variant="primary" disabled=${A.anyagHibak(uj).length > 0} onClick=${() => setKioszt(uj)}>Tovább a kiosztáshoz<//>`}>
      <div className="anyag-szeles">
        ${uj.elozo ? html`<p className="sugo kicsi">Az előző példány megmarad a játékosoknál, ez „újabb változat” jellel kerül mellé (például a levél jobban olvasható másolata).</p>` : null}
        <${AnyagSzerkeszto} ertek=${uj} onValt=${setUj} helyi=${true}/>
      </div>
    <//>` : null}
    ${kioszt ? html`<${KiosztasParbeszed} vazlat=${kioszt} kampanyId=${kampanyId}
      alanyJavaslat=${null} kezdo=${ujKezdo} onBezar=${() => setKioszt(null)}
      onKesz=${(m, mutat) => { setKioszt(null); setUj(null); frissit(); if (mutat) setKivetit(m); }}/>` : null}
    ${kivetit ? html`<${Kivetito} a=${kivetit} onBezar=${() => setKivetit(null)}/>` : null}
  <//>`;
}

// Egy kiosztott anyag a DM-nek: tartalom, címzettek, látta, visszavonás, újabb változat.
function KiosztottAnyagAblak({ m, allapot, fut, muvelet, onBezar, onKivetit, onUjabb }) {
  const visszavont = A.visszavontE(m);
  const alanyok = allapot.alanyok || [];
  return html`<${Parbeszed} cim=${A.anyagCim(m)} onBezar=${onBezar} lab=${html`
    ${visszavont
      ? html`<${K.Button} variant="secondary" disabled=${fut} onClick=${() => muvelet({ id: m.id, allapot: 'aktiv' }, 'Az anyag újra látható.')}>Visszaállítás<//>`
      : html`<${K.Button} variant="quiet" disabled=${fut} onClick=${() => muvelet({ id: m.id, allapot: 'visszavont' }, 'Visszavonva: a játékosok nézetéből eltűnt.')}>Visszavonás<//>`}
    <${K.Button} variant="secondary" onClick=${() => onUjabb(m)}>Újabb változat<//>
    <${K.Button} variant="primary" onClick=${() => onKivetit(m)}>Kivetítés<//>`}>
    <div className="verem">
      <${AnyagNezet} a=${m}/>
      <${K.Divider} ornament=${false}/>
      <p className="halvany kicsi">Kiosztva: ${idopont(m.idopont)}${m.adat && m.adat.forras && m.adat.forras.nev ? ', innen: ' + m.adat.forras.nev : ''}.</p>
      <p className="kicsi">Kinek: ${A.cimzettSzoveg(m.cimzettek, allapot.karakterek)}</p>
      <${Valaszto} label="Alany" value=${m.alany_id || ''} ures="nincs alany" disabled=${fut}
        onChange=${(x) => muvelet({ id: m.id, alany_id: x }, 'Az alany módosítva.')}
        opciok=${alanyok.map((x) => ({ value: x.id, label: A.alanyNevDm(x) }))}/>
    </div>
  <//>`;
}

// Az alanyok kezelése: ismert név, fajta, felfedés, összekapcsolás.
function AlanyLista({ alanyok, muvelet, fut }) {
  const [szerk, setSzerk] = useState(null);
  return html`<ul className="sorlista">${alanyok.map((x) => {
    const n = A.alanyNezet(x);
    const cel = n.osszekapcsolva ? alanyok.find((y) => y.id === n.osszekapcsolva) : null;
    return html`<li key=${x.id} className="sorlista__sor sorlista__sor--fuggoleges">
      <div className="sorban sorban--kozep alanysor">
        <span className="sorlista__nev">${n.ismert_nev}</span>
        <span className="halvany kicsi">${A.KATEGORIA_EGYES[n.kategoria]}${n.valodi && n.valodi.nev ? ' · valójában ' + n.valodi.nev : ''}</span>
        ${n.felfedve ? html`<${K.Badge} tone="success">felfedve<//>` : null}
        ${cel ? html`<${K.Badge}>${'= ' + A.alanyNezet(cel).ismert_nev}<//>` : null}
        <button type="button" className="szoveggomb" onClick=${() => setSzerk(szerk === x.id ? null : x.id)}>${szerk === x.id ? 'Kész' : 'Módosítás'}</button>
      </div>
      ${szerk === x.id ? html`<${AlanySzerkeszto} a=${x} alanyok=${alanyok} muvelet=${muvelet} fut=${fut}/>` : null}
    </li>`;
  })}</ul>`;
}

function AlanySzerkeszto({ a, alanyok, muvelet, fut }) {
  const n = A.alanyNezet(a);
  const [nev, setNev] = useState(n.ismert_nev);
  const [valodiNev, setValodiNev] = useState((n.valodi && n.valodi.nev) || '');
  const celok = A.osszekapcsolhato(alanyok, a.id);
  return html`<div className="verem verem--kicsi alanyszerk">
    <div className="sorban">
      <${K.TextField} label="Ismert név" value=${nev} onChange=${(e) => setNev(e.target.value)}/>
      <${K.Button} size="sm" disabled=${fut || !nev.trim() || nev === n.ismert_nev} onClick=${() => muvelet({ id: a.id, cim: nev }, 'Átnevezve.')}>Átnevezés<//>
    </div>
    <div className="urlap-racs">
      <${Valaszto} label="Fajtája" value=${n.kategoria} disabled=${fut} onChange=${(x) => muvelet({ id: a.id, adat: { kategoria: x } })}
        opciok=${Object.entries(A.KATEGORIA_EGYES).map(([value, label]) => ({ value, label }))}/>
      <${Valaszto} label="Összekapcsolás (ő valójában…)" value=${n.osszekapcsolva} ures="nincs" disabled=${fut}
        onChange=${(x) => muvelet({ id: a.id, adat: { osszekapcsolva: x } }, x ? 'Összekapcsolva: a játékosoknál a két lap összeolvad.' : 'Az összekapcsolás megszűnt.')}
        opciok=${celok.map((y) => ({ value: y.id, label: A.alanyNevDm(alanyok.find((z) => z.id === y.id)) }))}/>
    </div>
    ${n.valodi && n.valodi.nev ? html`<${Jelolo} checked=${n.felfedve} onChange=${(x) => muvelet({ id: a.id, adat: { felfedve: x } }, x ? 'Felfedve: a játékosok a valódi nevet látják.' : 'A valódi név újra rejtve.')}>
      A valódi név felfedése (${n.valodi.nev})<//>` : null}
    ${!n.valodi || !n.valodi.id ? html`<div className="sorban">
      <${K.TextField} label="Valódi név (csak te látod, amíg fel nem feded)" value=${valodiNev} onChange=${(e) => setValodiNev(e.target.value)}/>
      <${K.Button} size="sm" disabled=${fut || valodiNev === ((n.valodi && n.valodi.nev) || '')}
        onClick=${() => muvelet({ id: a.id, adat: { valodi: { tipus: 'szabad', id: '', nev: valodiNev.trim() } } }, 'A valódi név elmentve.')}>Mentés<//>
    </div>` : null}
    <p className="sugo kicsi">Az összekapcsolás után a játékosoknál ennek az alanynak minden részlete a választott alany alatt látszik, a korábbi névvel együtt.</p>
  </div>`;
}

// ---------------- A játékos nézete ----------------

const FAJTA_SZURO = [{ value: '', label: 'Mind' }].concat(A.FAJTA_SORREND.map((v) => ({ value: v, label: A.FAJTAK[v].nev })));

export function useAnyagMegnyitas(allapot) {
  const { api, sync } = useApp();
  const [nyitott, setNyitott] = useState(null);
  const [latott, setLatott] = useState(() => new Set());
  const nyit = (m) => {
    setNyitott(m);
    if (!m.latta_en && !latott.has(m.id)) {
      setLatott((s) => new Set(s).add(m.id));
      api.hivas('share.seen', { id: m.id }).then(() => sync.pull().catch(() => {})).catch(() => {});
    }
  };
  const megosztasok = useMemo(() => (allapot.megosztasok || []).map((m) => (latott.has(m.id) ? { ...m, latta_en: true } : m)), [allapot, latott]);
  return { nyitott, nyit, bezar: () => setNyitott(null), megosztasok };
}

export function JatekosAnyagok({ allapot, megnyitas }) {
  const [nezet, setNezet] = useState('ido');
  const [fajta, setFajta] = useState('');
  const { megosztasok, nyit } = megnyitas;
  const lista = A.idorendben(megosztasok, fajta);
  const csoportok = A.ismeretek(megosztasok, allapot.alanyok || []);
  const ujabb = A.ujabbValtozatok(megosztasok);
  if (!A.idorendben(megosztasok).length) return html`<p className="halvany">Még nem kaptatok anyagot a DM-től. Ha levelet, nyomot vagy képet ad, itt jelenik meg.</p>`;
  return html`<div className="verem">
    <${Kapcsolo} cimke="Nézet" ertek=${nezet} onValt=${setNezet} opciok=${[{ value: 'ido', label: 'Időrendben' }, { value: 'ismeretek', label: 'Ismeretek' }]}/>
    ${nezet === 'ido' ? html`
      <${Valaszto} label="Fajta" value=${fajta} onChange=${setFajta} opciok=${FAJTA_SZURO}/>
      ${lista.length ? html`<ul className="kartyalista">${lista.map((m) => html`<li key=${m.id}><${AnyagKartya} m=${m} allapot=${allapot} ujabb=${ujabb.has(m.id)} onNyit=${() => nyit(m)}/></li>`)}</ul>`
        : html`<p className="halvany">Ilyen fajta anyag még nincs.</p>`}`
    : csoportok.length ? html`<div className="verem">${['szemely', 'hely', 'targy', 'egyeb'].map((kat) => {
        const cs = csoportok.filter((x) => x.kategoria === kat);
        if (!cs.length) return null;
        return html`<section key=${kat} className="verem verem--kicsi">
          <h3 className="alcim">${A.ALANY_KATEGORIAK[kat]}</h3>
          ${cs.map((c) => html`<${K.Panel} key=${c.alany.id} title=${c.alany.nev}>
            ${c.korabbi.length ? html`<p className="halvany kicsi">Korábban: ${c.korabbi.join(', ')}</p>` : null}
            <ul className="kartyalista">${c.anyagok.map((m) => html`<li key=${m.id}><${AnyagKartya} m=${m} allapot=${allapot} ujabb=${ujabb.has(m.id)} onNyit=${() => nyit(m)}/></li>`)}</ul>
          <//>`)}
        </section>`;
      })}</div>`
      : html`<p className="halvany">Az anyagok még senkihez és semmihez nem kötődnek. Ha a DM egy személyről, helyről vagy tárgyról ad részletet, itt gyűlik össze.</p>`}
  </div>`;
}

function AnyagKartya({ m, allapot, ujabb, onNyit }) {
  const d = m.adat || {};
  const elso = (d.kepek || [])[0];
  const uj = !m.latta_en;
  return html`<button type="button" className=${'kartya anyagkartya' + (uj ? ' anyagkartya--uj' : '')} onClick=${onNyit}>
    ${elso ? html`<${AnyagBelyeg} k=${elso}/>` : html`<span className="anyagkartya__ikon" aria-hidden="true"><${Ikon} nev=${d.fajta === 'level' ? 'tekercs' : 'konyv'} meret=${22}/></span>`}
    <span className="kartya__test">
      <span className="kartya__cim">${A.anyagCim(m)}</span>
      <span className="cimkek">
        ${uj ? html`<${K.Badge} tone="accent">új<//>` : null}
        <span className="halvany kicsi">${(A.FAJTAK[d.fajta] || A.FAJTAK.nyom).nev} · ${idopont(m.idopont)}</span>
        ${!A.mindenkinekE(m) ? html`<span className="halvany kicsi">csak: ${A.cimzettSzoveg(m.cimzettek, allapot.karakterek)}</span>` : null}
        ${d.elozo ? html`<span className="halvany kicsi">újabb változat</span>` : null}
        ${ujabb ? html`<span className="halvany kicsi">van újabb változata</span>` : null}
      </span>
      ${d.szoveg && d.fajta !== 'kep' ? html`<span className="halvany kicsi anyagkartya__elonezet">${A.elonezet(d.szoveg)}</span>` : null}
    </span>
  </button>`;
}

function AnyagBelyeg({ k }) {
  const url = useKep(k.belyeg || k.kep);
  return url ? html`<img className="anyagkartya__kep" src=${url} alt=""/>` : html`<span className="anyagkartya__kep anyagkartya__kep--ures" aria-hidden="true"></span>`;
}

// A megnyitott anyag és a felugró megmutatás (a játékos telefonján). A megmutatás eszközönként egyszer ugrik fel.
export function AnyagMegnyitoReteg({ allapot, megnyitas }) {
  const { felhasznalo } = useApp();
  const kulcs = gyorsKulcs(felhasznalo.id, 'megmutatva.' + allapot.kampany.id);
  const [mutatott, setMutatott] = useState(() => new Set(tarOlvas(kulcs, [])));
  const { nyitott, nyit, bezar, megosztasok } = megnyitas;
  const alanyok = allapot.alanyok || [];
  useEffect(() => {
    if (nyitott) return;
    const kovetkezo = A.megmutatandok(megosztasok, mutatott, Date.now())[0];
    if (!kovetkezo) return;
    const uj = new Set(mutatott).add(A.megmutatasKulcs(kovetkezo));
    setMutatott(uj);
    tarIr(kulcs, [...uj].slice(-100));
    nyit(kovetkezo);
  }, [megosztasok, nyitott]);
  if (!nyitott) return null;
  const m = megosztasok.find((x) => x.id === nyitott.id) || nyitott;
  const alany = m.alany_id ? alanyok.find((x) => x.id === A.alanyCel(alanyok, m.alany_id)) : null;
  const alcim = [alany ? A.alanyNezet(alany).nev : '', !A.mindenkinekE(m) ? 'csak: ' + A.cimzettSzoveg(m.cimzettek, allapot.karakterek) : '', idopont(m.idopont)].filter(Boolean).join(' · ');
  return html`<${AnyagMegnyito} a=${m} cim=${A.anyagCim(m)} alcim=${alcim} onBezar=${bezar}/>`;
}

export const anyagUjak = (megosztasok, felhId) => A.ujakSzama(megosztasok, felhId);
