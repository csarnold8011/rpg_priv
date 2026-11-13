# rpg_priv

Családi Fantasy AGE webapp: DM felület és játékos felület. Saját használatra.

Ebben a repóban **csak program kód** van. Minden tartalom (szabályadatbázis, karakterek, kalandok, szabálykönyv-szövegek) a Google Drive-on van, és csak jelszavas belépéssel, az Apps Script háttéren keresztül érhető el. A szabálykönyvek szövege soha nem kerül ide.

## Szerkezet

| Mappa | Tartalom |
| --- | --- |
| `backend/` | Google Apps Script háttér (belépés, jogosultság, végpontok, első beállítás) |
| `dist/Kod.gs` | A háttér egy fájlba fűzve, az Apps Script szerkesztőbe másoláshoz (generált) |
| `schema/sema.json` | A két táblázat lapjai és oszlopai; ebből készül a `backend/Sema.gs` |
| `web/` | Felületek. Most: `teszt.html` és a közös modulok (`js/api.js`, `js/sync.js`, `js/szabalyok.js`) |
| `tools/` | Generálók és a háttér helyi tesztje |
| `docs/` | Telepítési útmutató |

## Fejlesztés

```bash
python3 tools/sema_general.py      # schema/sema.json -> backend/Sema.gs
python3 tools/backend_osszefuz.py  # backend/*.gs -> dist/Kod.gs
node tools/teszt/futtat.js         # a háttér helyi tesztje (Google szolgáltatások utánzatával)
```

Telepítés: [docs/telepites.md](docs/telepites.md).

A tervezési döntések a Claude projektben vannak (`claude/rendszerkeret-es-dontesek.md`, `claude/alapozas-terv.md`).
