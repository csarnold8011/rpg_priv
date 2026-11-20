// Kampányjátszó 6.4: az élő munkamenet (alkalom) és a kalandnapló (Alkalmak lap).
//
// Az alkalom a könyv „game session”-je: sorszám, valós kezdet és vég, játékbeli dátum (kezdet és vég), és az adat JSON
// (a jelenetek és ütemek állapota, az eseménynapló, a gyorsjegyzetek, a fontos szereplők, a futó szálak, az összefoglaló;
// a szerkezet a felület tiszta függvényeiben: web/js/kampany/alkalom.js). Csak a DM írja, egészében, verzióval (mint az
// előkészítő elemeket): az ismételt létrehozás nem duplikál, az elavult verzió 'utkozes' választ kap az aktuálissal.
// Egy kampányban egyszerre egy alkalom futhat.
//
// A játékosok csak a lezárt és közzétett alkalmak játékosoknak szóló részét kapják meg (state.get kalandnaplo): a szöveget,
// és az alkalomban szerepelt fontos szereplők közül azokat, akik az Ismereteik közt is ott vannak (az ismert nevükön).
// A kampány verziója csak akkor nő, ha ez a rész változik, így a DM játék közbeni mentései a játékosokat nem terhelik.

const ALKALOM_ID_MINTA = /^a_[a-z0-9]{6,16}$/;
const MAX_ALKALOM_MERET = 48000;
const KALANDNAPLO_JATEKOSNAK_MAX = 60;

function alkalomSorok_() {
  try { return sorok_('jatek', 'Alkalmak'); } catch (e) {
    if (e && e.kod === 'hianyzo_lap') return [];
    throw e;
  }
}

function alkalomAdat_(x) { return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }

function alkalomNezet_(s) {
  return {
    id: s.id, kampany_id: s.kampany_id, sorszam: Number(s.sorszam) || 1, cim: s.cim || '', allapot: s.allapot === 'lezart' ? 'lezart' : 'fut',
    kezdet: s.kezdet || '', veg: s.veg || '', jatekbeli_datum: s.jatekbeli_datum || '', jatekbeli_veg: s.jatekbeli_veg || '',
    kozzeteve: igaz_rejtett_(s.kozzeteve), adat: alkalomAdat_(s.adat), verzio: Number(s.verzio) || 0,
    modositva: s.modositva || '', modositotta: s.modositotta || ''
  };
}

// A DM listájához: adat nélkül, a játékosoknak szóló szöveg elejével.
function alkalomRovid_(s) {
  const n = alkalomNezet_(s);
  const o = alkalomAdat_(n.adat.osszefoglalo);
  delete n.adat;
  n.osszefoglalo_eleje = String(o.szoveg || '').slice(0, 280);
  return n;
}

// A lezárt és közzétett alkalom játékosoknak szóló része. lathato: a játékos alanyainak nézete (név szerint),
// alanySorok: a kampány alanysorai (a valódi kötéssel).
function alkalomJatekosnak_(s, lathato, alanySorok) {
  const a = alkalomAdat_(s.adat);
  const o = alkalomAdat_(a.osszefoglalo);
  const itt = Array.isArray(o.itt) ? o.itt : [];
  const lathatoIdk = lathato ? lathato.map(function (x) { return x.id; }) : null;
  const szereplok = [];
  (Array.isArray(a.szereplok) ? a.szereplok : []).forEach(function (sz) {
    if (!sz || itt.indexOf(sz.id) < 0) return;
    let alanyId = '';
    if (lathatoIdk === null) alanyId = sz.tipus === 'alany' ? sz.ref_id : '';
    else if (sz.tipus === 'alany') alanyId = lathatoIdk.indexOf(sz.ref_id) >= 0 ? sz.ref_id : '';
    else if (sz.ref_id) {
      const x = alanySorok.find(function (m) { return lathatoIdk.indexOf(m.id) >= 0 && alkalomAdat_(alkalomAdat_(m.adat).valodi).id === sz.ref_id; });
      alanyId = x ? x.id : '';
    }
    if (lathatoIdk !== null && !alanyId) return;
    // az összekapcsolt alany a lánc végén látszik
    let cel = alanyId;
    for (let i = 0; i < 20 && cel; i++) {
      const sor = alanySorok.find(function (m) { return m.id === cel; });
      const tovabb = sor ? alkalomAdat_(sor.adat).osszekapcsolva : '';
      if (!tovabb || (lathatoIdk !== null && lathatoIdk.indexOf(tovabb) < 0)) break;
      cel = tovabb;
    }
    if (cel && szereplok.some(function (x) { return x.alany_id === cel; })) return;
    const nezet = lathato ? lathato.find(function (x) { return x.id === cel; }) : null;
    szereplok.push({ alany_id: cel || '', nev: nezet ? nezet.nev : String(sz.nev || ''), jegyzet: String(sz.nyilvanos || '') });
  });
  return {
    id: s.id, sorszam: Number(s.sorszam) || 1, cim: s.cim || '', kezdet: s.kezdet || '', veg: s.veg || '',
    jatekbeli_datum: s.jatekbeli_datum || '', jatekbeli_veg: s.jatekbeli_veg || '', szoveg: String(o.jatekosoknak || ''), szereplok: szereplok
  };
}

function jatekosnakLathato_(s) { return s.allapot === 'lezart' && igaz_rejtett_(s.kozzeteve); }

// A játékosok által látható rész összehasonlításhoz (a kampány verziója csak ennek változásakor nő).
function alkalomJatekosResz_(s) {
  if (!s || !jatekosnakLathato_(s)) return '';
  return JSON.stringify(alkalomJatekosnak_(s, null, []));
}

// action: session.save (DM)
// adat: { id, verzio, uj?: igaz (újnál), kampany_id (újnál), kezdet? (újnál), cim?, allapot? ('fut' | 'lezart'), veg?,
//         jatekbeli_datum?, jatekbeli_veg?, kozzeteve?, adat? }
function alkalomMentese_(a, felh) {
  const id = String(a.id || '');
  if (!ALKALOM_ID_MINTA.test(id)) throw hiba_('hibas_adat', 'Hibás alkalomazonosító.');
  if (a.adat !== undefined) {
    if (!a.adat || typeof a.adat !== 'object' || Array.isArray(a.adat)) throw hiba_('hibas_adat', 'Hibás alkalomadat.');
    if (JSON.stringify(a.adat).length > MAX_ALKALOM_MERET) throw hiba_('tul_nagy', 'Az alkalom adatai túl nagyok egy cellához. Törölj régebbi eseményeket vagy gyorsjegyzeteket.');
  }
  return zarolva_(function () {
    const k = kornyezet_();
    const sorok = alkalomSorok_();
    let s = sorok.find(function (x) { return x.id === id; });
    if (s) {
      if (a.uj) return { alkalom: alkalomNezet_(s), verzio: Number(s.verzio) || 0, mar_megvolt: true };
      if (a.verzio === undefined || Number(a.verzio) !== (Number(s.verzio) || 0)) {
        throw hiba_('utkozes', 'Az alkalmat közben máshol is módosították.', { aktualis: alkalomNezet_(s) });
      }
      kampanyKeresese_(s.kampany_id, k);
    } else {
      if (!a.uj) throw hiba_('nem_talalhato', 'Nincs ilyen alkalom.');
      const kampany = kampanyKeresese_(a.kampany_id, k);
      const sajat = sorok.filter(function (x) { return x.kampany_id === kampany.id; });
      if (a.allapot !== 'lezart' && sajat.some(function (x) { return x.allapot !== 'lezart'; })) {
        throw hiba_('hibas_adat', 'Ebben a kampányban már fut egy alkalom. Előbb azt zárd le.');
      }
      const sorszam = sajat.reduce(function (m, x) { return Math.max(m, Number(x.sorszam) || 0); }, 0) + 1;
      s = { id: id, kampany_id: kampany.id, sorszam: sorszam, cim: '', allapot: 'fut', kezdet: a.kezdet || most_(), veg: '',
        jatekbeli_datum: '', jatekbeli_veg: '', kozzeteve: false, adat: {}, verzio: 0, letrehozva: most_() };
    }
    const elotte = alkalomJatekosResz_(s);
    if (a.cim !== undefined) s.cim = szoveg_(a.cim, 160);
    if (a.jatekbeli_datum !== undefined) s.jatekbeli_datum = szoveg_(a.jatekbeli_datum, 120);
    if (a.jatekbeli_veg !== undefined) s.jatekbeli_veg = szoveg_(a.jatekbeli_veg, 120);
    if (a.adat !== undefined) s.adat = a.adat;
    if (a.allapot !== undefined) {
      const uj = a.allapot === 'lezart' ? 'lezart' : 'fut';
      if (uj === 'fut' && s.allapot === 'lezart' && sorok.some(function (x) { return x.kampany_id === s.kampany_id && x.id !== s.id && x.allapot !== 'lezart'; })) {
        throw hiba_('hibas_adat', 'Ebben a kampányban már fut egy másik alkalom.');
      }
      s.allapot = uj;
      if (uj === 'lezart') s.veg = a.veg ? szoveg_(a.veg, 40) : (s.veg || most_());
      else s.veg = '';
    }
    if (a.kozzeteve !== undefined) s.kozzeteve = a.kozzeteve === true && s.allapot === 'lezart';
    if (s.allapot !== 'lezart') s.kozzeteve = false;
    const regi = Number(s.verzio) || 0;
    s.verzio = regi + 1;
    s.modositva = most_();
    s.modositotta = felh.n || '';
    if (regi === 0) sorHozzaadasa_('jatek', 'Alkalmak', s); else sorFrissitese_('jatek', 'Alkalmak', s);
    const kv = alkalomJatekosResz_(s) !== elotte ? kampanyVerziokNovelese_([s.kampany_id], k.kampanyok) : {};
    if (regi === 0 || a.allapot !== undefined) valtozasNaplozasa_(felh, 'alkalom.' + (regi === 0 ? 'indul' : s.allapot), s.id, regi, s.verzio);
    return { alkalom: alkalomNezet_(s), verzio: s.verzio, kampany_verziok: kv };
  });
}

// action: session.get (DM)   adat: { id }   Egy alkalom teljes adata (a kalandnapló régebbi alkalmaihoz).
function alkalomLekerese_(a) {
  const s = alkalomSorok_().find(function (x) { return x.id === a.id; });
  if (!s) throw hiba_('nem_talalhato', 'Nincs ilyen alkalom.');
  return { alkalom: alkalomNezet_(s) };
}

// action: session.delete (DM)   adat: { id }   Véletlenül indított vagy fölösleges alkalom törlése.
function alkalomTorlese_(a, felh) {
  return zarolva_(function () {
    const k = kornyezet_();
    const s = alkalomSorok_().find(function (x) { return x.id === a.id; });
    if (!s) throw hiba_('nem_talalhato', 'Nincs ilyen alkalom.');
    const lathato = jatekosnakLathato_(s);
    sorTorlese_('jatek', 'Alkalmak', s._sor);
    if (lathato) kampanyVerziokNovelese_([s.kampany_id], k.kampanyok);
    valtozasNaplozasa_(felh, 'alkalom.torol', s.id, s.verzio, '');
    return { torolve: s.id };
  });
}

// A kampány állapotába (state.get). DM: a rövid lista, és teljes adattal a futó alkalom, vagy ha nincs, a legutóbbi
// (ebből indul a következő). Játékos és mesterjátékos: a közzétett alkalmak játékosoknak szóló része.
// alanyokJatekosnak: a kérő által látott alanyok (megoszt.alanyok), osszesMegosztas: a Megosztások lap sorai.
function kampanyAlkalmai_(kampany, szerep, alanyokJatekosnak, osszesMegosztas) {
  const sajat = alkalomSorok_().filter(function (s) { return s.kampany_id === kampany.id; })
    .sort(function (x, y) { return (Number(x.sorszam) || 0) - (Number(y.sorszam) || 0); });
  if (szerep === 'dm') {
    const fut = sajat.filter(function (s) { return s.allapot !== 'lezart'; });
    const fo = fut.length ? fut[fut.length - 1] : sajat[sajat.length - 1];
    return { alkalmak: sajat.map(alkalomRovid_), alkalom: fo ? alkalomNezet_(fo) : null };
  }
  const alanySorok = (osszesMegosztas || []).filter(function (m) { return m.kampany_id === kampany.id && m.tipus === 'alany'; });
  return {
    kalandnaplo: sajat.filter(jatekosnakLathato_).slice(-KALANDNAPLO_JATEKOSNAK_MAX).reverse().map(function (s) {
      return alkalomJatekosnak_(s, alanyokJatekosnak || [], alanySorok);
    })
  };
}

// A kampány törlésekor az alkalmai is törlődnek.
function kampanyAlkalmainakTorlese_(kampanyId) {
  const sorok = alkalomSorok_().filter(function (s) { return s.kampany_id === kampanyId; });
  sorokTorlese_('jatek', 'Alkalmak', sorok.map(function (s) { return s._sor; }));
}
