import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { redactarRespuestaVecino } from "@/lib/mensajes";
import type { Database } from "@/lib/supabase/database.types";
import { clasificar } from "./clasificar";

type Cliente = SupabaseClient<Database>;

/*
 * Registro de un reclamo entrante, transporte-agnóstico: lo usan el
 * simulador de la landing y el webhook de WhatsApp con el mismo recorrido
 * que el prototipo — clasificar, crear el reclamo con numeración
 * correlativa, guardar entrada y confirmación, y dejar los eventos de
 * alta y clasificación con primera_respuesta_at real.
 */

export type EntradaReclamo = {
  administrationId: string;
  edificio: { id: string; direccion: string };
  unitId?: string | null;
  residentId?: string | null;
  origen: "simulador" | "whatsapp";
  /** Texto del vecino (o la transcripción, si la entrada es un audio). */
  texto: string;
  tipoEntrada: "texto" | "audio";
  /** Solo audio: transcripción a mostrar en el timeline. */
  transcripcion?: string | null;
  wamid?: string | null;
  preferirFallback?: boolean;
  /**
   * Solo media: sube el archivo a Storage una vez conocido el id del
   * reclamo (el path es <admin>/<claim>/<archivo>) y devuelve ese path.
   */
  subirMedia?: (claimId: string) => Promise<string | null>;
};

export type ReclamoRegistrado = {
  claimId: string;
  numero: string;
  resumen: string;
  categoria: string;
  urgencia: string;
  ambito: string;
  emergencia: boolean;
  mensaje: string;
};

export async function registrarReclamo(
  supabase: Cliente,
  entrada: EntradaReclamo,
): Promise<ReclamoRegistrado> {
  const clasificacion = await clasificar(entrada.texto, {
    edificioNombre: entrada.edificio.direccion,
    preferirFallback: entrada.preferirFallback,
  });

  const { data: categoria } = await supabase
    .from("categories")
    .select("id, nombre")
    .eq("administration_id", entrada.administrationId)
    .eq("nombre", clasificacion.categoria)
    .maybeSingle();

  const creado = new Date();
  const { data: claim, error: errorClaim } = await supabase
    .from("claims")
    .insert({
      administration_id: entrada.administrationId,
      titulo: clasificacion.resumen,
      categoria_id: categoria?.id ?? null,
      urgencia: clasificacion.urgencia,
      ambito: clasificacion.ambito,
      estado: "recibido",
      building_id: entrada.edificio.id,
      unit_id: entrada.unitId ?? null,
      resident_id: entrada.residentId ?? null,
      origen: entrada.origen,
      created_at: creado.toISOString(),
      ultima_actividad_at: creado.toISOString(),
    })
    .select("id, numero_publico")
    .single();
  if (errorClaim || !claim) throw errorClaim ?? new Error("Insert de claim falló");

  const mediaPath = entrada.subirMedia ? await entrada.subirMedia(claim.id) : null;

  const mensaje = redactarRespuestaVecino({
    numeroPublico: claim.numero_publico,
    edificioNombre: entrada.edificio.direccion,
    categoria: clasificacion.categoria,
    urgencia: clasificacion.urgencia,
    emergencia: clasificacion.emergencia,
  });

  const respondido = new Date();
  const ambitoLabel = clasificacion.ambito === "comun" ? "común" : "privado";
  const urgenciaLabel =
    clasificacion.urgencia.charAt(0).toUpperCase() + clasificacion.urgencia.slice(1);

  await Promise.all([
    supabase.from("claim_messages").insert([
      {
        administration_id: entrada.administrationId,
        claim_id: claim.id,
        direccion: "entrada",
        tipo: entrada.tipoEntrada,
        contenido: entrada.tipoEntrada === "texto" ? entrada.texto : null,
        transcripcion: entrada.transcripcion ?? null,
        media_path: mediaPath,
        wa_message_id: entrada.wamid ?? null,
        created_at: creado.toISOString(),
      },
      {
        administration_id: entrada.administrationId,
        claim_id: claim.id,
        direccion: "salida",
        tipo: "texto",
        contenido: mensaje,
        created_at: respondido.toISOString(),
      },
    ]),
    supabase.from("claim_events").insert([
      {
        administration_id: entrada.administrationId,
        claim_id: claim.id,
        tipo: "alta",
        texto: "Nuevo reclamo",
        actor: "Sistema",
        created_at: creado.toISOString(),
      },
      {
        administration_id: entrada.administrationId,
        claim_id: claim.id,
        tipo: "clasificacion",
        texto: `Clasificado: ${clasificacion.categoria} · ${urgenciaLabel} · Ámbito ${ambitoLabel}`,
        actor: "Sistema",
        created_at: new Date(creado.getTime() + 1000).toISOString(),
      },
    ]),
    supabase
      .from("claims")
      .update({
        primera_respuesta_at: respondido.toISOString(),
        ultima_actividad_at: respondido.toISOString(),
      })
      .eq("id", claim.id),
  ]);

  return {
    claimId: claim.id,
    numero: claim.numero_publico,
    resumen: clasificacion.resumen,
    categoria: clasificacion.categoria,
    urgencia: clasificacion.urgencia,
    ambito: clasificacion.ambito,
    emergencia: clasificacion.emergencia,
    mensaje,
  };
}
