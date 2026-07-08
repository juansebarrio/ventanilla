import type {
  AccionesDetalle,
  AccionesHoy,
  AjustesVM,
  DetalleVM,
  EdificioVM,
  HoyVM,
  ProveedorVM,
  ReclamosVM,
} from "@/lib/panel/tipos";

/*
 * Fixtures derivadas del seed (supabase/seed/seed.sql), para renderizar las
 * pantallas del panel en /styleguide/panel/* sin Supabase y comparar contra
 * design-reference. Mismos view-models que consumen las pantallas reales; las
 * cadenas relativas están fijadas para que el screenshot sea estable.
 */

export const hoyFixture: HoyVM = {
  fecha: "Martes 7 de julio",
  kpis: {
    abiertos: 7,
    urgentes: 1,
    esperanAccion: 3,
    primeraRespuesta: "38 s",
    resolucionPromedio: "2,1 días",
  },
  esperan: [
    {
      claimId: "c-1047",
      numero: "R-1047",
      titulo: "Ascensor parado entre pisos, sin personas adentro",
      edificio: "Yerbal 1240",
      urgencia: "urgente",
      hace: "hace 4 min",
      conProveedor: true,
      href: "/panel/reclamos/R-1047",
    },
    {
      claimId: "c-1048",
      numero: "R-1048",
      titulo: "Cerradura de la puerta de entrada rota, sin llave",
      edificio: "Yerbal 1240",
      urgencia: "alta",
      hace: "recién",
      conProveedor: true,
      href: "/panel/reclamos/R-1048",
    },
    {
      claimId: "c-1043",
      numero: "R-1043",
      titulo: "Ruidos de taladro después de las 22",
      edificio: "Virrey Loreto 2680",
      urgencia: "media",
      hace: "hace 3 h",
      conProveedor: false,
      href: "/panel/reclamos/R-1043",
    },
  ],
  movimientos: [
    { id: "m1", hora: "15:12", texto: "Vecina confirmó visita del jueves (R-1044)" },
    { id: "m2", hora: "14:33", texto: "OT-311 enviada a Plomería Ávalos (R-1044)" },
    { id: "m3", hora: "14:31", texto: "Carla Méndez aprobó la gestión (R-1044)" },
    { id: "m4", hora: "14:02", texto: "Nuevo reclamo (R-1044)" },
    { id: "m5", hora: "13:47", texto: "Marcado Resuelto · esperando conformidad (R-1042)" },
  ],
  arrearsPorEdificio: [
    {
      edificio: "Yerbal 1240",
      filas: [
        { uf: "UF 09", nombre: "Silvia Paredes", unidadResumen: "4°C", periodos: 3, puntoUrgencia: "urgente", monto: 952800 },
        { uf: "UF 04", nombre: "Roberto Etcheverry", unidadResumen: "2°A", periodos: 2, puntoUrgencia: "alta", monto: 581400 },
        { uf: "UF 15", nombre: "Diego Lamas", unidadResumen: "7°B", periodos: 1, puntoUrgencia: "media", monto: 264700 },
      ],
      totalAdeudado: 1798900,
      conDeuda: 3,
      totalUnidades: 24,
    },
    {
      edificio: "Virrey Loreto 2680",
      filas: [
        { uf: "UF 02", nombre: "Hernán Solari", unidadResumen: "1°B", periodos: 4, puntoUrgencia: "urgente", monto: 1246000 },
        { uf: "UF 11", nombre: "María Inés Bugallo", unidadResumen: "5°A", periodos: 1, puntoUrgencia: "media", monto: 289500 },
      ],
      totalAdeudado: 1535500,
      conDeuda: 2,
      totalUnidades: 18,
    },
  ],
};

export const reclamosFixture: ReclamosVM = {
  filas: [
    { numero: "R-1048", titulo: "Cerradura de la puerta de entrada rota, sin llave", categoria: "Seguridad y accesos", urgencia: "alta", ubicacion: "Yerbal 1240", estado: "recibido", actividad: "recién", href: "/panel/reclamos/R-1048" },
    { numero: "R-1047", titulo: "Ascensor parado entre pisos, sin personas adentro", categoria: "Ascensor", urgencia: "urgente", ubicacion: "Yerbal 1240", estado: "recibido", actividad: "hace 4 min", href: "/panel/reclamos/R-1047", urgente: true },
    { numero: "R-1046", titulo: "Pérdida de agua en cochera del subsuelo", categoria: "Plomería y pérdidas", urgencia: "alta", ubicacion: "Virrey Loreto 2680", estado: "en_gestion", actividad: "hace 22 min", href: "/panel/reclamos/R-1046" },
    { numero: "R-1045", titulo: "Luz quemada en el palier del 3°", categoria: "Electricidad", urgencia: "media", ubicacion: "Yerbal 1240", estado: "asignado", actividad: "hace 1 h", href: "/panel/reclamos/R-1045" },
    { numero: "R-1044", titulo: "Filtración en pared del living, viene de arriba", categoria: "Filtraciones y humedad", urgencia: "alta", ubicacion: "Yerbal 1240 · 5°B", estado: "asignado", actividad: "hace 2 h", href: "/panel/reclamos/R-1044" },
    { numero: "R-1043", titulo: "Ruidos de taladro después de las 22", categoria: "Ruidos y convivencia", urgencia: "media", ubicacion: "Virrey Loreto 2680 · 2°A", estado: "recibido", actividad: "hace 3 h", href: "/panel/reclamos/R-1043" },
    { numero: "R-1042", titulo: "Portón del garage no cierra bien", categoria: "Seguridad y accesos", urgencia: "alta", ubicacion: "Virrey Loreto 2680", estado: "resuelto", actividad: "ayer", href: "/panel/reclamos/R-1042" },
    { numero: "R-1041", titulo: "Vidrios del hall sucios hace dos semanas", categoria: "Limpieza", urgencia: "baja", ubicacion: "Yerbal 1240", estado: "cerrado", actividad: "hace 2 días", href: "/panel/reclamos/R-1041" },
    { numero: "R-1040", titulo: "Consulta por comprobante de expensas", categoria: "Administrativo", urgencia: "baja", ubicacion: "Yerbal 1240 · 1°C", estado: "derivado", actividad: "hace 3 días", href: "/panel/reclamos/R-1040" },
  ],
  visibles: 7,
  total: 46,
  filtrando: false,
};

export const detalleFixture: DetalleVM = {
  claimId: "c-1044",
  numero: "R-1044",
  titulo: "Filtración en pared del living, viene de arriba",
  estado: "asignado",
  urgencia: "alta",
  subtitulo: "Yerbal 1240 · 5°B · Marta Gorosito · ingresó hoy 14:02",
  timeline: [
    {
      clase: "vecino",
      id: "t1",
      hora: "14:02",
      autor: "Marta Gorosito",
      media: {
        kind: "audio",
        duracion: "0:38",
        transcripcion:
          "Hola, buenas. Tengo una mancha de humedad en la pared del living que cada vez está peor, ya se está descascarando la pintura. Yo creo que viene del departamento de arriba. Te mando una foto.",
        signedUrl: null,
      },
    },
    {
      clase: "vecino",
      id: "t2",
      hora: "14:02",
      autor: "Marta Gorosito",
      media: { kind: "foto", nombre: "IMG-20260707-WA0012.jpg", signedUrl: null },
    },
    {
      clase: "evento",
      id: "t3",
      hora: "14:02",
      tipo: "clasificacion",
      texto: "Clasificado: Filtraciones y humedad · Alta · Ámbito común",
    },
    {
      clase: "ventanilla",
      id: "t4",
      hora: "14:03",
      texto:
        "Hola Marta. Registré tu reclamo por filtración en la pared del living de tu unidad (5°B, Yerbal 1240). Tu número de seguimiento es R-1044. Lo derivamos para revisión con prioridad alta. Te avisamos apenas haya novedades.",
    },
    {
      clase: "evento",
      id: "t5",
      hora: "14:31",
      tipo: "aprobacion",
      texto: "Carla Méndez aprobó la gestión",
    },
    {
      clase: "evento",
      id: "t6",
      hora: "14:33",
      tipo: "ot_creada",
      texto: "OT-311 enviada a Plomería Ávalos",
    },
    {
      clase: "ventanilla",
      id: "t7",
      hora: "15:10",
      texto:
        "Novedades de tu reclamo R-1044: el plomero pasa el jueves entre las 10 y las 12 a revisar tu unidad y el 6°B. Avisanos si ese horario no te sirve.",
    },
    {
      clase: "vecino",
      id: "t8",
      hora: "15:12",
      autor: "Marta Gorosito",
      media: { kind: "texto", texto: "Perfecto, ese horario me viene bien." },
    },
  ],
  datos: {
    categoria: "Filtraciones y humedad",
    urgencia: "alta",
    ambito: "Común",
    edificioUnidad: "Yerbal 1240 · 5°B",
    vecina: "Marta Gorosito",
    telefonoEnmascarado: "11 •• ••• 4821",
    ingreso: "7 jul 14:02",
  },
  orden: {
    numero: "OT-311",
    proveedor: "Plomería Ávalos",
    enviadaHora: "14:33",
    visitaConfirmada: "jueves 10 a 12 h",
    textoEnviado:
      "OT-311 · Plomería Ávalos. Filtración en pared del living. Yerbal 1240, unidad 5°B. Posible origen en el 6°B. Prioridad alta. Incluye foto y audio del reclamo. Coordinar visita con la vecina al 11 •• ••• 4821.",
  },
  unidades: [
    { id: "u1", resumen: "5°B" },
    { id: "u2", resumen: "6°B" },
    { id: "u3", resumen: "1°C" },
  ],
};

export const edificiosFixture: EdificioVM[] = [
  { direccion: "Yerbal 1240", alias: "Yerbal", totalUnidades: 24, unidadesConDeuda: 3 },
  { direccion: "Virrey Loreto 2680", alias: "Virrey Loreto", totalUnidades: 18, unidadesConDeuda: 2 },
];

export const proveedoresFixture: ProveedorVM[] = [
  { nombre: "Plomería Ávalos", rubro: "Plomería y filtraciones", contacto: "11 •• ••• 3901", edificios: ["Virrey Loreto 2680", "Yerbal 1240"] },
  { nombre: "Cerrajería Núñez", rubro: "Seguridad y accesos", contacto: "11 •• ••• 4352", edificios: ["Virrey Loreto 2680", "Yerbal 1240"] },
  { nombre: "Ascensores Bianchi", rubro: "Ascensor", contacto: "11 •• ••• 7738", edificios: ["Virrey Loreto 2680", "Yerbal 1240"] },
  { nombre: "ElectroSur", rubro: "Electricidad", contacto: "11 •• ••• 0264", edificios: ["Virrey Loreto 2680", "Yerbal 1240"] },
  { nombre: "Limpieza Del Valle", rubro: "Limpieza", contacto: "11 •• ••• 9185", edificios: ["Virrey Loreto 2680", "Yerbal 1240"] },
];

export const ajustesFixture: AjustesVM = {
  tenantNombre: "Administración Iribarne",
  usuariaNombre: "Carla Méndez",
  email: "carla@iribarne.ar",
  edificios: 2,
  proveedores: 5,
  categorias: [
    "Administrativo",
    "Ascensor",
    "Electricidad",
    "Expensas y pagos",
    "Filtraciones y humedad",
    "Limpieza",
    "Mantenimiento general",
    "Plomería y pérdidas",
    "Ruidos y convivencia",
    "Seguridad y accesos",
  ],
};

// Stubs de acciones para el styleguide: no tocan la base, devuelven éxito.
export const accionesHoyStub: AccionesHoy = {
  emitirOrden: async () => ({ ok: true, numeroOT: "OT-312" }),
};

export const accionesDetalleStub: AccionesDetalle = {
  responder: async () => ({ ok: true }),
  marcarResuelto: async () => ({ ok: true }),
  cambiarEstado: async () => ({ ok: true }),
  derivar: async () => ({ ok: true }),
  reasignarUnidad: async () => ({ ok: true }),
};
