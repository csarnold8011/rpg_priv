// Hívások az Apps Script háttérhez. Minden kérés text/plain POST, így a böngésző
// nem küld előzetes CORS-kérést (azt az Apps Script nem tudná kezelni).

const TAROLO_KULCS = 'fage.munkamenet';
const URL_KULCS = 'fage.api_url';

function olvas(kulcs) {
  try { return JSON.parse(localStorage.getItem(kulcs)); } catch (e) { return null; }
}
function ir(kulcs, ertek) {
  try {
    if (ertek === null) localStorage.removeItem(kulcs);
    else localStorage.setItem(kulcs, JSON.stringify(ertek));
  } catch (e) { /* privát mód: csak memóriában marad */ }
}

export class ApiHiba extends Error {
  constructor(kod, uzenet, valasz) {
    super(uzenet || kod);
    this.kod = kod;          // pl. 'utkozes', 'nincs_jogosultsag', 'halozat'
    this.valasz = valasz || null;
  }
}

export class Api {
  constructor(url) {
    this.url = url || olvas(URL_KULCS) || window.FAGE_API_URL || '';
    this.munkamenet = olvas(TAROLO_KULCS); // { token, felhasznalo }
    this.kijelentkezesFigyelok = [];
  }

  beallitUrl(url) { this.url = url; ir(URL_KULCS, url); }
  get felhasznalo() { return this.munkamenet ? this.munkamenet.felhasznalo : null; }
  get bejelentkezve() { return !!(this.munkamenet && this.munkamenet.token); }

  async hivas(action, adat) {
    if (!this.url) throw new ApiHiba('nincs_url', 'Nincs megadva a háttérszolgáltatás címe.');
    let valasz;
    try {
      const v = await fetch(this.url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, token: this.munkamenet && this.munkamenet.token, adat: adat || {} })
      });
      valasz = await v.json();
    } catch (e) {
      throw new ApiHiba('halozat', 'Nincs kapcsolat a szerverrel.');
    }
    if (!valasz.ok) {
      if (valasz.hiba === 'nincs_bejelentkezve' || valasz.hiba === 'lejart') this.kijelentkezes();
      throw new ApiHiba(valasz.hiba, valasz.uzenet, valasz);
    }
    return valasz;
  }

  async belepes(nev, jelszo) {
    const v = await this.hivas('login', { nev, jelszo });
    this.munkamenet = { token: v.token, felhasznalo: v.felhasznalo };
    ir(TAROLO_KULCS, this.munkamenet);
    return v;
  }

  kijelentkezes() {
    this.munkamenet = null;
    ir(TAROLO_KULCS, null);
    this.kijelentkezesFigyelok.forEach(fn => fn());
  }

  onKijelentkezes(fn) { this.kijelentkezesFigyelok.push(fn); }
}
