"use server";

import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type EstadoLogin = { error: string | null };

export async function iniciarSesion(
  _estado: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const desde = String(formData.get("desde") ?? "/panel") || "/panel";

  if (!email || !password) {
    return { error: "Ingresá tu correo y tu contraseña." };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "No pudimos iniciar sesión con esos datos." };
  }

  redirect(desde.startsWith("/panel") ? desde : "/panel");
}
