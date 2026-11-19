// Kampányépítő (DM, 5.8 alépés, isteni rész): vallások, istenek és kultuszok a Kampányépítő könyv 8. fejezete (Building the
// Divine) szerint, a Companion isteni mágiájával. Az `istenseg` elem lépéses szerkesztője fajtánként (vallás, isten,
// kultusz), a vallásfa (istenek és felekezetek a vallás alatt), a panteon kötelékei (kapcsolatok, dobással a kapcsolattáblán),
// az imádók (`imadja` kapcsolat), az ünnepek és a fejezet dobótáblái (Import 15). A kampány Isteni füle és a világ oldalának
// „A világ hitei” panele. Tiszta függvények: web/js/kampany/isteni.js. Terv: claude/kampanyepito-terv.md, „8. fejezet”.
import { html, K, useApp, useState, useMemo, Ikon, Uzenet, Valaszto, Jelolo } from './kozos.js';
import { Csip } from './varazslo_lepesek.js';
import { FaSor, tablakBol } from './dobotabla.js';
import * as E from '../kampany/elem.js';
import * as IS from '../kampany/isteni.js';
import * as KP from '../kampany/kapcsolat.js';
import * as G from '../kampany/generator.js';
import { useDm } from './dm.js';
import { SAJAT_LEPESEK, VILAG_PANELEK, ElemMezo, OroklesJel, UjElemParbeszed, elemUt, ujAzon, SzintJel, useNevFeloldo } from './epito.js';

const PONT = { kesz: ['kaland__pont kaland__pont--kesz', '✓'], resz: ['kaland__pont kaland__pont--resz', '…'], ures: ['kaland__pont', ''] };
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};
const lista = (x) => (Array.isArray(x) ? x : []);
const kisGomb = (felirat, cim, onClick, disabled) => html`<button type="button" className="kisgomb" aria-label=${cim} title=${cim}
  disabled=${disabled} onClick=${onClick}>${felirat}</button>`;
const mozgat = (l, i, d) => { const j = i + d; if (j < 0 || j >= l.length) return l; const m = l.slice(); [m[i], m[j]] = [m[j], m[i]]; return m; };
const kikapcsoltOf = (prep, cel) => (cel.szint === 'kampany' && prep.adat.keret && prep.adat.keret.keret ? prep.adat.keret.keret.generator_kikapcsolt || {} : {});
const celAzonok = (cel) => ({ vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' });
const megjOf = (prep) => (x) => E.megjelenitett(x, prep.ix);
// Az isteni mutatványok kampánybeállítása (null, ha nem kampányban vagyunk).
function useIsteniMutatvany(cel) {
  const dm = useDm();
  if (cel.szint !== 'kampany' || !dm || !dm.kampanyok) return null;
  const k = dm.kampanyok.find((x) => x.id === cel.kampany_id);
  return !!(k && k.beallitasok && k.beallitasok.mutatvanyok && k.beallitasok.mutatvanyok.isteni === true);
}

function LepesPanel({ lepes, allapot, children, actions }) {
  const l = IS.ISTENI_LEPESEK[lepes];
  const p = PONT[allapot || 'ures'];
  return html`<${K.Panel} actions=${actions} title=${html`${allapot ? html`<span className=${p[0]} aria-label=${allapot === 'kesz' ? 'kitöltve' : allapot === 'resz' ? 'részben kitöltve' : 'üres'}>${p[1]}</span> ` : null}${l.nev} <span className="halvany keret__en">(${l.en}, ${/^\d/.test(l.oldal) ? l.oldal + '. oldal' : l.oldal})</span>`}>
    <div className="verem"><p className="sugo">${l.utmutato}</p>${children}</div>
  <//>`;
}

const cimkeJellel = (elem, ix, mezo, valt, szoveg) => html`${szoveg} <${OroklesJel} info=${E.mezoErtek(elem, mezo, ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, mezo))}/>`;
const Figyelmeztetesek = ({ lista: l, lepes }) => l.filter((f) => f.lepes === lepes).map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f.szoveg}<//>`);

// Listás mező: sorok mezőkkel, sorrend, törlés, hozzáadás. A teljes lista egyben öröklődik.
function ListaMezo({ elem, ix, valt, mezo, norm, cim, ures, gomb, sorTartalom, uresSzoveg }) {
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
      onClick=${() => allit(l.concat([{ ...ures(), id: ujAzon(mezo.slice(0, 2)) }]))}>${gomb}<//></div>
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

// Dobás egy táblán: eredményfa, Elfogadom és Elvetem. onElfogad(fa).
function Dobas({ tablaId, prep, cel, felirat, onElfogad, magyarazat }) {
  const { szabalyok } = useApp();
  const tablak = useMemo(() => tablakBol(lapokBol(szabalyok)), [szabalyok]);
  const korny = { tablak, kikapcsolt: kikapcsoltOf(prep, cel) };
  const [fa, setFa] = useState(null);
  const vanTabla = !!G.tablaKeres(tablak, tablaId);
  if (!vanTabla) return html`<p className="halvany kicsi">A fejezet dobótáblái (Import 15) még nincsenek a Szabályadatbázisban; addig kézzel töltsd ki.</p>`;
  return html`<div className="verem">
    <div className="gombsor gombsor--szoros">
      <${K.Button} size="sm" variant="secondary" onClick=${() => setFa(G.general(tablaId, korny))}
        icon=${html`<${Ikon} nev="sarkanykocka" meret=${16}/>`}>${fa ? 'Új dobás' : felirat}<//>
      ${fa ? html`<${K.Button} size="sm" variant="primary" onClick=${() => { onElfogad(fa); setFa(null); }}>Felveszem<//>
        <${K.Button} size="sm" variant="quiet" onClick=${() => setFa(null)}>Elvetem<//>` : null}
    </div>
    ${fa ? html`<div className="javaslatdoboz verem">
      <ul className="generator__fa"><${FaSor} cs=${fa} ut=${[]} melyseg=${0} tablak=${tablak}
        onUjra=${(ut) => setFa(G.ujradob(fa, ut, korny))} onValaszt=${(ut, i) => setFa(G.valaszt(fa, ut, i, korny))} onElhagy=${(ut) => setFa(G.elhagy(fa, ut))}/></ul>
      ${magyarazat ? html`<p className="halvany kicsi">${magyarazat}</p>` : null}
    </div>` : null}
  </div>`;
}

// A dobás menete az elem dobásai közé.
const naplozva = (e, fa, mezo) => ({ ...e, adat: { ...e.adat, dobasok: lista(e.adat.dobasok).slice(-19).concat([{ ido: new Date().toISOString(), tabla: fa.nev, mezo, jegyzet: G.jegyzet(fa) }]) } });

// A tartományok csipként, kézi felvétellel a tábla soraiból és dobással.
function Tartomanyok({ elem, ix, valt, prep, cel, tablaId = IS.ISTEN_TABLA, cim = 'Tartományok (Domain)' }) {
  const { szabalyok } = useApp();
  const tabla = (lapokBol(szabalyok)['Dobótáblák'] || []).find((t) => t.id === IS.TARTOMANY_TABLA);
  const [kezi, setKezi] = useState('');
  const t = IS.tartomanyokNorm(E.mezoErtek(elem, 'tartomanyok', ix).ertek);
  const allit = (l) => valt(E.mezoBeallit(elem, 'tartomanyok', l, ix));
  const sorok = tabla ? (G.reszletek(tabla).sorok || []) : [];
  const hozzaad = (nev, en) => { if (!nev.trim() || t.some((x) => x.nev === nev)) return; allit(t.concat([{ id: ujAzon('tm'), nev: nev.trim(), en: en || '' }])); };
  return html`<div className="verem">
    <p className="cimke">${cimkeJellel(elem, ix, 'tartomanyok', valt, cim)}</p>
    ${t.length ? html`<div className="cimkek">${t.map((x) => html`<span key=${x.id} className="csip csip--statikus">${x.nev}${x.en ? html` <span className="halvany kicsi">(${x.en})</span>` : null}
      <button type="button" className="csip__gomb" aria-label=${x.nev + ' törlése'} onClick=${() => allit(t.filter((y) => y.id !== x.id))}>×</button></span>`)}</div>`
      : html`<p className="halvany kicsi">Még nincs tartomány.</p>`}
    <div className="sorban">
      ${sorok.length ? html`<${Valaszto} label="Tartomány a táblából" value="" ures="Válassz…" onChange=${(i) => { const s = sorok[Number(i)]; if (s) hozzaad(s.e, s.en); }}
        opciok=${sorok.map((s, i) => ({ value: String(i), label: s.e + (s.en ? ' (' + s.en + ')' : '') })).sort((a, b) => a.label.localeCompare(b.label, 'hu'))}/>` : null}
      <${K.TextField} label="Saját tartomány" value=${kezi} onChange=${(e) => setKezi(e.target.value)}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!kezi.trim()} onClick=${() => { hozzaad(kezi, ''); setKezi(''); }}>Hozzáadás<//>
    </div>
    <${Dobas} tablaId=${tablaId} prep=${prep} cel=${cel} felirat="Dobás: 1d3 tartomány"
      magyarazat="Felvételkor a tartományok a meglévők mellé kerülnek; ami nem illik, utána törölhető."
      onElfogad=${(fa) => {
        const uj = IS.tartomanyokFabol(fa).filter((x) => !t.some((y) => y.nev === x.nev));
        valt(naplozva(E.mezoBeallit(elem, 'tartomanyok', t.concat(uj), ix), fa, 'tartomanyok'));
      }}/>
  </div>`;
}

// ================= Új isteni elem a fajtájával =================

export function UjIsteniParbeszed({ prep, cel, szulo, fajta: kezdo, onBezar, maradj }) {
  const [fajta, setFajta] = useState(kezdo || 'vallas');
  return html`<${UjElemParbeszed} prep=${prep} cel=${cel} szulo=${szulo} tipusok=${['istenseg']} onBezar=${onBezar} maradj=${maradj}
    cim=${'Új ' + IS.FAJTAK[fajta].nev.toLowerCase() + (szulo ? ': ' + E.nev(szulo, prep.ix) + ' alá' : '')}
    elokeszit=${(e, { alapbol, ix }) => (alapbol && E.mezoErtek(e, 'fajta', ix).ertek ? e : E.mezoBeallit(e, 'fajta', fajta, ix))}
    extra=${html`<${Valaszto} label="Fajta" value=${fajta} onChange=${setFajta} hint=${IS.FAJTAK[fajta].leiras}
      opciok=${Object.entries(IS.FAJTAK).map(([value, f]) => ({ value, label: f.nev }))}/>`}/>`;
}

// ================= Panteon: a kötelékek párosával =================

function PanteonParok({ istenek, prep, cel, csakEz }) {
  const { szabalyok } = useApp();
  const tablak = useMemo(() => tablakBol(lapokBol(szabalyok)), [szabalyok]);
  const vanTabla = !!G.tablaKeres(tablak, IS.KAPCSOLAT_TABLA);
  const [javaslat, setJavaslat] = useState({}); // pár kulcsa → { tipus, eredmeny }
  const [kezi, setKezi] = useState({});
  const kapcsolatok = prep.adat.kapcsolatok || [];
  let parok = IS.panteonParok(istenek, kapcsolatok);
  if (csakEz) parok = parok.filter((p) => p.a.id === csakEz || p.b.id === csakEz);
  const kulcs = (p) => p.a.id + '|' + p.b.id;
  const ment = (p, tipus) => {
    if (!tipus) return;
    const k = { id: ujAzon('ln'), honnan: p.a.id, hova: p.b.id, tipus, megjegyzes: '', ...celAzonok(cel) };
    if (KP.ellenoriz(k, kapcsolatok).length) return;
    prep.kapcsolatMent(k).catch(() => {});
  };
  const dob = (p) => {
    const fa = G.general(IS.KAPCSOLAT_TABLA, { tablak });
    return { tipus: fa && !fa.hiba ? ((fa.ertek || {}).tipus || null) : null, eredmeny: fa ? (fa.hiba || fa.eredmeny) : '' };
  };
  const kotetlen = parok.filter((p) => !p.kapcsolatok.length);
  const mindDob = () => { const j = { ...javaslat }; kotetlen.forEach((p) => { j[kulcs(p)] = dob(p); }); setJavaslat(j); };
  const mindFelvesz = () => { kotetlen.forEach((p) => { const j = javaslat[kulcs(p)]; if (j && j.tipus) ment(p, j.tipus); }); setJavaslat({}); };
  const vanJavaslat = kotetlen.some((p) => javaslat[kulcs(p)]);
  const nev = (e) => E.nev(e, prep.ix);
  if (!parok.length) return html`<p className="halvany kicsi">${csakEz ? 'Nincs más isten ugyanabban a vallásban.' : 'A panteonhoz legalább két isten kell a vallás alatt.'}</p>`;
  return html`<div className="verem">
    <div className="gombsor gombsor--szoros">
      ${vanTabla && kotetlen.length ? html`<${K.Button} size="sm" variant="secondary" onClick=${mindDob} icon=${html`<${Ikon} nev="sarkanykocka" meret=${16}/>`}>
        Dobás minden kötelék nélküli párra (${kotetlen.length})<//>` : null}
      ${vanJavaslat ? html`<${K.Button} size="sm" variant="primary" onClick=${mindFelvesz}>Minden javaslatot felveszek<//>` : null}
    </div>
    ${!vanTabla ? html`<p className="halvany kicsi">A kapcsolattábla (Import 13) nincs betöltve; a köteléket kézzel választhatod.</p>` : null}
    <ul className="sorlista">${parok.map((p) => {
      const j = javaslat[kulcs(p)];
      return html`<li key=${kulcs(p)} className="sorlista__sor sorlista__sor--fuggoleges">
        <div><a href=${elemUt(cel, p.a.id)}>${nev(p.a)}</a> és <a href=${elemUt(cel, p.b.id)}>${nev(p.b)}</a></div>
        ${p.kapcsolatok.length ? html`<div className="cimkek">${p.kapcsolatok.map((k) => html`<span key=${k.id} className="csip csip--statikus">
          ${nev(prep.ix.get(k.honnan) || p.a)} ${KP.tipusNev(k.tipus, 'ki')}: ${nev(prep.ix.get(k.hova) || p.b)}
          <button type="button" className="csip__gomb" aria-label="Kötelék törlése" onClick=${() => prep.kapcsolatTorol(k.id).catch(() => {})}>×</button></span>`)}</div>` : null}
        ${j ? html`<div className="javaslatdoboz sorban sorban--kozep">
          <span>${j.eredmeny}</span>
          ${j.tipus ? html`<${K.Button} size="sm" variant="primary" onClick=${() => { ment(p, j.tipus); setJavaslat({ ...javaslat, [kulcs(p)]: undefined }); }}>Felveszem<//>` : null}
          <${K.Button} size="sm" variant="quiet" onClick=${() => setJavaslat({ ...javaslat, [kulcs(p)]: dob(p) })}>Újra<//>
          <${K.Button} size="sm" variant="quiet" onClick=${() => setJavaslat({ ...javaslat, [kulcs(p)]: undefined })}>Elvetem<//>
        </div>` : null}
        <div className="sorban">
          <div className="ka-field">
            <label className="ka-field__label" htmlFor=${'pt-' + kulcs(p)}>Kötelék (${nev(p.a)} … ${nev(p.b)})</label>
            <select id=${'pt-' + kulcs(p)} className="ka-field__input valaszto" value=${kezi[kulcs(p)] || ''} onChange=${(e) => setKezi({ ...kezi, [kulcs(p)]: e.target.value })}>
              <option value="">Válassz…</option>
              ${IS.PANTEON_TIPUSOK.map((t) => html`<option key=${t} value=${t}>${KP.tipusNev(t, 'ki')}</option>`)}
            </select>
          </div>
          <${K.Button} size="sm" variant="secondary" disabled=${!kezi[kulcs(p)]} onClick=${() => { ment(p, kezi[kulcs(p)]); setKezi({ ...kezi, [kulcs(p)]: '' }); }}>Kötés<//>
          ${vanTabla ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => setJavaslat({ ...javaslat, [kulcs(p)]: dob(p) })}>Dobás<//>` : null}
        </div>
      </li>`;
    })}</ul>
    <p className="halvany kicsi">A kötelék irányos (például „${nev(parok[0].a)} gyermeke: ${nev(parok[0].b)}”); a másik isten lapján fordítva látszik. A kötelékek a Kapcsolatok panelen is szerkeszthetők.</p>
  </div>`;
}

// ================= Imádók (kapcsolat: imádja) =================

function Imadok({ elem, prep, cel }) {
  const nevek = useNevFeloldo(prep);
  const [valasztott, setValasztott] = useState('');
  const kapcsolatok = prep.adat.kapcsolatok || [];
  const imadoi = IS.imadoi(elem.id, kapcsolatok);
  const imadott = IS.imadja(elem.id, kapcsolatok);
  const jeloltek = Array.from(nevek.entries())
    .filter(([id, m]) => id !== elem.id && !imadoi.some((k) => k.honnan === id) && (['NJK', 'karakter'].includes(m.fajta) || (m.elem && ['helyszin', 'csoport'].includes(m.elem.tipus) && m.elem.aktiv !== false)))
    .sort((a, b) => a[1].fajta.localeCompare(b[1].fajta, 'hu') || a[1].nev.localeCompare(b[1].nev, 'hu'));
  const ment = () => {
    if (!valasztott) return;
    prep.kapcsolatMent({ id: ujAzon('ln'), honnan: valasztott, hova: elem.id, tipus: 'imadja', megjegyzes: '', ...celAzonok(cel) }).catch(() => {});
    setValasztott('');
  };
  const link = (id) => { const m = nevek.get(id); const href = m && m.elem ? elemUt(cel, id) : m && m.ut; return href ? html`<a href=${href}>${m.nev}</a>` : html`<span>${m ? m.nev : id}</span>`; };
  return html`<div className="verem">
    <p className="cimke">Imádói (kapcsolat: imádja)</p>
    ${imadoi.length ? html`<div className="cimkek">${imadoi.map((k) => {
      const m = nevek.get(k.honnan);
      return html`<span key=${k.id} className="csip csip--statikus">${link(k.honnan)}${m ? html` <span className="halvany kicsi">(${m.fajta})</span>` : null}
        <button type="button" className="csip__gomb" aria-label="Imádó törlése" onClick=${() => prep.kapcsolatTorol(k.id).catch(() => {})}>×</button></span>`;
    })}</div>` : html`<p className="halvany kicsi">Még nincs imádó kötve: település, ország, csoport, NJK vagy karakter imádhatja.</p>`}
    ${jeloltek.length ? html`<div className="sorban">
      <${Valaszto} label="Ki imádja?" value=${valasztott} onChange=${setValasztott} ures="Válassz…"
        hint="A kapcsolat az imádó lapján is látszik („imádja: …”)." opciok=${jeloltek.map(([id, m]) => ({ value: id, label: m.nev + ' (' + m.fajta + ')' }))}/>
      <${K.Button} size="sm" variant="secondary" disabled=${!valasztott} onClick=${ment}>Hozzáadás<//>
    </div>` : null}
    ${imadott.length ? html`<p className="kicsi"><span className="halvany">Ez az elem imádja:</span> ${imadott.map((k, i) => html`<span key=${k.id}>${i ? ', ' : ''}${link(k.hova)}</span>`)}</p>` : null}
  </div>`;
}

// ================= A lépések =================

function useKornyezet(elem, ix, prep) {
  const elemek = prep.adat.elemek.map((x) => (x.id === elem.id ? elem : x));
  const megj = (x) => E.megjelenitett(x, ix);
  const a = megj(elem);
  const f = IS.fajtaOf(a);
  const gy = IS.gyerekek(elem.id, elemek, megj);
  const testverek = f === 'isten' ? IS.testverek(elem, elemek, megj) : [];
  const panteonIstenek = f === 'vallas' ? gy.istenek : f === 'isten' && testverek.length ? [elem].concat(testverek) : [];
  const parok = IS.panteonParok(panteonIstenek, prep.adat.kapcsolatok || []).filter((p) => f !== 'isten' || p.a.id === elem.id || p.b.id === elem.id);
  const szulo = elem.szulo_id ? ix.get(elem.szulo_id) : null;
  const opciok = {
    istenekSzama: gy.istenek.length, testverekSzama: testverek.length, parokSzama: parok.length,
    kotottParok: parok.filter((p) => p.kapcsolatok.length).length, imadokSzama: IS.imadoi(elem.id, prep.adat.kapcsolatok || []).length,
    szuloFajta: szulo && szulo.tipus === 'istenseg' ? IS.fajtaOf(megj(szulo)) : ''
  };
  return { elemek, megj, a, f, gy, testverek, panteonIstenek, opciok, szulo, vallas: IS.vallasa(elem, ix, megj) };
}

function IsteniMezok({ lepes, elem, ix, valt, prep, cel }) {
  const { szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const kz = useKornyezet(elem, ix, prep);
  const { a, f, gy, opciok } = kz;
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const all = IS.lepesAllapot(a, opciok);
  const fig = IS.figyelmeztetesek(a, opciok);
  const [uj, setUj] = useState(null);
  const isteniMut = useIsteniMutatvany(cel);
  const p = { elem, ix, valt };
  const tobbSoros = (mezo, label, hint, rows = 3, placeholder) => html`<${ElemMezo} elem=${elem} ix=${ix} mezo=${mezo} label=${label}
    multiline=${true} rows=${rows} hint=${hint} placeholder=${placeholder} onValt=${valt}/>`;
  const egySoros = (mezo, label, hint, placeholder) => html`<${ElemMezo} elem=${elem} ix=${ix} mezo=${mezo} label=${label} hint=${hint} placeholder=${placeholder} onValt=${valt}/>`;
  const panel = (k, tartalom, actions) => html`<${LepesPanel} lepes=${k} allapot=${all[k]} actions=${actions}><${Figyelmeztetesek} lista=${fig} lepes=${k}/>${tartalom}<//>`;
  const fajtaValaszto = html`<${Valaszto} label=${cimkeJellel(elem, ix, 'fajta', valt, 'Fajta')} value=${f} onChange=${(x) => set('fajta', x)} hint=${IS.FAJTAK[f].leiras}
    opciok=${Object.entries(IS.FAJTAK).map(([value, x]) => ({ value, label: x.nev }))}/>`;
  const gyerekLista = (l, ures) => (l.length ? html`<ul className="elemfa">${l.map((g) => html`<li key=${g.id}><a className="elemfa__sor" href=${elemUt(cel, g.id)}>
    <span className="elemfa__nev">${E.nev(g, ix)}</span><span className="halvany kicsi">${IS.osszefoglalo(kz.megj(g))}</span></a></li>`)}</ul>` : html`<p className="halvany kicsi">${ures}</p>`);
  const ujPar = uj ? html`<${UjIsteniParbeszed} prep=${prep} cel=${cel} szulo=${elem} fajta=${uj} onBezar=${() => setUj(null)} maradj=${true}/>` : null;
  const helye = kz.szulo ? html`<p className="kicsi"><span className="halvany">Helye:</span> <a href=${elemUt(cel, kz.szulo.id)}>${E.nev(kz.szulo, ix)}</a>
    <span className="halvany"> (${IS.FAJTAK[IS.fajtaOf(kz.megj(kz.szulo))].nev.toLowerCase()}) alatt; a szülő az Alapadatok lépés „Helye a szerkezetben” panelén módosítható.</span></p>` : null;

  if (lepes === 'fajta') {
    return panel('fajta', html`
      ${fajtaValaszto}
      <${Kartyak} ...${p} mezo="szerkezet" opciok=${IS.SZERKEZETEK} cim="Vallásszerkezet (Religion Structure)"/>
      <${Dobas} tablaId=${IS.SZERKEZET_TABLA} prep=${prep} cel=${cel} felirat="Dobás a vallásszerkezet-táblán"
        magyarazat="Felvételkor a szerkezet és az istenek tervezett száma a mezőkbe kerül; az isteneket utána a „+ isten” gombbal hozd létre (mindegyiknek a saját lapján dobhatsz tartományt)."
        onElfogad=${(fa) => { const x = IS.szerkezetFabol(fa); if (!x) return; let e = E.mezoBeallit(elem, 'szerkezet', x.szerkezet, ix); e = E.mezoBeallit(e, 'istenek_szama', x.istenek_szama, E.index(Array.from(ix.values()).filter((y) => y.id !== e.id).concat([e]))); valt(naplozva(e, fa, 'szerkezet')); }}/>
      <${K.TextField} label=${cimkeJellel(elem, ix, 'istenek_szama', valt, 'Az istenek tervezett száma')} type="number" min="1"
        value=${a.istenek_szama === undefined ? '' : String(a.istenek_szama)} hint=${'A vallás alatt most ' + gy.istenek.length + ' isten van.'}
        onChange=${(e) => set('istenek_szama', e.target.value === '' ? '' : Math.max(1, Math.round(Number(e.target.value)) || 1))}/>
      ${tobbSoros('ihlet', 'Ihlet (Can You Use Existing Inspiration?)', 'Valódi mitológia, történelem, a Bestiárium lényei; a régi nevek új alakot kaphatnak.')}
      ${helye}
      <div>
        <div className="sorban sorban--kozep"><p className="cimke">Istenei (${gy.istenek.length})</p>
          <button type="button" className="szoveggomb" onClick=${() => setUj('isten')}>+ isten</button></div>
        ${gyerekLista(gy.istenek, 'Még nincs isten a vallás alatt.')}
      </div>
      <div>
        <div className="sorban sorban--kozep"><p className="cimke">Felekezetei és kultuszai (${gy.kultuszok.length})</p>
          <button type="button" className="szoveggomb" onClick=${() => setUj('kultusz')}>+ kultusz</button></div>
        ${gyerekLista(gy.kultuszok, 'Nincs felekezete.')}
      </div>
      ${ujPar}`);
  }

  if (lepes === 'isten_fajta') {
    return panel('isten_fajta', html`
      ${fajtaValaszto}
      <${Kartyak} ...${p} mezo="szerep" opciok=${IS.SZEREPEK} cim="Mi ez az isten?"/>
      <${Tartomanyok} ...${p} prep=${prep} cel=${cel}/>
      ${tobbSoros('ihlet', 'Ihlet (Can You Use Existing Inspiration?)', 'Valódi mitológia, a Bestiárium lényei; egy ismert név egészen más alakban is visszatérhet.')}
      ${helye}
      ${gy.kultuszok.length || f === 'isten' ? html`<div>
        <div className="sorban sorban--kozep"><p className="cimke">Kultuszai (${gy.kultuszok.length})</p>
          <button type="button" className="szoveggomb" onClick=${() => setUj('kultusz')}>+ kultusz</button></div>
        ${gyerekLista(gy.kultuszok, 'Nincs külön kultusza.')}
      </div>` : null}
      ${ujPar}`);
  }

  if (lepes === 'kultusz_fajta') {
    const istenek = prep.adat.elemek.filter((x) => x.tipus === 'istenseg' && x.aktiv !== false && x.id !== elem.id && IS.fajtaOf(kz.megj(x)) === 'isten');
    return panel('kultusz_fajta', html`
      ${fajtaValaszto}
      ${helye}
      <${Valaszto} label=${cimkeJellel(elem, ix, 'imadott_id', valt, 'Az imádott isten')} value=${a.imadott_id || ''} ures="nincs kiválasztva" onChange=${(x) => set('imadott_id', x)}
        hint="Ha a kultusz egy meglévő istent imád (akkor is, ha egy másik vallás alá tartozik)."
        opciok=${istenek.map((x) => ({ value: x.id, label: E.nev(x, ix) }))}/>
      ${a.imadott_id && ix.get(a.imadott_id) ? html`<p className="kicsi"><a href=${elemUt(cel, a.imadott_id)}>${E.nev(ix.get(a.imadott_id), ix)}</a>
        <span className="halvany"> ${IS.osszefoglalo(kz.megj(ix.get(a.imadott_id)))}</span></p>` : null}
      ${egySoros('imadott', 'Vagy amit imád', 'Egy isten neve, vagy maga a fogalom (nem a szépség istene, hanem a Szépség).')}
      <${Tartomanyok} ...${p} prep=${prep} cel=${cel} tablaId=${IS.TARTOMANY_TABLA} cim="Tartományok (a kultusz istenéé vagy az imádott fogalom)"/>
      ${tobbSoros('ihlet', 'Ihlet', '„Mi lenne, ha ezt imádnák?” Egy kép, egy régi NJK, egy dal is lehet a kiindulás.')}`);
  }

  if (lepes === 'valosag') {
    const v = kz.vallas && kz.vallas.id !== elem.id ? kz.megj(kz.vallas) : null;
    const vallase = (mezo, tabla) => (v && v[mezo] && tabla[v[mezo]] ? html`<p className="halvany kicsi">A vallásé (${E.nev(kz.vallas, ix)}): ${tabla[v[mezo]].nev.toLowerCase()}.</p>` : null);
    return panel('valosag', html`
      ${v ? html`<p className="halvany kicsi">Az isten a vallása értékeit követi; csak akkor töltsd ki, ha eltér tőle.</p>` : null}
      <${Kartyak} ...${p} mezo="valosag" opciok=${IS.VALOSAG} cim="Mennyire valódiak? (How Real?)"/>${vallase('valosag', IS.VALOSAG)}
      <${Kartyak} ...${p} mezo="jelenlet" opciok=${IS.JELENLET} cim="Mennyire vannak jelen? (How Present?)"/>${vallase('jelenlet', IS.JELENLET)}
      ${['tavol', 'elveszett'].includes(a.jelenlet) ? tobbSoros('jelenlet_miert', 'Miért vannak távol, és hogyan térhetnének vissza?', 'Megsértették, becsapták vagy elűzték őket? Ki ilyen hatalmas, hogy egy istent veszélybe sodor? Kell-e megmenteni őket?') : null}
      <${Kartyak} ...${p} mezo="tudas" opciok=${IS.TUDAS} cim="Mit tudnak erről a lakók?"/>${vallase('tudas', IS.TUDAS)}
      ${tobbSoros('valosag_jegyzet', 'Az igazság (csak a DM tudja)', 'Mi a valóság a hívők hite mögött?')}`);
  }

  if (lepes === 'panteon') {
    return panel('panteon', html`
      ${f === 'isten' ? html`<p className="kicsi"><span className="halvany">Panteon:</span> <a href=${elemUt(cel, kz.szulo.id)}>${E.nev(kz.szulo, ix)}</a></p>` : null}
      <${PanteonParok} istenek=${kz.panteonIstenek} prep=${prep} cel=${cel} csakEz=${f === 'isten' ? elem.id : ''}/>
      ${tobbSoros('panteon_jegyzet', 'A panteon története', 'Ki kit buktatott meg, ki falta fel a gyermekeit, kiből lett a világ? Hogyan visszhangzik ez a papok viszonyában?')}`);
  }

  if (lepes === 'ellenerok') {
    const ellen = kz.elemek.filter((x) => x.tipus === 'istenseg' && x.aktiv !== false && x.szulo_id === elem.id && kz.megj(x).szerep === 'ellenhatalom');
    return panel('ellenerok', html`
      ${tobbSoros('ellenerok', 'Az ellenerők', 'Angyalok és démonok, fény és sötétség, ördögök. Milyen formát öltenek?')}
      ${tobbSoros('hierarchia', 'Szerkezetük, hierarchiájuk')}
      ${tobbSoros('sikok', 'Létsíkok', 'Milyen más síkok vannak a világban? Elég egy egyszerű válasz.', 2)}
      ${tobbSoros('csavar', 'Csavar a megszokotton', 'Például a csábító démonok a legmegvetettebbek, vagy egy démon trónra ül a halandók földjén.', 2)}
      <div><p className="cimke">Ellenhatalmak a vallás alatt (${ellen.length})</p>
        ${gyerekLista(ellen, 'Az isten szerepe „Ellenhatalom” lehet (démonúr, ördög); a könyv szerint a tartományai ugyanazzal a táblával dobhatók.')}</div>
      <p className="halvany kicsi">Démonokat a Bestiáriumban is találsz; a kapcsolatot (ellensége) a Kapcsolatok panelen kötheted.</p>`);
  }

  if (lepes === 'hivek') {
    return panel('hivek', html`
      <${Imadok} elem=${elem} prep=${prep} cel=${cel}/>
      ${tobbSoros('hivek', 'Kik imádják?', 'Népek, rétegek, vidékek, foglalkozások.')}
      ${tobbSoros('kivalasztott', 'Kiválasztott nép?', 'Különlegesnek, kiválasztottnak, vagy épp büntetésre ítéltnek tartják magukat? Egyenlőnek tekint mindenkit a hit?', 2)}
      <${Kartyak} ...${p} mezo="idegenek" opciok=${IS.IDEGENEK} cim="Hogyan fogadják a kívülállókat?"/>
      <${Kartyak} ...${p} mezo="miert" opciok=${IS.MIERT} cim="Miért követik?"/>
      ${tobbSoros('politika', 'Vallás és politika', 'Hogyan kötődik az uralkodókhoz? Segítenének-e a hősök hatalomra egy uralkodót, aki szembemegy a hitükkel?', 2)}
      ${tobbSoros('mas_vallasok', 'Viszony más vallásokhoz', 'Hogyan bántak egymással a múltban, és ma? A szövetséget, ellenséget a Kapcsolatok panelen is rögzítheted.', 2)}
      <${ListaMezo} ...${p} mezo="konfliktusok" norm=${IS.konfliktusokNorm} cim="A hit konfliktusai (Challenges of the Faith)" gomb="Konfliktus"
        uresSzoveg="Vallásháború, belső vita egy tanon, egy fanatikus pap, aki a hitetleneket űzi, és egy jámbor boltos, aki rejtegeti őket."
        ures=${() => ({ kik: '', miert: '', hol: '' })} sorTartalom=${(s, m) => html`<div className="urlap-racs">
          <${K.TextField} label="Kik között" value=${s.kik} onChange=${(e) => m({ kik: e.target.value })}/>
          <${K.TextField} label="Miért" value=${s.miert} onChange=${(e) => m({ miert: e.target.value })}/>
          <${K.TextField} label="Hol, milyen formában" value=${s.hol} onChange=${(e) => m({ hol: e.target.value })}/>
        </div>`}/>
      <p className="halvany kicsi">Barátságos rivalizálás (99. oldal): attól, hogy két hős istenei ellenségek, a hősöknek nem kell azoknak lenniük; néha a vallási feszültséget vissza is kell venni.</p>`);
  }

  if (lepes === 'agak') {
    return panel('agak', html`
      ${tobbSoros('agak', 'Felekezetek', 'Egy fő hit, vagy több ág? Hol ágaznak el, miben értenek egyet, miben térnek el a legjobban?')}
      <div>
        <div className="sorban sorban--kozep"><p className="cimke">Felekezetek és kultuszok a vallás alatt (${gy.kultuszok.length})</p>
          <button type="button" className="szoveggomb" onClick=${() => setUj('kultusz')}>+ felekezet</button></div>
        ${gyerekLista(gy.kultuszok, 'Nincs még felekezet elemként.')}
      </div>
      <${ListaMezo} ...${p} mezo="miszteriumok" norm=${IS.miszteriumokNorm} cim="Misztériumok (Divine Mysteries)" gomb="Misztérium"
        uresSzoveg="Elveszett prófécia, eretnek irat, egy ereklye, amely bizonyítja egy halottnak hitt isten létét."
        ures=${() => ({ nev: '', leiras: '', horog: '' })} sorTartalom=${(s, m) => html`<div className="verem">
          <${K.TextField} label="Név" value=${s.nev} onChange=${(e) => m({ nev: e.target.value })}/>
          <${K.TextField} label="Mi ez, és ki tud róla?" multiline=${true} rows=${2} value=${s.leiras} onChange=${(e) => m({ leiras: e.target.value })}/>
          <${K.TextField} label="Horog (hogyan kerülnek a hősök a közelébe)" value=${s.horog} onChange=${(e) => m({ horog: e.target.value })}/>
        </div>`}/>
      ${tobbSoros('elfeledett', 'Elfeledett és kitörölt múlt', 'Kitörölt nevek, lerombolt templomok, egy régi panteon, amelynek már senki sem imádkozik, csak a falfestmények őrzik.')}
      ${ujPar}`);
  }

  if (lepes === 'tevekenysegek') {
    return panel('tevekenysegek', html`
      <${ListaMezo} ...${p} mezo="tevekenysegek" norm=${IS.tevekenysegekNorm} cim="Tevékenységek" gomb="Tevékenység"
        ures=${() => ({ nev: '', leiras: '' })} sorTartalom=${(s, m) => html`<div className="urlap-racs">
          <${K.TextField} label="Tevékenység" value=${s.nev} onChange=${(e) => m({ nev: e.target.value })}/>
          <${K.TextField} label="Hogyan csinálják" value=${s.leiras} onChange=${(e) => m({ leiras: e.target.value })}/>
        </div>`}/>
      <${Dobas} tablaId=${IS.KULTUSZ_TABLA} prep=${prep} cel=${cel} felirat="Dobás: teljes kultusz (1d3 tevékenység, 1d3 tartomány)"
        magyarazat="Felvételkor a tevékenységek és a tartományok a meglévők mellé kerülnek. A könyv példájában a tevékenységek és a tartományok együtt adják ki a kultusz titkát."
        onElfogad=${(fa) => {
          let e = E.mezoBeallit(elem, 'tevekenysegek', IS.tevekenysegekNorm(a.tevekenysegek).concat(IS.tevekenysegekFabol(fa)), ix);
          const t = IS.tartomanyokNorm(a.tartomanyok);
          e = E.mezoBeallit(e, 'tartomanyok', t.concat(IS.tartomanyokFabol(fa).filter((x) => !t.some((y) => y.nev === x.nev))), E.index(Array.from(ix.values()).filter((y) => y.id !== e.id).concat([e])));
          valt(naplozva(e, fa, 'tevekenysegek'));
        }}/>
      <${Dobas} tablaId=${IS.TEVEKENYSEG_TABLA} prep=${prep} cel=${cel} felirat="Dobás: egy tevékenység"
        onElfogad=${(fa) => valt(naplozva(E.mezoBeallit(elem, 'tevekenysegek', IS.tevekenysegekNorm(a.tevekenysegek).concat(IS.tevekenysegekFabol(fa)), ix), fa, 'tevekenysegek'))}/>
      <p className="halvany kicsi">A tábla egy vallás általános gyakorlatához is használható: dobj többször, és tompítsd a szélsőségeket.</p>`);
  }

  if (lepes === 'elteres') {
    return panel('elteres', html`
      ${kz.vallas ? html`<p className="kicsi"><span className="halvany">Anyavallás:</span> <a href=${elemUt(cel, kz.vallas.id)}>${E.nev(kz.vallas, ix)}</a></p>`
        : html`<p className="halvany kicsi">A kultusz nem egy vallás alatt áll; ha egyből ágazott le, az Alapadatok lépésen tedd alá.</p>`}
      ${tobbSoros('igaz_hit', 'Mit tart igaznak a kultusz?', 'A kultusz „igaz” története az istenről, amelyben a fő hit tévedésben él.')}
      <${ListaMezo} ...${p} mezo="elteresek" norm=${IS.elteresekNorm} cim="Eltérések (jelkép, dal, szertartás, temetés)" gomb="Eltérés"
        ures=${() => ({ miben: '', fo: '', kultusz: '' })} sorTartalom=${(s, m) => html`<div className="urlap-racs">
          <${K.TextField} label="Miben" value=${s.miben} onChange=${(e) => m({ miben: e.target.value })}/>
          <${K.TextField} label="A fő hitben" value=${s.fo} onChange=${(e) => m({ fo: e.target.value })}/>
          <${K.TextField} label="A kultuszban" value=${s.kultusz} onChange=${(e) => m({ kultusz: e.target.value })}/>
        </div>`}/>
      ${tobbSoros('felismeres', 'Hogyan ismerhető fel egy kultista?', 'Az apró eltérések a jelképben, a szólásokban; a könyv szerint ez nagyon nehéz próba.', 2)}
      ${tobbSoros('nepek_politika', 'Népek és politika (Ancestry & Politics)', 'Hogyan tekint a vegyes származásúakra, más népekre? Beépül-e a városokba, a hatalomba?')}`);
  }

  if (lepes === 'kulsosegek') {
    return panel('kulsosegek', html`
      <div className="urlap-racs">
        ${egySoros('jelkep', 'Jelkép (szigillum)', '', 'például levelekből font arc agancsokkal')}
        ${egySoros('szent_allat', 'Szent állat')}
        ${egySoros('szent_ido', 'Szent időszak, napszak, színek')}
        ${egySoros('eszkozok', 'Kedvelt eszközök, fémek, anyagok')}
      </div>
      ${tobbSoros('tanitas', 'Hogyan tanítanak?', 'Szent irat, ének, tánc, példázatok.', 2)}
      ${tobbSoros('tanok', 'Tanok és parancsolatok', 'Szigorú parancsolatok, vagy inkább megtanulandó leckék (mikor vessünk, mikor arassunk)?')}
      ${tobbSoros('istentisztelet', 'Hol és hogyan imádkoznak együtt?', '', 2)}
      ${tobbSoros('egyeni_ima', 'Egyéni ima, otthoni oltár', 'Esti ima, otthoni szentély, egy gondozott növény a jelképpel.', 2)}
      ${tobbSoros('halotti', 'Halotti szertartás', 'Hogyan búcsúznak a halottaktól, és mi lesz a testtel?', 2)}
      ${tobbSoros('muveszet', 'A hit a művészetben és a mindennapokban', 'Falfestmények, dalok, érmék feliratai, amelyeket a nem hívők is ismernek.', 2)}
      <${Kartyak} ...${p} mezo="viselet" opciok=${IS.VISELET} cim="A hit jelének viselése"/>
      ${egySoros('viselet_jegyzet', 'Hogyan viselik?', 'Medál, gyűrű, heg, tetoválás; és ami a viselőjéről elárul.')}
      <${ListaMezo} ...${p} mezo="szolasok" norm=${IS.szolasokNorm} cim="Szólások, felkiáltások" gomb="Szólás"
        uresSzoveg="Például egy harcos csatakiáltása, vagy ahogy a gyógyító megnyugtat valakit az isten nevében."
        ures=${() => ({ szoveg: '', ki: '' })} sorTartalom=${(s, m) => html`<div className="urlap-racs">
          <${K.TextField} label="Szólás" value=${s.szoveg} onChange=${(e) => m({ szoveg: e.target.value })}/>
          <${K.TextField} label="Ki, mikor mondja" value=${s.ki} onChange=${(e) => m({ ki: e.target.value })}/>
        </div>`}/>`);
  }

  if (lepes === 'unnepek') {
    const istenek = f === 'vallas' ? gy.istenek : f === 'isten' ? [elem] : [];
    const l = IS.unnepekNorm(a.unnepek);
    return panel('unnepek', html`
      <${ListaMezo} ...${p} mezo="unnepek" norm=${IS.unnepekNorm} cim="Ünnepek és szent napok" gomb="Ünnep"
        ures=${() => ({ nev: '', mikor: '', szokas: '', tema: '', isten_id: '', leiras: '' })} sorTartalom=${(s, m) => html`<div className="verem">
          <div className="urlap-racs">
            <${K.TextField} label="Név" value=${s.nev} onChange=${(e) => m({ nev: e.target.value })}/>
            <${K.TextField} label="Mikor" value=${s.mikor} onChange=${(e) => m({ mikor: e.target.value })} placeholder="napforduló, aratás után"/>
            <${K.TextField} label="Téma (tartomány)" value=${s.tema} onChange=${(e) => m({ tema: e.target.value })}/>
            ${istenek.length ? html`<${Valaszto} label="Kinek szól" value=${s.isten_id} ures="az egész hitnek" onChange=${(x) => m({ isten_id: x })}
              opciok=${istenek.map((x) => ({ value: x.id, label: E.nev(x, ix) }))}/>` : null}
          </div>
          <${K.TextField} label="Központi szokás" value=${s.szokas} onChange=${(e) => m({ szokas: e.target.value })}/>
          <${K.TextField} label="Leírás" multiline=${true} rows=${2} value=${s.leiras} onChange=${(e) => m({ leiras: e.target.value })}/>
        </div>`}/>
      <${Dobas} tablaId=${IS.UNNEP_TABLA} prep=${prep} cel=${cel} felirat="Dobás: ünnep (szokás és téma)"
        magyarazat="Felvételkor új ünnep kerül a listába a szokással és a témával; a nevet, az időpontot és a jelentését utána írd hozzá."
        onElfogad=${(fa) => { const u = IS.unnepFabol(fa); if (u) valt(naplozva(E.mezoBeallit(elem, 'unnepek', l.concat([{ ...u, isten_id: f === 'isten' ? elem.id : '' }]), ix), fa, 'unnepek')); }}/>`);
  }

  if (lepes === 'nezetek') {
    return panel('nezetek', html`
      ${tobbSoros('nepek', 'A népekről', 'Kit tart egyenlőnek, kit kiválasztottnak, kit átkozottnak? Ki imádhatja? Hogyan látja a vegyes származásúakat?')}
      ${tobbSoros('elvarasok', 'Mit vár el a híveitől?', 'Mire van szüksége az istennek, és ez hogyan érinti azokat, akik nem őt követik?', 2)}
      <${Kartyak} ...${p} mezo="magia_megiteles" opciok=${IS.MAGIA_MEGITELES} cim="Hogyan tekint a mágiára?"/>
      ${tobbSoros('magia_jegyzet', 'A mágia és a hit', 'Kiket ünnepelnek, kiket üldöznek; mely mágia számít áldásnak.', 2)}
      <${Kartyak} ...${p} mezo="hitehagyas" opciok=${IS.HITEHAGYAS} cim="Ha valaki elveszíti a hitét"/>
      ${tobbSoros('hitehagyas_jegyzet', 'A hitét vesztett sorsa', 'A Fantasy AGE-ben a hitét vesztett pap is hatékony maradhat; a hitválság és a visszatalálás jó karaktertörténet.', 2)}`);
  }

  if (lepes === 'magia') {
    const arkanumok = (lapok['Arkánumok'] || []).filter((x) => x.id !== 'ark_altalanos');
    const ark = IS.arkanumokOf(a);
    const tilt = IS.tiltottArkanumokOf(a);
    const tartFonte = f === 'vallas' ? gy.istenek.flatMap((x) => IS.tartomanyokNorm(kz.megj(x).tartomanyok)) : IS.tartomanyokNorm(a.tartomanyok);
    const jav = IS.arkanumJavaslat(tartFonte);
    const arkNev = (id) => { const x = arkanumok.find((y) => y.id === id); return x ? x.nev_hu.replace(/ arkánum$/, '') : id; };
    const csipValt = (mezo, l, k) => set(mezo, l.includes(k) ? l.filter((x) => x !== k) : l.concat([k]));
    return panel('magia', html`
      ${jav.length ? html`<div><p className="cimke">Illő arkánumok a tartományok szerint</p>
        <p className="kicsi">${jav.map((x, i) => html`<span key=${x.id}>${i ? '; ' : ''}<strong>${arkNev(x.id)}</strong> <span className="halvany">(${x.tartomanyok.join(', ').toLowerCase()})</span></span>`)}</p>
        <p className="halvany kicsi">Saját javaslat a Companion példája szerint (a hold papnője állat, jóslás, sors, árnyék és víz arkánumot tanul); stílus, nem tiltás.</p></div>` : null}
      <div>
        <p className="cimke">${cimkeJellel(elem, ix, 'arkanumok', valt, 'A papok arkánumai')}</p>
        <div className="csipek">${arkanumok.map((x) => html`<${Csip} key=${x.id} be=${ark.includes(x.id)} onClick=${() => csipValt('arkanumok', ark, x.id)}>${arkNev(x.id)}${jav.some((j) => j.id === x.id) ? ' ★' : ''}<//>`)}</div>
      </div>
      <div>
        <p className="cimke">${cimkeJellel(elem, ix, 'tiltott_arkanumok', valt, 'Tiltott arkánumok (egy pap sem érintheti)')}</p>
        <div className="csipek">${arkanumok.map((x) => html`<${Csip} key=${x.id} be=${tilt.includes(x.id)} onClick=${() => csipValt('tiltott_arkanumok', tilt, x.id)}>${arkNev(x.id)}<//>`)}</div>
      </div>
      ${tobbSoros('papok', 'A papság és a mágia', 'Mely rendek tanulhatnak mely arkánumot? Kapnak-e a papok különleges fókuszt vagy bónuszt? Kell-e tagság (Companion tagságok)?', 2)}
      ${tobbSoros('szent_fegyver', 'Szent fegyver, szent tárgy', 'Egy fegyver, amely fókuszt ad a hívőnek, és titokban figyeli, jutalmazza vagy bünteti.', 2)}
      <${Kartyak} ...${p} mezo="isteni_szabalyok" tobb=${true} opciok=${IS.ISTENI_SZABALYOK} cim="A Companion isteni mágiája (választható szabályok)"/>
      ${isteniMut !== null ? html`<p className="halvany kicsi">Az isteni mutatványok ebben a kampányban ${isteniMut ? 'be vannak kapcsolva' : 'a kampánykeret „Választható szabályok” lépésén kapcsolhatók be'}${' '}(<a href=${'#/dm/kampany/' + cel.kampany_id + '/epito/keret'}>kampánykeret</a>). A többi választás itt emlékeztető, gépi hatása nincs.</p>`
        : html`<p className="halvany kicsi">Az isteni mutatványok a kampány beállításai közt kapcsolhatók; a többi választás emlékeztető, gépi hatása nincs.</p>`}`);
  }

  if (lepes === 'jatekosok') {
    return panel('jatekosok', html`
      ${tobbSoros('mindennapok', 'Mit tudnak róla a hősök?', 'Az ünnepek, jelek, szokások, amelyeket akkor is felismernek, ha nem hívők. Ezt elmondhatod nekik a kampány elején.')}
      ${tobbSoros('hivo_hos', 'Ha egy hős hívő', 'Mit lát meg többet, ahogy hűséges szolgának bizonyul (jelek, álmok, rejtett ügynökök)?', 2)}
      <${ElemMezo} elem=${elem} ix=${ix} mezo="titkok" label="Ami egyelőre rejtve marad (a DM titkai)" multiline=${true} rows=${3} onValt=${valt}/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="felolvasando" label="Felolvasandó szöveg" multiline=${true} rows=${3} onValt=${valt}
        hint="Például egy ima, egy prédikáció vagy egy ünnep leírása, ahogy a hősök először találkoznak vele."/>`);
  }
  return null;
}

// Az isteni elem a könyv lépései szerint (az elemszerkesztő lépéses módja).
SAJAT_LEPESEK.istenseg = {
  lepesek: ({ elem, ix }) => {
    const elemek = Array.from(ix.values()).map((x) => (x.id === elem.id ? elem : x));
    const megj = (x) => E.megjelenitett(x, ix);
    const a = megj(elem);
    const f = IS.fajtaOf(a);
    const gy = IS.gyerekek(elem.id, elemek, megj);
    const testverek = f === 'isten' ? IS.testverek(elem, elemek, megj) : [];
    const all = IS.lepesAllapot(a, { istenekSzama: gy.istenek.length });
    return IS.lepesKulcsok(a, { istenekSzama: gy.istenek.length, testverekSzama: testverek.length })
      .map((k) => ({ kulcs: k, nev: IS.ISTENI_LEPESEK[k].nev, allapot: k === 'panteon' || k === 'hivek' ? undefined : all[k] }));
  },
  tartalom: (lepes, p) => html`<${IsteniMezok} key=${lepes} lepes=${lepes} ...${p}/>`
};

// ================= A vallásfa =================

function IsteniFaSor({ cs, prep, cel, melyseg, onUj }) {
  const a = E.megjelenitett(cs.elem, prep.ix);
  const f = IS.fajtaOf(a);
  const imadok = IS.imadoi(cs.elem.id, prep.adat.kapcsolatok || []).length;
  return html`<li>
    <div className=${'elemfa__sor helyfa__sor' + (cs.elem.aktiv === false ? ' elemfa__sor--archivalt' : '')} style=${{ paddingLeft: 8 + melyseg * 20 + 'px' }}>
      <a className="elemfa__nev" href=${elemUt(cel, cs.elem.id)}>${E.nev(cs.elem, prep.ix)}</a>
      <${K.Badge} tone=${f === 'vallas' ? 'accent' : 'neutral'}>${IS.FAJTAK[f].nev}<//>
      ${cel.szint !== E.szint(cs.elem) ? html`<${SzintJel} elem=${cs.elem}/>` : null}
      <span className="halvany kicsi">${IS.osszefoglalo(a, { imadokSzama: imadok }).split(', ').slice(1).join(', ')}</span>
      <span className="helyfa__gombok">
        ${f === 'vallas' ? html`<button type="button" className="szoveggomb" onClick=${() => onUj(cs.elem, 'isten')}>+ isten</button>` : null}
        <button type="button" className="szoveggomb" onClick=${() => onUj(cs.elem, 'kultusz')}>+ kultusz</button>
      </span>
    </div>
    ${cs.gyerekek.length ? html`<ul className="elemfa">${cs.gyerekek.map((g) => html`<${IsteniFaSor} key=${g.elem.id} cs=${g} prep=${prep} cel=${cel} melyseg=${melyseg + 1} onUj=${onUj}/>`)}</ul>` : null}
  </li>`;
}

export function IsteniFa({ prep, cel, elemek }) {
  const [uj, setUj] = useState(null); // { szulo, fajta }
  const fa = IS.isteniFa(elemek, megjOf(prep));
  return html`<div className="verem">
    ${fa.length ? html`<ul className="elemfa">${fa.map((cs) => html`<${IsteniFaSor} key=${cs.elem.id} cs=${cs} prep=${prep} cel=${cel} melyseg=${0}
      onUj=${(szulo, fajta) => setUj({ szulo, fajta })}/>`)}</ul>` : html`<p className="halvany">Még nincs vallás vagy isten. Kezdheted egy vallással (és alá az istenekkel), vagy egyetlen istennel.</p>`}
    <div className="gombsor gombsor--szoros">${Object.entries(IS.FAJTAK).map(([k, x]) => html`<${K.Button} key=${k} size="sm" variant="secondary"
      onClick=${() => setUj({ szulo: null, fajta: k })} icon=${html`<${Ikon} nev="plusz" meret=${16}/>`}>${x.nev}<//>`)}</div>
    ${uj ? html`<${UjIsteniParbeszed} prep=${prep} cel=${cel} szulo=${uj.szulo} fajta=${uj.fajta} onBezar=${() => setUj(null)}/>` : null}
  </div>`;
}

// Ki kit imád: az imádja kapcsolatok az isteni elemekre.
function KiKitImad({ prep, cel, elemek }) {
  const nevek = useNevFeloldo(prep);
  const idk = new Set(elemek.map((e) => e.id));
  const kotesek = (prep.adat.kapcsolatok || []).filter((k) => k.aktiv !== false && k.tipus === 'imadja' && idk.has(k.hova));
  const link = (id) => { const m = nevek.get(id); const href = m && m.elem ? elemUt(cel, id) : m && m.ut; return href ? html`<a href=${href}>${m.nev}</a>` : html`<span>${m ? m.nev : id}</span>`; };
  if (!kotesek.length) return html`<p className="halvany kicsi">Még nincs imádó kötve. Az isteni elem „Hívek és viszonyok” lépésén köthetsz hozzá települést, csoportot, NJK-t vagy karaktert.</p>`;
  return html`<ul className="sorlista">${kotesek.map((k) => html`<li key=${k.id} className="sorlista__sor"><div>${link(k.honnan)}
    <span className="halvany kicsi"> (${(nevek.get(k.honnan) || {}).fajta || ''})</span> <span className="halvany">imádja:</span> ${link(k.hova)}</div></li>`)}</ul>`;
}

// A kampány Isteni füle: a kampány és a világ vallásai, istenei és kultuszai egy fában.
export function IsteniNezet({ prep, cel }) {
  const [archivalt, setArchivalt] = useState(false);
  const [vilagEs, setVilagEs] = useState(true);
  const vid = prep.adat.vilag_id || (prep.adat.keret && prep.adat.keret.keret && prep.adat.keret.keret.vilag_id) || '';
  const sajat = prep.adat.elemek.filter((e) => e.tipus === 'istenseg' && e.kampany_id === cel.kampany_id);
  const vilagbol = vid ? prep.adat.elemek.filter((e) => e.tipus === 'istenseg' && e.vilag_id === vid && !e.kampany_id) : [];
  const mutatott = sajat.concat(vilagEs ? vilagbol : []).filter((e) => archivalt || e.aktiv !== false);
  const archivDb = sajat.concat(vilagbol).filter((e) => e.aktiv === false).length;
  const szamok = IS.fajtaSzamok(mutatott, megjOf(prep));
  const isteniMutatvany = useIsteniMutatvany(cel);
  return html`<div className="ket-hasab">
    <${K.Panel} title="Vallások, istenek, kultuszok">
      <div className="verem">
        <p className="halvany kicsi">${Object.entries(IS.FAJTAK).filter(([k]) => szamok[k]).map(([k, x]) => x.nev + ': ' + szamok[k]).join(' · ') || 'Még nincs isteni elem.'}</p>
        <div className="cimkek">
          ${vilagbol.length ? html`<${Jelolo} checked=${vilagEs} onChange=${setVilagEs}>A világ hitei is (${vilagbol.length})<//>` : null}
          ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
        </div>
        <${IsteniFa} prep=${prep} cel=${cel} elemek=${mutatott}/>
        <p className="halvany kicsi">Az új elem a kampányé; ha több kampányban is visszatér, a szerkesztőjében világelemmé emelhető. A világ vallásait a világ oldalán érdemes felépíteni.</p>
      </div>
    <//>
    <div className="verem">
      <${K.Panel} title="Ki kit imád">
        <${KiKitImad} prep=${prep} cel=${cel} elemek=${mutatott}/>
      <//>
      <${K.Panel} title="A könyv szerint">
        <div className="verem">
          <p className="szoveg">A hit akkor is formálja a világot, ha a kampánynak nincs köze hozzá: az ünnepeket, a jelképeket, a szólásokat a nem hívő is ismeri.
            A Fantasy AGE egyik osztályt sem köti valláshoz, így a hit annyira lehet hangsúlyos, amennyire a csapat szeretné. Csak annyit dolgozz ki, amennyi kell;
            a könyv példájában (Mahre, a természet anyja) egy falu egyszerű hitéből nő ki egy titkos, sötét kultusz.</p>
          <p className="halvany kicsi">Isteni mutatványok ebben a kampányban: ${isteniMutatvany ? 'bekapcsolva' : 'kikapcsolva'}${' '}(<a href=${'#/dm/kampany/' + cel.kampany_id + '/epito/keret'}>kampánykeret</a>, „Választható szabályok”). A fejezet táblái a Dobótáblák fülön is dobhatók.</p>
        </div>
      <//>
    </div>
  </div>`;
}

// A világ oldalán: a világ vallásai, istenei és kultuszai.
VILAG_PANELEK.push(({ prep, cel }) => {
  const elemek = prep.adat.elemek.filter((e) => e.tipus === 'istenseg' && e.vilag_id === cel.vilag_id && !e.kampany_id && e.aktiv !== false);
  return html`<${K.Panel} title="A világ hitei">
    <div className="verem">
      <p className="sugo">A könyv 8. fejezete szerint (Building the Divine): a vallások, az istenek és a kultuszok a világ részei, több kampányban is visszatérnek.</p>
      <${IsteniFa} prep=${prep} cel=${cel} elemek=${elemek}/>
    </div>
  <//>`;
});
