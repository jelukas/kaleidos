# Mapa rápido de una pista: volumen medio por segundo y golpes graves (bombo) con su periodo.
import sys, subprocess, struct, statistics
f = sys.argv[1]
raw = subprocess.run(['ffmpeg','-loglevel','error','-i',f,'-af','lowpass=f=140','-ac','1','-ar','2000','-f','s16le','-'],capture_output=True).stdout
n=len(raw)//2; s=struct.unpack('<%dh'%n,raw); sr=2000; hop=20
E=[sum(abs(x) for x in s[i:i+hop]) for i in range(0,n-hop,hop)]
raw2 = subprocess.run(['ffmpeg','-loglevel','error','-i',f,'-ac','1','-ar','2000','-f','s16le','-'],capture_output=True).stdout
s2=struct.unpack('<%dh'%(len(raw2)//2),raw2)
sec=[]
for k in range(0,len(s2)//sr):
    seg=s2[k*sr:(k+1)*sr]; rms=(sum(x*x for x in seg)/len(seg))**.5
    sec.append(round(20*__import__('math').log10(max(rms,1)/32768),1))
print('RMS/s:', ' '.join(f'{i}:{v}' for i,v in enumerate(sec)))
mx=sorted(E)[int(len(E)*0.98)]
pk=[round(i*hop/sr,2) for i in range(6,len(E)-6) if E[i]==max(E[i-6:i+7]) and E[i]>0.4*mx]
print('kicks:', pk)
d=[b-a for a,b in zip(pk,pk[1:]) if 0.3<b-a<1.2]
if d: print('median period', round(statistics.median(d),3), 'bpm', round(60/statistics.median(d),1))
