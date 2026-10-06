# Seguimiento horizontal de la ponente (1 muestra/s) para reencuadrar en pantalla dividida y ventana.
# Entrada: miniaturas en gris 192x108 a 1 fps (work/diag/gray_192x108_1fps.raw).
# Fondo de referencia: media de los fotogramas vacíos (la ponente fuera de cuadro, 1232-1292 s).
import json, os
W, H = 192, 108
ROOT = os.path.join(os.path.dirname(__file__), "..", "work")
raw = open(os.path.join(ROOT, "diag", "gray_192x108_1fps.raw"), "rb").read()
N = len(raw) // (W * H)
frames = [raw[i*W*H:(i+1)*W*H] for i in range(N)]
empty = list(range(1232, 1292))
bg = [sum(frames[k][p] for k in empty) / len(empty) for p in range(W*H)]
out = []
for t, f in enumerate(frames):
    cols = [0]*W; rows_first = [None]*W
    total = 0; sx = 0
    for y in range(H):
        base = y*W
        for x in range(W):
            if bg[base+x] - f[base+x] > 22:
                cols[x] += 1; total += 1; sx += x
                if rows_first[x] is None: rows_first[x] = y
    pres = [x for x in range(W) if cols[x] >= 5]
    if total < 150 or not pres:
        out.append({"t": t, "p": False}); continue
    x1, x2 = min(pres), max(pres)
    cx = sx / total
    top = min(rows_first[x] for x in pres if rows_first[x] is not None)
    # cabeza: centro de masa de las 14 filas superiores de la figura
    hs = 0; hn = 0
    for y in range(top, min(H, top+14)):
        for x in range(W):
            if bg[y*W+x] - f[y*W+x] > 22: hs += x; hn += 1
    hx = hs/hn if hn else cx
    k = 1920 / W
    out.append({"t": t, "p": True, "x1": round(x1*k), "x2": round((x2+1)*k), "cx": round(cx*k), "hx": round(hx*k), "top": round(top*k)})
json.dump(out, open(os.path.join(ROOT, "tracking", "ponente_1fps.json"), "w"))
pres = [o for o in out if o["p"]]
print("muestras", N, "con ponente", len(pres))
import statistics as st
print("cx min/med/max", min(o["cx"] for o in pres), st.median(o["cx"] for o in pres), max(o["cx"] for o in pres))
print("hx min/med/max", min(o["hx"] for o in pres), st.median(o["hx"] for o in pres), max(o["hx"] for o in pres))
print("ancho figura med", st.median(o["x2"]-o["x1"] for o in pres), "top med", st.median(o["top"] for o in pres))
gaps=[]; s=None
for o in out:
    if not o["p"] and s is None: s=o["t"]
    if o["p"] and s is not None: gaps.append((s,o["t"])); s=None
if s is not None: gaps.append((s,N))
print("sin ponente:", [(a,b) for a,b in gaps if b-a>=2])

# ——— Serie suavizada para el montaje (src/datos/seguimiento.json) ———
# Huecos sin ponente: se rellenan con la muestra válida más cercana. Media móvil centrada de 5 s
# y limitación de velocidad (máx. 60 px/s) para que el reencuadre no "persiga" cada gesto.
def rellenar(key):
    vals = [o.get(key) if o["p"] else None for o in out]
    last = next(v for v in vals if v is not None)
    fw = []
    for v in vals:
        if v is not None: last = v
        fw.append(last)
    nxt = next(v for v in reversed(vals) if v is not None)
    bw = []
    for v in reversed(vals):
        if v is not None: nxt = v
        bw.append(nxt)
    bw.reverse()
    return [fw[i] if vals[i] is not None else (fw[i] + bw[i]) / 2 for i in range(len(vals))]

def suavizar(serie, r=2, vmax=60):
    n = len(serie)
    m = [sum(serie[max(0, i-r):min(n, i+r+1)]) / (min(n, i+r+1) - max(0, i-r)) for i in range(n)]
    o = [m[0]]
    for v in m[1:]:
        d = max(-vmax, min(vmax, v - o[-1])); o.append(o[-1] + d)
    return [round(v) for v in o]

serie = {"hx": suavizar(rellenar("hx")), "cx": suavizar(rellenar("cx")), "presente": [1 if o["p"] else 0 for o in out]}
dst = os.path.join(os.path.dirname(__file__), "..", "src", "datos", "seguimiento.json")
json.dump(serie, open(dst, "w"), separators=(",", ":"))
print("escrito", dst, os.path.getsize(dst), "bytes")
