"use client";

import type { InputHTMLAttributes } from "react";
import { IconoLupa } from "./iconos";

/**
 * Campo de búsqueda con lupa a la izquierda. El anillo de foco verde suave
 * (box-shadow 3px #E3EDE7) del export se aplica en :focus.
 */
export function InputBusqueda({
  className = "",
  style,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={`relative ${className}`}>
      <IconoLupa
        stroke="var(--tinta-3)"
        className="pointer-events-none absolute"
        style={{ left: "12px", top: "11px" }}
      />
      <input
        type="text"
        className="font-sans font-medium text-tinta outline-none"
        style={{
          height: "40px",
          width: "340px",
          maxWidth: "100%",
          border: "1px solid var(--borde)",
          borderRadius: "8px",
          background: "var(--superficie)",
          padding: "0 14px 0 38px",
          fontSize: "14px",
          ...style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "var(--primario)";
          e.currentTarget.style.boxShadow = "0 0 0 3px var(--primario-suave)";
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = "var(--borde)";
          e.currentTarget.style.boxShadow = "none";
        }}
        {...props}
      />
    </div>
  );
}
