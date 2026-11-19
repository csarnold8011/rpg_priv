// Kampányépítő (DM, 5.4 alépés): helyszínek a Kampányépítő könyv 4. fejezete (Building Locations) szerint, a világ
// földrajza (a helyszínek fája: régió, ország, település, hely, üzlet), és a boltgenerátor (Businesses) a kínálattal és
// az árakkal. Tiszta függvények: web/js/kampany/helyszin.js, bolt.js. Terv: claude/kampanyepito-terv.md, „4. fejezet”
// és „Boltgenerátor”.
import { html, K, useApp, useState, useMemo, useLekeres, Ikon, Uzenet, Valaszto, Jelolo, Parbeszed } from './kozos.js';
import { Csip } from './varazslo_lepesek.js';
import { FaSor, tablakBol } from './dobotabla.js';
import * as E from '../kampany/elem.js';
import * as HS from '../kampany/helyszin.js';
import * as B from '../kampany/bolt.js';
import { magikusTetelek } from './epito_jutalom.js';
import * as G from '../kampany/generator.js';
import { penzSzoveg } from '../karakter/varazslo.js';
import { SAJAT_LEPESEK, VILAG_PANELEK, ElemMezo, OroklesJel, UjElemParbeszed, elemUt, ujAzon, SzintJel } from './epito.js';

const PONT = { kesz: ['kaland__pont kaland__pont--kesz', '✓'], resz: ['kaland__pont kaland__pont--resz', '…'], ures: ['kaland__pont', ''] };
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};
const kisGomb = (felirat, cim, onClick, disabled) => html`<button type="button" className="kisgomb" aria-label=${cim} title=${cim}
  disabled=${disabled} onClick=${onClick}>${felirat}</button>`;
const mozgat = (l, i, d) => { const j = i + d; if (j < 0 || j >= l.length) return l; const m = l.slice(); [m[i], m[j]] = [m[j], m[i]]; return m; };
const szamVagyUres = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? '' : Number(v));

const keretKikapcsolt = (prep) => (prep.adat.keret && prep.adat.keret.keret && prep.adat.keret.keret.generator_kikapcsolt) || {};

function LepesPanel({ lepes, allapot, children, actions }) {
  const l = HS.HELYSZIN_LEPESEK[lepes];
  const p = PONT[allapot || 'ures'];
  return html`<${K.Panel} actions=${actions} title=${html`${allapot ? html`<span className=${p[0]} aria-label=${allapot === 'kesz' ? 'kitöltve' : allapot === 'resz' ? 'részben kitöltve' : 'üres'}>${p[1]}</span> ` : null}${l.nev} <span className="halvany keret__en">(${l.en}, ${/^\d/.test(l.oldal) ? l.oldal + '. oldal' : l.oldal})</span>`}>
    <div className="verem"><p className="sugo">${l.utmutato}</p>${children}</div>
  <//>`;
}

function MezoCimke({ elem, ix, mezo, valt, children }) {
  return html`<p className="cimke">${children} <${OroklesJel} info=${E.mezoErtek(elem, mezo, ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, mezo))}/></p>`;
}

const cimkeJellel = (elem, ix, mezo, valt, szoveg) => html`${szoveg} <${OroklesJel} info=${E.mezoErtek(elem, mezo, ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, mezo))}/>`;

// Listás mező: sorok mezőkkel, sorrend, törlés, hozzáadás.
function ListaMezo({ elem, ix, valt, mezo, norm, cim, ures, gomb, sorTartalom, uresSzoveg }) {
  const l = norm(E.mezoErtek(elem, mezo, ix).ertek);
  const allit = (x) => valt(E.mezoBeallit(elem, mezo, x, ix));
  return html`<div className="verem">
    <${MezoCimke} elem=${elem} ix=${ix} mezo=${mezo} valt=${valt}>${cim}<//>
    ${l.length ? html`<ul className="sorlista">${l.map((s, i) => html`<li key=${s.id} className="sorlista__sor sorlista__sor--fuggoleges jelenet__listasor">
      ${sorTartalom(s, (x) => allit(l.map((y, j) => (j === i ? { ...y, ...x } : y))))}
      <div className="gombsor gombsor--szoros">
        ${kisGomb('↑', 'Feljebb', () => allit(mozgat(l, i, -1)), i === 0)}
        ${kisGomb('↓', 'Lejjebb', () => allit(mozgat(l, i, 1)), i === l.length - 1)}
        <${K.Button} size="sm" variant="quiet" onClick=${() => allit(l.filter((_, j) => j !== i))}>Törlés<//>
      </div>
    </li>`)}</ul>` : uresSzoveg ? html`<p className="halvany kicsi">${uresSzoveg}</p>` : null}
    <div><${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
      onClick=${() => allit(l.concat([{ ...ures(), id: ujAzon(mezo.slice(0, 2)) }]))}>${gomb}<//></div>
  </div>`;
}

const Figyelmeztetesek = ({ lista, lepes }) => lista.filter((f) => f.lepes === lepes).map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f.szoveg}<//>`);

// ================= Új helyszín a fajtájával =================

export function UjHelyszinParbeszed({ prep, cel, szulo, fajta: kezdo, onBezar, maradj }) {
  const [fajta, setFajta] = useState(kezdo || 'hely');
  return html`<${UjElemParbeszed} prep=${prep} cel=${cel} szulo=${szulo} tipusok=${['helyszin']} onBezar=${onBezar} maradj=${maradj}
    cim=${'Új ' + HS.FAJTAK[fajta].nev.toLowerCase() + (szulo ? ': ' + E.nev(szulo, prep.ix) + ' alá' : '')}
    elokeszit=${(e, { alapbol, ix }) => (alapbol && E.mezoErtek(e, 'fajta', ix).ertek ? e : E.mezoBeallit(e, 'fajta', fajta, ix))}
    extra=${html`<${Valaszto} label="Fajta" value=${fajta} onChange=${setFajta} hint=${HS.FAJTAK[fajta].leiras}
      opciok=${Object.entries(HS.FAJTAK).map(([value, f]) => ({ value, label: f.nev }))}/>`}/>`;
}

// ================= Kötés helyszínhez (kapcsolat: itt történik) =================

// A jelenet, a rész (mini kaland) vagy bármely elem helyszínei: a kapcsolat honnan az elem, hova a helyszín.
export function HelyszinKotes({ elem, prep, cel, cim = 'Helyszín' }) {
  const [valasztott, setValasztott] = useState('');
  const kotesek = HS.helyszineiOf(elem.id, prep.adat.kapcsolatok || []);
  const helyek = prep.adat.elemek.filter((e) => e.tipus === 'helyszin' && e.aktiv !== false && !kotesek.some((k) => k.hova === e.id));
  const ment = () => {
    if (!valasztott) return;
    const k = { id: ujAzon('ln'), honnan: elem.id, hova: valasztott, tipus: 'itt_tortenik', megjegyzes: '',
      vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' };
    prep.kapcsolatMent(k).catch(() => {});
    setValasztott('');
  };
  return html`<div className="verem">
    <p className="cimke">${cim}</p>
    ${kotesek.length ? html`<div className="cimkek">${kotesek.map((k) => {
      const h = prep.ix.get(k.hova);
      return html`<span key=${k.id} className="csip csip--statikus">${h ? html`<a href=${elemUt(cel, h.id)}>${HelyUtvonal(h, prep.ix)}</a>` : k.hova}
        <button type="button" className="csip__gomb" aria-label="Kötés törlése" onClick=${() => prep.kapcsolatTorol(k.id).catch(() => {})}>×</button></span>`;
    })}</div>` : null}
    ${helyek.length ? html`<div className="sorban">
      <${Valaszto} label="Helyszínelem kötése" value=${valasztott} onChange=${setValasztott} ures="Válassz…"
        hint="Kapcsolat: helyszíne (a helyszín lapján „itt játszódik”)." opciok=${helyek.map((h) => ({ value: h.id, label: HelyUtvonal(h, prep.ix) }))}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!valasztott} onClick=${ment}>Kötés<//>
    </div>` : !kotesek.length ? html`<p className="halvany kicsi">Még nincs helyszínelem; a Helyszínek fülön vagy a világ oldalán hozható létre.</p>` : null}
  </div>`;
}

// A helyszín neve a földrajzi útjával („Partvidék › Kikötőváros › Vén Csuka”).
export function HelyUtvonal(h, ix) {
  return HS.osok(h, ix).map((x) => E.nev(x, ix)).concat([E.nev(h, ix)]).join(' › ');
}

// Több helyszín választása (a kampánykeret kiinduló helyszíneihez): azonosítók listája.
export function HelyszinekValaszto({ prep, ertek, onValt, label, hint }) {
  const [valasztott, setValasztott] = useState('');
  const idk = (ertek || []).filter(Boolean);
  const helyek = prep.adat.elemek.filter((e) => e.tipus === 'helyszin' && e.aktiv !== false && !idk.includes(e.id));
  return html`<div className="verem">
    <p className="cimke">${label}</p>
    ${idk.length ? html`<div className="cimkek">${idk.map((id) => {
      const h = prep.ix.get(id);
      return html`<span key=${id} className="csip csip--statikus">${h ? HelyUtvonal(h, prep.ix) : 'törölt helyszín'}
        <button type="button" className="csip__gomb" aria-label="Eltávolítás" onClick=${() => onValt(idk.filter((x) => x !== id))}>×</button></span>`;
    })}</div>` : null}
    ${helyek.length ? html`<div className="sorban">
      <${Valaszto} label="Helyszínelem" value=${valasztott} onChange=${setValasztott} ures="Válassz…" hint=${hint}
        opciok=${helyek.map((h) => ({ value: h.id, label: HelyUtvonal(h, prep.ix) }))}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!valasztott} onClick=${() => { onValt(idk.concat([valasztott])); setValasztott(''); }}>Hozzáadás<//>
    </div>` : null}
  </div>`;
}

// ================= A helyszín lépései =================

function useNjkk() {
  const { api } = useApp();
  const njkk = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk');
  return (njkk.adat || []).filter((n) => n.aktiv !== false);
}

function vilagOf(prep, cel) {
  const vid = cel.szint === 'vilag' ? cel.vilag_id : cel.szint === 'kampany' ? (prep.adat.keret && prep.adat.keret.keret && prep.adat.keret.keret.vilag_id) || prep.adat.vilag_id : '';
  return (prep.adat.vilagok || []).find((w) => w.id === vid) || null;
}

function HelyszinMezok({ lepes, elem, ix, valt, prep, cel }) {
  const a = E.megjelenitett(elem, ix);
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const all = HS.lepesAllapot(a);
  const szulo = elem.szulo_id ? ix.get(elem.szulo_id) : null;
  const fig = HS.figyelmeztetesek(a, szulo ? E.megjelenitett(szulo, ix) : null);
  const njkk = useNjkk();
  const [uj, setUj] = useState(null);
  const elemek = prep.adat.elemek.map((x) => (x.id === elem.id ? elem : x));
  const fajta = HS.fajtaOf(a);
  const tobbSoros = (mezo, label, hint, rows = 3, placeholder) => html`<${ElemMezo} elem=${elem} ix=${ix} mezo=${mezo} label=${label}
    multiline=${true} rows=${rows} hint=${hint} placeholder=${placeholder} onValt=${valt}/>`;

  if (lepes === 'fajta') {
    const szerepek = Array.isArray(a.szerepek) ? a.szerepek : [];
    const gyerekek = elemek.filter((x) => x.szulo_id === elem.id && x.tipus === 'helyszin' && x.aktiv !== false);
    const jelenetek = HS.ittTortenik(elem.id, prep.adat.kapcsolatok || []).map((id) => ix.get(id)).filter(Boolean);
    const osok = HS.osok(elem, ix);
    const szorzo = B.arszorzo(elem, ix, (x) => E.megjelenitett(x, ix), vilagOf(prep, cel));
    return html`<${LepesPanel} lepes="fajta" allapot=${all.fajta}>
      <${Figyelmeztetesek} lista=${fig} lepes="fajta"/>
      <${Valaszto} label=${cimkeJellel(elem, ix, 'fajta', valt, 'Fajta')} value=${fajta} onChange=${(x) => set('fajta', x)} hint=${HS.FAJTAK[fajta].leiras}
        opciok=${Object.entries(HS.FAJTAK).map(([value, f]) => ({ value, label: f.nev }))}/>
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="szerepek" valt=${valt}>Szerepe a játékban<//>
        <div className="csipek">${Object.entries(HS.SZEREPEK).map(([k, s]) => html`<${Csip} key=${k} be=${szerepek.includes(k)}
          onClick=${() => set('szerepek', szerepek.includes(k) ? szerepek.filter((x) => x !== k) : szerepek.concat([k]))}>${s.nev}<//>`)}</div>
        ${szerepek.map((k) => html`<p key=${k} className="halvany kicsi"><strong>${HS.SZEREPEK[k].nev}</strong> (${HS.SZEREPEK[k].en}, ${HS.SZEREPEK[k].oldal}. oldal): ${HS.SZEREPEK[k].leiras}</p>`)}
      </div>
      <div>
        <p className="cimke">Elhelyezés a világban</p>
        <p className="kicsi">${osok.length ? osok.map((o, i) => html`<span key=${o.id}>${i ? ' › ' : ''}<a href=${elemUt(cel, o.id)}>${E.nev(o, ix)}</a></span>`) : html`<span className="halvany">a földrajzi fa gyökerében</span>`}
          <span className="halvany"> › ${E.nev(elem, ix)}</span></p>
        <p className="halvany kicsi">A szülő az Alapadatok lépés „Helye a szerkezetben” panelén módosítható.</p>
      </div>
      ${fajta !== 'uzlet' && fajta !== 'hely' ? html`<${K.TextField} label=${cimkeJellel(elem, ix, 'arszorzo', valt, 'Árszorzó (%)')} type="number" min="10"
        value=${a.arszorzo === undefined ? '' : String(a.arszorzo)} placeholder=${String(szorzo.szazalek)}
        hint=${'Saját kiegészítés: a benne lévő boltok árai ezzel szorzódnak (drága főváros 150, olcsó falu 80). Üresen ' + (szorzo.honnan === 'helyszin' ? E.nev(szorzo.elem, ix) + ' szorzója' : szorzo.honnan === 'vilag' ? 'a világ szorzója' : '100') + ' (' + szorzo.szazalek + '%) érvényes.'}
        onChange=${(e) => set('arszorzo', szamVagyUres(e.target.value))}/>` : null}
      <div>
        <p className="cimke">Benne</p>
        ${gyerekek.length ? html`<ul className="elemfa">${gyerekek.map((g) => html`<li key=${g.id}><a className="elemfa__sor" href=${elemUt(cel, g.id)}>
          <span className="elemfa__nev">${E.nev(g, ix)}</span><span className="halvany kicsi">${HS.FAJTAK[HS.fajtaOf(E.megjelenitett(g, ix))].nev}</span></a></li>`)}</ul>`
          : html`<p className="halvany kicsi">Még nincs benne helyszín.</p>`}
        <div className="gombsor gombsor--szoros">${Object.entries(HS.FAJTAK).filter(([, f]) => f.rang >= HS.FAJTAK[fajta].rang || fajta === 'regio')
          .map(([k, f]) => html`<${K.Button} key=${k} size="sm" variant="secondary" onClick=${() => setUj(k)} icon=${html`<${Ikon} nev="plusz" meret=${16}/>`}>${f.nev}<//>`)}</div>
      </div>
      ${jelenetek.length ? html`<div><p className="cimke">Itt játszódik</p><ul className="elemfa">${jelenetek.map((j) => html`<li key=${j.id}>
        <a className="elemfa__sor" href=${elemUt(cel, j.id)}><span className="elemfa__nev">${E.nev(j, ix)}</span>
        <span className="halvany kicsi">${(E.ELEMTIPUSOK[j.tipus] || {}).nev}</span></a></li>`)}</ul></div>` : null}
      ${uj ? html`<${UjHelyszinParbeszed} prep=${prep} cel=${cel} szulo=${elem} fajta=${uj} onBezar=${() => setUj(null)}/>` : null}
    <//>`;
  }

  if (lepes === 'koncepcio') {
    const fok = Array.isArray(a.fokusz) ? a.fokusz : [];
    return html`<${LepesPanel} lepes="koncepcio" allapot=${all.koncepcio}>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="koncepcio" label="Koncepció" onValt=${valt}
        placeholder="elhagyott rom; száz régebbi városra épült város; egy óriás koponyájából faragott erőd"/>
      ${tobbSoros('cel', 'Miért kerül a játékba?', 'A hősök bázisa? Intrikák színtere? Felfedezésre és térképezésre váró ismeretlen?')}
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="fokusz" valt=${valt}>Jellemző kihívások<//>
        <div className="csipek">${Object.entries(HS.FOKUSZOK).map(([k, n]) => html`<${Csip} key=${k} be=${fok.includes(k)}
          onClick=${() => set('fokusz', fok.includes(k) ? fok.filter((x) => x !== k) : fok.concat([k]))}>${n}<//>`)}</div>
        <p className="halvany kicsi">A romok jellemzően felfedezésre és harcra, a városok szerepjátékra valók; a szokatlan keverék emlékezetes lehet.</p>
      </div>
      ${tobbSoros('titkok', 'A helyszín titka', 'A könyv tanácsa: minden helyszínhez tartozzon titok, nem kell világrengetőnek lennie. (Ugyanaz, mint az Alapadatok „A DM titkai” mezője.)')}
      <${Figyelmeztetesek} lista=${fig} lepes="koncepcio"/>
    <//>`;
  }

  if (lepes === 'tortenet') {
    return html`<${LepesPanel} lepes="tortenet" allapot=${all.tortenet}>
      ${tobbSoros('eredeti_cel', 'Eredeti cél', 'Építették vagy természetes? Mire használták az első lakói?')}
      <${ElemMezo} elem=${elem} ix=${ix} mezo="epitok" label="Építők, első lakók" onValt=${valt}/>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="gazdavaltasok" norm=${HS.gazdavaltasokNorm} cim="Gazdaváltások" gomb="Esemény"
        ures=${() => ({ mikor: '', mi: '' })} uresSzoveg="Ki foglalta el, mikor és miért? Hódítás, katasztrófa, átok?"
        sorTartalom=${(s, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="Mikor" value=${s.mikor} onChange=${(e) => allit({ mikor: e.target.value })} placeholder="háromszáz éve"/>
          <${K.TextField} label="Mi történt" value=${s.mi} onChange=${(e) => allit({ mi: e.target.value })}/></div>`}/>
      ${tobbSoros('mai_allapot', 'Hogyan jutott a mai állapotába?', 'Ez köti össze a múltat a lakókkal és a jelenlegi helyzettel.')}
    <//>`;
  }

  if (lepes === 'lakok') {
    const csoportok = prep.adat.elemek.filter((x) => x.tipus === 'csoport' && x.aktiv !== false);
    return html`<${LepesPanel} lepes="lakok" allapot=${all.lakok}>
      <${Figyelmeztetesek} lista=${fig} lepes="lakok"/>
      ${tobbSoros('vezetes', 'Ki irányít?', 'Örökletes báró, gazdag kereskedők tanácsa, egy fogadós, egy apátnő.', 2)}
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="lakok" norm=${HS.csoportokNorm} cim="Lakók, csoportok" gomb="Csoport"
        ures=${() => ({ nev: '', szervezet: '', csoport_id: '' })} uresSzoveg="Földművesek, pásztorok, munkások és felvigyázók, papok, árusok, őrök, tolvajok…"
        sorTartalom=${(s, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="Csoport" value=${s.nev} onChange=${(e) => allit({ nev: e.target.value })}/>
          <${K.TextField} label="Szervezet, vezetés" value=${s.szervezet} onChange=${(e) => allit({ szervezet: e.target.value })}/>
          ${csoportok.length ? html`<${Valaszto} label="Csoportelem" value=${s.csoport_id} onChange=${(x) => allit({ csoport_id: x })} ures="nincs"
            opciok=${csoportok.map((c) => ({ value: c.id, label: E.nev(c, ix) }))}/>` : null}</div>`}/>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="szereplok" norm=${HS.szereplokNorm} cim="Fontos szereplők" gomb="Szereplő"
        ures=${() => ({ nev: '', njk_id: '', szerep: '', tekintely: '', titok: '' })} uresSzoveg="Egy-két mondat elég: szerepük a helyen és tekintélyük forrása."
        sorTartalom=${(s, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="Név" value=${s.nev} onChange=${(e) => allit({ nev: e.target.value })}/>
          <${Valaszto} label="NJK-tár" value=${s.njk_id} onChange=${(x) => allit({ njk_id: x })} ures="nincs"
            opciok=${njkk.map((n) => ({ value: n.id, label: n.nev }))}/>
          <${K.TextField} label="Szerepe" value=${s.szerep} onChange=${(e) => allit({ szerep: e.target.value })}/>
          <${K.TextField} label="Tekintélye honnan" value=${s.tekintely} onChange=${(e) => allit({ tekintely: e.target.value })} placeholder="hivatal, mindenki titkát tudja, mindenki szereti"/>
          <${K.TextField} label="Titka" value=${s.titok} onChange=${(e) => allit({ titok: e.target.value })}/></div>`}/>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="konfliktusok" norm=${HS.konfliktusokNorm} cim="Konfliktusok" gomb="Konfliktus"
        ures=${() => ({ kik: '', miert: '', hogyan: '' })}
        sorTartalom=${(s, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="Kik között" value=${s.kik} onChange=${(e) => allit({ kik: e.target.value })}/>
          <${K.TextField} label="Mit akarnak, miért" value=${s.miert} onChange=${(e) => allit({ miert: e.target.value })}/>
          <${K.TextField} label="Hogyan küzdenek" value=${s.hogyan} onChange=${(e) => allit({ hogyan: e.target.value })}/></div>`}/>
      ${tobbSoros('szokasok', 'Részletek és szokások', 'Furcsa szokások, ünnepnapok, egy híres gyümölcspite: egy-két ilyen élővé teszi a helyet.')}
      <${ElemMezo} elem=${elem} ix=${ix} mezo="idegenek" label="Hogyan fogadják az idegeneket?" onValt=${valt}/>
    <//>`;
  }

  if (lepes === 'helyzet') {
    const szolg = HS.szolgaltatasNorm(a.szolgaltatasok);
    const boltok = HS.uzletei(elem, elemek, (x) => E.megjelenitett(x, ix));
    return html`<${LepesPanel} lepes="helyzet" allapot=${all.helyzet}>
      ${tobbSoros('friss_esemenyek', 'Friss események, külső konfliktusok', '')}
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="horgok" norm=${HS.horgokNorm} cim="Horgok" gomb="Horog"
        ures=${() => ({ szoveg: '' })} uresSzoveg="Egy út menti pihenőnek alig, egy bázisnak sok horog kell."
        sorTartalom=${(s, allit) => html`<${K.TextField} label="Horog" value=${s.szoveg} onChange=${(e) => allit({ szoveg: e.target.value })}/>`}/>
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="szolgaltatasok" valt=${valt}>Szolgáltatások<//>
        <div className="urlap-racs">${Object.entries(HS.SZOLGALTATASOK).map(([k, n]) => html`<${K.TextField} key=${k} label=${n} value=${szolg[k] || ''}
          onChange=${(e) => set('szolgaltatasok', HS.szolgaltatasNorm({ ...szolg, [k]: e.target.value }))}/>`)}</div>
      </div>
      ${boltok.length ? html`<div><p className="cimke">Üzletei</p><ul className="elemfa">${boltok.map((b) => html`<li key=${b.id}>
        <a className="elemfa__sor" href=${elemUt(cel, b.id)}><span className="elemfa__nev">${E.nev(b, ix)}</span>
        <span className="halvany kicsi">${B.osszefoglalo(E.megjelenitett(b, ix))}</span></a></li>`)}</ul></div>` : null}
    <//>`;
  }

  if (lepes === 'fizikai') {
    const terkepek = (Array.isArray(a.kepek) ? a.kepek : []).filter((k) => k && k.terkep).length;
    return html`<${LepesPanel} lepes="fizikai" allapot=${all.fizikai}>
      <${Figyelmeztetesek} lista=${fig} lepes="fizikai"/>
      ${tobbSoros('fizikai', 'Fizikai leírás', 'Építészet, anyagok, állapot; a múlt és a mai lakók nyomai.', 5)}
      ${tobbSoros('elhelyezes', 'Miért itt?', 'A város folyó vagy kikötő mellett, a fogadó forgalmas úton, a rom elszigetelten. Ha nem így van, annak oka van.', 2)}
      <${ElemMezo} elem=${elem} ix=${ix} mezo="meret" label="Méret és lépték" onValt=${valt} placeholder="egy hét lovaglás keresztben; harminc­ezer lakos"/>
      ${tobbSoros('terep', 'Terep: fedezék, külön részek, mozgás', 'Hogyan mozoghat a harc a helyen, hol van fedezék, mit használhatnak ki a felek?', 2)}
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="veszelyek" norm=${HS.veszelyekNorm} cim="Veszélyek" gomb="Veszély"
        ures=${() => ({ nev: '', hatas: '' })} uresSzoveg="Omlás, árvíz, hőség, csapda, riasztó, de a városban is: forgalom, elszabadult állat, tűz."
        sorTartalom=${(s, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="Veszély" value=${s.nev} onChange=${(e) => allit({ nev: e.target.value })}/>
          <${K.TextField} label="Hatása" value=${s.hatas} onChange=${(e) => allit({ hatas: e.target.value })} placeholder="például 1d6 sebzés körönként"/></div>`}/>
      <p className="halvany kicsi">${terkepek ? terkepek + ' térkép van feltöltve.' : 'Térkép: az Alapadatok lépés Képek panelén tölthető fel („térkép” jelöléssel).'}
        A könyv szerint a térkép közös képet ad a helyről, főleg harcnál; nélküle viszont szabadabb, filmszerűbb lehet a játék.</p>
    <//>`;
  }

  if (lepes === 'mutatvanyok') {
    return html`<${LepesPanel} lepes="mutatvanyok" allapot=${all.mutatvanyok}>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="mutatvanyok" norm=${HS.mutatvanyokNorm} cim="Helyszín-mutatványok" gomb="Mutatvány"
        ures=${() => ({ nev: '', fajta: 'modositott', ar: '', hatas: '' })}
        sorTartalom=${(s, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="Név" value=${s.nev} onChange=${(e) => allit({ nev: e.target.value })} placeholder="Leterítés a jégen; Rád omlik a ház"/>
          <${Valaszto} label="Fajta" value=${s.fajta} onChange=${(x) => allit({ fajta: x })}
            opciok=${[{ value: 'modositott', label: 'Meglévő mutatvány módosítva' }, { value: 'uj', label: 'Új hatás' }]}/>
          <${K.TextField} label="Ár (Mutatványpont)" type="number" min="0" max="6" value=${String(s.ar)} onChange=${(e) => allit({ ar: e.target.value })}/>
          <${K.TextField} label="Hatás" value=${s.hatas} onChange=${(e) => allit({ hatas: e.target.value })}/></div>`}/>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="korulmenyek" norm=${HS.korulmenyekNorm} cim="Körülményi módosítók" gomb="Módosító"
        ures=${() => ({ mire: '', modosito: 2 })} uresSzoveg="Zsúfolt piacon könnyebb a zsebtolvajlás, jó könyvtárban a kutatás; viharos hajón nehéz a sebkötözés."
        sorTartalom=${(s, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="Mire" value=${s.mire} onChange=${(e) => allit({ mire: e.target.value })}/>
          <${K.TextField} label="Módosító" type="number" min="-5" max="5" value=${String(s.modosito)} onChange=${(e) => allit({ modosito: Number(e.target.value) || 0 })}/></div>`}/>
    <//>`;
  }

  if (lepes === 'orszag') {
    return html`<${LepesPanel} lepes="orszag" allapot=${all.orszag}>
      ${Object.entries(HS.ORSZAG_MEZOK).map(([k, n]) => html`<${ElemMezo} key=${k} elem=${elem} ix=${ix} mezo=${k} label=${n} multiline=${true} rows=${2} onValt=${valt}/>`)}
    <//>`;
  }

  if (lepes === 'bolt') return html`<${BoltLepes} elem=${elem} ix=${ix} valt=${valt} prep=${prep} cel=${cel} allapot=${all.bolt} njkk=${njkk}/>`;
  if (lepes === 'kinalat') return html`<${KinalatLepes} elem=${elem} ix=${ix} valt=${valt} prep=${prep} cel=${cel} allapot=${all.kinalat}/>`;
  return null;
}

// ================= Az üzlet (a könyv üzletgenerátora) =================

// A bolt mezőinek beállítása egyszerre (a dobás eredménye), mezőnként öröklődve.
function tobbMezo(elem, patch, ix) {
  let e = elem;
  Object.entries(patch).forEach(([m, x]) => { e = E.mezoBeallit(e, m, x, E.index(Array.from(ix.values()).filter((y) => y.id !== e.id).concat([e]))); });
  return e;
}

function kikapcsoltOf(prep, cel) {
  return cel.szint === 'kampany' && prep.adat.keret && prep.adat.keret.keret ? prep.adat.keret.keret.generator_kikapcsolt || {} : {};
}

function BoltLepes({ elem, ix, valt, prep, cel, allapot, njkk }) {
  const { szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const tablak = useMemo(() => tablakBol(lapok), [lapok]);
  const korny = { tablak, kikapcsolt: kikapcsoltOf(prep, cel) };
  const [fa, setFa] = useState(null);
  const [tulaj, setTulaj] = useState('');
  const a = E.megjelenitett(elem, ix);
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const tipusok = B.tipusokOf(a);
  const sajat = Array.isArray(a.sajat_kategoriak) ? a.sajat_kategoriak : [];
  const reszletek = B.reszletekOf(a);
  const fcs = Array.isArray(a.fegyvercsoportok) ? a.fegyvercsoportok : [];
  const vanTabla = !!G.tablaKeres(tablak, B.UZLET_TABLA);
  const fig = B.figyelmeztetesek(a);
  const hatasok = B.hatasokOf(a);

  const elfogad = () => {
    const patch = B.fabolBolt(fa);
    let e = tobbMezo(elem, patch, ix);
    const adat = E.megjelenitett(e, ix);
    const naplo = (e.adat.dobasok || adat.dobasok || []).slice(-19).concat([{ ido: new Date().toISOString(), tabla: fa.nev, mezo: 'bolt', jegyzet: G.jegyzet(fa) }]);
    e = { ...e, adat: { ...e.adat, dobasok: naplo } };
    valt(e);
    setFa(null);
  };
  const egyDobas = (tablaId, fn) => {
    if (!G.tablaKeres(tablak, tablaId)) return;
    fn(G.general(tablaId, korny));
  };
  const tulajKotesek = (prep.adat.kapcsolatok || []).filter((k) => k.aktiv !== false && k.tipus === 'tulajdonosa' && k.hova === elem.id);
  const tulajMent = () => {
    if (!tulaj) return;
    prep.kapcsolatMent({ id: ujAzon('ln'), honnan: tulaj, hova: elem.id, tipus: 'tulajdonosa', megjegyzes: '',
      vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' }).catch(() => {});
    setTulaj('');
  };
  const csipValt = (mezo, lista_, k) => set(mezo, lista_.includes(k) ? lista_.filter((x) => x !== k) : lista_.concat([k]));
  const kategoriak = B.sajatKategoriaJeloltek(lapok);

  return html`<div className="verem">
    <${LepesPanel} lepes="bolt" allapot=${allapot}>
      ${fig.map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f}<//>`)}
      <div className="gombsor gombsor--szoros">
        <${K.Button} variant="primary" disabled=${!vanTabla} onClick=${() => setFa(G.general(B.UZLET_TABLA, korny))}
          icon=${html`<${Ikon} nev="sarkanykocka" meret=${18}/>`}>${fa ? 'Új dobás' : 'Dobás a könyv tábláján'}<//>
        ${fa ? html`<${K.Button} variant="secondary" onClick=${elfogad}>Elfogadom<//><${K.Button} variant="quiet" onClick=${() => setFa(null)}>Elvetem<//>` : null}
      </div>
      ${!vanTabla ? html`<p className="halvany kicsi">Az üzlettáblák (Import 12) még nincsenek a Szabályadatbázisban; addig a típus kézzel választható.</p>` : null}
      ${fa ? html`<div className="verem">
        <ul className="generator__fa"><${FaSor} cs=${fa} ut=${[]} melyseg=${0} tablak=${tablak}
          onUjra=${(ut) => setFa(G.ujradob(fa, ut, korny))} onValaszt=${(ut, i) => setFa(G.valaszt(fa, ut, i, korny))} onElhagy=${(ut) => setFa(G.elhagy(fa, ut))}/></ul>
        <p className="halvany kicsi">Elfogadáskor a típus, a páncélok és pajzsok, a fegyvercsoportok, a kidolgozottság, az árszint és az üzletrészletek
          a bolt mezőibe kerülnek (a régiek helyére), a dobás menete az elem dobásai közé. A kínálatot utána a Kínálat lépésen generálhatod.</p>
      </div>` : null}
    <//>
    <${K.Panel} title="Típus és kínálati források">
      <div className="verem">
        <div>
          <${MezoCimke} elem=${elem} ix=${ix} mezo="uzlet_tipusok" valt=${valt}>Üzlettípus (több is lehet: kettős profil)<//>
          <div className="csipek">${B.UZLET_KULCSOK.map((k) => html`<${Csip} key=${k} be=${tipusok.includes(k)} onClick=${() => csipValt('uzlet_tipusok', tipusok, k)}>${B.UZLET_TIPUSOK[k].nev}<//>`)}</div>
        </div>
        ${tipusok.includes('pancelkovacs') ? html`<div className="urlap-racs">
          <${Valaszto} label=${cimkeJellel(elem, ix, 'pancel_max', valt, 'Páncél (és ami alatta van)')} value=${a.pancel_max || ''} ures="nincs" onChange=${(x) => set('pancel_max', x)}
            opciok=${B.PANCEL_SOR.map((id) => ({ value: id, label: (B.sorKeres(lapok, id) || { nev_hu: id }).nev_hu }))}/>
          <${Valaszto} label=${cimkeJellel(elem, ix, 'pajzs_max', valt, 'Pajzs (és ami alatta van)')} value=${a.pajzs_max || ''} ures="nincs" onChange=${(x) => set('pajzs_max', x)}
            opciok=${B.PAJZS_SOR.map((id) => ({ value: id, label: (B.sorKeres(lapok, id) || { nev_hu: id }).nev_hu }))}/>
        </div>` : null}
        ${tipusok.includes('fegyverkovacs') ? html`<div className="verem">
          <${MezoCimke} elem=${elem} ix=${ix} mezo="fegyvercsoportok" valt=${valt}>Fegyvercsoportok<//>
          <div className="csipek">${(lapok['Fegyvercsoportok'] || []).map((g) => html`<${Csip} key=${g.id} be=${fcs.includes(g.id)} onClick=${() => csipValt('fegyvercsoportok', fcs, g.id)}>${g.nev_hu}<//>`)}</div>
          <div className="sorban">
            <${Valaszto} label=${cimkeJellel(elem, ix, 'granat', valt, 'Gránát')} value=${a.granat || ''} onChange=${(x) => set('granat', x)}
              opciok=${Object.entries(B.GRANAT).filter(([k]) => k).map(([value, label]) => ({ value, label }))} ures="nincs"/>
            <${Jelolo} checked=${!!a.fegyverek_konkret} onChange=${(x) => set('fegyverek_konkret', x)}>Konkrét fegyverek (csoportonként d3 a fegyvertáblán)<//>
          </div>
        </div>` : null}
        <div>
          <${MezoCimke} elem=${elem} ix=${ix} mezo="sajat_kategoriak" valt=${valt}>Saját bolttípus: kategóriák (saját kiegészítés)<//>
          <p className="halvany kicsi">Például vadászbolt: íjak, utazás és kaland. A bolt a „Sablon készítése” gombbal sablonként elmenthető.</p>
          ${['Felszerelés', 'Fegyverek', 'Páncélok'].map((cs) => html`<div key=${cs} className="csipek">
            <span className="halvany kicsi">${cs}:</span>
            ${kategoriak.filter((k) => k.csoport === cs).map((k) => html`<${Csip} key=${k.kulcs} be=${sajat.includes(k.kulcs)} onClick=${() => csipValt('sajat_kategoriak', sajat, k.kulcs)}>${k.nev}<//>`)}
          </div>`)}
        </div>
        <${Jelolo} checked=${!!a.vandor} onChange=${(x) => set('vandor', x)}>Úton járó kereskedő (nincs állandó helye)<//>
      </div>
    <//>
    <${K.Panel} title="Minőség, árszint, felvásárlás">
      <div className="verem">
        <div className="urlap-racs">
          <${Valaszto} label=${cimkeJellel(elem, ix, 'kidolgozottsag', valt, 'Kidolgozottság (a kínálat átlaga)')} value=${a.kidolgozottsag || ''} ures="nincs megadva"
            onChange=${(x) => set('kidolgozottsag', x)} hint=${B.KIDOLGOZOTTSAGOK[a.kidolgozottsag] ? B.KIDOLGOZOTTSAGOK[a.kidolgozottsag].hatas : 'A könyv szerint fizikai árunál dobni kell rá.'}
            opciok=${Object.entries(B.KIDOLGOZOTTSAGOK).map(([value, k]) => ({ value, label: k.nev + ' (' + k.en + ')' }))}/>
          <${K.TextField} label=${cimkeJellel(elem, ix, 'arszint', valt, 'Árszint (% a listaárhoz)')} type="number" min="10"
            value=${a.arszint === undefined ? '' : String(a.arszint)} placeholder="100"
            hint=${hatasok.includes('felar') || hatasok.includes('kiarusitas') ? 'Egy üzletrészlet miatt most 50% érvényes.' : 'A könyv táblája 50 és 400% között.'}
            onChange=${(e) => set('arszint', szamVagyUres(e.target.value))}/>
        </div>
        <div className="gombsor gombsor--szoros">
          <${K.Button} size="sm" variant="secondary" disabled=${!G.tablaKeres(tablak, 'dt_kidolgozottsag')}
            onClick=${() => egyDobas('dt_kidolgozottsag', (f) => f.ertek && set('kidolgozottsag', f.ertek.minoseg))}>Kidolgozottság dobása<//>
          <${K.Button} size="sm" variant="secondary" disabled=${!G.tablaKeres(tablak, 'dt_arszint')}
            onClick=${() => egyDobas('dt_arszint', (f) => f.ertek && set('arszint', f.ertek.szazalek))}>Árszint dobása<//>
        </div>
        <div className="urlap-racs">
          <${K.TextField} label=${cimkeJellel(elem, ix, 'felvasarlas', valt, 'Felvásárlás (% a listaárból)')} type="number" min="0"
            value=${a.felvasarlas === undefined ? '' : String(a.felvasarlas)} placeholder=${String(B.ALAP_FELVASARLAS)}
            hint="A kereskedők általában a listaár negyedét adják; ritka vagy értékes holmiért többet." onChange=${(e) => set('felvasarlas', szamVagyUres(e.target.value))}/>
          <${Jelolo} checked=${!!a.bizomany} onChange=${(x) => set('bizomany', x)}>Bizományba is átvesz (a hősök később kapják meg az árát)<//>
        </div>
      </div>
    <//>
    <${K.Panel} title="Üzletrészletek" actions=${html`<${K.Button} size="sm" variant="secondary" disabled=${!G.tablaKeres(tablak, 'dt_uzlet_reszlet')}
      onClick=${() => egyDobas('dt_uzlet_reszlet', (f) => { const p = B.fabolBolt({ ...f, tabla: 'x', hivasok: [{ gyerekek: [f] }] }); set('uzlet_reszletek', reszletek.concat(p.uzlet_reszletek.map((r) => ({ ...r, id: ujAzon('ur') })))); })}
      icon=${html`<${Ikon} nev="sarkanykocka" meret=${16}/>`}>Még egy részlet<//>`}>
      <div className="verem">
        <${MezoCimke} elem=${elem} ix=${ix} mezo="uzlet_reszletek" valt=${valt}>Részletek (a könyv szerint annyi, amennyi a sárkánykocka)<//>
        ${reszletek.length ? html`<ul className="sorlista">${reszletek.map((r, i) => html`<li key=${r.id || i} className="sorlista__sor">
          <div>${r.e}${r.en ? html` <span className="halvany">(${r.en})</span>` : null}
            ${r.hatas && B.HATASOK[r.hatas] ? html`<div><${K.Badge} tone="accent">${B.HATASOK[r.hatas]}${r.szazalek ? ' ' + r.szazalek + '%' : ''}<//></div>` : null}</div>
          <${K.Button} size="sm" variant="quiet" onClick=${() => set('uzlet_reszletek', reszletek.filter((_, j) => j !== i))}>Törlés<//>
        </li>`)}</ul>` : html`<p className="halvany kicsi">Nincs részlet.</p>`}
        ${hatasok.includes('magikus') ? html`<${K.TextField} label=${cimkeJellel(elem, ix, 'magikus_db', valt, 'Mágikus tárgyak száma (1–5)')} type="number" min="1" max="5"
          value=${a.magikus_db === undefined ? '' : String(a.magikus_db)} hint="A generált tárgyak egyedi tételként kerülnek a kínálatba (fegyverkovácsnál fegyver, páncélkovácsnál páncél vagy pajzs, máshol a fajtát te választod); az árukat te adod meg."
          onChange=${(e) => set('magikus_db', szamVagyUres(e.target.value))}/>
        <div className="sorban sorban--kozep">
          <${K.Button} size="sm" variant="secondary" disabled=${!G.tablaKeres(tablak, 'dt_magikus_tulajdonsag')} icon=${html`<${Ikon} nev="sarkanykocka" meret=${16}/>`}
            onClick=${() => set('kinalat', (Array.isArray(a.kinalat) ? a.kinalat : []).concat(magikusTetelek(a, lapok, Math.max(1, Math.min(5, Number(a.magikus_db) || 1)), { kikapcsolt: keretKikapcsolt(prep) })))}>
            Mágikus tárgyak a kínálatba<//>
          ${!G.tablaKeres(tablak, 'dt_magikus_tulajdonsag') ? html`<span className="halvany kicsi">A mágikus tulajdonságok táblája az Import 14-gyel jön.</span>` : null}
        </div>` : null}
      </div>
    <//>
    <${K.Panel} title="Tulajdonos">
      <div className="verem">
        ${tulajKotesek.length ? html`<div className="cimkek">${tulajKotesek.map((k) => {
          const n = njkk.find((x) => x.id === k.honnan);
          return html`<span key=${k.id} className="csip csip--statikus">${n ? html`<a href=${'#/dm/njk/' + n.id}>${n.nev}</a>` : k.honnan}
            <button type="button" className="csip__gomb" aria-label="Kötés törlése" onClick=${() => prep.kapcsolatTorol(k.id).catch(() => {})}>×</button></span>`;
        })}</div>` : html`<p className="halvany kicsi">Kapcsolat: tulajdonosa (NJK-tárból). Más tulajdonos (csoport, szervezet) a Kapcsolatok panelen köthető.</p>`}
        <div className="sorban">
          <${Valaszto} label="NJK" value=${tulaj} onChange=${setTulaj} ures="Válassz…" opciok=${njkk.map((n) => ({ value: n.id, label: n.nev }))}/>
          <${K.Button} size="sm" variant="secondary" disabled=${!tulaj} onClick=${tulajMent}>Tulajdonos<//>
        </div>
      </div>
    <//>
  </div>`;
}

// ================= Kínálat és árak =================

function TetelHozzaadas({ a, lapok, onAdd }) {
  const [mod, setMod] = useState('');
  const [keres, setKeres] = useState('');
  const [nev, setNev] = useState('');
  const [ar, setAr] = useState('');
  const forr = B.forrasok(a, lapok);
  const meglevo = new Set((a.kinalat || []).map((t) => t.tetel).filter(Boolean));
  const s = keres.trim().toLowerCase();
  const jeloltek = mod === 'barmely'
    ? ['Felszerelés', 'Fegyverek', 'Páncélok'].flatMap((lap) => (lapok[lap] || []).filter((x) => x.aktiv !== false && B.listaAr(x) !== null && !/_altalanos$/.test(x.id))
      .map((x) => ({ x, kulcs: lap === 'Felszerelés' ? 'Felszerelés:' + x.kategoria : lap === 'Páncélok' ? 'Páncélok:' + (x.reszletek && x.reszletek.tipus) : x.csoport ? 'Fegyverek:' + x.csoport : 'Fegyverek:granat' })))
    : forr.flatMap((f) => f.sorok.map((x) => ({ x, kulcs: f.kulcs })));
  const lista_ = jeloltek.filter((j) => !meglevo.has(j.x.id) && (!s || (j.x.nev_hu + ' ' + (j.x.nev_en || '')).toLowerCase().includes(s))).slice(0, 40);
  return html`<div className="verem">
    <div className="gombsor gombsor--szoros">
      <${K.Button} size="sm" variant=${mod === 'tipus' ? 'primary' : 'secondary'} onClick=${() => setMod(mod === 'tipus' ? '' : 'tipus')}>A típus tételei közül<//>
      <${K.Button} size="sm" variant=${mod === 'barmely' ? 'primary' : 'secondary'} onClick=${() => setMod(mod === 'barmely' ? '' : 'barmely')}>Bármely tétel<//>
      <${K.Button} size="sm" variant=${mod === 'egyedi' ? 'primary' : 'secondary'} onClick=${() => setMod(mod === 'egyedi' ? '' : 'egyedi')}>Egyedi tétel<//>
    </div>
    ${mod === 'tipus' || mod === 'barmely' ? html`<div className="verem">
      <${K.TextField} label="Keresés" value=${keres} onChange=${(e) => setKeres(e.target.value)}/>
      ${lista_.length ? html`<ul className="sorlista">${lista_.map((j) => html`<li key=${j.x.id} className="sorlista__sor">
        <span>${j.x.nev_hu} <span className="halvany kicsi">${penzSzoveg(B.listaAr(j.x))}</span></span>
        <${K.Button} size="sm" variant="quiet" onClick=${() => onAdd({ forras: j.kulcs, tetel: j.x.id, nev: '', lista_rez: null, darab: null, ar_rez: null, megj: '' })}>Felvétel<//>
      </li>`)}</ul>` : html`<p className="halvany kicsi">Nincs több tétel.</p>`}
    </div>` : null}
    ${mod === 'egyedi' ? html`<div className="sorban">
      <${K.TextField} label="Név" value=${nev} onChange=${(e) => setNev(e.target.value)} placeholder="ezüst bross, emlékkorsó, gyógyír"/>
      <${K.TextField} label="Listaár (réz)" type="number" min="0" value=${ar} onChange=${(e) => setAr(e.target.value)} hint=${ar ? penzSzoveg(Number(ar)) : '1 ezüst = 10 réz'}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!nev.trim()} onClick=${() => { onAdd({ forras: 'egyedi', tetel: '', nev: nev.trim(), lista_rez: ar === '' ? null : Number(ar), darab: null, ar_rez: null, megj: '' }); setNev(''); setAr(''); }}>Felvétel<//>
    </div>` : null}
  </div>`;
}

function KinalatLepes({ elem, ix, valt, prep, cel, allapot }) {
  const { szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const a = E.megjelenitett(elem, ix);
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const kinalat = Array.isArray(a.kinalat) ? a.kinalat : [];
  const szorzo = B.arszorzo(elem, ix, (x) => E.megjelenitett(x, ix), vilagOf(prep, cel));
  const forr = B.forrasok(a, lapok);
  const csoportok = B.kinalatCsoportok(a, lapok);
  const ures = forr.filter((f) => !csoportok.some((c) => c.kulcs === f.kulcs));
  const kedv = B.csapatKedvezmeny(a);
  const tetelAllit = (id, x) => set('kinalat', kinalat.map((t) => (t.id === id ? { ...t, ...x } : t)));
  const general = (csakForras) => set('kinalat', B.kinalatGeneral(a, lapok, { csakForras, azon: () => ujAzon('kt') }));
  const kezi = (v) => (v === '' ? null : Number(v));
  return html`<div className="verem">
    <${LepesPanel} lepes="kinalat" allapot=${allapot}>
      <div className="urlap-racs">
        <${Valaszto} label=${cimkeJellel(elem, ix, 'boseg', valt, 'A kínálat bősége')} value=${a.boseg || 'atlagos'} onChange=${(x) => set('boseg', x)}
          hint=${(B.BOSEGEK[a.boseg] || B.BOSEGEK.atlagos).leiras} opciok=${Object.entries(B.BOSEGEK).map(([value, b]) => ({ value, label: b.nev }))}/>
        <dl className="ertekek ertekek--lista">
          <div><dt>Árszint</dt><dd>${B.ervenyesArszint(a)}%</dd></div>
          <div><dt>Árszorzó</dt><dd>${szorzo.szazalek}% <span className="halvany kicsi">${szorzo.honnan === 'helyszin' ? '(' + E.nev(szorzo.elem, ix) + ')' : szorzo.honnan === 'vilag' ? '(a világé)' : ''}</span></dd></div>
          ${kedv ? html`<div><dt>A csapatnak</dt><dd>−${kedv}%</dd></div>` : null}
          <div><dt>Felvásárlás</dt><dd>${a.felvasarlas === undefined || a.felvasarlas === '' ? B.ALAP_FELVASARLAS : a.felvasarlas}%${a.bizomany ? ', bizomány is' : ''}</dd></div>
        </dl>
      </div>
      ${B.hatasokOf(a).includes('keves') ? html`<${Uzenet} tonus="warning">Alacsony készlet: generáláskor tételenként 3d6, dupla nélkül elfogyott (0 darab), duplánál a sárkánykocka a darabszám.<//>` : null}
      ${B.hatasokOf(a).includes('csere') ? html`<${Uzenet} tonus="warning">Csak cserekereskedelem: az ár az áru értéke, pénzt a bolt nem fogad el.<//>` : null}
      <div className="gombsor gombsor--szoros">
        <${K.Button} variant="primary" disabled=${!forr.length} onClick=${() => general()} icon=${html`<${Ikon} nev="sarkanykocka" meret=${18}/>`}>${kinalat.length ? 'A kínálat újragenerálása' : 'Kínálat generálása'}<//>
      </div>
      ${!forr.length ? html`<p className="halvany kicsi">${B.tipusokOf(a).length ? 'Ehhez a típushoz a felszerelésben nincs kategória (például ékszerész, emléktárgybolt): a tételeket egyedi tételként veheted fel.' : 'Előbb add meg az üzlet típusát (Az üzlet lépés).'}</p>` : null}
      ${kinalat.length ? html`<p className="halvany kicsi">Az újragenerálás az egyedi tételeket megtartja; egy forrás a saját „Újra” gombjával generálható újra.</p>` : null}
    <//>
    ${csoportok.map((cs) => html`<${K.Panel} key=${cs.kulcs} title=${cs.nev + ' (' + cs.tetelek.length + ')'}
      actions=${cs.kulcs !== 'egyedi' && forr.some((f) => f.kulcs === cs.kulcs) ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => general(cs.kulcs)} icon=${html`<${Ikon} nev="csere" meret=${16}/>`}>Újra<//>` : null}>
      <div className="tablazat-keret"><table className="tablazat">
        <thead><tr><th>Tétel</th><th>Listaár</th><th>Ár itt</th><th>Kézi ár (réz)</th><th>Darab</th><th>Felvásárlás</th><th></th></tr></thead>
        <tbody>${cs.tetelek.map((t) => {
          const ar = B.tetelAr(t, a, szorzo.szazalek, lapok);
          return html`<tr key=${t.id} className=${t.darab === 0 ? 'tablazat__sor--halvany' : ''}>
            <td>${B.tetelNev(t, lapok)}${t.megj ? html`<div className="halvany kicsi">${t.megj}</div>` : null}</td>
            <td>${ar.lista === null ? '–' : penzSzoveg(ar.lista)}</td>
            <td><strong>${ar.ar === null ? '–' : penzSzoveg(ar.ar)}</strong>${ar.csapat !== null ? html`<div className="halvany kicsi">csapatnak ${penzSzoveg(ar.csapat)}</div>` : null}</td>
            <td><input className="ka-field__input szammezo" type="number" min="0" aria-label=${B.tetelNev(t, lapok) + ': kézi ár'} value=${t.ar_rez === null || t.ar_rez === undefined ? '' : String(t.ar_rez)}
              placeholder=${ar.kezi ? '' : 'auto'} onChange=${(e) => tetelAllit(t.id, { ar_rez: kezi(e.target.value) })}/></td>
            <td><input className="ka-field__input szammezo" type="number" min="0" aria-label=${B.tetelNev(t, lapok) + ': darab'} value=${t.darab === null || t.darab === undefined ? '' : String(t.darab)}
              placeholder="van" onChange=${(e) => tetelAllit(t.id, { darab: kezi(e.target.value) })}/>${t.darab === 0 ? html`<div className="halvany kicsi">elfogyott</div>` : null}</td>
            <td>${ar.lista === null ? '–' : penzSzoveg(B.felvasarlasAr(ar.lista, a))}</td>
            <td>${kisGomb('×', 'Törlés a kínálatból', () => set('kinalat', kinalat.filter((x) => x.id !== t.id)))}</td>
          </tr>`;
        })}</tbody>
      </table></div>
    <//>`)}
    ${ures.length && kinalat.length ? html`<p className="halvany kicsi">Nincs tétel ezekből: ${ures.map((f) => f.nev).join(', ')}.
      ${ures.map((f) => html` <button key=${f.kulcs} type="button" className="szoveggomb" onClick=${() => general(f.kulcs)}>${f.nev} generálása</button>`)}</p>` : null}
    <${K.Panel} title="Tétel felvétele">
      <${TetelHozzaadas} a=${a} lapok=${lapok} onAdd=${(t) => set('kinalat', kinalat.concat([{ ...t, id: ujAzon('kt') }]))}/>
    <//>
  </div>`;
}

// A helyszín a könyv lépései szerint (az elemszerkesztő lépéses módja).
SAJAT_LEPESEK.helyszin = {
  lepesek: ({ elem, ix }) => {
    const a = E.megjelenitett(elem, ix);
    const all = HS.lepesAllapot(a);
    return HS.lepesKulcsok(a).map((k) => ({ kulcs: k, nev: HS.HELYSZIN_LEPESEK[k].nev.replace(/^\d+\.\s*/, ''), allapot: all[k] }));
  },
  tartalom: (lepes, p) => html`<${HelyszinMezok} key=${lepes} lepes=${lepes} ...${p}/>`
};

// ================= Helyszínek nézet: a földrajz és a boltok =================

function FaSorHely({ cs, ix, cel, melyseg, onUj }) {
  const a = E.megjelenitett(cs.elem, ix);
  const f = HS.fajtaOf(a);
  return html`<li>
    <div className=${'elemfa__sor helyfa__sor' + (cs.elem.aktiv === false ? ' elemfa__sor--archivalt' : '')} style=${{ paddingLeft: 8 + melyseg * 20 + 'px' }}>
      <a className="elemfa__nev" href=${elemUt(cel, cs.elem.id)}>${E.nev(cs.elem, ix)}</a>
      <${K.Badge} tone=${f === 'uzlet' ? 'accent' : 'neutral'}>${HS.FAJTAK[f].nev}<//>
      ${cel.szint !== E.szint(cs.elem) ? html`<${SzintJel} elem=${cs.elem}/>` : null}
      ${(Array.isArray(a.szerepek) ? a.szerepek : []).map((s) => html`<span key=${s} className="halvany kicsi">${HS.SZEREPEK[s] ? HS.SZEREPEK[s].nev.toLowerCase() : s}</span>`)}
      ${f === 'uzlet' ? html`<span className="halvany kicsi">${B.osszefoglalo(a)}</span>` : null}
      ${a.arszorzo !== undefined && a.arszorzo !== '' ? html`<span className="halvany kicsi">árszorzó ${a.arszorzo}%</span>` : null}
      ${!String(a.titkok || '').trim() ? html`<span className="halvany kicsi" title="A könyv szerint minden helyszínnek legyen titka.">titok nélkül</span>` : null}
      <span className="helyfa__gombok">${f !== 'uzlet' ? html`<button type="button" className="szoveggomb" onClick=${() => onUj(cs.elem, f === 'regio' ? 'orszag' : f === 'orszag' ? 'telepules' : f === 'telepules' ? 'hely' : 'hely')}>+ alá</button>
        ${f === 'telepules' || f === 'hely' ? html`<button type="button" className="szoveggomb" onClick=${() => onUj(cs.elem, 'uzlet')}>+ üzlet</button>` : null}` : null}</span>
    </div>
    ${cs.gyerekek.length ? html`<ul className="elemfa">${cs.gyerekek.map((g) => html`<${FaSorHely} key=${g.elem.id} cs=${g} ix=${ix} cel=${cel} melyseg=${melyseg + 1} onUj=${onUj}/>`)}</ul>` : null}
  </li>`;
}

// elemek: a látható helyszínek (a nézet szerint). A gyökerek: régiók, országok és ami nem helyszín alatt áll.
export function HelyszinFa({ prep, cel, elemek }) {
  const [uj, setUj] = useState(null); // { szulo, fajta }
  const fa = HS.foldrajziFa(elemek, prep.ix);
  return html`<div className="verem">
    ${fa.length ? html`<ul className="elemfa">${fa.map((cs) => html`<${FaSorHely} key=${cs.elem.id} cs=${cs} ix=${prep.ix} cel=${cel} melyseg=${0}
      onUj=${(szulo, fajta) => setUj({ szulo, fajta })}/>`)}</ul>` : html`<p className="halvany">Még nincs helyszín. A világ földrajza a helyszínek fájából áll: régió, ország, település, hely, üzlet, bármilyen mélységig.</p>`}
    <div className="gombsor gombsor--szoros">${Object.entries(HS.FAJTAK).map(([k, f]) => html`<${K.Button} key=${k} size="sm" variant="secondary"
      onClick=${() => setUj({ szulo: null, fajta: k })} icon=${html`<${Ikon} nev="plusz" meret=${16}/>`}>${f.nev}<//>`)}</div>
    ${uj ? html`<${UjHelyszinParbeszed} prep=${prep} cel=${cel} szulo=${uj.szulo} fajta=${uj.fajta} onBezar=${() => setUj(null)}/>` : null}
  </div>`;
}

// A kampány Helyszínek füle: a világ és a kampány helyszínei egy fában, mellette a boltok listája.
export function HelyszinekNezet({ prep, cel }) {
  const { szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const [archivalt, setArchivalt] = useState(false);
  const [vilagEs, setVilagEs] = useState(true);
  const vid = prep.adat.vilag_id || (prep.adat.keret && prep.adat.keret.keret && prep.adat.keret.keret.vilag_id) || '';
  const sajat = prep.adat.elemek.filter((e) => e.tipus === 'helyszin' && (cel.szint === 'kampany' ? e.kampany_id === cel.kampany_id : e.vilag_id === cel.vilag_id));
  const vilagbol = cel.szint === 'kampany' && vid ? prep.adat.elemek.filter((e) => e.tipus === 'helyszin' && e.vilag_id === vid) : [];
  const mutatott = sajat.concat(vilagEs ? vilagbol : []).filter((e) => archivalt || e.aktiv !== false);
  const megj = (x) => E.megjelenitett(x, prep.ix);
  const szamok = HS.fajtaSzamok(mutatott, megj);
  const boltok = mutatott.filter((e) => HS.fajtaOf(megj(e)) === 'uzlet');
  const archivDb = sajat.concat(vilagbol).filter((e) => e.aktiv === false).length;
  const vilag = (prep.adat.vilagok || []).find((w) => w.id === vid) || null;
  return html`<div className="ket-hasab">
    <${K.Panel} title="Helyszínek és földrajz">
      <div className="verem">
        <p className="halvany kicsi">${Object.entries(HS.FAJTAK).filter(([k]) => szamok[k]).map(([k, f]) => f.nev + ': ' + szamok[k]).join(' · ') || 'Még nincs helyszín.'}</p>
        ${vilagbol.length ? html`<${Jelolo} checked=${vilagEs} onChange=${setVilagEs}>A világ helyszínei is (${vilagbol.length})<//>` : null}
        ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
        <${HelyszinFa} prep=${prep} cel=${cel} elemek=${mutatott}/>
        <p className="halvany kicsi">Az új helyszín ${cel.szint === 'kampany' ? 'a kampányé; ha több kampányban is visszatér, a szerkesztőjében világelemmé emelhető' : 'a világé'}.</p>
      </div>
    <//>
    <div className="verem">
      <${K.Panel} title=${'Üzletek (' + boltok.length + ')'}>
        ${boltok.length ? html`<ul className="sorlista">${boltok.map((b) => {
          const a = megj(b);
          const sz = B.arszorzo(b, prep.ix, megj, vilag);
          const telep = HS.legkozelebbi(b, prep.ix, megj, ['telepules', 'orszag', 'regio']);
          return html`<li key=${b.id} className="sorlista__sor">
            <div><a className="sorlista__nev" href=${elemUt(cel, b.id)}>${E.nev(b, prep.ix)}</a>
              <div className="halvany kicsi">${[telep ? E.nev(telep, prep.ix) : a.vandor ? 'úton járó' : '', B.osszefoglalo(a), sz.szazalek !== 100 ? 'árszorzó ' + sz.szazalek + '%' : ''].filter(Boolean).join(' · ')}</div>
              ${B.reszletekOf(a).length ? html`<div className="halvany kicsi">${B.reszletekOf(a).map((r) => r.en || r.e).join(', ')}</div>` : null}</div>
          </li>`;
        })}</ul>` : html`<p className="halvany">Még nincs üzlet. Egy település vagy hely sorában a „+ üzlet” gombbal hozható létre, a szerkesztőjében a könyv tábláján dobható.</p>`}
      <//>
      <${K.Panel} title="A könyv szerint">
        <p className="szoveg">A helyszín lehet ismerős, hangulati, visszatérő és titokzatos; minden helyszínnek legyen titka. A könyv öt lépése: koncepció,
          történet, lakók, jelenlegi helyzet, fizikai leírás, bármilyen sorrendben, és csak annyi, amennyi a következő alkalomhoz kell. Az üzletek a könyv
          üzletgenerátorával készülnek (típus, üzletrészletek, kidolgozottság, árszint), a kínálat a felszerelés típusai szerint.
          ${lapok['Dobótáblák'] && lapok['Dobótáblák'].some((t) => t.id === B.UZLET_TABLA) ? '' : ' Az üzlettáblák még nincsenek betöltve (Import 12).'}</p>
      <//>
    </div>
  </div>`;
}

// A világ oldalán: a földrajz és a világ árszorzója.
VILAG_PANELEK.push(({ prep, cel, vazlat, setVazlat }) => {
  const a = (vazlat && vazlat.adat) || {};
  const helyek = prep.adat.elemek.filter((e) => e.tipus === 'helyszin' && e.vilag_id === cel.vilag_id && e.aktiv !== false);
  return html`<${K.Panel} title="A világ földrajza">
    <div className="verem">
      <${K.TextField} label="Árszorzó (%)" type="number" min="10" value=${a.arszorzo === undefined ? '' : String(a.arszorzo)} placeholder="100"
        hint="Saját kiegészítés: a világ minden boltjának ára ezzel szorzódik, hacsak egy régió, ország vagy település nem ad sajátot."
        onChange=${(e) => setVazlat({ ...vazlat, adat: { ...a, arszorzo: szamVagyUres(e.target.value) } })}/>
      <${HelyszinFa} prep=${prep} cel=${cel} elemek=${helyek}/>
    </div>
  <//>`;
});

