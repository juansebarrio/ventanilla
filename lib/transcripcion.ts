import "server-only";

import { env } from "@/lib/env";

/**
 * Transcripción de audios con ElevenLabs Scribe. Env-gated: sin
 * ELEVENLABS_API_KEY devuelve null y el webhook le pide el texto al vecino.
 */
export async function transcribirAudio(
  datos: Buffer,
  mimeType: string,
): Promise<string | null> {
  const apiKey = env.elevenLabsApiKey;
  if (!apiKey) return null;

  try {
    const forma = new FormData();
    forma.append("model_id", "scribe_v1");
    forma.append(
      "file",
      new Blob([new Uint8Array(datos)], { type: mimeType }),
      "audio",
    );

    const respuesta = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: { "xi-api-key": apiKey },
      body: forma,
    });
    if (!respuesta.ok) {
      console.error(`Scribe devolvió ${respuesta.status}`);
      return null;
    }
    const cuerpo = (await respuesta.json()) as { text?: string };
    const texto = cuerpo.text?.trim();
    return texto ? texto : null;
  } catch (error) {
    console.error("Scribe falló:", error);
    return null;
  }
}
