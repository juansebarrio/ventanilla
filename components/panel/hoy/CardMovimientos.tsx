import { Card, CardHeader } from "@/components/Card";
import { TokensResaltados } from "@/components/panel/comunes/TokensResaltados";
import type { MovimientoFeed } from "@/lib/panel/tipos";

/** Card "Últimos movimientos": feed de claim_events, hora en Space Mono. */
export function CardMovimientos({
  movimientos,
}: {
  movimientos: MovimientoFeed[];
}) {
  return (
    <Card>
      <CardHeader titulo="Últimos movimientos" />
      <div>
        {movimientos.map((m, i) => (
          <div
            key={m.id}
            className="flex items-baseline"
            style={{
              gap: "12px",
              padding: "12px 20px",
              borderTop: i === 0 ? undefined : "1px solid var(--borde-suave)",
            }}
          >
            <span
              className="font-mono text-tinta-3"
              style={{ fontSize: "12px", minWidth: "38px" }}
            >
              {m.hora}
            </span>
            <span className="text-tinta-2" style={{ fontSize: "13px", lineHeight: "18px" }}>
              <TokensResaltados texto={m.texto} />
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
