// Kampányjátszó 6.3: a kampány jegyzetfüzete. A játékos kampánynézetének Jegyzetek fülén (telefonon gyors jegyzettel),
// a DM kampányoldalán panelként, az anyag megnyitójában és az Ismeretek lapjain a kapcsolódó jegyzetekkel.
// Saját jegyzet: csak az írója látja (a DM sem). Csapatjegyzet: a kampány minden tagja látja és szerkeszti.
// Mentés optimistán: a képernyő azonnal változik, a szinkronréteg sorba állítja (kiesés alatt is), ütközéskor
// háromutas összefésülés, és ha az sem megy, kérdez.
import { html, K, useApp, useState, useEffect, useRef, useMemo, Ikon, Parbeszed, Valaszto, idopont, tarOlvas, tarIr, gyorsKulcs } from './kozos.js';
import * as J from '../kampany/jegyzetfuzet.js';
import * as A from '../kampany/anyag.js';

// ---------------- Állapot: szerver + helyi (optimista) változatok ----------------

export function useJegyzetfuzet(allapot) {
  const { sync, uzen, felhasznalo } = useApp();
  const [helyi, setHelyi] = useState(() => new Map());
  const [utkozes, setUtkozes] = useState(null);
  const helyiRef = useRef(helyi);
  helyiRef.current = helyi;
  const szerver = allapot.jegyzetek || [];
  const szerverRef = useRef(szerver);
  szerverRef.current = szerver;
  const sorszam = useRef({});

  useEffect(() => {
    const ki = J.utolertHelyiek(szerver, helyiRef.current);
    if (!ki.length) return;
    setHelyi((h) => { const n = new Map(h); ki.forEach((id) => { const e = n.get(id); if (e && !e.fuggo) n.delete(id); }); return n; });
  }, [allapot]);

  const beallit = (id, e) => setHelyi((h) => { const n = new Map(h); if (e) n.set(id, e); else n.delete(id); return n; });
  const alapja = (id) => { const e = helyiRef.current.get(id); return e ? e.alap : szerverRef.current.find((x) => x.id === id) || null; };
  const lista = useMemo(() => J.osszefesul(szerver, helyi), [allapot, helyi]);

  const kuld = (id, jegyzet, alap, hivas, hibaSzoveg) => {
    const n = (sorszam.current[id] || 0) + 1;
    sorszam.current[id] = n;
    const elozo = helyiRef.current.get(id) || null;
    beallit(id, { jegyzet, fuggo: true, alap });
    return sync.push(hivas).then((v) => {
      if (sorszam.current[id] === n) beallit(id, { jegyzet: v.jegyzet, fuggo: false, alap: v.jegyzet });
      else setHelyi((h) => { const e = h.get(id); if (!e) return h; const m = new Map(h); m.set(id, { ...e, alap: v.jegyzet }); return m; });
    }).catch((e) => {
      if (sorszam.current[id] !== n) return; // egy későbbi mentés úgyis eldönti
      const aktualis = e.kod === 'utkozes' && e.valasz && e.valasz.aktualis;
      if (aktualis && hivas.action === 'note.save') {
        const r = J.haromUtas(alap, jegyzet, aktualis);
        if (!r.utkozo.length) {
          kuld(id, { ...r.jegyzet, modositva: new Date().toISOString(), modositotta: felhasznalo.nev }, aktualis,
            { action: 'note.save', adat: J.mentendo(r.jegyzet) });
          uzen('A jegyzetet közben más is módosította: a két változatot összefésültem.');
        } else {
          beallit(id, { jegyzet, fuggo: false, alap: aktualis });
          setUtkozes({ enyem: jegyzet, ovek: aktualis, javaslat: r.jegyzet });
        }
        return;
      }
      beallit(id, elozo && !elozo.fuggo ? elozo : null);
      uzen(hibaSzoveg + (e.message ? ': ' + e.message : '.'), 'danger');
    });
  };

  // alap: a változat, amelyből a módosítás kiindult (a szerkesztő megnyitásakor látott jegyzet); ütközéskor ehhez
  // képest fésül. Ha nincs megadva, a helyi vagy a szerver szerinti utolsó ismert változat.
  const ment = (j, alap) => {
    if (J.uresE(j)) return Promise.resolve();
    const jegyzet = { ...j, cimkek: J.cimkekSzovegbol(j.cimkek), modositva: new Date().toISOString(), modositotta: felhasznalo.nev };
    return kuld(j.id, jegyzet, alap || alapja(j.id), { action: 'note.save', adat: J.mentendo(jegyzet) }, 'A jegyzet nem mentődött');
  };
  const torol = (j, aktiv = false) => kuld(j.id, { ...j, aktiv }, alapja(j.id), { action: 'note.archive', adat: { id: j.id, aktiv } },
    aktiv ? 'A jegyzet nem állt vissza' : 'A jegyzet nem törlődött');

  // ütközés feloldása: 'osszefesult' (a javaslat, vitás részeknél a saját), 'ovek', 'mindketto'
  const felold = (mod) => {
    const u = utkozes;
    setUtkozes(null);
    if (!u) return;
    if (mod === 'ovek') { beallit(u.ovek.id, { jegyzet: u.ovek, fuggo: false, alap: u.ovek }); return; }
    const j = mod === 'mindketto' ? J.egymasAla(u.enyem, u.ovek) : u.javaslat;
    ment({ ...j, verzio: u.ovek.verzio }, u.ovek);
  };

  return { lista, ment, torol, utkozes, felold };
}

// ---------------- Segédek a felülethez ----------------

const sajatKarakterek = (allapot) => (allapot.karakterek || []).filter((c) => c.irhato);

function useAlapLathatosag(kampanyId) {
  const { felhasznalo } = useApp();
  const kulcs = gyorsKulcs(felhasznalo.id, 'jegyzet.lathatosag.' + kampanyId);
  const [l, setL] = useState(() => tarOlvas(kulcs, 'sajat'));
  return [l, (x) => { setL(x); tarIr(kulcs, x); }];
}

function ujJegyzet(allapot, felhasznalo, x) {
  const sajat = sajatKarakterek(allapot);
  return J.ujJegyzet({
    kampanyId: allapot.kampany.id, szerzoId: felhasznalo.id, szerzoNev: felhasznalo.nev,
    karakterId: felhasznalo.szerep !== 'dm' && sajat.length === 1 ? sajat[0].id : '', ...x
  });
}

function LathatosagKapcsolo({ ertek, onValt, disabled }) {
  return html`<div className="kapcsolo jegyzet__lathatosag" role="group" aria-label="Ki látja">
    ${Object.entries(J.LATHATOSAGOK).map(([v, n]) => html`<button key=${v} type="button" aria-pressed=${ertek === v} disabled=${disabled}
      onClick=${() => onValt(v)}>${n}</button>`)}
  </div>`;
}

const lathatosagSugo = (l, dm) => (l === 'csapat' ? 'A kampány minden tagja látja és szerkesztheti, a DM is.'
  : dm ? 'Csak te látod.' : 'Csak te látod, a DM sem.');

// ---------------- Szerkesztő ----------------

export function JegyzetSzerkeszto({ j, allapot, onMent, onMegse, onTorol, ablakban = false }) {
  const { felhasznalo } = useApp();
  const [alap] = useState(j); // amiből a szerkesztés indult (közben érkező változás nem írja felül a piszkozatot)
  const [v, setV] = useState(() => ({ ...j, cimkek: J.cimkekSzovegge(j.cimkek) }));
  const set = (x) => setV((y) => ({ ...y, ...x }));
  const dm = felhasznalo.szerep === 'dm';
  const sajatE = !j.szerzo_id || j.szerzo_id === felhasznalo.id;
  const karakterek = dm ? [] : sajatKarakterek(allapot);
  const opciok = J.kapcsolatOpciok(allapot.megosztasok, allapot.alanyok, dm ? A.alanyNevDm : null);
  const ures = J.uresE(v);
  const ment = () => onMent({ ...v, cimkek: J.cimkekSzovegbol(v.cimkek) }, alap);
  const gombok = html`
    ${onTorol ? html`<${K.Button} size=${ablakban ? 'md' : 'sm'} variant="quiet" onClick=${onTorol}>Törlés<//>` : null}
    <${K.Button} size=${ablakban ? 'md' : 'sm'} variant="quiet" onClick=${onMegse}>Mégse<//>
    <${K.Button} size=${ablakban ? 'md' : 'sm'} variant="primary" disabled=${ures} onClick=${ment}>Mentés<//>`;
  return html`<div className="verem verem--kicsi jegyzetszerk" onKeyDown=${(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && !ures) ment(); }}>
    <${K.TextField} label="Cím (nem kötelező)" value=${v.cim} onChange=${(e) => set({ cim: e.target.value })}/>
    <${K.TextField} label="Jegyzet" multiline=${true} rows=${7} value=${v.szoveg} onChange=${(e) => set({ szoveg: e.target.value })}/>
    <div>
      <p className="cimke">Ki látja</p>
      <${LathatosagKapcsolo} ertek=${v.lathatosag} onValt=${(x) => set({ lathatosag: x })} disabled=${!sajatE}/>
      <p className="sugo kicsi">${sajatE ? lathatosagSugo(v.lathatosag, dm) : 'A láthatóságot csak az írója változtathatja.'}</p>
    </div>
    <div className="urlap-racs">
      <${Valaszto} label="Kapcsolódik" value=${v.kapcsolodik || ''} onChange=${(x) => set({ kapcsolodik: x })} ures="semmihez"
        opciok=${opciok}/>
      <${K.TextField} label="Címkék" hint="Vesszővel elválasztva, például: teendő, gyanú" value=${v.cimkek} onChange=${(e) => set({ cimkek: e.target.value })}/>
      ${karakterek.length > 1 || (karakterek.length && v.karakter_id !== karakterek[0].id) ? html`<${Valaszto} label="Kinek a nevében"
        value=${v.karakter_id || ''} onChange=${(x) => set({ karakter_id: x })} ures="nincs megadva"
        opciok=${karakterek.map((c) => ({ value: c.id, label: c.nev }))}/>` : null}
    </div>
    ${ablakban ? null : html`<div className="gombsor gombsor--szoros">${gombok}</div>`}
    ${ablakban ? html`<div className="gombsor jegyzetszerk__lab">${gombok}</div>` : null}
  </div>`;
}

// Új vagy meglévő jegyzet párbeszédablakban (az anyag megnyitójából, az Ismeretek lapjáról, a DM paneljéből).
export function JegyzetAblak({ j, allapot, fuzet, onBezar }) {
  const uj = !Number(j.verzio) && !fuzet.lista.some((x) => x.id === j.id);
  return html`<${Parbeszed} cim=${uj ? 'Új jegyzet' : 'Jegyzet'} onBezar=${onBezar}>
    <${JegyzetSzerkeszto} j=${j} allapot=${allapot} ablakban=${true} onMegse=${onBezar}
      onMent=${(x, alap) => { fuzet.ment(x, alap); onBezar(); }} onTorol=${uj ? null : () => { fuzet.torol(j); onBezar(); }}/>
  <//>`;
}

// ---------------- Kártya ----------------

const HOSSZU = 420;

function JegyzetKartya({ j, allapot, onSzerk, onRogzit, onCimke, onAnyag, kompakt = false, rejtettKapcsolat = '' }) {
  const { felhasznalo } = useApp();
  const [teljes, setTeljes] = useState(false);
  const k = j.kapcsolodik === rejtettKapcsolat ? null : J.kapcsolat(j, allapot.megosztasok, allapot.alanyok);
  const hosszu = String(j.szoveg || '').length > HOSSZU;
  const szoveg = hosszu && !teljes ? String(j.szoveg).slice(0, HOSSZU).replace(/\s+\S*$/, '') + '…' : j.szoveg;
  const masModositotta = j.modositotta && j.szerzo_nev && j.modositotta !== j.szerzo_nev;
  return html`<li className=${'jegyzet' + (j.rogzitett ? ' jegyzet--rogzitett' : '') + (j.lathatosag === 'csapat' ? ' jegyzet--csapat' : '')}>
    <div className="jegyzet__test">
      <div className="jegyzet__fej">
        ${j.cim ? html`<p className="jegyzet__cim">${j.cim}</p>` : null}
        <span className="cimkek jegyzet__jelek">
          ${j.lathatosag === 'csapat' ? html`<${K.Badge}>csapat<//>` : html`<${K.Badge} tone="accent">csak te látod<//>`}
        </span>
      </div>
      ${k ? html`<p className="jegyzet__kapcsolat kicsi">${k.tipus === 'anyag' && onAnyag
        ? html`<button type="button" className="szoveggomb" onClick=${() => onAnyag(k.m)}>${'→ ' + k.nev}</button>`
        : html`<span>${'→ ' + k.nev}</span>`}</p>` : null}
      ${szoveg ? html`<p className=${'jegyzet__szoveg' + (kompakt ? ' jegyzet__szoveg--kompakt' : '')}>${szoveg}</p>` : null}
      ${hosszu ? html`<button type="button" className="szoveggomb kicsi" onClick=${() => setTeljes(!teljes)}>${teljes ? 'Kevesebb' : 'Teljes szöveg'}</button>` : null}
      ${(j.cimkek || []).length ? html`<div className="cimkek">${j.cimkek.map((c) => onCimke
        ? html`<button key=${c} type="button" className="csip csip--kicsi" onClick=${() => onCimke(c)}>${c}</button>`
        : html`<span key=${c} className="csip csip--kicsi csip--statikus">${c}</span>`)}</div>` : null}
      <div className="sorban sorban--kozep jegyzet__lab">
        <span className="halvany kicsi">${J.szerzoSzoveg(j, allapot.karakterek, felhasznalo.id)} · ${idopont(j.modositva || j.letrehozva)}${masModositotta ? ' · módosította: ' + j.modositotta : ''}</span>
        <span className="gombsor gombsor--szoros">
          ${onRogzit ? html`<button type="button" className="csip csip--kicsi" aria-pressed=${!!j.rogzitett} onClick=${onRogzit}>${j.rogzitett ? '✓ Rögzítve' : 'Rögzítés'}</button>` : null}
          <button type="button" className="szoveggomb" onClick=${onSzerk}>Szerkesztés</button>
        </span>
      </div>
    </div>
  </li>`;
}

// ---------------- A jegyzetfüzet (Jegyzetek fül, DM panel) ----------------

function GyorsJegyzet({ allapot, fuzet }) {
  const { felhasznalo } = useApp();
  const [szoveg, setSzoveg] = useState('');
  const [ablak, setAblak] = useState(null);
  const [lathatosag, setLathatosag] = useAlapLathatosag(allapot.kampany.id);
  const dm = felhasznalo.szerep === 'dm';
  const uj = () => ujJegyzet(allapot, felhasznalo, { lathatosag, szoveg });
  const ment = () => {
    if (!szoveg.trim()) return;
    fuzet.ment(uj());
    setSzoveg('');
  };
  return html`<div className="verem verem--kicsi gyorsjegyzet">
    <${K.TextField} label="Gyors jegyzet" multiline=${true} rows=${3} placeholder="Amit most meg akarsz jegyezni…" value=${szoveg}
      onChange=${(e) => setSzoveg(e.target.value)} onKeyDown=${(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) ment(); }}/>
    <div className="sorban sorban--kozep gyorsjegyzet__sor">
      <${LathatosagKapcsolo} ertek=${lathatosag} onValt=${setLathatosag}/>
      <span className="gombsor gombsor--szoros">
        <${K.Button} size="md" variant="quiet" onClick=${() => setAblak(uj())}>Részletek…<//>
        <${K.Button} size="md" variant="primary" disabled=${!szoveg.trim()} onClick=${ment} icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>Mentés<//>
      </span>
    </div>
    <p className="sugo kicsi">${lathatosagSugo(lathatosag, dm)}</p>
    ${ablak ? html`<${Parbeszed} cim="Új jegyzet" onBezar=${() => setAblak(null)}>
      <${JegyzetSzerkeszto} j=${ablak} allapot=${allapot} ablakban=${true} onMegse=${() => setAblak(null)}
        onMent=${(x, alap) => { fuzet.ment(x, alap); setAblak(null); setSzoveg(''); }}/>
    <//>` : null}
  </div>`;
}

export function Jegyzetfuzet({ allapot, fuzet, onAnyag, kompakt = false }) {
  const [nezet, setNezet] = useState('');
  const [kereses, setKereses] = useState('');
  const [cimke, setCimke] = useState('');
  const [szerk, setSzerk] = useState(null);   // a helyben szerkesztett jegyzet azonosítója
  const [torolt, setTorolt] = useState(null);
  const [mind, setMind] = useState(false);
  // a keresés a kapcsolódó anyag vagy alany nevére (anyagnál az alanyáéra) is talál
  const kapcsNev = (j) => {
    const k = J.kapcsolat(j, allapot.megosztasok, allapot.alanyok);
    if (!k) return '';
    const al = k.m && k.m.alany_id ? J.kapcsolat({ kapcsolodik: k.m.alany_id }, [], allapot.alanyok) : null;
    return k.nev + (al ? ' ' + al.nev : '');
  };
  const lista = J.szur(fuzet.lista, { nezet, kereses, cimke }, kapcsNev);
  const cimkek = J.cimkek(fuzet.lista);
  const latszo = kompakt && !mind ? lista.slice(0, 6) : lista;
  const torol = (j) => { fuzet.torol(j); setTorolt(j); setSzerk(null); };
  return html`<div className="verem jegyzetfuzet">
    <${GyorsJegyzet} allapot=${allapot} fuzet=${fuzet}/>
    ${torolt ? html`<div className="sorban sorban--kozep visszavonosor" role="status"><span className="kicsi">Jegyzet törölve${torolt.cim ? ': ' + torolt.cim : ''}.</span>
      <button type="button" className="szoveggomb" onClick=${() => { fuzet.torol(torolt, true); setTorolt(null); }}>Visszavonás</button></div>` : null}
    ${fuzet.lista.length ? html`
      <div className="kapcsolo kapcsolo--teljes" role="group" aria-label="Melyik jegyzetek">
        ${[['', 'Mind'], ['sajat', 'Saját'], ['csapat', 'Csapat']].map(([v, n]) => html`<button key=${v} type="button" aria-pressed=${nezet === v}
          onClick=${() => setNezet(v)}>${n} <span className="jelveny jelveny--halk">${J.darab(fuzet.lista, v)}</span></button>`)}
      </div>
      <div className="jegyzet__kereso">
        <input type="search" className="ka-field__input" placeholder="Keresés a jegyzetekben…" aria-label="Keresés a jegyzetekben"
          value=${kereses} onChange=${(e) => setKereses(e.target.value)}/>
      </div>
      ${cimkek.length ? html`<div className="cimkek" role="group" aria-label="Címkék">${cimkek.map((c) => html`<button key=${c.cimke} type="button"
        className="csip csip--kicsi" aria-pressed=${J.normal(cimke) === J.normal(c.cimke)}
        onClick=${() => setCimke(J.normal(cimke) === J.normal(c.cimke) ? '' : c.cimke)}>${c.cimke} (${c.db})</button>`)}</div>` : null}
      ${lista.length ? html`<ul className="jegyzetlista">${latszo.map((j) => (szerk === j.id
        ? html`<li key=${j.id} className="jegyzet"><${JegyzetSzerkeszto} j=${j} allapot=${allapot}
            onMent=${(x, alap) => { fuzet.ment(x, alap); setSzerk(null); }} onMegse=${() => setSzerk(null)} onTorol=${() => torol(j)}/></li>`
        : html`<${JegyzetKartya} key=${j.id} j=${j} allapot=${allapot} onAnyag=${onAnyag} kompakt=${kompakt}
            onSzerk=${() => { setSzerk(j.id); setTorolt(null); }} onCimke=${(c) => setCimke(c)}
            onRogzit=${() => fuzet.ment({ ...j, rogzitett: !j.rogzitett }, j)}/>`))}</ul>`
        : html`<p className="halvany">Nincs a szűrésnek megfelelő jegyzet.</p>`}
      ${kompakt && lista.length > 6 ? html`<button type="button" className="szoveggomb" onClick=${() => setMind(!mind)}>${mind ? 'Kevesebb' : `Mind a ${lista.length} jegyzet`}</button>` : null}`
    : html`<p className="halvany">Még nincs jegyzet. A sajátodat csak te látod, a csapatjegyzetet mindenki a kampányban (közös napló, „amit eddig tudunk”, teendők).</p>`}
    <${UtkozesAblak} fuzet=${fuzet}/>
  </div>`;
}

// ---------------- Kapcsolódó jegyzetek (anyag megnyitója, Ismeretek) ----------------

// idk: az anyag vagy az alany (és az összekapcsolt alanyok, a csoport anyagai) azonosítói; ujKapcsolodik: amihez az új
// jegyzet kötődik.
export function KapcsolodoJegyzetek({ allapot, fuzet, idk, ujKapcsolodik, cim = 'Jegyzeteitek', gomb = 'Jegyzet ehhez' }) {
  const { felhasznalo } = useApp();
  const [ablak, setAblak] = useState(null);
  const [lathatosag] = useAlapLathatosag(allapot.kampany.id);
  const lista = J.kapcsolodok(fuzet.lista, idk);
  return html`<section className="verem verem--kicsi kapcsolodo-jegyzetek">
    <div className="sorban sorban--kozep kapcsolodo-jegyzetek__fej">
      <h3 className="alcim">${cim}${lista.length ? ` (${lista.length})` : ''}</h3>
      <${K.Button} size="sm" variant="secondary" onClick=${() => setAblak(ujJegyzet(allapot, felhasznalo, { lathatosag, kapcsolodik: ujKapcsolodik }))}
        icon=${html`<${Ikon} nev="plusz" meret=${18}/>`}>${gomb}<//>
    </div>
    ${lista.length ? html`<ul className="jegyzetlista">${lista.map((j) => html`<${JegyzetKartya} key=${j.id} j=${j} allapot=${allapot} kompakt=${true}
      rejtettKapcsolat=${ujKapcsolodik} onSzerk=${() => setAblak(j)}/>`)}</ul>` : null}
    ${ablak ? html`<${JegyzetAblak} j=${ablak} allapot=${allapot} fuzet=${fuzet} onBezar=${() => setAblak(null)}/>` : null}
  </section>`;
}

// ---------------- Ütközés ----------------

export function UtkozesAblak({ fuzet }) {
  const u = fuzet.utkozes;
  if (!u) return null;
  return html`<${Parbeszed} cim="A jegyzetet közben más is módosította" onBezar=${() => fuzet.felold('ovek')} lab=${html`
    <${K.Button} variant="quiet" onClick=${() => fuzet.felold('ovek')}>Az övét tartom<//>
    <${K.Button} variant="secondary" onClick=${() => fuzet.felold('mindketto')}>Mindkettő, egymás alatt<//>
    <${K.Button} variant="primary" onClick=${() => fuzet.felold('osszefesult')}>Az enyém marad<//>`}>
    <div className="verem">
      <p className="szoveg">Ugyanazt a részt ketten írtátok át. Válaszd ki, mi maradjon. Ami csak az egyik változatban módosult, az mindenképp megmarad.</p>
      <div className="utkozes-racs">
        <div><p className="cimke">${(u.ovek.modositotta || 'Más') + ' változata'}</p>
          ${u.ovek.cim ? html`<p className="jegyzet__cim">${u.ovek.cim}</p>` : null}<p className="jegyzet__szoveg">${u.ovek.szoveg}</p></div>
        <div><p className="cimke">A te változatod</p>
          ${u.enyem.cim ? html`<p className="jegyzet__cim">${u.enyem.cim}</p>` : null}<p className="jegyzet__szoveg">${u.enyem.szoveg}</p></div>
      </div>
    </div>
  <//>`;
}

// A Jegyzetek fül jelvénye: mások új csapatjegyzetei a fül legutóbbi megnyitása óta (eszközönként).
export function useJegyzetJelveny(allapot, fuzet, nyitva) {
  const { felhasznalo } = useApp();
  const kulcs = gyorsKulcs(felhasznalo.id, 'jegyzet.latta.' + allapot.kampany.id);
  const [ota, setOta] = useState(() => tarOlvas(kulcs, null));
  useEffect(() => {
    if (!ota) { const most = new Date().toISOString(); setOta(most); tarIr(kulcs, most); }
  }, []);
  useEffect(() => {
    if (!nyitva) return;
    const most = new Date().toISOString();
    setOta(most);
    tarIr(kulcs, most);
  }, [nyitva, fuzet.lista]);
  return nyitva ? 0 : J.ujCsapatjegyzetek(fuzet.lista, ota, felhasznalo.nev);
}
