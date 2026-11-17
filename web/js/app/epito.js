// Kampányépítő (DM, 5. lépés): közös alap. Az előkészítő adat (prep.get) horga optimista mentéssel, az automatikus
// mentés, az öröklést jelző mezők, az általános elemszerkesztő (közös mezők, fa, öröklés, kapcsolatok, dobótábla),
// a világ és a Sablontár oldala. A kampánykeret oldala: epito_keret.js. Tiszta függvények: web/js/kampany/.
// Terv: claude/kampanyepito-terv.md.
import {
  html, K, useApp, useState, useEffect, useMemo, useRef, useCallback, useLekeres, useMuvelet, navigal, Ikon, Betoltes,
  Uzenet, Valaszto, Jelolo, Parbeszed, Megerosites, Sugo, idopont
} from './kozos.js';
import * as E from '../kampany/elem.js';
import * as F from '../kampany/fa.js';
import * as KP from '../kampany/kapcsolat.js';
import { peldanyFa, sablonFa } from '../kampany/kaland.js';
import { DobotablaParbeszed } from './dobotabla.js';
import { KepekPanel } from './epito_kepek.js';
import { megjelenitettNev } from '../szabalyok.js';

// A típusok saját mezői az elemszerkesztőben (a későbbi alépések moduljai töltik fel, például epito_kaland.js).
// Függvény: ({ elem, ix, valt, prep, cel }) => tartalom.
export const SAJAT_MEZOK = {};
// Lépéses szerkesztő egy típushoz (például a kaland a könyv lépései szerint): ({ elem, ix }) => [{ kulcs, nev, allapot }],
// és a lépés tartalma: tartalom(kulcs, { elem, ix, valt, prep, cel }). Az „alap” lépés az általános szerkesztő.
export const SAJAT_LEPESEK = {};
// További panelek a világ oldalán (a későbbi alépések moduljai töltik fel, például a földrajz: epito_helyszin.js).
// Függvény: ({ prep, cel, vazlat, setVazlat }) => tartalom.
export const VILAG_PANELEK = [];
// A szerkezeti típusok, amelyek a kiinduló alapjukból a részfájukkal együtt példányosíthatók.
const FAVAL_PELDANYOSITHATO = ['kaland', 'resz'];

export const ujAzon = (elotag) => elotag + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};

// ================= Az előkészítő adat =================

// cel: { szint: 'sablon' | 'vilag' | 'kampany', vilag_id?, kampany_id? }
// Visszaad: { adat, hiba, ix, elem(id), elemMent(e), elemMuvelet(action, adat), kapcsolatMent(k), kapcsolatTorol(id),
//   vilagMent(w), keretMent(keret), ujratolt }
export function usePrep(cel) {
  const { api, sync, uzen } = useApp();
  const tarKulcs = 'prep.' + (cel.kampany_id ? 'k.' + cel.kampany_id : cel.vilag_id ? 'v.' + cel.vilag_id : 'sablon');
  const lek = useLekeres(() => api.hivas('prep.get', cel.kampany_id ? { kampany_id: cel.kampany_id } : cel.vilag_id ? { vilag_id: cel.vilag_id } : {}),
    [cel.kampany_id, cel.vilag_id], tarKulcs);
  const adat = lek.adat;
  const aktualis = useRef(adat);
  aktualis.current = adat;
  const ix = useMemo(() => E.index(adat ? adat.elemek : []), [adat]);

  const lista = (nev, elem, torles) => lek.beallit((a) => {
    if (!a) return a;
    const regi = a[nev] || [];
    if (torles) return { ...a, [nev]: regi.filter((x) => x.id !== torles) };
    return { ...a, [nev]: regi.some((x) => x.id === elem.id) ? regi.map((x) => (x.id === elem.id ? elem : x)) : regi.concat([elem]) };
  });
  const hibaKezeles = (cim) => (e) => {
    if (e && e.kod === 'utkozes') {
      uzen(cim + ': közben máshol is módosult, a friss változat betöltődött.', 'warning');
      lek.ujra();
    } else {
      uzen(cim + ' nem mentődött: ' + (e && e.message ? e.message : e), 'danger');
      lek.ujra();
    }
    throw e;
  };

  const elem = useCallback((id) => ((aktualis.current && aktualis.current.elemek) || []).find((x) => x.id === id) || null, []);

  // Elem mentése (új elem: verzio 0). Előbb a képernyő változik, a mentés a szinkron sorában fut.
  const elemMent = (e) => {
    const regi = elem(e.id);
    const verzio = regi ? Number(regi.verzio) || 0 : 0;
    const ixMost = E.index((aktualis.current && aktualis.current.elemek || []).filter((x) => x.id !== e.id).concat([e]));
    const kuld = { ...E.mentendo(e, ixMost), verzio, uj: verzio === 0 ? true : undefined };
    lista('elemek', { ...e, verzio: verzio + 1, modositva: new Date().toISOString() });
    return sync.push({ action: 'element.save', adat: kuld })
      .then((v) => { lista('elemek', v.elem); return v.elem; })
      .catch(hibaKezeles('Az elem'));
  };
  // Archiválás, leválasztás, emelés: a háttér adja az új állapotot.
  const elemMuvelet = (action, adat2, cim) => sync.push({ action, adat: adat2 })
    .then((v) => { if (v.elem) lista('elemek', v.elem); if (v.torolve) { lista('elemek', null, v.torolve); (v.kapcsolatok || []).forEach((id) => lista('kapcsolatok', null, id)); } return v; })
    .catch(hibaKezeles(cim || 'A művelet'));
  const kapcsolatMent = (k) => {
    const uj = !((aktualis.current && aktualis.current.kapcsolatok) || []).some((x) => x.id === k.id);
    lista('kapcsolatok', { ...k, aktiv: true });
    return sync.push({ action: 'link.save', adat: { ...k, uj: uj || undefined } })
      .then((v) => { lista('kapcsolatok', v.kapcsolat); return v.kapcsolat; })
      .catch(hibaKezeles('A kapcsolat'));
  };
  const kapcsolatTorol = (id) => {
    lista('kapcsolatok', null, id);
    return sync.push({ action: 'link.delete', adat: { id } }).catch(hibaKezeles('A kapcsolat törlése'));
  };
  const vilagMent = (w) => {
    const regi = ((aktualis.current && aktualis.current.vilagok) || []).find((x) => x.id === w.id);
    const verzio = regi ? Number(regi.verzio) || 0 : 0;
    lista('vilagok', { ...w, verzio: verzio + 1 });
    return sync.push({ action: 'world.save', adat: { id: w.id, nev: w.nev, adat: w.adat, aktiv: w.aktiv, verzio, uj: verzio === 0 ? true : undefined } })
      .then((v) => { lista('vilagok', v.vilag); return v.vilag; })
      .catch(hibaKezeles('A világ'));
  };
  const keretMent = (keret) => {
    const k = aktualis.current && aktualis.current.keret;
    if (!k) return Promise.reject(new Error('Nincs kampány.'));
    const verzio = Number(k.verzio) || 0;
    const vilagValtozott = (keret.vilag_id || '') !== (aktualis.current.vilag_id || '');
    lek.beallit((a) => ({ ...a, keret: { ...a.keret, keret, verzio: verzio + 1 } }));
    return sync.push({ action: 'campaign.frame.save', adat: { id: k.kampany_id, verzio, keret } })
      .then((v) => {
        lek.beallit((a) => ({ ...a, keret: { ...a.keret, verzio: v.verzio } }));
        if (vilagValtozott) lek.ujra(); // a másik világ elemei
        return v;
      })
      .catch(hibaKezeles('A kampánykeret'));
  };
  return { adat, hiba: lek.hiba, tolt: lek.tolt, ix, elem, elemMent, elemMuvelet, kapcsolatMent, kapcsolatTorol, vilagMent, keretMent, ujratolt: lek.ujra };
}

// Automatikus mentés: az érték változása után kesleltetes ms-mal ment; elhagyáskor azonnal.
// Visszaad: { allapot: 'mentve' | 'var' | 'ment' | 'hiba', most() }
export function useAutoMentes(ertek, ment, kesleltetes = 1200) {
  const [allapot, setAllapot] = useState('mentve');
  const utolso = useRef(JSON.stringify(ertek));
  const fuggo = useRef(null);
  const idozito = useRef(null);
  const mentRef = useRef(ment);
  mentRef.current = ment;
  const vegrehajt = useCallback(() => {
    clearTimeout(idozito.current);
    const v = fuggo.current;
    if (v === null) return;
    fuggo.current = null;
    utolso.current = JSON.stringify(v);
    setAllapot('ment');
    Promise.resolve(mentRef.current(v)).then(() => { if (fuggo.current === null) setAllapot('mentve'); })
      .catch(() => setAllapot('hiba'));
  }, []);
  useEffect(() => {
    const s = JSON.stringify(ertek);
    if (s === utolso.current) return;
    fuggo.current = ertek;
    setAllapot('var');
    clearTimeout(idozito.current);
    idozito.current = setTimeout(vegrehajt, kesleltetes);
  }, [JSON.stringify(ertek)]); // eslint-disable-line
  useEffect(() => () => vegrehajt(), []); // eslint-disable-line
  // külső frissítés (betöltés) után a tárolt érték az alap, nem kell menteni
  const alap = useCallback((v) => { utolso.current = JSON.stringify(v); }, []);
  return { allapot, most: vegrehajt, alap };
}

export function MentesJel({ allapot }) {
  const t = { mentve: ['jo', '✓ Mentve'], var: ['var', 'Mentetlen…'], ment: ['var', 'Mentés…'], hiba: ['rossz', '⚠ Nem mentődött'] }[allapot] || ['var', ''];
  return html`<span className=${'mentesjel mentesjel--' + t[0]} role="status">${t[1]}</span>`;
}

// ================= Öröklés a mezőkön =================

const HONNAN_NEV = { sablon: 'a sablonból', vilag: 'a világból', kampany: 'a kampányból' };

// Jelzi, honnan jön a mező értéke, és felülírt mezőnél visszaállítható az örököltre.
export function OroklesJel({ info, elem, onVissza }) {
  if (!elem || !elem.alap_id || !info) return null;
  if (info.sajat) {
    return html`<span className="orokles orokles--sajat">felülírva${info.orokolt.honnan ? html` <button type="button" className="orokles__vissza"
      onClick=${onVissza} title=${'Vissza az örökölt értékre (' + HONNAN_NEV[info.orokolt.honnan] + ')'}>visszaállítás</button>` : null}</span>`;
  }
  return info.honnan ? html`<span className="orokles">${HONNAN_NEV[info.honnan]}</span>` : null;
}

// Egy örökölhető szöveges mező (a címke mellett a forrás jele).
export function ElemMezo({ elem, ix, mezo, label, multiline, rows, hint, placeholder, onValt }) {
  const info = E.mezoErtek(elem, mezo, ix);
  const ertek = info.ertek === undefined || info.ertek === null ? '' : String(info.ertek);
  return html`<div className="elemmezo">
    <${K.TextField} label=${html`${label} <${OroklesJel} info=${info} elem=${elem} onVissza=${() => onValt(E.visszaallit(elem, mezo))}/>`}
      multiline=${multiline} rows=${rows} hint=${hint} placeholder=${placeholder} value=${ertek}
      onChange=${(e) => onValt(E.mezoBeallit(elem, mezo, e.target.value, ix))}/>
  </div>`;
}

function CimkeMezo({ elem, ix, onValt }) {
  const info = E.mezoErtek(elem, 'cimkek', ix);
  const [szoveg, setSzoveg] = useState((info.ertek || []).join(', '));
  useEffect(() => { const most = (info.ertek || []).join(', '); if (most !== szoveg.split(',').map((x) => x.trim()).filter(Boolean).join(', ')) setSzoveg(most); }, [JSON.stringify(info.ertek)]); // eslint-disable-line
  return html`<${K.TextField} label=${html`Címkék <${OroklesJel} info=${info} elem=${elem} onVissza=${() => onValt(E.visszaallit(elem, 'cimkek'))}/>`}
    hint="Vesszővel elválasztva." value=${szoveg}
    onChange=${(e) => { setSzoveg(e.target.value); onValt(E.mezoBeallit(elem, 'cimkek', e.target.value.split(',').map((x) => x.trim()).filter(Boolean), ix)); }}/>`;
}

// ================= Útvonalak =================

// Egy elem szerkesztőjének útvonala a nézet szerint (kampányban a kampány útvonala, akkor is, ha világelem).
export function elemUt(cel, id) {
  if (cel.szint === 'kampany') return '#/dm/kampany/' + cel.kampany_id + '/epito/elem/' + id;
  if (cel.szint === 'vilag') return '#/dm/vilag/' + cel.vilag_id + '/elem/' + id;
  return '#/dm/sablonok/' + id;
}

const SZINT_TONUS = { sablon: 'neutral', vilag: 'accent', kampany: 'success' };
export function SzintJel({ elem }) {
  const sz = E.szint(elem);
  return html`<${K.Badge} tone=${SZINT_TONUS[sz]}>${E.SZINTEK[sz]}<//>`;
}

// ================= Elemlista fában, típusonként =================

// elemek: a megjelenítendők (már szűrve). Típusonként fa; a sorra kattintva a szerkesztő nyílik.
export function ElemFa({ elemek, ix, cel, aktivId }) {
  const sor = (cs, melyseg) => html`<li key=${cs.elem.id}>
    <a className=${'elemfa__sor' + (cs.elem.id === aktivId ? ' elemfa__sor--aktiv' : '') + (cs.elem.aktiv === false ? ' elemfa__sor--archivalt' : '')}
      href=${elemUt(cel, cs.elem.id)} style=${{ paddingLeft: 8 + melyseg * 20 + 'px' }} aria-current=${cs.elem.id === aktivId ? 'page' : undefined}>
      <span className="elemfa__nev">${E.nev(cs.elem, ix)}</span>
      ${cs.elem.alap_id ? html`<span className="halvany kicsi" title="Alapra épül">↳ ${E.nev(ix.get(cs.elem.alap_id), ix)}</span>` : null}
      ${cel.szint !== E.szint(cs.elem) ? html`<${SzintJel} elem=${cs.elem}/>` : null}
      ${(E.megjelenitett(cs.elem, ix).allapot || 'vazlat') === 'kesz' ? html`<span className="elemfa__kesz" title="kész">✓</span>` : null}
    </a>
    ${cs.gyerekek.length ? html`<ul className="elemfa">${cs.gyerekek.map((g) => sor(g, melyseg + 1))}</ul>` : null}
  </li>`;
  const tipusok = Object.keys(E.ELEMTIPUSOK).filter((t) => elemek.some((e) => e.tipus === t));
  if (!tipusok.length) return html`<p className="halvany">Még nincs elem.</p>`;
  return html`<div className="verem">${tipusok.map((t) => html`<div key=${t}>
    <p className="cimke">${E.ELEMTIPUSOK[t].tobbes}</p>
    <ul className="elemfa">${F.fa(elemek.filter((e) => e.tipus === t), ix).map((cs) => sor(cs, 0))}</ul>
  </div>`)}</div>`;
}

// ================= Új elem =================

// cel: a nézet; szulo: ha egy elem alá kerül. A kiindulás lehet üres, sablon vagy (kampányban) világelem.
// maradj: létrehozás után nem nyílik meg a szerkesztő (például a Kalandok fájából). elokeszit(e, { alapbol }): az új
// elem kiegészítése mentés előtt (saját mezők alapértéke). extra: további mezők a párbeszéd alján.
export function UjElemParbeszed({ prep, cel, szulo, tipusok, onBezar, maradj, elokeszit, cim, extra }) {
  const lehetseges = (tipusok || Object.keys(E.ELEMTIPUSOK)).filter((t) => !E.ELEMTIPUSOK[t].csakSablon || cel.szint === 'sablon')
    .filter((t) => !szulo || E.ELEMTIPUSOK[t].szulok.includes(szulo.tipus));
  const [tipus, setTipus] = useState(lehetseges[0] || 'helyszin');
  const [nev, setNev] = useState('');
  const [alap, setAlap] = useState('');
  const [favalEgyutt, setFavalEgyutt] = useState(true);
  const [fut, indit] = useMuvelet();
  const minta = { tipus, vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' };
  const jeloltek = E.alapJeloltek(minta, (prep.adat && prep.adat.elemek) || []);
  const alapElem = alap ? prep.ix.get(alap) : null;
  const alapLeszarmazottak = alapElem && FAVAL_PELDANYOSITHATO.includes(alapElem.tipus)
    ? F.leszarmazottak(alapElem, prep.adat.elemek).filter((x) => x.aktiv !== false) : [];
  const letrehoz = () => indit(async () => {
    const id = ujAzon('el');
    const celAdat = { ...minta, szulo_id: szulo ? szulo.id : '', sorrend: F.kovetkezoSorrend(prep.adat.elemek, szulo ? szulo.id : '') };
    let e;
    let tovabbiak = [];
    if (alap) {
      if (alapLeszarmazottak.length && favalEgyutt) {
        let elso = true;
        const lista = peldanyFa(alapElem, prep.adat.elemek, celAdat, () => (elso ? (elso = false, id) : ujAzon('el')));
        e = lista[0];
        tovabbiak = lista.slice(1);
      } else {
        e = E.peldany(alapElem, celAdat, id);
      }
      if (nev.trim()) e = E.mezoBeallit(e, 'nev', nev.trim(), E.index(prep.adat.elemek.concat([e])));
    } else {
      if (!nev.trim()) throw new Error('Adj nevet az elemnek.');
      e = E.ujElem(tipus, celAdat, id, nev.trim());
    }
    const ixUj = E.index(prep.adat.elemek.concat([e]));
    if (elokeszit) e = elokeszit(e, { alapbol: !!alap, ix: ixUj }) || e;
    const h = E.ellenoriz(e, E.index(prep.adat.elemek.concat([e])));
    if (h.length) throw new Error(h[0]);
    prep.elemMent(e).catch(() => {});
    tovabbiak.forEach((x) => prep.elemMent(x).catch(() => {}));
    onBezar(e);
    if (!maradj) navigal(elemUt(cel, id).slice(1));
  });
  return html`<${Parbeszed} cim=${cim || (szulo ? 'Új elem ez alá: ' + E.nev(szulo, prep.ix) : 'Új elem')} onBezar=${() => onBezar()} lab=${html`
    <${K.Button} variant="quiet" onClick=${() => onBezar()}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${letrehoz}>Létrehozás<//>`}>
    <div className="verem">
      ${lehetseges.length > 1 ? html`<${Valaszto} label="Típus" value=${tipus} onChange=${(t) => { setTipus(t); setAlap(''); }}
        opciok=${lehetseges.map((t) => ({ value: t, label: E.ELEMTIPUSOK[t].nev + (E.ELEMTIPUSOK[t].alepes !== '5.1' && !SAJAT_LEPESEK[t] && !SAJAT_MEZOK[t] ? ' (saját mezői: ' + E.ELEMTIPUSOK[t].alepes + ')' : '') }))}/>` : null}
      ${cel.szint !== 'sablon' ? html`<${Valaszto} label="Kiindulás" value=${alap} onChange=${setAlap} ures="üres elem"
        hint="Sablonra vagy világelemre építve az elem az alapját követi, csak az eltéréseit tárolja (felülírás). Később leválasztható."
        opciok=${jeloltek.map((x) => ({ value: x.id, label: E.nev(x, prep.ix) + ' (' + E.SZINTEK[E.szint(x)].toLowerCase() + ')' }))}/>` : null}
      <${K.TextField} label="Név" value=${nev} onChange=${(e) => setNev(e.target.value)} placeholder=${alap ? E.nev(prep.ix.get(alap), prep.ix) : ''}
        hint=${alap ? 'Üresen az alap neve látszik.' : ''}/>
      ${alapLeszarmazottak.length ? html`<${Jelolo} checked=${favalEgyutt} onChange=${setFavalEgyutt}>
        A részeivel és jeleneteivel együtt (${alapLeszarmazottak.length} elem, mind az alapjára épülve)<//>` : null}
      ${extra || null}
    </div>
  <//>`;
}

// ================= Kapcsolatok =================

// A kapcsolat másik végének neve: elem, NJK, karakter vagy szörny.
function useNevFeloldo(prep) {
  const { api, szabalyok } = useApp();
  const njkk = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk');
  const init = useLekeres(async () => api.hivas('init'), [], 'init');
  const lapok = lapokBol(szabalyok);
  return useMemo(() => {
    const m = new Map();
    ((prep.adat && prep.adat.elemek) || []).forEach((e) => m.set(e.id, { nev: E.nev(e, prep.ix), fajta: E.ELEMTIPUSOK[e.tipus] ? E.ELEMTIPUSOK[e.tipus].nev : 'elem', elem: e }));
    (njkk.adat || []).forEach((n) => m.set(n.id, { nev: n.nev, fajta: 'NJK', ut: '#/dm/njk/' + n.id }));
    ((init.adat && init.adat.karakterek) || []).forEach((c) => m.set(c.id, { nev: c.nev, fajta: 'karakter', ut: '#/dm/karakter/' + c.id }));
    (lapok['Szörnyek'] || []).forEach((s) => m.set(s.id, { nev: megjelenitettNev(s), fajta: 'lény', ut: '#/dm/bestiarium/' + s.id }));
    return m;
  }, [prep.adat, prep.ix, njkk.adat, init.adat, lapok]);
}

export function KapcsolatokPanel({ elem, prep, cel }) {
  const nevek = useNevFeloldo(prep);
  const [uj, setUj] = useState(false);
  const sajat = KP.elemKapcsolatai(elem.id, (prep.adat && prep.adat.kapcsolatok) || []);
  return html`<${K.Panel} title="Kapcsolatok" actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUj(true)}
      icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új kapcsolat<//>`}>
    ${sajat.length ? html`<ul className="sorlista">${sajat.map((x) => {
      const m = nevek.get(x.masik);
      const href = m && m.elem ? elemUt(cel, x.masik) : m && m.ut;
      return html`<li key=${x.kapcsolat.id + x.irany} className="sorlista__sor">
        <div><span className="halvany">${x.felirat}:</span> ${href ? html`<a href=${href}>${m.nev}</a>` : html`<span>${m ? m.nev : x.masik}</span>`}
          ${m ? html` <span className="halvany kicsi">(${m.fajta})</span>` : null}
          ${x.kapcsolat.megjegyzes ? html`<div className="halvany kicsi">${x.kapcsolat.megjegyzes}</div>` : null}</div>
        <${K.Button} size="sm" variant="quiet" onClick=${() => prep.kapcsolatTorol(x.kapcsolat.id).catch(() => {})}>Törlés<//>
      </li>`;
    })}</ul>` : html`<p className="halvany">Nincs még kapcsolata. A kapcsolat bármely két elem, NJK, karakter vagy lény között lehet, és mindkettőjük lapján látszik.</p>`}
    ${uj ? html`<${UjKapcsolatParbeszed} elem=${elem} prep=${prep} cel=${cel} nevek=${nevek} onBezar=${() => setUj(false)}/>` : null}
  <//>`;
}

function UjKapcsolatParbeszed({ elem, prep, cel, nevek, onBezar }) {
  const [tipus, setTipus] = useState('resze');
  const [hova, setHova] = useState('');
  const [megj, setMegj] = useState('');
  const [keres, setKeres] = useState('');
  const [hiba, setHiba] = useState('');
  const csoportok = KP.tipusCsoportok();
  const s = keres.trim().toLowerCase();
  const jeloltek = Array.from(nevek.entries()).filter(([id, m]) => id !== elem.id && (!s || m.nev.toLowerCase().includes(s)))
    .sort((a, b) => a[1].fajta.localeCompare(b[1].fajta, 'hu') || a[1].nev.localeCompare(b[1].nev, 'hu'));
  const fajtak = Array.from(new Set(jeloltek.map(([, m]) => m.fajta)));
  const ment = () => {
    const k = { id: ujAzon('ln'), honnan: elem.id, hova, tipus, megjegyzes: megj.trim(),
      vilag_id: cel.szint === 'vilag' ? cel.vilag_id : '', kampany_id: cel.szint === 'kampany' ? cel.kampany_id : '' };
    // sablonok közti kapcsolat mindkét szint nélkül; a kampányban mindig a kampányhoz tartozik
    if (cel.szint === 'sablon') { k.vilag_id = ''; k.kampany_id = ''; }
    const h = KP.ellenoriz(k, (prep.adat && prep.adat.kapcsolatok) || []);
    if (h.length) { setHiba(h[0]); return; }
    prep.kapcsolatMent(k).catch(() => {});
    onBezar();
  };
  return html`<${Parbeszed} cim=${'Új kapcsolat: ' + E.nev(elem, prep.ix)} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!hova} onClick=${ment}>Kapcsolat mentése<//>`}>
    <div className="verem">
      <div className="ka-field">
        <label className="ka-field__label" htmlFor="kapcs-tipus">Kapcsolat</label>
        <select id="kapcs-tipus" className="ka-field__input valaszto" value=${tipus} onChange=${(e) => setTipus(e.target.value)}>
          ${Object.entries(csoportok).map(([cs, lista]) => html`<optgroup key=${cs} label=${cs}>
            ${lista.map((t) => html`<option key=${t.kulcs} value=${t.kulcs}>${E.nev(elem, prep.ix)}: ${t.nev} …</option>`)}</optgroup>`)}
        </select>
        <div className="ka-field__msg">A másik elem lapján: „${KP.tipusNev(tipus, 'be')}: ${E.nev(elem, prep.ix)}”.</div>
      </div>
      <${K.TextField} label="Keresés" value=${keres} onChange=${(e) => setKeres(e.target.value)} placeholder="név"/>
      <div className="ka-field">
        <label className="ka-field__label" htmlFor="kapcs-hova">Kivel vagy mivel</label>
        <select id="kapcs-hova" className="ka-field__input valaszto" value=${hova} onChange=${(e) => setHova(e.target.value)}>
          <option value="">Válassz…</option>
          ${fajtak.map((f) => html`<optgroup key=${f} label=${f}>${jeloltek.filter(([, m]) => m.fajta === f).slice(0, 200)
            .map(([id, m]) => html`<option key=${id} value=${id}>${m.nev}</option>`)}</optgroup>`)}
        </select>
      </div>
      <${K.TextField} label="Megjegyzés" value=${megj} onChange=${(e) => setMegj(e.target.value)} placeholder="nem kötelező"/>
      ${hiba ? html`<${Uzenet}>${hiba}<//>` : null}
    </div>
  <//>`;
}

// ================= Az általános elemszerkesztő =================

// A közös mezők, a fa (szülő, gyerekek), az öröklés műveletei, a kapcsolatok és a dobótábla. A típusok saját
// mezői a későbbi alépésekben kerülnek ide (sajatMezok).
export function ElemSzerkeszto({ id, prep, cel, Oldalfej, vissza, sajatMezok }) {
  const { uzen, szabalyok } = useApp();
  const elem = prep.adat ? prep.ix.get(id) : null;
  const [vazlat, setVazlat] = useState(elem);
  const [kerdes, setKerdes] = useState(null);
  const [ujGyerek, setUjGyerek] = useState(false);
  const [dobas, setDobas] = useState(false);
  const [lepes, setLepes] = useState('alap');
  const mentes = useAutoMentes(vazlat, (v) => prep.elemMent({ ...prep.elem(v.id), ...v, verzio: undefined }));
  // a betöltött vagy máshol mentett változat: ha nincs mentetlen módosítás, a vázlat követi
  useEffect(() => {
    if (!elem) return;
    if (!vazlat || vazlat.id !== elem.id || (mentes.allapot === 'mentve' && JSON.stringify(vazlat.adat) !== JSON.stringify(elem.adat))) {
      setVazlat(elem);
      mentes.alap(elem);
    }
  }, [elem && elem.id, elem && elem.verzio]); // eslint-disable-line
  if (!prep.adat) return prep.hiba ? html`<${Uzenet}>${prep.hiba.message}<//>` : html`<${Betoltes}/>`;
  if (!elem || !vazlat) return html`<div>${Oldalfej ? html`<${Oldalfej} cim="Elem" vissza=${vissza}/>` : null}<${Uzenet}>Nincs ilyen elem ebben a nézetben.<//></div>`;
  const ix = E.index(prep.adat.elemek.filter((x) => x.id !== vazlat.id).concat([vazlat]));
  const e = vazlat;
  const valt = (uj) => setVazlat(uj);
  const sz = E.szint(e);
  const tipus = E.ELEMTIPUSOK[e.tipus] || { nev: e.tipus, szulok: [] };
  const alap = e.alap_id ? ix.get(e.alap_id) : null;
  const gyerekek = F.gyerekek(prep.adat.elemek, e.id, ix);
  const peldanyok = E.peldanyai(e, prep.adat.elemek);
  const szuloJeloltek = prep.adat.elemek.filter((x) => x.id !== e.id && x.aktiv !== false && !F.athelyezesHiba(e, x.id, ix));
  const adat = E.megjelenitett(e, ix);
  const keretVilag = cel.szint === 'kampany' ? (prep.adat.keret && prep.adat.keret.keret.vilag_id) || '' : '';
  const masikSzinten = sz !== cel.szint; // például világelem a kampány nézetében

  const muvelet = (action, adat2, siker, cim) => { mentes.most(); return prep.elemMuvelet(action, adat2, cim).then((v) => { if (siker) uzen(siker); return v; }).catch(() => {}); };
  const valtozat = (celSzint) => {
    const id2 = ujAzon('el');
    const celAdat = { vilag_id: celSzint === 'vilag' ? (cel.vilag_id || keretVilag) : '', kampany_id: celSzint === 'kampany' ? cel.kampany_id : '',
      szulo_id: '', sorrend: 0 };
    let p = E.peldany(e, celAdat, id2);
    const sz2 = e.szulo_id ? ix.get(e.szulo_id) : null;
    if (sz2 && E.szulohozIllik(p, sz2)) p = { ...p, szulo_id: e.szulo_id, sorrend: (Number(e.sorrend) || 0) + 1 };
    prep.elemMent(p).catch(() => {});
    navigal(elemUt(cel, id2).slice(1));
    uzen(celSzint === 'kampany' ? 'Kampányváltozat készült: csak az eltéréseket kell beírni.' : 'Világváltozat készült.');
  };
  const sablonKeszit = () => {
    const elemekMost = prep.adat.elemek.map((x) => (x.id === e.id ? e : x));
    const lesz = FAVAL_PELDANYOSITHATO.includes(e.tipus) ? F.leszarmazottak(e, elemekMost).filter((x) => x.aktiv !== false) : [];
    if (lesz.length) {
      sablonFa(e, elemekMost, ix, () => ujAzon('el')).forEach((x) => prep.elemMent(x).catch(() => {}));
      uzen('Sablon készült a Sablontárban, ' + lesz.length + ' részével és jelenetével együtt.');
      return;
    }
    prep.elemMent(E.sablonbol(e, ix, ujAzon('el'))).catch(() => {});
    uzen('Sablon készült a Sablontárban.');
  };
  const dobasElfogad = (eredmeny, jegyzet, mezo, tablaNev) => {
    const regi = E.mezoErtek(e, mezo, ix).ertek || '';
    let uj = E.mezoBeallit(e, mezo, (regi ? regi + '\n\n' : '') + eredmeny, ix);
    const naplo = (uj.adat.dobasok || adat.dobasok || []).slice(-19).concat([{ ido: new Date().toISOString(), tabla: tablaNev, mezo, jegyzet }]);
    uj = { ...uj, adat: { ...uj.adat, dobasok: naplo } };
    valt(uj);
    setDobas(false);
  };

  const fej = Oldalfej ? html`<${Oldalfej} cim=${E.nev(e, ix)} vissza=${vissza}>
    <${MentesJel} allapot=${mentes.allapot}/>
    <${K.Button} size="sm" variant="secondary" onClick=${() => setDobas(true)} icon=${html`<${Ikon} nev="sarkanykocka" meret=${18}/>`}>Dobótábla<//>
  <//>` : null;

  const lepesDef = SAJAT_LEPESEK[e.tipus] || null;
  const sajat = lepesDef ? null : (sajatMezok || SAJAT_MEZOK[e.tipus]);
  const lepesek = lepesDef ? [{ kulcs: 'alap', nev: 'Alapadatok és szerkezet', allapot: String(adat.leiras || adat.osszefoglalo || '').trim() ? 'kesz' : 'ures' }]
    .concat(lepesDef.lepesek({ elem: e, ix })) : [];
  const aktivLepes = lepesek.some((l) => l.kulcs === lepes) ? lepes : 'alap';
  const lepesIndex = lepesek.findIndex((l) => l.kulcs === aktivLepes);
  const lepj = (kulcs) => { setLepes(kulcs); window.scrollTo(0, 0); };

  const alapTartalom = html`<div className="ket-hasab">
      <div className="verem">
        <${K.Panel} title="Alapadatok">
          <div className="verem">
            <${ElemMezo} elem=${e} ix=${ix} mezo="nev" label="Név" onValt=${valt}/>
            <${ElemMezo} elem=${e} ix=${ix} mezo="osszefoglalo" label="Rövid összefoglaló" hint="Egy-két mondat, a listákban is látszik." onValt=${valt}/>
            <${ElemMezo} elem=${e} ix=${ix} mezo="leiras" label="Leírás" multiline=${true} rows=${6} onValt=${valt}/>
            <${ElemMezo} elem=${e} ix=${ix} mezo="felolvasando" label="Felolvasandó szöveg" multiline=${true} rows=${4}
              hint="Amit a játékosoknak szó szerint felolvasol." onValt=${valt}/>
            <${ElemMezo} elem=${e} ix=${ix} mezo="titkok" label="A DM titkai" multiline=${true} rows=${4} hint="Csak te látod." onValt=${valt}/>
            ${e.tipus === 'helyszin' && !String(adat.titkok || '').trim() ? html`<${Uzenet} tonus="warning">A könyv tanácsa: minden helyszínnek legyen titka (4. fejezet).<//>` : null}
            <${CimkeMezo} elem=${e} ix=${ix} onValt=${valt}/>
            <div className="sorban">
              <${Valaszto} label="Állapot" value=${adat.allapot || 'vazlat'} onChange=${(x) => valt(E.mezoBeallit(e, 'allapot', x, ix))}
                opciok=${Object.entries(E.ALLAPOTOK).map(([value, label]) => ({ value, label }))}/>
              ${adat.forras ? html`<p className="halvany kicsi">Forrás: ${adat.forras}${adat.oldal ? ', ' + adat.oldal + '. oldal' : ''}</p>` : null}
            </div>
          </div>
        <//>
        ${sajat ? sajat({ elem: e, ix, valt, prep, cel }) : !lepesDef && tipus.alepes && tipus.alepes !== '5.1' ? html`<p className="halvany kicsi">A ${tipus.nev.toLowerCase()} saját mezői a(z) ${tipus.alepes} alépésben kerülnek ide (a könyv megfelelő fejezete szerint).</p>` : null}
        ${(adat.dobasok || []).length ? html`<${K.Panel} title="Dobások menete">
          <ul className="sorlista">${adat.dobasok.slice().reverse().map((d, i) => html`<li key=${i} className="sorlista__sor sorlista__sor--fuggoleges">
            <span className="halvany kicsi">${idopont(d.ido)} · ${d.tabla} → ${E.MEZO_NEV[d.mezo] || d.mezo}</span>
            <pre className="dobasmenet">${d.jegyzet}</pre></li>`)}</ul>
        <//>` : null}
      </div>
      <div className="verem">
        <${K.Panel} title="Helye a szerkezetben">
          <div className="verem">
            ${tipus.szulok.length ? html`<${Valaszto} label="Szülő" value=${e.szulo_id || ''} ures="nincs (gyökér)"
              onChange=${(x) => valt({ ...e, szulo_id: x, sorrend: F.kovetkezoSorrend(prep.adat.elemek, x) })}
              opciok=${szuloJeloltek.map((x) => ({ value: x.id, label: F.utvonal(x, ix) }))}/>` : html`<p className="halvany kicsi">${tipus.nev}: a fa gyökerében áll.</p>`}
            ${gyerekek.length ? html`<div><p className="cimke">Benne</p><ul className="elemfa">${gyerekek.map((g) => html`<li key=${g.id}>
              <a className="elemfa__sor" href=${elemUt(cel, g.id)}><span className="elemfa__nev">${E.nev(g, ix)}</span>
              <span className="halvany kicsi">${(E.ELEMTIPUSOK[g.tipus] || {}).nev}</span></a></li>`)}</ul></div>` : null}
            ${Object.values(E.ELEMTIPUSOK).some((t) => t.szulok.includes(e.tipus)) ? html`<div><${K.Button} size="sm" variant="secondary" onClick=${() => setUjGyerek(true)}
              icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új elem ez alá<//></div>` : null}
          </div>
        <//>
        <${KapcsolatokPanel} elem=${e} prep=${prep} cel=${cel}/>
        <${KepekPanel} elem=${e} ix=${ix} valt=${valt} prep=${prep}/>
        <${K.Panel} title="Öröklés és szint">
          <div className="verem">
            <p className="sugo kicsi">${sz === 'sablon' ? 'Sablon: világtól független minta. Világ- vagy kampányelem épülhet rá.'
              : sz === 'vilag' ? 'Világelem: több kampányban visszatér. Kampányelem épülhet rá, csak az eltéréseit tárolva.'
              : 'Kampányelem: csak ebben a kampányban él.'}${alap ? ' Az alapjától örökli, amit nem írsz felül; a felülírt mezőknél „visszaállítás” állítja vissza.' : ''}</p>
            <div className="gombsor gombsor--szoros">
              ${alap ? html`<${K.Button} size="sm" onClick=${() => setKerdes('levalaszt')}>Leválasztás<//>` : null}
              ${sz === 'kampany' ? html`<${K.Button} size="sm" disabled=${!keretVilag} onClick=${() => setKerdes('emel')}>Világelemmé emelés<//>` : null}
              <${K.Button} size="sm" onClick=${sablonKeszit}>Sablon készítése<//>
              ${e.aktiv === false
                ? html`<${K.Button} size="sm" onClick=${() => muvelet('element.archive', { id: e.id, aktiv: true }, 'Visszaállítva.')}>Visszaállítás<//>
                  <${K.Button} size="sm" variant="danger" onClick=${() => setKerdes('torol')}>Törlés<//>`
                : html`<${K.Button} size="sm" variant="quiet" onClick=${() => muvelet('element.archive', { id: e.id, aktiv: false }, 'Archiválva.')}>Archiválás<//>`}
            </div>
            ${sz === 'kampany' && !keretVilag ? html`<p className="halvany kicsi">Világelemmé emelni akkor lehet, ha a kampánykeretben ki van választva a világ.</p>` : null}
            ${peldanyok.length ? html`<p className="halvany kicsi">Erre épül: ${peldanyok.map((p) => E.nev(p, ix)).join(', ')}.</p>` : null}
            <p className="halvany kicsi">${e.verzio ? e.verzio + '. verzió' : 'még nincs mentve'}${e.modositva ? ' · ' + idopont(e.modositva) : ''}</p>
          </div>
        <//>
      </div>
    </div>`;

  return html`<div>
    ${fej}
    <div className="cimkek elem__cimkek">
      <${K.Badge}>${tipus.nev}<//><${SzintJel} elem=${e}/>
      ${e.aktiv === false ? html`<${K.Badge} tone="warning">Archivált<//>` : null}
      ${alap ? html`<span className="halvany kicsi">Alapja: <a href=${elemUt(cel, alap.id)}>${E.nev(alap, ix)}</a> (${E.SZINTEK[E.szint(alap)].toLowerCase()})</span>` : null}
      ${e.szulo_id && ix.get(e.szulo_id) ? html`<span className="halvany kicsi">Helye: ${F.utvonal(ix.get(e.szulo_id), ix)}</span>` : null}
    </div>
    ${masikSzinten ? html`<div className="oldalfej__uzenet"><${Uzenet} tonus="warning">
      ${sz === 'sablon' ? 'Ez sablon: a módosítás minden rá épülő elemre hat.' : 'Ez világelem: a módosítás a világ minden kampányára hat.'}
      Ha csak itt térne el, készíts ${cel.szint === 'kampany' ? 'kampányváltozatot' : 'világváltozatot'} (csak az eltéréseket tárolja).
      <span className="gombsor gombsor--szoros"><${K.Button} size="sm" onClick=${() => valtozat(cel.szint)}>${cel.szint === 'kampany' ? 'Kampányváltozat' : 'Világváltozat'}<//></span><//></div>` : null}
    ${lepesDef ? html`<div className="keret">
      <nav className="keret__lepesek" aria-label=${'A ' + tipus.nev.toLowerCase() + ' lépései'}>
        <p className="cimke">A könyv lépései</p>
        <ul className="lepeslista">${lepesek.map((l, i) => html`<li key=${l.kulcs}>
          <button type="button" aria-current=${l.kulcs === aktivLepes ? 'step' : undefined} onClick=${() => lepj(l.kulcs)}>
            <span className=${'lepeslista__pont' + (l.allapot === 'kesz' ? ' lepeslista__pont--kesz' : l.allapot === 'resz' ? ' lepeslista__pont--resz' : '')}>${l.allapot === 'kesz' ? '✓' : i === 0 ? '•' : i}</span>${l.nev}</button></li>`)}
        </ul>
        <p className="halvany kicsi">Minden lépés kihagyható: a könyv szerint is csak annyit érdemes kidolgozni, amennyi a következő alkalmakhoz kell.</p>
      </nav>
      <div className="verem keret__tartalom">
        ${aktivLepes === 'alap' ? alapTartalom : lepesDef.tartalom(aktivLepes, { elem: e, ix, valt, prep, cel })}
        <div className="gombsor elem__lepesgombok">
          ${lepesIndex > 0 ? html`<${K.Button} variant="secondary" onClick=${() => lepj(lepesek[lepesIndex - 1].kulcs)}>← ${lepesek[lepesIndex - 1].nev}<//>` : null}
          ${lepesIndex < lepesek.length - 1 ? html`<${K.Button} variant="secondary" onClick=${() => lepj(lepesek[lepesIndex + 1].kulcs)}>${lepesek[lepesIndex + 1].nev} →<//>` : null}
        </div>
      </div>
    </div>` : alapTartalom}
    ${ujGyerek ? html`<${UjElemParbeszed} prep=${prep} cel=${cel} szulo=${e} onBezar=${() => setUjGyerek(false)}/>` : null}
    ${dobas ? html`<${DobotablaParbeszed} onBezar=${() => setDobas(false)} kikapcsolt=${cel.szint === 'kampany' && prep.adat.keret ? prep.adat.keret.keret.generator_kikapcsolt : null}
      onElfogad=${dobasElfogad} lapok=${lapokBol(szabalyok)}/>` : null}
    ${kerdes === 'levalaszt' ? html`<${Megerosites} cim="Leválasztás" gomb="Leválasztás"
      szoveg=${'Az örökölt értékek bemásolódnak, és az elem többé nem követi az alapját (' + (alap ? E.nev(alap, ix) : '') + '). Ez nem vonható vissza.'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); muvelet('element.detach', { id: e.id }, 'Leválasztva.', 'A leválasztás'); }}/>` : null}
    ${kerdes === 'emel' ? html`<${Megerosites} cim="Világelemmé emelés" gomb="Emelés"
      szoveg="Az elem a világ része lesz, így más kampányokban is visszatérhet. A kapcsolatai megmaradnak; ha egy kampányelem alatt állt, a fa gyökerébe kerül."
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); muvelet('element.promote', { id: e.id, vilag_id: keretVilag }, 'Világelem lett.', 'Az emelés'); }}/>` : null}
    ${kerdes === 'torol' ? html`<${Megerosites} cim="Törlés" gomb="Végleges törlés" veszelyes=${true}
      szoveg="Az elem és a kapcsolatai véglegesen törlődnek. Gyerekes vagy alapként használt elem nem törölhető."
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); muvelet('element.delete', { id: e.id }, 'Törölve.', 'A törlés').then((v) => { if (v) navigal(vissza ? vissza[0].slice(1) : '/dm'); }); }}/>` : null}
  </div>`;
}

// ================= Világ =================

// Az Alapkönyv 11. fejezete (Building a Setting) szerinti világépítési módok.
export const VILAGEPITES_MODOK = {
  kesz: 'Kész világ (Using a Pre-Built Setting)',
  atvett: 'Egy kitalált világ átvétele (Adapt a Fictional World)',
  sajat: 'Saját világ (Create Your Own Setting)',
  kozos: 'Közös világépítés (Collaborative World Building)',
  rogtonzott: 'Rögtönzött fejlődés (Improvised Evolution)',
  vegyes: 'Vegyesen (Mix and Match)'
};

export function VilagokOldal({ Oldalfej }) {
  const prep = usePrep({ szint: 'sablon' });
  const [uj, setUj] = useState(false);
  const [nev, setNev] = useState('');
  const vilagok = (prep.adat && prep.adat.vilagok) || [];
  const letrehoz = () => {
    if (!nev.trim()) return;
    const id = ujAzon('w');
    setUj(false);
    // a világ oldala külön tölt be, ezért a mentés után nyílik meg
    prep.vilagMent({ id, nev: nev.trim(), adat: {}, aktiv: true }).then(() => navigal('/dm/vilag/' + id)).catch(() => {});
  };
  return html`<div>
    <${Oldalfej} cim="Világ">
      <${K.Button} variant="primary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új világ<//>
    <//>
    <${K.Panel} title="Világok">
      ${!prep.adat ? html`<${Betoltes}/>` : vilagok.length ? html`<ul className="sorlista">${vilagok.map((w) => html`<li key=${w.id} className="sorlista__sor">
        <div><a className="sorlista__nev" href=${'#/dm/vilag/' + w.id}>${w.nev}</a>${w.aktiv === false ? html` <${K.Badge}>Archivált<//>` : null}
          ${w.adat && w.adat.alapkoncepcio ? html`<div className="halvany kicsi">${w.adat.alapkoncepcio}</div>` : null}</div>
        <${K.Button} size="sm" onClick=${() => navigal('/dm/vilag/' + w.id)}>Megnyitás<//></li>`)}</ul>`
        : html`<p className="halvany">Még nincs világ. A világ elemei (helyszínek, csoportok, istenségek, visszatérő szereplők) több kampányban is visszatérhetnek; a kampány a kampánykeretben választja ki a világát.</p>`}
    <//>
    ${uj ? html`<${Parbeszed} cim="Új világ" onBezar=${() => setUj(false)} lab=${html`<${K.Button} variant="quiet" onClick=${() => setUj(false)}>Mégse<//>
      <${K.Button} variant="primary" disabled=${!nev.trim()} onClick=${letrehoz}>Létrehozás<//>`}>
      <${K.TextField} label="A világ neve" value=${nev} onChange=${(e) => setNev(e.target.value)}/>
    <//>` : null}
  </div>`;
}

export function VilagOldal({ id, ut, Oldalfej }) {
  const cel = useMemo(() => ({ szint: 'vilag', vilag_id: id }), [id]);
  const prep = usePrep(cel);
  if (ut[0] === 'elem' && ut[1]) {
    return html`<${ElemSzerkeszto} key=${ut[1]} id=${ut[1]} prep=${prep} cel=${cel} Oldalfej=${Oldalfej}
      vissza=${['#/dm/vilag/' + id, (prep.adat && (prep.adat.vilagok || []).find((w) => w.id === id) || {}).nev || 'Világ']}/>`;
  }
  return html`<${VilagAttekintes} id=${id} prep=${prep} cel=${cel} Oldalfej=${Oldalfej}/>`;
}

function VilagAttekintes({ id, prep, cel, Oldalfej }) {
  const [uj, setUj] = useState(false);
  const [szoveg, setSzoveg] = useState('');
  const [archivalt, setArchivalt] = useState(false);
  const vilag = prep.adat ? (prep.adat.vilagok || []).find((w) => w.id === id) : null;
  const [vazlat, setVazlat] = useState(vilag);
  const mentes = useAutoMentes(vazlat, (v) => prep.vilagMent(v));
  useEffect(() => { if (vilag && (!vazlat || (mentes.allapot === 'mentve' && JSON.stringify(vazlat) !== JSON.stringify({ ...vilag, verzio: vazlat.verzio })))) { setVazlat(vilag); mentes.alap(vilag); } }, [vilag && vilag.verzio]); // eslint-disable-line
  if (!prep.adat) return prep.hiba ? html`<${Uzenet}>${prep.hiba.message}<//>` : html`<${Betoltes}/>`;
  if (!vilag || !vazlat) return html`<div><${Oldalfej} cim="Világ" vissza=${['#/dm/vilag', 'Világ']}/><${Uzenet}>Nincs ilyen világ.<//></div>`;
  const a = vazlat.adat || {};
  const allit = (m, x) => setVazlat({ ...vazlat, adat: { ...a, [m]: x } });
  const vilagElemek = prep.adat.elemek.filter((e) => e.vilag_id === id);
  const szurt = E.szures(vilagElemek, { szoveg, archivalt, ix: prep.ix });
  const archivDb = vilagElemek.filter((e) => e.aktiv === false).length;
  return html`<div>
    <${Oldalfej} cim=${vazlat.nev || 'Világ'} vissza=${['#/dm/vilag', 'Világ']}>
      <${MentesJel} allapot=${mentes.allapot}/>
      <${K.Button} variant="primary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új világelem<//>
    <//>
    <div className="ket-hasab">
      <div className="verem">
        <${K.Panel} title="A világ">
          <div className="verem">
            <${K.TextField} label="Név" value=${vazlat.nev} onChange=${(e) => setVazlat({ ...vazlat, nev: e.target.value })}/>
            <${K.TextField} label="Alapkoncepció" hint="A munkalap High Concept mezője: egy-két mondat a világról." multiline=${true} rows=${2}
              value=${a.alapkoncepcio || ''} onChange=${(e) => allit('alapkoncepcio', e.target.value)}/>
            <${Valaszto} label="A világépítés módja" hint="Alapkönyv, 11. fejezet." value=${a.epites_modja || ''} ures="nincs megadva"
              onChange=${(x) => allit('epites_modja', x)} opciok=${Object.entries(VILAGEPITES_MODOK).map(([value, label]) => ({ value, label }))}/>
            <${K.TextField} label="Fontos jellemzők" hint="A munkalap Important Features mezője: ami a világot megkülönbözteti." multiline=${true} rows=${4}
              value=${a.fontos_jellemzok || ''} onChange=${(e) => allit('fontos_jellemzok', e.target.value)}/>
            <${K.TextField} label="Leírás" multiline=${true} rows=${6} value=${a.leiras || ''} onChange=${(e) => allit('leiras', e.target.value)}/>
            <${K.TextField} label="A DM titkai" hint="Csak te látod." multiline=${true} rows=${4} value=${a.titkok || ''} onChange=${(e) => allit('titkok', e.target.value)}/>
            <p className="halvany kicsi">A világ földrajza a helyszínek fájából áll (régió, ország, település, hely, üzlet); az istenségek az 5.8 alépésben jönnek.</p>
            <div className="gombsor gombsor--szoros">
              ${vazlat.aktiv === false
                ? html`<${K.Button} size="sm" onClick=${() => setVazlat({ ...vazlat, aktiv: true })}>Visszaállítás<//>`
                : html`<${K.Button} size="sm" variant="quiet" onClick=${() => setVazlat({ ...vazlat, aktiv: false })}>Archiválás<//>`}
            </div>
          </div>
        <//>
      </div>
      <div className="verem">
        ${VILAG_PANELEK.map((P, i) => html`<${P} key=${i} prep=${prep} cel=${cel} vazlat=${vazlat} setVazlat=${setVazlat}/>`)}
        <${K.Panel} title="Világelemek">
          <div className="verem">
            <${K.TextField} label="Keresés" value=${szoveg} onChange=${(e) => setSzoveg(e.target.value)}/>
            ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
            <${ElemFa} elemek=${szurt} ix=${prep.ix} cel=${cel}/>
          </div>
        <//>
      </div>
    </div>
    ${uj ? html`<${UjElemParbeszed} prep=${prep} cel=${cel} onBezar=${() => setUj(false)}/>` : null}
  </div>`;
}

// ================= Sablontár =================

export function SablonokOldal({ azon, Oldalfej }) {
  const cel = useMemo(() => ({ szint: 'sablon' }), []);
  const prep = usePrep(cel);
  const [uj, setUj] = useState(false);
  const [szoveg, setSzoveg] = useState('');
  const [archivalt, setArchivalt] = useState(false);
  if (azon) {
    const e = prep.adat ? prep.ix.get(azon) : null;
    if (e && e.tipus === 'keret') return html`<${KeretSablon} elem=${e} prep=${prep} Oldalfej=${Oldalfej}/>`;
    return html`<${ElemSzerkeszto} key=${azon} id=${azon} prep=${prep} cel=${cel} Oldalfej=${Oldalfej} vissza=${['#/dm/sablonok', 'Sablontár']}/>`;
  }
  const sablonok = prep.adat ? prep.adat.elemek.filter((e) => E.szint(e) === 'sablon') : [];
  const szurt = E.szures(sablonok, { szoveg, archivalt, ix: prep.ix });
  const archivDb = sablonok.filter((e) => e.aktiv === false).length;
  return html`<div>
    <${Oldalfej} cim="Sablontár">
      <${K.Button} variant="primary" onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új sablon<//>
    <//>
    <div className="ket-hasab">
      <${K.Panel} title="Sablonok">
        <div className="verem">
          <${K.TextField} label="Keresés" value=${szoveg} onChange=${(e) => setSzoveg(e.target.value)}/>
          ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
          ${!prep.adat ? html`<${Betoltes}/>` : html`<${ElemFa} elemek=${szurt} ix=${prep.ix} cel=${cel}/>`}
        </div>
      <//>
      <${K.Panel} title="Mi a sablon?">
        <p className="szoveg">A sablon világtól független minta (például „Kikötői kocsma”, „Zsoldoscsapat”). Világ- vagy kampányelem épülhet rá: az
          alapja minden mezőjét örökli, és csak az eltéréseit tárolja. Bármely elemből készíthető sablon, a kampánykeretből is (a keret oldalán).</p>
      <//>
    </div>
    ${uj ? html`<${UjElemParbeszed} prep=${prep} cel=${cel} tipusok=${Object.keys(E.ELEMTIPUSOK).filter((t) => t !== 'keret')} onBezar=${() => setUj(false)}/>` : null}
  </div>`;
}

// Kampánykeret sablon: a keret tartalma csak olvasható összefoglalóként (a keret oldalán szerkeszthető és frissíthető).
function KeretSablon({ elem, prep, Oldalfej }) {
  const [vazlat, setVazlat] = useState(elem);
  const mentes = useAutoMentes(vazlat, (v) => prep.elemMent({ ...prep.elem(v.id), ...v, verzio: undefined }));
  const ix = prep.ix;
  const k = (vazlat.adat && vazlat.adat.keret) || {};
  return html`<div>
    <${Oldalfej} cim=${E.nev(vazlat, ix)} vissza=${['#/dm/sablonok', 'Sablontár']}><${MentesJel} allapot=${mentes.allapot}/><//>
    <div className="ket-hasab">
      <${K.Panel} title="Kampánykeret sablon">
        <div className="verem">
          <${ElemMezo} elem=${vazlat} ix=${ix} mezo="nev" label="Név" onValt=${setVazlat}/>
          <${ElemMezo} elem=${vazlat} ix=${ix} mezo="osszefoglalo" label="Rövid összefoglaló" onValt=${setVazlat}/>
          <p className="halvany kicsi">A keret tartalmát egy kampány kampánykeret oldalán szerkesztheted: „Kiindulás sablonból”, majd „Mentés sablonként” ugyanezzel a névvel frissíti.</p>
          <div className="gombsor gombsor--szoros">
            ${vazlat.aktiv === false
              ? html`<${K.Button} size="sm" onClick=${() => prep.elemMuvelet('element.archive', { id: vazlat.id, aktiv: true })}>Visszaállítás<//>`
              : html`<${K.Button} size="sm" variant="quiet" onClick=${() => prep.elemMuvelet('element.archive', { id: vazlat.id, aktiv: false })}>Archiválás<//>`}
          </div>
        </div>
      <//>
      <${K.Panel} title="Tartalom">
        <dl className="ertekek ertekek--lista">
          <div><dt>Téma</dt><dd>${k.tema || 'nincs megadva'}</dd></div>
          <div><dt>Végső ellenfél</dt><dd>${(k.veg && k.veg.ellenfel && k.veg.ellenfel.nev) || 'nincs megadva'}</dd></div>
          <div><dt>Záró jelenet</dt><dd>${(k.veg && k.veg.zaro_jelenet) || 'nincs megadva'}</dd></div>
        </dl>
      <//>
    </div>
  </div>`;
}
