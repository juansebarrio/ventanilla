import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { TZ_AR } from "@/lib/domain/format";
import { redactarRespuestaVecino } from "@/lib/mensajes";
import { clasificar } from "@/lib/pipeline";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/*
 * POST /api/simulador — el simulador público de la landing.
 *
 * Ejecuta el pipeline real: clasifica (Claude o fallback por palabras), crea
 * el reclamo en el tenant demo con origen simulador y numeración correlativa,
 * y devuelve el mensaje de confirmación. Protecciones: 5 mensajes por minuto
 * y 20 por día por IP; superado el cap global diario, sigue funcionando con
 * el clasificador por palabras sin avisar nada distinto. Sin media, máximo
 * 300 caracteres. Los reclamos del simulador no disparan mensajes salientes.
 */

export const runtime = "nodejs";

const MAX_CARACTERES = 300;
const LIMITE_MINUTO = 5;
const LIMITE_DIA = 20;

const MENSAJE_RITMO =
  "Recibimos varios mensajes tuyos muy seguidos. Esperá un momento y probá de nuevo.";
const MENSAJE_ERROR =
  "No pudimos registrar tu reclamo en este momento. Probá de nuevo en un rato.";

function inicioMinuto(): string {
  const d = new Date();
  d.setSeconds(0, 0);
  return d.toISOString();
}

/** Medianoche del día actual en Buenos Aires (ART es UTC-3, sin horario de verano). */
function inicioDiaART(): string {
  const fecha = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ_AR,
    dateStyle: "short",
  }).format(new Date());
  return `${fecha}T00:00:00-03:00`;
}

function ipDelRequest(req: Request): string {
  const reenviada = req.headers.get("x-forwarded-for");
  if (reenviada) {
    const primera = reenviada.split(",")[0]?.trim();
    if (primera) return primera;
  }
  return req.headers.get("x-real-ip") ?? "desconocida";
}

export async function POST(req: Request) {
  let texto: string;
  try {
    const body = (await req.json()) as { texto?: unknown };
    texto = String(body.texto ?? "").trim();
  } catch {
    return NextResponse.json({ ok: false, error: MENSAJE_ERROR }, { status: 400 });
  }

  if (!texto) {
    return NextResponse.json(
      { ok: false, error: "Contanos qué pasó y lo registramos." },
      { status: 400 },
    );
  }
  if (texto.length > MAX_CARACTERES) {
    return NextResponse.json(
      { ok: false, error: "El mensaje es muy largo. Contalo en menos de 300 caracteres." },
      { status: 400 },
    );
  }

  let supabase: ReturnType<typeof createSupabaseAdminClient>;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return NextResponse.json({ ok: false, error: MENSAJE_ERROR }, { status: 503 });
  }

  try {
    // ── Rate limit por IP y cap global ─────────────────────────────────────
    const ip = ipDelRequest(req);
    const dia = inicioDiaART();

    const [porMinuto, porDia, global] = await Promise.all([
      supabase.rpc("rate_limit_hit", {
        p_scope: "ip_minute",
        p_bucket_key: ip,
        p_window_start: inicioMinuto(),
      }),
      supabase.rpc("rate_limit_hit", {
        p_scope: "ip_day",
        p_bucket_key: ip,
        p_window_start: dia,
      }),
      supabase.rpc("rate_limit_hit", {
        p_scope: "global_day",
        p_bucket_key: "global",
        p_window_start: dia,
      }),
    ]);

    if ((porMinuto.data ?? 0) > LIMITE_MINUTO || (porDia.data ?? 0) > LIMITE_DIA) {
      return NextResponse.json({ ok: false, error: MENSAJE_RITMO }, { status: 429 });
    }
    const preferirFallback = (global.data ?? 0) > env.simulatorDailyCap;

    // ── Tenant demo y edificio del simulador ───────────────────────────────
    const { data: admin } = await supabase
      .from("administrations")
      .select("id")
      .eq("slug", "iribarne")
      .eq("is_demo", true)
      .maybeSingle();
    if (!admin) throw new Error("Sin tenant demo");

    const { data: edificio } = await supabase
      .from("buildings")
      .select("id, direccion")
      .eq("administration_id", admin.id)
      .eq("alias", "Yerbal")
      .maybeSingle();
    if (!edificio) throw new Error("Sin edificio del simulador");

    // ── Pipeline real ──────────────────────────────────────────────────────
    const clasificacion = await clasificar(texto, {
      edificioNombre: edificio.direccion,
      preferirFallback,
    });

    const { data: categoria } = await supabase
      .from("categories")
      .select("id, nombre")
      .eq("administration_id", admin.id)
      .eq("nombre", clasificacion.categoria)
      .maybeSingle();

    const creado = new Date();
    const { data: claim, error: errorClaim } = await supabase
      .from("claims")
      .insert({
        administration_id: admin.id,
        titulo: clasificacion.resumen,
        categoria_id: categoria?.id ?? null,
        urgencia: clasificacion.urgencia,
        ambito: clasificacion.ambito,
        estado: "recibido",
        building_id: edificio.id,
        origen: "simulador",
        created_at: creado.toISOString(),
        ultima_actividad_at: creado.toISOString(),
      })
      .select("id, numero_publico")
      .single();
    if (errorClaim || !claim) throw errorClaim ?? new Error("Insert de claim falló");

    const mensaje = redactarRespuestaVecino({
      numeroPublico: claim.numero_publico,
      edificioNombre: edificio.direccion,
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
          administration_id: admin.id,
          claim_id: claim.id,
          direccion: "entrada",
          tipo: "texto",
          contenido: texto,
          created_at: creado.toISOString(),
        },
        {
          administration_id: admin.id,
          claim_id: claim.id,
          direccion: "salida",
          tipo: "texto",
          contenido: mensaje,
          created_at: respondido.toISOString(),
        },
      ]),
      supabase.from("claim_events").insert([
        {
          administration_id: admin.id,
          claim_id: claim.id,
          tipo: "alta",
          texto: "Nuevo reclamo",
          actor: "Sistema",
          created_at: creado.toISOString(),
        },
        {
          administration_id: admin.id,
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

    return NextResponse.json({
      ok: true,
      numero: claim.numero_publico,
      resumen: clasificacion.resumen,
      categoria: clasificacion.categoria,
      urgencia: clasificacion.urgencia,
      mensaje,
    });
  } catch {
    return NextResponse.json({ ok: false, error: MENSAJE_ERROR }, { status: 503 });
  }
}
