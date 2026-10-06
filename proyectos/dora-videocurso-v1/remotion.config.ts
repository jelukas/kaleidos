/**
 * Configuración de la CLI (no aplica a las APIs de Node ni a Lambda, que reciben las opciones por parámetro).
 * https://remotion.dev/docs/config
 */
import { Config } from "@remotion/cli/config";

Config.setRspack(true);
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(90);
Config.setOverwriteOutput(true);
// WebGL por GPU en local (en Lambda se usa swangle por software, más lento).
Config.setChromiumOpenGlRenderer("angle");
