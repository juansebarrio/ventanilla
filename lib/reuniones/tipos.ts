/*
 * Módulo Reuniones (asambleas de consorcio). Modelos según el handoff
 * (design_handoff_reuniones/README.md). Los datos son ficticios y viven
 * detrás del servicio mockeado en lib/reuniones/servicio.ts, listo para
 * conectar al backend real.
 */

export type ModoAsistencia = "virtual" | "presencial";

export type Asamblea = {
  id: string;
  tipo: "ordinaria" | "extraordinaria";
  edificio: string;
  /** Día y mes del tile punteado ("16" / "JUL"). */
  dia: string;
  mes: string;
  /** "jueves 16 de julio" */
  fechaLarga: string;
  /** "Jueves", para el módulo compacto del dashboard. */
  diaSemana: string;
  hora: string;
  segundaConvocatoria: string;
  linkVirtual: string;
  lugarPresencial: { titulo: string; direccion: string; nota: string };
  ordenDelDia: string[];
  /** "Convocatoria enviada el 1 de julio por WhatsApp a las 24 unidades." */
  convocatoriaNota: string;
  totalUnidades: number;
  /** Quórum: mitad más uno (13 de 24). */
  quorumMinimo: number;
  estado: "convocada" | "en_curso" | "cerrada";
};

export type Confirmacion = {
  uf: string;
  nombre: string;
  unidad: string;
  modo: ModoAsistencia;
  /** Tiempo relativo, como lo muestra el panel ("hace 2 h", "ayer", "lunes"). */
  hora: string;
};

/** Fragmento del cuerpo del acta; los montos y tickets van en mono. */
export type SegmentoTexto = {
  texto: string;
  estilo?: "mono" | "ticket";
};

export type Resolucion = {
  titulo: string;
  parrafo: SegmentoTexto[];
  votos: { favor: number; contra: number; abstenciones: number } | null;
};

export type Acta = {
  id: string;
  titulo: string;
  membrete: string;
  fechaLinea: string;
  apertura: string[];
  resoluciones: Resolucion[];
  firmas: { nombre: string; rol: string }[];
  estado: "borrador" | "enviada";
  asambleaLabel: string;
  generadaEl: string;
  origen: string;
  asistencia: { presentes: number; total: number };
};

export type DatosReuniones = {
  asamblea: Asamblea;
  /** Últimas confirmaciones visibles en la card Ingresantes. */
  confirmaciones: Confirmacion[];
  /** Total confirmado (visibles + las que el pie resume como "más"). */
  confirmadasTotal: number;
  acta: Acta;
};

/** Módulo compacto "Próxima asamblea" del dashboard Hoy. */
export type AsambleaHoyVM = {
  dia: string;
  mes: string;
  titulo: string;
  diaSemana: string;
  hora: string;
  lugar: string;
  confirmadas: number;
  total: number;
};
