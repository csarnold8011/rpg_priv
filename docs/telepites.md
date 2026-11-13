# Telepítés (egyszeri, laptopon, kb. 15 perc)

A háttér egy Google Apps Script web app a saját Gmail fiókban. A kód ebben a repóban van, a tartalom (táblázatok, szabálykönyvek) csak a Google Drive-on.

## 1. Apps Script projekt

1. Nyisd meg: https://script.google.com, majd **Új projekt**. Nevezd el: `Fantasy AGE háttér`.
2. A szerkesztőben a `Kód.gs` (vagy `Code.gs`) tartalmát cseréld le a repó `dist/Kod.gs` fájljának teljes tartalmára.
3. **Projektbeállítások** (fogaskerék), pipáld be: „Az appsscript.json jegyzékfájl megjelenítése a szerkesztőben”. Utána a szerkesztőben az `appsscript.json` tartalmát cseréld le a repó `backend/appsscript.json` fájljára.
4. Mentés.

## 2. Első beállítás

1. A felső sávban válaszd ki az `elsoBeallitas` függvényt, és **Futtatás**.
2. Az engedélykérésnél add meg a hozzáférést (Drive, Táblázatok). A „Google nem ellenőrizte ezt az alkalmazást” figyelmeztetésnél: Speciális, majd Ugrás a projektre. Ez a saját kódod, a saját fiókodban fut.
3. A végrehajtási naplóban megjelenik a „FantasyAge” mappa (a meglévőt használja) és a két táblázat címe. Ha a táblázatok már léteztek (például a Drive-ra feltöltve), név szerint megtalálja és kiegészíti őket.

A függvény többször is futtatható, semmit nem ír felül. Ha később új oszlop vagy lap kerül a sémába, újrafuttatva pótolja.

## 3. Telepítés web appként

1. **Telepítés**, majd **Új telepítés**, típus: **Webalkalmazás**.
2. Végrehajtás mint: **Én**. Hozzáférés: **Bárki**. (A védelmet a saját jelszavas belépés adja, a Google fiók nem kell a játékosoknak.)
3. **Telepítés**, majd másold ki a webalkalmazás URL-jét (`https://script.google.com/macros/s/.../exec`).

Kódváltozás után: **Telepítések kezelése**, a meglévő telepítés szerkesztése, **Új verzió**. Így az URL nem változik.

## 4. Első belépés

1. Nyisd meg a tesztoldalt: `https://csarnold8011.github.io/rpg_priv/web/teszt.html` (a GitHub Pages bekapcsolása után), vagy helyben a `web/teszt.html` fájlt egy egyszerű webszerverrel.
2. Másold be az URL-t, **Cím mentése**.
3. Lépj be a választott DM névvel és jelszóval. **A legelső belépő lesz a DM**, ezért ezt rögtön a telepítés után tedd meg.
4. A DM eszközökkel hozd létre a játékosokat, a kampányt, a karaktereket.

## 4/b. A felület és a meghívó link

- A felület: `https://csarnold8011.github.io/rpg_priv/`. Belépés után a DM a DM felületre, a játékos a játékos felületre kerül.
- Ha az eszközön még nincs megadva a szerver címe, a belépésnél kéri (a tesztoldalon elmentett cím ugyanazon a böngészőn már megvan).
- A DM a **Felhasználók** oldalon találja a **Meghívó linket**. Ezt kell elküldeni a játékosoknak: az első megnyitáskor beállítja a szerver címét a telefonjukon, utána csak a nevüket és a jelszavukat kell beírniuk. A link a háttér címét tartalmazza, ezért csak a családnak és a barátoknak küldd.
- A DM a felületen kezeli a felhasználókat (létrehozás, jelszó, letiltás), a kampányokat (mesterjátékos, aktív források, DM jegyzet) és a karaktereket (társítás, kampányba rendelés).

## 5. Ajánlott

- `importIdozitoBekapcsolasa` futtatása egyszer: óránként betölti a FantasyAge/Import mappába feltöltött szabályadat-adagokat. Kézzel: `importalas`.

- `napiMentesBekapcsolasa` futtatása egyszer: hajnali 4-kor másolat készül a Játékadat táblázatról a Mentések mappába.
- A szabályadat kézi módosítása után `szabalyVerzioNovelese` futtatása, hogy a böngészők újratöltsék.

## Tudnivalók

- A háttér a játékadat lapjait 15 percig gyorsítótárban tartja (minden írás azonnal frissíti). Ha a Játékadat táblázatban kézzel javítasz valamit, az legkésőbb 15 perc múlva látszik a felületen.
- Törlés: karaktert és kampányt előbb archiválni kell, csak utána törölhető véglegesen; felhasználót előbb le kell tiltani. A napi mentésből minden visszaállítható.

- A token 30 napig érvényes. Letiltott felhasználó azonnal kizáródik. Szerepkör módosítása (játékos és DM között) újbóli belépés után érvényes.
- Egy karakter adatai legfeljebb kb. 48 000 karakter JSON-t foglalhatnak (egy táblázatcella korlátja).
- A szabálykönyvek szövege soha nem kerülhet ebbe a repóba.
