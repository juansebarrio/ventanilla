import { describe, expect, it } from "vitest";
import { clasificarPorPalabras } from "./fallback";

describe("clasificarPorPalabras", () => {
  it("clasifica ascensor como urgente", () => {
    const r = clasificarPorPalabras("El ascensor está parado en el 3°");
    expect(r.categoria).toBe("Ascensor");
    expect(r.urgencia).toBe("urgente");
  });

  it("clasifica seguridad y accesos con prioridad alta", () => {
    const r = clasificarPorPalabras("Se rompió la cerradura de la puerta de entrada");
    expect(r.categoria).toBe("Seguridad y accesos");
    expect(r.urgencia).toBe("alta");
  });

  it("clasifica filtraciones y humedad", () => {
    const r = clasificarPorPalabras("Hay una mancha de humedad en la pared");
    expect(r.categoria).toBe("Filtraciones y humedad");
    expect(r.urgencia).toBe("alta");
  });

  it("clasifica plomería y pérdidas", () => {
    const r = clasificarPorPalabras("Pérdida de agua en la cochera");
    expect(r.categoria).toBe("Plomería y pérdidas");
    expect(r.urgencia).toBe("alta");
  });

  it("clasifica electricidad con prioridad media", () => {
    const r = clasificarPorPalabras("La luz del palier está quemada");
    expect(r.categoria).toBe("Electricidad");
    expect(r.urgencia).toBe("media");
  });

  it("clasifica ruidos y convivencia", () => {
    const r = clasificarPorPalabras("Hay ruidos de taladro después de las 22");
    expect(r.categoria).toBe("Ruidos y convivencia");
    expect(r.urgencia).toBe("media");
  });

  it("clasifica limpieza con prioridad baja", () => {
    const r = clasificarPorPalabras("Los vidrios del hall están sucios");
    expect(r.categoria).toBe("Limpieza");
    expect(r.urgencia).toBe("baja");
  });

  it("clasifica administrativo con prioridad baja", () => {
    const r = clasificarPorPalabras("Consulta por el comprobante de expensas");
    expect(r.categoria).toBe("Administrativo");
    expect(r.urgencia).toBe("baja");
  });

  it("cae en mantenimiento general cuando no coincide ninguna regla", () => {
    const r = clasificarPorPalabras("Quisiera saber quién es el encargado");
    expect(r.categoria).toBe("Mantenimiento general");
    expect(r.urgencia).toBe("media");
  });

  it("respeta el orden: ascensor gana sobre otras palabras", () => {
    const r = clasificarPorPalabras("El ascensor tiene una luz quemada");
    expect(r.categoria).toBe("Ascensor");
  });

  it("marca emergencia y fuerza urgente ante palabras de riesgo", () => {
    const r = clasificarPorPalabras("Huele a gas en el pasillo");
    expect(r.emergencia).toBe(true);
    expect(r.urgencia).toBe("urgente");
  });

  it("el override de emergencia pisa la urgencia de la categoría", () => {
    const r = clasificarPorPalabras("Los vidrios están sucios y hay peligro de incendio");
    expect(r.categoria).toBe("Limpieza");
    expect(r.emergencia).toBe(true);
    expect(r.urgencia).toBe("urgente");
  });

  it("no marca emergencia en un reclamo común", () => {
    const r = clasificarPorPalabras("La luz del palier está quemada");
    expect(r.emergencia).toBe(false);
  });

  it("normaliza el resumen: primera letra en mayúscula", () => {
    const r = clasificarPorPalabras("se rompió la cerradura");
    expect(r.resumen).toBe("Se rompió la cerradura");
  });

  it("trunca el resumen a 85 caracteres más elipsis cuando supera 88", () => {
    const largo = "a".repeat(120);
    const r = clasificarPorPalabras(largo);
    expect(r.resumen.length).toBe(86); // 85 caracteres + "…"
    expect(r.resumen.endsWith("…")).toBe(true);
  });

  it("el ámbito por defecto del fallback es común", () => {
    const r = clasificarPorPalabras("La luz del palier está quemada");
    expect(r.ambito).toBe("comun");
  });
});
