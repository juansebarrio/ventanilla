/**
 * Genera el audio de Marta (timeline de R-1044) con ElevenLabs y lo sube al
 * bucket claim-media, completando el media_path del mensaje. Es opcional:
 * sin ELEVENLABS_API_KEY el script termina sin error y el player del panel
 * queda en modo simulado (barra de progreso de 38 s), igual que el prototipo.
 *
 * Variables: ELEVENLABS_API_KEY (opcional ELEVENLABS_VOICE_ID),
 * NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 *   pnpm seed:audio
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../lib/supabase/database.types";

const TRANSCRIPCION =
  "Hola, buenas. Tengo una mancha de humedad en la pared del living que cada vez está peor, ya se está descascarando la pintura. Yo creo que viene del departamento de arriba. Te mando una foto.";

// Voz femenina de la librería pública de ElevenLabs; se puede pisar por env.
const VOZ_DEFAULT = "EXAVITQu4vr4xnSDxMaL";
const ARCHIVO = "AUD-20260707-WA0011.mp3";

function requerida(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    console.error(`Falta la variable de entorno ${nombre}.`);
    process.exit(1);
  }
  return valor;
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    console.log(
      "Sin ELEVENLABS_API_KEY: el player del panel queda en modo simulado. Nada para hacer.",
    );
    return;
  }

  const url = requerida("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRole = requerida("SUPABASE_SERVICE_ROLE_KEY");
  const voz = process.env.ELEVENLABS_VOICE_ID ?? VOZ_DEFAULT;

  const supabase = createClient<Database>(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // 1. Texto a voz.
  const respuesta = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voz}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text: TRANSCRIPCION,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    },
  );
  if (!respuesta.ok) {
    throw new Error(
      `ElevenLabs devolvió ${respuesta.status}: ${await respuesta.text()}`,
    );
  }
  const audio = Buffer.from(await respuesta.arrayBuffer());
  console.log(`Audio generado (${Math.round(audio.length / 1024)} KB).`);

  // 2. Ubicar el mensaje de audio de R-1044.
  const { data: admin, error: errorAdmin } = await supabase
    .from("administrations")
    .select("id")
    .eq("slug", "iribarne")
    .single();
  if (errorAdmin) throw errorAdmin;

  const { data: claim, error: errorClaim } = await supabase
    .from("claims")
    .select("id")
    .eq("administration_id", admin.id)
    .eq("numero_publico", "R-1044")
    .single();
  if (errorClaim) throw errorClaim;

  const { data: mensaje, error: errorMensaje } = await supabase
    .from("claim_messages")
    .select("id")
    .eq("claim_id", claim.id)
    .eq("tipo", "audio")
    .single();
  if (errorMensaje) throw errorMensaje;

  // 3. Subir y completar media_path.
  const ruta = `${admin.id}/${claim.id}/${ARCHIVO}`;
  const { error: errorUpload } = await supabase.storage
    .from("claim-media")
    .upload(ruta, audio, { contentType: "audio/mpeg", upsert: true });
  if (errorUpload) throw errorUpload;

  const { error: errorUpdate } = await supabase
    .from("claim_messages")
    .update({ media_path: ruta })
    .eq("id", mensaje.id);
  if (errorUpdate) throw errorUpdate;

  console.log(`Audio subido a claim-media/${ruta} y mensaje actualizado.`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
