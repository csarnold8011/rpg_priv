// A DM és a játékos felület közös játékelemei: kampány élő állapota, dobás, dobásnapló, karakterlap.
import { html, K, useApp, useState, useEffect, useMemo, useRef, Uzenet, Valaszto, Jelolo, Ikon, idopont, elojel, SZEREP_NEV } from './kozos.js';
import { megjelenitettNev } from '../szabalyok.js';

// ---- Kampány élő állapota a szinkronrétegen keresztül ----
// Visszaadja: { allapot, hiba, frissit }. Megnyitáskor kapcsolódik, elhagyáskor bont.
export function useKampanyAllapot(kampanyId) {
  const { sync } = useApp();
  const [allapot, setAllapot] = useState(null);
  const [hiba, setHiba] = useState(null);
  useEffect(() => {
    setAllapot(null); setHiba(null);
    const leiratkozas = sync.subscribe((e) => {
      if (e.tipus === 'allapot' && e.allapot.kampany && e.allapot.kampany.id === kampanyId) setAllapot(e.allapot);
    });
    sync.connect(kampanyId).catch((e) => setHiba(e));
    return () => { leiratkozas(); sync.disconnect(); };
  }, [kampanyId]);
  const frissit = () => sync.pull().catch((e) => setHiba(e));
  return { allapot, hiba, frissit };
}

// ---- Kocka ----
export const kocka = () => 1 + Math.floor(Math.random() * 6);
export const dobasOsszeg = (d) => (d.kockak || []).reduce((a, b) => a + Number(b || 0), 0) + (Number(d.modosito) || 0);
export const dupla = (k) => k.length === 3 && (k[0] === k[1] || k[0] === k[2] || k[1] === k[2]);

// Dobásnapló a szerver állapotából és a még fel nem ért (optimista) dobásokból.
// A dobás azonnal megjelenik; a szerver válasza után az állapotfrissítés váltja le.
export function useDobasok(allapot) {
  const { sync, uzen } = useApp();
  const [fuggo, setFuggo] = useState([]);
  const szerverDobasok = (allapot && allapot.dobasok) || [];
  useEffect(() => {
    const megvan = new Set(szerverDobasok.map((d) => d.id));
    setFuggo((f) => f.filter((d) => !megvan.has(d.id)));
  }, [allapot]);
  const osszes = useMemo(() => {
    const megvan = new Set(szerverDobasok.map((d) => d.id));
    return szerverDobasok.concat(fuggo.filter((d) => !megvan.has(d.id))).slice().reverse();
  }, [allapot, fuggo]);

  const naploz = (dobas) => {
    setFuggo((f) => f.concat([{ ...dobas, _fuggo: true }]));
    sync.push({ action: 'roll.log', adat: dobas })
      .then(() => sync.pull().catch(() => {}))
      .catch((e) => {
        setFuggo((f) => f.filter((d) => d.id !== dobas.id));
        uzen('A dobás nem került a naplóba: ' + e.message, 'danger');
      });
  };
  return [osszes, naploz];
}

// Dobás űrlap és eredmény. karakterek: akikért a felhasználó dobhat.
export function DobasPanel({ allapot, naploz, dm, nagy }) {
  const { felhasznalo } = useApp();
  const sajat = (allapot.karakterek || []).filter((c) => c.irhato);
  const [mire, setMire] = useState('');
  const [mod, setMod] = useState('0');
  const [cel, setCel] = useState('');
  const [karakterId, setKarakterId] = useState(sajat.length === 1 && !dm ? sajat[0].id : '');
  const [rejtett, setRejtett] = useState(false);
  const [eredmeny, setEredmeny] = useState(null);
  const [sorszam, setSorszam] = useState(0);

  const dob = () => {
    const kockak = [kocka(), kocka(), kocka()];
    const modosito = parseInt(String(mod).replace('−', '-'), 10) || 0;
    const celertek = cel === '' ? undefined : parseInt(cel, 10);
    const osszeg = kockak[0] + kockak[1] + kockak[2] + modosito;
    const vegeredmeny = celertek === undefined || isNaN(celertek) ? '' : osszeg >= celertek ? 'siker' : 'kudarc';
    const mutatvanypont = dupla(kockak) && vegeredmeny !== 'kudarc' ? kockak[2] : 0;
    const dobas = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random(),
      kampany_id: allapot.kampany.id, karakter_id: karakterId, mire: mire.trim() || 'Próba',
      kockak, modosito, celertek: vegeredmeny ? celertek : undefined, eredmeny: vegeredmeny, mutatvanypont,
      rejtett: dm && rejtett, dobta: felhasznalo.nev, idopont: new Date().toISOString()
    };
    setEredmeny(dobas);
    setSorszam((s) => s + 1);
    naploz(dobas);
  };

  const karakterOpciok = (dm ? allapot.karakterek || [] : sajat).map((c) => ({ value: c.id, label: c.nev }));
  return html`<div className="dobas">
    <div className="urlap-racs">
      <${K.TextField} label="Próba" placeholder="például Észlelés (Keresés)" value=${mire} onChange=${(e) => setMire(e.target.value)}/>
      ${karakterOpciok.length ? html`<${Valaszto} label="Ki dob" value=${karakterId} onChange=${setKarakterId}
        opciok=${karakterOpciok} ures=${dm ? 'A DM (nincs karakter)' : 'Nincs karakter'}/>` : null}
      <${K.TextField} label="Módosító" hint="Tulajdonság és fókusz" inputMode="numeric" value=${mod} onChange=${(e) => setMod(e.target.value)}/>
      <${K.TextField} label="Célérték" hint="Üresen nincs siker vagy kudarc" inputMode="numeric" value=${cel} onChange=${(e) => setCel(e.target.value)}/>
    </div>
    ${dm ? html`<${Jelolo} checked=${rejtett} onChange=${setRejtett}>Rejtett dobás (a játékosok nem látják)<//>` : null}
    <div className="dobas__gomb">
      <${K.Button} variant="primary" size=${nagy ? 'lg' : 'md'} onClick=${dob} icon=${html`<${Ikon} nev="kocka" meret=${20}/>`}>Dobás<//>
    </div>
    ${eredmeny ? html`<div className="dobas__eredmeny friss" key=${sorszam} aria-live="polite">
      <${K.DiceRoll} dice=${eredmeny.kockak} bonus=${eredmeny.modosito}
        target=${eredmeny.eredmeny ? eredmeny.celertek : undefined} label=${eredmeny.mire + (eredmeny.rejtett ? ' (rejtett)' : '')}/>
    </div>` : null}
  </div>`;
}

export function DobasNaplo({ dobasok, karakterek, dm, max = 30 }) {
  const nevek = {};
  (karakterek || []).forEach((c) => { nevek[c.id] = c.nev; });
  if (!dobasok.length) return html`<p className="halvany">Még nincs dobás ebben a kampányban.</p>`;
  return html`<ol className="naplo">
    ${dobasok.slice(0, max).map((d) => {
      const kockak = d.kockak || [];
      return html`<li key=${d.id} className=${'naplo__sor' + (d._fuggo ? ' naplo__sor--fuggo' : '')}>
        <div className="naplo__fej">
          <span className="naplo__ki">${nevek[d.karakter_id] || d.dobta}</span>
          <span className="naplo__mire">${d.mire}</span>
          <span className="naplo__ido">${d._fuggo ? 'küldés…' : idopont(d.idopont)}</span>
        </div>
        <div className="naplo__test">
          <span className="mini-kockak" aria-label=${'Kockák: ' + kockak.join(', ')}>
            ${kockak.map((k, i) => html`<span key=${i} className=${'mini-kocka' + (i === 2 ? ' mini-kocka--sarkany' : '')}>${k}</span>`)}
          </span>
          ${Number(d.modosito) ? html`<span className="naplo__mod">${elojel(Number(d.modosito))}</span>` : null}
          <span className="naplo__osszeg">= ${dobasOsszeg(d)}</span>
          ${d.eredmeny === 'siker' ? html`<${K.Badge} tone="success">✓ Siker<//>` : null}
          ${d.eredmeny === 'kudarc' ? html`<${K.Badge} tone="danger">✗ Kudarc<//>` : null}
          ${Number(d.mutatvanypont) ? html`<${K.Badge} tone="dragon">${d.mutatvanypont} mutatványpont<//>` : null}
          ${dm && d.rejtett ? html`<${K.Badge}>Rejtett<//>` : null}
        </div>
      </li>`;
    })}
  </ol>`;
}

// ---- Karakterlap (váz) ----
// Ideiglenes adatszerkezet, amíg a karakterkészítő (1. lépés) véglegesíti:
//   adat.tulajdonsagok: { tul_accuracy: 2, ... }   adat.fokuszok: ['fok_...']
//   adat.egeszseg: { aktualis, max }   adat.magiapont: { aktualis, max }   adat.vedekezes, adat.sebesseg, adat.pancelertek
export const TULAJDONSAGOK = [
  ['tul_accuracy', 'Pontosság'], ['tul_communication', 'Kommunikáció'], ['tul_constitution', 'Szívósság'],
  ['tul_dexterity', 'Ügyesség'], ['tul_fighting', 'Harc'], ['tul_intelligence', 'Intelligencia'],
  ['tul_perception', 'Észlelés'], ['tul_strength', 'Erő'], ['tul_willpower', 'Akaraterő']
];

function szabalyElem(szabalyok, lap, id) {
  if (!szabalyok || !id) return null;
  return (szabalyok.lapok[lap] || []).find((e) => e.id === id) || null;
}
// Faj, osztály: azonosító (faj_dwarf) vagy szabad szöveg is lehet.
export function elemNev(szabalyok, lap, ertek) {
  const e = szabalyElem(szabalyok, lap, ertek);
  return e ? e.nev_hu : (ertek || '');
}

export function KarakterFejlec({ karakter, jatekosNev }) {
  const { szabalyok: sz } = useApp();
  const szabalyok = sz.adat;
  const faj = elemNev(szabalyok, 'Fajok', karakter.faj);
  const osztaly = elemNev(szabalyok, 'Osztályok', karakter.osztaly);
  return html`<div className="cimkek">
    ${faj ? html`<${K.Badge}>${faj}<//>` : null}
    ${osztaly ? html`<${K.Badge}>${osztaly}${karakter.szint ? ', ' + karakter.szint + '. szint' : ''}<//>` : null}
    ${jatekosNev !== undefined ? html`<span className="halvany kicsi">${jatekosNev ? 'Játékos: ' + jatekosNev : 'Játékos nélkül'}</span>` : null}
  </div>`;
}

export function KarakterLap({ karakter, oszlopok }) {
  const szabalyok = useApp().szabalyok.adat;
  const adat = karakter.adat || {};
  const tul = adat.tulajdonsagok || {};
  const kitoltve = Object.keys(tul).length > 0;
  const fokuszok = (adat.fokuszok || []).map((id) => szabalyElem(szabalyok, 'Fókuszok', id)).filter(Boolean);
  const kepessegek = TULAJDONSAGOK.map(([id, nev]) => {
    const sz = szabalyElem(szabalyok, 'Tulajdonságok', id);
    return {
      name: sz ? sz.nev_hu : nev,
      value: Number(tul[id]) || 0,
      focus: fokuszok.filter((f) => f.tulajdonsag === id).map((f) => f.nev_hu)
    };
  });
  const eg = adat.egeszseg || {}, mp = adat.magiapont || {};
  const nincs = html`<span className="halvany">nincs</span>`;
  return html`<div className="karakterlap">
    <${K.Panel} title="Tulajdonságok">
      ${kitoltve ? null : html`<${Uzenet} tonus="warning">A tulajdonságokat a karakterkészítő tölti ki (következő fejlesztési lépés).<//>`}
      <${K.AbilityGrid} abilities=${kepessegek} columns=${oszlopok || 3}/>
    <//>
    <${K.Panel} title="Erőforrások">
      <div className="verem">
        ${eg.max ? html`<${K.ResourceBar} kind="health" value=${Number(eg.aktualis) || 0} max=${Number(eg.max)}/>`
          : html`<p className="halvany">Az Egészség még nincs megadva.</p>`}
        ${mp.max ? html`<${K.ResourceBar} kind="magic" value=${Number(mp.aktualis) || 0} max=${Number(mp.max)}/>` : null}
        <dl className="ertekek">
          <div><dt>Védekezés</dt><dd>${adat.vedekezes ?? nincs}</dd></div>
          <div><dt>Sebesség</dt><dd>${adat.sebesseg ?? nincs}</dd></div>
          <div><dt>Páncélérték</dt><dd>${adat.pancelertek ?? nincs}</dd></div>
        </dl>
      </div>
    <//>
  </div>`;
}

// Kampány fejléce: cím, saját szerep, állapot.
export function KampanyCimkek({ kampany }) {
  return html`<div className="cimkek">
    <${K.Badge} tone="accent">${SZEREP_NEV[kampany.sajat_szerep] || kampany.sajat_szerep}<//>
    ${kampany.allapot ? html`<${K.Badge}>${kampany.allapot}<//>` : null}
  </div>`;
}

export { megjelenitettNev };
