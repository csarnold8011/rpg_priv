// Kampányépítő (DM, 5.3 alépés): jelenetek a Kampányépítő könyv 3. fejezete (Building Encounters) szerint.
// A jelenet szerkesztője lépésenként (a könyv nyolc tervezési lépése és a típus), a kötés a 3. lépés összecsapásaihoz és a
// 2. lépés próbakéréséhez (előkészített próbák), a képek és a térkép, és a jelenettípusok aránya a kaland és a kampány
// nézetében. Tiszta függvények: web/js/kampany/jelenet.js. Terv: claude/kampanyepito-terv.md, „3. fejezet”.
import { html, K, useApp, useState, useMemo, useLekeres, useMuvelet, navigal, Ikon, Uzenet, Valaszto, Jelolo, Parbeszed } from './kozos.js';
import { Csip } from './varazslo_lepesek.js';
import { ProbaKeresUrlap } from './probakeres.js';
import { fokuszNevLapbol } from './proba.js';
import { KepekPanel } from './epito_kepek.js';
import * as E from '../kampany/elem.js';
import * as KL from '../kampany/kaland.js';
import * as JL from '../kampany/jelenet.js';
import * as O from '../jatek/osszecsapas.js';
import { megjelenitettNev } from '../szabalyok.js';
import { SAJAT_LEPESEK, ElemMezo, OroklesJel, elemUt, ujAzon } from './epito.js';
import { HelyszinKotes } from './epito_helyszin.js';

const PONT = { kesz: ['kaland__pont kaland__pont--kesz', '✓'], resz: ['kaland__pont kaland__pont--resz', '…'], ures: ['kaland__pont', ''] };
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};
const aktivKarakter = (c) => !c.kampany_allapot || c.kampany_allapot === 'aktív';

function LepesPanel({ lepes, allapot, children, actions }) {
  const l = JL.JELENET_LEPESEK[lepes];
  const p = PONT[allapot || 'ures'];
  return html`<${K.Panel} actions=${actions} title=${html`${allapot ? html`<span className=${p[0]} aria-label=${allapot === 'kesz' ? 'kitöltve' : allapot === 'resz' ? 'részben kitöltve' : 'üres'}>${p[1]}</span> ` : null}${l.nev} <span className="halvany keret__en">(${l.en}, ${l.oldal}. oldal)</span>`}>
    <div className="verem"><p className="sugo">${l.utmutato}</p>${children}</div>
  <//>`;
}

function MezoCimke({ elem, ix, mezo, valt, children }) {
  return html`<p className="cimke">${children} <${OroklesJel} info=${E.mezoErtek(elem, mezo, ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, mezo))}/></p>`;
}

const kisGomb = (felirat, cim, onClick, disabled) => html`<button type="button" className="kisgomb" aria-label=${cim} title=${cim}
  disabled=${disabled} onClick=${onClick}>${felirat}</button>`;

const Figyelmeztetesek = ({ adat, lepes }) => JL.figyelmeztetesek(adat).filter((f) => f.lepes === lepes)
  .map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f.szoveg}<//>`);

// Egy listás mező szerkesztése: sorok mezőkkel, hozzáadás és törlés. ures: az új sor; sorTartalom(sor, allit).
function ListaMezo({ elem, ix, valt, mezo, norm, cim, ures, gomb, sorTartalom, uresSzoveg }) {
  const lista = norm(E.mezoErtek(elem, mezo, ix).ertek);
  const allit = (l) => valt(E.mezoBeallit(elem, mezo, l, ix));
  return html`<div className="verem">
    <${MezoCimke} elem=${elem} ix=${ix} mezo=${mezo} valt=${valt}>${cim}<//>
    ${lista.length ? html`<ul className="sorlista">${lista.map((s, i) => html`<li key=${s.id} className="sorlista__sor sorlista__sor--fuggoleges jelenet__listasor">
      ${sorTartalom(s, (x) => allit(lista.map((y, j) => (j === i ? { ...y, ...x } : y))), i)}
      <div className="gombsor gombsor--szoros">
        ${kisGomb('↑', 'Feljebb', () => allit(KL.utemMozgat(lista, i, -1)), i === 0)}
        ${kisGomb('↓', 'Lejjebb', () => allit(KL.utemMozgat(lista, i, 1)), i === lista.length - 1)}
        <${K.Button} size="sm" variant="quiet" onClick=${() => allit(lista.filter((_, j) => j !== i))}>Törlés<//>
      </div>
    </li>`)}</ul>` : uresSzoveg ? html`<p className="halvany kicsi">${uresSzoveg}</p>` : null}
    <div><${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
      onClick=${() => allit(lista.concat([{ ...ures(), id: ujAzon(mezo.slice(0, 2)) }]))}>${gomb}<//></div>
  </div>`;
}

// ================= Adatok a kampányból: karakterek, NJK-k, összecsapások =================

function useKornyezet(cel) {
  const { api, szabalyok } = useApp();
  const init = useLekeres(async () => api.hivas('init'), [], 'init');
  const njkk = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk');
  const kampanyban = cel.szint === 'kampany';
  const oss = useLekeres(async () => (kampanyban ? (await api.hivas('encounter.list', { kampany_id: cel.kampany_id })).osszecsapasok : []),
    [cel.kampany_id], kampanyban ? 'osszecsapasok.' + cel.kampany_id : null);
  const lapok = lapokBol(szabalyok);
  return useMemo(() => {
    const karakterek = ((init.adat && init.adat.karakterek) || [])
      .filter((c) => c.aktiv !== false && (!kampanyban || (c.kampanyok || []).includes(cel.kampany_id)));
    const njkLista = (njkk.adat || []).filter((n) => n.aktiv !== false);
    return {
      karakterek, njkk: njkLista, szornyek: lapok['Szörnyek'] || [], lapok,
      osszecsapasok: (oss.adat || []).filter((o) => o.aktiv !== false), osszecsapasUjra: oss.ujra,
      becsles: { szornyek: lapok['Szörnyek'] || [], njkk: njkLista, karakterek: karakterek.map((c) => ({ id: c.id, nev: c.nev, szint: Number(c.szint) || 1 })),
        csapat: karakterek.filter(aktivKarakter).map((c) => ({ id: c.id, szint: Number(c.szint) || 1 })) }
    };
  }, [init.adat, njkk.adat, oss.adat, lapok, cel.kampany_id]); // eslint-disable-line
}

// ================= A jelenet lépései =================

function JelenetMezok({ lepes, elem, ix, valt, prep, cel }) {
  const { api, szabalyok, uzen } = useApp();
  const a = E.megjelenitett(elem, ix);
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const all = JL.lepesAllapot(a);
  const korny = useKornyezet(cel);
  const [otlet, setOtlet] = useState('');
  const [proba, setProba] = useState(null); // { id, mikor, u } szerkesztés alatt
  const [fut, indit] = useMuvelet();
  const kaland = KL.kalandja(elem, ix);
  const elemek = prep.adat.elemek.map((x) => (x.id === elem.id ? elem : x));
  const tipusok = JL.tipusokOf(a);
  const fokLap = lapokBol(szabalyok);
  const fokuszNev = (id) => fokuszNevLapbol(fokLap, id);

  if (lepes === 'otlet') {
    const otletek = Array.isArray(a.otletek) ? a.otletek : [];
    return html`<${LepesPanel} lepes="otlet" allapot=${all.otlet}>
      <${MezoCimke} elem=${elem} ix=${ix} mezo="otletek" valt=${valt}>Ötletszavak<//>
      ${otletek.length ? html`<div className="csipek">${otletek.map((o, i) => html`<span key=${i} className="csip csip--statikus">${o}
        <button type="button" className="csip__gomb" aria-label=${'Törlés: ' + o} onClick=${() => set('otletek', otletek.filter((_, j) => j !== i))}>×</button></span>`)}</div>` : null}
      <form className="sorban" onSubmit=${(e) => { e.preventDefault(); const t = otlet.trim(); if (t) { set('otletek', otletek.concat([t])); setOtlet(''); } }}>
        <${K.TextField} label="Új ötletszó" value=${otlet} onChange=${(e) => setOtlet(e.target.value)} placeholder="titkos menekülőút, sárkány, íjászok, mocsár, szakadék…"/>
        <${K.Button} type="submit" variant="secondary" disabled=${!otlet.trim()}>Hozzáadás<//>
      </form>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="otlet_jegyzet" label="Hogyan áll össze?" multiline=${true} rows=${4} onValt=${valt}
        hint="Melyik ötletek kapcsolhatók össze? Hogyan reagálnának rájuk a játékosok? Ami most nem kell, jó lesz máskor."/>
    <//>`;
  }

  if (lepes === 'hely') {
    const sor = kaland ? KL.utemSor(kaland, elemek, ix) : [];
    const utemei = sor.map((x, i) => ({ ...x, i })).filter((x) => { const j = KL.jelenetFelold(x.utem.jelenet_id, kaland, elemek, ix); return j && j.id === elem.id; });
    const jelleg = JL.jellegOf(a);
    return html`<${LepesPanel} lepes="hely" allapot=${all.hely}>
      ${kaland ? html`<p className="halvany kicsi">Kaland: <a href=${elemUt(cel, kaland.id)}>${E.nev(kaland, ix)}</a>${utemei.length
        ? html` · az ütemsorban: ${utemei.map((x) => (x.i + 1) + '. ' + (x.utem.szoveg || '(üres ütem)')).join('; ')}` : ' · még egyik ütemhez sincs kötve'}</p>` : null}
      <${Valaszto} label=${html`Jelleg <${OroklesJel} info=${E.mezoErtek(elem, 'jelleg', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'jelleg'))}/>`}
        value=${jelleg} onChange=${(x) => set('jelleg', x)} hint=${JL.JELLEGEK[jelleg].leiras + ' (' + JL.JELLEGEK[jelleg].en + ', ' + JL.JELLEGEK[jelleg].oldal + '. oldal)'}
        opciok=${Object.entries(JL.JELLEGEK).map(([value, j]) => ({ value, label: j.nev }))}/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="tortenetben" label="Mi a célja a történetben?" multiline=${true} rows=${3} onValt=${valt}
        hint="Sorsdöntő? Megfordítja a kaland menetét? A fő szálhoz vagy egy karakter hátteréhez tartozik? Új irányt nyit, vagy egy meglévőt visz tovább? Mi vezetett ide?"/>
      <div className="urlap-racs">
        ${cel.szint === 'kampany' ? html`<${Valaszto} label=${html`Egy karakter hátteréhez tartozik <${OroklesJel} info=${E.mezoErtek(elem, 'karakter_id', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'karakter_id'))}/>`}
          value=${a.karakter_id || ''} ures="az egész csapaté" onChange=${(x) => set('karakter_id', x)}
          opciok=${korny.karakterek.map((c) => ({ value: c.id, label: c.nev }))}/>` : null}
        <${ElemMezo} elem=${elem} ix=${ix} mezo="feltetel" label="Feltétel" onValt=${valt} placeholder="például csak ha elfogják a futárt"
          hint="Ha a jelenet csak bizonyos esetben kerül elő."/>
      </div>
      <${HelyszinKotes} elem=${elem} prep=${prep} cel=${cel} cim="Hol játszódik?"/>
      <p className="cimke">A tét (Defining the Stakes)</p>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="tet" label="Mi történik, ha kudarcot vallanak?" multiline=${true} rows=${3} onValt=${valt}
        hint="Erősítést hívnak az orkok? Vagy épp a győzelmüket ünneplik, és kevésbé veszélyesek, amikor a hősök visszatérnek?"/>
      <${Valaszto} label=${html`Újrapróbálható? <${OroklesJel} info=${E.mezoErtek(elem, 'ujraproba', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'ujraproba'))}/>`}
        value=${a.ujraproba || ''} onChange=${(x) => set('ujraproba', x)}
        opciok=${Object.entries(JL.UJRAPROBAK).filter(([k]) => k).map(([value, label]) => ({ value, label }))} ures="nincs megadva"/>
    <//>`;
  }

  if (lepes === 'tipus') {
    const valt2 = (t) => set('tipusok', tipusok.includes(t) ? tipusok.filter((x) => x !== t) : tipusok.concat([t]));
    return html`<${LepesPanel} lepes="tipus" allapot=${all.tipus}>
      <${MezoCimke} elem=${elem} ix=${ix} mezo="tipusok" valt=${valt}>Típus (több is választható: vegyes jelenet)<//>
      <div className="csipek">${JL.TIPUS_KULCSOK.map((t) => html`<${Csip} key=${t} be=${tipusok.includes(t)} onClick=${() => valt2(t)}>
        ${JL.JELENET_TIPUSOK[t].nev} (${JL.JELENET_TIPUSOK[t].en})<//>`)}</div>
      ${tipusok.length > 1 ? html`<p className="halvany kicsi">Vegyes (Hybrid Encounters, 35–36. oldal): két cél egyszerre, amelyek erősíthetik vagy keresztezhetik egymást.</p>` : null}
      ${tipusok.length ? html`<ul className="sorlista">${tipusok.map((t) => { const d = JL.JELENET_TIPUSOK[t]; return html`<li key=${t} className="sorlista__sor sorlista__sor--fuggoleges">
        <strong>${d.nev} <span className="halvany keret__en">(${d.en}, ${d.oldal}. oldal)</span></strong>
        <span className="kicsi">${d.leiras}</span>
        <span className="sugo kicsi">Tervezéskor (40–41. oldal): ${d.tanacs}</span>
      </li>`; })}</ul>` : html`<p className="halvany kicsi">${JL.TIPUS_KULCSOK.map((t) => JL.JELENET_TIPUSOK[t].nev + ': ' + JL.JELENET_TIPUSOK[t].leiras).join(' ')}</p>`}
      ${tipusok.includes('harc') ? html`<div className="urlap-racs">
        <${Valaszto} label=${html`A harc formája <${OroklesJel} info=${E.mezoErtek(elem, 'harc_fajta', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'harc_fajta'))}/>`}
          value=${a.harc_fajta || ''} onChange=${(x) => set('harc_fajta', x)}
          hint=${a.harc_fajta === 'csata' ? 'A hősök körüli eseményekre figyelj, konkrét célokkal: ostromgép, vezér, taktikai előny (34. oldal).'
            : a.harc_fajta === 'parbaj' ? 'Gyors tempó, rövid jelenet, a többiek is legyenek benne; nem kell halálig; Kommunikáció, Észlelés, Akaraterő próbák is (34. oldal).' : ''}
          opciok=${Object.entries(JL.HARC_FAJTAK).map(([value, label]) => ({ value, label }))}/>
        <div className="elemmezo"><${Jelolo} checked=${a.nagy_csata === true} onChange=${(x) => set('nagy_csata', x || undefined)}>
          Nagy csata (hosszú; az ütemsor alkalmakra bontásánál is ennek számít)<//></div>
      </div>` : null}
    <//>`;
  }

  if (lepes === 'konfliktus') {
    return html`<${LepesPanel} lepes="konfliktus" allapot=${all.konfliktus}>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="konfliktusok" norm=${JL.konfliktusokNorm} cim="Konfliktusok" gomb="Konfliktus"
        ures=${() => ({ cel: '', akadaly: '', miert: '' })} uresSzoveg="Még nincs konfliktus. Minden jelenetben van legalább egy: ellenfél, veszély, csapda, vagy akár egy jó szándékú barát."
        sorTartalom=${(k, allit) => html`<div className="urlap-racs">
          <${K.TextField} label="A csapat célja" value=${k.cel} onChange=${(e) => allit({ cel: e.target.value })} placeholder="átjutni a hídon"/>
          <${K.TextField} label="Mi áll az útjában?" value=${k.akadaly} onChange=${(e) => allit({ akadaly: e.target.value })} placeholder="a báró zsoldosai"/>
        </div>
        <${K.TextField} label="Miért?" value=${k.miert} onChange=${(e) => allit({ miert: e.target.value })} placeholder="a báró jól megfizette őket"
          hint="Ebből derül ki, milyen más út van: a zsoldos megvesztegethető, a fanatikus nem."/>`}/>
      <${Figyelmeztetesek} adat=${a} lepes="konfliktus"/>
    <//>`;
  }

  if (lepes === 'megoldas') {
    const konf = JL.konfliktusokNorm(a.konfliktusok);
    return html`<${LepesPanel} lepes="megoldas" allapot=${all.megoldas}>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="megoldasok" norm=${JL.megoldasokNorm} cim="Megoldási utak" gomb="Megoldási út"
        ures=${() => ({ mod: '', szoveg: '', konfliktus_id: '' })} uresSzoveg="Még nincs megoldási út."
        sorTartalom=${(m, allit) => html`<div className="csipek">${Array.from(new Set(JL.MEGOLDAS_MODOK.concat(m.mod ? [m.mod] : []))).map((x) => html`<${Csip} key=${x}
            be=${m.mod === x} onClick=${() => allit({ mod: m.mod === x ? '' : x })}>${x}<//>`)}</div>
          <div className="urlap-racs">
            <${K.TextField} label="Hogyan?" value=${m.szoveg} onChange=${(e) => allit({ szoveg: e.target.value })} placeholder="például a vezér pénzt kér a szabad átvonulásért"/>
            ${konf.length > 1 ? html`<${Valaszto} label="Melyik konfliktust oldja meg?" value=${m.konfliktus_id} ures="mindet, vagy nincs megadva"
              onChange=${(x) => allit({ konfliktus_id: x })} opciok=${konf.map((k, i) => ({ value: k.id, label: (i + 1) + '. ' + (k.cel || k.akadaly || 'konfliktus') }))}/>` : null}
          </div>`}/>
      <div className="urlap-racs">
        <${ElemMezo} elem=${elem} ix=${ix} mezo="siker" label="Mikor sikerül?" multiline=${true} rows=${2} onValt=${valt}/>
        <${ElemMezo} elem=${elem} ix=${ix} mezo="kudarc" label="Mikor vall kudarcot?" multiline=${true} rows=${2} onValt=${valt}/>
      </div>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="elkerules" label="Ha elkerülik (Avoiding Encounters, 36. oldal)" multiline=${true} rows=${2} onValt=${valt}
        hint="Mi a jelenet valódi célja (például átjutni az ajtón)? Ha a csapat más tervvel próbálkozik, és van esélye, engedd."/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="lezaras" label="Mikor ér véget? (Ending an Encounter, 36. oldal)" multiline=${true} rows=${2} onValt=${valt}
        hint="Ha a kimenet már biztos, vagy unalmassá válik: a maradék ellenfél megadja magát, a titkos ajtó mégis előkerül."/>
      <div className="elemmezo"><${Jelolo} checked=${a.kiegyensulyozatlan === true} onChange=${(x) => set('kiegyensulyozatlan', x || undefined)}>
        Szándékosan kiegyensúlyozatlan (Intentionally Unbalanced Encounters, 38. oldal)<//></div>
      ${a.kiegyensulyozatlan === true ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="kiegyensulyozatlan_ok" label="Miért, és hogyan jelzed előre?" multiline=${true} rows=${2} onValt=${valt}
        hint="Egy hatalmas gonosztevő bemutatása, vagy egy még tiltott hely. Előre szóljanak a hírek, legyen kerülőút vagy menekülés, és ne erőltesd a harcot."/>` : null}
      <${Figyelmeztetesek} adat=${a} lepes="megoldas"/>
    <//>`;
  }

  if (lepes === 'kihivasok') {
    const osszecsapas = a.osszecsapas_id ? korny.osszecsapasok.find((o) => o.id === a.osszecsapas_id) : null;
    const becsles = osszecsapas ? O.nehezsegBecsles(O.normalizal(osszecsapas.adat), korny.becsles) : null;
    const ujOsszecsapas = () => indit(async () => {
      const adat = O.csapatHozzaadas(O.uresOsszecsapas(), korny.karakterek.filter(aktivKarakter).map((c) => ({ id: c.id, nev: c.nev })));
      const v = await api.hivas('encounter.save', { kampany_id: cel.kampany_id, cim: E.nev(elem, ix).slice(0, 120), adat });
      set('osszecsapas_id', v.osszecsapas.id);
      korny.osszecsapasUjra();
      uzen('Összecsapás készült a jelenethez. A résztvevőket az összecsapás-építőben adhatod hozzá.');
    });
    const szornyOpciok = korny.szornyek.filter((s) => s.aktiv !== false).map((s) => ({ value: s.id, label: megjelenitettNev(s) }))
      .sort((x, y) => x.label.localeCompare(y.label, 'hu'));
    const njkOpciok = korny.njkk.map((n) => ({ value: n.id, label: n.nev }));
    return html`<${LepesPanel} lepes="kihivasok" allapot=${all.kihivasok}>
      <div className="szakasz jelenet__szakasz">
        <${MezoCimke} elem=${elem} ix=${ix} mezo="osszecsapas_id" valt=${valt}>Összecsapás (a 3. lépés összecsapás-építőjéből)<//>
        ${cel.szint !== 'kampany' ? html`<p className="halvany kicsi">Az összecsapás a kampányé: a kampányváltozatban köthető hozzá. Itt a lények és NJK-k listája rögzíti, kik vannak a jelenetben.</p>` : html`
          <div className="sorban sorban--kozep">
            <${Valaszto} label="Összecsapás" value=${a.osszecsapas_id || ''} ures="nincs" onChange=${(x) => set('osszecsapas_id', x)}
              opciok=${korny.osszecsapasok.map((o) => ({ value: o.id, label: o.cim + (o.allapot && o.allapot !== 'előkészítés' ? ' (' + o.allapot + ')' : '') }))}/>
            ${osszecsapas ? html`<${K.Button} size="sm" variant="secondary" onClick=${() => navigal('/dm/kampany/' + cel.kampany_id + '/osszecsapas/' + osszecsapas.id)}>Megnyitás<//>`
              : html`<${K.Button} size="sm" variant="secondary" disabled=${fut} onClick=${ujOsszecsapas} icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új összecsapás ebből<//>`}
          </div>
          ${a.osszecsapas_id && !osszecsapas && korny.osszecsapasok.length ? html`<${Uzenet} tonus="warning">A kötött összecsapás nincs a kampány aktív összecsapásai közt (archiválták vagy törölték).<//>` : null}
          ${osszecsapas ? html`<p className="kicsi">${O.osszegzes(O.normalizal(osszecsapas.adat)).osszes} résztvevő${becsles && becsles.becsles
            ? html` · tájékoztató nehézség: <${K.Badge} tone=${O.NEHEZSEGEK[becsles.becsles].tonus}>${becsles.becsles}<//> (csapatszint ${becsles.csapat.szint})` : ' · még nincs ellenfél vagy becslés'}</p>` : null}
          <p className="halvany kicsi">A fenyegetési szint csak tájékoztató; nézd meg a csapat képességeit is (38. oldal). Az összecsapás itt kapcsolat: a módosítása az összecsapás-építőben történik.</p>`}
      </div>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="lenyek" norm=${JL.lenyekNorm} cim="Lények és NJK-k a jelenetben" gomb="Lény vagy NJK"
        ures=${() => ({ forras: 'szorny', ref_id: '', nev: '', db: 1, jegyzet: '' })}
        uresSzoveg=${cel.szint === 'kampany' ? 'Ha van összecsapás, a résztvevők ott vannak; ide a nem harcoló szereplők vagy a tervezett lények kerülhetnek.' : 'Még nincs lény vagy NJK.'}
        sorTartalom=${(l, allit) => html`<div className="urlap-racs">
          <${Valaszto} label="Honnan" value=${l.forras} onChange=${(x) => allit({ forras: x, ref_id: '' })}
            opciok=${Object.entries(JL.LENY_FORRASOK).map(([value, label]) => ({ value, label }))}/>
          ${l.forras === 'szorny' ? html`<${Valaszto} label="Lény" value=${l.ref_id} ures="válassz…" onChange=${(x) => allit({ ref_id: x })} opciok=${szornyOpciok}/>`
            : l.forras === 'njk' ? html`<${Valaszto} label="NJK" value=${l.ref_id} ures="válassz…" onChange=${(x) => allit({ ref_id: x })} opciok=${njkOpciok}/>`
            : html`<${K.TextField} label="Név" value=${l.nev} onChange=${(e) => allit({ nev: e.target.value })}/>`}
          <${K.TextField} label="Darab" type="number" min="1" value=${String(l.db)} onChange=${(e) => allit({ db: Number(e.target.value) || 1 })}/>
        </div>
        <${K.TextField} label="Jegyzet" value=${l.jegyzet} onChange=${(e) => allit({ jegyzet: e.target.value })} placeholder="mit akar, meddig harcol, hol áll"/>`}/>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="kihivasok" norm=${JL.kihivasokNorm} cim="Csapdák, veszélyek, akadályok, rejtvények" gomb="Kihívás"
        ures=${() => ({ fajta: 'csapda', nev: '', leiras: '' })} uresSzoveg="Még nincs nem harci kihívás."
        sorTartalom=${(k, allit) => html`<div className="urlap-racs">
          <${Valaszto} label="Fajta" value=${k.fajta} onChange=${(x) => allit({ fajta: x })} opciok=${Object.entries(JL.KIHIVAS_FAJTAK).map(([value, label]) => ({ value, label }))}/>
          <${K.TextField} label="Név" value=${k.nev} onChange=${(e) => allit({ nev: e.target.value })} placeholder="például mérgezett ingacsapda"/>
        </div>
        <${K.TextField} label="Szabályok, hatás, miért van ott" multiline=${true} rows=${2} value=${k.leiras} onChange=${(e) => allit({ leiras: e.target.value })}
          hint="A Célértéket a csapat legjobb értékéhez mérd (például a legjobb Ügyesség és fókusz)."/>`}/>
      <${ProbakLista} elem=${elem} ix=${ix} valt=${valt} fokuszNev=${fokuszNev} onSzerkeszt=${setProba}/>
      ${proba ? html`<${ProbaParbeszed} proba=${proba} fokuszNev=${fokuszNev} fokLap=${fokLap} njkk=${korny.njkk.filter((n) => n.adat && n.adat.statblokk)}
        onBezar=${() => setProba(null)} onMent=${(p) => {
          const lista = JL.probakNorm(E.mezoErtek(elem, 'probak', ix).ertek);
          set('probak', lista.some((x) => x.id === p.id) ? lista.map((x) => (x.id === p.id ? p : x)) : lista.concat([p]));
          setProba(null);
        }}/>` : null}
    <//>`;
  }

  if (lepes === 'szinter') {
    const e = JL.erzekekNorm(a.erzekek);
    const setE = (x) => set('erzekek', { ...e, ...x });
    return html`<${LepesPanel} lepes="szinter" allapot=${all.szinter}>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="fontos_reszletek" label="Lényeges részletek" multiline=${true} rows=${3} onValt=${valt}
        hint="Amit a játékosoknak tudniuk kell: hány ellenfelet látnak, nyilvánvaló veszélyek, fényforrások, a táj fő elemei (épületek, terep)."/>
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="erzekek" valt=${valt}>Érzékek<//>
        <div className="urlap-racs">
          <${K.TextField} label="Fények" value=${e.fenyek} onChange=${(x) => setE({ fenyek: x.target.value })} placeholder="fáklyafény, sötét sarkok"/>
          <${K.TextField} label="Hőmérséklet" value=${e.homerseklet} onChange=${(x) => setE({ homerseklet: x.target.value })} placeholder="nyirkos hideg"/>
          <${K.TextField} label="Szagok" value=${e.szagok} onChange=${(x) => setE({ szagok: x.target.value })} placeholder="dohos, rothadó növényzet"/>
          <${K.TextField} label="Hangok" value=${e.hangok} onChange=${(x) => setE({ hangok: x.target.value })} placeholder="csöpögő víz, süvítő szél"/>
        </div>
      </div>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="felolvasando" label="Felolvasandó szöveg" multiline=${true} rows=${4} onValt=${valt}
        hint="Két-három mondat a fentiekből elég. A túl sok leírás lassít, a túl kevés miatt a játékosok fontos részleteket hagynak ki."/>
      <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="teruletek" norm=${JL.teruletekNorm} cim="A hely részei (termek, barlangok, tisztások)" gomb="Rész"
        ures=${() => ({ nev: '', leiras: '' })}
        sorTartalom=${(t, allit) => html`<${K.TextField} label="Név" value=${t.nev} onChange=${(x) => allit({ nev: x.target.value })} placeholder="például Őrszoba"/>
          <${K.TextField} label="Leírás" multiline=${true} rows=${2} value=${t.leiras} onChange=${(x) => allit({ leiras: x.target.value })}/>`}/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="valaszok" label="Jegyzet a játékosok kérdéseihez" multiline=${true} rows=${2} onValt=${valt}
        hint="Amit játék közben válaszoltál (mit látnak, hallanak), hogy később is ugyanígy írd le."/>
    <//>`;
  }

  if (lepes === 'terkep') {
    return html`<div className="verem">
      <${LepesPanel} lepes="terkep" allapot=${all.terkep}>
        <${ListaMezo} elem=${elem} ix=${ix} valt=${valt} mezo="terkep_jelolesek" norm=${JL.jelolesekNorm} cim="Jelölések a térképen" gomb="Jelölés"
          ures=${() => ({ jel: String.fromCharCode(65 + JL.jelolesekNorm(E.mezoErtek(elem, 'terkep_jelolesek', ix).ertek).length % 26), szoveg: '' })}
          uresSzoveg="Például „A: őrszoba, két íjász”, „B: titkos ajtó a kandalló mögött”."
          sorTartalom=${(j, allit) => html`<div className="jelenet__jeloles">
            <${K.TextField} label="Jel" value=${j.jel} onChange=${(x) => allit({ jel: x.target.value.slice(0, 4) })}/>
            <${K.TextField} label="Mi van ott?" value=${j.szoveg} onChange=${(x) => allit({ szoveg: x.target.value })} placeholder="ellenfél, csapda, veszély, titkos átjáró"/>
          </div>`}/>
        <${Figyelmeztetesek} adat=${a} lepes="terkep"/>
      <//>
      <${KepekPanel} elem=${elem} ix=${ix} valt=${valt} prep=${prep} terkep=${true}/>
    </div>`;
  }

  if (lepes === 'jutalmak') {
    const osszecsapas = a.osszecsapas_id ? korny.osszecsapasok.find((o) => o.id === a.osszecsapas_id) : null;
    const becsles = osszecsapas ? O.nehezsegBecsles(O.normalizal(osszecsapas.adat), korny.becsles) : null;
    const javasolt = becsles ? JL.becslesbolNehezseg(becsles.becsles) : '';
    return html`<${LepesPanel} lepes="jutalmak" allapot=${all.jutalmak}>
      <div className="sorban sorban--kozep">
        <${Valaszto} label=${html`Nehézség (XP) <${OroklesJel} info=${E.mezoErtek(elem, 'nehezseg', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'nehezseg'))}/>`}
          value=${a.nehezseg || ''} ures="nincs megadva" onChange=${(x) => set('nehezseg', x)}
          hint="Alapkönyv 117–118. oldal. Tervezett érték: a kiosztáskor a valódi menet dönt."
          opciok=${Object.entries(JL.NEHEZSEGEK).map(([value, n]) => ({ value, label: n.nev + ' (' + n.xp + ' XP)' }))}/>
        ${javasolt && javasolt !== a.nehezseg ? html`<${K.Button} size="sm" variant="secondary" onClick=${() => set('nehezseg', javasolt)}>
          Az összecsapás becslése: ${JL.NEHEZSEGEK[javasolt].nev}<//>` : null}
      </div>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="xp_jegyzet" label="Megjegyzés az XP-hez" onValt=${valt}
        placeholder="például ha alkuval kerülik el, akkor is közepes"/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="kincs" label="Kincs, pénz" multiline=${true} rows=${2} onValt=${valt}/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="targyak" label="Tárgyak (kinek szól?)" multiline=${true} rows=${2} onValt=${valt}
        hint="A karakterekre szabva, néven nevezve, így nem vesznek össze rajta."/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="egyeb_jutalom" label="Egyéb (információ, szövetséges, hírnév)" multiline=${true} rows=${2} onValt=${valt}/>
      <p className="halvany kicsi">A jutalomelemek (cím, tagság, társ, mágikus tárgy) a 6. fejezettel (5.6 alépés) kapcsolhatók ide; a kiosztás a 6. lépésben, játék közben.</p>
    <//>`;
  }
  return null;
}

// ================= Előkészített próbák =================

function ProbakLista({ elem, ix, valt, fokuszNev, onSzerkeszt }) {
  const lista = JL.probakNorm(E.mezoErtek(elem, 'probak', ix).ertek);
  const allit = (l) => valt(E.mezoBeallit(elem, 'probak', l, ix));
  return html`<div className="verem">
    <${MezoCimke} elem=${elem} ix=${ix} mezo="probak" valt=${valt}>Előkészített próbák (a 2. lépés próbakérésének mezőivel)<//>
    ${lista.length ? html`<ul className="sorlista">${lista.map((p, i) => {
      const o = JL.probaOsszegzes(p, fokuszNev);
      return html`<li key=${p.id} className="sorlista__sor">
        <div><strong>${o.cim}</strong> <${K.Badge} tone=${p.tipus === 'titkos' ? 'warning' : 'accent'}>${{ alap: 'Alap', ellen: 'Ellenpróba', osszetett: 'Összetett', titkos: 'Titkos' }[p.tipus]}<//>
          <div className="halvany kicsi">${[p.mikor, o.feltetel].filter(Boolean).join(' · ')}</div></div>
        <span className="gombsor gombsor--szoros">
          ${kisGomb('↑', 'Feljebb', () => allit(KL.utemMozgat(lista, i, -1)), i === 0)}
          ${kisGomb('↓', 'Lejjebb', () => allit(KL.utemMozgat(lista, i, 1)), i === lista.length - 1)}
          <${K.Button} size="sm" variant="quiet" onClick=${() => onSzerkeszt({ id: p.id, mikor: p.mikor, u: JL.probaUrlap(p) })}>Szerkesztés<//>
          <${K.Button} size="sm" variant="quiet" onClick=${() => allit(lista.filter((_, j) => j !== i))}>Törlés<//>
        </span>
      </li>`;
    })}</ul>` : html`<p className="halvany kicsi">Még nincs előkészített próba. Játék közben (6. lépés) egy gombbal kiküldhetők a csapatnak.</p>`}
    <div><${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
      onClick=${() => onSzerkeszt({ id: ujAzon('pr'), mikor: '', u: JL.probaUrlap({}) })}>Próba<//></div>
  </div>`;
}

function ProbaParbeszed({ proba, fokuszNev, fokLap, njkk, onBezar, onMent }) {
  const [u, setU] = useState(proba.u);
  const [mikor, setMikor] = useState(proba.mikor);
  return html`<${Parbeszed} cim="Előkészített próba" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!u.tulajdonsag} onClick=${() => onMent(JL.urlapbolProba(u, proba.id, mikor))}>Mentés<//>`}>
    <div className="verem">
      <${K.TextField} label="Mikor kerül elő?" value=${mikor} onChange=${(e) => setMikor(e.target.value)} placeholder="például ha átkutatják az őrszobát"/>
      <${ProbaKeresUrlap} u=${u} setU=${setU} karakterek=${[]} lapok=${{}} fokuszNev=${fokuszNev} fokLap=${fokLap} njkk=${njkk} elokeszites=${true}/>
      ${!u.tulajdonsag ? html`<p className="halvany kicsi">A mentéshez válassz tulajdonságot.</p>` : null}
    </div>
  <//>`;
}

// A jelenet a könyv lépései szerint, lépésenként (az elemszerkesztő lépéses módja).
SAJAT_LEPESEK.jelenet = {
  lepesek: ({ elem, ix }) => {
    const all = JL.lepesAllapot(E.megjelenitett(elem, ix));
    return ['otlet', 'hely', 'tipus', 'konfliktus', 'megoldas', 'kihivasok', 'szinter', 'terkep', 'jutalmak']
      .map((k) => ({ kulcs: k, nev: JL.JELENET_LEPESEK[k].nev.replace(/^\d+\.\s*/, ''), allapot: all[k] }));
  },
  tartalom: (lepes, p) => html`<${JelenetMezok} key=${lepes} lepes=${lepes} ...${p}/>`
};

// ================= A jelenettípusok aránya (Varying Encounters, 33. oldal) =================

const TIPUS_SZIN = { harc: 'var(--danger)', felfedezes: 'var(--success)', szerepjatek: 'var(--magic)', uldozes: 'var(--dragon)', veszely: 'var(--warning)' };

// jelenetek: a kaland vagy a kampány jelenetei a fa sorrendjében. keret: a kampánykeret (a tervezett arányhoz), vagy null.
export function JelenetArany({ jelenetek, ix, keret, egyhangu = true, kicsi = false }) {
  const ar = JL.tipusArany(jelenetek, ix);
  if (kicsi && !ar.tipizalt) return null;
  if (!ar.db) return kicsi ? null : html`<p className="halvany kicsi">Még nincs jelenet.</p>`;
  const ov = keret ? JL.kihivasOsszevetes(ar, keret) : [];
  const fig = egyhangu ? JL.egyhanguSorok(jelenetek, ix) : [];
  const tipusok = JL.TIPUS_KULCSOK.filter((t) => ar.szamok[t]);
  return html`<div className=${'jelenetarany' + (kicsi ? ' jelenetarany--kicsi' : '')}>
    ${ar.tipizalt ? html`<div className="jelenetarany__csik" role="img" aria-label=${'A jelenettípusok aránya: ' + tipusok.map((t) => JL.JELENET_TIPUSOK[t].nev + ' ' + ar.szazalek[t] + '%').join(', ')}>
      ${tipusok.map((t) => html`<span key=${t} style=${{ width: (ar.sulyok[t] / ar.tipizalt) * 100 + '%', background: TIPUS_SZIN[t] }} title=${JL.JELENET_TIPUSOK[t].nev + ': ' + ar.szazalek[t] + '%'}></span>`)}
    </div>` : null}
    ${kicsi ? null : html`<ul className="jelenetarany__jelmagyarazat">
      ${tipusok.map((t) => html`<li key=${t}><span className="jelenetarany__pont" style=${{ background: TIPUS_SZIN[t] }} aria-hidden="true"></span>
        ${JL.JELENET_TIPUSOK[t].nev} ${ar.szazalek[t]}% <span className="halvany">(${ar.szamok[t]})</span></li>`)}
      ${ar.db - ar.tipizalt ? html`<li className="halvany">${ar.db - ar.tipizalt} jelenet típus nélkül</li>` : null}
      ${ar.vegyes ? html`<li className="halvany">${ar.vegyes} vegyes</li>` : null}
    </ul>`}
    ${ov.length && !kicsi ? html`<p className="kicsi">A kampánykeret tervéhez képest (harc, felfedezés, szerepjáték): ${ov.map((x) => x.nev + ' ' + x.teny + '% (terv: ' + x.terv + '%)').join(', ')}.</p>` : null}
    ${fig.map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f.szoveg}<//>`)}
  </div>`;
}
