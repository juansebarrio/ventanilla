import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Valida la firma X-Hub-Signature-256 que Meta manda en cada POST del
 * webhook. Si no hay WHATSAPP_APP_SECRET configurado, se acepta sin
 * validar (documentado en el README).
 */
export function firmaValida(
  cuerpoCrudo: string,
  encabezado: string | null,
  appSecret: string | undefined,
): boolean {
  if (!appSecret) return true;
  if (!encabezado?.startsWith("sha256=")) return false;

  const esperada = createHmac("sha256", appSecret)
    .update(cuerpoCrudo, "utf8")
    .digest("hex");
  const recibida = encabezado.slice("sha256=".length);
  if (recibida.length !== esperada.length) return false;
  return timingSafeEqual(Buffer.from(esperada, "utf8"), Buffer.from(recibida, "utf8"));
}
