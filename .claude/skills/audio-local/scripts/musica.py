# Música local con ACE-Step 1.5 (turbo + LM 0.6B, backend MLX). Sustituto de la parte "music" de scripts/audio.mjs.
#
#   ~/ai-audio/ACE-Step-1.5/.venv/bin/python musica.py <slug> [--force] [--takes 2] [--keep-server]
#
# Entrada : proyectos/<slug>/audio.json → "music": [{ id, prompt, lengthMs, instrumental?, lyrics?, vocalLanguage?, bpm? }]
# Salida  : proyectos/<slug>/assets/audio/<id>.wav        (toma A, 48 kHz estéreo)
#           proyectos/<slug>/assets/audio/alt/<id>.b.wav  (tomas extra para elegir de oído)
#           proyectos/<slug>/assets/audio.manifest.json   (conserva la parte "sfx")
#
# Arranca el servidor de ACE-Step si no está en marcha y lo apaga al terminar (salvo --keep-server): ocupa ~7 GB.
import os, sys, json, time, argparse, subprocess, urllib.request, tempfile
from _common import video_dir, read_json, write_json, short_hash, probe_duration, ffmpeg, warn_memory, AI

API = "http://127.0.0.1:8001"
ACE = f"{AI}/ACE-Step-1.5"
ENGINE = "local:ace-step-1.5-turbo/lm-0.6B"
JOB_TIMEOUT = 15 * 60


def call(path, body=None, timeout=60):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body is not None else None,
                                 headers={"Content-Type": "application/json"})
    return json.loads(urllib.request.urlopen(req, timeout=timeout).read())


def server_up():
    try: call("/v1/models", timeout=3); return True
    except Exception: return False


def start_server():
    os.makedirs(f"{AI}/logs", exist_ok=True)
    env = dict(os.environ, ACESTEP_LM_BACKEND="mlx", TOKENIZERS_PARALLELISM="false")
    log = open(f"{AI}/logs/ace_api.log", "w")
    p = subprocess.Popen([f"{ACE}/.venv/bin/acestep-api", "--host", "127.0.0.1", "--port", "8001"], cwd=ACE, env=env,
                         stdout=log, stderr=subprocess.STDOUT)
    for _ in range(300):
        if server_up(): return p
        if p.poll() is not None: sys.exit(f"✗ El servidor de ACE-Step se cerró. Mira {AI}/logs/ace_api.log")
        time.sleep(2)
    p.terminate(); sys.exit("✗ El servidor de ACE-Step no respondió en 10 min")


def generate(m, takes):
    secs = (m.get("lengthMs") or 30000) / 1000
    instrumental = m.get("instrumental", not m.get("lyrics"))
    body = dict(prompt=m["prompt"], lyrics="[Instrumental]" if instrumental else m["lyrics"],
                audio_duration=min(600, max(10, secs)), thinking=True, batch_size=takes, audio_format="wav",
                inference_steps=8, vocal_language=m.get("vocalLanguage", "es"))
    if m.get("bpm"): body["bpm"] = m["bpm"]
    tid = call("/release_task", body)["data"]["task_id"]; t0 = time.time()
    while True:
        time.sleep(3)
        d = call("/query_result", {"task_id_list": [tid]})["data"][0]
        if d["status"] == 1: break
        if d["status"] == 2: raise RuntimeError(f"ACE-Step falló: {str(d.get('result'))[:300]}")
        if time.time() - t0 > JOB_TIMEOUT:
            raise RuntimeError("más de 15 min: probablemente falta memoria (cierra Premiere) y se está paginando")
    urls = [r["file"] if r["file"].startswith("http") else API + r["file"] for r in json.loads(d["result"])]
    return urls, secs, time.time() - t0


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("slug"); ap.add_argument("--force", action="store_true")
    ap.add_argument("--takes", type=int, default=2); ap.add_argument("--keep-server", action="store_true")
    a = ap.parse_args()

    vdir = video_dir(a.slug); spec = read_json(f"{vdir}/audio.json")
    music = spec.get("music") or []
    music = music if isinstance(music, list) else [music]
    if not music: print("audio.json no tiene 'music'"); return
    adir = f"{vdir}/assets/audio"; os.makedirs(f"{adir}/alt", exist_ok=True)
    man_path = f"{vdir}/assets/audio.manifest.json"
    man = read_json(man_path, {"slug": a.slug, "music": [], "sfx": []})
    prev = {m["id"]: m for m in man.get("music", [])}

    results, todo = [], []
    for m in music:
        if not m.get("id") or not m.get("prompt"): sys.exit(f"✗ Música inválida: {m}")
        h = short_hash(m["prompt"], m.get("lengthMs"), m.get("instrumental"), m.get("lyrics"), m.get("bpm"), ENGINE)
        c = prev.get(m["id"])
        if not a.force and c and c.get("hash") == h and os.path.exists(f"{adir}/{m['id']}.wav"):
            print(f"= {m['id']} (cache)"); results.append(c)
        else:
            todo.append((m, h)); results.append(None)

    proc = None
    if todo:
        warn_memory(45)
        if not server_up():
            print("Arrancando ACE-Step (la primera pieza tarda más: carga los modelos)…", flush=True)
            proc = start_server()
        tmp = tempfile.mkdtemp(prefix="musica-local-")
        try:
            for m, h in todo:
                urls, secs, el = generate(m, max(1, a.takes))
                files = []
                for i, u in enumerate(urls):
                    raw = f"{tmp}/{m['id']}_{i}.wav"; urllib.request.urlretrieve(u, raw)
                    dst = f"{adir}/{m['id']}.wav" if i == 0 else f"{adir}/alt/{m['id']}.{'abcdefgh'[i]}.wav"
                    # ACE-Step genera 10 s como mínimo: recorta con fundido si se pidió menos
                    af = f"atrim=0:{secs},afade=t=out:st={max(0, secs - 0.8)}:d=0.8" if secs < 10 else None
                    ffmpeg(raw, dst, af=af, channels=2); files.append(os.path.relpath(dst, vdir))
                dur = probe_duration(f"{adir}/{m['id']}.wav")
                print(f"♪ {m['id']}  {dur}s  ({len(files)} tomas en {el:.0f}s)", flush=True)
                results[results.index(None)] = dict(id=m["id"], prompt=m["prompt"], file=files[0], alternates=files[1:],
                                                    duration=dur, instrumental=m.get("instrumental", not m.get("lyrics")),
                                                    modelId=ENGINE, hash=h)
        finally:
            if proc and not a.keep_server:
                proc.terminate(); proc.wait(timeout=60); print("ACE-Step detenido (memoria liberada)")

    man["music"] = results; man["slug"] = a.slug; man.setdefault("sfx", [])
    write_json(man_path, man)
    print(f"\n→ {man_path}\n  {len(results)} piezas de música")


if __name__ == "__main__":
    main()
