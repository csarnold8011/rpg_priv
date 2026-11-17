"""A csatamotor tiszta függvényeiből (web/js/jatek/osszecsapas.js, csata.js, csatamuvelet.js) elkészíti a
backend/Csatamotor.gs fájlt, hogy a háttér a játékos lépéseit ugyanazzal a kóddal alkalmazza, mint a felület.

Minden modul egy saját függvényhatókörbe kerül (a belső nevek nem ütköznek a háttér neveivel), az exportált nevek
a CsataMotor_ objektumon érhetők el. A leny.js-ből csak a nehézségbecslés használ valamit, az a háttérben nem fut,
ezért ott helyettesítő áll.

Használat: python3 tools/csatamotor_general.py   (a tools/backend_osszefuz.py is meghívja)
"""
import re
from pathlib import Path

GYOKER = Path(__file__).resolve().parent.parent
MODULOK = ["osszecsapas", "csata", "csatamuvelet"]
HELYETTESITOK = {"leny": {"FENYEGETESEK": "[]", "fenyegetesSorszam": "function () { return -1; }"}}

IMPORT_NEVES = re.compile(r"^import\s*\{([^}]*)\}\s*from\s*'\./([a-z_]+)\.js';\s*$", re.M)
IMPORT_CSILLAG = re.compile(r"^import\s*\*\s*as\s+(\w+)\s+from\s*'\./([a-z_]+)\.js';\s*$", re.M)
EXPORT = re.compile(r"^export\s+(const|let|function|async function)\s+(\w+)", re.M)


def atalakit(nev):
    kod = (GYOKER / "web" / "js" / "jatek" / f"{nev}.js").read_text(encoding="utf-8")

    def neves(m):
        nevek = [x.strip() for x in m.group(1).split(",") if x.strip()]
        honnan = m.group(2)
        if honnan in HELYETTESITOK:
            return "\n".join(f"const {n} = {HELYETTESITOK[honnan][n]};" for n in nevek)
        if honnan not in MODULOK:
            raise SystemExit(f"{nev}.js: a {honnan}.js nincs a háttérbe fordított modulok között.")
        return f"const {{ {', '.join(nevek)} }} = _m_{honnan};"

    def csillag(m):
        if m.group(2) not in MODULOK:
            raise SystemExit(f"{nev}.js: a {m.group(2)}.js nincs a háttérbe fordított modulok között.")
        return f"const {m.group(1)} = _m_{m.group(2)};"

    kod = IMPORT_NEVES.sub(neves, kod)
    kod = IMPORT_CSILLAG.sub(csillag, kod)
    if re.search(r"^\s*(import|export)\s*[{*]", kod, re.M):
        raise SystemExit(f"{nev}.js: nem kezelt import vagy export forma.")
    exportok = [m.group(2) for m in EXPORT.finditer(kod)]
    kod = EXPORT.sub(lambda m: f"{m.group(1)} {m.group(2)}", kod)
    # behúzás nélkül, hogy a többsoros sablonszövegek ne változzanak
    return f"const _m_{nev} = (function () {{\n{kod}\nreturn {{ {', '.join(exportok)} }};\n}})();\n"


def main():
    reszek = ["// GENERÁLT FÁJL. Ne szerkeszd kézzel: a web/js/jatek/osszecsapas.js, csata.js és csatamuvelet.js\n"
              "// a forrás, ebből a python3 tools/csatamotor_general.py készíti. A háttér a CsataMotor_ objektumot használja.\n"]
    for nev in MODULOK:
        reszek.append(f"\n// ----- web/js/jatek/{nev}.js -----\n" + atalakit(nev))
    reszek.append("\nconst CsataMotor_ = Object.assign({}, " + ", ".join(f"_m_{n}" for n in MODULOK) + ");\n")
    (GYOKER / "backend" / "Csatamotor.gs").write_text("".join(reszek), encoding="utf-8")
    print("backend/Csatamotor.gs kész.")


if __name__ == "__main__":
    main()
