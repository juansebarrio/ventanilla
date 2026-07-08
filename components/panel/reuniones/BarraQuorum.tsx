/*
 * Barra de quórum: 6 px, radio 3, track #E8E6DF. Verde cuando el quórum
 * está alcanzado; ámbar mientras falte. El texto acompaña con la cifra en
 * mono y el estado en color.
 */

export type QuorumVM = {
  confirmadas: number;
  total: number;
  minimo: number;
};

export function calcularQuorum(q: QuorumVM) {
  const pct = Math.round((q.confirmadas / q.total) * 100);
  const alcanzado = q.confirmadas >= q.minimo;
  const faltan = q.minimo - q.confirmadas;
  return {
    pct,
    alcanzado,
    estadoTexto: alcanzado
      ? "quórum alcanzado"
      : `faltan ${faltan} ${faltan === 1 ? "unidad" : "unidades"} para el quórum`,
  };
}

export function BarraQuorum({
  quorum,
  conTexto = true,
}: {
  quorum: QuorumVM;
  conTexto?: boolean;
}) {
  const { pct, alcanzado, estadoTexto } = calcularQuorum(quorum);
  return (
    <>
      <div
        role="progressbar"
        aria-label="Quórum"
        aria-valuemin={0}
        aria-valuemax={quorum.total}
        aria-valuenow={quorum.confirmadas}
        aria-valuetext={`${quorum.confirmadas} de ${quorum.total} unidades confirmaron`}
        className="relative overflow-hidden"
        style={{ height: "6px", borderRadius: "3px", background: "#E8E6DF" }}
      >
        <div
          className="absolute inset-y-0 left-0 transition-all duration-200 ease-out"
          style={{
            borderRadius: "3px",
            background: alcanzado ? "var(--primario)" : "var(--urgencia-alta)",
            width: `${pct}%`,
          }}
        />
      </div>
      {conTexto ? (
        <span className="text-tinta-2" style={{ fontSize: "13px" }}>
          <span
            className="font-mono font-bold text-tinta"
            style={{ fontSize: "12.5px" }}
          >
            {quorum.confirmadas} de {quorum.total}
          </span>{" "}
          unidades confirmaron ·{" "}
          <span
            className="font-semibold"
            style={{
              color: alcanzado ? "var(--estado-resuelto-fg)" : "var(--estado-gestion-fg)",
            }}
          >
            {estadoTexto}
          </span>
        </span>
      ) : null}
    </>
  );
}
