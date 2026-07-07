import type { ReactNode } from "react";

/**
 * Card del sistema: superficie blanca, borde exterior #E5E1D8, radio 10.
 * El header lleva el título en Space Grotesk 500 19px y un divisor interno
 * más claro (#F0EDE6). `acciones` ubica controles a la derecha del título.
 */
export function Card({
  children,
  className = "",
  overflowHidden = false,
}: {
  children: ReactNode;
  className?: string;
  overflowHidden?: boolean;
}) {
  return (
    <section
      className={`rounded-[10px] border border-borde bg-superficie ${
        overflowHidden ? "overflow-hidden" : ""
      } ${className}`}
    >
      {children}
    </section>
  );
}

export function CardTitulo({ children }: { children: ReactNode }) {
  return (
    <h2
      className="m-0 font-display font-medium text-tinta"
      style={{ fontSize: "19px", lineHeight: "26px" }}
    >
      {children}
    </h2>
  );
}

export function CardHeader({
  titulo,
  acciones,
}: {
  titulo: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div
      className="flex items-center justify-between gap-3 border-b border-borde-suave"
      style={{ padding: acciones ? "14px 20px" : "18px 20px 14px" }}
    >
      <CardTitulo>{titulo}</CardTitulo>
      {acciones}
    </div>
  );
}
