/*
 * Chips sello del módulo Reuniones. Mismo patrón que los chips de estado
 * de reclamos: rectangulares, radio 4, 11/600 con tracking. Los colores
 * salen del handoff y reutilizan la paleta existente.
 */

export type SelloReunion =
  | "convocada"
  | "virtual"
  | "presencial"
  | "borrador"
  | "enviada";

const SELLOS: Record<SelloReunion, { bg: string; fg: string; label: string }> = {
  convocada: { bg: "var(--estado-asignado-bg)", fg: "var(--estado-asignado-fg)", label: "CONVOCADA" },
  virtual: { bg: "var(--estado-asignado-bg)", fg: "var(--estado-asignado-fg)", label: "VIRTUAL" },
  presencial: { bg: "var(--estado-recibido-bg)", fg: "var(--estado-recibido-fg)", label: "PRESENCIAL" },
  borrador: { bg: "var(--estado-gestion-bg)", fg: "var(--estado-gestion-fg)", label: "BORRADOR" },
  enviada: { bg: "var(--estado-resuelto-bg)", fg: "var(--estado-resuelto-fg)", label: "ENVIADA" },
};

const LABEL_LEGIBLE: Record<SelloReunion, string> = {
  convocada: "Convocada",
  virtual: "Virtual",
  presencial: "Presencial",
  borrador: "Borrador",
  enviada: "Enviada",
};

export function ChipSello({
  sello,
  chico = false,
  animado = false,
}: {
  sello: SelloReunion;
  /** Versión compacta de las filas de Ingresantes (3×8). */
  chico?: boolean;
  animado?: boolean;
}) {
  const { bg, fg, label } = SELLOS[sello];
  return (
    <span
      aria-label={`Estado: ${LABEL_LEGIBLE[sello]}`}
      className={`inline-flex items-center whitespace-nowrap font-sans font-semibold ${animado ? "vtn-anim-in" : ""}`}
      style={{
        background: bg,
        color: fg,
        fontSize: "11px",
        letterSpacing: "0.08em",
        padding: chico ? "3px 8px" : "4px 10px",
        borderRadius: "4px",
      }}
    >
      {label}
    </span>
  );
}

/** Sello de goma del documento del acta: solo contorno, rotado −5°. */
export function SelloDocumento({ estado }: { estado: "borrador" | "enviada" }) {
  const color = estado === "borrador" ? "var(--estado-gestion-fg)" : "var(--primario)";
  return (
    <span
      aria-label={`Estado del acta: ${LABEL_LEGIBLE[estado]}`}
      className={`absolute font-sans font-semibold ${estado === "enviada" ? "vtn-anim-in" : ""}`}
      style={{
        top: "26px",
        right: "26px",
        transform: "rotate(-5deg)",
        border: `1.5px solid ${color}`,
        color,
        fontSize: "11px",
        letterSpacing: "0.12em",
        padding: "5px 12px",
        borderRadius: "4px",
      }}
    >
      {estado === "borrador" ? "BORRADOR" : "ENVIADA"}
    </span>
  );
}
