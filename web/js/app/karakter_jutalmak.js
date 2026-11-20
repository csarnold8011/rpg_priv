// Kampányjátszó 6.5: a karakterlap „Címek, tagságok, ereklyék” szakasza.
// A bejegyzéseket a DM osztja ki (reward.give); itt látszanak a fajtájuk szerint. A DM a cím bónuszát egy gombbal kézi
// módosítóként felveheti, és a zárt vagy vegyes ereklye feltételét teljesültnek jelölheti. Tiszta függvények:
// web/js/karakter/jutalmak.js.
import { html, K, useState, Parbeszed, Valaszto, Uzenet, Sugo } from './kozos.js';
import * as KJ from '../karakter/jutalmak.js';
import * as JU from '../kampany/jutalom.js';

const TUL_NEV = {
  tul_accuracy: 'Pontosság', tul_communication: 'Kommunikáció', tul_constitution: 'Szívósság', tul_dexterity: 'Ügyesség',
  tul_fighting: 'Harc', tul_intelligence: 'Intelligencia', tul_perception: 'Észlelés', tul_strength: 'Erő', tul_willpower: 'Akaraterő'
};
const MOD_CELOK = Object.entries(TUL_NEV).map(([value, label]) => ({ value, label }))
  .concat([{ value: 'vedekezes', label: 'Védekezés' }, { value: 'sebesseg', label: 'Sebesség' }, { value: 'pancelertek', label: 'Páncélérték' }]);
const van = (x) => !!String(x === null || x === undefined ? '' : x).trim();
const datum = (iso) => { try { return new Date(iso).toLocaleDateString('hu-HU', { year: 'numeric', month: 'short', day: 'numeric' }); } catch (e) { return ''; } };
const elojel = (n) => (Number(n) > 0 ? '+' : Number(n) < 0 ? '−' : '') + Math.abs(Number(n) || 0);

export function JutalmakPanel({ adat, lap, valtoztat, dm }) {
  const lista = KJ.jutalmak(adat);
  const [modosito, setModosito] = useState(null);
  if (!lista.length) return null;
  const nyilik = lap && lap.xp && lap.xp.elerheto ? KJ.kovetkezoSzintenNyilik(adat, lap.szint) : 0;
  return html`<${K.Panel} title=${html`Címek, tagságok, ereklyék <${Sugo} cim="Jutalmak">A DM által kiosztott címek, tagságok, mágikus tárgyak,
      ereklyék és társak. A cím bónusza emlékeztető: a megfelelő próbánál add hozzá (vagy a DM kézi módosítóként felveszi). A mágikus fegyver és
      páncél számszerű előnye viselve beleszámít.<//>`}>
    <div className="verem verem--kicsi">
      ${nyilik ? html`<${Uzenet} tonus="neutral">✦ A következő szinten ${nyilik} új ereklyeképesség nyílik.<//>` : null}
      ${lista.map((j) => html`<${Bejegyzes} key=${j.id} j=${j} lap=${lap} dm=${dm} valtoztat=${valtoztat} onModosito=${() => setModosito(j)}/>`)}
    </div>
    ${modosito ? html`<${CimModositoAblak} j=${modosito} valtoztat=${valtoztat} onBezar=${() => setModosito(null)}/>` : null}
  <//>`;
}

function Bejegyzes({ j, lap, dm, valtoztat, onModosito }) {
  const fajta = KJ.FAJTA_NEVEK[j.fajta] || 'Jutalom';
  const alcim = [];
  if (j.fajta === 'cim' && JU.CIM_FAJTAK[j.cim_fajta]) alcim.push(JU.CIM_FAJTAK[j.cim_fajta].nev);
  if (j.fajta === 'tagsag') alcim.push([j.szervezet, j.rang ? j.rang + '. rang' + (j.rang_nev ? ' (' + j.rang_nev + ')' : '') : ''].filter(Boolean).join(', '));
  if ((j.fajta === 'targy' || j.fajta === 'ereklye') && JU.RITKASAGOK[j.ritkasag]) alcim.push(JU.RITKASAGOK[j.ritkasag].nev.toLowerCase());
  if (j.tartos === 'ideiglenes') alcim.push('ideiglenes');
  if (j.atok && j.atok.van) alcim.push('átkozott');
  const bonusz = KJ.cimBonuszSzoveg(j);
  const kepessegek = j.fajta === 'ereklye' ? KJ.ereklyeKepessegek(j, lap ? lap.szint : 1) : [];
  const ereklyeFajta = j.ereklye ? j.ereklye.fajta : '';
  return html`<details className="lenyilo jutalombejegyzes">
    <summary><span className="jutalombejegyzes__fej">
      <span className="jutalombejegyzes__fajta">${fajta}</span>
      <span className="sorlista__nev">${j.nev || fajta}</span>
      ${bonusz ? html`<${K.Badge} tone="accent">${bonusz}<//>` : null}
      ${alcim.filter(Boolean).length ? html`<span className="halvany kicsi">${alcim.filter(Boolean).join(' · ')}</span>` : null}
    </span></summary>
    <div className="verem verem--kicsi">
      ${van(j.leiras) ? html`<p className="szoveg tordelt kicsi">${j.leiras}</p>` : null}
      ${j.fajta === 'cim' ? html`
        ${van(j.hatas) ? html`<p className="szoveg kicsi"><strong>Hatás:</strong> ${j.hatas}${j.alkalmankent ? ' (alkalmanként egyszer)' : ''}</p>` : null}
        ${van(j.jogok) ? html`<p className="szoveg kicsi"><strong>Jogok, kötelességek:</strong> ${j.jogok}</p>` : null}
        ${dm && valtoztat && bonusz ? html`<div>${j.kezi_felveve ? html`<span className="halvany kicsi">✓ Kézi módosítóként felvéve.</span>`
          : html`<${K.Button} size="sm" variant="quiet" onClick=${onModosito}>Kézi módosítóként<//>`}</div>` : null}` : null}
      ${j.fajta === 'tagsag' ? html`
        ${van(j.rang_elonyok) ? html`<p className="szoveg kicsi"><strong>Előnyök:</strong> ${j.rang_elonyok}</p>` : null}
        ${van(j.rang_kotelessegek) ? html`<p className="szoveg kicsi"><strong>Kötelességek:</strong> ${j.rang_kotelessegek}</p>` : null}
        ${van(j.felvetel) ? html`<p className="szoveg kicsi"><strong>Felvétel:</strong> ${j.felvetel}</p>` : null}
        ${(j.rangok || []).length > 1 ? html`<p className="halvany kicsi">Rangok: ${j.rangok.map((r, i) => (i + 1 === Number(j.rang) ? '▸ ' : '') + r.nev).join(', ')}</p>` : null}` : null}
      ${j.fajta === 'targy' || j.fajta === 'ereklye' ? html`
        ${(j.elonyok || []).length ? html`<ul className="kicsi jelenetresz__lista">${j.elonyok.map((e, i) => html`<li key=${i}>
          ${(JU.ELONY_TIPUSOK[e.tipus] || { nev: 'Előny' }).nev}${e.ertek !== undefined && e.ertek !== '' ? ' ' + elojel(e.ertek) : ''}${e.mire ? ': ' + e.mire : ''}${e.jegyzet ? html` <span className="halvany">(${e.jegyzet})</span>` : null}
          ${['tamadas', 'sebzes', 'pancel', 'vedekezes'].includes(e.tipus) && j.tartos !== 'ideiglenes' ? html` <span className="halvany">· viselve beleszámít</span>` : null}</li>`)}</ul>` : null}
        ${(j.korlatozasok || []).length ? html`<p className="szoveg kicsi"><strong>Korlátozás:</strong> ${j.korlatozasok.map((k) => (JU.KORLATOZASOK[k.tipus] || { nev: '' }).nev + (k.szoveg ? ': ' + k.szoveg : '') + (k.kuszob ? ' (küszöb ' + k.kuszob + ')' : '')).join('; ')}</p>` : null}
        ${j.atok && j.atok.van ? html`<p className="szoveg kicsi"><strong>Átok:</strong> ${j.atok.buntetes ? elojel(j.atok.buntetes) : ''} ${j.atok.jelenet ? JU.ATOK_JELENETEK[j.atok.jelenet] + ' jelenetekben' : ''}${j.atok.jegyzet ? ', ' + j.atok.jegyzet : ''}</p>` : null}
        ${j.toltes && van(j.toltes.mp) ? html`<p className="szoveg kicsi"><strong>Töltés:</strong> ${j.toltes.mp} Mágiapont${j.toltes.visszatoltes ? ', ' + j.toltes.visszatoltes : ''}</p>` : null}
        ${van(j.tortenet) ? html`<p className="szoveg tordelt kicsi halvany">${j.tortenet}</p>` : null}` : null}
      ${kepessegek.length ? html`<div>
        <p className="cimke">${(JU.EREKLYE_FAJTAK[ereklyeFajta] || { nev: 'Ereklye' }).nev} ereklye${j.ereklye.feltetel ? ': ' + j.ereklye.feltetel : ''}</p>
        <ul className="ereklyelista">${kepessegek.map((k, i) => html`<li key=${i} className=${k.nyitva ? 'ereklyelista__nyitva' : 'ereklyelista__zarva'}>
          <span aria-hidden="true">${k.nyitva ? '✦' : '○'}</span>
          <span><strong>${k.nev || 'Képesség'}</strong>${k.szint ? html` <span className="halvany kicsi">(${k.szint}. szint)</span>` : null}${k.leiras ? html`<br/><span className="kicsi">${k.leiras}</span>` : null}
            ${!k.nyitva ? html` <span className="halvany kicsi">zárva</span>` : null}</span>
        </li>`)}</ul>
        ${dm && valtoztat && (ereklyeFajta === 'zart' || ereklyeFajta === 'vegyes') ? html`<${K.Button} size="sm" variant="quiet"
          onClick=${() => valtoztat((a) => KJ.jutalomModosit(a, j.id, { feltetel_teljesult: !j.feltetel_teljesult }))}>${j.feltetel_teljesult ? 'A feltétel mégsem teljesült' : 'A feltétel teljesült'}<//>` : null}
      </div>` : null}
      ${j.fajta === 'tars' ? html`${van(j.feladatok) ? html`<p className="szoveg kicsi"><strong>Feladatai:</strong> ${j.feladatok}</p>` : null}
        <p className="halvany kicsi">A statblokkja a kampány NJK-i közt, követőként.</p>` : null}
      ${van(j.adomanyozo) || van(j.feltetelek) ? html`<p className="szoveg kicsi">${van(j.adomanyozo) ? html`<strong>Adományozó:</strong> ${j.adomanyozo}. ` : null}${van(j.feltetelek) ? html`<strong>Feltételek:</strong> ${j.feltetelek}` : null}</p>` : null}
      <p className="halvany kicsi">${datum(j.idopont)}${j.ki ? ', ' + j.ki : ''}</p>
    </div>
  </details>`;
}

// A cím bónusza kézi módosítóként (a DM választja ki, mire).
function CimModositoAblak({ j, valtoztat, onBezar }) {
  const [cel, setCel] = useState('tul_communication');
  const ertek = Number(j.bonusz) || 0;
  return html`<${Parbeszed} cim=${'Kézi módosító: ' + (j.nev || 'cím')} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" onClick=${() => {
      valtoztat((a) => {
        a.kezi = (a.kezi || []).concat([{ cel, ertek, mod: 'hozzaad', megjegyzes: 'Cím: ' + (j.nev || '') + (j.mire ? ' (' + j.mire + ')' : ''), ki: 'dm' }]);
        KJ.jutalomModosit(a, j.id, { kezi_felveve: true });
      });
      onBezar();
    }}>Felveszem<//>`}>
    <div className="verem">
      <p className="szoveg kicsi" style=${{ margin: 0 }}>A cím bónusza (${elojel(ertek)}${j.mire ? ', ' + j.mire : ''}) általában szűk helyzetre szól. Kézi módosítóként egész tulajdonságra vagy értékre kerül, ezért csak akkor vedd fel, ha mindig érvényes.</p>
      <${Valaszto} label="Mire" value=${cel} onChange=${setCel} opciok=${MOD_CELOK}/>
    </div>
  <//>`;
}
