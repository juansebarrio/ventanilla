import type { Ambito, Urgencia } from "@/lib/domain/claims";
import { type Categoria } from "./categorias";
import { normalizarResumen } from "./resumen";

/**
 * Clasificador por palabras clave portado del prototipo (design-reference/
 * Landing). Determinístico y sin dependencias externas: se usa cuando no hay
 * ANTHROPIC_API_KEY, cuando la llamada al modelo falla o cuando se superó el
 * cap diario del simulador. La respuesta al vecino es idéntica en ambos
 * caminos.
 */

type Regla = { re: RegExp; categoria: Categoria; urgencia: Urgencia };

// El orden importa: gana la primera coincidencia.
const REGLAS: Regla[] = [
  { re: /ascensor/, categoria: "Ascensor", urgencia: "urgente" },
  {
    re: /cerradura|puerta|llave|portón|porton|reja|entrada/,
    categoria: "Seguridad y accesos",
    urgencia: "alta",
  },
  {
    re: /filtra|humedad|mancha/,
    categoria: "Filtraciones y humedad",
    urgencia: "alta",
  },
  {
    re: /agua|pérdida|perdida|caño|cano|gotea|inunda/,
    categoria: "Plomería y pérdidas",
    urgencia: "alta",
  },
  {
    re: /luz|lámpara|lampara|eléctric|electric|enchufe|palier/,
    categoria: "Electricidad",
    urgencia: "media",
  },
  {
    re: /ruido|fiesta|música|musica|taladro|molest/,
    categoria: "Ruidos y convivencia",
    urgencia: "media",
  },
  {
    re: /limpi|sucio|sucios|basura|vidrio/,
    categoria: "Limpieza",
    urgencia: "baja",
  },
  {
    re: /expensa|comprobante|pago|factura|recibo/,
    categoria: "Administrativo",
    urgencia: "baja",
  },
];

// Palabras que fuerzan urgencia "urgente" y marcan emergencia.
const OVERRIDE_EMERGENCIA = /urgente|peligro|gas|atrapad|incendio|chispa|corto/;

export type ClasificacionBase = {
  categoria: Categoria;
  urgencia: Urgencia;
  ambito: Ambito;
  unidadMencionada: string | null;
  resumen: string;
  emergencia: boolean;
  confianza: number;
};

export function clasificarPorPalabras(texto: string): ClasificacionBase {
  const s = texto.toLowerCase();

  let categoria: Categoria = "Mantenimiento general";
  let urgencia: Urgencia = "media";
  for (const regla of REGLAS) {
    if (regla.re.test(s)) {
      categoria = regla.categoria;
      urgencia = regla.urgencia;
      break;
    }
  }

  const emergencia = OVERRIDE_EMERGENCIA.test(s);
  if (emergencia) urgencia = "urgente";

  return {
    categoria,
    urgencia,
    ambito: "comun",
    unidadMencionada: null,
    resumen: normalizarResumen(texto),
    emergencia,
    confianza: 0.4,
  };
}
