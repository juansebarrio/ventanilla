import Link from "next/link";
import { Boton } from "@/components/Boton";
import { ChipEstado } from "@/components/ChipEstado";
import { ChipUrgencia } from "@/components/ChipUrgencia";
import { Card, CardHeader } from "@/components/Card";
import { IconoCheckCirculo } from "@/components/iconos";
import { Ticket } from "@/components/Ticket";
import type { EsperaConEstado } from "@/lib/panel/tipos";

/**
 * Card "Esperan tu acción": los reclamos en estado recibido. Los de categoría
 * con proveedor de rubro muestran "Emitir orden de trabajo"; el resto,
 * "Revisar". Tras emitir, la fila muestra "OT-XXX emitida · recién" y el badge
 * pasa a EN GESTIÓN.
 */
export function CardEsperan({
  items,
  onEmitir,
  emitiendoId,
  error,
}: {
  items: EsperaConEstado[];
  onEmitir: (claimId: string) => void;
  emitiendoId: string | null;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader titulo="Esperan tu acción" />
      {items.length === 0 ? (
        <div
          className="flex flex-col items-center"
          style={{ gap: "8px", padding: "44px 20px", textAlign: "center" }}
        >
          <IconoCheckCirculo stroke="var(--primario)" />
          <span className="text-tinta-2" style={{ fontSize: "14px" }}>
            No hay reclamos esperando tu acción.
          </span>
        </div>
      ) : (
        <div>
          {items.map((item, i) => (
            <article
              key={item.claimId}
              className="flex items-start"
              style={{
                gap: "14px",
                padding: "18px 20px",
                borderTop: i === 0 ? undefined : "1px solid var(--borde-suave)",
              }}
            >
              <Ticket tamano="chico">{item.numero}</Ticket>

              <div className="flex min-w-0 flex-1 flex-col" style={{ gap: "7px" }}>
                <span
                  className="text-tinta"
                  style={{ fontSize: "15px", fontWeight: 500, lineHeight: "21px" }}
                >
                  {item.titulo}
                </span>
                <span
                  className="flex items-center text-tinta-2"
                  style={{ gap: "12px", fontSize: "13px" }}
                >
                  {item.edificio}
                  <ChipUrgencia urgencia={item.urgencia} textoColoreado />
                  <span className="font-mono text-tinta-3" style={{ fontSize: "12px" }}>
                    {item.hace}
                  </span>
                </span>
              </div>

              <div className="flex flex-col items-end" style={{ gap: "10px" }}>
                <ChipEstado estado={item.emitida ? "en_gestion" : "recibido"} />

                {item.emitida ? (
                  <span
                    className="vtn-anim-in inline-flex items-center"
                    style={{ gap: "6px" }}
                  >
                    <CheckChico />
                    <span
                      className="font-mono font-bold text-primario"
                      style={{ fontSize: "12px" }}
                    >
                      {item.emitida} emitida
                    </span>
                    <span className="text-tinta-3" style={{ fontSize: "12px" }}>
                      recién
                    </span>
                  </span>
                ) : item.conProveedor ? (
                  <Boton
                    variante="primario"
                    tamano="chico"
                    onClick={() => onEmitir(item.claimId)}
                    disabled={emitiendoId === item.claimId}
                  >
                    {emitiendoId === item.claimId
                      ? "Emitiendo…"
                      : "Emitir orden de trabajo"}
                  </Boton>
                ) : (
                  <Link
                    href={item.href}
                    className="inline-flex items-center bg-superficie text-tinta no-underline hover:bg-papel"
                    style={{
                      height: "32px",
                      padding: "0 14px",
                      border: "1px solid var(--borde)",
                      borderRadius: "8px",
                      fontSize: "13px",
                      fontWeight: 500,
                    }}
                  >
                    Revisar
                  </Link>
                )}
              </div>
            </article>
          ))}
          {error ? (
            <p
              role="alert"
              style={{
                fontSize: "13px",
                color: "var(--estado-reabierto-fg)",
                padding: "0 20px 16px",
              }}
            >
              {error}
            </p>
          ) : null}
        </div>
      )}
    </Card>
  );
}

function CheckChico() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--primario)"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
