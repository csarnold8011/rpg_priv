// Bestiárium (DM): a szabályadat szörnyei keresővel, szűrőkkel és statblokk-kártyával.
// A számolt értékek a közös lény-nézetből jönnek (web/js/jatek/leny.js), így a próba és a mutatványválasztó
// ugyanúgy dolgozik velük, mint a karakterekkel. Terv: claude/csata-terv.md (3. lépés, 1. ütem).
import { html, K, useApp, useState, useMemo, Valaszto, Sugo, elojel } from './kozos.js';
import { ProbaLap } from './proba.js';
import * as LN from '../jatek/leny.js';
import { TUL_NEV } from '../jatek/proba.js';
import { megjelenitettNev } from '../szabalyok.js';

const TULAJDONSAGOK = Object.keys(TUL_NEV);
const FORRASOK = ['Alapkönyv', 'Bestiárium'];
const MOZGAS_NEV = { 'repülés': 'repülés', 'úszás': 'úszás', 'mászás': 'mászás', 'ásás': 'ásás' };
const KEPESSEG_TIPUS = { 'passzív': 'passzív', 'fő': 'fő akció', 'mellék': 'kis akció', 'szabad': 'szabad akció', 'aktiválás': 'aktiválás', 'mozgás': 'mozgás' };
const minusz = (s) => String(s || '').replace(/(\d)-(\d)/g, '$1−$2').replace(/^-/, '−');
const elemNev = (lapok, lap, id) => megjelenitettNev(((lapok && lapok[lap]) || []).find((x) => x.id === id)) || id;
const fenyegetesTonus = (f) => ({ 'Csekély': undefined, 'Mérsékelt': 'accent', 'Komoly': 'warning', 'Súlyos': 'danger', 'Legendás': 'dragon' }[f]);

// ut: ['bestiarium', id?]
export function BestiariumOldal({ azon, Oldalfej }) {
  const { szabalyok } = useApp();
  const lapok = szabalyok.adat && szabalyok.adat.lapok;
  const sorok = (lapok && lapok['Szörnyek']) || [];
  const [szoveg, setSzoveg] = useState('');
  const [fen, setFen] = useState([]);
  const [forras, setForras] = useState([]);
  const [csoport, setCsoport] = useState('');
  const csoportok = useMemo(() => [...new Set(sorok.map(LN.szornyCsoport).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'hu')), [sorok]);
  const lista = useMemo(() => LN.szornySzures(sorok, { szoveg, fenyegetes: fen, forras, csoport: csoport ? [csoport] : [] }),
    [sorok, szoveg, fen.join(), forras.join(), csoport]);
  const valasztott = sorok.find((s) => s.id === azon) || null;
  const valt = (lista, set, x) => set(lista.includes(x) ? lista.filter((y) => y !== x) : lista.concat([x]));

  const fej = html`<${Oldalfej} cim="Bestiárium" vissza=${azon ? ['#/dm/bestiarium', 'Bestiárium'] : undefined}/>`;
  if (!lapok) return html`<div>${fej}<p className="halvany">A szabályadat még töltődik.</p></div>`;
  if (!sorok.length) {
    return html`<div>${fej}<${K.Panel} title="Még nincsenek szörnyek">
      <p className="szoveg">A szörnyadat a szabályadatbázis Import 10 adagjával érkezik. Ha már betöltődött, a Szabályok oldalon a „Frissítés keresése” gombbal töltsd le.</p>
    <//></div>`;
  }
  return html`<div>
    ${fej}
    <div className="ket-hasab bestiarium">
      <div className=${'verem' + (valasztott ? ' bestiarium__lista--rejtheto' : '')}>
        <${K.Panel} title="Keresés">
          <div className="verem">
            <${K.TextField} label="Név magyarul vagy angolul" placeholder="például ogre, Wyrm, élőholt" value=${szoveg} onChange=${(e) => setSzoveg(e.target.value)}/>
            <div>
              <div className="cimke">Fenyegetés <${Sugo} cim="Fenyegetés">Nagyjából milyen szintű csapatnak való ellenfél: Csekély 1–4., Mérsékelt 5–8., Komoly 9–12., Súlyos 13–17., Legendás 18–20. szint. Tájékoztató érték, a csapat felszerelése és állapota sokat számít.<//></div>
              <div className="csipek" role="group" aria-label="Fenyegetés">
                ${LN.FENYEGETESEK.map((f) => html`<button key=${f.nev} type="button" className="csip csip--kicsi" aria-pressed=${fen.includes(f.nev)}
                  onClick=${() => valt(fen, setFen, f.nev)}>${f.nev}</button>`)}
              </div>
            </div>
            <div className="sorban">
              <${Valaszto} label="Csoport" value=${csoport} onChange=${setCsoport} ures="mind" opciok=${csoportok.map((c) => ({ value: c, label: c }))}/>
              <div>
                <div className="cimke">Forrás</div>
                <div className="csipek" role="group" aria-label="Forrás">
                  ${FORRASOK.map((f) => html`<button key=${f} type="button" className="csip csip--kicsi" aria-pressed=${forras.includes(f)}
                    onClick=${() => valt(forras, setForras, f)}>${f}</button>`)}
                </div>
              </div>
            </div>
            <p className="halvany kicsi">${lista.length} / ${sorok.length} lény</p>
          </div>
        <//>
        <ul className="sorlista bestiarium__talalatok" aria-label="Szörnyek">
          ${lista.map((s) => {
            const n = LN.lenyNezet({ tipus: 'szorny', sor: s }, lapok);
            const kiv = LN.lenyKivonat(n);
            return html`<li key=${s.id} className=${'sorlista__sor' + (s.id === azon ? ' bestiarium__sor--aktiv' : '')}>
              <a className="sorgomb-teljes" href=${'#/dm/bestiarium/' + s.id} aria-current=${s.id === azon ? 'true' : undefined}>
                <span><strong>${s.nev_hu}</strong>${s.nev_en && s.nev_en !== s.nev_hu ? html` <span className="halvany">(${s.nev_en})</span>` : null}<br/>
                  <span className="halvany kicsi">${[s.fenyegetes, LN.szornyCsoport(s), s.forras].filter(Boolean).join(' · ')}</span></span>
                <span className="halvany kicsi bestiarium__kivonat">Egészség ${kiv.egeszseg} · Védekezés ${kiv.vedekezes} · Páncél ${kiv.pancelertek}</span>
              </a>
            </li>`;
          })}
          ${!lista.length ? html`<li className="sorlista__sor halvany">Nincs találat.</li>` : null}
        </ul>
      </div>
      <div>
        ${valasztott ? html`<${Statblokk} key=${valasztott.id} sor=${valasztott} lapok=${lapok}/>`
          : html`<${K.Panel} title="Statblokk"><p className="halvany">Válassz egy lényt a listából.</p><//>`}
      </div>
    </div>
  </div>`;
}

// Egy szörny statblokkja. Az erősítés előnézete a DM-nek: a kiosztás az NJK-tár szerkesztőjében lesz (2. ütem).
export function Statblokk({ sor, lapok }) {
  const [proba, setProba] = useState(null);
  const n = useMemo(() => LN.lenyNezet({ tipus: 'szorny', sor }, lapok), [sor, lapok]);
  if (!n) return null;
  const r = typeof sor.reszletek === 'string' ? JSON.parse(sor.reszletek || '{}') : (sor.reszletek || {});
  const mozgas = n.sebesseg.mozgas.map((m) => `${MOZGAS_NEV[m.tipus] || m.tipus} ${m.ertek}`).join(', ');
  const tamadasProba = (t) => setProba({
    tipus: 'tamadas', tul: t.tulajdonsag || 'tul_fighting', fokusz: t.fokusz || '', cim: `${n.nev}: ${t.nev_hu}`,
    // A statblokk bónuszát adjuk ki akkor is, ha a forrás eltér a tulajdonság és a fókusz összegétől.
    modositok: (() => {
      const szamolt = (n.tulajdonsagok[t.tulajdonsag || 'tul_fighting'] || { ertek: 0 }).ertek + (t.fokusz && n.fokuszok[t.fokusz] ? n.fokuszok[t.fokusz].bonusz : 0);
      return t.tamadas !== null && t.tamadas !== szamolt ? [{ ertek: t.tamadas - szamolt, eredet: 'Statblokk' }] : [];
    })(),
    fegyver: { id: t.fegyver || t.kulcs, tavolsagi: t.tavolsagi },
    megjegyzes: `Sebzés: ${minusz(t.sebzes) || 'lásd a leírást'}${t.atuto ? ' (átütő)' : ''}${t.hatotav ? ', hatótáv ' + t.hatotav : ''}.${t.megjegyzes ? ' ' + t.megjegyzes : ''} A célpont Védekezése a Célérték.`
  });
  const felszereles = r.felszereles_megjegyzes || (r.felszereles || []).map((f) => (f.id ? elemNev(lapok, f.id.startsWith('fgy_') ? 'Fegyverek' : f.id.startsWith('pan_') ? 'Páncélok' : 'Felszerelés', f.id) : f.nev_en)).join(', ');
  const modositok = n.mutatvany_ar_modositok;

  return html`<${K.Panel} title=${n.nev} actions=${html`<${K.Button} size="sm" onClick=${() => setProba({ tul: 'tul_perception', cim: n.nev + ': próba' })}>Próba érte<//>`}>
    <div className="verem statblokk">
      <div>
        ${n.nev_en && n.nev_en !== n.nev ? html`<p className="halvany kicsi statblokk__en">${n.nev_en}${r.mas_nevek ? ' · ' + r.mas_nevek : ''}</p>` : null}
        <div className="cimkek">
          ${n.fenyegetes ? html`<${K.Badge} tone=${fenyegetesTonus(n.fenyegetes)}>${n.fenyegetes}<//>` : null}
          ${n.csoport ? html`<${K.Badge}>${n.csoport}<//>` : null}
          ${n.leny_tipus === 'NJK' ? html`<${K.Badge}>NJK<//>` : null}
          <${K.Badge} tone="accent">${sor.forras}${sor.oldal ? ', ' + Math.round(sor.oldal) + '. o.' : ''}<//>
        </div>
        ${r.fenyegetes_megjegyzes ? html`<p className="halvany kicsi">${r.fenyegetes_megjegyzes}</p>` : null}
        ${sor.leiras_hu ? html`<p className="szoveg">${sor.leiras_hu}</p>` : null}
      </div>

      <dl className="ka-abilities tul-racs statblokk__tul">${TULAJDONSAGOK.map((t) => {
        const fok = Object.values(n.fokuszok).filter((f) => f.tulajdonsag === t);
        return html`<div key=${t} className="ka-ability">
          <button type="button" className="tul-gomb" onClick=${() => setProba({ tul: t, cim: `${n.nev}: ${TUL_NEV[t]}` })}>
            <dt className="ka-ability__name">${TUL_NEV[t]}</dt>
            <dd className="ka-ability__value">${elojel(n.tulajdonsagok[t].ertek)}</dd>
            ${fok.length ? html`<dd className="ka-ability__focus">${fok.map((f) => f.nev_hu + (f.bonusz === 3 ? ' (+3)' : '')).join(', ')}</dd>` : null}
          </button>
        </div>`;
      })}</dl>

      <dl className="ertekek">
        <div><dt>Sebesség</dt><dd>${n.sebesseg.ertek === null ? '–' : n.sebesseg.ertek}</dd>${mozgas ? html`<dd className="kicsi halvany">${mozgas}</dd>` : null}</div>
        <div><dt>Egészség</dt><dd>${n.egeszseg.ertek}</dd></div>
        <div><dt>Védekezés</dt><dd>${n.vedekezes.ertek}</dd></div>
        <div><dt>Páncélérték</dt><dd>${n.pancelertek.ertek}</dd>${n.pancelertek.atuto_ellen ? html`<dd className="kicsi halvany">átütő ellen is</dd>` : null}</div>
        ${n.magiapont ? html`<div><dt>Mágiapont</dt><dd>${n.magiapont.ertek}</dd></div>` : null}
        ${n.varazsero ? html`<div><dt>Varázserő</dt><dd>${n.varazsero.ertek}</dd></div>` : null}
      </dl>
      ${[n.sebesseg.megjegyzes, n.vedekezes.megjegyzes, n.pancelertek.megjegyzes].filter(Boolean).map((x, i) => html`<p key=${i} className="halvany kicsi statblokk__megj">${x}</p>`)}

      <section>
        <h3 className="cimke">Támadások</h3>
        <ul className="sorlista">
          ${n.tamadasok.map((t) => html`<li key=${t.kulcs} className="sorlista__sor">
            <button type="button" className="sorgomb-teljes" disabled=${t.tamadas === null} onClick=${() => tamadasProba(t)}>
              <span><strong>${t.nev_hu}</strong>${t.atuto ? html` <${K.Badge}>átütő<//>` : null}<br/>
                <span className="halvany kicsi">${[t.tulajdonsag ? TUL_NEV[t.tulajdonsag] + (t.fokusz && n.fokuszok[t.fokusz] ? ` (${n.fokuszok[t.fokusz].nev_hu})` : '') : '', t.hatotav, t.megjegyzes].filter(Boolean).join(' · ')}</span></span>
              <span className="fegyver-ertek"><span>${t.tamadas === null ? '–' : elojel(t.tamadas)}</span><span className="halvany kicsi">${minusz(t.sebzes)}</span></span>
            </button>
          </li>`)}
        </ul>
      </section>

      ${n.kedvelt_mutatvanyok.length ? html`<section>
        <h3 className="cimke">Kedvelt mutatványok</h3>
        <div className="cimkek">${n.kedvelt_mutatvanyok.map((k, i) => html`<span key=${i} className="csip csip--kicsi csip--statikus">${k.nev_hu}${k.mp ? ` (${k.mp} MP)` : ''}</span>`)}</div>
      </section>` : null}

      ${n.sajat_mutatvanyok.length ? html`<section>
        <h3 className="cimke">Saját mutatványok</h3>
        <ul className="sorlista">${n.sajat_mutatvanyok.map((s) => html`<li key=${s.kulcs} className="sorlista__sor sorlista__sor--fuggoleges">
          <div><strong>${s.nev_hu}</strong> <span className="halvany">(${s.nev_en})</span> <${K.Badge} tone="dragon">${s.mp === null || s.mp === undefined ? 'változó' : s.mp + ' MP'}<//></div>
          <p className="szoveg kicsi">${s.leiras}</p>
        </li>`)}</ul>
      </section>` : null}

      ${modositok.length ? html`<section>
        <h3 className="cimke">Mutatványok ára</h3>
        <ul className="kicsi statblokk__felsorolas">${modositok.map((m, i) => html`<li key=${i}>
          ${m.mutatvanyok.includes('*') ? 'Minden mutatvány' : m.mutatvanyok.map((id) => elemNev(lapok, 'Mutatványok', id)).join(', ')}:
          ${m.mod === 'immunis' ? ' nem hat rá' : ` ${elojel(m.mod)} MP`}${m.kinek === 'sajat' ? ' (a lény maga)' : ' (ellene)'}${m.feltetel ? ', ' + m.feltetel : ''}
        </li>`)}</ul>
      </section>` : null}

      ${n.kepessegek.length ? html`<section>
        <h3 className="cimke">Különleges képességek</h3>
        <ul className="sorlista">${n.kepessegek.map((k, i) => html`<li key=${i} className="sorlista__sor sorlista__sor--fuggoleges">
          <div><strong>${k.nev_hu}</strong> <span className="halvany">(${k.nev_en})</span>${k.tipus && k.tipus !== 'passzív' ? html` <${K.Badge}>${KEPESSEG_TIPUS[k.tipus] || k.tipus}<//>` : null}</div>
          <p className="szoveg kicsi">${k.leiras}</p>
        </li>`)}</ul>
      </section>` : null}

      ${n.talentumok.length || n.arkanumok.length || n.varazslatok.length || n.fegyvercsoportok.length || felszereles ? html`<dl className="ertekek ertekek--lista statblokk__egyeb">
        ${n.talentumok.length ? html`<div><dt>Talentumok</dt><dd>${n.talentumok.map((t) => `${t.nev_hu} (${['', 'Kezdő', 'Haladó', 'Mester'][t.fok] || t.fok})`).join(', ')}</dd></div>` : null}
        ${n.arkanumok.length ? html`<div><dt>Arkánumok</dt><dd>${n.arkanumok.map((t) => `${t.nev_hu} (${['', 'Kezdő', 'Haladó', 'Mester'][t.fok] || t.fok})`).join(', ')}</dd></div>` : null}
        ${n.varazslatok.length ? html`<div><dt>Varázslatok</dt><dd>${n.varazslatok.map((v) => v.nev_hu).join(', ')}</dd></div>` : null}
        ${n.fegyvercsoportok.length ? html`<div><dt>Fegyvercsoportok</dt><dd>${n.fegyvercsoportok.map((id) => elemNev(lapok, 'Fegyvercsoportok', id)).join(', ')}</dd></div>` : null}
        ${felszereles ? html`<div><dt>Felszerelés</dt><dd>${felszereles}</dd></div>` : null}
      </dl>` : null}

      ${(r.valtozatok || []).length ? html`<details className="lenyilo">
        <summary>Változatok (${r.valtozatok.length})</summary>
        <ul className="sorlista">${r.valtozatok.map((v, i) => html`<li key=${i} className="sorlista__sor sorlista__sor--fuggoleges">
          <div><strong>${v.nev_hu}</strong> <span className="halvany">(${v.nev_en})</span></div>
          <p className="szoveg kicsi">${v.leiras}</p>
        </li>`)}</ul>
      </details>` : null}
      ${r.megjegyzes ? html`<p className="sugo kicsi">${r.megjegyzes}</p>` : null}
    </div>
    ${proba ? html`<${ProbaLap} lap=${n} kezdet=${proba} karakter=${null} kampany=${null} onBezar=${() => setProba(null)}
      forrasok=${undefined} valasztasok=${{}}/>` : null}
  <//>`;
}
