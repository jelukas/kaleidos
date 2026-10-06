"""CLI única: `uv run --project tools kaleidos <comando> <slug> [opciones]` (o `tools/kaleidos …`)."""

from __future__ import annotations

import argparse
import importlib
import sys

COMANDOS = {
    "nuevo": "crea proyectos/<slug>/ (proyecto.json, BRIEF.md, media/, work/); --narracion: sin bruto",
    "voz": "locución TTS de ElevenLabs desde locucion.json → work/voz/, media/narracion.m4a (proyectos de narración)",
    "analizar": "metadatos, hojas de contactos, escenas, movimiento, silencios, sonoridad y fondo",
    "transcribir": "whisper.cpp (Metal) + large-v3-turbo con marcas por palabra",
    "master": "mezzanine 1080p corregido + audio a -16 LUFS / -1,5 dBTP",
    "recortar": "máscara del ponente (RVM en MPS o Apple Vision) + plancha premultiplicada",
    "pose": "MediaPipe PoseLandmarker → pose.json y gestos.json",
    "linea": "guion + transcripción + pose + gestos + plancha → timeline.json",
    "media": "enlaces duros en proyectos/<slug>/media/ para --public-dir",
    "capitulos": "capítulos en formato YouTube → capitulos.txt",
    "preparar": "analizar + transcribir + master + recortar + pose, con tiempos",
    "profundidad": "Depth Anything V2 Base sobre work/ilustraciones/ → media/extras/",
    "ampliar": "Real-ESRGAN x2plus sobre work/ilustraciones/ → media/extras/",
    "instalar": "compila whisper.cpp con Metal y descarga los modelos en tools/modelos/",
}


def _parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(prog="kaleidos", description="Pipeline de preproceso de kaleidos")
    sub = p.add_subparsers(dest="comando", required=True, metavar="comando")

    def cmd(nombre: str, slug: bool = True) -> argparse.ArgumentParser:
        sp = sub.add_parser(nombre, help=COMANDOS[nombre], description=COMANDOS[nombre])
        if slug:
            sp.add_argument("slug", help="carpeta en proyectos/")
        return sp

    s = cmd("nuevo")
    s.add_argument("--bruto", default=None, help="ruta al bruto (p. ej. brutos/prueba1.mp4); no con --narracion")
    s.add_argument("--narracion", action="store_true",
                   help="proyecto sin bruto ni ponente con locución TTS (locucion.json → `kaleidos voz`)")
    s.add_argument("--estilo", default="curso-azul")
    s.add_argument("--metodo", default=None, choices=["clase-larga", "corto-ilustrado"],
                   help="por defecto clase-larga (con bruto) o corto-ilustrado (narración)")
    s.add_argument("--sin-recorte", action="store_true", help="ponente.recorte = false")
    s.add_argument("--titulo", default=None)
    s.add_argument("--idioma", default="es")
    s.add_argument("--prompt", default=None, help="prompt inicial de Whisper (términos del dominio)")
    s.add_argument("--forzar", action="store_true", help="regenera proyecto.json si ya existe")
    s.add_argument("--escenario", action="store_true",
                   help="modo escenario (CONTRATO §7.2): ponente en su caja y gráficos en la caja de diapositiva")
    s.add_argument("--desde-proyecto", default=None, metavar="OTRO",
                   help="reutiliza con enlaces duros el preproceso de otro proyecto del MISMO bruto (mezzanine, "
                        "plancha, máscara, pose, gestos, transcripción, audio máster y análisis)")

    s = cmd("voz")
    s.add_argument("--concurrencia", type=int, default=4, help="peticiones a la vez a ElevenLabs")
    s.add_argument("--forzar", action="store_true", help="regenera todos los bloques (ignora la caché)")
    s.add_argument("--max-caracteres", type=int, default=None, metavar="N",
                   help="no llama a la API si hay que generar más de N caracteres")
    s.add_argument("--simular", action="store_true", help="solo dice qué bloques y cuántos caracteres generaría")

    s = cmd("analizar")
    s.add_argument("--forzar", action="store_true", help="repite también las pasadas ya hechas")

    s = cmd("transcribir")
    s.add_argument("--hilos", type=int, default=6)
    s.add_argument("--trozo-max", type=float, default=120.0, help="segundos máximos por trozo (corte en silencio)")
    s.add_argument("--desde", type=float, default=None, help="solo un tramo: inicio (s)")
    s.add_argument("--duracion", type=float, default=None, help="solo un tramo: duración (s)")
    s.add_argument("--salida", default=None, help="nombre alternativo de salida (sin extensión) para pruebas")
    s.add_argument("--rellenar", action="store_true",
                   help="solo retranscribe los huecos con voz sin palabras de work/transcripcion.json")
    s.add_argument("--sin-corregir", action="store_true",
                   help="narración: no corrige las palabras de Whisper contra el texto de locucion.json")

    s = cmd("master")
    s.add_argument("--solo", choices=["audio", "video"], default=None)
    s.add_argument("--partes", type=int, default=3, help="tramos de vídeo en paralelo")
    s.add_argument("--desde", type=float, default=None, help="extracto de prueba: inicio (s)")
    s.add_argument("--duracion", type=float, default=None, help="extracto de prueba: duración (s)")
    s.add_argument("--cpu", action="store_true", help="cadena clásica de ffmpeg con LUT .cube (sin GPU)")

    s = cmd("recortar")
    s.add_argument("--motor", choices=["rvm", "vision"], default="rvm")
    s.add_argument("--modelo", choices=["resnet50", "mobilenetv3"], default="resnet50")
    s.add_argument("--desde", type=int, default=None, help="fotograma de inicio (reanudar)")
    s.add_argument("--hasta", type=int, default=None, help="fotograma final (exclusivo)")
    s.add_argument("--lote", type=int, default=8, help="fotogramas por lote temporal (T)")
    s.add_argument("--downsample", type=float, default=0.25, help="downsample_ratio de RVM")
    s.add_argument("--fp32", action="store_true", help="no usar half precision")
    s.add_argument("--calidad", choices=["accurate", "balanced", "fast"], default="accurate",
                   help="nivel de calidad de Apple Vision")
    s.add_argument("--medir", type=float, default=None, metavar="SEG",
                   help="solo mide la velocidad en SEG segundos (no toca las salidas)")
    s.add_argument("--solo", choices=["mascara", "plancha"], default=None)
    s.add_argument("--muestras", action="store_true", help="exporta fotogramas de control a work/recorte/")

    s = cmd("pose")
    s.add_argument("--paso", type=int, default=1, help="procesa 1 de cada N fotogramas e interpola")
    s.add_argument("--ancho", type=int, default=960, help="ancho de análisis (baja resolución)")
    s.add_argument("--modelo", choices=["lite", "full", "heavy"], default="full")
    s.add_argument("--manos", action="store_true", help="HandLandmarker además (más lento)")
    s.add_argument("--partes", type=int, default=3, help="procesos en paralelo")
    s.add_argument("--solo-gestos", action="store_true", help="recalcula gestos.json desde pose.json")
    s.add_argument("--desde", type=float, default=None)
    s.add_argument("--duracion", type=float, default=None)

    s = cmd("linea")
    s.add_argument("--estricto", action="store_true", help="los cues no encontrados son bloqueantes")

    cmd("media")
    cmd("capitulos")

    s = cmd("preparar")
    s.add_argument("--sin", nargs="*", default=[], choices=["analizar", "transcribir", "master", "recortar", "pose"],
                   help="pasos que se saltan")
    s.add_argument("--paralelo", action="store_true", help="pose (CPU) a la vez que recortar (GPU)")

    s = cmd("profundidad")
    s.add_argument("--imagen", default=None, help="solo esta imagen de work/ilustraciones/")
    s = cmd("ampliar")
    s.add_argument("--imagen", default=None)
    s.add_argument("--tesela", type=int, default=512)

    s = cmd("instalar", slug=False)
    s.add_argument("--que", nargs="*", default=["whisper", "pose", "rvm"],
                   choices=["whisper", "pose", "manos", "rvm", "profundidad", "ampliar"])
    return p


def main(argv: list[str] | None = None) -> int:
    from .comun import ErrorKaleidos

    args = _parser().parse_args(argv)
    modulo = importlib.import_module(f".{args.comando}", __package__)
    try:
        from .comun import SALIDAS_PASO, Proyecto, independizar_salidas
        if args.comando in SALIDAS_PASO and getattr(args, "slug", None):
            proy = Proyecto(args.slug)
            if proy.cfg.get("preproceso", {}).get("desde"):
                independizar_salidas(proy, args.comando)
        return int(modulo.ejecutar(args) or 0)
    except ErrorKaleidos as e:
        print(f"[kaleidos] ERROR: {e}", file=sys.stderr)
        return 2
    except KeyboardInterrupt:
        print("[kaleidos] interrumpido", file=sys.stderr)
        return 130


if __name__ == "__main__":
    sys.exit(main())
