import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Datos de la sesión del panel: quién es y a qué administración pertenece. */
export type Sesion = {
  userId: string;
  email: string;
  nombre: string;
  administrationId: string;
  administracionNombre: string;
};

/**
 * Devuelve la sesión del usuario autenticado y su membresía, o null si no hay
 * sesión o no es miembro de ninguna administración. La RLS ya garantiza que
 * solo ve su propia membresía.
 */
export async function obtenerSesion(): Promise<Sesion | null> {
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

  const nombre =
    (user.user_metadata?.nombre as string | undefined) ?? user.email ?? "";

  return {
    userId: user.id,
    email: user.email ?? "",
    nombre,
    administrationId: member.administration_id,
    administracionNombre: administracion?.nombre ?? "",
  };
}
