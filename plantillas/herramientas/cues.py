#!/usr/bin/env python3
"""Pone los segundos a los cues de un guion escrito solo con frases (generaliza work/guion/eventos.py de devday-2026).

    python3 plantillas/herramientas/cues.py <slug> [--entrada guion.json] [--salida guion.json]
                                                   [--recalcular] [--estimar] [--comprobar]

Escribe el guion con frases literales y deja que esta herramienta busque cuándo se dicen. En cualquier «cue»,
«hasta» (de evento o de intro), «desdeCue» o «hastaCue», a cualquier profundidad (capítulos, eventos, items,
bocadillos, etiquetas, nodos, hitos, anclas, izq/der, foco, outro…), se admite:

    "frase literal"          → busca la primera aparición
    [null, "frase literal"]  → igual
    [123.4, "frase literal"] → busca desde 123,4 − 2 s (como `tools/kaleidos linea`); si no, la aparición más
                               cercana a 123,4 s (con --recalcular se ignora el segundo)

y sale siempre `[segundo, "frase"]`, que es lo que lee `linea` (docs/CONTRATO.md §2). Los números sueltos
(`"hasta": 12.5`) y `intro.previo` / `outro.coda` no se tocan.

Tiempos de las palabras:
- `work/transcripcion.json` (lo normal: después de `tools/kaleidos transcribir`), con y sin los `fixes` del guion;
- `--estimar` o si no hay transcripción, en narración: estimación desde `locucion.json` (2,75 palabras/s + pausas)
  para revisar el guion antes de gastar en la voz. Los segundos estimados son aproximados: vuelve a pasar la
  herramienta cuando exista la transcripción.

Normaliza igual que `linea` (minúsculas, sin tildes ni puntuación). Avisa de las frases que aparecen más de una vez
(se usa la primera tras el segundo dado: pon un segundo aproximado o más palabras) y sale con 1 si alguna no aparece.
Por defecto lee y escribe `proyectos/<slug>/guion.json` (con --entrada puedes mantener un `guion.frases.json` aparte).
Sin dependencias: Python 3.9 o superior.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[2]
CLAVES_CUE = {"cue", "desdeCue", "hastaCue"}
PALABRAS_POR_SEGUNDO = 2.75


def normalizar(txt: str) -> list[str]:
    """Idéntica a `normalizar` de tools/src/kaleidos_tools/linea.py."""
    t = unicodedata.normalize("NFD", str(txt).lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^\w\s]", " ", t)
    return t.split()


def palabras_transcripcion(ruta: Path) -> list[tuple[str, float]]:
    d = json.loads(ruta.read_text(encoding="utf-8"))
    ws = d.get("palabras") or [w for s in d.get("segmentos", []) for w in s.get("palabras", [])]
    out = []
    for w in ws:
        t = w.get("ini", w.get("inicio", w.get("start")))
        if t is None:
            continue
        for n in normalizar(w.get("t", w.get("texto", w.get("word", "")))):
            out.append((n, float(t)))
    return out


def palabras_estimadas(loc: dict) -> list[tuple[str, float]]:
    out, t = [], 0.0
    pausa = float(loc.get("pausaEntreBloques", 0.35))
    bloques = loc.get("bloques") or []
    for k, b in enumerate(bloques):
        for n in normalizar(b.get("texto", "")):
            out.append((n, round(t, 2)))
            t += 1 / PALABRAS_POR_SEGUNDO
        t += float(b.get("pausaDespues", pausa if k < len(bloques) - 1 else 0))
    return out


def con_fixes(palabras: list[tuple[str, float]], fixes: dict) -> list[tuple[str, float]]:
    """Aplica los `fixes` del guion a la secuencia (frases primero), como hace `linea` antes de buscar."""
    reglas = sorted(((normalizar(k), normalizar(v)) for k, v in (fixes or {}).items() if normalizar(k)),
                    key=lambda r: -len(r[0]))
    if not reglas:
        return palabras
    toks = [p[0] for p in palabras]
    out, i = [], 0
    while i < len(palabras):
        for clave, rep in reglas:
            n = len(clave)
            if toks[i:i + n] == clave:
                out += [(r, palabras[i][1]) for r in rep]
                i += n
                break
        else:
            out.append(palabras[i])
            i += 1
    return out


class Resolutor:
    def __init__(self, secuencias: list[list[tuple[str, float]]], recalcular: bool):
        self.secuencias = secuencias
        self.recalcular = recalcular
        self.resueltos = 0
        self.no_encontrados: list[str] = []
        self.repetidos: dict[str, int] = {}

    def _buscar(self, objetivo: list[str], desde: float | None) -> tuple[float | None, int]:
        for pal in self.secuencias:
            toks = [p[0] for p in pal]
            n = len(objetivo)
            hits = [i for i in range(len(toks) - n + 1) if toks[i:i + n] == objetivo]
            if not hits:
                continue
            if desde is not None:
                tras = [i for i in hits if pal[i][1] >= desde - 2.0]
                cerca = tras[0] if tras else min(hits, key=lambda i: abs(pal[i][1] - desde))
                return pal[cerca][1], len(hits)
            return pal[hits[0]][1], len(hits)
        return None, 0

    def cue(self, valor, donde: str):
        if isinstance(valor, str):
            seg, frase = None, valor
        elif isinstance(valor, list) and len(valor) == 2 and isinstance(valor[1], str) \
                and (valor[0] is None or isinstance(valor[0], (int, float))):
            seg, frase = valor
        else:
            return valor                              # número suelto u otra forma: no es un cue
        objetivo = normalizar(frase)
        if not objetivo:
            return valor
        pista = None if (self.recalcular or seg is None) else float(seg)
        t, n = self._buscar(objetivo, pista)
        if t is None:
            self.no_encontrados.append(f"{donde}: «{frase}»")
            return [seg if seg is not None else 0.0, frase]
        if n > 1 and pista is None:
            self.repetidos[frase] = n
        self.resueltos += 1
        return [round(t, 2), frase]

    def recorrer(self, obj, ruta: str = ""):
        if isinstance(obj, list):
            return [self.recorrer(x, f"{ruta}[{i}]") for i, x in enumerate(obj)]
        if not isinstance(obj, dict):
            return obj
        out = {}
        for k, v in obj.items():
            aqui = f"{ruta}.{k}" if ruta else k
            if k in CLAVES_CUE or (k == "hasta" and not isinstance(v, (int, float))):
                out[k] = self.cue(v, aqui)
            else:
                out[k] = self.recorrer(v, aqui)
        return out


def main() -> int:
    ap = argparse.ArgumentParser(description="Pone los segundos a los cues de guion.json a partir de las frases.")
    ap.add_argument("slug", help="carpeta en proyectos/ (o ruta a la carpeta del proyecto)")
    ap.add_argument("--entrada", default="guion.json")
    ap.add_argument("--salida", default=None, help="por defecto, la misma que --entrada")
    ap.add_argument("--recalcular", action="store_true", help="ignora los segundos ya escritos")
    ap.add_argument("--estimar", action="store_true", help="tiempos estimados desde locucion.json (narración)")
    ap.add_argument("--comprobar", action="store_true", help="no escribe nada: solo informa")
    a = ap.parse_args()

    d = Path(a.slug)
    d = d if d.is_dir() and (d / "proyecto.json").exists() else RAIZ / "proyectos" / a.slug
    entrada, salida = d / a.entrada, d / (a.salida or a.entrada)
    if not entrada.exists():
        print(f"✗ no existe {entrada}", file=sys.stderr)
        return 2
    guion = json.loads(entrada.read_text(encoding="utf-8"))

    tr, loc = d / "work" / "transcripcion.json", d / "locucion.json"
    if tr.exists() and not a.estimar:
        base, fuente = palabras_transcripcion(tr), f"transcripción ({tr.relative_to(d)})"
    elif loc.exists():
        base = palabras_estimadas(json.loads(loc.read_text(encoding="utf-8")))
        fuente = f"ESTIMACIÓN desde locucion.json a {PALABRAS_POR_SEGUNDO} palabras/s (repite tras `transcribir`)"
    else:
        print("✗ no hay work/transcripcion.json ni locucion.json: ejecuta antes `tools/kaleidos transcribir`",
              file=sys.stderr)
        return 2
    if not base:
        print("✗ la fuente de tiempos no tiene palabras", file=sys.stderr)
        return 2

    r = Resolutor([base, con_fixes(base, guion.get("fixes"))], a.recalcular)
    nuevo = r.recorrer(guion)
    print(f"Tiempos: {fuente}; {len(base)} palabras, última a {base[-1][1]:.1f} s")
    print(f"✓ {r.resueltos} cues resueltos")
    for frase, n in r.repetidos.items():
        print(f"! «{frase}» aparece {n} veces: se usa la primera (pon un segundo aproximado o más palabras)")
    for x in r.no_encontrados:
        print(f"✗ no aparece {x}")
    if not a.comprobar:
        salida.write_text(json.dumps(nuevo, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
        print(f"→ {salida.relative_to(RAIZ) if salida.is_relative_to(RAIZ) else salida}")
    return 1 if r.no_encontrados else 0


if __name__ == "__main__":
    sys.exit(main())
