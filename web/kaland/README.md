# A design rendszer másolata

Az irányadó példány a projekt design systemje: https://claude.ai/artifact/EgGDkRYHTHZB9GbX3LcCj5 (arculati kézikönyv: a Claude projekt `claude/arculati-kezikonyv.md` fájlja). Ha eltérés van, a design system dönt.

| Fájl | Forrás |
| --- | --- |
| `bundle.js` | `components/bundle.js` szó szerint (`window.Kaland`, React 18) |
| `bundle.css` | `components/bundle.css`, a betűtípus `@import` sora nélkül (az oldal `<link>` elemmel tölti be) |
| `tokenek.css` | `tokens.json`: a négy téma színei, betűcsaládok, térköz, lekerekítés, méretek, árnyékok CSS változóként |

Ha a design system komponensei változnak, ezt a három fájlt kell frissíteni. A felület saját elrendezési stílusa a `web/css/app.css`, az is csak tokeneket használ.

Az ikonok (`web/js/app/ikonok.js`) a kézikönyv szabályai szerint rajzolt ideiglenes változatok (24px rács, 1.75 vonalvastagság, kerek végek, `currentColor`), mert a design systemben az SVG fájlok még nincsenek feltöltve. Ha felkerülnek, az útvonalakat ott kell kicserélni.
