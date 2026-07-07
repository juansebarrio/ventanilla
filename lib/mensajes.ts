import type { Urgencia } from "@/lib/domain/claims";

/**
 * Plantillas centralizadas de los mensajes salientes. Las usa el pipeline
 * (simulador y, en fase 1, el webhook de WhatsApp), así el texto es idéntico
 * sin importar el canal. Copy exacto de design-reference; sin exclamaciones.
 */

/**
 * Mensaje de confirmación al vecino, con el formato del simulador del export.
 * Si es emergencia, antepone la indicación de llamar al 911; la urgencia ya
 * viene marcada como urgente desde la clasificación.
 */
export function redactarRespuestaVecino(input: {
  numeroPublico: string;
  edificioNombre: string;
  categoria: string;
  urgencia: Urgencia;
  emergencia: boolean;
}): string {
  const base = `Hola. Registré tu reclamo en ${input.edificioNombre}. Tu número de seguimiento es ${input.numeroPublico}. Lo clasificamos como ${input.categoria.toLowerCase()} con prioridad ${input.urgencia}. Te avisamos apenas haya novedades.`;

  if (input.emergencia) {
    return `Si es una emergencia en curso, llamá ahora al 911 o al servicio de emergencias que corresponda. ${base}`;
  }
  return base;
}

/**
 * Texto de la orden de trabajo para el proveedor, con el formato de OT-311
 * del export.
 */
export function redactarTextoOrdenTrabajo(input: {
  numeroOT: string;
  proveedor: string;
  titulo: string;
  edificioNombre: string;
  unidadResumen?: string | null;
  urgencia: Urgencia;
  incluyeFoto?: boolean;
  incluyeAudio?: boolean;
  vecinoNombre?: string | null;
  telefonoEnmascarado?: string | null;
}): string {
  const partes: string[] = [];
  partes.push(`${input.numeroOT} · ${input.proveedor}.`);
  partes.push(`${input.titulo}.`);

  const ubicacion = input.unidadResumen
    ? `${input.edificioNombre}, unidad ${input.unidadResumen}.`
    : `${input.edificioNombre}.`;
  partes.push(ubicacion);

  partes.push(`Prioridad ${input.urgencia}.`);

  if (input.incluyeFoto && input.incluyeAudio) {
    partes.push("Incluye foto y audio del reclamo.");
  } else if (input.incluyeFoto) {
    partes.push("Incluye foto del reclamo.");
  } else if (input.incluyeAudio) {
    partes.push("Incluye audio del reclamo.");
  }

  if (input.telefonoEnmascarado) {
    const con = input.vecinoNombre ? ` con ${input.vecinoNombre}` : "";
    partes.push(`Coordinar la visita${con} al ${input.telefonoEnmascarado}.`);
  }

  return partes.join(" ");
}
