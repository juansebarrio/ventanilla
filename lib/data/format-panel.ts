import type { Urgencia } from "@/lib/domain/claims";

/** Color del punto de morosidad según cantidad de períodos adeudados. */
export function colorPorPeriodos(periodos: number): Urgencia {
  if (periodos >= 3) return "urgente";
  if (periodos === 2) return "alta";
  return "media";
}

/** Promedio de primera respuesta como "38 s". */
export function formatSegundos(segundos: number): string {
  return `${Math.round(segundos)} s`;
}

/** Promedio de resolución como "2,1 días" (una decimal, coma). */
export function formatDias(dias: number): string {
  const redondeado = Math.round(dias * 10) / 10;
  const texto = redondeado.toFixed(1).replace(".", ",");
  return `${texto} ${redondeado === 1 ? "día" : "días"}`;
}

/**
 * Texto de un movimiento del feed: agrega el número del reclamo entre
 * paréntesis si el texto del evento no lo menciona ya.
 */
export function textoMovimiento(texto: string, claimNumero: string): string {
  return texto.includes(claimNumero) ? texto : `${texto} (${claimNumero})`;
}
