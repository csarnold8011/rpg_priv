// Szinkronréteg. A felületek csak ezt az interfészt látják:
//   connect(kampanyId), subscribe(fn), push(valtozas), pull(), status(), disconnect()
// Az első megvalósítás az Apps Script háttérre épül (lekérdezés pár másodpercenként).
// Később Firebase-re cserélhető ugyanezzel az interfésszel.
//
// Események (subscribe): { tipus: 'allapot', allapot }   új kampányállapot érkezett
//                        { tipus: 'statusz', statusz }   online/offline, várakozó mentések
//                        { tipus: 'utkozes', valtozas, aktualis }  a szerver újabb verziót tárol
//                        { tipus: 'hiba', valtozas, hiba }        a szerver elutasította a változást

const SOR_KULCS = 'fage.varakozo';

function sorOlvasas() {
  try { return JSON.parse(localStorage.getItem(SOR_KULCS)) || []; } catch (e) { return []; }
}
function sorIras(sor) {
  try { localStorage.setItem(SOR_KULCS, JSON.stringify(sor)); } catch (e) { /* memóriában marad */ }
}

export class AppsScriptSync {
  constructor(api, beallitas = {}) {
    this.api = api;
    this.idokoz = beallitas.idokoz || 3000;           // ennyi ms-enként kérdez rá a változásra
    this.hatterIdokoz = beallitas.hatterIdokoz || 20000; // ha a lap a háttérben van
    this.kampanyId = null;
    this.verzio = null;
    this.allapot = null;
    this.figyelok = new Set();
    this.sor = sorOlvasas();          // még fel nem küldött változások (kiesés alatt is megmaradnak)
    this.online = navigator.onLine !== false;
    this.utolsoSzinkron = null;
    this._idozito = null;
    this._kuldesFolyik = false;
    this._futo = false;

    window.addEventListener('online', () => { this.online = true; this._statusz(); this._sorKuldese(); this._kovetkezo(0); });
    window.addEventListener('offline', () => { this.online = false; this._statusz(); });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) this._kovetkezo(0); });
    if (this.sor.length && this.api.bejelentkezve) setTimeout(() => this._sorKuldese(), 0); // előző alkalomról maradt mentések
  }

  // ---- nyilvános interfész ----

  async connect(kampanyId) {
    this.disconnect();
    this.kampanyId = kampanyId;
    this.verzio = null;
    this._futo = true;
    await this.pull();
    this._sorKuldese();
    this._kovetkezo(this.idokoz);
  }

  disconnect() {
    this._futo = false;
    clearTimeout(this._idozito);
    if (this.kampanyId) { this.kampanyId = null; this._statusz(); }
  }

  subscribe(fn) {
    this.figyelok.add(fn);
    if (this.allapot) fn({ tipus: 'allapot', allapot: this.allapot });
    return () => this.figyelok.delete(fn);
  }

  async pull() {
    if (!this.kampanyId) return null;
    const v = await this.api.hivas('state.get', { kampany_id: this.kampanyId });
    this.allapot = v;
    this.verzio = v.verzio;
    this.utolsoSzinkron = new Date();
    this._kuld({ tipus: 'allapot', allapot: v });
    this._statusz();
    return v;
  }

  // valtozas: { action: 'character.save' | 'roll.log' | ..., adat: {...} }
  // A felület előbb frissíti a képernyőt (optimista frissítés), aztán hívja ezt.
  // A visszaadott ígéret a szerver válaszával teljesül; kiesés alatt akkor, amikor végül felment.
  push(valtozas) {
    return new Promise((teljesul, elutasit) => {
      const elem = { azonosito: Date.now() + '-' + Math.random().toString(36).slice(2), ...valtozas };
      this.sor.push(elem);
      sorIras(this.sor);
      this._varok = this._varok || {};
      this._varok[elem.azonosito] = { teljesul, elutasit };
      this._statusz();
      this._sorKuldese();
    });
  }

  // Kilépéskor: a még fel nem küldött változások eldobása, hogy a következő belépő
  // felhasználó nevében ne menjenek fel.
  elvetes() {
    const varok = this._varok || {};
    this.sor.forEach(elem => { if (varok[elem.azonosito]) varok[elem.azonosito].elutasit(new Error('A mentés kilépés miatt elmaradt.')); });
    this.sor = [];
    this._varok = {};
    sorIras(this.sor);
    this._statusz();
  }

  status() {
    return {
      kampanyId: this.kampanyId,
      online: this.online,
      varakozo: this.sor.length,
      verzio: this.verzio,
      utolsoSzinkron: this.utolsoSzinkron
    };
  }

  // ---- belső működés ----

  _kuld(esemeny) { this.figyelok.forEach(fn => { try { fn(esemeny); } catch (e) { console.error(e); } }); }
  _statusz() { this._kuld({ tipus: 'statusz', statusz: this.status() }); }

  _kovetkezo(ms) {
    clearTimeout(this._idozito);
    if (!this._futo) return;
    this._idozito = setTimeout(() => this._figyeles(), ms);
  }

  async _figyeles() {
    if (!this._futo) return;
    try {
      const v = await this.api.hivas('state.poll', { kampany_id: this.kampanyId });
      this.online = true;
      if (v.verzio !== this.verzio) await this.pull();
    } catch (e) {
      if (e.kod === 'halozat') { this.online = false; this._statusz(); }
    }
    this._kovetkezo(document.hidden ? this.hatterIdokoz : this.idokoz);
  }

  async _sorKuldese() {
    if (this._kuldesFolyik) return;
    this._kuldesFolyik = true;
    try {
      while (this.sor.length) {
        const elem = this.sor[0];
        let valasz = null, hiba = null;
        try {
          valasz = await this.api.hivas(elem.action, elem.adat);
          this.online = true;
        } catch (e) {
          if (e.kod === 'halozat') { this.online = false; this._statusz(); break; } // marad a sorban, később újra
          hiba = e;
        }
        this.sor.shift();
        sorIras(this.sor);
        const var_ = this._varok && this._varok[elem.azonosito];
        if (hiba) {
          if (hiba.kod === 'utkozes') this._kuld({ tipus: 'utkozes', valtozas: elem, aktualis: hiba.valasz && hiba.valasz.aktualis });
          else this._kuld({ tipus: 'hiba', valtozas: elem, hiba });
          if (var_) var_.elutasit(hiba);
        } else {
          // ugyanannak a karakternek a következő, még várakozó mentése már az új verzióra épül
          if (elem.action === 'character.save') {
            this.sor.filter(x => x.action === 'character.save' && x.adat.id === elem.adat.id)
              .forEach(x => { x.adat.verzio = valasz.verzio; });
            sorIras(this.sor);
          }
          if (var_) var_.teljesul(valasz);
        }
        if (var_) delete this._varok[elem.azonosito];
        this._statusz();
      }
    } finally {
      this._kuldesFolyik = false;
    }
    if (this.sor.length && !this.online) setTimeout(() => this._sorKuldese(), 10000);
  }
}
