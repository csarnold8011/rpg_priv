// Dobásnapló: a kampány naplója (szűrőkkel) és a karakter oldalának Dobások szakasza.
// Sor: bélyegkép, név, mire, kockák, összeg, eredmény, Mutatványpont, elköltött mutatványok, jelek (beírt, újradobás,
// Rejtett, Felfedve). Koppintásra lenyílik: összetevők, Célérték, siker foka, plusz pontok, próbakérés.
// DM: rejtett dobás felfedése. Saját dobás: a mutatványok utólagos rögzítése.
// A sorok adatai és a szűrés: web/js/jatek/naplo.js (tiszta függvények, teszt: tools/teszt/naplo.mjs).
import { html, K, useApp, useState, useEffect, useMemo, Parbeszed, idopont, elojel } from './kozos.js';
import { KarakterKep } from './kepek.js';
import { MutatvanyValaszto } from './mutatvanyvalaszto.js';
import { karakterSzamol } from '../karakter/szamol.js';
import { atallit } from '../karakter/adat.js';
import * as N from '../jatek/naplo.js';

// Felfedés és utólagos mutatványrögzítés optimistán: a képernyő azonnal változik, a mentés a háttérben megy.
// A felülírás addig él, amíg a szerver ugyanazt vissza nem adja; hiba esetén visszaáll és üzen.
function useNaploMuveletek(dobasok) {
  const { sync, uzen } = useApp();
  const [felul, setFelul] = useState({});
  useEffect(() => { setFelul((f) => (Object.keys(f).length ? N.felulirasTisztit(dobasok, f) : f)); }, [dobasok]);
  const kuld = (id, valtozas, adat, hibaSzoveg) => {
    setFelul((f) => ({ ...f, [id]: { ...(f[id] || {}), ...valtozas } }));
    sync.push({ action: 'roll.update', adat: { id, ...adat } })
      .then(() => sync.pull && sync.pull().catch(() => {}))
      .catch((e) => {
        setFelul((f) => { const u = { ...f }; delete u[id]; return u; });
        uzen(hibaSzoveg + e.message, 'danger');
      });
  };
  const felfed = (id) => kuld(id, { rejtett: false, felfedve: true }, { felfedve: true }, 'A felfedés nem sikerült: ');
  const mutatvanyRogzit = (id, v) => kuld(id, { reszletek: { mutatvanyok: v.mutatvanyok, mp_plusz: v.plusz } },
    { mutatvanyok: v.mutatvanyok, plusz: v.plusz }, 'A mutatványok nem kerültek a naplóba: ');
  return { lista: useMemo(() => N.felulirasAlkalmaz(dobasok, felul), [dobasok, felul]), felfed, mutatvanyRogzit };
}

// dobasok: újabbak elöl. ctx: lásd N.naploSor. mutatvanyKornyezet(dobas): { lap, forrasok, beallitas, valasztasok, onValasztas } vagy null.
export function DobasLista({ dobasok, ctx, max = 30, szurok = false, ures, mutatvanyKornyezet }) {
  const { lista, felfed, mutatvanyRogzit } = useNaploMuveletek(dobasok);
  const [szuro, setSzuro] = useState('mindenki');
  const [nyitott, setNyitott] = useState(null);
  const [rogzites, setRogzites] = useState(null); // a dobás, amelyhez a mutatványválasztó nyitva van
  const opciok = szurok ? N.szuroOpciok(lista, ctx) : [];
  const aktiv = szurok ? N.szuroErvenyes(szuro, opciok) : 'mindenki';
  const lathato = N.naploSzur(lista, aktiv, ctx).slice(0, max);
  const kornyezet = rogzites && mutatvanyKornyezet ? mutatvanyKornyezet(rogzites) : null;

  return html`<div className="verem">
    ${opciok.length > 2 ? html`<div className="csipek naplo__szurok" role="group" aria-label="Kinek a dobásai">
      ${opciok.map((o) => html`<button key=${o.value} type="button" className="csip csip--kicsi" aria-pressed=${aktiv === o.value}
        onClick=${() => setSzuro(o.value)}>${o.label}</button>`)}
    </div>` : null}
    ${lathato.length ? html`<ol className="naplo">
      ${lathato.map((d) => html`<${NaploSor} key=${d.id} d=${d} sor=${N.naploSor(d, ctx)} nyitva=${nyitott === d.id}
        onNyit=${() => setNyitott((x) => (x === d.id ? null : d.id))} onFelfed=${() => felfed(d.id)}
        rogzitheto=${!!(mutatvanyKornyezet && mutatvanyKornyezet(d))} onRogzit=${() => setRogzites(d)}/>`)}
    </ol>` : html`<p className="halvany">${aktiv === 'mindenki' ? (ures || 'Még nincs dobás.') : 'Ebben a szűrésben nincs dobás.'}</p>`}
    ${kornyezet ? html`<${Parbeszed} cim=${'Mutatványok: ' + rogzites.mire} onBezar=${() => setRogzites(null)}>
      <${MutatvanyValaszto} lapok=${kornyezet.lapok} lap=${kornyezet.lap} pont=${Number(rogzites.mutatvanypont) || 0}
        kontextus=${N.mutatvanyKontextus(rogzites)} forrasok=${kornyezet.forrasok} beallitas=${kornyezet.beallitas}
        valasztasok=${kornyezet.valasztasok || {}} onValasztas=${kornyezet.onValasztas}
        onKesz=${(v) => { mutatvanyRogzit(rogzites.id, v); setRogzites(null); }} onMegse=${() => setRogzites(null)}/>
    <//>` : null}
  </div>`;
}

function NaploSor({ d, sor, nyitva, onNyit, onFelfed, rogzitheto, onRogzit }) {
  const lenyithato = N.vanReszlet(sor);
  const r = sor.reszletek;
  const fej = html`
    <span className="naplo__fej">
      <${KarakterKep} kep=${sor.kep} nev=${sor.nev}/>
      <span className="naplo__nevek">
        <span className="naplo__ki">${sor.nev}</span>
        <span className="naplo__mire">${sor.mire}</span>
      </span>
      <span className="naplo__ido">${sor.fuggo ? 'küldés…' : idopont(sor.idopont)}</span>
    </span>
    <span className="naplo__test">
      ${sor.kockak.length ? html`<span className="mini-kockak" aria-label=${'Kockák: ' + sor.kockak.join(', ')}>
        ${sor.kockak.map((k, i) => html`<span key=${i} className=${'mini-kocka' + (i === 2 ? ' mini-kocka--sarkany' : '')}>${k}</span>`)}
      </span>` : null}
      ${sor.modosito ? html`<span className="naplo__mod">${elojel(sor.modosito)}</span>` : null}
      <span className="naplo__osszeg">${sor.kockak.length ? '= ' : ''}${sor.osszeg}</span>
      ${sor.eredmeny === 'siker' ? html`<${K.Badge} tone="success">✓ Siker<//>` : null}
      ${sor.eredmeny === 'kudarc' ? html`<${K.Badge} tone="danger">✗ Kudarc<//>` : null}
      ${sor.mutatvanypont ? html`<${K.Badge} tone="dragon">${sor.mutatvanypont} Mutatványpont<//>` : null}
      ${sor.rejtett ? html`<${K.Badge}>Rejtett<//>` : null}
      ${sor.felfedve ? html`<${K.Badge} tone="accent">Felfedve<//>` : null}
      ${sor.kezi ? html`<span className="kezijel">beírt</span>` : null}
      ${sor.ujradobas ? html`<span className="kezijel">újradobás</span>` : null}
      ${lenyithato ? html`<span className="naplo__nyil" aria-hidden="true">▾</span>` : null}
    </span>`;
  return html`<li className=${'naplo__sor' + (sor.fuggo ? ' naplo__sor--fuggo' : '') + (nyitva ? ' naplo__sor--nyitva' : '')}>
    ${lenyithato
      ? html`<button type="button" className="naplo__gomb" aria-expanded=${nyitva} onClick=${onNyit}>${fej}</button>`
      : html`<div className="naplo__gomb naplo__gomb--statikus">${fej}</div>`}
    ${sor.mutatvanyok ? html`<p className="naplo__mutatvanyok kicsi">${sor.mutatvanyok}${r && r.plusz.length ? ' · ' + r.plusz.map((p) => `+${p.ertek} ${p.eredet}`).join(', ') : ''}</p>` : null}
    ${nyitva && lenyithato ? html`<dl className="naplo__reszletek kicsi">
      ${r.probaCim ? html`<div><dt>Próbakérés</dt><dd>${r.probaCim}</dd></div>` : null}
      ${r.osszetevok.length ? html`<div><dt>Bónusz</dt><dd>${r.osszetevok.map((o, i) => html`<span key=${i}>${i ? ', ' : ''}${elojel(o.ertek)} ${o.eredet}</span>`)}</dd></div>` : null}
      ${r.celertek !== null ? html`<div><dt>Célérték</dt><dd>${r.celertek}${r.celertekNev ? ` (${r.celertekNev})` : ''}</dd></div>` : null}
      ${r.celertekRejtett ? html`<div><dt>Célérték</dt><dd>a DM tudja</dd></div>` : null}
      ${r.fok ? html`<div><dt>Siker foka</dt><dd>${r.fok}</dd></div>` : null}
      ${r.plusz.length ? html`<div><dt>Plusz pont</dt><dd>${r.plusz.map((p) => `+${p.ertek} ${p.eredet}`).join(', ')}</dd></div>` : null}
    </dl>` : null}
    ${sor.felfedheto || (sor.mutatvanyRogzitheto && rogzitheto) ? html`<div className="gombsor naplo__muveletek">
      ${sor.felfedheto ? html`<${K.Button} size="sm" variant="secondary" onClick=${onFelfed}>Felfedem<//>` : null}
      ${sor.mutatvanyRogzitheto && rogzitheto ? html`<${K.Button} size="sm" variant="secondary" onClick=${onRogzit}>Mutatványok rögzítése<//>` : null}
    </div>` : null}
  </li>`;
}

// ---- A kampány naplója (DM és játékos kampánynézete) ----
export function KampanyNaplo({ allapot, dobasok }) {
  const { felhasznalo, szabalyok } = useApp();
  const k = allapot.kampany;
  const lapok = szabalyok && szabalyok.adat && szabalyok.adat.lapok;
  const ctx = {
    felhasznalo, szerep: k.sajat_szerep, karakterek: allapot.karakterek || [], probak: allapot.probak || [],
    reszletekLathatok: !(k.beallitasok && k.beallitasok.dobas_reszletek_lathatok === false)
  };
  const lapTar = useMemo(() => ({}), [allapot, lapok]);
  const kornyezet = (d) => {
    const kar = (allapot.karakterek || []).find((c) => c.id === d.karakter_id);
    if (!lapok || !kar || !kar.irhato || !kar.adat) return null;
    if (!lapTar[kar.id]) lapTar[kar.id] = karakterSzamol(atallit(kar.adat), lapok);
    const forrasok = (k.aktiv_forrasok && k.aktiv_forrasok.length ? k.aktiv_forrasok : kar.adat.keszites && kar.adat.keszites.forrasok) || [];
    return { lapok, lap: lapTar[kar.id], forrasok, beallitas: k.beallitasok,
      valasztasok: (kar.adat.jatek && kar.adat.jatek.mutatvany_valasztasok) || {} };
  };
  return html`<${DobasLista} dobasok=${dobasok} ctx=${ctx} szurok=${true} ures="Még nincs dobás ebben a kampányban." mutatvanyKornyezet=${kornyezet}/>`;
}

// ---- A karakter dobásai (a karakterlap Napló részében), a kampány nélküliekkel együtt ----
// kornyezet: { lapok, lap, forrasok, beallitas, valasztasok, onValasztas } a mutatványok utólagos rögzítéséhez (ha szerkesztheti).
export function KarakterDobasai({ karakter, adat, dm, kampany, kornyezet }) {
  const { api, felhasznalo } = useApp();
  const [lista, setLista] = useState(null);
  const [tobb, setTobb] = useState(false);
  const [tolt, setTolt] = useState(false);
  const [hiba, setHiba] = useState(null);
  const DB = 20;
  const lekeres = async (elotte) => {
    setTolt(true); setHiba(null);
    try {
      const v = await api.hivas('roll.list', { karakter_id: karakter.id, elotte, db: DB });
      setLista((l) => (elotte ? N.lapozasFuz(l, v.dobasok) : v.dobasok));
      setTobb(!!v.tobb);
    } catch (e) { setHiba(e); }
    setTolt(false);
  };
  const kep = adat && adat.alap && adat.alap.kep && typeof adat.alap.kep === 'object' ? (adat.alap.kep.belyeg || adat.alap.kep.kep) : '';
  const ctx = {
    felhasznalo, szerep: dm ? 'dm' : 'jatekos', probak: [],
    karakterek: [{ id: karakter.id, nev: (adat && adat.nev) || karakter.nev, kep, jatekos_id: karakter.jatekos_id, irhato: karakter.irhato !== false }],
    reszletekLathatok: !(kampany && kampany.beallitasok && kampany.beallitasok.dobas_reszletek_lathatok === false)
  };
  return html`<details className="lenyilo" onToggle=${(e) => { if (e.currentTarget.open && !lista && !tolt) lekeres(); }}>
    <summary>Dobások${lista ? ` (${lista.length}${tobb ? '+' : ''})` : ''}</summary>
    <div className="verem">
      ${hiba ? html`<p className="kicsi" style=${{ color: 'var(--danger)' }}>${hiba.message}</p>` : null}
      ${lista ? html`<${DobasLista} dobasok=${lista} ctx=${ctx} max=${lista.length} ures="Ennek a karakternek még nincs dobása."
        mutatvanyKornyezet=${kornyezet ? () => kornyezet : null}/>` : (tolt ? html`<p className="halvany kicsi">Betöltés…</p>` : null)}
      <div className="gombsor">
        ${tobb ? html`<${K.Button} size="sm" variant="secondary" disabled=${tolt} onClick=${() => lekeres(N.kovetkezoElotte(lista))}>Továbbiak<//>` : null}
        ${lista ? html`<${K.Button} size="sm" variant="quiet" disabled=${tolt} onClick=${() => lekeres()}>Frissítés<//>` : null}
      </div>
    </div>
  </details>`;
}
