import { ESTADO_LABELS, type Estado } from "@/lib/domain/claims";
import { CHIP_ESTADO } from "@/lib/domain/estilos";

/**
 * Chip de estado del reclamo. Texto en mayúsculas, con aria-label legible
 * ("Estado: Asignado"). Colores exactos por estado desde design-reference.
 */
export function ChipEstado({ estado }: { estado: Estado }) {
  const { bg, fg } = CHIP_ESTADO[estado];
  const label = ESTADO_LABELS[estado];
  return (
    <span
      aria-label={`Estado: ${label}`}
      className="inline-flex items-center whitespace-nowrap rounded-[4px] font-sans font-semibold uppercase"
      style={{
        background: bg,
        color: fg,
        fontSize: "11px",
        letterSpacing: "0.08em",
        padding: "4px 10px",
      }}
    >
      {label}
    </span>
  );
}
