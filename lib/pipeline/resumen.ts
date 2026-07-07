/**
 * Normaliza el resumen de un reclamo como en el prototipo: recorta los
 * extremos (sin colapsar el espaciado interno), pone la primera letra en
 * mayúscula y trunca a 85 caracteres más "…" cuando supera los 88. El corte
 * es por puntos de código, para no partir emojis ni caracteres fuera del BMP.
 */
export function normalizarResumen(texto: string): string {
  const limpio = texto.trim();
  if (!limpio) return "";
  const capitalizado = limpio.charAt(0).toUpperCase() + limpio.slice(1);
  const puntos = Array.from(capitalizado);
  if (puntos.length > 88) return `${puntos.slice(0, 85).join("")}…`;
  return capitalizado;
}
