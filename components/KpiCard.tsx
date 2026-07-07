import type { ReactNode } from "react";
import { Card, CardTitulo } from "./Card";

/**
 * Card "Resumen del día": filas tipo leader-dots (label a la izquierda,
 * línea punteada de relleno, valor mono a la derecha). Réplica del export.
 */

export function KpiCard({
  titulo,
  children,
}: {
  titulo: ReactNode;
  children: ReactNode;
}) {
  return (
    <Card>
      <div style={{ padding: "16px 20px 12px" }}>
        <div style={{ marginBottom: "8px" }}>
          <CardTitulo>{titulo}</CardTitulo>
        </div>
        {children}
      </div>
    </Card>
  );
}

export function KpiFila({
  label,
  valor,
  destacado = false,
  nota,
}: {
  label: string;
  valor: string;
  /** Pinta el valor en rojo (KPI de urgentes). */
  destacado?: boolean;
  /** Nota secundaria bajo el valor, alineada a la derecha. */
  nota?: string;
}) {
  return (
    <>
      <div className="flex items-center" style={{ gap: "10px", padding: "7px 0" }}>
        <span
          className="whitespace-nowrap font-sans font-semibold uppercase text-tinta-2"
          style={{ fontSize: "11px", letterSpacing: "0.06em" }}
        >
          {label}
        </span>
        <span
          aria-hidden
          className="flex-1 self-end"
          style={{
            borderBottom: "1px dotted var(--leader-dots)",
            marginBottom: "4px",
          }}
        />
        <span
          className="font-mono font-bold"
          style={{
            fontSize: "16px",
            lineHeight: 1,
            color: destacado ? "var(--urgencia-urgente)" : "var(--tinta)",
          }}
        >
          {valor}
        </span>
      </div>
      {nota ? (
        <div className="flex justify-end" style={{ padding: "0 0 5px" }}>
          <span className="text-tinta-3" style={{ fontSize: "11px" }}>
            {nota}
          </span>
        </div>
      ) : null}
    </>
  );
}
