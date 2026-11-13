"""A backend/*.gs fájlokat egyetlen dist/Kod.gs fájlba fűzi, hogy az Apps Script
szerkesztőbe egyetlen beillesztéssel bemásolható legyen.

Használat: python3 tools/backend_osszefuz.py
"""
from pathlib import Path

GYOKER = Path(__file__).resolve().parent.parent
SORREND = ["Sema.gs", "Main.gs", "Adat.gs", "Belepes.gs", "Jogosultsag.gs", "Verzio.gs",
           "Karakterek.gs", "Kampanyok.gs", "Dobasok.gs", "Szabalyok.gs", "Beallitas.gs"]

fajlok = sorted((GYOKER / "backend").glob("*.gs"), key=lambda p: (SORREND.index(p.name) if p.name in SORREND else 99, p.name))
reszek = ["// GENERÁLT FÁJL: a backend/*.gs fájlok összefűzése (tools/backend_osszefuz.py).\n"
          "// Az Apps Script projektben ez az egyetlen kódfájl (Kod.gs), mellette az appsscript.json.\n"]
for f in fajlok:
    reszek.append(f"\n// ===== {f.name} =====\n\n" + f.read_text(encoding="utf-8"))
(GYOKER / "dist").mkdir(exist_ok=True)
(GYOKER / "dist" / "Kod.gs").write_text("".join(reszek), encoding="utf-8")
print("dist/Kod.gs kész,", len(fajlok), "fájl.")
