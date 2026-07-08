import { Card, CardHeader } from "@/components/Card";
import type { Confirmacion } from "@/lib/reuniones/tipos";
import { ChipSello } from "./ChipSello";

/*
 * Listado de ingresantes: se arma solo con las respuestas por WhatsApp a
 * la convocatoria. Las confirmaciones nuevas entran arriba, animadas, y
 * actualizan contador, pie y quórum.
 */

function Fila({ confirmacion, nueva }: { confirmacion: Confirmacion; nueva: boolean }) {
  return (
    <li
      className={`flex items-center border-b border-borde-suave ${nueva ? "vtn-anim-in" : ""}`}
      style={{ gap: "12px", padding: "11px 20px" }}
    >
      <span
        className="font-mono font-bold text-tinta-2"
        style={{ width: "46px", minWidth: "46px", fontSize: "12px" }}
      >
        {confirmacion.uf}
      </span>
      <span className="flex min-w-0 flex-1 flex-col" style={{ gap: "2px" }}>
        <span className="font-medium" style={{ fontSize: "14px", lineHeight: "19px" }}>
          {confirmacion.nombre}
        </span>
        <span className="text-tinta-3" style={{ fontSize: "12px" }}>
          {confirmacion.unidad}
        </span>
      </span>
      <span className="flex flex-col items-end" style={{ gap: "4px" }}>
        <ChipSello sello={confirmacion.modo} chico />
        <span className="font-mono text-tinta-3" style={{ fontSize: "11px" }}>
          {confirmacion.hora}
        </span>
      </span>
    </li>
  );
}

export function CardIngresantes({
  confirmaciones,
  nuevas,
  confirmadasTotal,
  totalUnidades,
}: {
  confirmaciones: Confirmacion[];
  nuevas: Confirmacion[];
  confirmadasTotal: number;
  totalUnidades: number;
}) {
  // Total confirmado = base + nuevas; visibles = filas base + nuevas. El
  // resumen "y N más" cuenta las confirmadas que no están en el listado.
  const confirmadas = confirmadasTotal + nuevas.length;
  const masConfirmaron = confirmadasTotal - confirmaciones.length;
  const faltanResponder = totalUnidades - confirmadas;

  return (
    <Card overflowHidden>
      <CardHeader
        titulo="Ingresantes"
        acciones={
          <span
            className="font-mono font-bold text-primario"
            style={{ fontSize: "14px" }}
          >
            {confirmadas}/{totalUnidades}
          </span>
        }
      />
      <ul className="m-0 list-none p-0">
        {nuevas.map((c) => (
          <Fila key={c.uf} confirmacion={c} nueva />
        ))}
        {confirmaciones.map((c) => (
          <Fila key={c.uf} confirmacion={c} nueva={false} />
        ))}
      </ul>
      <div style={{ padding: "12px 20px" }}>
        <span
          className="block text-tinta-3"
          style={{ fontSize: "12px", marginBottom: "6px" }}
        >
          {masConfirmaron > 0
            ? `y ${masConfirmaron} ${masConfirmaron === 1 ? "unidad más confirmó" : "unidades más confirmaron"} · faltan responder ${faltanResponder}`
            : `faltan responder ${faltanResponder}`}
        </span>
        <span className="block text-tinta-3" style={{ fontSize: "12px" }}>
          El listado se arma solo con las respuestas por WhatsApp a la convocatoria.
        </span>
      </div>
    </Card>
  );
}
