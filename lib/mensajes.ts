import type { Urgencia } from "@/lib/domain/claims";

/**
 * Plantillas centralizadas de los mensajes salientes. Las usa el pipeline
 * (simulador y webhook de WhatsApp), así el texto es idéntico sin importar
 * el canal. Copy exacto de design-reference; sin exclamaciones.
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

/*
 * Plantillas del alta conversacional por WhatsApp (tanda 6). Un número que
 * escribe y no está registrado pasa por edificio → unidad → nombre y recién
 * después se registra su reclamo.
 */

export function mensajeBienvenida(edificios: { direccion: string }[]): string {
  const opciones = edificios
    .map((e, i) => `${i + 1} para ${e.direccion}`)
    .join(", ");
  return `Hola. Soy Ventanilla, la mesa de reclamos de Administración Iribarne. Para registrar tu reclamo primero necesito ubicarte. ¿En qué edificio vivís? Respondé ${opciones}.`;
}

export function mensajeEdificioInvalido(
  edificios: { direccion: string }[],
): string {
  const opciones = edificios
    .map((e, i) => `${i + 1} para ${e.direccion}`)
    .join(", ");
  return `No reconocí ese edificio. Respondé ${opciones}.`;
}

export function mensajePedirUnidad(edificio: string): string {
  return `Perfecto, ${edificio}. ¿Cuál es tu unidad? Por ejemplo 5B, o PB si es planta baja.`;
}

export function mensajeUnidadInvalida(): string {
  return "No encontré esa unidad. Escribila como piso y letra, por ejemplo 5B o 2A.";
}

export function mensajePedirNombre(): string {
  return "¿Tu nombre y apellido?";
}

export function mensajeAltaCompleta(input: {
  nombre: string;
  edificio: string;
  unidad: string;
  teniaReclamoPendiente: boolean;
}): string {
  const base = `Listo, ${input.nombre}. Quedaste como vecino de ${input.edificio}, unidad ${input.unidad}.`;
  return input.teniaReclamoPendiente
    ? `${base} Ya registro tu reclamo.`
    : `${base} Contame qué pasó y lo registro con número de seguimiento.`;
}

export function mensajeAudioSinTranscripcion(): string {
  return "Recibí tu audio pero no pude escucharlo bien. ¿Me contás qué pasó por texto?";
}

export function mensajeFotoSuelta(): string {
  return "Recibí la foto. Contame en un mensaje qué pasó así lo registro con número de seguimiento.";
}

export function mensajeFotoAgregada(numeroPublico: string): string {
  return `Sumé la foto a tu reclamo ${numeroPublico}.`;
}

export function mensajeTipoNoSoportado(): string {
  return "Por ahora puedo recibir texto, audios y fotos. Contame qué pasó y lo registro.";
}

export function mensajeOnboardingSoloTexto(): string {
  return "Para terminar el registro necesito que me respondas por texto.";
}
