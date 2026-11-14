// XP kiosztása (csak DM): a kampány nézetéből a csapatnak, vagy a karakter oldaláról egy karakternek.
// Találkozásonként az Alapkönyv besorolása (rutin 0, könnyű 100, közepes 250, nehéz 400), a kaland végi
// bónusz, egyéni szerepjáték-jutalom, szintjutalom (a következő szinthez hiányzó XP) vagy javítás.
import { html, K, useApp, useState, useMemo, Parbeszed, Uzenet, Jelolo } from './kozos.js';
import { index } from '../karakter/szabalyindex.js';
import { XP_TALALKOZAS, XP_TIPUSOK, szintjutalomXp, xpSzint, xpKuszob } from '../karakter/xp.js';

const SUGO = {
  talalkozas: 'A játékalkalom végén minden találkozást értékelj: mennyire volt nehéz a csapatnak, mennyi erőforrás (pénz, Egészség, Mágiapont) fogyott. A résztvevő karakterek mind megkapják a besorolás szerinti XP-t (Alapkönyv 117–118. o.).',
  bonusz: 'Egy kaland vagy hosszabb történetszál sikeres lezárásakor. Általában legfeljebb annyi, mint egy nehéz találkozás (400), hacsak a teljesítmény nem kiemelkedő. Kisebb részletekben is adható, például egy-egy felvonás végén (Kampányépítő).',
  szerep: 'Egyéni jutalom jó szerepjátékért (a karakterhez hű döntések, a csapat lelkesedésének fenntartása). Ha adsz ilyet, játékosonként és alkalmanként nagyjából egy közepes találkozásnyi (250) a javasolt. Van, aki nem ad, mert vitát szülhet.',
  szintjutalom: 'XP nélküli előrehaladás: egy nagy esemény (kaland vége, fontos cél) után a karakter egy szintet kap. Itt az XP-je a következő szint küszöbére áll, így a két módszer együtt is használható.',
  javitas: 'Tetszőleges összeg, negatív is lehet (elírás javítása).'
};

// karakterek: [{ id, nev, xp, szint }]. kampanyId: ha a kampány nézetéből indult. onKesz(valasz): a háttér válasza.
export function XpKiosztas({ karakterek, kampanyId, onBezar, onKesz }) {
  const { api, szabalyok, uzen } = useApp();
  const ix = useMemo(() => index((szabalyok.adat && szabalyok.adat.lapok) || {}), [szabalyok.adat]);
  const [kivalasztott, setKivalasztott] = useState(() => karakterek.map((c) => c.id));
  const [tipus, setTipus] = useState('talalkozas');
  const [besorolas, setBesorolas] = useState('kozepes');
  const [osszeg, setOsszeg] = useState({ bonusz: '400', szerep: '250', javitas: '' });
  const [ok, setOk] = useState('');
  const [fut, setFut] = useState(false);
  const [hiba, setHiba] = useState(null);

  const xpKarakterre = (c) => {
    if (tipus === 'talalkozas') return (XP_TALALKOZAS.find((x) => x.kulcs === besorolas) || { xp: 0 }).xp;
    if (tipus === 'szintjutalom') return szintjutalomXp(ix, c.xp || 0, Number(c.szint) || 1);
    return parseInt(String(osszeg[tipus] || '').replace('−', '-'), 10) || 0;
  };
  const tetelek = karakterek.filter((c) => kivalasztott.includes(c.id)).map((c) => ({ c, xp: xpKarakterre(c) }));
  const kuld = async () => {
    setFut(true); setHiba(null);
    try {
      const tipusNev = XP_TIPUSOK.find((x) => x.kulcs === tipus).nev;
      const leiras = ok.trim() || (tipus === 'talalkozas' ? `${tipusNev} (${XP_TALALKOZAS.find((x) => x.kulcs === besorolas).nev.toLowerCase()})` : tipusNev);
      const v = await api.hivas('character.xp', { tetelek: tetelek.map((t) => ({ karakter_id: t.c.id, xp: t.xp })), ok: leiras, tipus, kampany_id: kampanyId || '' });
      uzen(`XP kiosztva: ${tetelek.length} karakter.`);
      onKesz(v);
    } catch (e) {
      setHiba(e.kod === 'halozat' ? 'Nincs kapcsolat a szerverrel, az XP most nem osztható ki.' : (e.message || String(e)));
    } finally { setFut(false); }
  };
  const valt = (id, be) => setKivalasztott((k) => (be ? k.concat([id]) : k.filter((x) => x !== id)));
  return html`<${Parbeszed} cim=${karakterek.length > 1 ? 'XP kiosztása' : 'XP: ' + karakterek[0].nev} onBezar=${onBezar} lab=${html`
    <${K.Button} variant="quiet" onClick=${onBezar}>Mégse<//>
    <${K.Button} variant="primary" disabled=${fut || !tetelek.length || tetelek.every((t) => !t.xp)} onClick=${kuld}>${fut ? 'Kiosztás…' : 'Kiosztás'}<//>`}>
    <div className="verem">
      <div className="csipek" role="group" aria-label="Mire jár">
        ${XP_TIPUSOK.map((t) => html`<button key=${t.kulcs} type="button" className="csip" aria-pressed=${tipus === t.kulcs} onClick=${() => setTipus(t.kulcs)}>${t.nev}</button>`)}
      </div>
      <p className="sugo kicsi" style=${{ margin: 0 }}>${SUGO[tipus]}</p>
      ${tipus === 'talalkozas' ? html`<div className="valasztasok">${XP_TALALKOZAS.map((x) => html`<button key=${x.kulcs} type="button" className="valasztas" aria-pressed=${besorolas === x.kulcs} onClick=${() => setBesorolas(x.kulcs)}>
          <span className="valasztas__fej"><span className="valasztas__nev">${x.nev}</span><span className="valasztas__meta">${x.xp} XP</span></span>
          <span className="valasztas__leiras">${x.leiras}</span>
        </button>`)}</div>` : null}
      ${tipus === 'bonusz' || tipus === 'szerep' || tipus === 'javitas' ? html`<${K.TextField} label="XP karakterenként" inputMode="numeric" value=${osszeg[tipus]}
        onChange=${(e) => setOsszeg({ ...osszeg, [tipus]: e.target.value.replace(/[^0-9−-]/g, '').slice(0, 6) })}/>` : null}
      <${K.TextField} label="Mire (a naplóba)" hint="Például: rajtaütés az erdőben, a torony kalandja." value=${ok} onChange=${(e) => setOk(e.target.value)}/>
      <fieldset className="szakasz">
        <legend className="cimke">Kik kapják</legend>
        ${karakterek.map((c) => {
          const t = tetelek.find((x) => x.c.id === c.id);
          const uj = (c.xp || 0) + (t ? t.xp : 0);
          const elerheto = t && xpSzint(ix, uj) > (Number(c.szint) || 1);
          return html`<div key=${c.id} className="xpkiosztas__sor">
            ${karakterek.length > 1 ? html`<${Jelolo} checked=${kivalasztott.includes(c.id)} onChange=${(be) => valt(c.id, be)}>${c.nev}<//>` : html`<strong>${c.nev}</strong>`}
            <span className="halvany kicsi">${c.xp || 0}${t ? ` → ${uj}` : ''} XP${elerheto ? ' · szintlépés elérhető' : ''}${!t ? '' : ` (következő szint: ${xpKuszob(ix, (Number(c.szint) || 1) + 1) || '–'})`}</span>
          </div>`;
        })}
      </fieldset>
      ${hiba ? html`<${Uzenet}>${hiba}<//>` : null}
    </div>
  <//>`;
}
