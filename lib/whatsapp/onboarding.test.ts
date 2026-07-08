import { describe, expect, it } from "vitest";
import {
  avanzarOnboarding,
  elegirEdificio,
  iniciarOnboarding,
  parsearUnidad,
  type SesionOnboarding,
} from "./onboarding";

const EDIFICIOS = [
  { id: "b-yerbal", direccion: "Yerbal 1240", alias: "Yerbal" },
  { id: "b-loreto", direccion: "Virrey Loreto 2680", alias: "Virrey Loreto" },
];

const UNIDADES = [
  { id: "u-5b", piso: "5", letra: "B", building_id: "b-yerbal" },
  { id: "u-pb", piso: "PB", letra: null, building_id: "b-yerbal" },
  { id: "u-2a", piso: "2", letra: "A", building_id: "b-loreto" },
];

const CONTEXTO = { edificios: EDIFICIOS, unidades: UNIDADES };

describe("parsearUnidad", () => {
  it("acepta piso y letra en todas las formas comunes", () => {
    expect(parsearUnidad("5B")).toEqual({ piso: "5", letra: "B" });
    expect(parsearUnidad("5°B")).toEqual({ piso: "5", letra: "B" });
    expect(parsearUnidad("5 b")).toEqual({ piso: "5", letra: "B" });
    expect(parsearUnidad("05b")).toEqual({ piso: "5", letra: "B" });
  });

  it("acepta planta baja con y sin letra", () => {
    expect(parsearUnidad("pb")).toEqual({ piso: "PB", letra: null });
    expect(parsearUnidad("Planta Baja")).toEqual({ piso: "PB", letra: null });
    expect(parsearUnidad("pb a")).toEqual({ piso: "PB", letra: "A" });
  });

  it("rechaza lo que no es una unidad", () => {
    expect(parsearUnidad("hola")).toBeNull();
    expect(parsearUnidad("piso 500")).toBeNull();
    expect(parsearUnidad("")).toBeNull();
  });
});

describe("elegirEdificio", () => {
  it("elige por número de opción", () => {
    expect(elegirEdificio("1", EDIFICIOS)?.id).toBe("b-yerbal");
    expect(elegirEdificio("2", EDIFICIOS)?.id).toBe("b-loreto");
  });

  it("elige por nombre, sin importar tildes ni mayúsculas", () => {
    expect(elegirEdificio("yerbal", EDIFICIOS)?.id).toBe("b-yerbal");
    expect(elegirEdificio("Vivo en Virrey Loreto", EDIFICIOS)?.id).toBe("b-loreto");
  });

  it("devuelve null si no reconoce nada", () => {
    expect(elegirEdificio("otro lado", EDIFICIOS)).toBeNull();
    expect(elegirEdificio("3", EDIFICIOS)).toBeNull();
  });
});

describe("flujo completo del onboarding", () => {
  it("guarda el reclamo inicial y lo devuelve al completar", () => {
    const inicio = iniciarOnboarding(EDIFICIOS, "se rompió el portero");
    expect(inicio.sesion.paso).toBe("edificio");
    expect(inicio.mensaje).toContain("1 para Yerbal 1240");

    const paso2 = avanzarOnboarding(inicio.sesion, "1", CONTEXTO);
    expect(paso2.tipo).toBe("responder");
    if (paso2.tipo !== "responder") return;
    expect(paso2.sesion.paso).toBe("unidad");
    expect(paso2.mensaje).toContain("Yerbal 1240");

    const paso3 = avanzarOnboarding(paso2.sesion, "5°B", CONTEXTO);
    expect(paso3.tipo).toBe("responder");
    if (paso3.tipo !== "responder") return;
    expect(paso3.sesion.paso).toBe("nombre");

    const fin = avanzarOnboarding(paso3.sesion, "Norma  Juárez", CONTEXTO);
    expect(fin.tipo).toBe("completar");
    if (fin.tipo !== "completar") return;
    expect(fin.nombre).toBe("Norma Juárez");
    expect(fin.unitId).toBe("u-5b");
    expect(fin.buildingId).toBe("b-yerbal");
    expect(fin.textoInicial).toBe("se rompió el portero");
    expect(fin.mensaje).toContain("Norma Juárez");
    expect(fin.mensaje).toContain("5°B");
    expect(fin.mensaje).toContain("Ya registro tu reclamo.");
  });

  it("repregunta ante respuestas inválidas sin perder el paso", () => {
    const inicio = iniciarOnboarding(EDIFICIOS, null);

    const edificioMalo = avanzarOnboarding(inicio.sesion, "no sé", CONTEXTO);
    expect(edificioMalo.tipo).toBe("responder");
    if (edificioMalo.tipo !== "responder") return;
    expect(edificioMalo.sesion.paso).toBe("edificio");

    const sesionUnidad: SesionOnboarding = {
      paso: "unidad",
      datos: { building_id: "b-yerbal" },
    };
    const unidadMala = avanzarOnboarding(sesionUnidad, "9Z", CONTEXTO);
    expect(unidadMala.tipo).toBe("responder");
    if (unidadMala.tipo !== "responder") return;
    expect(unidadMala.sesion.paso).toBe("unidad");

    // La unidad existe pero en el otro edificio: no vale.
    const unidadAjena = avanzarOnboarding(sesionUnidad, "2A", CONTEXTO);
    expect(unidadAjena.tipo).toBe("responder");
    if (unidadAjena.tipo !== "responder") return;
    expect(unidadAjena.sesion.paso).toBe("unidad");

    const sesionNombre: SesionOnboarding = {
      paso: "nombre",
      datos: { building_id: "b-yerbal", unit_id: "u-pb" },
    };
    const nombreCorto = avanzarOnboarding(sesionNombre, "a", CONTEXTO);
    expect(nombreCorto.tipo).toBe("responder");
    if (nombreCorto.tipo !== "responder") return;
    expect(nombreCorto.sesion.paso).toBe("nombre");
  });

  it("sin reclamo inicial pide el reclamo al final", () => {
    const sesionNombre: SesionOnboarding = {
      paso: "nombre",
      datos: { building_id: "b-yerbal", unit_id: "u-pb" },
    };
    const fin = avanzarOnboarding(sesionNombre, "Elsa Domínguez", CONTEXTO);
    expect(fin.tipo).toBe("completar");
    if (fin.tipo !== "completar") return;
    expect(fin.textoInicial).toBeNull();
    expect(fin.mensaje).toContain("Contame qué pasó");
    expect(fin.mensaje).toContain("PB");
  });

  it("una sesión inconsistente vuelve a arrancar sin romper", () => {
    const rota: SesionOnboarding = { paso: "unidad", datos: {} };
    const resultado = avanzarOnboarding(rota, "5B", CONTEXTO);
    expect(resultado.tipo).toBe("responder");
    if (resultado.tipo !== "responder") return;
    expect(resultado.sesion.paso).toBe("edificio");
  });
});
