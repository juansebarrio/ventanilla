import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type ServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export type Miembro = {
  supabase: ServerClient;
  userId: string;
  email: string;
  administrationId: string;
  tenantNombre: string;
  usuariaNombre: string;
};

/**
 * Resuelve el usuario autenticado y su membresía. Memoizado por request con
 * `cache()`: el layout y la página comparten una sola resolución y un solo
 * cliente. Usa getUser() (valida el JWT), no getSession().
 */
export const obtenerMiembro = cache(async (): Promise<Miembro | null> => {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: member } = await supabase
    .from("members")
    .select("administration_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!member) return null;

  const { data: administracion } = await supabase
    .from("administrations")
    .select("nombre")
    .eq("id", member.administration_id)
    .maybeSingle();

  return {
    supabase,
    userId: user.id,
    email: user.email ?? "",
    administrationId: member.administration_id,
    tenantNombre: administracion?.nombre ?? "Administración",
    usuariaNombre:
      (user.user_metadata?.nombre as string | undefined) ?? user.email ?? "Usuaria",
  };
});

/** Igual que obtenerMiembro pero redirige al login si no hay sesión. */
export async function requireMiembro(): Promise<Miembro> {
  const miembro = await obtenerMiembro();
  if (!miembro) redirect("/login");
  return miembro;
}
