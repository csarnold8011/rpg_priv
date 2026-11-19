// NJK-tár, 5.5: a szerkesztő lépései a Kampányépítő könyv 5. fejezete (Building Characters) szerint: szerep, építési
// mód, személyiség, háttér, kapcsolatok, rejtett vonások (Companion 101–103.), a szereplő játszása, fejlődés; és az
// öröklés panelje, a „hol szerepel” lista. Tiszta függvények: web/js/kampany/szereplo.js. A szerkesztő: njk.js.
import { html, K, useApp, useState, useMemo, Ikon, Uzenet, Valaszto, Jelolo, Sugo } from './kozos.js';
import * as SZ from '../kampany/szereplo.js';
import * as KP from '../kampany/kapcsolat.js';
import * as E from '../kampany/elem.js';
import * as KR from '../kampany/keret.js';
import * as G from '../kampany/generator.js';
import { elemUt, ujAzon, useNevFeloldo } from './epito.js';
import { tablakBol } from './dobotabla.js';
import { TUL_NEV } from '../jatek/proba.js';

const HONNAN = { sablon: 'a sablonból', vilag: 'a világból', szabad: 'az alapból' };
const lista = (x) => (Array.isArray(x) ? x : []);
const sz = (v) => SZ.szereploNorm(((v && v.adat) || {}).szereplo);

// Az öröklés jele egy mező címkéje mellett: honnan jön, vagy felülírva (visszaállítással).
export function OroklesJel({ v, alap, ut, onVissza }) {
  if (!v || !v.alap_id || !alap) return null;
  const info = SZ.mezoInfo(v, ut, alap);
  if (info.sajat) {
    return html`<span className="orokles orokles--sajat">felülírva <button type="button" className="orokles__vissza"
      onClick=${onVissza} title=${'Vissza az örökölt értékre (' + HONNAN[info.honnan] + ')'}>visszaállítás</button></span>`;
  }
  return html`<span className="orokles">${HONNAN[info.honnan]}</span>`;
}

// Szöveges mező útvonallal, az öröklés jelével. p: { v, alap, setUt, visszaallit }
export function NjkMezo({ p, ut, label, multiline, rows, hint, placeholder }) {
  const ertek = SZ.ertekUt(p.v, ut);
  return html`<div className="elemmezo"><${K.TextField} label=${html`${label} <${OroklesJel} v=${p.v} alap=${p.alap} ut=${ut} onVissza=${() => p.visszaallit(ut)}/>`}
    multiline=${multiline} rows=${rows} hint=${hint} placeholder=${placeholder} value=${ertek === undefined || ertek === null ? '' : String(ertek)}
    onChange=${(e) => p.setUt(ut, e.target.value)}/></div>`;
}

function Fejlec({ lepes }) {
  const l = SZ.LEPESEK.find((x) => x.kulcs === lepes) || {};
  const forras = l.en ? ' (' + l.en + ', ' + (/^\d/.test(String(l.oldal)) ? 'Kampányépítő ' + l.oldal : l.oldal) + '. oldal)' : '';
  return html`<p className="sugo">${l.utmutato + forras}</p>`;
}

function Figyelmeztetesek({ v, lepes }) {
  const f = SZ.figyelmeztetesek(v).filter((x) => x.lepes === lepes);
  return f.map((x, i) => html`<${Uzenet} key=${i} tonus="warning">${x.szoveg}<//>`);
}

// Lista szerkesztése (objektumok, soronként néhány mezővel). mezok: [{ kulcs, nev, multiline, jelolo }]
function ListaSzerk({ p, ut, mezok, uj, gomb, ures, elotag }) {
  const l = lista(SZ.ertekUt(p.v, ut));
  const allit = (fn) => p.setUt(ut, fn(l.map((x) => ({ ...x }))));
  return html`<div className="verem">
    <div className="cimke">${gomb.cim} <${OroklesJel} v=${p.v} alap=${p.alap} ut=${ut} onVissza=${() => p.visszaallit(ut)}/></div>
    ${l.length ? html`<ul className="sorlista">${l.map((x, i) => html`<li key=${x.id || i} className="sorlista__sor sorlista__sor--teteje">
      <div className="verem" style=${{ flex: 1 }}>
        ${mezok.map((m) => (m.jelolo
          ? html`<${Jelolo} key=${m.kulcs} checked=${!!x[m.kulcs]} onChange=${(c) => allit((t) => { t[i][m.kulcs] = c; return t; })}>${m.nev}<//>`
          : html`<${K.TextField} key=${m.kulcs} label=${m.nev} multiline=${m.multiline} rows=${m.rows || 2} value=${x[m.kulcs] || ''}
              onChange=${(e) => { const y = e.target.value; allit((t) => { t[i][m.kulcs] = y; return t; }); }}/>`))}
      </div>
      <${K.Button} size="sm" variant="quiet" onClick=${() => allit((t) => t.filter((_, j) => j !== i))} aria-label="Törlés">×<//>
    </li>`)}</ul>` : html`<p className="halvany kicsi">${ures}</p>`}
    <div><${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${16}/>`}
      onClick=${() => allit((t) => t.concat([{ id: elotag + '_' + Date.now().toString(36), ...uj }]))}>${gomb.uj}<//></div>
  </div>`;
}

// ================= Szerep a történetben =================

export function SzerepLepes({ p, dm }) {
  const s = sz(p.v);
  const ut = 'adat.szereplo.szerepek';
  const valt = (k) => p.setUt(ut, s.szerepek.includes(k) ? s.szerepek.filter((x) => x !== k) : s.szerepek.concat([k]));
  return html`<div className="verem">
    <${Fejlec} lepes="szerep"/>
    <${Figyelmeztetesek} v=${p.v} lepes="szerep"/>
    <${K.Panel} title=${html`Szerepek <${OroklesJel} v=${p.v} alap=${p.alap} ut=${ut} onVissza=${() => p.visszaallit(ut)}/>`}>
      <div className="verem">
        <div className="csipek" role="group" aria-label="Szerepek">${Object.entries(SZ.SZEREPEK).map(([k, r]) => html`<button key=${k} type="button"
          className="csip" aria-pressed=${s.szerepek.includes(k)} onClick=${() => valt(k)} title=${r.rovid}>${r.nev}</button>`)}</div>
        ${s.szerepek.length ? html`<dl className="szerep-lista">${s.szerepek.map((k) => html`<div key=${k}>
          <dt><strong>${SZ.SZEREPEK[k].nev}</strong> <span className="halvany kicsi">(${SZ.SZEREPEK[k].en}, ${SZ.SZEREPEK[k].oldal}. oldal)</span></dt>
          <dd className="kicsi">${SZ.SZEREPEK[k].rovid} ${SZ.SZEREPEK[k].tanacs}</dd></div>`)}</dl>`
          : html`<p className="halvany kicsi">Válassz egy vagy több szerepet. Egy szemlélőből barát, egy megbízóból főgonosz is lehet.</p>`}
        ${s.szerepek.includes('ellenpolus') ? html`<${Valaszto} label="Kinek az ellenpólusa?" value=${s.ellenpolus_id} ures="válassz hőst…"
          onChange=${(x) => p.setUt('adat.szereplo.ellenpolus_id', x)}
          opciok=${dm.karakterek.filter((c) => c.aktiv !== false).map((c) => ({ value: c.id, label: c.nev }))}/>` : null}
        <${NjkMezo} p=${p} ut="adat.szereplo.szerep_jegyzet" label="Mire kell a történetben?" multiline=${true} rows=${3}
          hint="Elindítja a kalandot, akadályt állít, segít, vagy csak színt ad? Mi kötheti a hősökhöz?"/>
      </div>
    <//>
    <${K.Panel} title="Ahogy a hősök látják">
      <div className="verem">
        <${NjkMezo} p=${p} ut="adat.szerep.koncepcio" label="Koncepció" hint="Egy mondat: ki ő, mit csinál."/>
        <${NjkMezo} p=${p} ut="adat.szerep.megjelenes" label="Megjelenés" multiline=${true} rows=${2}/>
        <${NjkMezo} p=${p} ut="adat.szerep.nyilvanos" label="Nyilvános leírás" multiline=${true} rows=${3} hint="Ezt látják a játékosok, ha megosztod."/>
      </div>
    <//>
  </div>`;
}

// ================= Képességek: az építés módja =================

export function EpitesiModPanel({ p, fenyegetesek }) {
  const s = sz(p.v);
  const f = fenyegetesek.find((x) => x.nev === p.v.fenyegetes);
  const ut = 'adat.szereplo.epitesi_mod';
  return html`<${K.Panel} title=${html`Az építés módja <${OroklesJel} v=${p.v} alap=${p.alap} ut=${ut} onVissza=${() => p.visszaallit(ut)}/>`}>
    <div className="verem">
      <${Fejlec} lepes="kepessegek"/>
      <div className="valasztokartyak">${Object.entries(SZ.EPITESI_MODOK).map(([k, m]) => html`<button key=${k} type="button"
        className=${'valasztokartya' + (s.epitesi_mod === k ? ' valasztokartya--aktiv' : '')} aria-pressed=${s.epitesi_mod === k}
        onClick=${() => p.setUt(ut, s.epitesi_mod === k ? '' : k)}>
        <strong>${m.nev}</strong> <span className="halvany kicsi">(${m.en}, ${m.oldal}. oldal)</span><br/><span className="kicsi">${m.leiras}</span></button>`)}</div>
      ${s.epitesi_mod === 'konyv' ? html`<p className="halvany kicsi">Karakter-szintű NJK-t az „Új NJK”, „Karakterkészítővel” módja készít (játékos nélkül, a csapattal együtt léphet szintet).
        ${f ? ` ${f.nev} fenyegetéshez ${f.szint[0]}–${f.szint[1]}. szintű karakter illik (Companion 103.).` : ' A fenyegetés adja a szintet (Companion 103.).'}</p>` : null}
      ${s.epitesi_mod === 'atalakitas' ? html`<p className="halvany kicsi">Kiindulás: a Bestiárium lénye (Új NJK, „A Bestiáriumból”), egy másik NJK másolata, vagy egy rá épülő változat (az Alapadatok öröklés paneljén). A könyv tanácsa: hasonlót hasonlóért, például a kardot cseréld egy azonos sebzésű érintéses varázserőre.</p>` : null}
      ${s.epitesi_mod === 'szabad' ? html`<p className="halvany kicsi">A Fenyegetési sablon panel (statblokkos NJK-nál) a Companion 104. táblázata szerint mutatja a pontkeretet; az eltérés csak figyelmeztet.</p>` : null}
      <${NjkMezo} p=${p} ut="adat.szereplo.epites_jegyzet" label="Jegyzet az építéshez" multiline=${true} rows=${2}
        hint="Honnan indultál, mit vettél el és mit adtál hozzá, milyen egyedi képessége vagy felszerelése van."/>
      <${Figyelmeztetesek} v=${p.v} lepes="kepessegek"/>
    </div>
  <//>`;
}

// ================= Személyiség, háttér =================

function ArnyalatMezo({ p }) {
  const ut = 'adat.szereplo.arnyalatok';
  const l = sz(p.v).arnyalatok;
  const [uj, setUj] = useState('');
  const hozzaad = () => { const x = uj.trim(); if (x && !l.includes(x)) p.setUt(ut, l.concat([x])); setUj(''); };
  return html`<div className="verem">
    <div className="cimke">Jellemzők <${OroklesJel} v=${p.v} alap=${p.alap} ut=${ut} onVissza=${() => p.visszaallit(ut)}/>
      <${Sugo} cim="Jellemzők">A könyv tanácsa: a „jó” és „rossz” helyett keress árnyaltabb szavakat (jó, érdemes, komoly, szenvedélyes…), ezekből a háttér is kibomlik.<//></div>
    <div className="csipek">${l.map((x) => html`<span key=${x} className="csip csip--kicsi csip--statikus">${x}
      <button type="button" className="csip__gomb" aria-label=${x + ' törlése'} onClick=${() => p.setUt(ut, l.filter((y) => y !== x))}>×</button></span>`)}
      ${!l.length ? html`<span className="halvany kicsi">nincs</span>` : null}</div>
    <div className="sorban">
      <${K.TextField} label="Új jellemző" value=${uj} onChange=${(e) => setUj(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter') { e.preventDefault(); hozzaad(); } }}
        placeholder="például szenvedélyes"/>
      <${K.Button} disabled=${!uj.trim()} onClick=${hozzaad}>Hozzáadás<//>
    </div>
  </div>`;
}

export function SzemelyisegLepes({ p }) {
  return html`<${K.Panel} title="Személyiség">
    <div className="verem">
      <${Fejlec} lepes="szemelyiseg"/>
      <${Figyelmeztetesek} v=${p.v} lepes="szemelyiseg"/>
      <${NjkMezo} p=${p} ut="adat.szereplo.cel" label="Célja" multiline=${true} rows=${2} hint="Mit akar elérni?"/>
      <${NjkMezo} p=${p} ut="adat.szereplo.indok" label="Indítéka" multiline=${true} rows=${2}
        hint="Mi hajtja a cél felé? Nem kell jó oknak lennie, de neki legyen értelme. A hősöknek nem kell megtudniuk."/>
      <${NjkMezo} p=${p} ut="adat.szerep.motivacio" label="Vágyai és félelmei" multiline=${true} rows=${2}/>
      <${NjkMezo} p=${p} ut="adat.szereplo.vonas" label="Eltúlzott, emlékezetes vonás"
        hint="A visszatérő szereplőnek: erre fognak emlékezni (az archimágus, aki ki nem állhatja a kék színt). Csak az egész ne legyen karikatúra."/>
      <${ArnyalatMezo} p=${p}/>
      <${NjkMezo} p=${p} ut="adat.szereplo.hang" label="Hangja, beszéde" multiline=${true} rows=${2}
        hint="Egy hangszín vagy beszédmód segít neked is és a játékosoknak is (kerüld a sértő sztereotípiákat)."/>
      <${NjkMezo} p=${p} ut="adat.szereplo.hibak" label="Hibái, gyengeségei" multiline=${true} rows=${2}/>
    </div>
  <//>`;
}

export function HatterLepes({ p }) {
  return html`<${K.Panel} title="Háttér">
    <div className="verem">
      <${Fejlec} lepes="hatter"/>
      <${NjkMezo} p=${p} ut="adat.szereplo.elet" label="Mit csinált eddig az életében?" multiline=${true} rows=${4}
        hint="Az Alapkönyv hátterei jó kiindulópontok, de nyugodtan bővítsd őket."/>
      <${NjkMezo} p=${p} ut="adat.szereplo.gyerekkor" label="Gyerekkora" multiline=${true} rows=${2}/>
      <${NjkMezo} p=${p} ut="adat.szereplo.ma" label="Mit csinált aznap, amikor a hősök találkoznak vele?" multiline=${true} rows=${2}/>
      <p className="halvany kicsi">Ellenségei és szövetségesei a Kapcsolatok lépésen vehetők fel, így az ő lapjukon is látszanak.</p>
    </div>
  <//>`;
}

// ================= Kapcsolatok =================

export function KapcsolatokLepes({ p, prep, cel }) {
  const { szabalyok } = useApp();
  const nevek = useNevFeloldo(prep);
  const tablak = useMemo(() => tablakBol((szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {}), [szabalyok]);
  const vanTabla = !!G.tablaKeres(tablak, 'dt_kapcsolat');
  const [tipus, setTipus] = useState('baratja');
  const [hova, setHova] = useState('');
  const [megj, setMegj] = useState('');
  const [hiba, setHiba] = useState('');
  const [dobas, setDobas] = useState(null);
  const id = p.v.id;
  const kapcsolatok = (prep.adat && prep.adat.kapcsolatok) || [];
  const sajat = KP.elemKapcsolatai(id, kapcsolatok);
  const csoportok = KP.tipusCsoportok();
  const jeloltek = Array.from(nevek.entries()).filter(([x, m]) => x !== id && ['NJK', 'karakter', 'lény'].includes(m.fajta) || (m.elem && m.elem.tipus === 'csoport'))
    .filter(([x]) => x !== id).sort((a, b) => a[1].fajta.localeCompare(b[1].fajta, 'hu') || a[1].nev.localeCompare(b[1].nev, 'hu'));
  const fajtak = Array.from(new Set(jeloltek.map(([, m]) => m.fajta)));
  const dob = () => {
    const fa = G.general('dt_kapcsolat', { tablak });
    setDobas(fa);
    const t = SZ.kapcsolatTipusFabol(fa);
    if (t) setTipus(t);
  };
  const ment = () => {
    const k = { id: ujAzon('ln'), honnan: id, hova, tipus, megjegyzes: megj.trim(),
      vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' };
    const h = KP.ellenoriz(k, kapcsolatok);
    if (h.length) { setHiba(h[0]); return; }
    setHiba('');
    prep.kapcsolatMent(k).catch(() => {});
    setHova(''); setMegj(''); setDobas(null);
  };
  return html`<div className="verem">
    <${Fejlec} lepes="kapcsolatok"/>
    <${K.Panel} title="Kapcsolatai">
      <div className="verem">
        ${!id ? html`<p className="halvany">Előbb mentsd az NJK-t.</p>` : sajat.length ? html`<ul className="sorlista">${sajat.map((x) => {
          const m = nevek.get(x.masik);
          const href = m && m.elem ? elemUt(cel, x.masik) : m && m.ut;
          return html`<li key=${x.kapcsolat.id + x.irany} className="sorlista__sor">
            <div><span className="halvany">${x.felirat}:</span> ${href ? html`<a href=${href}>${m.nev}</a>` : html`<span>${m ? m.nev : x.masik}</span>`}
              ${m ? html` <span className="halvany kicsi">(${m.fajta})</span>` : null}
              ${x.kapcsolat.megjegyzes ? html`<div className="halvany kicsi">${x.kapcsolat.megjegyzes}</div>` : null}</div>
            <${K.Button} size="sm" variant="quiet" onClick=${() => prep.kapcsolatTorol(x.kapcsolat.id).catch(() => {})}>Törlés<//>
          </li>`;
        })}</ul>` : html`<p className="halvany kicsi">Nincs még kapcsolata. A kapcsolat mindkét fél lapján látszik.</p>`}
        <p className="halvany kicsi">A kapcsolatok ${cel.szint === 'kampany' ? 'ehhez a kampányhoz' : cel.szint === 'vilag' ? 'a világhoz' : 'a sablonokhoz'} tartoznak (a nézet a fenti választó szerint).</p>
      </div>
    <//>
    ${id ? html`<${K.Panel} title="Új kapcsolat">
      <div className="verem">
        <div className="sorban">
          <div className="ka-field" style=${{ flex: 1 }}>
            <label className="ka-field__label" htmlFor="njk-kapcs-tipus">Kapcsolat</label>
            <select id="njk-kapcs-tipus" className="ka-field__input valaszto" value=${tipus} onChange=${(e) => setTipus(e.target.value)}>
              ${Object.entries(csoportok).map(([cs, l]) => html`<optgroup key=${cs} label=${cs}>${l.map((t) => html`<option key=${t.kulcs} value=${t.kulcs}>${p.v.nev}: ${t.nev} …</option>`)}</optgroup>`)}
            </select>
          </div>
          ${vanTabla ? html`<${K.Button} variant="secondary" onClick=${dob} icon=${html`<${Ikon} nev="sarkanykocka" meret=${18}/>`}>Kapcsolattábla<//>` : null}
        </div>
        ${dobas ? html`<p className="kicsi">${(dobas.kockak || []).join(' + ')} = ${dobas.osszeg}: <strong>${dobas.eredmeny}</strong>
          ${SZ.kapcsolatTipusFabol(dobas) ? '' : html` <span className="halvany">(nincs kapcsolatuk; dobj újra, vagy válassz kézzel)</span>`}</p>` : null}
        <div className="ka-field">
          <label className="ka-field__label" htmlFor="njk-kapcs-hova">Kivel</label>
          <select id="njk-kapcs-hova" className="ka-field__input valaszto" value=${hova} onChange=${(e) => setHova(e.target.value)}>
            <option value="">Válassz…</option>
            ${fajtak.map((f) => html`<optgroup key=${f} label=${f}>${jeloltek.filter(([, m]) => m.fajta === f).slice(0, 300)
              .map(([x, m]) => html`<option key=${x} value=${x}>${m.nev}</option>`)}</optgroup>`)}
          </select>
        </div>
        <${K.TextField} label="Megjegyzés" value=${megj} onChange=${(e) => setMegj(e.target.value)} placeholder="például: tartozik neki egy szívességgel"/>
        ${hiba ? html`<${Uzenet}>${hiba}<//>` : null}
        <div><${K.Button} variant="primary" disabled=${!hova} onClick=${ment}>Kapcsolat mentése<//></div>
        <p className="halvany kicsi">A kapcsolattábla (Kampányépítő 57.) akkor való, ha már feltételezhető valamilyen kötelék, például egy nagy család tagjai között.</p>
      </div>
    <//>` : null}
    <${K.Panel} title="Jegyzetek">
      <div className="verem">
        <${NjkMezo} p=${p} ut="adat.szereplo.kapcsolat_jegyzet" label="Kötelékei" multiline=${true} rows=${3}
          hint="A Companion kapcsolatrendszere (94–95.) NJK-ra is használható: kötelék és erősség (1–3). A könyv tanácsa: csak a legfontosabb NJK-knak, vagy csak a hősökkel."/>
        <${NjkMezo} p=${p} ut="adat.szerep.kapcsolatok" label="Egyéb kapcsolatok (szöveg)" multiline=${true} rows=${2}/>
      </div>
    <//>
  </div>`;
}

// ================= Titkok és rejtett vonások =================

export function RejtettLepes({ p, lapok, setSb }) {
  const tablak = useMemo(() => tablakBol(lapok), [lapok]);
  const vanTabla = !!G.tablaKeres(tablak, 'dt_rejtett_vonas');
  const [oszlop, setOszlop] = useState('');
  const [jeloltek, setJeloltek] = useState(null);
  const ut = 'adat.szereplo.rejtett';
  const l = sz(p.v).rejtett;
  const fokuszok = (lapok['Fókuszok'] || []);
  const fokNev = (id) => { const f = fokuszok.find((x) => x.id === id); return f ? f.nev_hu : id; };
  const statFok = ((p.v.adat || {}).statblokk || {}).fokuszok || [];
  const allit = (fn) => p.setUt(ut, fn(l.map((x) => ({ ...x }))));
  const dob = () => {
    const tabla = oszlop ? { fokusz: 'dt_rv_fokusz', informacio: 'dt_rv_informacio', szerepjatek: 'dt_rv_szerepjatek' }[oszlop] : 'dt_rejtett_vonas';
    setJeloltek(SZ.rejtettFabol(G.general(tabla, { tablak })));
  };
  const felvesz = (j) => {
    allit((t) => t.concat([{ id: 'rv_' + Date.now().toString(36), oszlop: j.oszlop, nev: j.nev, leiras: j.leiras, jelek: j.jelek,
      fokusz_id: j.fokusz_jeloltek && j.fokusz_jeloltek.length === 1 ? j.fokusz_jeloltek[0] : '', fokusz_tul: j.fokusz_tul || '', fokusz_jeloltek: j.fokusz_jeloltek || [], felfedve: false }]));
    setJeloltek(null);
  };
  return html`<div className="verem">
    <${Fejlec} lepes="rejtett"/>
    <${K.Panel} title="Titkok">
      <${NjkMezo} p=${p} ut="adat.szerep.titkok" label="Titkai" multiline=${true} rows=${3} hint="Csak te látod."/>
    <//>
    <${K.Panel} title=${html`Rejtett vonások <${OroklesJel} v=${p.v} alap=${p.alap} ut=${ut} onVissza=${() => p.visszaallit(ut)}/>`}>
      <div className="verem">
        ${l.length ? html`<ul className="sorlista">${l.map((x, i) => {
          const tul = x.fokusz_tul;
          const opciok = x.oszlop === 'fokusz' ? (lista(x.fokusz_jeloltek).length ? lista(x.fokusz_jeloltek) : fokuszok.filter((f) => !tul || f.tulajdonsag === tul).map((f) => f.id)) : [];
          return html`<li key=${x.id} className="sorlista__sor sorlista__sor--teteje">
            <div className="verem" style=${{ flex: 1 }}>
              <div className="sorban">
                <span><${K.Badge} tone=${x.oszlop === 'fokusz' ? 'accent' : x.oszlop === 'szerepjatek' ? 'warning' : 'neutral'}>${SZ.REJTETT_OSZLOPOK[x.oszlop].nev}<//></span>
                <${Jelolo} checked=${x.felfedve} onChange=${(c) => allit((t) => { t[i].felfedve = c; return t; })}>kiderült<//>
              </div>
              <${K.TextField} label="Vonás" value=${x.nev} onChange=${(e) => { const y = e.target.value; allit((t) => { t[i].nev = y; return t; }); }}/>
              <${K.TextField} label="Részletek" multiline=${true} rows=${2} value=${x.leiras} onChange=${(e) => { const y = e.target.value; allit((t) => { t[i].leiras = y; return t; }); }}
                hint=${x.oszlop === 'informacio' ? 'Mit tud pontosan? Mivel lehet rávenni, hogy elmondja?' : x.oszlop === 'szerepjatek' ? 'Kihez, mihez kötődik? Hogyan lehet vele élni?' : ''}/>
              ${x.oszlop === 'informacio' ? html`<${K.TextField} label="Árulkodó jelek" value=${x.jelek} onChange=${(e) => { const y = e.target.value; allit((t) => { t[i].jelek = y; return t; }); }}
                hint="Ami sejteti a játékosokkal, hogy érdemes életben hagyni."/>` : null}
              ${x.oszlop === 'fokusz' ? html`<div className="sorban">
                <${Valaszto} label="Fókusz" value=${x.fokusz_id} ures="válassz…" onChange=${(f) => allit((t) => { t[i].fokusz_id = f; return t; })}
                  opciok=${opciok.map((f) => ({ value: f, label: fokNev(f) + (TUL_NEV[(fokuszok.find((y) => y.id === f) || {}).tulajdonsag] ? ' (' + TUL_NEV[(fokuszok.find((y) => y.id === f) || {}).tulajdonsag] + ')' : '') }))}/>
                <${K.Button} size="sm" disabled=${!x.fokusz_id || statFok.includes(x.fokusz_id)}
                  onClick=${() => setSb((s) => ({ ...s, fokuszok: (s.fokuszok || []).concat([x.fokusz_id]) }))}>${statFok.includes(x.fokusz_id) ? 'A statblokkban' : 'A statblokkba'}<//>
              </div>` : null}
            </div>
            <${K.Button} size="sm" variant="quiet" onClick=${() => allit((t) => t.filter((_, j) => j !== i))} aria-label="Törlés">×<//>
          </li>`;
        })}</ul>` : html`<p className="halvany kicsi">Nincs még rejtett vonása. Akkor is ráérsz, amikor egy játékos rákérdez.</p>`}
        <div className="gombsor gombsor--szoros">
          ${Object.entries(SZ.REJTETT_OSZLOPOK).map(([k, o]) => html`<${K.Button} key=${k} size="sm" variant="secondary"
            onClick=${() => allit((t) => t.concat([{ id: 'rv_' + Date.now().toString(36), oszlop: k, nev: '', leiras: '', jelek: '', fokusz_id: '', felfedve: false }]))}>+ ${o.nev}<//>`)}
        </div>
        ${vanTabla ? html`<div className="sorban">
          <${Valaszto} label="Dobás a Companion táblázatán (101.)" value=${oszlop} onChange=${setOszlop} ures="az oszlop is dobással"
            opciok=${Object.entries(SZ.REJTETT_OSZLOPOK).map(([k, o]) => ({ value: k, label: o.nev }))}/>
          <${K.Button} variant="secondary" onClick=${dob} icon=${html`<${Ikon} nev="sarkanykocka" meret=${18}/>`}>Dobás<//>
        </div>` : html`<p className="halvany kicsi">A rejtett vonások táblája az Import 13-mal kerül a Szabályadatbázisba.</p>`}
        ${jeloltek ? html`<div className="kiemelt-doboz verem">${jeloltek.map((j, i) => html`<div key=${i} className="sorban">
          <div style=${{ flex: 1 }}><strong>${SZ.REJTETT_OSZLOPOK[j.oszlop].nev}:</strong> ${j.nev}${j.leiras ? ': ' + j.leiras : ''}
            ${j.jelek ? html`<div className="halvany kicsi">Árulkodó jelek: ${j.jelek}</div>` : null}</div>
          <${K.Button} size="sm" variant="primary" onClick=${() => felvesz(j)}>Felveszem<//>
        </div>`)}<div><${K.Button} size="sm" variant="quiet" onClick=${dob}>Újra<//></div></div>` : null}
      </div>
    <//>
  </div>`;
}

// ================= A szereplő játszása =================

export function ParbeszedLepes({ p }) {
  const ut = 'adat.szereplo.kulcspontok';
  const l = sz(p.v).kulcspontok;
  const allit = (fn) => p.setUt(ut, fn(l.map((x) => ({ ...x }))));
  const [uj, setUj] = useState('');
  return html`<div className="verem">
    <${Fejlec} lepes="parbeszed"/>
    <${K.Panel} title=${html`Kulcspontok <${OroklesJel} v=${p.v} alap=${p.alap} ut=${ut} onVissza=${() => p.visszaallit(ut)}/>`}>
      <div className="verem">
        <p className="halvany kicsi">Amit mindenképp el kell mondania; játék közben kipipálhatod.</p>
        ${l.length ? html`<ul className="sorlista">${l.map((x, i) => html`<li key=${x.id} className="sorlista__sor">
          <${Jelolo} checked=${x.elmondva} onChange=${(c) => allit((t) => { t[i].elmondva = c; return t; })}>${x.szoveg}<//>
          <${K.Button} size="sm" variant="quiet" onClick=${() => allit((t) => t.filter((_, j) => j !== i))} aria-label="Törlés">×<//>
        </li>`)}</ul>` : null}
        <div className="sorban">
          <${K.TextField} label="Új kulcspont" value=${uj} onChange=${(e) => setUj(e.target.value)}
            onKeyDown=${(e) => { if (e.key === 'Enter' && uj.trim()) { e.preventDefault(); allit((t) => t.concat([{ id: 'kp_' + Date.now().toString(36), szoveg: uj.trim(), elmondva: false }])); setUj(''); } }}/>
          <${K.Button} disabled=${!uj.trim()} onClick=${() => { allit((t) => t.concat([{ id: 'kp_' + Date.now().toString(36), szoveg: uj.trim(), elmondva: false }])); setUj(''); }}>Hozzáadás<//>
        </div>
        ${l.some((x) => x.elmondva) ? html`<div><${K.Button} size="sm" variant="quiet" onClick=${() => allit((t) => t.map((x) => ({ ...x, elmondva: false })))}>Pipák törlése<//></div>` : null}
      </div>
    <//>
    <${K.Panel} title="Megírt szöveg">
      <div className="verem">
        <${NjkMezo} p=${p} ut="adat.szereplo.monologus" label="Amit elmond (monológ)" multiline=${true} rows=${5}
          hint="Megírva könnyebb megtalálni a hangját, és átgondolni, mi a fontos. Ha jobban megy a rögtönzés, elég a kulcspontok listája."/>
        <${ListaSzerk} p=${p} ut="adat.szereplo.kerdesek" elotag="kq" uj=${{ kerdes: '', valasz: '' }}
          mezok=${[{ kulcs: 'kerdes', nev: 'Várható kérdés' }, { kulcs: 'valasz', nev: 'Válasza', multiline: true }]}
          gomb=${{ cim: 'Kérdések és válaszok', uj: 'Új kérdés' }} ures="Nincs még előre megírt válasz."/>
      </div>
    <//>
  </div>`;
}

// ================= Fejlődés =================

export function FejlodesLepes({ p }) {
  return html`<div className="verem">
    <${Fejlec} lepes="fejlodes"/>
    <${K.Panel} title="Fejlődés">
      <div className="verem">
        <${NjkMezo} p=${p} ut="adat.szereplo.fejlodes_terv" label="Hogyan fejlődne?" multiline=${true} rows=${3}
          hint="A tervet nyugodtan írd át, ha a történet másfelé megy: az a jó, ha a játékosok döntései alakítják."/>
        <${ListaSzerk} p=${p} ut="adat.szereplo.valtozasok" elotag="vt" uj=${{ mikor: '', szoveg: '' }}
          mezok=${[{ kulcs: 'mikor', nev: 'Mikor (alkalom, esemény)' }, { kulcs: 'szoveg', nev: 'Mi változott benne', multiline: true }]}
          gomb=${{ cim: 'Változások', uj: 'Új változás' }} ures="Minden alkalom után érdemes egy sort írni: mit tett vele, amit átélt?"/>
      </div>
    <//>
  </div>`;
}

// ================= Öröklés és szint =================

// osszes: az npc.list összefoglalói; muveletek: { alapValt(id), levalaszt(), sablonKeszit(), valtozat(cel), emel(vilagId) }
export function OroklesPanel({ v, alap, osszes, vilagok, kampanyok, muveletek, valtozott, visszaallit }) {
  const ix = useMemo(() => new Map(osszes.map((x) => [x.id, x])), [osszes]);
  const szint = SZ.njkSzint(v);
  const jeloltek = SZ.alapJeloltek({ ...v, adat: v.adat }, osszes, ix);
  const felulirt = alap ? SZ.felulirasok(v, alap) : [];
  const peldanyok = v.id ? SZ.peldanyai(v.id, osszes) : [];
  const [valtozatCel, setValtozatCel] = useState('');
  const vilagNev = (id) => { const w = vilagok.find((x) => x.id === id); return w ? w.nev : id; };
  const mezoNev = (ut) => SZ.MEZO_NEVEK[ut] || ut.replace('adat.szereplo.', '').replace('adat.szerep.', '').replace(/_/g, ' ');
  return html`<${K.Panel} title="Szint és öröklés">
    <div className="verem">
      <p className="kicsi"><${K.Badge} tone=${szint === 'sablon' ? 'neutral' : szint === 'vilag' ? 'accent' : 'success'}>${SZ.SZINTEK[szint]}<//>
        ${szint === 'vilag' ? ' ' + vilagNev(v.vilag_id) + ': több kampányban is visszatérhet.' : szint === 'sablon' ? ' A Sablontárban: világtól független minta, kampányhoz nem rendelhető.' : ' Kampányokhoz rendelhető NJK.'}
        <${Sugo} cim="Szintek">A sablon világtól független minta; a világ-NJK több kampányban is visszatér; a többi NJK kampányokhoz rendelhető. Bármelyik épülhet egy másikra: ilyenkor csak az eltéréseit írod felül, a többit az alapja adja, és követi annak változásait.<//></p>
      <${Valaszto} label="Alapja (öröklés)" value=${v.alap_id || ''} ures="nincs, önálló" disabled=${valtozott && !!v.alap_id}
        onChange=${(id) => muveletek.alapValt(id)}
        opciok=${jeloltek.concat(v.alap_id && !jeloltek.some((x) => x.id === v.alap_id) && ix.get(v.alap_id) ? [ix.get(v.alap_id)] : [])
          .map((x) => ({ value: x.id, label: x.nev + ' (' + SZ.SZINTEK[SZ.njkSzint(x)].toLowerCase() + ')' }))}
        hint="Ha alapot választasz, az azonos mezők öröklődnek, az eltérők felülírásként maradnak."/>
      ${alap ? html`<div>
        <p className="kicsi">Alapja: <a href=${'#/dm/njk/' + alap.id}>${alap.nev}</a>. ${felulirt.length ? 'Felülírt mezők:' : 'Minden mezőt örököl.'}</p>
        ${felulirt.length ? html`<div className="csipek">${felulirt.map((ut) => html`<span key=${ut} className="csip csip--kicsi csip--statikus">${mezoNev(ut)}
          <button type="button" className="csip__gomb" title="Vissza az örökölt értékre" onClick=${() => visszaallit(ut)}>↺</button></span>`)}</div>` : null}
      </div>` : null}
      ${peldanyok.length ? html`<p className="kicsi">Erre épül: ${peldanyok.map((x, i) => html`${i ? ', ' : ''}<a key=${x.id} href=${'#/dm/njk/' + x.id}>${x.nev}</a>`)}.
        <span className="halvany"> Mentéskor az örökölt mezőik is frissülnek.</span></p>` : null}
      <div className="gombsor gombsor--szoros">
        ${v.alap_id ? html`<${K.Button} size="sm" disabled=${valtozott} onClick=${muveletek.levalaszt}>Leválasztás<//>` : null}
        ${szint !== 'sablon' ? html`<${K.Button} size="sm" disabled=${valtozott} onClick=${muveletek.sablonKeszit}>Sablon készítése<//>` : null}
        ${szint === 'szabad' && vilagok.length ? html`<${K.Button} size="sm" disabled=${valtozott} onClick=${() => muveletek.emel()}>Világ-NJK-vá emelés<//>` : null}
      </div>
      ${v.id ? html`<div className="sorban">
        <${Valaszto} label="Változat erre építve" value=${valtozatCel} onChange=${setValtozatCel} ures="hova?"
          opciok=${[].concat(szint !== 'szabad' ? kampanyok.filter((k) => k.allapot !== 'archivált').map((k) => ({ value: 'k:' + k.id, label: 'kampány: ' + k.cim })) : [],
            szint === 'sablon' ? vilagok.map((w) => ({ value: 'w:' + w.id, label: 'világ: ' + w.nev })) : [],
            szint === 'szabad' ? [{ value: 'k:', label: 'új, kampány nélküli NJK' }] : [])}/>
        <${K.Button} size="sm" disabled=${!valtozatCel || valtozott} onClick=${() => muveletek.valtozat(valtozatCel)}>Változat<//>
      </div>` : null}
      ${valtozott ? html`<p className="halvany kicsi">Az öröklés műveletei mentés után használhatók.</p>` : null}
    </div>
  <//>`;
}

// ================= Hol szerepel =================

export function HolSzerepel({ v, prep, cel }) {
  if (!prep.adat || !v.id) return null;
  const elemek = prep.adat.elemek.filter((e) => e.aktiv !== false).map((e) => ({ elem: e, adat: E.megjelenitett(e, prep.ix) }));
  const keret = prep.adat.keret ? KR.normalizal(prep.adat.keret.keret) : null;
  const h = SZ.hivatkozasok(v.id, elemek, keret, prep.adat.kapcsolatok || []);
  return html`<${K.Panel} title="Hol szerepel">
    ${h.length ? html`<ul className="egyszeru-lista">${h.map((x, i) => html`<li key=${i}>
      ${x.elem_id ? html`<a href=${elemUt(cel, x.elem_id)}>${x.hol}</a>` : cel.szint === 'kampany' ? html`<a href=${'#/dm/kampany/' + cel.kampany_id + '/epito/keret'}>${x.hol}</a>` : x.hol}
      <span className="halvany"> (${E.ELEMTIPUSOK[x.tipus] ? E.ELEMTIPUSOK[x.tipus].nev.toLowerCase() : 'kampánykeret'}): ${x.szoveg}</span></li>`)}</ul>`
      : html`<p className="halvany kicsi">Ebben a nézetben egy helyszín, kaland, jelenet vagy a kampánykeret sem hivatkozik rá.</p>`}
  <//>`;
}
