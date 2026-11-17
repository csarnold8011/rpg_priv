// A játékos Csata sávja (3. lépés, 5. ütem): a kampánynézet tetején, amíg csata fut. Kör, a látható sorrend,
// „Te következel” kiemelés, a saját résztvevők Egészsége, Mágiapontja és feltételei, gyors gombok (fegyverek,
// varázslat, Védekezés, Gyógyítás, Célzás), a kezdeményezés és a célpont próbájának kártyája, a kör vége.
// A mesterjátékos a kampány összes karakterét, a követő irányítója a követőt is vezeti (a háttér jelöli: iranyithato).
// A lépés műveletként megy a háttérbe (combat.player, csatamuvelet.js); a képernyő előbb változik (a szűrt csatán
// alkalmazva), és a háttér válasza után a friss állapot váltja le. Terv: claude/csata-terv.md, „Játékos oldal”.
import { html, K, useApp, useState, useEffect, useMemo, Uzenet, Valaszto, elojel } from './kozos.js';
import { Kockadobo } from './kockadobo.js';
import { TamadasAblak, GyogyitasAblak, VarazslatAblak, CelpontProbak, forrasNezet, kezdemenyezesOssze, varazsloVarazslatai } from './csata.js';
import * as C from '../jatek/csata.js';
import * as M from '../jatek/csatamuvelet.js';
import * as P from '../jatek/proba.js';

const ALLAPOT_TONUS = { aktiv: undefined, haldoklik: 'danger', kiesett: 'warning', halott: 'danger' };
const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || null;

export function JatekosCsatak({ allapot, naploz }) {
  const futo = (allapot.csatak || []).filter((c) => c.allapot !== 'lezart' && c.adat && c.adat.resztvevok);
  if (!futo.length) return null;
  return html`${futo.map((c) => html`<${CsataSav} key=${c.id} szerver=${c} allapot=${allapot} naploz=${naploz}/>`)}`;
}

// A szerver szűrt csatája és a még fel nem ért saját lépések (optimista megjelenítés).
function useJatekosCsata(szerver) {
  const { sync, uzen } = useApp();
  const [fuggo, setFuggo] = useState([]); // [{ kulcs, m }]
  const alap = szerver.adat;
  useEffect(() => {
    const megvan = new Set(alap.kulcsok || []);
    setFuggo((f) => f.filter((x) => !megvan.has(x.kulcs)));
  }, [alap]);
  const cs = useMemo(() => {
    const megvan = new Set(alap.kulcsok || []);
    let x = alap;
    fuggo.forEach((f) => {
      if (megvan.has(f.kulcs) || f.m.tipus === 'visszavonas') return;
      try { x = M.muveletLepes(x, f.m, f.kulcs); } catch (e) { /* a háttér dönt */ }
    });
    return x;
  }, [alap, fuggo]);
  const vegrehajt = (m) => {
    // ugyanaz az ellenőrzés, mint a háttérben: ami ott elbukna, itt el sem indul (és nem is látszik)
    const iranyitott = alap.resztvevok.filter((r) => r.iranyithato).map((r) => r.id);
    const hiba = M.muveletEllenorzes(cs, m, { iranyitott });
    if (hiba && m.tipus !== 'visszavonas') { uzen(hiba, 'warning'); return; }
    const kulcs = C.ujKulcs();
    setFuggo((f) => f.concat([{ kulcs, m }]));
    sync.push({ action: 'combat.player', adat: { id: szerver.id, kulcs, muvelet: m } })
      .then(() => sync.pull().catch(() => {}))
      .catch((e) => {
        setFuggo((f) => f.filter((x) => x.kulcs !== kulcs));
        uzen(e.kod === 'hibas_lepes' ? e.message : 'A lépés nem ment át: ' + e.message, 'danger');
        sync.pull().catch(() => {});
      });
  };
  return { cs, vegrehajt, fuggoben: fuggo.length > 0 };
}

function CsataSav({ szerver, allapot, naploz }) {
  const { szabalyok, felhasznalo } = useApp();
  const lapok = lapokBol(szabalyok);
  const { cs, vegrehajt, fuggoben } = useJatekosCsata(szerver);
  const [ablak, setAblak] = useState(null);
  const sajat = cs.resztvevok.filter((r) => r.iranyithato);
  const iranyitott = sajat.map((r) => r.id);
  // a saját résztvevők lény-nézete (karakterlap vagy a követő statblokkja)
  const nezetek = useMemo(() => {
    const m = {};
    sajat.forEach((r) => { m[r.id] = forrasNezet(r.forras, { allapot, lapok }); });
    return m;
  }, [iranyitott.join(), allapot, lapok]);
  const kampany = allapot.kampany;
  const forrasok = kampany.aktiv_forrasok || [];
  const dobasNaplo = ({ r, mire, kockak, osszeallitas, ert, celertek, tipus, kezi }) => {
    const d = P.naploDobas({ kampany_id: kampany.id, karakter_id: r && r.forras.tipus === 'karakter' ? r.forras.id : '', mire, kockak, osszeallitas,
      kiertekeles: ert || { eredmeny: '', mutatvanypont: 0, fok: '' }, celertek, tipus, kezi });
    d.csata_id = szerver.id;
    d.dobta = felhasznalo.nev;
    if (r && r.forras.tipus === 'njk') d.njk_id = r.forras.id;
    naploz(d);
    return d;
  };
  const soron = C.resztvevo(cs, cs.soron);
  const enKovetkezem = soron && soron.iranyithato;
  const ctx = { cs, nezetek, lapok, kampany, forrasok, vegrehajt, dobasNaplo };
  const sorrendben = cs.allapot === 'fut' ? cs.sorrend.map((id) => C.resztvevo(cs, id)).filter(Boolean) : cs.resztvevok;

  return html`<div className=${'csatasav' + (enKovetkezem ? ' csatasav--soron' : '')}>
    <${K.Panel} title=${`Csata: ${szerver.cim}`} actions=${cs.allapot === 'fut' ? html`<${K.Badge} tone="accent">${cs.kor}. kör<//>` : html`<${K.Badge}>Kezdeményezés<//>`}>
      <div className="verem">
        ${cs.allapot === 'kezdemenyezes' ? html`<${KezdemenyezesKartyak} cs=${cs} sajat=${sajat} nezetek=${nezetek} vegrehajt=${vegrehajt} dobasNaplo=${dobasNaplo}/>` : null}
        ${cs.allapot === 'fut' ? html`${enKovetkezem
          ? html`<${Uzenet} tonus="success"><strong>Te következel: ${soron.nev}</strong> <span className="kicsi">(${C.cselekvesSzoveg(soron)})</span><//>`
          : html`<p style=${{ margin: 0 }}>Soron: <strong>${soron ? soron.nev : '…'}</strong></p>`}` : null}
        <${CelpontProbak} cs=${cs} nezetek=${nezetek} vegrehajt=${vegrehajt} dobasNaplo=${dobasNaplo} iranyitott=${iranyitott} nagy=${true}/>
        ${sajat.map((r) => html`<${SajatResztvevo} key=${r.id} r=${r} nz=${nezetek[r.id]} cs=${cs} lapok=${lapok} vegrehajt=${vegrehajt} setAblak=${setAblak}/>`)}
        ${!sajat.length ? html`<p className="halvany kicsi">Ebben a csatában nincs általad irányított résztvevő; a DM vezeti.</p>` : null}
        <${SorrendLista} cs=${cs} sorrendben=${sorrendben}/>
        <div className="gombsor">
          ${cs.utolso_lepes && cs.utolso_lepes.sajat && !fuggoben ? html`<${K.Button} size="md" variant="quiet" onClick=${() => vegrehajt({ tipus: 'visszavonas' })}
            >Visszavonás: ${cs.utolso_lepes.leiras.slice(0, 28)}<//>` : null}
          ${fuggoben ? html`<span className="halvany kicsi">Küldés…</span>` : null}
        </div>
        <details className="lenyilo">
          <summary>A csata eseményei</summary>
          <ul className="egyszeru-lista">${(cs.naplo || []).slice().reverse().slice(0, 15).map((n, i) => html`<li key=${i} className="kicsi"><span className="halvany">${n.kor ? n.kor + '. kör · ' : ''}</span>${n.szoveg}</li>`)}</ul>
        </details>
      </div>
    <//>
    ${ablak && ablak.tipus === 'tamadas' ? html`<${TamadasAblak} ...${ctx} tamadoId=${ablak.r} cselekves=${ablak.cselekves} tamadas=${ablak.tamadas} mutatSzam=${!cs.vedekezes_rejtett} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.tipus === 'varazslat' ? html`<${VarazslatAblak} ...${ctx} varazsloId=${ablak.r} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak && ablak.tipus === 'gyogyitas' ? html`<${GyogyitasAblak} ...${ctx} gyogyitoId=${ablak.r} onBezar=${() => setAblak(null)}/>` : null}
  </div>`;
}

// A kezdeményezés kártyái: a saját résztvevők dobása (Dobj vagy Beírom), a többiek állása.
function KezdemenyezesKartyak({ cs, sajat, nezetek, vegrehajt, dobasNaplo }) {
  const hianyzik = C.kezdemenyezesHianyzik(cs);
  return html`<div className="verem">
    <p className="halvany kicsi" style=${{ margin: 0 }}>Ügyesség (Kezdeményezés) próba. A sorrendet a DM indítja el, ha mindenki dobott.</p>
    ${sajat.map((r) => {
      const nz = nezetek[r.id];
      const ossz = nz ? kezdemenyezesOssze(nz) : { bonusz: 0, tulajdonsag_ertek: 0, reszek: [] };
      const k = r.kezdemenyezes;
      const dob = (kockak, kezi) => {
        const osszeg = kockak.reduce((a, b) => a + b, 0) + ossz.bonusz;
        dobasNaplo({ r, mire: `Kezdeményezés: ${r.nev}`, kockak, osszeallitas: ossz, tipus: 'kezdemenyezes', kezi });
        vegrehajt({ tipus: 'kezdemenyezes', r: r.id, osszeg, sarkany: kockak[2], tul: ossz.tulajdonsag_ertek, kockak, kezi });
      };
      return html`<div key=${r.id} className="probakartya">
        <div className="sorban sorban--szet">
          <strong>${r.nev}</strong>
          ${k ? html`<${K.Badge} tone="accent">${k.osszeg} (sárkány ${k.sarkany})<//>` : html`<span className="halvany kicsi">${elojel(ossz.bonusz)}</span>`}
        </div>
        ${!k ? html`<${Kockadobo} db=${3} kockak=${null} felirat="Kezdeményezés: 3d6" onDobas=${dob}
          eredmeny=${(o) => html`<span className="halvany">${elojel(ossz.bonusz)} → ${o + ossz.bonusz}</span>`}/>` : null}
      </div>`;
    })}
    ${hianyzik.length ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>Még nem dobott: ${hianyzik.map((r) => r.nev).join(', ')}.</p>`
      : html`<p className="kicsi" style=${{ margin: 0 }}>Mindenki dobott: a DM indítja a csatát.</p>`}
  </div>`;
}

// Egy saját résztvevő: Egészség, Mágiapont, feltételek, és ha soron van, a gyors gombok.
function SajatResztvevo({ r, nz, cs, lapok, vegrehajt, setAblak }) {
  const [szabad, setSzabad] = useState('');
  const [szabadFajta, setSzabadFajta] = useState('mellek');
  const soron = cs.allapot === 'fut' && cs.soron === r.id;
  const harcol = r.allapot === 'aktiv';
  const tamadasok = nz ? nz.tamadasok.filter((t) => t.tamadas !== null) : [];
  const varazsol = nz && lapok && varazsloVarazslatai(nz, lapok).length > 0;
  const fo = C.cselekvesEngedett(r, 'fo');
  const mellek = C.cselekvesEngedett(r, 'mellek');
  const egyeb = C.CSELEKVESEK.filter((a) => !a.tamadas && !['vedekezes', 'gyogyitas', 'celzas'].includes(a.kulcs));
  return html`<div className=${'probakartya' + (soron ? ' probakartya--kiemelt' : '')}>
    <div className="sorban sorban--szet">
      <strong>${r.nev}</strong>
      <span className="cimkek">
        ${r.allapot !== 'aktiv' ? html`<${K.Badge} tone=${ALLAPOT_TONUS[r.allapot]}>${C.ALLAPOT_NEV[r.allapot]}${r.allapot === 'haldoklik' && r.haldoklas_kor ? ` (${r.haldoklas_kor}. kör)` : ''}<//>` : null}
        ${soron ? html`<${K.Badge} tone="accent">soron<//>` : null}
      </span>
    </div>
    <${K.ResourceBar} kind="health" value=${r.egeszseg || 0} max=${Math.max(1, r.egeszseg_max || 1)} label="Egészség"/>
    ${r.magiapont !== null && r.magiapont !== undefined ? html`<${K.ResourceBar} kind="magic" value=${r.magiapont} max=${Math.max(1, (r.ertekek && r.ertekek.magiapont_max) || r.magiapont)} label="Mágiapont"/>` : null}
    ${r.feltetelek.length || r.hatasok.length ? html`<div className="csipek">
      ${r.feltetelek.map((f) => html`<span key=${f.id} className="csip csip--statikus">${f.nev}${f.lejar_kor ? ` (${f.lejar_kor}. körig)` : ''}</span>`)}
      ${r.hatasok.map((h) => html`<span key=${h.id} className="csip csip--statikus">${h.nev} ${elojel(h.ertek)}</span>`)}
    </div>` : null}
    ${soron && harcol ? html`<div className="verem">
      <p className="halvany kicsi" style=${{ margin: 0 }}>${C.cselekvesSzoveg(r)}</p>
      <div className="gombsor">
        ${tamadasok.map((t) => html`<${K.Button} key=${t.kulcs} size="lg" variant="primary" disabled=${!fo}
          onClick=${() => setAblak({ tipus: 'tamadas', r: r.id, cselekves: 'tamadas', tamadas: t.kulcs })}>${t.nev_hu} ${elojel(t.tamadas)}<//>`)}
        ${varazsol ? html`<${K.Button} size="lg" variant="primary" disabled=${!mellek} onClick=${() => setAblak({ tipus: 'varazslat', r: r.id })}>Varázslat<//>` : null}
      </div>
      <div className="gombsor">
        <${K.Button} size="md" variant="secondary" disabled=${!fo} onClick=${() => vegrehajt({ tipus: 'cselekves', r: r.id, kulcs: 'vedekezes' })}>Védekezés<//>
        <${K.Button} size="md" variant="secondary" disabled=${!fo || !nz} onClick=${() => setAblak({ tipus: 'gyogyitas', r: r.id })}>Gyógyítás<//>
        <${K.Button} size="md" variant="secondary" disabled=${!mellek} onClick=${() => vegrehajt({ tipus: 'cselekves', r: r.id, kulcs: 'celzas' })}>Célzás (m)<//>
        ${C.vanFeltetel(r, 'fekszik') ? html`<${K.Button} size="md" variant="primary" disabled=${!mellek} onClick=${() => vegrehajt({ tipus: 'cselekves', r: r.id, kulcs: 'mozgas' })}>Felállás (m)<//>` : null}
        ${C.vanFeltetel(r, 'lefegyverezve') ? html`<${K.Button} size="md" variant="primary" disabled=${!mellek} onClick=${() => vegrehajt({ tipus: 'cselekves', r: r.id, kulcs: 'keszenlet' })}>Fegyver vissza (m)<//>` : null}
      </div>
      ${!tamadasok.length && nz ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>Nincs felszerelt fegyver: a karakterlap Felszerelés részén állíthatod.</p>` : null}
      <details className="lenyilo">
        <summary>Más cselekvés</summary>
        <div className="verem">
          <div className="gombsor gombsor--szoros">${egyeb.map((a) => html`<${K.Button} key=${a.kulcs} size="sm" variant="quiet" title=${a.leiras || a.en}
            disabled=${!C.cselekvesEngedett(r, a.fajta) || (a.kulcs === 'futas' && C.vanFeltetel(r, 'fekszik'))} onClick=${() => vegrehajt({ tipus: 'cselekves', r: r.id, kulcs: a.kulcs })}
            >${a.nev}${a.fajta === 'mellek' ? ' (m)' : ''}${a.kulcs === 'mozgas' && C.vanFeltetel(r, 'fekszik') ? ': felállás' : ''}<//>`)}</div>
          <div className="sorban">
            <${K.TextField} label="Szabad leírás" placeholder="például ital, Lefegyverzés" value=${szabad} onChange=${(e) => setSzabad(e.target.value)}/>
            <${Valaszto} label="Fajta" value=${szabadFajta} onChange=${setSzabadFajta} opciok=${[{ value: 'fo', label: 'fő' }, { value: 'mellek', label: 'mellék' }, { value: 'szabad', label: 'szabad' }]}/>
            <${K.Button} disabled=${!szabad.trim() || !C.cselekvesEngedett(r, szabadFajta)}
              onClick=${() => { const t = szabad.trim(); setSzabad(''); vegrehajt({ tipus: 'cselekves', r: r.id, szabad: { nev: t, fajta: szabadFajta } }); }}>Rögzítés<//>
          </div>
        </div>
      </details>
    </div>` : null}
    ${soron ? html`<div className="gombsor"><${K.Button} size="lg" variant=${harcol ? 'secondary' : 'primary'} onClick=${() => vegrehajt({ tipus: 'kovetkezo', r: r.id })}>Kész, a köröm vége<//></div>` : null}
  </div>`;
}

// A látható sorrend: soron lévő, Egészség (a saját oldalé pontosan, a többieké a beállítás szerint), feltételek.
function SorrendLista({ cs, sorrendben }) {
  return html`<details className="lenyilo" open=${cs.allapot === 'fut'}>
    <summary>${cs.allapot === 'fut' ? 'Sorrend' : 'Résztvevők'}</summary>
    <ul className="egyszeru-lista">${sorrendben.map((r) => html`<li key=${r.id} style=${{ marginBottom: "var(--space-2)" }}>
      <div className="sorban sorban--szet">
        <span>${cs.soron === r.id ? '▶ ' : ''}<strong>${r.nev}</strong>${cs.leptek.includes(r.id) && cs.soron !== r.id ? html` <span className="halvany kicsi">lépett</span>` : null}</span>
        <span className="kicsi">${r.egeszseg === null || r.egeszseg === undefined ? (r.egeszseg_szoveg || '') : `${r.egeszseg}/${r.egeszseg_max}`}</span>
      </div>
      ${r.allapot !== 'aktiv' || r.feltetelek.length ? html`<div className="cimkek">
        ${r.allapot !== 'aktiv' ? html`<${K.Badge} tone=${ALLAPOT_TONUS[r.allapot]}>${C.ALLAPOT_NEV[r.allapot]}<//>` : null}
        ${r.feltetelek.map((f) => html`<span key=${f.id} className="csip csip--kicsi csip--statikus">${f.nev}</span>`)}
      </div>` : null}
    </li>`)}</ul>
  </details>`;
}
