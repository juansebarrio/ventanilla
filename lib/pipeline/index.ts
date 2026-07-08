/**
 * Pipeline core de Ventanilla: clasificación, redacción, máquina de estados y
 * órdenes de trabajo. Transporte-agnóstico — lo usan el simulador, el panel y
 * el webhook de WhatsApp.
 */

export {
  CATEGORIAS,
  RUBRO_POR_CATEGORIA,
  esCategoria,
  type Categoria,
} from "./categorias";
export {
  clasificar,
  ClasificacionSchema,
  type Clasificacion,
  type ContextoClasificacion,
} from "./clasificar";
export {
  clasificarPorPalabras,
  type ClasificacionBase,
} from "./fallback";
export { normalizarResumen } from "./resumen";
export {
  aplicarTransicion,
  esTransicionValida,
  TRANSICIONES,
  TransicionInvalidaError,
  type ResultadoTransicion,
} from "./estados";
export {
  emitirOrdenDeTrabajo,
  SinProveedorError,
  type OrdenEmitida,
} from "./ordenes";
export {
  registrarReclamo,
  type EntradaReclamo,
  type ReclamoRegistrado,
} from "./registrar";
export {
  redactarRespuestaVecino,
  redactarTextoOrdenTrabajo,
} from "@/lib/mensajes";
