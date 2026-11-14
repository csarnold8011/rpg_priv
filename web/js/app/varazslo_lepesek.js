// A karakterkészítő varázsló tíz lépése és az élő karakterlap-előnézet.
// Minden lépés ugyanazokat a tulajdonságokat kapja (lásd varazslo.js): adat, valtoztat, lap, ix (a karakter
// forrásaira szűrt szabályadat indexe), ixMind (a teljes szabályadat), lapok, forrasok, dm, kampany, ugras.
import { html, K, useApp, useState, useEffect, useMemo, useRef, Uzenet, Valaszto, Megerosites, Ikon } from './kozos.js';
import { Kockadobo, DobasMod, useDobasMod, Kockak, RovidTabla } from './kockadobo.js';
import { megjelenitettNev } from '../szabalyok.js';
import { reszletek, szam, tartomanyban } from '../karakter/szabalyindex.js';
import { tulajdonsagDobasbol, fokozatNev } from '../karakter/tablak.js';
import { kezdoCsomag } from '../karakter/felszereles.js';
import * as V from '../karakter/varazslo.js';

const TUL_NEV = {
  tul_accuracy: 'Pontosság', tul_communication: 'Kommunikáció', tul_constitution: 'Szívósság', tul_dexterity: 'Ügyesség',
  tul_fighting: 'Harc', tul_intelligence: 'Intelligencia', tul_perception: 'Észlelés', tul_strength: 'Erő', tul_willpower: 'Akaraterő'
};
const elojel = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);
const tulNev = (ix, id) => { const t = ix.elem('Tulajdonságok', id); return t ? t.nev_hu : (TUL_NEV[id] || id); };
// Fókusz „Tulajdonság (Fókusz)” alakban, ahogy a könyv írja.
export function fokuszNev(ix, id) {
  const f = ix.elem('Fókuszok', id);
  if (!f) return id || '';
  return `${tulNev(ix, f.tulajdonsag)} (${f.nev_hu})`;
}
const elemNev = (ix, lap, id) => { const e = ix.elem(lap, id); return e ? e.nev_hu : id; };
const rovid = (s, n = 170) => { const t = String(s || '').trim(); if (t.length <= n) return t; const v = t.slice(0, n); return v.slice(0, v.lastIndexOf(' ') > 80 ? v.lastIndexOf(' ') : n) + '…'; };
const forrasMeta = (e) => [e.forras, e.oldal ? Math.round(szam(e.oldal)) + '. o.' : ''].filter(Boolean).join(', ');

// ---- Közös elemek ----
function Valasztas({ elem, nev, en, meta, leiras, valasztott, onClick, figy, ok, fix, children }) {
  const n = nev || (elem && elem.nev_hu) || '';
  const e = en !== undefined ? en : elem && elem.nev_en && elem.nev_en !== n ? elem.nev_en : '';
  const m = meta !== undefined ? meta : elem ? forrasMeta(elem) : '';
  const belso = html`<span className="valasztas__fej"><span className="valasztas__nev">${n}${e ? html` <span className="valasztas__en">(${e})</span>` : null}</span>
      ${m ? html`<span className="valasztas__meta">${m}</span>` : null}</span>
    ${leiras ? html`<span className="valasztas__leiras">${leiras}</span>` : null}
    ${ok ? html`<span className="valasztas__ok">${ok}</span>` : null}
    ${figy ? html`<span className="valasztas__figy">⚠ ${figy}</span>` : null}
    ${children}`;
  if (fix) return html`<div className="valasztas valasztas--fix">${belso}</div>`;
  return html`<button type="button" className="valasztas" aria-pressed=${!!valasztott} onClick=${onClick}>${belso}</button>`;
}

function Csip({ be, onClick, children }) {
  return html`<button type="button" className="csip" aria-pressed=${!!be} onClick=${onClick}>${be ? '✓ ' : ''}${children}</button>`;
}

function Kapcsolo({ ertek, opciok, onValt, teljes, cimke }) {
  return html`<div className=${'kapcsolo' + (teljes ? ' kapcsolo--teljes' : '')} role="group" aria-label=${cimke}>
    ${opciok.map((o) => html`<button key=${o.value} type="button" aria-pressed=${ertek === o.value} onClick=${() => onValt(o.value)}>${o.label}</button>`)}
  </div>`;
}

function Szakasz({ cim, children, sugo }) {
  return html`<fieldset className="szakasz"><legend className="cimke">${cim}</legend>${sugo ? html`<p className="sugo">${sugo}</p>` : null}${children}</fieldset>`;
}

// Az adott lépés figyelmeztetései (sárga), a lépés alján.
function LepesFigyelmeztetesek({ lap, lepes }) {
  const lista = lap.figyelmeztetesek.filter((f) => f.szint === 'figyelmeztetes' && !f.elfogadott && V.figyelmeztetesLepese(f) === lepes);
  if (!lista.length) return null;
  return html`<div className="verem">${lista.map((f) => html`<${Uzenet} key=${f.kulcs} tonus="warning">${f.uzenet}<//>`)}</div>`;
}

function Kereso({ ertek, set, cimke }) {
  return html`<${K.TextField} label=${cimke} type="search" value=${ertek} onChange=${(e) => set(e.target.value)} placeholder="Keresés névre"/>`;
}
const keresIllik = (e, szo) => !szo || [e.nev_hu, e.nev_en].join(' ').toLowerCase().includes(szo.trim().toLowerCase());

// ================= 1. Keret =================
function Keret({ adat, valtoztat, lapok, dm, karakter, kampany, extra, ugras }) {
  const [modszerKerdes, setModszerKerdes] = useState(null);
  const elerheto = V.elerhetoForrasok(lapok);
  const forrasok = adat.keszites.forrasok || [];
  const vanTulajdonsag = Object.values(adat.tulajdonsag_alap).some((x) => x) || (adat.tulajdonsag_keszites.dobasok || []).some((x) => x !== null);
  const modszer = (m) => {
    if (adat.keszites.modszer === m) return;
    if (adat.keszites.modszer && vanTulajdonsag) setModszerKerdes(m);
    else valtoztat((a) => V.modszerBeallit(a, m));
  };
  const MODSZEREK = [
    { m: 'sorban', nev: 'Sorban dobás és egy csere', leiras: 'Kilenc 3d6 dobás a lap sorrendjében, a végén két tulajdonság helyet cserélhet.' },
    { m: 'elrendezes', nev: 'Dobás és elrendezés', leiras: 'Kilenc dobás, az eredményeket te osztod ki a tulajdonságokra.' },
    { m: 'vasarlas', nev: '10 pontos vásárlás', leiras: 'Minden 0-ról indul, 10 fejlesztést költesz el, egy tulajdonságra legfeljebb 3-at.' }
  ];
  return html`<p className="sugo">Néhány alapdöntés. A nevet a végén még megváltoztathatod.</p>
    <${K.TextField} label="A karakter neve" hint="Ideiglenes is lehet." value=${adat.nev} autoCapitalize="words"
      onChange=${(e) => { const v = e.target.value; valtoztat((a) => { a.nev = v; }); }}/>
    ${kampany ? html`<div><p className="cimke">Kampány</p><p className="szoveg">${kampany.cim}</p></div>` : null}
    ${dm && extra && extra.jatekosok ? html`<${Valaszto} label="Játékos" hint="Csak a DM látja ezt a mezőt. Azonnal mentődik."
      value=${karakter.jatekos_id || ''} onChange=${extra.tarsit} ures="nincs (játékos nélküli)"
      opciok=${extra.jatekosok.map((f) => ({ value: f.id, label: f.nev }))}/>` : null}
    <${Szakasz} cim="Források" sugo=${kampany && (kampany.aktiv_forrasok || []).length ? 'A kampány aktív forrásai, szűkítheted őket.' : 'A választólisták ezekből a könyvekből dolgoznak.'}>
      <div className="csipek">${elerheto.map((f) => html`<${Csip} key=${f} be=${forrasok.includes(f)}
        onClick=${() => valtoztat((a) => { const s = new Set(a.keszites.forrasok || []); s.has(f) ? s.delete(f) : s.add(f); a.keszites.forrasok = elerheto.filter((x) => s.has(x)); })}>${f}<//>`)}</div>
      ${!forrasok.length ? html`<${Uzenet} tonus="warning">Ha egy forrás sincs bekapcsolva, minden könyv elemei látszanak.<//>` : null}
    <//>
    <${Szakasz} cim="Tulajdonság-módszer">
      <div className="valasztasok">${MODSZEREK.map((x) => html`<${Valasztas} key=${x.m} nev=${x.nev} meta="" leiras=${x.leiras}
        valasztott=${adat.keszites.modszer === x.m} onClick=${() => modszer(x.m)}/>`)}</div>
    <//>
    <${Valaszto} label="Kezdő szint" hint="Magasabb szintnél a varázsló után a szintlépés jön (hamarosan)."
      value=${String(adat.keszites.cel_szint || 1)} onChange=${(v) => valtoztat((a) => { a.keszites.cel_szint = Number(v) || 1; })}
      opciok=${Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: (i + 1) + '. szint' }))}/>
    ${modszerKerdes ? html`<${Megerosites} cim="Módszer cseréje" gomb="Csere" veszelyes=${true}
      szoveg="A már megadott tulajdonságok és dobások törlődnek (a dobásnapló megmarad). Biztosan másik módszert választasz?"
      onMegse=${() => setModszerKerdes(null)} onIgen=${() => { const m = modszerKerdes; setModszerKerdes(null); valtoztat((a) => V.modszerBeallit(a, m)); }}/>` : null}`;
}

// ================= 2. Koncepció =================
const OTLETEK = ['Vándor, aki hazát keres', 'Tanonc, aki elszökött a mesterétől', 'Utolsó tagja egy régi rendnek', 'Kalandor a pénzért és a hírnévért',
  'Adósságot törlesztő zsoldos', 'Kíváncsi tudós, aki terepre vágyik'];
function Koncepcio({ adat, valtoztat, ugras }) {
  return html`<p className="sugo">Egy-két mondat arról, ki ez a karakter. Nem kötelező, később is megírhatod.</p>
    <${K.TextField} label="Koncepció" multiline=${true} rows=${4} value=${adat.alap.koncepcio || ''}
      onChange=${(e) => { const v = e.target.value; valtoztat((a) => { a.alap.koncepcio = v; }); }}/>
    <${Szakasz} cim="Ötletek" sugo="Koppints egyre, ha kiindulásnak jó.">
      <div className="csipek">${OTLETEK.map((o) => html`<${Csip} key=${o} onClick=${() => valtoztat((a) => { a.alap.koncepcio = a.alap.koncepcio ? a.alap.koncepcio + ' ' + o + '.' : o + '.'; })}>${o}<//>`)}</div>
    <//>
    <div><${K.Button} variant="quiet" onClick=${() => ugras('tulajdonsagok')}>Kihagyom ezt a lépést<//></div>`;
}

// ================= 3. Tulajdonságok =================
function tablaSorok(ixMind) {
  const alt = reszletek(ixMind.elem('Szintlépés', 'szint_altalanos')).tulajdonsag_dobas || { '3': -2, '4-5': -1, '6-8': 0, '9-11': 1, '12-14': 2, '15-17': 3, '18': 4 };
  return Object.keys(alt).sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .map((k) => ({ kulcs: k, felso: k.replace('-', '–'), also: elojel(szam(alt[k])) }));
}
const kiemeltSor = (sorok, ossz) => { const s = sorok.find((x) => tartomanyban(x.kulcs, ossz)); return s ? s.kulcs : null; };

function Tulajdonsagok(p) {
  const m = p.adat.keszites.modszer;
  if (!m) return html`<${Uzenet} tonus="warning">Előbb válassz tulajdonság-módszert a Keret lépésben.<//>
    <div><${K.Button} onClick=${() => p.ugras('keret')}>Ugrás a Keret lépéshez<//></div>`;
  if (m === 'vasarlas') return html`<${Vasarlas} ...${p}/>`;
  if (m === 'elrendezes') return html`<${Elrendezes} ...${p}/>`;
  return html`<${Sorban} ...${p}/>`;
}

function Sorban({ adat, valtoztat, ixMind, lap }) {
  const [mod] = useDobasMod();
  const dobasok = adat.tulajdonsag_keszites.dobasok || [];
  const elso = V.TULAJDONSAGOK.find((t, i) => dobasok[i] === null || dobasok[i] === undefined);
  const [cel, setCel] = useState(null);
  const aktiv = cel || elso || null;
  const mind = V.TULAJDONSAGOK.every((t, i) => dobasok[i] !== null && dobasok[i] !== undefined);
  const csere = adat.tulajdonsag_keszites.csere || [];
  const sorok = tablaSorok(ixMind);
  const utolso = (adat.dobasok || []).slice().reverse().find((d) => d.mire.startsWith('tul:'));
  const dobMind = () => valtoztat((a) => V.TULAJDONSAGOK.forEach((t, i) => {
    if ((a.tulajdonsag_keszites.dobasok || [])[i] === null || (a.tulajdonsag_keszites.dobasok || [])[i] === undefined) V.sorbanDob(a, t, V.dobas(3), false, ixMind);
  }));
  const aktivDobas = aktiv ? V.utolsoDobas(adat, 'tul:' + aktiv) : null;
  return html`<p className="sugo">Sorban dobás: kilenc 3d6, a lap sorrendjében. Ha mind megvan, két tulajdonság helyet cserélhet.</p>
    ${!mind && mod === 'dobj' ? html`<div><${K.Button} variant="secondary" onClick=${dobMind}>Dobj az összes hiányzóra<//></div>` : null}
    <div className="tablazat-keret"><table className="tabla">
      <thead><tr><th>Tulajdonság</th><th>Kockák</th><th className="szam szeles">3d6</th><th className="szam">Érték</th><th><span className="lathatatlan">Művelet</span></th></tr></thead>
      <tbody>${V.TULAJDONSAGOK.map((t, i) => {
        const d = V.utolsoDobas(adat, 'tul:' + t);
        const megvan = dobasok[i] !== null && dobasok[i] !== undefined;
        const alapErtek = megvan ? tulajdonsagDobasbol(szam(dobasok[i]), ixMind) : null;
        const cserelt = csere.includes(t);
        return html`<tr key=${t} className=${cserelt ? 'jelolt' : aktiv === t && !mind ? 'kiemelt' : ''}>
          <td><strong>${tulNev(ixMind, t)}</strong>${d && d.kezi ? html`<span className="kezijel">beírt</span>` : null}</td>
          <td>${d ? html`<${Kockak} kockak=${d.kockak}/>` : html`<span className="halvany">még nincs</span>`}</td>
          <td className="szam szeles">${megvan ? dobasok[i] : ''}</td>
          <td className="szam">${megvan ? html`<span className="ertek">${elojel(alapErtek)}</span>${cserelt && csere.length === 2 ? html` <span style=${{ color: 'var(--accent)' }}>⇄ ${elojel(adat.tulajdonsag_alap[t])}</span>` : null}` : ''}</td>
          <td className="szam">${mind
            ? html`<button type="button" className="sorgomb" aria-pressed=${cserelt} aria-label=${tulNev(ixMind, t) + ' cseréje'} onClick=${() => valtoztat((a) => V.csereValt(a, t, ixMind))}>⇄<span className="szeles"> Csere</span></button>`
            : megvan ? html`<button type="button" className="sorgomb" onClick=${() => setCel(t)}>Újra</button>` : null}</td>
        </tr>`;
      })}</tbody>
    </table></div>
    ${aktiv && (!mind || cel) ? html`<div className="verem">
      <p className="cimke">${tulNev(ixMind, aktiv)}: 3d6</p>
      <${Kockadobo} db=${3} kockak=${cel ? null : aktivDobas && aktivDobas.kockak} kezi=${aktivDobas && aktivDobas.kezi}
        felirat=${'Dobj: ' + tulNev(ixMind, aktiv)}
        onDobas=${(k, kezi) => { valtoztat((a) => V.sorbanDob(a, aktiv, k, kezi, ixMind)); setCel(null); }}/>
      ${cel ? html`<div><${K.Button} variant="quiet" size="sm" onClick=${() => setCel(null)}>Mégse<//></div>` : null}
    </div>` : null}
    <${RovidTabla} cim="3d6 → kezdő érték" sorok=${sorok} kiemelt=${utolso ? kiemeltSor(sorok, V.osszeg(utolso.kockak)) : null}/>
    ${mind ? html`<p className="sugo">Csere: koppints két sor ⇄ gombjára. ${csere.length === 2 ? `Most: ${tulNev(ixMind, csere[0])} és ${tulNev(ixMind, csere[1])}.` : csere.length === 1 ? 'Válaszd ki a másikat is.' : 'Nem kötelező.'}</p>` : null}
    ${(adat.dobasok || []).some((d) => d.mire.startsWith('tul:') && d.kezi) ? html`<${Uzenet} tonus="neutral">ⓘ A kézzel beírt dobások a karakteren jelölve maradnak, a DM látja őket.<//>` : null}
    <${LepesFigyelmeztetesek} lap=${lap} lepes="tulajdonsagok"/>`;
}

function Elrendezes({ adat, valtoztat, ixMind, lap }) {
  const [mod] = useDobasMod();
  const tk = adat.tulajdonsag_keszites;
  const dobasok = tk.dobasok || [];
  const kiosztas = tk.kiosztas || {};
  const [fogott, setFogott] = useState(null);
  const ures = dobasok.findIndex((d) => d === null || d === undefined);
  const hasznalt = new Set(Object.values(kiosztas));
  const ertekE = (i) => tulajdonsagDobasbol(szam(dobasok[i]), ixMind);
  const dobMind = () => valtoztat((a) => { for (let i = 0; i < 9; i++) if ((a.tulajdonsag_keszites.dobasok || [])[i] === null || (a.tulajdonsag_keszites.dobasok || [])[i] === undefined) V.elrendezesDob(a, i, V.dobas(3), false, ixMind); });
  const utolsoUres = ures >= 0 ? V.utolsoDobas(adat, 'dobas:' + ures) : null;
  const helyre = (t) => {
    if (fogott === null) { if (kiosztas[t] !== undefined) valtoztat((a) => V.elrendezesKioszt(a, t, null, ixMind)); return; }
    valtoztat((a) => V.elrendezesKioszt(a, t, fogott, ixMind));
    setFogott(null);
  };
  return html`<p className="sugo">Dobás és elrendezés: kilenc 3d6. Koppints egy dobott értékre, aztán arra a tulajdonságra, ahová szánod. Egy kiosztott értékre koppintva visszaveheted.</p>
    ${ures >= 0 ? html`<div className="verem">
      <p className="cimke">${ures + 1}. dobás a kilencből</p>
      ${mod === 'dobj' ? html`<div><${K.Button} variant="secondary" onClick=${dobMind}>Dobj mind a ${9 - dobasok.filter((d) => d !== null && d !== undefined).length} hiányzóra<//></div>` : null}
      <${Kockadobo} db=${3} kockak=${null} onDobas=${(k, kezi) => valtoztat((a) => V.elrendezesDob(a, ures, k, kezi, ixMind))} felirat="Dobj 3d6-tal"/>
    </div>` : null}
    <${Szakasz} cim="Dobott értékek">
      <div className="ertekpor">${dobasok.map((d, i) => (d === null || d === undefined ? null : html`<button key=${i} type="button"
        className=${'huzhato' + (hasznalt.has(i) ? ' huzhato--hasznalt' : '')} aria-pressed=${fogott === i}
        aria-label=${`${i + 1}. dobás: ${d}, érték ${elojel(ertekE(i))}${hasznalt.has(i) ? ', kiosztva' : ''}`}
        onClick=${() => setFogott(fogott === i ? null : i)}>${elojel(ertekE(i))}<small>${d}</small></button>`))}
        ${!dobasok.some((d) => d !== null && d !== undefined) ? html`<span className="halvany">Még nincs dobás.</span>` : null}
      </div>
      ${fogott !== null ? html`<p className="sugo">Kijelölve: ${elojel(ertekE(fogott))}. Most koppints egy tulajdonságra.</p>` : null}
    <//>
    <table className="tabla">
      <thead><tr><th>Tulajdonság</th><th className="szam">Érték</th></tr></thead>
      <tbody>${V.TULAJDONSAGOK.map((t) => html`<tr key=${t}>
        <td><strong>${tulNev(ixMind, t)}</strong></td>
        <td className="szam">${kiosztas[t] !== undefined
          ? html`<button type="button" className="huzhato" aria-label=${tulNev(ixMind, t) + ': ' + elojel(ertekE(kiosztas[t])) + ', koppints a visszavételhez vagy cseréhez'} onClick=${() => helyre(t)}>${elojel(ertekE(kiosztas[t]))}</button>`
          : html`<button type="button" className="huzhato huzhato--ures" onClick=${() => helyre(t)}>${fogott !== null ? 'ide' : '—'}</button>`}</td>
      </tr>`)}</tbody>
    </table>
    ${Object.keys(kiosztas).length ? html`<div><${K.Button} variant="quiet" onClick=${() => valtoztat((a) => { a.tulajdonsag_keszites.kiosztas = {}; V.elrendezesSzamol(a, ixMind); })}>Kiosztás törlése<//></div>` : null}
    <${LepesFigyelmeztetesek} lap=${lap} lepes="tulajdonsagok"/>`;
}

function Vasarlas({ adat, valtoztat, ixMind, lap }) {
  const ossz = V.vasarlasOsszeg(adat);
  return html`<p className="sugo">10 pontos vásárlás: minden 0-ról indul, egy tulajdonságra legfeljebb 3.</p>
    <div className="osszegsor"><span className="osszegsor__nev">Elköltve</span><span className="osszegsor__ertek">${ossz} / 10</span></div>
    <table className="tabla"><tbody>${V.TULAJDONSAGOK.map((t) => {
      const v = szam(adat.tulajdonsag_alap[t]);
      return html`<tr key=${t}><td><strong>${tulNev(ixMind, t)}</strong></td><td className="szam"><span className="lepteto">
        <button type="button" aria-label=${tulNev(ixMind, t) + ' csökkentése'} onClick=${() => valtoztat((a) => { a.tulajdonsag_alap[t] = v - 1; })}>−</button>
        <span aria-live="polite">${v}</span>
        <button type="button" aria-label=${tulNev(ixMind, t) + ' növelése'} onClick=${() => valtoztat((a) => { a.tulajdonsag_alap[t] = v + 1; })}>+</button>
      </span></td></tr>`;
    })}</tbody></table>
    <${LepesFigyelmeztetesek} lap=${lap} lepes="tulajdonsagok"/>`;
}

// ================= 4. Faj =================
function elonySzoveg(sor, ix) {
  if (!sor) return '';
  if (sor.tipus === 'tulajdonsag') return `+${sor.mertek || 1} ${tulNev(ix, sor.ertek)}`;
  if (sor.tipus === 'fokusz') return 'Fókusz: ' + fokuszNev(ix, sor.ertek) + (sor.ha_megvan ? ` (ha már megvan: ${sor.ha_megvan.tipus === 'talentum' ? elemNev(ix, 'Talentumok', sor.ha_megvan.ertek) + ' talentum' : fokuszNev(ix, sor.ha_megvan.ertek)})` : '');
  if (sor.tipus === 'fegyvercsoport') return `Fegyvercsoport: ${sor.nev_hu || sor.ertek}`;
  if (sor.tipus === 'valasztas') return sor.leiras || 'Választás';
  return (sor.nev_hu || 'Különleges') + (sor.leiras ? ': ' + sor.leiras : '');
}

function Faj({ adat, valtoztat, ix, ixMind, lap }) {
  const fajok = ix.lista('Fajok');
  const faj = ixMind.elem('Fajok', adat.faj);
  const [lista, setLista] = useState(!faj);
  if (!faj || lista) {
    return html`<p className="sugo">Válassz fajt. A fajtól függ néhány tulajdonság, egy fókusz és az előnydobások.</p>
      <div className="valasztasok valasztasok--ket">${fajok.map((f) => {
        const r = reszletek(f);
        const bon = Object.entries(r.tulajdonsag_bonusz || {}).map(([t, n]) => `+${n} ${tulNev(ixMind, t)}`).join(', ');
        return html`<${Valasztas} key=${f.id} elem=${f} valasztott=${adat.faj === f.id}
          leiras=${rovid(f.leiras_hu, 120) || bon}
          onClick=${() => { valtoztat((a) => V.fajBeallit(a, f.id)); setLista(false); }}/>`;
      })}</div>
      ${faj ? html`<div><${K.Button} variant="quiet" onClick=${() => setLista(false)}>Mégse<//></div>` : null}`;
  }
  const fr = reszletek(faj);
  const bon = Object.entries(fr.tulajdonsag_bonusz || {}).map(([t, n]) => `+${n} ${tulNev(ixMind, t)}`);
  const ell = [...bon, 'Sebesség ' + (fr.sebesseg_alap || 10), fr.sotetlatas ? 'sötétlátás' : '', (fr.nyelvek || []).length ? 'nyelv: ' + fr.nyelvek.join(', ') : ''].filter(Boolean).join('. ');
  const db = szam(fr.elonydobasok, 2);
  const elonyok = adat.faj_dontes.elonyok || [];
  const dobottSorok = new Set(elonyok.map((e) => e && e.dobas !== null ? (fr.elonytabla || []).findIndex((s) => tartomanyban(s.dobas, szam(e.dobas))) : -1));
  return html`<${Valasztas} elem=${faj} valasztott=${true} leiras=${rovid(faj.leiras_hu)} onClick=${() => setLista(true)}>
      <span className="valasztas__ok">Koppints a faj cseréjéhez.</span><//>
    <${Uzenet} tonus="neutral">✓ ${ell}.<//>
    ${(fr.fokusz_valasztas || []).length ? html`<${Szakasz} cim="Faji fókusz (egy)">
      <div className="valasztasok valasztasok--ket">${fr.fokusz_valasztas.map((f) => html`<${Valasztas} key=${f} nev=${fokuszNev(ixMind, f)} meta=""
        valasztott=${adat.faj_dontes.fokusz === f} onClick=${() => valtoztat((a) => { a.faj_dontes.fokusz = f; })}/>`)}</div>
    <//>` : null}
    ${(fr.alap_valasztas || []).length ? html`<${FelverAlap} fr=${fr} adat=${adat} valtoztat=${valtoztat} ixMind=${ixMind} lap=${lap}/>` : null}
    ${fr.vegleges_valasztas ? html`<${Szakasz} cim=${fr.vegleges_valasztas.nev_hu} sugo=${fr.vegleges_valasztas.leiras}>
      <div className="valasztasok valasztasok--ket">${(fr.vegleges_valasztas.valaszthato || []).map((f) => html`<${Valasztas} key=${f} nev=${fokuszNev(ixMind, f)} meta=""
        valasztott=${adat.faj_dontes.vegleges === f} onClick=${() => valtoztat((a) => { a.faj_dontes.vegleges = f; })}/>`)}</div>
    <//>` : null}
    <${Szakasz} cim=${`Előnyök: ${db} dobás 2d6-tal`} sugo="Ha ugyanaz a sor jön ki másodszor, dobj újra. Fegyvercsoport-előnynél, ha az osztályod is adja, a hozzá tartozó fókusz jár helyette (ez az osztály kiválasztása után dől el).">
      ${Array.from({ length: db }, (_, i) => {
        const e = elonyok[i];
        const d = V.utolsoDobas(adat, 'elony:' + i);
        const sor = e && e.dobas !== null && e.dobas !== undefined ? V.elonySor(fr, e.dobas) : null;
        const ism = V.elonyIsmetles(adat, fr, i);
        return html`<div key=${i} className="verem">
          <p className="cimke">${i + 1}. előny</p>
          <${Kockadobo} db=${2} kockak=${d && e && e.dobas !== null ? d.kockak : null} kezi=${d && d.kezi} kicsi=${true}
            eredmeny=${() => (sor ? html`<strong className="kockadobo__eredmeny">${elonySzoveg(sor, ixMind)}</strong>` : null)}
            onDobas=${(k, kezi) => valtoztat((a) => V.elonyDob(a, i, k, kezi))}/>
          ${ism >= 0 ? html`<${Uzenet} tonus="warning">Ugyanaz, mint a ${ism + 1}. előny. Dobj újra.<//>` : null}
          ${sor && sor.tipus === 'valasztas' ? html`<${FelverValasztas} sor=${sor} hely=${i} adat=${adat} valtoztat=${valtoztat} ixMind=${ixMind} lap=${lap}/>` : null}
        </div>`;
      })}
      <div className="tablazat-keret"><table className="tabla">
        <thead><tr><th>2d6</th><th>Előny</th></tr></thead>
        <tbody>${(fr.elonytabla || []).map((s, i) => html`<tr key=${i} className=${dobottSorok.has(i) ? 'kiemelt' : ''}>
          <td>${String(s.dobas).replace('-', '–')}</td><td>${elonySzoveg(s, ixMind)}</td></tr>`)}</tbody>
      </table></div>
    <//>
    ${fr.fajtatabla ? html`<${Fajta} fr=${fr} adat=${adat} valtoztat=${valtoztat} ixMind=${ixMind}/>` : null}
    <${LepesFigyelmeztetesek} lap=${lap} lepes="faj"/>`;
}

// Félvér: a származási lénytől függő választások (tulajdonság, fókusz, fegyvercsoport).
function ValasztasMezo({ jelleg, ertek, onValt, ixMind, lap, sorrend, cimke }) {
  if (jelleg === 'tulajdonsag') {
    const javaslat = sorrend ? V.tulajdonsagSorrend(lap)[sorrend - 1] : null;
    return html`<${Valaszto} label=${cimke || 'Tulajdonság'} hint=${javaslat ? 'A te sorrended szerint most: ' + tulNev(ixMind, javaslat) + '. A származási lényé dönt.' : undefined}
      value=${ertek || ''} onChange=${onValt} ures="Válassz…" opciok=${V.TULAJDONSAGOK.map((t) => ({ value: t, label: tulNev(ixMind, t) }))}/>`;
  }
  if (jelleg === 'fegyvercsoport') {
    return html`<${Valaszto} label=${cimke || 'Fegyvercsoport'} value=${ertek || ''} onChange=${onValt} ures="Válassz…"
      opciok=${ixMind.lista('Fegyvercsoportok').map((c) => ({ value: c.id, label: c.nev_hu }))}/>`;
  }
  return html`<${Valaszto} label=${cimke || 'Fókusz'} value=${ertek || ''} onChange=${onValt} ures="Válassz…"
    opciok=${ixMind.lista('Fókuszok').map((f) => ({ value: f.id, label: fokuszNev(ixMind, f.id) })).sort((a, b) => a.label.localeCompare(b.label, 'hu'))}/>`;
}
function FelverAlap({ fr, adat, valtoztat, ixMind, lap }) {
  return html`<${Szakasz} cim="Származási lény szerinti választások" sugo="A DM-mel egyeztesd, melyik lény a karakter őse.">
    ${fr.alap_valasztas.map((v, i) => {
      const d = (adat.faj_dontes.alap || [])[i] || {};
      return html`<${ValasztasMezo} key=${i} jelleg=${v.jelleg} cimke=${v.leiras} ertek=${d.ertek} ixMind=${ixMind} lap=${lap} sorrend=${v.sorrend}
        onValt=${(x) => valtoztat((a) => { const al = (a.faj_dontes.alap || []).slice(); al[i] = { tipus: v.jelleg, ertek: x, mertek: v.mertek }; a.faj_dontes.alap = al; })}/>`;
    })}
  <//>`;
}
function FelverValasztas({ sor, hely, adat, valtoztat, ixMind, lap }) {
  const e = (adat.faj_dontes.elonyok || [])[hely] || {};
  const s = e.sajat || {};
  const jelleg = sor.jelleg === 'fokusz_vagy_kulonleges' ? (s.tipus === 'kulonleges' ? 'kulonleges' : 'fokusz') : sor.jelleg;
  const beallit = (uj) => valtoztat((a) => { const el = a.faj_dontes.elonyok.slice(); el[hely] = { ...el[hely], sajat: { ...uj } }; a.faj_dontes.elonyok = el; });
  return html`<div className="verem">
    ${sor.jelleg === 'fokusz_vagy_kulonleges' ? html`<${Kapcsolo} cimke="Fókusz vagy különleges képesség" ertek=${jelleg}
      opciok=${[{ value: 'fokusz', label: 'Fókusz' }, { value: 'kulonleges', label: 'Különleges' }]}
      onValt=${(x) => beallit(x === 'kulonleges' ? { tipus: 'kulonleges', nev_hu: '', leiras: '' } : { tipus: 'fokusz', ertek: '' })}/>` : null}
    ${jelleg === 'kulonleges'
      ? html`<${K.TextField} label="A különleges képesség (a DM-mel egyeztetve)" value=${s.nev_hu || ''}
          onChange=${(ev) => beallit({ tipus: 'kulonleges', nev_hu: ev.target.value, leiras: ev.target.value })}/>`
      : html`<${ValasztasMezo} jelleg=${jelleg} ertek=${s.ertek} ixMind=${ixMind} lap=${lap} sorrend=${sor.sorrend}
          onValt=${(x) => beallit({ tipus: jelleg, ertek: x, mertek: sor.mertek, nev_hu: jelleg === 'fegyvercsoport' ? elemNev(ixMind, 'Fegyvercsoportok', x) : undefined })}/>`}
  </div>`;
}

// Vadnép: fajtatábla (2d6), a kidobott fajta előnyei közül kettő választható.
function Fajta({ fr, adat, valtoztat, ixMind }) {
  const fd = adat.faj_dontes.fajta || null;
  const d = V.utolsoDobas(adat, 'fajta');
  const fajta = fd ? fr.fajtatabla.find((x) => tartomanyban(x.dobas, szam(fd.dobas))) : null;
  const kell = szam(fr.fajta_valasztando, 2);
  const valasztott = (fd && fd.valasztott) || [];
  return html`<${Szakasz} cim="Fajta (2d6)" sugo=${`A fajta előnyei közül ${kell} választható.`}>
    <${Kockadobo} db=${2} kockak=${fd && d ? d.kockak : null} kezi=${d && d.kezi} kicsi=${true}
      eredmeny=${() => (fajta ? html`<strong className="kockadobo__eredmeny">${fajta.nev_hu}</strong>` : null)}
      onDobas=${(k, kezi) => valtoztat((a) => { a.faj_dontes.fajta = { dobas: V.osszeg(k), valasztott: [] }; V.naplozDobas(a, 'fajta', k, kezi); })}/>
    ${fajta ? html`<div className="valasztasok">${(fajta.elonyok_gepi || []).map((s, i) => html`<${Valasztas} key=${i}
      nev=${s.tipus === 'kulonleges' ? s.nev_hu : elonySzoveg(s, ixMind)} meta="" leiras=${s.tipus === 'kulonleges' ? s.leiras : ''}
      valasztott=${valasztott.includes(i)}
      onClick=${() => valtoztat((a) => { const v = (a.faj_dontes.fajta.valasztott || []).slice(); const j = v.indexOf(i); j >= 0 ? v.splice(j, 1) : v.push(i); a.faj_dontes.fajta.valasztott = v; })}/>`)}
      <p className="sugo">Kiválasztva: ${valasztott.length} / ${kell}</p>
    </div>` : null}
  <//>`;
}

// ================= 5. Háttér =================
function Hatter({ adat, valtoztat, ix, ixMind, lap }) {
  const h = adat.hatter;
  const companionCsoportok = V.hatterCsoportok(ix);
  const rendszer = h.rendszer || 'alap';
  const mod = h.mod || 'dobas';
  const hatter = ixMind.elem('Hátterek', h.id);
  const osztalyDobas = V.utolsoDobas(adat, 'hatter:osztaly');
  const hatterDobasNaplo = V.utolsoDobas(adat, 'hatter:hatter');
  const tarsOsztaly = rendszer === 'alap' ? (h.csoport || (hatter && reszletek(hatter).tarsadalmi_osztaly) || null) : null;
  const csoport = rendszer === 'companion' ? (h.csoport || (hatter && (reszletek(hatter).hattercsoport || hatter.csoport)) || null) : tarsOsztaly;
  const lista = csoport ? V.hatterLista(ix, rendszer, csoport) : [];
  const set = (fn) => valtoztat((a) => { fn(a.hatter, a); });
  const hatterValaszt = (id, d) => valtoztat((a) => { V.hatterBeallit(a, id); if (d !== undefined) a.hatter.hatter_dobas = d; });
  const osztalyTabla = V.TARSADALMI_OSZTALYOK;
  return html`
    ${companionCsoportok.length ? html`<${Kapcsolo} teljes=${true} cimke="Háttérrendszer" ertek=${rendszer}
      opciok=${[{ value: 'alap', label: 'Társadalmi osztály' }, { value: 'companion', label: 'Companion csoportok' }]}
      onValt=${(x) => set((hh) => { if (hh.rendszer !== x) { hh.rendszer = x; hh.csoport = null; hh.id = null; hh.fokusz = null; } })}/>` : null}
    <${Kapcsolo} cimke="Választás módja" ertek=${mod} opciok=${[{ value: 'dobas', label: 'Dobás' }, { value: 'valasztas', label: 'Választás' }]}
      onValt=${(x) => set((hh) => { hh.mod = x; })}/>
    ${rendszer === 'alap' ? html`<${Szakasz} cim="1. Társadalmi osztály">
      ${mod === 'dobas' ? html`<${Kockadobo} db=${1} kockak=${h.osztaly_dobas && osztalyDobas ? osztalyDobas.kockak : null} kezi=${osztalyDobas && osztalyDobas.kezi} kicsi=${true}
        onDobas=${(k, kezi) => valtoztat((a) => { a.hatter.rendszer = 'alap'; a.hatter.osztaly_dobas = k[0]; a.hatter.csoport = V.tarsadalmiOsztalyDobas(ixMind, k[0]); a.hatter.id = null; a.hatter.fokusz = null; a.hatter.hatter_dobas = null; V.naplozDobas(a, 'hatter:osztaly', k, kezi); })}/>` : null}
      <table className="tabla"><tbody>${[['1', 'Kívülálló'], ['2–3', 'Alsó'], ['4–5', 'Közép'], ['6', 'Felső']].map(([d, o]) => html`<tr key=${o} className=${tarsOsztaly === o ? 'kiemelt' : ''}>
        <td>${d}</td><td>${mod === 'valasztas' ? html`<button type="button" className="sorgomb" aria-pressed=${tarsOsztaly === o} onClick=${() => set((hh) => { hh.rendszer = 'alap'; hh.csoport = o; hh.osztaly_dobas = null; })}>${o} osztály</button>` : o + ' osztály'}</td></tr>`)}</tbody></table>
    <//>` : html`<${Szakasz} cim="1. Háttércsoport">
      <div className="csipek">${companionCsoportok.map((c) => html`<${Csip} key=${c} be=${csoport === c} onClick=${() => set((hh) => { hh.rendszer = 'companion'; hh.csoport = c; hh.id = null; hh.fokusz = null; })}>${c}<//>`)}</div>
    <//>`}
    ${csoport ? html`<${Szakasz} cim=${rendszer === 'alap' ? `2. Háttér (${csoport} osztály)` : `2. Háttér (${csoport})`}>
      ${mod === 'dobas' ? html`<${Kockadobo} db=${1} kockak=${h.hatter_dobas && hatterDobasNaplo ? hatterDobasNaplo.kockak : null} kezi=${hatterDobasNaplo && hatterDobasNaplo.kezi} kicsi=${true}
        onDobas=${(k, kezi) => { const t = V.hatterDobasbol(ix, rendszer, csoport, k[0]); valtoztat((a) => { V.naplozDobas(a, 'hatter:hatter', k, kezi); a.hatter.hatter_dobas = k[0]; V.hatterBeallit(a, t ? t.id : null); }); }}/>` : null}
      <div className="valasztasok">${lista.map((t) => html`<${Valasztas} key=${t.id} elem=${t} valasztott=${h.id === t.id}
        meta=${[V.hatterSajatDobas(t) ? '1d6: ' + V.hatterSajatDobas(t) : '', forrasMeta(t)].filter(Boolean).join(' · ')}
        leiras=${rovid(t.leiras_hu, 120)} onClick=${() => hatterValaszt(t.id)}/>`)}</div>
    <//>` : null}
    ${hatter ? html`<${Szakasz} cim="Háttér-fókusz (egy)">
      <div className="valasztasok valasztasok--ket">${(reszletek(hatter).fokusz_valasztas || []).map((f) => html`<${Valasztas} key=${f} nev=${fokuszNev(ixMind, f)} meta=""
        valasztott=${h.fokusz === f} onClick=${() => set((hh) => { hh.fokusz = f; })}/>`)}</div>
    <//>` : null}
    <${LepesFigyelmeztetesek} lap=${lap} lepes="hatter"/>`;
}

// ================= 6. Osztály =================
function Osztaly({ adat, valtoztat, ix, ixMind, lap, forrasok }) {
  const osztalyok = ix.lista('Osztályok');
  const osztaly = ixMind.elem('Osztályok', adat.osztaly);
  const [lista, setLista] = useState(!osztaly);
  if (!osztaly || lista) {
    return html`<p className="sugo">Válassz osztályt. Ez adja a kezdő Egészséget, a fegyvercsoportokat és az első talentumokat.</p>
      <div className="valasztasok">${osztalyok.map((o) => {
        const r = reszletek(o);
        return html`<${Valasztas} key=${o.id} elem=${o} valasztott=${adat.osztaly === o.id}
          leiras=${'Elsődleges: ' + (r.elsodleges || []).map((t) => tulNev(ixMind, t)).join(', ') + '.'}
          onClick=${() => { valtoztat((a) => { V.osztalyBeallit(a, o.id, ixMind); V.felszerelesFrissit(a, ixMind.lapok); }); setLista(false); }}/>`;
      })}</div>
      ${osztaly ? html`<div><${K.Button} variant="quiet" onClick=${() => setLista(false)}>Mégse<//></div>` : null}`;
  }
  const or = reszletek(osztaly);
  const sz1 = adat.szintek[0] || {};
  const egDobas = V.utolsoDobas(adat, 'egeszseg:1');
  const kepessegek = V.szint1Kepessegek(ixMind, osztaly.id);
  const magus = V.magusE(ixMind, osztaly.id);
  const fcsV = or.fegyvercsoport_valasztas;
  const valasztottCsoportok = adat.osztaly_dontes.fegyvercsoportok || [];
  const fajiCsere = Object.values(lap.fokuszok).filter((f) => f.forrasok.some((s) => /fegyvercsoport helyett/.test(s.eredet)));
  const kg = (lap.egeszseg.reszek || []);
  return html`<${Valasztas} elem=${osztaly} valasztott=${true} leiras=${'Elsődleges: ' + (or.elsodleges || []).map((t) => tulNev(ixMind, t)).join(', ') + '. Másodlagos: ' + (or.masodlagos || []).map((t) => tulNev(ixMind, t)).join(', ') + '.'}
      onClick=${() => setLista(true)}><span className="valasztas__ok">Koppints az osztály cseréjéhez.</span><//>
    <${Szakasz} cim="Kezdő Egészség (1d6)">
      <${Kockadobo} db=${1} kicsi=${true} kockak=${sz1.egeszseg_dobas !== null && sz1.egeszseg_dobas !== undefined && egDobas ? egDobas.kockak : null} kezi=${egDobas && egDobas.kezi}
        onDobas=${(k, kezi) => valtoztat((a) => { a.szintek[0].egeszseg_dobas = k[0]; V.naplozDobas(a, 'egeszseg:1', k, kezi); })}/>
      <div className="osszegsor"><span>${kg.map((r) => `${r.ertek} (${r.eredet.replace('Osztály: ', '').replace(' (1. szint)', '')})`).join(' + ')}</span><span className="osszegsor__ertek">${lap.egeszseg.ertek}</span></div>
    <//>
    ${magus ? html`<${Magus} adat=${adat} valtoztat=${valtoztat} ix=${ix} ixMind=${ixMind} lap=${lap} forrasok=${forrasok} osztaly=${osztaly} kepessegek=${kepessegek}/>` : null}
    <${Szakasz} cim=${fcsV ? `Fegyvercsoportok: válassz ${fcsV.db}-${fcsV.db === 1 ? 'et' : 'at'} (${valasztottCsoportok.length} / ${fcsV.db})` : 'Fegyvercsoportok'}
      sugo=${'Megvan: ' + (or.fegyvercsoportok || []).map((c) => elemNev(ixMind, 'Fegyvercsoportok', c)).join(', ') + ' (osztály).'}>
      ${fcsV ? html`<div className="csipek">${(fcsV.valaszthato || []).map((c) => html`<${Csip} key=${c} be=${valasztottCsoportok.includes(c)}
        onClick=${() => valtoztat((a) => { const s = (a.osztaly_dontes.fegyvercsoportok || []).slice(); const j = s.indexOf(c); j >= 0 ? s.splice(j, 1) : s.push(c); a.osztaly_dontes.fegyvercsoportok = s; })}>${elemNev(ixMind, 'Fegyvercsoportok', c)}<//>`)}</div>` : null}
      ${fajiCsere.length ? html`<${Uzenet} tonus="neutral">ⓘ A faji fegyvercsoport-előny helyett fókusz jár, mert a csoport már megvan: ${fajiCsere.map((f) => fokuszNev(ixMind, f.id)).join(', ')}.<//>` : null}
    <//>
    ${kepessegek.filter((k) => k.tipus === 'talentum_valasztas').map((k, i) => html`<${TalentumValasztas} key=${i} k=${k} adat=${adat} valtoztat=${valtoztat} ix=${ix} ixMind=${ixMind} lap=${lap}/>`)}
    ${kepessegek.filter((k) => k.tipus === 'kepesseg' || k.tipus === 'mutatvany_kedvezmeny').length ? html`<${Szakasz} cim="Osztályképességek (1. szint)">
      <div className="valasztasok">${kepessegek.filter((k) => k.tipus === 'kepesseg' || k.tipus === 'mutatvany_kedvezmeny').map((k, i) => html`<${Valasztas} key=${i} fix=${true}
        nev=${k.nev_hu} en=${k.nev_en || ''} meta="jár" leiras=${rovid(k.leiras, 220)}/>`)}</div>
    <//>` : null}
    <${LepesFigyelmeztetesek} lap=${lap} lepes="osztaly"/>`;
}

function TalentumValasztas({ k, adat, valtoztat, ix, ixMind, lap }) {
  const db = szam(k.valasztando, 1);
  const kotelezo = k.kotelezo || [];
  const valasztott = V.kapottIdk(adat, 'talentum').filter((t) => !kotelezo.includes(t));
  const valaszthato = (k.valaszthato || []).filter((id) => ix.elem('Talentumok', id) || ixMind.elem('Talentumok', id));
  const valt = (id) => valtoztat((a) => {
    const v = V.kapottIdk(a, 'talentum').filter((t) => !kotelezo.includes(t));
    const j = v.indexOf(id);
    if (j >= 0) v.splice(j, 1); else v.push(id);
    V.kapottBeallit(a, 'talentum', kotelezo.concat(v), kotelezo);
    V.felszerelesFrissit(a, ixMind.lapok);
  });
  return html`<${Szakasz} cim=${`${k.nev_hu || 'Kezdő talentum'}: válassz ${db}-${db === 1 ? 'et' : 't'} (${valasztott.filter((x) => valaszthato.includes(x)).length} / ${db})`}>
    ${kotelezo.map((id) => html`<${Valasztas} key=${id} fix=${true} elem=${ixMind.elem('Talentumok', id)} nev=${elemNev(ixMind, 'Talentumok', id)} meta="Kezdő, jár"/>`)}
    <div className="valasztasok">${valaszthato.map((id) => {
      const t = ixMind.elem('Talentumok', id);
      const ef = V.elofeltetelek(t, lap, ixMind);
      const hiany = ef.filter((x) => x.ok === false);
      return html`<${Valasztas} key=${id} elem=${t} valasztott=${valasztott.includes(id)} meta=${'Kezdő · ' + forrasMeta(t)}
        leiras=${rovid(t.kezdo || t.leiras_hu, 140)}
        ok=${ef.length && !hiany.length ? 'Feltétel: ' + ef.map((x) => x.szoveg + (x.ok ? ' ✓' : '')).join(', ') : null}
        figy=${hiany.length ? 'Feltétel: ' + ef.map((x) => x.szoveg + (x.ok ? ' ✓' : x.ok === false ? ' ✗' : '')).join(', ') : null}
        onClick=${() => valt(id)}/>`;
    })}</div>
  <//>`;
}

function Magus({ adat, valtoztat, ix, ixMind, lap, forrasok, kepessegek }) {
  const sz1 = adat.szintek[0] || {};
  const mpDobas = V.utolsoDobas(adat, 'mp:1');
  const kepzes = kepessegek.find((k) => k.kezdo_arkanum_db) || {};
  const arkDb = szam(kepzes.kezdo_arkanum_db, 2);
  const arkanumok = ix.lista('Arkánumok').filter((a) => { const o = reszletek(a).osztalyok; return !o || o.includes(adat.osztaly); });
  const valasztott = V.kapottIdk(adat, 'arkanum');
  const varazslatok = V.kapottIdk(adat, 'varazslat');
  const [mind, setMind] = useState(valasztott.length < arkDb);
  const lathato = mind ? arkanumok : arkanumok.filter((a) => valasztott.includes(a.id));
  const arkValt = (id) => valtoztat((a) => {
    const v = V.kapottIdk(a, 'arkanum');
    const j = v.indexOf(id);
    j >= 0 ? v.splice(j, 1) : v.push(id);
    V.arkanumokBeallit(a, ixMind, v, forrasok);
  });
  const varValt = (id) => valtoztat((a) => {
    const v = V.kapottIdk(a, 'varazslat');
    const j = v.indexOf(id);
    j >= 0 ? v.splice(j, 1) : v.push(id);
    V.kapottBeallit(a, 'varazslat', v);
  });
  return html`<${Szakasz} cim="Mágiapont (1d6)">
      <${Kockadobo} db=${1} kicsi=${true} kockak=${sz1.mp_dobas !== null && sz1.mp_dobas !== undefined && mpDobas ? mpDobas.kockak : null} kezi=${mpDobas && mpDobas.kezi}
        onDobas=${(k, kezi) => valtoztat((a) => { a.szintek[0].mp_dobas = k[0]; V.naplozDobas(a, 'mp:1', k, kezi); })}/>
      ${lap.magiapont ? html`<div className="osszegsor"><span>${lap.magiapont.reszek.map((r) => `${r.ertek} (${r.eredet.replace(' (1. szint)', '')})`).join(' + ')}</span><span className="osszegsor__ertek">${lap.magiapont.ertek}</span></div>` : null}
    <//>
    <${Szakasz} cim=${`Mágikus talentumok (arkánumok): válassz ${arkDb}-t (${valasztott.length} / ${arkDb})`}>
      <div className="valasztasok valasztasok--ket">${lathato.map((a) => html`<${Valasztas} key=${a.id} elem=${a} valasztott=${valasztott.includes(a.id)}
        leiras=${rovid(a.leiras_hu, 110)} onClick=${() => { arkValt(a.id); if (!valasztott.includes(a.id) && valasztott.length + 1 >= arkDb) setMind(false); }}/>`)}</div>
      <div><${K.Button} variant="quiet" onClick=${() => setMind(!mind)}>${mind ? 'Csak a választottak' : `Összes arkánum (${arkanumok.length})`}<//></div>
    <//>
    ${valasztott.map((aid) => {
      const kv = V.kezdoVarazslatok(ix, aid, forrasok);
      const sajat = varazslatok.filter((v) => (ixMind.elem('Varázslatok', v) || {}).arkanum === aid);
      return html`<${Szakasz} key=${aid} cim=${`${elemNev(ixMind, 'Arkánumok', aid)}: ${kv.valaszthato ? `válassz ${kv.db} varázslatot (${sajat.length} / ${kv.db})` : 'kezdő varázslatok'}`}
        sugo=${kv.valaszthato ? null : 'Csak az Alapkönyv aktív, ezért a kezdő varázslatok adottak.'}>
        <div className="valasztasok">${kv.lista.map((vid) => {
          const v = ixMind.elem('Varázslatok', vid);
          const r = reszletek(v);
          const meta = [v.fokozat, r.mp && r.mp.min ? r.mp.min + (r.mp.plusz ? '+' : '') + ' MP' : (v.mp_koltseg ? v.mp_koltseg + ' MP' : ''), forrasMeta(v)].filter(Boolean).join(' · ');
          return kv.valaszthato
            ? html`<${Valasztas} key=${vid} elem=${v} meta=${meta} leiras=${rovid(v.leiras_hu, 120)} valasztott=${sajat.includes(vid)} onClick=${() => varValt(vid)}/>`
            : html`<${Valasztas} key=${vid} elem=${v} meta=${meta} leiras=${rovid(v.leiras_hu, 120)} fix=${true}/>`;
        })}</div>
      <//>`;
    })}`;
}

// ================= 7. Felszerelés =================
function Felszereles({ adat, valtoztat, ix, ixMind, lap }) {
  const f = adat.felszereles;
  const osztaly = ixMind.elem('Osztályok', adat.osztaly);
  const [kereso, setKereso] = useState('');
  const [bolt, setBolt] = useState('');
  const [kategoria, setKategoria] = useState('Mind');
  const [boltDb, setBoltDb] = useState(20);
  // a lépés megnyitásakor a csomag és a pénz a mostani döntésekből (például háttér- vagy talentumváltás után)
  useEffect(() => { if (adat.osztaly) valtoztat((a) => V.felszerelesFrissit(a, ixMind.lapok)); }, []);
  if (!osztaly) return html`<${Uzenet} tonus="warning">Előbb válassz osztályt: tőle függ a kezdő csomag és a fegyverek száma.<//>`;
  const cs = kezdoCsomag(ixMind.lapok, adat.osztaly, f.kezdo_fegyverek || [], V.kapottIdk(adat, 'talentum'));
  const ismert = new Set(lap.fegyvercsoportok.map((c) => c.id));
  const fegyverek = ix.lista('Fegyverek').filter((w) => w.csoport && keresIllik(w, kereso));
  const valasztott = f.kezdo_fegyverek || [];
  const fegyverValt = (id) => valtoztat((a) => {
    const v = (a.felszereles.kezdo_fegyverek || []).slice();
    const j = v.indexOf(id);
    j >= 0 ? v.splice(j, 1) : v.push(id);
    a.felszereles.kezdo_fegyverek = v;
    V.felszerelesFrissit(a, ixMind.lapok);
  });
  const tarsOsztaly = V.tarsadalmiOsztaly(adat, ixMind);
  const penzDobas = V.utolsoDobas(adat, 'penz');
  const alt = reszletek(ixMind.elem('Szintlépés', 'szint_altalanos')).kezdo_penz_ezust || {};
  const fegyverKartya = (w) => {
    const r = reszletek(w);
    const minEro = w.min_ero === '' || w.min_ero === null || w.min_ero === undefined ? null : szam(w.min_ero);
    const figy = [!ismert.has(w.csoport) ? 'nem ismert csoport: −2 a támadásra, fél sebzés' : '', minEro !== null && lap.tulajdonsagok.tul_strength.ertek < minEro ? `minimális Erő ${minEro}` : ''].filter(Boolean).join('; ');
    return html`<${Valasztas} key=${w.id} elem=${w} valasztott=${valasztott.includes(w.id)} onClick=${() => fegyverValt(w.id)}
      meta=${[elemNev(ixMind, 'Fegyvercsoportok', w.csoport), w.sebzes, minEro !== null ? 'Erő ' + minEro : ''].filter(Boolean).join(' · ')}
      figy=${figy || null}/>`;
  };
  const ismertek = fegyverek.filter((w) => ismert.has(w.csoport));
  const tobbi = fegyverek.filter((w) => !ismert.has(w.csoport));
  // bolt
  const kategoriak = ['Mind'].concat([...new Set(ix.lista('Felszerelés').map((x) => x.kategoria).filter((k) => k && k !== 'Kezdő felszerelés'))], ['Fegyverek', 'Páncélok']);
  const aruk = (kategoria === 'Fegyverek' ? ix.lista('Fegyverek') : kategoria === 'Páncélok' ? ix.lista('Páncélok')
    : ix.lista('Felszerelés').filter((x) => kategoria === 'Mind' || x.kategoria === kategoria))
    .filter((x) => V.arRez(x) !== null && keresIllik(x, bolt));
  const vasarolt = new Map((f.vasarolt || []).map((v) => [v.id, v.db]));
  const vesz = (id, n) => valtoztat((a) => { V.vasarlas(a, id, n); V.felszerelesFrissit(a, ixMind.lapok); });
  const viselheto = (f.targyak || []).filter((t) => t.id.startsWith('pan_') || t.id.startsWith('fgy_'));
  return html`<${Szakasz} cim="Kezdő csomag (automatikus)">
      <ul className="sorlista">${cs.targyak.filter((t) => !t.id.startsWith('fgy_')).map((t) => html`<li key=${t.id} className="sorlista__sor">
        <span>${elemNev(ixMind, V.targyLap(t.id), t.id)}${t.db > 1 ? ' × ' + t.db : ''}</span>
        <span className="halvany kicsi">${t.id === cs.pancel ? 'osztály, viselve' : t.id.startsWith('pan_') ? 'pajzs a stílushoz' : 'osztály'}</span></li>`)}</ul>
    <//>
    <${Szakasz} cim=${`Fegyverek: válassz ${cs.fegyver_db}-${cs.fegyver_db === 1 ? 'et' : 'at'} (${valasztott.length} / ${cs.fegyver_db})`} sugo="Íjhoz és számszeríjhoz tegez és 20 vessző is jár.">
      <${Kereso} cimke="Fegyver keresése" ertek=${kereso} set=${setKereso}/>
      ${ismertek.length ? html`<p className="cimke">Ismert csoportok</p><div className="valasztasok valasztasok--ket">${ismertek.map(fegyverKartya)}</div>` : null}
      ${tobbi.length ? html`<details className="lenyilo"><summary>Nem ismert csoportok (${tobbi.length})</summary><div className="valasztasok valasztasok--ket">${tobbi.map(fegyverKartya)}</div></details>` : null}
    <//>
    <${Szakasz} cim=${tarsOsztaly ? `Kezdőpénz: ${tarsOsztaly} osztály, ${alt[tarsOsztaly] || '+ 3d6'} ezüst` : 'Kezdőpénz'}>
      ${tarsOsztaly ? html`<${Kockadobo} db=${3} kicsi=${true} kockak=${f.penz_dobas !== null && f.penz_dobas !== undefined && penzDobas ? penzDobas.kockak : null} kezi=${penzDobas && penzDobas.kezi}
        eredmeny=${() => (f.kezdo_penz_rez !== null && f.kezdo_penz_rez !== undefined ? html`<strong className="kockadobo__eredmeny">${V.penzSzoveg(f.kezdo_penz_rez)}</strong>` : null)}
        onDobas=${(k, kezi) => valtoztat((a) => { a.felszereles.penz_dobas = V.osszeg(k); V.naplozDobas(a, 'penz', k, kezi); V.felszerelesFrissit(a, ixMind.lapok); })}/>`
        : html`<${Uzenet} tonus="warning">A kezdőpénz a háttér társadalmi osztályától függ. Előbb válassz hátteret.<//>`}
    <//>
    <div className="osszegsor"><span className="osszegsor__nev">Pénz</span><span className="osszegsor__ertek">${V.penzSzoveg(f.penz_rez || 0)}</span></div>
    <details className="lenyilo" open=${(f.vasarolt || []).length > 0}>
    <summary>Bolt: vásárlás a kezdőpénzből${(f.vasarolt || []).length ? ` (${(f.vasarolt || []).reduce((x, v) => x + v.db, 0)} tétel)` : ''}</summary>
    <div className="szakasz">
      <div className="csipek">${kategoriak.map((k) => html`<${Csip} key=${k} be=${kategoria === k} onClick=${() => { setKategoria(k); setBoltDb(20); }}>${k}<//>`)}</div>
      <${Kereso} cimke="Áru keresése" ertek=${bolt} set=${(x) => { setBolt(x); setBoltDb(20); }}/>
      <ul className="sorlista">${aruk.slice(0, boltDb).map((x) => {
        const n = vasarolt.get(x.id) || 0;
        return html`<li key=${x.id} className="sorlista__sor">
          <span>${x.nev_hu}${n ? html` <strong>× ${n}</strong>` : null}<br/><span className="halvany kicsi">${V.penzSzoveg(V.arRez(x))}</span></span>
          <span className="sorlista__muvelet">
            ${n ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => vesz(x.id, -1)}>Vissza<//>` : null}
            <${K.Button} size="sm" onClick=${() => vesz(x.id, 1)}>Vétel<//>
          </span></li>`;
      })}</ul>
      ${aruk.length > boltDb ? html`<div><${K.Button} variant="quiet" onClick=${() => setBoltDb(boltDb + 20)}>Továbbiak (${aruk.length - boltDb})<//></div>` : null}
    </div>
    </details>
    ${viselheto.length ? html`<${Szakasz} cim="Viselve és kézben" sugo="A páncél, a pajzs és a fegyverek közül melyik van épp rajtad (a számított értékekhez).">
      <div className="csipek">${viselheto.map((t) => html`<${Csip} key=${t.id} be=${t.felszerelve}
        onClick=${() => valtoztat((a) => { const x = a.felszereles.targyak.find((y) => y.id === t.id); if (x) x.felszerelve = !x.felszerelve; })}>${elemNev(ixMind, V.targyLap(t.id), t.id)}<//>`)}</div>
    <//>` : null}
    <${LepesFigyelmeztetesek} lap=${lap} lepes="felszereles"/>`;
}

// ================= 8. Számított értékek =================
function ErtekReszekkel({ nev, ertek }) {
  if (!ertek) return null;
  return html`<div>
    <div className="osszegsor"><span className="osszegsor__nev">${nev}</span><span className="osszegsor__ertek">${ertek.ertek}</span></div>
    <ul className="reszek">${(ertek.reszek || []).map((r, i) => html`<li key=${i}>${elojel(r.ertek)} ${r.eredet}</li>`)}</ul>
  </div>`;
}
function Szamitott({ lap }) {
  return html`<p className="sugo">Itt nincs mit választani. Nézd át, honnan jön az egyes értékek.</p>
    ${lap.egeszseg.ertek ? html`<${K.ResourceBar} kind="health" value=${lap.egeszseg.ertek} max=${lap.egeszseg.ertek}/>` : null}
    ${lap.magiapont && lap.magiapont.ertek ? html`<${K.ResourceBar} kind="magic" value=${lap.magiapont.ertek} max=${lap.magiapont.ertek}/>` : null}
    <div>
      <${ErtekReszekkel} nev="Egészség" ertek=${lap.egeszseg}/>
      ${lap.magiapont ? html`<${ErtekReszekkel} nev="Mágiapont" ertek=${lap.magiapont}/>` : null}
      <${ErtekReszekkel} nev="Védekezés" ertek=${lap.vedekezes}/>
      <${ErtekReszekkel} nev="Sebesség" ertek=${lap.sebesseg}/>
      <${ErtekReszekkel} nev="Páncélérték" ertek=${lap.pancelertek}/>
    </div>
    ${lap.fegyverek.length ? html`<${Szakasz} cim="Fegyverek">
      <table className="tabla"><thead><tr><th>Fegyver</th><th className="szam">Támadás</th><th className="szam">Sebzés</th></tr></thead>
      <tbody>${lap.fegyverek.map((w) => html`<tr key=${w.id}><td>${w.nev_hu}${w.ismert ? '' : html` <span className="halvany kicsi">(nem ismert csoport)</span>`}</td>
        <td className="szam">${elojel(w.tamadas)}</td><td className="szam">${w.sebzes}</td></tr>`)}</tbody></table>
    <//>` : null}
    ${lap.kepessegek.length ? html`<${Szakasz} cim="Képességek">
      <ul className="sorlista">${lap.kepessegek.map((k, i) => html`<li key=${i} className="sorlista__sor sorlista__sor--fuggoleges">
        <strong>${k.nev_hu}</strong><span className="halvany kicsi">${k.eredet}</span>${k.leiras ? html`<span className="kicsi">${rovid(k.leiras, 200)}</span>` : null}</li>`)}</ul>
    <//>` : null}
    ${lap.nyelvek.length ? html`<p className="szoveg"><strong>Nyelvek:</strong> ${lap.nyelvek.join(', ')}</p>` : null}`;
}

// ================= 9. Név és célok =================
function NevCelok({ adat, valtoztat, kampany }) {
  const { api } = useApp();
  const [csapat, setCsapat] = useState([]);
  useEffect(() => {
    if (!kampany) return;
    api.hivas('state.get', { kampany_id: kampany.id }).then((v) => setCsapat((v.karakterek || []).map((c) => c.nev).filter((n) => n && n !== adat.nev))).catch(() => {});
  }, [kampany && kampany.id]);
  const cel = (tipus) => ((adat.alap.celok || []).find((c) => c.tipus === tipus) || {}).szoveg || '';
  const celBeallit = (tipus, szoveg) => valtoztat((a) => {
    const c = (a.alap.celok || []).filter((x) => x.tipus !== tipus);
    if (szoveg) c.push({ tipus, szoveg });
    a.alap.celok = c;
  });
  const kotelekek = adat.alap.kotelekek || [];
  const kotelek = (i, mezo, v) => valtoztat((a) => { const k = (a.alap.kotelekek || []).map((x) => ({ ...x })); k[i][mezo] = v; a.alap.kotelekek = k; });
  const monogram = (adat.nev || '?').trim().charAt(0).toUpperCase();
  return html`<div className="fejsor">
      <span className="monogram" aria-hidden="true">${monogram}</span>
      <p className="sugo">A karakterkép feltöltése a következő fejlesztési lépésben érkezik. Addig a monogram áll a helyén.</p>
    </div>
    <${K.TextField} label="Név" value=${adat.nev} autoCapitalize="words" onChange=${(e) => { const v = e.target.value; valtoztat((a) => { a.nev = v; }); }}/>
    <${K.TextField} label="Megjelenés" multiline=${true} rows=${3} value=${adat.alap.megjelenes || ''} onChange=${(e) => { const v = e.target.value; valtoztat((a) => { a.alap.megjelenes = v; }); }}/>
    <${K.TextField} label="Rövid távú cél" value=${cel('rovid')} onChange=${(e) => celBeallit('rovid', e.target.value)}/>
    <${K.TextField} label="Hosszú távú cél" value=${cel('hosszu')} onChange=${(e) => celBeallit('hosszu', e.target.value)}/>
    <${Szakasz} cim="Kötelékek" sugo="Kihez és miért kötődik a karakter (csapattárs, rokon, régi ismerős). Később is pótolható.">
      ${kotelekek.map((k, i) => html`<div key=${i} className="valasztas valasztas--fix verem">
        ${csapat.length ? html`<${Valaszto} label="Csapattárs" value=${csapat.includes(k.nev) ? k.nev : ''} ures="Más (írd be lent)" onChange=${(v) => kotelek(i, 'nev', v)}
          opciok=${csapat.map((n) => ({ value: n, label: n }))}/>` : null}
        <${K.TextField} label="Kivel" value=${k.nev || ''} onChange=${(e) => kotelek(i, 'nev', e.target.value)}/>
        <${K.TextField} label="A kötelék" value=${k.leiras || ''} onChange=${(e) => kotelek(i, 'leiras', e.target.value)}/>
        <div><${K.Button} variant="quiet" size="sm" onClick=${() => valtoztat((a) => { a.alap.kotelekek = a.alap.kotelekek.filter((_, j) => j !== i); })}>Kötelék törlése<//></div>
      </div>`)}
      <div><${K.Button} variant="quiet" onClick=${() => valtoztat((a) => { a.alap.kotelekek = (a.alap.kotelekek || []).concat([{ nev: '', leiras: '' }]); })}
        icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Kötelék hozzáadása<//></div>
    <//>`;
}

// ================= 10. Összegzés =================
function Osszegzes({ adat, valtoztat, lap, ixMind, dm, ugras }) {
  const figy = lap.figyelmeztetesek.filter((f) => f.szint === 'figyelmeztetes');
  const info = lap.figyelmeztetesek.filter((f) => f.szint !== 'figyelmeztetes');
  const beirt = (adat.dobasok || []).filter((d) => d.kezi);
  const elfogad = (kulcs, be) => valtoztat((a) => { const s = new Set(a.elfogadott || []); be ? s.add(kulcs) : s.delete(kulcs); a.elfogadott = [...s]; });
  const nyitott = figy.filter((f) => !f.elfogadott).length;
  return html`<${Elonezet} adat=${adat} lap=${lap} ix=${ixMind} teljes=${true}/>
    <${Szakasz} cim=${`Figyelmeztetések (${nyitott})`}>
      ${!figy.length ? html`<${Uzenet} tonus="success">Nincs szabályeltérés.<//>` : null}
      ${figy.map((f) => html`<div key=${f.kulcs} className=${'uzenet ' + (f.elfogadott ? 'uzenet--elfogadott' : 'uzenet--warning') + ' figyuzenet'} role="status">
        <span>${f.elfogadott ? '✓ Elfogadva: ' : '⚠ '}${f.uzenet}</span>
        <span className="figyuzenet__gombok">
          <button type="button" className="figygomb" onClick=${() => ugras(V.figyelmeztetesLepese(f))}>Ugrás: ${V.LEPESEK[V.lepesSzam(V.figyelmeztetesLepese(f))].cim}</button>
          ${dm ? html`<button type="button" className="figygomb figygomb--halk" onClick=${() => elfogad(f.kulcs, !f.elfogadott)}>${f.elfogadott ? 'Elfogadás visszavonása' : 'Elfogadom (DM)'}</button>` : null}
        </span>
      </div>`)}
      ${!dm && nyitott ? html`<p className="sugo">A figyelmeztetések nem tiltanak semmit. A DM egyenként elfogadhatja őket.</p>` : null}
      ${beirt.length ? html`<${Uzenet} tonus="neutral">ⓘ Kézzel beírt dobások: ${beirt.length} (a karakter készítési naplójában látszanak).<//>` : null}
      ${info.filter((f) => f.kod !== 'kezi_modosito').map((f) => html`<${Uzenet} key=${f.kulcs} tonus="neutral">ⓘ ${f.uzenet}<//>`)}
    <//>
    ${(adat.keszites.cel_szint || 1) > 1 ? html`<${Uzenet} tonus="neutral">ⓘ A kezdő szint ${adat.keszites.cel_szint}. A szintlépés-varázsló a következő fejlesztési lépésben jön, addig a karakter 1. szinten marad.<//>` : null}`;
}

// ================= Élő karakterlap-előnézet =================
export function Elonezet({ adat, lap, ix, cimNelkul, teljes }) {
  const elozo = useRef(null);
  const [friss, setFriss] = useState([]);
  useEffect(() => {
    const most = {};
    V.TULAJDONSAGOK.forEach((t) => { most[t] = lap.tulajdonsagok[t].ertek; });
    if (elozo.current) {
      const valt = V.TULAJDONSAGOK.filter((t) => elozo.current[t] !== most[t]);
      if (valt.length) setFriss(valt);
    }
    elozo.current = most;
  }, [lap]);
  const fokuszok = (t) => Object.values(lap.fokuszok).filter((f) => f.tulajdonsag === t).map((f) => f.nev_hu + (f.bonusz === 3 ? ' (+3)' : ''));
  const nyitott = lap.figyelmeztetesek.filter((f) => f.szint === 'figyelmeztetes' && !f.elfogadott).length;
  const nev = adat.nev || 'Névtelen';
  const talentumok = lap.specializaciok.concat(lap.talentumok, lap.arkanumok);
  const celok = adat.alap.celok || [];
  return html`<div className="verem">
    ${cimNelkul ? null : html`<div className="fejsor">
      <span className="monogram" aria-hidden="true">${nev.charAt(0).toUpperCase()}</span>
      <div><div className="valasztas__nev" style=${{ fontSize: '20px', lineHeight: '28px' }}>${nev}</div>
        <div className="cimkek">
          ${lap.faj ? html`<${K.Badge}>${lap.faj.nev_hu}<//>` : html`<${K.Badge}>Faj: még nincs<//>`}
          ${lap.osztaly ? html`<${K.Badge}>${lap.osztaly.nev_hu}, ${lap.szint}. szint<//>` : null}
          ${lap.hatter ? html`<${K.Badge}>${lap.hatter.nev_hu}<//>` : null}
          ${adat.keszites.allapot === 'piszkozat' ? html`<${K.Badge} tone="warning">Piszkozat<//>` : null}
        </div></div>
    </div>`}
    ${cimNelkul ? html`<div className="cimkek">
      ${lap.faj ? html`<${K.Badge}>${lap.faj.nev_hu}<//>` : null}${lap.osztaly ? html`<${K.Badge}>${lap.osztaly.nev_hu}, ${lap.szint}. szint<//>` : null}${lap.hatter ? html`<${K.Badge}>${lap.hatter.nev_hu}<//>` : null}
    </div>` : null}
    <dl className="ka-abilities mini-tul">${V.TULAJDONSAGOK.map((t) => html`<div key=${t} className=${'ka-ability' + (friss.includes(t) ? ' ka-ability--friss' : '')}>
      <dt className="ka-ability__name">${TUL_NEV[t]}</dt>
      <dd className="ka-ability__value">${elojel(lap.tulajdonsagok[t].ertek)}</dd>
      ${fokuszok(t).length ? html`<dd className="ka-ability__focus">${fokuszok(t).join(', ')}</dd>` : null}
    </div>`)}</dl>
    ${lap.egeszseg.ertek ? html`<${K.ResourceBar} kind="health" value=${lap.egeszseg.ertek} max=${lap.egeszseg.ertek}/>` : null}
    ${lap.magiapont && lap.magiapont.ertek ? html`<${K.ResourceBar} kind="magic" value=${lap.magiapont.ertek} max=${lap.magiapont.ertek}/>` : null}
    <dl className="ertekek">
      <div><dt>Védekezés</dt><dd>${lap.vedekezes.ertek}</dd></div>
      <div><dt>Sebesség</dt><dd>${lap.sebesseg ? lap.sebesseg.ertek : '–'}</dd></div>
      <div><dt>Páncélérték</dt><dd>${lap.pancelertek.ertek}</dd></div>
    </dl>
    ${lap.fegyverek.length ? html`<dl className="ertekek ertekek--lista">${lap.fegyverek.map((w) => html`<div key=${w.id}><dt>${w.nev_hu}</dt><dd>${elojel(w.tamadas)} · ${w.sebzes}</dd></div>`)}</dl>` : null}
    ${talentumok.length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Talentumok:</strong> ${talentumok.map((t) => t.nev_hu + ' (' + t.fokozat + ')').join(', ')}</p>` : null}
    ${lap.varazslatok.length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Varázslatok:</strong> ${lap.varazslatok.map((v) => v.nev_hu).join(', ')}</p>` : null}
    ${lap.fegyvercsoportok.length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Fegyvercsoportok:</strong> ${lap.fegyvercsoportok.map((c) => c.nev_hu).join(', ')}</p>` : null}
    ${teljes ? html`
      ${(adat.felszereles.targyak || []).length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Felszerelés:</strong> ${(adat.felszereles.targyak || []).map((t) => elemNev(ix, V.targyLap(t.id), t.id) + (t.db > 1 ? ' × ' + t.db : '')).join(', ')}. <strong>Pénz:</strong> ${V.penzSzoveg(adat.felszereles.penz_rez || 0)}.</p>` : null}
      ${adat.alap.koncepcio ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Koncepció:</strong> ${adat.alap.koncepcio}</p>` : null}
      ${celok.length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Célok:</strong> ${celok.map((c) => (c.tipus === 'rovid' ? 'rövid távon: ' : 'hosszú távon: ') + c.szoveg).join('; ')}</p>` : null}
      ${(adat.alap.kotelekek || []).filter((k) => k.nev).length ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Kötelékek:</strong> ${adat.alap.kotelekek.filter((k) => k.nev).map((k) => k.nev + (k.leiras ? ' (' + k.leiras + ')' : '')).join('; ')}</p>` : null}
    ` : null}
    ${!teljes && nyitott ? html`<${Uzenet} tonus="warning">${nyitott} figyelmeztetés, lásd az Összegzésben.<//>` : null}
  </div>`;
}

export const LEPES_KOMPONENSEK = {
  keret: Keret, koncepcio: Koncepcio, tulajdonsagok: Tulajdonsagok, faj: Faj, hatter: Hatter,
  osztaly: Osztaly, felszereles: Felszereles, szamitott: Szamitott, nev: NevCelok, osszegzes: Osszegzes
};
