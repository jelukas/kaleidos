# Voz de la persona para los planos con H3: genera tomas con ElevenLabs v3, mide el acento
# (distinción /θ/ castellana en «hacer») y monta líneas, conversación y pistas objetivo.
#   python3 scripts/persona-voice.py --project proyectos/ensaya-promo-v6-el --voice <id> --gender m [--takes 3]
import os, sys, json, argparse, subprocess, urllib.request, uuid, unicodedata, math, wave, struct, concurrent.futures as cf
import numpy as np

ap = argparse.ArgumentParser()
ap.add_argument('--project', required=True); ap.add_argument('--voice', required=True)
ap.add_argument('--gender', choices=['f', 'm'], required=True); ap.add_argument('--takes', type=int, default=3)
a = ap.parse_args()
EL = os.environ['ELEVENLABS_API_KEY']
P = a.project; A = f'{P}/assets'; TAKES = f'{A}/persona/takes'; os.makedirs(TAKES, exist_ok=True)

LINES = {
    'l1': ("[thoughtful] Mañana tengo la reunión con Clara... [sighs] Mejor la ensayo.", 1.0),
    'l4': ("[confident] Ahora sí. " + ("Lista" if a.gender == 'f' else "Listo") + " para mañana.", 1.0),
    'u1': ("Te entiendo. Y tu equipo deja de hacer el seguimiento a mano.", 1.08),
    'u2': ("¿Lo probamos el jueves con un caso vuestro?", 1.08),
}
MAXDUR = {'l1': 4.5, 'l4': 3.0, 'u1': 3.4, 'u2': 2.3}

def norm(w):
    return ''.join(c for c in unicodedata.normalize('NFD', w.lower()) if c.isalpha() and unicodedata.category(c) != 'Mn')
def words_of(text):
    import re
    return [norm(w) for w in re.sub(r'\[[^\]]*\]', ' ', text).split() if norm(w)]

def tts(text):
    body = {"text": text, "model_id": "eleven_v3", "voice_settings": {"stability": 0.5, "similarity_boost": 0.8}}
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{a.voice}?output_format=mp3_44100_192",
                                 data=json.dumps(body).encode(), headers={"xi-api-key": EL, "Content-Type": "application/json"})
    for i in range(4):
        try: return urllib.request.urlopen(req, timeout=180).read()
        except urllib.error.HTTPError as e:
            if e.code in (409, 429) and i < 3: __import__('time').sleep(2 + 3 * i); continue
            raise

def stt(path):
    b = uuid.uuid4().hex; data = open(path, 'rb').read()
    body = (f'--{b}\r\nContent-Disposition: form-data; name="model_id"\r\n\r\nscribe_v1\r\n--{b}\r\nContent-Disposition: form-data; name="language_code"\r\n\r\nspa\r\n'
            f'--{b}\r\nContent-Disposition: form-data; name="file"; filename="a.wav"\r\nContent-Type: audio/wav\r\n\r\n').encode() + data + f'\r\n--{b}--\r\n'.encode()
    req = urllib.request.Request("https://api.elevenlabs.io/v1/speech-to-text", data=body,
                                 headers={"xi-api-key": EL, "Content-Type": f"multipart/form-data; boundary={b}"})
    return [w for w in json.loads(urllib.request.urlopen(req, timeout=120).read())['words'] if w['type'] == 'word']

def load(path, sr=44100):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768

def fric_rel(x, sr, t0, t1):
    # intensidad (dB) del tramo fricativo sordo más fuerte de la palabra, relativa a su vocal
    seg = x[max(0, int((t0 - .03) * sr)):int((t1 + .03) * sr)]; n = 441; hop = 220
    fr = [seg[i:i + n] * np.hanning(n) for i in range(0, len(seg) - n, hop)]
    if not fr: return None
    S = np.abs(np.fft.rfft(np.array(fr), 2048, axis=1)) ** 2; f = np.fft.rfftfreq(2048, 1 / sr)
    hi = S[:, (f > 3500) & (f < 11000)].sum(1); lo = S[:, (f > 100) & (f < 1000)].sum(1)
    mask = hi > lo
    if not mask.any(): return -60.0
    return float(10 * np.log10(hi[mask].max() + 1e-12) - 10 * np.log10(lo.max() + 1e-12))

def take(key, i):
    text, tempo = LINES[key]
    mp3 = f'{TAKES}/{key}-{i}.mp3'; wav = f'{TAKES}/{key}-{i}.wav'
    open(mp3, 'wb').write(tts(text))
    af = ("silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,"
          "silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,"
          + (f"atempo={tempo}," if tempo != 1.0 else "") + "loudnorm=I=-16:TP=-3.0:LRA=11")
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', mp3, '-af', af, '-ar', '48000', '-ac', '1', wav], check=True)
    dur = len(load(wav, 48000)) / 48000
    ws = stt(wav); got = [norm(w['text']) for w in ws]
    ok = got == words_of(text)
    delta = None
    if key == 'u1' and ok:
        x = load(wav); by = {norm(w['text']): w for w in ws}
        th = fric_rel(x, 44100, by['hacer']['start'], by['hacer']['end'])
        s = fric_rel(x, 44100, by['seguimiento']['start'], by['seguimiento']['end'])
        delta = round(s - th, 1)
    return dict(key=key, i=i, wav=wav, dur=round(dur, 2), ok=ok, got=' '.join(got), delta=delta,
                words=[[w['text'], round(w['start'], 2), round(w['end'], 2)] for w in ws])

jobs = [(k, i) for k in LINES for i in range(a.takes)]
with cf.ThreadPoolExecutor(4) as ex:
    res = list(ex.map(lambda j: take(*j), jobs))
best = {}
for k in LINES:
    cand = [r for r in res if r['key'] == k]
    for r in cand: print(f"  {k}-{r['i']}  dur={r['dur']:.2f}  ok={r['ok']}  Δθ={r['delta']}  «{r['got']}»")
    good = [r for r in cand if r['ok'] and r['dur'] <= MAXDUR[k]] or [r for r in cand if r['ok']] or cand
    if k == 'u1': good.sort(key=lambda r: -(r['delta'] or -99))
    else: good.sort(key=lambda r: abs(r['dur'] - MAXDUR[k] * 0.85))
    best[k] = good[0]; print(f"  → {k}: toma {good[0]['i']}")

# líneas elegidas
import shutil
shutil.copy(best['l1']['wav'], f'{A}/persona/l1.wav'); shutil.copy(best['l4']['wav'], f'{A}/persona/l4.wav')
shutil.copy(best['u1']['wav'], f'{A}/audio/dlg/u1.wav'); shutil.copy(best['u2']['wav'], f'{A}/audio/dlg/u2.wav')
words = json.load(open(f'{A}/audio/dlg/words.json'))
words['u1'] = best['u1']['words']; words['u2'] = best['u2']['words']
json.dump(words, open(f'{A}/audio/dlg/words.json', 'w'), ensure_ascii=False)

# conversación: mismos huecos que la v5, la toma de Clara se mantiene
def dur(p): return len(load(p, 48000)) / 48000
d = {k: dur(f'{A}/audio/dlg/{k}.wav') for k in ('u1', 'c2', 'u2', 'c3')}
offs = {'u1': 0.70}; offs['c2'] = offs['u1'] + d['u1'] + 0.30; offs['u2'] = offs['c2'] + d['c2'] + 0.26; offs['c3'] = offs['u2'] + d['u2'] + 0.30
end = offs['c3'] + d['c3']
if end > 10.2:  # cabe antes del aviso de «Práctica finalizada» (10,3 s)
    k = (10.2 - end) / 3
    offs['c2'] += k; offs['u2'] += 2 * k; offs['c3'] += 3 * k
offs = {k: round(v, 2) for k, v in offs.items()}
print('  conversación:', offs, 'fin', round(offs['c3'] + d['c3'], 2))
D = 10.75
def mix(out, parts, total, sr):
    inputs, flt = [], []
    for i, (f, t) in enumerate(parts):
        inputs += ['-i', f]; ms = int(t * 1000); flt.append(f'[{i}]adelay={ms}|{ms}[a{i}]')
    flt.append(''.join(f'[a{i}]' for i in range(len(parts))) + f'amix=inputs={len(parts)}:normalize=0,apad=whole_dur={total}[o]')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', *inputs, '-filter_complex', ';'.join(flt), '-map', '[o]', '-t', str(total), '-ar', str(sr), '-ac', '1', out], check=True)
mix(f'{A}/audio/conversacion.wav', [(f'{A}/audio/dlg/{k}.wav', o) for k, o in offs.items()], D, 48000)
def env(path):
    w = wave.open(path); sr = w.getframerate(); n = w.getnframes(); x = struct.unpack('<%dh' % n, w.readframes(n))
    step = sr // 30; e = [math.sqrt(sum(v * v for v in x[i:i + step]) / max(1, len(x[i:i + step]))) / 32768 for i in range(0, n, step)]
    m = max(e); return [round(min(1, (v / m) ** 0.7), 3) for v in e]
conv = {'duration': D, 'turns': [{'id': k, 'who': 'clara' if k[0] == 'c' else 'tu', 'start': o, 'env': env(f'{A}/audio/dlg/{k}.wav'), 'words': words[k]} for k, o in offs.items()]}
json.dump(conv, open(f'{A}/audio/conversacion.json', 'w'), ensure_ascii=False)

# pistas objetivo para H3 (su voz sola, en los tiempos del plano)
mix(f'{A}/persona/t1-intro.wav', [(f'{A}/persona/l1.wav', 1.0)], 7, 44100)
mix(f'{A}/persona/t2-sesion.wav', [(f'{A}/audio/dlg/u1.wav', offs['u1']), (f'{A}/audio/dlg/u2.wav', offs['u2'])], 11, 44100)
mix(f'{A}/persona/t3-final.wav', [(f'{A}/persona/l4.wav', 0.5)], 5, 44100)
json.dump({'voice': a.voice, 'gender': a.gender, 'offs': offs, 'l1': best['l1']['words'], 'l4': best['l4']['words'],
           'durs': {k: best[k]['dur'] for k in best}, 'u1_delta_theta_dB': best['u1']['delta']},
          open(f'{A}/persona/voice.json', 'w'), ensure_ascii=False, indent=1)
print('  listo:', json.dumps({k: best[k]['words'] for k in ('l1', 'l4')}, ensure_ascii=False))
