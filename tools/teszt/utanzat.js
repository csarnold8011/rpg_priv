// A Google szolgáltatások (Sheets, Drive, Properties, Cache, Lock, Utilities) memóriabeli utánzata.
// A háttér helyi tesztje (futtat.js) és a helyi fejlesztői szerver (tools/helyi_szerver.js) használja.
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const crypto = require('crypto');

function letrehoz() {
  // ---------- Google szolgáltatások utánzata ----------
  let idSzamlalo = 0;
  const ujId = () => 'id' + (++idSzamlalo);
  const tarolt = (v) => (typeof v === 'string' && v.startsWith("'")) ? v.slice(1) : v;

  class Tartomany {
    constructor(lap, r, c, nr, nc) { Object.assign(this, { lap, r, c, nr, nc }); }
    getValues() {
      const ki = [];
      for (let i = 0; i < this.nr; i++) {
        const sor = [];
        for (let j = 0; j < this.nc; j++) {
          const s = this.lap.adat[this.r - 1 + i];
          sor.push(s && s[this.c - 1 + j] !== undefined ? s[this.c - 1 + j] : '');
        }
        ki.push(sor);
      }
      return ki;
    }
    setValues(v) {
      v.forEach((sor, i) => sor.forEach((x, j) => this.lap.cella(this.r + i, this.c + j, x)));
      return this;
    }
    setValue(x) { this.lap.cella(this.r, this.c, x); return this; }
    setFontWeight() { return this; }
  }

  class Lap {
    constructor(nev) { this.nev = nev; this.adat = []; }
    cella(r, c, x) {
      while (this.adat.length < r) this.adat.push([]);
      this.adat[r - 1][c - 1] = tarolt(x);
    }
    getName() { return this.nev; }
    getLastRow() { return this.adat.length; }
    getLastColumn() { return this.adat.reduce((m, s) => Math.max(m, s.length), 0); }
    getDataRange() { return new Tartomany(this, 1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
    getRange(r, c, nr, nc) { return new Tartomany(this, r, c, nr || 1, nc || 1); }
    appendRow(sor) { this.adat.push(sor.map(tarolt)); }
    deleteRow(r) { this.adat.splice(r - 1, 1); }
    setFrozenRows() {}
  }

  class Tablazat {
    constructor(cim) { this.id = ujId(); this.cim = cim; this.lapok = [new Lap('Munkalap1')]; }
    getId() { return this.id; }
    getUrl() { return 'https://docs/' + this.id; }
    getSheetByName(n) { return this.lapok.find(l => l.nev === n) || null; }
    insertSheet(n) { const l = new Lap(n); this.lapok.push(l); return l; }
    getSheets() { return this.lapok.slice(); }
    deleteSheet(l) { this.lapok = this.lapok.filter(x => x !== l); }
  }

  const tablazatok = {};
  const fajlok = {};
  class Mappa {
    constructor(nev) { this.id = ujId(); this.nev = nev; this.almappak = []; }
    getId() { return this.id; }
    getUrl() { return 'https://drive/' + this.id; }
    getFilesByType() { const t = Object.entries(fajlok).filter(([, f]) => f.szulo === this.id).map(([id, f]) => fajlObj(id)); let i = 0; return { hasNext: () => i < t.length, next: () => t[i++] }; }
    getFoldersByName(n) { const t = this.almappak.filter(m => m.nev === n); let i = 0; return { hasNext: () => i < t.length, next: () => t[i++] }; }
    createFolder(n) { const m = new Mappa(n); this.almappak.push(m); return m; }
  }
  const gyoker = new Mappa('root');
  const fajlObj = (id) => ({ getId: () => id, getName: () => fajlok[id].cim, setName: (n) => { fajlok[id].cim = n; }, getMimeType: () => 'sheets', isTrashed: () => false, moveTo: (m) => { fajlok[id].szulo = m.id; } });
  function mappaKeres(m, id) { if (m.id === id) return m; for (const a of m.almappak) { const x = mappaKeres(a, id); if (x) return x; } return null; }
  const tulajdonsagok = {};
  let propOlvasas = 0; // a Properties olvasására napi kvóta van, a gyakori hívások nem olvashatják
  const gyorsitotar = {};

  const kornyezet = {
    console,
    SpreadsheetApp: {
      openById: (id) => { if (!tablazatok[id]) throw new Error('nincs tábla'); return tablazatok[id]; },
      create: (cim) => { const t = new Tablazat(cim); tablazatok[t.id] = t; fajlok[t.id] = { cim, mime: 'sheets' }; return t; }
    },
    DriveApp: {
      getRootFolder: () => gyoker,
      getFilesByName: (n) => { const t = Object.entries(fajlok).filter(([, f]) => f.cim === n).map(([id]) => fajlObj(id)); let i = 0; return { hasNext: () => i < t.length, next: () => t[i++] }; },
      getFileById: (id) => Object.assign(fajlObj(id), { makeCopy: () => ({ getUrl: () => 'x' }) }),
      getFolderById: (id) => mappaKeres(gyoker, id)
    },
    MimeType: { GOOGLE_SHEETS: 'sheets' },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: k => { propOlvasas++; return (k in tulajdonsagok ? tulajdonsagok[k] : null); },
      setProperty: (k, v) => { tulajdonsagok[k] = String(v); },
      deleteProperty: k => { delete tulajdonsagok[k]; }
    }) },
    CacheService: { getScriptCache: () => ({
      get: k => (k in gyorsitotar ? gyorsitotar[k] : null),
      put: (k, v) => { gyorsitotar[k] = String(v); },
      putAll: o => Object.assign(gyorsitotar, o),
      getAll: ks => Object.fromEntries(ks.filter(k => k in gyorsitotar).map(k => [k, gyorsitotar[k]])),
      remove: k => { delete gyorsitotar[k]; },
      removeAll: ks => ks.forEach(k => delete gyorsitotar[k])
    }) },
    LockService: { getScriptLock: () => ({ waitLock: () => {}, releaseLock: () => {} }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, s) => Array.from(crypto.createHash('sha256').update(s, 'utf8').digest()),
      computeHmacSha256Signature: (v, k) => Array.from(crypto.createHmac('sha256', k).update(v, 'utf8').digest()),
      base64Encode: (b) => Buffer.from(typeof b === 'string' ? Buffer.from(b, 'utf8') : b).toString('base64'),
      base64EncodeWebSafe: (b) => Buffer.from(typeof b === 'string' ? Buffer.from(b, 'utf8') : b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_'),
      base64DecodeWebSafe: (s) => Array.from(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64')),
      getUuid: () => crypto.randomUUID(),
      newBlob: (x) => ({ getBytes: () => Array.from(Buffer.from(x, 'utf8')), getDataAsString: () => Buffer.from(x).toString('utf8') }),
      formatDate: () => '2026-11-13'
    },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s) => ({ s, setMimeType() { return this; }, getContent() { return this.s; } }) },
    Logger: { log: () => {} },
    ScriptApp: {}
  };

  vm.createContext(kornyezet);
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'dist', 'Kod.gs'), 'utf8'), kornyezet);
  return { kornyezet, tablazatok, fajlok, gyoker, mappaKeres, tulajdonsagok, gyorsitotar, propOlvasas: () => propOlvasas };
}

module.exports = { letrehoz };
