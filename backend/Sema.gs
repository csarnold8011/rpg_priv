// GENERÁLT FÁJL. Ne szerkeszd kézzel: a schema/sema.json-t módosítsd,
// majd futtasd: python3 tools/sema_general.py

const SEMA = {
  "tablazatok": {
    "szabaly": {
      "cim": "Fantasy AGE Szabályadatbázis",
      "lapok": {
        "Tulajdonságok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "sorrend"
        ],
        "Fókuszok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "tulajdonsag"
        ],
        "Fajok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv"
        ],
        "Hátterek": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "csoport"
        ],
        "Osztályok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "elsodleges_tulajdonsagok",
          "masodlagos_tulajdonsagok",
          "kezdo_egeszseg"
        ],
        "Szintlépés": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "osztaly",
          "szint"
        ],
        "Talentumok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "osztalyok",
          "elofeltetel",
          "kezdo",
          "halado",
          "mester"
        ],
        "Specializációk": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "osztaly",
          "elofeltetel",
          "kezdo",
          "halado",
          "mester"
        ],
        "Arkánumok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "kezdo",
          "halado",
          "mester"
        ],
        "Varázslatok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "arkanum",
          "fokozat",
          "tipus",
          "mp_koltseg",
          "varazslasi_ido",
          "celertek",
          "proba"
        ],
        "Fegyvercsoportok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv"
        ],
        "Fegyverek": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "csoport",
          "sebzes",
          "min_ero",
          "hatotav",
          "ar"
        ],
        "Páncélok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "pancelertek",
          "buntetes",
          "ar"
        ],
        "Felszerelés": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "kategoria",
          "ar"
        ],
        "Mutatványok": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "tipus",
          "mutatvanypont"
        ],
        "Szörnyek": [
          "id",
          "nev_hu",
          "nev_en",
          "forras",
          "oldal",
          "leiras_hu",
          "reszletek",
          "aktiv",
          "fenyegetes",
          "tipus"
        ],
        "Szótár": [
          "eredeti",
          "projektben",
          "megjegyzes"
        ],
        "Házi szabályok": [
          "id",
          "cim",
          "leiras",
          "erinti",
          "aktiv"
        ],
        "Meta": [
          "kulcs",
          "ertek"
        ]
      }
    },
    "jatek": {
      "cim": "Fantasy AGE Játékadat",
      "lapok": {
        "Felhasználók": [
          "id",
          "nev",
          "szerep",
          "jelszo_hash",
          "so",
          "aktiv",
          "letrehozva"
        ],
        "Karakterek": [
          "id",
          "nev",
          "jatekos_id",
          "faj",
          "osztaly",
          "szint",
          "adat",
          "verzio",
          "modositva",
          "modositotta",
          "aktiv"
        ],
        "Kampányok": [
          "id",
          "cim",
          "mesterjatekos_id",
          "aktiv_forrasok",
          "allapot",
          "verzio",
          "dm_jegyzet",
          "letrehozva"
        ],
        "Kampánykarakterek": [
          "kampany_id",
          "karakter_id",
          "allapot",
          "csatlakozott"
        ],
        "Dobásnapló": [
          "id",
          "idopont",
          "kampany_id",
          "karakter_id",
          "dobta",
          "mire",
          "kockak",
          "modosito",
          "celertek",
          "eredmeny",
          "mutatvanypont",
          "rejtett"
        ],
        "Megosztások": [
          "id",
          "kampany_id",
          "cimzett",
          "tipus",
          "cim",
          "hivatkozas",
          "idopont"
        ],
        "Változásnapló": [
          "idopont",
          "ki",
          "mit",
          "elem_id",
          "regi_verzio",
          "uj_verzio"
        ]
      }
    }
  },
  "szabaly_lapok": [
    "Tulajdonságok",
    "Fókuszok",
    "Fajok",
    "Hátterek",
    "Osztályok",
    "Szintlépés",
    "Talentumok",
    "Specializációk",
    "Arkánumok",
    "Varázslatok",
    "Fegyvercsoportok",
    "Fegyverek",
    "Páncélok",
    "Felszerelés",
    "Mutatványok",
    "Szörnyek",
    "Szótár",
    "Házi szabályok"
  ],
  "json_oszlopok": [
    "reszletek",
    "adat",
    "aktiv_forrasok",
    "kockak"
  ]
};
