// Belépés, token, felhasználók kezelése.

const TOKEN_ERVENY_NAP = 30;
const MAX_HIBAS_BELEPES = 5;
const TILTAS_MP = 600;

function hash_(jelszo, so) {
  let h = so + '|' + jelszo;
  for (let i = 0; i < 300; i++) {
    h = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, h, Utilities.Charset.UTF_8));
  }
  return h;
}

function titok_() {
  const t = beallitas_('TOKEN_TITOK');
  if (!t) throw hiba_('nincs_beallitva', 'Futtasd az elsoBeallitas függvényt.');
  return t;
}

function b64url_(bajtokVagySzoveg) {
  return Utilities.base64EncodeWebSafe(bajtokVagySzoveg).replace(/=+$/, '');
}

function alairas_(s) {
  return b64url_(Utilities.computeHmacSha256Signature(s, titok_()));
}

function tokenKeszites_(f) {
  const tartalom = JSON.stringify({ u: f.id, r: f.szerep, n: f.nev, exp: Date.now() + TOKEN_ERVENY_NAP * 864e5 });
  const p = b64url_(Utilities.newBlob(tartalom).getBytes());
  return p + '.' + alairas_(p);
}

function tokenEllenorzes_(token) {
  if (!token || typeof token !== 'string') throw hiba_('nincs_bejelentkezve', 'Jelentkezz be.');
  const reszek = token.split('.');
  if (reszek.length !== 2 || alairas_(reszek[0]) !== reszek[1]) throw hiba_('nincs_bejelentkezve', 'Jelentkezz be újra.');
  const p = reszek[0] + '='.repeat((4 - reszek[0].length % 4) % 4);
  const adat = JSON.parse(Utilities.newBlob(Utilities.base64DecodeWebSafe(p)).getDataAsString('UTF-8'));
  if (!adat.exp || adat.exp < Date.now()) throw hiba_('lejart', 'A bejelentkezés lejárt, jelentkezz be újra.');
  if (letiltottak_().indexOf(adat.u) >= 0) throw hiba_('nincs_bejelentkezve', 'Ez a fiók le van tiltva.');
  return adat; // { u: azonosító, r: szerep, n: név, exp }
}

// A letiltott felhasználók listája gyorsítótárból, hogy a tokenellenőrzés ne olvasson táblázatot.
function letiltottak_() {
  const c = CacheService.getScriptCache();
  const m = c.get('letiltottak');
  if (m !== null) return JSON.parse(m);
  const lista = sorok_('jatek', 'Felhasználók').filter(function (f) { return !igaz_(f.aktiv); }).map(function (f) { return f.id; });
  c.put('letiltottak', JSON.stringify(lista), 21600);
  return lista;
}

function publikus_(f) {
  return { id: f.id, nev: f.nev, szerep: f.szerep, aktiv: igaz_(f.aktiv) };
}

function felhasznaloLetrehozasa_(nev, jelszo, szerep) {
  if (['dm', 'jatekos'].indexOf(szerep) < 0) throw hiba_('hibas_adat', 'A szerep dm vagy jatekos lehet.');
  if (String(jelszo).length < 4) throw hiba_('hibas_adat', 'A jelszó legalább 4 karakter legyen.');
  const letezo = sorok_('jatek', 'Felhasználók').some(function (f) { return String(f.nev).toLowerCase() === nev.toLowerCase(); });
  if (letezo) throw hiba_('hibas_adat', 'Már van ilyen nevű felhasználó.');
  const so = Utilities.getUuid();
  const f = { id: ujId_('f'), nev: nev, szerep: szerep, jelszo_hash: hash_(jelszo, so), so: so, aktiv: true, letrehozva: most_() };
  sorHozzaadasa_('jatek', 'Felhasználók', f);
  return f;
}

// action: login   adat: { nev, jelszo }
function belepes_(a) {
  const nev = String(a.nev || '').trim();
  const jelszo = String(a.jelszo || '');
  if (!nev || !jelszo) throw hiba_('hianyzo_adat', 'Add meg a neved és a jelszavad.');

  const c = CacheService.getScriptCache();
  const kulcs = 'hibas_' + nev.toLowerCase();
  const hibak = Number(c.get(kulcs) || 0);
  if (hibak >= MAX_HIBAS_BELEPES) throw hiba_('tiltva', 'Túl sok sikertelen próbálkozás. Próbáld újra 10 perc múlva.');

  return zarolva_(function () {
    const felhasznalok = sorok_('jatek', 'Felhasználók');

    // Legelső belépés: ha még nincs felhasználó és az elsoBeallitas engedélyezte, ő lesz a DM.
    if (felhasznalok.length === 0) {
      const p = PropertiesService.getScriptProperties();
      if (p.getProperty('ELSO_BELEPES') === 'igen') {
        const uj = felhasznaloLetrehozasa_(nev, jelszo, 'dm');
        p.deleteProperty('ELSO_BELEPES');
        return { token: tokenKeszites_(uj), felhasznalo: publikus_(uj), elso_belepes: true };
      }
    }

    const f = felhasznalok.find(function (x) { return String(x.nev).toLowerCase() === nev.toLowerCase(); });
    if (!f || !igaz_(f.aktiv) || hash_(jelszo, f.so) !== f.jelszo_hash) {
      c.put(kulcs, String(hibak + 1), TILTAS_MP);
      throw hiba_('hibas_belepes', 'Hibás név vagy jelszó.');
    }
    c.remove(kulcs);
    return { token: tokenKeszites_(f), felhasznalo: publikus_(f) };
  });
}

// action: users.admin (csak DM)
// adat: { muvelet: 'lista' }
//       { muvelet: 'letrehoz', nev, jelszo, szerep }
//       { muvelet: 'jelszo', id, jelszo }
//       { muvelet: 'letilt' | 'engedelyez', id }
//       { muvelet: 'szerep', id, szerep }
function felhasznaloKezeles_(a, felh) {
  if (a.muvelet === 'lista') {
    return { felhasznalok: sorok_('jatek', 'Felhasználók').map(publikus_) };
  }
  return zarolva_(function () {
    if (a.muvelet === 'letrehoz') {
      const uj = felhasznaloLetrehozasa_(String(a.nev || '').trim(), String(a.jelszo || ''), a.szerep || 'jatekos');
      valtozasNaplozasa_(felh, 'felhasznalo.letrehoz', uj.id, '', '');
      return { felhasznalo: publikus_(uj) };
    }
    const f = sorok_('jatek', 'Felhasználók').find(function (x) { return x.id === a.id; });
    if (!f) throw hiba_('nem_talalhato', 'Nincs ilyen felhasználó.');
    if (a.muvelet === 'jelszo') {
      if (String(a.jelszo || '').length < 4) throw hiba_('hibas_adat', 'A jelszó legalább 4 karakter legyen.');
      f.so = Utilities.getUuid();
      f.jelszo_hash = hash_(String(a.jelszo), f.so);
    } else if (a.muvelet === 'letilt' || a.muvelet === 'engedelyez') {
      if (f.id === felh.u) throw hiba_('hibas_adat', 'Saját magadat nem tilthatod le.');
      f.aktiv = a.muvelet === 'engedelyez';
    } else if (a.muvelet === 'szerep') {
      if (['dm', 'jatekos'].indexOf(a.szerep) < 0) throw hiba_('hibas_adat', 'A szerep dm vagy jatekos lehet.');
      f.szerep = a.szerep;
    } else {
      throw hiba_('hibas_adat', 'Ismeretlen művelet.');
    }
    sorFrissitese_('jatek', 'Felhasználók', f);
    CacheService.getScriptCache().remove('letiltottak');
    valtozasNaplozasa_(felh, 'felhasznalo.' + a.muvelet, f.id, '', '');
    return { felhasznalo: publikus_(f) };
  });
}
