/*
 * Parsing del payload que manda Meta al webhook. Sin dependencias de red ni
 * de Supabase para poder testearlo. Solo se procesan mensajes entrantes;
 * los callbacks de estado (sent/delivered/read) se ignoran.
 */

export type MensajeEntrante = {
  wamid: string;
  de: string; // wa_id, dígitos sin "+"
  nombre: string | null;
} & (
  | { tipo: "texto"; texto: string }
  | { tipo: "audio"; mediaId: string; mimeType: string }
  | { tipo: "imagen"; mediaId: string; mimeType: string; caption: string | null }
  | { tipo: "otro" }
);

type PayloadMeta = {
  entry?: {
    changes?: {
      value?: {
        contacts?: { wa_id?: string; profile?: { name?: string } }[];
        messages?: {
          id?: string;
          from?: string;
          type?: string;
          text?: { body?: string };
          audio?: { id?: string; mime_type?: string };
          image?: { id?: string; mime_type?: string; caption?: string };
        }[];
      };
    }[];
  }[];
};

export function extraerMensajes(payload: unknown): MensajeEntrante[] {
  const mensajes: MensajeEntrante[] = [];
  if (!payload || typeof payload !== "object") return mensajes;
  const cuerpo = payload as PayloadMeta;

  for (const entry of cuerpo.entry ?? []) {
    for (const change of entry.changes ?? []) {
      const value = change.value;
      if (!value?.messages) continue;

      const nombres = new Map(
        (value.contacts ?? [])
          .filter((c) => c.wa_id)
          .map((c) => [c.wa_id as string, c.profile?.name ?? null]),
      );

      for (const m of value.messages) {
        if (!m.id || !m.from) continue;
        const base = {
          wamid: m.id,
          de: m.from,
          nombre: nombres.get(m.from) ?? null,
        };

        if (m.type === "text" && m.text?.body) {
          mensajes.push({ ...base, tipo: "texto", texto: m.text.body });
        } else if (m.type === "audio" && m.audio?.id) {
          mensajes.push({
            ...base,
            tipo: "audio",
            mediaId: m.audio.id,
            mimeType: m.audio.mime_type ?? "audio/ogg",
          });
        } else if (m.type === "image" && m.image?.id) {
          mensajes.push({
            ...base,
            tipo: "imagen",
            mediaId: m.image.id,
            mimeType: m.image.mime_type ?? "image/jpeg",
            caption: m.image.caption?.trim() || null,
          });
        } else {
          mensajes.push({ ...base, tipo: "otro" });
        }
      }
    }
  }
  return mensajes;
}
