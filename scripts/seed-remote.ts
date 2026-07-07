/**
 * Completa el seed contra el proyecto Supabase real: lo que seed.sql no
 * puede hacer por SQL puro.
 *
 *   1. Crea (o encuentra) la usuaria del panel demo en Supabase Auth.
 *   2. Le da membresía en Administración Iribarne.
 *   3. Sube la foto del timeline de R-1044 al bucket claim-media.
 *
 * Prerrequisitos: haber aplicado las migraciones y seed.sql (por ejemplo
 * con psql "$SUPABASE_DB_URL" -f supabase/seed/seed.sql). Variables:
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SEED_ADMIN_EMAIL,
 * SEED_ADMIN_PASSWORD.
 *
 * El script npm carga .env.local (y .env) con --env-file-if-exists, así que
 * alcanza con completar .env.local como para la app:
 *
 *   pnpm seed:remote
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Database } from "../lib/supabase/database.types";

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`Falta la variable de entorno ${nombre}.`);
    process.exit(1);
  }
  return valor;
}

const url = requerida("NEXT_PUBLIC_SUPABASE_URL");
const serviceRole = requerida("SUPABASE_SERVICE_ROLE_KEY");
const email = process.env.SEED_ADMIN_EMAIL ?? "carla@iribarne.ar";
const password = requerida("SEED_ADMIN_PASSWORD");

const supabase = createClient<Database>(url, serviceRole, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function encontrarUsuariaPorEmail(): Promise<string | null> {
  for (let pagina = 1; pagina <= 20; pagina++) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page: pagina,
      perPage: 100,
    });
    if (error) throw error;
    const encontrada = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (encontrada) return encontrada.id;
    if (data.users.length < 100) break;
  }
  return null;
}

async function main() {
  // 1. Usuaria Carla Méndez.
  let userId = await encontrarUsuariaPorEmail();
  if (userId) {
    console.log(`La usuaria ${email} ya existe.`);
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { nombre: "Carla Méndez" },
    });
    if (error) throw error;
    userId = data.user.id;
    console.log(`Usuaria ${email} creada.`);
  }

  // 2. Membresía en la administración demo.
  const { data: admin, error: errorAdmin } = await supabase
    .from("administrations")
    .select("id")
    .eq("slug", "iribarne")
    .single();
  if (errorAdmin) {
    throw new Error(
      `No se encontró la administración demo. ¿Corriste seed.sql primero? (${errorAdmin.message})`,
    );
  }

  const { error: errorMember } = await supabase
    .from("members")
    .upsert(
      { user_id: userId, administration_id: admin.id, rol: "admin" },
      { onConflict: "user_id,administration_id" },
    );
  if (errorMember) throw errorMember;
  console.log("Membresía asegurada.");

  // 3. Foto del timeline de R-1044.
  const { data: claim, error: errorClaim } = await supabase
    .from("claims")
    .select("id")
    .eq("administration_id", admin.id)
    .eq("numero_publico", "R-1044")
    .single();
  if (errorClaim) throw errorClaim;

  const archivo = "IMG-20260707-WA0012.jpg";
  const ruta = `${admin.id}/${claim.id}/${archivo}`;
  const cuerpo = readFileSync(
    join(
      dirname(fileURLToPath(import.meta.url)),
      "..",
      "supabase",
      "seed",
      "assets",
      archivo,
    ),
  );
  const { error: errorUpload } = await supabase.storage
    .from("claim-media")
    .upload(ruta, cuerpo, { contentType: "image/jpeg", upsert: true });
  if (errorUpload) throw errorUpload;
  console.log(`Foto subida a claim-media/${ruta}`);

  console.log("Seed remoto completo.");
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
