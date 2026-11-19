// NJK-tár (DM, 3. lépés, 2. ütem): lista, létrehozás (üres, bestiáriumból, fenyegetési sablonból, követő,
// karakterkészítővel), szerkesztő (statblokk, erősítés, különleges képességek, szerep, állapot), a kampány
// NJK panelje és a játékos NJK panelje. Szabályok: web/js/jatek/njk.js és leny.js. Terv: claude/csata-terv.md.
import {
  html, K, useApp, useState, useEffect, useMemo, useLekeres, useMuvelet, navigal, Ikon, Betoltes, Uzenet, Valaszto, Jelolo,
  Parbeszed, Megerosites, Sugo, elojel, idopont
} from './kozos.js';
import { Statblokk } from './bestiarium.js';
import { OsszecsapasbaParbeszed } from './osszecsapas.js';
import { KarakterKep, KepFeltolto } from './kepek.js';
import { ProbaLap } from './proba.js';
import * as LN from '../jatek/leny.js';
import * as N from '../jatek/njk.js';
import * as SZ from '../kampany/szereplo.js';
import { usePrep } from './epito.js';
import {
  NjkMezo, OroklesJel, SzerepLepes, EpitesiModPanel, SzemelyisegLepes, HatterLepes, KapcsolatokLepes, RejtettLepes, ParbeszedLepes,
  FejlodesLepes, OroklesPanel, HolSzerepel
} from './njk_lepesek.js';
import { TUL_NEV } from '../jatek/proba.js';
import { megjelenitettNev } from '../szabalyok.js';
import { karakterSzamol } from '../karakter/szamol.js';
import { atallit, uresKarakter } from '../karakter/adat.js';

const TULAJDONSAGOK = Object.keys(TUL_NEV);
const FOKOZAT = ['', 'Kezdő', 'Haladó', 'Mester'];
const KEZI_CELOK = [
  ...TULAJDONSAGOK.map((t) => ({ value: t, label: TUL_NEV[t] })),
  { value: 'egeszseg_max', label: 'Egészség' }, { value: 'magiapont_max', label: 'Mágiapont' },
  { value: 'vedekezes', label: 'Védekezés' }, { value: 'sebesseg', label: 'Sebesség' }, { value: 'pancelertek', label: 'Páncélérték' }
];
const szam = (x, alap = 0) => (x === '' || x === null || x === undefined || !Number.isFinite(Number(x)) ? alap : Number(x));
const masol = (x) => JSON.parse(JSON.stringify(x));
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || null;
const fajtaNev = (f) => (N.NJK_FAJTAK[f] || N.NJK_FAJTAK.statblokk).nev;
const fenyegetesTonus = (f) => ({ 'Mérsékelt': 'accent', 'Komoly': 'warning', 'Súlyos': 'danger', 'Legendás': 'dragon' }[f]);

// Számmező: gépelés közben szövegként tartja az értéket (a mínuszjel is beírható).
function SzamMezo({ label, value, onChange, hint, ures }) {
  const kifele = value === null || value === undefined || value === '' ? '' : String(value).replace('-', '−');
  const [szoveg, setSzoveg] = useState(kifele);
  useEffect(() => {
    const most = szoveg.replace('−', '-');
    if (most === '' ? kifele !== '' : Number(most) !== Number(String(value))) setSzoveg(kifele);
  }, [value]); // eslint-disable-line
  return html`<${K.TextField} label=${label} hint=${hint} inputMode="numeric" value=${szoveg}
    onChange=${(e) => {
      const s = e.target.value.replace(/[^0-9−-]/g, '').replace('-', '−').slice(0, 4);
      setSzoveg(s);
      const n = parseInt(s.replace('−', '-'), 10);
      if (s === '' && ures) onChange(null);
      else if (Number.isFinite(n)) onChange(n);
    }}/>`;
}

// Az NJK sora a lény-nézethez (a vázlatból is).
const nezetBol = (n, lapok) => (n && lapok ? LN.lenyNezet({ tipus: 'njk', sor: n }, lapok) : null);

// A kampány objektuma a Próba laphoz.
const kampanyProbahoz = (k) => (k ? { id: k.id, cim: k.cim, beallitasok: k.beallitasok } : null);

// ================= NJK-tár oldal =================

// dm: a DM nézetek közös adatai (kampanyok, karakterek, felhasznalok). azon: a kiválasztott NJK.
export function NjkTarOldal({ azon, Oldalfej, dm }) {
  const { api, szabalyok } = useApp();
  const lista = useLekeres(async () => (await api.hivas('npc.list', { archivaltak: true })).njkk, [], 'njkk');
  const [szoveg, setSzoveg] = useState('');
  const [fajta, setFajta] = useState('');
  const [kampany, setKampany] = useState('');
  const [szint, setSzint] = useState('');
  const [szerep, setSzerep] = useState('');
  const [archivalt, setArchivalt] = useState(false);
  const [uj, setUj] = useState(false);
  const osszes = lista.adat || [];
  const szurt = useMemo(() => N.njkSzures(osszes, { szoveg, fajta, kampany, archivalt, szint, szerep }), [osszes, szoveg, fajta, kampany, archivalt, szint, szerep]);
  const karakterNev = (id) => { const c = dm.karakterek.find((x) => x.id === id); return c ? c.nev : ''; };
  const kampanyCim = (id) => { const k = dm.kampanyok.find((x) => x.id === id); return k ? k.cim : ''; };
  const nevSzerint = (id) => { const x = osszes.find((y) => y.id === id); return x ? x.nev : ''; };
  const frissit = (n) => lista.beallit((l) => {
    const regi = l || [];
    const o = { ...n }; delete o.adat;
    if (n.adat) { o.szerepek = SZ.szereploNorm(n.adat.szereplo).szerepek; o.sablon = !!n.adat.sablon; }
    return regi.some((x) => x.id === n.id) ? regi.map((x) => (x.id === n.id ? { ...x, ...o } : x)) : regi.concat([o]);
  });
  const torol = (id) => lista.beallit((l) => (l || []).filter((x) => x.id !== id));
  const archivDb = osszes.filter((n) => n.aktiv === false).length;

  const fej = html`<${Oldalfej} cim=${azon ? 'NJK' : 'NJK-tár'} vissza=${azon ? ['#/dm/njk', 'NJK-tár'] : undefined}>
    <${K.Button} variant=${azon ? 'secondary' : 'primary'} onClick=${() => setUj(true)} icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új NJK<//>
  <//>`;
  if (azon) {
    return html`<div>
      ${fej}
      <${NjkSzerkeszto} key=${azon} id=${azon} dm=${dm} lapok=${lapokBol(szabalyok)}
        onValtozott=${frissit} onTorolve=${(id) => { torol(id); navigal('/dm/njk'); }}/>
      ${uj ? html`<${UjNjkParbeszed} dm=${dm} onBezar=${() => setUj(false)}
        onLetrejott=${(n) => { setUj(false); frissit(n); navigal('/dm/njk/' + n.id); }}/>` : null}
    </div>`;
  }
  return html`<div>
    ${fej}
    <div className="ket-hasab njktar">
      <div className="verem">
        <${K.Panel} title="Keresés">
          <div className="verem">
            <${K.TextField} label="Név vagy koncepció" value=${szoveg} onChange=${(e) => setSzoveg(e.target.value)}/>
            <div className="sorban">
              <${Valaszto} label="Szint" value=${szint} onChange=${setSzint} ures="mind"
                opciok=${Object.entries(SZ.SZINTEK).map(([k, x]) => ({ value: k, label: k === 'szabad' ? 'kampány (szabad)' : x.toLowerCase() }))}/>
              <${Valaszto} label="Szerep" value=${szerep} onChange=${setSzerep} ures="mind"
                opciok=${[{ value: '_nincs', label: 'szerep nélkül' }].concat(Object.entries(SZ.SZEREPEK).map(([k, x]) => ({ value: k, label: x.nev })))}/>
            </div>
            <div className="sorban">
              <${Valaszto} label="Fajta" value=${fajta} onChange=${setFajta} ures="mind"
                opciok=${Object.entries(N.NJK_FAJTAK).map(([k, f]) => ({ value: k, label: f.nev }))}/>
              <${Valaszto} label="Kampány" value=${kampany} onChange=${setKampany} ures="mind"
                opciok=${[{ value: '_nincs', label: 'kampány nélkül' }].concat(dm.kampanyok.map((k) => ({ value: k.id, label: k.cim })))}/>
            </div>
            ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
            <p className="halvany kicsi">${szurt.length} / ${osszes.filter((n) => archivalt || n.aktiv !== false).length} NJK</p>
          </div>
        <//>
      </div>
      <div>
        ${lista.hiba && !lista.adat ? html`<${Uzenet}>${lista.hiba.message}<//>` : !lista.adat ? html`<${Betoltes}/>` : html`
        <ul className="sorlista bestiarium__talalatok" aria-label="NJK-k">
          ${szurt.map((n) => html`<li key=${n.id} className=${'sorlista__sor' + (n.aktiv === false ? ' tablazat__sor--halvany' : '')}>
            <a className="sorgomb-teljes" href=${'#/dm/njk/' + n.id}>
              <span className="nevsor"><${KarakterKep} kep=${n.kep} nev=${n.nev}/>
                <span><strong>${n.nev}</strong> ${N.njkSzintje(n) !== 'szabad' ? html`<${K.Badge} tone=${N.njkSzintje(n) === 'vilag' ? 'accent' : 'neutral'}>${SZ.SZINTEK[N.njkSzintje(n)]}<//>` : null}
                  ${n.aktiv === false ? html` <${K.Badge}>Archivált<//>` : null}<br/>
                <span className="halvany kicsi">${[(n.szerepek || []).map((r) => (SZ.SZEREPEK[r] || {}).nev).filter(Boolean).join(', '), fajtaNev(n.fajta), n.fenyegetes, N.kotodesSzoveg(n, karakterNev),
                  (n.kampanyok || []).map(kampanyCim).filter(Boolean).join(', '), n.alap_id ? '↳ ' + (nevSzerint(n.alap_id) || 'alap') : ''].filter(Boolean).join(' · ')}</span></span></span>
            </a>
          </li>`)}
          ${!szurt.length ? html`<li className="sorlista__sor halvany">${osszes.length ? 'Nincs találat.' : 'Még nincs NJK. Hozz létre egyet, vagy másold a Bestiáriumból.'}</li>` : null}
        </ul>`}
      </div>
    </div>
    ${uj ? html`<${UjNjkParbeszed} dm=${dm} onBezar=${() => setUj(false)}
      onLetrejott=${(n) => { setUj(false); frissit(n); navigal('/dm/njk/' + n.id); }}/>` : null}
  </div>`;
}

// ================= Új NJK =================

const MODOK = [
  { value: 'ures', label: 'Üres statblokk' },
  { value: 'rovid', label: 'Rövid NJK' },
  { value: 'szorny', label: 'A Bestiáriumból' },
  { value: 'sablon', label: 'Fenyegetési sablonból' },
  { value: 'koveto', label: 'Követő, társ' },
  { value: 'karakter', label: 'Karakterkészítővel' },
  { value: 'alap', label: 'Változat egy meglévő NJK-ra építve' }
];

// A követő ajánlott Egészsége: a gazda karakter felének, csapatnál a második legkisebb Egészségű karakter fele.
async function kovetoEgeszsegSzamol(api, lapok, kotodes, kampanyId) {
  const egeszseg = (adat) => karakterSzamol(atallit(adat || {}), lapok).egeszseg.ertek;
  if (kotodes && kotodes !== 'csapat') {
    const c = (await api.hivas('character.get', { id: kotodes })).karakter;
    return N.kovetoEgeszseg(egeszseg(c.adat));
  }
  if (!kampanyId) throw new Error('A csapat követőjéhez válassz kampányt.');
  const all = await api.hivas('state.get', { kampany_id: kampanyId });
  const aktivak = all.karakterek.filter((c) => c.adat && (!c.kampany_allapot || c.kampany_allapot === 'aktív'));
  const e = N.csapatKovetoEgeszseg(aktivak.map((c) => egeszseg(c.adat)));
  if (e === null) throw new Error('A kampányban nincs aktív karakter.');
  return e;
}

// kampanyId: előre kiválasztott kampány; szorny: a Bestiárium „Másolat az NJK-tárba” gombjából érkező szörny sora.
// szint: 'szabad' | 'vilag' | 'sablon' (5.5), vilagId: a világ-NJK világa, szerep: előre kijelölt szerep (a Szereplők nézetből).
export function UjNjkParbeszed({ dm, onBezar, onLetrejott, kampanyId = '', szorny = null, szint: kezdoSzint = 'szabad', vilagId = '', szerep = '', kezdoMod = '' }) {
  const { api, szabalyok, uzen } = useApp();
  const lapok = lapokBol(szabalyok);
  const [mod, setMod] = useState(szorny ? 'szorny' : kezdoMod || 'ures');
  const [szint, setSzint] = useState(kezdoSzint);
  const [vilag, setVilag] = useState(vilagId);
  const [alapId, setAlapId] = useState('');
  const [minta, setMinta] = useState('');
  const njkk = useLekeres(async () => (await api.hivas('npc.list', { archivaltak: true })).njkk, [], 'njkk');
  const prepS = useLekeres(() => api.hivas('prep.get', {}), [], 'prep.sablon');
  const vilagok = ((prepS.adat && prepS.adat.vilagok) || []).filter((w) => w.aktiv !== false);
  // a Companion követőmintái (99.) és a Kampányépítő társmintái (76–77., Import 14)
  const mintaSorai = (id, honnan) => { const t = ((lapok && lapok['Dobótáblák']) || []).find((x) => x.id === id); return t && t.reszletek && t.reszletek.sorok ? t.reszletek.sorok.map((m) => ({ ...m, honnan })) : []; };
  const mintak = mintaSorai('dt_koveto_minta', 'Companion 99.').concat(mintaSorai('dt_tars_minta', 'Kampányépítő 76–77.'));
  const celNjk = { id: '', vilag_id: szint === 'vilag' ? vilag : '', adat: szint === 'sablon' ? { sablon: true } : {} };
  const alapJeloltek = SZ.alapJeloltek(celNjk, njkk.adat || [], new Map((njkk.adat || []).map((x) => [x.id, x])));
  const [nev, setNev] = useState(szorny ? szorny.nev_hu : '');
  const [kampany, setKampany] = useState(kampanyId);
  const [szornyId, setSzornyId] = useState(szorny ? szorny.id : '');
  const [szornyKeres, setSzornyKeres] = useState('');
  const [tarsallat, setTarsallat] = useState(false);
  const [fenyegetes, setFenyegetes] = useState('Csekély');
  const [kotodes, setKotodes] = useState('csapat');
  const [egeszseg, setEgeszseg] = useState(10);
  const [jatekos, setJatekos] = useState('');
  const [fut, indit] = useMuvelet();
  const szornyek = (lapok && lapok['Szörnyek']) || [];
  const szornyLista = LN.szornySzures(szornyek, { szoveg: szornyKeres });
  const valasztottSzorny = szornyek.find((s) => s.id === szornyId) || null;
  const karakterek = dm.karakterek.filter((c) => c.aktiv && (!kampany || (c.kampanyok || []).includes(kampany)));

  const letrehoz = () => indit(async () => {
    const neve = nev.trim() || (valasztottSzorny ? valasztottSzorny.nev_hu : '');
    if (!neve) throw new Error('Adj nevet az NJK-nak.');
    if (mod === 'karakter') {
      const v = await api.hivas('character.create', { nev: neve, adat: uresKarakter({ nev: neve }), jatekos_id: jatekos, kampany_id: kampany || undefined, njk: true });
      dm.karakterFrissit(v.karakter);
      onBezar();
      navigal('/dm/karakter/' + v.karakter.id + '/keszites');
      return;
    }
    let n;
    if (mod === 'alap') {
      if (!alapId) throw new Error('Válaszd ki, melyik NJK-ra épüljön.');
      const a = (await api.hivas('npc.get', { id: alapId })).njk;
      n = SZ.peldany(a, { nev: neve });
    } else if (mod === 'rovid') n = N.uresNjk({ nev: neve, fajta: 'rovid' });
    else if (mod === 'szorny') {
      if (!valasztottSzorny) throw new Error('Válassz lényt a Bestiáriumból.');
      n = N.njkSzornybol(valasztottSzorny, { nev: neve, fajta: tarsallat ? 'koveto' : 'statblokk' });
      if (tarsallat) n.kotodes = kotodes;
    } else if (mod === 'sablon') n = N.njkSablonbol(fenyegetes, neve);
    else if (mod === 'koveto') {
      n = N.njkKovetoSablon(neve, { egeszseg }); n.kotodes = kotodes;
      if (minta !== '' && mintak[Number(minta)]) n = SZ.kovetoMintabol(n, mintak[Number(minta)].ertek);
    } else n = N.uresNjk({ nev: neve, fajta: 'statblokk' });
    n.kampanyok = kampany && szint !== 'sablon' ? [kampany] : [];
    if (szint === 'sablon') { n.sablon = true; n.kotodes = ''; n.vilag_id = ''; }
    else if (szint === 'vilag') { if (!vilag) throw new Error('Válassz világot.'); n.vilag_id = vilag; }
    if (szerep && SZ.SZEREPEK[szerep]) n.adat = { ...n.adat, szereplo: { ...((n.adat || {}).szereplo || {}), szerepek: [szerep] } };
    const v = await api.hivas('npc.save', n);
    onLetrejott(v.njk);
  }, mod === 'karakter' ? 'Létrejött a karakter-szintű NJK, jöhet a karakterkészítés.' : 'Létrejött az NJK.');

  const ajanlott = () => indit(async () => {
    const e = await kovetoEgeszsegSzamol(api, lapok, kotodes, kampany);
    setEgeszseg(e);
    uzen(`Ajánlott Egészség: ${e}.`);
  });

  return html`<${Parbeszed} cim="Új NJK" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${letrehoz}>${mod === 'karakter' ? 'Tovább a karakterkészítőre' : 'Létrehozás'}<//>`}>
    <div className="verem">
      <div className="sorban">
        <${Valaszto} label="Szint" value=${szint} onChange=${(x) => { setSzint(x); setAlapId(''); if (mod === 'karakter' && x !== 'szabad') setMod('ures'); }}
          opciok=${[{ value: 'szabad', label: 'Kampány-NJK' }, { value: 'vilag', label: 'Világ-NJK (több kampányban visszatér)' }, { value: 'sablon', label: 'Sablon (világtól független minta)' }]}/>
        ${szint === 'vilag' ? html`<${Valaszto} label="Világ" value=${vilag} onChange=${setVilag} ures="válassz…" opciok=${vilagok.map((w) => ({ value: w.id, label: w.nev }))}/>` : null}
      </div>
      <${Valaszto} label="Hogyan készüljön" value=${mod} onChange=${setMod} opciok=${MODOK.filter((m) => m.value !== 'karakter' || szint === 'szabad')}/>
      <p className="sugo">${{
        ures: 'Teljes statblokk üresen: a tulajdonságokat, támadásokat és képességeket te adod meg.',
        rovid: 'Nem harcoló szereplő: csak tulajdonságok és fókuszok (Alapkönyv 105.).',
        szorny: 'A bestiáriumi lény másolata; utána szabadon módosítható és erősíthető (elit, hősi, epikus).',
        sablon: 'A Companion 104. táblázata: a felület kiírja a pontkeretet, az ajánlott Egészséget és Mágiapontot; eltérésnél csak figyelmeztet.',
        koveto: 'Két-három tulajdonság 2-es, néhány 1-es, 2–3 fókusz és feladatok; Egészség a gazda felének (Companion 98–99., Kampányépítő 75–76.).',
        karakter: 'Kiemelt NJK a karakterkészítővel, játékos nélkül; a csapattal együtt léphet szintet (Companion 103.). A könyv így javasolja a csapattagot építeni.',
        alap: 'Az új NJK az alapjára épül: csak az eltéréseit írod át, a többit örökli, és követi az alapja változásait (például a világ öreg kalmárjának kampánybeli, sebesült változata).'
      }[mod]}</p>
      ${mod === 'alap' ? html`<${Valaszto} label="Erre épül" value=${alapId} onChange=${(id) => { setAlapId(id); const a = (njkk.adat || []).find((x) => x.id === id); if (a && !nev.trim()) setNev(a.nev); }} ures="Válassz…"
        opciok=${alapJeloltek.map((x) => ({ value: x.id, label: x.nev + ' (' + SZ.SZINTEK[SZ.njkSzint(x)].toLowerCase() + ')' }))}/>` : null}
      <${K.TextField} label="Név" value=${nev} onChange=${(e) => setNev(e.target.value)} placeholder=${mod === 'szorny' && valasztottSzorny ? valasztottSzorny.nev_hu : ''}/>
      ${szint !== 'sablon' ? html`<${Valaszto} label="Kampány" value=${kampany} onChange=${setKampany} ures="egyelőre egyik sem"
        hint="Az NJK később bármennyi kampányhoz rendelhető." opciok=${dm.kampanyok.map((k) => ({ value: k.id, label: k.cim }))}/>` : null}
      ${mod === 'szorny' ? html`<div className="verem">
        <${K.TextField} label="Keresés a Bestiáriumban" value=${szornyKeres} onChange=${(e) => setSzornyKeres(e.target.value)} placeholder="például farkas, Wolf"/>
        <${Valaszto} label="Lény" value=${szornyId} onChange=${(id) => { setSzornyId(id); const s = szornyek.find((x) => x.id === id); if (s && !nev.trim()) setNev(s.nev_hu); }} ures="Válassz…"
          opciok=${szornyLista.slice(0, 150).map((s) => ({ value: s.id, label: `${s.nev_hu} (${s.fenyegetes})` }))}/>
        <${Jelolo} checked=${tarsallat} onChange=${setTarsallat}>Társállat (követőként, Kampányépítő 76.)<//>
      </div>` : null}
      ${mod === 'sablon' ? html`<${Valaszto} label="Fenyegetés" value=${fenyegetes} onChange=${setFenyegetes}
        opciok=${N.FENYEGETESI_SABLONOK.map((s) => ({ value: s.nev, label: `${s.nev}: ${s.pont} pont (legfeljebb ${s.max}), ${s.fokusz} fókusz, ${s.talentum} talentumfok` }))}/>` : null}
      ${(mod === 'koveto' || (mod === 'szorny' && tarsallat)) && szint !== 'sablon' ? html`<${Valaszto} label="Kötődés" value=${kotodes} onChange=${setKotodes}
        opciok=${[{ value: 'csapat', label: 'a csapat' }].concat(karakterek.map((c) => ({ value: c.id, label: c.nev + ' (karakter)' })))}/>` : null}
      ${mod === 'koveto' && mintak.length ? html`<${Valaszto} label="Minta" value=${minta} onChange=${(x) => { setMinta(x); const m = mintak[Number(x)]; if (m && !nev.trim()) setNev(m.e); }} ures="üres követő"
        opciok=${mintak.map((m, i) => ({ value: String(i), label: m.e + ' (' + m.honnan + ')' + (m.ertek && m.ertek.feladatok ? ': ' + m.ertek.feladatok.slice(0, 2).join(', ') : '') }))}/>` : null}
      ${mod === 'koveto' ? html`<div className="sorban">
        <${SzamMezo} label="Egészség" value=${egeszseg} onChange=${setEgeszseg}/>
        <${K.Button} variant="secondary" disabled=${fut} onClick=${ajanlott}>Ajánlott érték<//>
      </div>` : null}
      ${mod === 'karakter' ? html`<${Valaszto} label="Játékos" value=${jatekos} onChange=${setJatekos} ures="nincs (a DM irányítja)"
        hint="A „félig játékos karakter”: néha vendég vagy hiányzó játékos is viheti." opciok=${dm.felhasznalok.filter((f) => f.aktiv).map((f) => ({ value: f.id, label: f.nev }))}/>` : null}
    </div>
  <//>`;
}

// ================= Szerkesztő =================

export function NjkSzerkeszto({ id, dm, lapok, onValtozott, onTorolve }) {
  const { api, sync, uzen } = useApp();
  const lekeres = useLekeres(async () => (await api.hivas('npc.get', { id })).njk, [id], 'njk.' + id);
  const lista = useLekeres(async () => (await api.hivas('npc.list', { archivaltak: true })).njkk, [], 'njkk');
  const [vazlat, setVazlat] = useState(null);
  const [alap, setAlap] = useState(null);
  const [kerdes, setKerdes] = useState(null);
  const [fut, indit] = useMuvelet();
  const [naploKampany, setNaploKampany] = useState('');
  const [osszecsapasba, setOsszecsapasba] = useState(false);
  const [lepes, setLepes] = useState('alap');
  const [nezetKampany, setNezetKampany] = useState('');
  const n = lekeres.adat;
  // a betöltött (vagy máshol mentett) változat; a még nem szerkesztett vázlat követi
  useEffect(() => {
    if (!n) return;
    const friss = masol(n);
    setVazlat((v) => (!v || !alap || JSON.stringify(v) === JSON.stringify(alap) || v.id !== friss.id ? friss : v));
    setAlap(friss);
    setNaploKampany((k) => k || (friss.kampanyok || [])[0] || '');
  }, [n && n.id, n && n.verzio]);
  // az öröklés alapja (teljes adattal)
  const alapId = vazlat && vazlat.alap_id;
  const alapLek = useLekeres(async () => (alapId ? (await api.hivas('npc.get', { id: alapId })).njk : null), [alapId], alapId ? 'njk.' + alapId : null);
  const alapNjk = alapId ? alapLek.adat : null;
  // a nézet (kapcsolatok, hivatkozások): világ-NJK-nál a világ, különben a választott kampány, sablonnál a sablonok
  const szint = vazlat ? SZ.njkSzint(vazlat) : 'szabad';
  const kampanyai = vazlat ? (vazlat.kampanyok || []) : [];
  const nezetK = kampanyai.includes(nezetKampany) ? nezetKampany : kampanyai[0] || '';
  const cel = useMemo(() => (szint === 'vilag' ? { szint: 'vilag', vilag_id: vazlat.vilag_id }
    : nezetK ? { szint: 'kampany', kampany_id: nezetK } : { szint: 'sablon' }), [szint, vazlat && vazlat.vilag_id, nezetK]);
  const prep = usePrep(cel);
  if (lekeres.hiba && !n) return html`<${Uzenet}>${lekeres.hiba.message}<//>`;
  if (!vazlat || !lapok) return html`<${Betoltes}/>`;
  const valtozott = JSON.stringify(vazlat) !== JSON.stringify(alap);
  const adat = vazlat.adat || {};
  const sb = adat.statblokk || {};
  const set = (valt) => setVazlat((v) => ({ ...v, ...valt }));
  const setAdat = (fn) => setVazlat((v) => ({ ...v, adat: fn(masol(v.adat || {})) }));
  const setSb = (fn) => setAdat((a) => { a.statblokk = fn(a.statblokk || N.uresStatblokk()); return a; });
  const p = { v: vazlat, alap: alapNjk, setUt: (ut, x) => setVazlat((v) => SZ.utBeallit(v, ut, x)), visszaallit: (ut) => setVazlat((v) => SZ.visszaallit(v, ut, alapNjk)) };
  const nezet = nezetBol(vazlat, lapok);
  const karakterNev = (kid) => { const c = dm.karakterek.find((x) => x.id === kid); return c ? c.nev : ''; };
  const osszes = lista.adat || [];
  const vilagok = (prep.adat && prep.adat.vilagok) || [];

  const ment = () => indit(async () => {
    try {
      const v = await api.hivas('npc.save', {
        id: vazlat.id, verzio: alap.verzio, nev: vazlat.nev, fajta: vazlat.fajta, alap_szorny: vazlat.alap_szorny || '',
        fenyegetes: vazlat.fenyegetes || '', kampanyok: vazlat.kampanyok || [], kotodes: vazlat.kotodes || '', iranyito: vazlat.iranyito || '',
        vilag_id: vazlat.vilag_id || '', alap_id: vazlat.alap_id || '', adat: vazlat.adat
      });
      setAlap(masol(v.njk)); setVazlat(masol(v.njk));
      lekeres.beallit(v.njk);
      onValtozott(v.njk);
      if (SZ.peldanyai(v.njk.id, osszes).length) lista.ujra();
    } catch (e) {
      if (e.kod === 'utkozes') { await lekeres.ujra(); throw new Error('Közben máshol is módosították ezt az NJK-t. Betöltöttem a frisset; a módosításaidat írd át újra.'); }
      throw e;
    }
  }, 'NJK mentve.');
  const archival = (aktiv) => indit(async () => {
    if (valtozott) throw new Error('Előbb mentsd vagy vesd el a módosításokat.');
    const v = await api.hivas('npc.archive', { id: vazlat.id, aktiv });
    lekeres.beallit((x) => ({ ...x, aktiv: v.njk.aktiv }));
    setVazlat((x) => ({ ...x, aktiv: v.njk.aktiv })); setAlap((x) => ({ ...x, aktiv: v.njk.aktiv }));
    onValtozott(v.njk);
  }, aktiv ? 'Az NJK visszaállítva.' : 'Az NJK archiválva.');
  const torol = () => indit(async () => {
    await api.hivas('npc.delete', { id: vazlat.id });
    onTorolve(vazlat.id);
  }, vazlat.nev + ' véglegesen törölve.');
  const ujNjk = async (uj, uzenet) => {
    const v = await api.hivas('npc.save', uj);
    onValtozott(v.njk);
    lista.ujra();
    navigal('/dm/njk/' + v.njk.id);
    uzen(uzenet);
  };
  const masolat = () => indit(() => ujNjk({ ...N.njkMasolat(vazlat, `${vazlat.nev} (másolat)`), vilag_id: vazlat.vilag_id || '' }, 'Elkészült a másolat.'));
  const muveletek = {
    alapValt: (aid) => setVazlat((v) => ({ ...v, alap_id: aid || '' })),
    levalaszt: () => setKerdes('levalaszt'),
    sablonKeszit: () => indit(() => ujNjk(SZ.sablonbol(vazlat), 'Sablon készült (Sablontár, NJK-sablonok).')),
    valtozat: (c) => indit(() => {
      const [t, x] = c.split(':');
      return ujNjk(SZ.peldany(vazlat, t === 'w' ? { vilag_id: x } : { kampanyok: x ? [x] : [] }),
        'Változat készült: csak az eltéréseket kell átírni, a többit az alapjától örökli.');
    }),
    emel: () => setKerdes('emel')
  };

  const naploKampanyObj = dm.kampanyok.find((k) => k.id === naploKampany) || null;
  const naploz = (dobas) => sync.push({ action: 'roll.log', adat: dobas }).catch((e) => uzen('A dobás nem került a naplóba: ' + e.message, 'danger'));
  const harcolo = vazlat.fajta !== 'rovid';
  const allapotok = SZ.lepesAllapot(vazlat);
  if (vazlat.id && ((prep.adat && prep.adat.kapcsolatok) || []).some((k) => k.aktiv !== false && (k.honnan === vazlat.id || k.hova === vazlat.id))) allapotok.kapcsolatok = 'kesz';
  const figy = SZ.figyelmeztetesek(vazlat);
  const aktiv = SZ.LEPESEK.some((l) => l.kulcs === lepes) ? lepes : 'alap';
  const ix = SZ.LEPESEK.findIndex((l) => l.kulcs === aktiv);
  const lepj = (k) => { setLepes(k); window.scrollTo(0, 0); };
  const statJel = (ut) => html`<${OroklesJel} v=${vazlat} alap=${alapNjk} ut=${ut} onVissza=${() => p.visszaallit(ut)}/>`;

  const tartalom = {
    alap: html`<div className="verem">
      <${K.Panel} title="Alapadatok">
        <div className="verem">
          ${vazlat.aktiv === false ? html`<${Uzenet} tonus="warning">Archivált NJK: a kampányok és a játékosok nem látják.<//>` : null}
          <${AlapadatSzerk} v=${vazlat} set=${set} dm=${dm} jel=${statJel} sablon=${szint === 'sablon'}/>
          ${vazlat.id ? html`<${KepFeltolto} karakterId=${vazlat.id} kep=${(adat.szerep || {}).kep || null} nev=${vazlat.nev} muvelet="npc.image.set"
            onKesz=${(v) => {
              const kepes = (x) => ({ ...x, verzio: v.verzio, modositva: v.modositva, adat: { ...x.adat, szerep: { ...(x.adat.szerep || {}), kep: v.kep } } });
              setVazlat(kepes); setAlap(kepes); lekeres.beallit(kepes);
              onValtozott({ id: vazlat.id, verzio: v.verzio, kep: v.kep ? v.kep.belyeg : '' });
            }}/>` : null}
          <${NjkMezo} p=${p} ut="adat.szerep.dm_jegyzet" label="DM-jegyzet" multiline=${true} rows=${2} hint="Csak te látod."/>
        </div>
      <//>
      <${OroklesPanel} v=${vazlat} alap=${alapNjk} osszes=${osszes} vilagok=${vilagok} kampanyok=${dm.kampanyok} muveletek=${muveletek}
        valtozott=${valtozott} visszaallit=${p.visszaallit}/>
      ${figy.length ? html`<${K.Panel} title="Figyelmeztetések">
        <ul className="egyszeru-lista">${figy.map((f, i) => html`<li key=${i}><button type="button" className="szoveggomb" onClick=${() => lepj(f.lepes)}>${(SZ.LEPESEK.find((l) => l.kulcs === f.lepes) || {}).nev}</button>: ${f.szoveg}</li>`)}</ul>
      <//>` : null}
      <${HolSzerepel} v=${vazlat} prep=${prep} cel=${cel}/>
    </div>`,
    szerep: html`<${SzerepLepes} p=${p} dm=${dm}/>`,
    kepessegek: html`<div className="verem">
      <${EpitesiModPanel} p=${p} fenyegetesek=${LN.FENYEGETESEK}/>
      <${K.Panel} title=${html`Statblokk ${statJel('adat.statblokk')}`}>
        <${StatblokkSzerk} sb=${sb} setSb=${setSb} lapok=${lapok} rovid=${!harcolo}/>
      <//>
      ${harcolo ? html`<${K.Panel} title=${html`Erősítés és fejlesztés ${statJel('adat.erosites')}`}>
        <${ErositesSzerk} adat=${adat} setAdat=${setAdat} lapok=${lapok} nezet=${nezet}/>
      <//>` : null}
      ${harcolo ? html`<${K.Panel} title="Különleges képességek">
        <${KepessegSzerk} adat=${adat} setAdat=${setAdat} lapok=${lapok}/>
      <//>` : null}
      ${vazlat.fajta === 'statblokk' && vazlat.fenyegetes ? html`<${SablonPanel} sb=${sb} fenyegetes=${vazlat.fenyegetes} setSb=${setSb}/>` : null}
      ${vazlat.fajta === 'koveto' ? html`<${KovetoPanel} v=${vazlat} setAdat=${setAdat} setSb=${setSb} lapok=${lapok} karakterNev=${karakterNev}/>` : null}
    </div>`,
    szemelyiseg: html`<${SzemelyisegLepes} p=${p}/>`,
    hatter: html`<${HatterLepes} p=${p}/>`,
    kapcsolatok: html`<${KapcsolatokLepes} p=${p} prep=${prep} cel=${cel}/>`,
    rejtett: html`<${RejtettLepes} p=${p} lapok=${lapok} setSb=${setSb}/>`,
    parbeszed: html`<${ParbeszedLepes} p=${p}/>`,
    fejlodes: html`<${FejlodesLepes} p=${p}/>`,
    allapot: html`<div className="verem">
      ${harcolo ? html`<${K.Panel} title="Állapot (a csatán túl)">
        <${AllapotSzerk} allapot=${adat.allapot || {}} nezet=${nezet} setAllapot=${(fn) => setAdat((a) => { a.allapot = fn(a.allapot || {}); return a; })}/>
      <//>` : null}
      ${(adat.szereplesek || []).length ? html`<${K.Panel} title="Szereplések">
        <ul className="egyszeru-lista">${adat.szereplesek.slice().reverse().map((s, i) => html`<li key=${i}>${[s.cim || s.csata, dm.kampanyok.find((k) => k.id === s.kampany_id) ? dm.kampanyok.find((k) => k.id === s.kampany_id).cim : '', s.idopont ? idopont(s.idopont) : ''].filter(Boolean).join(' · ')}</li>`)}</ul>
      <//>` : null}
      <div>
        <${Valaszto} label="A próba naplója" value=${naploKampany} onChange=${setNaploKampany} ures="kampány nélkül (az NJK dobásai)"
          opciok=${dm.kampanyok.filter((k) => (vazlat.kampanyok || []).includes(k.id)).map((k) => ({ value: k.id, label: k.cim }))}/>
      </div>
      ${nezet ? html`<${Statblokk} nezet=${nezet} r=${sb} lapok=${lapok} leiras=${(adat.szerep || {}).nyilvanos}
        naplo=${{ kampany: kampanyProbahoz(naploKampanyObj), njk: { id: vazlat.id, nev: vazlat.nev }, naploz, rejtettLehet: !!naploKampanyObj }}/>` : null}
      <${K.Panel} title="Másolat, összecsapás, archiválás">
        <div className="gombsor">
          <${K.Button} disabled=${fut} onClick=${masolat}>Másolat készítése<//>
          ${vazlat.aktiv !== false && szint !== 'sablon' ? html`<${K.Button} disabled=${fut} onClick=${() => setOsszecsapasba(true)}>Összecsapásba<//>` : null}
          ${vazlat.aktiv === false
            ? html`<${K.Button} disabled=${fut} onClick=${() => archival(true)}>Visszaállítás<//><${K.Button} variant="danger" disabled=${fut} onClick=${() => setKerdes('torol')}>Végleges törlés<//>`
            : html`<${K.Button} disabled=${fut} onClick=${() => setKerdes('archival')}>Archiválás<//>`}
        </div>
        <p className="halvany kicsi">A másolat önálló, a jelenlegi mentett állapotból készül (például „a farkasfalka vezére” a farkasból), kép és szereplések nélkül. Ha az eredetit követnie kell, válassz inkább „Változat”-ot az Alapadatoknál.</p>
      <//>
    </div>`
  };

  return html`<div className="verem njk-szerk">
    <div className="njk-szerk__fej">
      <${KarakterKep} kep=${(adat.szerep || {}).kep ? ((adat.szerep || {}).kep.belyeg || '') : ''} nev=${vazlat.nev}/>
      <h2>${vazlat.nev || 'Névtelen NJK'}</h2>
      <${K.Badge} tone=${szint === 'sablon' ? 'neutral' : szint === 'vilag' ? 'accent' : 'success'}>${SZ.SZINTEK[szint]}<//>
      ${sz0(adat).szerepek.map((r) => html`<${K.Badge} key=${r}>${SZ.SZEREPEK[r].nev}<//>`)}
      <span style=${{ flex: 1 }}></span>
      ${valtozott ? html`<span className="halvany kicsi">Mentetlen módosítások (most ${alap.verzio}. verzió)</span>`
        : html`<span className="halvany kicsi">${alap.verzio}. verzió · ${idopont(alap.modositva)}${vazlat.alap_szorny ? ' · lény: ' + (megjelenitettNev((lapok['Szörnyek'] || []).find((s) => s.id === vazlat.alap_szorny)) || vazlat.alap_szorny) : ''}</span>`}
      ${valtozott ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => setVazlat(masol(alap))}>Elvetés<//>` : null}
      <${K.Button} size="sm" variant="primary" disabled=${fut || !valtozott} onClick=${ment}>Mentés<//>
    </div>
    <div className="keret">
      <nav className="keret__lepesek" aria-label="Az NJK lépései">
        <p className="cimke">A könyv lépései</p>
        <ul className="lepeslista">${SZ.LEPESEK.map((l, i) => {
          const f = figy.filter((x) => x.lepes === l.kulcs).length;
          return html`<li key=${l.kulcs}><button type="button" aria-current=${l.kulcs === aktiv ? 'step' : undefined} onClick=${() => lepj(l.kulcs)}>
            <span className=${'lepeslista__pont' + (allapotok[l.kulcs] === 'kesz' ? ' lepeslista__pont--kesz' : allapotok[l.kulcs] === 'resz' ? ' lepeslista__pont--resz' : '')}>${allapotok[l.kulcs] === 'kesz' ? '✓' : i === 0 ? '•' : i}</span>${l.nev}
            ${f ? html`<span className="lepeslista__figy" title="figyelmeztetés">⚠</span>` : null}</button></li>`;
        })}</ul>
        ${szint !== 'vilag' && kampanyai.length > 1 ? html`<${Valaszto} label="Kapcsolatok és hivatkozások nézete" value=${nezetK} onChange=${setNezetKampany}
          opciok=${dm.kampanyok.filter((k) => kampanyai.includes(k.id)).map((k) => ({ value: k.id, label: k.cim }))}/>` : null}
        <p className="halvany kicsi">Minden lépés kihagyható. A szerepjátékos tervezést (szerep, személyiség, háttér, rejtett vonások) a játékosok nem látják.</p>
      </nav>
      <div className="verem keret__tartalom">
        ${tartalom[aktiv]}
        <div className="gombsor elem__lepesgombok">
          ${ix > 0 ? html`<${K.Button} variant="secondary" onClick=${() => lepj(SZ.LEPESEK[ix - 1].kulcs)}>← ${SZ.LEPESEK[ix - 1].nev}<//>` : null}
          ${ix < SZ.LEPESEK.length - 1 ? html`<${K.Button} variant="secondary" onClick=${() => lepj(SZ.LEPESEK[ix + 1].kulcs)}>${SZ.LEPESEK[ix + 1].nev} →<//>` : null}
        </div>
      </div>
    </div>
    ${osszecsapasba ? html`<${OsszecsapasbaParbeszed} elem=${{ tipus: 'njk', id: vazlat.id, nev: alap.nev }} kampanyok=${dm.kampanyok}
      kampanyId=${(alap.kampanyok || [])[0] || ''} onBezar=${() => setOsszecsapasba(false)}/>` : null}
    ${kerdes === 'archival' ? html`<${Megerosites} cim="Archiválás" gomb="Archiválás" szoveg=${vazlat.nev + ' eltűnik a kampányokból és a játékosok elől. Később visszaállíthatod.'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); archival(false); }}/>` : null}
    ${kerdes === 'torol' ? html`<${Megerosites} cim="Végleges törlés" gomb="Végleges törlés" veszelyes=${true}
      szoveg=${vazlat.nev + ' véglegesen törlődik, a képe a kukába kerül. A dobásnapló bejegyzései megmaradnak. Ezt nem lehet visszavonni (csak a napi mentésből).'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); torol(); }}/>` : null}
    ${kerdes === 'levalaszt' ? html`<${Megerosites} cim="Leválasztás" gomb="Leválasztás"
      szoveg=${'Az NJK megtartja a mostani értékeit, de többé nem követi az alapját (' + (alapNjk ? alapNjk.nev : '') + ').'}
      onMegse=${() => setKerdes(null)} onIgen=${() => { setKerdes(null); indit(async () => {
        const v = await api.hivas('npc.detach', { id: vazlat.id, verzio: alap.verzio });
        setAlap(masol(v.njk)); setVazlat(masol(v.njk)); lekeres.beallit(v.njk); onValtozott(v.njk); lista.ujra();
      }, 'Leválasztva.'); }}/>` : null}
    ${kerdes === 'emel' ? html`<${VilagbaParbeszed} vilagok=${vilagok} onMegse=${() => setKerdes(null)}
      onIgen=${(w) => { setKerdes(null); set({ vilag_id: w }); uzen('A világ kiválasztva; a mentéssel lesz világ-NJK.'); }}/>` : null}
  </div>`;
}

const sz0 = (adat) => SZ.szereploNorm((adat || {}).szereplo);

function VilagbaParbeszed({ vilagok, onMegse, onIgen }) {
  const [w, setW] = useState(vilagok[0] ? vilagok[0].id : '');
  return html`<${Parbeszed} cim="Világ-NJK-vá emelés" onBezar=${onMegse} lab=${html`
    <${K.Button} variant="quiet" onClick=${onMegse}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!w} onClick=${() => onIgen(w)}>Emelés<//>`}>
    <div className="verem">
      <p className="szoveg">A világ-NJK több kampányban is visszatérhet; a kampányokhoz rendelése megmarad. Csak sablonra vagy ugyanannak a világnak az NJK-jára épülhet.</p>
      <${Valaszto} label="Világ" value=${w} onChange=${setW} opciok=${vilagok.filter((x) => x.aktiv !== false).map((x) => ({ value: x.id, label: x.nev }))}/>
    </div>
  <//>`;
}

function AlapadatSzerk({ v, set, dm, jel = () => null, sablon }) {
  const kampanyok = v.kampanyok || [];
  const kampanyValt = (id) => set({ kampanyok: kampanyok.includes(id) ? kampanyok.filter((x) => x !== id) : kampanyok.concat([id]) });
  const karakterek = dm.karakterek.filter((c) => c.aktiv);
  return html`<div className="verem">
    <div className="urlap-racs urlap-racs--ketto">
      <${K.TextField} label=${html`Név ${jel('nev')}`} value=${v.nev} onChange=${(e) => set({ nev: e.target.value })}/>
      <${Valaszto} label=${html`Fajta ${jel('fajta')}`} value=${v.fajta} onChange=${(f) => set({ fajta: f })}
        opciok=${Object.entries(N.NJK_FAJTAK).map(([k, f]) => ({ value: k, label: f.nev }))} hint=${(N.NJK_FAJTAK[v.fajta] || {}).leiras}/>
      ${v.fajta !== 'koveto' ? html`<${Valaszto} label=${html`Fenyegetés ${jel('fenyegetes')}`} value=${v.fenyegetes || ''} onChange=${(f) => set({ fenyegetes: f })} ures="nincs megadva"
        opciok=${LN.FENYEGETESEK.map((f) => ({ value: f.nev, label: `${f.nev} (${f.szint[0]}–${f.szint[1]}. szint)` }))}/>` : null}
    </div>
    ${sablon ? html`<p className="halvany kicsi">A sablon nem rendelhető kampányhoz; készíts belőle változatot.</p>` : html`<div>
      <div className="cimke">Kampányok <${Sugo} cim="Kampányok">Az NJK bármennyi kampányhoz rendelhető; a kampány NJK paneljén jelenik meg. A követő a gazdájával megy.<//></div>
      ${dm.kampanyok.length ? html`<div className="csipek" role="group" aria-label="Kampányok">
        ${dm.kampanyok.filter((k) => k.allapot !== 'archivált' || kampanyok.includes(k.id)).map((k) => html`<button key=${k.id} type="button" className="csip csip--kicsi"
          aria-pressed=${kampanyok.includes(k.id)} onClick=${() => kampanyValt(k.id)}>${k.cim}</button>`)}
      </div>` : html`<p className="halvany kicsi">Még nincs kampány.</p>`}
    </div>`}
    ${v.fajta === 'koveto' && !sablon ? html`<div className="urlap-racs urlap-racs--ketto">
      <${Valaszto} label="Kötődés" value=${v.kotodes || ''} onChange=${(x) => set({ kotodes: x })} ures="nincs gazdája"
        opciok=${[{ value: 'csapat', label: 'a csapat' }].concat(karakterek.map((c) => ({ value: c.id, label: c.nev })))}
        hint="A gazda karakter játékosa (csapatnál a kampány minden tagja) látja a statblokkot."/>
      <${Valaszto} label="Irányító" value=${v.iranyito || ''} onChange=${(x) => set({ iranyito: x })} ures="a gazda játékosa (vagy a DM)"
        opciok=${dm.felhasznalok.filter((f) => f.aktiv && f.szerep !== 'dm').map((f) => ({ value: f.id, label: f.nev }))}
        hint="Ha megadod, csak ő dobhat érte a DM mellett."/>
    </div>` : null}
  </div>`;
}

// ---- Statblokk szerkesztése ----

function StatblokkSzerk({ sb, setSb, lapok, rovid }) {
  const fokuszLap = (lapok['Fókuszok'] || []).slice().sort((a, b) => String(a.nev_hu).localeCompare(String(b.nev_hu), 'hu'));
  const fokuszNev = (id) => { const f = fokuszLap.find((x) => x.id === id); return f ? f.nev_hu : id; };
  const [ujFokusz, setUjFokusz] = useState('');
  const [ujTalentum, setUjTalentum] = useState('');
  const fokuszok = sb.fokuszok || [];
  const fb = sb.fokusz_bonusz || {};
  const tul = sb.tulajdonsagok || {};
  const ertek = (m, ures) => html`<${SzamMezo} label=${m[1]} value=${sb[m[0]]} ures=${ures}
    onChange=${(x) => setSb((s) => { if (x === null) delete s[m[0]]; else s[m[0]] = x; return s; })}/>`;
  return html`<div className="verem">
    <div>
      <div className="cimke">Tulajdonságok</div>
      <div className="urlap-racs urlap-racs--harom">${TULAJDONSAGOK.map((t) => html`<${SzamMezo} key=${t} label=${TUL_NEV[t]} value=${szam(tul[t])}
        onChange=${(x) => setSb((s) => { s.tulajdonsagok = { ...(s.tulajdonsagok || {}), [t]: x }; return s; })}/>`)}</div>
    </div>
    <div>
      <div className="cimke">Fókuszok</div>
      <div className="csipek">${fokuszok.map((id) => html`<span key=${id} className="csip csip--kicsi csip--statikus">
        ${fokuszNev(id)}${fb[id] >= 3 ? ' (+3)' : ''}
        <button type="button" className="csip__gomb" title="+3 (kétszer választva)" aria-pressed=${fb[id] >= 3}
          onClick=${() => setSb((s) => { s.fokusz_bonusz = { ...(s.fokusz_bonusz || {}) }; if (s.fokusz_bonusz[id] >= 3) delete s.fokusz_bonusz[id]; else s.fokusz_bonusz[id] = 3; return s; })}>+3</button>
        <button type="button" className="csip__gomb" aria-label=${fokuszNev(id) + ' törlése'}
          onClick=${() => setSb((s) => { s.fokuszok = (s.fokuszok || []).filter((x) => x !== id); if (s.fokusz_bonusz) delete s.fokusz_bonusz[id]; return s; })}>×</button>
      </span>`)}${!fokuszok.length ? html`<span className="halvany kicsi">nincs</span>` : null}</div>
      <div className="sorban">
        <${Valaszto} label="Fókusz hozzáadása" value=${ujFokusz} onChange=${setUjFokusz} ures="Válassz…"
          opciok=${fokuszLap.filter((f) => !fokuszok.includes(f.id)).map((f) => ({ value: f.id, label: `${f.nev_hu} (${TUL_NEV[f.tulajdonsag] || ''})${f.reszletek && f.reszletek.csak_ellenfel ? ', ellenfél' : ''}` }))}/>
        <${K.Button} disabled=${!ujFokusz} onClick=${() => { setSb((s) => { s.fokuszok = (s.fokuszok || []).concat([ujFokusz]); return s; }); setUjFokusz(''); }}>Hozzáadás<//>
      </div>
    </div>
    ${rovid ? html`<p className="sugo">Rövid NJK: ha harcba keveredik, Egészsége 10 + Szívósság, Védekezése 10 + Ügyesség (Companion 102.). Teljes statblokkhoz állítsd a fajtát statblokkosra.</p>` : html`
    <div>
      <div className="cimke">Harci értékek</div>
      <div className="urlap-racs urlap-racs--harom">
        ${ertek(['sebesseg', 'Sebesség'])}${ertek(['egeszseg', 'Egészség'])}${ertek(['vedekezes', 'Védekezés'])}
        ${ertek(['pancelertek', 'Páncélérték'])}${ertek(['magiapont', 'Mágiapont'], true)}${ertek(['varazsero', 'Varázserő'], true)}
      </div>
      <p className="halvany kicsi">A Mágiapont és a Varázserő üresen hagyható (nem varázsló lény). A Védekezés és a Sebesség az alapérték; az erősítés Ügyességét a felület hozzászámolja.</p>
    </div>
    <${TamadasSzerk} sb=${sb} setSb=${setSb} lapok=${lapok} fokuszNev=${fokuszNev}/>
    <div>
      <div className="cimke">Talentumok</div>
      <ul className="egyszeru-lista">${(sb.talentumok || []).map((t, i) => html`<li key=${t.id + i} className="sorban sorban--kozep">
        <span>${megjelenitettNev((lapok['Talentumok'] || []).find((x) => x.id === t.id)) || t.id}</span>
        <select className="ka-field__input valaszto valaszto--kicsi" aria-label="Fokozat" value=${t.fok || 1}
          onChange=${(e) => setSb((s) => { s.talentumok = s.talentumok.map((x, j) => (j === i ? { ...x, fok: Number(e.target.value) } : x)); return s; })}>
          ${[1, 2, 3].map((f) => html`<option key=${f} value=${f}>${FOKOZAT[f]}</option>`)}
        </select>
        <${K.Button} size="sm" variant="quiet" onClick=${() => setSb((s) => { s.talentumok = s.talentumok.filter((x, j) => j !== i); return s; })}>Törlés<//>
      </li>`)}</ul>
      <div className="sorban">
        <${Valaszto} label="Talentum hozzáadása" value=${ujTalentum} onChange=${setUjTalentum} ures="Válassz…"
          opciok=${(lapok['Talentumok'] || []).filter((t) => !(sb.talentumok || []).some((x) => x.id === t.id)).map((t) => ({ value: t.id, label: megjelenitettNev(t) }))}/>
        <${K.Button} disabled=${!ujTalentum} onClick=${() => { setSb((s) => { s.talentumok = (s.talentumok || []).concat([{ id: ujTalentum, fok: 1 }]); return s; }); setUjTalentum(''); }}>Hozzáadás<//>
      </div>
    </div>`}
  </div>`;
}

function TamadasSzerk({ sb, setSb, lapok, fokuszNev }) {
  const tamadasok = sb.tamadasok || [];
  const allit = (i, valt) => setSb((s) => { s.tamadasok = s.tamadasok.map((t, j) => (j === i ? { ...t, ...valt } : t)); return s; });
  const fokuszOpciok = (tul) => (lapok['Fókuszok'] || []).filter((f) => f.tulajdonsag === tul).map((f) => ({ value: f.id, label: f.nev_hu + ((sb.fokuszok || []).includes(f.id) ? '' : ' (nincs meg)') }));
  return html`<div>
    <div className="cimke">Támadások <${Sugo} cim="Bónusz">Üresen hagyva a bónusz a tulajdonságból és a fókuszból számolódik (az erősítéssel együtt). A bestiáriumból másolt támadás a forrás bónuszát őrzi.<//></div>
    <ul className="sorlista">${tamadasok.map((t, i) => html`<li key=${i} className="sorlista__sor sorlista__sor--fuggoleges">
      <div className="urlap-racs urlap-racs--harom">
        <${K.TextField} label="Név" value=${t.nev_hu || ''} onChange=${(e) => allit(i, { nev_hu: e.target.value })}/>
        <${Valaszto} label="Tulajdonság" value=${t.tul || ''} onChange=${(x) => allit(i, { tul: x, fokusz: '' })} ures="nincs"
          opciok=${['tul_fighting', 'tul_accuracy', 'tul_strength', 'tul_dexterity', 'tul_willpower', 'tul_perception'].map((x) => ({ value: x, label: TUL_NEV[x] }))}/>
        <${Valaszto} label="Fókusz" value=${t.fokusz || ''} onChange=${(x) => allit(i, { fokusz: x })} ures="nincs" opciok=${fokuszOpciok(t.tul)}/>
        <${SzamMezo} label="Bónusz" ures=${true} value=${t.szamolt ? null : t.bonusz}
          onChange=${(x) => allit(i, x === null ? { szamolt: true, bonusz: null } : { szamolt: false, bonusz: x })} hint=${t.szamolt ? 'számolt' : undefined}/>
        <${K.TextField} label="Sebzés" value=${t.sebzes || ''} onChange=${(e) => allit(i, { sebzes: e.target.value })} placeholder="2d6+3"/>
        <${K.TextField} label="Hatótáv" value=${t.hatotav || ''} onChange=${(e) => allit(i, { hatotav: e.target.value || undefined })} placeholder="közelharc"/>
      </div>
      <div className="sorban sorban--kozep">
        <${Jelolo} checked=${!!t.atuto} onChange=${(x) => allit(i, { atuto: x })}>Átütő sebzés<//>
        ${t.kepesseg ? html`<span className="halvany kicsi">képességből</span>` : null}
        <${K.Button} size="sm" variant="quiet" onClick=${() => setSb((s) => { s.tamadasok = s.tamadasok.filter((x, j) => j !== i); return s; })}>Törlés<//>
      </div>
    </li>`)}</ul>
    <div className="gombsor"><${K.Button} size="sm" onClick=${() => setSb((s) => { s.tamadasok = (s.tamadasok || []).concat([N.ujTamadas()]); return s; })}
      icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Támadás<//></div>
  </div>`;
}

// ---- Erősítés (AK 104.) és kézi módosítók ----

function ErositesSzerk({ adat, setAdat, lapok, nezet }) {
  const e = adat.erosites || N.uresErosites();
  const allas = LN.erositesAllas(e);
  const [ujFokusz, setUjFokusz] = useState('');
  const [ujTalentum, setUjTalentum] = useState('');
  const setE = (fn) => setAdat((a) => { a.erosites = fn(a.erosites || N.uresErosites()); return a; });
  const ertekek = [0].concat([...new Set(allas.keret.tul.map((k) => k.ertek))]);
  const fokuszLap = (lapok['Fókuszok'] || []).slice().sort((a, b) => String(a.nev_hu).localeCompare(String(b.nev_hu), 'hu'));
  const meglevo = new Set([...(((adat.statblokk || {}).fokuszok) || []), ...(e.fokuszok || [])]);
  const maradekSzoveg = [
    ...allas.maradek.tul.filter((m) => m.db > 0).map((m) => `${m.db} × +${m.ertek} tulajdonság`),
    allas.maradek.fokusz > 0 ? `${allas.maradek.fokusz} fókusz` : '',
    allas.maradek.talentum > 0 ? `${allas.maradek.talentum} talentumfok` : ''
  ].filter(Boolean).join(', ');
  return html`<div className="verem">
    <div className="sorban sorban--kozep">
      <div className="kapcsolo" role="group" aria-label="Erősítés foka">
        ${['nincs', 'elit', 'hosi', 'epikus'].map((f) => html`<button key=${f} type="button" aria-pressed=${(e.fok || 'nincs') === f}
          onClick=${() => setE((x) => ({ ...x, fok: f }))}>${N.erositesNev(f)}</button>`)}
      </div>
      <${K.Button} size="sm" disabled=${e.fok === 'epikus'} onClick=${() => setE((x) => N.erositesFeljebb(x))}>Fejlesztés egy fokkal<//>
      <${Sugo} cim="Erősítés">Alapkönyv 104.: elit (+1 három tulajdonságra, 2 fókusz, +5 Egészség, 1 talentumfok), hősi (+2 kettőre, +1 háromra, 4 fókusz, +15 Egészség, 2 talentumfok), epikus (+3 egyre, +2 kettőre, +1 háromra, 5 fókusz, +20 Egészség, +3 Páncélérték, 3 talentumfok). Az elit lény nagyjából egy fenyegetési szinttel erősebb.<//>
    </div>
    ${e.fok && e.fok !== 'nincs' ? html`
      <p className=${'kicsi ' + (allas.hibak.length ? '' : 'halvany')}>${maradekSzoveg ? 'Kiosztható még: ' + maradekSzoveg + '.' : '✓ Minden pont kiosztva.'}</p>
      ${allas.hibak.map((h, i) => html`<${Uzenet} key=${i} tonus="warning">${h}<//>`)}
      <div className="urlap-racs urlap-racs--harom">${TULAJDONSAGOK.map((t) => html`<div key=${t} className="ka-field">
        <label className="ka-field__label" htmlFor=${'er-' + t}>${TUL_NEV[t]} ${nezet ? html`<span className="halvany">(${elojel(nezet.tulajdonsagok[t].ertek)})</span>` : null}</label>
        <select id=${'er-' + t} className="ka-field__input valaszto" value=${szam((e.tulajdonsagok || {})[t])}
          onChange=${(ev) => setE((x) => { const tu = { ...(x.tulajdonsagok || {}) }; const v = Number(ev.target.value); if (v) tu[t] = v; else delete tu[t]; return { ...x, tulajdonsagok: tu }; })}>
          ${ertekek.map((v) => html`<option key=${v} value=${v}>${v ? '+' + v : '–'}</option>`)}
        </select>
      </div>`)}</div>
      <div>
        <div className="cimke">Új fókuszok</div>
        <div className="csipek">${(e.fokuszok || []).map((id) => html`<span key=${id} className="csip csip--kicsi csip--statikus">
          ${(fokuszLap.find((f) => f.id === id) || {}).nev_hu || id}
          <button type="button" className="csip__gomb" aria-label="Törlés" onClick=${() => setE((x) => ({ ...x, fokuszok: x.fokuszok.filter((y) => y !== id) }))}>×</button>
        </span>`)}</div>
        <div className="sorban">
          <${Valaszto} label="Fókusz" value=${ujFokusz} onChange=${setUjFokusz} ures="Válassz…"
            opciok=${fokuszLap.filter((f) => !meglevo.has(f.id)).map((f) => ({ value: f.id, label: `${f.nev_hu} (${TUL_NEV[f.tulajdonsag] || ''})` }))}/>
          <${K.Button} disabled=${!ujFokusz} onClick=${() => { setE((x) => ({ ...x, fokuszok: (x.fokuszok || []).concat([ujFokusz]) })); setUjFokusz(''); }}>Hozzáadás<//>
        </div>
      </div>
      <div>
        <div className="cimke">Talentumfokok</div>
        <ul className="egyszeru-lista">${(e.talentumok || []).map((t, i) => html`<li key=${i} className="sorban sorban--kozep">
          <span>${megjelenitettNev((lapok['Talentumok'] || []).find((x) => x.id === t.id)) || t.id} (${FOKOZAT[t.fok || 1]})</span>
          <${K.Button} size="sm" variant="quiet" onClick=${() => setE((x) => ({ ...x, talentumok: x.talentumok.filter((y, j) => j !== i) }))}>Törlés<//>
        </li>`)}</ul>
        <div className="sorban">
          <${Valaszto} label="Talentum" value=${ujTalentum} onChange=${setUjTalentum} ures="Válassz…"
            opciok=${(lapok['Talentumok'] || []).map((t) => ({ value: t.id, label: megjelenitettNev(t) }))}/>
          <${K.Button} disabled=${!ujTalentum} onClick=${() => {
            setE((x) => {
              const meglevoFok = Math.max(0, ...(((adat.statblokk || {}).talentumok || []).concat(x.talentumok || [])).filter((y) => y.id === ujTalentum).map((y) => szam(y.fok, 1)));
              return { ...x, talentumok: (x.talentumok || []).concat([{ id: ujTalentum, fok: Math.min(3, meglevoFok + 1) }]) };
            });
            setUjTalentum('');
          }}>Hozzáadás<//>
        </div>
      </div>` : html`<p className="halvany kicsi">Az erősítés visszafejthetően tárolódik: a fok és a kiosztott pontok külön látszanak az alapértékektől.</p>`}
    <${KeziSzerk} kezi=${adat.kezi || []} setKezi=${(fn) => setAdat((a) => { a.kezi = fn(a.kezi || []); return a; })}/>
  </div>`;
}

function KeziSzerk({ kezi, setKezi }) {
  const [cel, setCel] = useState('tul_fighting');
  const [ertek, setErtek] = useState(1);
  const [megj, setMegj] = useState('');
  const nev = (c) => (KEZI_CELOK.find((x) => x.value === c) || { label: c }).label;
  return html`<details className="lenyilo" open=${kezi.some((k) => !k.kepesseg) || undefined}>
    <summary>Kézi módosítók (${kezi.length})</summary>
    <ul className="egyszeru-lista">${kezi.map((k, i) => html`<li key=${i} className="sorban sorban--kozep">
      <span>${nev(k.cel)} ${elojel(szam(k.ertek))}${k.megjegyzes ? ' · ' + k.megjegyzes : ''}</span>
      ${k.kepesseg ? html`<span className="halvany kicsi">(a képességgel együtt törlődik)</span>`
        : html`<${K.Button} size="sm" variant="quiet" onClick=${() => setKezi((l) => l.filter((x, j) => j !== i))}>Törlés<//>`}
    </li>`)}</ul>
    <div className="urlap-racs urlap-racs--harom">
      <${Valaszto} label="Mire" value=${cel} onChange=${setCel} opciok=${KEZI_CELOK}/>
      <${SzamMezo} label="Érték" value=${ertek} onChange=${setErtek}/>
      <${K.TextField} label="Megjegyzés" value=${megj} onChange=${(e) => setMegj(e.target.value)} placeholder="például mágikus amulett"/>
    </div>
    <div className="gombsor"><${K.Button} size="sm" disabled=${!ertek} onClick=${() => { setKezi((l) => l.concat([{ cel, ertek, megjegyzes: megj.trim() }])); setMegj(''); }}>Módosító felvétele<//></div>
  </details>`;
}

// ---- Különleges képességek (gyűjtemény: Import 11, és saját) ----

function KepessegSzerk({ adat, setAdat, lapok }) {
  const gyujtemeny = (lapok['Különleges képességek'] || []).slice().sort((a, b) => String(a.nev_hu).localeCompare(String(b.nev_hu), 'hu'));
  const [valasztott, setValasztott] = useState('');
  const [sajatNev, setSajatNev] = useState('');
  const [sajatLeiras, setSajatLeiras] = useState('');
  const [sajatTipus, setSajatTipus] = useState('passzív');
  const kepessegek = ((adat.statblokk || {}).kepessegek) || [];
  const elonezet = gyujtemeny.find((k) => k.id === valasztott) || null;
  return html`<div className="verem">
    ${kepessegek.length ? html`<ul className="sorlista">${kepessegek.map((k, i) => html`<li key=${i} className="sorlista__sor sorlista__sor--fuggoleges">
      <div className="sorban sorban--kozep sorban--szet">
        <span><strong>${k.nev_hu}</strong>${k.nev_en ? html` <span className="halvany">(${k.nev_en})</span>` : null}${k.kepesseg_id ? html` <${K.Badge}>gyűjtemény<//>` : null}</span>
        <${K.Button} size="sm" variant="quiet" onClick=${() => setAdat((a) => (k.kepesseg_id ? N.kepessegEltavolitas(a, k.kepesseg_id)
          : (a.statblokk.kepessegek = a.statblokk.kepessegek.filter((x, j) => j !== i), a)))}>Eltávolítás<//>
      </div>
      ${k.leiras ? html`<p className="szoveg kicsi">${k.leiras}</p>` : null}
    </li>`)}</ul>` : html`<p className="halvany">Nincs különleges képessége.</p>`}
    ${gyujtemeny.length ? html`<div className="verem">
      <div className="sorban">
        <${Valaszto} label="Hozzáadás a gyűjteményből" value=${valasztott} onChange=${setValasztott} ures="Válassz…"
          opciok=${gyujtemeny.filter((k) => !N.vanKepesseg(adat, k.id)).map((k) => ({ value: k.id, label: megjelenitettNev(k) + (k.tipus === 'sablon' ? ' (sablon)' : '') }))}/>
        <${K.Button} disabled=${!elonezet} onClick=${() => { setAdat((a) => N.kepessegHozzaadas(a, elonezet, lapok)); setValasztott(''); }}>Hozzáadás<//>
      </div>
      ${elonezet ? html`<p className="sugo">${elonezet.leiras_hu} <span className="halvany">(${elonezet.forras}${elonezet.oldal ? ', ' + Math.round(elonezet.oldal) + '. o.' : ''})</span></p>` : null}
      <p className="halvany kicsi">A gyűjtemény képességei a géppel kezelhető hatásokat (tulajdonság, Páncélérték, mozgás, támadás, mutatványár) is beírják, és eltávolításkor visszavonják. A képesség valószínűleg növeli a fenyegetést.</p>
    </div>` : html`<p className="halvany kicsi">A különleges képességek gyűjteménye (Import 11) még nincs betöltve; saját képességet addig is felvehetsz.</p>`}
    <details className="lenyilo">
      <summary>Saját képesség</summary>
      <div className="verem">
        <div className="urlap-racs urlap-racs--ketto">
          <${K.TextField} label="Név" value=${sajatNev} onChange=${(e) => setSajatNev(e.target.value)}/>
          <${Valaszto} label="Cselekvés" value=${sajatTipus} onChange=${setSajatTipus}
            opciok=${['passzív', 'fő', 'mellék', 'szabad', 'aktiválás', 'mozgás'].map((t) => ({ value: t, label: t }))}/>
        </div>
        <${K.TextField} label="Leírás" multiline=${true} value=${sajatLeiras} onChange=${(e) => setSajatLeiras(e.target.value)}/>
        <div className="gombsor"><${K.Button} size="sm" disabled=${!sajatNev.trim()} onClick=${() => {
          setAdat((a) => { a.statblokk = a.statblokk || N.uresStatblokk(); a.statblokk.kepessegek = (a.statblokk.kepessegek || []).concat([{ nev_hu: sajatNev.trim(), nev_en: '', tipus: sajatTipus, leiras: sajatLeiras.trim() }]); return a; });
          setSajatNev(''); setSajatLeiras('');
        }}>Felvétel<//></div>
      </div>
    </details>
  </div>`;
}

// ---- Fenyegetési sablon (Companion 104.) ----

function SablonPanel({ sb, fenyegetes, setSb }) {
  const s = N.sablonAllas(sb, fenyegetes);
  if (!s) return null;
  return html`<${K.Panel} title=${'Fenyegetési sablon: ' + fenyegetes}>
    <div className="verem">
      <dl className="ertekek ertekek--sablon">
        <div><dt>Pontok</dt><dd>${s.pontok} / ${s.sablon.pont}</dd></div>
        <div><dt>Legnagyobb</dt><dd>${s.legnagyobb} / ${s.sablon.max}</dd></div>
        <div><dt>Fókusz</dt><dd>${s.fokuszok} / ${s.sablon.fokusz}</dd></div>
        <div><dt>Talentum</dt><dd>${s.talentumok} / ${s.sablon.talentum}</dd></div>
        <div><dt>Egészség</dt><dd>${szam(sb.egeszseg)}</dd><dd className="ertekek__megj">ajánlott: ${s.egeszseg_ajanlott}</dd></div>
        <div><dt>Mágiapont</dt><dd>${sb.magiapont === undefined || sb.magiapont === null ? '–' : sb.magiapont}</dd><dd className="ertekek__megj">varázslónál: ${s.mp_ajanlott}</dd></div>
      </dl>
      ${s.figyelmeztetesek.map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f}<//>`)}
      <div className="gombsor">
        <${K.Button} size="sm" disabled=${szam(sb.egeszseg) === s.egeszseg_ajanlott} onClick=${() => setSb((x) => ({ ...x, egeszseg: s.egeszseg_ajanlott }))}>Ajánlott Egészség<//>
        <${K.Button} size="sm" variant="quiet" onClick=${() => setSb((x) => ({ ...x, magiapont: s.mp_ajanlott }))}>Ajánlott Mágiapont (varázsló)<//>
      </div>
      <p className="halvany kicsi">Ajánlás, nem szabály: a harcos NJK Egészsége +5, a mágusé −5 lehet; ${s.sablon.plusz3 ? 'ezen a szinten egy fókusz kétszer választva +3.' : '+3-as fókusz csak Komoly fenyegetéstől.'} A harcos NJK-nak jár a Páncélviselet (Kezdő), a varázslónak a Mágikus képzés.</p>
    </div>
  <//>`;
}

// ---- Követő ----

function KovetoPanel({ v, setAdat, setSb, lapok, karakterNev }) {
  const { api } = useApp();
  const [fut, indit] = useMuvelet();
  const sb = (v.adat || {}).statblokk || {};
  const s = N.kovetoAllas(sb);
  const feladatok = ((v.adat || {}).szerep || {}).feladatok || [];
  const ajanlott = () => indit(async () => {
    const e = await kovetoEgeszsegSzamol(api, lapok, v.kotodes, (v.kampanyok || [])[0]);
    setSb((x) => ({ ...x, egeszseg: e }));
  }, 'Az Egészség a gazda szerint beállítva.');
  return html`<${K.Panel} title="Követő">
    <div className="verem">
      <p className="szoveg kicsi">${N.kotodesSzoveg(v, karakterNev) || 'Nincs gazdája.'} Egészség: ${szam(sb.egeszseg)}.</p>
      ${s.figyelmeztetesek.map((f, i) => html`<${Uzenet} key=${i} tonus="warning">${f}<//>`)}
      <div className="gombsor">
        <${K.Button} size="sm" disabled=${fut || !v.kotodes} onClick=${ajanlott}>Egészség a gazda szerint<//>
        <${Sugo} cim="Követő">Companion 98–99., Kampányépítő 75–76.: két-három tulajdonság 2-es, néhány 1-es, 2–3 fókusz. Egészsége a gazda karakter felének, a csapathoz kötve a második legkisebb Egészségű karakter felének. Képességei nagyjából a csapat második legalacsonyabb szintjének felét érjék el.<//>
      </div>
      <${K.TextField} label="Feladatok (soronként)" multiline=${true} hint="Amiket magától elvégez: őrt áll, lovakat készít, ösvényt keres."
        value=${feladatok.join('\n')} onChange=${(e) => setAdat((a) => { a.szerep = { ...(a.szerep || {}), feladatok: e.target.value.split('\n') }; return a; })}/>
    </div>
  <//>`;
}

// ---- Szerep és állapot ----

function AllapotSzerk({ allapot, nezet, setAllapot }) {
  return html`<div className="verem">
    <div className="urlap-racs urlap-racs--harom">
      <${SzamMezo} label=${'Egészség' + (nezet ? ` (max. ${nezet.egeszseg.ertek})` : '')} ures=${true} value=${allapot.egeszseg}
        onChange=${(x) => setAllapot((a) => { const o = { ...a }; if (x === null) delete o.egeszseg; else o.egeszseg = x; return o; })} hint="Üresen: teljes"/>
      ${nezet && nezet.magiapont ? html`<${SzamMezo} label=${`Mágiapont (max. ${nezet.magiapont.ertek})`} ures=${true} value=${allapot.magiapont}
        onChange=${(x) => setAllapot((a) => { const o = { ...a }; if (x === null) delete o.magiapont; else o.magiapont = x; return o; })} hint="Üresen: teljes"/>` : null}
      <${K.TextField} label="Feltételek" value=${(allapot.feltetelek || []).map((f) => (typeof f === 'string' ? f : f.nev)).join(', ')}
        onChange=${(e) => { const l = e.target.value.split(',').map((x) => x.trim()).filter(Boolean).map((x) => ({ nev: x })); setAllapot((a) => ({ ...a, feltetelek: l })); }}
        hint="Vesszővel elválasztva"/>
    </div>
    <p className="halvany kicsi">Főleg követőknél és visszatérő ellenfeleknél: a csata lezárása ide írja vissza a megmaradt Egészséget (4–5. ütem).</p>
  </div>`;
}

// ================= A kampány NJK panelje (DM) =================

export function KampanyNjkPanel({ allapot, naploz, dm, frissit }) {
  const { api, szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const [uj, setUj] = useState(false);
  const [kartya, setKartya] = useState(null);
  const [proba, setProba] = useState(null);
  const [hozzaad, setHozzaad] = useState('');
  const [fut, indit] = useMuvelet();
  const tar = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk.aktiv');
  const kampany = allapot.kampany;
  const njkk = (allapot.njkk || []).slice().sort((a, b) => String(a.nev).localeCompare(String(b.nev), 'hu'));
  const bent = new Set(njkk.map((n) => n.id));
  const szabad = (tar.adat || []).filter((n) => !bent.has(n.id) && n.aktiv !== false);
  const megosztva = (id) => (allapot.megosztasok || []).some((m) => m.tipus === 'njk' && m.hivatkozas === id);
  const karakterNev = (kid) => { const c = (allapot.karakterek || []).find((x) => x.id === kid) || dm.karakterek.find((x) => x.id === kid); return c ? c.nev : ''; };
  const kampanyObj = kampanyProbahoz(kampany);

  const hozzaadas = () => indit(async () => {
    const n = (await api.hivas('npc.get', { id: hozzaad })).njk;
    await api.hivas('npc.save', { id: n.id, verzio: n.verzio, kampanyok: (n.kampanyok || []).concat([kampany.id]) });
    setHozzaad('');
    await frissit();
  }, 'Az NJK a kampányba került.');
  const kivesz = (n) => indit(async () => {
    await api.hivas('npc.save', { id: n.id, verzio: n.verzio, kampanyok: (n.kampanyok || []).filter((x) => x !== kampany.id) });
    await frissit();
  }, n.nev + ' kikerült a kampányból (az NJK-tárban megmarad).');
  const megoszt = (n) => indit(async () => {
    await api.hivas('share.send', { kampany_id: kampany.id, cimzett: 'mindenki', tipus: 'njk', cim: n.nev, hivatkozas: n.id });
    await frissit();
  }, `${n.nev}: a játékosok látják a nevét, képét és nyilvános leírását.`);

  return html`<${K.Panel} title="NJK-k" actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUj(true)}
      icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Új NJK<//>`}>
    ${njkk.length ? html`<ul className="sorlista">${njkk.map((n) => {
      const nz = nezetBol(n, lapok);
      return html`<li key=${n.id} className="sorlista__sor sorlista__sor--fuggoleges">
        <div className="nevsor">
          <${KarakterKep} kep=${n.kep} nev=${n.nev}/>
          <div>
            <a className="sorlista__nev" href=${'#/dm/njk/' + n.id}>${n.nev}</a>
            <div className="halvany kicsi">${[fajtaNev(n.fajta), n.fenyegetes, N.kotodesSzoveg(n, karakterNev), nz && n.fajta !== 'rovid' ? `Egészség ${nz.egeszseg.aktualis}/${nz.egeszseg.ertek}` : ''].filter(Boolean).join(' · ')}</div>
            ${megosztva(n.id) ? html`<span className="halvany kicsi">✓ megosztva a játékosokkal</span>` : null}
          </div>
        </div>
        <div className="gombsor gombsor--szoros njk-sor__gombok">
          <${K.Button} size="sm" disabled=${!nz} onClick=${() => setProba({ n, nz })}>Próba<//>
          <${K.Button} size="sm" variant="quiet" disabled=${!nz} onClick=${() => setKartya(n)}>Statblokk<//>
          ${megosztva(n.id) ? null : html`<${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => megoszt(n)}>Megosztás<//>`}
          <${K.Button} size="sm" variant="quiet" disabled=${fut} onClick=${() => kivesz(n)}>Kivétel<//>
        </div>
      </li>`;
    })}</ul>` : html`<p className="halvany">Még nincs NJK ebben a kampányban.</p>`}
    <div className="sorban">
      <${Valaszto} label="Hozzáadás az NJK-tárból" value=${hozzaad} onChange=${setHozzaad} ures=${tar.adat ? 'Válassz…' : 'Betöltés…'}
        opciok=${szabad.map((n) => ({ value: n.id, label: n.nev + ' (' + fajtaNev(n.fajta) + ')' }))}/>
      <${K.Button} disabled=${fut || !hozzaad} onClick=${hozzaadas}>Hozzáadás<//>
    </div>
    ${proba ? html`<${ProbaLap} lap=${proba.nz} kezdet=${{ tul: 'tul_perception', cim: proba.n.nev + ': próba' }} karakter=${null}
      kampany=${kampanyObj} njk=${{ id: proba.n.id, nev: proba.n.nev }} naploz=${naploz} rejtettLehet=${true}
      onBezar=${() => setProba(null)} forrasok=${kampany.aktiv_forrasok} valasztasok=${{}}/>` : null}
    ${kartya ? html`<${Parbeszed} cim=${kartya.nev} onBezar=${() => setKartya(null)}>
      <${Statblokk} nezet=${nezetBol(kartya, lapok)} r=${(kartya.adat || {}).statblokk || {}} lapok=${lapok} cimNelkul=${true}
        leiras=${((kartya.adat || {}).szerep || {}).nyilvanos} naplo=${{ kampany: kampanyObj, njk: { id: kartya.id, nev: kartya.nev }, naploz, rejtettLehet: true }}/>
    <//>` : null}
    ${uj ? html`<${UjNjkParbeszed} dm=${dm} kampanyId=${kampany.id} onBezar=${() => setUj(false)}
      onLetrejott=${(n) => { setUj(false); frissit(); navigal('/dm/njk/' + n.id); }}/>` : null}
  <//>`;
}

// ================= A játékos NJK panelje =================

// A megosztott NJK-k (név, kép, nyilvános leírás) és a követők (statblokk; próba, ha a játékos irányíthatja).
export function JatekosNjkPanel({ allapot, naploz }) {
  const { felhasznalo, szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const [kartya, setKartya] = useState(null);
  const njkk = allapot.njkk || [];
  if (!njkk.length) return null;
  const kampany = allapot.kampany;
  const dobhat = (n) => {
    if (n.lathatosag !== 'kovetonek') return false;
    if (n.iranyito) return n.iranyito === felhasznalo.id;
    if (n.kotodes && n.kotodes !== 'csapat') return (allapot.karakterek || []).some((c) => c.id === n.kotodes && c.irhato);
    return kampany.sajat_szerep === 'mester';
  };
  const karakterNev = (kid) => { const c = (allapot.karakterek || []).find((x) => x.id === kid); return c ? c.nev : ''; };
  const kovetok = njkk.filter((n) => n.lathatosag === 'kovetonek');
  const tobbiek = njkk.filter((n) => n.lathatosag !== 'kovetonek');
  const sor = (n) => html`<li key=${n.id}>
    <button type="button" className="kartya kartya--kepes kartya--gomb" onClick=${() => setKartya(n)}>
      <${KarakterKep} kep=${n.kep} nev=${n.nev}/>
      <span className="kartya__test"><span className="kartya__cim">${n.nev}</span>
        <span className="halvany kicsi">${n.lathatosag === 'kovetonek' ? N.kotodesSzoveg(n, karakterNev) : ((n.adat || {}).szerep || {}).nyilvanos ? String(n.adat.szerep.nyilvanos).slice(0, 80) : ''}</span></span>
    </button>
  </li>`;
  const kn = kartya ? nezetBol(kartya, lapok) : null;
  return html`<${K.Panel} title=${kovetok.length && !tobbiek.length ? 'Követők' : 'NJK-k'}>
    ${kovetok.length ? html`<ul className="kartyalista">${kovetok.map(sor)}</ul>` : null}
    ${kovetok.length && tobbiek.length ? html`<${K.Divider} ornament=${false}/>` : null}
    ${tobbiek.length ? html`<ul className="kartyalista">${tobbiek.map(sor)}</ul>` : null}
    ${kartya ? html`<${Parbeszed} cim=${kartya.nev} onBezar=${() => setKartya(null)}>
      ${kartya.lathatosag === 'kovetonek' && kn && lapok ? html`<div className="verem">
          ${((kartya.adat || {}).szerep || {}).feladatok && kartya.adat.szerep.feladatok.filter(Boolean).length ? html`<p className="szoveg kicsi"><strong>Feladatai:</strong> ${kartya.adat.szerep.feladatok.filter(Boolean).join(', ')}</p>` : null}
          <${Statblokk} nezet=${kn} r=${(kartya.adat || {}).statblokk || {}} lapok=${lapok} cimNelkul=${true} leiras=${((kartya.adat || {}).szerep || {}).nyilvanos}
            naplo=${dobhat(kartya) ? { kampany: kampanyProbahoz(kampany), njk: { id: kartya.id, nev: kartya.nev }, naploz, rejtettLehet: false } : null}/>
          ${dobhat(kartya) ? null : html`<p className="halvany kicsi">Ezt a követőt más irányítja: a próba nem kerül a naplóba.</p>`}
        </div>`
        : html`<div className="verem">
          <div className="nevsor"><${KarakterKep} kep=${kartya.kep} nev=${kartya.nev} meret="kozep"/></div>
          ${((kartya.adat || {}).szerep || {}).megjelenes ? html`<p className="szoveg">${kartya.adat.szerep.megjelenes}</p>` : null}
          <p className="szoveg">${((kartya.adat || {}).szerep || {}).nyilvanos || html`<span className="halvany">Nincs leírás.</span>`}</p>
        </div>`}
    <//>` : null}
  <//>`;
}
