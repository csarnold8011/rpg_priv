// Kampányjátszó 6.6: vásárlás a boltokban (felület).
// - BoltGomb, BoltNyitasParbeszed: a DM megnyitja a helyszín boltját a csapatnak (a Játék nézet jelenetkártyájáról és a
//   Boltok panelről); a kínálatról pillanatkép megy a háttérbe (shop.open) a bolt áraival és a darabszámmal.
// - BoltokPanel: a DM boltjai (nyitva, zárva), bezárás, újranyitás, a napló visszavonással, és a DM is vásárolhat bárki nevében.
// - JatekosBoltok, BoltAblak: a játékos telefonján a nyitott boltok, kosárral vásárlás és eladás a felvásárlási áron
//   (shop.buy); a háttér ellenőrzi a készletet és a pénzt.
// Tiszta függvények: web/js/kampany/vasarlas.js, háttér: backend/Boltok.gs. Terv: claude/kampanyjatszo-terv.md, „6.6”.
import { html, K, useApp, useState, Uzenet, Parbeszed, Megerosites, Sugo, Valaszto, Jelolo } from './kozos.js';
import * as V from '../kampany/vasarlas.js';
import * as B from '../kampany/bolt.js';
import * as E from '../kampany/elem.js';
import { penzSzoveg, targyLap } from '../karakter/varazslo.js';
import { index } from '../karakter/szabalyindex.js';

const lapokBol = (szabalyok) => (szabalyok && szabalyok.adat && szabalyok.adat.lapok) || {};
const ido = (iso) => { const d = new Date(iso); return iso && !isNaN(d) ? d.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
const elojeles = (rez) => (rez > 0 ? '+' : rez < 0 ? '−' : '') + penzSzoveg(Math.abs(rez));
const aktivKarakter = (c) => !c.kampany_allapot || c.kampany_allapot === 'aktív';

// A bolt hívásai, a válasz beírása a tárolt kampányállapotba (a következő változásfigyelés úgyis hozza).
export function useBoltok(allapot) {
  const { api, sync, uzen } = useApp();
  const [fut, setFut] = useState(false);
  const kampanyId = allapot && allapot.kampany ? allapot.kampany.id : '';
  const hiv = async (action, adat, uzenet) => {
    setFut(true);
    try {
      const v = await api.hivas(action, { kampany_id: kampanyId, ...adat });
      sync.helyiModositas((st) => (st && st.kampany && st.kampany.id === kampanyId ? V.allapotraAlkalmaz(st, v) : null));
      if (uzenet) uzen(uzenet);
      return v;
    } catch (e) {
      uzen(e.kod === 'halozat' ? 'Nincs kapcsolat a szerverrel, most nem megy.' : (e.message || String(e)), e.kod === 'elfogyott' || e.kod === 'nincs_penz' ? 'warning' : 'danger');
      return null;
    } finally { setFut(false); }
  };
  return {
    fut,
    nyit: (bolt, keszletUjra) => hiv('shop.open', { bolt, keszlet_ujra: !!keszletUjra }, 'A bolt nyitva: a játékosok a telefonjukon látják.'),
    zar: (boltId) => hiv('shop.close', { bolt_id: boltId }, 'A bolt bezárt.'),
    torol: (boltId) => hiv('shop.close', { bolt_id: boltId, torol: true }, 'A bolt a naplójával együtt törölve.'),
    vesz: (keres, uzenet) => hiv('shop.buy', keres, uzenet),
    visszavon: (boltId, id) => hiv('shop.undo', { bolt_id: boltId, id }, 'Visszavonva.')
  };
}

// ================= A DM: a bolt megnyitása =================

function vilagOf(prep) {
  const a = prep && prep.adat;
  if (!a) return null;
  const vid = (a.keret && a.keret.keret && a.keret.keret.vilag_id) || a.vilag_id;
  return (a.vilagok || []).find((w) => w.id === vid) || null;
}

// A pillanatkép egy előkészítő elemből (a Kampányépítő megjelenített adatával és az árszorzóval).
export function elemPillanatkep(elem, ix, prep, lapok) {
  const a = E.megjelenitett(elem, ix);
  const szorzo = B.arszorzo(elem, ix, (x) => E.megjelenitett(x, ix), vilagOf(prep));
  return V.boltPillanatkep({ elemId: elem.id, nev: E.nev(elem, ix), hely: V.helyUtvonal(elem, ix, (x) => E.nev(x, ix)), a, lapok, szorzo: szorzo.szazalek });
}

export function BoltNyitasParbeszed({ allapot, elem, ix, prep, onBezar }) {
  const { szabalyok } = useApp();
  const b = useBoltok(allapot);
  const p = elemPillanatkep(elem, ix, prep, lapokBol(szabalyok));
  const regi = V.elemBoltja(allapot, elem.id);
  const fogyott = regi ? regi.tetelek.filter((t) => t.darab !== null && t.darab !== undefined && V.keszlet(t) < t.darab).length : 0;
  const [ujra, setUjra] = useState(false);
  const nyitott = V.nyitottBoltok(allapot).filter((x) => x.elem_id !== elem.id).length;
  const korlatos = p.bolt.tetelek.filter((t) => t.darab !== null).length;
  const csoportok = [...new Set(p.bolt.tetelek.map((t) => t.csoport))];
  const nyit = async () => { const v = await b.nyit(p.bolt, ujra); if (v) onBezar(); };
  return html`<${Parbeszed} cim=${(regi && regi.nyitva ? 'A bolt frissítése: ' : 'Bolt megnyitása: ') + p.bolt.nev} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${b.fut || !p.bolt.tetelek.length || nyitott >= V.NYITOTT_BOLT_MAX} onClick=${nyit}>${regi && regi.nyitva ? 'Frissítem' : 'Megnyitom'}<//>`}>
    <div className="verem">
      <p className="sugo">A játékosok a telefonjukon, a kampány oldalán látják a boltot, és a saját hősük pénzéből vásárolhatnak vagy
        adhatnak el. A kínálat a mostani árakkal és darabszámmal kerül át; ha közben a Kampányépítőben változtatsz, nyisd meg újra.</p>
      <dl className="ertekek ertekek--lista">
        <div><dt>Hely</dt><dd>${p.bolt.hely || '–'}</dd></div>
        <div><dt>Típus</dt><dd>${p.bolt.tipus}</dd></div>
        <div><dt>Kínálat</dt><dd>${p.bolt.tetelek.length} tétel${korlatos ? ', ebből ' + korlatos + ' korlátos készletű' : ''}</dd></div>
        <div><dt>Árszint</dt><dd>${p.bolt.arszint}%${p.bolt.kedvezmeny ? ', a csapatnak −' + p.bolt.kedvezmeny + '%' : ''}</dd></div>
        <div><dt>Felvásárlás</dt><dd>${p.bolt.visszavasarlas ? 'a listaár ' + p.bolt.felvasarlas + '%-a' : 'nincs (végkiárusítás)'}</dd></div>
      </dl>
      ${csoportok.length ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>${csoportok.join(' · ')}</p>` : null}
      ${!p.bolt.tetelek.length ? html`<${Uzenet} tonus="warning">A boltnak nincs áras kínálata. A Kampányépítőben, a bolt „Kínálat és árak” lépésén generálhatsz vagy vehetsz fel tételeket.<//>` : null}
      ${p.arNelkul.length ? html`<${Uzenet} tonus="warning">Ár nélkül, ezért nem kerül a boltba: ${p.arNelkul.join(', ')}. A kézi árat a Kampányépítőben adhatod meg.<//>` : null}
      ${p.kimaradt ? html`<${Uzenet} tonus="warning">Egy boltban legfeljebb ${V.BOLT_TETEL_MAX} tétel lehet: ${p.kimaradt} kimarad.<//>` : null}
      ${p.bolt.csere ? html`<${Uzenet} tonus="warning">Csak cserekereskedelem: a játékosok látják a kínálatot és az áru értékét, de pénzért nem vehetnek. A cserét te rögzíted a karakterlapon.<//>` : null}
      ${p.bolt.bogo ? html`<p className="kicsi">Két tételből az olcsóbb féláron: a kosár ezt magától számolja.</p>` : null}
      ${p.bolt.megj ? html`<p className="kicsi">${p.bolt.megj}</p>` : null}
      ${fogyott ? html`<${Jelolo} checked=${ujra} onChange=${setUjra}>A készlet újraindítása (${fogyott} tételből vettek már; enélkül a fogyás megmarad)<//>` : null}
      ${nyitott >= V.NYITOTT_BOLT_MAX ? html`<${Uzenet} tonus="warning">Egyszerre legfeljebb ${V.NYITOTT_BOLT_MAX} bolt lehet nyitva. Előbb zárj be egyet.<//>` : null}
    </div>
  <//>`;
}

// A bolt gombja egy előkészítő elem mellé: megnyitás, vagy nyitott boltnál a jel, a frissítés és a bezárás.
export function BoltGomb({ allapot, elem, ix, prep, size = 'sm' }) {
  const [nyitas, setNyitas] = useState(false);
  const b = useBoltok(allapot);
  const bolt = V.elemBoltja(allapot, elem.id);
  return html`<span className="gombsor gombsor--szoros">
    ${bolt && bolt.nyitva ? html`<${K.Badge} tone="success">nyitva<//>
      <${K.Button} size=${size} variant="quiet" onClick=${() => setNyitas(true)}>Frissítés<//>
      <${K.Button} size=${size} variant="secondary" disabled=${b.fut} onClick=${() => b.zar(bolt.id)}>Bezárás<//>`
      : html`<${K.Button} size=${size} variant="secondary" onClick=${() => setNyitas(true)}>Bolt megnyitása<//>`}
    ${nyitas ? html`<${BoltNyitasParbeszed} allapot=${allapot} elem=${elem} ix=${ix} prep=${prep} onBezar=${() => setNyitas(false)}/>` : null}
  </span>`;
}

// ================= A DM boltjai =================

function NaploLista({ bolt, dm, fut, onVisszavon, max }) {
  const sorok = V.naploSorok(bolt);
  const [mind, setMind] = useState(false);
  const mutat = mind ? sorok : sorok.slice(0, max);
  if (!sorok.length) return html`<p className="halvany kicsi" style=${{ margin: 0 }}>Még nem vásároltak itt.</p>`;
  return html`<div className="verem verem--kicsi">
    <ul className="esemenylista kasszanaplo">${mutat.map((x) => html`<li key=${x.id} className=${'esemenylista__sor' + (x.visszavonva ? ' kasszanaplo__visszavont' : '')}>
      <span className="esemenylista__ido">${ido(x.idopont)}</span>
      <span className="esemenylista__szoveg"><strong>${x.karakter_nev || 'Valaki'}</strong>
        <span className="halvany kicsi"> ${x.fajta === 'eladas' ? 'eladta: ' : 'vett: '}${V.tetelekSzoveg(x)}${x.visszavonva ? ' · visszavonva' : ''}</span></span>
      <span className=${'kasszanaplo__osszeg' + (x.osszeg < 0 ? ' kasszanaplo__osszeg--minusz' : '')}>${elojeles(x.osszeg)}</span>
      ${dm && !x.visszavonva ? html`<button type="button" className="kisgomb" aria-label="Visszavonás" title="Visszavonás" disabled=${fut} onClick=${() => onVisszavon(x)}>↺</button>` : null}
    </li>`)}</ul>
    ${sorok.length > mutat.length || mind ? html`<button type="button" className="szoveggomb" onClick=${() => setMind(!mind)}>${mind ? 'Kevesebb' : 'Mind a ' + sorok.length}</button>` : null}
  </div>`;
}

// A DM Boltok panelje. prep: az előkészítő adat (a Játék nézetben; enélkül megnyitni nem lehet, csak bezárni).
export function BoltokPanel({ allapot, prep }) {
  const b = useBoltok(allapot);
  const [nyitas, setNyitas] = useState(null);
  const [valasztott, setValasztott] = useState('');
  const [vasarlas, setVasarlas] = useState(null);
  const [visszavon, setVisszavon] = useState(null);
  const [torles, setTorles] = useState(null);
  const [lenyitva, setLenyitva] = useState({});
  const boltok = V.boltokOf(allapot).sort((x, y) => Number(y.nyitva) - Number(x.nyitva) || x.nev.localeCompare(y.nev, 'hu'));
  const ix = prep && prep.ix;
  const elemek = prep && prep.adat ? V.boltElemek(prep.adat.elemek, (e) => E.megjelenitett(e, ix)) : [];
  const nyithato = elemek.filter((e) => !boltok.some((x) => x.elem_id === e.id && x.nyitva));
  const cim = html`Boltok <${Sugo} cim="Boltok">A megnyitott boltot a játékosok a telefonjukon látják, és a saját hősük pénzéből
    vásárolhatnak vagy eladhatnak. A korlátos készlet fogy, a fogyás bezárás után is megmarad. Minden vásárlás naplózva, és visszavonható.<//>`;
  return html`<${K.Panel} title=${cim}>
    <div className="verem verem--kicsi">
      ${boltok.length ? html`<ul className="sorlista">${boltok.map((x) => html`<li key=${x.id} className="sorlista__sor sorlista__sor--fuggoleges boltsor">
        <div className="boltsor__fej">
          <span><strong>${x.nev}</strong>${x.hely ? html` <span className="halvany kicsi">${x.hely}</span>` : null}</span>
          ${x.nyitva ? html`<${K.Badge} tone="success">nyitva<//>` : html`<${K.Badge}>zárva<//>`}
        </div>
        <div className="gombsor gombsor--szoros">
          ${x.nyitva ? html`<${K.Button} size="sm" variant="secondary" onClick=${() => setVasarlas(x.id)}>Vásárlás valakinek<//>
            <${K.Button} size="sm" variant="secondary" disabled=${b.fut} onClick=${() => b.zar(x.id)}>Bezárás<//>` : null}
          ${ix && ix.get(x.elem_id) ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => setNyitas(ix.get(x.elem_id))}>${x.nyitva ? 'Frissítés' : 'Újranyitás'}<//>` : null}
          <${K.Button} size="sm" variant="quiet" onClick=${() => setLenyitva({ ...lenyitva, [x.id]: !lenyitva[x.id] })}>Napló (${x.naplo.length})<//>
          ${!x.nyitva ? html`<${K.Button} size="sm" variant="quiet" onClick=${() => setTorles(x)}>Törlés<//>` : null}
        </div>
        ${lenyitva[x.id] ? html`<${NaploLista} bolt=${x} dm=${true} fut=${b.fut} max=${6} onVisszavon=${(n) => setVisszavon({ bolt: x, n })}/>` : null}
      </li>`)}</ul>` : html`<p className="halvany kicsi" style=${{ margin: 0 }}>Még nincs megnyitott bolt.</p>`}
      ${prep && !prep.adat ? null : prep ? (elemek.length ? html`<div className="sorban">
          <${Valaszto} label="Bolt megnyitása" value=${valasztott} onChange=${setValasztott} ures="Válassz boltot…"
            opciok=${nyithato.map((e) => ({ value: e.id, label: E.nev(e, ix) + (V.helyUtvonal(e, ix, (y) => E.nev(y, ix)) ? ' (' + V.helyUtvonal(e, ix, (y) => E.nev(y, ix)) + ')' : '') }))}/>
          <${K.Button} size="sm" variant="secondary" disabled=${!valasztott || !ix.get(valasztott)} onClick=${() => setNyitas(ix.get(valasztott))}>Megnyitás…<//>
        </div>` : html`<p className="halvany kicsi" style=${{ margin: 0 }}>A kampány világában még nincs üzlet. A Kampányépítő Helyszínek fülén egy helyszín fajtája lehet „Üzlet”.</p>`)
        : html`<p className="halvany kicsi" style=${{ margin: 0 }}>Boltot a Játék nézetből nyithatsz (a jelenet helyszínénél, vagy a Boltok panelen).</p>`}
    </div>
    ${nyitas ? html`<${BoltNyitasParbeszed} allapot=${allapot} elem=${nyitas} ix=${ix} prep=${prep} onBezar=${() => { setNyitas(null); setValasztott(''); }}/>` : null}
    ${vasarlas && boltok.find((x) => x.id === vasarlas) ? html`<${BoltAblak} allapot=${allapot} bolt=${boltok.find((x) => x.id === vasarlas)} dm=${true} onBezar=${() => setVasarlas(null)}/>` : null}
    ${visszavon ? html`<${Megerosites} cim="Visszavonás" gomb="Visszavonom" veszelyes=${true}
      szoveg=${V.vasarlasSzoveg(visszavon.n) + '. A hős pénze és tárgyai visszaállnak' + (visszavon.n.fajta === 'vetel' ? ', a bolt készlete is.' : '.')}
      onMegse=${() => setVisszavon(null)} onIgen=${async () => { const x = visszavon; setVisszavon(null); await b.visszavon(x.bolt.id, x.n.id); }}/>` : null}
    ${torles ? html`<${Megerosites} cim="A bolt törlése" gomb="Törlöm" veszelyes=${true}
      szoveg=${'„' + torles.nev + '”: a napló és a fogyás törlődik (a hősök vásárlásai megmaradnak). Később újra megnyitható, teljes készlettel.'}
      onMegse=${() => setTorles(null)} onIgen=${async () => { const x = torles; setTorles(null); await b.torol(x.id); }}/>` : null}
  <//>`;
}

// ================= A játékos: a nyitott boltok és a bolt =================

export function JatekosBoltok({ allapot }) {
  const [nyitott, setNyitott] = useState(null);
  const boltok = V.nyitottBoltok(allapot);
  if (!boltok.length) return null;
  const bolt = boltok.find((x) => x.id === nyitott);
  return html`<div className="verem verem--kicsi">
    ${boltok.map((x) => html`<button key=${x.id} type="button" className="kartya boltkartya" onClick=${() => setNyitott(x.id)}>
      <span className="boltkartya__jel" aria-hidden="true">¤</span>
      <span className="kartya__test"><span className="cimke">Nyitva</span><span className="kartya__cim">${x.nev}</span>
        <span className="halvany kicsi">${[x.hely, x.tipus].filter(Boolean).join(' · ')}</span></span>
      <span className="boltkartya__nyil" aria-hidden="true">›</span>
    </button>`)}
    ${bolt ? html`<${BoltAblak} allapot=${allapot} bolt=${bolt} onBezar=${() => setNyitott(null)}/>` : null}
  </div>`;
}

function Lepteto({ ertek, onValt, nev, max }) {
  return html`<span className="lepteto lepteto--kicsi">
    <button type="button" aria-label=${nev + ': egyel kevesebb'} disabled=${!ertek} onClick=${() => onValt(-1)}>−</button>
    <span aria-live="polite">${ertek}</span>
    <button type="button" aria-label=${nev + ': egyel több'} disabled=${max !== null && max !== undefined && ertek >= max} onClick=${() => onValt(1)}>+</button>
  </span>`;
}

// A bolt (párbeszéd, telefonon teljes képernyő): hős választása, Vétel és Eladás. dm: a DM bárki nevében vásárolhat.
export function BoltAblak({ allapot, bolt, dm, onBezar }) {
  const { szabalyok } = useApp();
  const lapok = lapokBol(szabalyok);
  const b = useBoltok(allapot);
  const karakterek = (allapot.karakterek || []).filter((c) => c.irhato && c.adat && aktivKarakter(c));
  const [karakterId, setKarakterId] = useState(karakterek.length === 1 ? karakterek[0].id : '');
  const [mod, setMod] = useState('vetel');
  const [kosar, setKosar] = useState({});
  const [eladando, setEladando] = useState({});
  const [kereso, setKereso] = useState('');
  const kar = karakterek.find((c) => c.id === karakterId) || null;
  const penz = kar ? Math.round(Number((kar.adat.felszereles || {}).penz_rez) || 0) : 0;
  const ix = index(lapok);
  const nevOf = (id) => { const e = ix.elem(targyLap(id), id); return e ? e.nev_hu : id; };
  const ossz = V.kosarOsszesites(bolt, kosar);
  const eladhato = kar ? V.eladhatoTargyak(kar.adat, lapok, bolt, nevOf) : { targyak: [], egyeb: 0 };
  const eossz = V.eladasOsszesites(eladhato.targyak, eladando);
  const s = kereso.trim().toLowerCase();
  const tetelek = bolt.tetelek.filter((t) => !s || (t.nev + ' ' + (t.megj || '')).toLowerCase().includes(s));
  const csoportok = [...new Set(tetelek.map((t) => t.csoport || 'Egyéb'))];
  const keves = penz < ossz.osszeg;

  const vesz = async () => {
    const v = await b.vesz(V.vetelKeres({ kampanyId: allapot.kampany.id, bolt, karakterId, kosar }), 'Megvetted: ' + ossz.sorok.map((x) => (x.db > 1 ? x.db + ' × ' : '') + x.t.nev).join(', ') + '.');
    if (v) setKosar({});
  };
  const elad = async () => {
    const v = await b.vesz(V.eladasKeres({ kampanyId: allapot.kampany.id, bolt, karakterId, eladando }), 'Eladtad, kaptál ' + penzSzoveg(eossz.osszeg) + '.');
    if (v) setEladando({});
  };

  const lab = !kar ? null : mod === 'vetel' ? html`
    <div className="boltlab">
      <div className="boltlab__osszeg"><span className="osszegsor__ertek">${penzSzoveg(ossz.osszeg)}</span>
        <span className=${'kicsi' + (keves ? ' boltlab__keves' : ' halvany')}>${ossz.darab ? (keves ? 'Nincs elég pénz' + (dm ? ' (a DM-nek engedett)' : '') : 'utána ' + penzSzoveg(penz - ossz.osszeg)) : 'Üres a kosár'}${ossz.engedmeny ? ', engedmény ' + penzSzoveg(ossz.engedmeny) : ''}</span></div>
      <${K.Button} variant="primary" size="lg" disabled=${b.fut || !ossz.darab || ossz.hibak.length > 0 || (keves && !dm) || bolt.csere} onClick=${vesz}>Megveszem<//>
    </div>`
    : html`<div className="boltlab">
      <div className="boltlab__osszeg"><span className="osszegsor__ertek">${penzSzoveg(eossz.osszeg)}</span>
        <span className="kicsi halvany">${eossz.sorok.length ? 'utána ' + penzSzoveg(penz + eossz.osszeg) : 'Válaszd ki, mit adsz el'}</span></div>
      <${K.Button} variant="primary" size="lg" disabled=${b.fut || !eossz.sorok.length} onClick=${elad}>Eladom<//>
    </div>`;

  return html`<${Parbeszed} cim=${bolt.nev} onBezar=${onBezar} lab=${lab}>
    <div className="verem">
      ${bolt.hely || bolt.tipus ? html`<p className="halvany kicsi" style=${{ margin: 0 }}>${[bolt.hely, bolt.tipus].filter(Boolean).join(' · ')}</p>` : null}
      ${!bolt.nyitva ? html`<${Uzenet} tonus="warning">A bolt bezárt.<//>` : null}
      ${karakterek.length > 1 ? html`<div className="csipek" role="group" aria-label="Ki vásárol">${karakterek.map((c) => html`<button key=${c.id} type="button" className="csip"
        aria-pressed=${c.id === karakterId} onClick=${() => { setKarakterId(c.id); setEladando({}); }}>${c.nev}</button>`)}</div>` : null}
      ${!karakterek.length ? html`<${Uzenet} tonus="warning">Nincs hősöd ebben a kampányban, akinek vásárolhatnál.<//>` : null}
      ${karakterek.length > 1 && !kar ? html`<p className="sugo">Válaszd ki, ki vásárol.</p>` : null}
      ${kar ? html`<div className="penzsor"><span className="penzsor__nev">${kar.nev} pénze</span>
        <span className=${'penzsor__ertek' + (penz < 0 ? ' penzsor__ertek--minusz' : '')}>${penzSzoveg(penz)}</span></div>` : null}
      ${kar && bolt.visszavasarlas && !bolt.csere ? html`<div className="kapcsolo kapcsolo--teljes" role="group" aria-label="Vétel vagy eladás">
        <button type="button" aria-pressed=${mod === 'vetel'} onClick=${() => setMod('vetel')}>Vétel${ossz.darab ? html` <span className="jelveny jelveny--halk">${ossz.darab}</span>` : null}</button>
        <button type="button" aria-pressed=${mod === 'eladas'} onClick=${() => setMod('eladas')}>Eladás</button>
      </div>` : null}
      ${bolt.csere ? html`<${Uzenet} tonus="warning">Ez a bolt csak cserél, pénzt nem fogad el. Az árak az áru értékét mutatják; a cserét a DM-mel egyeztesd.<//>` : null}
      ${(bolt.kedvezmeny || bolt.bogo || bolt.megj) && mod === 'vetel' ? html`<p className="kicsi" style=${{ margin: 0 }}>${[bolt.kedvezmeny ? 'A csapatnak ' + bolt.kedvezmeny + '% kedvezmény (az árakban benne van).' : '', bolt.bogo ? 'Két tételből az olcsóbb féláron.' : '', bolt.megj].filter(Boolean).join(' ')}</p>` : null}

      ${mod === 'vetel' || !kar ? html`
        ${bolt.tetelek.length > 10 ? html`<${K.TextField} label="Keresés a kínálatban" type="search" value=${kereso} onChange=${(e) => setKereso(e.target.value)}/>` : null}
        ${csoportok.map((cs) => html`<section key=${cs} className="verem verem--kicsi">
          <h3 className="cimke" style=${{ margin: 0 }}>${cs}</h3>
          <ul className="sorlista">${tetelek.filter((t) => (t.csoport || 'Egyéb') === cs).map((t) => {
            const k = V.keszlet(t);
            const db = kosar[t.id] || 0;
            const magikus = !!V.magikusOf(t);
            return html`<li key=${t.id} className=${'sorlista__sor arusor' + (k === 0 ? ' arusor--elfogyott' : '')}>
              <span className="arusor__nev"><span>${magikus ? html`<span className="magikusjel" aria-label="mágikus">✦ </span>` : null}${t.nev}</span>
                ${t.megj ? html`<span className="halvany kicsi arusor__megj">${t.megj}</span>` : null}
                <span className="kicsi arusor__ar"><strong>${penzSzoveg(t.ar)}</strong>${t.eredeti ? html` <s className="halvany">${penzSzoveg(t.eredeti)}</s>` : null}
                  <span className="halvany">${k === null ? '' : k === 0 ? ' · elfogyott' : ' · ' + k + ' db'}</span></span></span>
              ${kar && !bolt.csere && k !== 0 ? html`<${Lepteto} ertek=${db} nev=${t.nev} max=${magikus ? 1 : k} onValt=${(d) => setKosar(V.kosarValt(kosar, t, d))}/>` : null}
            </li>`;
          })}</ul>
        </section>`)}
        ${!tetelek.length ? html`<p className="halvany">${s ? 'Nincs találat.' : 'A boltnak most nincs kínálata.'}</p>` : null}
        ${ossz.hibak.length ? html`<${Uzenet} tonus="warning">${ossz.hibak.join(' ')}<//>` : null}`
      : html`
        <p className="sugo">A bolt a listaár ${bolt.felvasarlas}%-át adja. ${eladhato.egyeb ? 'Az egyedi és a mágikus tárgyakat nem veszi fel: azokról a DM-mel alkudj.' : ''}</p>
        ${eladhato.targyak.length ? html`<ul className="sorlista">${eladhato.targyak.map((t) => html`<li key=${t.id} className="sorlista__sor arusor">
          <span className="arusor__nev"><span>${t.nev}${t.felszerelve ? html` <span className="halvany kicsi">(felszerelve)</span>` : null}</span>
            <span className="kicsi arusor__ar"><strong>${penzSzoveg(t.ar)}</strong> <span className="halvany">· nálad ${t.db} db</span></span></span>
          <${Lepteto} ertek=${eladando[t.id] || 0} nev=${t.nev} max=${t.db} onValt=${(d) => setEladando({ ...eladando, [t.id]: Math.max(0, Math.min(t.db, (eladando[t.id] || 0) + d)) })}/>
        </li>`)}</ul>` : html`<p className="halvany">Nincs olyan tárgyad, amit ez a bolt felvásárol.</p>`}`}

      ${kar ? html`<details className="lenyilo"><summary>A bolt naplója (${bolt.naplo.length})</summary>
        <${NaploLista} bolt=${bolt} dm=${false} max=${8}/></details>` : null}
    </div>
  <//>`;
}
