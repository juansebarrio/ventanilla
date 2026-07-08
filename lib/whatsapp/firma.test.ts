import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { firmaValida } from "./firma";

const SECRETO = "un-secreto-de-prueba";

function firmar(cuerpo: string, secreto: string): string {
  return `sha256=${createHmac("sha256", secreto).update(cuerpo, "utf8").digest("hex")}`;
}

describe("firmaValida", () => {
  it("acepta la firma correcta", () => {
    const cuerpo = JSON.stringify({ entry: [] });
    expect(firmaValida(cuerpo, firmar(cuerpo, SECRETO), SECRETO)).toBe(true);
  });

  it("rechaza firma de otro secreto, cuerpo alterado o header malformado", () => {
    const cuerpo = JSON.stringify({ entry: [] });
    expect(firmaValida(cuerpo, firmar(cuerpo, "otro"), SECRETO)).toBe(false);
    expect(firmaValida(cuerpo + " ", firmar(cuerpo, SECRETO), SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, "sha256=corta", SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, "md5=abc", SECRETO)).toBe(false);
    expect(firmaValida(cuerpo, null, SECRETO)).toBe(false);
  });

  it("sin app secret configurado no valida (env-gated)", () => {
    expect(firmaValida("cualquier cosa", null, undefined)).toBe(true);
  });
});
