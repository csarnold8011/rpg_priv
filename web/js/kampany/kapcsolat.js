// Kampányépítő: a kapcsolatok hálózata (típusos kapcsolat bármely két elem között). Tiszta függvények.
// Egy kapcsolat: { id, honnan, hova, tipus, megjegyzes, vilag_id, kampany_id, aktiv }.
// A honnan és a hova bármilyen azonosító lehet: elem, NJK, karakter, szörny (a felület oldja fel a nevét).
// Terv: claude/kampanyepito-terv.md, „Kapcsolatok (hálózat)”. A személyes kapcsolatok a Kampányépítő
// kapcsolattáblája (Relationships) szerint.

// A felirat az elem lapján a másik elem előtt áll („gyermeke: Mira”). nev: a honnan elem lapján, forditott: a hova
// elem lapján; szimmetrikus: mindkét lapon ugyanaz. A „következő” a jelenetek sorrendje (elágazással).
export const KAPCSOLAT_TIPUSOK = {
  kovetkezik: { nev: 'következő', forditott: 'előző', csoport: 'Történet' },
  feltetele: { nev: 'feltétele ennek', forditott: 'feltétele', csoport: 'Történet' },
  itt_tortenik: { nev: 'helyszíne', forditott: 'itt játszódik', csoport: 'Történet' },
  szerepel: { nev: 'szerepel itt', forditott: 'szereplője', csoport: 'Történet' },
  jutalma: { nev: 'jutalma ennek', forditott: 'jutalma', csoport: 'Történet' },
  resze: { nev: 'része ennek', forditott: 'magában foglalja', csoport: 'Hely és szervezet' },
  tagja: { nev: 'tagja ennek', forditott: 'tagja', csoport: 'Hely és szervezet' },
  vezeti: { nev: 'vezeti', forditott: 'vezetője', csoport: 'Hely és szervezet' },
  tulajdonosa: { nev: 'tulajdonosa ennek', forditott: 'tulajdonosa', csoport: 'Hely és szervezet' },
  imadja: { nev: 'imádja', forditott: 'imádója', csoport: 'Hely és szervezet' },
  szovetsegese: { nev: 'szövetségese', szimmetrikus: true, csoport: 'Személyes' },
  ellensege: { nev: 'ellensége', szimmetrikus: true, csoport: 'Személyes' },
  baratja: { nev: 'barátja', szimmetrikus: true, csoport: 'Személyes' },
  szeretoje: { nev: 'szeretője', szimmetrikus: true, csoport: 'Személyes' },
  hazastarsa: { nev: 'házastársa', szimmetrikus: true, csoport: 'Személyes' },
  testvere: { nev: 'testvére', szimmetrikus: true, csoport: 'Személyes' },
  unokatestvere: { nev: 'unokatestvére', szimmetrikus: true, csoport: 'Személyes' },
  szulo_gyermek: { nev: 'gyermeke', forditott: 'szülője', csoport: 'Személyes' },
  nagyszulo_unoka: { nev: 'unokája', forditott: 'nagyszülője', csoport: 'Személyes' },
  nagybacsi_unokaocs: { nev: 'unokahúga vagy unokaöccse', forditott: 'nagynénje vagy nagybátyja', csoport: 'Személyes' },
  egyeb: { nev: 'kapcsolatban áll vele', szimmetrikus: true, csoport: 'Egyéb' }
};

export function tipusNev(tipus, irany) {
  const t = KAPCSOLAT_TIPUSOK[tipus] || KAPCSOLAT_TIPUSOK.egyeb;
  return irany === 'be' && !t.szimmetrikus ? t.forditott : t.nev;
}

// Egy elem kapcsolatai mindkét irányban: [{ kapcsolat, irany: 'ki'|'be', masik, felirat }], típus szerint rendezve.
export function elemKapcsolatai(id, kapcsolatok) {
  const ki = [];
  (kapcsolatok || []).forEach((k) => {
    if (k.aktiv === false) return;
    if (k.honnan === id) ki.push({ kapcsolat: k, irany: 'ki', masik: k.hova, felirat: tipusNev(k.tipus, 'ki') });
    else if (k.hova === id) ki.push({ kapcsolat: k, irany: 'be', masik: k.honnan, felirat: tipusNev(k.tipus, 'be') });
  });
  const sorrend = Object.keys(KAPCSOLAT_TIPUSOK);
  return ki.sort((a, b) => sorrend.indexOf(a.kapcsolat.tipus) - sorrend.indexOf(b.kapcsolat.tipus) || a.irany.localeCompare(b.irany));
}

// Azonos kapcsolat már van-e (szimmetrikusnál a fordított irány is azonos).
export function vanMar(k, kapcsolatok) {
  const t = KAPCSOLAT_TIPUSOK[k.tipus] || {};
  return (kapcsolatok || []).some((x) => x.id !== k.id && x.aktiv !== false && x.tipus === k.tipus &&
    ((x.honnan === k.honnan && x.hova === k.hova) || (t.szimmetrikus && x.honnan === k.hova && x.hova === k.honnan)));
}

// Hibák listája mentés előtt.
export function ellenoriz(k, kapcsolatok) {
  const h = [];
  if (!k.honnan || !k.hova) h.push('A kapcsolat két végét meg kell adni.');
  else if (k.honnan === k.hova) h.push('Egy elem nem kapcsolódhat önmagához.');
  if (!KAPCSOLAT_TIPUSOK[k.tipus]) h.push('Ismeretlen kapcsolattípus.');
  if (String(k.megjegyzes || '').length > 300) h.push('A megjegyzés legfeljebb 300 karakter.');
  if (!h.length && vanMar(k, kapcsolatok)) h.push('Ez a kapcsolat már megvan.');
  return h;
}

// A „következik” kapcsolatok szerinti sorrend (elágazással): az elemek, amelyek egy elem után jönnek.
export function kovetkezok(id, kapcsolatok) {
  return (kapcsolatok || []).filter((k) => k.aktiv !== false && k.tipus === 'kovetkezik' && k.honnan === id).map((k) => k.hova);
}

// Egy elemhez tartozó összes kapcsolat (az elem törlésekor vagy archiválásakor).
export function erintett(id, kapcsolatok) {
  return (kapcsolatok || []).filter((k) => k.honnan === id || k.hova === id);
}

// Választólista csoportosítva a felülethez.
export function tipusCsoportok() {
  const cs = {};
  Object.entries(KAPCSOLAT_TIPUSOK).forEach(([kulcs, t]) => { (cs[t.csoport] = cs[t.csoport] || []).push({ kulcs, ...t }); });
  return cs;
}
