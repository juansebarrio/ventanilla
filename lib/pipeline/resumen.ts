/**
 * Normaliza el resumen de un reclamo como en el prototipo: colapsa espacios,
 * pone la primera letra en mayúscula y trunca a 85 caracteres más "…" cuando
 * supera los 88.
 */
export function normalizarResumen(texto: string): string {
  const limpio = texto.trim().replace(/\s+/g, " ");
  if (!limpio) return "";
  const capitalizado = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  if (capitalizado.length > 88) return `${capitalizado.slice(0, 85)}…`;
  return capitalizado;
}
