// Összecsapás-építő (DM, 3. lépés, 3. ütem): a kampány összecsapásai, a szerkesztő oldalakkal, viszonyokkal,
// kezdeményezési csoportokkal és résztvevőkkel, a tájékoztató nehézség, az „Összecsapásba” párbeszéd
// (Bestiárium, NJK-tár) és a csata kampánybeállításai. Szabályok: web/js/jatek/osszecsapas.js. Terv: claude/csata-terv.md.
import {
  html, K, useApp, useState, useEffect, useMemo, useLekeres, useMuvelet, navigal, Ikon, Betoltes, Uzenet, Valaszto, Jelolo,
  Parbeszed, Megerosites, Sugo, idopont
} from './kozos.js';
import { useKampanyAllapot } from './jatek.js';
import { Statblokk } from './bestiarium.js';
import { KarakterKep } from './kepek.js';
import * as O from '../jatek/osszecsapas.js';
import * as LN from '../jatek/leny.js';
import { CsataInditasParbeszed, csataUt } from './csata.js';

const masol = (x) => JSON.parse(JSON.stringify(x));
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || null;
const fenyegetesTonus = (f) => ({ 'Mérsékelt': 'accent', 'Komoly': 'warning', 'Súlyos': 'danger', 'Legendás': 'dragon' }[f]);
const ALLAPOT_NEV = { 'előkészítés': 'Előkészítés', 'kész': 'Kész', 'lefutott': 'Lefutott' };
const ALLAPOT_TONUS = { 'kész': 'success', 'lefutott': undefined };
const aktivKarakter = (c) => !c.kampany_allapot || c.kampany_allapot === 'aktív';
const futoKampany = (k) => k.allapot !== 'lezárva' && k.allapot !== 'archivált';

// A nehézségbecslés környezete a kampány állapotából és a szabályadatból.
function kornyezetBol(allapot, lapok, tarNjkk) {
  const njkk = (allapot.njkk || []).concat((tarNjkk || []).filter((n) => !(allapot.njkk || []).some((x) => x.id === n.id)));
  const karakterek = (allapot.karakterek || []).map((c) => ({ id: c.id, nev: c.nev, szint: Number(c.szint) || 1 }));
  return {
    szornyek: (lapok && lapok['Szörnyek']) || [], njkk, karakterek,
    csapat: (allapot.karakterek || []).filter(aktivKarakter).map((c) => ({ id: c.id, szint: Number(c.szint) || 1 }))
  };
}

function NehezsegJelveny({ becsles }) {
  if (!becsles || !becsles.becsles) return null;
  return html`<${K.Badge} tone=${O.NEHEZSEGEK[becsles.becsles].tonus}>${becsles.becsles}<//>`;
}

// Új összecsapás adata: üres szerkezet a kampány aktív karaktereivel a Csapat oldalon.
function ujAdat(karakterek) {
  return O.csapatHozzaadas(O.uresOsszecsapas(), (karakterek || []).filter(aktivKarakter).map((c) => ({ id: c.id, nev: c.nev })));
}

// ================= A kampány összecsapásai (DM kampánynézet) =================

export function KampanyOsszecsapasPanel({ allapot, frissit }) {
  const { api, szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const [fut, indit] = useMuvelet();
  const [uj, setUj] = useState(false);
  const [archivalt, setArchivalt] = useState(false);
  const [inditas, setInditas] = useState(null);
  const kampany = allapot.kampany;
  const lista = (allapot.osszecsapasok || []).slice().sort((a, b) => String(b.modositva || '').localeCompare(String(a.modositva || '')));
  const korny = useMemo(() => kornyezetBol(allapot, lapok), [allapot, lapok]);
  const masolat = (e) => indit(async () => {
    const v = await api.hivas('encounter.save', { kampany_id: kampany.id, cim: (e.cim + ' (másolat)').slice(0, 120), adat: O.osszecsapasMasolat(e.adat) });
    await frissit();
    navigal(`/dm/kampany/${kampany.id}/osszecsapas/${v.osszecsapas.id}`);
  });
  const archival = (e) => indit(async () => {
    await api.hivas('encounter.archive', { id: e.id, aktiv: false });
    await frissit();
  }, `${e.cim}: archiválva. Az archivált összecsapások lent nyithatók le.`);

  return html`<${K.Panel} title="Összecsapások" actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUj(true)}
      icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új összecsapás<//>`}>
    ${lista.length ? html`<ul className="sorlista">${lista.map((e) => {
      const o = O.normalizal(e.adat);
      const ossz = O.osszegzes(o);
      const n = O.nehezsegBecsles(o, korny);
      return html`<li key=${e.id} className="sorlista__sor sorlista__sor--fuggoleges">
        <div>
          <a className="sorlista__nev" href=${`#/dm/kampany/${kampany.id}/osszecsapas/${e.id}`}>${e.cim}</a>
          <div className="cimkek">
            <${K.Badge} tone=${ALLAPOT_TONUS[e.allapot]}>${ALLAPOT_NEV[e.allapot] || e.allapot}<//>
            <${NehezsegJelveny} becsles=${n}/>
            <span className="halvany kicsi">${ossz.oldalak.filter((x) => x.db).map((x) => `${x.nev} ${x.db}`).join(' · ') || 'nincs résztvevő'}</span>
          </div>
          ${o.helyszin ? html`<div className="halvany kicsi">${o.helyszin}</div>` : null}
        </div>
        <div className="gombsor gombsor--szoros">
          <${K.Button} size="sm" variant="primary" disabled=${!ossz.oldalak.some((x) => x.db)} onClick=${() => setInditas(e)}>Indítás<//>
          <${K.Button} size="sm" onClick=${() => navigal(`/dm/kampany/${kampany.id}/osszecsapas/${e.id}`)}>Szerkesztés<//>
          <${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => masolat(e)}>Másolat<//>
          <${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => archival(e)}>Archiválás<//>
        </div>
      </li>`;
    })}</ul>` : html`<p className="halvany">Még nincs előkészített összecsapás. Az „Indítás” gomb ebből csatát indít.</p>`}
    ${inditas ? html`<${CsataInditasParbeszed} allapot=${allapot} osszecsapas=${inditas} onBezar=${() => setInditas(null)}
      onKesz=${async (cs) => { setInditas(null); await frissit(); navigal(csataUt(kampany.id, cs.id)); }}/>` : null}
    <details className="lenyilo" onToggle=${(ev) => setArchivalt(ev.target.open)}>
      <summary>Archivált összecsapások</summary>
      ${archivalt ? html`<${ArchivaltOsszecsapasok} kampanyId=${kampany.id} frissit=${frissit}/>` : null}
    </details>
    ${uj ? html`<${UjOsszecsapasParbeszed} kampany=${kampany} karakterek=${allapot.karakterek} onBezar=${() => setUj(false)}
      onKesz=${async (e) => { setUj(false); await frissit(); navigal(`/dm/kampany/${kampany.id}/osszecsapas/${e.id}`); }}/>` : null}
  <//>`;
}

function ArchivaltOsszecsapasok({ kampanyId, frissit }) {
  const { api } = useApp();
  const [fut, indit] = useMuvelet();
  const [torol, setTorol] = useState(null);
  const l = useLekeres(async () => (await api.hivas('encounter.list', { kampany_id: kampanyId, archivaltak: true })).osszecsapasok.filter((e) => !e.aktiv), [kampanyId]);
  if (l.hiba && !l.adat) return html`<${Uzenet}>${l.hiba.message}<//>`;
  if (!l.adat) return html`<${Betoltes}/>`;
  if (!l.adat.length) return html`<p className="halvany kicsi">Nincs archivált összecsapás.</p>`;
  const visszaallit = (e) => indit(async () => {
    await api.hivas('encounter.archive', { id: e.id, aktiv: true });
    l.beallit((x) => x.filter((y) => y.id !== e.id));
    await frissit();
  }, e.cim + ': visszaállítva.');
  return html`<ul className="sorlista">
    ${l.adat.map((e) => html`<li key=${e.id} className="sorlista__sor">
      <span>${e.cim} <span className="halvany kicsi">${idopont(e.modositva)}</span></span>
      <span className="sorlista__muvelet">
        <${K.Button} size="sm" disabled=${fut} onClick=${() => visszaallit(e)}>Visszaállítás<//>
        <${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => setTorol(e)}>Törlés<//>
      </span>
    </li>`)}
    ${torol ? html`<${Megerosites} cim="Végleges törlés" gomb="Törlés" veszelyes=${true} szoveg=${torol.cim + ' véglegesen törlődik.'}
      onMegse=${() => setTorol(null)}
      onIgen=${() => { const e = torol; setTorol(null); indit(async () => { await api.hivas('encounter.delete', { id: e.id }); l.beallit((x) => x.filter((y) => y.id !== e.id)); }, 'Az összecsapás törlődött.'); }}/>` : null}
  </ul>`;
}

function UjOsszecsapasParbeszed({ kampany, karakterek, onBezar, onKesz }) {
  const { api } = useApp();
  const [cim, setCim] = useState('');
  const [csapattal, setCsapattal] = useState(true);
  const [fut, indit] = useMuvelet();
  const ment = () => indit(async () => {
    if (!cim.trim()) throw new Error('Adj címet az összecsapásnak.');
    const v = await api.hivas('encounter.save', { kampany_id: kampany.id, cim: cim.trim(), adat: csapattal ? ujAdat(karakterek) : O.uresOsszecsapas() });
    await onKesz(v.osszecsapas);
  });
  const db = (karakterek || []).filter(aktivKarakter).length;
  return html`<${Parbeszed} cim="Új összecsapás" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${ment}>Létrehozás<//>`}>
    <div className="verem">
      <${K.TextField} label="Cím" placeholder="például Rajtaütés a hídnál" value=${cim} onChange=${(e) => setCim(e.target.value)}/>
      ${db ? html`<${Jelolo} checked=${csapattal} onChange=${setCsapattal}>A kampány ${db} aktív karaktere a Csapat oldalra<//>` : null}
      <p className="halvany kicsi">Utána a szerkesztő nyílik meg: ott jönnek az ellenfelek a Bestiáriumból és az NJK-tárból, az oldalak és a kezdeményezési csoportok.</p>
    </div>
  <//>`;
}

// ================= Szerkesztő oldal =================

// ut: #/dm/kampany/<kampanyId>/osszecsapas/<id>
export function OsszecsapasOldal({ kampanyId, id, Oldalfej }) {
  const { api, szabalyok, uzen } = useApp();
  const lapok = lapokBol(szabalyok);
  const { allapot, hiba, frissit } = useKampanyAllapot(kampanyId);
  const tar = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk.aktiv');
  const [vazlat, setVazlat] = useState(null); // { cim, allapot, o }
  const [alap, setAlap] = useState(null);
  const [utkozes, setUtkozes] = useState(null);
  const [kartya, setKartya] = useState(null);
  const [fut, indit] = useMuvelet();
  const e = allapot && (allapot.osszecsapasok || []).find((x) => x.id === id);
  // a betöltött (vagy máshol mentett) változat; a még nem szerkesztett vázlat követi
  useEffect(() => {
    if (!e) return;
    const friss = { cim: e.cim, allapot: e.allapot, o: O.normalizal(e.adat), verzio: e.verzio, modositva: e.modositva };
    setVazlat((v) => (!v || !alap || JSON.stringify(v) === JSON.stringify(alap) ? friss : v));
    setAlap(friss);
  }, [e && e.id, e && e.verzio]);
  const korny = useMemo(() => (allapot ? kornyezetBol(allapot, lapok, tar.adat) : null), [allapot, lapok, tar.adat]);

  const vissza = [`#/dm/kampany/${kampanyId}`, allapot ? allapot.kampany.cim : 'Kampány'];
  if (hiba && !allapot) return html`<div><${Oldalfej} cim="Összecsapás" vissza=${vissza}/><${Uzenet}>${hiba.message}<//></div>`;
  if (!allapot) return html`<${Betoltes} szoveg="Kampány betöltése…"/>`;
  if (!e) return html`<div><${Oldalfej} cim="Összecsapás" vissza=${vissza}/><${Uzenet} tonus="warning">Ez az összecsapás nincs a kampány aktív összecsapásai közt (archiválták vagy törölték).<//></div>`;
  if (!vazlat) return html`<${Betoltes}/>`;

  const o = vazlat.o;
  const valtozott = JSON.stringify(vazlat) !== JSON.stringify(alap);
  const setO = (fn) => setVazlat((v) => ({ ...v, o: typeof fn === 'function' ? fn(v.o) : fn }));
  const set = (valt) => setVazlat((v) => ({ ...v, ...valt }));
  const ment = () => indit(async () => {
    if (!vazlat.cim.trim()) throw new Error('Adj címet az összecsapásnak.');
    try {
      const v = await api.hivas('encounter.save', { id, verzio: alap.verzio, cim: vazlat.cim.trim(), allapot: vazlat.allapot, adat: vazlat.o });
      const uj = { cim: v.osszecsapas.cim, allapot: v.osszecsapas.allapot, o: O.normalizal(v.osszecsapas.adat), verzio: v.osszecsapas.verzio, modositva: v.osszecsapas.modositva };
      setAlap(uj); setVazlat(uj);
      frissit();
    } catch (err) {
      if (err.kod === 'utkozes') { setUtkozes(err); return; }
      throw err;
    }
  }, 'Összecsapás mentve.');
  const nehezseg = O.nehezsegBecsles(o, korny);
  const figyelmeztetesek = O.ellenorzes(o);

  return html`<div>
    <${Oldalfej} cim=${vazlat.cim || 'Névtelen összecsapás'} vissza=${vissza}>
      <${K.Button} variant="primary" disabled=${fut || !valtozott} onClick=${ment}>Mentés<//>
      ${valtozott ? html`<${K.Button} variant="quiet" onClick=${() => setVazlat(masol(alap))}>Elvetés<//>` : null}
    <//>
    <p className="halvany kicsi oldalfej__uzenet">${valtozott ? `Mentetlen módosítások (most ${alap.verzio}. verzió).` : `${alap.verzio}. verzió · ${idopont(alap.modositva)}`}</p>
    ${utkozes ? html`<div className="oldalfej__uzenet"><${Uzenet} tonus="warning">Az összecsapást közben máshol is módosították.
      <div className="gombsor"><${K.Button} size="sm" onClick=${() => { setUtkozes(null); frissit(); setVazlat(null); setAlap(null); }}>A friss változat betöltése (a módosításaim elvesznek)<//></div><//></div>` : null}
    <div className="ket-hasab">
      <div className="verem">
        <${AlapadatPanel} v=${vazlat} set=${set} setO=${setO}/>
        <${OldalakPanel} o=${o} setO=${setO}/>
        <${CsoportokPanel} o=${o} setO=${setO}/>
      </div>
      <div className="verem">
        <${NehezsegPanel} nehezseg=${nehezseg} figyelmeztetesek=${figyelmeztetesek}/>
        <${ResztvevokPanel} o=${o} setO=${setO} korny=${korny} lapok=${lapok} onKartya=${setKartya}/>
        <${HozzaadasPanel} o=${o} setO=${setO} allapot=${allapot} lapok=${lapok} tar=${tar.adat || []}/>
      </div>
    </div>
    ${kartya ? html`<${StatblokkAblak} r=${kartya} allapot=${allapot} lapok=${lapok} onBezar=${() => setKartya(null)}/>` : null}
  </div>`;
}

function AlapadatPanel({ v, set, setO }) {
  const o = v.o;
  const mezo = (k) => (ev) => { const x = ev.target.value; setO((a) => ({ ...a, [k]: x })); };
  return html`<${K.Panel} title="Alapadatok">
    <div className="verem">
      <${K.TextField} label="Cím" value=${v.cim} onChange=${(e) => set({ cim: e.target.value })}/>
      <div className="sorban">
        <${K.TextField} label="Helyszín" value=${o.helyszin} onChange=${mezo('helyszin')}/>
        <${Valaszto} label="Állapot" value=${v.allapot} onChange=${(x) => set({ allapot: x })}
          opciok=${['előkészítés', 'kész'].concat(v.allapot === 'lefutott' ? ['lefutott'] : []).map((a) => ({ value: a, label: ALLAPOT_NEV[a] }))}/>
      </div>
      <${K.TextField} label="Leírás" multiline=${true} rows=${3} hint="Mi történik, mit látnak a hősök." value=${o.leiras} onChange=${mezo('leiras')}/>
      <${K.TextField} label="Terep" multiline=${true} rows=${2} hint="Fedezék, nehéz terep, fényviszonyok, veszélyek." value=${o.terep} onChange=${mezo('terep')}/>
      <${K.TextField} label="DM jegyzet" multiline=${true} rows=${2} hint="Taktika, mikor lépnek be a rejtett résztvevők, mi történik, ha menekülnek." value=${o.megjegyzes} onChange=${mezo('megjegyzes')}/>
    </div>
  <//>`;
}

function OldalakPanel({ o, setO }) {
  const [ujNev, setUjNev] = useState('');
  const [torol, setTorol] = useState(null);
  const parok = [];
  o.oldalak.forEach((a, i) => o.oldalak.slice(i + 1).forEach((b) => parok.push([a, b])));
  const db = (id) => o.resztvevok.filter((r) => r.oldal === id).reduce((s, r) => s + r.db, 0);
  return html`<${K.Panel} title="Oldalak">
    <div className="verem">
      <p className="halvany kicsi">Nincs „jók és rosszak”: bárki bármelyik oldalra kerülhet, játékos karakterek egymással szemben is.
        A viszony csak a célpontválasztás sorrendje és figyelmeztetés, semmit nem tilt.</p>
      ${o.oldalak.map((x) => html`<div key=${x.id} className="sorban sorban--kozep">
        <${K.TextField} label=${`Oldal (${db(x.id)} résztvevő)`} value=${x.nev} onChange=${(e) => { const n = e.target.value; setO((a) => O.oldalAtnevezes(a, x.id, n)); }}/>
        ${o.oldalak.length > 1 ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => (db(x.id) ? setTorol(x) : setO((a) => O.oldalTorles(a, x.id)))}>Törlés<//>` : null}
      </div>`)}
      <div className="sorban">
        <${K.TextField} label="Új oldal" placeholder="például Harmadik fél, Semlegesek" value=${ujNev} onChange=${(e) => setUjNev(e.target.value)}/>
        <${K.Button} onClick=${() => { setO((a) => O.oldalHozzaadas(a, ujNev)); setUjNev(''); }}>Hozzáadás<//>
      </div>
      ${parok.length ? html`<div className="verem">
        <p className="cimke" style=${{ margin: 0 }}>Viszonyok</p>
        ${parok.map(([a, b]) => html`<${Valaszto} key=${a.id + b.id} label=${`${a.nev || 'névtelen'} és ${b.nev || 'névtelen'}`}
          value=${O.viszony(o, a.id, b.id)} onChange=${(v) => setO((x) => O.viszonyBeallitas(x, a.id, b.id, v))}
          opciok=${['ellenseges', 'semleges', 'szovetseges'].map((v) => ({ value: v, label: O.VISZONYOK[v].nev }))}/>`)}
      </div>` : null}
    </div>
    ${torol ? html`<${Megerosites} cim="Oldal törlése" gomb="Törlés"
      szoveg=${`${torol.nev}: a résztvevői a(z) ${(o.oldalak.find((x) => x.id !== torol.id) || {}).nev} oldalra kerülnek.`}
      onMegse=${() => setTorol(null)} onIgen=${() => { const x = torol; setTorol(null); setO((a) => O.oldalTorles(a, x.id)); }}/>` : null}
  <//>`;
}

function CsoportokPanel({ o, setO }) {
  return html`<${K.Panel} title=${html`<span>Kezdeményezési csoportok <${Sugo} cim="Kezdeményezési csoportok">A kisebb NJK-k (például egy farkasfalka) csoportban dobnak kezdeményezést, és együtt cselekszenek; a fontos szereplők egyénileg (AK 100.). A több példányos lény magától kap csoportot.<//></span>`}
    actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => setO((a) => O.csoportHozzaadas(a).o)}>Új csoport<//>`}>
    ${o.csoportok.length ? html`<div className="verem">${o.csoportok.map((g) => {
      const tagok = O.csoportTagjai(o, g.id);
      return html`<div key=${g.id} className="sorban sorban--kozep">
        <${K.TextField} label="Csoport" hint=${tagok.length ? tagok.map((r) => r.nev + (r.db > 1 ? ` ×${r.db}` : '')).join(', ') : 'Még üres: a résztvevőknél választható.'}
          value=${g.nev} onChange=${(e) => { const n = e.target.value; setO((a) => O.csoportAtnevezes(a, g.id, n)); }}/>
        <${K.Button} size="sm" variant="quiet" onClick=${() => setO((a) => O.csoportTorles(a, g.id))}>Törlés<//>
      </div>`;
    })}</div>` : html`<p className="halvany kicsi">Nincs csoport: mindenki egyénileg dob kezdeményezést.</p>`}
  <//>`;
}

function NehezsegPanel({ nehezseg, figyelmeztetesek }) {
  const elteres = (e) => (e.elteres === null || e.elteres === undefined ? 'fenyegetés nélkül'
    : e.elteres === 0 ? 'a csapat szintjének megfelelő' : e.elteres > 0 ? `${e.elteres} fokkal erősebb` : `${-e.elteres} fokkal gyengébb`);
  return html`<${K.Panel} title=${html`<span>Nehézség <${Sugo} cim="Tájékoztató nehézség">A fenyegetési szintek (Csekély 1–4., Mérsékelt 5–8., Komoly 9–12., Súlyos 13–17., Legendás 18–20. szint) és a csapat átlagos szintje alapján, a létszámot is nézve. Az elit erősítés egy fokkal emel. Csak becslés: a felszerelés, a varázslatok és a terep sokat számít, semmit nem köt meg.<//></span>`}>
    <div className="verem">
      ${nehezseg ? html`<div>
        <div className="cimkek">
          ${nehezseg.becsles ? html`<${NehezsegJelveny} becsles=${nehezseg}/><span className="halvany kicsi">XP javaslat a csata végén: ${nehezseg.xp}</span>` : html`<span className="halvany">Nincs becslés.</span>`}
        </div>
        ${nehezseg.csapat.szint ? html`<p className="halvany kicsi">Csapat: ${nehezseg.csapat.letszam} fő, átlagosan ${nehezseg.csapat.szint}. szint.</p>` : null}
        <ul className="statblokk__felsorolas kicsi">
          ${nehezseg.ellenfelek.map((x) => html`<li key=${x.id}>${x.nev}${x.db > 1 ? ` ×${x.db}` : ''}: ${[x.fenyegetes, x.erosites ? LN.EROSITESEK[x.erosites] && LN.EROSITESEK[x.erosites].nev.toLowerCase() : ''].filter(Boolean).join(', ') || '?'}, ${elteres(x)}${x.rejtett ? ' (rejtett)' : ''}</li>`)}
        </ul>
        ${nehezseg.megjegyzesek.map((m) => html`<p key=${m} className="halvany kicsi">${m}</p>`)}
      </div>` : html`<p className="halvany">Még nincs ellenfél a Csapattal ellenséges oldalon.</p>`}
      ${figyelmeztetesek.map((f) => html`<${Uzenet} key=${f} tonus="warning">${f}<//>`)}
    </div>
  <//>`;
}

function ResztvevoSor({ r, o, setO, info, onKartya }) {
  const mod = (valt) => setO((a) => O.resztvevoModositas(a, r.id, valt));
  const tipus = r.forras.tipus;
  return html`<li className="sorlista__sor sorlista__sor--fuggoleges osszecsapas__resztvevo">
    <div className="sorban sorban--kozep sorban--szet">
      <div>
        <strong>${r.nev || (info && info.nev) || '?'}</strong>
        <div className="cimkek">
          <${K.Badge}>${O.TIPUS_NEV[tipus]}<//>
          ${info && info.fenyegetes ? html`<${K.Badge} tone=${fenyegetesTonus(info.fenyegetes)}>${info.fenyegetes}<//>` : null}
          ${info && info.erosites && info.erosites !== 'nincs' ? html`<${K.Badge} tone="dragon">${(LN.EROSITESEK[info.erosites] || {}).nev}<//>` : null}
          ${info && info.szint ? html`<span className="halvany kicsi">${info.szint}. szint</span>` : null}
          ${!info ? html`<${K.Badge} tone="warning">nem található<//>` : null}
        </div>
      </div>
      <div className="gombsor gombsor--szoros">
        ${tipus !== 'karakter' && info ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => onKartya(r)}>Statblokk<//>` : null}
        ${tipus === 'karakter' ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => navigal('/dm/karakter/' + r.forras.id)}>Karakterlap<//>` : null}
        <${K.Button} size="sm" variant="quiet" onClick=${() => setO((a) => O.resztvevoTorles(a, r.id))} aria-label=${'Eltávolítás: ' + r.nev}>Eltávolítás<//>
      </div>
    </div>
    <div className="sorban osszecsapas__vezerlok">
      ${tipus === 'szorny' ? html`<div className="ka-field">
        <span className="ka-field__label">Darab</span>
        <span className="leptetok">
          <button type="button" className="csip__gomb" aria-label="Eggyel kevesebb" disabled=${r.db <= 1} onClick=${() => mod({ db: r.db - 1 })}>−</button>
          <span className="ertek osszecsapas__db" aria-live="polite">${r.db}</span>
          <button type="button" className="csip__gomb" aria-label="Eggyel több" disabled=${r.db >= O.MAX_DB} onClick=${() => mod({ db: r.db + 1 })}>+</button>
        </span>
      </div>` : null}
      <${Valaszto} label="Oldal" value=${r.oldal} onChange=${(x) => mod({ oldal: x })} opciok=${o.oldalak.map((x) => ({ value: x.id, label: x.nev || 'névtelen' }))}/>
      <${Valaszto} label="Kezdeményezés" value=${r.csoport} onChange=${(x) => mod({ csoport: x })} ures="egyénileg"
        opciok=${o.csoportok.map((g) => ({ value: g.id, label: g.nev }))}/>
    </div>
    <div className="sorban">
      <${Jelolo} checked=${r.fontos} onChange=${(x) => mod({ fontos: x })}>Fontos <span className="halvany kicsi">(nullán haldoklik, nem kiesik)</span><//>
      <${Jelolo} checked=${r.rejtett} onChange=${(x) => mod({ rejtett: x })}>Rejtett <span className="halvany kicsi">(később lép be)</span><//>
    </div>
    <details className="lenyilo lenyilo--sor">
      <summary>Megjegyzés${r.megjegyzes ? ': ' + r.megjegyzes.slice(0, 40) + (r.megjegyzes.length > 40 ? '…' : '') : ''}</summary>
      <${K.TextField} label="Megjegyzés" hint="Például: a második körben érkezik, fegyvere mérgezett." value=${r.megjegyzes} onChange=${(e) => mod({ megjegyzes: e.target.value })}/>
    </details>
  </li>`;
}

function ResztvevokPanel({ o, setO, korny, onKartya }) {
  const ossz = O.osszegzes(o);
  return html`<${K.Panel} title=${`Résztvevők (${ossz.osszes})`}>
    ${!o.resztvevok.length ? html`<p className="halvany">Még nincs résztvevő. Lent adhatsz hozzá a Bestiáriumból, az NJK-k és a karakterek közül.</p>` : null}
    ${o.oldalak.map((x) => {
      const tagok = o.resztvevok.filter((r) => r.oldal === x.id);
      return html`<section key=${x.id} className="osszecsapas__oldal">
        <h3 className="cimke">${x.nev || 'névtelen'} <span className="halvany">(${ossz.oldalak.find((y) => y.id === x.id).db})</span></h3>
        ${tagok.length ? html`<ul className="sorlista">${tagok.map((r) => html`<${ResztvevoSor} key=${r.id} r=${r} o=${o} setO=${setO}
            info=${O.resztvevoInfo(r, korny)} onKartya=${onKartya}/>`)}</ul>`
          : html`<p className="halvany kicsi">Senki.</p>`}
      </section>`;
    })}
  <//>`;
}

const FULEK = [{ value: 'szorny', label: 'Bestiárium' }, { value: 'njk', label: 'NJK-k' }, { value: 'karakter', label: 'Karakterek' }];

// A csatanézet is ezt használja a csata közbeni hozzáadáshoz (web/js/app/csata.js).
export function HozzaadasPanel({ o, setO, allapot, lapok, tar }) {
  const [ful, setFul] = useState('szorny');
  const [oldal, setOldal] = useState('');
  const [szoveg, setSzoveg] = useState('');
  const [db, setDb] = useState(1);
  const { uzen } = useApp();
  const hozzaad = (elem) => {
    setO((a) => O.resztvevoHozzaadas(a, elem, oldal ? { oldal } : {}).o);
    uzen(`${elem.nev}${elem.db > 1 ? ' ×' + elem.db : ''} bekerült.`);
  };
  const szornyek = useMemo(() => LN.szornySzures((lapok && lapok['Szörnyek']) || [], { szoveg }).slice(0, 40), [lapok, szoveg]);
  const kampanyNjkk = (allapot.njkk || []).filter((n) => n.aktiv !== false);
  const tobbiNjk = (tar || []).filter((n) => n.aktiv !== false && !kampanyNjkk.some((x) => x.id === n.id));
  const sz = szoveg.trim().toLowerCase();
  const illik = (n) => !sz || String(n.nev || '').toLowerCase().includes(sz);
  const bentKarakter = new Set(o.resztvevok.filter((r) => r.forras.tipus === 'karakter').map((r) => r.forras.id));
  const karakterek = (allapot.karakterek || []).filter(aktivKarakter);
  const bentNjk = new Set(o.resztvevok.filter((r) => r.forras.tipus === 'njk').map((r) => r.forras.id));
  const njkSor = (n) => html`<li key=${n.id} className="sorlista__sor">
    <span className="nevsor"><${KarakterKep} kep=${n.kep} nev=${n.nev}/><span>${n.nev}<br/><span className="halvany kicsi">${[n.fenyegetes, n.fajta === 'koveto' ? 'követő' : n.fajta === 'rovid' ? 'rövid NJK' : ''].filter(Boolean).join(' · ')}${bentNjk.has(n.id) ? ' · már benne' : ''}</span></span></span>
    <${K.Button} size="sm" onClick=${() => hozzaad({ tipus: 'njk', id: n.id, nev: n.nev })}>Hozzáadás<//>
  </li>`;

  return html`<${K.Panel} title="Hozzáadás">
    <div className="verem">
      <div className="kapcsolo kapcsolo--teljes" role="group" aria-label="Honnan">
        ${FULEK.map((f) => html`<button key=${f.value} type="button" aria-pressed=${ful === f.value} onClick=${() => setFul(f.value)}>${f.label}</button>`)}
      </div>
      <div className="sorban">
        ${ful !== 'karakter' ? html`<${K.TextField} label="Keresés" value=${szoveg} onChange=${(e) => setSzoveg(e.target.value)}/>` : null}
        <${Valaszto} label="Melyik oldalra" value=${oldal} onChange=${setOldal} ures="magától (karakter: Csapat, más: Ellenfelek)"
          opciok=${o.oldalak.map((x) => ({ value: x.id, label: x.nev || 'névtelen' }))}/>
      </div>
      ${ful === 'szorny' ? html`<div className="verem">
        <div className="sorban sorban--kozep">
          <span className="cimke">Darabszám</span>
          <span className="leptetok">
            <button type="button" className="csip__gomb" aria-label="Eggyel kevesebb" disabled=${db <= 1} onClick=${() => setDb(db - 1)}>−</button>
            <span className="ertek osszecsapas__db">${db}</span>
            <button type="button" className="csip__gomb" aria-label="Eggyel több" disabled=${db >= O.MAX_DB} onClick=${() => setDb(db + 1)}>+</button>
          </span>
        </div>
        ${!szornyek.length ? html`<p className="halvany kicsi">${(lapok && (lapok['Szörnyek'] || []).length) ? 'Nincs találat.' : 'Még nincs szörnyadat (Import 10).'}</p>` : null}
        <ul className="sorlista osszecsapas__talalatok">${szornyek.map((s) => html`<li key=${s.id} className="sorlista__sor">
          <span>${s.nev_hu}<br/><span className="halvany kicsi">${[s.fenyegetes, LN.szornyCsoport(s), s.forras].filter(Boolean).join(' · ')}</span></span>
          <${K.Button} size="sm" onClick=${() => hozzaad({ tipus: 'szorny', id: s.id, nev: s.nev_hu, db })}>${db > 1 ? `Hozzáadás ×${db}` : 'Hozzáadás'}<//>
        </li>`)}</ul>
      </div>` : null}
      ${ful === 'njk' ? html`<div className="verem">
        <p className="cimke" style=${{ margin: 0 }}>A kampány NJK-i</p>
        ${kampanyNjkk.filter(illik).length ? html`<ul className="sorlista">${kampanyNjkk.filter(illik).map(njkSor)}</ul>` : html`<p className="halvany kicsi">Nincs.</p>`}
        <p className="cimke" style=${{ margin: 0 }}>Az NJK-tár többi eleme</p>
        ${tobbiNjk.filter(illik).length ? html`<ul className="sorlista osszecsapas__talalatok">${tobbiNjk.filter(illik).map(njkSor)}</ul>` : html`<p className="halvany kicsi">Nincs.</p>`}
        <p className="halvany kicsi">Az NJK-tárból hozzáadott NJK nem kerül magától a kampányba; a kampány NJK paneljén rendelheted hozzá.</p>
      </div>` : null}
      ${ful === 'karakter' ? html`<div className="verem">
        <div className="gombsor gombsor--szoros">
          <${K.Button} size="sm" disabled=${karakterek.every((c) => bentKarakter.has(c.id))}
            onClick=${() => { setO((a) => O.csapatHozzaadas(a, karakterek.map((c) => ({ id: c.id, nev: c.nev })), oldal || O.CSAPAT)); uzen('A csapat bekerült.'); }}>A teljes csapat<//>
        </div>
        <ul className="sorlista">${karakterek.map((c) => html`<li key=${c.id} className="sorlista__sor">
          <span className="nevsor"><${KarakterKep} kep=${c.kep} nev=${c.nev}/><span>${c.nev}<br/><span className="halvany kicsi">${c.szint ? c.szint + '. szint' : ''}${bentKarakter.has(c.id) ? ' · már benne' : ''}</span></span></span>
          <${K.Button} size="sm" disabled=${bentKarakter.has(c.id)} onClick=${() => hozzaad({ tipus: 'karakter', id: c.id, nev: c.nev })}>Hozzáadás<//>
        </li>`)}</ul>
        ${!karakterek.length ? html`<p className="halvany kicsi">A kampányban nincs aktív karakter.</p>` : null}
      </div>` : null}
    </div>
  <//>`;
}

// A résztvevő statblokkja (szörny a szabályadatból, NJK a kampányból vagy az NJK-tárból lekérve).
export function StatblokkAblak({ r, allapot, lapok, onBezar }) {
  const { api } = useApp();
  const helyi = r.forras.tipus === 'njk' ? (allapot.njkk || []).find((n) => n.id === r.forras.id && n.adat) : null;
  const njk = useLekeres(async () => (r.forras.tipus === 'njk' && !helyi ? (await api.hivas('npc.get', { id: r.forras.id })).njk : null), [r.forras.id]);
  let tartalom;
  if (r.forras.tipus === 'szorny') {
    const sor = ((lapok && lapok['Szörnyek']) || []).find((s) => s.id === r.forras.id);
    tartalom = sor ? html`<${Statblokk} sor=${sor} lapok=${lapok} cimNelkul=${true}/>` : html`<${Uzenet}>A lény nincs a szabályadatban.<//>`;
  } else {
    const n = helyi || njk.adat;
    if (!n) tartalom = njk.hiba ? html`<${Uzenet}>${njk.hiba.message}<//>` : html`<${Betoltes}/>`;
    else {
      const nz = LN.lenyNezet({ tipus: 'njk', sor: n }, lapok);
      tartalom = nz ? html`<${Statblokk} nezet=${nz} r=${(n.adat || {}).statblokk || {}} lapok=${lapok} cimNelkul=${true} leiras=${((n.adat || {}).szerep || {}).nyilvanos}/>` : null;
    }
  }
  return html`<${Parbeszed} cim=${r.nev} onBezar=${onBezar}>${tartalom}<//>`;
}

// ================= „Összecsapásba” (Bestiárium, NJK-tár) =================

// elem: { tipus: szorny | njk, id, nev }. kampanyok: a DM kampányai. kampanyId: előre kiválasztott kampány.
export function OsszecsapasbaParbeszed({ elem, kampanyok, kampanyId = '', onBezar }) {
  const { api, uzen } = useApp();
  const futok = (kampanyok || []).filter(futoKampany);
  const [kampany, setKampany] = useState(kampanyId || (futok.length === 1 ? futok[0].id : ''));
  const [cel, setCel] = useState('');
  const [cim, setCim] = useState('');
  const [db, setDb] = useState(1);
  const [fut, indit] = useMuvelet();
  const lista = useLekeres(async () => (kampany ? (await api.hivas('encounter.list', { kampany_id: kampany })).osszecsapasok : []), [kampany]);
  useEffect(() => { setCel(''); }, [kampany]);
  const ment = () => indit(async () => {
    if (!kampany) throw new Error('Válassz kampányt.');
    const be = { ...elem, db: elem.tipus === 'szorny' ? db : 1 };
    let v;
    if (!cel) {
      if (!cim.trim()) throw new Error('Adj címet az új összecsapásnak, vagy válassz egy meglévőt.');
      const all = await api.hivas('state.get', { kampany_id: kampany });
      const adat = O.resztvevoHozzaadas(ujAdat(all.karakterek), be).o;
      v = await api.hivas('encounter.save', { kampany_id: kampany, cim: cim.trim(), adat });
    } else {
      const e = (lista.adat || []).find((x) => x.id === cel);
      const adat = O.resztvevoHozzaadas(O.normalizal(e.adat), be).o;
      v = await api.hivas('encounter.save', { id: e.id, verzio: e.verzio, adat });
    }
    onBezar();
    uzen(`${elem.nev}${be.db > 1 ? ' ×' + be.db : ''} bekerült: ${v.osszecsapas.cim}.`);
    navigal(`/dm/kampany/${kampany}/osszecsapas/${v.osszecsapas.id}`);
  });
  return html`<${Parbeszed} cim=${'Összecsapásba: ' + elem.nev} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut || !kampany} onClick=${ment}>Hozzáadás és megnyitás<//>`}>
    <div className="verem">
      <${Valaszto} label="Kampány" value=${kampany} onChange=${setKampany} ures="Válassz…" opciok=${futok.map((k) => ({ value: k.id, label: k.cim }))}/>
      ${kampany ? html`<${Valaszto} label="Összecsapás" value=${cel} onChange=${setCel} ures="Új összecsapás"
        opciok=${(lista.adat || []).map((e) => ({ value: e.id, label: e.cim }))}/>` : null}
      ${kampany && !cel ? html`<${K.TextField} label="Az új összecsapás címe" value=${cim} onChange=${(e) => setCim(e.target.value)}
        hint="A kampány aktív karakterei a Csapat oldalra kerülnek."/>` : null}
      ${elem.tipus === 'szorny' ? html`<div className="sorban sorban--kozep">
        <span className="cimke">Darabszám</span>
        <span className="leptetok">
          <button type="button" className="csip__gomb" aria-label="Eggyel kevesebb" disabled=${db <= 1} onClick=${() => setDb(db - 1)}>−</button>
          <span className="ertek osszecsapas__db">${db}</span>
          <button type="button" className="csip__gomb" aria-label="Eggyel több" disabled=${db >= O.MAX_DB} onClick=${() => setDb(db + 1)}>+</button>
        </span>
      </div>` : null}
      <p className="halvany kicsi">${elem.tipus === 'szorny' ? 'A lény az Ellenfelek oldalra kerül; több példány esetén saját kezdeményezési csoportban.' : 'Az NJK az Ellenfelek oldalra kerül, ezt a szerkesztőben átrakhatod.'}</p>
    </div>
  <//>`;
}

// ================= Kampánybeállítás: csata =================

export function CsataBeallitasok({ kampany, onMentve }) {
  const { api, uzen } = useApp();
  const [ertek, setErtek] = useState((kampany.beallitasok || {}).csata_egeszseg || 'leiro');
  const valt = (x) => {
    const regi = ertek;
    setErtek(x);
    api.hivas('campaign.update', { id: kampany.id, beallitasok: { csata_egeszseg: x } })
      .then((v) => { if (onMentve) onMentve(v); })
      .catch((e) => { setErtek(regi); uzen('A beállítás nem mentődött: ' + e.message, 'danger'); });
  };
  return html`<details className="lenyilo">
    <summary>Csata</summary>
    <div className="verem">
      <${Valaszto} label="Más oldal Egészsége a játékosoknak" value=${ertek} onChange=${valt}
        opciok=${Object.entries(O.EGESZSEG_LATHATOSAG).map(([value, label]) => ({ value, label }))}/>
      <p className="sugo kicsi">A saját oldaluk értékeit a játékosok mindig pontosan látják, a DM mindent. A Védekezés mint Célérték a próbáknál beállított „Célérték rejtett” szerint látszik. A változás azonnal mentődik.</p>
    </div>
  </details>`;
}
