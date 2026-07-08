import type { Estado, Urgencia } from "@/lib/domain/claims";
import type { FilaReclamo } from "@/components/TablaReclamos";

/*
 * View-models del panel. Puros (sin Supabase): los producen las funciones de
 * lib/data/ y los consumen los componentes presentacionales y las fixtures.
 */

// ── Resultado de las server actions ──────────────────────────────────────────
export type Resultado<T = object> =
  | ({ ok: true } & T)
  | { ok: false; error: string };

// ── Acciones (server actions pasadas como props a los islands) ───────────────
export type AccionesHoy = {
  emitirOrden: (claimId: string) => Promise<Resultado<{ numeroOT: string }>>;
};

export type AccionesDetalle = {
  responder: (claimId: string, texto: string) => Promise<Resultado>;
  marcarResuelto: (claimId: string) => Promise<Resultado>;
  cambiarEstado: (claimId: string, hacia: Estado) => Promise<Resultado>;
  derivar: (claimId: string) => Promise<Resultado>;
  reasignarUnidad: (claimId: string, unitId: string) => Promise<Resultado>;
};

// ── Hoy ──────────────────────────────────────────────────────────────────────
export type KpisHoy = {
  abiertos: number;
  urgentes: number;
  esperanAccion: number;
  primeraRespuesta: string; // "38 s"
  resolucionPromedio: string; // "2,1 días"
};

export type ItemEspera = {
  claimId: string;
  numero: string;
  titulo: string;
  edificio: string;
  urgencia: Urgencia;
  hace: string;
  /** La categoría tiene proveedor de rubro → puede emitir OT; si no, "Revisar". */
  conProveedor: boolean;
  href: string;
};

export type MovimientoFeed = {
  id: string;
  hora: string;
  texto: string;
};

export type FilaArrears = {
  uf: string; // "UF 09"
  nombre: string;
  unidadResumen: string; // "4°C"
  periodos: number;
  puntoUrgencia: Urgencia; // color del punto según períodos
  monto: number;
};

export type ArrearsEdificio = {
  edificio: string; // "Yerbal 1240"
  filas: FilaArrears[];
  totalAdeudado: number;
  conDeuda: number;
  totalUnidades: number;
};

/** Item de "Esperan tu acción" con el estado optimista de emisión de OT. */
export type EsperaConEstado = ItemEspera & { emitida: string | null };

export type HoyVM = {
  fecha: string; // "Martes 7 de julio"
  kpis: KpisHoy;
  esperan: ItemEspera[];
  movimientos: MovimientoFeed[];
  arrearsPorEdificio: ArrearsEdificio[];
};

// ── Reclamos ─────────────────────────────────────────────────────────────────
export type FiltrosReclamos = {
  edificio: string; // "todos" | dirección
  categoria: string; // "todas" | nombre
  estado: string; // "abiertos" | "todos" | Estado
  urgencia: string; // "todas" | Urgencia
  q: string;
};

export type ReclamosVM = {
  filas: FilaReclamo[];
  visibles: number;
  total: number;
  filtrando: boolean;
};

// ── Detalle ──────────────────────────────────────────────────────────────────
export type MediaVecino =
  | { kind: "texto"; texto: string }
  | {
      kind: "audio";
      duracion: string;
      transcripcion: string | null;
      signedUrl: string | null;
    }
  | { kind: "foto"; nombre: string; signedUrl: string | null };

export type ItemTimeline =
  | {
      clase: "vecino";
      id: string;
      hora: string;
      autor: string;
      media: MediaVecino;
    }
  | { clase: "ventanilla"; id: string; hora: string; texto: string }
  // Burbuja optimista de la respuesta manual ("Administración Iribarne"). El
  // dato persistido reaparece como "ventanilla" tras recargar (sin actor).
  | { clase: "administracion"; id: string; hora: string; texto: string }
  | { clase: "evento"; id: string; hora: string; tipo: string; texto: string };

export type DatosClaim = {
  categoria: string;
  urgencia: Urgencia;
  ambito: string; // AMBITO_LABELS
  edificioUnidad: string; // "Yerbal 1240 · 5°B"
  vecina: string | null;
  telefonoEnmascarado: string | null;
  ingreso: string; // "7 jul 14:02"
};

export type OrdenTrabajoVM = {
  numero: string;
  proveedor: string;
  enviadaHora: string;
  visitaConfirmada: string | null;
  textoEnviado: string;
};

export type UnidadOpcion = { id: string; resumen: string };

export type DetalleVM = {
  claimId: string;
  numero: string;
  titulo: string;
  estado: Estado;
  urgencia: Urgencia;
  subtitulo: string; // "Yerbal 1240 · 5°B · Marta Gorosito · ingresó hoy 14:02"
  timeline: ItemTimeline[];
  datos: DatosClaim;
  orden: OrdenTrabajoVM | null;
  unidades: UnidadOpcion[];
};

// ── Lecturas (edificios / proveedores / ajustes) ─────────────────────────────
export type EdificioVM = {
  direccion: string;
  alias: string;
  totalUnidades: number;
  unidadesConDeuda: number;
};

export type ProveedorVM = {
  nombre: string;
  rubro: string;
  contacto: string; // enmascarado
  edificios: string[];
};

export type AjustesVM = {
  tenantNombre: string;
  usuariaNombre: string;
  email: string;
  edificios: number;
  proveedores: number;
  categorias: string[];
};

// Re-export para que los consumidores tengan un solo punto de importación.
export type { FilaReclamo };
