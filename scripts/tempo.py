# Tempo y fase por autocorrelación de la envolvente de ataques (sin numpy).
import sys, subprocess, struct, math
f=sys.argv[1]; t0=float(sys.argv[2]) if len(sys.argv)>2 else 0; t1=float(sys.argv[3]) if len(sys.argv)>3 else 1e9
raw=subprocess.run(['ffmpeg','-loglevel','error','-i',f,'-ac','1','-ar','4000','-f','s16le','-'],capture_output=True).stdout
s=struct.unpack('<%dh'%(len(raw)//2),raw); sr=4000; hop=40  # 10 ms
E=[math.log1p(sum(x*x for x in s[i:i+hop])/hop) for i in range(0,len(s)-hop,hop)]
O=[max(0,E[i]-E[i-1]) for i in range(1,len(E))]
a=int(t0*100); b=min(len(O),int(t1*100)); O=O[a:b]
best=None
for lag in range(30,110):  # 0.30–1.10 s
    c=sum(O[i]*O[i+lag] for i in range(len(O)-lag))/(len(O)-lag)
    if best is None or c>best[0]: best=(c,lag)
lag=best[1]
# refinamiento sub-muestra y fase
cands=[]
for L in [lag+d/10 for d in range(-10,11)]:
    for ph in range(0,int(L)):
        sc=0; k=0
        while ph+k*L < len(O)-1: sc+=O[int(round(ph+k*L))]; k+=1
        cands.append((sc/k,L,ph))
sc,L,ph=max(cands)
print(f'period {L/100:.4f}s  bpm {6000/L:.1f}  first beat {t0+ph/100:.3f}s')
