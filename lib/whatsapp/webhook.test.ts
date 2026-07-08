import { describe, expect, it } from "vitest";
import { extraerMensajes } from "./webhook";

function payloadCon(mensajes: unknown[], contacts?: unknown[]) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        id: "123",
        changes: [
          {
            field: "messages",
            value: {
              messaging_product: "whatsapp",
              contacts: contacts ?? [
                { wa_id: "5491160004821", profile: { name: "Marta" } },
              ],
              messages: mensajes,
            },
          },
        ],
      },
    ],
  };
}

describe("extraerMensajes", () => {
  it("extrae un texto con su remitente y nombre", () => {
    const mensajes = extraerMensajes(
      payloadCon([
        {
          id: "wamid.1",
          from: "5491160004821",
          type: "text",
          text: { body: "hola, tengo una pérdida de agua" },
        },
      ]),
    );
    expect(mensajes).toEqual([
      {
        wamid: "wamid.1",
        de: "5491160004821",
        nombre: "Marta",
        tipo: "texto",
        texto: "hola, tengo una pérdida de agua",
      },
    ]);
  });

  it("extrae audio e imagen con su media id", () => {
    const mensajes = extraerMensajes(
      payloadCon([
        {
          id: "wamid.2",
          from: "5491160004821",
          type: "audio",
          audio: { id: "media-9", mime_type: "audio/ogg; codecs=opus" },
        },
        {
          id: "wamid.3",
          from: "5491160004821",
          type: "image",
          image: { id: "media-10", mime_type: "image/jpeg", caption: "  la mancha  " },
        },
      ]),
    );
    expect(mensajes[0]).toMatchObject({
      tipo: "audio",
      mediaId: "media-9",
      mimeType: "audio/ogg; codecs=opus",
    });
    expect(mensajes[1]).toMatchObject({
      tipo: "imagen",
      mediaId: "media-10",
      caption: "la mancha",
    });
  });

  it("marca como otro lo que no soporta y tolera payloads raros", () => {
    const soloEstado = extraerMensajes({
      entry: [{ changes: [{ value: { statuses: [{ id: "x" }] } }] }],
    });
    expect(soloEstado).toEqual([]);

    const sticker = extraerMensajes(
      payloadCon([{ id: "wamid.4", from: "5491100000000", type: "sticker" }], []),
    );
    expect(sticker).toEqual([
      { wamid: "wamid.4", de: "5491100000000", nombre: null, tipo: "otro" },
    ]);

    expect(extraerMensajes(null)).toEqual([]);
    expect(extraerMensajes({})).toEqual([]);
    expect(extraerMensajes("basura")).toEqual([]);
  });
});
