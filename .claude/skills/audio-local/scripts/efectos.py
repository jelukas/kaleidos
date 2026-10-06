# Efectos de sonido locales con Stable Audio Open 1.0 (diffusers, MPS, fp16). Sustituto de la parte "sfx" de audio.mjs.
#
#   ~/ai-audio/stable-audio/.venv/bin/python efectos.py <slug> [--force] [--takes 2] [--steps 50]
#
# Entrada : proyectos/<slug>/audio.json → "sfx": [{ id, prompt, durationSeconds?, loop?, takes? }]
# Salida  : proyectos/<slug>/assets/audio/sfx/<id>.wav        (toma A, 48 kHz; estéreo si dura ≥ 8 s o es loop)
#           proyectos/<slug>/assets/audio/sfx/alt/<id>.b.wav  (tomas extra para elegir de oído)
#           proyectos/<slug>/assets/audio.manifest.json       (conserva la parte "music")
#
# Cada toma cuesta lo mismo sea un clic o 30 s de lluvia (el modelo siempre genera 47 s): unos 1,5–2,5 min por toma.
import os, sys, time, argparse, tempfile
from _common import video_dir, read_json, write_json, short_hash, probe_duration, ffmpeg, warn_memory

ENGINE = "local:stable-audio-open-1.0/fp16"
NEG = "Low quality, music, melody."


def patch_scheduler():
    # El último paso de CosineDPMSolver pide ruido entre σ=sigma_min y σ=0, fuera del árbol browniano: torchsde entra
    # en recursión infinita y, si solo se acota, divide 0/0 y sale NaN (audio en silencio). En ese paso el ruido se
    # multiplica por σ_siguiente=0, así que se acota la consulta y un intervalo degenerado devuelve ruido cero.
    import torch
    import diffusers.schedulers.scheduling_cosine_dpmsolver_multistep as cm

    class ClampedBrownian(cm.BrownianTreeNoiseSampler):
        def __init__(self, x, sigma_min, sigma_max, *args, **kw):
            self._lo, self._hi, self._x = float(sigma_min), float(sigma_max), x
            super().__init__(x, sigma_min, sigma_max, *args, **kw)

        def __call__(self, sigma, sigma_next):
            lo, hi = (min(max(float(v), self._lo), self._hi) for v in (sigma, sigma_next))
            if abs(lo - hi) < 1e-6: return torch.zeros_like(self._x)
            return super().__call__(torch.tensor(lo), torch.tensor(hi))

    cm.BrownianTreeNoiseSampler = ClampedBrownian


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug"); ap.add_argument("--force", action="store_true")
    ap.add_argument("--takes", type=int, default=2); ap.add_argument("--steps", type=int, default=50)
    a = ap.parse_args()

    vdir = video_dir(a.slug); spec = read_json(f"{vdir}/audio.json")
    sfx = spec.get("sfx") or []
    if not sfx: print("audio.json no tiene 'sfx'"); return
    sdir = f"{vdir}/assets/audio/sfx"; os.makedirs(f"{sdir}/alt", exist_ok=True)
    man_path = f"{vdir}/assets/audio.manifest.json"
    man = read_json(man_path, {"slug": a.slug, "music": [], "sfx": []})
    prev = {s["id"]: s for s in man.get("sfx", [])}

    results, todo = [], []
    for s in sfx:
        if not s.get("id") or not s.get("prompt"): sys.exit(f"✗ SFX inválido: {s}")
        secs = float(s.get("durationSeconds") or 5)
        if not 0.3 <= secs <= 47: sys.exit(f"✗ {s['id']}: durationSeconds debe estar entre 0.3 y 47")
        h = short_hash(s["prompt"], secs, s.get("loop", False), ENGINE, a.steps)
        c = prev.get(s["id"])
        if not a.force and c and c.get("hash") == h and os.path.exists(f"{sdir}/{s['id']}.wav"):
            print(f"= {s['id']} (cache)"); results.append(c)
        else:
            todo.append((len(results), s, secs, h)); results.append(None)

    if todo:
        warn_memory()
        import torch, soundfile as sf
        from diffusers import StableAudioPipeline
        patch_scheduler()
        t0 = time.time()
        pipe = StableAudioPipeline.from_pretrained("stabilityai/stable-audio-open-1.0", torch_dtype=torch.float16).to("mps")
        sr = pipe.vae.sampling_rate
        print(f"Stable Audio Open cargado en {time.time() - t0:.0f}s · {len(todo)} efectos por generar", flush=True)
        tmp = tempfile.mkdtemp(prefix="efectos-local-")
        for idx, s, secs, h in todo:
            n = max(1, int(s.get("takes", a.takes)))
            t0 = time.time()
            audios = pipe(s["prompt"], negative_prompt=NEG, num_inference_steps=a.steps, audio_end_in_s=max(secs, 1.0),
                          num_waveforms_per_prompt=n).audios
            torch.mps.synchronize()
            stereo = secs >= 8 or s.get("loop", False)
            files = []
            for i, w in enumerate(audios):
                x = w.T.float().cpu().numpy()[: int(secs * sr)]
                peak = float(abs(x).max())
                if peak > 0.98: x = x * (0.98 / peak)  # sin esto, PCM de 16 bits recorta los picos
                raw = f"{tmp}/{s['id']}_{i}.wav"; sf.write(raw, x, sr)
                dst = f"{sdir}/{s['id']}.wav" if i == 0 else f"{sdir}/alt/{s['id']}.{'abcdefgh'[i]}.wav"
                ffmpeg(raw, dst, af=f"afade=t=out:st={max(0, secs - 0.05)}:d=0.05", channels=2 if stereo else 1)
                files.append(os.path.relpath(dst, vdir))
            dur = probe_duration(f"{sdir}/{s['id']}.wav")
            print(f"✓ {s['id']}  {dur}s  ({n} tomas en {time.time() - t0:.0f}s)", flush=True)
            results[idx] = dict(id=s["id"], prompt=s["prompt"], file=files[0], alternates=files[1:], duration=dur,
                                modelId=ENGINE, hash=h)

    man["sfx"] = results; man["slug"] = a.slug; man.setdefault("music", [])
    write_json(man_path, man)
    print(f"\n→ {man_path}\n  {len(results)} efectos")


if __name__ == "__main__":
    main()
