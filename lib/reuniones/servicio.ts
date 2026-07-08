import type {
  Acta,
  AsambleaHoyVM,
  Confirmacion,
  DatosReuniones,
} from "./tipos";

/*
 * Servicio del módulo Reuniones, mockeado con los datos ficticios del caso
 * de estudio (los del handoff, literales). Las firmas están pensadas para
 * reemplazar el cuerpo por llamadas reales sin tocar la interfaz:
 * la convocatoria avisa por WhatsApp, las confirmaciones entran por el
 * webhook y el acta se genera al cierre desde la grabación y las
 * votaciones registradas.
 */

const DATOS: DatosReuniones = {
  asamblea: {
    id: "asamblea-2026-07-16",
    tipo: "ordinaria",
    edificio: "Yerbal 1240",
    dia: "16",
    mes: "JUL",
    fechaLarga: "jueves 16 de julio",
    diaSemana: "Jueves",
    hora: "19:00",
    segundaConvocatoria: "19:30",
    linkVirtual: "reunion.ventanilla.ar/yerbal-1240",
    lugarPresencial: {
      titulo: "SUM · planta baja",
      direccion: "Yerbal 1240, CABA",
      nota: "El libro de asistencia se firma al entrar.",
    },
    ordenDelDia: [
      "Rendición de cuentas del primer semestre.",
      "Renovación del contrato de limpieza.",
      "Uso de espacios comunes: mascotas y horarios.",
    ],
    convocatoriaNota:
      "Convocatoria enviada el 1 de julio por WhatsApp a las 24 unidades.",
    totalUnidades: 24,
    quorumMinimo: 13,
    estado: "convocada",
  },
  confirmaciones: [
    { uf: "UF 11", nombre: "Marta Gorosito", unidad: "5°B", modo: "virtual", hora: "hace 2 h" },
    { uf: "UF 04", nombre: "Roberto Etcheverry", unidad: "2°A", modo: "presencial", hora: "hace 3 h" },
    { uf: "UF 15", nombre: "Diego Lamas", unidad: "7°B", modo: "virtual", hora: "ayer" },
    { uf: "UF 09", nombre: "Silvia Paredes", unidad: "4°C", modo: "presencial", hora: "ayer" },
    { uf: "UF 02", nombre: "Nélida Ferrero", unidad: "1°C", modo: "presencial", hora: "ayer" },
    { uf: "UF 21", nombre: "Andrés Bruzzone", unidad: "8°A", modo: "virtual", hora: "lunes" },
    { uf: "UF 07", nombre: "Graciela Ponte", unidad: "3°B", modo: "presencial", hora: "lunes" },
    { uf: "UF 18", nombre: "Federico Sain", unidad: "6°B", modo: "virtual", hora: "lunes" },
  ],
  confirmadasTotal: 14,
  acta: {
    id: "acta-47",
    titulo: "Acta N° 47 · Asamblea extraordinaria",
    membrete: "Consorcio Yerbal 1240 · Ciudad Autónoma de Buenos Aires",
    fechaLinea: "2 de julio de 2026 · 19:04 a 20:38 · SUM y virtual",
    apertura: [
      "En la Ciudad Autónoma de Buenos Aires, a los 2 días del mes de julio de 2026, siendo las 19:04, se reúnen en asamblea extraordinaria los propietarios del edificio de la calle Yerbal 1240, en el salón de usos múltiples de planta baja y por videollamada, convocados por Administración Iribarne.",
      "Preside la asamblea la Sra. Marta Gorosito (5°B). Actúa como secretario de actas el Sr. Roberto Etcheverry (2°A). Con 16 unidades funcionales presentes sobre 24 —10 en el salón y 6 conectadas— se declara válida la sesión en primera convocatoria.",
    ],
    resoluciones: [
      {
        titulo: "Impermeabilización de la terraza y filtraciones asociadas.",
        parrafo: [
          { texto: "Presentados tres presupuestos, se aprueba el de Techados Camet por " },
          { texto: "$ 4.850.000", estilo: "mono" },
          {
            texto:
              ", pagadero en tres cuotas por expensas extraordinarias. La obra comienza la semana del 20 de julio.",
          },
        ],
        votos: { favor: 12, contra: 3, abstenciones: 1 },
      },
      {
        titulo: "Actualización del fondo de reserva.",
        parrafo: [
          {
            texto:
              "Se aprueba llevar el fondo de reserva del 5 al 8 por ciento del presupuesto mensual, a partir de la liquidación de agosto.",
          },
        ],
        votos: { favor: 14, contra: 2, abstenciones: 0 },
      },
      {
        titulo: "Varios.",
        parrafo: [
          {
            texto:
              "El 3°A solicita la reparación de la puerta del ascensor de su piso. Queda registrado como reclamo ",
          },
          { texto: "R-1032", estilo: "ticket" },
          {
            texto:
              ". Sin más temas que tratar, siendo las 20:38 se levanta la sesión.",
          },
        ],
        votos: null,
      },
    ],
    firmas: [
      { nombre: "Marta Gorosito", rol: "Presidenta de asamblea" },
      { nombre: "Roberto Etcheverry", rol: "Secretario de actas" },
      { nombre: "Carla Méndez", rol: "Administración Iribarne" },
    ],
    estado: "borrador",
    asambleaLabel: "Extraordinaria · 2 de julio",
    generadaEl: "2 jul 21:03",
    origen: "Grabación de la asamblea y votaciones registradas",
    asistencia: { presentes: 16, total: 24 },
  },
};

/** La confirmación que entra "en vivo" cuando la simulación está activa. */
const CONFIRMACION_SIMULADA: Confirmacion = {
  uf: "UF 12",
  nombre: "Estela Quiroga",
  unidad: "5°A",
  modo: "virtual",
  hora: "recién",
};

export function obtenerReuniones(): DatosReuniones {
  return DATOS;
}

export function obtenerAsambleaHoy(): AsambleaHoyVM {
  const a = DATOS.asamblea;
  return {
    dia: a.dia,
    mes: a.mes,
    titulo: `Asamblea ${a.tipo} · ${a.edificio}`,
    diaSemana: a.diaSemana,
    hora: a.hora,
    lugar: "SUM y virtual",
    confirmadas: DATOS.confirmadasTotal,
    total: a.totalUnidades,
  };
}

/**
 * Entrada de confirmaciones por WhatsApp. En el producto real esto se
 * suscribe al canal del webhook; el mock emite una confirmación a los
 * 3 segundos cuando la simulación está activa (la usa la styleguide).
 */
export function suscribirConfirmaciones(
  onConfirmacion: (confirmacion: Confirmacion) => void,
  opciones?: { simular?: boolean },
): () => void {
  if (!opciones?.simular) return () => {};
  const timer = setTimeout(() => onConfirmacion(CONFIRMACION_SIMULADA), 3000);
  return () => clearTimeout(timer);
}

/** Envía el acta a los vecinos por WhatsApp. Mock: siempre sale bien. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function enviarActa(actaId: string): Promise<{ ok: true }> {
  return { ok: true };
}

/** Convoca una asamblea nueva. Pendiente de backend (botón decorativo). */
export async function convocarAsamblea(): Promise<{ ok: true }> {
  return { ok: true };
}

/** El acta en texto plano, para copiar al portapapeles. */
export function textoPlanoActa(acta: Acta): string {
  const resoluciones = acta.resoluciones.map((r, i) => {
    const cuerpo = r.parrafo.map((s) => s.texto).join("");
    const votos = r.votos ? ` ${textoVotos(r.votos)}.` : "";
    return `${i + 1}. ${r.titulo} ${cuerpo}${votos}`;
  });
  return [
    acta.titulo.toUpperCase(),
    acta.membrete,
    acta.fechaLinea,
    "",
    ...acta.apertura,
    "",
    "ORDEN DEL DÍA Y RESOLUCIONES",
    ...resoluciones,
    "",
    ...acta.firmas.map((f) => `${f.nombre} · ${f.rol}`),
  ].join("\n");
}

export function textoVotos(votos: {
  favor: number;
  contra: number;
  abstenciones: number;
}): string {
  const partes = [`${votos.favor} a favor`, `${votos.contra} en contra`];
  if (votos.abstenciones > 0) {
    partes.push(
      `${votos.abstenciones} ${votos.abstenciones === 1 ? "abstención" : "abstenciones"}`,
    );
  }
  return partes.join(" · ");
}
