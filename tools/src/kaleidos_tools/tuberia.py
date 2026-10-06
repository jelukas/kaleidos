"""Tubería sin ficheros intermedios: ffmpeg (decodifica) → GPU (PyTorch MPS) → ffmpeg (codifica).

Cada «tramo» tiene su decodificador, su codificador y dos hilos de E/S; un único bucle de GPU atiende a
todos los tramos por turnos con lotes de tamaño fijo (se rellena el último para que la función compilada
no se recompile). Los registros de ffmpeg van completos, sin filtrar, a su fichero de log.
"""

from __future__ import annotations

import queue
import subprocess
import threading
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Callable

import numpy as np

from .comun import ErrorKaleidos, escribir_json, info


def decodificador_vt(fuente: Path, ini: int, n: int, fps: float, ancho: int, alto: int) -> list:
    """VideoToolbox decodifica y escala (scale_vt) en la GPU; salida NV12 cruda por stdout.
    (Sin recortes: un `crop` sobre fotogramas de GPU se ignora sin avisar; para recortar, decodificador_sw.)"""
    vf = f"scale_vt=w={ancho}:h={alto},hwdownload,format=nv12"
    return ["ffmpeg", "-hide_banner", "-nostats", "-hwaccel", "videotoolbox", "-hwaccel_output_format", "videotoolbox_vld",
            "-ss", f"{max(0.0, (ini - 0.25) / fps):.4f}", "-i", str(fuente), "-an", "-frames:v", str(n), "-vf", vf,
            "-f", "rawvideo", "-pix_fmt", "nv12", "-"]


def decodificador_sw(fuente: Path, ini: int, n: int, fps: float, ancho: int, alto: int, recorte: str = "",
                     hilos: int = 3) -> list:
    """Decodificación por software (rápida con este tipo de bruto) + escalado en la GPU con scale_vt."""
    return ["ffmpeg", "-hide_banner", "-nostats", "-threads", str(hilos), "-init_hw_device", "videotoolbox=vt",
            "-filter_hw_device", "vt", "-ss", f"{max(0.0, (ini - 0.25) / fps):.4f}", "-i", str(fuente), "-an",
            "-frames:v", str(n), "-vf", f"{recorte}format=nv12,hwupload,scale_vt=w={ancho}:h={alto},hwdownload,format=nv12",
            "-f", "rawvideo", "-pix_fmt", "nv12", "-"]


def codificador_vt(salida: Path, ancho: int, alto: int, fps: float, pix_fmt: str = "nv12", bitrate: str = "6M",
                   gop: int = 50, extra: list | None = None) -> list:
    return ["ffmpeg", "-hide_banner", "-nostats", "-y", "-f", "rawvideo", "-pix_fmt", pix_fmt, "-s", f"{ancho}x{alto}",
            "-r", f"{fps:g}", "-i", "-", "-c:v", "h264_videotoolbox", "-b:v", bitrate,
            "-maxrate", str(int(float(bitrate[:-1]) * 1.6)) + bitrate[-1], "-bufsize", str(int(float(bitrate[:-1]) * 2)) + bitrate[-1],
            "-profile:v", "high", "-g", str(gop), "-color_primaries", "bt709", "-color_trc", "bt709",
            "-colorspace", "bt709", "-color_range", "tv", *(extra or []), str(salida)]


@dataclass
class Tramo:
    nombre: str
    cmd_dec: list | None
    cmd_enc: list | None
    tam_in: int
    n: int
    log: Path
    fuente_bytes: Callable[[], bytes | None] | None = None   # alternativa al decodificador (p. ej. otra GPU)
    leidos: int = 0
    escritos: int = 0
    qin: queue.Queue = field(default_factory=lambda: queue.Queue(24))
    qout: queue.Queue = field(default_factory=lambda: queue.Queue(24))
    error: str | None = None
    fin_lectura: bool = False

    def arrancar(self) -> None:
        self._flog = open(self.log, "a", encoding="utf-8")
        if self.cmd_dec:
            self._flog.write(f"\n$ {' '.join(map(str, self.cmd_dec))}\n")
        if self.cmd_enc:
            self._flog.write(f"\n$ {' '.join(map(str, self.cmd_enc))}\n")
        self._flog.flush()
        self.dec = subprocess.Popen(self.cmd_dec, stdout=subprocess.PIPE, stderr=self._flog,
                                    bufsize=self.tam_in * 2) if self.cmd_dec else None
        self.enc = subprocess.Popen(self.cmd_enc, stdin=subprocess.PIPE, stderr=self._flog,
                                    bufsize=1 << 22) if self.cmd_enc else None
        self._hl = threading.Thread(target=self._leer, daemon=True)
        self._he = threading.Thread(target=self._escribir, daemon=True)
        self._hl.start()
        self._he.start()

    def _leer(self) -> None:
        try:
            while self.leidos < self.n:
                b = self.dec.stdout.read(self.tam_in) if self.dec else self.fuente_bytes()
                if not b or len(b) < self.tam_in:
                    break
                self.qin.put(b)
                self.leidos += 1
        except Exception as e:  # noqa: BLE001
            self.error = f"lectura: {e}"
        finally:
            self.fin_lectura = True
            self.qin.put(None)

    def _escribir(self) -> None:
        try:
            while True:
                b = self.qout.get()
                if b is None:
                    break
                if self.enc:
                    self.enc.stdin.write(b)
                self.escritos += 1
        except Exception as e:  # noqa: BLE001
            self.error = f"escritura: {e}"
        finally:
            if self.enc:
                try:
                    self.enc.stdin.close()
                except OSError:
                    pass

    def cerrar(self) -> None:
        self.qout.put(None)
        self._he.join()
        rc_dec = self.dec.wait() if self.dec else 0
        rc_enc = self.enc.wait() if self.enc else 0
        self._flog.write(f"\n# {self.nombre}: leídos {self.leidos}/{self.n}, escritos {self.escritos}, "
                         f"rc decodificador {rc_dec}, rc codificador {rc_enc}\n")
        self._flog.close()
        if self.error:
            raise ErrorKaleidos(f"{self.nombre}: {self.error} (ver {self.log})")
        if rc_dec not in (0, None) and self.leidos < self.n:
            raise ErrorKaleidos(f"{self.nombre}: el decodificador salió con código {rc_dec} (ver {self.log})")
        if rc_enc != 0:
            raise ErrorKaleidos(f"{self.nombre}: el codificador salió con código {rc_enc} (ver {self.log})")
        if self.leidos != self.n:
            raise ErrorKaleidos(f"{self.nombre}: se esperaban {self.n} fotogramas y llegaron {self.leidos} (ver {self.log})")


def bucle_gpu(tramos: list[Tramo], funcion: Callable, lote: int, dispositivo, progreso: Path | None = None,
              etiqueta: str = "", cada: float = 15.0, forma_salida: Callable | None = None) -> dict:
    """Atiende a los tramos por turnos. `funcion(x_uint8[B, tam_in]) → tensor uint8 [B, tam_out]`."""
    import torch

    for t in tramos:
        t.arrancar()
    activos = list(tramos)
    total = sum(t.n for t in tramos)
    hechos = 0
    t0 = time.time()
    ultimo = t0
    while activos:
        avance = False
        for t in list(activos):
            bs = []
            try:
                b = t.qin.get(timeout=0.02)
            except queue.Empty:
                continue
            if b is not None:
                bs.append(b)
                while len(bs) < lote:
                    try:
                        b = t.qin.get_nowait() if t.qin.qsize() or t.fin_lectura else t.qin.get(timeout=0.2)
                    except queue.Empty:
                        break
                    if b is None:
                        break
                    bs.append(b)
            if bs:
                k = len(bs)
                arr = np.frombuffer(b"".join(bs + [bs[-1]] * (lote - k)), dtype=np.uint8).reshape(lote, -1)
                x = torch.from_numpy(arr).to(dispositivo)
                y = funcion(x)[:k].cpu().numpy()
                for i in range(k):
                    t.qout.put(y[i].tobytes())
                hechos += k
                avance = True
            if b is None:
                activos.remove(t)
        ahora = time.time()
        if ahora - ultimo > cada or not activos:
            ultimo = ahora
            fps = hechos / max(ahora - t0, 1e-6)
            eta = (total - hechos) / fps if fps > 0 else 0
            info(f"{etiqueta}{hechos}/{total} fotogramas · {fps:.1f} fps · quedan {eta / 60:.1f} min")
            if progreso:
                escribir_json(progreso, {"hechos": hechos, "total": total, "fps": round(fps, 2),
                                         "segundos": round(ahora - t0, 1), "eta_s": round(eta),
                                         "tramos": {t.nombre: t.leidos for t in tramos}})
        if not avance and all(t.fin_lectura and t.qin.empty() for t in activos):
            for t in list(activos):
                activos.remove(t)
    for t in tramos:
        t.cerrar()
    seg = time.time() - t0
    return {"fotogramas": hechos, "segundos": round(seg, 1), "fps": round(hechos / max(seg, 1e-6), 1)}
