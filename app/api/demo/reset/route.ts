import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/*
 * POST /api/demo/reset — restaura el tenant demo a su estado canónico.
 *
 * Borra todo lo que no es seed (reclamos del simulador incluidos), revierte
 * las mutaciones sobre los reclamos sembrados, re-ancla las fechas del
 * timeline de R-1044 al día de hoy en Buenos Aires y purga los rate limits.
 * Toda la lógica vive en la función SQL demo_reset() (solo service role).
 *
 * Protegido con DEMO_RESET_SECRET (Authorization: Bearer). El cron de Vercel
 * (vercel.json, 06:00 ART) invoca por GET con el mismo header; CRON_SECRET
 * de Vercel también se acepta porque es el header que inyecta su scheduler.
 */

export const runtime = "nodejs";

function autorizado(req: Request): boolean {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return false;
  const token = auth.slice("Bearer ".length);
  if (!token) return false;
  const secretos = [env.demoResetSecret, process.env.CRON_SECRET].filter(
    (s): s is string => Boolean(s),
  );
  return secretos.includes(token);
}

async function ejecutarReset(req: Request) {
  try {
    if (!autorizado(req)) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  } catch {
    // Sin DEMO_RESET_SECRET configurado el endpoint queda deshabilitado.
    return NextResponse.json({ ok: false }, { status: 503 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.rpc("demo_reset");
    if (error) throw new Error(error.message);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}

export async function POST(req: Request) {
  return ejecutarReset(req);
}

// Vercel Cron invoca por GET.
export async function GET(req: Request) {
  return ejecutarReset(req);
}
