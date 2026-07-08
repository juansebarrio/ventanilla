"use client";

import { useState } from "react";
import { Card, CardTitulo } from "@/components/Card";
import { IconoCheck } from "@/components/iconos";
import { Ticket } from "@/components/Ticket";
import type { OrdenTrabajoVM } from "@/lib/panel/tipos";

/** Card "Orden de trabajo": datos de la OT y toggle del texto enviado. */
export function CardOrdenTrabajo({ orden }: { orden: OrdenTrabajoVM }) {
  const [abierta, setAbierta] = useState(false);

  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <CardTitulo>Orden de trabajo</CardTitulo>
        </div>

        <div className="flex items-center" style={{ gap: "12px" }}>
          <Ticket tamano="chico">{orden.numero}</Ticket>
          <div className="flex flex-col" style={{ gap: "2px" }}>
            <span className="text-tinta" style={{ fontSize: "14px", fontWeight: 500 }}>
              {orden.proveedor}
            </span>
            <span className="text-tinta-3" style={{ fontSize: "12px" }}>
              enviada{" "}
              <span className="font-mono" style={{ fontSize: "12px" }}>
                {orden.enviadaHora}
              </span>
            </span>
          </div>
        </div>

        {orden.visitaConfirmada ? (
          <div
            className="flex items-center"
            style={{
              gap: "8px",
              marginTop: "14px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--estado-resuelto-bg)",
            }}
          >
            <IconoCheck stroke="var(--estado-resuelto-fg)" />
            <span
              className="font-medium"
              style={{ fontSize: "13px", color: "var(--estado-resuelto-fg)" }}
            >
              Visita confirmada: {orden.visitaConfirmada}
            </span>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => setAbierta((v) => !v)}
          className="mt-3.5 cursor-pointer border-none bg-transparent p-0 font-sans font-medium text-primario hover:underline"
          style={{ fontSize: "13px", marginTop: "14px" }}
          aria-expanded={abierta}
        >
          {abierta ? "Ocultar texto enviado" : "Ver texto enviado"}
        </button>

        {abierta ? (
          <div
            className="vtn-anim-in"
            style={{
              marginTop: "10px",
              padding: "12px 14px",
              borderRadius: "8px",
              background: "var(--papel)",
              border: "1px dashed var(--borde)",
            }}
          >
            <p
              className="m-0 font-mono text-tinta-2"
              style={{ fontSize: "12px", lineHeight: "19px" }}
            >
              {orden.textoEnviado}
            </p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
