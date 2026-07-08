import "server-only";

import { env } from "@/lib/env";

export { firmaValida } from "./firma";

/*
 * Cliente mínimo de la WhatsApp Cloud API. Todo es env-gated: sin las
 * variables WHATSAPP_* estas funciones no se llaman (el webhook responde
 * 200 sin hacer nada y el panel no intenta mandar salientes).
 */

const GRAPH = "https://graph.facebook.com/v20.0";

/** Manda un texto libre (válido dentro de la ventana de 24 h de Meta). */
export async function enviarTextoWhatsApp(
  para: string,
  cuerpo: string,
): Promise<boolean> {
  const cfg = env.whatsapp;
  if (!cfg) return false;

  const destino = para.startsWith("+") ? para.slice(1) : para;
  const respuesta = await fetch(`${GRAPH}/${cfg.phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: destino,
      type: "text",
      text: { body: cuerpo },
    }),
  });
  if (!respuesta.ok) {
    console.error(
      `WhatsApp: fallo al enviar (${respuesta.status}) ${await respuesta.text()}`,
    );
  }
  return respuesta.ok;
}

/** Descarga la media de un mensaje (audio o foto) desde la Graph API. */
export async function descargarMediaWhatsApp(
  mediaId: string,
): Promise<{ datos: Buffer; mimeType: string } | null> {
  const cfg = env.whatsapp;
  if (!cfg) return null;

  const meta = await fetch(`${GRAPH}/${mediaId}`, {
    headers: { Authorization: `Bearer ${cfg.accessToken}` },
  });
  if (!meta.ok) return null;
  const info = (await meta.json()) as { url?: string; mime_type?: string };
  if (!info.url) return null;

  const archivo = await fetch(info.url, {
    headers: { Authorization: `Bearer ${cfg.accessToken}` },
  });
  if (!archivo.ok) return null;

  return {
    datos: Buffer.from(await archivo.arrayBuffer()),
    mimeType: info.mime_type ?? "application/octet-stream",
  };
}

