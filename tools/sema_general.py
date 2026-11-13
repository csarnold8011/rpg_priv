"""A schema/sema.json alapján elkészíti:
  1. backend/Sema.gs  (az Apps Script ebből ismeri a lapokat és oszlopokat)
  2. opcionálisan két üres .xlsx táblázatot a fejlécekkel (feltöltéshez)

Használat:
  python3 tools/sema_general.py                 # csak a Sema.gs
  python3 tools/sema_general.py --xlsx KIMENET  # a Sema.gs és a két .xlsx a KIMENET mappába
"""
import json
import sys
from pathlib import Path

GYOKER = Path(__file__).resolve().parent.parent
SEMA = json.loads((GYOKER / "schema" / "sema.json").read_text(encoding="utf-8"))


def sema_gs():
    adat = {k: v for k, v in SEMA.items() if not k.startswith("_")}
    szoveg = (
        "// GENERÁLT FÁJL. Ne szerkeszd kézzel: a schema/sema.json-t módosítsd,\n"
        "// majd futtasd: python3 tools/sema_general.py\n\n"
        "const SEMA = " + json.dumps(adat, ensure_ascii=False, indent=2) + ";\n"
    )
    (GYOKER / "backend" / "Sema.gs").write_text(szoveg, encoding="utf-8")


def xlsx(kimenet: Path):
    from openpyxl import Workbook
    from openpyxl.styles import Font

    kimenet.mkdir(parents=True, exist_ok=True)
    for kulcs, t in SEMA["tablazatok"].items():
        wb = Workbook()
        wb.remove(wb.active)
        for lap, oszlopok in t["lapok"].items():
            ws = wb.create_sheet(lap)
            ws.append(oszlopok)
            for c in ws[1]:
                c.font = Font(bold=True)
            ws.freeze_panes = "A2"
        if kulcs == "szabaly":
            wb["Meta"].append(["szabaly_verzio", 1])
        wb.save(kimenet / f"{t['cim']}.xlsx")


if __name__ == "__main__":
    sema_gs()
    if "--xlsx" in sys.argv:
        xlsx(Path(sys.argv[sys.argv.index("--xlsx") + 1]))
    print("Kész.")
