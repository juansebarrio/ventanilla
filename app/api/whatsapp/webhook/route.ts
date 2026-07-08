import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  mensajeAudioSinTranscripcion,
  mensajeFotoAgregada,
  mensajeFotoSuelta,
  mensajeOnboardingSoloTexto,
  mensajeTipoNoSoportado,
} from "@/lib/mensajes";
import { registrarReclamo } from "@/lib/pipeline";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { transcribirAudio } from "@/lib/transcripcion";
import {
  descargarMediaWhatsApp,
  enviarTextoWhatsApp,
  firmaValida,
} from "@/lib/whatsapp/api";
import {
  avanzarOnboarding,
  iniciarOnboarding,
  type DatosOnboarding,
  type PasoOnboarding,
} from "@/lib/whatsapp/onboarding";
import { extraerMensajes, type MensajeEntrante } from "@/lib/whatsapp/webhook";

/*
 * Webhook de WhatsApp Cloud API (tanda 6). Env-gated: sin las variables
 * WHATSAPP_* responde 200 y no hace nada — la demo no depende de WhatsApp.
 *
 * Flujo: un vecino registrado que escribe crea un reclamo con el pipeline
 * real (mismo recorrido que el simulador) y recibe su número por WhatsApp.
 * Un número desconocido pasa por el alta conversacional (edificio → unidad
 * → nombre) y recién después se registra su reclamo. Los audios se
 * transcriben con ElevenLabs Scribe si hay clave; las fotos se suben a
 * Storage. Los salientes existen solo acá: los reclamos del simulador
 * jamás disparan mensajes.
 */

export const runtime = "nodejs";

/** Ventana para adjuntar una foto suelta al último reclamo del vecino. */
const ADJUNTAR_FOTO_MIN = 30;

// ── Verificación del webhook (Meta manda GET al suscribir) ─────────────────
export async function GET(req: Request) {
  const cfg = env.whatsapp;
  if (!cfg) return new Response(null, { status: 200 });

  const parametros = new URL(req.url).searchParams;
  const modo = parametros.get("hub.mode");
  const token = parametros.get("hub.verify_token");
  const challenge = parametros.get("hub.challenge") ?? "";

  if (modo === "subscribe" && token === cfg.verifyToken) {
    return new Response(challenge, { status: 200 });
  }
  return new Response(null, { status: 403 });
}

// ── Recepción de mensajes ────────────────────────────────────────────────────
export async function POST(req: Request) {
  const cfg = env.whatsapp;
  if (!cfg) return NextResponse.json({ ok: true });

  const crudo = await req.text();
  if (!firmaValida(crudo, req.headers.get("x-hub-signature-256"), cfg.appSecret)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(crudo);
  } catch {
    return NextResponse.json({ ok: true });
  }

  const mensajes = extraerMensajes(payload);
  if (mensajes.length === 0) return NextResponse.json({ ok: true });

  try {
    const supabase = createSupabaseAdminClient();
    const { data: admin } = await supabase
      .from("administrations")
      .select("id")
      .eq("slug", "iribarne")
      .eq("is_demo", true)
      .maybeSingle();
    if (!admin) return NextResponse.json({ ok: true });

    // Meta espera 200 rápido; los mensajes se procesan en serie y cualquier
    // error se traga (con log) para no provocar reintentos infinitos.
    for (const mensaje of mensajes) {
      try {
        await procesarMensaje(supabase, admin.id, mensaje);
      } catch (error) {
        console.error(`WhatsApp: fallo procesando ${mensaje.wamid}:`, error);
      }
    }
  } catch (error) {
    console.error("WhatsApp: fallo general del webhook:", error);
  }

  return NextResponse.json({ ok: true });
}

type Cliente = ReturnType<typeof createSupabaseAdminClient>;

async function procesarMensaje(
  supabase: Cliente,
  administrationId: string,
  mensaje: MensajeEntrante,
) {
  const telefono = `+${mensaje.de}`;

  // Reintento de Meta sobre un mensaje ya procesado: se ignora. Cubre tanto
  // los mensajes que crearon reclamos como los pasos del onboarding.
  const [{ data: yaProcesado }, { data: yaRespondido }] = await Promise.all([
    supabase
      .from("claim_messages")
      .select("id")
      .eq("wa_message_id", mensaje.wamid)
      .maybeSingle(),
    supabase
      .from("wa_sessions")
      .select("id")
      .eq("administration_id", administrationId)
      .eq("telefono", telefono)
      .eq("ultimo_wamid", mensaje.wamid)
      .maybeSingle(),
  ]);
  if (yaProcesado || yaRespondido) return;

  const { data: vecino } = await supabase
    .from("residents")
    .select("id, nombre, unit_id, units (id, piso, letra, building_id)")
    .eq("administration_id", administrationId)
    .eq("telefono", telefono)
    .maybeSingle();

  if (!vecino) {
    await atenderDesconocido(supabase, administrationId, mensaje, telefono);
    return;
  }

  await atenderVecino(supabase, administrationId, mensaje, telefono, {
    id: vecino.id,
    unitId: vecino.unit_id,
    buildingId: (vecino.units as { building_id: string } | null)?.building_id ?? null,
  });
}

// ── Vecino registrado: pipeline real ────────────────────────────────────────
async function atenderVecino(
  supabase: Cliente,
  administrationId: string,
  mensaje: MensajeEntrante,
  telefono: string,
  vecino: { id: string; unitId: string | null; buildingId: string | null },
) {
  const edificio = await edificioDelVecino(supabase, administrationId, vecino.buildingId);
  if (!edificio) return;

  if (mensaje.tipo === "texto") {
    const registro = await registrarReclamo(supabase, {
      administrationId,
      edificio,
      unitId: vecino.unitId,
      residentId: vecino.id,
      origen: "whatsapp",
      texto: mensaje.texto,
      tipoEntrada: "texto",
      wamid: mensaje.wamid,
    });
    await enviarTextoWhatsApp(telefono, registro.mensaje);
    return;
  }

  if (mensaje.tipo === "audio") {
    const media = await descargarMediaWhatsApp(mensaje.mediaId);
    const transcripcion = media
      ? await transcribirAudio(media.datos, media.mimeType)
      : null;
    if (!media || !transcripcion) {
      await enviarTextoWhatsApp(telefono, mensajeAudioSinTranscripcion());
      return;
    }
    const registro = await registrarReclamo(supabase, {
      administrationId,
      edificio,
      unitId: vecino.unitId,
      residentId: vecino.id,
      origen: "whatsapp",
      texto: transcripcion,
      tipoEntrada: "audio",
      transcripcion,
      wamid: mensaje.wamid,
      subirMedia: (claimId) =>
        subirMedia(supabase, administrationId, claimId, media, "AUD", "ogg"),
    });
    await enviarTextoWhatsApp(telefono, registro.mensaje);
    return;
  }

  if (mensaje.tipo === "imagen") {
    await atenderFoto(supabase, administrationId, mensaje, telefono, vecino, edificio);
    return;
  }

  await enviarTextoWhatsApp(telefono, mensajeTipoNoSoportado());
}

async function atenderFoto(
  supabase: Cliente,
  administrationId: string,
  mensaje: Extract<MensajeEntrante, { tipo: "imagen" }>,
  telefono: string,
  vecino: { id: string; unitId: string | null },
  edificio: { id: string; direccion: string },
) {
  const media = await descargarMediaWhatsApp(mensaje.mediaId);
  if (!media) {
    await enviarTextoWhatsApp(telefono, mensajeFotoSuelta());
    return;
  }

  // Con texto, la foto abre un reclamo nuevo (mensaje de texto + foto,
  // como el timeline de R-1044). Sin texto, se adjunta al reclamo reciente.
  if (mensaje.caption) {
    const registro = await registrarReclamo(supabase, {
      administrationId,
      edificio,
      unitId: vecino.unitId,
      residentId: vecino.id,
      origen: "whatsapp",
      texto: mensaje.caption,
      tipoEntrada: "texto",
      wamid: mensaje.wamid,
    });
    const path = await subirMedia(
      supabase,
      administrationId,
      registro.claimId,
      media,
      "IMG",
      "jpg",
    );
    if (path) {
      await supabase.from("claim_messages").insert({
        administration_id: administrationId,
        claim_id: registro.claimId,
        direccion: "entrada",
        tipo: "foto",
        contenido: path.split("/").pop() ?? null,
        media_path: path,
      });
    }
    await enviarTextoWhatsApp(telefono, registro.mensaje);
    return;
  }

  const desde = new Date(Date.now() - ADJUNTAR_FOTO_MIN * 60_000).toISOString();
  const { data: reciente } = await supabase
    .from("claims")
    .select("id, numero_publico")
    .eq("administration_id", administrationId)
    .eq("resident_id", vecino.id)
    .gte("created_at", desde)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!reciente) {
    await enviarTextoWhatsApp(telefono, mensajeFotoSuelta());
    return;
  }

  const ahora = new Date().toISOString();
  const path = await subirMedia(supabase, administrationId, reciente.id, media, "IMG", "jpg");
  await supabase.from("claim_messages").insert({
    administration_id: administrationId,
    claim_id: reciente.id,
    direccion: "entrada",
    tipo: "foto",
    contenido: path ? (path.split("/").pop() ?? null) : null,
    media_path: path,
    wa_message_id: mensaje.wamid,
    created_at: ahora,
  });
  await supabase
    .from("claims")
    .update({ ultima_actividad_at: ahora })
    .eq("id", reciente.id);
  await enviarTextoWhatsApp(telefono, mensajeFotoAgregada(reciente.numero_publico));
}

// ── Número desconocido: alta conversacional ─────────────────────────────────
async function atenderDesconocido(
  supabase: Cliente,
  administrationId: string,
  mensaje: MensajeEntrante,
  telefono: string,
) {
  const { data: sesion } = await supabase
    .from("wa_sessions")
    .select("id, paso, datos, ultimo_wamid")
    .eq("administration_id", administrationId)
    .eq("telefono", telefono)
    .maybeSingle();

  const [{ data: edificiosData }, { data: unidadesData }] = await Promise.all([
    supabase
      .from("buildings")
      .select("id, direccion, alias, total_unidades")
      .eq("administration_id", administrationId)
      .order("total_unidades", { ascending: false })
      .order("direccion"),
    supabase
      .from("units")
      .select("id, piso, letra, building_id")
      .eq("administration_id", administrationId),
  ]);
  const edificios = edificiosData ?? [];
  const unidades = unidadesData ?? [];
  if (edificios.length === 0) return;

  // Sin sesión, o con una sesión "completo" huérfana (el vecino ya no
  // existe): arranca el alta desde el edificio.
  if (!sesion || sesion.paso === "completo") {
    const textoInicial = mensaje.tipo === "texto" ? mensaje.texto : null;
    const inicio = iniciarOnboarding(edificios, textoInicial);
    await supabase.from("wa_sessions").upsert(
      {
        administration_id: administrationId,
        telefono,
        paso: inicio.sesion.paso,
        datos: inicio.sesion.datos,
        ultimo_wamid: mensaje.wamid,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "administration_id,telefono" },
    );
    await enviarTextoWhatsApp(telefono, inicio.mensaje);
    return;
  }

  if (mensaje.tipo !== "texto") {
    await supabase
      .from("wa_sessions")
      .update({ ultimo_wamid: mensaje.wamid, updated_at: new Date().toISOString() })
      .eq("id", sesion.id);
    await enviarTextoWhatsApp(telefono, mensajeOnboardingSoloTexto());
    return;
  }

  const resultado = avanzarOnboarding(
    {
      paso: sesion.paso as PasoOnboarding,
      datos: (sesion.datos ?? {}) as DatosOnboarding,
    },
    mensaje.texto,
    { edificios, unidades },
  );

  if (resultado.tipo === "responder") {
    await supabase
      .from("wa_sessions")
      .update({
        paso: resultado.sesion.paso,
        datos: resultado.sesion.datos,
        ultimo_wamid: mensaje.wamid,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sesion.id);
    await enviarTextoWhatsApp(telefono, resultado.mensaje);
    return;
  }

  // Alta completa: se crea el vecino (verificado por el propio alta), la
  // sesión queda marcada para descartar reintentos y, si el primer mensaje
  // ya era el reclamo, se registra.
  const { data: vecino, error: errorVecino } = await supabase
    .from("residents")
    .insert({
      administration_id: administrationId,
      unit_id: resultado.unitId,
      nombre: resultado.nombre,
      telefono,
      verificado: true,
    })
    .select("id")
    .single();
  if (errorVecino || !vecino) throw errorVecino ?? new Error("Alta de vecino falló");

  await supabase
    .from("wa_sessions")
    .update({
      paso: "completo",
      datos: {},
      ultimo_wamid: mensaje.wamid,
      updated_at: new Date().toISOString(),
    })
    .eq("id", sesion.id);
  await enviarTextoWhatsApp(telefono, resultado.mensaje);

  if (resultado.textoInicial) {
    const edificio = edificios.find((e) => e.id === resultado.buildingId);
    if (!edificio) return;
    const registro = await registrarReclamo(supabase, {
      administrationId,
      edificio,
      unitId: resultado.unitId,
      residentId: vecino.id,
      origen: "whatsapp",
      texto: resultado.textoInicial,
      tipoEntrada: "texto",
      wamid: mensaje.wamid,
    });
    await enviarTextoWhatsApp(telefono, registro.mensaje);
  }
}

// ── Auxiliares ───────────────────────────────────────────────────────────────
async function edificioDelVecino(
  supabase: Cliente,
  administrationId: string,
  buildingId: string | null,
): Promise<{ id: string; direccion: string } | null> {
  let consulta = supabase
    .from("buildings")
    .select("id, direccion, total_unidades")
    .eq("administration_id", administrationId);
  // Vecino sin unidad asignada: va al edificio principal (el más grande),
  // y la administración puede reasignar después desde el detalle.
  consulta = buildingId
    ? consulta.eq("id", buildingId)
    : consulta.order("total_unidades", { ascending: false }).limit(1);
  const { data } = await consulta.maybeSingle();
  return data ? { id: data.id, direccion: data.direccion } : null;
}

async function subirMedia(
  supabase: Cliente,
  administrationId: string,
  claimId: string,
  media: { datos: Buffer; mimeType: string },
  prefijo: "AUD" | "IMG",
  extensionDefault: string,
): Promise<string | null> {
  const extension = extensionPorMime(media.mimeType) ?? extensionDefault;
  const path = `${administrationId}/${claimId}/${prefijo}-${Date.now()}.${extension}`;
  const { error } = await supabase.storage
    .from("claim-media")
    .upload(path, media.datos, { contentType: media.mimeType, upsert: false });
  if (error) {
    console.error("WhatsApp: fallo subiendo media:", error.message);
    return null;
  }
  return path;
}

function extensionPorMime(mime: string): string | null {
  const base = mime.split(";")[0]?.trim() ?? "";
  const mapa: Record<string, string> = {
    "audio/ogg": "ogg",
    "audio/mpeg": "mp3",
    "audio/mp4": "m4a",
    "audio/amr": "amr",
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  return mapa[base] ?? null;
}
