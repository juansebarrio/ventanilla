/**
 * Número público con recuadro de borde punteado verde (R-1044, OT-311).
 * Tamaño "grande" para el header del detalle, "chico" para cards y listas.
 * En la tabla el número va como texto plano mono; para eso está TicketPlano.
 */
export function Ticket({
  children,
  tamano = "chico",
}: {
  children: React.ReactNode;
  tamano?: "grande" | "chico";
}) {
  const grande = tamano === "grande";
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-[8px] font-mono font-bold text-primario"
      style={{
        background: "var(--superficie)",
        border: "1.5px dashed var(--primario)",
        padding: grande ? "12px 18px" : "7px 12px",
        fontSize: grande ? "20px" : "13px",
      }}
    >
      {children}
    </span>
  );
}

/** Número mono sin recuadro, como aparece en la tabla y en el texto corrido. */
export function TicketPlano({
  children,
  size = "13px",
}: {
  children: React.ReactNode;
  size?: string;
}) {
  return (
    <span
      className="font-mono font-bold text-primario"
      style={{ fontSize: size }}
    >
      {children}
    </span>
  );
}
