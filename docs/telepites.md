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
3. A végrehajtási naplóban megjelenik a „Fantasy AGE” mappa és a két táblázat címe. Ha a táblázatok már léteztek (például a Drive-ra feltöltve), név szerint megtalálja és kiegészíti őket.

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

## 5. Ajánlott

- `napiMentesBekapcsolasa` futtatása egyszer: hajnali 4-kor másolat készül a Játékadat táblázatról a Mentések mappába.
- A szabályadat kézi módosítása után `szabalyVerzioNovelese` futtatása, hogy a böngészők újratöltsék.

## Tudnivalók

- A token 30 napig érvényes. Letiltott felhasználó azonnal kizáródik. Szerepkör módosítása (játékos és DM között) újbóli belépés után érvényes.
- Egy karakter adatai legfeljebb kb. 48 000 karakter JSON-t foglalhatnak (egy táblázatcella korlátja).
- A szabálykönyvek szövege soha nem kerülhet ebbe a repóba.
