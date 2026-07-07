import { ESTADO_LABELS, type Estado } from "@/lib/domain/claims";

/**
 * Máquina de estados de los reclamos. Define las transiciones válidas y, por
 * cada cambio, el evento y la columna de timestamp a actualizar. Es pura: no
 * toca la base; el llamador aplica el resultado.
 */

export const TRANSICIONES: Record<Estado, readonly Estado[]> = {
  recibido: ["en_gestion", "asignado", "derivado", "cerrado"],
  en_gestion: ["recibido", "asignado", "resuelto", "derivado", "cerrado"],
  asignado: ["en_gestion", "resuelto", "derivado", "cerrado"],
  resuelto: ["cerrado", "reabierto"],
  cerrado: ["reabierto"],
  reabierto: ["en_gestion", "asignado", "resuelto", "derivado", "cerrado"],
  derivado: ["en_gestion", "asignado", "reabierto", "cerrado"],
};

/** Columna de timestamp que marca la llegada a cada estado. */
const COLUMNA_TIMESTAMP: Partial<Record<Estado, string>> = {
  en_gestion: "en_gestion_at",
  asignado: "asignado_at",
  resuelto: "resuelto_at",
  cerrado: "cerrado_at",
  reabierto: "reabierto_at",
  derivado: "derivado_at",
};

export class TransicionInvalidaError extends Error {
  constructor(
    public readonly desde: Estado,
    public readonly hacia: Estado,
  ) {
    super(`No se puede pasar de ${desde} a ${hacia}`);
    this.name = "TransicionInvalidaError";
  }
}

/** Una transición a un estado distinto que la máquina admite. */
export function esTransicionValida(desde: Estado, hacia: Estado): boolean {
  if (desde === hacia) return false;
  return TRANSICIONES[desde].includes(hacia);
}

export type ResultadoTransicion = {
  estado: Estado;
  timestampColumna: string | null;
  evento: { tipo: string; texto: string; actor: string };
};

/**
 * Calcula la transición: valida, elige la columna de timestamp y arma el
 * evento. "resuelto" genera el evento de conformidad del export; el resto,
 * "Estado cambiado a X".
 */
export function aplicarTransicion(
  desde: Estado,
  hacia: Estado,
  actor: string,
): ResultadoTransicion {
  if (!esTransicionValida(desde, hacia)) {
    throw new TransicionInvalidaError(desde, hacia);
  }

  const texto =
    hacia === "resuelto"
      ? "Marcado Resuelto · esperando conformidad"
      : `Estado cambiado a ${ESTADO_LABELS[hacia]}`;

  return {
    estado: hacia,
    timestampColumna: COLUMNA_TIMESTAMP[hacia] ?? null,
    evento: { tipo: "estado", texto, actor },
  };
}
