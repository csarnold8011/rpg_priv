// Közös Próba lap: a karakterlapról (tulajdonság, fegyver, varázslat), a kampány Dobás paneljéről, és később
// a DM próbakéréséből is ez nyílik. A szabályok: web/js/jatek/proba.js. A terv: claude/probak-terv.md.
//   ProbaUrlap: a lap tartalma (beágyazható, például a kampány Dobás paneljébe)
//   ProbaLap:   ugyanez párbeszédablakban (telefonon alsó lap)
//   useProbaNaplo: naplózás a szinkronrétegen át (a karakterlapnak, ahol nincs kampánynézet)
import { html, K, useApp, useState, useMemo, Parbeszed, Jelolo, Valaszto, Sugo, elojel } from './kozos.js';
import { MutatvanyValaszto } from './mutatvanyvalaszto.js';
import { Kockadobo } from './kockadobo.js';
import { Kapcsolo } from './varazslo_lepesek.js';
import { taroltKampanyok } from './varazslo.js';
import * as P from '../jatek/proba.js';

const TULAJDONSAGOK = Object.keys(P.TUL_NEV);
// A fókusz magyar neve a szabályadatból (a karakternek nem kell, hogy meglegyen).
export const fokuszNevLapbol = (lapok, id) => ((lapok && lapok['Fókuszok'] || []).find((f) => f.id === id) || {}).nev_hu || id;
const szamBol = (s) => { const n = parseInt(String(s).replace('−', '-'), 10); return Number.isFinite(n) ? n : 0; };

// A karakter kampánya (a naplózás helye): egy karakter egyszerre egy kampányban szerepel.
export function useKarakterKampanya(karakter) {
  const { felhasznalo } = useApp();
  return P.karakterKampanya(karakter, taroltKampanyok(felhasznalo.id));
}

// Naplózás közvetlenül a szinkronrétegen át (kiesés alatt sorba áll). A hibát üzenetben jelzi.
export function useProbaNaplo() {
  const { sync, uzen } = useApp();
  return (dobas) => sync.push({ action: 'roll.log', adat: dobas })
    .catch((e) => { uzen('A dobás nem került a naplóba: ' + e.message, 'danger'); });
}

// kezdet: { cim, tul, fokusz, fokuszok (kért fókuszok), modositok: [{ ertek, eredet }], celertek, celertek_rejtett,
//           hosszuTav, hosszuBuntetes, megjegyzes, tipus: 'alap' | 'tamadas' | 'varazslas', mp_ar, proba_id,
//           fegyver: { id, csoport, ketkezes, tavolsagi } (támadásnál), kepesseg: 'arkanloves' }
// karakter: { id, nev } vagy null (szabad dobás), kampany: { id, cim, beallitasok } vagy null (a karakter dobásai közé)
// naploz(dobas): a dobás naplózása; onMpLevon(ar): varázslási próba után a Mágiapont levonása
// forrasok: aktív források a mutatványokhoz; valasztasok, onValasztas: a karakter mutatványdöntései (mentés)
// njk: { id, nev } az NJK-tár eleme, akiért a próba szól (a dobás njk_id-vel naplózódik)
export function ProbaUrlap({ lap, kezdet = {}, karakter, kampany, njk, naploz, onMpLevon, rejtettLehet, forrasok, valasztasok, onValasztas }) {
  const { felhasznalo, sync, uzen, szabalyok } = useApp();
  const lapok = szabalyok && szabalyok.adat && szabalyok.adat.lapok;
  const [mutNyitva, setMutNyitva] = useState(false);
  const [mutKesz, setMutKesz] = useState(null); // { mutatvanyok, plusz } a rögzített választás
  const [tul, setTul] = useState(kezdet.tul || 'tul_accuracy');
  const kertFokusz = kezdet.fokusz && lap.fokuszok[kezdet.fokusz] ? kezdet.fokusz : P.fokuszAjanlas(lap, kezdet.fokuszok, kezdet.tul);
  const [fok, setFok] = useState(kertFokusz || '');
  const [kezi, setKezi] = useState('0');
  const [cel, setCel] = useState(kezdet.celertek && !kezdet.celertek_rejtett ? String(kezdet.celertek) : '');
  const [hosszu, setHosszu] = useState(false);
  const [rejtett, setRejtett] = useState(false);
  const [dobasok, setDobasok] = useState([]); // ennek a próbának a dobásai (az utolsó számít, az újradobás is naplózódik)
  const [mpLevonva, setMpLevonva] = useState(false);

  const fokuszok = P.tulajdonsagFokuszai(lap, tul);
  const modositok = (kezdet.modositok || []).slice();
  if (kezdet.hosszuTav && hosszu) modositok.push({ ertek: kezdet.hosszuBuntetes || -2, eredet: 'Hosszú táv' });
  if (szamBol(kezi)) modositok.push({ ertek: szamBol(kezi), eredet: 'Módosító' });
  const ossz = P.probaOsszeallit(lap, { tul, fokusz: fok, modositok });
  const celSzam = kezdet.celertek_rejtett ? kezdet.celertek : (cel === '' ? undefined : parseInt(cel, 10));
  const celIsmert = !kezdet.celertek_rejtett && Number.isFinite(celSzam);
  const uj = () => { setDobasok([]); setMpLevonva(false); setMutNyitva(false); setMutKesz(null); };
  const fegyver = kezdet.fegyver;
  const kontextus = useMemo(() => ({
    tipus: kezdet.tipus || 'alap', tul, fokusz: fok || undefined, kepesseg: kezdet.kepesseg,
    ...(fegyver ? { fegyver: fegyver.id, fegyvercsoport: fegyver.csoport, ketkezes: !!fegyver.ketkezes, tamadas: fegyver.tavolsagi ? 'tavolsagi' : 'kozelharci' } : {}),
    ...(kezdet.kepesseg === 'arkanloves' ? { tamadas: 'tavolsagi' } : {})
  }), [kezdet.tipus, tul, fok, kezdet.kepesseg, fegyver]);
  const mutatvanyKesz = (v) => {
    setMutKesz(v); setMutNyitva(false);
    if (naploz && utolso) sync.push({ action: 'roll.update', adat: { id: utolso.dobas.id, mutatvanyok: v.mutatvanyok, plusz: v.plusz } })
      .catch((e) => uzen('A mutatványok nem kerültek a naplóba: ' + e.message, 'danger'));
  };
  const utolso = dobasok[dobasok.length - 1] || null;

  const dob = (kockak, beirt) => {
    const ert = P.probaKiertekel(kockak, ossz.bonusz, { celertek: celIsmert ? celSzam : undefined,
      fokusz_kotelezo: kezdet.fokusz_kotelezo && (kezdet.fokuszok || []).length > 0, van_fokusz: !!fok && (kezdet.fokuszok || []).includes(fok),
      mutatvany_tiltva: kezdet.mutatvany_tiltva });
    setMutNyitva(false); setMutKesz(null);
    const d = P.naploDobas({
      kampany_id: kampany && kampany.id, karakter_id: karakter && karakter.id,
      mire: kezdet.cim || P.probaNev(lap, tul, fok), kockak, osszeallitas: ossz, kiertekeles: ert,
      celertek: celIsmert ? celSzam : undefined, tipus: kezdet.tipus || 'alap', tul, fokusz: fok, kezi: beirt,
      proba_id: kezdet.proba_id, rejtett: rejtettLehet && rejtett,
      extra: utolso ? { ujradobas: utolso.dobas.id } : undefined
    });
    d.dobta = felhasznalo.nev;
    if (njk && njk.id) d.njk_id = njk.id;
    setDobasok((x) => x.concat([{ dobas: d, ert, kockak }]));
    if (naploz) naploz(d);
  };

  const hova = kampany ? `Napló: ${kampany.cim}` : karakter ? 'Napló: a karakter dobásai közé'
    : njk && naploz ? 'Napló: az NJK dobásai közé (kampány nélkül)' : 'A dobás nem kerül naplóba';
  return html`<div className="verem proba">
    <p className="halvany kicsi proba__hova">${hova}${kezdet.celertek_rejtett ? ' · a Célértéket a DM tudja' : ''}</p>
    <${Valaszto} label="Tulajdonság" value=${tul} onChange=${(x) => { setTul(x); setFok(''); uj(); }}
      opciok=${TULAJDONSAGOK.map((t) => ({ value: t, label: `${P.TUL_NEV[t]} (${elojel(lap.tulajdonsagok[t] ? lap.tulajdonsagok[t].ertek : 0)})` }))}/>
    <${Valaszto} label="Fókusz" value=${fok} onChange=${(x) => { setFok(x); uj(); }} ures="nincs fókusz"
      hint=${kezdet.fokuszok && kezdet.fokuszok.length ? (kezdet.fokusz_kotelezo ? 'Kötelező fókusz: ' : 'Kért fókusz: ') + kezdet.fokuszok.map((id) => (lap.fokuszok[id] ? lap.fokuszok[id].nev_hu : fokuszNevLapbol(lapok, id))).join(' vagy ') : undefined}
      opciok=${fokuszok.map((f) => ({ value: f.id, label: `${f.nev_hu} (+${f.bonusz})` }))}/>
    ${kezdet.hosszuTav ? html`<${Kapcsolo} cimke="Távolság" teljes ertek=${hosszu ? 'h' : 'r'} onValt=${(x) => { setHosszu(x === 'h'); uj(); }}
      opciok=${[{ value: 'r', label: 'Rövid táv' }, { value: 'h', label: `Hosszú táv (${elojel(kezdet.hosszuBuntetes || -2)})` }]}/>` : null}
    <div className="sorban">
      <${K.TextField} label="Módosító" hint="A DM adja (±1–3)" inputMode="numeric" value=${kezi}
        onChange=${(e) => { setKezi(e.target.value.replace(/[^0-9−-]/g, '').replace('−', '-').slice(0, 3)); uj(); }}/>
      ${kezdet.celertek_rejtett ? null : html`<${K.TextField} label="Célérték (ha tudod)" inputMode="numeric" value=${cel}
        hint=${P.celertekNev(cel) || 'Átlagos 11, Kihívó 13, Nehéz 15'}
        onChange=${(e) => { setCel(e.target.value.replace(/[^0-9]/g, '').slice(0, 2)); uj(); }}/>`}
    </div>
    ${kezdet.megjegyzes ? html`<p className="sugo">${kezdet.megjegyzes}</p>` : null}
    <div className="osszegsor">
      <span>3d6 ${ossz.reszek.map((r, i) => html`<span key=${i}>${i ? ' ' : ''}${elojel(r.ertek)} (${r.eredet})</span>`)}</span>
      <span className="osszegsor__ertek">${elojel(ossz.bonusz)}</span>
    </div>
    ${rejtettLehet ? html`<${Jelolo} checked=${rejtett} onChange=${setRejtett}>Rejtett dobás (a játékosok nem látják)<//>` : null}
    <${Kockadobo} db=${3} kockak=${null} felirat=${utolso ? 'Újradobás' : 'Dobj 3d6-tal'} onDobas=${dob}/>
    ${utolso ? html`<${ProbaEredmeny} d=${utolso} celIsmert=${celIsmert} celSzam=${celSzam} ujradobva=${dobasok.length > 1} kezdet=${kezdet}/>` : null}
    ${utolso && utolso.ert.mutatvanypont && lapok && !mutNyitva && !mutKesz && !kezdet.ellenproba ? html`<div className="gombsor">
      <${K.Button} variant="primary" onClick=${() => setMutNyitva(true)}>${utolso.ert.mutatvanypont} Mutatványpont elköltése<//>
      <span className="halvany kicsi">Azonnal el kell költeni.</span>
    </div>` : null}
    ${utolso && mutNyitva ? html`<${MutatvanyValaszto} key=${utolso.dobas.id} lapok=${lapok} lap=${lap} pont=${utolso.ert.mutatvanypont}
      kontextus=${kontextus} forrasok=${forrasok} beallitas=${kampany && kampany.beallitasok} valasztasok=${valasztasok || {}}
      onValasztas=${onValasztas} kezdo=${mutKesz} onKesz=${mutatvanyKesz} onMegse=${() => setMutNyitva(false)}/>` : null}
    ${mutKesz && !mutNyitva ? html`<div className="gombsor">
      <p className="mutatvany__osszegzes">✓ ${mutKesz.mutatvanyok.length ? mutKesz.mutatvanyok.map((m) => `${m.nev}${m.db > 1 ? ' × ' + m.db : ''} (${m.mp})`).join(', ') : 'Nem költöttél pontot.'}</p>
      <${K.Button} size="sm" variant="quiet" onClick=${() => setMutNyitva(true)}>Módosítás<//>
    </div>` : null}
    ${utolso && kezdet.mp_ar && onMpLevon ? html`<div className="gombsor">
      <${K.Button} size="sm" variant=${mpLevonva ? 'quiet' : 'primary'} disabled=${mpLevonva}
        onClick=${() => { onMpLevon(kezdet.mp_ar); setMpLevonva(true); }}>${mpLevonva ? `✓ ${kezdet.mp_ar} MP levonva` : `−${kezdet.mp_ar} MP levonása`}<//>
      <span className="halvany kicsi">A Mágiapont sikertelen próbánál is jár.</span>
    </div>` : null}
  </div>`;
}

function ProbaEredmeny({ d, celIsmert, celSzam, ujradobva, kezdet = {} }) {
  const { ert, dobas, kockak } = d;
  return html`<div className="proba__eredmeny friss" key=${dobas.id} aria-live="polite">
    <${K.DiceRoll} dice=${kockak} bonus=${dobas.modosito} target=${celIsmert ? celSzam : undefined}/>
    <p className="halvany kicsi" style=${{ margin: 0 }}>
      ${ert.eredmeny === 'siker' ? `Siker, ${ert.fok} (sárkánykocka ${ert.sarkany}). ` : ''}
      ${ert.fokusz_hianyzik ? 'A kért fókusz nélkül ez automatikus kudarc. ' : ''}
      ${ert.eredmeny === '' && kezdet.ellenproba ? 'Ellenpróba: a DM táblája mutatja, ki nyert. ' : ''}
      ${ert.eredmeny === '' && !kezdet.ellenproba && kezdet.proba_id && kezdet.celertek_rejtett ? 'A Célértéket a DM tudja: az eredmény hamarosan a naplóban látszik. ' : ''}
      ${ert.eredmeny === '' && !kezdet.ellenproba && !(kezdet.proba_id && kezdet.celertek_rejtett) ? 'Siker vagy kudarc: a DM dönt. ' : ''}
      ${kezdet.mutatvany_tiltva && ert.dupla ? 'Ennél a próbánál nincs Mutatványpont. ' : ''}
      ${dobas.kezi ? 'Beírt kockák. ' : ''}${ujradobva ? 'Újradobás (a napló az előzőt is őrzi). ' : ''}
    </p>
  </div>`;
}

export function ProbaLap({ cim, onBezar, ...p }) {
  return html`<${Parbeszed} cim=${cim || (p.kezdet && p.kezdet.cim) || 'Próba'} onBezar=${onBezar}>
    <${ProbaUrlap} ...${p}/>
  <//>`;
}
