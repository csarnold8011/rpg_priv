# A Szabályadatbázis xlsx exportjából JSON a helyi szerverhez és a tesztekhez.
# A kimenet a szabálykönyvek szövegét tartalmazza: MINDIG a repón kívülre mentsd.
# Használat: python3 -I tools/szabalyadat_json.py <szabalyadatbazis.xlsx> <repón kívüli/lapok.json>
#   node tools/helyi_szerver.js --szabalyok <lapok.json>
#   FAGE_SZABALYOK=<lapok.json> node tools/teszt/mutatvany.mjs
import sys, json, os
import openpyxl

be, ki = sys.argv[1], sys.argv[2]
repo = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if os.path.abspath(ki).startswith(repo + os.sep):
    raise SystemExit('A kimenet nem kerülhet a repóba (jogvédett szabályszöveg).')

wb = openpyxl.load_workbook(be, data_only=True)
lapok = {}
for ws in wb.worksheets:
    if ws.title == 'Meta':
        continue
    sorok = list(ws.iter_rows(values_only=True))
    if not sorok:
        continue
    fej = [str(h) if h is not None else '' for h in sorok[0]]
    lista = []
    for r in sorok[1:]:
        if all(v is None or v == '' for v in r):
            continue
        o = {}
        for f, v in zip(fej, r):
            if not f:
                continue
            if f == 'reszletek' and isinstance(v, str) and v.strip()[:1] in '{[':
                try:
                    v = json.loads(v)
                except Exception:
                    pass
            o[f] = v
        lista.append(o)
    lapok[ws.title] = lista
json.dump(lapok, open(ki, 'w'), ensure_ascii=False)
print({k: len(v) for k, v in lapok.items()})
