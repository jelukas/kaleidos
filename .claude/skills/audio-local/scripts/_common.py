# Utilidades compartidas por voz.py, musica.py y efectos.py (solo biblioteca estándar + numpy opcional).
# Mantienen el mismo contrato que scripts/tts.mjs y scripts/audio.mjs: mismas rutas, mismos manifiestos.
import hashlib, json, os, re, subprocess, sys, unicodedata

SKILL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ROOT = os.path.abspath(os.path.join(SKILL, "..", "..", ".."))  # kaleidos/
AI = os.path.expanduser("~/ai-audio")
PY_QWEN = f"{AI}/qwen3-tts/.venv/bin/python"
PY_ACE = f"{AI}/ACE-Step-1.5/.venv/bin/python"
PY_SAO = f"{AI}/stable-audio/.venv/bin/python"

# Narrador aprobado (27 sep 2026): voz diseñada con Qwen VoiceDesign y clonada con Base. Castellano, Δθ 13–18 dB.
NARRADOR_REF = f"{SKILL}/assets/narrador_ref.wav"
NARRADOR_TEXT = "Te entiendo. Y tu equipo deja de hacer el seguimiento a mano."


def video_dir(slug):
    d = os.path.join(ROOT, "proyectos", slug)
    if not os.path.isdir(d): sys.exit(f"✗ No existe {d}")
    return d


def read_json(path, default=None):
    if not os.path.exists(path):
        if default is not None: return default
        sys.exit(f"✗ No existe {path}")
    with open(path) as f: return json.load(f)


def write_json(path, data):
    with open(path, "w") as f: f.write(json.dumps(data, ensure_ascii=False, indent=2) + "\n")


def short_hash(*parts):
    return hashlib.sha256(json.dumps(parts, ensure_ascii=False).encode()).hexdigest()[:16]


def probe_duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
                         capture_output=True, text=True, check=True).stdout
    return round(float(out.strip()), 3)


def ffmpeg(src, dst, af=None, channels=1, rate=48000):
    cmd = ["ffmpeg", "-y", "-loglevel", "error", "-i", src]
    if af: cmd += ["-af", af]
    cmd += ["-ar", str(rate), "-ac", str(channels), dst]
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError(f"ffmpeg falló: {r.stderr.strip()}")


def strip_tags(text):
    """Quita las etiquetas de ElevenLabs v3 ([serious], [sighs]…): Qwen las leería en voz alta."""
    return re.sub(r"\s{2,}", " ", re.sub(r"\[[^\]]*\]", " ", text)).strip()


def free_memory_pct():
    try:
        out = subprocess.run(["memory_pressure"], capture_output=True, text=True, timeout=20).stdout
        return int(re.search(r"free percentage:\s*(\d+)%", out).group(1))
    except Exception:
        return None


def warn_memory(need_pct=35):
    pct = free_memory_pct()
    if pct is not None and pct < need_pct:
        print(f"⚠ Solo hay un {pct}% de memoria libre. Cierra Premiere u otras apps pesadas: con poca memoria "
              f"los modelos paginan a disco y una generación de minutos puede tardar horas.", flush=True)


# ── Acento castellano (Δθ) ─────────────────────────────────────────────────────
def norm_word(w):
    return "".join(c for c in unicodedata.normalize("NFD", w.lower()) if c.isalnum() and unicodedata.category(c) != "Mn")


def is_theta(w):  # palabra con /θ/ (z, ce, ci) y sin /s/
    return ("z" in w or "ce" in w or "ci" in w) and "s" not in w


def is_s(w):  # palabra con /s/ y sin /θ/
    return "s" in w and "z" not in w and "ce" not in w and "ci" not in w


def has_theta_test(text):
    ws = [norm_word(w) for w in strip_tags(text).split()]
    return any(is_theta(w) for w in ws) and any(is_s(w) for w in ws)
