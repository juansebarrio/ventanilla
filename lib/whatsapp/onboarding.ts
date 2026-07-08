import {
  mensajeAltaCompleta,
  mensajeBienvenida,
  mensajeEdificioInvalido,
  mensajePedirNombre,
  mensajePedirUnidad,
  mensajeUnidadInvalida,
} from "@/lib/mensajes";
import { resumenUnidad } from "@/lib/domain/format";

/*
 * Alta conversacional de vecinos por WhatsApp: edificio → unidad → nombre.
 * Máquina de estados pura (sin Supabase ni red) para poder testearla; el
 * webhook persiste la sesión en wa_sessions y ejecuta las acciones.
 */

export type PasoOnboarding = "edificio" | "unidad" | "nombre";

export type EdificioRef = { id: string; direccion: string; alias: string };
export type UnidadRef = {
  id: string;
  piso: string;
  letra: string | null;
  building_id: string;
};

export type DatosOnboarding = {
  building_id?: string;
  unit_id?: string;
  texto_inicial?: string;
};

export type SesionOnboarding = {
  paso: PasoOnboarding;
  datos: DatosOnboarding;
};

export type ResultadoOnboarding =
  | { tipo: "responder"; mensaje: string; sesion: SesionOnboarding }
  | {
      tipo: "completar";
      mensaje: string;
      nombre: string;
      unitId: string;
      buildingId: string;
      textoInicial: string | null;
    };

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Interpreta la elección de edificio: por número de opción o por nombre. */
export function elegirEdificio(
  texto: string,
  edificios: EdificioRef[],
): EdificioRef | null {
  const limpio = normalizar(texto);

  const indice = Number.parseInt(limpio, 10);
  if (Number.isInteger(indice) && indice >= 1 && indice <= edificios.length) {
    return edificios[indice - 1] ?? null;
  }

  for (const edificio of edificios) {
    const direccion = normalizar(edificio.direccion);
    const alias = normalizar(edificio.alias);
    if (limpio.includes(alias) || direccion.includes(limpio) || limpio.includes(direccion)) {
      return edificio;
    }
  }
  return null;
}

/** Interpreta "5B", "5°B", "5 b", "pb", "planta baja" como piso + letra. */
export function parsearUnidad(
  texto: string,
): { piso: string; letra: string | null } | null {
  const limpio = normalizar(texto).replace(/°/g, "");
  if (limpio === "pb" || limpio === "planta baja") {
    return { piso: "PB", letra: null };
  }
  const conLetra = limpio.match(/^(?:pb|planta baja)\s*([a-z])$/);
  if (conLetra?.[1]) {
    return { piso: "PB", letra: conLetra[1].toUpperCase() };
  }
  const numerica = limpio.match(/^(\d{1,2})\s*([a-z])?$/);
  if (numerica?.[1]) {
    return {
      piso: String(Number.parseInt(numerica[1], 10)),
      letra: numerica[2] ? numerica[2].toUpperCase() : null,
    };
  }
  return null;
}

function buscarUnidad(
  texto: string,
  buildingId: string,
  unidades: UnidadRef[],
): UnidadRef | null {
  const pedida = parsearUnidad(texto);
  if (!pedida) return null;
  return (
    unidades.find(
      (u) =>
        u.building_id === buildingId &&
        u.piso.toUpperCase() === pedida.piso.toUpperCase() &&
        (u.letra ?? "").toUpperCase() === (pedida.letra ?? "").toUpperCase(),
    ) ?? null
  );
}

/** Primer contacto de un número desconocido: arranca la sesión. */
export function iniciarOnboarding(
  edificios: EdificioRef[],
  textoInicial: string | null,
): { mensaje: string; sesion: SesionOnboarding } {
  return {
    mensaje: mensajeBienvenida(edificios),
    sesion: {
      paso: "edificio",
      datos: textoInicial ? { texto_inicial: textoInicial } : {},
    },
  };
}

/** Procesa la respuesta del vecino según el paso en el que está. */
export function avanzarOnboarding(
  sesion: SesionOnboarding,
  texto: string,
  contexto: { edificios: EdificioRef[]; unidades: UnidadRef[] },
): ResultadoOnboarding {
  if (sesion.paso === "edificio") {
    const edificio = elegirEdificio(texto, contexto.edificios);
    if (!edificio) {
      return {
        tipo: "responder",
        mensaje: mensajeEdificioInvalido(contexto.edificios),
        sesion,
      };
    }
    return {
      tipo: "responder",
      mensaje: mensajePedirUnidad(edificio.direccion),
      sesion: {
        paso: "unidad",
        datos: { ...sesion.datos, building_id: edificio.id },
      },
    };
  }

  if (sesion.paso === "unidad") {
    const buildingId = sesion.datos.building_id;
    if (!buildingId) {
      // Sesión inconsistente: se reinicia desde el edificio.
      return {
        tipo: "responder",
        mensaje: mensajeBienvenida(contexto.edificios),
        sesion: { paso: "edificio", datos: sesion.datos },
      };
    }
    const unidad = buscarUnidad(texto, buildingId, contexto.unidades);
    if (!unidad) {
      return { tipo: "responder", mensaje: mensajeUnidadInvalida(), sesion };
    }
    return {
      tipo: "responder",
      mensaje: mensajePedirNombre(),
      sesion: {
        paso: "nombre",
        datos: { ...sesion.datos, unit_id: unidad.id },
      },
    };
  }

  // paso === "nombre"
  const nombre = texto.trim().replace(/\s+/g, " ");
  if (nombre.length < 3 || nombre.length > 80) {
    return { tipo: "responder", mensaje: mensajePedirNombre(), sesion };
  }
  const unitId = sesion.datos.unit_id;
  const buildingId = sesion.datos.building_id;
  if (!unitId || !buildingId) {
    return {
      tipo: "responder",
      mensaje: mensajeBienvenida(contexto.edificios),
      sesion: { paso: "edificio", datos: { texto_inicial: sesion.datos.texto_inicial } },
    };
  }
  const unidad = contexto.unidades.find((u) => u.id === unitId);
  const edificio = contexto.edificios.find((e) => e.id === buildingId);
  return {
    tipo: "completar",
    nombre,
    unitId,
    buildingId,
    textoInicial: sesion.datos.texto_inicial ?? null,
    mensaje: mensajeAltaCompleta({
      nombre,
      edificio: edificio?.direccion ?? "",
      unidad: unidad ? resumenUnidad(unidad.piso, unidad.letra) : "",
      teniaReclamoPendiente: Boolean(sesion.datos.texto_inicial),
    }),
  };
}
