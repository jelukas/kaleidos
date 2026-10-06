import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Camara, Escenario, Luces, Suelo, useFuente3D } from "../tres/Escenario";
import { Escudo3D, Losetas3D, Texto3D } from "../tres/Objetos3D";
import { COLOR, ease, FONT, FPS, kickerStyle, radialGlow, tween } from "../tema";

const anillo: React.CSSProperties = {
  position: "absolute",
  boxSizing: "border-box",
  borderRadius: "50%",
  border: "2px solid rgba(76, 141, 255, 0.3)",
};
const mascara: React.CSSProperties = { overflow: "hidden", lineHeight: 1.2 };
const lineaTitulo: React.CSSProperties = {
  display: "block",
  fontSize: 150,
  fontWeight: 900,
  lineHeight: 1.2,
  letterSpacing: "-0.02em",
  whiteSpace: "nowrap",
};

export const Fondo: React.FC<{ deriva?: number }> = ({ deriva = 0 }) => (
  <AbsoluteFill style={{ backgroundColor: COLOR.bg, overflow: "hidden" }}>
    <div
      style={{
        position: "absolute",
        left: 800,
        top: -500,
        width: 1400,
        height: 1400,
        borderRadius: "50%",
        background: radialGlow,
        opacity: 0.22,
        transform: `translate(${-300 * deriva}px, ${120 * deriva}px)`,
      }}
    />
  </AbsoluteFill>
);

// ——— Intro (9 s): título del curso + escudo 3D ———
export const Intro: React.FC<{ titulo1: string; titulo2: string; kicker: string; subtitulo: string; fantasma: string }> = ({
  titulo1,
  titulo2,
  kicker,
  subtitulo,
  fantasma,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const fuente = useFuente3D();
  const salida = tween(t, 8.2, 0.8, 0, -1920, ease.power3InOut);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: COLOR.fg, overflow: "hidden" }}>
      <Fondo deriva={t / 30} />
      <div style={{ position: "absolute", inset: 0, transform: `translateX(${salida}px)` }}>
        <div
          style={{
            position: "absolute",
            right: -80,
            bottom: -90,
            fontSize: 460,
            fontWeight: 900,
            lineHeight: 1,
            color: COLOR.fg,
            whiteSpace: "nowrap",
            opacity: tween(t, 0, 1.0, 0, 0.07, ease.power2Out),
            transform: `translateX(${tween(t, 0, 9, 0, -160)}px)`,
          }}
        >
          {fantasma}
        </div>
        {[
          { l: 1180, tp: 250, s: 580, dashed: false },
          { l: 1070, tp: 140, s: 800, dashed: true },
        ].map((r, i) => (
          <div
            key={i}
            style={{
              ...anillo,
              left: r.l,
              top: r.tp,
              width: r.s,
              height: r.s,
              borderStyle: r.dashed ? "dashed" : "solid",
              opacity: tween(t, 0.2, 1.2, 0, 1, ease.power2Out),
              transform: `rotate(${r.dashed ? tween(t, 0, 9, 0, 60) : 0}deg) scale(${tween(t, 0.2, 1.2, 0.8, 1, ease.power2Out)})`,
            }}
          />
        ))}
        <Escenario width={1000} height={1080} style={{ left: 970, top: 0 }}>
          <Camara pos={[0, 0.6, tween(t, 0, 9, 7.6, 6.8)]} />
          <Luces />
          <Escudo3D t={t} aparece={0.5} check={1.7} position={[0, 0.35, 0]} />
          {fuente ? (
            <Texto3D
              fuente={fuente}
              texto="DORA"
              tam={0.62}
              fondo={0.22}
              color={COLOR.fg}
              position={[0, -1.3, 0.4]}
              rotation={[-0.12, Math.sin(t * 0.6) * 0.25, 0]}
              scale={tween(t, 1.2, 0.9, 0.001, 1, ease.backOut)}
            />
          ) : null}
          <Suelo y={-1.75} />
        </Escenario>
        <div
          style={{
            position: "absolute",
            left: 140,
            top: 0,
            bottom: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              ...kickerStyle,
              opacity: tween(t, 0.3, 0.6, 0, 1, ease.power3Out),
              transform: `translateX(${tween(t, 0.3, 0.6, -40, 0, ease.power3Out)}px)`,
            }}
          >
            {kicker}
          </div>
          <div
            style={{
              width: 120,
              height: 6,
              margin: "28px 0 36px",
              background: COLOR.accent,
              transformOrigin: "left center",
              transform: `scaleX(${tween(t, 0.45, 0.6, 0, 1, ease.power2Out)})`,
            }}
          />
          <div style={mascara}>
            <div style={{ ...lineaTitulo, transform: `translateY(${tween(t, 0.6, 0.8, 110, 0, ease.expoOut)}%)` }}>{titulo1}</div>
          </div>
          <div style={mascara}>
            <div
              style={{
                ...lineaTitulo,
                color: COLOR.accent,
                transform: `translateY(${tween(t, 0.75, 0.8, 110, 0, ease.expoOut)}%)`,
              }}
            >
              {titulo2}
            </div>
          </div>
          <div
            style={{
              maxWidth: 860,
              marginTop: 40,
              fontSize: 42,
              fontWeight: 400,
              lineHeight: 1.3,
              color: COLOR.muted,
              textWrap: "balance",
              opacity: tween(t, 1.3, 0.7, 0, 1, ease.power2Out),
              transform: `translateY(${tween(t, 1.3, 0.7, 30, 0, ease.power2Out)}px)`,
            }}
          >
            {subtitulo}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ——— Tarjeta de capítulo: número 3D extruido + título (con transición de losetas 3D) ———
export const TarjetaCapitulo: React.FC<{
  numero: number;
  titulo: string;
  subtitulo: string;
  durFr: number;
  entrada: "push" | "corte";
}> = ({ numero, titulo, subtitulo, durFr, entrada }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const d = durFr / FPS;
  const fuente = useFuente3D();
  // Entrada tipo "push" desde la derecha y salida hacia la izquierda.
  const x =
    t < d / 2
      ? entrada === "push"
        ? tween(t, 0, 0.5, 1920, 0, ease.power3InOut)
        : 0
      : tween(t, d - 0.48, 0.48, 0, -1920, ease.power3InOut);
  const num = String(numero).padStart(2, "0");
  return (
    <AbsoluteFill style={{ fontFamily: FONT, transform: `translateX(${x}px)`, overflow: "hidden" }}>
      <Fondo deriva={0.5} />
      <Escenario width={900} height={1080} style={{ left: 60, top: 0 }}>
        <Camara pos={[0, 0.5, 7]} />
        <Luces />
        {fuente ? (
          <Texto3D
            fuente={fuente}
            texto={num}
            tam={1.9}
            fondo={0.6}
            color={COLOR.accent}
            position={[0, 0.25 + Math.sin(t * 1.4) * 0.06, 0]}
            rotation={[tween(t, 0.2, 1.1, -1.2, -0.08, ease.power3Out), tween(t, 0.2, 1.4, -2.4, 0.25, ease.power3Out) + t * 0.05, 0]}
            scale={tween(t, 0.2, 0.9, 0.001, 1, ease.backOut)}
          />
        ) : null}
        <Suelo y={-1.45} />
      </Escenario>
      <div style={{ position: "absolute", left: 900, top: 0, bottom: 0, right: 120, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        <div style={{ ...kickerStyle, opacity: tween(t, 0.5, 0.5, 0, 1, ease.power3Out) }}>CAPÍTULO {num}</div>
        <div
          style={{
            width: 96,
            height: 6,
            margin: "24px 0 28px",
            background: COLOR.accent,
            transformOrigin: "left",
            transform: `scaleX(${tween(t, 0.6, 0.5, 0, 1, ease.power2Out)})`,
          }}
        />
        <div style={{ overflow: "hidden", lineHeight: 1.2 }}>
          <div
            style={{
              fontSize: 86,
              fontWeight: 900,
              lineHeight: 1.08,
              color: COLOR.fg,
              textWrap: "balance",
              transform: `translateY(${tween(t, 0.65, 0.8, 110, 0, ease.expoOut)}%)`,
            }}
          >
            {titulo}
          </div>
        </div>
        <div
          style={{
            marginTop: 30,
            fontSize: 38,
            color: COLOR.muted,
            lineHeight: 1.3,
            textWrap: "balance",
            opacity: tween(t, 1.1, 0.6, 0, 1, ease.power2Out),
            transform: `translateY(${tween(t, 1.1, 0.6, 24, 0, ease.power2Out)}px)`,
          }}
        >
          {subtitulo}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ——— Transición 3D de losetas (encima del corte entre capítulos) ———
export const TransicionLosetas: React.FC<{ durFr: number }> = ({ durFr }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <Escenario width={1920} height={1080} style={{ left: 0, top: 0 }}>
        <Camara pos={[0, 0.4, 8]} mira={[0, 0.4, 0]} />
        <Luces sombra={1024} />
        <Losetas3D t={t} dur={durFr / FPS} />
      </Escenario>
    </AbsoluteFill>
  );
};

// ——— Bloques diagonales (transición 3→4 de ESCENA.md), para la entrada al outro ———
export const BloquesDiagonales: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const colores = [COLOR.accent, COLOR.fg, COLOR.mid, COLOR.panel, COLOR.deep];
  return (
    <AbsoluteFill style={{ overflow: "hidden", pointerEvents: "none" }}>
      {colores.map((c, k) => {
        const sale = 0.8 + (4 - k) * 0.06;
        const x = t < sale ? tween(t, k * 0.06, 0.45, -2700, 0, ease.power3InOut) : tween(t, sale, 0.45, 0, 2700, ease.power3InOut);
        return (
          <div
            key={c}
            style={{
              position: "absolute",
              top: 0,
              left: -200,
              width: 2320,
              height: 1080,
              background: c,
              transform: `translateX(${x}px) skewX(-18deg)`,
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

// ——— Outro (10 s): resumen + escudo 3D + rótulo final ———
export const Outro: React.FC<{ ideas: string[]; lema: string; pie: string }> = ({ ideas, lema, pie }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const letras = "kaleidos".split("");
  const fase2 = 5.2;
  const x1 = tween(t, fase2, 0.6, 0, -1920, ease.power3InOut);
  const x2 = tween(t, fase2, 0.6, 1920, 0, ease.power3InOut);
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: COLOR.fg, overflow: "hidden" }}>
      <Fondo deriva={1} />
      {t < fase2 + 0.7 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${x1}px)` }}>
          <Escenario width={820} height={1080} style={{ left: 1060, top: 0 }}>
            <Camara pos={[0, 0.5, 6.4]} />
            <Luces />
            <Escudo3D t={t + 3} aparece={3} check={3.4} />
            <Suelo y={-1.55} />
          </Escenario>
          <div
            style={{
              position: "absolute",
              left: 140,
              top: 0,
              bottom: 0,
              width: 920,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div style={{ ...kickerStyle, opacity: tween(t, 0.2, 0.5, 0, 1, ease.power3Out) }}>EN RESUMEN</div>
            <div
              style={{
                width: 96,
                height: 6,
                margin: "22px 0 40px",
                background: COLOR.accent,
                transformOrigin: "left",
                transform: `scaleX(${tween(t, 0.3, 0.5, 0, 1, ease.power2Out)})`,
              }}
            />
            {ideas.map((idea, i) => {
              const k = tween(t, 0.6 + i * 0.35, 0.5, 0, 1, ease.power3Out);
              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    gap: 24,
                    alignItems: "baseline",
                    fontSize: 50,
                    fontWeight: 700,
                    lineHeight: 1.22,
                    marginBottom: 36,
                    opacity: k,
                    transform: `translateX(${(1 - k) * -40}px)`,
                  }}
                >
                  <span style={{ color: COLOR.accent, fontWeight: 900 }}>{String(i + 1).padStart(2, "0")}</span>
                  <span>{idea}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      {t > fase2 - 0.1 ? (
        <div style={{ position: "absolute", inset: 0, transform: `translateX(${x2}px)` }}>
          <div
            style={{
              position: "absolute",
              left: 360,
              top: -60,
              width: 1200,
              height: 1200,
              borderRadius: "50%",
              background: radialGlow,
              opacity: tween(t, fase2 + 0.3, 1.2, 0, 0.45, ease.power2Out),
            }}
          />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <div
              style={{
                display: "flex",
                fontSize: 200,
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.02em",
                transform: `scale(${tween(t, fase2 + 1.2, 4, 1, 1.04)})`,
              }}
            >
              {letras.map((ch, i) => {
                const at = fase2 + 0.45 + i * 0.05;
                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-block",
                      opacity: tween(t, at, 0.5, 0, 1, ease.power4Out),
                      transform: `translateY(${tween(t, at, 0.5, 80, 0, ease.power4Out)}px)`,
                    }}
                  >
                    {ch}
                  </span>
                );
              })}
              <span
                style={{
                  display: "inline-block",
                  color: COLOR.accent,
                  transformOrigin: "50% 80%",
                  transform: `scale(${tween(t, fase2 + 1.0, 0.5, 0, 1, ease.power3Out)})`,
                }}
              >
                .
              </span>
            </div>
            <div
              style={{
                width: 160,
                height: 6,
                margin: "36px 0",
                background: COLOR.accent,
                transform: `scaleX(${tween(t, fase2 + 1.15, 0.6, 0, 1, ease.power2Out)})`,
              }}
            />
            <div
              style={{
                fontSize: 40,
                color: COLOR.muted,
                opacity: tween(t, fase2 + 1.25, 0.7, 0, 1, ease.power2Out),
                transform: `translateY(${tween(t, fase2 + 1.25, 0.7, 30, 0, ease.power2Out)}px)`,
              }}
            >
              {lema}
            </div>
          </div>
          <div
            style={{
              ...kickerStyle,
              fontSize: 24,
              position: "absolute",
              bottom: 110,
              width: "100%",
              textAlign: "center",
              opacity: tween(t, fase2 + 1.65, 0.6, 0, 1, ease.power2Out),
            }}
          >
            {pie}
          </div>
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
