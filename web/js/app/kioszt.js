// Kampányjátszó 6.5: jutalmak kiosztása és a csapatkassza (felület).
// - KiosztomGomb és JutalomKiosztasParbeszed: a jutalom elem (5.6) kiosztása a fajtája szerint (cím, tagság: bejegyzés
//   a hősöknél; mágikus tárgy, ereklye: a leltárba egy hősnek; társ: az NJK kötődése; kincs: a kasszába vagy elosztva).
// - ZsakmanyParbeszed: összeg elosztása egyenlően vagy kézzel, a maradék a kasszába; a kassza szétosztása is.
// - KasszaMozgasParbeszed: a kassza bevétele, kiadása, befizetés egy hőstől, kivét egy hősnek.
// - KasszaPanel: az egyenleg és a napló (a DM-nek gombokkal és visszavonással, a játékosnak csak olvasható).
// Minden kiosztás egy reward.give hívás (backend/Jutalmak.gs), visszavonás: reward.undo. Tiszta függvények:
// web/js/kampany/kioszt.js. Terv: claude/kampanyjatszo-terv.md, „6.5”.
import { html, K, useApp, useState, Uzenet, Parbeszed, Megerosites, Jelolo, Sugo, PenzBevitel } from './kozos.js';
import * as KI from '../kampany/kioszt.js';
import * as JU from '../kampany/jutalom.js';
import * as E from '../kampany/elem.js';
import { penzRezben, penzHozzaad } from '../karakter/jegyzet.js';
import { penzSzoveg } from '../karakter/varazslo.js';
import { useKampanyAllapot } from './jatek.js';

const aktivKarakter = (c) => !c.kampany_allapot || c.kampany_allapot === 'aktív';
const ido = (iso) => { const d = new Date(iso); return iso && !isNaN(d) ? d.toLocaleString('hu-HU', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''; };
const elojeles = (rez) => (rez > 0 ? '+' : '') + penzSzoveg(rez);

// A kiosztás hívása és a válasz beírása a tárolt kampányállapotba (a következő változásfigyelés úgyis hozza).
export function useKiosztas(allapot) {
  const { api, sync, uzen } = useApp();
  const [fut, setFut] = useState(false);
  const kampanyId = allapot && allapot.kampany ? allapot.kampany.id : '';
  const beir = (v) => sync.helyiModositas((st) => (st && st.kampany && st.kampany.id === kampanyId ? KI.allapotraAlkalmaz(st, v) : null));
  const hiv = async (action, adat, uzenet) => {
    setFut(true);
    try {
      const v = await api.hivas(action, adat);
      beir(v);
      if (uzenet) uzen(uzenet);
      return v;
    } catch (e) {
      uzen(e.kod === 'halozat' ? 'Nincs kapcsolat a szerverrel, most nem lehet kiosztani.' : (e.message || String(e)), 'danger');
      return null;
    } finally { setFut(false); }
  };
  return {
    fut,
    kuld: (keres, uzenet = 'Kiosztva.') => hiv('reward.give', keres, uzenet),
    visszavon: (id) => hiv('reward.undo', { kampany_id: kampanyId, id }, 'Visszavonva.')
  };
}

// A kiosztás előnézete: soronként ki mit kap.
function Elonezet({ keres, nevOf }) {
  const sorok = keres ? KI.keresElonezet(keres, nevOf) : [];
  if (!sorok.length) return null;
  return html`<div><p className="cimke">Ki mit kap</p><ul className="sorlista">${sorok.map((s, i) => html`<li key=${i} className="sorlista__sor">
    <span className="sorlista__nev">${s.kinek}</span><span>${s.mit}</span></li>`)}</ul></div>`;
}

// Karakterválasztó: több (jelölők) vagy egy (csipek).
function Cimzettek({ karakterek, kivalasztott, set, egy, csapatLehet, csapat, setCsapat }) {
  if (egy) {
    return html`<div className="csipek" role="group" aria-label="Ki kapja">
      ${karakterek.map((c) => html`<button key=${c.id} type="button" className="csip" aria-pressed=${!csapat && kivalasztott[0] === c.id}
        onClick=${() => { set([c.id]); if (setCsapat) setCsapat(false); }}>${c.nev}</button>`)}
      ${csapatLehet ? html`<button type="button" className="csip" aria-pressed=${csapat} onClick=${() => { setCsapat(true); set([]); }}>A csapat</button>` : null}
    </div>`;
  }
  const valt = (id, be) => set(be ? kivalasztott.concat([id]) : kivalasztott.filter((x) => x !== id));
  return html`<fieldset className="szakasz"><legend className="cimke">Kik kapják</legend>
    ${karakterek.map((c) => html`<div key=${c.id}><${Jelolo} checked=${kivalasztott.includes(c.id)} onChange=${(be) => valt(c.id, be)}>${c.nev}<//></div>`)}
    ${karakterek.length > 1 ? html`<div className="gombsor gombsor--szoros">
      <button type="button" className="szoveggomb" onClick=${() => set(karakterek.map((c) => c.id))}>Mindenki</button>
      <button type="button" className="szoveggomb" onClick=${() => set([])}>Senki</button></div>` : null}
  </fieldset>`;
}

// ================= A jutalom elem kiosztása =================

// A „Kiosztom” gomb a jutalom elem mellé, a kiosztások számával. ix: az előkészítő elemek indexe.
export function KiosztomGomb({ allapot, jutalom, ix, size = 'sm' }) {
  const [nyitva, setNyitva] = useState(false);
  const db = KI.jutalomKiosztasai(KI.kasszaOf(allapot), jutalom.id).length;
  return html`<span className="gombsor gombsor--szoros">
    ${db ? html`<${K.Badge} tone="success">kiosztva${db > 1 ? ' ×' + db : ''}<//>` : null}
    <${K.Button} size=${size} variant=${db ? 'quiet' : 'secondary'} onClick=${() => setNyitva(true)}>${db ? 'Újra' : 'Kiosztom'}<//>
    ${nyitva ? html`<${JutalomKiosztasParbeszed} allapot=${allapot} jutalom=${jutalom} ix=${ix} onBezar=${() => setNyitva(false)}/>` : null}
  </span>`;
}

export function JutalomKiosztasParbeszed({ allapot, jutalom, ix, onBezar, onKesz }) {
  const k = useKiosztas(allapot);
  const karakterek = (allapot.karakterek || []).filter(aktivKarakter);
  const a = E.megjelenitett(jutalom, ix);
  const nev = E.nev(jutalom, ix);
  const mod = KI.kiosztasMod(a);
  const jav = KI.javasoltCimzettek(a, karakterek.map((c) => c.id));
  const [kivalasztott, setKivalasztott] = useState(() => (mod.egyCimzett ? jav.karakterek.slice(0, 1) : jav.karakterek.length ? jav.karakterek : (mod.fajta === 'cim' || mod.fajta === 'tagsag' ? [] : karakterek.map((c) => c.id))));
  const [csapat, setCsapat] = useState(mod.fajta === 'tars' && (jav.csapat || !jav.karakterek.length));
  const [kincsMod, setKincsMod] = useState('kassza');
  const [egeszEzust, setEgeszEzust] = useState(true);
  const [ok, setOk] = useState('');
  const [kid] = useState(KI.ujKiosztasId);
  const csoport = a.csoport_id && ix.get(a.csoport_id) ? E.nev(ix.get(a.csoport_id), ix) : '';
  const njk = a.njk_id ? ((allapot.njkk || []).find((n) => n.id === a.njk_id) || {}).nev : '';
  const nevek = { csoport, njk };
  const nevOf = (id) => (karakterek.find((c) => c.id === id) || {}).nev || id;
  const eredmeny = mod.hiba ? { hiba: mod.hiba } : KI.jutalomKeres(a, { kampanyId: allapot.kampany.id, jutalomId: jutalom.id, nev, cimzettek: kivalasztott, csapat,
    kincsMod, egeszEzust, nevek, id: kid, ok });
  const eddig = KI.jutalomKiosztasai(KI.kasszaOf(allapot), jutalom.id);
  const kuld = async () => {
    const v = await k.kuld(eredmeny.keres, 'Kiosztva: ' + nev + '.');
    if (v) { if (onKesz) onKesz(v); onBezar(); }
  };
  const fajtaNev = mod.fajta ? JU.FAJTAK[mod.fajta].nev : 'Jutalom';
  return html`<${Parbeszed} cim=${'Kiosztás: ' + nev} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${k.fut || !!eredmeny.hiba} onClick=${kuld}>${k.fut ? 'Kiosztás…' : 'Kiosztom'}<//>`}>
    <div className="verem">
      <p className="szoveg kicsi" style=${{ margin: 0 }}><strong>${fajtaNev}</strong>${mod.fajta ? ' · ' + JU.osszefoglalo(a, { csoport, njk }) : ''}</p>
      ${eddig.length ? html`<${Uzenet} tonus="neutral">ⓘ Ezt a jutalmat már kiosztottad (${eddig.map((x) => KI.kiosztasSzoveg(x) || ido(x.idopont)).join('; ')}). Újra kiosztva még egyszer megkapják.<//>` : null}
      ${mod.fajta === 'tars' ? html`<p className="sugo kicsi" style=${{ margin: 0 }}>A társ az NJK-tár követője: a kiválasztott hőshöz vagy a csapathoz kötődik, és a kampányba kerül. A gazda játékosa látja a statblokkját.</p>` : null}
      ${mod.fajta === 'targy' ? html`<p className="sugo kicsi" style=${{ margin: 0 }}>A tárgy a hős leltárába kerül${/^(fgy|pan)_/.test(String(a.alap_id || '')) ? ', a felszerelés választóiban is megjelenik, és viselve a támadás, sebzés, Páncélérték és Védekezés előnye beleszámít' : ''}. A többi előny, a korlátozás és az átok leírásként látszik a karakterlapon.</p>` : null}
      ${mod.fajta === 'cim' || mod.fajta === 'tagsag' ? html`<p className="sugo kicsi" style=${{ margin: 0 }}>A karakterlap „Címek, tagságok, ereklyék” szakaszába kerül.${mod.fajta === 'cim' ? ' A bónusz emlékeztető, a lapon egy gombbal kézi módosítóként is felvehető.' : ''}</p>` : null}
      ${mod.fajta === 'kincs' ? html`
        <p className="szoveg" style=${{ margin: 0 }}>Érték: <strong>${penzSzoveg((Number(a.ertek_ezust) || 0) * 10)}</strong>${a.forma ? html` <span className="halvany kicsi">(${a.forma})</span>` : null}</p>
        <div className="kapcsolo" role="group" aria-label="Hova kerül">
          <button type="button" aria-pressed=${kincsMod === 'kassza'} onClick=${() => setKincsMod('kassza')}>A kasszába</button>
          <button type="button" aria-pressed=${kincsMod === 'eloszt'} onClick=${() => setKincsMod('eloszt')}>Elosztva a hősök közt</button>
        </div>` : null}
      ${mod.fajta && (mod.fajta !== 'kincs' || kincsMod === 'eloszt') ? html`<${Cimzettek} karakterek=${karakterek} kivalasztott=${kivalasztott} set=${setKivalasztott}
        egy=${mod.egyCimzett} csapatLehet=${mod.csapatLehet} csapat=${csapat} setCsapat=${setCsapat}/>` : null}
      ${mod.fajta === 'kincs' && kincsMod === 'eloszt' ? html`<${Jelolo} checked=${egeszEzust} onChange=${setEgeszEzust}>Csak egész ezüst (a maradék a kasszába)<//>` : null}
      <${K.TextField} label="Mire (a naplóba)" placeholder=${fajtaNev + ': ' + nev} value=${ok} onChange=${(e) => setOk(e.target.value)}/>
      ${eredmeny.hiba ? html`<${Uzenet} tonus="warning">${eredmeny.hiba}<//>` : html`<${Elonezet} keres=${eredmeny.keres} nevOf=${nevOf}/>`}
    </div>
  <//>`;
}

// ================= Zsákmány elosztása =================

// forras: 'kivulrol' (új pénz) vagy 'kassza' (a kassza szétosztása).
export function ZsakmanyParbeszed({ allapot, onBezar, kezdoForras = 'kivulrol' }) {
  const k = useKiosztas(allapot);
  const karakterek = (allapot.karakterek || []).filter(aktivKarakter);
  const kassza = KI.kasszaOf(allapot);
  const [forras, setForras] = useState(kezdoForras);
  const [osszeg, setOsszeg] = useState(() => (kezdoForras === 'kassza' && kassza.egyenleg > 0 ? { e: String(Math.floor(kassza.egyenleg / 10)), r: String(kassza.egyenleg % 10 || '') } : { e: '', r: '' }));
  const [kivalasztott, setKivalasztott] = useState(() => karakterek.map((c) => c.id));
  const [mod, setMod] = useState('egyenlo');
  const [kezi, setKezi] = useState({});
  const [egeszEzust, setEgeszEzust] = useState(true);
  const [maradekKasszaba, setMaradekKasszaba] = useState(true);
  const [ok, setOk] = useState('');
  const [kid] = useState(KI.ujKiosztasId);
  const rez = penzRezben(osszeg);
  const el = mod === 'egyenlo' ? KI.egyenloElosztas(rez, kivalasztott, { egeszEzust })
    : KI.keziElosztas(rez, Object.fromEntries(kivalasztott.map((id) => [id, penzRezben(kezi[id] || {})])));
  const keres = rez ? KI.zsakmanyKeres({ kampanyId: allapot.kampany.id, id: kid, osszeg: rez, reszek: el.reszek, maradek: el.maradek, forras, maradekKasszaba, ok }) : null;
  const ures = !keres || (!keres.karakterek.length && !keres.kassza);
  const nevOf = (id) => (karakterek.find((c) => c.id === id) || {}).nev || id;
  const tulKassza = forras === 'kassza' && keres && -keres.kassza > kassza.egyenleg;
  return html`<${Parbeszed} cim=${forras === 'kassza' ? 'A kassza szétosztása' : 'Zsákmány elosztása'} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${k.fut || ures || el.tul} onClick=${async () => { if (await k.kuld(keres, 'Elosztva.')) onBezar(); }}>${k.fut ? 'Elosztás…' : 'Elosztom'}<//>`}>
    <div className="verem">
      <div className="kapcsolo" role="group" aria-label="Honnan">
        <button type="button" aria-pressed=${forras === 'kivulrol'} onClick=${() => setForras('kivulrol')}>Talált, kapott pénz</button>
        <button type="button" aria-pressed=${forras === 'kassza'} onClick=${() => setForras('kassza')}>A kasszából</button>
      </div>
      ${forras === 'kassza' ? html`<p className="kicsi" style=${{ margin: 0 }}>A kassza egyenlege: <strong>${penzSzoveg(kassza.egyenleg)}</strong></p>` : null}
      <div className="csipek" role="group" aria-label="Gyorsösszegek">${[1, 5, 10, 50].map((n) => html`<button key=${n} type="button" className="csip"
        onClick=${() => setOsszeg(penzHozzaad(osszeg, n))}>+${n} ezüst</button>`)}
        ${rez ? html`<button type="button" className="csip" onClick=${() => setOsszeg({ a: '', e: '', r: '' })}>Törlés</button>` : null}</div>
      <${PenzBevitel} ertek=${osszeg} set=${setOsszeg} cimke="Összeg"/>
      <${Cimzettek} karakterek=${karakterek} kivalasztott=${kivalasztott} set=${setKivalasztott}/>
      <div className="kapcsolo" role="group" aria-label="Elosztás">
        <button type="button" aria-pressed=${mod === 'egyenlo'} onClick=${() => setMod('egyenlo')}>Egyenlően</button>
        <button type="button" aria-pressed=${mod === 'kezi'} onClick=${() => setMod('kezi')}>Kézzel</button>
      </div>
      ${mod === 'egyenlo' ? html`<${Jelolo} checked=${egeszEzust} onChange=${setEgeszEzust}>Csak egész ezüst<//>`
        : kivalasztott.map((id) => html`<${PenzBevitel} key=${id} ertek=${kezi[id] || {}} set=${(x) => setKezi({ ...kezi, [id]: x })} cimke=${nevOf(id)}/>`)}
      ${forras === 'kivulrol' ? html`<${Jelolo} checked=${maradekKasszaba} onChange=${setMaradekKasszaba}>A maradék a csapatkasszába<//>` : null}
      ${rez ? html`<p className="kicsi" style=${{ margin: 0 }}>${mod === 'egyenlo' && kivalasztott.length ? html`Fejenként <strong>${penzSzoveg(el.fejenkent)}</strong>, ` : null}maradék: <strong>${penzSzoveg(el.maradek)}</strong>${forras === 'kassza' ? ' (a kasszában marad)' : maradekKasszaba ? ' (a kasszába)' : ' (senkié)'}</p>` : null}
      ${el.tul ? html`<${Uzenet} tonus="warning">A részek összege több az összegnél.<//>` : null}
      ${tulKassza ? html`<${Uzenet} tonus="warning">Ennyi nincs a kasszában: az egyenleg mínuszba megy.<//>` : null}
      <${K.TextField} label="Mire (a naplóba)" hint="Például: a goblinok ládája." value=${ok} onChange=${(e) => setOk(e.target.value)}/>
      <${Elonezet} keres=${keres} nevOf=${nevOf}/>
    </div>
  <//>`;
}

// ================= A kassza mozgása =================

// mod: 'be' | 'ki' | 'befizet' | 'kivesz'
export function KasszaMozgasParbeszed({ allapot, onBezar, kezdoMod = 'be' }) {
  const k = useKiosztas(allapot);
  const karakterek = (allapot.karakterek || []).filter(aktivKarakter);
  const kassza = KI.kasszaOf(allapot);
  const [mod, setMod] = useState(kezdoMod);
  const [osszeg, setOsszeg] = useState({ e: '', r: '' });
  const [kar, setKar] = useState(karakterek[0] ? karakterek[0].id : '');
  const [megj, setMegj] = useState('');
  const [kid] = useState(KI.ujKiosztasId);
  const rez = penzRezben(osszeg);
  const hos = mod === 'befizet' || mod === 'kivesz';
  const keres = !rez ? null : hos ? KI.atadasKeres({ kampanyId: allapot.kampany.id, id: kid, karakterId: kar, rez: mod === 'befizet' ? rez : -rez, megjegyzes: megj })
    : KI.kasszaKeres({ kampanyId: allapot.kampany.id, id: kid, rez: mod === 'be' ? rez : -rez, megjegyzes: megj });
  const valt = keres ? keres.kassza : 0;
  const c = karakterek.find((x) => x.id === kar);
  const hosPenz = c && c.adat && c.adat.felszereles ? Number(c.adat.felszereles.penz_rez) || 0 : null;
  return html`<${Parbeszed} cim="Csapatkassza" onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${k.fut || !keres || (hos && !kar)} onClick=${async () => { if (await k.kuld(keres, 'Rögzítve.')) onBezar(); }}>${k.fut ? 'Rögzítés…' : 'Rögzítés'}<//>`}>
    <div className="verem">
      <div className="kapcsolo kapcsolo--teljes" role="group" aria-label="Mozgás">
        <button type="button" aria-pressed=${mod === 'be'} onClick=${() => setMod('be')}>Bevétel</button>
        <button type="button" aria-pressed=${mod === 'ki'} onClick=${() => setMod('ki')}>Kiadás</button>
        <button type="button" aria-pressed=${mod === 'befizet'} onClick=${() => setMod('befizet')}>Hős befizet</button>
        <button type="button" aria-pressed=${mod === 'kivesz'} onClick=${() => setMod('kivesz')}>Hős kivesz</button>
      </div>
      ${hos ? html`<div className="csipek" role="group" aria-label="Melyik hős">${karakterek.map((x) => html`<button key=${x.id} type="button" className="csip"
        aria-pressed=${kar === x.id} onClick=${() => setKar(x.id)}>${x.nev}</button>`)}</div>` : null}
      <div className="csipek" role="group" aria-label="Gyorsösszegek">${[1, 5, 10, 50].map((n) => html`<button key=${n} type="button" className="csip"
        onClick=${() => setOsszeg(penzHozzaad(osszeg, n))}>+${n} ezüst</button>`)}
        ${rez ? html`<button type="button" className="csip" onClick=${() => setOsszeg({ a: '', e: '', r: '' })}>Törlés</button>` : null}</div>
      <${PenzBevitel} ertek=${osszeg} set=${setOsszeg} cimke="Összeg"/>
      ${rez ? html`<p className="kicsi" style=${{ margin: 0 }}>A kassza: <strong>${penzSzoveg(kassza.egyenleg)}</strong> → <strong>${penzSzoveg(kassza.egyenleg + valt)}</strong>${hos && hosPenz !== null
        ? html`; ${c.nev}: <strong>${penzSzoveg(hosPenz)}</strong> → <strong>${penzSzoveg(hosPenz - valt)}</strong>` : null}</p>` : null}
      ${rez && kassza.egyenleg + valt < 0 ? html`<${Uzenet} tonus="warning">Ennyi nincs a kasszában: az egyenleg mínuszba megy.<//>` : null}
      ${rez && hos && hosPenz !== null && hosPenz - valt < 0 ? html`<${Uzenet} tonus="warning">${c.nev} egyenlege mínuszba megy.<//>` : null}
      <${K.TextField} label="Mire, honnan" hint="Például: szállás, hajójegy, a fogadós adóssága." value=${megj} onChange=${(e) => setMegj(e.target.value)}/>
    </div>
  <//>`;
}

// ================= A kassza panelje =================

const NAPLO_ROVID = 5;

export function KasszaPanel({ allapot, dm, kompakt }) {
  const k = useKiosztas(allapot);
  const kassza = KI.kasszaOf(allapot);
  const [ablak, setAblak] = useState(null); // 'zsakmany' | 'szetoszt' | 'be' | 'ki' | 'befizet'
  const [mind, setMind] = useState(false);
  const [visszavon, setVisszavon] = useState(null);
  const sorok = KI.naploSorok(kassza);
  const mutat = mind ? sorok : sorok.slice(0, kompakt ? 3 : NAPLO_ROVID);
  const cim = html`Csapatkassza <${Sugo} cim="Csapatkassza">A csapat közös pénze. A DM a jutalmakat, a kincset és a zsákmányt ide
    is teheti, innen szétoszthatja, és a hősök be is fizethetnek. Minden mozgás naplózva, és a DM visszavonhatja.<//>`;
  return html`<${K.Panel} title=${cim}>
    <div className="verem verem--kicsi">
      <div className="penzsor">
        <span className="penzsor__nev">Egyenleg</span>
        <span className=${'penzsor__ertek kassza__egyenleg' + (kassza.egyenleg < 0 ? ' penzsor__ertek--minusz' : '')}>${penzSzoveg(kassza.egyenleg)}</span>
      </div>
      ${dm ? html`<div className="gombsor gombsor--szoros">
        <${K.Button} size="sm" variant="secondary" onClick=${() => setAblak('be')}>+ Bevétel<//>
        <${K.Button} size="sm" variant="secondary" onClick=${() => setAblak('ki')}>− Kiadás<//>
        <${K.Button} size="sm" variant="secondary" onClick=${() => setAblak('zsakmany')}>Zsákmány elosztása<//>
        <${K.Button} size="sm" variant="quiet" disabled=${kassza.egyenleg <= 0} onClick=${() => setAblak('szetoszt')}>Szétosztás<//>
        <${K.Button} size="sm" variant="quiet" onClick=${() => setAblak('befizet')}>Hős befizet, kivesz<//>
      </div>` : null}
      ${mutat.length ? html`<ul className="esemenylista kasszanaplo">${mutat.map((x) => html`<li key=${x.id} className=${'esemenylista__sor' + (x.visszavonva ? ' kasszanaplo__visszavont' : '')}>
        <span className="esemenylista__ido">${ido(x.idopont)}</span>
        <span className="esemenylista__szoveg"><strong>${x.ok || (KI.KIOSZTAS_FAJTAK[x.fajta] || {}).nev || 'Kiosztás'}</strong>
          <span className="halvany kicsi"> ${KI.kiosztasSzoveg(x)}${x.visszavonva ? ' · visszavonva' : ''}</span></span>
        ${Number(x.kassza) ? html`<span className=${'kasszanaplo__osszeg' + (x.kassza < 0 ? ' kasszanaplo__osszeg--minusz' : '')}>${elojeles(x.kassza)}</span>` : html`<span></span>`}
        ${dm && !x.visszavonva ? html`<button type="button" className="kisgomb" aria-label="Visszavonás" title="Visszavonás" disabled=${k.fut} onClick=${() => setVisszavon(x)}>↺</button>` : null}
      </li>`)}</ul>` : html`<p className="halvany kicsi" style=${{ margin: 0 }}>Még nincs mozgás.</p>`}
      ${sorok.length > mutat.length || mind ? html`<button type="button" className="szoveggomb" onClick=${() => setMind(!mind)}>${mind ? 'Kevesebb' : 'Mind a ' + sorok.length}</button>` : null}
    </div>
    ${ablak === 'zsakmany' || ablak === 'szetoszt' ? html`<${ZsakmanyParbeszed} allapot=${allapot} kezdoForras=${ablak === 'szetoszt' ? 'kassza' : 'kivulrol'} onBezar=${() => setAblak(null)}/>` : null}
    ${ablak === 'be' || ablak === 'ki' || ablak === 'befizet' ? html`<${KasszaMozgasParbeszed} allapot=${allapot} kezdoMod=${ablak} onBezar=${() => setAblak(null)}/>` : null}
    ${visszavon ? html`<${Megerosites} cim="Visszavonás" gomb="Visszavonom" veszelyes=${true}
      szoveg=${'„' + (visszavon.ok || 'Kiosztás') + '”: ' + (KI.kiosztasSzoveg(visszavon) || '') + '. A hősök pénze, tárgyai és bejegyzései és a kassza visszaáll' + (visszavon.tars ? ', a társ kötődése is' : '') + '.'}
      onMegse=${() => setVisszavon(null)} onIgen=${async () => { const x = visszavon; setVisszavon(null); await k.visszavon(x.id); }}/>` : null}
  <//>`;
}

// A jutalomelemek listája (a Játék nézet jelenetkártyájához): név, összefoglaló, „Kiosztom”.
export function JutalomElemSorok({ allapot, jutalmak, ix, elemUt }) {
  return html`<ul className="sorlista">${jutalmak.map((j) => {
    const a = E.megjelenitett(j, ix);
    return html`<li key=${j.id} className="sorlista__sor">
      <span><a className="sorlista__nev" href=${elemUt ? elemUt(j.id) : '#'}>${E.nev(j, ix)}</a><br/><span className="halvany kicsi">${JU.osszefoglalo(a)}</span></span>
      <span className="sorlista__muvelet"><${KiosztomGomb} allapot=${allapot} jutalom=${j} ix=${ix}/></span>
    </li>`;
  })}</ul>`;
}

// A Kampányépítő jutalom szerkesztőjében (kampányelemnél): a kiosztás gombja a kampány állapotával.
export function KiosztasDoboz({ kampanyId, jutalom, ix }) {
  const { allapot } = useKampanyAllapot(kampanyId);
  if (!allapot || !allapot.kampany) return null;
  const db = KI.jutalomKiosztasai(KI.kasszaOf(allapot), jutalom.id);
  return html`<div className="kiosztasdoboz">
    <div><p className="cimke" style=${{ margin: 0 }}>Kiosztás</p>
      <p className="halvany kicsi" style=${{ margin: 0 }}>${db.length ? 'Kiosztva: ' + db.map((x) => KI.kiosztasSzoveg(x)).join('; ') : 'Játék közben a hősökhöz kerül (a Játék nézet jelenetkártyájáról is).'}</p></div>
    <${KiosztomGomb} allapot=${allapot} jutalom=${jutalom} ix=${ix}/>
  </div>`;
}
