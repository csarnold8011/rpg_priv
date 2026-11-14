// A szintlépés-varázsló öt lépése. Minden lépés ugyanazokat a tulajdonságokat kapja (lásd szintlepes.js):
// adat, valtoztat, n (a nyitott szint), cel, kezdo, lap (a nyitott szinttel), lapElotte (a szint előtt),
// lapKesz (a nyitott szint kész jellel: a hiányok ellenőrzéséhez), ix (a karakter forrásaira szűrt index),
// ixMind (a teljes szabályadat), forrasok, dm, ugras, figy (a szint figyelmeztetései), elvetes.
import { html, K, useState, Uzenet, Sugo } from './kozos.js';
import { Kockadobo } from './kockadobo.js';
import { reszletek } from '../karakter/szabalyindex.js';
import { fokozatNev } from '../karakter/tablak.js';
import * as V from '../karakter/varazslo.js';
import * as S from '../karakter/szintlepes.js';
import {
  Valasztas, Csip, Szakasz, Kereso, keresIllik, rovid, forrasMeta, elemNev, tulNev, TulNev, fokuszNev
} from './varazslo_lepesek.js';

const elojel = (n) => (n > 0 ? '+' : n < 0 ? '−' : '') + Math.abs(n);

// ---- Súgószövegek ----
const SUGO = {
  egeszseg: ['Egészség szintlépéskor', 'Az 1–10. szinten 1d6 + Szívósság, a 11. szinttől csak a Szívósság (legalább 1). A Szívósság a szint fejlesztése előtti értékkel számít.'],
  magiapont: ['Mágiapont szintlépéskor', 'A mágus a 2–10. szinten 1d6 + Akaraterő Mágiapontot kap, a 11. szinttől csak az Akaraterőt.'],
  fejlesztes: ['Tulajdonság-fejlesztés', 'Szintenként egy fejlesztés jár: páros szinten egy elsődleges, páratlanon egy másodlagos tulajdonságra. Az ár az új értéktől függ: −1-től 5-ig 1, 6–8-ig 2, 9–12-ig 3 fejlesztés. Ha több kell, a fejlesztés tárolódik, és egy későbbi szinten, ugyanarra a tulajdonságra költve nő az érték.'],
  fokusz: ['Új fókusz', 'Szintenként egy új fókusz jár (+2 a hozzá illő próbákra): páros szinten elsődleges, páratlanon másodlagos tulajdonságból. A 11. szinttől egy meglévő fókusz is választható, akkor +3 lesz.'],
  talentum: ['Új talentum', 'Egy új talentum Kezdő fokozata, vagy egy meglévő következő fokozata (Kezdő → Haladó → Mester). Az előfeltétel hiánya csak figyelmeztetés.'],
  arkanum: ['Új mágikus talentum', 'Egy új arkánum Kezdő fokozata (két Kezdő varázslattal), vagy egy meglévő következő fokozata. A Haladó fokozattal az arkánum fókusza is jár.'],
  varazslat: ['Varázslatok az új fokozathoz', 'A Companion szabálya szerint az arkánum varázslatai közül választasz (Haladó fokon a Kezdő és Haladó varázslatok közül egyet). Ha csak az Alapkönyv aktív, a fokozat varázslata adott.'],
  specializacio: ['Specializáció', 'Az osztályod egy irányzata saját talentummal (Kezdő, Haladó, Mester). A 4. és a 12. szinten választhatsz újat, a következő páros szinteken a fokozata nő.'],
  fegyvercsoport: ['Új fegyvercsoport', 'Egy újabb fegyvercsoportot tanulsz meg: ennek fegyvereivel nincs büntetés.']
};
const S2 = (kulcs) => (SUGO[kulcs] ? html`<${Sugo} cim=${SUGO[kulcs][0]}>${SUGO[kulcs][1]}<//>` : null);

// Az adott lépés figyelmeztetései (sárga), a lépés alján.
function LepesFigyelmeztetesek({ figy, lepes }) {
  const lista = figy.filter((f) => S.szintFigyLepese(f) === lepes);
  if (!lista.length) return null;
  return html`<div className="verem">${lista.map((f) => html`<${Uzenet} key=${f.kulcs} tonus="warning">${f.uzenet}<//>`)}</div>`;
}
function Valt({ regi, uj }) {
  return html`<span className="valt">${regi} <small>→</small> <span className=${uj !== regi ? 'uj' : ''}>${uj}</span></span>`;
}
// Egy kártyalista két részre: a karakternek szólók, és a többi lenyitva (figyelmeztetéssel választható).
function Lenyilo({ cim, db, children }) {
  if (!db) return null;
  return html`<details className="lenyilo"><summary>${cim} (${db})</summary><div className="valasztasok valasztasok--ket">${children}</div></details>`;
}

// ================= 1. Egészség (és Mágiapont) =================
function Egeszseg({ adat, valtoztat, n, lap, lapElotte, figy }) {
  const sz = S.szintBejegyzes(adat, n) || {};
  const dobas = S.szintDobasKell(n);
  const egD = V.utolsoDobas(adat, 'egeszseg:' + n);
  const mpD = V.utolsoDobas(adat, 'mp:' + n);
  const resz = (ertek) => ((ertek && ertek.reszek) || []).find((r) => r.szint === n);
  const egResz = resz(lap.egeszseg);
  const mpResz = lap.magiapont ? resz(lap.magiapont) : null;
  const van = (x) => x !== null && x !== undefined;
  return html`<p className="sugo">${dobas ? 'Az Egészség nő: 1d6 + Szívósság.' : 'A 11. szinttől nincs dobás: a Szívósság adódik hozzá (legalább 1).'} ${S2('egeszseg')}</p>
    ${dobas ? html`<${Szakasz} cim="Egészség-dobás (1d6)">
      <${Kockadobo} db=${1} kockak=${van(sz.egeszseg_dobas) && egD ? egD.kockak : null} kezi=${egD && egD.kezi}
        felirat="Dobj 1d6-tal" onDobas=${(k, kezi) => valtoztat((a) => S.egeszsegDob(a, n, k, kezi))}/>
    <//>` : null}
    ${egResz ? html`<div className="osszegsor"><span>${egResz.eredet.replace(n + '. szint: ', '')}</span><span className="osszegsor__ertek">${elojel(egResz.ertek)}</span></div>` : null}
    <div className="osszegsor"><span className="osszegsor__nev">Egészség</span><${Valt} regi=${lapElotte.egeszseg.ertek} uj=${lap.egeszseg.ertek}/></div>
    ${lap.magiapont ? html`
      ${dobas ? html`<${Szakasz} cim=${html`Mágiapont-dobás (1d6)${S2('magiapont')}`}>
        <${Kockadobo} db=${1} kockak=${van(sz.mp_dobas) && mpD ? mpD.kockak : null} kezi=${mpD && mpD.kezi}
          felirat="Dobj 1d6-tal" onDobas=${(k, kezi) => valtoztat((a) => S.mpDob(a, n, k, kezi))}/>
      <//>` : html`<p className="sugo">Mágiapont: a 11. szinttől csak az Akaraterő adódik hozzá. ${S2('magiapont')}</p>`}
      ${mpResz ? html`<div className="osszegsor"><span>${mpResz.eredet.replace(n + '. szint: ', '')}</span><span className="osszegsor__ertek">${elojel(mpResz.ertek)}</span></div>` : null}
      <div className="osszegsor"><span className="osszegsor__nev">Mágiapont</span><${Valt} regi=${lapElotte.magiapont ? lapElotte.magiapont.ertek : 0} uj=${lap.magiapont.ertek}/></div>
    ` : null}
    ${lap.egeszseg.ertek ? html`<${K.ResourceBar} kind="health" value=${lap.egeszseg.ertek} max=${lap.egeszseg.ertek}/>` : null}
    ${adat.keszites.allapot === 'atvett' ? html`<${Uzenet} tonus="neutral">ⓘ A régi lapról átvett Egészség és Mágiapont megmarad, a szintlépés erre ad hozzá.<//>` : null}
    <${LepesFigyelmeztetesek} figy=${figy} lepes="egeszseg"/>`;
}

// ================= 2. Tulajdonság-fejlesztés =================
function Tulajdonsag({ adat, valtoztat, n, lapElotte, ixMind, figy }) {
  const sz = S.szintBejegyzes(adat, n) || {};
  const { sajat, tobbi } = S.szintTulajdonsagok(ixMind, adat.osztaly, n);
  const paros = n % 2 === 0;
  const kartya = (t, idegen) => {
    const f = S.fejlesztesInfo(lapElotte, t);
    const most = f.fizetett + 1;
    const leiras = f.most
      ? `${f.ar} fejlesztés${f.fizetett ? `, ebből ${f.fizetett} már korábban kifizetve` : ''}: most nő.`
      : `A ${f.uj} ára ${f.ar} fejlesztés: most ${most} / ${f.ar} lesz kifizetve, egy későbbi ${paros ? 'páros' : 'páratlan'} szinten nő.`;
    return html`<${Valasztas} key=${t} nev=${tulNev(ixMind, t)} en="" valasztott=${sz.fejlesztes === t}
      meta=${html`<${Valt} regi=${f.ertek} uj=${f.most ? f.uj : f.ertek}/>`} leiras=${leiras}
      figy=${idegen ? `${paros ? 'Páros' : 'Páratlan'} szinten ${paros ? 'elsődleges' : 'másodlagos'} tulajdonság jár.` : null}
      onClick=${() => valtoztat((a) => S.fejlesztesBeallit(a, n, t))}>
      ${!f.most || f.fizetett ? html`<span className="csik" aria-hidden="true"><span style=${{ width: Math.round(100 * (sz.fejlesztes === t ? most : f.fizetett) / f.ar) + '%' }}></span></span>` : null}
    <//>`;
  };
  return html`<p className="sugo">Egy fejlesztés jár, ${paros ? 'páros szinten elsődleges' : 'páratlan szinten másodlagos'} tulajdonságra. Az ár az új értéktől függ. ${S2('fejlesztes')}</p>
    <table className="tabla tabla--rovid"><caption className="cimke">Új érték → ár (fejlesztés)</caption><tbody><tr>
      <td>−1…5<br/><strong>1</strong></td><td>6…8<br/><strong>2</strong></td><td>9…12<br/><strong>3</strong></td>
    </tr></tbody></table>
    <${Szakasz} cim=${paros ? 'Elsődleges tulajdonságok' : 'Másodlagos tulajdonságok'}>
      <div className="valasztasok valasztasok--ket">${sajat.map((t) => kartya(t, false))}</div>
    <//>
    <${Lenyilo} cim=${paros ? 'Másodlagos tulajdonságok, figyelmeztetéssel' : 'Elsődleges tulajdonságok, figyelmeztetéssel'} db=${tobbi.length}>${tobbi.map((t) => kartya(t, true))}<//>
    <${LepesFigyelmeztetesek} figy=${figy} lepes="tulajdonsag"/>`;
}

// ================= 3. Fókusz =================
function Fokusz({ adat, valtoztat, n, lapElotte, ixMind, figy }) {
  const sz = S.szintBejegyzes(adat, n) || {};
  const [kereso, setKereso] = useState('');
  const { sajat, tobbi } = S.szintTulajdonsagok(ixMind, adat.osztaly, n);
  const paros = n % 2 === 0;
  const dupla = n >= 11;
  const fokuszok = ixMind.lista('Fókuszok').filter((f) => keresIllik(f, kereso));
  const kartya = (f, idegen) => {
    const megvan = lapElotte.fokuszok[f.id];
    const meta = megvan ? (dupla && megvan.bonusz < 3 ? `megvan: +2 → +3` : `megvan (+${megvan.bonusz})`) : forrasMeta(f);
    const figyelmeztetes = [idegen ? `${paros ? 'Elsődleges' : 'Másodlagos'} tulajdonság fókusza jár.` : '', megvan && !dupla ? 'Már megvan: a 11. szint előtt nem ad többet.' : ''].filter(Boolean).join(' ');
    return html`<${Valasztas} key=${f.id} elem=${f} meta=${meta} valasztott=${sz.fokusz === f.id} figy=${figyelmeztetes || null}
      onClick=${() => valtoztat((a) => S.fokuszBeallit(a, n, f.id))}/>`;
  };
  const csoport = (t, idegen) => {
    const lista = fokuszok.filter((f) => f.tulajdonsag === t);
    if (!lista.length) return null;
    return html`<div key=${t} className="verem"><p className="cimke"><${TulNev} ix=${ixMind} t=${t}/></p>
      <div className="valasztasok valasztasok--ket">${lista.map((f) => kartya(f, idegen))}</div></div>`;
  };
  const tobbiDb = fokuszok.filter((f) => tobbi.includes(f.tulajdonsag)).length;
  return html`<p className="sugo">Egy új fókusz jár, ${paros ? 'elsődleges' : 'másodlagos'} tulajdonságból.${dupla ? ' A 11. szinttől egy meglévő is választható: akkor +3.' : ''} ${S2('fokusz')}</p>
    ${sz.fokusz ? html`<${Uzenet} tonus="neutral">✓ Választott: ${fokuszNev(ixMind, sz.fokusz)}<//>` : null}
    <${Kereso} cimke="Fókusz keresése" ertek=${kereso} set=${setKereso}/>
    ${sajat.map((t) => csoport(t, false))}
    ${tobbiDb ? html`<details className="lenyilo" open=${!!kereso && !sajat.some((t) => fokuszok.some((f) => f.tulajdonsag === t))}>
      <summary>${paros ? 'Másodlagos' : 'Elsődleges'} tulajdonságok fókuszai, figyelmeztetéssel (${tobbiDb})</summary>
      <div className="verem">${tobbi.map((t) => csoport(t, true))}</div></details>` : null}
    <${LepesFigyelmeztetesek} figy=${figy} lepes="fokusz"/>`;
}

// ================= 4. Képességek (a Szintlépés lap szerint) =================
const fokozatSzoveg = (x) => (x.db ? (x.kovetkezo ? `${fokozatNev(x.db)} → ${x.kovetkezo}` : 'Mester (nincs több)') : 'új: Kezdő');
const fokozatLeiras = (e, fok) => rovid((fok === 'Mester' ? e.mester : fok === 'Haladó' ? e.halado : e.kezdo) || e.leiras_hu, 160);
function elofeltetelJelek(elem, lapElotte, ixMind) {
  const ef = V.elofeltetelek(elem, lapElotte, ixMind);
  const hiany = ef.filter((x) => x.ok === false);
  return {
    ok: ef.length && !hiany.length ? 'Feltétel: ' + ef.map((x) => x.szoveg + (x.ok ? ' ✓' : '')).join(', ') : null,
    figy: hiany.length ? 'Feltétel: ' + ef.map((x) => x.szoveg + (x.ok ? ' ✓' : x.ok === false ? ' ✗' : '')).join(', ') : null
  };
}

function FokozatosValaszto({ lista, tipus, adat, valtoztat, n, lapElotte, ixMind, csakUj, kereses }) {
  const [kereso, setKereso] = useState('');
  const valasztott = S.szintKapott(adat, n, tipus);
  const kartya = (x, idegen) => {
    const ef = elofeltetelJelek(x.elem, lapElotte, ixMind);
    const fig = [idegen ? 'Nem az osztályod listájáról.' : '', !x.kovetkezo ? 'Már Mester fokon van.' : '', ef.figy || ''].filter(Boolean).join(' ');
    return html`<${Valasztas} key=${x.id} elem=${x.elem} valasztott=${valasztott.includes(x.id)}
      meta=${fokozatSzoveg(x) + ' · ' + forrasMeta(x.elem)} leiras=${fokozatLeiras(x.elem, x.kovetkezo)}
      ok=${fig ? null : ef.ok} figy=${fig || null} onClick=${() => valtoztat((a) => S.egyValaszt(a, n, tipus, x.id))}/>`;
  };
  const szurt = lista.filter((x) => keresIllik(x.elem, kereso) && (!csakUj || !x.db));
  // Elöl a meglévők (következő fokozat), utánuk azok, amelyeknek az előfeltétele teljesül, végül a többi.
  const hianyos = (x) => (elofeltetelJelek(x.elem, lapElotte, ixMind).figy ? 1 : 0);
  const sajat = szurt.filter((x) => x.osztalynak).sort((a, b) => b.db - a.db || hianyos(a) - hianyos(b) || a.elem.nev_hu.localeCompare(b.elem.nev_hu, 'hu'));
  const tobbi = szurt.filter((x) => !x.osztalynak);
  return html`${kereses ? html`<${Kereso} cimke="Keresés" ertek=${kereso} set=${setKereso}/>` : null}
    <div className="valasztasok valasztasok--ket">${sajat.map((x) => kartya(x, false))}</div>
    <${Lenyilo} cim="Más osztályoké, figyelmeztetéssel" db=${tobbi.length}>${tobbi.map((x) => kartya(x, true))}<//>`;
}

function MagikusTalentum({ adat, valtoztat, n, lapElotte, ix, ixMind, forrasok }) {
  const lista = S.arkanumLehetosegek(ix, adat, n);
  const ark = S.szintKapott(adat, n, 'arkanum')[0] || null;
  const [mind, setMind] = useState(false);
  const meglevo = lista.filter((x) => x.db > 0);
  const uj = lista.filter((x) => !x.db && x.osztalynak);
  const kartya = (x) => html`<${Valasztas} key=${x.id} elem=${x.elem} valasztott=${ark === x.id}
    meta=${fokozatSzoveg(x)} leiras=${x.db && x.kovetkezo === 'Haladó' && reszletek(x.elem).fokusz ? 'Haladó fokon jár a ' + fokuszNev(ixMind, reszletek(x.elem).fokusz) + ' fókusz is.' : rovid(x.elem.leiras_hu, 110)}
    figy=${x.kovetkezo ? null : 'Már Mester fokon van.'} onClick=${() => valtoztat((a) => S.arkanumValaszt(a, ix, n, x.id, forrasok))}/>`;
  const sv = ark ? S.szintVarazslatok(ix, adat, n, ark, forrasok) : null;
  const vars = S.szintKapott(adat, n, 'varazslat');
  return html`
    ${meglevo.length ? html`<p className="cimke">Meglévő arkánumaid</p><div className="valasztasok valasztasok--ket">${meglevo.map(kartya)}</div>` : null}
    <details className="lenyilo" open=${mind || !meglevo.length} onToggle=${(e) => setMind(e.target.open)}>
      <summary>Új arkánum, Kezdő fokozat (${uj.length})</summary>
      <div className="valasztasok valasztasok--ket">${uj.map(kartya)}</div>
    </details>
    ${sv ? html`<${Szakasz} cim=${html`${elemNev(ixMind, 'Arkánumok', ark)}, ${sv.fokozat}: ${sv.valaszthato ? `válassz ${sv.db} varázslatot (${vars.length} / ${sv.db})` : 'a fokozat varázslata'}${S2('varazslat')}`}
      sugo=${sv.valaszthato ? (sv.ismert.length ? 'Ami már megvan, nem látszik a listában.' : null) : 'Csak az Alapkönyv aktív, ezért a varázslat adott.'}>
      <div className="valasztasok">${sv.lista.map((vid) => {
        const v = ixMind.elem('Varázslatok', vid);
        const r = reszletek(v);
        const meta = [v.fokozat, r.mp && r.mp.min ? r.mp.min + (r.mp.plusz ? '+' : '') + ' MP' : (v.mp_koltseg ? v.mp_koltseg + ' MP' : ''), forrasMeta(v)].filter(Boolean).join(' · ');
        return sv.valaszthato
          ? html`<${Valasztas} key=${vid} elem=${v} meta=${meta} leiras=${rovid(v.leiras_hu, 120)} valasztott=${vars.includes(vid)} onClick=${() => valtoztat((a) => S.varazslatValt(a, n, vid))}/>`
          : html`<${Valasztas} key=${vid} elem=${v} meta=${meta + ' · jár'} leiras=${rovid(v.leiras_hu, 120)} fix=${true}/>`;
      })}${!sv.lista.length ? html`<p className="sugo">Ehhez a fokozathoz nincs több új varázslat a szabályadatban.</p>` : null}</div>
    <//>` : null}`;
}

function SpecializacioFokozat({ kp, adat, valtoztat, n, ix, lapElotte, ixMind }) {
  const meglevo = S.meglevoSpecializaciok(adat, n);
  const lista = S.specializacioLehetosegek(ix, adat, n);
  const javaslat = S.specFokozatJavaslat(adat, kp);
  if (!meglevo.length) {
    return html`<${Uzenet} tonus="warning">A karakternek még nincs specializációja, amelynek a fokozata nőhetne. Választhatsz most egyet (figyelmeztetéssel).<//>
      <${FokozatosValaszto} lista=${lista} tipus="specializacio" adat=${adat} valtoztat=${valtoztat} n=${n} lapElotte=${lapElotte} ixMind=${ixMind} kereses=${true}/>`;
  }
  return html`<div className="valasztasok valasztasok--ket">${lista.filter((x) => meglevo.includes(x.id)).map((x) => html`<${Valasztas} key=${x.id} elem=${x.elem}
      valasztott=${S.szintKapott(adat, n, 'specializacio').includes(x.id)} meta=${fokozatSzoveg(x)}
      leiras=${fokozatLeiras(x.elem, x.kovetkezo)} ok=${x.id === javaslat ? `A ${kp.specializacio_szint}. szinten választott specializáció.` : null}
      figy=${x.kovetkezo ? null : 'Már Mester fokon van.'} onClick=${() => valtoztat((a) => S.egyValaszt(a, n, 'specializacio', x.id))}/>`)}</div>`;
}

function Kepessegek(p) {
  const { adat, valtoztat, n, lapElotte, ix, ixMind, figy } = p;
  const kps = S.szintKepessegek(ixMind, adat.osztaly, n);
  const fix = kps.filter((k) => ['kepesseg', 'mutatvany_kedvezmeny', 'mp'].includes(k.tipus));
  const valasztos = kps.filter((k) => !fix.includes(k) && k.tipus !== 'talentum_valasztas');
  const ismertCsoport = new Set(lapElotte.fegyvercsoportok.map((c) => c.id));
  const resz = (kp, i) => {
    const kulcs = kp.tipus + i;
    if (kp.tipus === 'talentum') {
      return html`<${Szakasz} key=${kulcs} cim=${html`${kp.nev_hu || 'Új talentum'}${S2('talentum')}`} sugo="Új talentum Kezdő fokon, vagy egy meglévő következő fokozata.">
        <${FokozatosValaszto} lista=${S.talentumLehetosegek(ix, adat, n)} tipus="talentum" adat=${adat} valtoztat=${valtoztat} n=${n} lapElotte=${lapElotte} ixMind=${ixMind} kereses=${true}/>
      <//>`;
    }
    if (kp.tipus === 'magikus_talentum') {
      return html`<${Szakasz} key=${kulcs} cim=${html`${kp.nev_hu || 'Új mágikus talentum'}${S2('arkanum')}`}><${MagikusTalentum} ...${p}/><//>`;
    }
    if (kp.tipus === 'specializacio') {
      return html`<${Szakasz} key=${kulcs} cim=${html`${kp.nev_hu || 'Új specializáció'} (Kezdő fokozat)${S2('specializacio')}`}>
        <${FokozatosValaszto} lista=${S.specializacioLehetosegek(ix, adat, n)} tipus="specializacio" adat=${adat} valtoztat=${valtoztat} n=${n} lapElotte=${lapElotte} ixMind=${ixMind} csakUj=${true} kereses=${true}/>
      <//>`;
    }
    if (kp.tipus === 'specializacio_fokozat') {
      return html`<${Szakasz} key=${kulcs} cim=${html`${kp.nev_hu || 'Specializáció új fokozata'}${kp.fokozat ? ` (${kp.fokozat})` : ''}${S2('specializacio')}`}>
        <${SpecializacioFokozat} kp=${kp} ...${p}/>
      <//>`;
    }
    if (kp.tipus === 'fegyvercsoport') {
      const valasztott = S.szintKapott(adat, n, 'fegyvercsoport');
      return html`<${Szakasz} key=${kulcs} cim=${html`${kp.nev_hu || 'Új fegyvercsoport'}${S2('fegyvercsoport')}`}
        sugo=${'Megvan: ' + lapElotte.fegyvercsoportok.map((c) => c.nev_hu).join(', ') + '.'}>
        <div className="csipek">${ixMind.lista('Fegyvercsoportok').filter((c) => !ismertCsoport.has(c.id)).map((c) => html`<${Csip} key=${c.id} be=${valasztott.includes(c.id)}
          onClick=${() => valtoztat((a) => S.egyValaszt(a, n, 'fegyvercsoport', c.id))}>${c.nev_hu}<//>`)}</div>
      <//>`;
    }
    if (kp.tipus === 'fokusz_valasztas') {
      const valasztott = S.szintKapott(adat, n, 'fokusz');
      return html`<${Szakasz} key=${kulcs} cim=${kp.nev_hu || 'Új fókusz'} sugo=${kp.leiras ? rovid(kp.leiras, 200) : null}>
        <div className="valasztasok valasztasok--ket">${(kp.valaszthato || []).map((id) => {
          const megvan = lapElotte.fokuszok[id];
          return html`<${Valasztas} key=${id} nev=${fokuszNev(ixMind, id)} meta=${megvan ? 'megvan (+' + megvan.bonusz + ')' : ''}
            valasztott=${valasztott.includes(id)} figy=${megvan && n < 11 ? 'Már megvan: válassz inkább másikat.' : null}
            onClick=${() => valtoztat((a) => S.egyValaszt(a, n, 'fokusz', id))}/>`;
        })}</div>
      <//>`;
    }
    return html`<${Uzenet} key=${kulcs} tonus="neutral">ⓘ ${kp.nev_hu || kp.tipus}: ennek a választónak még nincs felülete, kézi módosítóként vehető fel.<//>`;
  };
  return html`
    ${!kps.length ? html`<${Uzenet} tonus="neutral">ⓘ A Szintlépés lapon ehhez a szinthez nincs osztályképesség.<//>` : null}
    ${valasztos.length ? null : (kps.length ? html`<p className="sugo">Ezen a szinten nincs mit választani, a képességek járnak.</p>` : null)}
    ${valasztos.map(resz)}
    ${fix.length ? html`<${Szakasz} cim=${`Jár a(z) ${n}. szinten`}>
      <div className="valasztasok">${fix.map((k, i) => html`<${Valasztas} key=${i} fix=${true} nev=${k.nev_hu} en=${k.nev_en || ''} meta="jár" leiras=${rovid(k.leiras, 240)}/>`)}</div>
    <//>` : null}
    <${LepesFigyelmeztetesek} figy=${figy} lepes="kepessegek"/>`;
}

// ================= 5. Áttekintés =================
function Attekintes({ adat, valtoztat, n, cel, lap, lapElotte, lapKesz, ixMind, dm, ugras, figy, elvetes }) {
  const valt = S.szintValtozasok(lapElotte, lap, (t) => tulNev(ixMind, t));
  const beirt = (adat.dobasok || []).filter((d) => d.kezi && (d.mire === 'egeszseg:' + n || d.mire === 'mp:' + n));
  const minden = figy;
  const elfogadottak = (lapKesz.figyelmeztetesek || []).filter((f) => f.elfogadott && !(lapElotte.figyelmeztetesek || []).some((x) => x.kulcs === f.kulcs));
  const elfogad = (kulcs, be) => valtoztat((a) => { const s = new Set(a.elfogadott || []); be ? s.add(kulcs) : s.delete(kulcs); a.elfogadott = [...s]; });
  // Az eddigi szintek (ebben a szintlépésben és korábban) rövid összefoglalója.
  const sorok = adat.szintek.filter((s) => s.szint >= 2 && s.szint <= n).map((s) => {
    const eg = (lap.egeszseg.reszek || []).filter((r) => r.szint === s.szint).reduce((x, r) => x + r.ertek, 0);
    const kap = (s.kapott || []).map((k) => {
      const lapNev = { talentum: 'Talentumok', arkanum: 'Arkánumok', specializacio: 'Specializációk', varazslat: 'Varázslatok', fegyvercsoport: 'Fegyvercsoportok' }[k.tipus];
      return k.tipus === 'fokusz' ? fokuszNev(ixMind, k.id) : elemNev(ixMind, lapNev, k.id);
    });
    return { szint: s.szint, eg, fejlesztes: s.fejlesztes ? tulNev(ixMind, s.fejlesztes) : '–', fokusz: s.fokusz ? fokuszNev(ixMind, s.fokusz) : '–', kap: kap.join(', ') || '–' };
  });
  return html`<p className="sugo">Ez változott a(z) ${n}. szinten. Bármelyik lépésre visszaléphetsz, a számok újraszámolódnak.</p>
    <ul className="valtlista">${valt.map((x, i) => html`<li key=${i}><span>${x.nev}</span><strong>${x.szoveg !== undefined ? x.szoveg : html`${x.regi} → <span className="uj">${x.uj}</span>`}</strong></li>`)}
      ${!valt.length ? html`<li><span className="halvany">Még nincs változás.</span></li>` : null}</ul>
    <${Szakasz} cim=${`Figyelmeztetések (${minden.length})`}>
      ${!minden.length && !elfogadottak.length ? html`<${Uzenet} tonus="success">Ezen a szinten nincs szabályeltérés.<//>` : null}
      ${minden.map((f) => html`<div key=${f.kulcs} className="uzenet uzenet--warning figyuzenet" role="status">
        <span>⚠ ${f.uzenet}</span>
        <span className="figyuzenet__gombok">
          <button type="button" className="figygomb" onClick=${() => ugras(S.szintFigyLepese(f))}>Ugrás: ${S.SZINT_LEPESEK[S.szintLepesSzam(S.szintFigyLepese(f))].cim}</button>
          ${dm ? html`<button type="button" className="figygomb figygomb--halk" onClick=${() => elfogad(f.kulcs, true)}>Elfogadom (DM)</button>` : null}
        </span>
      </div>`)}
      ${elfogadottak.map((f) => html`<div key=${f.kulcs} className="uzenet uzenet--elfogadott figyuzenet" role="status">
        <span>✓ Elfogadva: ${f.uzenet}</span>
        ${dm ? html`<span className="figyuzenet__gombok"><button type="button" className="figygomb figygomb--halk" onClick=${() => elfogad(f.kulcs, false)}>Elfogadás visszavonása</button></span>` : null}
      </div>`)}
      ${!dm && minden.length ? html`<p className="sugo">A figyelmeztetések nem tiltanak semmit. A DM egyenként elfogadhatja őket.</p>` : null}
      ${beirt.length ? html`<${Uzenet} tonus="neutral">ⓘ Kézzel beírt dobás ezen a szinten: ${beirt.length}. A karakter naplójában látszik.<//>` : null}
    <//>
    ${sorok.length > 1 ? html`<${Szakasz} cim="Szintek eddig">
      <div className="tablazat-keret"><table className="tabla">
        <thead><tr><th>Szint</th><th className="szam">Egészség</th><th>Fejlesztés</th><th>Fókusz</th><th>Képesség</th></tr></thead>
        <tbody>${sorok.map((s) => html`<tr key=${s.szint} className=${s.szint === n ? 'kiemelt' : ''}>
          <td>${s.szint}.</td><td className="szam">${elojel(s.eg)}</td><td>${s.fejlesztes}</td><td>${s.fokusz}</td><td>${s.kap}</td></tr>`)}</tbody>
      </table></div>
    <//>` : null}
    <div className="sorban" style=${{ justifyContent: 'space-between', alignItems: 'center' }}>
      <span className="sugo">${n < cel ? `Utána a(z) ${n + 1}. szint következik (cél: ${cel}. szint).` : 'Ez az utolsó kért szint. A Kész gomb lezárja.'}</span>
      <${K.Button} variant="quiet" onClick=${elvetes}>Szint elvetése<//>
    </div>`;
}

export const SZINTLEPES_KOMPONENSEK = { egeszseg: Egeszseg, tulajdonsag: Tulajdonsag, fokusz: Fokusz, kepessegek: Kepessegek, attekintes: Attekintes };
