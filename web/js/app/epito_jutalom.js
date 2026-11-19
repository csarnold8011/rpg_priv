// Kampányépítő (DM, 5.6 alépés): jutalmak a Kampányépítő könyv 6. fejezete (Building Rewards) szerint, a Companion haladó
// jutalmaival (címek, tagságok, ereklyék) és az Alapkönyv 10. fejezetével (mágikus tárgyak, kincs). A jutalom elem lépéses
// szerkesztője, a jutalomtérkép (a kampánykereten és a Jutalmak fülön), a jutalmak kötése a kalandokhoz és jelenetekhez,
// a véletlen tárgyak a könyv tábláival, és a boltok mágikus kínálata. Tiszta függvények: web/js/kampany/jutalom.js.
// Itt csak a terv készül: a kiosztás és a karakterlapra írás a 6. lépés. Terv: claude/kampanyepito-terv.md, „6. fejezet”.
import { html, K, useApp, useState, useMemo, useLekeres, navigal, Ikon, Uzenet, Valaszto, Jelolo } from './kozos.js';
import { FaSor, tablakBol } from './dobotabla.js';
import { UjNjkParbeszed } from './njk.js';
import { useDm } from './dm.js';
import * as E from '../kampany/elem.js';
import * as J from '../kampany/jutalom.js';
import * as KR from '../kampany/keret.js';
import * as G from '../kampany/generator.js';
import * as B from '../kampany/bolt.js';
import { SAJAT_LEPESEK, OroklesJel, ElemMezo, UjElemParbeszed, elemUt, ujAzon, SzintJel } from './epito.js';

const PONT = { kesz: ['kaland__pont kaland__pont--kesz', '✓'], resz: ['kaland__pont kaland__pont--resz', '…'], ures: ['kaland__pont', ''] };
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};
const obj = (x) => (x && typeof x === 'object' && !Array.isArray(x) ? x : {});
const lista = (x) => (Array.isArray(x) ? x : []);
const kisGomb = (felirat, cim, onClick, disabled) => html`<button type="button" className="kisgomb" aria-label=${cim} title=${cim}
  disabled=${disabled} onClick=${onClick}>${felirat}</button>`;
const mozgat = (l, i, d) => { const j = i + d; if (j < 0 || j >= l.length) return l; const m = l.slice(); [m[i], m[j]] = [m[j], m[i]]; return m; };
const szamVagyUres = (v) => (v === '' || v === null || v === undefined || !Number.isFinite(Number(v)) ? '' : Number(v));
const elojel = (n) => (n === '' || n === null || n === undefined ? '' : (Number(n) >= 0 ? '+' : '−') + Math.abs(Number(n)));
const mintaSorok = (lapok, id) => { const t = ((lapok && lapok['Dobótáblák']) || []).find((x) => x.id === id); return t ? G.reszletek(t).sorok || [] : []; };

function LepesPanel({ lepes, allapot, children, actions }) {
  const l = J.JUTALOM_LEPESEK[lepes];
  const p = PONT[allapot || 'ures'];
  return html`<${K.Panel} actions=${actions} title=${html`${allapot ? html`<span className=${p[0]} aria-label=${allapot === 'kesz' ? 'kitöltve' : allapot === 'resz' ? 'részben kitöltve' : 'üres'}>${p[1]}</span> ` : null}${l.nev} <span className="halvany keret__en">(${l.en}, ${/^\d/.test(l.oldal) ? l.oldal + '. oldal' : l.oldal})</span>`}>
    <div className="verem"><p className="sugo">${l.utmutato}</p>${children}</div>
  <//>`;
}

const cimkeJellel = (elem, ix, mezo, valt, szoveg) => html`${szoveg} <${OroklesJel} info=${E.mezoErtek(elem, mezo, ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, mezo))}/>`;
const Figyelmeztetesek = ({ lista: l, lepes }) => l.filter((f) => f.lepes === lepes).map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f.szoveg}<//>`);

// Listás mező: sorok mezőkkel, sorrend, törlés, hozzáadás. A teljes lista egyben öröklődik.
function ListaMezo({ elem, ix, valt, mezo, norm, cim, ures, gomb, sorTartalom, uresSzoveg, extraGomb }) {
  const l = norm(E.mezoErtek(elem, mezo, ix).ertek);
  const allit = (x) => valt(E.mezoBeallit(elem, mezo, x, ix));
  return html`<div className="verem">
    <p className="cimke">${cimkeJellel(elem, ix, mezo, valt, cim)}</p>
    ${l.length ? html`<ul className="sorlista">${l.map((s, i) => html`<li key=${s.id} className="sorlista__sor sorlista__sor--fuggoleges jelenet__listasor">
      ${sorTartalom(s, (x) => allit(l.map((y, j) => (j === i ? { ...y, ...x } : y))))}
      <div className="gombsor gombsor--szoros">
        ${kisGomb('↑', 'Feljebb', () => allit(mozgat(l, i, -1)), i === 0)}
        ${kisGomb('↓', 'Lejjebb', () => allit(mozgat(l, i, 1)), i === l.length - 1)}
        <${K.Button} size="sm" variant="quiet" onClick=${() => allit(l.filter((_, j) => j !== i))}>Törlés<//>
      </div>
    </li>`)}</ul>` : uresSzoveg ? html`<p className="halvany kicsi">${uresSzoveg}</p>` : null}
    <div className="gombsor gombsor--szoros"><${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
      onClick=${() => allit(l.concat([{ ...ures(), id: ujAzon(mezo.slice(0, 2)) }]))}>${gomb}<//>${extraGomb ? extraGomb(l, allit) : null}</div>
  </div>`;
}

// Választókártyák egy (örökölhető) mezőhöz. tobb: több is választható (lista).
function Kartyak({ elem, ix, valt, mezo, opciok, tobb, cim }) {
  const ert = E.mezoErtek(elem, mezo, ix).ertek;
  const valasztva = (k) => (tobb ? lista(ert).includes(k) : ert === k);
  const kattint = (k) => {
    if (tobb) { const l = lista(ert); valt(E.mezoBeallit(elem, mezo, l.includes(k) ? l.filter((x) => x !== k) : l.concat([k]), ix)); }
    else valt(E.mezoBeallit(elem, mezo, ert === k ? '' : k, ix));
  };
  return html`<div className="verem">
    ${cim ? html`<p className="cimke">${cimkeJellel(elem, ix, mezo, valt, cim)}</p>` : null}
    <div className="valasztokartyak">${Object.entries(opciok).map(([k, m]) => html`<button key=${k} type="button"
      className=${'valasztokartya' + (valasztva(k) ? ' valasztokartya--aktiv' : '')} aria-pressed=${valasztva(k)} onClick=${() => kattint(k)}>
      <strong>${m.nev}</strong>${m.en ? html` <span className="halvany kicsi">(${m.en}${m.oldal ? ', ' + m.oldal + '. oldal' : ''})</span>` : null}
      ${m.leiras ? html`<br/><span className="kicsi">${m.leiras}</span>` : null}</button>`)}</div>
  </div>`;
}

function useNjkkKarakterek(cel) {
  const { api } = useApp();
  const init = useLekeres(async () => api.hivas('init'), [], 'init');
  const njkk = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk');
  const karakterek = ((init.adat && init.adat.karakterek) || [])
    .filter((c) => c.aktiv !== false && (cel.szint !== 'kampany' || (c.kampanyok || []).includes(cel.kampany_id)));
  return { karakterek, njkk: (njkk.adat || []).filter((n) => n.aktiv !== false), init, njkkLek: njkk };
}

const tulNev = (lapok, id) => { const t = (lapok['Tulajdonságok'] || []).find((x) => x.id === id); return t ? t.nev_hu : id; };
const fokNev = (lapok, id) => { const t = (lapok['Fókuszok'] || []).find((x) => x.id === id); return t ? t.nev_hu : id; };

// ================= A jutalom lépései =================

function JutalomMezok({ lepes, elem, ix, valt, prep, cel }) {
  const { szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const a = E.megjelenitett(elem, ix);
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const all = J.lepesAllapot(a);
  const fig = J.figyelmeztetesek(a);
  const p = { elem, ix, valt, prep, cel, a, set, all, fig, lapok };
  if (lepes === 'hasznalat') return html`<${HasznalatLepes} key="h" ...${p}/>`;
  if (lepes === 'cim') return html`<${CimLepes} ...${p}/>`;
  if (lepes === 'tagsag') return html`<${TagsagLepes} ...${p}/>`;
  if (lepes === 'tars') return html`<${TarsLepes} ...${p}/>`;
  if (lepes === 'targy') return html`<${TargyLepes} ...${p}/>`;
  if (lepes === 'ereklye') return html`<${EreklyeLepes} ...${p}/>`;
  if (lepes === 'kincs') return html`<${KincsLepes} ...${p}/>`;
  if (lepes === 'megnyitas') return html`<${MegnyitasLepes} ...${p}/>`;
  return null;
}

// ---- Fajta, szintsáv, szerep, kinek, hol szerzik meg ----
function HasznalatLepes({ elem, ix, valt, prep, cel, a, set, all, fig }) {
  const { karakterek } = useNjkkKarakterek(cel);
  const sav = J.savOf(a.iv);
  const kinek = lista(a.kinek);
  return html`<${LepesPanel} lepes="hasznalat" allapot=${all.hasznalat}>
    <${Kartyak} elem=${elem} ix=${ix} valt=${valt} mezo="fajta" opciok=${J.FAJTAK} cim="A jutalom fajtája"/>
    <${Valaszto} label=${cimkeJellel(elem, ix, 'iv', valt, 'Szintsáv (Achievement Level)')} value=${a.iv || ''} ures="nincs megadva" onChange=${(x) => set('iv', x)}
      hint="A jutalomtérkép sora; a kampánykeret íveivel azonos."
      opciok=${J.SAVOK.map((s) => ({ value: s.kulcs, label: s.nev + ' (' + s.en + ', ' + s.tol + '–' + s.ig + '. szint)' }))}/>
    ${sav ? html`<p className="halvany kicsi">${J.SAV_MERFOLDKO[sav.kulcs]} Illő tárgyritkaság: ${J.SAV_RITKASAG[sav.kulcs].map((k) => J.RITKASAGOK[k].nev.toLowerCase()).join(' vagy ')};
      kincs: ${J.SAV_KINCS[sav.kulcs].map((k) => J.KINCS_KATEGORIAK[k].nev.toLowerCase()).join(' vagy ')}.</p>` : null}
    <${Kartyak} elem=${elem} ix=${ix} valt=${valt} mezo="szerepek" tobb=${true} opciok=${J.SZEREPEK} cim="Mire szolgál?"/>
    <div className="verem">
      <p className="cimke">${cimkeJellel(elem, ix, 'kinek', valt, 'Kinek szól?')}</p>
      <div className="cimkek">
        <${Jelolo} checked=${kinek.includes('csapat')} onChange=${(x) => set('kinek', x ? kinek.concat(['csapat']) : kinek.filter((k) => k !== 'csapat'))}>az egész csapat<//>
        ${cel.szint === 'kampany' ? karakterek.map((c) => html`<${Jelolo} key=${c.id} checked=${kinek.includes(c.id)}
          onChange=${(x) => set('kinek', x ? kinek.concat([c.id]) : kinek.filter((k) => k !== c.id))}>${c.nev}<//>`) : null}
      </div>
      ${cel.szint !== 'kampany' ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="kinek_szoveg" label="Kinek (szövegesen)" onValt=${valt}
        placeholder="például a csapat harcosa, egy mágus" hint="Sablonban és világban a kampány karakterei még nem választhatók."/>` : null}
      <p className="halvany kicsi">A könyv tanácsa: a kezdő játékosoknak egyértelmű jutalmat adj a kaland végén, később kérd ki a véleményüket is (egy megkedvelt NJK társnak, egy tettükhöz illő cím).</p>
    </div>
    <${Figyelmeztetesek} lista=${fig} lepes="hasznalat"/>
    <${HolSzerzik} elem=${elem} prep=${prep} cel=${cel}/>
  <//>`;
}

// A jutalomhoz kötött kalandok és jelenetek (kapcsolat: jutalma), és új kötés innen.
function HolSzerzik({ elem, prep, cel }) {
  const [valasztott, setValasztott] = useState('');
  const kotesek = J.holSzerzik(elem.id, prep.adat.kapcsolatok || []);
  const jeloltek = prep.adat.elemek.filter((e) => ['kaland', 'resz', 'jelenet'].includes(e.tipus) && e.aktiv !== false && !kotesek.some((k) => k.hova === e.id));
  const ment = () => {
    if (!valasztott) return;
    prep.kapcsolatMent({ id: ujAzon('ln'), honnan: elem.id, hova: valasztott, tipus: 'jutalma', megjegyzes: '',
      vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' }).catch(() => {});
    setValasztott('');
  };
  return html`<div className="verem">
    <p className="cimke">Hol szerzik meg?</p>
    ${kotesek.length ? html`<div className="cimkek">${kotesek.map((k) => {
      const h = prep.ix.get(k.hova);
      return html`<span key=${k.id} className="csip csip--statikus">${h ? html`<a href=${elemUt(cel, h.id)}>${E.ELEMTIPUSOK[h.tipus].nev}: ${E.nev(h, prep.ix)}</a>` : k.hova}
        <button type="button" className="csip__gomb" aria-label="Kötés törlése" onClick=${() => prep.kapcsolatTorol(k.id).catch(() => {})}>×</button></span>`;
    })}</div>` : html`<p className="halvany kicsi">Még egy kalandhoz vagy jelenethez sincs kötve.</p>`}
    ${jeloltek.length ? html`<div className="sorban">
      <${Valaszto} label="Kaland, rész vagy jelenet" value=${valasztott} onChange=${setValasztott} ures="Válassz…"
        hint="Kapcsolat: a kaland vagy a jelenet Jutalmak lépésén is látszik." opciok=${jeloltek.map((h) => ({ value: h.id, label: E.ELEMTIPUSOK[h.tipus].nev + ': ' + E.nev(h, prep.ix) }))}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!valasztott} onClick=${ment}>Kötés<//>
    </div>` : null}
  </div>`;
}

// ---- Cím ----
function CimLepes({ elem, ix, valt, a, set, all, fig, lapok }) {
  const mintak = mintaSorok(lapok, J.CIM_MINTAK);
  const [minta, setMinta] = useState('');
  const atvesz = () => {
    const m = mintak[Number(minta)];
    if (!m) return;
    const x = obj(m.ertek);
    let e = elem;
    const ix2 = () => E.index(Array.from(ix.values()).filter((y) => y.id !== e.id).concat([e]));
    if (!String(a.nev || '').trim() || /^Új /.test(a.nev)) e = E.mezoBeallit(e, 'nev', m.e, ix2());
    e = E.mezoBeallit(e, 'hatas', x.hatas || '', ix2());
    e = E.mezoBeallit(e, 'hatas_mod', x.hatas_mod || 'bonusz', ix2());
    if (x.hatas_mod === 'kulonleges') e = E.mezoBeallit(e, 'alkalmankent', true, ix2());
    if (!a.cim_fajta) e = E.mezoBeallit(e, 'cim_fajta', 'hirnev', ix2());
    e = E.mezoBeallit(e, 'forras', x.forras === 'Companion' ? 'Companion' : 'Kampányépítő', ix2());
    e = E.mezoBeallit(e, 'oldal', x.oldal || '', ix2());
    valt(e);
    setMinta('');
  };
  return html`<${LepesPanel} lepes="cim" allapot=${all.cim}>
    ${mintak.length ? html`<div className="sorban">
      <${Valaszto} label="Kiindulás egy mintacímből" value=${minta} onChange=${setMinta} ures="Válassz…"
        hint="A Kampányépítő és a Companion címei; a mintájukra sajátot is alkothatsz (például Goblinok réme helyett Orkok réme)."
        opciok=${mintak.map((m, i) => ({ value: String(i), label: m.e + ' (' + m.en + ')' }))}/>
      <${K.Button} size="sm" variant="secondary" disabled=${minta === ''} onClick=${atvesz}>Átveszem<//>
    </div>` : html`<p className="halvany kicsi">A mintacímek az Import 14-gyel töltődnek be.</p>`}
    <${Kartyak} elem=${elem} ix=${ix} valt=${valt} mezo="cim_fajta" opciok=${J.CIM_FAJTAK} cim="A cím fajtája"/>
    <${Kartyak} elem=${elem} ix=${ix} valt=${valt} mezo="hatas_mod" opciok=${J.CIM_HATASOK} cim="Mit ad?"/>
    <div className="sorban">
      <${K.TextField} label=${cimkeJellel(elem, ix, 'bonusz', valt, 'Bónusz vagy büntetés')} type="number" min="-3" max="3" className="szammezo"
        value=${a.bonusz === undefined ? '' : String(a.bonusz)} onChange=${(e) => set('bonusz', szamVagyUres(e.target.value))}/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="mire" label="Milyen próbára, kivel szemben, milyen helyzetben" onValt=${valt}
        placeholder="például Akaraterő (Bátorság) az élőholtak ellen"/>
    </div>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="hatas" label="A hatás" multiline=${true} rows=${3} onValt=${valt}/>
    <${Jelolo} checked=${!!a.alkalmankent} onChange=${(x) => set('alkalmankent', x)}>Alkalmanként egyszer használható<//>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="jogok" label="Jogok, kötelességek, jövedelem" multiline=${true} rows=${2} onValt=${valt}
      hint="A nemesi és hivatali titulus birtokkal, jövedelemmel járhat, de gondoskodni kell róla (vagy valakit megbízni vele)."/>
    <${Jelolo} checked=${!!a.orokolt} onChange=${(x) => set('orokolt', x)}>Örökölt cím, amely a szintekkel „érik be” (mint a tagság rangjai)<//>
    ${a.orokolt ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="orokles" label="Mikor jön a teljes örökség?" onValt=${valt}
      placeholder="például lovag a gyakorlott sávban, a korona a mester vagy legendás sávban"/>` : null}
    <${Figyelmeztetesek} lista=${fig} lepes="cim"/>
  <//>`;
}

// ---- Tagság ----
function TagsagLepes({ elem, ix, valt, prep, cel, a, set, all, fig }) {
  const csoportok = prep.adat.elemek.filter((e) => e.tipus === 'csoport' && e.aktiv !== false);
  const rangok = J.rangokNorm(a.rangok);
  return html`<${LepesPanel} lepes="tagsag" allapot=${all.tagsag}>
    <${Kartyak} elem=${elem} ix=${ix} valt=${valt} mezo="szervezet_tipus" opciok=${J.SZERVEZET_TIPUSOK} cim="A szervezet típusa (75. oldal)"/>
    <div className="sorban">
      ${csoportok.length ? html`<${Valaszto} label=${cimkeJellel(elem, ix, 'csoport_id', valt, 'Csoportelem')} value=${a.csoport_id || ''} ures="nincs"
        onChange=${(x) => set('csoport_id', x)} opciok=${csoportok.map((c) => ({ value: c.id, label: E.nev(c, prep.ix) }))}/>` : null}
      <${ElemMezo} elem=${elem} ix=${ix} mezo="szervezet" label="A szervezet neve" onValt=${valt}
        hint=${csoportok.length ? 'Ha nincs csoportelem.' : 'A szervezet csoportelemként is felvehető (a 8. alépésben bővül).'}/>
    </div>
    ${a.csoport_id && prep.ix.get(a.csoport_id) ? html`<p className="halvany kicsi"><a href=${elemUt(cel, a.csoport_id)}>A csoportelem megnyitása</a></p>` : null}
    <${K.TextField} label=${cimkeJellel(elem, ix, 'rang', valt, 'Ezt a rangot adja (sorszám)')} type="number" min="1" max="9" className="szammezo"
      hint="1: felvétel (újonc). A 2. és a 3. rang külön jutalom is lehet egy későbbi szintsávban."
      value=${a.rang === undefined ? '' : String(a.rang)} onChange=${(e) => set('rang', szamVagyUres(e.target.value))}/>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="felvetel" label="Hogyan lehet bekerülni vagy előrelépni?" multiline=${true} rows=${2} onValt=${valt}
      hint="Próbatétel, ajánlás, hűségeskü, adomány; a titkos társaság óvatos, kit vesz fel."/>
    <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="rangok" norm=${J.rangokNorm} cim="A szervezet rangjai"
      ures=${() => ({ nev: '', elonyok: '', kotelessegek: '' })} gomb="Új rang"
      uresSzoveg="Még nincs rang. A Companion három rangja egy gombbal felvehető, utána átnevezhető (például árnylovag, árnybáró)."
      extraGomb=${(l, allit) => (l.length ? null : html`<${K.Button} size="sm" variant="secondary" onClick=${() => allit(J.alapRangok())}>A Companion három rangja<//>`)}
      sorTartalom=${(s, allit) => html`<div className="verem">
        <${K.TextField} label=${(rangok.findIndex((r) => r.id === s.id) + 1) + '. rang neve'} value=${s.nev} onChange=${(e) => allit({ nev: e.target.value })}/>
        <${K.TextField} label="Előnyök" multiline=${true} rows=${2} value=${s.elonyok} onChange=${(e) => allit({ elonyok: e.target.value })}/>
        <${K.TextField} label="Kötelességek" multiline=${true} rows=${2} value=${s.kotelessegek} onChange=${(e) => allit({ kotelessegek: e.target.value })}/>
      </div>`}/>
    <p className="halvany kicsi">A 3. rang fölött a DM dönt: a még magasabb rangok a szervezet vezetéséhez visznek, egészen a csúcsig (egy vezető vagy egy tanács).</p>
    <${Figyelmeztetesek} lista=${fig} lepes="tagsag"/>
  <//>`;
}

// ---- Társ ----
function TarsLepes({ elem, ix, valt, prep, cel, a, set, all, fig, lapok }) {
  const { njkk, karakterek, njkkLek } = useNjkkKarakterek(cel);
  const dm = useDm();
  const [uj, setUj] = useState(false);
  const [minta, setMinta] = useState('');
  const mintak = mintaSorok(lapok, J.TARS_MINTAK).map((m) => ({ ...m, honnan: 'Kampányépítő 76–77.' }))
    .concat(mintaSorok(lapok, 'dt_koveto_minta').map((m) => ({ ...m, honnan: 'Companion 99.' })));
  const njk = a.njk_id ? njkk.find((n) => n.id === a.njk_id) : null;
  const atvesz = () => {
    const m = mintak[Number(minta)];
    if (!m) return;
    const x = obj(m.ertek);
    let e = elem;
    const ix2 = () => E.index(Array.from(ix.values()).filter((y) => y.id !== e.id).concat([e]));
    if (!String(a.nev || '').trim()) e = E.mezoBeallit(e, 'nev', m.e, ix2());
    e = E.mezoBeallit(e, 'tars_tulajdonsagok', Object.entries(obj(x.tulajdonsagok)).map(([k, v]) => tulNev(lapok, k) + ' ' + v).join(', '), ix2());
    e = E.mezoBeallit(e, 'tars_fokuszok', lista(x.fokuszok).map((f) => fokNev(lapok, f)).join(', '), ix2());
    e = E.mezoBeallit(e, 'feladatok', lista(x.feladatok).join(', '), ix2());
    valt(e);
    setMinta('');
  };
  return html`<${LepesPanel} lepes="tars" allapot=${all.tars}>
    <div className="sorban">
      <${Valaszto} label=${cimkeJellel(elem, ix, 'njk_id', valt, 'NJK az NJK-tárból')} value=${a.njk_id || ''} ures="még nincs" onChange=${(x) => set('njk_id', x)}
        opciok=${njkk.map((n) => ({ value: n.id, label: n.nev + (n.fajta === 'koveto' ? ' (követő)' : '') }))}/>
      ${dm ? html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${16}/>`}>Új követő NJK<//>` : null}
    </div>
    ${njk ? html`<p className="halvany kicsi"><a href=${'#/dm/njk/' + njk.id}>${njk.nev}</a> az NJK-tárban: ott a statblokkja, az irányítója és a kötődése (a követő a Companion szerint).</p>` : null}
    ${mintak.length ? html`<div className="sorban">
      <${Valaszto} label="Társminta" value=${minta} onChange=${setMinta} ures="Válassz…"
        opciok=${mintak.map((m, i) => ({ value: String(i), label: m.e + ' (' + m.honnan + ')' }))}/>
      <${K.Button} size="sm" variant="secondary" disabled=${minta === ''} onClick=${atvesz}>Átveszem<//>
    </div>` : null}
    <${ElemMezo} elem=${elem} ix=${ix} mezo="tars_tulajdonsagok" label="Tulajdonságok" onValt=${valt} placeholder="például Ügyesség 2, Észlelés 2, Pontosság 1"
      hint="Általában két tulajdonság 2-es és néhány 1-es."/>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="tars_fokuszok" label="Fókuszok" onValt=${valt} hint="Két-három fókusz."/>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="feladatok" label="Hasznos feladatai" multiline=${true} rows=${2} onValt=${valt}
      hint="Amit magától elvégez (tábor, lovak, pletyka, eltűnt dolgok), és amivel a DM horgot hozhat a játékba."/>
    <${Jelolo} checked=${!!a.nem_humanoid} onChange=${(x) => set('nem_humanoid', x)}>Állat vagy más lény (Állatidomítás talentum segédi fokán engedelmeskedik)<//>
    <${Valaszto} label=${cimkeJellel(elem, ix, 'gazda', valt, 'Kihez kötődik')} value=${a.gazda || ''} ures="még nem tudni" onChange=${(x) => set('gazda', x)}
      hint="Egészség: a gazda felének, csapatnál a második legkisebb Egészségű hős felének."
      opciok=${[{ value: 'csapat', label: 'a csapat' }].concat(cel.szint === 'kampany' ? karakterek.map((c) => ({ value: c.id, label: c.nev })) : [])}/>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="fejlodes" label="Fejlődése" multiline=${true} rows=${2} onValt=${valt}
      hint="Néha egy talentum vagy osztályképesség; a képességei ne haladják meg a második legalacsonyabb szintű hős szintjének felét."/>
    <${Figyelmeztetesek} lista=${fig} lepes="tars"/>
    ${uj && dm ? html`<${UjNjkParbeszed} dm=${dm} kezdoMod="koveto" kampanyId=${cel.szint === 'kampany' ? cel.kampany_id : ''}
      szint=${cel.szint === 'vilag' ? 'vilag' : cel.szint === 'sablon' ? 'sablon' : 'szabad'} vilagId=${cel.szint === 'vilag' ? cel.vilag_id : ''}
      onBezar=${() => setUj(false)} onLetrejott=${(n) => { setUj(false); njkkLek.ujra(); set('njk_id', n.id); }}/>` : null}
  <//>`;
}

// ---- Mágikus tárgy ----
function VeletlenTargy({ lapok, onElfogad, kikapcsolt }) {
  const tablak = useMemo(() => tablakBol(lapok), [lapok]);
  const [fajta, setFajta] = useState('fegyver');
  const [magikus, setMagikus] = useState(true);
  const [fak, setFak] = useState(null);
  const korny = { tablak, kikapcsolt: kikapcsolt || {} };
  const vanTabla = G.tablaKeres(tablak, 'dt_fegyvercsoport') && G.tablaKeres(tablak, 'dt_kidolgozottsag');
  const vanMagikus = !!G.tablaKeres(tablak, J.MAGIKUS_TABLA);
  if (!vanTabla) return html`<p className="halvany kicsi">A véletlen tárgyak táblái (Import 12 és 14) még nincsenek betöltve.</p>`;
  const dob = () => setFak(J.veletlenTargyFak(fajta, korny, { magikus: magikus && vanMagikus }));
  const fa = (kulcs, cim) => (fak && fak[kulcs] ? html`<div key=${kulcs}>
    <p className="cimke">${cim}</p>
    <ul className="generator__fa"><${FaSor} cs=${fak[kulcs]} ut=${[]} melyseg=${0} tablak=${tablak}
      onUjra=${(ut) => setFak({ ...fak, [kulcs]: G.ujradob(fak[kulcs], ut, korny) })}
      onValaszt=${(ut, i) => setFak({ ...fak, [kulcs]: G.valaszt(fak[kulcs], ut, i, korny) })}
      onElhagy=${(ut) => setFak({ ...fak, [kulcs]: G.elhagy(fak[kulcs], ut) })}/></ul>
  </div>` : null);
  const elfogad = () => {
    const ki = J.targyFakbol(fajta, fak, lapok);
    const jegyzet = Object.values(fak).filter(Boolean).map((x) => G.jegyzet(x)).join('\n');
    onElfogad(ki, jegyzet);
    setFak(null);
  };
  return html`<div className="verem kiemelt-doboz">
    <p className="cimke">Véletlen tárgy (Random Items, 78–80. oldal)</p>
    <div className="sorban sorban--kozep">
      <${Valaszto} label="Mi legyen?" value=${fajta} onChange=${(x) => { setFajta(x); setFak(null); }}
        opciok=${[{ value: 'fegyver', label: 'Fegyver' }, { value: 'pancel', label: 'Páncél' }, { value: 'pajzs', label: 'Pajzs' }]}/>
      <${Jelolo} checked=${magikus && vanMagikus} onChange=${setMagikus}>Mágikus tulajdonsággal${vanMagikus ? '' : ' (Import 14 kell)'}<//>
      <${K.Button} variant="secondary" onClick=${dob} icon=${html`<${Ikon} nev="sarkanykocka" meret=${18}/>`}>${fak ? 'Új dobás' : 'Dobás'}<//>
    </div>
    ${fak ? html`<div className="verem">
      ${fa('alap', fajta === 'fegyver' ? 'Fegyvercsoport (konkrét fegyver: d3 a csoportból az elfogadáskor)' : fajta === 'pancel' ? 'Páncél' : 'Pajzs')}
      ${fa('kidolgozottsag', 'Kidolgozottság')}
      ${fa('magikus', 'Mágikus tulajdonság (a mérték a sárkánykockától függ)')}
      <div className="gombsor gombsor--szoros"><${K.Button} variant="primary" onClick=${elfogad}>Elfogadom<//></div>
      <p className="halvany kicsi">Elfogadáskor a tárgy fajtája, alapja, kidolgozottsága, előnyei és az átok jele a mezőkbe kerül (a régiek helyére), a dobás menete az elem dobásai közé.
        A könyv tanácsa: a mesterremek vagy mágikus tárgynak adj egyedi nevet és jellegzetes külsőt.</p>
    </div>` : null}
  </div>`;
}

function TargyLepes({ elem, ix, valt, prep, cel, a, set, all, fig, lapok }) {
  const javasolt = J.targyRitkasag(a);
  const ervenyes = J.ervenyesRitkasag(a);
  const alapok = a.targy_fajta === 'fegyver' ? (lapok['Fegyverek'] || []).filter((s) => s.csoport || obj(s.reszletek).tipus === 'granat')
    : a.targy_fajta === 'pancel' ? (lapok['Páncélok'] || []).filter((s) => obj(s.reszletek).tipus === 'pancel')
      : a.targy_fajta === 'pajzs' ? (lapok['Páncélok'] || []).filter((s) => obj(s.reszletek).tipus === 'pajzs') : [];
  const atok = J.atokNorm(a.atok);
  const toltes = J.toltesNorm(a.toltes);
  const vanVarazslat = J.elonyokNorm(a.elonyok).some((e) => e.tipus === 'varazslat');
  const keretKikapcsolt = (prep.adat.keret && prep.adat.keret.keret && prep.adat.keret.keret.generator_kikapcsolt) || {};
  const elfogad = (ki, jegyzet) => {
    let e = elem;
    const ix2 = () => E.index(Array.from(ix.values()).filter((y) => y.id !== e.id).concat([e]));
    e = E.mezoBeallit(e, 'targy_fajta', ki.targy_fajta, ix2());
    e = E.mezoBeallit(e, 'alap_id', ki.alap_id, ix2());
    e = E.mezoBeallit(e, 'alap_nev', ki.alap_id ? '' : ki.alap_nev, ix2());
    e = E.mezoBeallit(e, 'kidolgozottsag', ki.kidolgozottsag, ix2());
    e = E.mezoBeallit(e, 'elonyok', ki.elonyok.map((x) => ({ ...x, id: ujAzon('me') })), ix2());
    if (ki.atok.van) e = E.mezoBeallit(e, 'atok', { ...atok, van: true }, ix2());
    if (!String(a.nev || '').trim() || /^Új /.test(a.nev)) {
      const k = B.KIDOLGOZOTTSAGOK[ki.kidolgozottsag];
      e = E.mezoBeallit(e, 'nev', (ki.alap_nev || 'Tárgy') + (k && ki.kidolgozottsag !== 'atlagos' ? ' (' + k.nev.toLowerCase() + ')' : ''), ix2());
    }
    const naplo = lista(E.megjelenitett(e, ix2()).dobasok).slice(-19).concat([{ ido: new Date().toISOString(), tabla: 'Véletlen tárgy', mezo: 'targy', jegyzet }]);
    e = { ...e, adat: { ...e.adat, dobasok: naplo } };
    valt(e);
  };
  return html`<${LepesPanel} lepes="targy" allapot=${all.targy}>
    <${VeletlenTargy} lapok=${lapok} kikapcsolt=${keretKikapcsolt} onElfogad=${elfogad}/>
    <div className="sorban">
      <${Valaszto} label=${cimkeJellel(elem, ix, 'targy_fajta', valt, 'Fajta')} value=${a.targy_fajta || ''} ures="válassz…" onChange=${(x) => set('targy_fajta', x)}
        opciok=${Object.entries(J.TARGY_FAJTAK).map(([value, label]) => ({ value, label }))}/>
      <${Valaszto} label=${cimkeJellel(elem, ix, 'tartos', valt, 'Tartósság')} value=${a.tartos || 'allando'} onChange=${(x) => set('tartos', x)}
        opciok=${Object.entries(J.TARTOSSAG).map(([value, label]) => ({ value, label }))}/>
    </div>
    <div className="sorban">
      ${alapok.length ? html`<${Valaszto} label=${cimkeJellel(elem, ix, 'alap_id', valt, 'Alapja (a szabályadatból)')} value=${a.alap_id || ''} ures="nincs" onChange=${(x) => set('alap_id', x)}
        opciok=${alapok.map((s) => ({ value: s.id, label: s.nev_hu }))}/>` : null}
      ${!a.alap_id ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="alap_nev" label="Alapja (szövegesen)" onValt=${valt} placeholder="például gyűrű, köpeny, pálca, főzet"/>` : null}
      ${a.targy_fajta && a.targy_fajta !== 'egyeb' ? html`<${Valaszto} label=${cimkeJellel(elem, ix, 'kidolgozottsag', valt, 'Kidolgozottság')} value=${a.kidolgozottsag || ''} ures="átlagos"
        onChange=${(x) => set('kidolgozottsag', x)} opciok=${Object.entries(B.KIDOLGOZOTTSAGOK).map(([value, k]) => ({ value, label: k.nev + ' (' + k.hatas + ')' }))}/>` : null}
    </div>
    <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="elonyok" norm=${J.elonyokNorm} cim="Előnyök (Alapkönyv 119.)"
      ures=${() => ({ tipus: 'tamadas', ertek: 1, mire: '', jegyzet: '' })} gomb="Új előny" uresSzoveg="Még nincs előny. Egy-két előny elég."
      sorTartalom=${(s, allit) => {
        const t = J.ELONY_TIPUSOK[s.tipus];
        return html`<div className="sorban">
          <${Valaszto} label="Előny" value=${s.tipus} onChange=${(x) => allit({ tipus: x })} opciok=${Object.entries(J.ELONY_TIPUSOK).map(([value, x]) => ({ value, label: x.nev }))}/>
          ${t.ertekes ? html`<${K.TextField} label="Mérték" type="number" min="1" max="5" className="szammezo" value=${String(s.ertek)} onChange=${(e) => allit({ ertek: szamVagyUres(e.target.value) })}/>` : null}
          ${t.mire ? html`<${K.TextField} label=${t.mire.charAt(0).toUpperCase() + t.mire.slice(1)} value=${s.mire} onChange=${(e) => allit({ mire: e.target.value })}/>` : null}
          <${K.TextField} label="Megjegyzés" value=${s.jegyzet} onChange=${(e) => allit({ jegyzet: e.target.value })}/>
          <span className="halvany kicsi">${J.RITKASAGOK[J.elonyRitkasag(s)].nev.toLowerCase()}</span>
        </div>`;
      }}/>
    <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="korlatozasok" norm=${J.korlatozasokNorm} cim="Korlátozások (Alapkönyv 120.)"
      ures=${() => ({ tipus: 'kepzettseg', szoveg: '', kuszob: '' })} gomb="Új korlátozás"
      uresSzoveg="A korlátozott tárgy egy fokkal gyakoribb; de ne legyen használhatatlan az összes hős számára."
      sorTartalom=${(s, allit) => html`<div className="sorban">
        <${Valaszto} label="Fajta" value=${s.tipus} onChange=${(x) => allit({ tipus: x })} hint=${J.KORLATOZASOK[s.tipus].leiras}
          opciok=${Object.entries(J.KORLATOZASOK).map(([value, x]) => ({ value, label: x.nev }))}/>
        ${s.tipus === 'kuszob' ? html`<${K.TextField} label="Küszöb" type="number" min="1" className="szammezo" value=${String(s.kuszob)} onChange=${(e) => allit({ kuszob: szamVagyUres(e.target.value) })}/>` : null}
        <${K.TextField} label="Részletek" value=${s.szoveg} onChange=${(e) => allit({ szoveg: e.target.value })}/>
      </div>`}/>
    <div className="verem">
      <${Jelolo} checked=${atok.van} onChange=${(x) => set('atok', { ...atok, van: x })}>Átkozott tárgy (80. oldal)<//>
      ${atok.van ? html`<div className="sorban">
        <${Valaszto} label="Melyik jelenettípusban" value=${atok.jelenet} ures="válassz…" onChange=${(x) => set('atok', { ...atok, jelenet: x })}
          opciok=${Object.entries(J.ATOK_JELENETEK).map(([value, label]) => ({ value, label }))}/>
        <${K.TextField} label="Büntetés minden próbára" type="number" min="-3" max="-1" className="szammezo" value=${String(atok.buntetes)}
          onChange=${(e) => set('atok', { ...atok, buntetes: szamVagyUres(e.target.value) })}/>
        <${K.TextField} label="Megjegyzés" value=${atok.jegyzet} onChange=${(e) => set('atok', { ...atok, jegyzet: e.target.value })}/>
      </div>
      <p className="halvany kicsi">A gazdája nem tud megválni tőle; Akaraterő (Önfegyelem) próbával a sárkánykockányi napig ellenállhat, addig ugyanekkora büntetéssel. A büntetés ne üsse ki az előnyt (támadásbónuszhoz ne harci büntetés).</p>` : null}
    </div>
    ${vanVarazslat || toltes.mp !== '' ? html`<div className="sorban">
      <${K.TextField} label="Töltés (Mágiapont)" type="number" min="0" className="szammezo" value=${String(toltes.mp)}
        hint="Általában ötszöri használatra elég (Charged Magic Items, 77. oldal)." onChange=${(e) => set('toltes', { ...toltes, mp: szamVagyUres(e.target.value) })}/>
      <${K.TextField} label="Visszatöltődés" value=${toltes.visszatoltes} placeholder=${ervenyes === 'legendas' ? '3d6 MP óránként' : ervenyes === 'ritka' ? '2d6 MP óránként' : '1d6 MP óránként'}
        onChange=${(e) => set('toltes', { ...toltes, visszatoltes: e.target.value })}/>
    </div>` : null}
    <div className="sorban sorban--kozep">
      <${Valaszto} label=${cimkeJellel(elem, ix, 'ritkasag', valt, 'Ritkaság')} value=${a.ritkasag || ''} ures=${'javasolt: ' + J.RITKASAGOK[javasolt].nev.toLowerCase()}
        onChange=${(x) => set('ritkasag', x)} hint=${J.RITKASAGOK[ervenyes].leiras}
        opciok=${Object.entries(J.RITKASAGOK).map(([value, r]) => ({ value, label: r.nev + ' (' + r.en + ')' }))}/>
    </div>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="tortenet" label="Története és külseje" multiline=${true} rows=${3} onValt=${valt}
      hint="Az állandó tárgy egyedi: ki készítette, kié volt, hogyan néz ki, mi a különös benne."/>
    <${Figyelmeztetesek} lista=${fig} lepes="targy"/>
  <//>`;
}

// ---- Ereklye ----
function EreklyeLepes({ elem, ix, valt, a, set, all, fig, lapok }) {
  const e = obj(a.ereklye);
  const fajta = J.EREKLYE_FAJTAK[e.fajta] ? e.fajta : 'nincs';
  const kep = J.kepessegekNorm(e.kepessegek);
  const mintak = mintaSorok(lapok, J.EREKLYE_MINTAK);
  const [minta, setMinta] = useState('');
  const [proba, setProba] = useState(5);
  const allit = (x) => set('ereklye', { ...e, ...x });
  const allitK = (l) => allit({ kepessegek: l });
  const nyitva = J.ereklyeAllapot(a, proba, false);
  return html`<${LepesPanel} lepes="ereklye" allapot=${all.ereklye}>
    <div className="valasztokartyak">${Object.entries(J.EREKLYE_FAJTAK).map(([k, m]) => html`<button key=${k} type="button"
      className=${'valasztokartya' + (fajta === k ? ' valasztokartya--aktiv' : '')} aria-pressed=${fajta === k} onClick=${() => allit({ fajta: k })}>
      <strong>${m.nev}</strong>${m.en ? html` <span className="halvany kicsi">(${m.en})</span>` : null}${m.leiras ? html`<br/><span className="kicsi">${m.leiras}</span>` : null}</button>`)}</div>
    ${fajta !== 'nincs' ? html`
      ${fajta !== 'lepcsos' ? html`<${K.TextField} label="Mi nyitja meg? (feltétel)" multiline=${true} rows=${2} value=${e.feltetel || ''} onChange=${(x) => allit({ feltetel: x.target.value })}
        placeholder="például fürdesd meg egy sárkány vérében; vagy ragadd meg és sújts le egy élőre"/>` : null}
      <div className="verem">
        <p className="cimke">Képességek (Companion 62–63.)</p>
        ${kep.length ? html`<ul className="sorlista">${kep.map((k, i) => html`<li key=${k.id} className="sorlista__sor sorlista__sor--fuggoleges jelenet__listasor">
          <div className="sorban">
            <${K.TextField} label="Név" value=${k.nev} onChange=${(x) => allitK(kep.map((y, j) => (j === i ? { ...y, nev: x.target.value } : y)))}/>
            ${fajta !== 'zart' ? html`<${K.TextField} label="Szinten nyílik" type="number" min="1" max="20" className="szammezo" value=${String(k.szint)}
              placeholder=${fajta === 'lepcsos' ? 'sorrend' : 'feltétel'} onChange=${(x) => allitK(kep.map((y, j) => (j === i ? { ...y, szint: szamVagyUres(x.target.value) } : y)))}/>` : null}
            <span className="halvany kicsi">${nyitva[i] && nyitva[i].nyitva ? proba + '. szinten nyitva' : proba + '. szinten zárva'}</span>
          </div>
          <${K.TextField} label="Mit tud?" multiline=${true} rows=${2} value=${k.leiras} onChange=${(x) => allitK(kep.map((y, j) => (j === i ? { ...y, leiras: x.target.value } : y)))}/>
          <div className="gombsor gombsor--szoros">
            ${kisGomb('↑', 'Feljebb', () => allitK(mozgat(kep, i, -1)), i === 0)}
            ${kisGomb('↓', 'Lejjebb', () => allitK(mozgat(kep, i, 1)), i === kep.length - 1)}
            <${K.Button} size="sm" variant="quiet" onClick=${() => allitK(kep.filter((_, j) => j !== i))}>Törlés<//>
          </div>
        </li>`)}</ul>` : html`<p className="halvany kicsi">Még nincs képesség.</p>`}
        <div className="sorban">
          ${mintak.length ? html`<${Valaszto} label="Képesség a mintákból" value=${minta} onChange=${setMinta} ures="Válassz…"
            opciok=${mintak.map((m, i) => ({ value: String(i), label: m.e + ' (' + m.en + ')' }))}/>` : null}
          <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${16}/>`} onClick=${() => {
            const m = minta !== '' ? mintak[Number(minta)] : null;
            allitK(kep.concat([{ id: ujAzon('ek'), nev: m ? m.e : '', kulcs: m ? obj(m.ertek).kulcs : '', szint: '', feltetel: '', leiras: m ? obj(m.ertek).leiras : '' }]));
            setMinta('');
          }}>${minta !== '' ? 'Felveszem' : 'Új képesség'}<//>
        </div>
      </div>
      ${fajta === 'lepcsos' || fajta === 'vegyes' ? html`<div className="sorban sorban--kozep">
        <${K.TextField} label="Próba: a viselő szintje" type="number" min="1" max="20" className="szammezo" value=${String(proba)} onChange=${(x) => setProba(Number(x.target.value) || 1)}/>
        <span className="halvany kicsi">${nyitva.filter((x) => x.nyitva).length} / ${kep.length} képesség nyitva${fajta === 'vegyes' ? ' (a feltétel nélkül)' : ''}. Lépcsős szintek: ${J.LEPCSOS_SZINTEK.join(', ')}.</span>
      </div>` : null}
      <${Jelolo} checked=${!!e.hangolodas} onChange=${(x) => allit({ hangolodas: x })}>Ráhangolódás (választható szabály): alkalmanként egy újabb képesség nyílik meg, amíg el nem éri a szint szerintit<//>
      <${K.TextField} label="Korlátok (Limitations)" multiline=${true} rows=${2} value=${e.korlatok || ''} onChange=${(x) => allit({ korlatok: x.target.value })}
        hint="Csak bizonyos körülmények között működik (éjjel, szent helyen, ha a viselője megtartja az esküjét); néhány képesség mindig, a többi csak ekkor."/>
    ` : html`<p className="halvany kicsi">Az ereklye a Companion haladó jutalma: a viselőjével együtt erősödik. A Kampányépítő szerint a legendás tárgyakat és az ereklyéket céllal kell megalkotni, nem dobással.</p>`}
    <${Figyelmeztetesek} lista=${fig} lepes="ereklye"/>
  <//>`;
}

// ---- Kincs ----
function KincsLepes({ elem, ix, valt, a, set, all, fig }) {
  const javasolt = a.iv ? J.SAV_KINCS[a.iv] || [] : [];
  const bank = a.kategoria ? J.bankolas(a.kategoria) : null;
  const dob = () => {
    const d = J.kincsDobas(a.kategoria);
    if (!d) return;
    let e = E.mezoBeallit(elem, 'ertek_ezust', d.ezust, ix);
    const naplo = lista(E.megjelenitett(e, ix).dobasok).slice(-19).concat([{ ido: new Date().toISOString(), tabla: 'Kincs: ' + J.KINCS_KATEGORIAK[a.kategoria].nev, mezo: 'ertek_ezust', jegyzet: d.szoveg }]);
    e = { ...e, adat: { ...e.adat, dobasok: naplo } };
    valt(e);
  };
  return html`<${LepesPanel} lepes="kincs" allapot=${all.kincs}>
    <div className="sorban sorban--kozep">
      <${Valaszto} label=${cimkeJellel(elem, ix, 'kategoria', valt, 'Kincskategória (Alapkönyv 118.)')} value=${a.kategoria || ''} ures="válassz…" onChange=${(x) => set('kategoria', x)}
        opciok=${Object.entries(J.KINCS_KATEGORIAK).map(([value, k]) => ({ value, label: k.nev + ' (' + k.en + '): ' + J.kincsKepletSzoveg(value) + (javasolt.includes(value) ? ' ★' : '') }))}
        hint=${javasolt.length ? '★ a szintsávhoz illik.' : 'Szintsáv nélkül nincs javaslat.'}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!a.kategoria} onClick=${dob} icon=${html`<${Ikon} nev="sarkanykocka" meret=${16}/>`}>Érték dobása<//>
    </div>
    <${K.TextField} label=${cimkeJellel(elem, ix, 'ertek_ezust', valt, 'Érték (ezüst)')} type="number" min="0" className="szammezo"
      value=${a.ertek_ezust === undefined ? '' : String(a.ertek_ezust)} onChange=${(e) => set('ertek_ezust', szamVagyUres(e.target.value))}/>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="forma" label="Miből áll?" multiline=${true} rows=${2} onValt=${valt}
      placeholder="például 40 ezüst, egy rubinos gyűrű, egy ritka fűszeres láda" hint="A nagyobb értéket érdemes kisebb, hordozható értékekbe sűríteni."/>
    ${bank ? html`<p className="halvany kicsi">Vagyonrendszer (78. oldal): aki ennek a kategóriának a legkisebb értékét (${bank.kell} ezüst) tízszer befekteti (összesen ${bank.osszesen} ezüst),
      ${bank.jovedelem ? 'havonta ' + J.KINCS_KATEGORIAK[bank.jovedelem].nev.toLowerCase() + ' kincsnyi jövedelmet kap (' + J.kincsKepletSzoveg(bank.jovedelem) + ')' : 'ebből nem lesz jövedelem (ez a legkisebb kategória)'};
      a jövedelem fele fedezi az ilyen szintű életmódot.</p>` : null}
    <${Figyelmeztetesek} lista=${fig} lepes="kincs"/>
  <//>`;
}

// ---- Megnyitás és elvesztés ----
function MegnyitasLepes({ elem, ix, valt, cel, a, set, all, fig }) {
  const { njkk } = useNjkkKarakterek(cel);
  const m = lista(a.megnyitas);
  return html`<${LepesPanel} lepes="megnyitas" allapot=${all.megnyitas}>
    <${Kartyak} elem=${elem} ix=${ix} valt=${valt} mezo="megnyitas" tobb=${true} opciok=${J.MEGNYITASOK} cim="Hogyan jutnak hozzá?"/>
    ${m.includes('adomanyozas') ? html`<div className="sorban">
      <${ElemMezo} elem=${elem} ix=${ix} mezo="adomanyozo" label="Ki adományozza?" onValt=${valt} placeholder="például a hercegnő, a rend nagymestere, egy istennő"/>
      <${Valaszto} label=${cimkeJellel(elem, ix, 'adomanyozo_njk', valt, 'NJK')} value=${a.adomanyozo_njk || ''} ures="nincs" onChange=${(x) => set('adomanyozo_njk', x)}
        opciok=${njkk.map((n) => ({ value: n.id, label: n.nev }))}/>
    </div>
    <${ElemMezo} elem=${elem} ix=${ix} mezo="feltetelek" label="Feltételek, kötelezettségek" multiline=${true} rows=${2} onValt=${valt} placeholder="eskü, törvényes kötelesség, szolgálat"/>
    <${Jelolo} checked=${!!a.visszavonhato} onChange=${(x) => set('visszavonhato', x)}>Visszavonható (az adományozó elveheti)<//>
    ${a.visszavonhato ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="visszavonas" label="Mikor vonhatja vissza?" onValt=${valt}/>` : null}` : null}
    ${m.includes('hangolodas') ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="hangolodas" label="Ráhangolódás: mennyi idő, mi kell hozzá?" multiline=${true} rows=${2} onValt=${valt}
      placeholder="például egy holdhónap, szertartás 50 ezüst értékű összetevővel, összetett Akaraterő próba"/>` : null}
    ${m.includes('kepzes') ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="kepzes" label="Képzés: mennyi idő és milyen erőforrás?" multiline=${true} rows=${2} onValt=${valt}
      placeholder="például két hét egy mesternél (aki fizetséget kér), könyvtár, gyakorlótér"/>` : null}
    ${m.includes('hangolodas') || m.includes('kepzes') ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="proba" label="Próba hozzá (ha kell)" onValt=${valt}
      placeholder="például összetett Intelligencia (Arkánumtan) próba, 15-ös küszöb"/>` : null}
    <${ElemMezo} elem=${elem} ix=${ix} mezo="elveszhet" label="Hogyan veszhet el, vagy mikor nem ér semmit?" multiline=${true} rows=${2} onValt=${valt}
      hint="Erőforrásként a jutalom elfogyhat, elveszhet, visszavonható; egy távoli földön a cím és a birtok nem segít."/>
    <${Figyelmeztetesek} lista=${fig} lepes="megnyitas"/>
  <//>`;
}

// A jutalom a könyv lépései szerint (az elemszerkesztő lépéses módja).
SAJAT_LEPESEK.jutalom = {
  lepesek: ({ elem, ix }) => {
    const a = E.megjelenitett(elem, ix);
    const all = J.lepesAllapot(a);
    return J.lepesKulcsok(a).map((k) => ({ kulcs: k, nev: J.JUTALOM_LEPESEK[k].nev, allapot: all[k] }));
  },
  tartalom: (lepes, p) => html`<${JutalomMezok} key=${lepes} lepes=${lepes} ...${p}/>`
};

// ================= Új jutalom =================

export function UjJutalomParbeszed({ prep, cel, fajta: kezdoFajta, iv: kezdoIv, onBezar, maradj }) {
  const [fajta, setFajta] = useState(kezdoFajta || 'cim');
  const [iv, setIv] = useState(kezdoIv || '');
  return html`<${UjElemParbeszed} prep=${prep} cel=${cel} tipusok=${['jutalom']} onBezar=${onBezar} maradj=${maradj}
    cim=${'Új jutalom: ' + J.FAJTAK[fajta].nev.toLowerCase()}
    elokeszit=${(e, { alapbol, ix }) => {
      let x = e;
      if (!alapbol || !E.mezoErtek(x, 'fajta', ix).ertek) x = E.mezoBeallit(x, 'fajta', fajta, ix);
      if (iv && (!alapbol || !E.mezoErtek(x, 'iv', ix).ertek)) x = E.mezoBeallit(x, 'iv', iv, E.index(Array.from(ix.values()).filter((y) => y.id !== x.id).concat([x])));
      return x;
    }}
    extra=${html`<div className="sorban">
      <${Valaszto} label="Fajta" value=${fajta} onChange=${setFajta} hint=${J.FAJTAK[fajta].leiras}
        opciok=${Object.entries(J.FAJTAK).map(([value, f]) => ({ value, label: f.nev }))}/>
      <${Valaszto} label="Szintsáv" value=${iv} onChange=${setIv} ures="később"
        opciok=${J.SAVOK.map((s) => ({ value: s.kulcs, label: s.nev + ' (' + s.tol + '–' + s.ig + '.)' }))}/>
    </div>`}/>`;
}

// ================= Jutalomtérkép =================

function JutalomLink({ e, prep, cel }) {
  const a = E.megjelenitett(e, prep.ix);
  const csoport = a.csoport_id && prep.ix.get(a.csoport_id) ? E.nev(prep.ix.get(a.csoport_id), prep.ix) : '';
  return html`<li className="jutalomracs__elem">
    <a href=${elemUt(cel, e.id)}>${E.nev(e, prep.ix)}</a>
    ${cel.szint !== E.szint(e) ? html` <${SzintJel} elem=${e}/>` : null}
    ${e.aktiv === false ? html` <span className="halvany kicsi">archivált</span>` : null}
    <span className="halvany kicsi"> ${J.osszefoglalo(a, { csoport }).split(', ').slice(1).join(', ')}</span>
  </li>`;
}

// A jutalomtérkép rácsa: szintsávonként és fajtánként a jutalomelemek, és (a keretben) a munkalap szövegei.
// keret: { k, allit } a kampánykeret szerkesztőjéből, vagy null (a Jutalmak fülön, ahol a terv csak olvasható).
export function JutalomRacs({ prep, cel, elemek, keret, csakAktiv }) {
  const [uj, setUj] = useState(null);
  const megj = (x) => E.megjelenitett(x, prep.ix);
  const t = J.terkep(elemek, megj);
  const k = keret ? keret.k : KR.normalizal(prep.adat.keret ? prep.adat.keret.keret : {});
  const savok = J.SAVOK.filter((s) => !csakAktiv || KR.ivAktiv(s, k));
  const nincsDb = J.FAJTA_KULCSOK.concat(['_nincs']).reduce((n, f) => n + t._nincs[f].length, 0);
  const cella = (sv, c) => html`${t[sv.kulcs][c.kulcs].length ? html`<ul className="jutalomracs__lista">${t[sv.kulcs][c.kulcs].map((e) => html`<${JutalomLink} key=${e.id} e=${e} prep=${prep} cel=${cel}/>`)}</ul>` : null}
    <button type="button" className="szoveggomb" onClick=${() => setUj({ fajta: c.kulcs, iv: sv.kulcs })}>+ ${J.FAJTAK[c.kulcs].nev.toLowerCase()}</button>`;
  const ujPar = uj ? html`<${UjJutalomParbeszed} prep=${prep} cel=${cel} fajta=${uj.fajta} iv=${uj.iv} onBezar=${() => setUj(null)}/>` : null;
  // a kampánykereten (keskeny oszlop): szintsávonként lenyíló rész, a munkalap öt mezőjével
  if (keret) {
    return html`<div className="verem">
      ${savok.map((sv) => {
        const db = KR.JUTALOM_OSZLOPOK.reduce((n, c) => n + t[sv.kulcs][c.kulcs].length, 0);
        const kitoltve = KR.JUTALOM_OSZLOPOK.some((c) => String(k.jutalomterkep[sv.kulcs][c.kulcs] || '').trim());
        return html`<details key=${sv.kulcs} className="lenyilo keret__iv" open=${sv.kulcs === savok[0].kulcs || kitoltve || db ? true : undefined}>
          <summary>${sv.nev} (${sv.en}), ${sv.tol}–${sv.ig}. szint${db ? html` <span className="halvany kicsi">· ${db} jutalomelem</span>` : null}</summary>
          <p className="halvany kicsi">${J.SAV_MERFOLDKO[sv.kulcs]} Illő tárgy: ${J.SAV_RITKASAG[sv.kulcs].map((r) => J.RITKASAGOK[r].nev.toLowerCase()).join(' vagy ')}; kincs: ${J.SAV_KINCS[sv.kulcs].map((r) => J.KINCS_KATEGORIAK[r].nev.toLowerCase()).join(' vagy ')}.</p>
          <div className="urlap-racs">${KR.JUTALOM_OSZLOPOK.map((c) => html`<div key=${c.kulcs} className="verem">
            <${K.TextField} label=${c.nev + ' (' + c.en + ')'} multiline=${true} rows=${2} value=${k.jutalomterkep[sv.kulcs][c.kulcs]}
              onChange=${(e) => keret.allit('jutalomterkep.' + sv.kulcs + '.' + c.kulcs, e.target.value)}/>
            <div>${cella(sv, c)}</div>
          </div>`)}</div>
        </details>`;
      })}
      ${ujPar}
    </div>`;
  }
  return html`<div className="verem">
    <div className="tablazat-keret"><table className="tablazat jutalomracs">
      <thead><tr><th>Szintsáv</th>${KR.JUTALOM_OSZLOPOK.map((c) => html`<th key=${c.kulcs}>${c.nev}</th>`)}</tr></thead>
      <tbody>${savok.map((s) => html`<tr key=${s.kulcs} className=${KR.ivAktiv(s, k) ? '' : 'tablazat__sor--halvany'}>
        <td><strong>${s.nev}</strong><br/><span className="halvany kicsi">${s.tol}–${s.ig}. szint</span>
          <br/><span className="halvany kicsi">${J.SAV_RITKASAG[s.kulcs].map((r) => J.RITKASAGOK[r].nev.toLowerCase()).join(', ')} tárgy; ${J.SAV_KINCS[s.kulcs].map((r) => J.KINCS_KATEGORIAK[r].nev.toLowerCase()).join(', ')} kincs</span></td>
        ${KR.JUTALOM_OSZLOPOK.map((c) => html`<td key=${c.kulcs} className="jutalomracs__cella">
          ${k.jutalomterkep[s.kulcs][c.kulcs] ? html`<p className="kicsi jutalomracs__terv">${k.jutalomterkep[s.kulcs][c.kulcs]}</p>` : null}
          ${cella(s, c)}
        </td>`)}
      </tr>`)}</tbody>
    </table></div>
    ${nincsDb ? html`<div>
      <p className="cimke">Szintsáv nélkül (${nincsDb})</p>
      <ul className="jutalomracs__lista">${J.FAJTA_KULCSOK.concat(['_nincs']).flatMap((f) => t._nincs[f]).map((e) => html`<${JutalomLink} key=${e.id} e=${e} prep=${prep} cel=${cel}/>`)}</ul>
    </div>` : null}
    <details className="lenyilo"><summary>A szintsávok mérföldkövei (71. oldal)</summary>
      <dl className="szerep-lista kicsi">${J.SAVOK.map((s) => html`<div key=${s.kulcs}><dt><strong>${s.nev}</strong></dt><dd>${J.SAV_MERFOLDKO[s.kulcs]}</dd></div>`)}</dl>
    </details>
    ${ujPar}
  </div>`;
}

// A kampány Jutalmak füle: a jutalomtérkép a kampány (és a világ) jutalmaival.
export function JutalmakNezet({ prep, cel }) {
  const [vilagEs, setVilagEs] = useState(true);
  const [archivalt, setArchivalt] = useState(false);
  const [csakAktiv, setCsakAktiv] = useState(true);
  const vid = (prep.adat.keret && prep.adat.keret.keret && prep.adat.keret.keret.vilag_id) || '';
  const sajat = prep.adat.elemek.filter((e) => e.tipus === 'jutalom' && e.kampany_id === cel.kampany_id);
  const vilagbol = vid ? prep.adat.elemek.filter((e) => e.tipus === 'jutalom' && e.vilag_id === vid && !e.kampany_id) : [];
  const mutatott = sajat.concat(vilagEs ? vilagbol : []).filter((e) => archivalt || e.aktiv !== false);
  const archivDb = sajat.concat(vilagbol).filter((e) => e.aktiv === false).length;
  return html`<div className="verem">
    <${K.Panel} title="Jutalomtérkép (Reward Mapping)">
      <div className="verem">
        <p className="sugo"><span>${KR.LEPESEK.find((l) => l.kulcs === 'jutalmak').utmutato} A terv szövegei a <a href=${'#/dm/kampany/' + cel.kampany_id + '/epito/keret'}>kampánykereten</a> szerkeszthetők.</span></p>
        <div className="cimkek">
          ${vilagbol.length ? html`<${Jelolo} checked=${vilagEs} onChange=${setVilagEs}>A világ jutalmai is (${vilagbol.length})<//>` : null}
          ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
          <${Jelolo} checked=${csakAktiv} onChange=${setCsakAktiv}>Csak a tervezett szintsáv<//>
        </div>
        <${JutalomRacs} prep=${prep} cel=${cel} elemek=${mutatott} csakAktiv=${csakAktiv}/>
      </div>
    <//>
    <${K.Panel} title="A könyv szerint">
      <p className="szoveg">A jutalom kétféle: mérföldkő (cél és elismerés) és játékbeli előny (erőforrás). Nem kell mindenkinek ugyanolyan jutalom, és túl sok sem kell;
        a jutalomtérkép segít előre látni, mire lesz szükség. A mágikus tárgyak ritkasága és a kincskategória a szintsávhoz illeszkedjen. A kiosztás és a karakterlapra írás a játék közben,
        a Kampányjátszóval jön (6. lépés).</p>
    <//>
  </div>`;
}

// ================= Kötés a kalandokhoz és jelenetekhez =================

// A kaland, rész vagy jelenet jutalmai (kapcsolat: jutalma; honnan a jutalom, hova ez az elem).
export function JutalomKotes({ elem, prep, cel }) {
  const [valasztott, setValasztott] = useState('');
  const [uj, setUj] = useState(false);
  const kotesek = J.jutalmaiOf(elem.id, prep.adat.kapcsolatok || []);
  const jeloltek = prep.adat.elemek.filter((e) => e.tipus === 'jutalom' && e.aktiv !== false && !kotesek.some((k) => k.honnan === e.id));
  const kot = (id) => {
    if (!id) return;
    prep.kapcsolatMent({ id: ujAzon('ln'), honnan: id, hova: elem.id, tipus: 'jutalma', megjegyzes: '',
      vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' }).catch(() => {});
    setValasztott('');
  };
  return html`<div className="verem">
    <p className="cimke">Jutalomelemek</p>
    ${kotesek.length ? html`<ul className="sorlista">${kotesek.map((k) => {
      const j = prep.ix.get(k.honnan);
      const a = j ? E.megjelenitett(j, prep.ix) : {};
      return html`<li key=${k.id} className="sorlista__sor">
        <div>${j ? html`<a className="sorlista__nev" href=${elemUt(cel, j.id)}>${E.nev(j, prep.ix)}</a>` : html`<span className="halvany">törölt jutalom</span>`}
          ${j ? html`<div className="halvany kicsi">${J.osszefoglalo(a)}${J.savOf(a.iv) ? ', ' + J.savOf(a.iv).nev.toLowerCase() + ' sáv' : ''}</div>` : null}</div>
        <${K.Button} size="sm" variant="quiet" onClick=${() => prep.kapcsolatTorol(k.id).catch(() => {})}>Kötés törlése<//>
      </li>`;
    })}</ul>` : null}
    <div className="sorban sorban--kozep">
      ${jeloltek.length ? html`<${Valaszto} label="Meglévő jutalom" value=${valasztott} onChange=${setValasztott} ures="Válassz…"
        opciok=${jeloltek.map((j) => ({ value: j.id, label: E.nev(j, prep.ix) + ' (' + J.osszefoglalo(E.megjelenitett(j, prep.ix)) + ')' }))}/>` : null}
      ${jeloltek.length ? html`<${K.Button} size="sm" variant="secondary" disabled=${!valasztott} onClick=${() => kot(valasztott)}>Kötés<//>` : null}
      <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${16}/>`} onClick=${() => setUj(true)}>Új jutalom<//>
    </div>
    <p className="halvany kicsi">Cím, tagság, társ, mágikus tárgy vagy kincs, a jutalomtérképen is látszik. A kiosztás a 6. lépésben, játék közben.</p>
    ${uj ? html`<${UjJutalomParbeszed} prep=${prep} cel=${cel} maradj=${true} onBezar=${(e) => { setUj(false); if (e) kot(e.id); }}/>` : null}
  </div>`;
}

// ================= A bolt mágikus kínálata =================

// A „Mágikus kínálat” üzletrészlet tárgyai (53. oldal): a bolt típusa szerinti véletlen tárgyak mágikus tulajdonsággal,
// egyedi tételként a kínálatba (ár nélkül: a könyv szerint „ennek megfelelő áron”, a DM adja meg).
export function magikusTetelek(a, lapok, db, opciok = {}) {
  const tablak = tablakBol(lapok);
  const korny = { tablak, rng: opciok.rng || Math.random, kikapcsolt: opciok.kikapcsolt || {} };
  const tipusok = B.tipusokOf(a);
  const fajtak = tipusok.includes('fegyverkovacs') ? ['fegyver'] : tipusok.includes('pancelkovacs') ? ['pancel', 'pajzs'] : [];
  const ki = [];
  for (let i = 0; i < db; i++) {
    const fajta = fajtak.length ? fajtak[i % fajtak.length] : '';
    let nev = 'Mágikus tárgy';
    const fak = fajta ? J.veletlenTargyFak(fajta, korny, { magikus: true }) : { magikus: G.general(J.MAGIKUS_TABLA, korny) };
    const t = J.targyFakbol(fajta || 'egyeb', fak, lapok, korny.rng);
    // a fegyverkovács a saját fegyvercsoportjaiból ad (nem a teljes táblából)
    const sajatCsoportok = lista(a.fegyvercsoportok);
    if (fajta === 'fegyver' && sajatCsoportok.length) {
      const f = J.fegyverValaszt(sajatCsoportok[Math.floor(korny.rng() * sajatCsoportok.length)], lapok, korny.rng);
      if (f) { t.alap_id = f.id; t.alap_nev = f.nev_hu; t.nincs = false; }
    }
    if (t.alap_nev && !t.nincs) nev = t.alap_nev;
    const kid = B.KIDOLGOZOTTSAGOK[t.kidolgozottsag];
    const elonyok = t.elonyok.map((e) => {
      const tp = J.ELONY_TIPUSOK[e.tipus];
      return tp.nev + (tp.ertekes && e.ertek !== '' ? ' ' + elojel(e.ertek) : '') + (e.mire ? ' (' + e.mire + ')' : '');
    });
    ki.push({ id: ujAzon('kt'), forras: 'egyedi', tetel: '', nev: 'Mágikus: ' + nev + (kid && t.kidolgozottsag !== 'atlagos' ? ' (' + kid.nev.toLowerCase() + ')' : ''),
      lista_rez: null, darab: 1, ar_rez: null, megj: elonyok.join(', ') + (t.atok.van ? ', átkozott' : '') + (fajta ? '' : '; a tárgy fajtáját a DM választja') });
  }
  return ki;
}
