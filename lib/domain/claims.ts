/** Vocabulario del dominio, espejado con los CHECK constraints del schema. */

export const ESTADOS = [
  "recibido",
  "en_gestion",
  "asignado",
  "resuelto",
  "cerrado",
  "reabierto",
  "derivado",
] as const;
export type Estado = (typeof ESTADOS)[number];

/**
 * Filtro "Abiertos" de la bandeja: todo lo que sigue vivo para la
 * administración. Excluye cerrado y derivado.
 */
export const OPEN_ESTADOS = [
  "recibido",
  "en_gestion",
  "asignado",
  "resuelto",
  "reabierto",
] as const satisfies readonly Estado[];

export const URGENCIAS = ["urgente", "alta", "media", "baja"] as const;
export type Urgencia = (typeof URGENCIAS)[number];

export const AMBITOS = ["comun", "privado"] as const;
export type Ambito = (typeof AMBITOS)[number];

export const ORIGENES = ["simulador", "whatsapp", "manual"] as const;
export type Origen = (typeof ORIGENES)[number];

export const DIRECCIONES_MENSAJE = ["entrada", "salida"] as const;
export type DireccionMensaje = (typeof DIRECCIONES_MENSAJE)[number];

export const TIPOS_MENSAJE = ["texto", "audio", "foto"] as const;
export type TipoMensaje = (typeof TIPOS_MENSAJE)[number];

/** Etiquetas visibles, tal como aparecen en design-reference. */
export const ESTADO_LABELS: Record<Estado, string> = {
  recibido: "Recibido",
  en_gestion: "En gestión",
  asignado: "Asignado",
  resuelto: "Resuelto",
  cerrado: "Cerrado",
  reabierto: "Reabierto",
  derivado: "Derivado",
};

export const URGENCIA_LABELS: Record<Urgencia, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

export const AMBITO_LABELS: Record<Ambito, string> = {
  comun: "Ámbito común",
  privado: "Ámbito privado",
};

export function esEstadoAbierto(estado: Estado): boolean {
  return (OPEN_ESTADOS as readonly string[]).includes(estado);
}
