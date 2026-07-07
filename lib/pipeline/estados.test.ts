import { describe, expect, it } from "vitest";
import {
  aplicarTransicion,
  esTransicionValida,
  TransicionInvalidaError,
} from "./estados";

describe("máquina de estados", () => {
  it("acepta transiciones válidas", () => {
    expect(esTransicionValida("recibido", "en_gestion")).toBe(true);
    expect(esTransicionValida("asignado", "resuelto")).toBe(true);
    expect(esTransicionValida("resuelto", "cerrado")).toBe(true);
    expect(esTransicionValida("cerrado", "reabierto")).toBe(true);
  });

  it("rechaza transiciones inválidas", () => {
    expect(esTransicionValida("recibido", "reabierto")).toBe(false);
    expect(esTransicionValida("cerrado", "asignado")).toBe(false);
    expect(esTransicionValida("resuelto", "recibido")).toBe(false);
  });

  it("una transición al mismo estado no es válida", () => {
    expect(esTransicionValida("asignado", "asignado")).toBe(false);
  });

  it("aplicarTransicion lanza ante una transición inválida", () => {
    expect(() => aplicarTransicion("recibido", "reabierto", "Carla Méndez")).toThrow(
      TransicionInvalidaError,
    );
  });

  it("marcar resuelto genera el evento de conformidad", () => {
    const r = aplicarTransicion("asignado", "resuelto", "Carla Méndez");
    expect(r.estado).toBe("resuelto");
    expect(r.evento.texto).toBe("Marcado Resuelto · esperando conformidad");
    expect(r.evento.tipo).toBe("estado");
    expect(r.evento.actor).toBe("Carla Méndez");
    expect(r.timestampColumna).toBe("resuelto_at");
  });

  it("un cambio de estado normal genera el evento 'Estado cambiado a X'", () => {
    const r = aplicarTransicion("recibido", "en_gestion", "Carla Méndez");
    expect(r.evento.texto).toBe("Estado cambiado a En gestión");
    expect(r.timestampColumna).toBe("en_gestion_at");
  });

  it("mapea la columna de timestamp de cada estado", () => {
    expect(aplicarTransicion("recibido", "asignado", "s").timestampColumna).toBe(
      "asignado_at",
    );
    expect(aplicarTransicion("resuelto", "cerrado", "s").timestampColumna).toBe(
      "cerrado_at",
    );
    expect(aplicarTransicion("cerrado", "reabierto", "s").timestampColumna).toBe(
      "reabierto_at",
    );
    expect(aplicarTransicion("asignado", "derivado", "s").timestampColumna).toBe(
      "derivado_at",
    );
  });
});
