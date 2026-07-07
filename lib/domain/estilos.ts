/**
 * Mapa de estados y urgencias a sus colores, extraídos de design-reference.
 * Los valores viven como variables CSS en globals.css; acá se referencian
 * por su var() para que un solo lugar defina cada hex.
 */

import type { Estado, Urgencia } from "./claims";

export const CHIP_ESTADO: Record<Estado, { bg: string; fg: string }> = {
  recibido: { bg: "var(--estado-recibido-bg)", fg: "var(--estado-recibido-fg)" },
  en_gestion: { bg: "var(--estado-gestion-bg)", fg: "var(--estado-gestion-fg)" },
  asignado: { bg: "var(--estado-asignado-bg)", fg: "var(--estado-asignado-fg)" },
  resuelto: { bg: "var(--estado-resuelto-bg)", fg: "var(--estado-resuelto-fg)" },
  cerrado: { bg: "var(--estado-cerrado-bg)", fg: "var(--estado-cerrado-fg)" },
  reabierto: { bg: "var(--estado-reabierto-bg)", fg: "var(--estado-reabierto-fg)" },
  derivado: { bg: "var(--estado-derivado-bg)", fg: "var(--estado-derivado-fg)" },
};

export const PUNTO_URGENCIA: Record<Urgencia, string> = {
  urgente: "var(--urgencia-urgente)",
  alta: "var(--urgencia-alta)",
  media: "var(--urgencia-media)",
  baja: "var(--urgencia-baja)",
};
