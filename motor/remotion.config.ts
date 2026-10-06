/**
 * Configuración de la CLI (Studio y `npx remotion ...`). Los scripts de `scripts/` usan las APIs de Node
 * y Lambda recibe las opciones por parámetro, así que esto solo afecta al uso manual de la CLI.
 */
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
// WebGL por GPU en local; en Lambda es por software (swangle).
Config.setChromiumOpenGlRenderer("angle");
