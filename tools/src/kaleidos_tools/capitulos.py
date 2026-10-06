"""`kaleidos capitulos`: capítulos en formato YouTube (proyectos/<slug>/capitulos.txt) desde timeline.json.

Reglas de YouTube: el primero en 0:00, al menos tres, y cada uno de 10 s o más (si no, se avisa).
"""

from __future__ import annotations

from .comun import ErrorKaleidos, Proyecto, cronometro, info, leer_json


def _fmt(fr: int, fps: float, largo: bool) -> str:
    s = int(fr // fps)
    h, r = divmod(s, 3600)
    m, s = divmod(r, 60)
    return f"{h}:{m:02d}:{s:02d}" if largo else f"{m}:{s:02d}"


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    ruta = proy.dir / "timeline.json"
    if not ruta.exists():
        raise ErrorKaleidos("falta timeline.json: ejecuta `kaleidos linea`")
    with cronometro(proy, "capitulos") as extra:
        tl = leer_json(ruta)
        fps, dur = tl["fps"], tl["duracion"]
        largo = dur / fps >= 3600
        marcas = [(0, "Introducción · " + (tl.get("intro") or {}).get("titulo", proy.cfg.get("titulo", "")))]
        for c in tl["capitulos"]:
            nombre = f"{c['kicker']} · {c['titulo']}" if c.get("kicker") else c["titulo"]
            marcas.append((c["desde"], nombre))
        if tl.get("outro"):
            marcas.append((tl["outro"]["desde"], (tl["outro"].get("kicker") or "Cierre")))
        avisos = []
        limpio = list(marcas)
        k = 0
        while k < len(limpio):            # YouTube: cada capítulo ≥ 10 s
            fin = limpio[k + 1][0] if k + 1 < len(limpio) else dur
            if fin - limpio[k][0] >= 10 * fps or len(limpio) == 1:
                k += 1
                continue
            if k == 0 and len(limpio) > 1:    # el primero debe seguir en 0:00: hereda el nombre del siguiente
                avisos.append(f"«{limpio[0][1]}» dura menos de 10 s: 0:00 pasa a ser «{limpio[1][1]}»")
                limpio[0:2] = [(0, limpio[1][1])]
            else:
                avisos.append(f"«{limpio[k][1]}» dura menos de 10 s: se une al anterior")
                del limpio[k]
        lineas = [f"{_fmt(d, fps, largo)} {n}" for d, n in limpio]
        (proy.dir / "capitulos.txt").write_text("\n".join(lineas) + "\n", encoding="utf-8")
        if len(limpio) < 3:
            avisos.append("YouTube necesita al menos tres capítulos")
        for a in avisos:
            info(f"AVISO: {a}")
        info(f"capitulos.txt: {len(limpio)} capítulos; duración {_fmt(dur, fps, largo)}")
        print("\n".join(lineas))
        extra.update({"capitulos": len(limpio), "avisos": len(avisos)})
    return 0
