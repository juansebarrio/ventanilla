import type { SelectHTMLAttributes } from "react";
import { IconoChevron } from "./iconos";

/**
 * Filtro de selección del panel: etiqueta en mayúsculas + <select> nativo
 * sin apariencia + chevron. Estilo exacto del export (barra de Reclamos y
 * selector de edificio de la card de expensas).
 */
export function SelectFiltro({
  etiqueta,
  children,
  className = "",
  id,
  ...props
}: {
  etiqueta: string;
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const selectId = id ?? `filtro-${etiqueta.toLowerCase().replace(/\s+/g, "-")}`;
  return (
    <label
      htmlFor={selectId}
      className={`relative flex items-center bg-superficie ${className}`}
      style={{
        gap: "8px",
        height: "36px",
        padding: "0 12px",
        border: "1px solid var(--borde)",
        borderRadius: "8px",
      }}
    >
      <span
        className="font-sans font-semibold uppercase text-tinta-3"
        style={{ fontSize: "11px", letterSpacing: "0.06em" }}
      >
        {etiqueta}
      </span>
      <select
        id={selectId}
        className="cursor-pointer appearance-none border-none bg-transparent font-sans font-medium text-tinta outline-none"
        style={{ fontSize: "14px", paddingRight: "18px" }}
        {...props}
      >
        {children}
      </select>
      <IconoChevron
        stroke="var(--tinta-3)"
        className="pointer-events-none absolute"
        style={{ right: "10px" }}
      />
    </label>
  );
}
