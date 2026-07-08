import { describe, expect, it } from "vitest";
import { calcularQuorum } from "@/components/panel/reuniones/BarraQuorum";
import { obtenerReuniones, textoPlanoActa, textoVotos } from "./servicio";

describe("textoVotos", () => {
  it("arma la línea con y sin abstenciones", () => {
    expect(textoVotos({ favor: 12, contra: 3, abstenciones: 1 })).toBe(
      "12 a favor · 3 en contra · 1 abstención",
    );
    expect(textoVotos({ favor: 14, contra: 2, abstenciones: 0 })).toBe(
      "14 a favor · 2 en contra",
    );
    expect(textoVotos({ favor: 10, contra: 1, abstenciones: 2 })).toBe(
      "10 a favor · 1 en contra · 2 abstenciones",
    );
  });
});

describe("textoPlanoActa", () => {
  it("replica el texto plano literal del prototipo", () => {
    const texto = textoPlanoActa(obtenerReuniones().acta);
    expect(texto).toBe(
      [
        "ACTA N° 47 · ASAMBLEA EXTRAORDINARIA",
        "Consorcio Yerbal 1240 · Ciudad Autónoma de Buenos Aires",
        "2 de julio de 2026 · 19:04 a 20:38 · SUM y virtual",
        "",
        "En la Ciudad Autónoma de Buenos Aires, a los 2 días del mes de julio de 2026, siendo las 19:04, se reúnen en asamblea extraordinaria los propietarios del edificio de la calle Yerbal 1240, en el salón de usos múltiples de planta baja y por videollamada, convocados por Administración Iribarne.",
        "Preside la asamblea la Sra. Marta Gorosito (5°B). Actúa como secretario de actas el Sr. Roberto Etcheverry (2°A). Con 16 unidades funcionales presentes sobre 24 —10 en el salón y 6 conectadas— se declara válida la sesión en primera convocatoria.",
        "",
        "ORDEN DEL DÍA Y RESOLUCIONES",
        "1. Impermeabilización de la terraza y filtraciones asociadas. Presentados tres presupuestos, se aprueba el de Techados Camet por $ 4.850.000, pagadero en tres cuotas por expensas extraordinarias. La obra comienza la semana del 20 de julio. 12 a favor · 3 en contra · 1 abstención.",
        "2. Actualización del fondo de reserva. Se aprueba llevar el fondo de reserva del 5 al 8 por ciento del presupuesto mensual, a partir de la liquidación de agosto. 14 a favor · 2 en contra.",
        "3. Varios. El 3°A solicita la reparación de la puerta del ascensor de su piso. Queda registrado como reclamo R-1032. Sin más temas que tratar, siendo las 20:38 se levanta la sesión.",
        "",
        "Marta Gorosito · Presidenta de asamblea",
        "Roberto Etcheverry · Secretario de actas",
        "Carla Méndez · Administración Iribarne",
      ].join("\n"),
    );
  });
});

describe("calcularQuorum", () => {
  it("alcanzado: 14 de 24 con mínimo 13, barra al 58", () => {
    const q = calcularQuorum({ confirmadas: 14, total: 24, minimo: 13 });
    expect(q).toEqual({ pct: 58, alcanzado: true, estadoTexto: "quórum alcanzado" });
  });

  it("con una confirmación nueva pasa a 62", () => {
    const q = calcularQuorum({ confirmadas: 15, total: 24, minimo: 13 });
    expect(q.pct).toBe(63);
    expect(q.alcanzado).toBe(true);
  });

  it("sin quórum informa cuántas faltan, singular y plural", () => {
    expect(calcularQuorum({ confirmadas: 11, total: 24, minimo: 13 })).toMatchObject({
      alcanzado: false,
      estadoTexto: "faltan 2 unidades para el quórum",
    });
    expect(calcularQuorum({ confirmadas: 12, total: 24, minimo: 13 })).toMatchObject({
      alcanzado: false,
      estadoTexto: "faltan 1 unidad para el quórum",
    });
  });
});
