// Kampányjátszó 6.7: pihenés (felület).
// - PihenesParbeszed: szusszanás, alvás (napokra is), meditáció; egy karakterre (karakterlap) vagy a csapatra (Játék nézet).
//   A szusszanás jogosultságát a karakterbe írt utolsó csata mutatja (egy csata után egyszer, 0 Egészségen nem); a DM
//   eltérhet tőle (figyelmeztetéssel). Bekapcsolt Súlyos sebek mellett az alvásnál a körülmény és az első nap.
//   A dobás az appban vagy beírva (Kockadobo, „Dobj” vagy „Beírom”).
// - CsapatPihenes: a Játék nézet Csapat paneljének gombja és a legutóbbi pihenések visszavonással (character.rest,
//   character.rest.undo, backend/Pihenes.gs).
// - KarakterPihenes: a karakterlap Erőforrások blokkjának gombja és a karakter legutóbbi pihenései; helyben ír a
//   karakter adatába (a karakterlap mentése viszi fel).
// Tiszta függvények: web/js/karakter/pihenes.js. Terv: claude/kampanyjatszo-terv.md, „6.7”.
import { html, K, useApp, useState, useMemo, Uzenet, Parbeszed, Megerosites, Jelolo, Sugo } from './kozos.js';
import { Kockadobo } from './kockadobo.js';
import { useLapok } from './probakeres.js';
import { dobas } from '../karakter/varazslo.js';
import * as P from '../karakter/pihenes.js';

const aktivKarakter = (c) => !c.kampany_allapot || c.kampany_allapot === 'aktív';
const ido = (iso) => { const d = new Date(iso); return iso && !isNaN(d) ? d.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
const elojeles = (n) => (n > 0 ? '+' : n < 0 ? '−' : '±') + Math.abs(n);
export const sulyosBe = (kampany) => !!(kampany && Array.isArray(kampany.valasztott_szabalyok) && kampany.valasztott_szabalyok.includes('sulyos_sebek'));

// A párbeszéd. karakterek: [{ id, nev, adat (normalizált), lap }]. kampany: { id, valasztott_szabalyok } vagy null.
// dm: eltérhet a szusszanás szabályától. onKuld({ id, fajta, sorok: [{ karakter_id, bejegyzes }] }) → Promise<bool>.
export function PihenesParbeszed({ karakterek, kampany, dm, egy, onKuld, onBezar }) {
  const { felhasznalo } = useApp();
  const sulyos = sulyosBe(kampany);
  const szAll = useMemo(() => Object.fromEntries(karakterek.map((c) => [c.id, P.szusszanasAllapot(c.adat)])), [karakterek]);
  const vanSzusz = karakterek.some((c) => szAll[c.id].lehet);
  const [fajta, setFajta] = useState(vanSzusz ? 'szusszanas' : 'alvas');
  const [orak, setOrak] = useState('8');
  const [napok, setNapok] = useState('1');
  const [zavartalan, setZavartalan] = useState(true);
  const [korulmeny, setKorulmeny] = useState('jo');
  const [kivalasztott, setKivalasztott] = useState(() => karakterek.map((c) => c.id));
  const [megisAll, setMegis] = useState({}); // DM: szusszanás a szabálytól eltérve
  const [elsoNap, setElsoNap] = useState(() => Object.fromEntries(karakterek.map((c) => [c.id, P.sulyosElsoNap(c.adat, c.lap.egeszseg.aktualis)])));
  const [dobasok, setDobasok] = useState({}); // { [id]: { eg: [], mp: [], kezi } }
  const [fut, setFut] = useState(false);
  const [pid] = useState(P.ujPihenesId);

  const opciok = { fajta, orak: Number(orak) || 0, napok: Number(napok) || 1, zavartalan, korulmeny, sulyos: sulyos && fajta === 'alvas' };
  const sorok = karakterek.map((c) => {
    const t = P.terv(c.lap, { ...opciok, elsoNap: elsoNap[c.id] !== false });
    const d = dobasok[c.id] || {};
    const er = P.eredmeny(t, d);
    const sz = szAll[c.id];
    const tiltott = fajta === 'szusszanas' && !sz.lehet && !megisAll[c.id];
    const be = kivalasztott.includes(c.id) && !tiltott;
    return { c, t, er, d, sz, tiltott, be, kell: P.kellDobas(t) };
  });
  const aktiv = sorok.filter((s) => s.be);
  const hianyzik = aktiv.some((s) => s.er.hianyzik.length);
  const mindDob = () => {
    const uj = { ...dobasok };
    aktiv.forEach((s) => s.kell.forEach((k) => {
      if ((uj[s.c.id] && (uj[s.c.id][k.mire] || []).length === k.db)) return;
      uj[s.c.id] = { ...(uj[s.c.id] || {}), [k.mire]: dobas(k.db, k.oldal) };
    }));
    setDobasok(uj);
  };
  const valtOpcio = (fn) => (x) => { fn(x); setDobasok({}); };
  const kuld = async () => {
    setFut(true);
    const kiosztott = aktiv.map((s) => ({
      karakter_id: s.c.id,
      bejegyzes: P.bejegyzes(s.t, s.er, { id: pid, ki: felhasznalo ? felhasznalo.nev : '', kampanyId: kampany ? kampany.id : '',
        csataId: fajta === 'szusszanas' && s.sz.csata ? s.sz.csata.id : '', dobasok: s.d, sulyosElso: elsoNap[s.c.id] !== false })
    }));
    const ok = await onKuld({ id: pid, fajta, sorok: kiosztott });
    setFut(false);
    if (ok) onBezar();
  };
  const valt = (id, be) => setKivalasztott(be ? kivalasztott.concat([id]) : kivalasztott.filter((x) => x !== id));

  return html`<${Parbeszed} cim=${egy ? 'Pihenés: ' + karakterek[0].nev : 'A csapat pihenése'} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut || !aktiv.length || hianyzik} onClick=${kuld}>${fut ? 'Rögzítés…' : hianyzik ? 'Előbb dobj' : 'Pihenés rögzítése'}<//>`}>
    <div className="verem">
      <div className="kapcsolo kapcsolo--teljes" role="group" aria-label="A pihenés fajtája">
        ${Object.entries(P.FAJTAK).map(([k, f]) => html`<button key=${k} type="button" aria-pressed=${fajta === k} onClick=${() => { setFajta(k); setDobasok({}); }}>${f.nev}</button>`)}
      </div>
      <p className="kicsi halvany" style=${{ margin: 0 }}>${fajta === 'szusszanas' ? '5 perc egy összecsapás után: 5 + Szívósság + szint Egészség. Egy összecsapás után egyszer, és aki a csata végén 0 Egészségen volt, nem kaphatja.'
          : fajta === 'alvas' ? 'Legalább 6 óra: 10 + Szívósság + szint Egészség. Mágiapont: óránként 1d6 + Akaraterő, 8 óra zavartalan pihenés után mind.'
            : 'Csak Mágiapont: óránként 1d6 + Akaraterő, 8 óra zavartalan pihenés után mind.'} (${P.FAJTAK[fajta].oldal})</p>
      ${fajta !== 'szusszanas' ? html`<div className="pihenes-racs">
        ${fajta === 'alvas' ? html`<${K.TextField} label="Napok" inputMode="numeric" value=${napok} hint=${Number(napok) > 1 ? 'Több nap: a Mágiapont mind visszajön.' : 'Egy éjszaka.'}
          onChange=${(e) => valtOpcio(setNapok)(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}/>` : null}
        ${fajta === 'meditacio' || Number(napok) <= 1 ? html`<${K.TextField} label="Órák" inputMode="numeric" value=${orak}
          onChange=${(e) => valtOpcio(setOrak)(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}/>` : null}
      </div>
      ${fajta === 'meditacio' || Number(napok) <= 1 ? html`<${Jelolo} checked=${zavartalan} onChange=${valtOpcio(setZavartalan)}>Zavartalan (8 óra után minden Mágiapont)<//>` : null}` : null}
      ${fajta === 'alvas' && sulyos ? html`<div className="szakasz verem verem--kicsi">
        <p className="cimke" style=${{ margin: 0 }}>Súlyos sebek <${Sugo} cim="Súlyos sebek (Kampányépítő 113. o.)">A kampánykeretben be van kapcsolva. Az alvás
          szokásos gyógyulása csak az első napon jár, utána naponta Szívósságnyi. Rossz pihenés vagy ellátás mellett ennek a fele; rossz
          körülmények vagy fertőzés napi 1d6, nagyon rossz körülmények napi 2d6 sebzést okoznak, gyógyulás nélkül. Az „első nap” akkor jár újra,
          ha a hős az előző ilyen alvás óta megsérült.<//></p>
        <div className="csipek" role="group" aria-label="Körülmények">${Object.entries(P.KORULMENYEK).map(([k, x]) => html`<button key=${k} type="button" className="csip"
          aria-pressed=${korulmeny === k} onClick=${() => valtOpcio(setKorulmeny)(k)}>${x.nev}</button>`)}</div>
        <p className="kicsi halvany" style=${{ margin: 0 }}>${P.KORULMENYEK[korulmeny].leiras}</p>
      </div>` : null}
      ${aktiv.some((s) => s.kell.length) ? html`<div className="gombsor"><${K.Button} size="sm" variant="secondary" onClick=${mindDob}>${egy ? 'Dobj' : 'Dobj mindenkinek'}<//>
        <span className="kicsi halvany">vagy soronként, kockával is beírható</span></div>` : null}
      <ul className="pihenes-lista">${sorok.map((s) => html`<${Sor} key=${s.c.id} s=${s} egy=${egy} dm=${dm} fajta=${fajta} sulyos=${opciok.sulyos}
        elsoNap=${elsoNap[s.c.id] !== false} setElsoNap=${(x) => { setElsoNap({ ...elsoNap, [s.c.id]: x }); }}
        megis=${!!megisAll[s.c.id]} setMegis=${(x) => setMegis({ ...megisAll, [s.c.id]: x })}
        valaszt=${(be) => valt(s.c.id, be)} kivalasztva=${kivalasztott.includes(s.c.id)}
        onDobas=${(mire, k) => setDobasok({ ...dobasok, [s.c.id]: { ...(dobasok[s.c.id] || {}), [mire]: k } })}/>`)}</ul>
    </div>
  <//>`;
}

function Sor({ s, egy, dm, fajta, sulyos, elsoNap, setElsoNap, megis, setMegis, valaszt, kivalasztva, onDobas }) {
  const { c, t, er, d, sz } = s;
  const e = t.ertekek;
  const halvany = !s.be;
  return html`<li className=${'pihenes-sor' + (halvany ? ' pihenes-sor--ki' : '')}>
    <div className="pihenes-sor__fej">
      ${egy ? html`<strong>${c.nev}</strong>` : html`<${Jelolo} checked=${kivalasztva && !s.tiltott} onChange=${valaszt}><strong>${c.nev}</strong><//>`}
      <span className="pihenes-sor__ertekek">
        <span title="Egészség">♥ ${e.eg.aktualis}${s.be && er.eg ? html` → <strong>${er.eg_utana}</strong>` : null} / ${e.eg.max}</span>
        ${e.mp ? html`<span title="Mágiapont">✦ ${e.mp.aktualis}${s.be && er.mp ? html` → <strong>${er.mp_utana}</strong>` : null} / ${e.mp.max}</span>` : null}
      </span>
    </div>
    ${fajta === 'szusszanas' && !sz.lehet ? html`<div className="verem verem--kicsi">
      <${Uzenet} tonus=${sz.ok === 'nincs_csata' ? 'neutral' : 'warning'}>${sz.szoveg}<//>
      ${dm ? html`<${Jelolo} checked=${megis} onChange=${setMegis}>Mégis megkapja (eltérés a szabálytól)<//>` : html`<p className="kicsi halvany" style=${{ margin: 0 }}>Ha megisAll jár, a DM adhatja meg.</p>`}
    </div>` : null}
    ${s.be ? html`
      ${t.eg.keplet || (t.mp && t.mp.keplet) ? html`<p className="kicsi" style=${{ margin: 0 }}>
        ${t.eg.keplet ? html`Egészség: ${t.eg.keplet}${!t.eg.kocka ? ' = ' + t.eg.fix : ''} → <strong>${elojeles(er.eg)}</strong>` : null}
        ${t.eg.keplet && t.mp && t.mp.keplet ? html`<br/>` : null}
        ${t.mp && t.mp.keplet ? html`Mágiapont: ${t.mp.keplet} → <strong>${elojeles(er.mp)}</strong>` : null}
      </p>` : null}
      ${sulyos && !t.eg.kocka ? html`<${Jelolo} checked=${elsoNap} onChange=${setElsoNap}>Jár az első nap szokásos gyógyulása<//>` : null}
      ${s.kell.map((k) => html`<div key=${k.mire} className="pihenes-sor__dobas">
        <span className="kicsi">${k.mire === 'eg' ? 'Sebzés' : 'Mágiapont'}: ${k.db}d${k.oldal}</span>
        <${Kockadobo} db=${k.db} oldal=${k.oldal} kockak=${d[k.mire] || null} kicsi=${true} modValto=${false}
          felirat=${'Dobj ' + k.db + 'd6-tal'} onDobas=${(kk) => onDobas(k.mire, kk)}/>
      </div>`)}
      ${t.figyelmeztetesek.map((f, i) => html`<p key=${i} className="kicsi halvany" style=${{ margin: 0 }}>${f}</p>`)}
    ` : null}
  </li>`;
}

// ================= A Játék nézet Csapat paneljébe =================

const valaszKarakterekbe = (st, kampanyId, valasz) => {
  if (!st || !st.kampany || st.kampany.id !== kampanyId) return null;
  const m = new Map(((valasz && valasz.karakterek) || []).map((x) => [x.id, x]));
  if (!m.size) return null;
  return { ...st, karakterek: (st.karakterek || []).map((c) => (m.has(c.id) ? { ...c, verzio: m.get(c.id).verzio, adat: m.get(c.id).adat } : c)) };
};

function usePihenesHivas(allapot) {
  const { api, sync, uzen } = useApp();
  const kampanyId = allapot && allapot.kampany ? allapot.kampany.id : '';
  const [fut, setFut] = useState(false);
  const hiv = async (action, adat, uzenet) => {
    setFut(true);
    try {
      const v = await api.hivas(action, adat);
      sync.helyiModositas((st) => valaszKarakterekbe(st, kampanyId, v));
      if (uzenet) uzen(uzenet);
      return v;
    } catch (e) {
      uzen(e.kod === 'halozat' ? 'Nincs kapcsolat a szerverrel, most nem rögzíthető.' : (e.message || String(e)), 'danger');
      return null;
    } finally { setFut(false); }
  };
  return { fut, hiv, kampanyId };
}

// A csapat pihenése: gomb a panel fejlécébe, és a legutóbbi pihenések. karakterek: a kampány aktív karakterei.
export function CsapatPihenes({ allapot, dm }) {
  const karakterek = useMemo(() => (allapot.karakterek || []).filter(aktivKarakter).filter((c) => c.adat), [allapot.karakterek]);
  const lapok = useLapok(karakterek);
  const h = usePihenesHivas(allapot);
  const [nyitva, setNyitva] = useState(false);
  const [vissza, setVissza] = useState(null);
  const [mind, setMind] = useState(false);
  const lista = P.csoportok(karakterek, { kampanyId: h.kampanyId });
  const sorok = karakterek.filter((c) => lapok[c.id]).map((c) => ({ id: c.id, nev: c.nev, adat: c.adat, lap: lapok[c.id] }));
  const mutat = mind ? lista.slice(0, 12) : lista.slice(0, 3);
  const kuld = async ({ id, fajta, sorok: s }) => !!(await h.hiv('character.rest', P.csoportKeres({ kampanyId: h.kampanyId, id, fajta, sorok: s }), P.FAJTAK[fajta].nev + ' rögzítve.'));
  return html`<div className="verem verem--kicsi pihenes-blokk pihenes-blokk--csapat">
    <div className="gombsor gombsor--szoros">
      <${K.Button} size="sm" variant="secondary" disabled=${!sorok.length} onClick=${() => setNyitva(true)}>Pihenés<//>
      <${Sugo} cim="Pihenés">Szusszanás egy összecsapás után, alvás (napokra is), meditáció a Mágiapontért; a csapatnak egyszerre, dobással vagy
        beírással. Bekerül a karakterek pihenési naplójába és az alkalom eseménynaplójába, és visszavonható.<//>
    </div>
    ${mutat.length ? html`<ul className="esemenylista">${mutat.map((g) => html`<li key=${g.id} className="esemenylista__sor">
      <span className="esemenylista__jel" aria-hidden="true">☾</span>
      <span className="esemenylista__szoveg">${(P.FAJTAK[g.fajta] || { nev: 'Pihenés' }).nev}: ${g.tetelek.map((t) => t.nev + ' ' + ([t.eg ? elojeles(t.eg) + ' Eg.' : '', t.mp ? elojeles(t.mp) + ' MP' : ''].filter(Boolean).join(' ') || 'változatlan')).join(', ')}
        <span className="halvany kicsi"> · ${ido(g.idopont)}${g.visszavonva ? ', visszavonva' : ''}</span></span>
      ${dm && !g.visszavonva ? html`<button type="button" className="kisgomb" aria-label="Visszavonás" title="Visszavonás" disabled=${h.fut} onClick=${() => setVissza(g)}>↶</button>` : null}
    </li>`)}</ul>` : null}
    ${lista.length > 3 ? html`<button type="button" className="szoveggomb" onClick=${() => setMind(!mind)}>${mind ? 'Kevesebb' : 'Korábbiak'}</button>` : null}
    ${nyitva ? html`<${PihenesParbeszed} karakterek=${sorok} kampany=${allapot.kampany} dm=${dm} onKuld=${kuld} onBezar=${() => setNyitva(false)}/>` : null}
    ${vissza ? html`<${Megerosites} cim="Pihenés visszavonása" gomb="Visszavonom" veszelyes=${true}
      szoveg=${'A(z) ' + (P.FAJTAK[vissza.fajta] || { nev: 'pihenés' }).nev.toLowerCase() + ' (' + ido(vissza.idopont) + ') hatása lekerül a hősökről: ' + vissza.tetelek.map((t) => t.nev).join(', ') + '.'}
      onMegse=${() => setVissza(null)} onIgen=${async () => { const g = vissza; setVissza(null); await h.hiv('character.rest.undo', { kampany_id: h.kampanyId, id: g.id }, 'Visszavonva.'); }}/>` : null}
  </div>`;
}

// ================= A karakterlapra =================

// lap: a számolt lap, adat: a karakter (normalizált) adata, valtoztat: a karakterlap mentése, kampany: a karakter kampánya.
export function KarakterPihenes({ karakter, adat, lap, valtoztat, kampany, dm }) {
  const [nyitva, setNyitva] = useState(false);
  const [mind, setMind] = useState(false);
  const lista = P.naplo(adat);
  const mutat = mind ? lista.slice(0, 10) : lista.slice(0, 2);
  const kuld = async ({ sorok }) => {
    sorok.forEach((s) => valtoztat((d) => { P.alkalmaz(d, s.bejegyzes); }));
    return true;
  };
  return html`<div className="verem verem--kicsi pihenes-blokk">
    <div className="gombsor gombsor--szoros">
      <${K.Button} size="sm" variant="secondary" onClick=${() => setNyitva(true)}>Pihenés<//>
      ${!kampany ? html`<span className="kicsi halvany">nincs kampányban</span>` : null}
    </div>
    ${mutat.length ? html`<ul className="esemenylista">${mutat.map((b) => html`<li key=${b.id} className="esemenylista__sor">
      <span className="esemenylista__jel" aria-hidden="true">☾</span>
      <span className="esemenylista__szoveg">${P.bejegyzesSzoveg(b)}<span className="halvany kicsi"> · ${ido(b.idopont)}</span></span>
      ${!b.visszavonva ? html`<button type="button" className="kisgomb" aria-label="Visszavonás" title="Visszavonás"
        onClick=${() => valtoztat((d) => { P.visszavon(d, b.id); })}>↶</button>` : null}
    </li>`)}</ul>` : null}
    ${lista.length > 2 ? html`<button type="button" className="szoveggomb" onClick=${() => setMind(!mind)}>${mind ? 'Kevesebb' : 'Korábbiak'}</button>` : null}
    ${nyitva ? html`<${PihenesParbeszed} egy=${true} karakterek=${[{ id: karakter.id, nev: adat.nev || karakter.nev, adat, lap }]} kampany=${kampany} dm=${dm}
      onKuld=${kuld} onBezar=${() => setNyitva(false)}/>` : null}
  </div>`;
}
