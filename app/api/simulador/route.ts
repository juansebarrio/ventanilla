import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { TZ_AR } from "@/lib/domain/format";
import { registrarReclamo } from "@/lib/pipeline";
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
    const registro = await registrarReclamo(supabase, {
      administrationId: admin.id,
      edificio,
      origen: "simulador",
      texto,
      tipoEntrada: "texto",
      preferirFallback,
    });

    return NextResponse.json({
      ok: true,
      numero: registro.numero,
      resumen: registro.resumen,
      categoria: registro.categoria,
      urgencia: registro.urgencia,
      mensaje: registro.mensaje,
    });
  } catch {
    return NextResponse.json({ ok: false, error: MENSAJE_ERROR }, { status: 503 });
  }
}
