import type { ButtonHTMLAttributes } from "react";

type Variante = "primario" | "secundario" | "terciario";
type Tamano = "grande" | "chico";

/*
 * Botones del sistema. Medidas exactas del export: primario/secundario de
 * 40 px (grande) o 32 px (chico), terciario como link de texto. El hover se
 * define con clases utilitarias sobre los tokens de color.
 */

const CLASES_BASE =
  "inline-flex items-center justify-center gap-2 font-sans font-medium cursor-pointer transition-colors duration-200 ease-out disabled:cursor-default disabled:opacity-60";

const VARIANTES: Record<Variante, string> = {
  primario:
    "rounded-[8px] border-none bg-primario text-white hover:bg-primario-hover",
  secundario:
    "rounded-[8px] bg-superficie text-tinta hover:bg-papel border border-borde",
  terciario:
    "border-none bg-transparent p-0 text-primario hover:text-primario-hover hover:underline",
};

export function Boton({
  variante = "primario",
  tamano = "grande",
  className = "",
  children,
  ...props
}: {
  variante?: Variante;
  tamano?: Tamano;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  const dimensiones =
    variante === "terciario"
      ? { fontSize: "13px" }
      : tamano === "grande"
        ? { height: "40px", padding: "0 18px", fontSize: "14px" }
        : { height: "32px", padding: "0 14px", fontSize: "13px" };

  return (
    <button
      className={`${CLASES_BASE} ${VARIANTES[variante]} ${className}`}
      style={dimensiones}
      {...props}
    >
      {children}
    </button>
  );
}
