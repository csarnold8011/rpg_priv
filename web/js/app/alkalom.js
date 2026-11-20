// Kampányjátszó 6.4: élő munkamenet és kalandnapló (DM), a játékos Kalandnapló füle.
// A DM Játék nézete (#/dm/kampany/<id>/jatek, laptop, három hasáb): balra a kalandok fája vagy ütemsora a jelenetek
// állapotával és az aktuális jelölővel, középen az aktuális (vagy megnézett) jelenet kártyája a kiküldhető próbákkal, a
// csata indításával, a kiosztható anyagokkal és az XP-vel, jobbra a csapat, a gyorsjegyzet, az eseménynapló és a
// jegyzetfüzet. A kalandnapló (#/dm/kampany/<id>/naplo[/<alkalom>]) a könyv kampánynaplója (Alapkönyv 88. oldal):
// alkalmanként összefoglaló, fontos szereplők, futó szálak, és a játékosoknak szóló rész, amit közzé lehet tenni.
// Tiszta függvények: web/js/kampany/alkalom.js, háttér: backend/Alkalmak.gs. Terv: claude/kampanyjatszo-terv.md, „6.4”.
import {
  html, K, useApp, useState, useEffect, useMemo, useRef, useLekeres, navigal, Ikon, Betoltes, Uzenet, Valaszto, Jelolo,
  Parbeszed, Megerosites, Sugo
} from './kozos.js';
import { useKampanyAllapot, useDobasok } from './jatek.js';
import { usePrep, elemUt, useAutoMentes, MentesJel } from './epito.js';
import { ProbakPanel, useLapok } from './probakeres.js';
import { CsataInditasParbeszed, csataUt } from './csata.js';
import { KiosztasParbeszed, Kivetito } from './anyagok.js';
import { XpKiosztas } from './xpkiosztas.js';
import { JutalomElemSorok, KasszaPanel, ZsakmanyParbeszed } from './kioszt.js';
import { BoltokPanel, BoltGomb } from './vasarlas.js';
import { CsapatPihenes } from './pihenes.js';
import * as VS from '../kampany/vasarlas.js';
import * as B6 from '../kampany/bolt.js';
import { useJegyzetfuzet, Jegyzetfuzet } from './jegyzetfuzet.js';
import { KarakterKep } from './kepek.js';
import { fokuszNevLapbol } from './proba.js';
import * as A from '../kampany/alkalom.js';
import * as E from '../kampany/elem.js';
import * as KL from '../kampany/kaland.js';
import * as JL from '../kampany/jelenet.js';
import * as AN from '../kampany/anyag.js';
import * as HS from '../kampany/helyszin.js';
import * as JU from '../kampany/jutalom.js';
import { penzSzoveg } from '../karakter/varazslo.js';

const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};
const aktivKarakter = (c) => !c.kampany_allapot || c.kampany_allapot === 'aktív';
const van = (x) => !!String(x === null || x === undefined ? '' : x).trim();
const ora = (iso) => { const d = new Date(iso); return iso && !isNaN(d) ? d.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' }) : ''; };
const naploUt = (kampanyId, alkalomId) => '/dm/kampany/' + kampanyId + '/naplo' + (alkalomId ? '/' + alkalomId : '');
export const jatekUt = (kampanyId) => '/dm/kampany/' + kampanyId + '/jatek';

// ================= Az alkalom állapota: optimista mentés, sorba állított verziók =================

// A rövid lista eleme (a DM állapotának alkalmak listájához).
function rovid(a) {
  const o = { ...a, osszefoglalo_eleje: String((a.adat && a.adat.osszefoglalo && a.adat.osszefoglalo.szoveg) || '').slice(0, 280) };
  delete o.adat;
  return o;
}

// A tárolt kampányállapot frissítése a mentett alkalommal (a mentés nem növeli a kampány verzióját).
function allapotFolt(sync, kampanyId, alkalom, torolt) {
  sync.helyiModositas((st) => {
    if (!st || !st.kampany || st.kampany.id !== kampanyId) return null;
    const lista = (st.alkalmak || []).filter((x) => x.id !== (torolt || alkalom.id));
    if (torolt) {
      const fo = st.alkalom && st.alkalom.id === torolt ? null : st.alkalom;
      return { ...st, alkalmak: lista, alkalom: fo };
    }
    const uj = lista.concat([rovid(alkalom)]).sort((x, y) => (Number(x.sorszam) || 0) - (Number(y.sorszam) || 0));
    // a fő alkalom: a futó, vagy a legutolsó
    const fo = !st.alkalom || st.alkalom.id === alkalom.id || (Number(alkalom.sorszam) || 0) >= (Number(st.alkalom.sorszam) || 0) ? alkalom : st.alkalom;
    return { ...st, alkalmak: uj, alkalom: fo };
  });
}

// Egy alkalom szerkesztése. szerver: a háttér szerinti alkalom (vagy null). fo: a kampány fő alkalma-e (a tárolt állapotot
// is frissíti). Visszaad: { a (a helyi nézet), ment(fn), fuggo() }.
function useAlkalomMentes(szerver, kampanyId, { fo = true, onMentve } = {}) {
  const { sync, uzen } = useApp();
  const n = szerver ? A.alkalomNorm(szerver) : null;
  const [helyi, setHelyiAllapot] = useState(n);
  const ref = useRef(helyi);
  const fuggo = useRef(0);
  const set = (x) => { ref.current = x; setHelyiAllapot(x); };
  useEffect(() => {
    if (fuggo.current > 0) return;
    const h = ref.current;
    if (!n) { if (!h || !fo) set(n); return; }
    if (!h) { set(n); return; }
    if (h.id === n.id ? n.verzio >= h.verzio : n.sorszam >= h.sorszam) set(n);
  }, [n && n.id, n && n.verzio]); // eslint-disable-line

  const ment = (fn, { uzenet } = {}) => {
    const elotte = ref.current;
    if (!elotte) return null;
    let uj;
    try { uj = A.alkalomNorm(fn(A.alkalomNorm(elotte))); } catch (e) { uzen(e.message, 'danger'); return null; }
    uj.adat = A.karcsusit(uj.adat);
    if (A.meretAllapot(uj).tul) { uzen('Az alkalom adatai túl nagyok egy cellához. A kalandnaplóban törölj régebbi gyorsjegyzeteket.', 'danger'); return null; }
    const kuld = A.mentendo({ ...uj, verzio: elotte.verzio });
    const latszo = { ...uj, verzio: elotte.verzio + 1 };
    set(latszo);
    if (fo) allapotFolt(sync, kampanyId, latszo);
    fuggo.current += 1;
    sync.push({ action: 'session.save', adat: kuld })
      .then((v) => {
        if (fuggo.current === 1) { set(A.alkalomNorm(v.alkalom)); if (fo) allapotFolt(sync, kampanyId, v.alkalom); }
        if (onMentve) onMentve(v.alkalom);
        if (uzenet) uzen(uzenet);
      })
      .catch((e) => {
        if (e.kod === 'utkozes' && e.valasz && e.valasz.aktualis) {
          set(A.alkalomNorm(e.valasz.aktualis));
          if (fo) allapotFolt(sync, kampanyId, e.valasz.aktualis);
          uzen('Az alkalmat közben máshol is módosították: a friss változat látszik, az utolsó változtatást ismételd meg.', 'warning');
        } else uzen('Az alkalom nem mentődött: ' + (e.message || e), 'danger');
      })
      .finally(() => { fuggo.current -= 1; });
    return latszo;
  };
  const kezdes = (alkalom) => { set(null); ref.current = { ...alkalom, verzio: 0 }; return ment(() => alkalom); };
  return { a: helyi, ment, kezdes, fuggo: () => fuggo.current };
}

// A kampány fő alkalma (a futó, vagy ha nincs, a legutóbbi). A futó alkalom alatt az állapotból gyűjti az eseményeket
// (próbák, anyagok, csaták, XP, pénz) az eseménynaplóba.
export function useAlkalom(allapot) {
  const kampanyId = allapot && allapot.kampany ? allapot.kampany.id : '';
  const m = useAlkalomMentes(allapot ? allapot.alkalom : null, kampanyId);
  const a = m.a;
  const fut = A.futE(a);
  // eseménygyűjtés: a jelöltek beolvasztása, ha változott valami
  useEffect(() => {
    if (!fut || !allapot || m.fuggo() > 1) return;
    const jeloltek = A.esemenyekAllapotbol(allapot, a);
    const { valtozott } = A.esemenyekBeolvasztasa(a.adat, jeloltek);
    if (valtozott) m.ment((x) => ({ ...x, adat: A.esemenyekBeolvasztasa(x.adat, A.esemenyekAllapotbol(allapot, x)).adat }));
  }, [allapot, fut, a && a.id]); // eslint-disable-line
  const indit = ({ jatekbeliDatum, cim }) => {
    const elozo = a && !fut ? a : null;
    const uj = A.ujAlkalom({ kampanyId, elozo, jatekbeliDatum, cim });
    return m.kezdes(uj);
  };
  return { a, fut, ment: m.ment, indit, alkalmak: (allapot && allapot.alkalmak) || [] };
}

// ================= A kampány oldalán: alkalmak =================

export function KampanyAlkalmakPanel({ allapot }) {
  const alk = useAlkalom(allapot);
  const k = allapot.kampany;
  const lezartak = alk.alkalmak.filter((x) => x.allapot === 'lezart').slice().reverse();
  return html`<${K.Panel} title="Alkalmak és kalandnapló" actions=${html`<${K.Button} size="sm" variant=${alk.fut ? 'primary' : 'secondary'}
      onClick=${() => navigal(jatekUt(k.id))} icon=${html`<${Ikon} nev="kocka" meret=${18}/>`}>${alk.fut ? 'Játék folytatása' : 'Játék nézet'}<//>`}>
    <div className="verem">
      ${alk.fut ? html`<p className="szoveg"><strong>${A.alkalomCim(alk.a)}</strong> fut, ${ora(alk.a.kezdet)} óta.
          ${alk.a.jatekbeli_datum ? html` <span className="halvany">Játékbeli idő: ${alk.a.jatekbeli_datum}.</span>` : null}</p>`
        : html`<p className="halvany">Most nincs futó alkalom. A Játék nézetben indítható; amíg fut, a jelenetek, próbák, anyagok, csaták, XP és
          pénz, pihenés az alkalom eseménynaplójába kerülnek, lezáráskor ebből készül a kalandnapló vázlata.</p>`}
      ${lezartak.length ? html`<ul className="sorlista">${lezartak.slice(0, 4).map((x) => html`<li key=${x.id} className="sorlista__sor">
        <div><a className="sorlista__nev" href=${'#' + naploUt(k.id, x.id)}>${A.alkalomCim(x)}</a>
          <div className="halvany kicsi">${A.valosIdoSzoveg(x)}${x.jatekbeli_datum ? ' · ' + A.jatekbeliIdoSzoveg(x) : ''}</div></div>
        ${x.kozzeteve ? html`<${K.Badge} tone="success">közzétéve<//>` : html`<${K.Badge}>csak a DM-é<//>`}
      </li>`)}</ul>` : null}
      <div><a href=${'#' + naploUt(k.id)}>Kalandnapló${alk.alkalmak.length ? ' (' + alk.alkalmak.length + ' alkalom)' : ''}</a></div>
    </div>
  <//>`;
}

// ================= A Játék nézet =================

export function JatekOldal({ kampanyId, Oldalfej, dm }) {
  const { allapot, hiba } = useKampanyAllapot(kampanyId);
  const cel = useMemo(() => ({ szint: 'kampany', kampany_id: kampanyId }), [kampanyId]);
  const prep = usePrep(cel);
  if (hiba && !allapot) return html`<div><${Oldalfej} cim="Játék" vissza=${['#/dm/kampany/' + kampanyId, 'Kampány']}/><${Uzenet}>${hiba.message}<//></div>`;
  if (!allapot) return html`<${Betoltes} szoveg="Kampány betöltése…"/>`;
  return html`<${JatekTartalom} allapot=${allapot} prep=${prep} cel=${cel} Oldalfej=${Oldalfej} dm=${dm}/>`;
}

function JatekTartalom({ allapot, prep, cel, Oldalfej, dm }) {
  const alk = useAlkalom(allapot);
  const [, naploz] = useDobasok(allapot);
  const k = allapot.kampany;
  const [nezett, setNezett] = useState('');   // a középen megnézett jelenet (üres: az aktuális)
  const [kerendo, setKerendo] = useState(null); // a Próbák panelnek átadott kérés
  const [naploFul, setNaploFul] = useState('naplo');
  const [lezaras, setLezaras] = useState(false);
  const ix = prep.ix;
  const adat = alk.a ? alk.a.adat : A.adatNorm({});
  const kalandok = prep.adat ? A.kampanyKalandjai(prep.adat.elemek, ix, k.id) : [];
  const aktualis = adat.aktualis && ix.get(adat.aktualis) ? adat.aktualis : '';
  const mutatott = nezett && ix.get(nezett) ? nezett : aktualis;
  const kalandId = (mutatott && A.kalandjaId(mutatott, ix)) || (adat.kaland_id && ix.get(adat.kaland_id) ? adat.kaland_id : '') || (kalandok[0] ? kalandok[0].id : '');
  const kaland = kalandId ? ix.get(kalandId) : null;
  const jelenetNev = (id) => (ix.get(id) ? E.nev(ix.get(id), ix) : 'törölt jelenet');

  // a jelenet állapotának és az aktuálisnak a változtatása (csak futó alkalomban)
  const allit = (id, allapotKod) => alk.fut && alk.ment((x) => ({ ...x, adat: A.jelenetBeallit(x.adat, id, allapotKod, { nev: jelenetNev(id) }) }));
  const legyenAktualis = (id) => {
    if (!alk.fut) return;
    alk.ment((x) => ({ ...x, adat: A.aktualisBeallit(x.adat, id, { nev: jelenetNev(id), kalandId: A.kalandjaId(id, ix) }) }));
    setNezett('');
  };
  const kovetkezo = kaland && mutatott ? A.kovetkezoJelenet(kaland, prep.adat.elemek, ix, adat, mutatott) : null;

  return html`<div className="jatek">
    <${Oldalfej} cim=${'Játék: ' + k.cim} vissza=${['#/dm/kampany/' + k.id, k.cim]}>
      <${K.Button} variant="secondary" onClick=${() => navigal(naploUt(k.id))} icon=${html`<${Ikon} nev="toll" meret=${18}/>`}>Kalandnapló<//>
      <${K.Button} variant="quiet" onClick=${() => navigal('/dm/kampany/' + k.id + '/epito/kalandok')}>Kampányépítő<//>
    <//>
    <${AlkalomSav} alk=${alk} kampany=${k} onLezar=${() => setLezaras(true)}/>
    ${prep.hiba && !prep.adat ? html`<${Uzenet}>${prep.hiba.message}<//>` : !prep.adat ? html`<${Betoltes} szoveg="A kalandok betöltése…"/>` : html`
    <div className="jatek__racs">
      <aside className="jatek__bal" aria-label="Kalandok">
        <${KalandOszlop} kalandok=${kalandok} kaland=${kaland} prep=${prep} adat=${adat} aktualis=${aktualis} mutatott=${mutatott}
          fut=${alk.fut} onNez=${setNezett} onAktualis=${legyenAktualis}
          onUtem=${(id, all) => alk.fut && alk.ment((x) => ({ ...x, adat: A.utemBeallit(x.adat, id, all) }))}
          onKaland=${(id) => { setNezett(''); if (alk.fut) alk.ment((x) => ({ ...x, adat: { ...x.adat, kaland_id: id } })); }}/>
      </aside>
      <section className="jatek__kozep" aria-label="Jelenet">
        ${mutatott ? html`<${JelenetKartya} key=${mutatott} jelenet=${ix.get(mutatott)} prep=${prep} cel=${cel} allapot=${allapot} adat=${adat}
            fut=${alk.fut} aktualis=${mutatott === aktualis} kovetkezo=${kovetkezo} dm=${dm}
            onAktualis=${() => legyenAktualis(mutatott)} onAllapot=${(x) => allit(mutatott, x)} onNez=${setNezett}
            onProba=${(p) => setKerendo(JL.probaUrlap(p))}/>`
          : html`<${K.Panel} title="Jelenet"><p className="halvany">${kalandok.length ? 'Válassz jelenetet a bal oldali fában. Futó alkalomban az „Ez az aktuális” gombbal kezdődik, és a hozzá tartozó események mellé kerülnek.'
            : 'A kampánynak még nincs kalandja. A Kampányépítő Kalandok fülén készíthetsz kalandot, részeket és jeleneteket.'}</p><//>`}
        <${ProbakPanel} allapot=${allapot} naploz=${naploz} kerendo=${kerendo} onKerendo=${setKerendo}/>
        <${FutoCsatak} allapot=${allapot}/>
      </section>
      <aside className="jatek__jobb" aria-label="Csapat és napló">
        <${CsapatAllapot} allapot=${allapot}/>
        <${KasszaPanel} allapot=${allapot} dm=${true} kompakt=${true}/>
        <${BoltokPanel} allapot=${allapot} prep=${prep}/>
        <${GyorsJegyzet} alk=${alk} jelenetNev=${jelenetNev}/>
        <${K.Panel}>
          <div className="kapcsolo kapcsolo--teljes" role="group" aria-label="Napló vagy jegyzetfüzet">
            <button type="button" aria-pressed=${naploFul === 'naplo'} onClick=${() => setNaploFul('naplo')}>Napló</button>
            <button type="button" aria-pressed=${naploFul === 'fuzet'} onClick=${() => setNaploFul('fuzet')}>Jegyzetfüzet</button>
          </div>
          <div className="jatek__fulresz">
            ${naploFul === 'naplo' ? html`<${EsemenyLista} adat=${adat} jelenetNev=${jelenetNev} ures=${alk.fut ? 'Még nincs esemény.' : 'Nincs futó alkalom.'}/>`
              : html`<${JatekJegyzetfuzet} allapot=${allapot}/>`}
          </div>
        <//>
      </aside>
    </div>`}
    ${lezaras && alk.a ? html`<${LezarasParbeszed} alk=${alk} allapot=${allapot} prep=${prep} jelenetNev=${jelenetNev} onBezar=${() => setLezaras(false)}
      onKesz=${(x) => { setLezaras(false); navigal(naploUt(k.id, x.id)); }}/>` : null}
  </div>`;
}

function JatekJegyzetfuzet({ allapot }) {
  const fuzet = useJegyzetfuzet(allapot);
  return html`<${Jegyzetfuzet} allapot=${allapot} fuzet=${fuzet} kompakt=${true}/>`;
}

// ---- Az alkalom sávja: indítás, futó alkalom, játékbeli dátum, lezárás ----

function AlkalomSav({ alk, kampany, onLezar }) {
  const a = alk.a;
  const [datum, setDatum] = useState('');
  const [cim, setCim] = useState('');
  useEffect(() => { setDatum(a ? (a.allapot === 'lezart' ? a.jatekbeli_veg || a.jatekbeli_datum : a.jatekbeli_datum) : ''); }, [a && a.id, a && a.allapot]);
  if (!alk.fut) {
    const kov = (a ? a.sorszam : 0) + 1;
    return html`<section className="alkalomsav alkalomsav--uj" aria-label="Új alkalom">
      <div className="alkalomsav__cim"><strong>${kov}. alkalom</strong>
        ${a ? html`<span className="halvany kicsi">Az előző: <a href=${'#' + naploUt(kampany.id, a.id)}>${A.alkalomCim(a)}</a>, ${A.valosIdoSzoveg(a)}</span>` : html`<span className="halvany kicsi">Az első alkalom.</span>`}</div>
      <div className="alkalomsav__mezok">
        <${K.TextField} label="Játékbeli dátum" placeholder="Például: Aratás hava 3." value=${datum} onChange=${(e) => setDatum(e.target.value)}/>
        <${K.TextField} label="Cím (nem kötelező)" value=${cim} onChange=${(e) => setCim(e.target.value)}/>
        <${K.Button} variant="primary" onClick=${() => { alk.indit({ jatekbeliDatum: datum.trim(), cim: cim.trim() }); setCim(''); }}>Alkalom indítása<//>
      </div>
    </section>`;
  }
  const mentDatum = () => { if (datum.trim() !== a.jatekbeli_datum) alk.ment((x) => ({ ...x, jatekbeli_datum: datum.trim() })); };
  return html`<section className="alkalomsav" aria-label="Futó alkalom">
    <div className="alkalomsav__cim"><strong>${A.alkalomCim(a)}</strong><${K.Badge} tone="success">fut<//>
      <span className="halvany kicsi">${ora(a.kezdet)} óta</span></div>
    <div className="alkalomsav__mezok">
      <${K.TextField} label="Játékbeli dátum" value=${datum} onChange=${(e) => setDatum(e.target.value)} onBlur=${mentDatum}
        onKeyDown=${(e) => { if (e.key === 'Enter') mentDatum(); }}/>
      <${K.Button} variant="secondary" onClick=${onLezar}>Az alkalom lezárása<//>
    </div>
  </section>`;
}

// ---- Bal hasáb: kalandok, fa vagy ütemsor ----

const allapotJel = (all) => html`<span className=${'allapotjel allapotjel--' + (all || 'nincs')} aria-label=${A.JELENET_ALLAPOTOK[all || ''].nev}
  title=${A.JELENET_ALLAPOTOK[all || ''].nev} role="img"></span>`;

function KalandOszlop({ kalandok, kaland, prep, adat, aktualis, mutatott, fut, onNez, onAktualis, onUtem, onKaland }) {
  const [mod, setMod] = useState('fa');
  const ix = prep.ix;
  const elemek = prep.adat.elemek;
  if (!kalandok.length) return html`<${K.Panel} title="Kalandok"><p className="halvany kicsi">Még nincs kaland a kampányban.</p><//>`;
  const h = kaland ? A.kalandHaladas(kaland, elemek, ix, adat) : null;
  return html`<${K.Panel} title="Kalandok">
    <div className="verem verem--kicsi">
      ${kalandok.length > 1 ? html`<${Valaszto} label="Kaland" value=${kaland ? kaland.id : ''} onChange=${onKaland}
        opciok=${kalandok.map((x) => ({ value: x.id, label: E.nev(x, ix) }))}/>` : html`<p className="jatekfa__kaland">${E.nev(kaland, ix)}</p>`}
      ${h && h.osszes ? html`<p className="halvany kicsi">${h.kesz} kész, ${h.kihagyva ? h.kihagyva + ' kihagyva, ' : ''}${h.osszes - h.kesz - h.kihagyva} hátravan (${h.osszes} jelenet)</p>` : null}
      <div className="kapcsolo kapcsolo--teljes" role="group" aria-label="Nézet">
        <button type="button" aria-pressed=${mod === 'fa'} onClick=${() => setMod('fa')}>Fa</button>
        <button type="button" aria-pressed=${mod === 'utem'} onClick=${() => setMod('utem')}>Ütemek</button>
      </div>
      ${mod === 'fa' ? html`<ul className="jatekfa">${A.kalandSorok(kaland, elemek, ix).slice(1).map(({ elem: e, melyseg }) => {
          const jelenet = e.tipus === 'jelenet';
          const all = jelenet ? A.jelenetAllapot(adat, e.id) : '';
          return html`<li key=${e.id} className=${'jatekfa__sor' + (jelenet ? '' : ' jatekfa__sor--resz') + (e.id === aktualis ? ' jatekfa__sor--aktualis' : '')
              + (e.id === mutatott ? ' jatekfa__sor--mutatott' : '') + (all === 'kesz' || all === 'kihagyva' ? ' jatekfa__sor--lezart' : '')}
            style=${{ paddingLeft: 'calc(' + (melyseg - 1) + ' * var(--space-4) + var(--space-2))' }}>
            ${jelenet ? html`${allapotJel(all)}<button type="button" className="jatekfa__nev" onClick=${() => onNez(e.id)}
                aria-current=${e.id === aktualis ? 'true' : undefined}>${E.nev(e, ix)}</button>
              ${e.id === aktualis ? html`<span className="jatekfa__most">most</span>` : null}`
              : html`<span className="jatekfa__resznev">${E.nev(e, ix)}</span>`}
          </li>`;
        })}</ul>`
      : html`<${UtemLista} kaland=${kaland} prep=${prep} adat=${adat} aktualis=${aktualis} fut=${fut} onNez=${onNez} onUtem=${onUtem}/>`}
      ${!fut ? html`<p className="halvany kicsi">Az állapotok futó alkalomban változtathatók.</p>` : null}
    </div>
  <//>`;
}

function UtemLista({ kaland, prep, adat, aktualis, fut, onNez, onUtem }) {
  const sor = A.kalandUtemei(kaland, prep.adat.elemek, prep.ix);
  if (!sor.length) return html`<p className="halvany kicsi">A kalandnak nincsenek ütemei (a kaland szerkesztőjének „Ütemek és hossz” lépésén adhatók meg).</p>`;
  return html`<ol className="utemlista">${sor.map(({ utem: u, jelenet }) => {
    const all = A.utemAllapot(adat, u.id);
    return html`<li key=${u.id} className=${'utemlista__sor' + (all ? ' utemlista__sor--' + all : '') + (u.szunet ? ' utemlista__sor--szunet' : '')}>
      <label className="utemlista__jelolo"><input type="checkbox" checked=${all === 'kesz'} disabled=${!fut}
        onChange=${(e) => onUtem(u.id, e.target.checked ? 'kesz' : '')}/><span className="lathatatlan">Megtörtént</span></label>
      <span className="utemlista__szoveg">${u.szoveg || (u.szunet ? 'Pihenő' : 'Ütem')}
        ${u.nagy_csata ? html` <${K.Badge} tone="danger">nagy csata<//>` : null}
        ${jelenet ? html`<button type="button" className="szoveggomb" onClick=${() => onNez(jelenet.id)}>${allapotJel(A.jelenetAllapot(adat, jelenet.id))} ${E.nev(jelenet, prep.ix)}${jelenet.id === aktualis ? ' (most)' : ''}</button>` : null}</span>
    </li>`;
  })}</ol>`;
}

// ---- Közép: a jelenet kártyája ----

function Szakasz({ cim, children, nyitva = true }) {
  return html`<details className="jelenetresz" open=${nyitva}><summary className="jelenetresz__cim">${cim}</summary><div className="verem verem--kicsi">${children}</div></details>`;
}

function JelenetKartya({ jelenet, prep, cel, allapot, adat, fut, aktualis, kovetkezo, dm, onAktualis, onAllapot, onNez, onProba }) {
  const { szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const ix = prep.ix;
  const [csata, setCsata] = useState(null);
  const [xp, setXp] = useState(false);
  const [zsakmany, setZsakmany] = useState(false);
  if (!jelenet) return null;
  const a = E.megjelenitett(jelenet, ix);
  const all = A.jelenetAllapot(adat, jelenet.id);
  const tipus = JL.tipusFelirat(JL.tipusokOf(a));
  const e = JL.erzekekNorm(a.erzekek);
  const erzekek = [['Fények', e.fenyek], ['Hőmérséklet', e.homerseklet], ['Szagok', e.szagok], ['Hangok', e.hangok]].filter((x) => van(x[1]));
  const helyek = HS.helyszineiOf(jelenet.id, prep.adat.kapcsolatok || []).map((k) => ix.get(k.hova)).filter(Boolean);
  const boltok = VS.helyszinBoltjai(helyek, prep.adat.elemek, (x) => E.megjelenitett(x, ix));
  const konf = JL.konfliktusokNorm(a.konfliktusok).filter((k) => van(k.cel) || van(k.akadaly));
  const megold = JL.megoldasokNorm(a.megoldasok).filter((m) => van(m.mod) || van(m.szoveg));
  const lenyek = JL.lenyekNorm(a.lenyek).filter((l) => van(l.nev) || l.ref_id);
  const kihivasok = JL.kihivasokNorm(a.kihivasok).filter((k) => van(k.nev) || van(k.leiras));
  const probak = JL.probakNorm(a.probak);
  const fokuszNev = (id) => fokuszNevLapbol(lapok, id);
  const osszecsapas = a.osszecsapas_id ? (allapot.osszecsapasok || []).find((o) => o.id === a.osszecsapas_id) : null;
  const futoCsata = osszecsapas ? (allapot.csatak || []).find((c) => c.allapot !== 'lezart' && c.osszecsapas_id === osszecsapas.id) : null;
  const jutalmak = JU.jutalmaiOf(jelenet.id, prep.adat.kapcsolatok || []).map((k) => ix.get(k.honnan)).filter(Boolean);
  const xpErtek = JL.jelenetXp(a);
  const szornyNev = (id) => ((lapok['Szörnyek'] || []).find((s) => s.id === id) || {}).nev_hu;
  const njkNev = (id) => ((allapot.njkk || []).find((n) => n.id === id) || {}).nev;
  const kalandja = KL.kalandja(jelenet, ix);
  const reszlet = kalandja && kalandja.id !== jelenet.szulo_id && ix.get(jelenet.szulo_id) ? E.nev(ix.get(jelenet.szulo_id), ix) : '';
  return html`<article className=${'jelenetkartya' + (aktualis ? ' jelenetkartya--aktualis' : '')}>
    <header className="jelenetkartya__fej">
      <div>
        <p className="cimke">${aktualis ? 'Aktuális jelenet' : 'Megnézett jelenet'}${kalandja ? ' · ' + E.nev(kalandja, ix) : ''}${reszlet ? ' › ' + reszlet : ''}</p>
        <h2 className="jelenetkartya__cim">${E.nev(jelenet, ix)}</h2>
        <div className="cimkek">${allapotJel(all)}<span className="kicsi">${A.JELENET_ALLAPOTOK[all].nev}</span>
          ${tipus ? html`<${K.Badge}>${tipus}<//>` : null}${a.nagy_csata ? html`<${K.Badge} tone="danger">nagy csata<//>` : null}</div>
      </div>
      <div className="gombsor gombsor--szoros jelenetkartya__gombok">
        ${!aktualis ? html`<${K.Button} variant="primary" disabled=${!fut} onClick=${onAktualis}>Ez az aktuális<//>` : null}
        ${all !== 'kesz' ? html`<${K.Button} variant=${aktualis ? 'primary' : 'secondary'} disabled=${!fut} onClick=${() => onAllapot('kesz')}>Kész<//>` : null}
        ${all !== 'kihagyva' && all !== 'kesz' ? html`<${K.Button} variant="quiet" disabled=${!fut} onClick=${() => onAllapot('kihagyva')}>Kihagyás<//>` : null}
        ${all ? html`<${K.Button} variant="quiet" disabled=${!fut} onClick=${() => onAllapot('')}>Visszaállítás<//>` : null}
        ${kovetkezo ? html`<${K.Button} variant="secondary" onClick=${() => onNez(kovetkezo.id)}>Következő: ${E.nev(kovetkezo, ix)}<//>` : null}
        <a className="kicsi jelenetkartya__szerk" href=${elemUt(cel, jelenet.id)}>Szerkesztés</a>
      </div>
    </header>
    ${van(a.felolvasando) ? html`<section aria-label="Felolvasandó szöveg"><p className="cimke">Felolvasandó</p><div className="felolvasando">${a.felolvasando}</div></section>` : null}
    ${van(a.fontos_reszletek) || erzekek.length ? html`<${Szakasz} cim="A színtér">
      ${van(a.fontos_reszletek) ? html`<p className="szoveg tordelt">${a.fontos_reszletek}</p>` : null}
      ${erzekek.length ? html`<dl className="ertekek ertekek--lista">${erzekek.map(([n, s]) => html`<div key=${n}><dt>${n}</dt><dd className="ertekek__megj">${s}</dd></div>`)}</dl>` : null}
    <//>` : null}
    ${van(a.titkok) ? html`<div className="dmtitok"><p className="cimke">A DM titkai</p><p className="szoveg tordelt">${a.titkok}</p></div>` : null}
    ${helyek.length ? html`<${Szakasz} cim=${'Helyszín: ' + helyek.map((h) => E.nev(h, ix)).join(', ')} nyitva=${false}>
      ${helyek.map((h) => { const m = E.megjelenitett(h, ix); return html`<div key=${h.id} className="verem verem--kicsi">
        <a className="sorlista__nev" href=${elemUt(cel, h.id)}>${HS.osok(h, ix).map((x) => E.nev(x, ix)).concat([E.nev(h, ix)]).join(' › ')}</a>
        ${van(m.felolvasando) ? html`<div className="felolvasando felolvasando--kicsi">${m.felolvasando}</div>` : van(m.leiras) ? html`<p className="szoveg tordelt kicsi">${m.leiras}</p>` : null}
      </div>`; })}
    <//>` : null}
    ${boltok.length ? html`<${Szakasz} cim="Boltok">
      <ul className="sorlista">${boltok.map((b) => html`<li key=${b.id} className="sorlista__sor">
        <span><a className="sorlista__nev" href=${elemUt(cel, b.id)}>${E.nev(b, ix)}</a><br/><span className="halvany kicsi">${B6.osszefoglalo(E.megjelenitett(b, ix))}</span></span>
        <span className="sorlista__muvelet"><${BoltGomb} allapot=${allapot} elem=${b} ix=${ix} prep=${prep}/></span>
      </li>`)}</ul>
    <//>` : null}
    ${konf.length || megold.length || van(a.tet) || van(a.siker) || van(a.kudarc) ? html`<${Szakasz} cim="Konfliktus és megoldások" nyitva=${false}>
      ${konf.map((k) => html`<p key=${k.id} className="szoveg kicsi"><strong>${k.cel || 'Cél'}</strong>${k.akadaly ? ', akadály: ' + k.akadaly : ''}${k.miert ? ' (miért: ' + k.miert + ')' : ''}</p>`)}
      ${megold.length ? html`<ul className="kicsi jelenetresz__lista">${megold.map((m) => html`<li key=${m.id}>${m.mod ? html`<strong>${m.mod}</strong> ` : null}${m.szoveg}</li>`)}</ul>` : null}
      ${van(a.siker) ? html`<p className="szoveg kicsi"><strong>Siker:</strong> ${a.siker}</p>` : null}
      ${van(a.kudarc) ? html`<p className="szoveg kicsi"><strong>Kudarc:</strong> ${a.kudarc}</p>` : null}
      ${van(a.tet) ? html`<p className="szoveg kicsi"><strong>Tét:</strong> ${a.tet}</p>` : null}
    <//>` : null}
    ${lenyek.length || kihivasok.length ? html`<${Szakasz} cim="Szereplők és kihívások">
      ${lenyek.length ? html`<ul className="sorlista">${lenyek.map((l) => html`<li key=${l.id} className="sorlista__sor">
        <span>${l.forras === 'njk' && l.ref_id ? html`<a href=${'#/dm/njk/' + l.ref_id}>${njkNev(l.ref_id) || l.nev || 'NJK'}</a>`
          : l.forras === 'szorny' && l.ref_id ? html`<a href=${'#/dm/bestiarium/' + l.ref_id}>${szornyNev(l.ref_id) || l.nev || 'lény'}</a>` : l.nev}
          ${l.db > 1 ? ' ×' + l.db : ''}${l.jegyzet ? html` <span className="halvany kicsi">${l.jegyzet}</span>` : null}</span>
        <span className="halvany kicsi">${JL.LENY_FORRASOK[l.forras]}</span></li>`)}</ul>` : null}
      ${kihivasok.map((k) => html`<p key=${k.id} className="szoveg kicsi"><strong>${JL.KIHIVAS_FAJTAK[k.fajta]}: ${k.nev}</strong>${k.leiras ? ' ' + k.leiras : ''}</p>`)}
    <//>` : null}
    ${probak.length ? html`<${Szakasz} cim=${'Előkészített próbák (' + probak.length + ')'}>
      <ul className="sorlista">${probak.map((p) => { const o = JL.probaOsszegzes(p, fokuszNev); return html`<li key=${p.id} className="sorlista__sor">
        <div><span className="sorlista__nev">${o.cim}</span><div className="halvany kicsi">${o.feltetel}${p.mikor ? ' · ' + p.mikor : ''}</div></div>
        <${K.Button} size="sm" variant="primary" disabled=${!p.tulajdonsag} onClick=${() => onProba(p)}>Kiküldöm<//>
      </li>`; })}</ul>
    <//>` : null}
    ${a.osszecsapas_id ? html`<${Szakasz} cim="Összecsapás">
      ${osszecsapas ? html`<div className="sorlista__sor">
        <span className="sorlista__nev">${osszecsapas.cim}</span>
        ${futoCsata ? html`<${K.Button} size="sm" variant="primary" onClick=${() => navigal(csataUt(allapot.kampany.id, futoCsata.id))}>Csata folytatása<//>`
          : html`<${K.Button} size="sm" variant="primary" onClick=${() => setCsata(osszecsapas)}>Csata indítása<//>`}
      </div>` : html`<${Uzenet} tonus="warning">A kötött összecsapás nincs a kampány aktív összecsapásai közt.<//>`}
    <//>` : null}
    <${JelenetAnyagai} elemek=${[jelenet].concat(helyek)} ix=${ix} allapot=${allapot}/>
    ${xpErtek !== null || van(a.kincs) || van(a.targyak) || van(a.egyeb_jutalom) || jutalmak.length ? html`<${Szakasz} cim="Jutalmak">
      ${xpErtek !== null ? html`<div className="sorlista__sor"><span>XP: ${JL.NEHEZSEGEK[a.nehezseg].nev} (${xpErtek} XP fejenként)</span>
        <${K.Button} size="sm" variant="secondary" onClick=${() => setXp(true)}>XP kiosztása<//></div>` : null}
      ${van(a.kincs) ? html`<div className="sorlista__sor"><span className="szoveg kicsi"><strong>Kincs:</strong> ${a.kincs}</span>
        <${K.Button} size="sm" variant="secondary" onClick=${() => setZsakmany(true)}>Zsákmány elosztása<//></div>` : null}
      ${van(a.targyak) ? html`<p className="szoveg kicsi"><strong>Tárgyak:</strong> ${a.targyak}</p>` : null}
      ${van(a.egyeb_jutalom) ? html`<p className="szoveg kicsi"><strong>Egyéb:</strong> ${a.egyeb_jutalom}</p>` : null}
      ${jutalmak.length ? html`<div><p className="cimke">Jutalomelemek</p><${JutalomElemSorok} allapot=${allapot} jutalmak=${jutalmak} ix=${ix} elemUt=${(id) => elemUt(cel, id)}/></div>` : null}
    <//>` : null}
    ${csata ? html`<${CsataInditasParbeszed} allapot=${allapot} osszecsapas=${csata} onBezar=${() => setCsata(null)}
      onKesz=${(cs) => { setCsata(null); navigal(csataUt(allapot.kampany.id, cs.id)); }}/>` : null}
    ${xp ? html`<${XpKiosztas} karakterek=${(allapot.karakterek || []).filter(aktivKarakter).map((c) => ({ id: c.id, nev: c.nev, xp: c.xp || 0, szint: Number(c.szint) || 1 }))}
      kampanyId=${allapot.kampany.id} kezdoBesorolas=${a.nehezseg} kezdoOk=${'Jelenet: ' + E.nev(jelenet, ix)}
      onBezar=${() => setXp(false)} onKesz=${() => setXp(false)}/>` : null}
    ${zsakmany ? html`<${ZsakmanyParbeszed} allapot=${allapot} onBezar=${() => setZsakmany(false)}/>` : null}
  </article>`;
}

// A jelenet (és helyszíne) kiosztható anyagai: kiosztás, megmutatás, kivetítés.
function JelenetAnyagai({ elemek, ix, allapot }) {
  const { api, uzen } = useApp();
  const [kioszt, setKioszt] = useState(null);
  const [kivetit, setKivetit] = useState(null);
  const sorok = elemek.flatMap((el) => AN.anyagokNorm(E.megjelenitett(el, ix).anyagok).map((a) => ({ el, a })));
  if (!sorok.length) return null;
  const kiosztott = (el, a) => (allapot.megosztasok || []).filter((m) => m.tipus === 'anyag' && !AN.visszavontE(m) && m.adat && m.adat.forras
    && m.adat.forras.id === el.id && m.adat.forras.anyag === a.id).slice(-1)[0] || null;
  const forras = (el, a) => ({ tipus: el.tipus, id: el.id, nev: E.nev(el, ix), anyag: a.id });
  const alanyJavaslat = (el, a) => {
    const nev = E.nev(el, ix);
    if (a.alany && a.alany.ismert_nev) return { ismert_nev: a.alany.ismert_nev, kategoria: a.alany.kategoria, valodi: { tipus: el.tipus, id: el.id, nev } };
    return a.fajta === 'reszlet' ? { ismert_nev: nev, kategoria: AN.alanyKategoriaElemhez(el.tipus), valodi: { tipus: el.tipus, id: el.id, nev } } : null;
  };
  const megmutat = async (m) => {
    setKivetit(m);
    try { await api.hivas('share.update', { id: m.id, megmutat: true }); uzen('Megmutatva a címzetteknek.'); } catch (e) { uzen('A megmutatás nem sikerült: ' + e.message, 'danger'); }
  };
  return html`<${Szakasz} cim=${'Kiosztható anyagok (' + sorok.length + ')'}>
    <ul className="sorlista">${sorok.map(({ el, a }) => {
      const m = kiosztott(el, a);
      const hibak = AN.anyagHibak(a);
      return html`<li key=${el.id + a.id} className="sorlista__sor">
        <div><span className="sorlista__nev">${AN.anyagCim(a)}</span>
          <div className="cimkek"><${K.Badge}>${AN.FAJTAK[a.fajta].nev}<//>${el.tipus !== 'jelenet' ? html`<span className="halvany kicsi">${E.nev(el, ix)}</span>` : null}
            ${m ? html`<${K.Badge} tone="success">kiosztva<//>` : null}</div></div>
        <div className="sorlista__muvelet">
          ${m ? html`<${K.Button} size="sm" variant="secondary" onClick=${() => megmutat(m)}>Megmutatom<//>
            <${K.Button} size="sm" variant="quiet" onClick=${() => setKivetit(m)}>Kivetítés<//>`
            : html`<${K.Button} size="sm" variant="primary" disabled=${hibak.length > 0} onClick=${() => setKioszt({ el, a })}>Kiosztom<//>`}
        </div>
      </li>`;
    })}</ul>
    ${kioszt ? html`<${KiosztasParbeszed} vazlat=${kioszt.a} forras=${forras(kioszt.el, kioszt.a)} alanyJavaslat=${alanyJavaslat(kioszt.el, kioszt.a)}
      kampanyId=${allapot.kampany.id} onBezar=${() => setKioszt(null)} onKesz=${(m, mutat) => { setKioszt(null); if (mutat) setKivetit(m); }}/>` : null}
    ${kivetit ? html`<${Kivetito} a=${kivetit} onBezar=${() => setKivetit(null)}/>` : null}
  <//>`;
}

function FutoCsatak({ allapot }) {
  const futo = (allapot.csatak || []).filter((c) => c.allapot !== 'lezart');
  if (!futo.length) return null;
  return html`<${K.Panel} title="Futó csaták"><ul className="sorlista">${futo.map((c) => html`<li key=${c.id} className="sorlista__sor">
    <span><span className="sorlista__nev">${c.cim}</span><br/><span className="halvany kicsi">${c.allapot === 'kezdemenyezes' ? 'Kezdeményezés' : c.kor + '. kör'}</span></span>
    <${K.Button} size="sm" variant="primary" onClick=${() => navigal(csataUt(allapot.kampany.id, c.id))}>Folytatás<//>
  </li>`)}</ul><//>`;
}

// ---- Jobb hasáb: a csapat, a gyorsjegyzet, az eseménynapló ----

function CsapatAllapot({ allapot }) {
  const karakterek = (allapot.karakterek || []).filter(aktivKarakter);
  const lapok = useLapok(karakterek);
  const futo = (allapot.csatak || []).filter((c) => c.allapot !== 'lezart' && c.adat && Array.isArray(c.adat.resztvevok));
  const feltetelek = (id) => futo.flatMap((cs) => cs.adat.resztvevok.filter((r) => r.forras && r.forras.tipus === 'karakter' && r.forras.id === id)
    .flatMap((r) => (r.allapot && r.allapot !== 'aktiv' ? [{ id: r.id + r.allapot, nev: r.allapot === 'haldoklik' ? 'haldoklik' : r.allapot === 'halott' ? 'meghalt' : 'kiesett', veszely: true }] : [])
      .concat((r.feltetelek || []).map((f) => ({ id: f.id, nev: f.nev || f.kulcs })))));
  return html`<${K.Panel} title="Csapat">
    ${karakterek.length ? html`<ul className="csapatlista">${karakterek.map((c) => {
      const lap = lapok[c.id];
      const f = feltetelek(c.id);
      const penz = c.adat && c.adat.felszereles ? Number(c.adat.felszereles.penz_rez) || 0 : null;
      return html`<li key=${c.id} className="csapatlista__sor">
        <div className="nevsor"><${KarakterKep} kep=${c.kep} nev=${c.nev}/><a className="sorlista__nev" href=${'#/dm/karakter/' + c.id}>${c.nev}</a>
          ${penz !== null ? html`<span className="halvany kicsi csapatlista__penz">${penzSzoveg(penz)}</span>` : null}</div>
        ${lap && lap.egeszseg && lap.egeszseg.ertek ? html`<${K.ResourceBar} kind="health" value=${lap.egeszseg.aktualis} max=${lap.egeszseg.ertek}/>` : null}
        ${lap && lap.magiapont && lap.magiapont.ertek ? html`<${K.ResourceBar} kind="magic" value=${lap.magiapont.aktualis} max=${lap.magiapont.ertek}/>` : null}
        ${f.length ? html`<div className="cimkek">${f.map((x) => html`<${K.Badge} key=${x.id} tone=${x.veszely ? 'danger' : 'warning'}>${x.nev}<//>`)}</div>` : null}
      </li>`;
    })}</ul>` : html`<p className="halvany kicsi">Nincs aktív karakter a kampányban.</p>`}
    ${karakterek.length ? html`<${CsapatPihenes} allapot=${allapot} dm=${true}/>` : null}
  <//>`;
}

function GyorsJegyzet({ alk, jelenetNev }) {
  const [szoveg, setSzoveg] = useState('');
  const [mind, setMind] = useState(false);
  const lista = alk.a ? alk.a.adat.gyorsjegyzetek.slice().reverse() : [];
  const ment = () => {
    if (!szoveg.trim() || !alk.fut) return;
    alk.ment((x) => ({ ...x, adat: A.gyorsjegyzetHozzaad(x.adat, { szoveg }) }));
    setSzoveg('');
  };
  const mutat = mind ? lista : lista.slice(0, 4);
  return html`<${K.Panel} title=${html`Gyorsjegyzet <${Sugo} cim="Gyorsjegyzet">A könyv „game notes”-a (89. oldal): rövid sor játék közben, például hogy a hősök rossz
      benyomást tettek Harrigan őrmesterre. Az aktuális jelenethez kötődik, időbélyeggel, és lezáráskor bekerül a kalandnapló vázlatába.<//>`}>
    <div className="verem verem--kicsi">
      <div className="gyorsjegyzet">
        <${K.TextField} label="Mi történt?" multiline=${true} rows=${2} value=${szoveg} disabled=${!alk.fut}
          placeholder=${alk.fut ? 'Rövid sor; Ctrl+Enter ment' : 'Futó alkalomban írható'}
          onChange=${(e) => setSzoveg(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); ment(); } }}/>
        <div className="gombsor gombsor--jobbra"><${K.Button} size="sm" variant="primary" disabled=${!alk.fut || !szoveg.trim()} onClick=${ment}>Feljegyzem<//></div>
      </div>
      ${mutat.length ? html`<ul className="esemenylista">${mutat.map((g) => html`<li key=${g.id} className="esemenylista__sor">
        <span className="esemenylista__ido">${ora(g.ido)}</span>
        <span className="esemenylista__szoveg">${g.szoveg}${g.jelenet_id ? html`<span className="halvany kicsi"> · ${jelenetNev(g.jelenet_id)}</span>` : null}</span>
        ${alk.fut ? html`<button type="button" className="kisgomb" aria-label="Törlés" title="Törlés"
          onClick=${() => alk.ment((x) => ({ ...x, adat: A.gyorsjegyzetTorol(x.adat, g.id) }))}>×</button>` : null}
      </li>`)}</ul>` : null}
      ${lista.length > 4 ? html`<button type="button" className="szoveggomb" onClick=${() => setMind(!mind)}>${mind ? 'Kevesebb' : 'Mind a ' + lista.length}</button>` : null}
    </div>
  <//>`;
}

const FAJTA_JEL = { jelenet: '▸', proba: '⚄', csata: '⚔', anyag: '✉', xp: '★', penz: '¤', jutalom: '♛', pihenes: '☾', jegyzet: '✎', alkalom: '◆', egyeb: '•' };

function EsemenyLista({ adat, jelenetNev, ures, max = 60 }) {
  const lista = adat.naplo.slice().reverse().slice(0, max);
  if (!lista.length) return html`<p className="halvany kicsi">${ures}</p>`;
  return html`<ul className="esemenylista">${lista.map((e) => html`<li key=${e.id} className=${'esemenylista__sor esemenylista__sor--' + e.fajta}>
    <span className="esemenylista__ido">${ora(e.ido)}</span>
    <span className="esemenylista__jel" aria-hidden="true">${FAJTA_JEL[e.fajta] || '•'}</span>
    <span className="esemenylista__szoveg">${A.esemenySzoveg(e)}${e.jelenet_id && e.fajta !== 'jelenet' ? html`<span className="halvany kicsi"> · ${jelenetNev(e.jelenet_id)}</span>` : null}</span>
  </li>`)}</ul>`;
}

// ---- Lezárás ----

function vazlatKornyezet(prep, jelenetNev) {
  return {
    jelenetNev,
    helyszinek: (id) => HS.helyszineiOf(id, (prep.adat && prep.adat.kapcsolatok) || []).map((k) => prep.ix.get(k.hova)).filter(Boolean).map((h) => E.nev(h, prep.ix))
  };
}

function LezarasParbeszed({ alk, allapot, prep, jelenetNev, onBezar, onKesz }) {
  const a = alk.a;
  const [veg, setVeg] = useState(a.jatekbeli_datum || '');
  const jeloltek = A.szereploJeloltek(a, { allapot, elemek: prep.adat ? prep.adat.elemek : [], ix: prep.ix });
  const naplo = a.adat.naplo.filter((e) => e.fajta !== 'alkalom');
  const lezar = () => {
    // utolsó eseménygyűjtés, aztán a lezárás a vázlattal
    const x = alk.ment((y) => {
      const gyujtott = { ...y, adat: A.esemenyekBeolvasztasa(y.adat, A.esemenyekAllapotbol(allapot, y)).adat };
      return A.lezar(gyujtott, { jatekbeliVeg: veg.trim(), jeloltek, ctx: vazlatKornyezet(prep, jelenetNev) });
    }, { uzenet: 'Az alkalom lezárult. A kalandnapló vázlata elkészült.' });
    if (x) onKesz(x);
  };
  return html`<${Parbeszed} cim=${'Lezárás: ' + A.alkalomCim(a)} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" onClick=${lezar}>Lezárás, és a kalandnapló<//>`}>
    <div className="verem">
      <${K.TextField} label="Játékbeli dátum az alkalom végén" hint=${'Az elején: ' + (a.jatekbeli_datum || 'nincs megadva')} value=${veg} onChange=${(e) => setVeg(e.target.value)}/>
      <p className="szoveg">Az eseménynaplóban ${naplo.length} esemény, ${a.adat.gyorsjegyzetek.length} gyorsjegyzet van. Ezekből készül az összefoglaló
        vázlata (a lejátszott jelenetek sorrendjében), amit a kalandnaplóban átírhatsz. A játékosok csak akkor látják a nekik szóló részt, ha közzéteszed.</p>
      ${jeloltek.length ? html`<p className="szoveg kicsi">A fontos szereplők közé (ha még nincsenek ott): ${jeloltek.map((j) => j.nev).join(', ')}.</p>` : null}
    </div>
  <//>`;
}

// ================= Kalandnapló (DM) =================

export function KalandnaploOldal({ kampanyId, alkalomId, Oldalfej }) {
  const { allapot, hiba } = useKampanyAllapot(kampanyId);
  if (hiba && !allapot) return html`<div><${Oldalfej} cim="Kalandnapló" vissza=${['#/dm/kampany/' + kampanyId, 'Kampány']}/><${Uzenet}>${hiba.message}<//></div>`;
  if (!allapot) return html`<${Betoltes} szoveg="Kampány betöltése…"/>`;
  return alkalomId ? html`<${AlkalomNaplo} key=${alkalomId} allapot=${allapot} alkalomId=${alkalomId} Oldalfej=${Oldalfej}/>`
    : html`<${NaploAttekintes} allapot=${allapot} Oldalfej=${Oldalfej}/>`;
}

function NaploAttekintes({ allapot, Oldalfej }) {
  const alk = useAlkalom(allapot);
  const k = allapot.kampany;
  const lista = alk.alkalmak.slice().reverse();
  return html`<div>
    <${Oldalfej} cim=${'Kalandnapló: ' + k.cim} vissza=${['#/dm/kampany/' + k.id, k.cim]}>
      <${K.Button} variant="primary" onClick=${() => navigal(jatekUt(k.id))} icon=${html`<${Ikon} nev="kocka" meret=${18}/>`}>Játék nézet<//>
    <//>
    <div className="ket-hasab ket-hasab--szeles-bal">
      <${K.Panel} title="Alkalmak">
        <p className="sugo">A könyv kampánynaplója (Campaign Journal, Alapkönyv 88. oldal): minden alkalom összefoglalója a valós és a játékbeli
          dátummal, az eseményekkel, a győzelmekkel és kudarcokkal, az XP-vel és a kincsekkel. A játékosoknak szóló rész közzétéve a játékosok Kalandnapló fülén látszik.</p>
        ${lista.length ? html`<ul className="sorlista">${lista.map((x) => html`<li key=${x.id} className="sorlista__sor sorlista__sor--fuggoleges">
          <div className="cimkek"><a className="sorlista__nev" href=${'#' + naploUt(k.id, x.id)}>${A.alkalomCim(x)}</a>
            ${x.allapot !== 'lezart' ? html`<${K.Badge} tone="success">fut<//>` : x.kozzeteve ? html`<${K.Badge} tone="accent">közzétéve<//>` : html`<${K.Badge}>csak a DM-é<//>`}</div>
          <span className="halvany kicsi">${A.valosIdoSzoveg(x)}${A.jatekbeliIdoSzoveg(x) ? ' · Játékbeli idő: ' + A.jatekbeliIdoSzoveg(x) : ''}</span>
          ${x.osszefoglalo_eleje ? html`<p className="szoveg kicsi tordelt naplo__eleje">${x.osszefoglalo_eleje}${x.osszefoglalo_eleje.length >= 280 ? '…' : ''}</p>` : null}
        </li>`)}</ul>` : html`<p className="halvany">Még nincs alkalom. A Játék nézetben indíthatod az elsőt.</p>`}
      <//>
      <div className="verem">
        ${alk.a ? html`<${SzereplokPanel} alk=${alk} allapot=${allapot} csakLista=${true}/>
          <${SzalakPanel} alk=${alk}/>` : html`<${K.Panel} title="Fontos szereplők és futó szálak"><p className="halvany kicsi">Az első alkalommal indul.</p><//>`}
      </div>
    </div>
  </div>`;
}

function AlkalomNaplo({ allapot, alkalomId, Oldalfej }) {
  const { api } = useApp();
  const fo = allapot.alkalom && allapot.alkalom.id === alkalomId;
  const lek = useLekeres(async () => (fo ? null : (await api.hivas('session.get', { id: alkalomId })).alkalom), [alkalomId, fo], fo ? null : 'alkalom.' + alkalomId);
  const k = allapot.kampany;
  if (!fo && lek.hiba && !lek.adat) return html`<div><${Oldalfej} cim="Kalandnapló" vissza=${['#' + naploUt(k.id), 'Kalandnapló']}/><${Uzenet}>${lek.hiba.message}<//></div>`;
  if (!fo && !lek.adat) return html`<${Betoltes} szoveg="Az alkalom betöltése…"/>`;
  return fo ? html`<${FoAlkalomSzerkeszto} allapot=${allapot} Oldalfej=${Oldalfej}/>`
    : html`<${RegiAlkalomSzerkeszto} allapot=${allapot} szerver=${lek.adat} beallit=${lek.beallit} Oldalfej=${Oldalfej}/>`;
}

function FoAlkalomSzerkeszto({ allapot, Oldalfej }) {
  const alk = useAlkalom(allapot);
  return alk.a ? html`<${AlkalomSzerkeszto} alk=${alk} allapot=${allapot} legutobbi=${true} Oldalfej=${Oldalfej}/>` : html`<${Betoltes}/>`;
}

function RegiAlkalomSzerkeszto({ allapot, szerver, beallit, Oldalfej }) {
  const m = useAlkalomMentes(szerver, allapot.kampany.id, { fo: false, onMentve: (x) => beallit(x) });
  const { sync } = useApp();
  const alk = { a: m.a, fut: A.futE(m.a), ment: (fn, o) => { const x = m.ment(fn, o); if (x) sync.helyiModositas((st) => st && st.alkalmak ? { ...st, alkalmak: st.alkalmak.map((y) => (y.id === x.id ? rovid(x) : y)) } : null); return x; } };
  return alk.a ? html`<${AlkalomSzerkeszto} alk=${alk} allapot=${allapot} legutobbi=${false} Oldalfej=${Oldalfej}/>` : html`<${Betoltes}/>`;
}

// A szerkeszthető szövegmezők automatikus mentéssel; a lista- és jelölőmezők azonnal mentődnek.
function AlkalomSzerkeszto({ alk, allapot, legutobbi, Oldalfej }) {
  const { sync, uzen, api } = useApp();
  const a = alk.a;
  const k = allapot.kampany;
  const cel = useMemo(() => ({ szint: 'kampany', kampany_id: k.id }), [k.id]);
  const prep = usePrep(cel);
  const jelenetNev = (id) => (prep.ix.get(id) ? E.nev(prep.ix.get(id), prep.ix) : 'jelenet');
  const kiindulo = () => ({ cim: a.cim, jatekbeli_datum: a.jatekbeli_datum, jatekbeli_veg: a.jatekbeli_veg, szoveg: a.adat.osszefoglalo.szoveg,
    jatekosoknak: a.adat.osszefoglalo.jatekosoknak });
  const [v, setV] = useState(kiindulo);
  const mentes = useAutoMentes(v, (x) => {
    alk.ment((y) => ({ ...y, cim: x.cim, jatekbeli_datum: x.jatekbeli_datum, jatekbeli_veg: x.jatekbeli_veg,
      adat: { ...y.adat, osszefoglalo: { ...y.adat.osszefoglalo, szoveg: x.szoveg, jatekosoknak: x.jatekosoknak } } }));
  });
  // máshonnan érkező változás: ha nincs mentetlen gépelés, a vázlat követi
  useEffect(() => {
    if (mentes.allapot !== 'mentve') return;
    const f = kiindulo();
    if (JSON.stringify(f) !== JSON.stringify(v)) { setV(f); mentes.alap(f); }
  }, [a.verzio]); // eslint-disable-line
  const [ujVazlat, setUjVazlat] = useState(false);
  const [torol, setTorol] = useState(false);
  const set = (m) => (e) => setV({ ...v, [m]: e.target.value });
  const lezart = a.allapot === 'lezart';
  const masikFut = (allapot.alkalmak || []).some((x) => x.id !== a.id && x.allapot !== 'lezart');
  const xp = A.xpOsszesites(a.adat.naplo);
  const penz = A.penzOsszesites(a.adat.naplo);
  const vazlatAtvetel = () => {
    const vz = A.vazlat({ ...a, cim: v.cim, jatekbeli_datum: v.jatekbeli_datum, jatekbeli_veg: v.jatekbeli_veg }, vazlatKornyezet(prep, jelenetNev));
    setV({ ...v, szoveg: vz.szoveg, jatekosoknak: v.jatekosoknak || vz.jatekosoknak });
    setUjVazlat(false);
  };
  return html`<div>
    <${Oldalfej} cim=${A.alkalomCim({ ...a, cim: v.cim })} vissza=${['#' + naploUt(k.id), 'Kalandnapló']}>
      <${MentesJel} allapot=${mentes.allapot}/>
      ${!lezart ? html`<${K.Button} variant="primary" onClick=${() => navigal(jatekUt(k.id))}>Vissza a játékhoz<//>` : null}
    <//>
    <div className="ket-hasab ket-hasab--szeles-bal">
      <div className="verem">
        <${K.Panel} title="Az alkalom" actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUjVazlat(true)}>Vázlat az eseménynaplóból<//>`}>
          <div className="verem">
            <p className="halvany kicsi">${A.valosIdoSzoveg(a)}${lezart ? '' : ' (fut)'}</p>
            <div className="urlap-racs urlap-racs--harom">
              <${K.TextField} label="Cím" value=${v.cim} onChange=${set('cim')}/>
              <${K.TextField} label="Játékbeli dátum (kezdet)" value=${v.jatekbeli_datum} onChange=${set('jatekbeli_datum')}/>
              <${K.TextField} label="Játékbeli dátum (vég)" value=${v.jatekbeli_veg} onChange=${set('jatekbeli_veg')}/>
            </div>
            <${K.TextField} label="Összefoglaló (csak a DM látja)" multiline=${true} rows=${16} value=${v.szoveg} onChange=${set('szoveg')}
              hint="A könyv szerint: mikor és hol, mi történt, kik szerepeltek, győzelmek és kudarcok, XP és kincsek."/>
            ${xp.length || penz.length ? html`<dl className="ertekek ertekek--lista">
              ${xp.length ? html`<div><dt>XP</dt><dd>${xp.map((x) => x.nev + ' ' + x.xp).join(', ')}</dd></div>` : null}
              ${penz.length ? html`<div><dt>Pénz</dt><dd>${penz.map((p) => p.nev + ' ' + (p.penz > 0 ? '+' : '') + penzSzoveg(p.penz)).join(', ')}</dd></div>` : null}
            </dl>` : null}
          </div>
        <//>
        <${K.Panel} title="Játékosoknak">
          <div className="verem">
            <${K.TextField} label="A játékosoknak szóló összefoglaló" multiline=${true} rows=${8} value=${v.jatekosoknak} onChange=${set('jatekosoknak')}
              hint="Ezt látják a Kalandnapló fülükön, ha közzéteszed. A szereplők közül csak azok jelennek meg, akiket az Ismereteik közt is ismernek, az ismert nevükön."/>
            <${Jelolo} checked=${a.kozzeteve} onChange=${(x) => { if (lezart) alk.ment((y) => ({ ...y, kozzeteve: x }), { uzenet: x ? 'Közzétéve a játékosoknak.' : 'A közzététel visszavonva.' }); }}>
              Közzéteszem a játékosoknak${lezart ? '' : ' (a lezárás után)'}<//>
          </div>
        <//>
        <${SzereplokPanel} alk=${alk} allapot=${allapot} prep=${prep}/>
        <${K.Panel} title=${'Eseménynapló (' + a.adat.naplo.length + ') és gyorsjegyzetek (' + a.adat.gyorsjegyzetek.length + ')'}>
          <details className="lenyilo"><summary>Eseménynapló</summary><${EsemenyLista} adat=${a.adat} jelenetNev=${jelenetNev} ures="Nincs esemény." max=${400}/></details>
          ${a.adat.gyorsjegyzetek.length ? html`<details className="lenyilo"><summary>Gyorsjegyzetek</summary><ul className="esemenylista">${a.adat.gyorsjegyzetek.map((g) => html`<li key=${g.id} className="esemenylista__sor">
            <span className="esemenylista__ido">${ora(g.ido)}</span><span className="esemenylista__szoveg">${g.szoveg}${g.jelenet_id ? html`<span className="halvany kicsi"> · ${jelenetNev(g.jelenet_id)}</span>` : null}</span>
            <button type="button" className="kisgomb" aria-label="Törlés" title="Törlés" onClick=${() => alk.ment((x) => ({ ...x, adat: A.gyorsjegyzetTorol(x.adat, g.id) }))}>×</button>
          </li>`)}</ul></details>` : null}
        <//>
      </div>
      <div className="verem">
        ${legutobbi ? html`<${SzalakPanel} alk=${alk}/>` : html`<${K.Panel} title="Futó szálak (akkor)">
          ${a.adat.szalak.length ? html`<ul className="sorlista">${a.adat.szalak.map((s) => html`<li key=${s.id} className="sorlista__sor"><span>${s.cim}</span><span className="halvany kicsi">${A.SZAL_ALLAPOTOK[s.allapot]}</span></li>`)}</ul>`
            : html`<p className="halvany kicsi">Nem volt futó szál.</p>`}
          <p className="halvany kicsi">A futó szálakat és a fontos szereplőket a legutóbbi alkalomnál szerkesztheted; ez az akkori állapot.</p>
        <//>`}
        <${K.Panel} title="Az alkalom kezelése">
          <div className="gombsor">
            ${lezart ? html`<${K.Button} variant="secondary" disabled=${masikFut} onClick=${() => alk.ment((x) => A.ujranyit(x), { uzenet: 'Az alkalom újra fut.' })}>Újranyitás<//>` : null}
            <${K.Button} variant="danger" onClick=${() => setTorol(true)}>Az alkalom törlése<//>
          </div>
          ${masikFut && lezart ? html`<p className="halvany kicsi">Újranyitni csak akkor lehet, ha nem fut másik alkalom.</p>` : null}
        <//>
      </div>
    </div>
    ${ujVazlat ? html`<${Megerosites} cim="Új vázlat" gomb="Felülírom" szoveg="Az összefoglaló szövegét felülírja az eseménynaplóból és a gyorsjegyzetekből készült vázlat. A játékosoknak szóló rész csak akkor változik, ha üres."
      onMegse=${() => setUjVazlat(false)} onIgen=${vazlatAtvetel}/>` : null}
    ${torol ? html`<${Megerosites} cim="Az alkalom törlése" gomb="Törlés" veszelyes=${true}
      szoveg=${'Törlöd: ' + A.alkalomCim(a) + '. Az eseménynaplója, a gyorsjegyzetei és az összefoglalója is elvész; a próbák, anyagok, csaták és XP megmaradnak.'}
      onMegse=${() => setTorol(false)} onIgen=${async () => {
        setTorol(false);
        try {
          await api.hivas('session.delete', { id: a.id });
          allapotFolt(sync, k.id, null, a.id);
          sync.pull().catch(() => {});
          uzen('Az alkalom törölve.');
          navigal(naploUt(k.id));
        } catch (e) { uzen('A törlés nem sikerült: ' + e.message, 'danger'); }
      }}/>` : null}
  </div>`;
}

// ---- Fontos szereplők (a könyv „important characters” listája) ----

function SzereplokPanel({ alk, allapot, prep = null, csakLista = false }) {
  const a = alk.a;
  const [nyitott, setNyitott] = useState(null);
  const [uj, setUj] = useState('');
  const itt = new Set(a.adat.osszefoglalo.itt);
  const lista = a.adat.szereplok;
  const alanyok = allapot.alanyok || [];
  const njkk = allapot.njkk || [];
  const jeloltek = !csakLista && prep && prep.adat ? A.szereploJeloltek(a, { allapot, elemek: prep.adat.elemek, ix: prep.ix })
    .filter((j) => !lista.some((s) => s.tipus === j.tipus && s.ref_id === j.ref_id)) : [];
  const ment = (fn) => alk.ment((x) => ({ ...x, adat: fn(x.adat) }));
  const modosit = (id, m) => ment((d) => ({ ...d, szereplok: d.szereplok.map((s) => (s.id === id ? { ...s, ...m } : s)) }));
  const ittValt = (id, be) => ment((d) => ({ ...d, osszefoglalo: { ...d.osszefoglalo, itt: be ? d.osszefoglalo.itt.concat([id]) : d.osszefoglalo.itt.filter((x) => x !== id) } }));
  const hozzaad = (sz) => ment((d) => ({ ...d, szereplok: d.szereplok.concat([A.szereploNorm({ id: A.ujId('sz'), ...sz })]) }));
  const opciok = [{ value: 'szabad', label: 'Szabad név…' }]
    .concat(njkk.filter((n) => !lista.some((s) => s.tipus === 'njk' && s.ref_id === n.id)).map((n) => ({ value: 'njk:' + n.id, label: 'NJK: ' + n.nev })))
    .concat(alanyok.filter((x) => !lista.some((s) => s.tipus === 'alany' && s.ref_id === x.id)).map((x) => ({ value: 'alany:' + x.id, label: 'Alany: ' + AN.alanyNevDm(x) })));
  const felvesz = () => {
    if (!uj) return;
    if (uj === 'szabad') { hozzaad({ tipus: 'szabad', nev: 'Új szereplő' }); setUj(''); return; }
    const [t, id] = uj.split(':');
    const nev = t === 'njk' ? (njkk.find((n) => n.id === id) || {}).nev : AN.alanyNevDm(alanyok.find((x) => x.id === id));
    hozzaad({ tipus: t, ref_id: id, nev: nev || '' });
    setUj('');
  };
  const tipusSzoveg = (s) => (s.tipus === 'njk' ? 'NJK' : s.tipus === 'alany' ? 'alany' : s.tipus === 'elem' ? 'elem' : '');
  return html`<${K.Panel} title=${html`Fontos szereplők <${Sugo} cim="Fontos szereplők">A könyv szerint a kampánynaplóban legyen egy lista a fontos szereplőkről, röviden,
      hogy ha a játékosok a pár kalanddal korábban elszökött bandita nevére kíváncsiak, egy pillantással meglegyen. A lista alkalomról alkalomra öröklődik.
      A „nyilvános jegyzet” a játékosok kalandnaplójába kerül, ha a szereplő az Ismereteik közt is ott van.<//>`}>
    <div className="verem verem--kicsi">
      ${lista.length ? html`<ul className="sorlista">${lista.map((s) => html`<li key=${s.id} className="sorlista__sor sorlista__sor--fuggoleges">
        <div className="szereplosor">
          ${!csakLista ? html`<label className="szereplosor__itt" title="Szerepelt ebben az alkalomban"><input type="checkbox" checked=${itt.has(s.id)}
            onChange=${(e) => ittValt(s.id, e.target.checked)}/><span className="lathatatlan">Szerepelt ebben az alkalomban</span></label>` : null}
          <button type="button" className="szereplosor__nev" aria-expanded=${nyitott === s.id} onClick=${() => setNyitott(nyitott === s.id ? null : s.id)}>${s.nev || 'Névtelen'}</button>
          ${tipusSzoveg(s) ? html`<span className="halvany kicsi">${tipusSzoveg(s)}</span>` : null}
          ${s.jegyzet && nyitott !== s.id ? html`<span className="halvany kicsi szereplosor__jegyzet">${s.jegyzet}</span>` : null}
        </div>
        ${nyitott === s.id ? html`<${SzereploSzerkeszto} s=${s} onMent=${(m) => modosit(s.id, m)} onTorol=${() => { setNyitott(null); ment((d) => ({ ...d, szereplok: d.szereplok.filter((x) => x.id !== s.id),
          osszefoglalo: { ...d.osszefoglalo, itt: d.osszefoglalo.itt.filter((x) => x !== s.id) } })); }}/>` : null}
      </li>`)}</ul>` : html`<p className="halvany kicsi">Még nincs fontos szereplő. Lezáráskor a lejátszott jelenetek NJK-i és a kiosztott anyagok alanyai bekerülnek.</p>`}
      ${!csakLista ? html`<p className="halvany kicsi">A jelölt sorok szerepeltek ebben az alkalomban.</p>` : null}
      ${jeloltek.length ? html`<div className="sorban sorban--kozep"><span className="kicsi">Ebben az alkalomban még: ${jeloltek.map((j) => j.nev).join(', ')}</span>
        <${K.Button} size="sm" variant="secondary" onClick=${() => ment((d) => A.szereplokFelvetele(d, jeloltek))}>Felveszem<//></div>` : null}
      <div className="sorban">
        <${Valaszto} label="Új szereplő" value=${uj} onChange=${setUj} ures="Válassz…" opciok=${opciok}/>
        <${K.Button} size="sm" variant="secondary" disabled=${!uj} onClick=${felvesz}>Hozzáadás<//>
      </div>
    </div>
  <//>`;
}

function SzereploSzerkeszto({ s, onMent, onTorol }) {
  const [v, setV] = useState({ nev: s.nev, jegyzet: s.jegyzet, nyilvanos: s.nyilvanos });
  return html`<div className="verem verem--kicsi szereplosor__szerk">
    <${K.TextField} label="Név" value=${v.nev} onChange=${(e) => setV({ ...v, nev: e.target.value })}/>
    <${K.TextField} label="Jegyzet (csak a DM látja)" multiline=${true} rows=${2} value=${v.jegyzet} onChange=${(e) => setV({ ...v, jegyzet: e.target.value })}/>
    <${K.TextField} label="Nyilvános jegyzet (a játékosoknak)" value=${v.nyilvanos} onChange=${(e) => setV({ ...v, nyilvanos: e.target.value })}/>
    <div className="gombsor gombsor--jobbra">
      <${K.Button} size="sm" variant="quiet" onClick=${onTorol}>Törlés<//>
      <${K.Button} size="sm" variant="primary" onClick=${() => onMent(v)}>Mentés<//>
    </div>
  </div>`;
}

// ---- Futó szálak (a könyv „ongoing plots, sub-plots”) ----

function SzalakPanel({ alk }) {
  const a = alk.a;
  const [uj, setUj] = useState('');
  const [nyitott, setNyitott] = useState(null);
  const ment = (fn) => alk.ment((x) => ({ ...x, adat: { ...x.adat, szalak: fn(x.adat.szalak) } }));
  const hozzaad = () => { if (!uj.trim()) return; ment((l) => l.concat([A.szalNorm({ id: A.ujId('sl'), cim: uj.trim() })])); setUj(''); };
  const lista = a.adat.szalak;
  return html`<${K.Panel} title=${html`Futó szálak <${Sugo} cim="Futó szálak">A könyv szerint a kampánynaplóban legyenek ott a futó cselekményszálak és
      mellékszálak, hogy egyik se vesszen el. A nyitott szálak a következő alkalomra is átkerülnek, a lezártak az alkalom után kimaradnak.<//>`}>
    <div className="verem verem--kicsi">
      ${lista.length ? html`<ul className="sorlista">${lista.map((s) => html`<li key=${s.id} className="sorlista__sor sorlista__sor--fuggoleges">
        <div className="szereplosor">
          <label className="szereplosor__itt" title="Lezárva"><input type="checkbox" checked=${s.allapot === 'lezart'}
            onChange=${(e) => ment((l) => l.map((x) => (x.id === s.id ? { ...x, allapot: e.target.checked ? 'lezart' : 'nyitott' } : x)))}/>
            <span className="lathatatlan">Lezárva</span></label>
          <button type="button" className=${'szereplosor__nev' + (s.allapot === 'lezart' ? ' szereplosor__nev--lezart' : '')} aria-expanded=${nyitott === s.id}
            onClick=${() => setNyitott(nyitott === s.id ? null : s.id)}>${s.cim || 'Névtelen szál'}</button>
          ${s.jegyzet && nyitott !== s.id ? html`<span className="halvany kicsi szereplosor__jegyzet">${s.jegyzet}</span>` : null}
        </div>
        ${nyitott === s.id ? html`<${SzalSzerkeszto} s=${s} onMent=${(m) => { ment((l) => l.map((x) => (x.id === s.id ? { ...x, ...m } : x))); setNyitott(null); }}
          onTorol=${() => { setNyitott(null); ment((l) => l.filter((x) => x.id !== s.id)); }}/>` : null}
      </li>`)}</ul>` : html`<p className="halvany kicsi">Nincs futó szál.</p>`}
      <div className="sorban">
        <${K.TextField} label="Új szál" placeholder="Például: Ki küldte a levelet?" value=${uj} onChange=${(e) => setUj(e.target.value)}
          onKeyDown=${(e) => { if (e.key === 'Enter') hozzaad(); }}/>
        <${K.Button} size="sm" variant="secondary" disabled=${!uj.trim()} onClick=${hozzaad}>Hozzáadás<//>
      </div>
    </div>
  <//>`;
}

function SzalSzerkeszto({ s, onMent, onTorol }) {
  const [v, setV] = useState({ cim: s.cim, jegyzet: s.jegyzet });
  return html`<div className="verem verem--kicsi szereplosor__szerk">
    <${K.TextField} label="A szál" value=${v.cim} onChange=${(e) => setV({ ...v, cim: e.target.value })}/>
    <${K.TextField} label="Hol tart" multiline=${true} rows=${2} value=${v.jegyzet} onChange=${(e) => setV({ ...v, jegyzet: e.target.value })}/>
    <div className="gombsor gombsor--jobbra">
      <${K.Button} size="sm" variant="quiet" onClick=${onTorol}>Törlés<//>
      <${K.Button} size="sm" variant="primary" onClick=${() => onMent(v)}>Mentés<//>
    </div>
  </div>`;
}
