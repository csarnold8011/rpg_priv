// Nyitóoldal: belépés névvel és jelszóval. Ha az eszközön még nincs beállítva a szerver
// címe, itt adható meg (vagy a DM meghívó linkje állítja be).
import { html, K, useApp, useState, useEffect, Uzenet, Ikon, tarOlvas, temaBeallitasa } from './kozos.js';

export function Belepes({ onBelepett }) {
  const { api } = useApp();
  const [nev, setNev] = useState(tarOlvas('fage.utolso_nev', ''));
  const [jelszo, setJelszo] = useState('');
  const [url, setUrl] = useState(api.url || '');
  const [urlNyitva, setUrlNyitva] = useState(!api.url);
  const [hiba, setHiba] = useState(null);
  const [fut, setFut] = useState(false);
  useEffect(() => { temaBeallitasa(tarOlvas('fage.birodalom', 'dm')); }, []);

  const kuld = async (e) => {
    e.preventDefault();
    setHiba(null);
    if (urlNyitva) {
      const u = url.trim();
      if (!/^https:\/\/script\.google\.com\/macros\/s\/.+\/exec$/.test(u) && !/^http:\/\/(localhost|127\.0\.0\.1)/.test(u)) {
        setHiba({ mezo: 'url', uzenet: 'A cím így kezdődik: https://script.google.com/macros/s/ és /exec a vége.' });
        return;
      }
      api.beallitUrl(u);
    }
    if (!nev.trim()) { setHiba({ mezo: 'nev', uzenet: 'Írd be a neved.' }); return; }
    if (!jelszo) { setHiba({ mezo: 'jelszo', uzenet: 'Írd be a jelszavad.' }); return; }
    setFut(true);
    try {
      const v = await api.belepes(nev.trim(), jelszo);
      try { localStorage.setItem('fage.utolso_nev', JSON.stringify(nev.trim())); } catch (x) { /* nem baj */ }
      onBelepett(v);
    } catch (err) {
      setHiba({ uzenet: err.message });
      setFut(false);
    }
  };

  return html`<main className="nyito">
    <div className="nyito__doboz">
      <h1 className="nyito__cim">Fantasy AGE</h1>
      <p className="nyito__alcim">Családi kalandkönyv</p>
      <${K.Divider}/>
      <form className="verem" onSubmit=${kuld} noValidate>
        <${K.TextField} label="Név" autoComplete="username" autoCapitalize="words" value=${nev}
          onChange=${(e) => setNev(e.target.value)} error=${hiba && hiba.mezo === 'nev' ? hiba.uzenet : undefined}/>
        <${K.TextField} label="Jelszó" type="password" autoComplete="current-password" value=${jelszo}
          onChange=${(e) => setJelszo(e.target.value)} error=${hiba && hiba.mezo === 'jelszo' ? hiba.uzenet : undefined}/>
        ${urlNyitva ? html`<${K.TextField} label="Szerver címe" placeholder="https://script.google.com/macros/s/.../exec"
          hint="Egyszer kell megadni ezen az eszközön. A DM meghívó linkje beállítja helyetted." value=${url}
          inputMode="url" autoCapitalize="off" spellCheck=${false}
          onChange=${(e) => setUrl(e.target.value)} error=${hiba && hiba.mezo === 'url' ? hiba.uzenet : undefined}/>` : null}
        ${hiba && !hiba.mezo ? html`<${Uzenet}>${hiba.uzenet}<//>` : null}
        <${K.Button} type="submit" variant="primary" size="lg" disabled=${fut}>${fut ? 'Belépés…' : 'Belépés'}<//>
      </form>
      ${urlNyitva ? null : html`<p className="nyito__lab">
        <${K.Button} variant="quiet" size="md" onClick=${() => setUrlNyitva(true)}
          icon=${html`<${Ikon} nev="terkep" meret=${20}/>`}>Szerver címének módosítása<//>
      </p>`}
    </div>
  </main>`;
}
