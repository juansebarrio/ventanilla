"use server";

import { type Estado, ESTADO_LABELS } from "@/lib/domain/claims";
import {
  aplicarTransicion,
  emitirOrdenDeTrabajo,
  esTransicionValida,
  SinProveedorError,
} from "@/lib/pipeline";
import { requireMiembro } from "@/lib/data/tenant";
import { resumenUnidad } from "@/lib/domain/format";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import type { Resultado } from "@/lib/panel/tipos";

/*
 * Server actions del panel. Usan el cliente autenticado del miembro (la RLS lo
 * habilita a escribir) y devuelven un resultado tipado en vez de tirar, para
 * mostrar errores en la interfaz. Todas las pantallas actualizan de forma
 * optimista (fiel al prototipo, que nunca recarga); acá solo se persiste.
 */

export async function emitirOrden(
  claimId: string,
): Promise<Resultado<{ numeroOT: string }>> {
  const { supabase, usuariaNombre } = await requireMiembro();
  try {
    const { numeroPublico } = await emitirOrdenDeTrabajo(supabase, claimId, {
      actor: usuariaNombre,
    });
    return { ok: true, numeroOT: numeroPublico };
  } catch (e) {
    return {
      ok: false,
      error:
        e instanceof SinProveedorError ? e.message : "No se pudo emitir la orden.",
    };
  }
}

export async function responder(
  claimId: string,
  texto: string,
): Promise<Resultado> {
  const limpio = texto.trim();
  if (!limpio) return { ok: false, error: "El mensaje está vacío." };

  const { supabase, administrationId } = await requireMiembro();
  const ahora = new Date().toISOString();
  const { error } = await supabase.from("claim_messages").insert({
    administration_id: administrationId,
    claim_id: claimId,
    direccion: "salida",
    tipo: "texto",
    contenido: limpio,
    created_at: ahora,
  });
  if (error) return { ok: false, error: "No se pudo enviar la respuesta." };

  await supabase.from("claims").update({ ultima_actividad_at: ahora }).eq("id", claimId);
  return { ok: true };
}

async function transicionar(claimId: string, hacia: Estado): Promise<Resultado> {
  const { supabase, administrationId, usuariaNombre } = await requireMiembro();

  const { data: claim } = await supabase
    .from("claims")
    .select("id, estado")
    .eq("id", claimId)
    .maybeSingle();
  if (!claim) return { ok: false, error: "No se encontró el reclamo." };

  const desde = claim.estado as Estado;
  if (!esTransicionValida(desde, hacia)) {
    return {
      ok: false,
      error: `No se puede pasar de ${ESTADO_LABELS[desde]} a ${ESTADO_LABELS[hacia]}.`,
    };
  }

  const transicion = aplicarTransicion(desde, hacia, usuariaNombre);
  const ahora = new Date().toISOString();
  const actualizacion: TablesUpdate<"claims"> = {
    estado: transicion.estado,
    ultima_actividad_at: ahora,
  };
  if (transicion.timestampColumna) {
    (actualizacion as Record<string, string>)[transicion.timestampColumna] = ahora;
  }

  const { error } = await supabase.from("claims").update(actualizacion).eq("id", claim.id);
  if (error) return { ok: false, error: "No se pudo cambiar el estado." };

  await supabase.from("claim_events").insert({
    administration_id: administrationId,
    claim_id: claim.id,
    tipo: transicion.evento.tipo,
    texto: transicion.evento.texto,
    actor: transicion.evento.actor,
    created_at: ahora,
  });
  return { ok: true };
}

export async function marcarResuelto(claimId: string): Promise<Resultado> {
  return transicionar(claimId, "resuelto");
}

export async function cambiarEstado(
  claimId: string,
  hacia: Estado,
): Promise<Resultado> {
  return transicionar(claimId, hacia);
}

export async function derivar(claimId: string): Promise<Resultado> {
  return transicionar(claimId, "derivado");
}

export async function reasignarUnidad(
  claimId: string,
  unitId: string,
): Promise<Resultado> {
  const { supabase, administrationId, usuariaNombre } = await requireMiembro();

  const { data: unidad } = await supabase
    .from("units")
    .select("id, piso, letra, building_id")
    .eq("id", unitId)
    .maybeSingle();
  if (!unidad) return { ok: false, error: "No se encontró la unidad." };

  const ahora = new Date().toISOString();
  const actualizacion: TablesUpdate<"claims"> = {
    unit_id: unidad.id,
    building_id: unidad.building_id,
    ultima_actividad_at: ahora,
  };
  const { error } = await supabase.from("claims").update(actualizacion).eq("id", claimId);
  if (error) return { ok: false, error: "No se pudo reasignar la unidad." };

  await supabase.from("claim_events").insert({
    administration_id: administrationId,
    claim_id: claimId,
    tipo: "nota",
    texto: `Reclamo reasignado a ${resumenUnidad(unidad.piso, unidad.letra)}`,
    actor: usuariaNombre,
    created_at: ahora,
  });
  return { ok: true };
}
