// DM csatanézet (3. lépés, 4–5. ütem): indítás összecsapásból vagy gyors csataként, kezdeményezés, körök a
// cselekvések számlálásával, támadás célponttal, sebzés Páncélértékkel, harci mutatványok gépi hatással,
// varázslat a célpont próbájával, egyéb cselekvések, feltételek, haldoklás, rejtett résztvevők belépése,
// visszavonás, lezárás XP-javaslattal és az NJK-k állapotának visszaírásával.
// Szabályok: web/js/jatek/csata.js és csatamuvelet.js (tiszta függvények). Terv: claude/csata-terv.md.
// Minden lépés előbb a képernyőn változik, aztán a háttérbe megy (combat.act, sorba állítva, kulccsal).
// A támadás, varázslat, gyógyítás és a célpont próbája ablakai közösek a játékos Csata sávjával (csatasav.js).
import {
  html, K, useApp, useState, useEffect, useMemo, useRef, useLekeres, useMuvelet, navigal, Ikon, Betoltes, Uzenet, Valaszto, Jelolo,
  Parbeszed, Sugo, elojel
} from './kozos.js';
import { useKampanyAllapot, useDobasok } from './jatek.js';
import { KampanyNaplo } from './dobasnaplo.js';
import { Kockadobo } from './kockadobo.js';
import { MutatvanyValaszto } from './mutatvanyvalaszto.js';
import { HozzaadasPanel, StatblokkAblak } from './osszecsapas.js';
import { Kapcsolo } from './varazslo_lepesek.js';
import { fokuszNevLapbol } from './proba.js';
import { XpKiosztas } from './xpkiosztas.js';
import { atallit } from '../karakter/adat.js';
import * as C from '../jatek/csata.js';
import * as O from '../jatek/osszecsapas.js';
import * as LN from '../jatek/leny.js';
import * as P from '../jatek/proba.js';
import * as M from '../jatek/csatamuvelet.js';

const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || null;
const aktivKarakter = (c) => !c.kampany_allapot || c.kampany_allapot === 'aktív';
const masol = (x) => JSON.parse(JSON.stringify(x));
const osszeg = (k) => (k || []).reduce((a, b) => a + (Number(b) || 0), 0);
const ALLAPOT_TONUS = { aktiv: undefined, haldoklik: 'danger', kiesett: 'warning', halott: 'danger' };
const pkKulcs = (forras) => `${forras.tipus}:${forras.id}`;
export const csataUt = (kampanyId, csataId) => `/dm/kampany/${kampanyId}/csata/${csataId}`;

// ---------------- Lény-nézetek és pillanatképek ----------------

// Az NJK sorából a csatához szükséges rész (a szerep és a szereplések nélkül), hogy a pillanatkép kicsi legyen.
function njkKivonat(n) {
  const a = n.adat || {};
  return { id: n.id, nev: n.nev, fajta: n.fajta, fenyegetes: n.fenyegetes || '', adat: { statblokk: a.statblokk || {}, erosites: a.erosites || null, kezi: a.kezi || [], allapot: a.allapot || {} } };
}
function szornyKivonat(s) {
  return { id: s.id, nev_hu: s.nev_hu, nev_en: s.nev_en, fenyegetes: s.fenyegetes, csoport: s.csoport, forras: s.forras, oldal: s.oldal, tipus: s.tipus, reszletek: s.reszletek };
}

// A résztvevők forrásaihoz tartozó pillanatképek (szörny: a statblokk, NJK: a kivonat). Ami nem fér el egy cellában,
// az kimarad: az a lény a szabályadatból (vagy a kampány NJK-iból) számol.
async function pillanatkepekGyujtese(forrasok, { lapok, allapot, api }) {
  const pk = {};
  for (const f of forrasok) {
    const k = pkKulcs(f);
    if (pk[k] || f.tipus === 'karakter') continue;
    if (f.tipus === 'szorny') {
      const s = ((lapok && lapok['Szörnyek']) || []).find((x) => x.id === f.id);
      if (s) pk[k] = szornyKivonat(s);
    } else if (f.tipus === 'njk') {
      let n = (allapot.njkk || []).find((x) => x.id === f.id && x.adat);
      if (!n) { try { n = (await api.hivas('npc.get', { id: f.id })).njk; } catch (e) { n = null; } }
      if (n) pk[k] = njkKivonat(n);
    }
  }
  while (JSON.stringify(pk).length > 45000) {
    const kulcs = Object.keys(pk).sort((a, b) => JSON.stringify(pk[b]).length - JSON.stringify(pk[a]).length).find((x) => x.startsWith('szorny:')) || Object.keys(pk)[0];
    if (!kulcs) break;
    delete pk[kulcs];
  }
  return pk;
}

// Egy forrás lény-nézete: karakter a kampány állapotából (a karakterlap számolójával), szörny és NJK a pillanatképből.
export function forrasNezet(forras, { allapot, lapok, pk = {} }) {
  if (!lapok) return null;
  if (forras.tipus === 'karakter') {
    const kar = (allapot.karakterek || []).find((c) => c.id === forras.id && c.adat);
    if (!kar) return null;
    try { return LN.lenyNezet({ tipus: 'karakter', adat: atallit(kar.adat), id: kar.id }, lapok); } catch (e) { return null; }
  }
  if (forras.tipus === 'szorny') {
    const sor = pk[pkKulcs(forras)] || ((lapok && lapok['Szörnyek']) || []).find((x) => x.id === forras.id);
    return sor ? LN.lenyNezet({ tipus: 'szorny', sor }, lapok) : null;
  }
  if (forras.tipus === 'njk') {
    const sor = pk[pkKulcs(forras)] || (allapot.njkk || []).find((x) => x.id === forras.id && x.adat);
    return sor ? LN.lenyNezet({ tipus: 'njk', sor }, lapok) : null;
  }
  return null;
}

// A csatához szükséges értékek egy nézetből: Egészség, maximum, Szívósság, Mágiapont, és a háttérnek a csataértékek
// (Védekezés, Páncélérték, Mágiapont maximuma, Akaraterő), amelyekből a játékos lépéseit számolja.
export function egeszsegAdat(nz) {
  if (!nz) return { egeszseg: 0, egeszseg_max: 0, szivossag: 0 };
  return { egeszseg: nz.egeszseg.aktualis, egeszseg_max: nz.egeszseg.ertek, szivossag: (nz.tulajdonsagok.tul_constitution || {}).ertek || 0,
    magiapont: nz.magiapont ? nz.magiapont.aktualis : null, ertekek: ertekekNezetbol(nz) };
}
export function ertekekNezetbol(nz) {
  return { vedekezes: nz.vedekezes.ertek, pancelertek: nz.pancelertek.ertek, atuto_ellen: !!nz.pancelertek.atuto_ellen,
    magiapont_max: nz.magiapont ? nz.magiapont.ertek : null, akaratero: (nz.tulajdonsagok.tul_willpower || {}).ertek || 0 };
}

// A célpont Védekezése (a csata hatásaival), Páncélértéke és nézete: a nézetből, ha látható, különben a csata állapotából.
export function celAdat(r, nezetek) {
  const nz = nezetek && nezetek[r.id];
  if (nz) return { vedekezes: C.vedekezes(r, nz.vedekezes.ertek), pancelertek: nz.pancelertek.ertek, atuto_ellen: !!nz.pancelertek.atuto_ellen, nz };
  const e = r.ertekek || {};
  return { vedekezes: M.celVedekezes(r), pancelertek: Number.isFinite(Number(e.pancelertek)) ? Number(e.pancelertek) : 0, atuto_ellen: !!e.atuto_ellen, nz: null };
}

export const kezdemenyezesOssze = (nz) => P.probaOsszeallit(nz, { tul: 'tul_dexterity', fokusz: C.KEZDEMENYEZES_FOKUSZ });

// ================= A kampány csatái (DM kampánynézet) =================

export function KampanyCsatakPanel({ allapot, frissit }) {
  const [uj, setUj] = useState(false);
  const kampany = allapot.kampany;
  const futo = (allapot.csatak || []).filter((c) => c.allapot !== 'lezart');
  const lezart = (allapot.csatak || []).filter((c) => c.allapot === 'lezart').slice().reverse();
  return html`<${K.Panel} title="Csaták" actions=${html`<${K.Button} size="sm" variant="secondary" onClick=${() => setUj(true)}
      icon=${html`<${Ikon} nev="plusz" meret=${20}/>`}>Gyors csata<//>`}>
    ${futo.length ? html`<ul className="sorlista">${futo.map((c) => html`<li key=${c.id} className="sorlista__sor">
      <span><a className="sorlista__nev" href=${'#' + csataUt(kampany.id, c.id)}>${c.cim}</a><br/>
        <span className="halvany kicsi">${c.allapot === 'kezdemenyezes' ? 'Kezdeményezés' : `${c.kor}. kör`} · ${(c.adat.resztvevok || []).length} résztvevő</span></span>
      <${K.Button} size="sm" variant="primary" onClick=${() => navigal(csataUt(kampany.id, c.id))}>Folytatás<//>
    </li>`)}</ul>` : html`<p className="halvany">Nincs folyamatban lévő csata. Az összecsapások „Indítás” gombjával, vagy gyors csataként indítható.</p>`}
    ${lezart.length ? html`<details className="lenyilo"><summary>Lezárt csaták</summary>
      <ul className="sorlista">${lezart.map((c) => html`<li key=${c.id} className="sorlista__sor"><span>${c.cim}</span><span className="halvany kicsi">lezárva</span></li>`)}</ul>
    </details>` : null}
    ${uj ? html`<${CsataInditasParbeszed} allapot=${allapot} onBezar=${() => setUj(false)}
      onKesz=${async (cs) => { setUj(false); await frissit(); navigal(csataUt(kampany.id, cs.id)); }}/>` : null}
  <//>`;
}

// Indítás párbeszéd. osszecsapas: az előkészített összecsapás (Összecsapások panel), vagy null (gyors csata:
// a kampány aktív karakterei a Csapat oldalon, az ellenfeleket a csatanézetben lehet hozzáadni).
export function CsataInditasParbeszed({ allapot, osszecsapas = null, onBezar, onKesz }) {
  const { api, szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const [fut, indit] = useMuvelet();
  const o = useMemo(() => (osszecsapas ? O.normalizal(osszecsapas.adat)
    : O.csapatHozzaadas(O.uresOsszecsapas(), (allapot.karakterek || []).filter(aktivKarakter).map((c) => ({ id: c.id, nev: c.nev })))), [osszecsapas, allapot]);
  const [cim, setCim] = useState(osszecsapas ? osszecsapas.cim : 'Gyors csata');
  const [meglepett, setMeglepett] = useState([]);
  const futo = (allapot.csatak || []).filter((c) => c.allapot !== 'lezart' && osszecsapas && c.osszecsapas_id === osszecsapas.id);
  const peldanyok = O.resztvevokKibontasa(o);
  const hianyzoKarakter = peldanyok.filter((p) => p.forras.tipus === 'karakter' && !(allapot.karakterek || []).some((c) => c.id === p.forras.id && c.adat));
  const inditas = () => indit(async () => {
    if (!cim.trim()) throw new Error('Adj címet a csatának.');
    if (!lapok) throw new Error('A szabályadat még töltődik.');
    const pk = await pillanatkepekGyujtese(peldanyok.map((p) => p.forras), { lapok, allapot, api });
    const cs = C.csataOsszecsapasbol(o, (p) => egeszsegAdat(forrasNezet(p.forras, { allapot, lapok, pk })), { meglepettOldalak: meglepett });
    const v = await api.hivas('combat.start', { kampany_id: allapot.kampany.id, osszecsapas_id: osszecsapas ? osszecsapas.id : '', cim: cim.trim(), adat: cs, pillanatkepek: pk });
    onKesz(v.csata);
  });
  return html`<${Parbeszed} cim=${osszecsapas ? 'Csata indítása' : 'Gyors csata'} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${inditas}>Indítás<//>`}>
    <div className="verem">
      <${K.TextField} label="A csata címe" value=${cim} onChange=${(e) => setCim(e.target.value)}/>
      ${futo.length ? html`<${Uzenet} tonus="warning">Ebből az összecsapásból már fut egy csata (${futo.map((c) => c.cim).join(', ')}). Újat indítasz?<//>` : null}
      <p className="kicsi" style=${{ margin: 0 }}>${peldanyok.length ? O.osszegzes(o).oldalak.filter((x) => x.db).map((x) => `${x.nev}: ${x.db}`).join(' · ') : 'Még nincs résztvevő.'}
        ${osszecsapas ? '' : ' Az ellenfeleket a csatanézetben adhatod hozzá.'}</p>
      ${hianyzoKarakter.length ? html`<${Uzenet} tonus="warning">Nem látom a karakterlapját: ${hianyzoKarakter.map((p) => p.nev).join(', ')}. Az Egészsége a csatanézetben állítható.<//>` : null}
      <div>
        <p className="cimke" style=${{ margin: 0 }}>Meglepetés (AK 101.): ezek az oldalak az első körben nem cselekszenek</p>
        ${o.oldalak.map((x) => html`<${Jelolo} key=${x.id} checked=${meglepett.includes(x.id)}
          onChange=${(b) => setMeglepett((m) => (b ? m.concat([x.id]) : m.filter((y) => y !== x.id)))}>${x.nev}<//>`)}
      </div>
    </div>
  <//>`;
}

// ================= A csata állapota: optimista lépések, sorba állított mentés =================

function useCsata(kampanyId, id) {
  const { sync, uzen } = useApp();
  const ka = useKampanyAllapot(kampanyId);
  const szerver = ka.allapot && (ka.allapot.csatak || []).find((c) => c.id === id);
  const [cs, setCsAllapot] = useState(null);
  const [pk, setPk] = useState({});
  const csRef = useRef(null);
  const verzioRef = useRef(0);
  const fuggoRef = useRef(0);
  const setCs = (x) => { csRef.current = x; setCsAllapot(x); };

  useEffect(() => {
    if (!szerver || !szerver.adat || !szerver.adat.resztvevok) return;
    if (fuggoRef.current > 0 || (csRef.current && szerver.verzio < verzioRef.current)) return;
    verzioRef.current = szerver.verzio;
    setCs(szerver.adat);
    setPk(szerver.pillanatkepek || {});
  }, [szerver && szerver.verzio, szerver && szerver.id]);

  // ujra: ütközésnél (a játékos közben lépett) a lépés újraszámolása a friss állapoton, ha nincs más függő lépés.
  const kuld = (elotte, uj, kulcs, pillanatkepek, ujra) => {
    setCs(uj);
    if (pillanatkepek) setPk((p) => ({ ...p, ...pillanatkepek }));
    fuggoRef.current += 1;
    sync.push({ action: 'combat.act', adat: { id, verzio: verzioRef.current, kulcs, adat: uj, karakterek: C.karakterValtozasok(elotte, uj), pillanatkepek } })
      .then((v) => { verzioRef.current = Math.max(verzioRef.current, v.csata.verzio); })
      .catch((e) => {
        if (e.kod === 'utkozes' && e.valasz && e.valasz.aktualis) {
          const akt = e.valasz.aktualis;
          verzioRef.current = akt.verzio;
          if (ujra && fuggoRef.current === 1) {
            let ujabb = null;
            try { ujabb = ujra(akt.adat); } catch (x) { ujabb = null; }
            if (ujabb) { kuld(akt.adat, ujabb, kulcs, pillanatkepek, null); return; }
          }
          setCs(akt.adat);
          uzen('A csatát közben máshol is léptették: a friss állapot látszik, az utolsó lépésedet ismételd meg.', 'warning');
        } else uzen('A lépés nem mentődött: ' + e.message, 'danger');
      })
      .finally(() => { fuggoRef.current -= 1; if (!fuggoRef.current) ka.frissit(); });
  };

  // Egy lépés: fn a csata másolatán dolgozik. Visszaadja az új állapotot (vagy null, ha a lépés hibát dobott).
  // dm: a naplósora csak a DM-é (a játékosok nem látják).
  const lep = (leiras, fn, { pillanatkepek, dm = false } = {}) => {
    const elotte = csRef.current;
    if (!elotte) return null;
    const kulcs = C.ujKulcs();
    let uj;
    try { uj = C.lepes(elotte, leiras, fn, kulcs, { dm }); } catch (e) { uzen(e.message, 'danger'); return null; }
    kuld(elotte, uj, kulcs, pillanatkepek, (friss) => C.lepes(friss, leiras, fn, kulcs, { dm }));
    return uj;
  };
  const visszavon = () => {
    const elotte = csRef.current;
    if (!elotte || !C.visszavonhato(elotte)) return;
    const kulcs = C.ujKulcs();
    kuld(elotte, C.visszavon(elotte, kulcs), kulcs);
  };
  // a karakterlapon közben változott Egészség átvétele (helyben; a következő lépéssel mentődik)
  const helyi = (fn) => { const uj = masol(csRef.current); if (fn(uj)) setCs(uj); };
  return { ...ka, szerver, cs, pk, lep, visszavon, helyi, fuggo: () => fuggoRef.current };
}

// ================= A csatanézet =================

export function CsataOldal({ kampanyId, id, Oldalfej }) {
  const { api, szabalyok, felhasznalo, uzen } = useApp();
  const lapok = lapokBol(szabalyok);
  const c = useCsata(kampanyId, id);
  const { allapot, cs, pk, lep } = c;
  const [dobasok, naploz] = useDobasok(allapot);
  const [kijelolt, setKijelolt] = useState(null);
  const [ablak, setAblak] = useState(null); // { tipus: 'tamadas' | 'gyogyitas' | 'hozzaadas' | 'lezaras' | 'statblokk' | 'torles', ... }
  const [fut, indit] = useMuvelet();

  // lény-nézetek forrásonként (egy szörnyfajta egyszer számol)
  const nezetek = useMemo(() => {
    const m = {};
    if (!cs || !allapot) return m;
    const forras = {};
    cs.resztvevok.forEach((r) => {
      const k = pkKulcs(r.forras);
      if (!(k in forras)) forras[k] = forrasNezet(r.forras, { allapot, lapok, pk });
      m[r.id] = forras[k];
    });
    return m;
  }, [cs && cs.resztvevok.map((r) => pkKulcs(r.forras)).join(), allapot, lapok, pk]);

  // a játékos karakterek Egészsége és Mágiapontja a karakterlapról, és mindenki csataértékei a nézetből
  // (a háttér ezekből számolja a játékosok lépéseit)
  useEffect(() => {
    if (!cs || !allapot || c.fuggo()) return;
    const ertekek = {};
    cs.resztvevok.forEach((r) => { if (r.forras.tipus === 'karakter' && nezetek[r.id]) ertekek[r.forras.id] = egeszsegAdat(nezetek[r.id]); });
    c.helyi((x) => {
      let valt = Object.keys(ertekek).length ? C.karakterekFrissitese(x, ertekek) : false;
      x.resztvevok.forEach((r) => { if (r.forras.tipus !== 'karakter' && nezetek[r.id] && C.ertekekBeallitas(x, r.id, ertekekNezetbol(nezetek[r.id]))) valt = true; });
      return valt;
    });
  }, [allapot && allapot.karakterek, nezetek]);

  const vissza = [`#/dm/kampany/${kampanyId}`, allapot ? allapot.kampany.cim : 'Kampány'];
  if (c.hiba && !allapot) return html`<div><${Oldalfej} cim="Csata" vissza=${vissza}/><${Uzenet}>${c.hiba.message}<//></div>`;
  if (!allapot) return html`<${Betoltes} szoveg="Kampány betöltése…"/>`;
  const sz = c.szerver;
  if (!sz) return html`<div><${Oldalfej} cim="Csata" vissza=${vissza}/><${Uzenet} tonus="warning">Ez a csata nincs a kampány csatái közt (törölték).<//></div>`;
  if (sz.allapot === 'lezart' && !sz.adat) return html`<div><${Oldalfej} cim=${sz.cim} vissza=${vissza}/><${Uzenet} tonus="neutral">Ez a csata lezárult.<//></div>`;
  if (!cs) return html`<${Betoltes} szoveg="Csata betöltése…"/>`;

  const kampany = allapot.kampany;
  const forrasok = kampany.aktiv_forrasok || [];
  const kij = C.resztvevo(cs, kijelolt) || C.resztvevo(cs, cs.soron) || null;

  // dobás naplózása a csata azonosítójával (karakternél a karakter, NJK-nál az NJK nevében)
  const dobasNaplo = ({ r, mire, kockak, osszeallitas, ert, celertek, tipus, kezi, extra }) => {
    const d = P.naploDobas({ kampany_id: kampany.id, karakter_id: r && r.forras.tipus === 'karakter' ? r.forras.id : '', mire, kockak, osszeallitas,
      kiertekeles: ert || { eredmeny: '', mutatvanypont: 0, fok: '' }, celertek, tipus, kezi, extra });
    d.csata_id = cs && id;
    d.dobta = felhasznalo.nev;
    if (r && r.forras.tipus === 'njk') d.njk_id = r.forras.id;
    naploz(d);
    return d;
  };
  // egy művelet (csatamuvelet.js) a DM nevében: lépésként, a teljes állapottal
  const vegrehajt = (m) => lep(M.muveletLeiras(cs, m), (x) => M.muveletAlkalmazas(x, m));
  const ctx = { cs, nezetek, lapok, kampany, forrasok, lep, vegrehajt, dobasNaplo, setAblak, setKijelolt };
  const lezart = cs.allapot === 'lezart';

  return html`<div>
    <${Oldalfej} cim=${sz.cim} vissza=${vissza}>
      <${K.Button} variant="quiet" disabled=${!C.visszavonhato(cs) || lezart} onClick=${c.visszavon}
        title=${C.utolsoLepes(cs)}>${C.visszavonhato(cs) ? `Visszavonás: ${C.utolsoLepes(cs).slice(0, 40)}` : 'Visszavonás'}<//>
      <${K.Button} variant="secondary" disabled=${lezart} onClick=${() => setAblak({ tipus: 'hozzaadas' })}>Hozzáadás<//>
      <${K.Button} variant="quiet" disabled=${lezart} onClick=${() => setAblak({ tipus: 'lezaras' })}>Lezárás<//>
    <//>
    ${lezart ? html`<div className="oldalfej__uzenet"><${Uzenet} tonus="neutral">A csata lezárult.<//></div>` : null}
    ${cs.allapot === 'kezdemenyezes' ? html`<${KezdemenyezesNezet} ...${ctx}/>` : html`<div className="ket-hasab">
      <div className="verem">
        <${KorPanel} ...${ctx} lezart=${lezart}/>
        ${(cs.fuggo || []).length ? html`<${K.Panel} title="Függő próbák">
          <p className="halvany kicsi" style=${{ marginTop: 0 }}>A varázslatok célpontjainak és a mutatványoknak a próbái. A karakterek oldalát a játékosuk is dobhatja a telefonján.</p>
          <${CelpontProbak} cs=${cs} nezetek=${nezetek} vegrehajt=${vegrehajt} dobasNaplo=${dobasNaplo}/>
        <//>` : null}
        <${SorrendPanel} ...${ctx} kij=${kij}/>
        <${VarakozokPanel} ...${ctx}/>
      </div>
      <div className="verem">
        ${kij ? html`<${ResztvevoPanel} key=${kij.id} ...${ctx} r=${kij} nz=${nezetek[kij.id]}/>` : html`<${K.Panel} title="Résztvevő"><p className="halvany">Válassz résztvevőt a sorrendből.</p><//>`}
        <${CsataNaploPanel} cs=${cs}/>
      </div>
    </div>`}
    <div className="verem" style=${{ marginTop: 'var(--space-5)' }}>
      <${K.Panel} title="Dobásnapló"><${KampanyNaplo} allapot=${allapot} dobasok=${dobasok}/><//>
    </div>
    ${ablak && ablak.tipus === 'tamadas' ? html`<${TamadasAblak} ...${ctx} tamadoId=${ablak.tamado} cselekves=${ablak.cselekves} tamadas=${ablak.tamadas} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.tipus === 'varazslat' ? html`<${VarazslatAblak} ...${ctx} varazsloId=${ablak.varazslo} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.tipus === 'gyogyitas' ? html`<${GyogyitasAblak} ...${ctx} gyogyitoId=${ablak.gyogyito} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.tipus === 'hozzaadas' ? html`<${HozzaadasAblak} ...${ctx} allapot=${allapot} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.tipus === 'statblokk' ? html`<${StatblokkAblak} r=${ablak.r} allapot=${allapot} lapok=${lapok} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.tipus === 'lezaras' ? html`<${LezarasAblak} cs=${cs} id=${id} kampanyId=${kampanyId} allapot=${allapot} lapok=${lapok} szerver=${sz}
      frissit=${c.frissit} onBezar=${() => setAblak(null)}/>` : null}
  </div>`;
}

// Lezárás: összegzés, XP-javaslat az összecsapás becsült nehézségéből, az NJK-k állapotának visszaírása.
function LezarasAblak({ cs, id, kampanyId, allapot, lapok, szerver, frissit, onBezar }) {
  const { api } = useApp();
  const [fut, indit] = useMuvelet();
  const [njkIr, setNjkIr] = useState(true);
  const [xp, setXp] = useState(null);
  const osszecsapas = szerver.osszecsapas_id ? (allapot.osszecsapasok || []).find((e) => e.id === szerver.osszecsapas_id) : null;
  const o = osszecsapas ? O.normalizal(osszecsapas.adat) : O.normalizal(M.osszecsapasCsatabol(cs));
  const korny = { szornyek: (lapok && lapok['Szörnyek']) || [], njkk: allapot.njkk || [], karakterek: allapot.karakterek || [] };
  const nehezseg = O.nehezsegBecsles(o, korny);
  const njkDb = M.njkAllapotok(cs).length;
  const csKarakterek = M.csataKarakterei(cs).map((x) => {
    const k = (allapot.karakterek || []).find((c) => c.id === x.id) || {};
    const a = k.adat ? atallit(k.adat) : {};
    return { id: x.id, nev: x.nev, xp: (a.allapot && a.allapot.xp) || 0, szint: k.szint || a.szint || 1 };
  });
  const vissza = async () => { await frissit(); navigal(`/dm/kampany/${kampanyId}`); };
  if (xp) {
    return html`<${XpKiosztas} karakterek=${csKarakterek} kampanyId=${kampanyId} kezdoBesorolas=${M.XP_BESOROLAS[nehezseg.becsles] || 'kozepes'}
      kezdoOk=${`Csata: ${szerver.cim}`} onBezar=${vissza} onKesz=${vissza}/>`;
  }
  return html`<${Parbeszed} cim="A csata lezárása" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="danger" disabled=${fut} onClick=${() => indit(async () => {
      await api.hivas('combat.delete', { id });
      onBezar(); navigal(`/dm/kampany/${kampanyId}`);
    }, 'A csata törlődött.')}>Törlés (kipróbálás volt)<//>
    <${K.Button} variant="primary" disabled=${fut} onClick=${() => indit(async () => {
      await api.hivas('combat.close', { id, adat: cs, njk_visszairas: njkIr });
      if (csKarakterek.length) setXp(true); else await vissza();
    }, 'A csata lezárult.')}>${csKarakterek.length ? 'Lezárás és XP' : 'Lezárás'}<//>`}>
    <div className="verem">
      <${CsataOsszegzes} cs=${cs}/>
      ${(cs.fuggo || []).length ? html`<${Uzenet} tonus="warning">Még ${cs.fuggo.length} célpont próbája függőben: lezáráskor elmarad.<//>` : null}
      <p className="kicsi" style=${{ margin: 0 }}>Becsült nehézség: <strong>${nehezseg.becsles || 'nincs becslés'}</strong>${nehezseg.xp ? `, XP-javaslat ${nehezseg.xp}` : ''}${osszecsapas ? '' : ' (a csata résztvevőiből)'}.
        A lezárás után az XP-kiosztás nyílik meg ezzel a besorolással; ott módosíthatod vagy kihagyhatod.</p>
      ${njkDb ? html`<${Jelolo} checked=${njkIr} onChange=${setNjkIr}>Az NJK-k Egészsége, Mágiapontja és feltételei visszaíródnak az NJK-tárba (${njkDb})<//>` : null}
      <p className="halvany kicsi" style=${{ margin: 0 }}>Lezáráskor az összecsapás „lefutott” lesz, az NJK-knál a szereplés bejegyződik.</p>
    </div>
  <//>`;
}

function CsataOsszegzes({ cs }) {
  const o = C.csataOsszegzes(cs);
  return html`<div className="verem">
    <p className="kicsi" style=${{ margin: 0 }}>${o.oldalak.map((x) => `${x.nev}: ${x.harcol}/${x.osszes} harcol`).join(' · ')}</p>
    ${o.kiesettek.length ? html`<p className="kicsi" style=${{ margin: 0 }}>Kiesett vagy meghalt: ${o.kiesettek.join(', ')}</p>` : null}
    ${o.haldoklok.length ? html`<p className="kicsi" style=${{ margin: 0 }}>Haldoklik: ${o.haldoklok.join(', ')}</p>` : null}
    ${o.serultek.length ? html`<p className="kicsi" style=${{ margin: 0 }}>Sérült: ${o.serultek.join(', ')}</p>` : null}
  </div>`;
}

// ---------------- Kezdeményezés ----------------

function KezdemenyezesNezet({ cs, nezetek, lep, dobasNaplo, setAblak }) {
  // csoportonként egy sor (a csoport egyszer dob, AK 100.)
  const sorok = [];
  const latott = new Set();
  cs.resztvevok.filter((r) => !r.rejtett).forEach((r) => {
    if (r.csoport) {
      if (latott.has(r.csoport)) return;
      latott.add(r.csoport);
      const tagok = cs.resztvevok.filter((x) => x.csoport === r.csoport && !x.rejtett);
      const g = (cs.csoportok || []).find((x) => x.id === r.csoport);
      sorok.push({ r, nev: `${(g && g.nev) || r.nev} (${tagok.length})`, tagok });
    } else sorok.push({ r, nev: r.nev, tagok: [r] });
  });
  const dob = (sor, kockak, kezi, egyben) => {
    const nz = nezetek[sor.r.id];
    const ossz = kezdemenyezesOssze(nz);
    const k = { osszeg: osszeg(kockak) + ossz.bonusz, sarkany: kockak[2], tul: ossz.tulajdonsag_ertek, kockak, kezi };
    dobasNaplo({ r: sor.r, mire: `Kezdeményezés: ${sor.nev}`, kockak, osszeallitas: ossz, tipus: 'kezdemenyezes', kezi });
    if (!egyben) lep(`${sor.nev}: kezdeményezés ${k.osszeg}`, (x) => C.kezdemenyezesBeallitas(x, sor.r.id, k));
    return k;
  };
  const npcSorok = sorok.filter((s) => s.r.forras.tipus !== 'karakter' && !s.r.kezdemenyezes);
  const mindDob = () => {
    const eredmenyek = npcSorok.map((s) => [s, dob(s, [0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6)), false, true)]);
    lep(`Kezdeményezés: ${eredmenyek.length} NJK-sor`, (x) => { eredmenyek.forEach(([s, k]) => C.kezdemenyezesBeallitas(x, s.r.id, k)); });
  };
  const { holtversenyek } = C.sorrendSzamol(cs);
  const hiany = C.kezdemenyezesHianyzik(cs);
  const rejtettek = cs.resztvevok.filter((r) => r.rejtett);
  const holtNevek = new Set(holtversenyek.flat());

  return html`<div className="ket-hasab">
    <div className="verem">
      <${K.Panel} title="Kezdeményezés" actions=${html`<${K.Button} size="sm" variant="secondary" disabled=${!npcSorok.length} onClick=${mindDob}>Dobás minden NJK-ért<//>`}>
        <p className="halvany kicsi" style=${{ marginTop: 0 }}>Ügyesség (Kezdeményezés) próba, 3d6: a harmadik a sárkánykocka. A játékosok kockáját beírhatod.</p>
        <ul className="sorlista">${sorok.map((s) => {
          const nz = nezetek[s.r.id];
          const ossz = kezdemenyezesOssze(nz);
          const k = s.r.kezdemenyezes;
          return html`<li key=${s.r.id} className="sorlista__sor sorlista__sor--fuggoleges">
            <div className="sorban sorban--szet">
              <span><strong>${s.nev}</strong> <span className="halvany kicsi">${elojel(ossz.bonusz)}${s.r.meglepett ? ' · meglepett' : ''}</span></span>
              ${k ? html`<${K.Badge} tone="accent">${k.osszeg} (sárkány ${k.sarkany})<//>` : html`<span className="halvany kicsi">még nincs</span>`}
            </div>
            <${Kockadobo} db=${3} kicsi=${true} kockak=${k ? k.kockak : null} kezi=${k && k.kezi} felirat="Dobás" onDobas=${(kk, kezi) => dob(s, kk, kezi)}
              eredmeny=${(o) => html`<span className="halvany">${elojel(ossz.bonusz)} → ${o + ossz.bonusz}</span>`}/>
          </li>`;
        })}</ul>
      <//>
    </div>
    <div className="verem">
      <${K.Panel} title="Sorrend">
        ${cs.sorrend.length ? html`<ol className="egyszeru-lista">${cs.sorrend.map((rid, i) => {
          const r = C.resztvevo(cs, rid);
          return html`<li key=${rid} className="sorban sorban--szet">
            <span>${r.nev} <span className="halvany kicsi">${r.kezdemenyezes.osszeg}${holtNevek.has(rid) ? ' · holtverseny' : ''}</span></span>
            <span className="gombsor gombsor--szoros">
              <button type="button" className="sorgomb" aria-label="Feljebb" disabled=${i === 0} onClick=${() => lep(`${r.nev} feljebb`, (x) => C.athelyezes(x, rid, -1))}>↑</button>
              <button type="button" className="sorgomb" aria-label="Lejjebb" disabled=${i === cs.sorrend.length - 1} onClick=${() => lep(`${r.nev} lejjebb`, (x) => C.athelyezes(x, rid, 1))}>↓</button>
            </span>
          </li>`;
        })}</ol>` : html`<p className="halvany">A sorrend a kezdeményezésekből áll össze.</p>`}
        ${holtversenyek.length ? html`<${Uzenet} tonus="warning">Teljes holtverseny (összeg, sárkánykocka és Ügyesség is egyezik): rendezd kézzel a nyilakkal.<//>` : null}
        ${hiany.length ? html`<p className="halvany kicsi">Még nincs kezdeményezése: ${hiany.map((r) => r.nev).join(', ')}.</p>` : null}
        ${rejtettek.length ? html`<p className="halvany kicsi">Rejtett, később lép be: ${rejtettek.map((r) => r.nev).join(', ')}.</p>` : null}
        <div className="gombsor">
          <${K.Button} variant="primary" disabled=${hiany.length > 0} onClick=${() => lep('A csata elkezdődik: 1. kör', (x) => C.csataKezdes(x))}>A csata indítása<//>
          <${K.Button} variant="quiet" onClick=${() => setAblak({ tipus: 'hozzaadas' })}>Résztvevő hozzáadása<//>
        </div>
      <//>
    </div>
  </div>`;
}

// ---------------- Kör és sorrend ----------------

function KorPanel({ cs, vegrehajt, lezart }) {
  const soron = C.resztvevo(cs, cs.soron);
  const kov = C.kovetkezoNev(cs);
  return html`<${K.Panel} title=${`${cs.kor}. kör`}>
    ${soron ? html`<p style=${{ margin: 0 }}>Soron: <strong>${soron.nev}</strong> <span className="halvany kicsi">(${C.cselekvesSzoveg(soron)})</span></p>`
      : html`<${Uzenet} tonus="warning">Nincs, aki cselekedhetne (mindenki kiesett, haldoklik vagy rejtett).<//>`}
    <div className="gombsor">
      <${K.Button} variant="primary" disabled=${lezart || !soron} onClick=${() => vegrehajt({ tipus: 'kovetkezo', r: soron.id })}>Kész, következő${kov ? `: ${kov}` : ''}<//>
    </div>
  <//>`;
}

function EgeszsegSzoveg({ r }) {
  return html`<span className="kicsi">${r.egeszseg}/${r.egeszseg_max}</span>`;
}

function SorrendPanel({ cs, nezetek, lep, kij, setKijelolt, setAblak }) {
  return html`<${K.Panel} title="Sorrend">
    <ul className="sorlista">${cs.sorrend.map((rid, i) => {
      const r = C.resztvevo(cs, rid);
      if (!r) return null;
      const nz = nezetek[rid];
      const oldal = (cs.oldalak.find((o) => o.id === r.oldal) || {}).nev || '';
      const valasztott = kij && kij.id === rid;
      return html`<li key=${rid} className=${'sorlista__sor sorlista__sor--fuggoleges' + (valasztott ? ' bestiarium__sor--aktiv' : '')}>
        <div className="sorban sorban--szet">
          <button type="button" className="naplo__gomb" style=${{ textAlign: 'left' }} onClick=${() => setKijelolt(rid)}>
            ${cs.soron === rid ? '▶ ' : ''}<strong>${r.nev}</strong> <span className="halvany kicsi">${oldal}${cs.leptek.includes(rid) && cs.soron !== rid ? ' · lépett' : ''}</span>
          </button>
          <span className="gombsor gombsor--szoros">
            <button type="button" className="sorgomb" aria-label="Feljebb" disabled=${i === 0} onClick=${() => lep(`${r.nev} feljebb`, (x) => C.athelyezes(x, rid, -1))}>↑</button>
            <button type="button" className="sorgomb" aria-label="Lejjebb" disabled=${i === cs.sorrend.length - 1} onClick=${() => lep(`${r.nev} lejjebb`, (x) => C.athelyezes(x, rid, 1))}>↓</button>
          </span>
        </div>
        <div className="cimkek">
          ${r.allapot !== 'aktiv' ? html`<${K.Badge} tone=${ALLAPOT_TONUS[r.allapot]}>${C.ALLAPOT_NEV[r.allapot]}${r.allapot === 'haldoklik' && r.haldoklas_kor ? ` (${r.haldoklas_kor}. kör)` : ''}<//>` : null}
          <span className="kicsi">Egészség <strong>${r.egeszseg}</strong>/${r.egeszseg_max}</span>
          ${nz ? html`<span className="kicsi halvany">Véd. ${C.vedekezes(r, nz.vedekezes.ertek)} · PÉ ${nz.pancelertek.ertek}</span>` : html`<span className="kicsi halvany">nincs adat</span>`}
          ${r.feltetelek.map((f) => html`<span key=${f.id} className="csip csip--kicsi csip--statikus">${f.nev}${f.lejar_kor ? ` (${f.lejar_kor}. körig)` : ''}</span>`)}
          ${r.hatasok.map((h) => html`<span key=${h.id} className="csip csip--kicsi csip--statikus">${h.nev} ${elojel(h.ertek)}</span>`)}
        </div>
      </li>`;
    })}</ul>
  <//>`;
}

// Rejtett és belépésre váró résztvevők: kezdeményezés és belépés.
function VarakozokPanel({ cs, nezetek, lep, dobasNaplo }) {
  const varok = cs.resztvevok.filter((r) => r.rejtett);
  if (!varok.length) return null;
  const belep = (r, kockak, kezi) => {
    const ossz = kezdemenyezesOssze(nezetek[r.id]);
    const k = { osszeg: osszeg(kockak) + ossz.bonusz, sarkany: kockak[2], tul: ossz.tulajdonsag_ertek, kockak, kezi };
    dobasNaplo({ r, mire: `Kezdeményezés: ${r.nev}`, kockak, osszeallitas: ossz, tipus: 'kezdemenyezes', kezi });
    lep(`${r.nev} belép (kezdeményezés ${k.osszeg})`, (x) => C.belepes(x, r.id, k));
  };
  return html`<${K.Panel} title="Belépésre vár">
    <p className="halvany kicsi" style=${{ marginTop: 0 }}>A kezdeményezés dobásával belép, és a következő körtől cselekszik.</p>
    <ul className="sorlista">${varok.map((r) => html`<li key=${r.id} className="sorlista__sor sorlista__sor--fuggoleges">
      <span><strong>${r.nev}</strong> <span className="halvany kicsi">${elojel(kezdemenyezesOssze(nezetek[r.id]).bonusz)}</span></span>
      <${Kockadobo} db=${3} kicsi=${true} kockak=${null} felirat="Kezdeményezés és belépés" onDobas=${(k, kezi) => belep(r, k, kezi)}/>
    </li>`)}</ul>
  <//>`;
}

function CsataNaploPanel({ cs }) {
  const sorok = (cs.naplo || []).slice().reverse().slice(0, 30);
  return html`<${K.Panel} title="A csata eseményei">
    <ul className="egyszeru-lista">${sorok.map((n, i) => html`<li key=${i} className="kicsi"><span className="halvany">${n.kor ? n.kor + '. kör · ' : ''}</span>${n.szoveg}</li>`)}</ul>
  <//>`;
}

// ---------------- Egy résztvevő: cselekvések, Egészség, feltételek ----------------

function ResztvevoPanel({ cs, r, nz, lep, vegrehajt, setAblak, lapok, dobasNaplo }) {
  const [szam, setSzam] = useState('');
  const [feltetel, setFeltetel] = useState('fekszik');
  const [egyedi, setEgyedi] = useState('');
  const [korok, setKorok] = useState('');
  const [szabad, setSzabad] = useState('');
  const [szabadFajta, setSzabadFajta] = useState('mellek');
  const soron = cs.soron === r.id;
  const n = parseInt(String(szam).replace('−', '-'), 10);
  const cselekves = (kulcs) => {
    const a = C.cselekvesAdat(kulcs);
    if (a.tamadas) { setAblak({ tipus: 'tamadas', tamado: r.id, cselekves: kulcs }); return; }
    if (kulcs === 'gyogyitas') { setAblak({ tipus: 'gyogyitas', gyogyito: r.id }); return; }
    vegrehajt({ tipus: 'cselekves', r: r.id, kulcs });
  };
  const [mpSzam, setMpSzam] = useState('');
  const mpN = parseInt(mpSzam, 10);
  const varazsol = nz && lapok && varazsloVarazslatai(nz, lapok).length > 0;
  const harcolhat = r.allapot === 'aktiv' && !r.rejtett;
  return html`<${K.Panel} title=${r.nev} actions=${r.forras.tipus === 'karakter'
      ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => navigal('/dm/karakter/' + r.forras.id)}>Karakterlap<//>`
      : html`<${K.Button} size="sm" variant="quiet" onClick=${() => setAblak({ tipus: 'statblokk', r })}>Statblokk<//>`}>
    <div className="verem">
      <div className="cimkek">
        <${K.Badge} tone=${ALLAPOT_TONUS[r.allapot]}>${C.ALLAPOT_NEV[r.allapot]}<//>
        ${soron ? html`<${K.Badge} tone="accent">soron van<//>` : null}
        ${r.fontos ? html`<${K.Badge}>fontos<//>` : null}
        <span className="halvany kicsi">${C.cselekvesSzoveg(r)}</span>
      </div>
      <${K.ResourceBar} kind="health" value=${r.egeszseg} max=${Math.max(1, r.egeszseg_max)} label="Egészség"/>
      ${r.magiapont !== null && r.magiapont !== undefined ? html`<${K.ResourceBar} kind="magic" value=${r.magiapont} max=${Math.max(1, (r.ertekek && r.ertekek.magiapont_max) || r.magiapont)} label="Mágiapont"/>` : null}
      ${nz ? html`<p className="kicsi" style=${{ margin: 0 }}>Védekezés ${C.vedekezes(r, nz.vedekezes.ertek)}${C.hatasOsszeg(r, 'vedekezes') ? ` (alap ${nz.vedekezes.ertek})` : ''} · Páncélérték ${nz.pancelertek.ertek}${nz.pancelertek.atuto_ellen ? ' (átütő ellen is)' : ''} · Sebesség ${nz.sebesseg.ertek === null ? '–' : nz.sebesseg.ertek}</p>`
        : html`<${Uzenet} tonus="warning">A lény adatai nem érhetők el (szabályadat vagy karakterlap hiányzik). Az Egészség kézzel kezelhető.<//>`}

      ${harcolhat && nz ? html`<div>
        <p className="cimke" style=${{ margin: 0 }}>Támadás</p>
        <div className="gombsor gombsor--szoros">
          ${nz.tamadasok.filter((t) => t.tamadas !== null).map((t) => html`<${K.Button} key=${t.kulcs} size="sm" variant=${soron ? 'primary' : 'secondary'}
            disabled=${!C.cselekvesEngedett(r, 'fo')} onClick=${() => setAblak({ tipus: 'tamadas', tamado: r.id, cselekves: 'tamadas', tamadas: t.kulcs })}>
            ${t.nev_hu} ${elojel(t.tamadas)} (${t.sebzes || '?'})<//>`)}
          ${!nz.tamadasok.length ? html`<span className="halvany kicsi">Nincs támadása.</span>` : null}
          ${varazsol ? html`<${K.Button} size="sm" variant=${soron ? 'primary' : 'secondary'} disabled=${!C.cselekvesEngedett(r, 'mellek')}
            onClick=${() => setAblak({ tipus: 'varazslat', varazslo: r.id })}>Varázslat<//>` : null}
        </div>
      </div>` : null}

      ${harcolhat ? html`<div>
        <p className="cimke" style=${{ margin: 0 }}>Cselekvések</p>
        <div className="gombsor gombsor--szoros">
          ${C.CSELEKVESEK.filter((x) => x.kulcs !== 'tamadas').map((a) => html`<${K.Button} key=${a.kulcs} size="sm" variant="quiet" title=${a.leiras || a.en}
            disabled=${!C.cselekvesEngedett(r, a.fajta) || (a.tamadas && !nz) || (a.kulcs === 'futas' && C.vanFeltetel(r, 'fekszik'))} onClick=${() => cselekves(a.kulcs)}>${a.nev}${a.fajta === 'mellek' ? ' (m)' : ''}<//>`)}
        </div>
        <div className="sorban" style=${{ marginTop: 'var(--space-2)' }}>
          <${K.TextField} label="Más cselekvés" placeholder="például Lefegyverzés, ital" value=${szabad} onChange=${(e) => setSzabad(e.target.value)}/>
          <${Valaszto} label="Fajta" value=${szabadFajta} onChange=${setSzabadFajta} opciok=${[{ value: 'fo', label: 'fő' }, { value: 'mellek', label: 'mellék' }, { value: 'szabad', label: 'szabad' }]}/>
          <${K.Button} disabled=${!szabad.trim() || !C.cselekvesEngedett(r, szabadFajta)}
            onClick=${() => { const t = szabad.trim(); setSzabad(''); vegrehajt({ tipus: 'cselekves', r: r.id, szabad: { nev: t, fajta: szabadFajta } }); }}>Rögzítés<//>
        </div>
        <div className="gombsor gombsor--szoros">
          <${K.Button} size="sm" variant="quiet" onClick=${() => lep(`${r.nev}: +1 cselekvés (DM)`, (x) => C.cselekvesFeloldas(x, r.id))}>+1 cselekvés (DM)<//>
          <${K.Button} size="sm" variant="quiet" onClick=${() => lep(`${r.nev} a sorrend élére`, (x) => C.sorrendElere(x, r.id))}>A sorrend élére<//>
        </div>
        <${Sugo} cim="Cselekvések">Körönként egy fő és egy mellék, vagy két mellék cselekvés (AK 33.). Az (m) a mellék cselekvés. A Védekezés és a Célzás hatását a felület alkalmazza, a többi csak jelölés: a hatásuk a mesélésben dől el.<//>
      </div>` : null}

      <div>
        <p className="cimke" style=${{ margin: 0 }}>Egészség kézzel</p>
        <div className="sorban">
          <${K.TextField} label="Mennyi" inputMode="numeric" value=${szam} onChange=${(e) => setSzam(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}/>
          <${K.Button} disabled=${!(n > 0)} onClick=${() => { setSzam(''); lep(`${r.nev}: ${n} sebzés (kézi, páncél nélkül)`, (x) => C.sebzesAlkalmazas(x, r.id, n)); }}>Sebzés<//>
          <${K.Button} disabled=${!(n > 0)} onClick=${() => { setSzam(''); lep(`${r.nev}: ${n} gyógyulás`, (x) => C.gyogyitas(x, r.id, n)); }}>Gyógyulás<//>
        </div>
      </div>

      ${r.magiapont !== null && r.magiapont !== undefined ? html`<div>
        <p className="cimke" style=${{ margin: 0 }}>Mágiapont kézzel</p>
        <div className="sorban">
          <${K.TextField} label="Mennyi" inputMode="numeric" value=${mpSzam} onChange=${(e) => setMpSzam(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}/>
          <${K.Button} disabled=${!(mpN > 0)} onClick=${() => { setMpSzam(''); lep(`${r.nev}: −${mpN} MP`, (x) => C.magiapontBeallitas(x, r.id, r.magiapont - mpN)); }}>Levonás<//>
          <${K.Button} disabled=${!(mpN > 0)} onClick=${() => { setMpSzam(''); lep(`${r.nev}: +${mpN} MP`, (x) => C.magiapontBeallitas(x, r.id, r.magiapont + mpN)); }}>Visszanyerés<//>
        </div>
      </div>` : null}

      <div>
        <p className="cimke" style=${{ margin: 0 }}>Feltételek</p>
        <div className="csipek">${r.feltetelek.map((f) => html`<span key=${f.id} className="csip">${f.nev}${f.lejar_kor ? ` (${f.lejar_kor}. kör elejéig)` : ''}
          <button type="button" className="csip__gomb" aria-label=${f.nev + ' levétele'} onClick=${() => lep(`${r.nev}: ${f.nev} lekerült`, (x) => C.feltetelTorles(x, r.id, f.id))}>×</button></span>`)}
          ${!r.feltetelek.length ? html`<span className="halvany kicsi">Nincs.</span>` : null}</div>
        <div className="sorban">
          <${Valaszto} label="Feltétel" value=${feltetel} onChange=${setFeltetel} opciok=${C.FELTETELEK.map((f) => ({ value: f.kulcs, label: `${f.nev} (${f.en})` })).concat([{ value: '_egyedi', label: 'Egyedi…' }])}/>
          ${feltetel === '_egyedi' ? html`<${K.TextField} label="Neve" value=${egyedi} onChange=${(e) => setEgyedi(e.target.value)}/>` : null}
          <${K.TextField} label="Körök" hint="Üresen: amíg le nem veszed" inputMode="numeric" value=${korok} onChange=${(e) => setKorok(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}/>
          <${K.Button} disabled=${feltetel === '_egyedi' && !egyedi.trim()} onClick=${() => {
            const adat = feltetel === '_egyedi' ? { nev: egyedi.trim(), korok } : { kulcs: feltetel, korok };
            const nev = adat.nev || (C.FELTETELEK.find((f) => f.kulcs === feltetel) || {}).nev;
            setEgyedi(''); setKorok('');
            lep(`${r.nev}: ${nev}`, (x) => C.feltetelHozzaadas(x, r.id, adat));
          }}>Hozzáadás<//>
        </div>
      </div>

      <details className="lenyilo">
        <summary>Állapot, oldal, eltávolítás</summary>
        <div className="verem">
          <${Valaszto} label="Állapot" value=${r.allapot} onChange=${(a) => lep(`${r.nev}: ${C.ALLAPOT_NEV[a]} (DM)`, (x) => C.allapotBeallitas(x, r.id, a))}
            opciok=${Object.keys(C.ALLAPOT_NEV).map((k) => ({ value: k, label: C.ALLAPOT_NEV[k] }))}/>
          <${Jelolo} checked=${r.fontos} onChange=${(b) => lep(`${r.nev}: ${b ? 'fontos' : 'nem fontos'}`, (x) => C.fontosBeallitas(x, r.id, b))}>Fontos (nullán haldoklik, nem esik ki)<//>
          <${Valaszto} label="Oldal" value=${r.oldal} onChange=${(o) => lep(`${r.nev} oldalt vált`, (x) => C.oldalValtas(x, r.id, o))}
            opciok=${cs.oldalak.map((o) => ({ value: o.id, label: o.nev }))}/>
          <div className="gombsor"><${K.Button} size="sm" variant="quiet" onClick=${() => lep(`${r.nev} eltávolítva`, (x) => C.resztvevoTorles(x, r.id))}>Eltávolítás a csatából<//></div>
        </div>
      </details>
    </div>
  <//>`;
}

// ---------------- Támadás: célpont, próba, mutatványok, sebzés ----------------
// A DM és a játékos felülete is ezt használja. vegrehajt(m): a kész művelet (csatamuvelet.js) végrehajtása.
// nezetek: a látható lény-nézetek (a játékosnál csak a saját résztvevőié); a célpont értékei hiányukban a csata
// állapotából jönnek (ertekek). mutatSzam: a célpont Védekezése számmal látszik-e (a játékosnál a beállítás szerint).
export function TamadasAblak({ cs, nezetek, lapok, kampany, forrasok, vegrehajt, dobasNaplo, tamadoId, cselekves: kezdoCselekves, tamadas: kezdoTamadas, mutatSzam = true, onBezar }) {
  const { sync, uzen } = useApp();
  const tamado = C.resztvevo(cs, tamadoId);
  const nz = nezetek[tamadoId];
  const tamadasok = (nz ? nz.tamadasok : []).filter((t) => t.tamadas !== null);
  const [tKulcs, setTKulcs] = useState(kezdoTamadas || (tamadasok[0] ? tamadasok[0].kulcs : ''));
  const [cselekves, setCselekves] = useState(kezdoCselekves || 'tamadas');
  const celpontok = O.celpontSorrend(cs, cs.resztvevok.filter((r) => !r.rejtett && r.allapot !== 'halott'), tamado ? tamado.oldal : '', tamadoId);
  // Megfélemlítve: a fenyegetőt kell támadnia (AK, Fenyegetés mutatvány)
  const fenyegeto = ((tamado && tamado.feltetelek) || []).find((f) => f.kulcs === 'megfelemlitve' && f.forras);
  const [celId, setCelId] = useState(fenyegeto && celpontok.some((x) => x.id === fenyegeto.forras) ? fenyegeto.forras : (celpontok[0] ? celpontok[0].id : ''));
  const [batorsag, setBatorsag] = useState(null); // Félelmetes varázslat: { kockak, kezi, osszeg, siker }
  const [hosszu, setHosszu] = useState(false);
  const [kezi, setKezi] = useState('0');
  const [dobas, setDobas] = useState(null); // { kockak, kezi, osszeg, cel, talalat, mp, naploId }
  const [mutNyitva, setMutNyitva] = useState(false);
  const [mut, setMut] = useState(null);
  const [seb1, setSeb1] = useState(null);
  const [cel2Id, setCel2Id] = useState('');
  const [seb2, setSeb2] = useState(null);
  const [kegyelem, setKegyelem] = useState(false);
  if (!tamado || !nz) return null;
  const t = tamadasok.find((x) => x.kulcs === tKulcs) || tamadasok[0];
  if (!t) return html`<${Parbeszed} cim="Támadás" onBezar=${onBezar}><p>Ennek a résztvevőnek nincs támadása.</p><//>`;
  const cel = C.resztvevo(cs, celId);
  const celA = cel ? celAdat(cel, nezetek) : null;
  const csAdat = C.cselekvesAdat(cselekves);
  const figyelmeztetes = cel ? O.celpontFigyelmeztetes(cs, tamado.oldal, cel.oldal) : null;
  const fenyegetoNev = fenyegeto ? (C.resztvevo(cs, fenyegeto.forras) || {}).nev : '';
  const felelmetes = cel && !t.tavolsagi ? (cel.hatasok || []).find((h) => h.cel === 'felelmetes') : null;
  const batorsagOssz = felelmetes ? P.probaOsszeallit(nz, { tul: 'tul_willpower', fokusz: 'fok_willpower_courage', modositok: C.probaBonuszok(tamado) }) : null;
  const felelmetesGatol = felelmetes && !(batorsag && batorsag.siker);
  const modositok = C.tamadasModositok(tamado, cel, { tavolsagi: t.tavolsagi });
  if (cselekves === 'roham') modositok.push({ ertek: 1, eredet: 'Rohamozás' });
  if (t.tavolsagi && hosszu) modositok.push({ ertek: -2, eredet: 'Hosszú táv' });
  const kezSzam = parseInt(String(kezi).replace('−', '-'), 10) || 0;
  if (kezSzam) modositok.push({ ertek: kezSzam, eredet: 'Módosító' });
  const bonusz = t.tamadas + modositok.reduce((a, m) => a + m.ertek, 0);
  const ved = celA ? celA.vedekezes : null;
  const uj = () => { setDobas(null); setMut(null); setMutNyitva(false); setSeb1(null); setSeb2(null); setCel2Id(''); setBatorsag(null); };
  const vedSzoveg = (r) => { const a = celAdat(r, nezetek); return a.vedekezes === null ? '' : (mutatSzam ? `, Véd. ${a.vedekezes}` : ''); };

  const tamadasDobas = (kockak, beirt) => {
    const ossz = { bonusz, reszek: [{ ertek: t.tamadas, eredet: t.nev_hu }].concat(modositok.map((m) => ({ ertek: m.ertek, eredet: m.eredet }))) };
    const ert = P.probaKiertekel(kockak, bonusz, { celertek: ved === null ? undefined : ved });
    const d = dobasNaplo({ r: tamado, mire: `${tamado.nev}: ${t.nev_hu} → ${cel ? cel.nev : '?'}`, kockak, osszeallitas: ossz, ert, celertek: ved === null || !mutatSzam ? undefined : ved, tipus: 'tamadas', kezi: beirt });
    setMut(null); setMutNyitva(false); setSeb1(null); setSeb2(null);
    setDobas({ kockak, kezi: beirt, osszeg: ert.osszeg, talalat: ved === null ? true : ert.eredmeny === 'siker', mp: ert.mutatvanypont, naploId: d.id, cel: celId, ismeretlen: ved === null });
  };
  const mh = C.mutatvanyHatasok(mut ? mut.mutatvanyok : [], lapok);
  const kif = C.sebzesKifejezes(t.sebzes) || { kocka: 1, plusz: 0, ismeretlen: true };
  const kocka = kif.kocka + mh.sebzes_kocka;
  const plusz = kif.plusz + (cselekves === 'mindent_bele' ? 1 : 0);
  const nyers = (kockak) => osszeg(kockak) + plusz;
  const szamol = (kockak, celR) => { const a = celAdat(celR, nezetek); return C.sebzesSzamol({ osszeg: nyers(kockak), pancelertek: a.pancelertek, atuto: t.atuto, atuto_ellen: a.atuto_ellen, fel_pancel: mh.fel_pancel }); };
  const sebzesDobas = (celR, setSeb) => (kockak, beirt) => {
    dobasNaplo({ r: tamado, mire: `Sebzés: ${tamado.nev} → ${celR.nev}`, kockak, osszeallitas: { bonusz: plusz, reszek: plusz ? [{ ertek: plusz, eredet: 'Sebzés bónusza' }] : [] }, tipus: 'sebzes', kezi: beirt });
    setSeb({ kockak, kezi: beirt });
  };
  const cel2 = C.resztvevo(cs, cel2Id);
  const ved2 = cel2 ? celAdat(cel2, nezetek).vedekezes : null;
  const talalat2 = cel2 && dobas ? (ved2 === null ? true : dobas.osszeg >= ved2) : false;
  const kesz1 = dobas && (!dobas.talalat || kocka === 0 || seb1);
  const kesz = !felelmetesGatol && kesz1 && (!dobas || !dobas.talalat || !mh.kettos || !cel2 || !talalat2 || kocka === 0 || seb2) && !mutNyitva && !(dobas && dobas.mp && !mut);

  const alkalmaz = () => {
    const m = {
      tipus: 'tamadas', r: tamado.id, cel: cel.id, cselekves, tamadas: { nev: t.nev_hu, atuto: !!t.atuto },
      osszeg: dobas.osszeg, talalat: dobas.talalat, sebzes: dobas.talalat ? nyers(seb1 ? seb1.kockak : []) : 0, pancel: celA.pancelertek,
      fel_pancel: !!mh.fel_pancel, kegyelem,
      masodik: dobas.talalat && mh.kettos && cel2 && talalat2 ? { cel: cel2.id, sebzes: nyers(seb2 ? seb2.kockak : []), talalat: true, pancel: celAdat(cel2, nezetek).pancelertek } : null,
      hatasok: { fekszik: mh.fekszik, vedoallas: mh.vedoallas, atvetel: mh.atvetel, villam: mh.villam },
      mutatvanyok: mut ? mut.mutatvanyok.map((x) => x.nev) : [],
      mutatvany_probak: dobas.talalat && mut ? M.mutatvanyProbak(mut.mutatvanyok).map((p) => ({ ...p, bonusz: t.tamadas })) : []
    };
    vegrehajt(m);
    onBezar();
  };

  const mutKesz = (v) => {
    setMut(v); setMutNyitva(false);
    sync.push({ action: 'roll.update', adat: { id: dobas.naploId, mutatvanyok: v.mutatvanyok, plusz: v.plusz } })
      .catch((e) => uzen('A mutatványok nem kerültek a naplóba: ' + e.message, 'danger'));
  };

  return html`<${Parbeszed} cim=${`${tamado.nev} támad`} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!kesz} onClick=${alkalmaz}>Alkalmazás<//>`}>
    <div className="verem">
      <${Kapcsolo} cimke="Cselekvés" teljes ertek=${cselekves} onValt=${(x) => { setCselekves(x); uj(); }}
        opciok=${[{ value: 'tamadas', label: 'Támadás' }, { value: 'roham', label: 'Rohamozás (+1)' }, { value: 'mindent_bele', label: 'Mindent bele' }]}/>
      ${csAdat && csAdat.leiras ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>${csAdat.leiras}</p>` : null}
      <div className="sorban">
        <${Valaszto} label="Támadás" value=${t.kulcs} onChange=${(x) => { setTKulcs(x); uj(); }}
          opciok=${tamadasok.map((x) => ({ value: x.kulcs, label: `${x.nev_hu} ${elojel(x.tamadas)}, ${x.sebzes || '?'}${x.atuto ? ' (átütő)' : ''}` }))}/>
        <${Valaszto} label="Célpont" value=${celId} onChange=${(x) => { setCelId(x); uj(); }}
          opciok=${celpontok.map((x) => ({ value: x.id, label: `${x.nev} (${O.VISZONYOK[x.viszony].nev}${vedSzoveg(x)}${x.allapot !== 'aktiv' ? ', ' + C.ALLAPOT_NEV[x.allapot] : ''})` }))}/>
      </div>
      ${figyelmeztetes ? html`<${Uzenet} tonus="warning">${figyelmeztetes}<//>` : null}
      ${fenyegeto && celId !== fenyegeto.forras ? html`<${Uzenet} tonus="warning">${tamado.nev} Megfélemlítve: ebben a körében ${fenyegetoNev || 'a fenyegetőt'} kell támadnia.<//>` : null}
      ${C.vanFeltetel(tamado, 'lefegyverezve') && !t.termeszetes ? html`<${Uzenet} tonus="warning">${tamado.nev} Lefegyverezve: a fegyvere a földön van, előbb Előkészítés kell (vagy más fegyver).<//>` : null}
      ${felelmetes ? html`<div className="verem">
        <${Uzenet} tonus=${batorsag ? (batorsag.siker ? 'success' : 'danger') : 'warning'}>${cel.nev} Félelmetes varázslat alatt áll: közelharci támadás előtt Akaraterő (Bátorság) próba ${felelmetes.ertek} ellen${batorsag ? (batorsag.siker ? `, sikerült (${batorsag.osszeg}).` : `, nem sikerült (${batorsag.osszeg}): támadás helyett Mozgás vagy Védekezés.`) : '.'}<//>
        ${!batorsag ? html`<${Kockadobo} db=${3} kockak=${null} felirat="Bátorság: 3d6" onDobas=${(kockak, beirt) => {
          const ert = P.probaKiertekel(kockak, batorsagOssz.bonusz, { celertek: felelmetes.ertek });
          dobasNaplo({ r: tamado, mire: `${tamado.nev}: Akaraterő (Bátorság) a Félelmetes varázslat ellen`, kockak, osszeallitas: batorsagOssz, ert, celertek: felelmetes.ertek, tipus: 'alap', kezi: beirt });
          setBatorsag({ kockak, osszeg: ert.osszeg, siker: ert.eredmeny === 'siker' });
        }} eredmeny=${(o) => html`<span className="halvany">${elojel(batorsagOssz.bonusz)} → ${o + batorsagOssz.bonusz}</span>`}/>` : null}
        ${batorsag && !batorsag.siker ? html`<div className="gombsor">
          <${K.Button} variant="primary" onClick=${() => { vegrehajt({ tipus: 'cselekves', r: tamado.id, kulcs: 'vedekezes' }); onBezar(); }}>Védekezés helyette<//>
          <${K.Button} variant="secondary" onClick=${() => { vegrehajt({ tipus: 'cselekves', r: tamado.id, kulcs: 'mozgas' }); onBezar(); }}>Mozgás helyette<//>
        </div>` : null}
      </div>` : null}
      ${t.megjegyzes ? html`<p className="sugo kicsi">${t.megjegyzes}</p>` : null}
      <div className="sorban">
        ${t.tavolsagi ? html`<${Jelolo} checked=${hosszu} onChange=${(b) => { setHosszu(b); uj(); }}>Hosszú táv (−2)<//>` : null}
        <${K.TextField} label="Módosító" hint="A DM adja (±1–3)" inputMode="numeric" value=${kezi}
          onChange=${(e) => { setKezi(e.target.value.replace(/[^0-9−-]/g, '').replace('−', '-').slice(0, 3)); uj(); }}/>
      </div>
      <div className="osszegsor">
        <span>3d6 ${elojel(t.tamadas)} (${t.nev_hu})${modositok.map((m, i) => html`<span key=${i}> ${elojel(m.ertek)} (${m.eredet})</span>`)}</span>
        <span className="osszegsor__ertek">${elojel(bonusz)}${ved !== null && mutatSzam ? ` vs Véd. ${ved}` : ''}</span>
      </div>
      ${felelmetesGatol ? null : html`<${Kockadobo} db=${3} kockak=${dobas ? dobas.kockak : null} kezi=${dobas && dobas.kezi} felirat="Támadás: 3d6" onDobas=${tamadasDobas}
        eredmeny=${(o) => html`<span className="halvany">${elojel(bonusz)} → ${o + bonusz}</span>`}/>`}
      ${dobas ? html`<${Uzenet} tonus=${dobas.talalat ? 'success' : 'neutral'}>${dobas.osszeg}: ${dobas.ismeretlen ? 'a célpont Védekezése nem ismert, a DM dönt (találatként számolom)' : dobas.talalat ? 'találat' : 'nem talált'}${dobas.mp ? `, ${dobas.mp} Mutatványpont` : ''}.<//>` : null}

      ${dobas && dobas.mp && dobas.talalat && !mut && !mutNyitva ? html`<div className="gombsor"><${K.Button} variant="primary" onClick=${() => setMutNyitva(true)}>${dobas.mp} Mutatványpont elköltése<//>
        <${K.Button} variant="quiet" onClick=${() => mutKesz({ mutatvanyok: [], plusz: [] })}>Nem költök<//></div>` : null}
      ${dobas && mutNyitva ? html`<${MutatvanyValaszto} lapok=${lapok} lap=${nz} pont=${dobas.mp} celpont=${celA && celA.nz}
        kontextus=${{ tipus: 'tamadas', tamadas: t.tavolsagi ? 'tavolsagi' : 'kozelharci', tul: t.tulajdonsag || undefined, fokusz: t.fokusz || undefined }}
        forrasok=${forrasok} beallitas=${kampany.beallitasok} onKesz=${mutKesz} onMegse=${() => setMutNyitva(false)}/>` : null}
      ${mut && !mutNyitva ? html`<div className="gombsor">
        <p className="mutatvany__osszegzes">✓ ${mut.mutatvanyok.length ? mut.mutatvanyok.map((m) => `${m.nev}${m.db > 1 ? ' × ' + m.db : ''} (${m.mp})`).join(', ') : 'Nem költött pontot.'}</p>
        <${K.Button} size="sm" variant="quiet" onClick=${() => setMutNyitva(true)}>Módosítás<//>
      </div>` : null}
      ${mut && (mh.fekszik || mh.vedoallas || mh.atvetel || mh.villam || mh.fel_pancel || mh.sebzes_kocka) ? html`<p className="kicsi" style=${{ margin: 0 }}>A felület alkalmazza: ${[
        mh.sebzes_kocka ? `+${mh.sebzes_kocka}d6 sebzés` : '', mh.fel_pancel ? 'fél Páncélérték' : '', mh.fekszik ? 'a célpont földre kerül' : '',
        mh.vedoallas ? '+2 Védekezés a támadónak' : '', mh.atvetel ? 'a támadó a sorrend élére kerül' : '', mh.villam ? 'még egy támadás' : ''].filter(Boolean).join(', ')}.</p>` : null}
      ${mut && mh.szoveges.length ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>A DM dönt: ${mh.szoveges.filter((n) => !mut.mutatvanyok.some((x) => x.nev === n && M.MUTATVANY_PROBAK[x.id])).join(', ') || 'semmi más'}.</p>` : null}
      <${MutatvanyProbaJelzes} mutatvanyok=${mut && dobas && dobas.talalat ? mut.mutatvanyok : []}/>

      ${dobas && dobas.talalat && (!dobas.mp || mut) && !mutNyitva ? html`<div className="verem">
        <p className="cimke" style=${{ margin: 0 }}>Sebzés: ${kocka ? `${kocka}d6` : ''}${plusz ? elojel(plusz) : ''}${kif.ismeretlen ? ' (a sebzés formája ismeretlen, 1d6-tal számolok)' : ''}${t.atuto ? ' · átütő' : ''}</p>
        ${kocka > 0 ? html`<${Kockadobo} db=${kocka} kockak=${seb1 ? seb1.kockak : null} kezi=${seb1 && seb1.kezi} felirat=${`Sebzés: ${kocka}d6`} onDobas=${sebzesDobas(cel, setSeb1)}/>` : null}
        ${seb1 || kocka === 0 ? html`<${SebzesSor} cel=${cel} sz=${szamol(seb1 ? seb1.kockak : [], cel)}/>` : null}
        ${mh.kettos ? html`<div className="verem">
          <${Valaszto} label="Kettős csapás: második célpont" value=${cel2Id} ures="válassz…" onChange=${(x) => { setCel2Id(x); setSeb2(null); }}
            opciok=${celpontok.filter((x) => x.id !== celId).map((x) => ({ value: x.id, label: `${x.nev}${vedSzoveg(x)}` }))}/>
          ${cel2 ? (talalat2 ? html`${kocka > 0 ? html`<${Kockadobo} db=${kocka} kockak=${seb2 ? seb2.kockak : null} kezi=${seb2 && seb2.kezi} felirat=${`Sebzés: ${kocka}d6`} onDobas=${sebzesDobas(cel2, setSeb2)}/>` : null}
            ${seb2 || kocka === 0 ? html`<${SebzesSor} cel=${cel2} sz=${szamol(seb2 ? seb2.kockak : [], cel2)}/>` : null}` : html`<p className="kicsi">${cel2.nev}: a támadás összege nem éri el a Védekezését.</p>`) : null}
        </div>` : null}
        <${Jelolo} checked=${kegyelem} onChange=${setKegyelem}>Ha leterítené: eszméletlen 1 Egészséggel (a kegyelemdöfés elmarad)<//>
      </div>` : null}
    </div>
  <//>`;
}

// A kiválasztott mutatványok közül a próbát kérők: az alkalmazás után kártyaként várnak.
function MutatvanyProbaJelzes({ mutatvanyok }) {
  const lista = M.mutatvanyProbak(mutatvanyok);
  if (!lista.length) return null;
  return html`<div className="verem">${lista.map((p) => { const d = M.MUTATVANY_PROBAK[p.mutatvany]; return html`<p key=${p.mutatvany} className="kicsi" style=${{ margin: 0 }}>
    <strong>${p.nev}:</strong> ${d.tipus === 'ellen' ? `${d.tamado.nev} ellenpróba a célpont ${d.cel.nev} próbája ellen` : `${d.tamado.nev}${d.celertek ? ' ' + d.celertek + ' ellen' : ''}`}. ${d.kovetkezmeny} Az alkalmazás után kártyaként vár.</p>`; })}</div>`;
}

function SebzesSor({ cel, sz }) {
  const ismert = cel.egeszseg !== null && cel.egeszseg !== undefined;
  return html`<div className="osszegsor">
    <span>${sz.nyers}${sz.pancel ? ` − ${sz.pancel} (Páncélérték)` : ''}</span>
    <span className="osszegsor__ertek">${cel.nev}: ${sz.vegso} sebzés${ismert ? ` → ${Math.max(0, cel.egeszseg - sz.vegso)}/${cel.egeszseg_max}` : ''}</span>
  </div>`;
}

// ---------------- Gyógyítás (Heal cselekvés) ----------------

export function GyogyitasAblak({ cs, nezetek, vegrehajt, dobasNaplo, gyogyitoId, onBezar }) {
  const gy = C.resztvevo(cs, gyogyitoId);
  const nz = nezetek[gyogyitoId];
  const serult = (r) => (r.egeszseg === null || r.egeszseg === undefined ? r.egeszseg_szoveg !== 'ép' : r.egeszseg < r.egeszseg_max);
  const celok = cs.resztvevok.filter((r) => !r.rejtett && r.allapot !== 'halott' && r.id !== gyogyitoId && serult(r))
    .sort((a, b) => (a.oldal === (gy && gy.oldal) ? 0 : 1) - (b.oldal === (gy && gy.oldal) ? 0 : 1));
  const [celId, setCelId] = useState(celok[0] ? celok[0].id : '');
  const [dobas, setDobas] = useState(null);
  if (!gy || !nz) return null;
  const cel = C.resztvevo(cs, celId);
  const ossz = P.probaOsszeallit(nz, { tul: 'tul_intelligence', fokusz: C.GYOGYITAS_FOKUSZ });
  const intel = (nz.tulajdonsagok.tul_intelligence || {}).ertek || 0;
  const dob = (kockak, kezi) => {
    const ert = P.probaKiertekel(kockak, ossz.bonusz, { celertek: C.GYOGYITAS_CELERTEK });
    dobasNaplo({ r: gy, mire: `Gyógyítás: ${gy.nev} → ${cel ? cel.nev : '?'}`, kockak, osszeallitas: ossz, ert, celertek: C.GYOGYITAS_CELERTEK, tipus: 'alap', kezi });
    setDobas({ kockak, kezi, ert, mennyi: ert.eredmeny === 'siker' ? Math.max(0, kockak[2] + intel) : 0 });
  };
  const alkalmaz = () => { vegrehajt({ tipus: 'gyogyitas', r: gy.id, cel: cel.id, mennyi: dobas.mennyi }); onBezar(); };
  const eSzoveg = (r) => (r.egeszseg === null || r.egeszseg === undefined ? r.egeszseg_szoveg : `${r.egeszseg}/${r.egeszseg_max}`);
  return html`<${Parbeszed} cim=${`${gy.nev} gyógyít`} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!dobas || !cel || (cel && cel.gyogyithato === false && dobas.mennyi > 0)} onClick=${alkalmaz}>Alkalmazás<//>`}>
    <div className="verem">
      <p className="halvany kicsi" style=${{ margin: 0 }}>Szomszédos társ, kötszer kell. Intelligencia (Gyógyítás) 11; siker esetén sárkánykocka + Intelligencia Egészség (AK 34.).</p>
      ${celok.length ? html`<${Valaszto} label="Kit" value=${celId} onChange=${(x) => { setCelId(x); setDobas(null); }}
        opciok=${celok.map((r) => ({ value: r.id, label: `${r.nev} (${eSzoveg(r)})` }))}/>` : html`<p>Nincs sérült résztvevő.</p>`}
      ${cel && cel.gyogyithato === false ? html`<${Uzenet} tonus="warning">${cel.nev} már kapott Gyógyítást, és azóta nem sérült meg: a szabály szerint nem kaphat újat.<//>` : null}
      <div className="osszegsor"><span>3d6 ${ossz.reszek.map((r, i) => html`<span key=${i}> ${elojel(r.ertek)} (${r.eredet})</span>`)}</span><span className="osszegsor__ertek">${elojel(ossz.bonusz)} vs 11</span></div>
      ${cel ? html`<${Kockadobo} db=${3} kockak=${dobas ? dobas.kockak : null} kezi=${dobas && dobas.kezi} felirat="Gyógyítás: 3d6" onDobas=${dob}/>` : null}
      ${dobas ? html`<${Uzenet} tonus=${dobas.mennyi ? 'success' : 'neutral'}>${dobas.ert.osszeg}: ${dobas.mennyi ? `siker, +${dobas.mennyi} Egészség` : 'nem sikerült'}.<//>` : null}
    </div>
  <//>`;
}

// ---------------- Varázslat a csatában ----------------
// A varázsló varázslatai (karakternél a karakterlapról, NJK-nál a statblokkból), a varázslási próba (Intelligencia és
// az arkánum fókusza, a varázslat Célértéke ellen), a varázslati mutatványok, a célpontok, és ha a varázslat kér,
// a célpont próbája függő kártyaként (a célpont irányítója dobja, AK 104–108.). A sebzés egyszer gurul minden célpontra.

const varazslatElem = (x, lapok) => x.elem || ((lapok && lapok['Varázslatok']) || []).find((v) => v.id === x.id) || null;
const reszlet = (e) => { const r = e && e.reszletek; if (!r) return {}; if (typeof r === 'string') { try { return JSON.parse(r); } catch (err) { return {}; } } return r; };

// A varázsló varázslatai csatához: [{ v (varazslatAdat), fokusz, varazsero }].
export function varazsloVarazslatai(nz, lapok) {
  if (!nz || !lapok) return [];
  const akarat = (nz.tulajdonsagok.tul_willpower || {}).ertek || 0;
  return (nz.varazslatok || []).map((x) => {
    const e = varazslatElem(x, lapok);
    if (!e) return null;
    const v = M.varazslatAdat(e, { akarat });
    const ark = ((lapok['Arkánumok'] || []).find((a) => a.id === e.arkanum)) || null;
    const fokusz = reszlet(ark).fokusz || '';
    const fokB = fokusz && nz.fokuszok && nz.fokuszok[fokusz] ? Number(nz.fokuszok[fokusz].bonusz) || 0 : 0;
    const varazsero = nz.varazsero && Number.isFinite(Number(nz.varazsero.ertek)) ? Number(nz.varazsero.ertek) : 10 + akarat + fokB;
    return { v, fokusz, varazsero };
  }).filter(Boolean);
}

export function VarazslatAblak({ cs, nezetek, lapok, kampany, forrasok, vegrehajt, dobasNaplo, varazsloId, onBezar }) {
  const { sync, uzen } = useApp();
  const r = C.resztvevo(cs, varazsloId);
  const nz = nezetek[varazsloId];
  const lista = useMemo(() => varazsloVarazslatai(nz, lapok), [nz, lapok]);
  const [vId, setVId] = useState(lista[0] ? lista[0].v.id : '');
  const [mpSzam, setMpSzam] = useState('');
  const [celok, setCelok] = useState(null); // null: még nem választott, a varázslat szerinti javaslat él
  const [kezi, setKezi] = useState('0');
  const [dobas, setDobas] = useState(null);
  const [mutNyitva, setMutNyitva] = useState(false);
  const [mut, setMut] = useState(null);
  const [teljes, setTeljes] = useState(null);
  const [csokk, setCsokk] = useState(null);
  const [extra, setExtra] = useState(null);
  const [extraCel, setExtraCel] = useState('');
  const [gyogy, setGyogy] = useState(null);
  if (!r || !nz) return null;
  if (!lista.length) return html`<${Parbeszed} cim="Varázslat" onBezar=${onBezar}><p>${r.nev} nem ismer varázslatot (vagy a szabályadat még töltődik).</p><//>`;
  const sor = lista.find((x) => x.v.id === vId) || lista[0];
  const v = sor.v;
  const uj = () => { setDobas(null); setMut(null); setMutNyitva(false); setTeljes(null); setCsokk(null); setExtra(null); setGyogy(null); };
  const mpAlap = Math.max(v.mp.min, parseInt(mpSzam, 10) || 0);
  const mp = v.mp.max !== null && v.mp.max !== undefined && v.mp.max > 0 ? Math.min(v.mp.max, mpAlap) : mpAlap;
  const vh = M.varazsMutatvanyHatasok(mut ? mut.mutatvanyok : []);
  const fizet = Math.max(0, mp - vh.mp_kedvezmeny);
  const vanMp = r.magiapont !== null && r.magiapont !== undefined;
  const kezSzam = parseInt(String(kezi).replace('−', '-'), 10) || 0;
  const varMod = C.probaBonuszok(r).concat(C.vanFeltetel(r, 'gunyolva') ? [{ ertek: -1, eredet: 'Gúnyolva' }] : [], kezSzam ? [{ ertek: kezSzam, eredet: 'Módosító' }] : []);
  const ossz = P.probaOsszeallit(nz, { tul: 'tul_intelligence', fokusz: sor.fokusz || undefined, modositok: varMod });
  const akarat = (nz.tulajdonsagok.tul_willpower || {}).ertek || 0;
  const varazsero = sor.varazsero + vh.varazsero;
  const celpontok = O.celpontSorrend(cs, cs.resztvevok.filter((x) => !x.rejtett && x.allapot !== 'halott'), r.oldal, r.id);
  // javasolt célpont: támadó varázslatnál az első ellenség, gyógyításnál senki (a felhasználó választ)
  const javasolt = (v.sebzes || v.proba) && celpontok[0] && celpontok[0].viszony === 'ellenseges' ? [celpontok[0].id] : [];
  const celLista = celok === null ? javasolt : celok;
  const gyogyKif = M.varazslatGyogyitasKocka(v, fizet);
  const sebzo = !!v.sebzes;
  const kellCsokk = sebzo && v.proba && v.csokkentett && v.csokkentett.kocka > 0;
  const proba = v.proba ? { tul: v.proba.tul, fokuszok: v.proba.fokuszok, celertek: varazsero,
    nev: P.TUL_NEV[v.proba.tul] + (v.proba.fokuszok.length ? ` (${v.proba.fokuszok.map((f) => fokuszNevLapbol(lapok, f)).join(' vagy ')})` : '') } : null;

  const dob = (kockak, beirt) => {
    const ert = P.probaKiertekel(kockak, ossz.bonusz, { celertek: v.celertek === null ? undefined : v.celertek });
    const d = dobasNaplo({ r, mire: `Varázslás: ${v.nev}`, kockak, osszeallitas: ossz, ert, celertek: v.celertek === null ? undefined : v.celertek, tipus: 'varazslas', kezi: beirt });
    setMut(null); setMutNyitva(false); setTeljes(null); setCsokk(null); setExtra(null); setGyogy(null);
    setDobas({ kockak, kezi: beirt, osszeg: ert.osszeg, siker: v.celertek === null ? true : ert.eredmeny === 'siker', mp: ert.mutatvanypont, naploId: d.id });
  };
  const mutKesz = (x) => {
    setMut(x); setMutNyitva(false);
    sync.push({ action: 'roll.update', adat: { id: dobas.naploId, mutatvanyok: x.mutatvanyok, plusz: x.plusz } })
      .catch((e) => uzen('A mutatványok nem kerültek a naplóba: ' + e.message, 'danger'));
  };
  const kockaDobas = (mire, set, plusz) => (kockak, beirt) => {
    dobasNaplo({ r, mire, kockak, osszeallitas: { bonusz: plusz || 0, reszek: plusz ? [{ ertek: plusz, eredet: 'Bónusz' }] : [] }, tipus: 'sebzes', kezi: beirt });
    set({ kockak, kezi: beirt });
  };
  const valt = (id, be) => setCelok((be ? celLista.concat([id]) : celLista.filter((x) => x !== id)));
  const siker = dobas && dobas.siker;
  const mutKesz_ = !dobas || !dobas.mp || !siker || !!mut;
  const celKell = !!(sebzo || gyogyKif || proba);
  // a varázslat ideje szerinti cselekvés (fő, kis vagy szabad) maradt-e még ebben a körben
  const cselekvesVan = C.cselekvesEngedett(r, v.fajta);
  const kesz = cselekvesVan && dobas && !mutNyitva && mutKesz_ && (!siker || !celKell || celLista.length > 0) && (!siker || (
    (!sebzo || !celLista.length || teljes || v.sebzes.kocka === 0) && (!kellCsokk || !celLista.length || csokk) &&
    (!vh.extra_kocka || !sebzo || !celLista.length || (extra && extraCel)) && (!gyogyKif || !celLista.length || gyogy || gyogyKif.kocka === 0)));
  const alkalmaz = () => {
    const m = {
      tipus: 'varazslat', r: r.id, varazslat: { id: v.id, nev: v.nev }, fajta: v.fajta, mp: fizet, siker: !!siker, osszeg: dobas.osszeg, celok: siker ? celLista : [],
      proba: siker && proba ? proba : null,
      sebzes: siker && sebzo ? { teljes: osszeg(teljes ? teljes.kockak : []) + v.sebzes.plusz,
        csokkentett: v.csokkentett ? osszeg(csokk ? csokk.kockak : []) + v.csokkentett.plusz : null, atuto: v.atuto } : null,
      gyogyitas: siker && gyogyKif ? osszeg(gyogy ? gyogy.kockak : []) + gyogyKif.plusz : 0,
      extra: siker && sebzo && vh.extra_kocka && extra && extraCel ? { cel: extraCel, sebzes: osszeg(extra.kockak) } : null,
      hatasok: { vedopajzs: siker && vh.vedopajzs, felelmetes: siker && mut && mut.mutatvanyok.some((x) => x.id === 'mut_imposing_spell') ? 10 + akarat : 0 },
      mutatvanyok: mut ? mut.mutatvanyok.map((x) => x.nev) : [],
      mutatvany_probak: siker && mut ? M.mutatvanyProbak(mut.mutatvanyok) : []
    };
    vegrehajt(m);
    onBezar();
  };
  return html`<${Parbeszed} cim=${`${r.nev} varázsol`} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${!kesz} onClick=${alkalmaz}>Alkalmazás<//>`}>
    <div className="verem">
      <${Valaszto} label="Varázslat" value=${v.id} onChange=${(x) => { setVId(x); setMpSzam(''); setCelok(null); uj(); }}
        opciok=${lista.map((x) => ({ value: x.v.id, label: `${x.v.nev} (${x.v.mp.min}${x.v.mp.plusz ? '+' : ''} MP${x.v.celertek ? ', Célérték ' + x.v.celertek : ''}${C.cselekvesEngedett(r, x.v.fajta) ? '' : ', most nem vethető'})` }))}/>
      <p className="halvany kicsi" style=${{ margin: 0 }}>${[v.fajta === 'mellek' ? 'kis cselekvés' : v.fajta === 'szabad' ? 'szabad cselekvés' : 'fő cselekvés',
        v.terulet ? 'terület: ' + v.terulet : '', v.sebzes_szoveg ? 'sebzés: ' + v.sebzes_szoveg + (v.atuto ? ' (átütő)' : '') : '',
        v.gyogyitas_szoveg ? 'gyógyítás: ' + v.gyogyitas_szoveg : '', proba ? `célpont próbája: ${proba.nev} a Varázserő (${varazsero}) ellen` : ''].filter(Boolean).join(' · ')}</p>
      ${v.leiras ? html`<details className="lenyilo"><summary>Leírás</summary><p className="kicsi">${v.leiras}</p></details>` : null}
      <div className="sorban">
        ${v.mp.plusz || (v.mp.max && v.mp.max > v.mp.min) ? html`<${K.TextField} label="Mágiapont" hint=${`legalább ${v.mp.min}${v.mp.max ? ', legfeljebb ' + v.mp.max : ''}`} inputMode="numeric"
          value=${mpSzam || String(v.mp.min)} onChange=${(e) => { setMpSzam(e.target.value.replace(/[^0-9]/g, '').slice(0, 2)); setGyogy(null); }}/>` : null}
        <${K.TextField} label="Módosító" hint="A DM adja (±1–3)" inputMode="numeric" value=${kezi}
          onChange=${(e) => { setKezi(e.target.value.replace(/[^0-9−-]/g, '').replace('−', '-').slice(0, 3)); uj(); }}/>
      </div>
      <p className="kicsi" style=${{ margin: 0 }}>Ára: <strong>${fizet} MP</strong>${vh.mp_kedvezmeny ? ' (Ügyes varázslással)' : ''}${vanMp ? ` · van ${r.magiapont} MP` : ''}. A Mágiapont sikertelen próbánál is fogy.</p>
      ${(r.feltetelek || []).some((f) => f.kulcs === 'megfelemlitve' && f.forras && !celLista.includes(f.forras)) ? html`<${Uzenet} tonus="warning">Megfélemlítve: ebben a körében a fenyegetőt kell támadnia (varázslattal is).<//>` : null}
      ${!cselekvesVan ? html`<${Uzenet} tonus="warning">Ebben a körben már nincs ${v.fajta === 'mellek' ? 'mellék' : 'fő'} cselekvése (${C.cselekvesSzoveg(r)}). Körönként egy fő és egy mellék, vagy két mellék cselekvés jár; többet csak a DM „+1 cselekvés” gombja vagy a Villámtámadás ad.<//>` : null}
      ${vanMp && fizet > r.magiapont ? html`<${Uzenet} tonus="warning">Nincs elég Mágiapont.<//>` : null}
      <div>
        <p className="cimke" style=${{ margin: 0 }}>Célpontok (koppints rájuk; több is lehet)</p>
        <div className="csipek">${celpontok.concat([{ ...r, viszony: 'sajat' }]).map((x) => html`<button key=${x.id} type="button" className="csip" aria-pressed=${celLista.includes(x.id)}
          onClick=${() => valt(x.id, !celLista.includes(x.id))}>${x.id === r.id ? 'önmaga' : x.nev}</button>`)}</div>
      </div>
      <div className="osszegsor">
        <span>3d6 ${ossz.reszek.map((x, i) => html`<span key=${i}> ${elojel(x.ertek)} (${x.eredet})</span>`)}</span>
        <span className="osszegsor__ertek">${elojel(ossz.bonusz)}${v.celertek ? ` vs ${v.celertek}` : ''}</span>
      </div>
      ${cselekvesVan ? html`<${Kockadobo} db=${3} kockak=${dobas ? dobas.kockak : null} kezi=${dobas && dobas.kezi} felirat="Varázslási próba: 3d6" onDobas=${dob}
        eredmeny=${(o) => html`<span className="halvany">${elojel(ossz.bonusz)} → ${o + ossz.bonusz}</span>`}/>` : null}
      ${dobas ? html`<${Uzenet} tonus=${siker ? 'success' : 'neutral'}>${dobas.osszeg}: ${siker ? 'sikerült' : 'nem sikerült, a Mágiapont így is fogy'}${dobas.mp && siker ? `, ${dobas.mp} Mutatványpont` : ''}.<//>` : null}
      ${dobas && siker && dobas.mp && !mut && !mutNyitva ? html`<div className="gombsor"><${K.Button} variant="primary" onClick=${() => setMutNyitva(true)}>${dobas.mp} Mutatványpont elköltése<//>
        <${K.Button} variant="quiet" onClick=${() => mutKesz({ mutatvanyok: [], plusz: [] })}>Nem költök<//></div>` : null}
      ${dobas && mutNyitva ? html`<${MutatvanyValaszto} lapok=${lapok} lap=${nz} pont=${dobas.mp}
        kontextus=${{ tipus: 'varazslas', tul: 'tul_intelligence', fokusz: sor.fokusz || undefined }}
        forrasok=${forrasok} beallitas=${kampany.beallitasok} onKesz=${mutKesz} onMegse=${() => setMutNyitva(false)}/>` : null}
      ${mut && !mutNyitva ? html`<p className="mutatvany__osszegzes">✓ ${mut.mutatvanyok.length ? mut.mutatvanyok.map((m) => `${m.nev} (${m.mp})`).join(', ') : 'Nem költött pontot.'}</p>` : null}
      ${mut && vh.szoveges.length ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>A DM dönt: ${vh.szoveges.filter((n) => !mut.mutatvanyok.some((x) => x.nev === n && (M.MUTATVANY_PROBAK[x.id] || x.id === 'mut_imposing_spell'))).join(', ') || 'semmi más'}.</p>` : null}
      ${mut && mut.mutatvanyok.some((x) => x.id === 'mut_imposing_spell') ? html`<p className="kicsi" style=${{ margin: 0 }}><strong>Félelmetes varázslat:</strong> a következő köre elejéig aki közelharcban megtámadná, előtte Akaraterő (Bátorság) próbát dob ${10 + akarat} ellen (a támadás ablaka kéri).</p>` : null}
      <${MutatvanyProbaJelzes} mutatvanyok=${mut && siker ? mut.mutatvanyok : []}/>
      ${siker && !mutNyitva && mutKesz_ && celLista.length && sebzo ? html`<div className="verem">
        <p className="cimke" style=${{ margin: 0 }}>Sebzés: ${v.sebzes_szoveg}${v.atuto ? ' · átütő' : ''}${proba ? ' (ha nem áll ellen)' : ''}</p>
        ${v.sebzes.kocka > 0 ? html`<${Kockadobo} db=${v.sebzes.kocka} kockak=${teljes ? teljes.kockak : null} kezi=${teljes && teljes.kezi} felirat=${`Sebzés: ${v.sebzes.kocka}d6`}
          onDobas=${kockaDobas(`Sebzés: ${v.nev}`, setTeljes, v.sebzes.plusz)} eredmeny=${(o) => html`<span className="halvany">${elojel(v.sebzes.plusz)} → ${o + v.sebzes.plusz}</span>`}/>` : html`<p className="kicsi">${v.sebzes.plusz} sebzés</p>`}
        ${kellCsokk ? html`<p className="cimke" style=${{ margin: 0 }}>Ha ellenáll: ${v.csokkentett_szoveg}</p>
          <${Kockadobo} db=${v.csokkentett.kocka} kockak=${csokk ? csokk.kockak : null} kezi=${csokk && csokk.kezi} felirat=${`Csökkentett: ${v.csokkentett.kocka}d6`}
            onDobas=${kockaDobas(`Csökkentett sebzés: ${v.nev}`, setCsokk, v.csokkentett.plusz)}/>` : null}
        ${proba && !v.csokkentett ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>Ha a célpont ellenáll, nem sebződik.</p>` : null}
        ${vh.extra_kocka ? html`<div className="sorban">
          <${Valaszto} label=${`+${vh.extra_kocka}d6: melyik célpont`} value=${extraCel} ures="válassz…" onChange=${setExtraCel}
            opciok=${celLista.map((id) => ({ value: id, label: C.resztvevo(cs, id).nev }))}/>
          <${Kockadobo} db=${vh.extra_kocka} kockak=${extra ? extra.kockak : null} kezi=${extra && extra.kezi} felirat=${`+${vh.extra_kocka}d6`} onDobas=${kockaDobas('Varázslati mutatvány: plusz sebzés', setExtra)}/>
        </div>` : null}
      </div>` : null}
      ${siker && !mutNyitva && mutKesz_ && celLista.length && gyogyKif && gyogyKif.kocka > 0 ? html`<div className="verem">
        <p className="cimke" style=${{ margin: 0 }}>Gyógyítás: ${gyogyKif.kocka}d6${gyogyKif.plusz ? elojel(gyogyKif.plusz) : ''}</p>
        <${Kockadobo} db=${gyogyKif.kocka} kockak=${gyogy ? gyogy.kockak : null} kezi=${gyogy && gyogy.kezi} felirat=${`Gyógyítás: ${gyogyKif.kocka}d6`} onDobas=${kockaDobas(`Gyógyítás: ${v.nev}`, setGyogy, gyogyKif.plusz)}/>
      </div>` : null}
      ${siker && celKell && !celLista.length ? html`<${Uzenet} tonus="warning">Válassz célpontot fent: célpont nélkül a varázslat nem sebez és nem gyógyít.<//>` : null}
      ${siker && proba && celLista.length ? html`<p className="kicsi" style=${{ margin: 0 }}>Alkalmazás után a célpontok próbája kártyaként vár: az NJK-kért a DM, a karakterekért a játékosuk dob.</p>` : null}
      ${siker && !sebzo && !gyogyKif && !proba ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>A hatását a leírás szerint a DM alkalmazza (feltétel, Egészség kézzel).</p>` : null}
    </div>
  <//>`;
}

// ---------------- Függő próbák a csatában (kártyák) ----------------
// A varázslat célpontjának próbája és a mutatványok próbái (Éberség, Fenyegetés, Gúnyolódás, Lefegyverzés, Mágiazavarás).
// A DM minden még nem dobott oldalt dobhat; a játékos azokat, amelyeknek a résztvevőjét irányítja (iranyitott).
export function CelpontProbak({ cs, nezetek, vegrehajt, dobasNaplo, iranyitott = null, nagy = false }) {
  const sajat = (id) => !iranyitott || iranyitott.includes(id);
  const kartyak = [];
  (cs.fuggo || []).forEach((f) => {
    if (f.fajta !== 'mutatvany') { if (sajat(f.cel)) kartyak.push(html`<${CelpontProbaKartya} key=${f.id} f=${f} cs=${cs} nz=${nezetek[f.cel]} vegrehajt=${vegrehajt} dobasNaplo=${dobasNaplo} nagy=${nagy}/>`); return; }
    ['tamado', 'cel'].forEach((fel) => {
      if (fel === 'cel' && f.tipus !== 'ellen') return;
      if ((f.eredmeny || {})[fel] || !sajat(f[fel])) return;
      kartyak.push(html`<${MutatvanyProbaKartya} key=${f.id + fel} f=${f} fel=${fel} cs=${cs} nz=${nezetek[f[fel]]} vegrehajt=${vegrehajt} dobasNaplo=${dobasNaplo} nagy=${nagy}/>`);
    });
  });
  if (!kartyak.length) return null;
  return html`<div className="verem">${kartyak}</div>`;
}

function CelpontProbaKartya({ f, cs, nz, vegrehajt, dobasNaplo, nagy }) {
  const r = C.resztvevo(cs, f.cel);
  const fok = nz ? P.fokuszAjanlas(nz, f.fokuszok, f.tul) : null;
  const ossz = nz ? P.probaOsszeallit(nz, { tul: f.tul, fokusz: fok || undefined, modositok: C.probaBonuszok(r) }) : { bonusz: 0, reszek: [] };
  const dob = (kockak, kezi) => {
    const ert = P.probaKiertekel(kockak, ossz.bonusz, { celertek: f.celertek });
    dobasNaplo({ r, mire: `${f.cel_nev}: ${f.proba_nev || P.TUL_NEV[f.tul]} (${f.varazslat} ellen)`, kockak, osszeallitas: ossz, ert, celertek: f.celertek, tipus: 'alap', kezi });
    vegrehajt({ tipus: 'celpont_proba', proba_id: f.id, osszeg: ert.osszeg, kockak, kezi });
  };
  return html`<div className="probakartya">
    <div className="probakartya__fej"><span className="probakartya__szoveg">
      <strong className="probakartya__cim">Célpont próbája: ${f.cel_nev}</strong>
      <span className="kicsi halvany">${f.varazslo_nev}: ${f.varazslat} · ${f.proba_nev || P.TUL_NEV[f.tul]} a Varázserő (${f.celertek}) ellen
        ${f.teljes !== null && f.teljes !== undefined ? ` · ${f.teljes} sebzés, ellenállva ${f.csokkentett === null || f.csokkentett === undefined ? 'nincs' : f.csokkentett}${f.atuto ? ' (átütő)' : ''}` : ''}</span>
    </span></div>
    ${nz ? html`<div className="osszegsor"><span>3d6 ${ossz.reszek.map((x, i) => html`<span key=${i}> ${elojel(x.ertek)} (${x.eredet})</span>`)}</span><span className="osszegsor__ertek">${elojel(ossz.bonusz)} vs ${f.celertek}</span></div>`
      : html`<p className="halvany kicsi">A célpont adatai nem érhetők el: a beírt kockákhoz a bónuszt a DM adja hozzá.</p>`}
    <${Kockadobo} db=${3} kicsi=${!nagy} kockak=${null} felirat="Ellenállás: 3d6" onDobas=${dob}
      eredmeny=${(o) => html`<span className="halvany">${elojel(ossz.bonusz)} → ${o + ossz.bonusz}</span>`}/>
  </div>`;
}

// Egy mutatvány próbájának egyik oldala. A támadópróbánál (Lefegyverzés) a támadó a támadása bónuszával, a célpont a
// legjobb támadásával dob; a többi tulajdonság és fókusz szerint (Éberség: bármely Észlelés fókusz).
export function mutatvanyProbaOsszeallit(f, fel, nz, r) {
  const d = fel === 'tamado' ? f.tamado_proba : f.cel_proba;
  const extra = C.probaBonuszok(r);
  if (!d) return { bonusz: 0, reszek: [], tulajdonsag_ertek: 0 };
  if (d.tamadas) {
    const legjobb = fel === 'tamado' && Number.isFinite(Number(d.bonusz)) ? Number(d.bonusz)
      : Math.max(0, ...((nz && nz.tamadasok) || []).filter((t) => t.tamadas !== null).map((t) => t.tamadas));
    const reszek = [{ ertek: legjobb, eredet: 'támadás' }].concat(extra);
    return { bonusz: reszek.reduce((a, x) => a + x.ertek, 0), reszek, tulajdonsag_ertek: legjobb };
  }
  if (!nz) return { bonusz: 0, reszek: [], tulajdonsag_ertek: 0 };
  const fok = d.barmely_fokusz ? (P.tulajdonsagFokuszai(nz, d.tul).sort((a, b) => b.bonusz - a.bonusz)[0] || {}).id : P.fokuszAjanlas(nz, d.fokuszok, d.tul);
  return P.probaOsszeallit(nz, { tul: d.tul, fokusz: fok || undefined, modositok: extra });
}

function MutatvanyProbaKartya({ f, fel, cs, nz, vegrehajt, dobasNaplo, nagy }) {
  const r = C.resztvevo(cs, f[fel]);
  const d = fel === 'tamado' ? f.tamado_proba : f.cel_proba;
  const ossz = mutatvanyProbaOsszeallit(f, fel, nz, r);
  const masik = fel === 'tamado' ? 'cel' : 'tamado';
  const dob = (kockak, kezi) => {
    const ert = P.probaKiertekel(kockak, ossz.bonusz, { celertek: f.tipus === 'sajat' && f.celertek ? f.celertek : undefined, mutatvany_tiltva: true });
    dobasNaplo({ r, mire: `${r ? r.nev : '?'}: ${d.nev} (${f.nev}${f.tipus === 'ellen' ? ', ellenpróba' : ''})`, kockak, osszeallitas: ossz, ert,
      celertek: f.tipus === 'sajat' && f.celertek ? f.celertek : undefined, tipus: f.tipus === 'ellen' ? 'ellen' : 'alap', kezi });
    vegrehajt({ tipus: 'mutatvany_proba', proba_id: f.id, fel, osszeg: ert.osszeg, sarkany: kockak[2], tul: ossz.tulajdonsag_ertek, kockak, kezi });
  };
  const masikEredmeny = (f.eredmeny || {})[masik];
  return html`<div className="probakartya">
    <div className="probakartya__fej"><span className="probakartya__szoveg">
      <strong className="probakartya__cim">${f.nev}: ${r ? r.nev : '?'} dob</strong>
      <span className="kicsi halvany">${f.tipus === 'ellen' ? `${f.tamado_nev} és ${f.cel_nev} ellenpróbája · ${d.nev}` : `${d.nev}${f.celertek ? ' ' + f.celertek + ' ellen' : ''}`} · ${f.kovetkezmeny || ''}
        ${masikEredmeny ? ` · ${fel === 'tamado' ? f.cel_nev : f.tamado_nev} már dobott` : ''}</span>
    </span></div>
    ${nz || d.tamadas ? html`<div className="osszegsor"><span>3d6 ${ossz.reszek.map((x, i) => html`<span key=${i}> ${elojel(x.ertek)} (${x.eredet})</span>`)}</span><span className="osszegsor__ertek">${elojel(ossz.bonusz)}${f.tipus === 'sajat' && f.celertek ? ` vs ${f.celertek}` : ''}</span></div>`
      : html`<p className="halvany kicsi">A résztvevő adatai nem érhetők el: a beírt kockákhoz a bónuszt a DM adja hozzá.</p>`}
    <${Kockadobo} db=${3} kicsi=${!nagy} kockak=${null} felirat=${`${f.nev}: 3d6`} onDobas=${dob}
      eredmeny=${(o) => html`<span className="halvany">${elojel(ossz.bonusz)} → ${o + ossz.bonusz}</span>`}/>
  </div>`;
}

// ---------------- Hozzáadás csata közben ----------------

function HozzaadasAblak({ cs, lapok, lep, allapot, onBezar }) {
  const { api, uzen } = useApp();
  const tar = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk.aktiv');
  const o = useMemo(() => ({ ...O.uresOsszecsapas(), oldalak: cs.oldalak, viszonyok: cs.viszonyok,
    resztvevok: cs.resztvevok.map((r) => ({ id: r.id, forras: r.forras, nev: r.nev, db: 1, oldal: r.oldal, csoport: '' })) }), [cs]);
  const setO = async (fn) => {
    const uj = typeof fn === 'function' ? fn(o) : fn;
    const regi = new Set(o.resztvevok.map((r) => r.id));
    const ujak = uj.resztvevok.filter((r) => !regi.has(r.id));
    if (!ujak.length) return;
    const peldanyok = O.resztvevokKibontasa({ ...uj, resztvevok: ujak });
    const pk = await pillanatkepekGyujtese(peldanyok.map((p) => p.forras), { lapok, allapot, api });
    const csoportNev = (r) => (r.db > 1 ? r.nev : '');
    lep(`Új résztvevő: ${ujak.map((r) => r.nev + (r.db > 1 ? ' ×' + r.db : '')).join(', ')}`, (x) => {
      peldanyok.forEach((p) => {
        const e = egeszsegAdat(forrasNezet(p.forras, { allapot, lapok, pk }));
        const r = ujak.find((y) => y.id === p.resztvevo_id);
        C.resztvevoHozzaadas(x, { forras: p.forras, nev: p.nev, oldal: p.oldal, fontos: p.fontos, egeszseg: e.egeszseg, egeszseg_max: e.egeszseg_max, szivossag: e.szivossag,
          csoportNev: csoportNev(r), magiapont: e.magiapont, ertekek: e.ertekek });
      });
    }, { pillanatkepek: pk, dm: cs.allapot === 'fut' });
    if (cs.allapot === 'fut') uzen('Az új résztvevő a „Belépésre vár” listában van: a kezdeményezésével lép be.');
  };
  return html`<${Parbeszed} cim="Résztvevő hozzáadása" onBezar=${onBezar} lab=${html`<${K.Button} variant="primary" onClick=${onBezar}>Kész<//>`}>
    <${HozzaadasPanel} o=${o} setO=${setO} allapot=${allapot} lapok=${lapok} tar=${tar.adat || []}/>
  <//>`;
}
