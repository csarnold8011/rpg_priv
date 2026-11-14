// DM próbakérés: „Próbák” panel a kampány élő nézetében (új kérés, élő tábla, lezárás, titkos próba, ellenfél dobása),
// a játékos kártyái a kampány nézetében, és a varázslat célpontjának próbája. A szabályok: web/js/jatek/probakeres.js.
// A terv: claude/probak-terv.md (4. ütem). A háttér: test.request, test.update, test.close, roll.log (proba_id).
import { html, K, useApp, useState, useMemo, Jelolo, Valaszto, Parbeszed, Sugo, elojel } from './kozos.js';
import { Kapcsolo, Csip } from './varazslo_lepesek.js';
import { KarakterKep } from './kepek.js';
import { Kockadobo } from './kockadobo.js';
import { ProbaLap, fokuszNevLapbol } from './proba.js';
import { karakterSzamol } from '../karakter/szamol.js';
import { atallit } from '../karakter/adat.js';
import { CELERTEKEK, KUSZOBOK, TUL_NEV, ujDobasId } from '../jatek/proba.js';
import * as R from '../jatek/probakeres.js';
import { lenyNezet } from '../jatek/leny.js';

const kocka = () => 1 + Math.floor(Math.random() * 6);
const szamBol = (s) => { const n = parseInt(String(s).replace('−', '-'), 10); return Number.isFinite(n) ? n : 0; };
const aktivKarakterek = (allapot) => (allapot.karakterek || []).filter((c) => !c.kampany_allapot || c.kampany_allapot === 'aktív');

// A karakter lapja (karakterSzamol), ha a teljes adat megvan (a DM-nél és a szerkeszthető karaktereknél).
function useLapok(karakterek) {
  const { szabalyok } = useApp();
  const lapok = szabalyok && szabalyok.adat && szabalyok.adat.lapok;
  return useMemo(() => {
    const m = {};
    if (lapok) (karakterek || []).forEach((c) => { if (c.adat) { try { m[c.id] = karakterSzamol(atallit(c.adat), lapok); } catch (e) { /* hiányos karakter */ } } });
    return m;
  }, [karakterek, lapok]);
}

// ---- Kérések kezelése optimistán: új kérés (és titkos dobásai), lezárás, újranyitás ----
function useProbaMuveletek(allapot) {
  const { sync, uzen, felhasznalo } = useApp();
  const [fuggo, setFuggo] = useState([]);
  const [felul, setFelul] = useState({});
  const listak = R.probaListak(allapot.probak || [], fuggo, felul);
  const frissit = () => (sync.pull ? sync.pull().catch(() => {}) : Promise.resolve());

  // titkos: { karakterIds, lapok } esetén a DM a karakterek helyett dob, a dobások a kérés után mennek fel
  const keres = (adat, titkos) => {
    const ideiglenes = { ...adat, id: '_f' + ujDobasId(), letrehozva: new Date().toISOString(), allapot: 'nyitott', allas: {}, _fuggo: true };
    let dobasok = [];
    if (titkos) {
      dobasok = R.titkosDobasok(ideiglenes, titkos.karakterIds, titkos.lapok, kocka, felhasznalo.nev);
      dobasok.forEach(({ karakter_id: id, dobas, kiertekeles: e }) => {
        ideiglenes.allas[id] = { dobasok: [dobas.id], osszeg: 0, utolso: { osszeg: e.osszeg, sarkany: e.sarkany, eredmeny: e.eredmeny, mutatvanypont: e.mutatvanypont } };
      });
    }
    setFuggo((f) => f.concat([ideiglenes]));
    sync.push({ action: 'test.request', adat })
      .then((v) => Promise.all(dobasok.map(({ dobas }) => sync.push({ action: 'roll.log', adat: { ...dobas, proba_id: v.proba.id } }))))
      .then(frissit)
      .catch((e) => uzen('A próbakérés nem ment el: ' + e.message, 'danger'))
      .then(() => setFuggo((f) => f.filter((x) => x.id !== ideiglenes.id)));
  };
  const lezar = (p, ujranyit) => {
    setFelul((f) => ({ ...f, [p.id]: { allapot: ujranyit ? 'nyitott' : 'lezart', lezarva: ujranyit ? '' : new Date().toISOString() } }));
    sync.push({ action: 'test.close', adat: { id: p.id, ujranyit: !!ujranyit } })
      .then(frissit)
      .catch((e) => uzen((ujranyit ? 'Az újranyitás' : 'A lezárás') + ' nem sikerült: ' + e.message, 'danger'))
      .then(() => setFelul((f) => { const u = { ...f }; delete u[p.id]; return u; }));
  };
  return { listak, keres, lezar };
}

// =================== DM: Próbák panel ===================
export function ProbakPanel({ allapot, naploz }) {
  const { listak, keres, lezar } = useProbaMuveletek(allapot);
  const [uj, setUj] = useState(null); // az új kérés kiinduló űrlapja, vagy null
  const karakterek = allapot.karakterek || [];
  const lapok = useLapok(karakterek);
  const beallitas = allapot.kampany.beallitasok;
  return html`<${K.Panel} title="Próbák" actions=${html`<${K.Button} size="sm" variant="primary" onClick=${() => setUj(R.ujUrlap(beallitas))}>Új próba<//>`}>
    <div className="verem">
      ${listak.nyitott.length ? listak.nyitott.map((p) => html`<${ProbaKartya} key=${p.id} p=${p} allapot=${allapot} lapok=${lapok}
        naploz=${naploz} onLezar=${() => lezar(p)}/>`)
        : html`<p className="halvany">Nincs nyitott próbakérés. Az „Új próba” gombbal kérhetsz próbát a játékosoktól.</p>`}
      ${listak.lezart.length ? html`<details className="lenyilo">
        <summary>Lezárt próbák (${listak.lezart.length})</summary>
        <div className="verem">${listak.lezart.map((p) => html`<${ProbaKartya} key=${p.id} p=${p} allapot=${allapot} lapok=${lapok}
          lezart=${true} onUjranyit=${() => lezar(p, true)}/>`)}</div>
      </details>` : null}
    </div>
    ${uj ? html`<${UjProbaAblak} kezdo=${uj} allapot=${allapot} lapok=${lapok} onBezar=${() => setUj(null)}
      onKuld=${(adat, titkos) => { keres(adat, titkos); setUj(null); }}/>` : null}
  <//>`;
}

// Az új kérés párbeszédablaka (a kampány nézetéből és a varázslat célpontjánál is).
export function UjProbaAblak({ kezdo, allapot, lapok, onBezar, onKuld }) {
  const { szabalyok } = useApp();
  const fokLap = szabalyok && szabalyok.adat && szabalyok.adat.lapok;
  const fokuszNev = (id) => fokuszNevLapbol(fokLap, id);
  const [u, setU] = useState(kezdo);
  const [probalt, setProbalt] = useState(false);
  const karakterek = aktivKarakterek(allapot);
  const hibak = R.urlapHibak(u, karakterek);
  const kuld = () => {
    setProbalt(true);
    if (hibak.length) return;
    const adat = R.keresAdat(u, allapot.kampany.id, fokuszNev);
    if (u.tipus === 'titkos') {
      const ids = R.cimzettLista(u.cimzettek, karakterek).filter((id) => lapok[id]);
      onKuld(adat, { karakterIds: ids, lapok });
    } else onKuld(adat);
  };
  const lab = html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${probalt && hibak.length > 0} onClick=${kuld}>${u.tipus === 'titkos' ? 'Titkos dobás' : 'Kérés küldése'}<//>`;
  return html`<${Parbeszed} cim="Új próba" onBezar=${onBezar} lab=${lab}>
    <${ProbaKeresUrlap} u=${u} setU=${setU} karakterek=${karakterek} lapok=${lapok} fokuszNev=${fokuszNev} fokLap=${fokLap} njkk=${(allapot.njkk || []).filter((n) => n.adat && n.adat.statblokk)}/>
    ${probalt && hibak.length ? html`<ul className="mutatvany__hibak">${hibak.map((h, i) => html`<li key=${i} className="kicsi">⚠ ${h}</li>`)}</ul>` : null}
  <//>`;
}

function ProbaKeresUrlap({ u, setU, karakterek, lapok, fokuszNev, fokLap, njkk = [] }) {
  const [kereses, setKereses] = useState('');
  const m = (kulcs) => (ertek) => setU((x) => ({ ...x, [kulcs]: ertek }));
  const tulFokuszai = (fokLap && fokLap['Fókuszok'] || []).filter((f) => f.tulajdonsag === u.tulajdonsag && f.aktiv !== false);
  const szo = kereses.trim().toLowerCase();
  const lathatoFok = tulFokuszai.filter((f) => !szo || (f.nev_hu + ' ' + (f.nev_en || '')).toLowerCase().includes(szo) || u.fokuszok.includes(f.id));
  const fokValt = (id) => setU((x) => ({ ...x, fokuszok: x.fokuszok.includes(id) ? x.fokuszok.filter((y) => y !== id) : x.fokuszok.concat([id]) }));
  const kivalasztott = Array.isArray(u.cimzettek) ? u.cimzettek : null;
  const cimzettValt = (id) => setU((x) => {
    const most = Array.isArray(x.cimzettek) ? x.cimzettek : [];
    const uj = most.includes(id) ? most.filter((y) => y !== id) : most.concat([id]);
    return { ...x, cimzettek: uj };
  });
  const celpontok = R.cimzettLista(u.cimzettek, karakterek);
  const titkosLap = u.tipus === 'titkos' ? celpontok.filter((id) => !lapok[id]) : [];
  return html`<div className="verem probakeres">
    <${Kapcsolo} cimke="A próba típusa" teljes ertek=${u.tipus} onValt=${m('tipus')} opciok=${R.PROBA_TIPUSOK}/>
    <p className="sugo kicsi">${{
      alap: 'Mindenki a Célérték ellen dob.',
      ellen: 'A nagyobb eredmény nyer (karakterek egymás ellen, vagy egy ellenfél ellen, akinek a dobását te dobod).',
      osszetett: 'Több próba: a sikeres dobások sárkánykockái gyűlnek a Sikerküszöbig.',
      titkos: 'Te dobsz a karakterek helyett, a lapjuk értékeivel. A játékosok nem tudnak róla; a naplóban felfedheted.'
    }[u.tipus]}</p>
    <${K.TextField} label="Cím (nem kötelező)" placeholder=${u.tulajdonsag ? R.probaCim(u.tulajdonsag, u.fokuszok, fokuszNev) : 'például A kapu őre'}
      value=${u.cim} onChange=${(e) => m('cim')(e.target.value)}/>
    <${Valaszto} label="Tulajdonság" value=${u.tulajdonsag} ures="Válassz…"
      onChange=${(x) => setU((y) => ({ ...y, tulajdonsag: x, fokuszok: [], fokusz_kotelezo: false }))}
      opciok=${Object.keys(TUL_NEV).map((t) => ({ value: t, label: TUL_NEV[t] }))}/>
    ${u.tulajdonsag ? html`<fieldset className="szakasz">
      <legend className="cimke">Fókusz (több is lehet; a karakter a legjobbját használja)</legend>
      ${tulFokuszai.length > 8 ? html`<${K.TextField} label="Keresés" type="search" value=${kereses} onChange=${(e) => setKereses(e.target.value)} placeholder="Fókusz neve"/>` : null}
      <div className="csipek">${lathatoFok.map((f) => html`<${Csip} key=${f.id} be=${u.fokuszok.includes(f.id)} onClick=${() => fokValt(f.id)}>${f.nev_hu}<//>`)}</div>
      ${u.fokuszok.length ? html`<${Jelolo} checked=${u.fokusz_kotelezo} onChange=${m('fokusz_kotelezo')}>Kötelező fókusz (nélküle automatikus kudarc)<//>` : null}
    </fieldset>` : null}
    ${u.tipus !== 'ellen' ? html`<fieldset className="szakasz">
      <legend className="cimke">Célérték</legend>
      <div className="csipek">${CELERTEKEK.map((c) => html`<button key=${c.ertek} type="button" className="csip csip--kicsi" aria-pressed=${Number(u.celertek) === c.ertek}
        onClick=${() => m('celertek')(c.ertek)}><strong>${c.ertek}</strong> ${c.nev}</button>`)}</div>
      <div className="sorban">
        <${K.TextField} label="Egyéb érték" inputMode="numeric" value=${CELERTEKEK.some((c) => c.ertek === Number(u.celertek)) ? '' : String(u.celertek)}
          onChange=${(e) => m('celertek')(e.target.value.replace(/[^0-9]/g, '').slice(0, 2))}/>
      </div>
      ${u.tipus !== 'titkos' ? html`<${Jelolo} checked=${u.celertek_rejtett} onChange=${m('celertek_rejtett')}>Rejtett Célérték (a játékosok csak a sikert látják)<//>` : null}
    </fieldset>` : null}
    ${u.tipus === 'osszetett' ? html`<fieldset className="szakasz">
      <legend className="cimke">Sikerküszöb</legend>
      <div className="csipek">${KUSZOBOK.map((k) => html`<button key=${k.ertek} type="button" className="csip csip--kicsi" aria-pressed=${Number(u.kuszob) === k.ertek}
        onClick=${() => m('kuszob')(k.ertek)}><strong>${k.ertek}</strong> ${k.nev}</button>`)}</div>
      <${Kapcsolo} cimke="Haladás" ertek=${u.haladas} onValt=${m('haladas')}
        opciok=${[{ value: 'egyeni', label: 'Egyéni (verseny)' }, { value: 'kozos', label: 'Közös (együtt gyűjtik)' }]}/>
      <${K.TextField} label="Egy próba ideje (nem kötelező)" placeholder="például óránként, körönként" value=${u.idoegyseg} onChange=${(e) => m('idoegyseg')(e.target.value)}/>
    </fieldset>` : null}
    ${u.tipus === 'ellen' ? html`<fieldset className="szakasz">
      <legend className="cimke">Ellenfél (ha nem a karakterek egymás ellen)</legend>
      ${njkk.length && fokLap ? html`<${Valaszto} label="NJK a kampányból" value="" ures="Válassz, és kitölti a nevet és a bónuszt…"
        hint=${u.tulajdonsag ? 'A bónusz a választott tulajdonságból és a kért fókuszok közül a legjobból.' : 'Előbb válassz tulajdonságot.'}
        opciok=${njkk.map((n) => ({ value: n.id, label: n.nev }))} onChange=${(id) => {
          const n = njkk.find((x) => x.id === id);
          const nz = n ? lenyNezet({ tipus: 'njk', sor: n }, fokLap) : null;
          if (!nz) return;
          const tul = nz.tulajdonsagok[u.tulajdonsag] ? nz.tulajdonsagok[u.tulajdonsag].ertek : 0;
          const fok = Math.max(0, ...u.fokuszok.map((f) => (nz.fokuszok[f] ? nz.fokuszok[f].bonusz : 0)));
          setU((x) => ({ ...x, ellenfel_nev: n.nev, ellenfel_bonusz: tul + fok }));
        }}/>` : null}
      <div className="sorban">
        <${K.TextField} label="Név" placeholder="például Kapuőr" value=${u.ellenfel_nev} onChange=${(e) => m('ellenfel_nev')(e.target.value)}/>
        <${K.TextField} label="Bónusz" hint="Tulajdonság és fókusz" inputMode="numeric" value=${String(u.ellenfel_bonusz)}
          onChange=${(e) => m('ellenfel_bonusz')(e.target.value.replace(/[^0-9−-]/g, '').replace('−', '-').slice(0, 3))}/>
      </div>
    </fieldset>` : null}
    <fieldset className="szakasz">
      <legend className="cimke">Kiknek</legend>
      ${!karakterek.length ? html`<p className="kicsi" style=${{ margin: 0, color: 'var(--warning)' }}>⚠ Ebben a kampányban nincs aktív karakter (az archivált és a nem aktív állapotú karakterek nem kapnak próbát). A Csapat panelen a „Karakter hozzáadása” résznél rendelhetsz karaktert a kampányhoz.</p>` : null}
      ${karakterek.length ? html`<div className="csipek">
        <${Csip} be=${!kivalasztott} onClick=${() => m('cimzettek')('mindenki')}>Mindenki<//>
        ${karakterek.map((c) => html`<${Csip} key=${c.id} be=${!!kivalasztott && kivalasztott.includes(c.id)} onClick=${() => cimzettValt(c.id)}>${c.nev}<//>`)}
      </div>` : null}
      ${titkosLap.length ? html`<p className="kicsi" style=${{ color: 'var(--warning)' }}>⚠ ${titkosLap.map((id) => (karakterek.find((c) => c.id === id) || {}).nev).join(', ')}: a karakterlap még hiányos, értük nem tudok dobni.</p>` : null}
    </fieldset>
    ${u.tipus !== 'titkos' ? html`<${Jelolo} checked=${u.mutatvany_engedett} onChange=${m('mutatvany_engedett')}>Mutatványpont engedélyezve<//>` : null}
    ${celpontok.length ? html`<details className="lenyilo">
      <summary>Módosító karakterenként${Object.values(u.modositok).some((x) => szamBol(x)) ? ' (van)' : ''}</summary>
      <div className="probakeres__modositok">${celpontok.map((id) => {
        const c = karakterek.find((x) => x.id === id) || {};
        return html`<${K.TextField} key=${id} label=${c.nev} inputMode="numeric" hint="±1–3 a körülmények szerint" value=${u.modositok[id] === undefined ? '' : String(u.modositok[id])}
          onChange=${(e) => { const v = e.target.value.replace(/[^0-9−-]/g, '').replace('−', '-').slice(0, 3); setU((x) => ({ ...x, modositok: { ...x.modositok, [id]: v } })); }}/>`;
      })}</div>
    </details>` : null}
  </div>`;
}

// ---- Egy kérés kártyája az élő táblával ----
function ProbaKartya({ p, allapot, lapok, naploz, onLezar, lezart, onUjranyit }) {
  const [helyette, setHelyette] = useState(null); // karakter, akinek a nevében a DM dob
  const [ellenfelDob, setEllenfelDob] = useState(false);
  const karakterek = allapot.karakterek || [];
  const t = R.probaTabla(p, karakterek, { tul: (id) => (lapok[id] && lapok[id].tulajdonsagok[p.tulajdonsag] ? lapok[id].tulajdonsagok[p.tulajdonsag].ertek : 0) });
  const kampany = { id: allapot.kampany.id, cim: allapot.kampany.cim, beallitasok: allapot.kampany.beallitasok };
  const helyetteKar = helyette ? karakterek.find((c) => c.id === helyette) : null;
  return html`<div className=${'probakartya' + (p._fuggo ? ' probakartya--fuggo' : '') + (lezart ? ' probakartya--lezart' : '')}>
    <div className="probakartya__fej">
      <${K.Badge} tone=${p.tipus === 'titkos' ? 'warning' : 'accent'}>${R.tipusNev(p.tipus)}<//>
      <strong className="probakartya__cim">${p.cim}</strong>
      <span className="halvany kicsi probakartya__szam">${p._fuggo ? 'küldés…' : `${t.dobott}/${t.osszes} dobott`}</span>
    </div>
    <p className="kicsi halvany probakartya__feltetel">${R.probaFeltetel(p, { dm: true })}</p>
    ${t.kozos ? html`<div className="probakartya__kozos">
      <span className="kicsi">Közös: ${t.kozos.gyujtott} / ${t.kozos.kuszob}${t.kozos.kesz ? ' · ✓ Kész' : ''}</span>
      <span className="csik" aria-hidden="true"><span style=${{ width: t.kozos.szazalek + '%' }}></span></span>
    </div>` : null}
    <ul className="probatabla">
      ${t.sorok.map((s) => html`<li key=${s.kulcs} className="probatabla__sor">
        ${s.ellenfel ? html`<span className="karakterkep karakterkep--kicsi karakterkep--monogram" aria-hidden="true">⚔</span>` : html`<${KarakterKep} kep=${s.kep} nev=${s.nev}/>`}
        <span className="probatabla__nev">${s.hely ? html`<strong>${s.hely}.</strong> ` : null}${s.nev}</span>
        <span className="probatabla__ertek">
          ${s.allapot === 'var' ? html`<span className="halvany kicsi">vár</span>` : html`
            <span className="naplo__osszeg">${s.osszeg}</span>
            ${s.eredmeny === 'siker' ? html`<${K.Badge} tone="success">✓<//>` : null}
            ${s.eredmeny === 'kudarc' ? html`<${K.Badge} tone="danger">✗<//>` : null}
            ${s.mutatvanypont && (p.tipus !== 'ellen' || s.mp_koltheto) ? html`<${K.Badge} tone="dragon">${s.mutatvanypont} MP<//>` : null}
            ${s.ujradobas ? html`<${K.Badge} tone="warning">újradobás<//>` : null}`}
          ${!lezart && !p._fuggo && !s.ellenfel && naploz && lapok[s.kulcs] ? html`<button type="button" className="figygomb figygomb--halk" onClick=${() => setHelyette(s.kulcs)}>Dobás helyette</button>` : null}
          ${!lezart && !p._fuggo && s.ellenfel ? html`<button type="button" className="figygomb" onClick=${() => setEllenfelDob(true)}>${s.allapot === 'var' ? 'Dobás' : 'Újra'}</button>` : null}
        </span>
        ${p.tipus === 'osszetett' && !s.ellenfel && s.allapot !== 'var' ? html`<span className="probatabla__halad">
          ${p.haladas !== 'kozos' ? html`<span className="csik" aria-hidden="true"><span style=${{ width: s.szazalek + '%' }}></span></span>` : null}
          <span className="kicsi halvany">${p.haladas === 'kozos'
            ? `hozzájárulás: ${s.gyujtott} · ${s.probak} próba`
            : s.allapot === 'kesz' ? `✓ Kész, ${s.probak_szama || s.probak} próba alatt` : `${s.gyujtott} / ${p.kuszob} · ${s.probak} próba`}</span>
        </span>` : null}
      </li>`)}
    </ul>
    ${p.tipus === 'ellen' && t.sorok.some((s) => s.mp_koltheto) ? html`<p className="kicsi halvany">Mutatványpontot csak a győztes költhet: a naplóban rögzítheti.</p>` : null}
    ${!p._fuggo ? html`<div className="gombsor">
      ${lezart ? html`<${K.Button} size="sm" variant="quiet" onClick=${onUjranyit}>Újranyitás<//>` : html`<${K.Button} size="sm" variant="secondary" onClick=${onLezar}>Lezárás<//>`}
    </div>` : null}
    ${helyetteKar ? html`<${ProbaLap} cim=${p.cim + ': ' + helyetteKar.nev} lap=${lapok[helyetteKar.id]} kezdet=${R.probaKezdet(p, helyetteKar.id)}
      karakter=${{ id: helyetteKar.id, nev: helyetteKar.nev }} kampany=${kampany} naploz=${naploz} onBezar=${() => setHelyette(null)}
      forrasok=${forrasokKampanybol(allapot, helyetteKar)} valasztasok=${mutatvanyValasztasok(helyetteKar)}/>` : null}
    ${ellenfelDob ? html`<${EllenfelAblak} p=${p} naploz=${naploz} onBezar=${() => setEllenfelDob(false)}/>` : null}
  </div>`;
}

const forrasokKampanybol = (allapot, kar) => (allapot.kampany.aktiv_forrasok && allapot.kampany.aktiv_forrasok.length ? allapot.kampany.aktiv_forrasok
  : kar && kar.adat && kar.adat.keszites && kar.adat.keszites.forrasok) || [];
const mutatvanyValasztasok = (kar) => (kar && kar.adat && kar.adat.jatek && kar.adat.jatek.mutatvany_valasztasok) || {};

// Az ellenfél dobása (ellenpróba): 3d6 + bónusz, Dobj vagy Beírom.
function EllenfelAblak({ p, naploz, onBezar }) {
  const { felhasznalo } = useApp();
  const [kesz, setKesz] = useState(null);
  const e = p.ellenfel && typeof p.ellenfel === 'object' ? p.ellenfel : {};
  return html`<${Parbeszed} cim=${(e.nev || 'Ellenfél') + ' dobása'} onBezar=${onBezar}>
    <div className="verem">
      <p className="halvany kicsi">${p.cim} · 3d6 ${elojel(Number(e.bonusz) || 0)}</p>
      <${Kockadobo} db=${3} kockak=${null} felirat=${kesz ? 'Újradobás' : 'Dobj 3d6-tal'} onDobas=${(kockak, kezi) => {
        const d = R.ellenfelDobas(p, kockak, kezi);
        d.dobta = felhasznalo.nev;
        setKesz(d);
        naploz(d);
      }}/>
      ${kesz ? html`<div className="proba__eredmeny friss" key=${kesz.id}><${K.DiceRoll} dice=${kesz.kockak} bonus=${kesz.modosito}/></div>` : null}
      ${kesz ? html`<div className="gombsor"><${K.Button} variant="primary" onClick=${onBezar}>Kész<//></div>` : null}
    </div>
  <//>`;
}

// =================== Játékos: a nyitott kérések kártyái ===================
export function JatekosProbak({ allapot, naploz }) {
  const karakterek = allapot.karakterek || [];
  const kartyak = R.jatekosKartyak(allapot.probak || [], karakterek);
  const lapok = useLapok(karakterek);
  const [nyitott, setNyitott] = useState(null);
  if (!kartyak.length) return null;
  const kampany = { id: allapot.kampany.id, cim: allapot.kampany.cim, beallitasok: allapot.kampany.beallitasok };
  const aktualis = nyitott ? kartyak.find((k) => k.kulcs === nyitott) : null;
  const tobbKarakter = new Set(kartyak.map((k) => k.karakter.id)).size > 1;
  return html`<div className="verem">
    ${kartyak.map((k) => {
      const p = k.proba;
      const u = k.utolso;
      const folytathato = p.tipus === 'osszetett' && !k.kesz;
      return html`<div key=${k.kulcs} className=${'probakartya probakartya--jatekos' + (k.dobott && !folytathato ? ' probakartya--kesz' : '')}>
        <div className="probakartya__fej">
          ${tobbKarakter ? html`<${KarakterKep} kep=${k.karakter.kep} nev=${k.karakter.nev}/>` : null}
          <span className="probakartya__szoveg">
            <strong className="probakartya__cim">Próba: ${p.cim}${tobbKarakter ? html` <span className="halvany">(${k.karakter.nev})</span>` : null}</strong>
            <span className="kicsi halvany">${R.probaFeltetel(p) || R.tipusNev(p.tipus)}</span>
          </span>
        </div>
        ${p.tipus === 'osszetett' ? html`<div className="probakartya__kozos">
          <span className="kicsi">${k.kesz ? '✓ Kész' : `${k.gyujtott} / ${p.kuszob}`}</span>
          <span className="csik" aria-hidden="true"><span style=${{ width: Math.min(100, Math.round(k.gyujtott / (Number(p.kuszob) || 1) * 100)) + '%' }}></span></span>
        </div>` : null}
        <div className="gombsor">
          ${u ? html`<span className="probakartya__eredmeny">
            <span className="naplo__osszeg">${u.osszeg}</span>
            ${u.eredmeny === 'siker' ? html`<${K.Badge} tone="success">✓ Siker<//>` : null}
            ${u.eredmeny === 'kudarc' ? html`<${K.Badge} tone="danger">✗ Kudarc<//>` : null}
          </span>` : null}
          ${!k.dobott || folytathato ? html`<${K.Button} variant="primary" size="lg" disabled=${!lapok[k.karakter.id]} onClick=${() => setNyitott(k.kulcs)}>${k.dobott ? 'Következő próba' : 'Dobás'}<//>`
            : html`<span className="halvany kicsi">Dobtál, a DM látja.</span>`}
          ${!lapok[k.karakter.id] ? html`<span className="halvany kicsi">A karakterlap még hiányos.</span>` : null}
        </div>
      </div>`;
    })}
    ${aktualis ? html`<${ProbaLap} cim=${'Próba: ' + aktualis.proba.cim} lap=${lapok[aktualis.karakter.id]} kezdet=${R.probaKezdet(aktualis.proba, aktualis.karakter.id)}
      karakter=${{ id: aktualis.karakter.id, nev: aktualis.karakter.nev }} kampany=${kampany} naploz=${naploz} onBezar=${() => setNyitott(null)}
      forrasok=${forrasokKampanybol(allapot, aktualis.karakter)} valasztasok=${mutatvanyValasztasok(aktualis.karakter)}/>` : null}
  </div>`;
}

// =================== Varázslat: a célpont próbája ===================
// A karakterlap varázslatánál. A DM (vagy mesterjátékos) kérésként küldi; a játékos szövegként látja.
export function CelpontProbaGomb({ varazslat, varazsero, kampany, kerhet }) {
  const { api, szabalyok, uzen, sync } = useApp();
  const fokLap = szabalyok && szabalyok.adat && szabalyok.adat.lapok;
  const u0 = R.varazslatProba(varazslat, varazsero, kampany && kampany.beallitasok, (id) => fokuszNevLapbol(fokLap, id));
  const [allapot, setAllapot] = useState(null);
  if (!u0) return null;
  const szoveg = 'Célpont próbája: ' + u0.cim.replace(/^[^:]*: /, '');
  if (!kerhet || !kampany) return html`<p className="kicsi halvany" style=${{ margin: 0 }}>${szoveg}</p>`;
  const nyit = async () => {
    try { setAllapot(await api.hivas('state.get', { kampany_id: kampany.id })); } catch (e) { uzen(e.message, 'danger'); }
  };
  return html`<span>
    <${K.Button} size="sm" variant="quiet" onClick=${nyit}>${szoveg}<//>
    ${allapot ? html`<${CelpontAblak} kezdo=${u0} allapot=${allapot} onBezar=${() => setAllapot(null)}
      onKuld=${(adat) => { setAllapot(null); sync.push({ action: 'test.request', adat }).then(() => uzen('A próbakérés elment.', 'success')).catch((e) => uzen('A próbakérés nem ment el: ' + e.message, 'danger')); }}/>` : null}
  </span>`;
}

function CelpontAblak({ kezdo, allapot, onBezar, onKuld }) {
  const lapok = useLapok(allapot.karakterek || []);
  return html`<${UjProbaAblak} kezdo=${kezdo} allapot=${allapot} lapok=${lapok} onBezar=${onBezar} onKuld=${onKuld}/>`;
}

// =================== Kampány beállítások: próbák és dobások ===================
export function ProbaBeallitasok({ kampany, onMentve }) {
  const { api, uzen } = useApp();
  const [b, setB] = useState(kampany.beallitasok || {});
  const m = b.mutatvanyok || {};
  const valt = (kulcs, ertek) => {
    const valtozas = R.beallitasValtozas(b, kulcs, ertek);
    const regi = b;
    setB((x) => ({ ...x, ...valtozas }));
    api.hivas('campaign.update', { id: kampany.id, beallitasok: valtozas })
      .then((v) => { if (onMentve) onMentve(v); })
      .catch((e) => { setB(regi); uzen('A beállítás nem mentődött: ' + e.message, 'danger'); });
  };
  return html`<details className="lenyilo">
    <summary>Próbák és dobások</summary>
    <div className="verem">
      <p className="cimke" style=${{ margin: 0 }}>Mutatványtípusok
        <${Sugo} cim="Mutatványtípusok">A harci és varázslati mutatványok mindig elérhetők. Az isteni (Companion, papok) és a nyomozási (Companion) mutatványok csak akkor, ha a kampányban használjátok.<//></p>
      <${Jelolo} checked=${m.felfedezes !== false} onChange=${(x) => valt('mutatvanyok.felfedezes', x)}>Felfedezési mutatványok<//>
      <${Jelolo} checked=${m.szerepjatek !== false} onChange=${(x) => valt('mutatvanyok.szerepjatek', x)}>Szerepjátékos mutatványok<//>
      <${Jelolo} checked=${m.isteni === true} onChange=${(x) => valt('mutatvanyok.isteni', x)}>Isteni mutatványok<//>
      <${Jelolo} checked=${m.nyomozas === true} onChange=${(x) => valt('mutatvanyok.nyomozas', x)}>Nyomozási mutatványok<//>
      <p className="cimke" style=${{ margin: 0 }}>Próbák</p>
      <${Jelolo} checked=${b.celertek_rejtett !== false} onChange=${(x) => valt('celertek_rejtett', x)}>Új próbánál a Célérték alapból rejtett<//>
      <${Jelolo} checked=${b.dobas_reszletek_lathatok !== false} onChange=${(x) => valt('dobas_reszletek_lathatok', x)}>A játékosok látják egymás dobásainak részleteit<//>
      <p className="sugo kicsi">Kikapcsolva a játékosok mások dobásainál csak az összeget és az eredményt látják. A változás azonnal mentődik.</p>
    </div>
  </details>`;
}
