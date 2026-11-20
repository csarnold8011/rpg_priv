// Kampányjátszó 6.4: a játékos Kalandnapló füle (a DM által közzétett alkalmak játékosoknak szóló része) és a fül jelvénye.
// Külön modul, hogy a játékos felülete a DM Játék nézetének moduljai nélkül töltődjön be. A DM oldala: alkalom.js.
import { html, K, useApp, useState, useEffect } from './kozos.js';
import { alkalomCim, valosIdoSzoveg, jatekbeliIdoSzoveg } from '../kampany/alkalom_ido.js';

const A = { alkalomCim, valosIdoSzoveg, jatekbeliIdoSzoveg };

export function JatekosKalandnaplo({ allapot }) {
  const lista = allapot.kalandnaplo || [];
  if (!lista.length) return html`<${K.Panel} title="Kalandnapló"><p className="halvany">A DM itt teszi közzé az alkalmak összefoglalóját. Még nincs ilyen.</p><//>`;
  return html`<div className="verem">${lista.map((x) => html`<${K.Panel} key=${x.id} title=${A.alkalomCim(x)}>
    <div className="verem verem--kicsi">
      <p className="halvany kicsi">${A.valosIdoSzoveg(x)}${A.jatekbeliIdoSzoveg(x) ? html`<br/>Játékbeli idő: ${A.jatekbeliIdoSzoveg(x)}` : null}</p>
      ${x.szoveg ? html`<p className="szoveg tordelt">${x.szoveg}</p>` : null}
      ${x.szereplok && x.szereplok.length ? html`<div><p className="cimke">Akikkel találkoztatok</p>
        <ul className="kalandnaplo__szereplok">${x.szereplok.map((s, i) => html`<li key=${i}><strong>${s.nev}</strong>${s.jegyzet ? html`<span className="halvany">: ${s.jegyzet}</span>` : null}</li>`)}</ul></div>` : null}
    </div>
  <//>`)}</div>`;
}

// A játékos fülének jelvénye: a legutóbbi megnyitás óta közzétett alkalmak száma (eszközönként).
export function useKalandnaploJelveny(allapot, nyitva) {
  const { felhasznalo } = useApp();
  const kulcs = 'fage.kn.' + felhasznalo.id + '.' + allapot.kampany.id;
  const lista = allapot.kalandnaplo || [];
  const [latott, setLatott] = useState(() => { try { return JSON.parse(localStorage.getItem(kulcs)) || null; } catch (e) { return null; } });
  const idk = lista.map((x) => x.id);
  useEffect(() => {
    if (!nyitva && latott !== null) return;
    const uj = nyitva || latott === null ? idk : latott;
    if (JSON.stringify(uj) === JSON.stringify(latott)) return;
    try { localStorage.setItem(kulcs, JSON.stringify(uj)); } catch (e) { /* nem baj */ }
    setLatott(uj);
  }, [nyitva, idk.join()]); // eslint-disable-line
  return latott ? idk.filter((id) => !latott.includes(id)).length : 0;
}
