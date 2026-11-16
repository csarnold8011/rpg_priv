// Mutatványválasztó: dupla és sikeres próba után a pontok elköltése. A szabályok: web/js/jatek/mutatvany.js.
// A Próba lapon (web/js/app/proba.js) a dobás alatt nyílik ki; a választás a dobáshoz mentődik (roll.update).
import { html, K, useState, useMemo, Jelolo, Valaszto, Sugo } from './kozos.js';
import { Kapcsolo } from './varazslo_lepesek.js';
import * as M from '../jatek/mutatvany.js';

const EGYEB = '_egyeb';
const arSzoveg = (ar) => (ar.plusz ? `${ar.min}+` : ar.max !== null && ar.max > ar.min ? `${ar.min}–${ar.max}` : String(ar.min));
const rovid = (s, n = 170) => (s && s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '').replace(/[\s.,;:]+$/, '') + '…' : s || '');

// pont: a dobásból járó Mutatványpont; valasztasok: a karakter mentett döntései; onValasztas(kulcs, ertek): mentés
// (ha nincs, a döntés csak erre a dobásra szól); onKesz({ mutatvanyok, plusz }): a választás rögzítése.
// celpont: a célpont lény-nézete (csatában): az ő ár-módosítói és immunitásai a kártyákon.
export function MutatvanyValaszto({ lapok, lap, pont, kontextus, forrasok, beallitas, valasztasok = {}, onValasztas, onKesz, onMegse, kezdo, celpont = null }) {
  const [kapcsolok, setKapcsolok] = useState({});
  const [helyi, setHelyi] = useState({});
  const [kosar, setKosar] = useState((kezdo && kezdo.mutatvanyok) || []);
  const [kezi, setKezi] = useState(0);
  const val = { ...valasztasok, ...helyi };
  const kinalat = useMemo(() => M.mutatvanyKinalat(lapok, lap, { forrasok, beallitas, kontextus, valasztasok: val, kapcsolok, celpont }),
    [lapok, lap, forrasok, beallitas, kontextus, JSON.stringify(val), JSON.stringify(kapcsolok), celpont]);
  const [tipus, setTipus] = useState(kinalat.elso);
  const pluszok = kinalat.plusz.filter((p) => p.be).map((p) => ({ ertek: p.ertek, eredet: p.eredet }));
  if (kezi) pluszok.push({ ertek: kezi, eredet: 'Társ képessége vagy DM' });
  const teljes = pont + pluszok.reduce((a, p) => a + p.ertek, 0);
  const ell = M.kosarEllenoriz(kosar, teljes, kinalat);
  const kapcsol = (kulcs, be) => setKapcsolok((k) => ({ ...k, [kulcs]: be }));
  const valaszt = (kulcs, ertek) => { setHelyi((h) => ({ ...h, [kulcs]: ertek })); if (onValasztas) onValasztas(kulcs, ertek); };

  const fulek = kinalat.csoportok.filter((c) => !c.egyeb).map((c) => ({ value: c.tipus, label: c.nev }));
  const egyeb = kinalat.csoportok.filter((c) => c.egyeb);
  if (egyeb.length) fulek.push({ value: EGYEB, label: 'Egyéb' });
  const kartyak = tipus === EGYEB ? egyeb.flatMap((c) => c.mutatvanyok) : ((kinalat.csoportok.find((c) => c.tipus === tipus) || {}).mutatvanyok || []);
  const kosarbanDb = (id) => (kosar.find((t) => t.id === id) || {}).mp || 0;

  const lepes = (id, irany) => setKosar((k) => k.map((t) => {
    if (t.id !== id) return t;
    const m = kartyak.find((x) => x.id === id) || kinalat.csoportok.flatMap((c) => c.mutatvanyok).find((x) => x.id === id);
    if (!m) return t;
    if (m.valtozo) return { ...t, mp: Math.max(m.ar.min, t.mp + irany) };
    const db = Math.max(1, (t.db || 1) + irany);
    return { ...t, db, mp: m.ar.min * db };
  }));

  return html`<div className="mutatvany verem">
    <div className="mutatvany__fej">
      <${K.Badge} tone="dragon">${teljes} Mutatványpont<//>
      <span className=${'mutatvany__maradt' + (ell.maradt < 0 ? ' mutatvany__maradt--tul' : '')}>${ell.maradt < 0 ? `${-ell.maradt} ponttal több` : `Maradt: ${ell.maradt}`}</span>
      <${Sugo} cim="Mutatványpont">Azonnal el kell költeni. Egy mutatvány körönként egyszer választható, kivéve az ismételhetőt. A felfedezési és szerepjátékos mutatványok a DM engedélyével bármikor. A mutatvány által kiváltott újabb próba nem ad pontot.<//>
    </div>
    ${html`<div className="mutatvany__pluszok">
      ${kinalat.plusz.map((p) => p.kapcsolhato
        ? html`<${Jelolo} key=${p.kulcs} checked=${p.be} onChange=${(b) => kapcsol(p.kulcs, b)}>+${p.ertek}: ${p.eredet}${p.feltetel ? ` (${p.feltetel})` : ''}<//>`
        : html`<p key=${p.kulcs} className="kicsi">+${p.ertek}: ${p.eredet}</p>`)}
      <div className="mutatvany__kezi">
        <span className="kicsi halvany">Társ képessége (például Lelkesítés), DM:</span>
        <button type="button" className="sorgomb" aria-label="Kevesebb" onClick=${() => setKezi((x) => Math.max(0, x - 1))}>−</button>
        <strong>${kezi ? '+' + kezi : '0'}</strong>
        <button type="button" className="sorgomb" aria-label="Több" onClick=${() => setKezi((x) => Math.min(6, x + 1))}>+</button>
      </div>
    </div>`}
    ${kinalat.valasztandok.map((v) => html`<${Valaszto} key=${v.kulcs} label=${v.eredet + ': ' + v.kerdes} value="" ures="Válassz…"
      onChange=${(x) => x && valaszt(v.kulcs, x)} opciok=${v.lehetosegek.map((l) => ({ value: l.id, label: l.nev }))}/>`)}
    ${kinalat.valasztandok.length && onValasztas ? html`<p className="sugo kicsi">A választás a karakteren megmarad, a karakterlap Szerkesztés módjában módosítható.</p>` : null}
    <div className="mutatvany__fulek"><${Kapcsolo} cimke="Mutatványtípus" ertek=${tipus} onValt=${setTipus} opciok=${fulek}/></div>
    <ul className="mutatvany__lista">
      ${kartyak.map((m) => html`<li key=${m.id} className=${'mutatvany-kartya' + (kosarbanDb(m.id) ? ' mutatvany-kartya--valasztott' : '')}>
        <div className="mutatvany-kartya__fej">
          <span className="mutatvany-kartya__nev">${m.nev_hu}${m.nev_en && m.nev_en !== m.nev_hu ? html` <span className="halvany">(${m.nev_en})</span>` : null}</span>
          <span className="mutatvany-kartya__ar">
            ${m.ar.min !== m.alap_ar.min ? html`<s className="halvany">${arSzoveg(m.alap_ar)}</s> ` : null}<strong>${arSzoveg(m.ar)}</strong> pont
          </span>
        </div>
        ${m.kedvezmenyek.map((x, i) => html`<p key=${'k' + i} className="mutatvany-kartya__kedv kicsi">✓ ${x.leiras}: ${x.eredet}</p>`)}
        ${m.feltetelesek.map((f) => html`<${Jelolo} key=${f.kulcs} checked=${!!kapcsolok[f.kulcs]} onChange=${(b) => kapcsol(f.kulcs, b)}>${f.feltetel}: ${f.leiras} (${f.eredet})<//>`)}
        ${m.megjegyzesek.map((x, i) => html`<p key=${'m' + i} className="kicsi">${x.szoveg} <span className="halvany">(${x.eredet})</span></p>`)}
        ${(m.immunis || []).map((x, i) => html`<p key=${'i' + i} className="mutatvany-kartya__kedv kicsi">⚠ A célpont immunis: ${x}</p>`)}
        <p className="mutatvany-kartya__leiras kicsi">${rovid(m.leiras)}</p>
        <div className="mutatvany-kartya__lab">
          <span className="halvany kicsi">${m.forras}${m.oldal ? `, ${Math.round(m.oldal)}. o.` : ''}${m.ismetelheto ? ' · ismételhető' : ''}${m.osszetevok ? ' · csomag' : ''}${m.feltetel_szoveg ? ' · ' + m.feltetel_szoveg : ''}</span>
          <${K.Button} size="sm" variant=${kosarbanDb(m.id) ? 'quiet' : 'secondary'}
            disabled=${!!kosarbanDb(m.id) && !m.valtozo && !m.ismetelheto}
            onClick=${() => setKosar((k) => M.kosarba(k, m))}>${kosarbanDb(m.id) ? (m.valtozo || m.ismetelheto ? '+ még' : '✓ Kosárban') : '+ Kosárba'}<//>
        </div>
      </li>`)}
    </ul>
    <div className="mutatvany__kosar">
      ${kosar.length ? kosar.map((t) => {
        const m = kinalat.csoportok.flatMap((c) => c.mutatvanyok).find((x) => x.id === t.id);
        const lepheto = m && (m.valtozo || m.ismetelheto);
        return html`<span key=${t.id} className="csip mutatvany__tetel">
          ${t.nev}${!m || m.valtozo ? '' : (t.db > 1 ? ` × ${t.db}` : '')}: ${t.mp}
          ${lepheto ? html`<button type="button" className="sorgomb" aria-label="Kevesebb" onClick=${() => lepes(t.id, -1)}>−</button>
            <button type="button" className="sorgomb" aria-label="Több" onClick=${() => lepes(t.id, 1)}>+</button>` : null}
          <button type="button" className="sorgomb" aria-label=${t.nev + ' törlése'} onClick=${() => setKosar((k) => k.filter((x) => x.id !== t.id))}>×</button>
        </span>`;
      }) : html`<span className="halvany kicsi">Még nincs választott mutatvány.</span>`}
    </div>
    ${ell.hibak.length ? html`<ul className="mutatvany__hibak">${ell.hibak.map((h, i) => html`<li key=${i} className="kicsi">⚠ ${h}</li>`)}</ul>` : null}
    <div className="gombsor">
      <${K.Button} variant="primary" disabled=${ell.hibak.length > 0}
        onClick=${() => onKesz({ mutatvanyok: kosar.map((t) => ({ id: t.id, nev: t.nev, mp: t.mp, db: t.db || 1 })), plusz: pluszok })}>Kész<//>
      ${onMegse ? html`<${K.Button} variant="quiet" onClick=${onMegse}>Mégse<//>` : null}
    </div>
  </div>`;
}
