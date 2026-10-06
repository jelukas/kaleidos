# Locución local con Qwen3-TTS 1.7B (clon del narrador castellano aprobado). Sustituto de scripts/tts.mjs.
#
#   ~/ai-audio/qwen3-tts/.venv/bin/python voz.py <slug> [--force] [--takes 3] [--min-theta 12] [--no-check]
#
# Entrada : proyectos/<slug>/script.json   (mismo formato que para ElevenLabs; las etiquetas [..] se eliminan)
# Salida  : proyectos/<slug>/assets/voice/<lineId>.wav   (48 kHz mono, loudnorm −16 LUFS / −3 dBTP)
#           proyectos/<slug>/assets/voice.manifest.json  (duraciones + starts acumulados, igual que tts.mjs)
#
# Control de calidad por línea (salvo --no-check): Whisper local comprueba que se dice el texto y, si la frase
# tiene palabras con z/ce/ci y con s, mide Δθ (castellano > 12 dB). Si falla, repite hasta --takes tomas y se
# queda con la mejor.
import os, sys, time, argparse, tempfile
import numpy as np
from _common import (video_dir, read_json, write_json, short_hash, probe_duration, ffmpeg, strip_tags, warn_memory,
                     norm_word, is_theta, is_s, NARRADOR_REF, NARRADOR_TEXT)

ENGINE = "local:qwen3-tts-1.7b-base/narrador-castellano-v1"
WHISPER = "mlx-community/whisper-large-v3-turbo"


def load_mono(path, sr=44100):
    import subprocess
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", path, "-f", "s16le", "-ac", "1", "-ar", str(sr), "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768


def fric_rel(x, sr, t0, t1):
    seg = x[max(0, int((t0 - .03) * sr)):int((t1 + .03) * sr)]; n, hop = 441, 220
    fr = [seg[i:i + n] * np.hanning(n) for i in range(0, len(seg) - n, hop)]
    if not fr: return None
    S = np.abs(np.fft.rfft(np.array(fr), 2048, axis=1)) ** 2; f = np.fft.rfftfreq(2048, 1 / sr)
    hi = S[:, (f > 3500) & (f < 11000)].sum(1); lo = S[:, (f > 100) & (f < 1000)].sum(1)
    mask = hi > lo
    if not mask.any(): return -60.0
    return float(10 * np.log10(hi[mask].max() + 1e-12) - 10 * np.log10(lo.max() + 1e-12))


def wer(ref, hyp):
    r = [norm_word(w) for w in ref.split() if norm_word(w)]; h = [norm_word(w) for w in hyp.split() if norm_word(w)]
    d = np.arange(len(h) + 1)
    for i in range(1, len(r) + 1):
        prev, d[0] = d.copy(), i
        for j in range(1, len(h) + 1):
            d[j] = min(prev[j] + 1, d[j - 1] + 1, prev[j - 1] + (r[i - 1] != h[j - 1]))
    return d[len(h)] / max(1, len(r))


def check(path, text):
    import mlx_whisper
    r = mlx_whisper.transcribe(path, path_or_hf_repo=WHISPER, language="es", word_timestamps=True)
    ws = [w for s in r["segments"] for w in s.get("words", [])]
    x = load_mono(path)
    th = [v for v in (fric_rel(x, 44100, w["start"], w["end"]) for w in ws if is_theta(norm_word(w["word"]))) if v is not None]
    ss = [v for v in (fric_rel(x, 44100, w["start"], w["end"]) for w in ws if is_s(norm_word(w["word"]))) if v is not None]
    delta = round(float(np.median(ss) - np.median(th)), 1) if th and ss else None
    return dict(wer=round(wer(text, r["text"]), 2), theta=delta, heard=r["text"].strip())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug"); ap.add_argument("--force", action="store_true")
    ap.add_argument("--takes", type=int, default=3); ap.add_argument("--min-theta", type=float, default=12.0)
    ap.add_argument("--max-wer", type=float, default=0.25); ap.add_argument("--no-check", action="store_true")
    a = ap.parse_args()

    vdir = video_dir(a.slug); script = read_json(f"{vdir}/script.json")
    lines = script.get("lines") or sys.exit("✗ script.json no tiene 'lines'")
    os.makedirs(f"{vdir}/assets/voice", exist_ok=True)
    man_path = f"{vdir}/assets/voice.manifest.json"
    prev = {l["id"]: l for l in read_json(man_path, {"lines": []}).get("lines", [])}
    tempo = script.get("tempo") or 1

    todo = []
    for ln in lines:
        if not ln.get("id") or not ln.get("text"): sys.exit(f"✗ Línea inválida: {ln}")
        speak = strip_tags(ln["text"]); t = round(tempo * (ln.get("speed") or 1), 3)
        h = short_hash(speak, ENGINE, t)
        out = f"{vdir}/assets/voice/{ln['id']}.wav"
        c = prev.get(ln["id"])
        if not a.force and c and c.get("hash") == h and os.path.exists(out):
            print(f"= {ln['id']} (cache)"); ln["_res"] = c
        else:
            todo.append((ln, speak, t, h, out))

    if todo:
        warn_memory()
        import torch
        from qwen_tts import Qwen3TTSModel
        t0 = time.time()
        model = Qwen3TTSModel.from_pretrained("Qwen/Qwen3-TTS-12Hz-1.7B-Base", device_map="mps",
                                              dtype=torch.bfloat16, attn_implementation="sdpa")
        prompt = model.create_voice_clone_prompt(ref_audio=NARRADOR_REF, ref_text=NARRADOR_TEXT)
        print(f"Qwen3-TTS cargado en {time.time() - t0:.0f}s · {len(todo)} líneas por generar", flush=True)
        import soundfile as sf
        tmpdir = tempfile.mkdtemp(prefix="voz-local-")
        for ln, speak, t, h, out in todo:
            best = None
            tries = 1 if a.no_check else max(1, a.takes)
            for i in range(tries):
                wavs, sr = model.generate_voice_clone(text=speak, language="Spanish", voice_clone_prompt=prompt)
                raw = f"{tmpdir}/{ln['id']}_{i}.wav"; sf.write(raw, wavs[0], sr)
                q = {} if a.no_check else check(raw, speak)
                ok_wer = a.no_check or q["wer"] <= a.max_wer
                ok_theta = a.no_check or q["theta"] is None or q["theta"] >= a.min_theta
                score = (ok_wer, ok_theta, q.get("theta") or 0, -q.get("wer", 0))
                if best is None or score > best[0]: best = (score, raw, q)
                if ok_wer and ok_theta: break
                print(f"  ↻ {ln['id']} toma {i + 1}: WER {q['wer']} Δθ {q['theta']} «{q['heard']}»", flush=True)
            _, raw, q = best
            af = (f"atempo={t}," if t != 1 else "") + "loudnorm=I=-16:TP=-3.0:LRA=11"
            ffmpeg(raw, out, af=af, channels=1)
            dur = probe_duration(out)
            flag = "" if a.no_check else f"  WER {q['wer']}" + (f" Δθ {q['theta']}" if q.get("theta") is not None else "")
            if not a.no_check and (q["wer"] > a.max_wer or (q["theta"] is not None and q["theta"] < a.min_theta)):
                flag += "  ⚠ revisar"
            print(f"✓ {ln['id']}  {dur}s{flag}", flush=True)
            ln["_res"] = dict(id=ln["id"], text=ln["text"], file=f"assets/voice/{ln['id']}.wav", duration=dur, hash=h,
                              **({} if a.no_check else {"check": q}))

    cursor = 0.0; out_lines = []
    for i, ln in enumerate(lines):
        r = ln["_res"]
        gap = (ln.get("gapBefore") or 0) if i == 0 else ln.get("gapBefore", script.get("defaultGap", 0.12))
        cursor += gap; start = round(cursor, 3); cursor += r["duration"]
        out_lines.append(dict(id=r["id"], text=r["text"], file=r["file"], start=start, duration=r["duration"],
                              hash=r["hash"], **({"check": r["check"]} if "check" in r else {})))
    write_json(man_path, dict(slug=a.slug, voiceId="local:narrador-castellano", modelId=ENGINE,
                              totalDuration=round(cursor, 3), lines=out_lines))
    print(f"\n→ {man_path}\n  duración total: {round(cursor, 3)}s ({len(out_lines)} líneas)")


if __name__ == "__main__":
    main()
