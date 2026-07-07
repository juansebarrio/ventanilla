import Link from "next/link";
import type { ReactNode } from "react";
import type { Estado, Urgencia } from "@/lib/domain/claims";
import { ChipEstado } from "./ChipEstado";
import { ChipUrgencia } from "./ChipUrgencia";
import { TicketPlano } from "./Ticket";

/*
 * Tabla de la bandeja de reclamos. El grid de columnas es idéntico al del
 * export y se comparte entre el header y cada fila. Las filas urgentes se
 * tiñen con un overlay rosado; la fila puede enlazar al detalle.
 */

const GRID = "80px minmax(0,1fr) 160px 96px 172px 118px 106px";

const COLUMNAS = [
  "N°",
  "RECLAMO",
  "CATEGORÍA",
  "URGENCIA",
  "EDIFICIO Y UNIDAD",
  "ESTADO",
  "ÚLTIMA ACTIVIDAD",
];

export type FilaReclamo = {
  numero: string;
  titulo: string;
  categoria: string;
  urgencia: Urgencia;
  ubicacion: string;
  estado: Estado;
  actividad: string;
  href?: string;
  urgente?: boolean;
  nueva?: boolean;
};

export function TablaReclamosHeader() {
  return (
    <div
      className="grid border-b border-borde"
      style={{ gridTemplateColumns: GRID, gap: "12px", padding: "12px 20px" }}
      role="row"
    >
      {COLUMNAS.map((c) => (
        <span
          key={c}
          role="columnheader"
          className="font-sans font-semibold uppercase text-tinta-3"
          style={{ fontSize: "12px", letterSpacing: "0.06em" }}
        >
          {c}
        </span>
      ))}
    </div>
  );
}

function CeldaTexto({
  children,
  color = "var(--tinta-2)",
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <span className="relative" style={{ fontSize: "14px", color }}>
      {children}
    </span>
  );
}

export function TablaReclamosFila({ fila }: { fila: FilaReclamo }) {
  const contenido = (
    <>
      {fila.urgente ? (
        <div
          aria-hidden
          className="pointer-events-none absolute"
          style={{ inset: 0, background: "var(--fila-urgente)" }}
        />
      ) : null}
      <span className="relative">
        <TicketPlano>{fila.numero}</TicketPlano>
      </span>
      <span
        className="relative font-sans font-medium text-tinta"
        style={{ fontSize: "14px", lineHeight: "20px" }}
      >
        {fila.titulo}
      </span>
      <CeldaTexto>{fila.categoria}</CeldaTexto>
      <span className="relative">
        <ChipUrgencia urgencia={fila.urgencia} textoColoreado />
      </span>
      <CeldaTexto>{fila.ubicacion}</CeldaTexto>
      <span className="relative">
        <ChipEstado estado={fila.estado} />
      </span>
      <span
        className="relative font-mono text-tinta-3"
        style={{ fontSize: "12px" }}
      >
        {fila.actividad}
      </span>
    </>
  );

  const estilo = {
    gridTemplateColumns: GRID,
    gap: "12px",
    padding: "15px 20px",
    borderBottom: "1px solid var(--borde-suave)",
  } as const;

  const clases = `vtn-fila-reclamo relative grid items-center ${
    fila.nueva ? "vtn-anim-in" : ""
  }`;

  if (fila.href) {
    return (
      <Link
        href={fila.href}
        role="row"
        className={`${clases} no-underline text-tinta`}
        style={estilo}
      >
        {contenido}
      </Link>
    );
  }

  return (
    <div role="row" className={clases} style={estilo}>
      {contenido}
    </div>
  );
}
