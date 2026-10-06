"""`kaleidos preparar`: analizar → transcribir → master → recortar → pose, con tiempos en work/logs/tiempos.json.

Secuencial por defecto (cabe en 16 GB). Con `--paralelo`, pose (CPU) corre a la vez que recortar (GPU).
"""

from __future__ import annotations

import argparse
import subprocess
import sys

from .comun import Proyecto, cronometro, info


def _args(comando: str, slug: str, **kw) -> argparse.Namespace:
    from .cli import _parser
    return _parser().parse_args([comando, slug, *sum(([f"--{k.replace('_', '-')}", str(v)] for k, v in kw.items()), [])])


def ejecutar(args) -> int:
    from . import analizar, master, pose, recortar, transcribir

    proy = Proyecto(args.slug)
    pasos = [p for p in ("analizar", "transcribir", "master", "recortar", "pose") if p not in args.sin]
    if not proy.cfg.get("ponente", {}).get("recorte") and "recortar" in pasos:
        pasos.remove("recortar")
    info(f"preparar {args.slug}: {' → '.join(pasos)}")
    with cronometro(proy, "preparar", pasos=pasos):
        for p in pasos:
            if p == "pose" and getattr(args, "paralelo", False) and "recortar" in pasos:
                continue
            if p == "recortar" and getattr(args, "paralelo", False) and "pose" in pasos:
                cmd = [sys.executable, "-m", "kaleidos_tools.cli", "pose", args.slug]
                info("pose en paralelo con recortar")
                hijo = subprocess.Popen(cmd)
                rc = recortar.ejecutar(_args("recortar", args.slug))
                rc2 = hijo.wait()
                if rc or rc2:
                    return rc or rc2
                continue
            modulo = {"analizar": analizar, "transcribir": transcribir, "master": master, "recortar": recortar,
                      "pose": pose}[p]
            rc = modulo.ejecutar(_args(p, args.slug))
            if rc:
                info(f"preparar: {p} terminó con código {rc}")
                return rc
    return 0
