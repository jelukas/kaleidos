/**
 * Catálogo 3D del motor. Todos los objetos caben en una caja de ~3×3×3 centrada en el origen, se animan
 * solo con `t` (segundos desde que empieza su secuencia) y usan los colores y el material del estilo.
 *
 * `escudo`, `contrato`, `registro`, `cadena`, `balanza` y `salida` vienen de DORA (v1), adaptados al tema.
 * Nuevos: `orbe`, `piramide`, `estrellas-ue`, `reloj`, `grafica`, `candado`, `engranajes`, `bombilla`, `documento`.
 * Estilo milikito (§7): `trofeo`, `llave`, `escalera` (5 peldaños que se construyen) y `letras` (texto extruido).
 *
 * `limite` (semiancho y semialto visibles en el plano z = 0 del lienzo): los objetos con etiquetas 3D (`cadena`,
 * `piramide`) y `letras` se escalan para que nada se salga del lienzo.
 */
import React from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { ease, tween } from "../tema/anim";
import { useTema } from "../tema/Motor";
import { useLetras } from "./letras";
import { Solido, useGeo } from "./materiales";
import { anchoEtiqueta3D, Etiqueta3D } from "./textura";

export type ObjetoProps = {
  t: number; // segundos desde el inicio de la secuencia
  aparece?: number; // segundo en que entra
  enes?: number[]; // segundos de las marcas (etiquetas, pesos, sellos…)
  etiquetas?: string[];
  acento: string;
  texto?: string; // objeto «letras»
  limite?: [number, number]; // semiancho y semialto visibles en z = 0 (lienzo del objeto)
};

/** Objetos del catálogo que pintan sus propias etiquetas en 3D. */
export const CON_ETIQUETAS_3D = new Set(["cadena", "piramide"]);

/** Factor de perspectiva de lo que está a z = 0,7 (las etiquetas van delante del objeto). */
const PERSPECTIVA_ETIQUETA = 1.1;

/** Escala que mete una extensión horizontal (desde el centro) en el semiancho visible, con margen. */
const escalaQueCabe = (extension: number, limite?: [number, number], margen = 0.94) =>
  limite ? Math.min(1, (limite[0] * margen) / Math.max(0.001, extension)) : 1;

const entrada = (t: number, a: number, d = 0.9) => tween(t, a, d, 0.001, 1, ease.backOut);

const usePaleta = (acento: string) => {
  const tema = useTema();
  const claro = tema.oscuro ? tema.c.texto : tema.mezcla(tema.c.superficie, "#FFFFFF", 0.4);
  const medio = tema.oscuro ? tema.c.textoSuave : tema.mezcla(tema.c.linea, tema.c.textoSuave, 0.4);
  const profundo = tema.oscuro ? tema.c.superficie2 : tema.mezcla(tema.c.texto, tema.c.fondo, 0.25);
  return { tema, acento, claro, medio, profundo, ok: tema.c.ok, aviso: tema.c.aviso, error: tema.c.error, caps: tema.c.capitulos };
};

// ——— Formas ———

const formaEscudo = () => {
  const s = new THREE.Shape();
  s.moveTo(0, 1.25);
  s.lineTo(1.0, 0.9);
  s.lineTo(1.0, 0.05);
  s.bezierCurveTo(1.0, -0.7, 0.45, -1.1, 0, -1.3);
  s.bezierCurveTo(-0.45, -1.1, -1.0, -0.7, -1.0, 0.05);
  s.lineTo(-1.0, 0.9);
  s.closePath();
  return s;
};

const formaCheck = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0.05);
  s.lineTo(-0.15, -0.32);
  s.lineTo(0.55, 0.45);
  s.lineTo(0.42, 0.57);
  s.lineTo(-0.15, -0.06);
  s.lineTo(-0.37, 0.18);
  s.closePath();
  return s;
};

const formaFlecha = () => {
  const s = new THREE.Shape();
  s.moveTo(-0.9, 0.16);
  s.lineTo(0.3, 0.16);
  s.lineTo(0.3, 0.45);
  s.lineTo(0.9, 0);
  s.lineTo(0.3, -0.45);
  s.lineTo(0.3, -0.16);
  s.lineTo(-0.9, -0.16);
  s.closePath();
  return s;
};

const formaEstrella = (rExt: number, rInt: number, puntas = 5) => {
  const s = new THREE.Shape();
  for (let i = 0; i < puntas * 2; i++) {
    const r = i % 2 === 0 ? rExt : rInt;
    const a = Math.PI / 2 + (i * Math.PI) / puntas;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
};

const formaEngranaje = (r: number, dientes: number, alto: number) => {
  const s = new THREE.Shape();
  const pasos = dientes * 4;
  for (let i = 0; i <= pasos; i++) {
    const a = (i / pasos) * Math.PI * 2;
    const fase = i % 4;
    const rr = fase === 1 || fase === 2 ? r + alto : r;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  const hueco = new THREE.Path();
  hueco.absarc(0, 0, r * 0.32, 0, Math.PI * 2, true);
  s.holes.push(hueco);
  return s;
};

const extruir = (s: THREE.Shape, depth: number, bisel = 0.04, curva = 16) =>
  new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: bisel > 0, bevelThickness: bisel, bevelSize: bisel * 0.75, bevelSegments: 3, curveSegments: curva }).center();

// ——— Objetos ———

export const Escudo: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const escudo = useGeo(() => extruir(formaEscudo(), 0.34, 0.08, 24), []);
  const marca = useGeo(() => extruir(formaCheck(), 0.18, 0.04), []);
  const s = entrada(t, aparece, 1.1);
  const sc = entrada(t, enes[0] ?? aparece + 1.0, 0.6);
  return (
    <group position={[0, Math.sin(t * 1.3) * 0.08, 0]} rotation={[0.12 + Math.sin(t * 0.7) * 0.08, Math.sin(t * 0.6) * 0.5, 0]} scale={s * 1.05}>
      <Solido geometry={escudo} color={p.acento} grosor={0.045} />
      <Solido geometry={marca} color={p.claro} position={[0, 0.02, 0.33]} scale={sc} grosor={0.03} />
    </group>
  );
};

export const Contrato: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const hoja = useGeo(() => new RoundedBoxGeometry(2.2, 3.0, 0.1, 2, 0.04), []);
  const linea = useGeo(() => new THREE.BoxGeometry(1.6, 0.08, 0.02), []);
  const corta = useGeo(() => new THREE.BoxGeometry(1.0, 0.08, 0.02), []);
  const sello = useGeo(() => new THREE.CylinderGeometry(0.42, 0.42, 0.14, 40), []);
  const en = enes[0] ?? aparece + 1.2;
  const baja = tween(t, en, 0.35, 1.6, 0, ease.power1In);
  const golpe = tween(t, en + 0.35, 0.3, 1.15, 1, ease.power2Out);
  return (
    <group rotation={[-0.3, 0.35 + Math.sin(t * 0.5) * 0.1, 0.05]} scale={entrada(t, aparece)}>
      <Solido geometry={hoja} color={p.claro} rugosidad={0.6} metal={0} grosor={0.03} />
      {[0.95, 0.6, 0.25, -0.1, -0.45].map((y, i) => (
        <Solido key={i} geometry={i === 4 ? corta : linea} color={p.medio} position={[-0.15 + (i === 4 ? -0.3 : 0), y, 0.06]} sinTinta />
      ))}
      <Solido
        geometry={sello}
        color={p.acento}
        position={[0.55, -0.95, 0.14 + baja]}
        rotation={[Math.PI / 2, 0, 0]}
        scale={t >= en ? golpe : 0.001}
        grosor={0.03}
      />
    </group>
  );
};

export const Registro: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const ficha = useGeo(() => new RoundedBoxGeometry(2.4, 0.16, 1.5, 3, 0.05), []);
  const tira = useGeo(() => new THREE.BoxGeometry(0.6, 0.02, 1.1), []);
  const marcas = enes.length ? enes : [0, 1, 2, 3, 4].map((i) => aparece + 0.3 + i * 0.35);
  return (
    <group rotation={[0.35, -0.5 + t * 0.12, 0]} position={[0, -0.8, 0]}>
      {marcas.map((en, i) => {
        const cae = tween(t, en, 0.7, 4, 0, ease.power3Out);
        return (
          <group key={i} position={[Math.sin(i * 2.1) * 0.08, i * 0.2 + cae, Math.cos(i * 1.7) * 0.06]} visible={t >= en}>
            <Solido geometry={ficha} color={i % 2 ? p.profundo : p.caps[1] ?? p.acento} grosor={0.03} />
            <Solido geometry={tira} color={p.acento} position={[-0.7, 0.09, 0]} sinTinta />
          </group>
        );
      })}
    </group>
  );
};

export const Cadena: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], etiquetas = [], acento, limite }) => {
  const p = usePaleta(acento);
  const caja = useGeo(() => new RoundedBoxGeometry(1.25, 1.25, 1.25, 4, 0.16), []);
  const eslabon = useGeo(() => new THREE.CylinderGeometry(0.07, 0.07, 1, 12), []);
  const nombres = etiquetas.length ? etiquetas : ["", "", ""];
  const n = nombres.length;
  const paso = Math.min(2.3, 5.6 / Math.max(1, n - 1 || 1));
  const x0 = -((n - 1) * paso) / 2;
  const colores = [p.claro, p.acento, p.caps[1] ?? p.medio, p.aviso, p.error];
  const marcas = nombres.map((_, i) => enes[i] ?? aparece + i * 0.45);
  // Nada fuera del lienzo: ni las cajas ni las etiquetas (antes «Banco» salía cortado en un lienzo estrecho).
  const extension = Math.max(
    ...nombres.map((e, i) => Math.abs(x0 + i * paso) * PERSPECTIVA_ETIQUETA + Math.max(0.75, e ? (anchoEtiqueta3D(e, 0.52, p.tema) / 2) * PERSPECTIVA_ETIQUETA : 0)),
  );
  const cabe = escalaQueCabe(extension, limite);
  return (
    <group rotation={[0.14, -0.08 + Math.sin(t * 0.3) * 0.04, 0]} scale={cabe}>
      {nombres.map((e, i) => {
        const k = entrada(t, marcas[i], 0.8);
        const enlace = i > 0 ? tween(t, marcas[i] - 0.2, 0.5, 0.001, 1, ease.power3Out) : 0;
        const x = x0 + i * paso;
        const flota = Math.sin(t * 1.2 + i) * 0.06;
        const yEt = i % 2 === 0 ? 1.25 : -1.3;
        return (
          <group key={i}>
            {i > 0 ? (
              <Solido
                geometry={eslabon}
                color={p.medio}
                position={[x - paso / 2, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
                scale={[1, (paso - 1.25) * enlace, 1]}
                sinTinta
              />
            ) : null}
            <Solido geometry={caja} color={colores[i % colores.length]} position={[x, flota, 0]} rotation={[0, t * 0.4 + i, 0]} scale={k} grosor={0.035} />
            {e ? <Etiqueta3D texto={e} alto={0.52} position={[x, yEt + flota, 0.7]} scale={k} /> : null}
          </group>
        );
      })}
    </group>
  );
};

export const Balanza: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const poste = useGeo(() => new THREE.CylinderGeometry(0.07, 0.12, 2.2, 20), []);
  const pie = useGeo(() => new THREE.CylinderGeometry(0.6, 0.7, 0.14, 32), []);
  const brazo = useGeo(() => new RoundedBoxGeometry(3.2, 0.1, 0.14, 2, 0.04), []);
  const plato = useGeo(() => new THREE.CylinderGeometry(0.55, 0.45, 0.08, 32), []);
  const peso = useGeo(() => new RoundedBoxGeometry(0.5, 0.26, 0.5, 2, 0.05), []);
  const marcas = enes.length ? enes : [aparece + 0.6, aparece + 1.1, aparece + 1.6];
  const izq = marcas.filter((e, i) => i % 2 === 0 && t >= e).length;
  const der = marcas.filter((e, i) => i % 2 === 1 && t >= e).length;
  const ultimo = Math.max(0, ...marcas.filter((e) => t >= e));
  const inclina = (der - izq) * 0.12 * tween(t, ultimo, 0.8, 0.4, 1, ease.backOut);
  return (
    <group position={[0, -0.5, 0]} rotation={[0.28, 0.35, 0]} scale={entrada(t, aparece) * 1.3}>
      <Solido geometry={poste} color={p.medio} position={[0, 0.3, 0]} />
      <Solido geometry={pie} color={p.profundo} position={[0, -0.8, 0]} />
      <group position={[0, 1.4, 0]} rotation={[0, 0, -inclina]}>
        <Solido geometry={brazo} color={p.claro} />
        {[-1.5, 1.5].map((x, lado) => (
          <group key={x} position={[x, -0.75, 0]} rotation={[0, 0, inclina]}>
            <Solido geometry={plato} color={p.acento} />
            {marcas
              .map((e, i) => ({ e, i }))
              .filter(({ i }) => i % 2 === lado)
              .map(({ e }, j) => (
                <Solido key={j} geometry={peso} color={lado === 0 ? p.caps[1] ?? p.medio : p.aviso} position={[0, 0.2 + j * 0.3, 0]} scale={entrada(t, e, 0.5)} />
              ))}
          </group>
        ))}
      </group>
    </group>
  );
};

export const Salida: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const flecha = useGeo(() => extruir(formaFlecha(), 0.2, 0.04), []);
  const jamba = useGeo(() => new RoundedBoxGeometry(0.18, 2.8, 0.3, 2, 0.04), []);
  const dintel = useGeo(() => new RoundedBoxGeometry(1.78, 0.18, 0.3, 2, 0.04), []);
  const en = enes[0] ?? aparece + 0.8;
  const x = tween(t, en, 1.2, -1.6, 2.2, ease.power3InOut);
  return (
    <group rotation={[0.1, -0.55, 0]} scale={entrada(t, aparece)}>
      <Solido geometry={jamba} color={p.claro} position={[-0.8, 0.2, 0]} />
      <Solido geometry={jamba} color={p.claro} position={[0.8, 0.2, 0]} />
      <Solido geometry={dintel} color={p.claro} position={[0, 1.55, 0]} />
      <Solido geometry={flecha} color={p.acento} position={[x, 0.1, 0.05]} rotation={[0, Math.PI / 2 - 0.2, 0]} />
    </group>
  );
};

export const Orbe: React.FC<ObjetoProps> = ({ t, aparece = 0.1, acento }) => {
  const p = usePaleta(acento);
  const esfera = useGeo(() => new THREE.SphereGeometry(0.85, 48, 32), []);
  const aro = useGeo(() => new THREE.TorusGeometry(1.35, 0.045, 12, 96), []);
  const luna = useGeo(() => new THREE.SphereGeometry(0.13, 20, 14), []);
  const s = entrada(t, aparece, 0.9);
  const pulso = 0.55 + 0.25 * Math.sin(t * 3.2);
  return (
    <group scale={s} rotation={[0.2, t * 0.5, 0]}>
      <Solido geometry={esfera} color={p.acento} emisivo={p.acento} intensidadEmisiva={pulso} rugosidad={0.2} grosor={0.04} />
      <group rotation={[Math.PI / 2.4, 0, t * 0.9]}>
        <Solido geometry={aro} color={p.claro} sinTinta />
        {[0, 1, 2].map((i) => (
          <Solido key={i} geometry={luna} color={p.aviso} position={[Math.cos(t * 1.6 + i * 2.09) * 1.35, Math.sin(t * 1.6 + i * 2.09) * 1.35, 0]} grosor={0.03} />
        ))}
      </group>
      <group rotation={[-Math.PI / 3, 0.6, -t * 0.6]}>
        <Solido geometry={aro} color={p.caps[1] ?? p.medio} scale={0.82} sinTinta />
      </group>
    </group>
  );
};

export const Piramide: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], etiquetas = [], acento, limite }) => {
  const p = usePaleta(acento);
  const capas = 4;
  const anchoMax = Math.max(0, ...etiquetas.slice(0, capas).map((e) => anchoEtiqueta3D(e, 0.44, p.tema)));
  const cabe = escalaQueCabe(etiquetas.length ? Math.max(2.45, (1.6 + anchoMax / 2) * PERSPECTIVA_ETIQUETA) : 1.85, limite);
  const alto = 0.62;
  const geos = React.useMemo(
    () =>
      Array.from({ length: capas }, (_, i) => {
        const rb = 1.75 - i * 0.42;
        const rt = rb - 0.42;
        return new THREE.CylinderGeometry(Math.max(0.02, rt), rb, alto - 0.05, 4, 1);
      }),
    [],
  );
  const colores = [p.ok, p.acento, p.aviso, p.error];
  const marcas = Array.from({ length: capas }, (_, i) => enes[i] ?? aparece + i * 0.35);
  return (
    <group scale={cabe}>
    <group position={[etiquetas.length ? -0.7 : 0, -1.0, 0]} rotation={[0.18, Math.PI / 4 + t * 0.25, 0]}>
      {geos.map((g, i) => {
        const k = tween(t, marcas[i], 0.6, 0, 1, ease.power3Out);
        return (
          <Solido key={i} geometry={g} color={colores[i]} position={[0, i * alto + alto / 2 + (1 - k) * 2.2, 0]} scale={Math.max(0.001, k)} grosor={0.03} />
        );
      })}
      {etiquetas.slice(0, capas).map((e, i) => (
        <group key={e + i} rotation={[0, -(Math.PI / 4 + t * 0.25), 0]}>
          <Etiqueta3D texto={e} alto={0.44} position={[2.3, i * alto + alto / 2, 0.2]} scale={tween(t, marcas[i] + 0.3, 0.4, 0.001, 1, ease.power2Out)} />
        </group>
      ))}
    </group>
    </group>
  );
};

/** Color de la paleta más cercano al azul (tono ≈ 225°), para el disco de las estrellas. */
const masAzul = (colores: string[]) => {
  let mejor = colores[0];
  let d = Infinity;
  for (const c of colores) {
    const hsl = { h: 0, s: 0, l: 0 };
    new THREE.Color(c).getHSL(hsl);
    const dh = Math.min(Math.abs(hsl.h * 360 - 225), 360 - Math.abs(hsl.h * 360 - 225)) + (1 - hsl.s) * 60;
    if (dh < d) {
      d = dh;
      mejor = c;
    }
  }
  return mejor;
};

export const EstrellasUE: React.FC<ObjetoProps> = ({ t, aparece = 0.2, acento }) => {
  const p = usePaleta(acento);
  const azul = masAzul([p.acento, ...p.caps]);
  const estrella = useGeo(() => extruir(formaEstrella(0.26, 0.105), 0.08, 0.02), []);
  const disco = useGeo(() => new THREE.CylinderGeometry(1.95, 1.95, 0.08, 64), []);
  return (
    <group rotation={[0.1 + Math.sin(t * 0.5) * 0.05, Math.sin(t * 0.4) * 0.35, 0]}>
      <Solido geometry={disco} color={azul} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.1]} scale={entrada(t, aparece, 0.7)} opacidad={0.95} grosor={0.03} />
      <group rotation={[0, 0, t * 0.25]}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          const k = entrada(t, aparece + 0.3 + i * 0.07, 0.5);
          return <Solido key={i} geometry={estrella} color={p.aviso} position={[Math.cos(a) * 1.4, Math.sin(a) * 1.4, 0.05]} rotation={[0, 0, -t * 0.25]} scale={k} grosor={0.02} />;
        })}
      </group>
    </group>
  );
};

export const Reloj: React.FC<ObjetoProps> = ({ t, aparece = 0.2, acento }) => {
  const p = usePaleta(acento);
  const cara = useGeo(() => new THREE.CylinderGeometry(1.4, 1.4, 0.22, 64), []);
  const bisel = useGeo(() => new THREE.TorusGeometry(1.42, 0.12, 16, 80), []);
  const marca = useGeo(() => new THREE.BoxGeometry(0.07, 0.24, 0.05), []);
  const horaria = useGeo(() => new RoundedBoxGeometry(0.12, 0.75, 0.06, 2, 0.03).translate(0, 0.3, 0), []);
  const minutera = useGeo(() => new RoundedBoxGeometry(0.08, 1.1, 0.06, 2, 0.03).translate(0, 0.45, 0), []);
  const eje = useGeo(() => new THREE.CylinderGeometry(0.1, 0.1, 0.12, 20), []);
  const giro = tween(t, aparece + 0.4, 6, 0, 1, ease.power2InOut);
  return (
    <group rotation={[0.1, -0.35 + Math.sin(t * 0.5) * 0.1, 0]} scale={entrada(t, aparece)}>
      <Solido geometry={cara} color={p.claro} rotation={[Math.PI / 2, 0, 0]} rugosidad={0.5} grosor={0.03} />
      <Solido geometry={bisel} color={p.acento} />
      {Array.from({ length: 12 }, (_, i) => {
        const a = (i / 12) * Math.PI * 2;
        return <Solido key={i} geometry={marca} color={i % 3 === 0 ? p.acento : p.medio} position={[Math.sin(a) * 1.15, Math.cos(a) * 1.15, 0.13]} rotation={[0, 0, -a]} sinTinta />;
      })}
      <Solido geometry={horaria} color={p.profundo} position={[0, 0, 0.16]} rotation={[0, 0, -giro * Math.PI * 1.2 - 0.9]} sinTinta />
      <Solido geometry={minutera} color={p.error} position={[0, 0, 0.2]} rotation={[0, 0, -giro * Math.PI * 8 - t * 0.6]} sinTinta />
      <Solido geometry={eje} color={p.profundo} position={[0, 0, 0.2]} rotation={[Math.PI / 2, 0, 0]} sinTinta />
    </group>
  );
};

export const Grafica: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const base = useGeo(() => new RoundedBoxGeometry(3.6, 0.14, 1.4, 2, 0.05), []);
  const barra = useGeo(() => new RoundedBoxGeometry(0.5, 1, 0.5, 2, 0.06).translate(0, 0.5, 0), []);
  const alturas = [0.8, 1.3, 1.05, 1.8, 2.5];
  const colores = [p.medio, p.caps[1] ?? p.medio, p.medio, p.caps[2] ?? p.acento, p.acento];
  return (
    <group position={[0, -1.1, 0]} rotation={[0.3, -0.45 + Math.sin(t * 0.4) * 0.12, 0]} scale={entrada(t, aparece, 0.6)}>
      <Solido geometry={base} color={p.profundo} />
      {alturas.map((h, i) => {
        const en = enes[i] ?? aparece + 0.3 + i * 0.22;
        const k = tween(t, en, 0.7, 0.001, 1, ease.backOut);
        return <Solido key={i} geometry={barra} color={colores[i]} position={[-1.4 + i * 0.7, 0.07, 0]} scale={[1, h * k, 1]} grosor={0.03} />;
      })}
    </group>
  );
};

export const Candado: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const cuerpo = useGeo(() => new RoundedBoxGeometry(1.9, 1.55, 0.7, 4, 0.16), []);
  const arco = useGeo(() => new THREE.TorusGeometry(0.62, 0.15, 16, 40, Math.PI), []);
  const pata = useGeo(() => new THREE.CylinderGeometry(0.15, 0.15, 0.8, 20), []);
  const bocallave = useGeo(() => new THREE.CylinderGeometry(0.16, 0.16, 0.1, 24), []);
  const ranura = useGeo(() => new THREE.BoxGeometry(0.12, 0.36, 0.1), []);
  const en = enes[0] ?? aparece + 1.0;
  const cierra = tween(t, en, 0.35, 0.55, 0, ease.power2InOut);
  const golpe = 1 + 0.06 * Math.sin(Math.PI * Math.max(0, Math.min(1, (t - en - 0.3) / 0.25)));
  return (
    <group rotation={[0.1, -0.4 + Math.sin(t * 0.6) * 0.15, 0]} scale={entrada(t, aparece) * golpe} position={[0, -0.35, 0]}>
      <Solido geometry={cuerpo} color={p.acento} grosor={0.04} />
      <group position={[0, 0.78 + cierra, 0]}>
        <Solido geometry={arco} color={p.medio} position={[0, 0.4, 0]} />
        <Solido geometry={pata} color={p.medio} position={[-0.62, 0, 0]} />
        <Solido geometry={pata} color={p.medio} position={[0.62, 0, 0]} />
      </group>
      <Solido geometry={bocallave} color={p.profundo} position={[0, 0.12, 0.36]} rotation={[Math.PI / 2, 0, 0]} sinTinta />
      <Solido geometry={ranura} color={p.profundo} position={[0, -0.12, 0.36]} sinTinta />
    </group>
  );
};

export const Engranajes: React.FC<ObjetoProps> = ({ t, aparece = 0.2, acento }) => {
  const p = usePaleta(acento);
  const grande = useGeo(() => extruir(formaEngranaje(1.0, 12, 0.22), 0.3, 0.03, 8), []);
  const medio = useGeo(() => extruir(formaEngranaje(0.62, 8, 0.2), 0.3, 0.03, 8), []);
  const peque = useGeo(() => extruir(formaEngranaje(0.42, 6, 0.18), 0.3, 0.03, 8), []);
  const w = t * 0.8;
  return (
    <group rotation={[0.25, -0.35 + Math.sin(t * 0.4) * 0.1, 0]} scale={entrada(t, aparece)}>
      <Solido geometry={grande} color={p.acento} position={[-0.55, -0.2, 0]} rotation={[0, 0, w]} grosor={0.03} />
      <Solido geometry={medio} color={p.claro} position={[1.02, 0.55, 0.05]} rotation={[0, 0, -w * (12 / 8) + 0.2]} scale={entrada(t, aparece + 0.25)} grosor={0.03} />
      <Solido geometry={peque} color={p.aviso} position={[0.62, -1.28, -0.05]} rotation={[0, 0, -w * (12 / 6) + 0.1]} scale={entrada(t, aparece + 0.45)} grosor={0.03} />
    </group>
  );
};

export const Bombilla: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const vidrio = useGeo(() => new THREE.SphereGeometry(1.0, 48, 32), []);
  const cuello = useGeo(() => new THREE.CylinderGeometry(0.48, 0.62, 0.5, 32), []);
  const rosca = useGeo(() => new THREE.TorusGeometry(0.46, 0.07, 10, 40), []);
  const filamento = useGeo(() => new THREE.TorusKnotGeometry(0.22, 0.045, 64, 8, 2, 3), []);
  const rayo = useGeo(() => new RoundedBoxGeometry(0.1, 0.5, 0.1, 2, 0.04), []);
  const en = enes[0] ?? aparece + 0.9;
  const luz = tween(t, en, 0.4, 0, 1, ease.power2Out);
  return (
    <group position={[0, 0.25, 0]} rotation={[0.08, Math.sin(t * 0.6) * 0.3, 0]} scale={entrada(t, aparece)}>
      <Solido geometry={vidrio} color={tema_mix(p.claro, p.aviso, luz * 0.6)} emisivo={p.aviso} intensidadEmisiva={luz * 0.9} opacidad={0.72} rugosidad={0.1} grosor={0.03} />
      <Solido geometry={filamento} color={p.aviso} emisivo={p.aviso} intensidadEmisiva={0.3 + luz * 1.6} sinTinta />
      <Solido geometry={cuello} color={p.medio} position={[0, -1.05, 0]} />
      {[0, 1, 2].map((i) => (
        <Solido key={i} geometry={rosca} color={p.profundo} position={[0, -1.35 - i * 0.16, 0]} rotation={[Math.PI / 2, 0, 0]} sinTinta />
      ))}
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const r = 1.45 + 0.1 * Math.sin(t * 4 + i);
        return (
          <Solido
            key={i}
            geometry={rayo}
            color={p.aviso}
            position={[Math.cos(a) * r, Math.sin(a) * r + 0.05, 0]}
            rotation={[0, 0, a - Math.PI / 2]}
            scale={Math.max(0.001, luz)}
            sinTinta
          />
        );
      })}
    </group>
  );
};

// Mezcla de colores sin hooks (para usar dentro de expresiones).
const tema_mix = (a: string, b: string, k: number) => {
  const pa = new THREE.Color(a);
  return `#${pa.lerp(new THREE.Color(b), Math.max(0, Math.min(1, k))).getHexString()}`;
};

export const Documento: React.FC<ObjetoProps> = ({ t, aparece = 0.2, acento }) => {
  const p = usePaleta(acento);
  const hoja = useGeo(() => new RoundedBoxGeometry(2.1, 2.8, 0.06, 2, 0.03), []);
  const linea = useGeo(() => new THREE.BoxGeometry(1.4, 0.07, 0.02), []);
  const titulo = useGeo(() => new THREE.BoxGeometry(0.9, 0.16, 0.02), []);
  const lente = useGeo(() => new THREE.TorusGeometry(0.42, 0.08, 16, 48), []);
  const mango = useGeo(() => new RoundedBoxGeometry(0.16, 0.8, 0.14, 2, 0.05), []);
  const cristal = useGeo(() => new THREE.CircleGeometry(0.4, 40), []);
  const mx = Math.sin(t * 0.9) * 0.45;
  const my = 0.3 + Math.cos(t * 0.7) * 0.5;
  return (
    <group rotation={[-0.25, 0.3 + Math.sin(t * 0.5) * 0.08, 0.04]} scale={entrada(t, aparece)}>
      {[2, 1, 0].map((i) => (
        <Solido key={i} geometry={hoja} color={i === 0 ? p.claro : tema_mix(p.claro, p.medio, 0.25 * i)} position={[i * 0.14, -i * 0.12, -i * 0.12]} rotation={[0, 0, i * 0.04]} grosor={0.025} />
      ))}
      <Solido geometry={titulo} color={p.acento} position={[-0.35, 1.05, 0.05]} sinTinta />
      {[0.7, 0.45, 0.2, -0.05, -0.3, -0.55, -0.8].map((y, i) => (
        <Solido key={i} geometry={linea} color={p.medio} position={[-0.1 - (i === 6 ? 0.3 : 0), y, 0.05]} scale={[i === 6 ? 0.6 : 1, 1, 1]} sinTinta />
      ))}
      <group position={[mx, my, 0.45]} scale={entrada(t, aparece + 0.5)}>
        <Solido geometry={lente} color={p.profundo} />
        <mesh geometry={cristal}>
          <meshBasicMaterial color={p.acento} transparent opacity={0.18} toneMapped={false} />
        </mesh>
        <Solido geometry={mango} color={p.profundo} position={[0.42, -0.62, 0]} rotation={[0, 0, 0.6]} />
      </group>
    </group>
  );
};


// ——— Estilo milikito (§7) ———

export const Trofeo: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const copa = useGeo(
    () =>
      new THREE.LatheGeometry(
        [
          [0.14, -0.2],
          [0.44, -0.1],
          [0.74, 0.14],
          [0.92, 0.52],
          [0.99, 0.92],
          [1.02, 1.06],
          [0.9, 1.06],
          [0.84, 0.66],
          [0.62, 0.28],
          [0.3, 0.06],
          [0.0, 0.02],
        ].map(([x, y]) => new THREE.Vector2(x, y)),
        48,
      ),
    [],
  );
  const asa = useGeo(() => new THREE.TorusGeometry(0.36, 0.085, 12, 32, Math.PI * 1.15), []);
  const tallo = useGeo(() => new THREE.CylinderGeometry(0.11, 0.16, 0.55, 24), []);
  const nudo = useGeo(() => new THREE.SphereGeometry(0.2, 24, 16), []);
  const pie = useGeo(() => new THREE.CylinderGeometry(0.58, 0.7, 0.22, 48), []);
  const peana = useGeo(() => new RoundedBoxGeometry(1.35, 0.34, 1.35, 3, 0.06), []);
  const estrella = useGeo(() => extruir(formaEstrella(0.3, 0.13), 0.1, 0.03), []);
  const k = entrada(t, aparece, 1.0);
  const gira = tween(t, aparece, 1.3, 1, 0, ease.power3Out);
  const en = enes[0] ?? aparece + 1.1;
  const brillo = Math.max(0, Math.sin(Math.PI * Math.max(0, Math.min(1, (t - en) / 0.6)))) * 0.8;
  const arco = Math.PI * 1.15;
  return (
    <group position={[0, 0.12 + (1 - Math.min(1, k)) * -1.2, 0]} rotation={[0.12, gira * Math.PI * 2 + Math.sin(t * 0.6) * 0.28, 0]} scale={k * 1.05}>
      <Solido geometry={copa} color={p.acento} emisivo={p.aviso} intensidadEmisiva={brillo} lado={THREE.DoubleSide} grosor={0.04} />
      <Solido geometry={asa} color={p.acento} position={[0.96, 0.62, 0]} rotation={[0, 0, -arco / 2]} grosor={0.03} />
      <Solido geometry={asa} color={p.acento} position={[-0.96, 0.62, 0]} rotation={[0, 0, Math.PI - arco / 2]} grosor={0.03} />
      <Solido geometry={tallo} color={p.acento} position={[0, -0.46, 0]} grosor={0.03} />
      <Solido geometry={nudo} color={p.aviso} position={[0, -0.32, 0]} grosor={0.03} />
      <Solido geometry={pie} color={p.acento} position={[0, -0.84, 0]} grosor={0.03} />
      <Solido geometry={peana} color={p.profundo} position={[0, -1.12, 0]} grosor={0.035} />
      <Solido geometry={estrella} color={p.claro} position={[0, 0.58, 0.93]} rotation={[-0.18, 0, 0]} scale={entrada(t, aparece + 0.6, 0.6)} grosor={0.025} />
    </group>
  );
};

export const Llave: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const ojo = useGeo(() => new THREE.TorusGeometry(0.52, 0.17, 16, 48), []);
  const cana = useGeo(() => new THREE.CylinderGeometry(0.11, 0.11, 2.2, 24), []);
  const collar = useGeo(() => new THREE.CylinderGeometry(0.18, 0.18, 0.16, 24), []);
  const diente = useGeo(() => new RoundedBoxGeometry(0.2, 0.46, 0.16, 2, 0.04), []);
  const dienteCorto = useGeo(() => new RoundedBoxGeometry(0.2, 0.3, 0.16, 2, 0.04), []);
  const en = enes[0] ?? aparece + 1.0;
  const gira = tween(t, en, 0.55, 0, Math.PI / 2, ease.power3InOut);
  return (
    <group rotation={[0.2, -0.5 + Math.sin(t * 0.6) * 0.18, 0.28]} scale={entrada(t, aparece) * 1.1}>
      <group rotation={[gira, 0, 0]}>
        <Solido geometry={ojo} color={p.acento} position={[-1.15, 0, 0]} grosor={0.035} />
        <Solido geometry={cana} color={p.acento} position={[0.35, 0, 0]} rotation={[0, 0, Math.PI / 2]} grosor={0.03} />
        <Solido geometry={collar} color={p.aviso} position={[-0.52, 0, 0]} rotation={[0, 0, Math.PI / 2]} grosor={0.03} />
        <Solido geometry={diente} color={p.acento} position={[1.2, -0.3, 0]} grosor={0.03} />
        <Solido geometry={dienteCorto} color={p.acento} position={[0.86, -0.22, 0]} grosor={0.03} />
      </group>
    </group>
  );
};

export const Escalera: React.FC<ObjetoProps> = ({ t, aparece = 0.2, enes = [], acento }) => {
  const p = usePaleta(acento);
  const N = 5;
  const H = 0.42;
  const D = 0.6;
  const peldanos = React.useMemo(() => Array.from({ length: N }, (_, i) => new RoundedBoxGeometry(1.8, H * (i + 1), D, 3, 0.05)), []);
  const estrella = useGeo(() => extruir(formaEstrella(0.32, 0.14), 0.12, 0.03), []);
  const colores = [p.caps[2] ?? p.medio, p.caps[3] ?? p.claro, p.caps[1] ?? p.aviso, p.aviso, p.acento];
  // Cada peldaño cae y rebota cuando se nombra (enes) o, si no, escalonado.
  const marcas = Array.from({ length: N }, (_, i) => enes[i] ?? (enes.length ? (enes.at(-1) ?? aparece) + (i - enes.length + 1) * 0.3 : aparece + i * 0.3));
  const cima = marcas[N - 1] + 0.45;
  return (
    <group position={[0.2, 0, 0]} rotation={[0.3, -0.72 + Math.sin(t * 0.4) * 0.1, 0]}>
      {peldanos.map((g, i) => {
        const k = tween(t, marcas[i], 0.6, 0, 1, ease.backOut);
        const alto = H * (i + 1);
        return (
          <Solido
            key={i}
            geometry={g}
            color={colores[i % colores.length]}
            position={[0, -1.05 + alto / 2 + (1 - k) * 2.4, (2 - i) * D]}
            scale={Math.max(0.001, Math.min(1, k * 1.4))}
            grosor={0.035}
          />
        );
      })}
      <Solido
        geometry={estrella}
        color={p.acento}
        emisivo={p.aviso}
        intensidadEmisiva={0.3}
        position={[0, -1.05 + H * N + 0.55 + Math.sin(t * 2) * 0.06, -2 * D]}
        rotation={[0, t * 1.4, 0]}
        scale={entrada(t, cima, 0.6)}
        grosor={0.025}
      />
    </group>
  );
};

/** Texto extruido letra a letra (caen con rebote y giran media vuelta), dorado y con contorno de tinta. */
export const Letras: React.FC<ObjetoProps> = ({ t, aparece = 0.2, acento, texto, limite }) => {
  const p = usePaleta(acento);
  const prep = useLetras((texto ?? "3D").trim() || "3D");
  if (!prep) return null;
  const esc = Math.min(2.4, limite ? (limite[0] * 1.72) / Math.max(0.5, prep.ancho) : 3.4 / Math.max(0.5, prep.ancho), limite ? (limite[1] * 0.95) / prep.alto : 2);
  // «Letras 3D doradas» (estilo.md): el oro del estilo, no el acento del capítulo.
  const oro = p.tema.c.acento;
  return (
    <group rotation={[0.1 + Math.sin(t * 0.5) * 0.04, Math.sin(t * 0.6) * 0.22, 0]} scale={esc}>
      {prep.letras.map((l, i) => {
        if (!l.geo) return null;
        const en = aparece + i * 0.12;
        const k = tween(t, en, 0.75, 0, 1, ease.backOut);
        const ola = Math.sin(t * 2.2 + i * 0.8) * 0.035 * Math.min(1, Math.max(0, t - en - 0.8));
        return (
          <Solido
            key={i}
            geometry={l.geo}
            color={i % 2 ? tema_mix(oro, p.aviso, 0.3) : oro}
            position={[l.x, (1 - k) * 2.2 + ola, 0]}
            rotation={[0, (1 - Math.min(1, k)) * Math.PI, 0]}
            scale={Math.max(0.001, Math.min(1.05, k))}
            grosor={0.025}
          />
        );
      })}
    </group>
  );
};

export const CATALOGO: Record<string, React.FC<ObjetoProps>> = {
  escudo: Escudo,
  contrato: Contrato,
  registro: Registro,
  cadena: Cadena,
  balanza: Balanza,
  salida: Salida,
  orbe: Orbe,
  piramide: Piramide,
  "estrellas-ue": EstrellasUE,
  reloj: Reloj,
  grafica: Grafica,
  candado: Candado,
  engranajes: Engranajes,
  bombilla: Bombilla,
  documento: Documento,
  trofeo: Trofeo,
  llave: Llave,
  escalera: Escalera,
  letras: Letras,
};

export const nombresObjetos = Object.keys(CATALOGO);

/** Objeto del catálogo por nombre (uno desconocido pinta el orbe y lo avisa en consola). */
export const Objeto3D: React.FC<ObjetoProps & { nombre: string }> = ({ nombre, ...props }) => {
  const C = CATALOGO[nombre];
  if (!C) {
    console.warn(`[motor] objeto 3D desconocido: «${nombre}» (se usa «orbe»)`);
    return <Orbe {...props} />;
  }
  return <C {...props} />;
};
