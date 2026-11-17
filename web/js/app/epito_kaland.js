// Kampányépítő (DM, 5.2 alépés): kalandok a Kampányépítő könyv 2. fejezete (Building the Adventure) szerint.
// A kaland és a rész saját mezői az általános elemszerkesztőben (SAJAT_MEZOK), és a kampány Kalandok nézete:
// a kampány ívei, kalandjai, részei és jelenetei egy fában, létrehozással és sorrendezéssel.
// Tiszta függvények: web/js/kampany/kaland.js. Terv: claude/kampanyepito-terv.md, „2. fejezet”.
import { html, K, useState, useLekeres, useApp, Ikon, Uzenet, Valaszto, Jelolo } from './kozos.js';
import { Csip } from './varazslo_lepesek.js';
import * as E from '../kampany/elem.js';
import * as F from '../kampany/fa.js';
import * as KL from '../kampany/kaland.js';
import * as KR from '../kampany/keret.js';
import { SAJAT_MEZOK, SAJAT_LEPESEK, ElemMezo, OroklesJel, UjElemParbeszed, elemUt, ujAzon, SzintJel } from './epito.js';
import * as JL from '../kampany/jelenet.js';
import { JelenetArany } from './epito_jelenet.js';

const PONT = { kesz: ['kaland__pont kaland__pont--kesz', '✓'], resz: ['kaland__pont kaland__pont--resz', '…'], ures: ['kaland__pont', ''] };

function LepesPanel({ lepes, allapot, children, actions, nev, en }) {
  const l0 = KL.KALAND_LEPESEK[lepes];
  const l = { ...l0, nev: nev || l0.nev, en: en || l0.en, oldal: en ? '25–26' : l0.oldal };
  const p = PONT[allapot || 'ures'];
  return html`<${K.Panel} actions=${actions} title=${html`${allapot ? html`<span className=${p[0]} aria-label=${allapot === 'kesz' ? 'kitöltve' : allapot === 'resz' ? 'részben kitöltve' : 'üres'}>${p[1]}</span> ` : null}${l.nev} <span className="halvany keret__en">(${l.en}, ${l.oldal}. oldal)</span>`}>
    <div className="verem"><p className="sugo">${l.utmutato}</p>${children}</div>
  <//>`;
}

// Egy összetett mező címkéje az öröklés jelével.
function MezoCimke({ elem, ix, mezo, valt, children }) {
  return html`<p className="cimke">${children} <${OroklesJel} info=${E.mezoErtek(elem, mezo, ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, mezo))}/></p>`;
}

const kisGomb = (felirat, cim, onClick, disabled) => html`<button type="button" className="kisgomb" aria-label=${cim} title=${cim}
  disabled=${disabled} onClick=${onClick}>${felirat}</button>`;

// Az elemszerkesztő aktuális (vázlat szerinti) elemlistája.
const elemekMost = (prep, elem) => prep.adat.elemek.map((x) => (x.id === elem.id ? elem : x)).concat(prep.adat.elemek.some((x) => x.id === elem.id) ? [] : [elem]);

// A kampány karakterei (a háttérhorgokhoz) és az NJK-tár.
function useKarakterekNjkk(cel) {
  const { api } = useApp();
  const init = useLekeres(async () => api.hivas('init'), [], 'init');
  const njkk = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk');
  const karakterek = ((init.adat && init.adat.karakterek) || [])
    .filter((c) => c.aktiv !== false && (cel.szint !== 'kampany' || (c.kampanyok || []).includes(cel.kampany_id)));
  return { karakterek, njkk: (njkk.adat || []).filter((n) => n.aktiv !== false) };
}

// ================= Ütemek =================

function UtemSzerkeszto({ elem, ix, valt, prep, kaland }) {
  const info = E.mezoErtek(elem, 'utemek', ix);
  const utemek = KL.utemekNorm(info.ertek);
  const allit = (lista) => valt(E.mezoBeallit(elem, 'utemek', lista, ix));
  const modosit = (i, x) => allit(utemek.map((u, j) => (j === i ? { ...u, ...x } : u)));
  const elemek = elemekMost(prep, elem);
  const jelenetek = kaland ? KL.kalandJelenetei(kaland, elemek, ix) : [];
  const csoportok = KL.utemCsoportok(utemek);
  const fig = KL.utemFigyelmeztetesek(utemek);
  const jelenetEbbol = (i) => {
    const u = utemek[i];
    const id = ujAzon('el');
    const j = E.ujElem('jelenet', { vilag_id: elem.vilag_id, kampany_id: elem.kampany_id, szulo_id: elem.id,
      sorrend: F.kovetkezoSorrend(elemek, elem.id) }, id, (u.szoveg || 'Új jelenet').slice(0, 80));
    prep.elemMent(j).catch(() => {});
    modosit(i, { jelenet_id: id });
  };
  const sor = (u, i) => {
    const jel = KL.jelenetFelold(u.jelenet_id, kaland, elemek, ix);
    const kapcsolo = (mezo, felirat, cim, extra) => html`<button type="button" className="utemjel" aria-pressed=${u[mezo] ? 'true' : 'false'} title=${cim}
      onClick=${() => modosit(i, { [mezo]: !u[mezo], ...(extra || {}) })}>${felirat}</button>`;
    return html`<li key=${u.id} className=${'utem' + (u.szunet ? ' utem--szunet' : '') + (u.nagy_csata ? ' utem--csata' : '')}>
      <span className="utem__szam">${i + 1}.</span>
      <input className="ka-field__input utem__szoveg" value=${u.szoveg} aria-label=${(i + 1) + '. ütem'}
        placeholder=${u.szunet ? 'Pihenő: a csapat összegez, újratervez' : 'Mi történik, ami előre viszi a történetet?'}
        onChange=${(e) => modosit(i, { szoveg: e.target.value })}/>
      <span className="utem__muveletek">
        ${kisGomb('↑', 'Feljebb', () => allit(KL.utemMozgat(utemek, i, -1)), i === 0)}
        ${kisGomb('↓', 'Lejjebb', () => allit(KL.utemMozgat(utemek, i, 1)), i === utemek.length - 1)}
        ${kisGomb('×', 'Törlés', () => allit(utemek.filter((_, j) => j !== i)))}
      </span>
      <span className="utem__jelek">
        ${kapcsolo('kotetlen', 'kötetlen', 'Tetszőleges sorrendben a szomszédos kötetlen ütemekkel')}
        ${kapcsolo('szunet', 'pihenő', 'Pihenő, összegzés', { nagy_csata: false })}
        ${!u.szunet ? kapcsolo('nagy_csata', 'csata', 'Nagy csata (hosszú, ne az alkalom végén kezdődjön)') : null}
        <select className="ka-field__input valaszto utem__jelenet" aria-label=${(i + 1) + '. ütem jelenete'} value=${jel ? jel.id : ''}
          onChange=${(e) => modosit(i, { jelenet_id: e.target.value })}>
          <option value="">nincs jelenet</option>
          ${jelenetek.map((j) => html`<option key=${j.id} value=${j.id}>${E.nev(j, ix)}</option>`)}
        </select>
        ${jel ? html`<a className="kisgomb" href=${elemUt(prep.cel || {}, jel.id)} title="A jelenet megnyitása" aria-label="A jelenet megnyitása">↗</a>`
          : kaland ? kisGomb('+', 'Jelenet ebből az ütemből', () => jelenetEbbol(i)) : null}
      </span>
    </li>`;
  };
  return html`<div className="verem">
    <${MezoCimke} elem=${elem} ix=${ix} mezo="utemek" valt=${valt}>Ütemsor<//>
    ${utemek.length ? html`<div className="utemsor">${csoportok.map((cs, k) => (cs.kotetlen && cs.utemek.length > 1
      ? html`<div key=${'cs' + k} className="utemcsoport"><p className="cimke utemcsoport__cim">Kötetlen sorrendben (együtt vezetnek tovább)</p>
          <ol className="utemlista">${cs.utemek.map((i) => sor(utemek[i], i))}</ol></div>`
      : html`<ol key=${'cs' + k} className="utemlista">${cs.utemek.map((i) => sor(utemek[i], i))}</ol>`))}</div>`
      : html`<p className="halvany">Még nincs ütem.</p>`}
    ${fig.map((f) => html`<${Uzenet} key=${f.tol} tonus="warning">${f.szoveg}<//>`)}
    <div><${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
      onClick=${() => allit(utemek.concat([{ id: ujAzon('ut'), szoveg: '', jelenet_id: '', kotetlen: false, szunet: false, nagy_csata: false }]))}>Új ütem<//></div>
  </div>`;
}

// A kaland teljes ütemsora (a részeké is) és az alkalmakra bontás.
function UtemAttekintes({ elem, ix, valt, prep, cel, teljesLista }) {
  const elemek = elemekMost(prep, elem);
  // a nagy csata jelenet ütemét is nagy csatának veszi (5.3)
  const sor = JL.utemSorJelenettel(KL.utemSor(elem, elemek, ix), elem, elemek, ix);
  const hossz = KL.hosszNorm(E.mezoErtek(elem, 'hossz', ix).ertek);
  const allitHossz = (x) => valt(E.mezoBeallit(elem, 'hossz', { ...hossz, ...x }, ix));
  const beo = KL.alkalomBeosztas(sor, hossz);
  const fig = KL.utemFigyelmeztetesek(sor).filter(() => teljesLista || sor.some((x) => x.gazda.id !== elem.id));
  const reszUtem = sor.some((x) => x.gazda.id !== elem.id);
  const szamMezo = (label, m, hint) => html`<${K.TextField} label=${label} type="number" min="0" value=${hossz[m] || ''} hint=${hint}
    onChange=${(e) => allitHossz({ [m]: e.target.value === '' ? 0 : Number(e.target.value) })}/>`;
  return html`<div className="verem">
    <${MezoCimke} elem=${elem} ix=${ix} mezo="hossz" valt=${valt}>A kaland hossza<//>
    <div className="urlap-racs">
      ${szamMezo('Tervezett alkalmak', 'alkalmak', 'Hány játékalkalomra tervezed?')}
      ${szamMezo('Jelenet egy alkalomra', 'jelenet_alkalom', 'Átlagosan hány jelenet fér bele egy alkalomba?')}
    </div>
    ${(reszUtem || teljesLista) && sor.length ? html`<div>
      <p className="cimke">A teljes ütemsor (a fa sorrendjében)</p>
      <div className="utemattekintes">${(() => {
        const csop = [];
        sor.forEach((x, i) => { const u = csop[csop.length - 1]; if (u && u.gazda.id === x.gazda.id) u.tetelek.push(i); else csop.push({ gazda: x.gazda, tetelek: [i] }); });
        return csop.map((c) => html`<div key=${c.gazda.id + c.tetelek[0]} className="utemattekintes__resz">
          <p className="utemattekintes__cim">${c.gazda.id === elem.id ? 'A kaland saját ütemei' : html`<a href=${elemUt(cel, c.gazda.id)}>${E.nev(c.gazda, ix)}</a>`}</p>
          <ol start=${c.tetelek[0] + 1}>${c.tetelek.map((i) => { const u = sor[i].utem; return html`<li key=${u.id} className=${u.szunet ? 'halvany' : ''}>
            ${u.szoveg || html`<span className="halvany">(üres ütem)</span>`}${u.nagy_csata ? html` <${K.Badge} tone="danger">nagy csata${u.jelenet_csata ? ' (a jelenet)' : ''}<//>` : null}
            ${u.kotetlen ? html` <span className="halvany kicsi">kötetlen</span>` : null}${u.szunet ? html` <span className="halvany kicsi">pihenő</span>` : null}</li>`; })}</ol>
        </div>`);
      })()}</div>
    </div>` : null}
    ${beo.alkalmak.length ? html`<div>
      <p className="cimke">Alkalmakra bontva (${beo.becsult} alkalom${hossz.alkalmak ? ', terv: ' + hossz.alkalmak : ''})</p>
      <ul className="sorlista">${beo.alkalmak.map((a) => html`<li key=${a.szam} className="sorlista__sor sorlista__sor--fuggoleges">
        <span><strong>${a.szam}. alkalom:</strong> ${a.utemek.map((i) => (sor[i].utem.szoveg || '(üres)') + (sor[i].utem.nagy_csata ? ' (nagy csata)' : '')).join(' → ')}</span></li>`)}</ul>
    </div>` : sor.length ? html`<p className="halvany kicsi">Add meg, hány jelenet fér egy alkalomba, és az ütemsor alkalmakra bomlik (egy ütem nagyjából egy jelenet).</p>` : null}
    ${beo.figyelmeztetesek.concat(fig).map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f.szoveg}<//>`)}
  </div>`;
}

// ================= A kaland saját mezői =================

function KalandMezok({ lepes, elem, ix, valt, prep, cel }) {
  const { uzen } = useApp();
  const a = E.megjelenitett(elem, ix);
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const { karakterek, njkk } = useKarakterekNjkk(cel);
  const [otlet, setOtlet] = useState('');
  const [sajatTema, setSajatTema] = useState('');
  const [ujMini, setUjMini] = useState(false);
  const formatum = KL.formatumOf(a);
  const elemek = elemekMost(prep, elem);
  const reszek = F.gyerekek(elemek, elem.id, ix).filter((x) => x.tipus === 'resz');
  const keret = cel.szint === 'kampany' && prep.adat.keret ? KR.normalizal(prep.adat.keret.keret) : null;
  const ivCel = keret && a.iv && keret.ivek[a.iv] ? keret.ivek[a.iv].cel : '';
  const formatumAlkalmaz = () => {
    const uj = KL.formatumReszek(elem, formatum, elemek, () => ujAzon('el'));
    uj.forEach((r) => prep.elemMent(r).catch(() => {}));
    if (uj.length) uzen(uj.length + ' rész készült a formátum szerint. A fában szabadon alakíthatók.');
  };
  const otletek = Array.isArray(a.otletek) ? a.otletek : [];
  const temak = Array.isArray(a.temak) ? a.temak : [];
  const horgok = KL.horgokNorm(a.hatter_horgok);
  const horogAllit = (i, x) => set('hatter_horgok', horgok.map((h, j) => (j === i ? { ...h, ...x } : h)));
  const ell = KL.ellenfelNorm(a.ellenfel);
  const ellAllit = (x) => set('ellenfel', { ...ell, ...x });
  const lista = KL.njkkNorm(a.njkk);
  const njkAllit = (id, x) => set('njkk', lista.map((n) => (n.id === id ? { ...n, ...x } : n)));
  const njkOpciok = njkk.map((n) => ({ value: n.id, label: n.nev }));
  // a kaland saját ütemsora csak szabad formátumnál, rész nélküli kalandnál, vagy ha már van benne ütem
  const sajatUtemek = formatum === 'szabad' || !reszek.length || KL.utemekNorm(a.utemek).length > 0;
  const miniReszek = reszek.filter((r) => (E.megjelenitett(r, ix).szerep || (formatum === 'plotpont' ? 'mini' : 'felvonas')) === 'mini');

  return html`<div className="verem kaland">
    ${lepes === 'hasznalat' ? html`<${LepesPanel} lepes="hasznalat">
      <div className="urlap-racs">
        <${Valaszto} label=${html`Használat <${OroklesJel} info=${E.mezoErtek(elem, 'jelleg', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'jelleg'))}/>`}
          value=${a.jelleg || ''} ures="nincs megadva" onChange=${(x) => set('jelleg', x)}
          opciok=${Object.entries(KL.JELLEGEK).map(([value, label]) => ({ value, label }))}/>
        <${Valaszto} label=${html`A kampány íve <${OroklesJel} info=${E.mezoErtek(elem, 'iv', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'iv'))}/>`}
          value=${a.iv || ''} ures="ívhez nem kötött" onChange=${(x) => set('iv', x)}
          hint=${ivCel ? 'Az ív célja a keretben: ' + ivCel : 'A kampánykeret ívei szintsávonként (1. fejezet).'}
          opciok=${KR.IVEK.map((iv) => ({ value: iv.kulcs, label: iv.nev + ' (' + iv.tol + '–' + iv.ig + '. szint)' }))}/>
      </div>
      ${a.jelleg === 'kiadott' ? html`<${ElemMezo} elem=${elem} ix=${ix} mezo="kiadott_forras" label="A kiadott kaland" hint="Cím, kiadó, oldal; a saját átdolgozásod a részekben és a jelenetekben." onValt=${valt}/>` : null}
      <${Valaszto} label=${html`Formátum <${OroklesJel} info=${E.mezoErtek(elem, 'formatum', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'formatum'))}/>`}
        value=${formatum} ures="nincs kiválasztva" onChange=${(x) => set('formatum', x)}
        hint=${formatum ? KL.FORMATUMOK[formatum].leiras + ' (' + KL.FORMATUMOK[formatum].oldal + '. oldal)' : 'Kezdő mesélőnek a három felvonás a legegyszerűbb.'}
        opciok=${Object.entries(KL.FORMATUMOK).map(([value, f]) => ({ value, label: f.nev + ' (' + f.en + ')' }))}/>
      ${formatum && KL.FORMATUMOK[formatum].reszek.length && !reszek.length ? html`<div className="sorban sorban--kozep">
        <p className="halvany kicsi">A formátum kiinduló részei: ${KL.FORMATUMOK[formatum].reszek.map((r) => r.nev).join(', ')}.</p>
        <${K.Button} size="sm" variant="secondary" onClick=${formatumAlkalmaz}>Részek létrehozása<//></div>` : null}
      ${reszek.length ? html`<p className="halvany kicsi">A kaland részei a „Helye a szerkezetben” panelen és a Kalandok nézetben látszanak; a formátum már nem hoz létre újat.</p>` : null}
    <//>` : null}

    ${lepes === 'otlet' ? html`<${LepesPanel} lepes="otlet">
      <${MezoCimke} elem=${elem} ix=${ix} mezo="otletek" valt=${valt}>Ötletszavak<//>
      ${otletek.length ? html`<div className="csipek">${otletek.map((o, i) => html`<span key=${i} className="csip csip--statikus">${o}
        <button type="button" className="csip__gomb" aria-label=${'Törlés: ' + o} onClick=${() => set('otletek', otletek.filter((_, j) => j !== i))}>×</button></span>`)}</div>` : null}
      <form className="sorban" onSubmit=${(e) => { e.preventDefault(); const t = otlet.trim(); if (t) { set('otletek', otletek.concat([t])); setOtlet(''); } }}>
        <${K.TextField} label="Új ötletszó" value=${otlet} onChange=${(e) => setOtlet(e.target.value)} placeholder="cselekmény, gonosztevő, ősi kincs, átok…"/>
        <${K.Button} type="submit" variant="secondary" disabled=${!otlet.trim()}>Hozzáadás<//>
      </form>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="otlet_jegyzet" label="Jegyzet" multiline=${true} rows=${3} onValt=${valt}
        hint="Melyik ötlet izgat a legjobban? Mit szeretsz mesélőként (történet, NJK-k játszása, rejtvények, csapdák)?"/>
    <//>` : null}

    ${lepes === 'jatekosok' ? html`<${LepesPanel} lepes="jatekosok">
      <${ElemMezo} elem=${elem} ix=${ix} mezo="jatekosok" label="Mit mondtak a játékosok?" multiline=${true} rows=${3} onValt=${valt}
        hint="Mit élveznek, milyen karaktert játszanának, milyen elvarratlan szál, saját terv (erőd, bosszú) maradt. Amit javasolsz nekik (például Kézügyesség fókuszok a sok zár miatt)."/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="befolyas" label="A játékosok befolyása a történetre" multiline=${true} rows=${3} onValt=${valt}
        hint="Mennyi szabadságot adsz? Mi történik, ha váratlant tesznek (egy szerencsés lövés megöli a gonosztevőt, eladják a kulcstárgyat)? Ki lép a helyére?"/>
    <//>` : null}

    ${lepes === 'tortenet' ? html`<${LepesPanel} lepes="tortenet">
      <${ElemMezo} elem=${elem} ix=${ix} mezo="hangulat" label="Hangulat" onValt=${valt} placeholder="például fenyegető, nyomasztó, kalandos"
        hint="Néhány visszatérő szó a leírásokban elég, hogy tartsd a hangulatot."/>
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="temak" valt=${valt}>Téma<//>
        <div className="csipek">${Array.from(new Set(KL.TEMA_PELDAK.concat(temak))).map((t) => html`<${Csip} key=${t} be=${temak.includes(t)}
          onClick=${() => set('temak', temak.includes(t) ? temak.filter((x) => x !== t) : temak.concat([t]))}>${t}<//>`)}</div>
        <form className="sorban" onSubmit=${(e) => { e.preventDefault(); const t = sajatTema.trim(); if (t && !temak.includes(t)) set('temak', temak.concat([t])); setSajatTema(''); }}>
          <${K.TextField} label="Saját téma" value=${sajatTema} onChange=${(e) => setSajatTema(e.target.value)}/>
          <${K.Button} type="submit" variant="secondary" disabled=${!sajatTema.trim()}>Hozzáadás<//>
        </form>
        ${temak.length > 2 ? html`<p className="halvany kicsi">A könyv szerint a túl sok téma elmossa a mondanivalót.</p>` : null}
      </div>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="konfliktus" label="A központi konfliktus" multiline=${true} rows=${3} onValt=${valt}
        hint="A hősök legfontosabb kihívása; ha megoldják, a kaland teljesül."/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="horog" label="A kalandhorog" multiline=${true} rows=${2} onValt=${valt}
        hint="Az esemény, amely mindenkit bevon: egy megbízás egy lebujban, egy levél egy elfeledett rokontól…"/>
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="hatter_horgok" valt=${valt}>Háttérhorgok karakterenként<//>
        ${horgok.length ? html`<ul className="sorlista">${horgok.map((h, i) => {
          const c = karakterek.find((x) => x.id === h.karakter_id);
          return html`<li key=${h.id} className="sorlista__sor sorlista__sor--fuggoleges">
            <div className="urlap-racs">
              ${cel.szint === 'kampany' ? html`<${Valaszto} label="Karakter" value=${h.karakter_id} ures="nincs kiválasztva"
                onChange=${(x) => horogAllit(i, { karakter_id: x })} opciok=${karakterek.map((k) => ({ value: k.id, label: k.nev }))}/>` : null}
              ${!h.karakter_id ? html`<${K.TextField} label="Kinek" value=${h.kinek} onChange=${(e) => horogAllit(i, { kinek: e.target.value })}
                placeholder="például a nemes hátterű karakternek"/>` : null}
            </div>
            <div className="sorban">
              <${K.TextField} label="A horog" value=${h.szoveg} onChange=${(e) => horogAllit(i, { szoveg: e.target.value })}
                hint=${c ? html`A háttere a karakterlapon: <a href=${'#/dm/karakter/' + c.id}>${c.nev}</a>` : ''}/>
              <${K.Button} size="sm" variant="quiet" onClick=${() => set('hatter_horgok', horgok.filter((_, j) => j !== i))}>Törlés<//>
            </div>
          </li>`;
        })}</ul>` : null}
        <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
          onClick=${() => set('hatter_horgok', horgok.concat([{ id: ujAzon('hh'), karakter_id: '', kinek: '', szoveg: '' }]))}>Háttérhorog<//>
      </div>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="cel" label="A kaland célja" multiline=${true} rows=${2} onValt=${valt}
        hint="A csapatnak mindig világosan kell tudnia. Több részcél is kellhet hozzá."/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="megoldas" label="Megoldás" multiline=${true} rows=${2} onValt=${valt}
        hint="Hogyan oldódhat meg a konfliktus, mi a jutalom és a következmény?"/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="csavarok" label="Csavarok" multiline=${true} rows=${2} onValt=${valt}
        hint="Ha a cél menet közben változik, legyen belső logikája, és előbb-utóbb derüljön ki az oka."/>
    <//>` : null}

    ${lepes === 'utemek' ? html`<${LepesPanel} lepes="utemek">
      ${sajatUtemek ? html`<${UtemSzerkeszto} elem=${elem} ix=${ix} valt=${valt} prep=${{ ...prep, cel }} kaland=${elem}/>`
        : html`<p className="halvany kicsi">Az ütemek a részeknél vannak (a rész lapján szerkesztheted őket); itt együtt látszanak, alkalmakra bontva.</p>`}
      <${UtemAttekintes} elem=${elem} ix=${ix} valt=${valt} prep=${prep} cel=${cel} teljesLista=${!sajatUtemek}/>
      <div>
        <p className="cimke">A jelenetek típusai (Varying Encounters, 33. oldal)</p>
        <${JelenetArany} jelenetek=${KL.kalandJelenetei(elem, elemek, ix)} ix=${ix} keret=${keret}/>
      </div>
    <//>` : null}

    ${lepes === 'ellenfel' ? html`<${LepesPanel} lepes="ellenfel">
      <${MezoCimke} elem=${elem} ix=${ix} mezo="ellenfel" valt=${valt}>Az ellenfél<//>
      <div className="urlap-racs">
        <${K.TextField} label="Név" value=${ell.nev} onChange=${(e) => ellAllit({ nev: e.target.value })}/>
        <${Valaszto} label="Az NJK-tárban" value=${ell.njk_id} ures="nincs kapcsolva" onChange=${(x) => ellAllit({ njk_id: x })} opciok=${njkOpciok}/>
      </div>
      <${K.TextField} label="Mit akar?" multiline=${true} rows=${2} value=${ell.cel} onChange=${(e) => ellAllit({ cel: e.target.value })}/>
      <${K.TextField} label="Személyisége" multiline=${true} rows=${2} value=${ell.szemelyiseg} onChange=${(e) => ellAllit({ szemelyiseg: e.target.value })}/>
      <div>
        <p className="cimke">A terve lépésenként</p>
        ${ell.terv.length ? html`<ol className="utemlista">${ell.terv.map((t, i) => html`<li key=${t.id} className="utem">
          <span className="utem__szam">${i + 1}.</span>
          <input className="ka-field__input utem__szoveg" value=${t.szoveg} aria-label=${'A terv ' + (i + 1) + '. lépése'}
            onChange=${(e) => ellAllit({ terv: ell.terv.map((x, j) => (j === i ? { ...x, szoveg: e.target.value } : x)) })}/>
          <span className="utem__muveletek">
            ${kisGomb('↑', 'Feljebb', () => ellAllit({ terv: KL.utemMozgat(ell.terv, i, -1) }), i === 0)}
            ${kisGomb('↓', 'Lejjebb', () => ellAllit({ terv: KL.utemMozgat(ell.terv, i, 1) }), i === ell.terv.length - 1)}
            ${kisGomb('×', 'Törlés', () => ellAllit({ terv: ell.terv.filter((_, j) => j !== i) }))}
          </span></li>`)}</ol>` : null}
        <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
          onClick=${() => ellAllit({ terv: ell.terv.concat([{ id: ujAzon('tl'), szoveg: '' }]) })}>Új lépés<//>
      </div>
      <${K.TextField} label="Mit tesz, ha kudarcot vall, vagy keresztülhúzzák a terveit?" multiline=${true} rows=${2} value=${ell.kudarc}
        onChange=${(e) => ellAllit({ kudarc: e.target.value })}/>
      <${K.TextField} label="Meddig hajlandó elmenni?" multiline=${true} rows=${2} value=${ell.meddig} onChange=${(e) => ellAllit({ meddig: e.target.value })}/>
    <//>` : null}

    ${lepes === 'njkk' ? html`<${LepesPanel} lepes="njkk">
      <${MezoCimke} elem=${elem} ix=${ix} mezo="njkk" valt=${valt}>A kaland szereplői<//>
      ${Object.entries(KL.NJK_SZEREPEK).map(([sz, d]) => {
        const sajat = lista.filter((n) => n.szerep === sz);
        return html`<div key=${sz} className="kaland__njkcsoport">
          <p className="cimke">${d.nev} <span className="halvany keret__en">(${d.en})</span></p>
          ${sajat.length ? html`<ul className="sorlista">${sajat.map((n) => html`<li key=${n.id} className="sorlista__sor sorlista__sor--fuggoleges">
            <div className="urlap-racs">
              <${K.TextField} label="Név" value=${n.nev} onChange=${(e) => njkAllit(n.id, { nev: e.target.value })}
                placeholder=${n.njk_id ? (njkk.find((x) => x.id === n.njk_id) || {}).nev || '' : ''}/>
              <${Valaszto} label="Az NJK-tárban" value=${n.njk_id} ures="még nincs benne" onChange=${(x) => njkAllit(n.id, { njk_id: x })} opciok=${njkOpciok}/>
            </div>
            <div className="sorban">
              <${K.TextField} label="Jegyzet" value=${n.jegyzet} onChange=${(e) => njkAllit(n.id, { jegyzet: e.target.value })}
                placeholder="háttér, személyiség, külső, mit akar"/>
              ${n.njk_id ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => { window.location.hash = '#/dm/njk/' + n.njk_id; }}>NJK lapja<//>` : null}
              <${K.Button} size="sm" variant="quiet" onClick=${() => set('njkk', lista.filter((x) => x.id !== n.id))}>Törlés<//>
            </div>
          </li>`)}</ul>` : null}
          <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
            onClick=${() => set('njkk', lista.concat([{ id: ujAzon('nj'), szerep: sz, nev: '', njk_id: '', jegyzet: '' }]))}>${d.egyes}<//>
        </div>`;
      })}
      <p className="halvany kicsi">A szereplő statblokkja az NJK-tárban készül (az 5.5 alépés bővíti a könyv 5. fejezete szerint); itt elég a név és a szerep.</p>
    <//>` : null}

    ${lepes === 'jutalmak' ? html`<${LepesPanel} lepes="jutalmak">
      <${ElemMezo} elem=${elem} ix=${ix} mezo="jutalmak" label="Jutalmak" multiline=${true} rows=${3} onValt=${valt}
        hint="Pénz, hírnév, tárgyak, szövetségesek, tapasztalat. A jutalomelemek (cím, tagság, társ, mágikus tárgy) az 5.6 alépésben kapcsolhatók."/>
    <//>` : null}

    ${lepes === 'plotpont' ? html`<${LepesPanel} lepes="plotpont">
      <${ElemMezo} elem=${elem} ix=${ix} mezo="atfogo_szal" label="Az átfogó szál (Overarching Plots)" multiline=${true} rows=${3} onValt=${valt}
        hint="A nagyobb tétű történet, amelyhez minden mini kaland kapcsolódik: mit tudnak meg, mit szereznek, ami közelebb visz?"/>
      <div>
        <p className="cimke">Mini kalandok (a világ útikönyve)</p>
        ${miniReszek.length ? html`<ul className="sorlista">${miniReszek.map((r) => {
          const ra = E.megjelenitett(r, ix);
          const f = KL.feltetelNorm(ra.feltetel);
          return html`<li key=${r.id} className="sorlista__sor"><div><a className="sorlista__nev" href=${elemUt(cel, r.id)}>${E.nev(r, ix)}</a>
            <div className="halvany kicsi">${[ra.helyszin, f.tipus ? KL.FELTETEL_TIPUSOK[f.tipus] + (f.ertek ? ': ' + f.ertek : '') : '', ra.horog].filter(Boolean).join(' · ') || 'még üres'}</div></div></li>`;
        })}</ul>` : html`<p className="halvany">Még nincs mini kaland.</p>`}
        <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`} onClick=${() => setUjMini(true)}>Mini kaland<//>
      </div>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="lezaras" label="Lezárás (Wrapping it all Up)" multiline=${true} rows=${3} onValt=${valt}
        hint="A végső összecsapás, amelyben a hősök felhasználják, amit útközben megtudtak és szereztek."/>
    <//>` : null}

    ${lepes === 'letere' ? html`<${LepesPanel} lepes="letere">
      <${ElemMezo} elem=${elem} ix=${ix} mezo="letere" label="Kerülőutak és visszavezetés" multiline=${true} rows=${3} onValt=${valt}/>
    <//>` : null}
    ${ujMini ? html`<${UjElemParbeszed} prep=${prep} cel=${cel} szulo=${elem} tipusok=${['resz']} maradj=${true} cim="Új mini kaland"
      elokeszit=${(e, o) => (o.alapbol ? e : { ...e, adat: { ...e.adat, szerep: 'mini' } })} onBezar=${() => setUjMini(false)}/>` : null}
  </div>`;
}

// ================= A rész saját mezői =================

function ReszMezok({ elem, ix, valt, prep, cel }) {
  const a = E.megjelenitett(elem, ix);
  const kaland = KL.kalandja(elem, ix);
  const kForm = kaland ? KL.formatumOf(E.megjelenitett(kaland, ix)) : '';
  const szerep = a.szerep || (kForm === 'plotpont' ? 'mini' : 'felvonas');
  const set = (m, x) => valt(E.mezoBeallit(elem, m, x, ix));
  const ut = KL.reszUtmutato(elem, kaland, ix);
  const f = KL.feltetelNorm(a.feltetel);
  const merre = KL.merreTovabbNorm(a.merre_tovabb);
  const elemek = elemekMost(prep, elem);
  const testverek = elem.szulo_id ? F.gyerekek(elemek, elem.szulo_id, ix).filter((x) => x.tipus === 'resz' && x.id !== elem.id && x.aktiv !== false) : [];
  const merreAllit = (i, x) => set('merre_tovabb', merre.map((m, j) => (j === i ? { ...m, ...x } : m)));
  return html`<div className="verem kaland">
    <${K.Panel} title="A rész a kalandban">
      <div className="verem">
        <${Valaszto} label=${html`Szerep <${OroklesJel} info=${E.mezoErtek(elem, 'szerep', ix)} elem=${elem} onVissza=${() => valt(E.visszaallit(elem, 'szerep'))}/>`}
          value=${szerep} onChange=${(x) => set('szerep', x)} opciok=${Object.entries(KL.RESZ_SZEREPEK).map(([value, label]) => ({ value, label }))}/>
        ${ut ? html`<${Uzenet} tonus="neutral"><strong>${ut.nev}</strong> <span className="halvany">(${ut.en})</span>: ${ut.utmutato}<//>` : null}
        ${kaland ? html`<p className="halvany kicsi">Kaland: <a href=${elemUt(cel, kaland.id)}>${E.nev(kaland, ix)}</a>${kForm ? ' (' + KL.FORMATUMOK[kForm].nev.toLowerCase() + ')' : ''}</p>` : null}
      </div>
    <//>
    ${szerep === 'mini' ? html`<${LepesPanel} lepes="plotpont">
      <${ElemMezo} elem=${elem} ix=${ix} mezo="helyszin" label="Helyszín" onValt=${valt}
        hint="A világ útikönyvének helye, lehetőleg egy karakter hátteréhez kötve. A helyszínelemek az 5.4 alépéstől kapcsolhatók (kapcsolat: helyszíne)."/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="horog" label="Horog" multiline=${true} rows=${2} onValt=${valt}/>
      <${ElemMezo} elem=${elem} ix=${ix} mezo="kapcsolodas" label="Kapcsolódás az átfogó szálhoz" multiline=${true} rows=${2} onValt=${valt}
        hint="Mit tudnak meg, milyen tárgyat vagy szövetségest szereznek, ami közelebb visz?"/>
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="feltetel" valt=${valt}>Feltétel<//>
        <div className="urlap-racs">
          <${Valaszto} label="Mikor indul?" value=${f.tipus} onChange=${(x) => set('feltetel', { ...f, tipus: x })}
            opciok=${Object.entries(KL.FELTETEL_TIPUSOK).map(([value, label]) => ({ value, label }))}/>
          ${f.tipus ? html`<${K.TextField} label="Részletek" value=${f.ertek} onChange=${(e) => set('feltetel', { ...f, ertek: e.target.value })}
            placeholder=${f.tipus === 'szint' ? 'például 4. szint' : f.tipus === 'specializacio' ? 'például párbajhős specializáció' : 'például a herceg halála után'}/>` : null}
        </div>
      </div>
      <div>
        <${MezoCimke} elem=${elem} ix=${ix} mezo="merre_tovabb" valt=${valt}>Merre tovább? (két-három választás)<//>
        ${merre.length ? html`<ul className="sorlista">${merre.map((m, i) => html`<li key=${m.id} className="sorlista__sor">
          <div className="urlap-racs">
            <${Valaszto} label="Mini kaland" value=${m.resz_id} ures="más (szövegben)" onChange=${(x) => merreAllit(i, { resz_id: x })}
              opciok=${testverek.map((t) => ({ value: t.id, label: E.nev(t, ix) }))}/>
            <${K.TextField} label="Hogyan tudják meg?" value=${m.szoveg} onChange=${(e) => merreAllit(i, { szoveg: e.target.value })}/>
          </div>
          <${K.Button} size="sm" variant="quiet" onClick=${() => set('merre_tovabb', merre.filter((_, j) => j !== i))}>Törlés<//>
        </li>`)}</ul>` : null}
        ${merre.length > 3 ? html`<p className="halvany kicsi">A könyv két-három választást javasol.</p>` : null}
        <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
          onClick=${() => set('merre_tovabb', merre.concat([{ id: ujAzon('mt'), resz_id: '', szoveg: '' }]))}>Irány<//>
      </div>
    <//>` : null}
    <${LepesPanel} lepes="utemek" nev="Ütemsor" en="Story Beats">
      <${UtemSzerkeszto} elem=${elem} ix=${ix} valt=${valt} prep=${{ ...prep, cel }} kaland=${kaland}/>
    <//>
  </div>`;
}

// A kaland a könyv lépései szerint, lépésenként (az elemszerkesztő lépéses módja).
SAJAT_LEPESEK.kaland = {
  lepesek: ({ elem, ix }) => {
    const a = E.megjelenitett(elem, ix);
    const all = KL.lepesAllapot(a);
    return ['hasznalat', 'plotpont', 'otlet', 'jatekosok', 'tortenet', 'utemek', 'ellenfel', 'njkk', 'jutalmak', 'letere']
      .filter((k) => k !== 'plotpont' || KL.formatumOf(a) === 'plotpont')
      .map((k) => ({ kulcs: k, nev: KL.KALAND_LEPESEK[k].nev.replace(/^\d+\.\s*/, ''), allapot: all[k] }));
  },
  tartalom: (lepes, p) => html`<${KalandMezok} key=${lepes} lepes=${lepes} ...${p}/>`
};
SAJAT_MEZOK.resz = (p) => html`<${ReszMezok} ...${p}/>`;

// ================= A Kalandok nézet: ívek, kalandok, részek, jelenetek =================

const TIPUS_JEL = { resz: 'rész', jelenet: 'jelenet' };

export function KalandokNezet({ prep, cel }) {
  const [uj, setUj] = useState(null); // { tipus: 'kaland', iv } | { tipus: 'resz'|'jelenet', szulo }
  const [ujForm, setUjForm] = useState('harom');
  const [archivalt, setArchivalt] = useState(false);
  const { uzen } = useApp();
  const ix = prep.ix;
  const elemek = prep.adat.elemek;
  const keret = KR.normalizal(prep.adat.keret ? prep.adat.keret.keret : {});
  const lathato = (e) => archivalt || e.aktiv !== false;
  const kalandok = elemek.filter((e) => e.tipus === 'kaland' && e.kampany_id === cel.kampany_id && lathato(e));
  const csoportok = KL.ivSzerint(kalandok, ix);
  const kampanyJelenetek = JL.kampanyJelenetei(csoportok.flatMap((c) => c.kalandok).filter((k) => k.aktiv !== false), elemek, ix);
  const archivDb = elemek.filter((e) => e.kampany_id === cel.kampany_id && ['kaland', 'resz', 'jelenet'].includes(e.tipus) && e.aktiv === false).length;
  const vilagKalandok = prep.adat.vilag_id ? elemek.filter((e) => e.tipus === 'kaland' && e.vilag_id === prep.adat.vilag_id && e.aktiv !== false) : [];
  const sablonKalandok = elemek.filter((e) => e.tipus === 'kaland' && E.szint(e) === 'sablon' && e.aktiv !== false);
  const mozgat = (testverek, id, irany) => KL.sorrendCsere(testverek, id, irany).forEach((x) => prep.elemMent(x).catch(() => {}));

  const csomopont = (e, testverek, melyseg) => {
    const gy = F.gyerekek(elemek, e.id, ix).filter((x) => ['resz', 'jelenet'].includes(x.tipus) && lathato(x));
    const a = E.megjelenitett(e, ix);
    const i = testverek.findIndex((x) => x.id === e.id);
    const kaland = e.tipus === 'kaland';
    const osz = kaland ? KL.kalandOsszegzes(e, elemek, ix) : null;
    const utemDb = !kaland && e.tipus === 'resz' ? KL.utemekNorm(a.utemek).length : 0;
    const szerep = e.tipus === 'resz' ? (a.szerep ? KL.RESZ_SZEREPEK[a.szerep] : '') : '';
    return html`<li key=${e.id}>
      <div className=${'kalandfa__sor kalandfa__sor--' + e.tipus + (e.aktiv === false ? ' kalandfa__sor--archivalt' : '')}>
        <span className="kalandfa__jel" aria-hidden="true">${kaland ? '◆' : e.tipus === 'resz' ? '▸' : '•'}</span>
        <a className="kalandfa__nev" href=${elemUt(cel, e.id)}>${E.nev(e, ix)}</a>
        ${!kaland ? html`<span className="halvany kicsi">${szerep || (e.tipus === 'jelenet' && JL.tipusFelirat(JL.tipusokOf(a))) || TIPUS_JEL[e.tipus]}</span>` : null}
        ${kaland && KL.formatumOf(a) ? html`<${K.Badge}>${KL.FORMATUMOK[KL.formatumOf(a)].nev}<//>` : null}
        ${e.alap_id ? html`<span className="halvany kicsi" title="Alapra épül">↳ ${E.nev(ix.get(e.alap_id), ix)}</span>` : null}
        ${E.szint(e) !== 'kampany' ? html`<${SzintJel} elem=${e}/>` : null}
        ${(a.allapot || 'vazlat') === 'kesz' ? html`<span className="elemfa__kesz" title="kész">✓</span>` : null}
        ${kaland && osz.jelenetek ? html`<${JelenetArany} jelenetek=${KL.kalandJelenetei(e, elemek, ix)} ix=${ix} kicsi=${true} egyhangu=${false}/>` : null}
        ${kaland ? html`<span className="halvany kicsi">${osz.reszek} rész · ${osz.jelenetek} jelenet · ${osz.utemek} ütem</span>`
          : utemDb ? html`<span className="halvany kicsi">${utemDb} ütem</span>` : null}
        <span className="kalandfa__muveletek">
          ${kaland ? html`<select className="ka-field__input valaszto kalandfa__iv-valaszto" aria-label=${'Ív: ' + E.nev(e, ix)} value=${a.iv || ''}
            onChange=${(ev) => prep.elemMent(E.mezoBeallit(e, 'iv', ev.target.value, ix)).catch(() => {})}>
            <option value="">ív nélkül</option>${KR.IVEK.map((iv) => html`<option key=${iv.kulcs} value=${iv.kulcs}>${iv.nev}</option>`)}</select>` : null}
          ${e.tipus !== 'jelenet' ? html`<button type="button" className="szoveggomb" onClick=${() => setUj({ tipus: 'resz', szulo: e })}>+ rész</button>
            <button type="button" className="szoveggomb" onClick=${() => setUj({ tipus: 'jelenet', szulo: e })}>+ jelenet</button>` : null}
          ${kisGomb('↑', 'Feljebb', () => mozgat(testverek, e.id, -1), i <= 0)}
          ${kisGomb('↓', 'Lejjebb', () => mozgat(testverek, e.id, 1), i < 0 || i >= testverek.length - 1)}
        </span>
      </div>
      ${gy.length && melyseg < 30 ? html`<ul className="kalandfa__gyerekek">${gy.map((g) => csomopont(g, gy, melyseg + 1))}</ul>` : null}
    </li>`;
  };

  const ujKaland = (iv) => { setUjForm('harom'); setUj({ tipus: 'kaland', iv: iv || '' }); };
  const kalandKesz = (e) => {
    setUj(null);
    if (!e || e.alap_id || !ujForm) return;
    const reszek = KL.formatumReszek(e, ujForm, [e], () => ujAzon('el'));
    reszek.forEach((r) => prep.elemMent(r).catch(() => {}));
    if (reszek.length) uzen('A kaland és ' + reszek.length + ' kiinduló rész elkészült.');
  };
  const szuloKaland = uj && uj.szulo ? (uj.szulo.tipus === 'kaland' ? uj.szulo : KL.kalandja(uj.szulo, ix)) : null;
  const szuloPlot = szuloKaland && KL.formatumOf(E.megjelenitett(szuloKaland, ix)) === 'plotpont' && uj.szulo.tipus === 'kaland';

  return html`<div className="verem">
    <div className="sorban sorban--kozep kalandfa__fej">
      <p className="szoveg">A kampány ívei a kampánykeret szerint, alattuk a kalandok, a részek és a jelenetek. A névre kattintva nyílik a
        szerkesztő; a sorrend a nyilakkal, a kaland íve a sor választójával változtatható.</p>
      <${K.Button} variant="primary" onClick=${() => ujKaland('')} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új kaland<//>
    </div>
    ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
    ${kampanyJelenetek.length ? html`<${K.Panel} title="A kampány jelenetei típus szerint">
      <${JelenetArany} jelenetek=${kampanyJelenetek} ix=${ix} keret=${keret} egyhangu=${false}/>
      <p className="halvany kicsi">A könyv (Varying Encounters, 33. oldal) a típusok váltogatását javasolja; a kaland szerkesztőjének „Ütemek és hossz” lépése a kaland saját sorrendjét is ellenőrzi.</p>
    <//>` : null}
    ${csoportok.map((cs) => {
      const aktiv = cs.iv ? KR.ivAktiv(cs.iv, keret) : true;
      if (!cs.iv && !cs.kalandok.length) return null;
      const ivCel = cs.iv ? keret.ivek[cs.iv.kulcs].cel : '';
      return html`<section key=${cs.iv ? cs.iv.kulcs : 'nincs'} className=${'kalandfa__iv' + (aktiv ? '' : ' kalandfa__iv--kivul')}>
        <div className="kalandfa__ivfej">
          <h3 className="kalandfa__ivcim">${cs.iv ? html`${cs.iv.nev} ív <span className="halvany keret__en">(${cs.iv.en}, ${cs.iv.tol}–${cs.iv.ig}. szint)</span>` : 'Ívhez nem kötött kalandok'}</h3>
          ${cs.iv && !aktiv ? html`<span className="halvany kicsi">a tervezett szintsávon kívül</span>` : null}
          ${cs.iv ? html`<button type="button" className="szoveggomb" onClick=${() => ujKaland(cs.iv.kulcs)}>+ kaland ebbe az ívbe</button>` : null}
        </div>
        ${ivCel ? html`<p className="halvany kicsi kalandfa__ivcel">Cél: ${ivCel}</p>` : null}
        ${cs.kalandok.length ? html`<ul className="kalandfa">${cs.kalandok.map((k) => csomopont(k, cs.kalandok, 0))}</ul>`
          : html`<p className="halvany kicsi">Még nincs kaland ebben az ívben.</p>`}
      </section>`;
    })}
    ${vilagKalandok.length || sablonKalandok.length ? html`<${K.Panel} title="Kalandok a világból és a Sablontárból">
      <p className="halvany kicsi">Ezekre épülhet a kampány kalandja (az „Új kaland” párbeszéd Kiindulás mezőjében), a részeivel és jeleneteivel együtt;
        a kampányváltozat csak az eltéréseket tárolja.</p>
      <ul className="sorlista">${vilagKalandok.concat(sablonKalandok).map((k) => html`<li key=${k.id} className="sorlista__sor">
        <div><a className="sorlista__nev" href=${elemUt(cel, k.id)}>${E.nev(k, ix)}</a> <${SzintJel} elem=${k}/>
          ${E.peldanyai(k, elemek).some((p) => p.kampany_id === cel.kampany_id) ? html` <span className="halvany kicsi">van kampányváltozata</span>` : null}</div>
      </li>`)}</ul>
    <//>` : null}
    ${uj && uj.tipus === 'kaland' ? html`<${UjElemParbeszed} prep=${prep} cel=${cel} tipusok=${['kaland']} maradj=${true} cim="Új kaland"
      elokeszit=${(e, o) => {
        let x = e;
        if (uj.iv) x = E.mezoBeallit(x, 'iv', uj.iv, E.index(elemek.concat([x])));
        if (!o.alapbol && ujForm) x = { ...x, adat: { ...x.adat, formatum: ujForm } };
        return x;
      }}
      extra=${html`<${Valaszto} label="Formátum" value=${ujForm} ures="később döntöm el" onChange=${setUjForm}
          hint="Üres kaland esetén a formátum kiinduló részei is elkészülnek. Sablonra vagy világkalandra építve az alapé öröklődik."
          opciok=${Object.entries(KL.FORMATUMOK).map(([value, f]) => ({ value, label: f.nev + ' (' + f.en + ')' }))}/>
        ${uj.iv ? html`<p className="halvany kicsi">Ív: ${(KR.IVEK.find((x) => x.kulcs === uj.iv) || {}).nev}</p>` : null}`}
      onBezar=${kalandKesz}/>` : null}
    ${uj && uj.tipus !== 'kaland' ? html`<${UjElemParbeszed} prep=${prep} cel=${cel} szulo=${uj.szulo} tipusok=${[uj.tipus]} maradj=${true}
      cim=${(uj.tipus === 'resz' ? (szuloPlot ? 'Új mini kaland: ' : 'Új rész: ') : 'Új jelenet: ') + E.nev(uj.szulo, ix)}
      elokeszit=${(e, o) => (szuloPlot && !o.alapbol ? { ...e, adat: { ...e.adat, szerep: 'mini' } } : e)}
      onBezar=${() => setUj(null)}/>` : null}
  </div>`;
}

// A kampánykeret ív-részén: az ív kalandjai.
export function IvKalandjai({ prep, ivKulcs, kampanyId }) {
  const ix = prep.ix;
  const kalandok = KL.ivSzerint(prep.adat.elemek.filter((e) => e.tipus === 'kaland' && e.kampany_id === kampanyId && e.aktiv !== false), ix)
    .find((c) => c.iv && c.iv.kulcs === ivKulcs);
  const lista = kalandok ? kalandok.kalandok : [];
  const cel = { szint: 'kampany', kampany_id: kampanyId };
  return html`<div className="keret__ivkalandok">
    <p className="cimke">Az ív kalandjai</p>
    ${lista.length ? html`<ul className="sorlista">${lista.map((k) => html`<li key=${k.id} className="sorlista__sor">
      <div><a className="sorlista__nev" href=${elemUt(cel, k.id)}>${E.nev(k, ix)}</a>
        ${E.megjelenitett(k, ix).osszefoglalo ? html`<div className="halvany kicsi">${E.megjelenitett(k, ix).osszefoglalo}</div>` : null}</div></li>`)}</ul>`
      : html`<p className="halvany kicsi">Még nincs kaland ebben az ívben.</p>`}
    <a className="kicsi" href=${'#/dm/kampany/' + kampanyId + '/epito/kalandok'}>Kalandok nézet</a>
  </div>`;
}
