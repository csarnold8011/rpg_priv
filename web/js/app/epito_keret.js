// Kampányépítő (DM): a kampány áttekintő oldala a Kampányépítő könyv 1. fejezete (Building the Campaign Framework)
// és a könyv végi kampány-munkalap (Campaign Worksheet) szerint, a kampány elemei és a kampány dobótáblái.
// Útvonal: #/dm/kampany/<id>/epito[/keret | /elemek | /elem/<id> | /dobotablak]. Minden mező kihagyható, a mentés
// automatikus. Tiszta függvények: web/js/kampany/keret.js. Terv: claude/kampanyepito-terv.md, „1. fejezet”.
import {
  html, K, useApp, useState, useEffect, useMemo, useLekeres, navigal, Ikon, Betoltes, Uzenet, Valaszto, Jelolo,
  Parbeszed, Megerosites, Sugo
} from './kozos.js';
import { Csip } from './varazslo_lepesek.js';
import * as KR from '../kampany/keret.js';
import * as E from '../kampany/elem.js';
import { usePrep, useAutoMentes, MentesJel, ElemSzerkeszto, ElemFa, UjElemParbeszed, ujAzon } from './epito.js';
import { GeneratorPanel } from './dobotabla.js';
import { forrasSzerint, megjelenitettNev } from '../szabalyok.js';
import { beallitasValtozas } from '../jatek/probakeres.js';
import * as G from '../kampany/generator.js';

const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};

export function KampanyEpitoOldal({ kampanyId, ut, Oldalfej, dm }) {
  const cel = useMemo(() => ({ szint: 'kampany', kampany_id: kampanyId }), [kampanyId]);
  const prep = usePrep(cel);
  const kampany = dm.kampanyok.find((k) => k.id === kampanyId) || null;
  const cim = kampany ? kampany.cim : 'Kampány';
  const [lap, azon] = ut;
  if (lap === 'elem' && azon) {
    return html`<${ElemSzerkeszto} key=${azon} id=${azon} prep=${prep} cel=${cel} Oldalfej=${Oldalfej}
      vissza=${['#/dm/kampany/' + kampanyId + '/epito/elemek', cim + ': elemek']}/>`;
  }
  const fulek = [['keret', 'Kampánykeret'], ['elemek', 'Elemek'], ['dobotablak', 'Dobótáblák']];
  const aktiv = fulek.some((f) => f[0] === lap) ? lap : 'keret';
  return html`<div>
    <${Oldalfej} cim=${'Kampányépítő: ' + cim} vissza=${['#/dm/kampany/' + kampanyId, cim]}/>
    <nav className="kapcsolo epito__fulek" aria-label="Kampányépítő részei">
      ${fulek.map(([k, n]) => html`<a key=${k} href=${'#/dm/kampany/' + kampanyId + '/epito/' + k} aria-current=${aktiv === k ? 'page' : undefined}
        className=${'epito__ful' + (aktiv === k ? ' epito__ful--aktiv' : '')}>${n}</a>`)}
    </nav>
    ${prep.hiba && !prep.adat ? html`<${Uzenet}>${prep.hiba.message}<//>` : !prep.adat ? html`<${Betoltes} szoveg="Az előkészítés betöltése…"/>`
      : aktiv === 'elemek' ? html`<${KampanyElemek} prep=${prep} cel=${cel}/>`
      : aktiv === 'dobotablak' ? html`<${KampanyDobotablak} prep=${prep}/>`
      : html`<${KeretSzerkeszto} key=${kampanyId} prep=${prep} kampany=${kampany} dm=${dm}/>`}
  </div>`;
}

// ================= A kampány elemei =================

function KampanyElemek({ prep, cel }) {
  const [uj, setUj] = useState(false);
  const [szoveg, setSzoveg] = useState('');
  const [archivalt, setArchivalt] = useState(false);
  const [vilagEs, setVilagEs] = useState(true);
  const sajat = prep.adat.elemek.filter((e) => e.kampany_id === cel.kampany_id);
  const vilagElemek = prep.adat.vilag_id ? prep.adat.elemek.filter((e) => e.vilag_id === prep.adat.vilag_id) : [];
  const mutatott = sajat.concat(vilagEs ? vilagElemek : []);
  const szurt = E.szures(mutatott, { szoveg, archivalt, ix: prep.ix });
  const archivDb = mutatott.filter((e) => e.aktiv === false).length;
  return html`<div className="ket-hasab">
    <${K.Panel} title="A kampány elemei" actions=${html`<${K.Button} size="sm" variant="primary" onClick=${() => setUj(true)}
      icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Új elem<//>`}>
      <div className="verem">
        <${K.TextField} label="Keresés" value=${szoveg} onChange=${(e) => setSzoveg(e.target.value)}/>
        ${vilagElemek.length ? html`<${Jelolo} checked=${vilagEs} onChange=${setVilagEs}>A világ elemei is (${vilagElemek.length})<//>` : null}
        ${archivDb ? html`<${Jelolo} checked=${archivalt} onChange=${setArchivalt}>Archiváltak is (${archivDb})<//>` : null}
        <${ElemFa} elemek=${szurt} ix=${prep.ix} cel=${cel}/>
      </div>
    <//>
    <${K.Panel} title="Szintek és öröklés">
      <p className="szoveg">A kampányelem csak ebben a kampányban él. Ha egy sablonra vagy a világ egy elemére épül, az alapja minden mezőjét
        örökli, és csak az eltéréseit tárolja; a mező mellett látszik, honnan jön az értéke. A világ elemei (zöld helyett kék jelölés) minden kampányban
        ugyanazok: ha itt másként kellenek, a szerkesztőjükben „Kampányváltozat” készíthető. A kalandok, jelenetek, helyszínek és a többi elemtípus
        saját mezői a következő alépésekben kerülnek be, a könyv fejezetei szerint.</p>
    <//>
    ${uj ? html`<${UjElemParbeszed} prep=${prep} cel=${cel} onBezar=${() => setUj(false)}/>` : null}
  </div>`;
}

// ================= Dobótáblák a kampányban (kikapcsolt sorok) =================

function KampanyDobotablak({ prep }) {
  const { szabalyok } = useApp();
  const keret = KR.normalizal(prep.adat.keret ? prep.adat.keret.keret : {});
  const [kikapcsolt, setKikapcsolt] = useState(keret.generator_kikapcsolt);
  const mentes = useAutoMentes(kikapcsolt, (k) => prep.keretMent({ ...KR.normalizal(prep.adat.keret.keret), generator_kikapcsolt: k }), 600);
  const db = Object.values(kikapcsolt).reduce((n, s) => n + s.length, 0);
  return html`<div className="ket-hasab">
    <${K.Panel} title="Dobás" actions=${html`<${MentesJel} allapot=${mentes.allapot}/>`}>
      <${GeneratorPanel} lapok=${lapokBol(szabalyok)} kikapcsolt=${kikapcsolt} onKikapcsol=${(t, i) => setKikapcsolt(G.kikapcsolValt(kikapcsolt, t, i))}/>
    <//>
    <${K.Panel} title="Kikapcsolt sorok">
      <p className="szoveg">A könyv is azt javasolja, hogy ami nem illik a világodhoz (például lőporfegyverek, gránátok), azt dobd újra. A tábla soraiban
        („A tábla sorai”) a sorok ebben a kampányban kikapcsolhatók; a generátor ilyenkor magától újradob.</p>
      <p className="halvany kicsi">${db ? db + ' sor kikapcsolva.' : 'Nincs kikapcsolt sor.'}</p>
    <//>
  </div>`;
}

// ================= A kampánykeret =================

function Lepes({ lepes, allapot, children }) {
  return html`<section id=${'lepes-' + lepes.kulcs} className="keret__lepes">
    <${K.Panel} title=${html`${lepes.nev} <span className="halvany keret__en">(${lepes.en}, ${lepes.oldal}. oldal)</span>`}>
      <div className="verem">
        <p className="sugo">${lepes.utmutato}</p>
        ${children}
      </div>
    <//>
  </section>`;
}

const PONT = { kesz: ['lepeslista__pont--kesz', '✓'], resz: ['lepeslista__pont--resz', '…'], ures: ['', ''] };

function KeretSzerkeszto({ prep, kampany, dm }) {
  const { api, uzen, szabalyok } = useApp();
  const kiindulo = () => KR.normalizal(prep.adat.keret ? prep.adat.keret.keret : {});
  const [k, setK] = useState(kiindulo);
  const mentes = useAutoMentes(k, (x) => prep.keretMent(x).then((v) => { if (v && v.kampany) dm.kampanyFrissit(v.kampany); return v; }));
  // máshonnan érkező (betöltött) keret: ha nincs mentetlen módosítás, a vázlat követi
  useEffect(() => {
    if (mentes.allapot !== 'mentve') return;
    const friss = kiindulo();
    if (JSON.stringify(friss) !== JSON.stringify(k)) { setK(friss); mentes.alap(friss); }
  }, [prep.adat.keret && prep.adat.keret.verzio]); // eslint-disable-line
  const allit = (ut, x) => setK((r) => KR.beallit(r, ut, x));
  const lapok = useMemo(() => forrasSzerint(lapokBol(szabalyok), kampany && kampany.aktiv_forrasok), [szabalyok, kampany]);
  const karakterek = dm.karakterek.filter((c) => (c.kampanyok || []).includes(kampany && kampany.id) && c.aktiv !== false);
  const allapotok = KR.lepesAllapot(k, karakterek);
  const ugrik = (kulcs) => { const el = document.getElementById('lepes-' + kulcs); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };
  if (!kampany) return html`<${Uzenet}>Nincs ilyen kampány.<//>`;
  const p = { k, allit, setK, prep, kampany, dm, lapok, karakterek, api, uzen };
  return html`<div className="keret">
    <nav className="keret__lepesek" aria-label="A keret lépései">
      <div className="sorban sorban--kozep"><p className="cimke">A könyv lépései</p><${MentesJel} allapot=${mentes.allapot}/></div>
      <ul className="lepeslista">${KR.LEPESEK.map((l, i) => html`<li key=${l.kulcs}>
        <button type="button" onClick=${() => ugrik(l.kulcs)}>
          <span className=${'lepeslista__pont ' + PONT[allapotok[l.kulcs]][0]}>${PONT[allapotok[l.kulcs]][1] || i + 1}</span>${l.nev}</button></li>`)}
      </ul>
      <p className="halvany kicsi">Minden mező kihagyható: a könyv szerint is csak annyit érdemes kidolgozni, amennyi a következő alkalomhoz kell.
        A jutalomtérkép (a munkalap második oldala) az 5.6 alépésben kerül ide.</p>
    </nav>
    <div className="verem keret__tartalom">
      <${AlapokLepes} ...${p}/>
      <${Lepes} lepes=${KR.LEPESEK[1]}>
        <${K.TextField} label="Téma" multiline=${true} rows=${3} value=${k.tema} onChange=${(e) => allit('tema', e.target.value)}
          placeholder="Mit várnak a hősöktől? Például: rosszul fizetett nyomozók egy korrupt kikötővárosban."/>
      <//>
      <${JatekosokLepes} ...${p}/>
      <${Lepes} lepes=${KR.LEPESEK[3]}>
        <${K.TextField} label="A záró jelenet" multiline=${true} rows=${4} value=${k.veg.zaro_jelenet} onChange=${(e) => allit('veg.zaro_jelenet', e.target.value)}
          hint="Minél több részlet (hol, mikor, milyen körülmények között), annál több kérdést ad a visszafelé tervezéshez."/>
        <${K.TextField} label="A tét" multiline=${true} rows=${2} value=${k.veg.tet} onChange=${(e) => allit('veg.tet', e.target.value)}
          hint="Mi történik, ha a hősök kudarcot vallanak?"/>
        <${EllenfelValaszto} ...${p}/>
      <//>
      <${Lepes} lepes=${KR.LEPESEK[4]}>
        <${K.TextField} label="A végső ellenfél célja" multiline=${true} rows=${2} value=${k.veg.ellenfel.cel} onChange=${(e) => allit('veg.ellenfel.cel', e.target.value)}/>
        <${K.TextField} label="Hogyan dolgozik?" multiline=${true} rows=${3} value=${k.veg.ellenfel.modszer} onChange=${(e) => allit('veg.ellenfel.modszer', e.target.value)}
          hint="Maga végzi a piszkos munkát, vagy csatlósokra bízza? Milyen tervei vezetnek a záró jelenethez?"/>
        <${K.TextField} label="Csatlósai és hadnagyai" multiline=${true} rows=${2} value=${k.veg.ellenfel.csatlosok} onChange=${(e) => allit('veg.ellenfel.csatlosok', e.target.value)}/>
        <${K.TextField} label="Más gonosztevők a terveiben" multiline=${true} rows=${2} value=${k.veg.ellenfel.mas_gonoszok} onChange=${(e) => allit('veg.ellenfel.mas_gonoszok', e.target.value)}
          hint="Bevont-e (akár tudtán kívül) más ellenfeleket, saját céljaikkal?"/>
        <${K.TextField} label="Gonosznak tartja magát?" value=${k.veg.ellenfel.onkep} onChange=${(e) => allit('veg.ellenfel.onkep', e.target.value)}/>
        <${Szintsav} ...${p}/>
      <//>
      <${KihivasokLepes} ...${p}/>
      <${IvekLepes} ...${p}/>
      <${KalandraHivasLepes} ...${p}/>
      <${SzabalyokLepes} ...${p}/>
    </div>
  </div>`;
}

// ---- Keret, alműfaj, világ (a munkalap fejléce) ----
function AlapokLepes({ k, allit, setK, prep, dm, uzen }) {
  const [ujVilag, setUjVilag] = useState(false);
  const [vilagNev, setVilagNev] = useState('');
  const [sablonKerdes, setSablonKerdes] = useState('');
  const [sablonbaNev, setSablonbaNev] = useState(null);
  const pelda = KR.KERET_PELDAK.find((x) => x.id === k.peldakeret);
  const vilagok = (prep.adat.vilagok || []).filter((w) => w.aktiv !== false || w.id === k.vilag_id);
  const vilag = vilagok.find((w) => w.id === k.vilag_id);
  const keretSablonok = prep.adat.elemek.filter((e) => e.tipus === 'keret' && e.aktiv !== false);
  const vilagLetrehoz = () => {
    const id = ujAzon('w');
    prep.vilagMent({ id, nev: vilagNev.trim(), adat: {}, aktiv: true }).catch(() => {});
    allit('vilag_id', id);
    setUjVilag(false);
    setVilagNev('');
  };
  const sablonbaMent = () => {
    const nev = (sablonbaNev || '').trim();
    if (!nev) return;
    const letezo = keretSablonok.find((e) => E.nev(e, prep.ix) === nev);
    const adat = KR.sablonAdat(k, nev);
    if (letezo) prep.elemMent({ ...letezo, adat: { ...(letezo.adat || {}), ...adat } }).catch(() => {});
    else prep.elemMent({ id: ujAzon('el'), tipus: 'keret', nev, vilag_id: '', kampany_id: '', alap_id: '', szulo_id: '', sorrend: 0, adat, verzio: 0, aktiv: true }).catch(() => {});
    uzen(letezo ? 'A sablon frissült.' : 'A keret sablonként a Sablontárba került.');
    setSablonbaNev(null);
  };
  return html`<${Lepes} lepes=${KR.LEPESEK[0]}>
    <div className="urlap-racs">
      <${Valaszto} label="Keret (a könyv példái)" value=${k.peldakeret} ures="saját keret" onChange=${(x) => setK((r) => KR.peldaAlkalmaz(r, x))}
        opciok=${KR.KERET_PELDAK.map((x) => ({ value: x.id, label: x.nev_hu + ' (' + x.nev_en + ')' }))}/>
      <${K.TextField} label=${pelda ? 'Saját név a keretnek' : 'A keret neve'} value=${k.sajat_keret} onChange=${(e) => allit('sajat_keret', e.target.value)}
        placeholder=${pelda ? pelda.nev_hu : 'például Városi nyomozók'}/>
    </div>
    ${pelda ? html`<${Uzenet} tonus="neutral">${pelda.osszefoglalo} <span className="halvany">(Kampányépítő, ${pelda.oldal}. oldal)</span><//>` : null}
    <div>
      <p className="cimke">Alműfaj <${Sugo} cim="Alműfaj">A 9. fejezet alműfajai. Több is választható: ez a keverék (Mash-Up). A fejezet választható szabályai a lap alján jelölhetők.<//></p>
      <div className="csipek">${KR.ALMUFAJOK.map((a) => html`<${Csip} key=${a.id} be=${k.almufajok.includes(a.id)}
        onClick=${() => allit('almufajok', k.almufajok.includes(a.id) ? k.almufajok.filter((x) => x !== a.id) : k.almufajok.concat([a.id]))}>${a.nev_hu}<//>`)}</div>
      ${k.almufajok.length > 1 ? html`<p className="halvany kicsi">Keverék (Mash-Up), 110. oldal.</p>` : null}
    </div>
    <div className="urlap-racs">
      <${Valaszto} label="Kampánystílus (Alapkönyv)" value=${k.stilus} ures="nincs megadva" onChange=${(x) => allit('stilus', x)}
        opciok=${KR.STILUSOK.map((s) => ({ value: s.id, label: s.nev_hu + ' (' + s.nev_en + ')' }))}/>
      <${K.TextField} label="Kezdés dátuma" type="date" value=${k.kezdes_datum} onChange=${(e) => allit('kezdes_datum', e.target.value)}/>
    </div>
    <div className="sorban">
      <${Valaszto} label="Világ" value=${k.vilag_id} ures="nincs kiválasztva" onChange=${(x) => allit('vilag_id', x)}
        hint="A világ elemei (helyszínek, csoportok, visszatérő szereplők) több kampányban is visszatérhetnek."
        opciok=${vilagok.map((w) => ({ value: w.id, label: w.nev }))}/>
      <${K.Button} variant="secondary" onClick=${() => setUjVilag(true)}>Új világ<//>
      ${vilag ? html`<${K.Button} variant="quiet" onClick=${() => navigal('/dm/vilag/' + vilag.id)}>Megnyitás<//>` : null}
    </div>
    ${vilag && vilag.adat && vilag.adat.alapkoncepcio ? html`<p className="halvany kicsi">A világ alapkoncepciója: ${vilag.adat.alapkoncepcio}</p>` : null}
    <${K.TextField} label="A kampány helyszínének alapkoncepciója" hint="A munkalap High Concept mezője, erre a kampányra." multiline=${true} rows=${2}
      value=${k.alapkoncepcio} onChange=${(e) => allit('alapkoncepcio', e.target.value)}/>
    <${K.TextField} label="Kiinduló helyszín(ek)" hint="A helyszínek mint elemek az 5.4 alépéstől kapcsolhatók ide." multiline=${true} rows=${2}
      value=${k.kiindulo_helyszinek} onChange=${(e) => allit('kiindulo_helyszinek', e.target.value)}/>
    <${K.TextField} label="Fontos jellemzők" multiline=${true} rows=${3} value=${k.fontos_jellemzok} onChange=${(e) => allit('fontos_jellemzok', e.target.value)}/>
    <div className="sorban">
      <${Valaszto} label="Kiindulás sablonból" value=${sablonKerdes} ures=${keretSablonok.length ? 'Válassz…' : 'nincs még keret sablon'}
        onChange=${setSablonKerdes} opciok=${keretSablonok.map((e) => ({ value: e.id, label: E.nev(e, prep.ix) }))}/>
      <${K.Button} variant="secondary" onClick=${() => setSablonbaNev(k.sajat_keret || (pelda ? pelda.nev_hu : ''))}>Mentés sablonként<//>
    </div>
    ${sablonKerdes ? html`<${Megerosites} cim="Kiindulás sablonból" gomb="Alkalmazás"
      szoveg="A sablon tartalma felülírja a keret mezőit. A világ, a játékosokról szóló jegyzetek, a kezdés dátuma és a kikapcsolt táblasorok megmaradnak."
      onMegse=${() => setSablonKerdes('')} onIgen=${() => { const s = prep.ix.get(sablonKerdes); setSablonKerdes(''); if (s) setK((r) => KR.sablonAlkalmaz(r, s)); }}/>` : null}
    ${sablonbaNev !== null ? html`<${Parbeszed} cim="Mentés sablonként" onBezar=${() => setSablonbaNev(null)} lab=${html`
      <${K.Button} variant="quiet" onClick=${() => setSablonbaNev(null)}>Mégse<//>
      <${K.Button} variant="primary" disabled=${!sablonbaNev.trim()} onClick=${sablonbaMent}>Mentés<//>`}>
      <${K.TextField} label="A sablon neve" value=${sablonbaNev} onChange=${(e) => setSablonbaNev(e.target.value)}
        hint="Azonos nevű keret sablon frissül. A világ, a játékosok és az NJK-hivatkozások nem kerülnek bele."/>
    <//>` : null}
    ${ujVilag ? html`<${Parbeszed} cim="Új világ" onBezar=${() => setUjVilag(false)} lab=${html`
      <${K.Button} variant="quiet" onClick=${() => setUjVilag(false)}>Mégse<//>
      <${K.Button} variant="primary" disabled=${!vilagNev.trim()} onClick=${vilagLetrehoz}>Létrehozás<//>`}>
      <${K.TextField} label="A világ neve" value=${vilagNev} onChange=${(e) => setVilagNev(e.target.value)}/>
    <//>` : null}
  <//>`;
}

// ---- Ismerd a játékosaidat ----
const KEDVELT = [['harc', 'Harc'], ['felfedezes', 'Felfedezés'], ['szerepjatek', 'Szerepjáték']];
function JatekosokLepes({ k, allit, karakterek, dm }) {
  const csoportok = [];
  karakterek.forEach((c) => {
    const kulcs = KR.jatekosKulcs(c);
    let cs = csoportok.find((x) => x.kulcs === kulcs);
    if (!cs) { cs = { kulcs, nev: c.jatekos_id ? dm.felhasznaloNev(c.jatekos_id) : 'Játékos nélkül: ' + c.nev, karakterek: [] }; csoportok.push(cs); }
    cs.karakterek.push(c);
  });
  const j = (kulcs) => k.jatekosok[kulcs] || { kedvel: [], jegyzet: '' };
  return html`<${Lepes} lepes=${KR.LEPESEK[2]}>
    ${csoportok.length ? csoportok.map((cs) => html`<div key=${cs.kulcs} className="keret__jatekos">
      <p className="cimke">${cs.nev}</p>
      <div className="csipek">${KEDVELT.map(([kk, n]) => html`<${Csip} key=${kk} be=${j(cs.kulcs).kedvel.includes(kk)}
        onClick=${() => { const x = j(cs.kulcs); allit('jatekosok.' + cs.kulcs, { ...x, kedvel: x.kedvel.includes(kk) ? x.kedvel.filter((y) => y !== kk) : x.kedvel.concat([kk]) }); }}>${n}<//>`)}</div>
      <${K.TextField} label="Mit élvez valójában, mire figyelj?" multiline=${true} rows=${2} value=${j(cs.kulcs).jegyzet}
        onChange=${(e) => allit('jatekosok.' + cs.kulcs, { ...j(cs.kulcs), jegyzet: e.target.value })}/>
      ${cs.karakterek.map((c) => html`<${K.TextField} key=${c.id} label=${'Karakter: ' + c.nev} placeholder="Rövid összefoglaló (a munkalap Character Summary mezője)"
        value=${(k.karakterek[c.id] || {}).osszefoglalo || ''} onChange=${(e) => allit('karakterek.' + c.id, { osszefoglalo: e.target.value })}/>`)}
    </div>`) : html`<p className="halvany">Még nincs karakter a kampányban. A kampány oldalán rendelhetsz hozzá karaktereket; itt utána játékosonként látszanak.</p>`}
  <//>`;
}

// ---- A végső ellenfél (név és NJK-tár) ----
function EllenfelValaszto({ k, allit, api }) {
  const njkk = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk');
  return html`<div className="urlap-racs">
    <${K.TextField} label="A végső ellenfél" value=${k.veg.ellenfel.nev} onChange=${(e) => allit('veg.ellenfel.nev', e.target.value)}/>
    <${Valaszto} label="Az NJK-tárban" value=${k.veg.ellenfel.njk_id} ures="nincs kapcsolva" onChange=${(x) => allit('veg.ellenfel.njk_id', x)}
      opciok=${(njkk.adat || []).filter((n) => n.aktiv !== false).map((n) => ({ value: n.id, label: n.nev }))}/>
  </div>`;
}

function Szintsav({ k, allit }) {
  const szintek = Array.from({ length: 20 }, (_, i) => ({ value: String(i + 1), label: (i + 1) + '. szint' }));
  return html`<div className="urlap-racs">
    <${Valaszto} label="A kampány kezdő szintje" value=${String(k.szintsav.kezdo)} opciok=${szintek}
      onChange=${(x) => allit('szintsav', { ...k.szintsav, kezdo: Number(x), zaro: Math.max(Number(x), k.szintsav.zaro) })}/>
    <${Valaszto} label="Várható záró szint" value=${String(k.szintsav.zaro)} opciok=${szintek.filter((s) => Number(s.value) >= k.szintsav.kezdo)}
      onChange=${(x) => allit('szintsav', { ...k.szintsav, zaro: Number(x) })}/>
  </div>
  <${K.TextField} label="Illik-e ehhez az ellenfél ereje?" multiline=${true} rows=${2} value=${k.szintsav.megjegyzes}
    onChange=${(e) => allit('szintsav', { ...k.szintsav, megjegyzes: e.target.value })}
    hint="Ha a kampány nem tart 20 szintig, vagy a kezdő szintet kell emelni, vagy az ellenfél fenyegetését csökkenteni. A szintsávot a játékosok is látják (a könyv szerint jó előre jelezni)."/>`;
}

// ---- Az út kihívásai, a gonosztevők képtára ----
function KihivasokLepes({ k, allit, setK, lapok, api }) {
  const njkk = useLekeres(async () => (await api.hivas('npc.list', {})).njkk, [], 'njkk');
  const arany = KR.kihivasArany(k);
  const szornyek = (lapok['Szörnyek'] || []);
  const kepAllit = (i, x) => setK((r) => KR.beallit(r, 'keptar', r.keptar.map((y, j) => (j === i ? { ...y, ...x } : y))));
  return html`<${Lepes} lepes=${KR.LEPESEK[5]}>
    <div className="keret__kihivasok">${KR.KIHIVAS_TIPUSOK.map((t) => html`<div key=${t.kulcs} className="keret__kihivas">
      <span className="cimke">${t.nev}</span>
      <span className="lepteto">
        <button type="button" aria-label=${t.nev + ' −1'} disabled=${k.kihivasok[t.kulcs] <= 0} onClick=${() => allit('kihivasok.' + t.kulcs, k.kihivasok[t.kulcs] - 1)}>−</button>
        <span aria-live="polite">${k.kihivasok[t.kulcs]}</span>
        <button type="button" aria-label=${t.nev + ' +1'} disabled=${k.kihivasok[t.kulcs] >= 5} onClick=${() => allit('kihivasok.' + t.kulcs, k.kihivasok[t.kulcs] + 1)}>+</button>
      </span>
      <span className="halvany kicsi">${arany[t.kulcs]}%</span>
    </div>`)}</div>
    <p className="halvany kicsi">Súly 0–5: mennyire gyakori ez a kihívás ebben a kampányban (a százalék a tervezett arány).</p>
    <${Valaszto} label="A szerepjátékos kihívások" value=${k.kihivasok.szerepjatek_mod} onChange=${(x) => allit('kihivasok.szerepjatek_mod', x)}
      hint="Ha mindig a kijátszás dönt, kevesebb társas fókuszt választanak; ha mindig a próba, a szívesen játszó játékosok kedvét veszi."
      opciok=${Object.entries(KR.SZEREPJATEK_MODOK).map(([value, label]) => ({ value, label }))}/>
    <${K.TextField} label="Jellemző kihívások" multiline=${true} rows=${3} value=${k.kihivasok.jegyzet} onChange=${(e) => allit('kihivasok.jegyzet', e.target.value)}
      placeholder="Csapdák, rejtvények, nyomozás, udvari cselszövés…"/>
    <div>
      <p className="cimke">A gonosztevők képtára <${Sugo} cim="Gonosztevők képtára">Az ellenfél csatlósai, hadnagyai és a lények, akikkel a hősök útközben találkoznak. NJK-ra vagy a Bestiárium lényére is mutathat.<//></p>
      ${k.keptar.length ? html`<ul className="sorlista">${k.keptar.map((x, i) => html`<li key=${x.id} className="sorlista__sor sorlista__sor--fuggoleges">
        <div className="urlap-racs">
          <${K.TextField} label="Név" value=${x.nev} onChange=${(e) => kepAllit(i, { nev: e.target.value })}/>
          <${Valaszto} label="Szerep" value=${x.szerep} onChange=${(v) => kepAllit(i, { szerep: v })}
            opciok=${Object.entries(KR.KEPTAR_SZEREPEK).map(([value, label]) => ({ value, label }))}/>
          <${Valaszto} label="NJK" value=${x.njk_id} ures="nincs" onChange=${(v) => kepAllit(i, { njk_id: v })}
            opciok=${(njkk.adat || []).filter((n) => n.aktiv !== false).map((n) => ({ value: n.id, label: n.nev }))}/>
          <${Valaszto} label="Lény (Bestiárium)" value=${x.szorny_id} ures="nincs" onChange=${(v) => kepAllit(i, { szorny_id: v })}
            opciok=${szornyek.map((s) => ({ value: s.id, label: megjelenitettNev(s) }))}/>
        </div>
        <div className="sorban">
          <${K.TextField} label="Jegyzet" value=${x.jegyzet} onChange=${(e) => kepAllit(i, { jegyzet: e.target.value })}/>
          <${K.Button} size="sm" variant="quiet" onClick=${() => setK((r) => KR.beallit(r, 'keptar', r.keptar.filter((_, j) => j !== i)))}>Törlés<//>
        </div>
      </li>`)}</ul>` : null}
      <${K.Button} size="sm" variant="secondary" icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}
        onClick=${() => setK((r) => KR.beallit(r, 'keptar', r.keptar.concat([{ id: ujAzon('kt'), nev: '', szerep: 'csatlos', njk_id: '', szorny_id: '', jegyzet: '' }])))}>Új sor<//>
    </div>
  <//>`;
}

// ---- A kampány ívei ----
function IvekLepes({ k, allit }) {
  return html`<${Lepes} lepes=${KR.LEPESEK[6]}>
    ${KR.IVEK.map((iv) => {
      const x = k.ivek[iv.kulcs];
      const aktiv = KR.ivAktiv(iv, k);
      const mezo = (m, label, sorok) => html`<${K.TextField} label=${label} multiline=${sorok > 1} rows=${sorok} value=${x[m]}
        onChange=${(e) => allit('ivek.' + iv.kulcs + '.' + m, e.target.value)}/>`;
      return html`<details key=${iv.kulcs} className="lenyilo keret__iv" open=${aktiv && (iv.kulcs === 'kezdo' || !!x.cel) ? true : undefined}>
        <summary>${iv.nev} (${iv.en}), ${iv.tol}–${iv.ig}. szint${!aktiv ? html` <span className="halvany kicsi">a tervezett szintsávon kívül</span>` : null}
          ${x.cel ? html` <span className="halvany kicsi">· ${x.cel.slice(0, 60)}</span>` : null}</summary>
        <div className="urlap-racs">
          ${mezo('cel', 'Cél (Goal)', 2)}
          ${mezo('ellenfel', 'Fő ellenfél (Key Villain)', 2)}
          ${mezo('kihivasok', 'Fő kihívások (Key Challenges)', 2)}
          ${mezo('helyszinek', 'Fő helyszínek (Key Locations)', 2)}
        </div>
        ${mezo('keretvaltas', 'Keretváltás ebben az ívben (ha tervezed)', 1)}
      </details>`;
    })}
    <p className="halvany kicsi">A specializációk a 4. és a 12. szinten jönnek, a mesterfokok a 8. és a 16. szinten, a 20. szint epikus: ezért négyszintenként érdemes ívet váltani. A kalandok az 5.2 alépéstől köthetők az ívekhez.</p>
  <//>`;
}

// ---- Kalandra hívás, karakterkészítési ajánlások ----
function AjanlasKategoria({ kat, k, setK, lapok }) {
  const [keres, setKeres] = useState('');
  const elemek = lapok[kat.lap] || [];
  const x = k.ajanlasok[kat.kulcs];
  const valasztott = elemek.filter((e) => x.ajanlott.includes(e.id) || x.kizart.includes(e.id));
  const s = keres.trim().toLowerCase();
  const talalat = s ? elemek.filter((e) => !valasztott.includes(e) && megjelenitettNev(e).toLowerCase().includes(s)).slice(0, 24) : [];
  const csip = (e) => {
    const jel = x.ajanlott.includes(e.id) ? 'ajanlott' : x.kizart.includes(e.id) ? 'kizart' : null;
    return html`<button key=${e.id} type="button" className=${'csip ajanlas ajanlas--' + (jel || 'semleges')} aria-pressed=${!!jel}
      title=${kat.kizarhato ? 'Koppintás: ajánlott, újra: nem elérhető, újra: semleges' : 'Koppintás: ajánlott, újra: semleges'}
      onClick=${() => setK((r) => KR.ajanlasValt(r, kat.kulcs, e.id))}>${jel === 'ajanlott' ? '✓ ' : jel === 'kizart' ? '✗ ' : ''}${megjelenitettNev(e)}</button>`;
  };
  return html`<div className="keret__ajanlas">
    <p className="cimke">${kat.nev}</p>
    ${valasztott.length ? html`<div className="csipek">${valasztott.map(csip)}</div>` : null}
    <${K.TextField} label=${'Keresés: ' + kat.nev.toLowerCase()} value=${keres} onChange=${(e) => setKeres(e.target.value)} placeholder="név (magyar vagy angol)"/>
    ${talalat.length ? html`<div className="csipek">${talalat.map(csip)}</div>` : null}
  </div>`;
}

function KalandraHivasLepes({ k, allit, setK, lapok }) {
  return html`<${Lepes} lepes=${KR.LEPESEK[7]}>
    <${K.TextField} label="A kezdés" multiline=${true} rows=${3} value=${k.kalandra_hivas.kezdes} onChange=${(e) => allit('kalandra_hivas.kezdes', e.target.value)}
      hint="Hol és hogyan kapcsolódnak be a hősök? Csak te látod."/>
    <${K.TextField} label="Bemutatás a játékosoknak" multiline=${true} rows=${4} value=${k.kalandra_hivas.jatekosoknak}
      onChange=${(e) => allit('kalandra_hivas.jatekosoknak', e.target.value)}
      hint="Ezt a játékosok a karakterkészítőben látják (a kampány ajánlásaival és a tervezett szintsávval együtt)."/>
    <div>
      <p className="cimke">Ajánlások a karakterkészítéshez <${Sugo} cim="Ajánlások">Koppints egy elemre: ajánlott (✓). Fajnál, háttérnél, osztálynál és specializációnál még egy koppintás: ebben a keretben nem elérhető (✗). A karakterkészítő csak jelzi, nem tiltja.<//></p>
      <div className="verem">${KR.AJANLAS_KATEGORIAK.map((kat) => html`<${AjanlasKategoria} key=${kat.kulcs} kat=${kat} k=${k} setK=${setK} lapok=${lapok}/>`)}</div>
    </div>
    <${K.TextField} label="Tanács a játékosoknak" multiline=${true} rows=${2} value=${k.ajanlasok.jegyzet} onChange=${(e) => allit('ajanlasok.jegyzet', e.target.value)}
      hint="A karakterkészítőben az ajánlások mellett látszik."/>
  <//>`;
}

// ---- Választható szabályok és mutatványkiegészítések ----
function SzabalyokLepes({ k, allit, kampany, dm, api, uzen }) {
  const [b, setB] = useState(kampany.beallitasok || {});
  const m = b.mutatvanyok || {};
  const beallit = (kulcs, ertek) => {
    const valtozas = beallitasValtozas(b, kulcs, ertek);
    const regi = b;
    setB((x) => ({ ...x, ...valtozas }));
    api.hivas('campaign.update', { id: kampany.id, beallitasok: valtozas })
      .then((v) => { if (v && v.kampany) dm.kampanyFrissit(v.kampany); })
      .catch((e) => { setB(regi); uzen('A beállítás nem mentődött: ' + e.message, 'danger'); });
  };
  const ertek = (s) => (s.beallitas ? m[s.beallitas.slice(12)] === true : k.szabalyok[s.kulcs]);
  const valt = (s, x) => (s.beallitas ? beallit(s.beallitas, x) : allit('szabalyok.' + s.kulcs, x));
  return html`<${Lepes} lepes=${KR.LEPESEK[8]}>
    <fieldset className="mezocsoport">
      <legend className="ka-field__label">Választható szabályok</legend>
      ${KR.VALASZTHATO_SZABALYOK.map((s) => html`<${Jelolo} key=${s.kulcs} checked=${!!ertek(s)} onChange=${(x) => valt(s, x)}>
        ${s.nev} <span className="halvany">(${s.en}, ${s.oldal}. oldal)</span>${s.beallitas ? html` <${K.Badge} tone="accent">az app kezeli<//>` : null}<//>`)}
      <p className="ka-field__msg">Az „az app kezeli” jelölésűek azonnal a kampány beállításaiba kerülnek (ugyanaz, mint a kampány Próbák és dobások beállításánál). A többi most emlékeztető.</p>
    </fieldset>
    <div className="verem">
      ${KR.MUTATVANY_KIEGESZITESEK.map((x) => html`<div key=${x.kulcs}>
        ${x.beallitas ? html`<${Jelolo} checked=${m.isteni === true} onChange=${(v) => beallit(x.beallitas, v)}>Isteni mutatványok használata ebben a kampányban<//>` : null}
        <${K.TextField} label=${x.nev + ' (' + x.en + ')'} multiline=${true} rows=${2} value=${k.mutatvany_kiegeszitesek[x.kulcs]}
          onChange=${(e) => allit('mutatvany_kiegeszitesek.' + x.kulcs, e.target.value)}/>
      </div>`)}
    </div>
  <//>`;
}
