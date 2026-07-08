"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/Card";
import { SelectFiltro } from "@/components/SelectFiltro";
import { formatMonto } from "@/lib/domain/format";
import { PUNTO_URGENCIA } from "@/lib/domain/estilos";
import type { ArrearsEdificio } from "@/lib/panel/tipos";

/** Card "Expensas adeudadas" con selector de edificio y totales de arrears. */
export function CardExpensas({
  arrearsPorEdificio,
}: {
  arrearsPorEdificio: ArrearsEdificio[];
}) {
  const [edificio, setEdificio] = useState(
    arrearsPorEdificio[0]?.edificio ?? "",
  );
  const actual =
    arrearsPorEdificio.find((a) => a.edificio === edificio) ??
    arrearsPorEdificio[0];

  return (
    <Card>
      <CardHeader
        titulo="Expensas adeudadas"
        acciones={
          <SelectFiltro
            etiqueta="EDIFICIO"
            value={edificio}
            onChange={(e) => setEdificio(e.target.value)}
          >
            {arrearsPorEdificio.map((a) => (
              <option key={a.edificio} value={a.edificio}>
                {a.edificio}
              </option>
            ))}
          </SelectFiltro>
        }
      />

      {actual ? (
        <div>
          {actual.filas.map((fila) => (
            <div
              key={fila.uf}
              className="flex items-center"
              style={{
                gap: "14px",
                padding: "13px 20px",
                borderBottom: "1px solid var(--borde-suave)",
              }}
            >
              <span
                className="whitespace-nowrap font-mono font-bold text-tinta-2"
                style={{ width: "52px", fontSize: "12px" }}
              >
                {fila.uf}
              </span>
              <span className="flex min-w-0 flex-1 flex-col" style={{ gap: "3px" }}>
                <span
                  className="text-tinta"
                  style={{ fontSize: "14px", fontWeight: 500, lineHeight: "20px" }}
                >
                  {fila.nombre}
                </span>
                <span
                  className="inline-flex items-center text-tinta-3"
                  style={{ gap: "6px", fontSize: "12px" }}
                >
                  {fila.unidadResumen} ·
                  <span
                    aria-hidden
                    className="inline-block rounded-full"
                    style={{
                      width: "8px",
                      height: "8px",
                      background: PUNTO_URGENCIA[fila.puntoUrgencia],
                    }}
                  />
                  <span className="font-semibold text-tinta-2" style={{ fontSize: "12px" }}>
                    {fila.periodos} {fila.periodos === 1 ? "período" : "períodos"}
                  </span>
                </span>
              </span>
              <span
                className="whitespace-nowrap font-mono font-bold text-tinta"
                style={{ fontSize: "14px" }}
              >
                {formatMonto(fila.monto)}
              </span>
            </div>
          ))}

          <div className="flex items-center" style={{ gap: "10px", padding: "14px 20px 4px" }}>
            <span
              className="whitespace-nowrap font-sans font-semibold uppercase text-tinta-2"
              style={{ fontSize: "11px", letterSpacing: "0.06em" }}
            >
              Total adeudado
            </span>
            <span
              aria-hidden
              className="flex-1 self-end"
              style={{ borderBottom: "1px dotted var(--leader-dots)", marginBottom: "4px" }}
            />
            <span
              className="font-mono font-bold text-tinta"
              style={{ fontSize: "16px", lineHeight: 1 }}
            >
              {formatMonto(actual.totalAdeudado)}
            </span>
          </div>
          <div style={{ padding: "0 20px 16px" }}>
            <span className="text-tinta-3" style={{ fontSize: "12px" }}>
              {actual.conDeuda} de {actual.totalUnidades} unidades con deuda
            </span>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
