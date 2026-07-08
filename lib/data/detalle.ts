import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Estado, Urgencia } from "@/lib/domain/claims";
import { fechaConHora, horaCorta, maskPhone, resumenUnidad, TZ_AR } from "@/lib/domain/format";
import type { Database } from "@/lib/supabase/database.types";
import type { DetalleVM, ItemTimeline } from "@/lib/panel/tipos";

type Cliente = SupabaseClient<Database>;

const EVENTOS_OCULTOS = ["alta", "visita_confirmada"];
const BUCKET = "claim-media";

function esHoy(iso: string): boolean {
  const fmt = new Intl.DateTimeFormat("es-AR", { timeZone: TZ_AR, dateStyle: "short" });
  return fmt.format(new Date(iso)) === fmt.format(new Date());
}

export async function cargarDetalle(
  supabase: Cliente,
  administrationId: string,
  numero: string,
): Promise<DetalleVM | null> {
  const { data: claim } = await supabase
    .from("claims")
    .select("*")
    .eq("administration_id", administrationId)
    .eq("numero_publico", numero)
    .maybeSingle();
  if (!claim) return null;

  const [buildingRes, categoriaRes, unitRes, residentRes, mensajesRes, eventosRes, otRes, unidadesRes] =
    await Promise.all([
      supabase.from("buildings").select("direccion").eq("id", claim.building_id).maybeSingle(),
      claim.categoria_id
        ? supabase.from("categories").select("nombre").eq("id", claim.categoria_id).maybeSingle()
        : Promise.resolve({ data: null }),
      claim.unit_id
        ? supabase.from("units").select("piso, letra").eq("id", claim.unit_id).maybeSingle()
        : Promise.resolve({ data: null }),
      claim.resident_id
        ? supabase.from("residents").select("nombre, telefono").eq("id", claim.resident_id).maybeSingle()
        : Promise.resolve({ data: null }),
      supabase
        .from("claim_messages")
        .select("id, direccion, tipo, contenido, transcripcion, media_path, created_at")
        .eq("claim_id", claim.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("claim_events")
        .select("id, tipo, texto, created_at")
        .eq("claim_id", claim.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("work_orders")
        .select("numero_publico, provider_id, texto_enviado, visita_confirmada, created_at")
        .eq("claim_id", claim.id)
        .maybeSingle(),
      supabase.from("units").select("id, piso, letra").eq("building_id", claim.building_id),
    ]);

  const edificio = buildingRes.data?.direccion ?? "";
  const categoria = categoriaRes.data?.nombre ?? "";
  const unidad = unitRes.data ? resumenUnidad(unitRes.data.piso, unitRes.data.letra) : "";
  const vecina = residentRes.data?.nombre ?? null;

  // Signed URLs de la media (audio/foto) en paralelo.
  const mensajes = mensajesRes.data ?? [];
  const firmadas = new Map<string, string | null>();
  await Promise.all(
    mensajes
      .filter((m) => m.media_path)
      .map(async (m) => {
        const { data } = await supabase.storage
          .from(BUCKET)
          .createSignedUrl(m.media_path as string, 3600);
        firmadas.set(m.id, data?.signedUrl ?? null);
      }),
  );

  // ── Timeline unificado ───────────────────────────────────────────────────────
  const items: { at: string; item: ItemTimeline }[] = [];

  for (const m of mensajes) {
    const hora = horaCorta(new Date(m.created_at));
    if (m.direccion === "salida") {
      items.push({
        at: m.created_at,
        item: { clase: "ventanilla", id: m.id, hora, texto: m.contenido ?? "" },
      });
    } else if (m.tipo === "audio") {
      items.push({
        at: m.created_at,
        item: {
          clase: "vecino",
          id: m.id,
          hora,
          autor: vecina ?? "Vecino",
          media: {
            kind: "audio",
            duracion: m.contenido ?? "0:00",
            transcripcion: m.transcripcion,
            signedUrl: firmadas.get(m.id) ?? null,
          },
        },
      });
    } else if (m.tipo === "foto") {
      items.push({
        at: m.created_at,
        item: {
          clase: "vecino",
          id: m.id,
          hora,
          autor: vecina ?? "Vecino",
          media: {
            kind: "foto",
            nombre: m.contenido ?? "foto.jpg",
            signedUrl: firmadas.get(m.id) ?? null,
          },
        },
      });
    } else {
      items.push({
        at: m.created_at,
        item: {
          clase: "vecino",
          id: m.id,
          hora,
          autor: vecina ?? "Vecino",
          media: { kind: "texto", texto: m.contenido ?? "" },
        },
      });
    }
  }

  for (const e of eventosRes.data ?? []) {
    if (EVENTOS_OCULTOS.includes(e.tipo)) continue;
    items.push({
      at: e.created_at,
      item: {
        clase: "evento",
        id: e.id,
        hora: horaCorta(new Date(e.created_at)),
        tipo: e.tipo,
        texto: e.texto,
      },
    });
  }

  items.sort((a, b) => a.at.localeCompare(b.at));

  // ── Orden de trabajo ─────────────────────────────────────────────────────────
  let orden: DetalleVM["orden"] = null;
  if (otRes.data) {
    const proveedor = await supabase
      .from("providers")
      .select("nombre")
      .eq("id", otRes.data.provider_id)
      .maybeSingle();
    orden = {
      numero: otRes.data.numero_publico,
      proveedor: proveedor.data?.nombre ?? "",
      enviadaHora: horaCorta(new Date(otRes.data.created_at)),
      visitaConfirmada: otRes.data.visita_confirmada,
      textoEnviado: otRes.data.texto_enviado,
    };
  }

  const edificioUnidad = unidad ? `${edificio} · ${unidad}` : edificio;
  const ingresoTexto = esHoy(claim.created_at)
    ? `ingresó hoy ${horaCorta(new Date(claim.created_at))}`
    : `ingresó ${fechaConHora(new Date(claim.created_at))}`;
  const subtitulo = [edificioUnidad, vecina, ingresoTexto].filter(Boolean).join(" · ");

  return {
    claimId: claim.id,
    numero: claim.numero_publico,
    titulo: claim.titulo,
    estado: claim.estado as Estado,
    urgencia: claim.urgencia as Urgencia,
    subtitulo,
    timeline: items.map((i) => i.item),
    datos: {
      categoria,
      urgencia: claim.urgencia as Urgencia,
      ambito: claim.ambito === "comun" ? "Común" : "Privado",
      edificioUnidad,
      vecina,
      telefonoEnmascarado: residentRes.data ? maskPhone(residentRes.data.telefono) : null,
      ingreso: fechaConHora(new Date(claim.created_at)),
    },
    orden,
    unidades: (unidadesRes.data ?? []).map((u) => ({
      id: u.id,
      resumen: resumenUnidad(u.piso, u.letra),
    })),
  };
}
