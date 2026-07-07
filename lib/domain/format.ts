/** Formateos compartidos del panel y la landing. */

export const TZ_AR = "America/Argentina/Buenos_Aires";

/**
 * Enmascara un teléfono argentino para la interfaz: "11 •• ••• 4821".
 * En la base se guarda completo; la interfaz nunca lo muestra entero.
 */
export function maskPhone(telefono: string): string {
  const digitos = telefono.replace(/\D/g, "");
  // Sacamos prefijos de país (54) y de celular (9) si vienen incluidos.
  const local = digitos.replace(/^549?/, "");
  const area = local.slice(0, 2);
  const final = local.slice(-4);
  return `${area} •• ••• ${final}`;
}

/** Monto entero en pesos con separador de miles: "$ 952.800". */
export function formatMonto(monto: number): string {
  return `$ ${new Intl.NumberFormat("es-AR", { maximumFractionDigits: 0 }).format(monto)}`;
}

/** "Martes 7 de julio", en la zona horaria de Buenos Aires. */
export function fechaDelDia(fecha: Date = new Date()): string {
  const texto = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: TZ_AR,
  }).format(fecha);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Hora "14:02" en Buenos Aires, para el timeline y el feed. */
export function horaCorta(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: TZ_AR,
  }).format(fecha);
}

/** "7 jul 14:02", para la card Datos del detalle. */
export function fechaConHora(fecha: Date): string {
  const dia = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: TZ_AR,
  })
    .format(fecha)
    .replace(/\.$/, "");
  return `${dia} ${horaCorta(fecha)}`;
}

/**
 * Actividad relativa al estilo del prototipo: "recién", "hace 4 min",
 * "hace 2 h", "ayer", "hace 3 días". Deltas negativos (seed con horas
 * futuras) se clampean a "recién".
 */
export function fechaRelativa(fecha: Date, ahora: Date = new Date()): string {
  const minutos = Math.floor((ahora.getTime() - fecha.getTime()) / 60_000);
  if (minutos < 2) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return "ayer";
  return `hace ${dias} días`;
}
