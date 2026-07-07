import { URGENCIA_LABELS, type Urgencia } from "@/lib/domain/claims";
import { PUNTO_URGENCIA } from "@/lib/domain/estilos";

/**
 * Urgencia como punto de color + etiqueta. En la bandeja, el texto de
 * "Urgente" toma el rojo de su punto; el resto de las urgencias usan el gris
 * secundario. En el detalle y otras superficies el texto siempre va en gris.
 */
export function ChipUrgencia({
  urgencia,
  textoColoreado = false,
}: {
  urgencia: Urgencia;
  textoColoreado?: boolean;
}) {
  const color = PUNTO_URGENCIA[urgencia];
  const label = URGENCIA_LABELS[urgencia];
  const textoRojo = textoColoreado && urgencia === "urgente";
  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`Urgencia: ${label}`}
    >
      <span
        aria-hidden
        className="inline-block rounded-full"
        style={{ width: "8px", height: "8px", background: color }}
      />
      <span
        className="font-sans font-semibold"
        style={{
          fontSize: "12px",
          color: textoRojo ? color : "var(--tinta-2)",
        }}
      >
        {label}
      </span>
    </span>
  );
}
