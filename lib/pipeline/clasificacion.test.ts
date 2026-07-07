import { describe, expect, it } from "vitest";
import { ClasificacionSchema } from "./clasificar";
import { normalizarResumen } from "./resumen";

describe("ClasificacionSchema", () => {
  const valida = {
    categoria: "Filtraciones y humedad",
    urgencia: "alta",
    ambito: "comun",
    unidad_mencionada: "5°B",
    resumen: "Filtración en la pared del living",
    emergencia: false,
    confianza: 0.82,
  };

  it("acepta una clasificación bien formada", () => {
    expect(ClasificacionSchema.parse(valida)).toEqual(valida);
  });

  it("acepta unidad_mencionada nula", () => {
    const r = ClasificacionSchema.parse({ ...valida, unidad_mencionada: null });
    expect(r.unidad_mencionada).toBeNull();
  });

  it("normaliza unidad_mencionada vacía a null sin descartar la clasificación", () => {
    const r = ClasificacionSchema.parse({ ...valida, unidad_mencionada: "" });
    expect(r.unidad_mencionada).toBeNull();
    expect(r.categoria).toBe("Filtraciones y humedad");
  });

  it("rechaza una categoría fuera de la lista cerrada", () => {
    expect(() =>
      ClasificacionSchema.parse({ ...valida, categoria: "Jardinería" }),
    ).toThrow();
  });

  it("rechaza una urgencia inválida", () => {
    expect(() =>
      ClasificacionSchema.parse({ ...valida, urgencia: "critica" }),
    ).toThrow();
  });

  it("rechaza un ámbito inválido", () => {
    expect(() =>
      ClasificacionSchema.parse({ ...valida, ambito: "externo" }),
    ).toThrow();
  });

  it("rechaza confianza fuera del rango 0-1", () => {
    expect(() => ClasificacionSchema.parse({ ...valida, confianza: 1.5 })).toThrow();
    expect(() => ClasificacionSchema.parse({ ...valida, confianza: -0.1 })).toThrow();
  });

  it("rechaza emergencia con tipo incorrecto", () => {
    expect(() =>
      ClasificacionSchema.parse({ ...valida, emergencia: "sí" }),
    ).toThrow();
  });

  it("rechaza un campo faltante", () => {
    const { resumen, ...sinResumen } = valida;
    void resumen;
    expect(() => ClasificacionSchema.parse(sinResumen)).toThrow();
  });
});

describe("normalizarResumen", () => {
  it("capitaliza la primera letra", () => {
    expect(normalizarResumen("pérdida de agua")).toBe("Pérdida de agua");
  });

  it("recorta los extremos sin colapsar el espaciado interno (como el prototipo)", () => {
    expect(normalizarResumen("  hay   ruido  ")).toBe("Hay   ruido");
  });

  it("trunca a 85 más elipsis cuando supera 88", () => {
    const r = normalizarResumen("x".repeat(100));
    expect(r.length).toBe(86);
    expect(r.endsWith("…")).toBe(true);
  });

  it("no parte pares surrogate al truncar (emoji en el corte)", () => {
    const texto = "a".repeat(84) + "🚀" + "b".repeat(10);
    const r = normalizarResumen(texto);
    expect(r.isWellFormed()).toBe(true);
    expect(r.endsWith("…")).toBe(true);
  });

  it("deja intacto un resumen de largo permitido", () => {
    const texto = "Cerradura de la puerta de entrada rota";
    expect(normalizarResumen(texto)).toBe(texto);
  });
});
