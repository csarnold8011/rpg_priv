// Kampányépítő 5.5: a Szereplők fül (a kampány és a világ NJK-i szerep szerint, és hogy hol szerepelnek), a világ
// oldalának szereplő panelje és a Sablontár NJK-sablonjai. Az NJK-k az NJK-tárban élnek (#/dm/njk), ott a lépéses
// szerkesztő (njk.js, njk_lepesek.js). Tiszta függvények: web/js/kampany/szereplo.js. Terv: claude/kampanyepito-terv.md.
import { html, K, useApp, useState, useMemo, useLekeres, useMuvelet, navigal, Ikon, Betoltes, Uzenet, Jelolo } from './kozos.js';
import { VILAG_PANELEK, SABLON_PANELEK } from './epito.js';
import { UjNjkParbeszed } from './njk.js';
import { KarakterKep } from './kepek.js';
import * as SZ from '../kampany/szereplo.js';
import * as E from '../kampany/elem.js';
import * as KR from '../kampany/keret.js';

const useNjkLista = () => {
  const { api } = useApp();
  return useLekeres(async () => (await api.hivas('npc.list', { archivaltak: true })).njkk, [], 'njkk');
};

const SZINT_TONUS = { sablon: 'neutral', vilag: 'accent', szabad: 'success' };

function NjkSor({ n, hivatkozas, extra, osszes }) {
  const sz = SZ.njkSzint(n);
  const alap = n.alap_id ? osszes.find((x) => x.id === n.alap_id) : null;
  return html`<li className="sorlista__sor">
    <div className="szereplok__sor">
      <${KarakterKep} kep=${n.kep} nev=${n.nev}/>
      <div>
        <a href=${'#/dm/njk/' + n.id}><strong>${n.nev}</strong></a>
        ${sz !== 'szabad' ? html` <${K.Badge} tone=${SZINT_TONUS[sz]}>${SZ.SZINTEK[sz]}<//>` : null}
        <div className="halvany kicsi">${[n.fenyegetes, n.koncepcio, alap ? '↳ ' + alap.nev : '',
          hivatkozas && hivatkozas.length ? hivatkozas.map((h) => h.hol + ': ' + h.szoveg).slice(0, 3).join('; ') + (hivatkozas.length > 3 ? ' …' : '') : ''].filter(Boolean).join(' · ')}</div>
      </div>
    </div>
    ${extra || null}
  </li>`;
}

// ================= A kampány Szereplők füle =================

export function SzereplokNezet({ prep, cel, dm }) {
  const { api, uzen } = useApp();
  const lista = useNjkLista();
  const [uj, setUj] = useState(null);
  const [vilagEs, setVilagEs] = useState(true);
  const [fut, indit] = useMuvelet();
  const osszes = lista.adat || [];
  const kampanyId = cel.kampany_id;
  const vilagId = prep.adat.vilag_id || '';
  const elemek = useMemo(() => prep.adat.elemek.filter((e) => e.aktiv !== false).map((e) => ({ elem: e, adat: E.megjelenitett(e, prep.ix) })), [prep.adat, prep.ix]);
  const keret = prep.adat.keret ? KR.normalizal(prep.adat.keret.keret) : null;
  const hiv = (id) => SZ.hivatkozasok(id, elemek, keret, prep.adat.kapcsolatok || []);
  if (!lista.adat) return lista.hiba ? html`<${Uzenet}>${lista.hiba.message}<//>` : html`<${Betoltes}/>`;
  const aktiv = osszes.filter((n) => n.aktiv !== false);
  const kampanyban = aktiv.filter((n) => (n.kampanyok || []).includes(kampanyId));
  const vilagbol = aktiv.filter((n) => vilagId && n.vilag_id === vilagId && !(n.kampanyok || []).includes(kampanyId));
  const hivatkozott = aktiv.filter((n) => !(n.kampanyok || []).includes(kampanyId) && !vilagbol.includes(n) && hiv(n.id).length);
  const csoportok = SZ.szerepSzerint(kampanyban);
  const hozzarendel = (n) => indit(async () => {
    await api.hivas('npc.save', { id: n.id, kampanyok: (n.kampanyok || []).concat([kampanyId]) });
    await lista.ujra();
  }, n.nev + ' a kampány NJK-ja lett.');
  const valtozat = (n) => indit(async () => {
    const a = (await api.hivas('npc.get', { id: n.id })).njk;
    const v = await api.hivas('npc.save', SZ.peldany(a, { kampanyok: [kampanyId] }));
    await lista.ujra();
    navigal('/dm/njk/' + v.njk.id);
    uzen('Kampányváltozat készült: csak az eltéréseket kell átírni.');
  });
  const kampanyGombok = (n) => html`<div className="gombsor gombsor--szoros">
    <${K.Button} size="sm" disabled=${fut} onClick=${() => hozzarendel(n)}>A kampányba<//>
    <${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => valtozat(n)}>Kampányváltozat<//>
  </div>`;
  return html`<div className="ket-hasab">
    <div className="verem">
      <${K.Panel} title="A kampány szereplői" actions=${html`<${K.Button} size="sm" variant="primary" onClick=${() => setUj({ szerep: '' })}
        icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új szereplő<//>`}>
        <div className="verem">
          <p className="sugo">A könyv 5. fejezete szerint (Building Characters): a szereplők viszik előre a történetet, és adnak okot a hősöknek, hogy törődjenek a világgal. Szerep szerint csoportosítva; egy szereplő több csoportban is lehet.</p>
          ${Object.entries(SZ.SZEREPEK).map(([k, r]) => html`<div key=${k} className="szereplok__csoport">
            <div className="sorban sorban--kozep"><p className="cimke">${r.nev} <span className="halvany">(${csoportok[k].length})</span></p>
              <button type="button" className="szoveggomb" onClick=${() => setUj({ szerep: k })}>+ ${r.nev.toLowerCase()}</button></div>
            ${csoportok[k].length ? html`<ul className="sorlista">${csoportok[k].map((n) => html`<${NjkSor} key=${n.id} n=${n} hivatkozas=${hiv(n.id)} osszes=${osszes}/>`)}</ul>` : null}
          </div>`)}
          ${csoportok._nincs.length ? html`<div className="szereplok__csoport">
            <p className="cimke">Még szerep nélkül <span className="halvany">(${csoportok._nincs.length})</span></p>
            <ul className="sorlista">${csoportok._nincs.map((n) => html`<${NjkSor} key=${n.id} n=${n} hivatkozas=${hiv(n.id)} osszes=${osszes}/>`)}</ul>
          </div>` : null}
          ${!kampanyban.length ? html`<p className="halvany">Még nincs NJK ebben a kampányban.</p>` : null}
        </div>
      <//>
    </div>
    <div className="verem">
      ${hivatkozott.length ? html`<${K.Panel} title="Hivatkozott, de nem a kampány NJK-ja">
        <p className="halvany kicsi">A kampány elemei hivatkoznak rájuk, de a kampány NJK paneljén (és a csatákban) csak a hozzárendeltek jelennek meg.</p>
        <ul className="sorlista">${hivatkozott.map((n) => html`<${NjkSor} key=${n.id} n=${n} hivatkozas=${hiv(n.id)} osszes=${osszes} extra=${kampanyGombok(n)}/>`)}</ul>
      <//>` : null}
      ${vilagId ? html`<${K.Panel} title="A világ szereplői">
        <div className="verem">
          <${Jelolo} checked=${vilagEs} onChange=${setVilagEs}>Mutasd a kampányba még nem került világ-NJK-kat (${vilagbol.length})<//>
          ${vilagEs ? (vilagbol.length ? html`<ul className="sorlista">${vilagbol.map((n) => html`<${NjkSor} key=${n.id} n=${n} hivatkozas=${hiv(n.id)} osszes=${osszes} extra=${kampanyGombok(n)}/>`)}</ul>`
            : html`<p className="halvany kicsi">Minden világ-NJK a kampányban van, vagy még nincs világ-NJK.</p>`) : null}
          <p className="halvany kicsi">A világ-NJK közvetlenül is a kampányba rendelhető, vagy készíthető belőle kampányváltozat, amely csak az eltéréseit tárolja (például idősebb, sebesült, más a célja).</p>
        </div>
      <//>` : html`<${K.Panel} title="A világ szereplői"><p className="halvany kicsi">A kampánykeretben még nincs világ kiválasztva.</p><//>`}
      <${K.Panel} title="A szerepek a könyvben">
        <dl className="szerep-lista">${Object.values(SZ.SZEREPEK).map((r) => html`<div key=${r.en}><dt><strong>${r.nev}</strong> <span className="halvany kicsi">(${r.en}, ${r.oldal}. oldal)</span></dt><dd className="kicsi">${r.rovid}</dd></div>`)}</dl>
      <//>
    </div>
    ${uj ? html`<${UjNjkParbeszed} dm=${dm} kampanyId=${kampanyId} szerep=${uj.szerep} vilagId=${vilagId} onBezar=${() => setUj(null)}
      onLetrejott=${(n) => { setUj(null); lista.ujra(); navigal('/dm/njk/' + n.id); }}/>` : null}
  </div>`;
}

// ================= A világ oldala: szereplők =================

function VilagSzereplok({ cel, dm }) {
  const lista = useNjkLista();
  const [uj, setUj] = useState(false);
  const osszes = lista.adat || [];
  const sajat = osszes.filter((n) => n.aktiv !== false && n.vilag_id === cel.vilag_id).sort((a, b) => String(a.nev).localeCompare(String(b.nev), 'hu'));
  return html`<${K.Panel} title="A világ szereplői" actions=${dm ? html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUj(true)}
      icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új világ-NJK<//>` : null}>
    ${!lista.adat ? html`<${Betoltes}/>` : sajat.length ? html`<ul className="sorlista">${sajat.map((n) => html`<${NjkSor} key=${n.id} n=${n} osszes=${osszes}
      extra=${html`<span className="halvany kicsi">${(n.szerepek || []).map((r) => (SZ.SZEREPEK[r] || {}).nev).filter(Boolean).join(', ')}</span>`}/>`)}</ul>`
      : html`<p className="halvany kicsi">Még nincs világ-NJK. A világ-NJK több kampányban is visszatérhet; kampányonként változat is készíthető belőle.</p>`}
    ${uj ? html`<${UjNjkParbeszed} dm=${dm} szint="vilag" vilagId=${cel.vilag_id} onBezar=${() => setUj(false)}
      onLetrejott=${(n) => { setUj(false); lista.ujra(); navigal('/dm/njk/' + n.id); }}/>` : null}
  <//>`;
}
VILAG_PANELEK.push(VilagSzereplok);

// ================= Sablontár: NJK-sablonok =================

function NjkSablonok({ dm }) {
  const lista = useNjkLista();
  const [uj, setUj] = useState(false);
  const osszes = lista.adat || [];
  const sablonok = osszes.filter((n) => n.aktiv !== false && SZ.njkSzint(n) === 'sablon').sort((a, b) => String(a.nev).localeCompare(String(b.nev), 'hu'));
  return html`<div style=${{ marginTop: 'var(--space-5)' }}><${K.Panel} title="NJK-sablonok" actions=${dm ? html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUj(true)}
      icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új NJK-sablon<//>` : null}>
    ${!lista.adat ? html`<${Betoltes}/>` : sablonok.length ? html`<ul className="sorlista">${sablonok.map((n) => html`<${NjkSor} key=${n.id} n=${n} osszes=${osszes}
      extra=${html`<span className="halvany kicsi">${osszes.filter((x) => x.alap_id === n.id).length} épül rá</span>`}/>`)}</ul>`
      : html`<p className="halvany kicsi">Még nincs NJK-sablon (például „Városi őr”, „Kalmár”, „Kultista”). Bármely NJK szerkesztőjéből készíthető, és változat építhető rá.</p>`}
    ${uj ? html`<${UjNjkParbeszed} dm=${dm} szint="sablon" onBezar=${() => setUj(false)}
      onLetrejott=${(n) => { setUj(false); lista.ujra(); navigal('/dm/njk/' + n.id); }}/>` : null}
  <//></div>`;
}
SABLON_PANELEK.push(NjkSablonok);
