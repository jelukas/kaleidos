"""`kaleidos media`: proyectos/<slug>/media/ con ENLACES DUROS a lo que necesita el motor (--public-dir).

mezzanine.mp4 · plancha.mp4 y mascara.mp4 (si hay recorte) · audio.m4a · timeline.json · extras/. En un proyecto de
narración (sin bruto): narracion.m4a (de `kaleidos voz`) · timeline.json · extras/, y props con `media.audio = narracion.m4a` (§8 del motor). Nada se copia:
un enlace duro no ocupa disco y evita las copias de Remotion que llenaron el disco en el proyecto anterior.

`media/extras/` reúne (clave = nombre sin extensión, la que usan `timeline.json` y `props.media.extras`):
- `work/extras/*` (ilustraciones de `profundidad`/`ampliar`),
- `assets/images/*` (láminas de `scripts/images.mjs`) y `assets/captures/*.png` (capturas de `scripts/capture.mjs`),
- la música y los efectos que declara `proyecto.json › audio` (musica.*.archivo y sfx.*), buscados en
  `audio.origen` (por defecto `estilos/<estilo>/audio/`; nunca en sus subcarpetas, p. ej. `originales/`).
También escribe props-local.json (props pequeñas del contrato §4) junto al proyecto. Se puede relanzar cuando
lleguen extras nuevos: rehace los enlaces que apunten a otro inodo.
"""

from __future__ import annotations

from pathlib import Path

from .comun import RAIZ, Proyecto, aviso, cronometro, enlazar_duro, escribir_json, info

EXT_IMAGEN = {".jpg", ".jpeg", ".png", ".webp"}
EXT_AUDIO = {".mp3", ".wav", ".m4a", ".aac", ".ogg"}
EXT_VIDEO = {".mp4", ".webm", ".mov"}


def claves_audio(cfg: dict) -> list[str]:
    """Claves de media.extras que pide `proyecto.json › audio` (música y efectos)."""
    a = cfg.get("audio") or {}
    out: list[str] = []
    for v in (a.get("musica") or {}).values():
        if isinstance(v, dict) and v.get("archivo"):
            out.append(str(v["archivo"]))
    for v in (a.get("sfx") or {}).values():
        clave = v.get("archivo") if isinstance(v, dict) else v
        if clave:
            out.append(str(clave))
    return list(dict.fromkeys(out))


def origen_audio(proy: Proyecto) -> Path:
    o = (proy.cfg.get("audio") or {}).get("origen") or f"estilos/{proy.cfg.get('estilo')}/audio"
    p = Path(o)
    return p if p.is_absolute() else RAIZ / p


def fuentes_extras(proy: Proyecto, avisar: bool = False) -> tuple[dict[str, Path], list[str]]:
    """clave → fichero de origen de todo lo que va a media/extras/; y la lista de audios declarados que faltan."""
    out: dict[str, Path] = {}

    def poner(clave: str, f: Path) -> None:
        if clave in out and out[clave] != f:
            if avisar:
                aviso(f"extra «{clave}» repetido: se usa {out[clave].relative_to(RAIZ)} y no {f.relative_to(RAIZ)}")
            return
        out[clave] = f

    carpetas = [(proy.work / "extras", EXT_IMAGEN | EXT_AUDIO | EXT_VIDEO),
                (proy.dir / "assets" / "images", EXT_IMAGEN),
                (proy.dir / "assets" / "captures", EXT_IMAGEN)]
    for d, exts in carpetas:
        if d.is_dir():
            for f in sorted(d.iterdir()):
                if f.is_file() and not f.name.startswith(".") and f.suffix.lower() in exts:
                    poner(f.stem, f)
    faltan = []
    od = origen_audio(proy)
    for clave in claves_audio(proy.cfg):
        cand = sorted(f for f in od.glob(f"{clave}.*") if f.is_file() and f.suffix.lower() in EXT_AUDIO) if od.is_dir() else []
        if cand:
            poner(clave, cand[0])
        else:
            faltan.append(f"{od.relative_to(RAIZ) if od.is_relative_to(RAIZ) else od}/{clave}.*")
    return out, faltan


def enlazar_media(proy: Proyecto, silencioso: bool = False) -> dict:
    m = proy.media
    m.mkdir(parents=True, exist_ok=True)
    narracion = proy.narracion
    recorte = bool(proy.cfg.get("ponente", {}).get("recorte")) and not narracion
    if narracion:   # sin bruto: la locución de `kaleidos voz` (el motor la lee de media/narracion.m4a)
        pares = [(proy.audio_narracion, m / "narracion.m4a", True), (proy.dir / "timeline.json", m / "timeline.json", True)]
    else:
        pares = [(proy.work / "mezzanine.mp4", m / "mezzanine.mp4", True),
                 (proy.dir / "timeline.json", m / "timeline.json", True)]
    if recorte:
        pares += [(proy.work / "plancha.mp4", m / "plancha.mp4", True), (proy.work / "mascara.mp4", m / "mascara.mp4", True)]
    # solo el audio del mezzanine (el mismo AAC que se muxó, sin recodificar): con recorte el motor no necesita
    # el vídeo del mezzanine y en Lambda evita subir 1,3 GB por la voz
    audio_src = proy.work / "audio" / "voz_master.m4a"
    if audio_src.exists() and not narracion:
        pares.append((audio_src, m / "audio.m4a", False))
    fuentes, faltan_audio = fuentes_extras(proy, avisar=not silencioso)
    for clave, f in fuentes.items():
        pares.append((f, m / "extras" / f.name, False))
    hecho, faltan = {}, []
    for src, dst, obligatorio in pares:
        if not src.exists():
            if obligatorio:
                faltan.append(str(src.relative_to(proy.dir)))
            continue
        clave = f"extras/{dst.name}" if dst.parent.name == "extras" else dst.name
        hecho[clave] = enlazar_duro(src, dst)
    extras = {}
    if (m / "extras").exists():
        for f in sorted((m / "extras").iterdir()):
            if f.is_file() and not f.name.startswith("."):
                if f.stem in extras:
                    aviso(f"media/extras tiene dos ficheros con la clave «{f.stem}»: {extras[f.stem]} y extras/{f.name}")
                    continue
                extras[f.stem] = f"extras/{f.name}"
    if narracion:
        props = {"timelineSrc": "timeline.json", "estilo": proy.cfg.get("estilo"),
                 "media": {"audio": "narracion.m4a", "extras": extras}}   # §8: la locución va en media.audio
        escribir_json(proy.dir / "props-local.json", props)
    else:
        props = None
    props = props or {"timelineSrc": "timeline.json", "estilo": proy.cfg.get("estilo"),
             "media": {"mezzanine": "mezzanine.mp4",
                       **({"plancha": "plancha.mp4", "mascara": "mascara.mp4"} if recorte else {}),
                       **({"audio": "audio.m4a"} if (m / "audio.m4a").exists() else {}),
                       "extras": extras}}
    if not narracion:
        escribir_json(proy.dir / "props-local.json", props)
    if not silencioso:
        for k, v in hecho.items():
            info(f"media/{k}: {v}")
        for f in faltan:
            info(f"AVISO: falta {f} (se enlazará cuando exista)")
        for f in faltan_audio:
            info(f"AVISO: falta el audio {f} que declara proyecto.json › audio (relanza `media` cuando exista)")
    return {"enlaces": len(hecho), "faltan": faltan, "faltan_audio": faltan_audio, "extras": len(extras)}


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    with cronometro(proy, "media") as extra:
        r = enlazar_media(proy)
        extra.update(r)
    info(f"media: {r['enlaces']} enlaces, {r['extras']} extras declarados en props-local.json")
    return 1 if r["faltan"] else 0
