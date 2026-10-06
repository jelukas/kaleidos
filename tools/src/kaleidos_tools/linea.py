"""`kaleidos linea`: guion.json + transcripcion.json + pose.json + gestos.json + plancha.json → timeline.json.

Formato de salida: docs/CONTRATO.md §3 y §7.3 (tiempos en fotogramas de salida; `segmentos[].src` en segundos de la
fuente; coordenadas en píxeles de la fuente). Reglas (docs/METODO_EDICION_IA.md §6 y §9.4):
- Cortes: los del guion (en segundos o por cue) + silencios entre palabras > cortes.silencioMin, dejando
  cortes.margen a cada lado; cortes.colaFinal tras la última palabra. Un segmento de menos de 1,2 s se une al
  vecino recuperando el silencio (≤ 2 s) para que ningún plano dure menos de 1,2 s.
- Tramos sin voz opcionales: `intro.previo` (se antepone: apertura con sintonía) y `outro.coda` (se añade al final:
  cierre con música), en segundos de la fuente, en cualquier punto del bruto. Deben ser silencio (sin palabras).
- Mapa src→dst: un instante dentro de un corte pasa al inicio del tramo siguiente.
- Cues: frase normalizada (minúsculas, sin tildes ni puntuación, tras `fixes`) buscada desde segundo − 2 s;
  se usa el inicio de su primera palabra. Si no aparece: el segundo aproximado + aviso.
- Eventos: fuera de rótulos (se retrasan al final del rótulo) y nunca dos a la vez (≥ 6 fotogramas), salvo
  `reaccion` (dura 1,4 s y puede solaparse; si cae en un rótulo, la intro o el cierre se descarta).
- Disposiciones (§7.3): pista contigua derivada de los eventos. `titulo` y `lamina` → grande; paneles, `pop`,
  `escena3d` e `ilustracion` → dos-cajas; `bocadillo` y `gesto3d` → solo; `sello` hereda la del tramo anterior
  si va pegado (si no, grande); intro y cierre → completa; rótulo de capítulo → grande; `disposicion` explícita
  manda; huecos sin evento → solo (los de < 1,5 s los absorbe el tramo anterior para no parpadear).
- Audio (§7.3): música desde `proyecto.json › audio.musica` (sintonía de apertura, base en bucle bajo la voz y
  cierre, con fundidos) y efectos desde `audio.sfx` (titulo → destello, bocadillo/reaccion → pop, cambio de
  disposición → whoosh, sello → golpe, capítulo → ficha, veredicto de `opciones` opcional). Solo entran los
  archivos presentes en media/extras (si falta alguno se avisa: relanzar `media` y `linea`).
- Planos: forzados según evento y lado (inmutables). En modo escenario el ponente va en su caja: plano medio forzado
  en la disposición «grande» (recuadro pequeño), laterales solo para los bocadillos y abierto para los gesto3d; el
  resto alterna medium/close (punch-in). Sin escenario, el resto cambia en finales de frase cada 4–11 s con el ciclo
  medium, close, medium, wide, close, medium, close;
  cada corte es un cambio de plano; ≥ 1,2 s; el borde inferior de la fuente nunca se ve.
- Subtítulos: páginas ≤ 34 caracteres, cortadas en pausas > 0,5 s o en final de frase.
- Gestos: sin cruzar cortes, fuera de planos cortos (close) y de rótulos; máximo 12, separados ≥ 45 s,
  ordenados por separación × duración.
- Comprobaciones: extras (láminas, capturas, audio) presentes; bocadillos dentro de su lámina; `titulo` fuera de
  rótulos; densidad (aviso si pasan más de 15 s sin un cambio visual).
- Narración (`proyecto.json › narracion: true`, sin bruto ni ponente): la fuente es work/narracion.m4a (`kaleidos
  voz`). Sin cortes, sin planos de cámara (`planos: []`, el motor pone uno neutro) y sin gestos; un segmento
  con toda la locución tras la intro; duración = intro + locución + cola + cierre. Disposiciones `completa` (intro,
  cierre, rótulos, `titulo`, `lamina`, `ilustracion`) y `voz` (diapositiva grande + caja con la onda de la voz: el
  resto y los huecos); `gesto3d` es un error; `bocadillo` y `reaccion` se anclan a la caja de voz (se fuerza `voz`).
  Música base a ≈ −24 LUFS medidos si la configuración no da `lufs`.
Salida distinta de 0 si hay errores bloqueantes (se listan en `avisos` con el prefijo «ERROR:»).
"""

from __future__ import annotations

import json
import re
import statistics as st
import subprocess
import unicodedata
from bisect import bisect_right

from .comun import ErrorKaleidos, Proyecto, cronometro, escribir_json, ffmpeg_bin, ffprobe_bin, info, leer_json

# Cámara virtual (§7.3): s = escala sobre la fuente 4K; (tx, ty) = posición en pantalla de la nariz (1920×1080)
PLANOS = {
    "wide": (0.52, 960, 250), "medium": (0.76, 960, 372), "close": (0.90, 960, 430),
    "sideL": (0.68, 560, 345), "sideR": (0.68, 1360, 345), "popL": (0.74, 640, 368), "card": (0.54, 1440, 262),
}
CICLO = ["medium", "close", "medium", "wide", "close", "medium", "close"]
CICLO_ESCENARIO = ["medium", "close"]    # en su caja: de cintura para arriba, con punch-in al plano corto
KINDS = {"lista", "pasos", "checklist", "comparativa", "opciones", "cifra", "cita", "clave", "linea", "mapa",
         "tarjeta", "caso"}
TIPOS = {"panel", "pop", "escena3d", "gesto3d", "ilustracion", "titulo", "lamina", "bocadillo", "reaccion", "sello"}
REGISTROS = {"show", "editorial", "lamina"}
DISPOSICIONES = {"dos-cajas", "grande", "solo", "completa", "dividida"}
DISP_NARRACION = {"completa", "voz"}
INTRO_NARRACION_S, CIERRE_NARRACION_S, COLA_NARRACION_S = 5.0, 6.0, 0.6
LUFS_BASE_NARRACION = -24.0
FORMAS_BOCADILLO = {"globo", "nube", "grito"}
COLAS_BOCADILLO = {"izq", "der", "abajo"}
ICONOS_REACCION = {"pregunta", "idea", "rayo", "ok", "alerta", "corazon", "reloj"}
TONOS_SELLO = {"ok", "bad", "aviso"}
OBJETOS_3D = {"escudo", "contrato", "registro", "cadena", "balanza", "salida", "orbe", "piramide", "estrellas-ue",
              "reloj", "grafica", "candado", "engranajes", "bombilla", "documento",
              "trofeo", "llave", "escalera", "letras"}          # los cuatro últimos: §7.3 (nuevos)
DUR_DEFECTO_S = {"pop": 3.0, "titulo": 4.0, "lamina": 8.0, "bocadillo": 3.0, "sello": 2.5}
DUR_REACCION_S = 1.4
SEP_EVENTOS = 6
ROTULO_S = 3.4           # 85 fotogramas a 25 fps
PLANO_MIN_S = 1.2
MAX_GESTOS, SEP_GESTOS_S = 12, 45.0
HUECO_DISP_S = 1.5       # un hueco más corto entre dos tramos de disposición no vuelve a «solo»
DENSIDAD_MAX_S = 15.0    # aviso si pasan más de 15 s sin un cambio visual
SFX_SEP = 6              # fotogramas mínimos entre dos efectos (gana el de más prioridad)
SFX_PRIORIDAD = {"sello": 5, "titulo": 4, "veredicto": 4, "capitulo": 3, "bocadillo": 2, "reaccion": 2,
                 "disposicion": 1}


def normalizar(txt: str) -> list[str]:
    t = unicodedata.normalize("NFD", txt.lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    t = re.sub(r"[^\w\s]", " ", t)
    return t.split()


def _mmss(fr: int, fps: float) -> str:
    s = fr / fps
    return f"{int(s // 60)}:{s % 60:04.1f}"


class Linea:
    def __init__(self, proy: Proyecto, estricto: bool = False):
        self.proy = proy
        self.estricto = estricto
        self.avisos: list[str] = []
        self.errores: list[str] = []
        self.f = proy.fuente_info()
        self.fps = float(proy.cfg["salida"].get("fps") or self.f["fps"])
        if abs(self.fps - self.f["fps"]) > 0.01:
            self.aviso(f"fps de salida {self.fps} ≠ fps de la fuente {self.f['fps']}: los segmentos se redondean")
        self.W, self.H = proy.cfg["salida"]["ancho"], proy.cfg["salida"]["alto"]
        self.SW, self.SH = self.f["ancho"], self.f["alto"]
        self.narracion = proy.narracion
        self.recorte = bool(proy.cfg.get("ponente", {}).get("recorte", False)) and not self.narracion
        self.escenario = bool(proy.cfg.get("escenario", False))
        g = proy.dir / "guion.json"
        if not g.exists():
            raise ErrorKaleidos(f"falta {g}")
        self.guion = leer_json(g)
        t = proy.work / "transcripcion.json"
        if not t.exists():
            raise ErrorKaleidos("falta work/transcripcion.json: ejecuta `kaleidos transcribir`")
        self.palabras = self._aplicar_fixes(leer_json(t)["palabras"], self.guion.get("fixes", {}))
        self._indice_tokens()
        self.pose = leer_json(proy.work / "pose.json") if (proy.work / "pose.json").exists() and not self.narracion else None
        if self.pose is None and not self.narracion:
            self.aviso("no hay work/pose.json: los planos se centran con el análisis del fondo")
        gp = proy.work / "gestos.json"
        self.gestos_src = leer_json(gp)["candidatos"] if gp.exists() and not self.narracion else []
        pp = proy.work / "plancha.json"
        self.plancha = leer_json(pp) if pp.exists() and not self.narracion else None
        if self.recorte and self.plancha is None:
            self.aviso("recorte activado pero no hay work/plancha.json (se calcula la geometría con el análisis)")
            from .recortar import geometria_plancha
            self.plancha = geometria_plancha(proy)
        # extras: lo que ya está en media/extras (lo que verá el motor) y lo que `media` podría enlazar
        from .media import fuentes_extras
        ex = proy.media / "extras"
        self.extras_media = {f.stem: f for f in ex.iterdir() if f.is_file() and not f.name.startswith(".")} if ex.exists() else {}
        self.extras_fuente, _ = fuentes_extras(proy)

    # ——— utilidades ———
    def aviso(self, m: str) -> None:
        self.avisos.append(m)

    def error(self, m: str) -> None:
        self.errores.append(m)

    def fr(self, s: float) -> int:
        return int(round(s * self.fps))

    def extra(self, clave: str, que: str, obligatorio: bool = True) -> bool:
        """¿Existe la clave en media/extras? Si solo está en su origen, aviso (falta `media`); si no, error."""
        if clave in self.extras_media:
            return True
        if clave in self.extras_fuente:
            self.aviso(f"{que}: «{clave}» aún no está en media/extras/ (ejecuta `kaleidos media` y repite `linea`)")
            return False
        (self.error if obligatorio else self.aviso)(
            f"{que}: no existe el extra «{clave}» (ni en media/extras/ ni en assets/, work/extras/ o el audio del estilo)")
        return False

    # ——— transcripción ———
    def _aplicar_fixes(self, palabras: list[dict], fixes: dict) -> list[dict]:
        ws = [dict(w) for w in palabras]
        self.fixes_aplicados = 0
        if not fixes:
            return ws
        simples = {normalizar(k)[0]: v for k, v in fixes.items() if len(normalizar(k)) == 1}
        frases = sorted([(normalizar(k), v) for k, v in fixes.items() if len(normalizar(k)) > 1], key=lambda x: -len(x[0]))
        cambios = 0
        # frases primero (por palabras consecutivas)
        i = 0
        out: list[dict] = []
        while i < len(ws):
            hecho = False
            for clave, rep in frases:
                n = len(clave)
                trozo = ws[i:i + n]
                if len(trozo) == n and [x for w in trozo for x in normalizar(w["t"])] == clave:
                    punt = re.search(r"[^\w]*$", trozo[-1]["t"]).group(0)
                    reps = rep.split()
                    if len(reps) == n:
                        for w, r in zip(trozo, reps):
                            out.append({**w, "t": r})
                        out[-1]["t"] += punt if not out[-1]["t"].endswith(punt) else ""
                    else:
                        out.append({**trozo[0], "t": rep + punt, "fin": trozo[-1]["fin"]})
                    i += n
                    cambios += 1
                    hecho = True
                    break
            if not hecho:
                out.append(ws[i])
                i += 1
        for w in out:
            m = re.match(r"^([^\w]*)(.*?)([^\w]*)$", w["t"])
            pre, nucleo, post = m.groups() if m else ("", w["t"], "")
            n = normalizar(nucleo)
            if len(n) == 1 and n[0] in simples:
                w["t"] = pre + simples[n[0]] + post
                cambios += 1
        self.fixes_aplicados = cambios
        return out

    def _indice_tokens(self) -> None:
        self.tok: list[str] = []
        self.tok_w: list[int] = []
        for i, w in enumerate(self.palabras):
            for t in normalizar(w["t"]):
                self.tok.append(t)
                self.tok_w.append(i)
        self.ini_w = [w["ini"] for w in self.palabras]

    def cue(self, c, que: str = "cue") -> float:
        """[segundo, "frase"] → segundos de la fuente (inicio de la primera palabra)."""
        if isinstance(c, (int, float)):
            return float(c)
        if not (isinstance(c, (list, tuple)) and len(c) == 2):
            self.error(f"{que} mal formado: {c!r}")
            return 0.0
        t, frase = float(c[0]), str(c[1])
        objetivo = normalizar(frase)
        if not objetivo:
            return t
        s = self._buscar_cue(t, frase, objetivo)
        if s is None:
            fijo = self._fix_tokens(objetivo)       # el cue escrito como se dice y las palabras ya con `fixes`
            if fijo != objetivo:
                s = self._buscar_cue(t, frase, fijo)
        if s is not None:
            return s
        m = f"cue no encontrado: [{t}, \"{frase}\"]"
        (self.error if self.estricto else self.aviso)(m)
        return t

    def _fix_tokens(self, toks: list[str]) -> list[str]:
        """Aplica `fixes` (en tokens normalizados) a la frase de un cue."""
        fixes = sorted(((normalizar(k), normalizar(v)) for k, v in (self.guion.get("fixes") or {}).items()),
                       key=lambda x: -len(x[0]))
        out, i = [], 0
        while i < len(toks):
            for k, v in fixes:
                if k and toks[i:i + len(k)] == k:
                    out += v
                    i += len(k)
                    break
            else:
                out.append(toks[i])
                i += 1
        return out

    def _buscar_cue(self, t: float, frase: str, objetivo: list[str]) -> float | None:
        k0 = bisect_right(self.ini_w, t - 2.0)
        # primer token de la palabra k0
        j = next((j for j, wi in enumerate(self.tok_w) if wi >= k0), len(self.tok))
        n = len(objetivo)
        while j + n <= len(self.tok):
            if self.tok[j:j + n] == objetivo:
                s = self.palabras[self.tok_w[j]]["ini"]
                if s - t > 30:
                    self.aviso(f"cue encontrado lejos ({s - t:+.1f} s): [{t}, \"{frase}\"] → {s:.2f}")
                return s
            if self.palabras[self.tok_w[j]]["ini"] > t + 300:
                break
            j += 1
        return None

    # ——— cortes y segmentos ———
    def cortes_guion(self) -> list[tuple[float, float]]:
        res = []
        for c in self.guion.get("cortes", []):
            a = self.cue(c["desdeCue"], "desdeCue") if "desdeCue" in c else float(c.get("desde", 0))
            b = self.cue(c["hastaCue"], "hastaCue") if "hastaCue" in c else float(c.get("hasta", self.f["duracion"]))
            if b <= a:
                self.error(f"corte vacío o invertido: {c}")
                continue
            res.append((a, b))
        res.sort()
        # unir solapes
        out: list[list[float]] = []
        for a, b in res:
            if out and a <= out[-1][1]:
                out[-1][1] = max(out[-1][1], b)
            else:
                out.append([a, b])
        return [(a, b) for a, b in out]

    def _rangos_mudos(self, valor, que: str) -> list[tuple[float, float]]:
        """`[a, b]`, `{"desde", "hasta"}` o una lista de ellos (segundos de la fuente) → tramos sin voz validados."""
        if not valor:
            return []
        es_uno = (isinstance(valor, dict)
                  or (isinstance(valor, (list, tuple)) and len(valor) == 2 and all(isinstance(x, (int, float)) for x in valor)))
        brutos = [valor] if es_uno else list(valor)
        out = []
        for r in brutos:
            if isinstance(r, dict):
                a, b = r.get("desde"), r.get("hasta")
            elif isinstance(r, (list, tuple)) and len(r) == 2:
                a, b = r
            else:
                self.error(f"{que} mal formado: {r!r}")
                continue
            a, b = float(a), float(b)
            if b - a < PLANO_MIN_S or a < 0 or b > self.f["duracion"]:
                self.error(f"{que} [{a}, {b}] fuera del bruto o de menos de {PLANO_MIN_S} s")
                continue
            n = sum(1 for w in self.palabras if a <= (w["ini"] + w["fin"]) / 2 < b)
            if n:
                self.error(f"{que} [{a}, {b}] contiene {n} palabras: debe ser un tramo sin voz")
                continue
            rms_d = self.proy.analisis_json("rms100ms.json", obligatorio=False)
            audio = self.proy.analisis_json("audio.json", obligatorio=False) or {}
            if rms_d:
                trozo = rms_d["rms_db"][int(a * 10):int(b * 10)]
                umbral = float(audio.get("umbral_voz_db", -50))
                if trozo and max(trozo) > umbral:
                    self.aviso(f"{que} [{a}, {b}]: hay sonido por encima del umbral de voz ({max(trozo):.1f} dB): escúchalo")
            out.append((a, b))
        return out

    def segmentos(self) -> None:
        """Tramos conservados = fuente − cortes del guion − silencios (+ tramos sin voz de apertura y coda).
        Un silencio es un tramo SIN palabras y SIN energía de voz (RMS de 100 ms bajo el umbral del análisis):
        Whisper puede saltarse una repetición y esa voz no debe tratarse como silencio."""
        if self.narracion:
            return self._segmentos_narracion()
        import numpy as np
        cfg = self.proy.cfg.get("cortes", {})
        smin = cfg.get("silencioMin")
        margen = float(cfg.get("margen", 0.25))
        cola = float(cfg.get("colaFinal", 1.6))
        cortes = self.cortes_guion()
        self.cortes_src = cortes
        dentro = lambda t: any(a <= t < b for a, b in cortes)  # noqa: E731
        todas = self.palabras
        kept = [i for i, w in enumerate(todas) if not dentro((w["ini"] + w["fin"]) / 2)]
        self.kept = set(kept)
        if not kept:
            raise ErrorKaleidos("no queda ninguna palabra tras los cortes del guion")
        dur = self.f["duracion"]
        rms_d = self.proy.analisis_json("rms100ms.json", obligatorio=False)
        audio = self.proy.analisis_json("audio.json", obligatorio=False) or {}
        n10 = int(np.ceil(dur * 10)) + 1
        voz = np.zeros(n10, bool)
        if rms_d:
            r = np.array(rms_d["rms_db"], dtype=np.float32)[:n10]
            voz[:len(r)] = r > float(audio.get("umbral_voz_db", -50))
        for i in kept:
            w = todas[i]
            voz[int(w["ini"] * 10):int(np.ceil(w["fin"] * 10))] = True
        # intervalos conservados por el guion, acotados al contenido (primera palabra − margen … última + cola)
        ini_c = max(0.0, todas[kept[0]]["ini"] - margen)
        fin_c = min(dur, todas[kept[-1]]["fin"] + cola)
        libres, pos = [], ini_c
        for a, b in cortes:
            if b <= pos:
                continue
            if a > pos:
                libres.append((pos, min(a, fin_c)))
            pos = max(pos, b)
            if pos >= fin_c:
                break
        if pos < fin_c:
            libres.append((pos, fin_c))
        libres = [(a, b) for a, b in libres if b - a > 0.05]
        tramos: list[dict] = []
        tipo = None
        for A, B in libres:
            piezas, cur = [], A
            if smin is not None:
                i, fin_i = int(np.ceil(A * 10)), int(B * 10)
                while i < fin_i:
                    if voz[i]:
                        i += 1
                        continue
                    j = i
                    while j < fin_i and not voz[j]:
                        j += 1
                    ra, rb = i / 10, j / 10
                    toca_a, toca_b = ra <= A + 0.1, rb >= B - 0.1
                    if rb - ra > float(smin) or ((toca_a or toca_b) and rb - ra > margen):
                        qa = ra if toca_a else ra + margen
                        qb = rb if toca_b else rb - margen
                        if qa > cur + 0.05:
                            piezas.append((cur, qa))
                        cur = max(cur, qb)
                    i = j
            if B > cur + 0.05:
                piezas.append((cur, B))
            for k, (a, b) in enumerate(piezas):
                tramos.append({"a": a, "b": b, "antes": tipo if k == 0 else "silencio"})
            tipo = "guion"
        for t in tramos:
            ws = [i for i in kept if t["a"] - 0.05 <= (todas[i]["ini"] + todas[i]["fin"]) / 2 < t["b"] + 0.05]
            t["i0"], t["i1"] = (ws[0], ws[-1]) if ws else (None, None)
        tramos = [t for t in tramos if t["i0"] is not None or t["b"] - t["a"] >= 0.5]
        # segmentos < 1,2 s: unir con el vecino recuperando el silencio (≤ 2 s); si no, avisar
        cambiado = True
        while cambiado:
            cambiado = False
            for k, t in enumerate(tramos):
                if t["b"] - t["a"] >= PLANO_MIN_S:
                    continue
                prev = tramos[k - 1] if k > 0 else None
                nxt = tramos[k + 1] if k + 1 < len(tramos) else None
                gp = t["a"] - prev["b"] if prev and t["antes"] == "silencio" else 99
                gn = nxt["a"] - t["b"] if nxt and nxt["antes"] == "silencio" else 99
                if min(gp, gn) <= 2.0:
                    if gp <= gn:
                        prev["b"], prev["i1"] = t["b"], t["i1"] if t["i1"] is not None else prev["i1"]
                        del tramos[k]
                    else:
                        nxt["a"], nxt["i0"], nxt["antes"] = t["a"], t["i0"] if t["i0"] is not None else nxt["i0"], t["antes"]
                        del tramos[k]
                    cambiado = True
                    break
        # tramos sin voz: apertura (se antepone) y coda (se añade al final)
        previo = self._rangos_mudos((self.guion.get("intro") or {}).get("previo"), "intro.previo")[:1]
        coda = self._rangos_mudos((self.guion.get("outro") or {}).get("coda"), "outro.coda")
        P = sum(self.fr(b) - self.fr(a) for a, b in previo)
        # a fotogramas (rejilla exacta de la fuente)
        self.segs = []
        dst = P
        for t in tramos:
            fa, fb = self.fr(t["a"]), self.fr(t["b"])
            if fb <= fa:
                continue
            if fb - fa < round(PLANO_MIN_S * self.fps):
                n = (t["i1"] - t["i0"] + 1) if t["i0"] is not None else 0
                self.aviso(f"segmento corto ({(fb - fa) / self.fps:.2f} s) entre cortes en {t['a']:.2f} s ({n} palabras)")
            self.segs.append({"dst": dst, "src": fa / self.fps, "dur": fb - fa, "fa": fa, "fb": fb})
            dst += fb - fa
        self.ini_voz, self.fin_voz = P, dst
        self.extra_segs = []
        for a, b in previo:
            fa, fb = self.fr(a), self.fr(b)
            self.extra_segs.append({"dst": 0, "src": fa / self.fps, "dur": fb - fa, "fa": fa, "fb": fb, "mudo": "previo"})
        for a, b in coda:
            fa, fb = self.fr(a), self.fr(b)
            self.extra_segs.append({"dst": dst, "src": fa / self.fps, "dur": fb - fa, "fa": fa, "fb": fb, "mudo": "coda"})
            dst += fb - fa
        self.total = dst
        self.todos = sorted(self.segs + self.extra_segs, key=lambda s: s["dst"])
        self.cortes_dst = [s["dst"] for s in self.todos[1:]]
        self._seg_src = [s["fa"] for s in self.segs]
        self._dst_voz = [s["dst"] for s in self.segs]
        self._dst_todos = [s["dst"] for s in self.todos]

    def _segmentos_narracion(self) -> None:
        """Narración: un único segmento con toda la locución, detrás de la apertura sin voz; sin cortes ni silencios.
        `intro.previo` (s) = música sin voz antes de la locución (si falta, `intro.duracion`, 5 s por defecto);
        `outro.coda` (s) = música sin voz tras la locución (si falta, 0,6 s de cola); `outro.cue` = frase de la
        locución donde entra el cierre (si falta, el cierre ocupa la coda o dura `outro.duracion`, 6 s)."""
        if self.guion.get("cortes"):
            self.error("narración: el guion no admite «cortes» (la locución se genera ya montada)")
        g = self.guion
        i, o = g.get("intro") or {}, g.get("outro") or {}

        def segundos(v, que: str) -> float | None:
            if v is None:
                return None
            if isinstance(v, (int, float)) and not isinstance(v, bool) and v >= 0:
                return float(v)
            self.error(f"narración: {que} debe ser un número de segundos sin voz (p. ej. 4.0); llegó {v!r}")
            return None

        previo = segundos(i.get("previo"), "intro.previo")
        coda = segundos(o.get("coda"), "outro.coda")
        if previo is not None:
            P = self.fr(previo)
        elif g.get("intro"):
            P = self.fr(float(i.get("duracion", INTRO_NARRACION_S)))
        else:
            P = 0
        N = self.fr(self.f["duracion"])
        self.cortes_src = []
        self.kept = set(range(len(self.palabras)))
        self.segs = [{"dst": P, "src": 0.0, "dur": N, "fa": 0, "fb": N}]
        self.extra_segs = []
        self.todos = list(self.segs)
        self.cortes_dst = []
        self._seg_src, self._dst_voz, self._dst_todos = [0], [P], [P]
        self.ini_voz, self.fin_voz = P, P + N
        self.total = P + N + self.fr(coda if coda is not None else COLA_NARRACION_S)   # provisional (dst lo usa)
        self._outro_desde = None
        if g.get("outro"):
            dur_o = self.fr(float(o["duracion"])) if o.get("duracion") else None
            if o.get("cue"):
                desde = self.dst(self.cue(o["cue"], "outro.cue"))
                if dur_o is None and coda is None:
                    dur_o = self.fr(CIERRE_NARRACION_S) if desde >= self.fin_voz else 0
            elif coda is not None:
                desde = self.fin_voz                      # el cierre ocupa la coda sin voz
            else:
                desde = self.fin_voz + self.fr(COLA_NARRACION_S)
                dur_o = dur_o or self.fr(CIERRE_NARRACION_S)
            self.total = max(self.total, desde + (dur_o or 0), desde + self.fr(2.0))
            self._outro_desde = desde

    def dst(self, t: float) -> int:
        """Segundos de la fuente → fotograma de salida (en un corte → inicio del tramo siguiente)."""
        f = t * self.fps
        k = bisect_right(self._seg_src, f) - 1
        if k >= 0:
            s = self.segs[k]
            if f < s["fb"]:
                return s["dst"] + int(round(f - s["fa"]))
            if k + 1 < len(self.segs):
                return self.segs[k + 1]["dst"]
            return self.fin_voz
        return self.ini_voz

    def src_de(self, d: int) -> float:
        """Fotograma de salida → segundos de la fuente (también en los tramos sin voz)."""
        k = bisect_right(self._dst_todos, d) - 1
        k = max(0, min(k, len(self.todos) - 1))
        s = self.todos[k]
        return (s["fa"] + min(d - s["dst"], s["dur"] - 1)) / self.fps

    def seg_de(self, d: int) -> int:
        """Índice del segmento de VOZ que contiene el fotograma de salida d."""
        return max(0, bisect_right(self._dst_voz, d) - 1)

    # ——— intro, capítulos, eventos ———
    def intro_outro(self) -> None:
        g = self.guion
        if self.narracion:
            self.intro = None
            i = g.get("intro")
            if i:
                # hasta: un cue de la locución, o `duracion` (si hay `previo`), o el inicio de la voz; nunca antes de él
                if isinstance(i.get("hasta"), (list, tuple)):
                    h = self.dst(self.cue(i["hasta"], "intro.hasta"))
                elif i.get("previo") is not None and i.get("duracion"):
                    h = self.fr(float(i["duracion"]))
                else:
                    h = self.ini_voz
                h = min(max(h, self.ini_voz), self.total)
                if h > 0:
                    self.intro = {"desde": 0, "hasta": h,
                                  **{k: v for k, v in i.items() if k not in ("previo", "hasta", "cue", "disposicion", "duracion")}}
            self.outro = ({"desde": self._outro_desde, "hasta": self.total,
                           **{k: v for k, v in g["outro"].items() if k not in ("cue", "coda", "disposicion", "duracion")}}
                          if g.get("outro") else None)
            return
        self.intro = None
        if g.get("intro"):
            i = g["intro"]
            if isinstance(i.get("hasta"), (list, tuple)):
                h = self.dst(self.cue(i["hasta"], "intro.hasta"))
            else:
                h = self.fr(float(i.get("duracion", 8)))
            if h < self.ini_voz:
                self.aviso("la intro terminaba antes del final del tramo sin voz de apertura: se alarga hasta él")
                h = self.ini_voz
            self.intro = {"desde": 0, "hasta": min(h, self.total),
                          **{k: v for k, v in i.items() if k not in ("previo", "hasta", "cue", "disposicion")}}
            if i.get("estilo") == "marca":
                for campo, tipo_ in (("palabras", list), ("etiquetas", list), ("lema", str), ("rotulo", dict), ("franja", dict)):
                    if campo in i and not isinstance(i[campo], tipo_):
                        self.error(f"intro.{campo}: tipo incorrecto (se espera {tipo_.__name__})")
                if not i.get("palabras"):
                    self.aviso("intro de marca sin «palabras» (p. ej. [\"MASTER\", \"CLASS\"])")
                rot = i.get("rotulo") or {}
                if rot and not (rot.get("nombre") and rot.get("cargo")):
                    self.aviso("intro.rotulo: faltan «nombre» o «cargo» (usa textos genéricos, sin personas reales)")
        self.outro = None
        if g.get("outro"):
            o = g["outro"]
            dur = self.fr(float(o.get("duracion", 10)))
            if o.get("cue"):
                desde = self.dst(self.cue(o["cue"], "outro.cue"))
            elif self.fin_voz < self.total and not o.get("duracion"):
                desde = self.fin_voz                      # con coda sin voz: el cierre ocupa la coda
            else:
                desde = self.total - dur
            desde = max(0, min(desde, self.total - round(2 * self.fps)))
            self.outro = {"desde": desde, "hasta": self.total, **{k: v for k, v in o.items() if k not in ("cue", "coda", "disposicion")}}

    def capitulos(self) -> None:
        caps = []
        rot = self.fr(ROTULO_S)
        for c in self.guion.get("capitulos", []):
            d = self.dst(self.cue(c["cue"], f"capítulo {c.get('n')}"))
            if self.intro and d < self.intro["hasta"]:
                self.aviso(f"capítulo {c.get('n')} empezaba dentro de la intro: se mueve al final de la intro")
                d = self.intro["hasta"]
            sig = c.get("sigla")
            if sig is not None and (not isinstance(sig, str) or not 1 <= len(sig) <= 3):
                self.aviso(f"capítulo {c.get('n')}: «sigla» debe ser una letra o número corto (1–3 caracteres)")
            if c.get("registro") is not None and c["registro"] not in REGISTROS:
                self.error(f"capítulo {c.get('n')}: registro «{c['registro']}» desconocido ({' | '.join(sorted(REGISTROS))})")
            caps.append({"desde": d, **{k: v for k, v in c.items() if k != "cue"}})
        caps.sort(key=lambda c: c["desde"])
        fin_total = self.outro["desde"] if self.outro else self.total
        for k, c in enumerate(caps):
            c["hasta"] = caps[k + 1]["desde"] if k + 1 < len(caps) else fin_total
            c["rotuloHasta"] = min(c["desde"] + rot, c["hasta"])
            if k and c["desde"] < caps[k - 1]["rotuloHasta"]:
                self.error(f"capítulo {c.get('n')} empieza dentro del rótulo del anterior")
        self.caps = [{"desde": c["desde"], "hasta": c["hasta"], "rotuloHasta": c["rotuloHasta"],
                      **{k: v for k, v in c.items() if k not in ("desde", "hasta", "rotuloHasta")}} for c in caps]

    def _resolver_anidados(self, obj, desde: int, hasta: int):
        """Sustituye cada {"cue": …} anidado por {"en": fotograma} (acotado al evento)."""
        if isinstance(obj, list):
            return [self._resolver_anidados(x, desde, hasta) for x in obj]
        if isinstance(obj, dict):
            out = {}
            for k, v in obj.items():
                if k == "cue":
                    en = self.dst(self.cue(v, "cue interno"))
                    out["en"] = max(desde, min(en, hasta - 10))
                else:
                    out[k] = self._resolver_anidados(v, desde, hasta)
            return out
        return obj

    def _escalonar(self, ev: dict) -> None:
        """Elementos sin cue: aparecen escalonados (12 fotogramas; bocadillos, 40) desde el inicio del evento."""
        for clave in ("items", "hitos", "nodos", "etiquetas", "opciones", "bocadillos"):
            lst = ev.get(clave)
            if isinstance(lst, list):
                paso, ini = (40, 20) if clave == "bocadillos" else (12, 12)
                for i, it in enumerate(lst):
                    if isinstance(it, dict) and "en" not in it and clave != "opciones":
                        it["en"] = max(ev["desde"], min(ev["desde"] + ini + paso * i, ev["hasta"] - 10))

    def _gesto_cerca(self, t: float) -> dict | None:
        cand = [g for g in self.gestos_src if g["desde_s"] - 3 <= t <= g["hasta_s"] + 3]
        return max(cand, key=lambda g: g["puntuacion"]) if cand else None

    def _validar_evento(self, e: dict, etq: str) -> bool:
        """Campos propios de cada tipo (§3 y §7.3). Devuelve False si el evento no se puede generar."""
        tipo = e["tipo"]
        ok = True
        if "cue" not in e:
            self.error(f"{etq}: falta «cue»")
            return False
        if e.get("registro") is not None and e["registro"] not in REGISTROS:
            self.error(f"{etq}: registro «{e['registro']}» desconocido ({' | '.join(sorted(REGISTROS))})")
            ok = False
        validas = DISP_NARRACION if self.narracion else DISPOSICIONES
        if e.get("disposicion") is not None and e["disposicion"] not in validas:
            self.error(f"{etq}: disposición «{e['disposicion']}» no válida{' en narración' if self.narracion else ''} "
                       f"({' | '.join(sorted(validas))})")
            ok = False
        if self.narracion and tipo == "gesto3d":
            self.error(f"{etq}: gesto3d no vale en narración (no hay ponente ni manos); usa escena3d o un panel")
            return False
        if tipo in ("titulo", "bocadillo", "sello") and not e.get("texto"):
            self.error(f"{etq}: falta «texto»")
            ok = False
        if tipo == "bocadillo":
            if e.get("forma", "globo") not in FORMAS_BOCADILLO:
                self.error(f"{etq}: forma «{e.get('forma')}» desconocida")
                ok = False
            if e.get("lado", "der") not in ("izq", "der"):
                self.error(f"{etq}: lado «{e.get('lado')}» (izq | der)")
                ok = False
        if tipo == "reaccion" and e.get("icono") not in ICONOS_REACCION:
            self.error(f"{etq}: icono «{e.get('icono')}» desconocido ({' | '.join(sorted(ICONOS_REACCION))})")
            ok = False
        if tipo == "sello" and e.get("tono", "ok") not in TONOS_SELLO:
            self.error(f"{etq}: tono «{e.get('tono')}» desconocido ({' | '.join(sorted(TONOS_SELLO))})")
            ok = False
        if tipo == "lamina":
            if not e.get("imagen"):
                self.error(f"{etq}: falta «imagen» (clave de media.extras)")
                ok = False
            else:
                self.extra(str(e["imagen"]), etq)
            for j, b in enumerate(e.get("bocadillos") or []):
                q = f"{etq} bocadillo {j + 1}"
                if not isinstance(b, dict) or not b.get("texto"):
                    self.error(f"{q}: falta «texto»")
                    ok = False
                    continue
                if b.get("forma", "globo") not in FORMAS_BOCADILLO:
                    self.error(f"{q}: forma «{b.get('forma')}» desconocida")
                    ok = False
                if b.get("cola") is not None and b["cola"] not in COLAS_BOCADILLO:
                    self.error(f"{q}: cola «{b['cola']}» desconocida")
                    ok = False
                for eje in ("x", "y"):
                    if not (isinstance(b.get(eje), (int, float)) and 0 <= b[eje] <= 1):
                        self.error(f"{q}: falta «{eje}» o no va de 0 a 1 (centro del bocadillo, fracción de la caja)")
                        ok = False
        if tipo in ("escena3d", "gesto3d"):
            obj = e.get("objeto")
            if not obj:
                self.error(f"{etq}: falta «objeto»")
                ok = False
            elif obj not in OBJETOS_3D:
                self.aviso(f"{etq}: objeto 3D «{obj}» fuera del catálogo conocido")
            if obj == "letras" and not e.get("texto"):
                self.error(f"{etq}: el objeto «letras» necesita «texto» (p. ej. \"DORA\")")
                ok = False
        if tipo == "ilustracion":
            for campo in ("imagen", "profundidad"):
                if not e.get(campo):
                    self.error(f"{etq}: falta «{campo}»")
                    ok = False
                else:
                    self.extra(str(e[campo]), etq, obligatorio=False)
        return ok

    def eventos(self) -> None:
        bloques = [(c["desde"], c["rotuloHasta"], f"rótulo del capítulo {c.get('n')}") for c in self.caps]
        if self.intro:
            bloques.append((self.intro["desde"], self.intro["hasta"], "intro"))
        evs = []
        self.gestos_forzados = []
        for k, e in enumerate(self.guion.get("eventos", [])):
            tipo = e.get("tipo")
            etiqueta = f"evento {k + 1} ({tipo}{'/' + e['kind'] if e.get('kind') else ''})"
            if tipo not in TIPOS:
                self.error(f"{etiqueta}: tipo desconocido")
                continue
            if tipo == "panel" and e.get("kind") not in KINDS:
                self.error(f"{etiqueta}: kind desconocido «{e.get('kind')}»")
                continue
            if not self._validar_evento(e, etiqueta):
                continue
            t0 = self.cue(e["cue"], etiqueta)
            desde = self.dst(t0)
            gesto = None
            if tipo == "reaccion":
                hasta = desde + self.fr(DUR_REACCION_S)
            elif "hasta" in e:
                hasta = self.dst(self.cue(e["hasta"], f"{etiqueta}.hasta"))
            elif tipo == "gesto3d":
                g = self._gesto_cerca(t0)
                if g:
                    gd, gh = self.dst(g["desde_s"]), self.dst(g["hasta_s"])
                    desde = min(desde, gd)
                    hasta = max(gh, desde + self.fr(2.5))
                    gesto = {"desde": gd, "pico": self.dst(g["pico_s"]), "hasta": gh, "munecas": g["munecas"]}
                    self.gestos_forzados.append(gesto)
                else:
                    self.aviso(f"{etiqueta}: no hay gesto detectado a ±3 s de {t0:.1f} s; se pinta sin anclar a las manos")
                    hasta = desde + self.fr(float(e.get("duracion", 3.0)))
            elif e.get("duracion"):
                hasta = desde + self.fr(float(e["duracion"]))
            elif tipo in DUR_DEFECTO_S:
                hasta = desde + self.fr(DUR_DEFECTO_S[tipo])
            else:
                hasta = desde + self.fr(8.0)
                self.aviso(f"{etiqueta}: sin «hasta»; dura 8 s")
            ev = {"id": "", "tipo": tipo, "desde": desde, "hasta": hasta}
            resto = {kk: vv for kk, vv in e.items() if kk not in ("tipo", "cue", "hasta", "desde", "duracion")}
            if "valorInicial" in e or "desde" in e:
                # Valor de arranque del contador de `cifra`. En el guion puede venir como `valorInicial` o, por
                # compatibilidad, como `desde`; en timeline.json va siempre como `valorInicial` (lo que lee el motor),
                # porque `desde` es el fotograma de inicio del evento.
                resto["valorInicial"] = e.get("valorInicial", e.get("desde"))
            ev.update(resto)
            if gesto:
                ev["gesto"] = gesto
            if tipo == "lamina":   # instantes de los bocadillos antes de acotarlos (para comprobar que caen dentro)
                ev["_boc"] = [(b.get("texto", ""), self.dst(self.cue(b["cue"], f"{etiqueta} bocadillo")))
                              for b in (e.get("bocadillos") or []) if isinstance(b, dict) and "cue" in b]
            ev["_src"] = t0
            ev["_etq"] = etiqueta
            evs.append(ev)
        evs.sort(key=lambda x: x["desde"])
        reacciones = [ev for ev in evs if ev["tipo"] == "reaccion"]
        excl = [ev for ev in evs if ev["tipo"] != "reaccion"]
        # fuera de rótulos e intro: el inicio se retrasa al final del bloque; un final que invade se adelanta
        fin_util = self.outro["desde"] - SEP_EVENTOS if self.outro else self.total
        for ev in excl:
            movido = True
            while movido:
                movido = False
                for a, b, nom in bloques:
                    if a <= ev["desde"] < b + SEP_EVENTOS:
                        retraso = b + SEP_EVENTOS - ev["desde"]
                        if ev["tipo"] == "titulo":
                            self.aviso(f"{ev['_etq']} («{ev.get('texto')}») caía dentro del {nom}: se retrasa {retraso} fotogramas")
                        else:
                            self.aviso(f"{ev['_etq']} empezaba dentro del {nom}: se retrasa {retraso} fotogramas")
                        ev["desde"] = b + SEP_EVENTOS
                        movido = True
            for a, b, nom in bloques:
                if ev["desde"] < a < ev["hasta"]:
                    ev["hasta"] = a - SEP_EVENTOS
            if ev["hasta"] > fin_util:
                ev["hasta"] = fin_util
        # nunca dos a la vez (las reacciones sí pueden solaparse)
        for i in range(len(excl) - 1):
            a, b = excl[i], excl[i + 1]
            if a["hasta"] > b["desde"] - SEP_EVENTOS:
                a["hasta"] = b["desde"] - SEP_EVENTOS
        final = []
        for ev in excl:
            dur = ev["hasta"] - ev["desde"]
            if dur <= 0:
                self.error(f"{ev['_etq']} ({ev['_src']:.1f} s) se queda sin duración tras resolver solapes y rótulos")
                continue
            if dur < self.fr(1.5) and ev["tipo"] not in ("sello",):
                self.aviso(f"{ev['_etq']} ({ev['_src']:.1f} s) dura solo {dur / self.fps:.1f} s")
            final.append(ev)
        for ev in reacciones:
            nom = next((n for a, b, n in bloques if a <= ev["desde"] < b), None)
            if nom is None and self.outro and ev["desde"] >= self.outro["desde"]:
                nom = "cierre"
            if nom:
                self.aviso(f"{ev['_etq']} ({ev['_src']:.1f} s) cae en el {nom}: se descarta")
                continue
            ev["hasta"] = min(ev["hasta"], fin_util)
            final.append(ev)
        final.sort(key=lambda x: (x["desde"], x["tipo"] == "reaccion"))
        for i, ev in enumerate(final):
            ev["id"] = f"e{i + 1:02d}"
            ev.pop("_src"), ev.pop("_etq")
            boc = ev.pop("_boc", None)
            if boc:
                for texto, en in boc:
                    if not ev["desde"] <= en <= ev["hasta"] - 10:
                        self.error(f"{ev['id']} (lámina «{ev.get('imagen')}»): el bocadillo «{texto[:30]}» cae fuera de "
                                   f"su lámina ({_mmss(en, self.fps)}; lámina {_mmss(ev['desde'], self.fps)}–"
                                   f"{_mmss(ev['hasta'], self.fps)})")
            resto = {k: v for k, v in ev.items() if k not in ("id", "tipo", "desde", "hasta")}
            resto = self._resolver_anidados(resto, ev["desde"], ev["hasta"])
            for k in list(ev.keys()):
                if k not in ("id", "tipo", "desde", "hasta"):
                    del ev[k]
            ev.update(resto)
            self._escalonar(ev)
        self.evs = final

    # ——— disposiciones del escenario (§7.3) ———
    def _disp_de(self, ev: dict) -> str | None:
        t = ev["tipo"]
        if self.narracion:
            if t in ("bocadillo", "reaccion"):
                return "voz" if t == "bocadillo" else None      # anclados a la caja de voz
            if ev.get("disposicion"):
                return ev["disposicion"]
            if t in ("titulo", "lamina", "ilustracion"):
                return "completa"
            return None if t == "sello" else "voz"
        if ev.get("disposicion"):
            return ev["disposicion"]
        if t in ("titulo", "lamina"):
            return "grande"
        if t in ("panel", "pop", "escena3d", "ilustracion"):
            return "dos-cajas"
        if t in ("bocadillo", "gesto3d"):
            return "solo"
        return None          # sello: hereda; reaccion: no cambia la disposición

    def disposiciones(self) -> None:
        crudos: list[tuple[int, int, str | None]] = []
        hueco_t, grande_t = ("voz", "voz") if self.narracion else ("solo", "grande")
        rotulo_t = "completa" if self.narracion else "grande"
        if self.intro:
            crudos.append((self.intro["desde"], self.intro["hasta"], (self.guion.get("intro") or {}).get("disposicion", "completa")))
        for c in self.caps:
            crudos.append((c["desde"], c["rotuloHasta"], c.get("disposicion", rotulo_t)))
        for ev in self.evs:
            if ev["tipo"] != "reaccion":
                crudos.append((ev["desde"], ev["hasta"], self._disp_de(ev)))
        if self.outro:
            crudos.append((self.outro["desde"], self.outro["hasta"], (self.guion.get("outro") or {}).get("disposicion", "completa")))
        crudos.sort(key=lambda x: x[0])
        hueco = self.fr(HUECO_DISP_S)
        pista: list[list] = []
        pos = 0
        for a, b, t in crudos:
            a = max(a, pos)
            if b <= a:
                continue
            if t is None:     # sello: hereda la disposición del tramo anterior si va pegado
                t = pista[-1][2] if pista and a - pista[-1][1] <= hueco else grande_t
            if a > pos:
                if pista and a - pos < hueco:
                    pista[-1][1] = a
                else:
                    pista.append([pos, a, hueco_t])
            pista.append([a, b, t])
            pos = b
        if pos < self.total:
            if pista and self.total - pos < hueco:
                pista[-1][1] = self.total
            else:
                pista.append([pos, self.total, hueco_t])
        # fundir iguales consecutivos y tramos < 1,2 s (con el anterior; el primero, con el siguiente)
        minf = self.fr(PLANO_MIN_S)
        cambiado = True
        while cambiado:
            cambiado = False
            for i in range(len(pista)):
                if i + 1 < len(pista) and pista[i][2] == pista[i + 1][2]:
                    pista[i][1] = pista[i + 1][1]
                    del pista[i + 1]
                    cambiado = True
                    break
                if pista[i][1] - pista[i][0] < minf and len(pista) > 1:
                    if i > 0:
                        pista[i - 1][1] = pista[i][1]
                    else:
                        pista[i + 1][0] = pista[i][0]
                    del pista[i]
                    cambiado = True
                    break
        self.disps = [{"desde": a, "hasta": b, "tipo": t} for a, b, t in pista]
        if self.narracion:
            for d in self.disps:
                if d["tipo"] not in DISP_NARRACION:
                    self.error(f"narración: disposición «{d['tipo']}» en {_mmss(d['desde'], self.fps)} ({' | '.join(sorted(DISP_NARRACION))})")
            for ev in self.evs:
                if ev["tipo"] == "reaccion":
                    d = next((x for x in self.disps if x["desde"] <= ev["desde"] < x["hasta"]), None)
                    if d and d["tipo"] != "voz":
                        self.aviso(f"{ev['id']} (reacción) cae en un tramo «{d['tipo']}»: no se ve la caja de voz")

    # ——— audio: música y efectos (§7.3) ———
    def _medir_audio(self, f) -> dict:
        """Duración (s) y sonoridad integrada (LUFS) de un audio, con caché en work/audio_extras.json."""
        cache_p = self.proy.work / "audio_extras.json"
        cache = leer_json(cache_p) if cache_p.exists() else {}
        st_ = f.stat()
        k = str(f.resolve())
        c = cache.get(k)
        if c and c.get("mtime") == st_.st_mtime and c.get("tam") == st_.st_size:
            return c
        dur = float(json.loads(subprocess.run(
            [ffprobe_bin(), "-v", "error", "-show_entries", "format=duration", "-of", "json", str(f)],
            capture_output=True, text=True, check=True).stdout)["format"]["duration"])
        txt = subprocess.run([ffmpeg_bin(), "-hide_banner", "-nostats", "-i", str(f), "-af", "ebur128", "-f", "null", "-"],
                             capture_output=True, text=True).stderr
        m = re.findall(r"I:\s+(-?\d+(?:\.\d+)?) LUFS", txt)
        c = {"mtime": st_.st_mtime, "tam": st_.st_size, "duracion": round(dur, 3),
             "lufs": float(m[-1]) if m else None}
        cache[k] = c
        escribir_json(cache_p, cache)
        return c

    def audio(self) -> None:
        cfg = self.proy.cfg.get("audio") or {}
        self.musica, self.sfx = [], []
        self.audio_info: dict = {}
        if not cfg:
            return
        fps = self.fps

        def fichero(clave: str, que: str):
            if clave in self.extras_media:
                return self.extras_media[clave]
            self.extra(clave, que, obligatorio=False)
            self.aviso(f"{que}: «{clave}» no entra en timeline.json hasta que esté en media/extras")
            return None

        def volumen(m: dict, f, que: str) -> float:
            v = float(m.get("volumen", 0.5))
            if m.get("lufs") is not None:
                med = self._medir_audio(f)
                if med.get("lufs") is not None:
                    v = round(10 ** ((float(m["lufs"]) - med["lufs"]) / 20), 3)
                    self.audio_info[que] = {"lufs_archivo": med["lufs"], "lufs_objetivo": m["lufs"], "volumen": v}
                else:
                    self.aviso(f"{que}: no se pudo medir la sonoridad; se usa volumen {v}")
            return v

        mus = cfg.get("musica") or {}
        voz0, voz1 = self.ini_voz, self.fin_voz
        s = mus.get("sintonia")
        if s and s.get("archivo"):
            f = fichero(s["archivo"], "audio.musica.sintonia")
            if f:
                d = self.fr(self._medir_audio(f)["duracion"])
                fo = self.fr(float(s.get("fundidoSalida", 1.5)))
                modo = s.get("hasta", "voz" if voz0 > 0 else "intro")
                fin = (voz0 + fo) if modo == "voz" else (self.intro["hasta"] if self.intro else voz0 + fo)
                fin = min(fin, d, self.total)
                self.musica.append({"archivo": s["archivo"], "desde": 0, "hasta": fin,
                                    "volumen": volumen(s, f, "sintonia"),
                                    "fundidoEntrada": self.fr(float(s.get("fundidoEntrada", 0))),
                                    "fundidoSalida": min(fo, fin), "bucle": False})
        b = mus.get("base")
        if b and self.narracion and b.get("lufs") is None:
            b = {**b, "lufs": LUFS_BASE_NARRACION}     # sin voz real encima: algo más alta que bajo un ponente
        if b and b.get("archivo"):
            f = fichero(b["archivo"], "audio.musica.base")
            if f:
                d = self.fr(self._medir_audio(f)["duracion"])
                ini, fin = voz0, voz1
                bucle = bool(b.get("bucle", True))
                if not bucle:
                    fin = min(fin, ini + d)
                if fin - ini > self.fr(2):
                    self.musica.append({"archivo": b["archivo"], "desde": ini, "hasta": fin,
                                        "volumen": volumen(b, f, "base"),
                                        "fundidoEntrada": self.fr(float(b.get("fundidoEntrada", 2))),
                                        "fundidoSalida": self.fr(float(b.get("fundidoSalida", 2))), "bucle": bucle})
        c = mus.get("cierre")
        if c and c.get("archivo"):
            f = fichero(c["archivo"], "audio.musica.cierre")
            if f:
                d = self.fr(self._medir_audio(f)["duracion"])
                fe = self.fr(float(c.get("fundidoEntrada", 1)))
                if voz1 < self.total:              # hay coda sin voz: el cierre entra al acabar la voz
                    ini = max(0, voz1 - fe)
                else:                              # sin coda: que termine con el vídeo, sin empezar antes del cierre
                    ini = max(self.total - d, self.outro["desde"] if self.outro else self.total - d)
                fin = min(self.total, ini + d)
                self.musica.append({"archivo": c["archivo"], "desde": ini, "hasta": fin,
                                    "volumen": volumen(c, f, "cierre"), "fundidoEntrada": fe,
                                    "fundidoSalida": self.fr(float(c.get("fundidoSalida", 2))), "bucle": False})
        # efectos
        sfx_cfg = cfg.get("sfx") or {}
        disparos: list[tuple[int, str]] = []
        for ev in self.evs:
            t = ev["tipo"]
            if t in ("titulo", "sello", "bocadillo", "reaccion"):
                disparos.append((ev["desde"], t))
            if t == "lamina":
                disparos += [(bb["en"], "bocadillo") for bb in ev.get("bocadillos") or [] if "en" in bb]
            if t == "panel" and ev.get("kind") == "opciones" and isinstance(ev.get("foco"), dict) and "en" in ev["foco"]:
                disparos.append((ev["foco"]["en"], "veredicto"))
        disparos += [(c["desde"], "capitulo") for c in self.caps]
        disparos += [(d["desde"], "disposicion") for d in self.disps[1:]]
        elegidos: list[tuple[int, str]] = []
        for en, t in sorted(disparos, key=lambda x: (x[0], -SFX_PRIORIDAD.get(x[1], 0))):
            if t not in sfx_cfg or not (0 <= en < self.total):
                continue
            if elegidos and en - elegidos[-1][0] < SFX_SEP:
                if SFX_PRIORIDAD.get(t, 0) > SFX_PRIORIDAD.get(elegidos[-1][1], 0):
                    elegidos[-1] = (en, t)
                continue
            elegidos.append((en, t))
        faltan = set()
        for en, t in elegidos:
            v = sfx_cfg[t]
            clave = v.get("archivo") if isinstance(v, dict) else v
            if clave not in self.extras_media:
                faltan.add((t, clave))
                continue
            vol = float(v.get("volumen", 0.5)) if isinstance(v, dict) else 0.5
            dur = max(1, int(-(-self._medir_audio(self.extras_media[clave])["duracion"] * fps // 1)))
            self.sfx.append({"archivo": clave, "en": en, "volumen": vol, "dur": min(dur, self.total - en), "_t": t})
        for t, clave in sorted(faltan):
            self.extra(clave, f"audio.sfx.{t}", obligatorio=False)
            self.aviso(f"audio.sfx.{t}: «{clave}» no entra en timeline.json hasta que esté en media/extras")
        self.audio_info["sfx"] = {t: sum(1 for x in self.sfx if x["_t"] == t) for t in sfx_cfg}
        for x in self.sfx:
            x.pop("_t")

    # ——— planos de la cámara virtual ———
    def _nariz(self, d0: int, d1: int) -> list[int]:
        if self.pose:
            base = self.pose.get("desde", 0)
            pts = self.pose["puntos"]["nariz"]
            muestras = []
            paso = max(1, (d1 - d0) // 60)
            for d in range(d0, d1, paso):
                i = int(round(self.src_de(d) * self.fps)) - base
                if 0 <= i < len(pts) and pts[i]:
                    muestras.append(pts[i])
            if muestras:
                return [int(st.median(p[0] for p in muestras)), int(st.median(p[1] for p in muestras))]
        fo = self.proy.analisis_json("fondo.json", obligatorio=False) or {}
        p = fo.get("ponente", {})
        return [int(p.get("cx_mediana") or self.SW / 2), int((p.get("top_p1") or 0) + 0.12 * self.SH)]

    def _param_plano(self, tipo: str, d0: int, d1: int, variante: int = 0) -> dict:
        s, tx, ty = PLANOS[tipo]
        s = s * (2160 / self.SH) * (self.H / 1080)      # la tabla es para fuente 4K y salida 1080p
        if variante:
            s *= 1.07
        nariz = self._nariz(d0, d1)
        nx, ny = nariz
        tx = tx * self.W / 1920
        ty = ty * self.H / 1080
        # borde inferior nunca visible: ty + (alto − nariz_y)·s ≥ alto de salida
        if ty + (self.SH - ny) * s < self.H:
            ty = self.H - (self.SH - ny) * s
        if not self.recorte:
            s = max(s, self.W / self.SW, self.H / self.SH)
            tx = min(max(tx, self.W - (self.SW - nx) * s), nx * s)     # sin recorte: laterales cubiertos
            ty = min(max(ty, self.H - (self.SH - ny) * s), ny * s)     # y borde superior cubierto
        dur_s = (d1 - d0) / self.fps
        z = 0.01 if tipo in ("card", "sideL", "sideR") else min(0.04, max(0.01, 0.01 + 0.003 * dur_s))
        return {"s": round(s, 4), "tx": round(tx), "ty": round(ty), "nariz": nariz, "zoom": [1.0, round(1.0 + z, 3)]}

    def _plano_forzado(self, ev: dict) -> str | None:
        t, lado = ev["tipo"], ev.get("lado")
        if t == "reaccion":
            return None
        if t == "bocadillo":                       # el bocadillo va en el lado indicado: el ponente, en el otro
            return {"izq": "sideR", "der": "sideL"}.get(lado, "wide")
        if t == "gesto3d":
            return "wide"                          # manos a la vista
        if self.escenario:
            # el ponente va en su caja: la cámara sigue libre (medio/corto); en «grande» se fuerza el plano medio
            return None
        if t in ("panel", "escena3d"):
            return {"der": "sideL", "izq": "sideR"}.get(lado, "wide")
        if t == "pop":
            return "popL" if ev.get("grande") else None
        if t == "titulo":
            return "popL"
        if t == "lamina":
            return "sideR"
        if t == "sello":
            return None
        return "wide"

    def planos(self) -> None:
        if self.narracion:
            self.planos_ = []      # sin cámara: el motor pone su plano neutro (§8)
            return
        minf = int(round(PLANO_MIN_S * self.fps))
        forz: list[list] = []
        if self.intro:
            forz.append([self.intro["desde"], self.intro["hasta"], "card"])
        if self.escenario:
            # recuadro pequeño (diapositiva grande): plano medio (estilo: «en el recuadro pequeño, plano medio»)
            for d in self.disps:
                if d["tipo"] == "grande":
                    forz.append([d["desde"], d["hasta"], "medium"])
        else:
            for c in self.caps:
                forz.append([c["desde"], c["rotuloHasta"], "card"])
        for ev in self.evs:
            tipo = self._plano_forzado(ev)
            if tipo:
                forz.append([ev["desde"], ev["hasta"], tipo])
        if self.outro:
            forz.append([self.outro["desde"], self.outro["hasta"], "card"])
        forz.sort()
        # sin solapes entre ventanas forzadas; ≥ 1,2 s
        limpio: list[list] = []
        for a, b, tp in forz:
            if limpio and a < limpio[-1][1]:
                a = limpio[-1][1]
            if b - a <= 0:
                continue
            if limpio and limpio[-1][2] == tp and a - limpio[-1][1] < minf:
                limpio[-1][1] = b
                continue
            limpio.append([a, b, tp])
        # pegar a cortes cercanos y cerrar huecos cortos (el cambio de plano coincide con el corte)
        cortes = self.cortes_dst
        for w in limpio:
            prev_c = max([c for c in cortes if c <= w[0]], default=None)
            if prev_c is not None and 0 < w[0] - prev_c < minf:
                w[0] = prev_c
            next_c = min([c for c in cortes if c >= w[1]], default=None)
            if next_c is not None and 0 < next_c - w[1] < minf:
                w[1] = next_c
            # un corte justo dentro de la ventana (a menos de 1,2 s de un borde): el borde se lleva al corte,
            # para que el salto coincida con el cambio de plano (si la ventana sigue durando ≥ 1,2 s)
            dentro_fin = [c for c in cortes if w[1] - minf < c < w[1] and c - w[0] >= minf]
            if dentro_fin:
                w[1] = max(dentro_fin)
            dentro_ini = [c for c in cortes if w[0] < c < w[0] + minf and w[1] - c >= minf]
            if dentro_ini:
                w[0] = min(dentro_ini)
        for i in range(len(limpio) - 1):
            if limpio[i + 1][0] - limpio[i][1] < minf:
                limpio[i][1] = limpio[i + 1][0]
        for i in range(len(limpio) - 1):
            limpio[i][1] = min(limpio[i][1], limpio[i + 1][0])
        if limpio and limpio[0][0] < minf:
            limpio[0][0] = 0
        if limpio and self.total - limpio[-1][1] < minf:
            limpio[-1][1] = self.total
        for w in limpio:
            if w[1] - w[0] < minf:
                w[1] = min(w[0] + minf, self.total)
        # finales de frase (en fotogramas de salida)
        finales = []
        for i in sorted(self.kept):
            w = self.palabras[i]
            sig = self.palabras[i + 1] if i + 1 < len(self.palabras) else None
            if re.search(r"[.?!…]$", w["t"]) or (sig and sig["ini"] - w["fin"] > 0.5):
                finales.append(self.dst(w["fin"]))
        finales = sorted(set(finales))
        planos: list[dict] = []
        ciclo = 0

        ciclo_ = CICLO_ESCENARIO if self.escenario else CICLO

        def siguiente_tipo(prev: str | None) -> str:
            nonlocal ciclo
            t = ciclo_[ciclo % len(ciclo_)]
            ciclo += 1
            if t == prev:
                t = ciclo_[ciclo % len(ciclo_)]
                ciclo += 1
            return t

        def libres(a: int, b: int) -> None:
            if b <= a:
                return
            puntos = [a] + [c for c in cortes if a < c < b] + [b]
            for p0, p1 in zip(puntos, puntos[1:]):
                cur = p0
                while p1 - cur > round(11 * self.fps):
                    cand = [f for f in finales if cur + 4 * self.fps <= f <= cur + 11 * self.fps and p1 - f >= 4 * self.fps]
                    if cand:
                        corte = min(cand, key=lambda f: abs(f - (cur + 7 * self.fps)))
                    else:
                        corte = cur + round(8 * self.fps) if p1 - cur - 8 * self.fps >= 4 * self.fps else (cur + p1) // 2
                    planos.append({"desde": cur, "hasta": corte, "forzado": False})
                    cur = corte
                planos.append({"desde": cur, "hasta": p1, "forzado": False})

        pos = 0
        for a, b, tp in limpio:
            libres(pos, a)
            planos.append({"desde": a, "hasta": b, "forzado": True, "tipo": tp})
            pos = b
        libres(pos, self.total)
        # planos libres < 1,2 s: fundir con el vecino libre (los forzados no se tocan)
        cambiado = True
        while cambiado:
            cambiado = False
            for i, p in enumerate(planos):
                if p["forzado"] or p["hasta"] - p["desde"] >= minf:
                    continue
                izq = planos[i - 1] if i > 0 and not planos[i - 1]["forzado"] else None
                der = planos[i + 1] if i + 1 < len(planos) and not planos[i + 1]["forzado"] else None
                if izq and (not der or izq["hasta"] - izq["desde"] <= der["hasta"] - der["desde"]):
                    izq["hasta"] = p["hasta"]
                elif der:
                    der["desde"] = p["desde"]
                else:
                    continue
                del planos[i]
                cambiado = True
                break
        prev = None
        for p in planos:
            if not p["forzado"]:
                p["tipo"] = siguiente_tipo(prev)
            prev = p["tipo"]
        # dos planos libres seguidos del mismo tipo (por la fusión) → alternar
        otro = {"medium": "close", "close": "medium"} if self.escenario else {}
        for i in range(1, len(planos)):
            if planos[i]["tipo"] == planos[i - 1]["tipo"] and not planos[i]["forzado"]:
                t = planos[i]["tipo"]
                planos[i]["tipo"] = otro.get(t, "medium") if self.escenario else ("wide" if t != "wide" else "medium")
        # Un plano forzado largo (panel de 10–50 s) contiene cortes de silencio: se parte en cada corte con el
        # mismo tipo y un 7 % más de escala en las partes alternas (punch-in que disimula el salto).
        partidos = []
        for p in planos:
            if not p["forzado"]:
                partidos.append({**p, "var": 0})
                continue
            puntos = [p["desde"]]
            for c in cortes:
                if puntos[-1] + minf <= c <= p["hasta"] - minf:
                    puntos.append(c)
            puntos.append(p["hasta"])
            for k, (a, b) in enumerate(zip(puntos, puntos[1:])):
                partidos.append({"desde": a, "hasta": b, "tipo": p["tipo"], "forzado": True, "var": k % 2})
        self.planos_ = []
        for p in partidos:
            prm = self._param_plano(p["tipo"], p["desde"], p["hasta"], variante=p["var"])
            self.planos_.append({"desde": p["desde"], "hasta": p["hasta"], "tipo": p["tipo"], "forzado": p["forzado"], **prm})

    # ——— subtítulos ———
    def subtitulos(self) -> None:
        paginas = []
        cur: list[dict] = []
        largo = 0

        def volcar():
            nonlocal cur, largo
            if cur:
                paginas.append({"desde": cur[0]["desde"], "hasta": cur[-1]["hasta"], "palabras": cur})
            cur, largo = [], 0

        prev_src = None
        prev_seg = None
        for i in sorted(self.kept):
            w = self.palabras[i]
            d0, d1 = self.dst(w["ini"]), self.dst(w["fin"])
            seg = self.seg_de(d0)
            s = self.segs[seg]
            d1 = min(max(d1, d0 + 2), s["dst"] + s["dur"])
            txt = w["t"]
            pausa = (w["ini"] - prev_src) if prev_src is not None else 0
            n = len(txt) + (1 if cur else 0)
            if cur and (largo + n > 34 or pausa > 0.5 or seg != prev_seg):
                volcar()
                n = len(txt)
            cur.append({"t": txt, "desde": d0, "hasta": d1})
            largo += n
            prev_src, prev_seg = w["fin"], seg
            if re.search(r"[.?!…]$", txt):
                volcar()
        volcar()
        for p in paginas:   # palabras encadenadas (el resaltado no parpadea entre palabras seguidas)
            ws = p["palabras"]
            for a, b in zip(ws, ws[1:]):
                if b["desde"] - a["hasta"] < 12:
                    a["hasta"] = max(a["hasta"], b["desde"])
            ws[-1]["hasta"] = max(ws[-1]["hasta"], ws[-1]["desde"] + 5)
        for k, p in enumerate(paginas):
            sig = paginas[k + 1]["desde"] if k + 1 < len(paginas) else self.fin_voz
            p["hasta"] = min(sig, max(p["hasta"], p["desde"] + 10) + 8)
            if len(" ".join(x["t"] for x in p["palabras"])) > 34:
                self.aviso(f"subtítulo de más de 34 caracteres en {p['desde']}: una sola palabra muy larga")
        self.subs = paginas

    # ——— gestos ———
    def gestos(self) -> None:
        if self.narracion:
            self.gestos_ = []
            return
        bloques = [(c["desde"], c["rotuloHasta"]) for c in self.caps]
        if self.intro:
            bloques.append((self.intro["desde"], self.intro["hasta"]))
        if self.outro:
            bloques.append((self.outro["desde"], self.outro["hasta"]))
        plano_de = lambda d: next((p for p in self.planos_ if p["desde"] <= d < p["hasta"]), None)  # noqa: E731
        cand = []
        for g in self.gestos_src:
            a, b = g["desde_s"], g["hasta_s"]
            fa, fb = a * self.fps, b * self.fps
            k = bisect_right(self._seg_src, fa) - 1
            if k < 0 or fb > self.segs[k]["fb"]:
                continue                                         # cruza un corte o está cortado
            d0, dp, d1 = self.dst(a), self.dst(g["pico_s"]), self.dst(b)
            p = plano_de(dp)
            if p is None or p["tipo"] == "close":
                continue                                         # plano corto: no se ven las manos
            if any(x < d1 and d0 < y for x, y in bloques):
                continue
            cand.append({"desde": d0, "pico": dp, "hasta": d1, "munecas": g["munecas"], "_p": g["puntuacion"]})
        elegidos = [dict(g, _p=1e9) for g in self.gestos_forzados]
        for g in sorted(cand, key=lambda g: -g["_p"]):
            if len(elegidos) >= MAX_GESTOS:
                break
            if all(abs(g["pico"] - e["pico"]) >= SEP_GESTOS_S * self.fps for e in elegidos):
                elegidos.append(g)
        self.gestos_ = [{k: v for k, v in g.items() if k != "_p"} for g in sorted(elegidos, key=lambda g: g["pico"])]
        for g in self.gestos_:
            pista = self._pista(g["desde"], g["pico"])
            if pista:
                g["pista"] = pista

    def _pista(self, d0: int, d1: int) -> list[dict]:
        """Extensión del motor: trayectoria de las muñecas (px de fuente) antes del pico, por fotograma de salida."""
        if not self.pose:
            return []
        base = self.pose.get("desde", 0)
        mi, md = self.pose["puntos"]["muneca_izq"], self.pose["puntos"]["muneca_der"]
        out = []
        for f in range(d0, d1 + 1):
            i = int(round(self.src_de(f) * self.fps)) - base
            if 0 <= i < len(mi) and mi[i] and md[i]:
                out.append({"f": f, "munecas": sorted([list(mi[i]), list(md[i])])})
        return out

    # ——— comprobaciones (§6, §7.3 y §9.4) ———
    def _instantes(self, obj, out: list[int]) -> None:
        if isinstance(obj, dict):
            for k, v in obj.items():
                if k == "en" and isinstance(v, (int, float)):
                    out.append(int(v))
                else:
                    self._instantes(v, out)
        elif isinstance(obj, list):
            for x in obj:
                self._instantes(x, out)

    def densidad(self) -> None:
        """Cambios visuales: entradas y salidas de eventos, elementos internos (en), reacciones, rótulos,
        disposiciones. Aviso si pasan más de 15 s sin ninguno (entre la intro y el cierre)."""
        ini = self.intro["hasta"] if self.intro else 0
        fin = self.outro["desde"] if self.outro else self.total
        marcas = {ini, fin}
        for ev in self.evs:
            marcas.update((ev["desde"], ev["hasta"]))
            en: list[int] = []
            self._instantes({k: v for k, v in ev.items() if k not in ("gesto",)}, en)
            marcas.update(en)
        for c in self.caps:
            marcas.update((c["desde"], c["rotuloHasta"]))
        for d in self.disps:
            marcas.add(d["desde"])
        marcas = sorted(m for m in marcas if ini <= m <= fin)
        huecos = [(a, b) for a, b in zip(marcas, marcas[1:]) if b - a > self.fr(DENSIDAD_MAX_S)]
        for a, b in huecos:
            self.aviso(f"densidad: {(b - a) / self.fps:.1f} s sin cambio visual ({_mmss(a, self.fps)}–{_mmss(b, self.fps)})")
        dur = max(1, fin - ini) / self.fps
        self.densidad_ = {"cambios": len(marcas), "segundos_por_cambio": round(dur / max(1, len(marcas) - 1), 1),
                          "huecos_mas_de_15s": len(huecos),
                          "hueco_maximo_s": round(max((b - a for a, b in zip(marcas, marcas[1:])), default=0) / self.fps, 1)}

    def comprobar(self) -> None:
        excl = [e for e in self.evs if e["tipo"] != "reaccion"]
        for a, b in zip(excl, excl[1:]):
            if b["desde"] - a["hasta"] < SEP_EVENTOS:
                self.error(f"solape de eventos {a['id']} y {b['id']} ({a['hasta']} → {b['desde']})")
        for e in self.evs:
            for c in self.caps:
                if e["desde"] < c["rotuloHasta"] and c["desde"] < e["hasta"]:
                    que = f"el titulo {e['id']}" if e["tipo"] == "titulo" else f"evento {e['id']}"
                    self.error(f"{que} dentro del rótulo del capítulo {c.get('n')}")
            if self.intro and e["desde"] < self.intro["hasta"]:
                self.error(f"evento {e['id']} dentro de la intro")
            if e["hasta"] > self.total or e["desde"] < 0:
                self.error(f"evento {e['id']} fuera de la duración")
        minf = int(round(PLANO_MIN_S * self.fps))
        pos = 0 if not self.narracion else self.total       # narración: sin planos que comprobar
        for p in self.planos_:
            if p["desde"] != pos:
                self.error(f"planos no contiguos en {pos}")
            pos = p["hasta"]
            if p["hasta"] - p["desde"] < minf:
                self.error(f"plano de menos de 1,2 s en {p['desde']} ({p['tipo']}, {(p['hasta'] - p['desde']) / self.fps:.2f} s)")
            if p["ty"] + (self.SH - p["nariz"][1]) * p["s"] < self.H - 0.5:
                self.error(f"se vería el borde inferior en el plano {p['desde']}")
        if pos != self.total:
            self.error(f"los planos terminan en {pos} y la duración es {self.total}")
        inicios = {p["desde"] for p in self.planos_}
        sin_cambio = [c for c in self.cortes_dst if c not in inicios]
        if sin_cambio:
            self.aviso(f"{len(sin_cambio)} de {len(self.cortes_dst)} cortes no coinciden con un cambio de plano "
                       f"(segmentos < 1,2 s): {sin_cambio[:8]}")
        cortos = sum(1 for p in self.planos_ if p["hasta"] - p["desde"] < minf)
        for a, b in zip(self.caps, self.caps[1:]):
            if b["desde"] <= a["desde"]:
                self.error("capítulos desordenados")
        if len(self.gestos_) > MAX_GESTOS:
            self.error("más de 12 gestos")
        pos = 0
        for d in self.disps:
            if d["desde"] != pos or d["hasta"] <= d["desde"]:
                self.error(f"disposiciones no contiguas en {pos}")
            pos = d["hasta"]
        if self.disps and pos != self.total:
            self.error(f"las disposiciones terminan en {pos} y la duración es {self.total}")
        for m in self.musica:
            if not (0 <= m["desde"] < m["hasta"] <= self.total):
                self.error(f"música «{m['archivo']}» fuera de la duración ({m['desde']}–{m['hasta']})")
        self.resumen_checks = {"eventos": len(self.evs), "planos": len(self.planos_), "planos_cortos": cortos,
                               "cortes": len(self.cortes_dst), "cortes_sin_cambio": len(sin_cambio),
                               "disposiciones": len(self.disps), "sfx": len(self.sfx), "musica": len(self.musica)}

    def generar(self) -> dict:
        self.segmentos()
        self.intro_outro()
        self.capitulos()
        self.eventos()
        self.disposiciones()
        self.audio()
        self.planos()
        self.subtitulos()
        self.gestos()
        self.densidad()
        self.comprobar()
        pl = None
        if self.recorte and self.plancha:
            pl = {k: self.plancha[k] for k in ("x", "y", "ancho", "alto", "escala")}
            # extensiones del motor: la máscara es gris 1080p de la fuente entera y la plancha se multiplicó por
            # ella con la curva del método (§7.2)
            pl["mascara"] = self.plancha.get("mascara", "fuente")
            pl["curva"] = self.plancha.get("curva", "metodo")
        avisos = [f"ERROR: {e}" for e in self.errores] + self.avisos
        tl = {
            "version": 1, "fps": int(self.fps) if float(self.fps).is_integer() else self.fps, "ancho": self.W, "alto": self.H, "duracion": self.total,
            "fuente": {"ancho": self.SW, "alto": self.SH,
                       "fps": int(self.f["fps"]) if float(self.f["fps"]).is_integer() else self.f["fps"], "duracion": round(self.f["duracion"], 3)},
            "recorte": self.recorte, "plancha": pl,
        }
        if self.narracion:
            del tl["plancha"]
            tl["narracion"] = True
        if self.escenario:
            tl["escenario"] = True
        tl.update({
            "segmentos": [{"dst": s["dst"], "src": round(s["src"], 3), "dur": s["dur"]} for s in self.todos],
            "planos": self.planos_, "capitulos": self.caps, "eventos": self.evs, "subtitulos": self.subs,
            "gestos": self.gestos_, "intro": self.intro, "outro": self.outro,
            "disposiciones": self.disps,
        })
        if self.proy.cfg.get("audio"):
            tl["audio"] = {"musica": self.musica, "sfx": self.sfx}
        tl["avisos"] = avisos
        return tl


def ejecutar(args) -> int:
    proy = Proyecto(args.slug)
    with cronometro(proy, "linea") as extra:
        L = Linea(proy, estricto=args.estricto)
        tl = L.generar()
        escribir_json(proy.dir / "timeline.json", tl)
        if (proy.media / "timeline.json").exists():      # escribir crea un inodo nuevo: rehacer el enlace duro
            from .comun import enlazar_duro
            enlazar_duro(proy.dir / "timeline.json", proy.media / "timeline.json")
        durf = tl["duracion"]
        extra.update({"duracion_s": round(durf / tl["fps"], 1), "errores": len(L.errores), "avisos": len(L.avisos),
                      **L.resumen_checks, "densidad": L.densidad_})
        tipos: dict[str, int] = {}
        for e in tl["eventos"]:
            k = e["tipo"] + (f"/{e['kind']}" if e.get("kind") else "")
            tipos[k] = tipos.get(k, 0) + 1
        info(f"timeline.json: {durf} fotogramas ({_mmss(durf, tl['fps'])}, de {L.f['duracion'] / 60:.1f} min), "
             f"{len(tl['segmentos'])} segmentos, {len(tl['planos'])} planos, {len(tl['capitulos'])} capítulos, "
             f"{len(tl['eventos'])} eventos, {len(tl['subtitulos'])} subtítulos, {len(tl['gestos'])} gestos, "
             f"{len(tl['disposiciones'])} disposiciones; fixes aplicados: {L.fixes_aplicados}")
        info("eventos: " + ", ".join(f"{k} {v}" for k, v in sorted(tipos.items())))
        if "audio" in tl:
            info(f"audio: {len(tl['audio']['musica'])} pistas de música, {len(tl['audio']['sfx'])} efectos "
                 f"({', '.join(f'{k} {v}' for k, v in L.audio_info.get('sfx', {}).items())})")
            for k, v in L.audio_info.items():
                if k != "sfx":
                    info(f"  {k}: {v['lufs_archivo']} LUFS → volumen {v['volumen']} (≈ {v['lufs_objetivo']} LUFS)")
        d = L.densidad_
        info(f"densidad: {d['cambios']} cambios visuales, uno cada {d['segundos_por_cambio']} s; hueco máximo "
             f"{d['hueco_maximo_s']} s; {d['huecos_mas_de_15s']} huecos de más de 15 s")
        for a in tl["avisos"]:
            info(("  ✗ " if a.startswith("ERROR") else "  · ") + a)
    if L.errores:
        info(f"{len(L.errores)} errores bloqueantes")
        return 1
    return 0
