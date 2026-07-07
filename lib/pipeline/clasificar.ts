import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AMBITOS, URGENCIAS } from "@/lib/domain/claims";
import { env } from "@/lib/env";
import { CATEGORIAS } from "./categorias";
import { clasificarPorPalabras, type ClasificacionBase } from "./fallback";
import { normalizarResumen } from "./resumen";

/**
 * Clasificación transporte-agnóstica: no sabe si el texto llegó del
 * simulador, de WhatsApp o de carga manual. Usa Claude cuando hay clave y no
 * se pidió el fallback; si la llamada falla o no hay clave, cae al
 * clasificador por palabras. El resultado tiene la misma forma en ambos
 * caminos.
 */

// Configurable: el brief fija claude-sonnet-4-6 (permite temperatura, a
// diferencia de la familia Fable/Opus 4.8). Cambiar acá si se migra el modelo.
const MODELO = "claude-sonnet-4-6";

/** Esquema estricto de la salida del modelo, validado con Zod. */
export const ClasificacionSchema = z.object({
  categoria: z.enum(CATEGORIAS),
  urgencia: z.enum(URGENCIAS),
  ambito: z.enum(AMBITOS),
  // El modelo puede devolver "" en vez de null para "sin unidad"; lo
  // normalizamos en lugar de descartar una clasificación por lo demás válida.
  unidad_mencionada: z
    .string()
    .nullable()
    .transform((v) => (v && v.length > 0 ? v : null)),
  resumen: z.string().min(1),
  emergencia: z.boolean(),
  confianza: z.number().min(0).max(1),
});

export type Clasificacion = ClasificacionBase & {
  origen: "modelo" | "fallback";
};

export type ContextoClasificacion = {
  edificioNombre: string;
  /** Unidades conocidas del edificio, para ayudar a detectar menciones. */
  unidadesConocidas?: string[];
  /** Fuerza el clasificador por palabras (p. ej. superado el cap diario). */
  preferirFallback?: boolean;
};

const PROMPT_SISTEMA = `Sos el clasificador de una mesa de reclamos de administración de consorcios. Recibís el texto de un reclamo de un vecino y devolvés únicamente un objeto JSON, sin texto adicional ni marcas de código.

Categorías válidas (elegí exactamente una, con esta grafía):
Ascensor, Seguridad y accesos, Plomería y pérdidas, Filtraciones y humedad, Electricidad, Ruidos y convivencia, Limpieza, Administrativo, Expensas y pagos, Mantenimiento general.

Urgencia: "urgente", "alta", "media" o "baja".
Ámbito: "comun" para espacios comunes del edificio, "privado" para el interior de una unidad.

Marcá emergencia = true si hay riesgo para las personas o los bienes (gas, fuego, chispas, corto, alguien atrapado, peligro inminente); en ese caso la urgencia es "urgente".

El resumen es una reformulación breve del reclamo, máximo 88 caracteres, con la primera letra en mayúscula. unidad_mencionada es la unidad que menciona el vecino (por ejemplo "5°B") o null si no menciona ninguna. confianza es un número entre 0 y 1.

Respondé solo con el JSON:
{"categoria": "...", "urgencia": "...", "ambito": "...", "unidad_mencionada": "..." o null, "resumen": "...", "emergencia": false, "confianza": 0.0}`;

function extraerJson(texto: string): string {
  const limpio = texto.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "");
  const inicio = limpio.indexOf("{");
  const fin = limpio.lastIndexOf("}");
  if (inicio === -1 || fin === -1 || fin < inicio) return limpio.trim();
  return limpio.slice(inicio, fin + 1);
}

/** Aplica los invariantes del sistema sobre cualquier clasificación. */
function normalizar(base: ClasificacionBase): ClasificacionBase {
  const emergencia = base.emergencia;
  return {
    ...base,
    urgencia: emergencia ? "urgente" : base.urgencia,
    resumen: normalizarResumen(base.resumen),
  };
}

async function clasificarConModelo(
  texto: string,
  contexto: ContextoClasificacion,
  apiKey: string,
): Promise<ClasificacionBase> {
  const client = new Anthropic({ apiKey });

  const contextoTexto = [
    `Edificio: ${contexto.edificioNombre}.`,
    contexto.unidadesConocidas?.length
      ? `Unidades del edificio: ${contexto.unidadesConocidas.join(", ")}.`
      : null,
    `Reclamo: ${texto}`,
  ]
    .filter(Boolean)
    .join("\n");

  const respuesta = await client.messages.create({
    model: MODELO,
    max_tokens: 1024,
    temperature: 0,
    system: PROMPT_SISTEMA,
    messages: [{ role: "user", content: contextoTexto }],
  });

  const bloque = respuesta.content.find((b) => b.type === "text");
  if (!bloque || bloque.type !== "text") {
    throw new Error("El modelo no devolvió texto");
  }

  const crudo = JSON.parse(extraerJson(bloque.text));
  const datos = ClasificacionSchema.parse(crudo);

  return {
    categoria: datos.categoria,
    urgencia: datos.urgencia,
    ambito: datos.ambito,
    unidadMencionada: datos.unidad_mencionada,
    resumen: datos.resumen,
    emergencia: datos.emergencia,
    confianza: datos.confianza,
  };
}

export async function clasificar(
  texto: string,
  contexto: ContextoClasificacion,
): Promise<Clasificacion> {
  const apiKey = env.anthropicApiKey;

  if (contexto.preferirFallback || !apiKey) {
    return { ...normalizar(clasificarPorPalabras(texto)), origen: "fallback" };
  }

  try {
    const resultado = await clasificarConModelo(texto, contexto, apiKey);
    return { ...normalizar(resultado), origen: "modelo" };
  } catch {
    // Cualquier fallo (red, validación, parseo) degrada al clasificador local.
    return { ...normalizar(clasificarPorPalabras(texto)), origen: "fallback" };
  }
}
