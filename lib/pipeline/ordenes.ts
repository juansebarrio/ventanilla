import type { SupabaseClient } from "@supabase/supabase-js";
import type { Urgencia } from "@/lib/domain/claims";
import { maskPhone } from "@/lib/domain/format";
import { redactarTextoOrdenTrabajo } from "@/lib/mensajes";
import type { Database, TablesUpdate } from "@/lib/supabase/database.types";
import { esCategoria, RUBRO_POR_CATEGORIA } from "./categorias";
import { aplicarTransicion } from "./estados";

/**
 * Emite la orden de trabajo de un reclamo: elige el proveedor por rubro y
 * edificio, numera la OT (secuencia por administración), redacta el texto con
 * el formato del export, la guarda y registra el evento. Si el reclamo estaba
 * en "recibido", lo pasa a "en gestión". Recibe el cliente Supabase, así es
 * agnóstica del transporte que la invoca (panel, simulador, webhook).
 */

export class SinProveedorError extends Error {
  constructor(mensaje: string) {
    super(mensaje);
    this.name = "SinProveedorError";
  }
}

export type OrdenEmitida = {
  numeroPublico: string;
  proveedorNombre: string;
  textoEnviado: string;
};

export async function emitirOrdenDeTrabajo(
  supabase: SupabaseClient<Database>,
  claimId: string,
  opciones: { actor?: string } = {},
): Promise<OrdenEmitida> {
  const actor = opciones.actor ?? "Sistema";

  const { data: claim, error: errorClaim } = await supabase
    .from("claims")
    .select("*")
    .eq("id", claimId)
    .single();
  if (errorClaim || !claim) {
    throw new Error(`No se encontró el reclamo ${claimId}`);
  }

  const nombreCategoria = await nombreDeCategoria(supabase, claim.categoria_id);
  const rubro =
    nombreCategoria && esCategoria(nombreCategoria)
      ? RUBRO_POR_CATEGORIA[nombreCategoria]
      : null;
  if (!rubro) {
    throw new SinProveedorError(
      `La categoría "${nombreCategoria ?? "sin categoría"}" no tiene proveedor de rubro para emitir una orden.`,
    );
  }

  const proveedor = await proveedorPorRubroYEdificio(
    supabase,
    claim.administration_id,
    rubro,
    claim.building_id,
  );
  if (!proveedor) {
    throw new SinProveedorError(
      `No hay un proveedor de rubro "${rubro}" que atienda el edificio del reclamo.`,
    );
  }

  const edificio = await direccionEdificio(supabase, claim.building_id);
  const unidad = await resumenUnidad(supabase, claim.unit_id);
  const vecino = await datosVecino(supabase, claim.resident_id);
  const media = await mediaDelReclamo(supabase, claim.id);

  // La OT se numera con el trigger (numero_publico en NULL). Primero
  // insertamos con un texto provisorio y luego lo completamos con el número
  // real, ya que el texto lo incluye.
  const { data: creada, error: errorInsert } = await supabase
    .from("work_orders")
    .insert({
      administration_id: claim.administration_id,
      claim_id: claim.id,
      provider_id: proveedor.id,
      texto_enviado: "",
      estado: "enviada",
    })
    .select("id, numero_publico")
    .single();
  if (errorInsert || !creada) {
    throw new Error(`No se pudo crear la orden de trabajo: ${errorInsert?.message}`);
  }

  const textoEnviado = redactarTextoOrdenTrabajo({
    numeroOT: creada.numero_publico,
    proveedor: proveedor.nombre,
    titulo: claim.titulo,
    edificioNombre: edificio,
    unidadResumen: unidad,
    urgencia: claim.urgencia as Urgencia,
    incluyeFoto: media.foto,
    incluyeAudio: media.audio,
    vecinoNombre: vecino?.nombre ?? null,
    telefonoEnmascarado: vecino ? maskPhone(vecino.telefono) : null,
  });

  // Completar el texto ahora que conocemos el número. Si falla, la OT sin
  // texto no debe quedar: se borra y se propaga el error (fase 1: mover todo
  // esto a una función SQL transaccional).
  const { error: errorTexto } = await supabase
    .from("work_orders")
    .update({ texto_enviado: textoEnviado })
    .eq("id", creada.id);
  if (errorTexto) {
    await supabase.from("work_orders").delete().eq("id", creada.id);
    throw new Error(
      `No se pudo guardar el texto de la orden de trabajo: ${errorTexto.message}`,
    );
  }

  const ahora = new Date().toISOString();
  const { error: errorEvento } = await supabase.from("claim_events").insert({
    administration_id: claim.administration_id,
    claim_id: claim.id,
    tipo: "ot_creada",
    texto: `${creada.numero_publico} enviada a ${proveedor.nombre}`,
    actor,
    created_at: ahora,
  });
  if (errorEvento) {
    throw new Error(
      `${creada.numero_publico} se creó pero no se registró su evento: ${errorEvento.message}`,
    );
  }

  // Si el reclamo seguía en "recibido", la emisión lo pone en gestión.
  const actualizacion: TablesUpdate<"claims"> = { ultima_actividad_at: ahora };
  if (claim.estado === "recibido") {
    const transicion = aplicarTransicion("recibido", "en_gestion", actor);
    actualizacion.estado = transicion.estado;
    if (transicion.timestampColumna) {
      (actualizacion as Record<string, string>)[transicion.timestampColumna] = ahora;
    }
  }
  const { error: errorClaimUpdate } = await supabase
    .from("claims")
    .update(actualizacion)
    .eq("id", claim.id);
  if (errorClaimUpdate) {
    throw new Error(
      `${creada.numero_publico} se creó pero no se actualizó el reclamo: ${errorClaimUpdate.message}`,
    );
  }

  return {
    numeroPublico: creada.numero_publico,
    proveedorNombre: proveedor.nombre,
    textoEnviado,
  };
}

// ── Consultas auxiliares ─────────────────────────────────────────────────────

async function nombreDeCategoria(
  supabase: SupabaseClient<Database>,
  categoriaId: string | null,
): Promise<string | null> {
  if (!categoriaId) return null;
  const { data } = await supabase
    .from("categories")
    .select("nombre")
    .eq("id", categoriaId)
    .single();
  return data?.nombre ?? null;
}

async function proveedorPorRubroYEdificio(
  supabase: SupabaseClient<Database>,
  administrationId: string,
  rubro: string,
  buildingId: string,
): Promise<{ id: string; nombre: string } | null> {
  const { data: vinculos } = await supabase
    .from("provider_buildings")
    .select("provider_id")
    .eq("administration_id", administrationId)
    .eq("building_id", buildingId);
  const ids = (vinculos ?? []).map((v) => v.provider_id);
  if (ids.length === 0) return null;

  const { data } = await supabase
    .from("providers")
    .select("id, nombre")
    .eq("administration_id", administrationId)
    .eq("rubro", rubro)
    .in("id", ids)
    .limit(1);
  return data?.[0] ?? null;
}

async function direccionEdificio(
  supabase: SupabaseClient<Database>,
  buildingId: string,
): Promise<string> {
  const { data } = await supabase
    .from("buildings")
    .select("direccion")
    .eq("id", buildingId)
    .single();
  return data?.direccion ?? "";
}

async function resumenUnidad(
  supabase: SupabaseClient<Database>,
  unitId: string | null,
): Promise<string | null> {
  if (!unitId) return null;
  const { data } = await supabase
    .from("units")
    .select("piso, letra")
    .eq("id", unitId)
    .single();
  if (!data) return null;
  const letra = data.letra ?? "";
  // "PB" no lleva símbolo de grado; los pisos numéricos sí (5°B).
  return data.piso === "PB" ? `PB${letra}` : `${data.piso}°${letra}`;
}

async function datosVecino(
  supabase: SupabaseClient<Database>,
  residentId: string | null,
): Promise<{ nombre: string; telefono: string } | null> {
  if (!residentId) return null;
  const { data } = await supabase
    .from("residents")
    .select("nombre, telefono")
    .eq("id", residentId)
    .single();
  return data ?? null;
}

async function mediaDelReclamo(
  supabase: SupabaseClient<Database>,
  claimId: string,
): Promise<{ foto: boolean; audio: boolean }> {
  const { data } = await supabase
    .from("claim_messages")
    .select("tipo")
    .eq("claim_id", claimId)
    .in("tipo", ["foto", "audio"]);
  const tipos = new Set((data ?? []).map((m) => m.tipo));
  return { foto: tipos.has("foto"), audio: tipos.has("audio") };
}
