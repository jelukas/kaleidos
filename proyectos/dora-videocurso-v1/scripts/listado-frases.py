# Listado local por frases con marcas de tiempo (work/transcripcion/frases.txt) para decidir las tomas.
import json, os, re
ROOT = os.path.join(os.path.dirname(__file__), "..", "work", "transcripcion")
c = json.load(open(os.path.join(ROOT, "captions.json")))
c = [w for w in c if w["text"].strip() and not re.match(r"^\s*[-–]\s*$", w["text"])]
frases = []; cur = []
for w in c:
    if cur and (w["startMs"] - cur[-1]["endMs"] > 900):
        frases.append(cur); cur = []
    cur.append(w)
    if re.search(r"[.?!]$", w["text"].strip()) and len(cur) > 3:
        frases.append(cur); cur = []
if cur: frases.append(cur)
def f(ms):
    s = ms / 1000; return f"{s:7.2f}"
with open(os.path.join(ROOT, "frases.txt"), "w") as o:
    prev = 0
    for fr in frases:
        gap = (fr[0]["startMs"] - prev) / 1000
        o.write(f"{f(fr[0]['startMs'])}-{f(fr[-1]['endMs'])} (+{gap:4.1f}) {''.join(w['text'] for w in fr).strip()}\n")
        prev = fr[-1]["endMs"]
print(len(frases), "frases")
