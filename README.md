# rpg_priv

Családi Fantasy AGE webapp: DM felület és játékos felület. Saját használatra.

Ebben a repóban **csak program kód** van. Minden tartalom (szabályadatbázis, karakterek, kalandok, szabálykönyv-szövegek) a Google Drive-on van, és csak jelszavas belépéssel, az Apps Script háttéren keresztül érhető el. A szabálykönyvek szövege soha nem kerül ide.

## Szerkezet

| Mappa | Tartalom |
| --- | --- |
| `backend/` | Google Apps Script háttér (belépés, jogosultság, végpontok, első beállítás) |
| `dist/Kod.gs` | A háttér egy fájlba fűzve, az Apps Script szerkesztőbe másoláshoz (generált) |
| `schema/sema.json` | A két táblázat lapjai és oszlopai; ebből készül a `backend/Sema.gs` |
| `index.html` | A felület nyitóoldala (belépés, utána a szerep szerint DM vagy játékos nézet): https://csarnold8011.github.io/rpg_priv/ |
| `web/js/app/` | A felület: `main.js` (belépési pont), `belepes.js`, `dm.js`, `jatekos.js`, `jatek.js` (közös játékelemek), `kozos.js`, `ikonok.js` |
| `web/js/` | Közös modulok: `api.js` (háttérhívások), `sync.js` (szinkronréteg), `szabalyok.js` (szabályadat a böngészőben) |
| `web/kaland/` | A design rendszer másolata (komponensek, tokenek), lásd `web/kaland/README.md` |
| `web/css/app.css` | A felület elrendezése, csak tokenekkel |
| `web/vendor/` | React 18 és htm helyben (nincs fordítási lépés) |
| `web/teszt.html` | A háttér tesztoldala (alapozás) |
| `tools/` | Generálók és a háttér helyi tesztje |
| `docs/` | Telepítési útmutató |

## Fejlesztés

```bash
python3 tools/sema_general.py      # schema/sema.json -> backend/Sema.gs
python3 tools/backend_osszefuz.py  # backend/*.gs -> dist/Kod.gs
node tools/teszt/futtat.js         # a háttér helyi tesztje (Google szolgáltatások utánzatával)
node tools/helyi_szerver.js        # a felület kipróbálása helyben, bemutató adatokkal (--ures: üres adatbázis)
```

A helyi szerver a felületet és a háttérkódot is kiszolgálja (utánzott Google szolgáltatásokkal, csak memóriában). Megnyitás: `http://localhost:8080/#kapcsolat=http%3A%2F%2Flocalhost%3A8080%2Fapi`, belépés: Arnold / sarkany1 (DM), Anna / anna1 (mesterjátékos), Bence / bence1.

A felület fordítási lépés nélkül fut: a `web/js/app/` modulok böngészőben futó ES modulok, a sablonok a `htm` könyvtárral készülnek (JSX helyett), a komponensek a `window.Kaland` névtérből jönnek.

Telepítés: [docs/telepites.md](docs/telepites.md).

A tervezési döntések a Claude projektben vannak (`claude/rendszerkeret-es-dontesek.md`, `claude/alapozas-terv.md`).
