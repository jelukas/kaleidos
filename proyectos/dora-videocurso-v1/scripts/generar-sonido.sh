#!/usr/bin/env bash
# Música y efectos sintetizados desde cero con ffmpeg (osciladores + ruido): sin licencias de terceros.
set -euo pipefail
cd "$(dirname "$0")/../public/audio"
SR=48000
# Pad de intro (La mayor add9, 9,5 s) con leve trémolo, eco de sala y paso bajo.
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "aevalsrc='0.05*(sin(2*PI*110*t)+sin(2*PI*110.55*t)+0.8*sin(2*PI*164.81*t)+0.8*sin(2*PI*165.3*t)+0.55*sin(2*PI*207.65*t)+0.5*sin(2*PI*246.94*t)+0.45*sin(2*PI*277.18*t)+0.45*sin(2*PI*277.8*t))*(1+0.12*sin(2*PI*0.25*t))*min(t/1.6\,1)*min((9.5-t)/2.8\,1)':s=$SR:d=9.5" \
  -af "aecho=0.8:0.6:140|260:0.3|0.18,lowpass=f=2600,highpass=f=60,pan=stereo|c0=c0|c1=c0,aecho=0.8:0.5:17:0.25,loudnorm=I=-22:TP=-3:LRA=7" -ar $SR -c:a pcm_s16le pad_intro.wav
# Pad de cierre (Re mayor add9 → La, 10 s).
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "aevalsrc='0.05*(if(lt(t\,5)\,sin(2*PI*146.83*t)+0.8*sin(2*PI*220*t)+0.6*sin(2*PI*277.18*t)+0.5*sin(2*PI*329.63*t)+0.45*sin(2*PI*369.99*t)\,sin(2*PI*110*t)+0.8*sin(2*PI*164.81*t)+0.6*sin(2*PI*220*t)+0.5*sin(2*PI*277.18*t)+0.45*sin(2*PI*329.63*t)))*(1+0.1*sin(2*PI*0.2*t))*min(t/1.2\,1)*min((10-t)/3\,1)':s=$SR:d=10" \
  -af "aecho=0.8:0.6:140|260:0.3|0.18,lowpass=f=2400,highpass=f=60,pan=stereo|c0=c0|c1=c0,aecho=0.8:0.5:17:0.25,loudnorm=I=-22:TP=-3:LRA=7" -ar $SR -c:a pcm_s16le pad_outro.wav
# Whoosh (0,9 s): ruido rosa con envolvente de subida y caída rápida, filtrado y con fase.
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "anoisesrc=c=pink:r=$SR:a=0.6:d=0.9:s=7" \
  -af "volume='pow(min(t/0.55\,1)\,2)*if(gt(t\,0.55)\,exp(-(t-0.55)*9)\,1)':eval=frame,highpass=f=250,lowpass=f=2200,aphaser=in_gain=0.6:out_gain=0.9:delay=2:decay=0.5:speed=1.5,pan=stereo|c0=c0|c1=c0,alimiter=limit=0.35:level=0,volume=10dB" -ar $SR -c:a pcm_s16le whoosh.wav
# Pop (0,14 s): seno con caída de tono y decaimiento exponencial.
ffmpeg -hide_banner -loglevel error -y -f lavfi -i "aevalsrc='0.5*sin(2*PI*(820*t-1800*t*t))*exp(-t*32)':s=$SR:d=0.14" \
  -af "pan=stereo|c0=c0|c1=c0,afade=t=out:st=0.12:d=0.02" -ar $SR -c:a pcm_s16le pop.wav
ls -la
