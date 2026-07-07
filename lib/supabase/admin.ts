import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "@/lib/env";
import type { Database } from "./database.types";

/**
 * Cliente con service role: bypassa RLS. Solo para route handlers del
 * servidor (simulador público, webhook de WhatsApp, reset del demo).
 * Jamás importar desde un client component: `server-only` rompe el build.
 */
export function createSupabaseAdminClient() {
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
