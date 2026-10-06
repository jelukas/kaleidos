"""`kaleidos nuevo`: crea proyectos/<slug>/ con proyecto.json, BRIEF.md, media/ y work/."""

from __future__ import annotations

import re
from pathlib import Path

from .comun import PROYECTOS, RAIZ, ErrorKaleidos, aviso, escribir_json, info, video_info

BRIEF = """# BRIEF · {titulo}

> Intención del vídeo **confirmada con el usuario**. Claude la lee antes de escribir `guion.json`.
> Rellena cada apartado (borra las indicaciones entre corchetes).

- **Proyecto:** `{slug}` · método `{metodo}` · estilo `{estilo}`
- **Bruto:** `{bruto}` ({ancho}×{alto}, {fps:g} fps, {duracion})
- **Confirmado con el usuario:** [fecha y quién]

## Objetivo
[Qué tiene que saber o hacer quien vea el vídeo al terminar.]

## Público
[Perfil, nivel previo, contexto de uso (curso, redes, interno…).]

## Duración y ritmo
[Duración objetivo tras los cortes; densidad de gráficos (p. ej. uno cada ~40 s); energía.]

## Estructura
[Capítulos previstos o criterio para sacarlos de la transcripción.]

## Qué cortar
[Tomas falsas, charla fuera de guion, repeticiones: «quedarse con la última toma buena».]

## Gráficos y 3D
[Tipos de panel preferidos, objetos 3D, qué NO mostrar.]

## Subtítulos y textos
[Idioma, términos del dominio y su grafía (van también a `proyecto.json › whisper.prompt` y a `fixes`).]

## Privacidad
Nada de nombres reales de personas ni datos personales en gráficos, subtítulos destacados ni informes.
Solo nombres ficticios que vengan en el guion.

## Entregables
- `resultados/{slug}.mp4` (render en Lambda, {sal_ancho}×{sal_alto})
- `proyectos/{slug}/capitulos.txt` (capítulos de YouTube)
- `proyectos/{slug}/informe.md`
"""


BRIEF_NARRACION = """# BRIEF · {titulo}

> Intención del vídeo **confirmada con el usuario**. Claude la lee antes de escribir `locucion.json` y `guion.json`.
> Rellena cada apartado (borra las indicaciones entre corchetes).

- **Proyecto:** `{slug}` · **narración** (sin bruto ni ponente; voz TTS de ElevenLabs) · estilo `{estilo}`{escenario}
- **Salida:** {sal_ancho}×{sal_alto} a {fps} fps
- **Confirmado con el usuario:** [fecha y quién]

## Objetivo
[Qué tiene que saber o hacer quien vea el vídeo al terminar.]

## Público
[Perfil, nivel previo, contexto de uso (redes, noticias, interno…).]

## Duración y ritmo
[Duración objetivo (≈ 150 palabras por minuto de locución); densidad de gráficos; energía.]

## Locución (`locucion.json`)
[Voz (id de ElevenLabs o la de `.env`), modelo, tono; bloques de 1–3 frases; pausas entre bloques. Grafía exacta de
siglas y productos: los subtítulos se corrigen contra este texto.]

## Estructura
[Bloques / capítulos previstos.]

## Gráficos
[Tipos de panel, láminas, títulos; disposiciones `completa` o `voz` (caja con la onda de la voz). Sin `gesto3d`.]

## Fuentes y veracidad
[Fuentes de cada dato. Los gráficos resumen lo que dice la voz; no se inventan cifras.]

## Privacidad
Nada de nombres reales de personas ni datos personales en gráficos, subtítulos destacados ni informes, salvo lo que el
usuario dé para el vídeo.

## Entregables
- `resultados/{slug}.mp4` (render en Lambda, {sal_ancho}×{sal_alto})
- `proyectos/{slug}/capitulos.txt` (capítulos de YouTube)
- `proyectos/{slug}/informe.md`
"""


def _audio_estilo(estilo: str, lufs_base: float) -> dict | None:
    """Configuración de `audio` (§7.3) con los archivos que tenga estilos/<estilo>/audio/ (sin subcarpetas)."""
    d = RAIZ / "estilos" / estilo / "audio"
    if not d.is_dir():
        return None
    hay = {f.stem for f in d.iterdir() if f.is_file() and f.suffix.lower() in {".mp3", ".wav", ".m4a", ".aac", ".ogg"}}
    musica = {}
    if "sintonia" in hay:
        musica["sintonia"] = {"archivo": "sintonia", "volumen": 0.5, "fundidoEntrada": 0, "fundidoSalida": 1.5,
                              "hasta": "voz"}
    if "base" in hay:
        musica["base"] = {"archivo": "base", "lufs": lufs_base, "volumen": 0.15, "bucle": True, "fundidoEntrada": 2,
                          "fundidoSalida": 2, "nota": f"bajo la locución TTS: ≈ {lufs_base:g} LUFS medidos (linea calcula el volumen)"}
    if "cierre" in hay:
        musica["cierre"] = {"archivo": "cierre", "volumen": 0.5, "fundidoEntrada": 1, "fundidoSalida": 2}
    sfx = {}
    for tipo, clave, vol in (("titulo", "sfx-destello", 0.5), ("bocadillo", "sfx-pop", 0.45), ("reaccion", "sfx-pop", 0.35),
                             ("disposicion", "sfx-whoosh", 0.35), ("sello", "sfx-golpe", 0.6),
                             ("capitulo", "sfx-ficha", 0.5), ("veredicto", "sfx-sello", 0.5)):
        if clave in hay:
            sfx[tipo] = {"archivo": clave, "volumen": vol}
    if not musica and not sfx:
        return None
    return {"origen": f"estilos/{estilo}/audio", "musica": musica, "sfx": sfx}


def _nuevo_narracion(args) -> int:
    slug = args.slug
    dir_ = PROYECTOS / slug
    pj = dir_ / "proyecto.json"
    if pj.exists() and not args.forzar:
        raise ErrorKaleidos(f"{pj} ya existe (usa --forzar para regenerar solo proyecto.json)")
    estilo = args.estilo
    if not (RAIZ / "estilos" / estilo).exists():
        aviso(f"no existe estilos/{estilo}/ todavía (el motor lo necesitará para renderizar)")
    cfg = {
        "slug": slug,
        "titulo": args.titulo or _titulo_de(slug),
        "narracion": True,                  # sin bruto: la fuente es work/narracion.m4a (`kaleidos voz`)
        "metodo": args.metodo or "corto-ilustrado",
        "estilo": estilo,
        "idioma": args.idioma,
        "salida": {"ancho": 1920, "alto": 1080, "fps": 25},
        "ponente": {"recorte": False},
        "whisper": {"modelo": "large-v3-turbo", "prompt": args.prompt or ""},
        "lambda": {
            "region": "eu-west-1",
            "funcion": "remotion-render-4-0-529-mem3008mb-disk10240mb-900sec",
            "framesPorLambda": 100,
            "crf": 20,
            "conservarSalida": False,
        },
    }
    if args.escenario:
        cfg["escenario"] = True
    audio = _audio_estilo(estilo, -24.0)
    if audio:
        cfg["audio"] = audio
    for sub in ("media", "work", "work/voz", "work/logs", "assets/images", "assets/captures"):
        (dir_ / sub).mkdir(parents=True, exist_ok=True)
    escribir_json(pj, cfg)
    gi = dir_ / ".gitignore"
    if not gi.exists():
        gi.write_text("# Intermedios y enlaces para el motor (se regeneran con tools/kaleidos)\nwork/\nmedia/\nprops-local.json\n",
                      encoding="utf-8")
    brief = dir_ / "BRIEF.md"
    if not brief.exists():
        brief.write_text(BRIEF_NARRACION.format(
            titulo=cfg["titulo"], slug=slug, estilo=estilo, escenario=" · modo escenario" if args.escenario else "",
            sal_ancho=1920, sal_alto=1080, fps=25), encoding="utf-8")
    info(f"proyecto de narración creado en {dir_.relative_to(RAIZ)} (1920×1080 a 25 fps"
         f"{', escenario' if args.escenario else ''}{', audio del estilo' if audio else ''}). Siguiente: escribe "
         f"locucion.json y ejecuta `kaleidos voz {slug}`")
    return 0


def _titulo_de(slug: str) -> str:
    t = re.sub(r"[-_]+", " ", slug).strip()
    return t[:1].upper() + t[1:]


def _salida(ancho: int, alto: int, fps: float) -> dict:
    fps_s = round(fps) if abs(fps - round(fps)) < 0.01 else round(fps, 3)
    if ancho >= alto:
        w = min(1920, ancho)
        h = round(w * alto / ancho / 2) * 2
    else:
        h = min(1920, alto)
        w = round(h * ancho / alto / 2) * 2
    return {"ancho": w, "alto": h, "fps": fps_s}


# Preproceso que se hereda de otro proyecto del mismo bruto (relativo a work/). Un directorio = todos sus
# ficheros (recursivo). Nada se copia: enlaces duros (mismo inodo, sin disco extra).
HEREDABLE = [
    "mezzanine.mp4", "mezzanine.json",
    "plancha.mp4", "plancha.json", "mascara.mp4",
    "pose.json", "gestos.json",
    "transcripcion.json", "transcripcion.txt", "transcripcion_sin_relleno.json",
    "audio",            # voz_master.m4a/.wav (audio máster), voz_16k/48k.wav, master.json
    "lut",              # grade.cube + parametros.json
    "analisis",         # linea usa fuente, audio, rms100ms y fondo; el resto (hojas de contactos…) por completitud
]
NO_HEREDAR = {"tmp"}    # subcarpetas de trabajo que no se heredan


def validar_origen(otro: str, bruto_abs: Path) -> dict:
    """proyecto.json de proyectos/<otro>/ si existe y usa el MISMO bruto (mismo fichero); si no, error."""
    import os

    from .comun import leer_json

    pj = PROYECTOS / otro / "proyecto.json"
    if not pj.exists():
        raise ErrorKaleidos(f"--desde-proyecto: no existe {pj}")
    cfg_otro = leer_json(pj)
    b = Path(cfg_otro["bruto"])
    b = b if b.is_absolute() else RAIZ / b
    if not b.exists() or not os.path.samefile(b, bruto_abs):
        raise ErrorKaleidos(f"--desde-proyecto: «{otro}» usa otro bruto ({cfg_otro['bruto']}); solo se hereda el "
                            "preproceso del mismo bruto")
    return cfg_otro


def heredar_preproceso(dir_: Path, otro: str, bruto_abs: Path) -> dict:
    """Enlaza el preproceso de proyectos/<otro>/work/ en <dir_>/work/. Exige que ambos usen el mismo bruto."""
    from .comun import enlazar_duro

    cfg_otro = validar_origen(otro, bruto_abs)
    src_dir = PROYECTOS / otro
    w_src, w_dst = src_dir / "work", dir_ / "work"
    enlazados, faltan = 0, []
    for rel in HEREDABLE:
        p = w_src / rel
        if not p.exists():
            faltan.append(rel)
            continue
        ficheros = [f for f in p.rglob("*") if f.is_file()] if p.is_dir() else [p]
        for f in ficheros:
            r = f.relative_to(w_src)
            if any(parte in NO_HEREDAR for parte in r.parts[:-1]) or f.name.startswith("."):
                continue
            enlazar_duro(f, w_dst / r)
            enlazados += 1
    for rel in faltan:
        aviso(f"--desde-proyecto: «{otro}» no tiene work/{rel} (habrá que calcularlo)")
    return {"cfg": cfg_otro, "enlazados": enlazados, "faltan": faltan}


def ejecutar(args) -> int:
    slug = args.slug
    if not re.fullmatch(r"[a-z0-9_][a-z0-9-]*", slug):
        raise ErrorKaleidos("el slug debe ir en minúsculas, con cifras y guiones (p. ej. dora-v2)")
    if getattr(args, "narracion", False):
        if args.bruto or getattr(args, "desde_proyecto", None):
            raise ErrorKaleidos("--narracion no admite --bruto ni --desde-proyecto (el proyecto no tiene bruto)")
        return _nuevo_narracion(args)
    if not args.bruto:
        raise ErrorKaleidos("falta --bruto (o --narracion para un proyecto sin bruto con locución TTS)")
    args.metodo = args.metodo or "clase-larga"
    bruto = Path(args.bruto)
    bruto_abs = bruto if bruto.is_absolute() else (RAIZ / bruto)
    if not bruto_abs.exists():
        raise ErrorKaleidos(f"no existe el bruto {bruto_abs}")
    try:
        bruto_rel = str(bruto_abs.resolve().relative_to(RAIZ.resolve()))
    except ValueError:
        bruto_rel = str(bruto_abs.resolve())
        aviso("el bruto está fuera del repositorio; se guarda la ruta absoluta")

    dir_ = PROYECTOS / slug
    pj = dir_ / "proyecto.json"
    if pj.exists() and not args.forzar:
        raise ErrorKaleidos(f"{pj} ya existe (usa --forzar para regenerar solo proyecto.json)")

    vi = video_info(bruto_abs)
    estilo = args.estilo
    if not (RAIZ / "estilos" / estilo).exists():
        aviso(f"no existe estilos/{estilo}/ todavía (el motor lo necesitará para renderizar)")

    corto = args.metodo == "corto-ilustrado"
    cfg = {
        "slug": slug,
        "titulo": args.titulo or _titulo_de(slug),
        "bruto": bruto_rel,
        "metodo": args.metodo,
        "estilo": estilo,
        "idioma": args.idioma,
        "salida": _salida(vi["ancho"], vi["alto"], vi["fps"]),
        "ponente": {"recorte": not args.sin_recorte},
        # corto-ilustrado: montaje 1:1 con el original (sin cortes de silencio).
        "cortes": {"silencioMin": None if corto else 0.8, "margen": 0.25, "colaFinal": 1.6},
        "whisper": {"modelo": "large-v3-turbo", "prompt": args.prompt or ""},
        "lambda": {
            "region": "eu-west-1",
            "funcion": "remotion-render-4-0-529-mem3008mb-disk10240mb-900sec",
            "framesPorLambda": 100,
            "crf": 20,
            "conservarSalida": False,
        },
    }
    if getattr(args, "escenario", False):
        cfg["escenario"] = True          # CONTRATO §7.2
    otro = getattr(args, "desde_proyecto", None)
    if otro:
        if otro == slug:
            raise ErrorKaleidos("--desde-proyecto no puede ser el propio proyecto")
        validar_origen(otro, bruto_abs)  # antes de crear nada
    for sub in ("media", "work", "work/analisis", "work/logs"):
        (dir_ / sub).mkdir(parents=True, exist_ok=True)
    if otro:
        h = heredar_preproceso(dir_, otro, bruto_abs)
        c2 = h["cfg"]
        # la transcripción y el máster heredados se hicieron con la configuración del otro proyecto
        if not args.prompt and c2.get("whisper", {}).get("prompt"):
            cfg["whisper"] = {**cfg["whisper"], **c2["whisper"]}
        if c2.get("salida", {}).get("fps") != cfg["salida"]["fps"]:
            aviso(f"fps de salida distinto del de «{otro}» ({c2.get('salida', {}).get('fps')} ≠ {cfg['salida']['fps']})")
        if cfg["ponente"]["recorte"] and not (dir_ / "work" / "plancha.mp4").exists():
            aviso("recorte activado pero el proyecto de origen no tiene plancha: ejecuta `kaleidos recortar`")
        from datetime import date
        cfg["preproceso"] = {"desde": otro, "enlaces": h["enlazados"], "fecha": date.today().isoformat(),
                             "nota": "work/ enlazado con enlaces duros; los pasos que reescriben una salida la "
                                     "independizan antes (clon), así el proyecto de origen no cambia"}
        info(f"preproceso heredado de «{otro}»: {h['enlazados']} ficheros enlazados (enlaces duros, sin disco extra)")
    escribir_json(pj, cfg)
    gi = dir_ / ".gitignore"
    if not gi.exists():
        gi.write_text("# Intermedios y enlaces para el motor (se regeneran con tools/kaleidos)\nwork/\nmedia/\nprops-local.json\n",
                      encoding="utf-8")
    brief = dir_ / "BRIEF.md"
    if not brief.exists():
        from .comun import hms
        brief.write_text(BRIEF.format(
            titulo=cfg["titulo"], slug=slug, metodo=args.metodo, estilo=estilo, bruto=bruto_rel,
            ancho=vi["ancho"], alto=vi["alto"], fps=vi["fps"], duracion=hms(vi["duracion"]),
            sal_ancho=cfg["salida"]["ancho"], sal_alto=cfg["salida"]["alto"],
        ), encoding="utf-8")
    info(f"proyecto creado en {dir_.relative_to(RAIZ)}: {vi['ancho']}×{vi['alto']} a {vi['fps']:g} fps, "
         f"{vi['duracion']:.1f} s → salida {cfg['salida']['ancho']}×{cfg['salida']['alto']}")
    return 0
