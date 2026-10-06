# Remotion vs HyperFrames: vídeos de cursos

Prueba comparativa entre [Remotion](https://www.remotion.dev) y [HyperFrames](https://github.com/heygen-com/hyperframes) para generar vídeos de cursos, renderizando primero en local y después en AWS Lambda (`eu-west-1`).

> Uso de evaluación, no comercial. Antes de un uso comercial hay que revisar la licencia de Remotion: es gratuita para equipos de hasta 3 personas y a partir de ahí las empresas necesitan licencia de pago ([remotion.pro/license](https://www.remotion.pro/license)). HyperFrames es Apache-2.0.

## Estructura

| Carpeta / archivo    | Contenido                                                        |
| -------------------- | ---------------------------------------------------------------- |
| `remotion-test/`     | Proyecto Remotion con `@remotion/three`                          |
| `hyperframes-test/`  | Proyecto HyperFrames (`npx hyperframes init`)                    |
| `assets/`            | Especificación común (`ESCENA.md`) y tipografía compartida       |
| `resultados/`        | Vídeos renderizados, medidas y `comparativa.md` (fuera de git)   |
| `../.env`            | Claves (fuera de git, en la raíz del repo)                       |

## Escena de prueba: "intro de curso"

30 s · 1920×1080 · 30 fps (900 fotogramas). Paleta azul oscuro + blanco, misma tipografía en los dos.

| Tramo     | Contenido                                            |
| --------- | ---------------------------------------------------- |
| 0–5 s     | Título animado con subtítulo                         |
| 5–15 s    | Objeto 3D girando con luces y sombras                |
| 15–22 s   | Gráfica de barras animada con 5 valores              |
| 22–30 s   | Transición vistosa y rótulo final con logo de texto  |

## Fases

1. **Estructura**: carpetas, `.gitignore`, comprobación de Node, npm y git.
2. **Misma escena en los dos**: proyecto Remotion + `@remotion/three` y proyecto HyperFrames, con la escena lo más parecida posible.
3. **Render local**: `resultados/remotion-local.mp4` y `resultados/hyperframes-local.mp4`, con tiempo total y segundos por fotograma.
4. **Configuración de AWS** (la hace el usuario en la consola, guiado paso a paso):
   alerta de presupuesto, rol `remotion-lambda-role`, usuario IAM de pruebas con política combinada, clave de acceso, `.env` y cuota de concurrencia de Lambda. Validación con `npx remotion lambda policies validate` y su equivalente de HyperFrames.
5. **Render en Lambda** (`eu-west-1`): Remotion (función de 3008 MB + site) y HyperFrames (stack propio) a `resultados/remotion-lambda.mp4` y `resultados/hyperframes-lambda.mp4`, con tiempo, s/fotograma y coste reportado.
6. **Conclusiones**: `resultados/comparativa.md`, extrapolación a un vídeo de 1 hora con 100 y 200 funciones en paralelo, recomendación y comandos de limpieza de AWS (sin ejecutar).

## Reglas

- Nada se crea ni se borra en AWS sin confirmación explícita.
- No se borra nada fuera de esta carpeta.
- Las claves solo viven en `.env`; nunca se imprimen ni se pegan en el chat.
- Si la documentación oficial difiere de este plan, manda la documentación (y se anota aquí).

## Entorno

| Herramienta | Versión                      |
| ----------- | ---------------------------- |
| Máquina     | Apple M1 Pro, 8 núcleos, 16 GB |
| Node        | v22.23.1                     |
| npm         | 10.9.8                       |
| git         | 2.50.1                       |
| ffmpeg      | 8.1.2 (Homebrew)             |
| AWS CLI     | no instalado                 |
