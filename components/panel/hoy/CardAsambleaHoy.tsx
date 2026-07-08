import Link from "next/link";
import { Card, CardTitulo } from "@/components/Card";
import type { AsambleaHoyVM } from "@/lib/reuniones/tipos";
import { BarraQuorum } from "@/components/panel/reuniones/BarraQuorum";
import { ChipSello } from "@/components/panel/reuniones/ChipSello";

/*
 * Módulo compacto "Próxima asamblea" del dashboard Hoy: tile de fecha
 * punteado, barra de quórum y acceso a la pantalla Reuniones.
 */
export function CardAsambleaHoy({ asamblea }: { asamblea: AsambleaHoyVM }) {
  return (
    <Card>
      <div style={{ padding: "16px 20px" }}>
        <div
          className="flex items-center justify-between"
          style={{ gap: "10px", marginBottom: "14px" }}
        >
          <CardTitulo>Próxima asamblea</CardTitulo>
          <ChipSello sello="convocada" />
        </div>

        <div className="flex items-center" style={{ gap: "14px", marginBottom: "14px" }}>
          <span
            className="inline-flex flex-col items-center justify-center"
            style={{
              gap: "1px",
              width: "52px",
              height: "52px",
              minWidth: "52px",
              border: "1.5px dashed var(--primario)",
              borderRadius: "8px",
            }}
            aria-hidden
          >
            <span
              className="font-mono font-bold text-primario"
              style={{ fontSize: "19px", lineHeight: 1 }}
            >
              {asamblea.dia}
            </span>
            <span
              className="font-mono font-bold text-tinta-2"
              style={{ fontSize: "10px", letterSpacing: "0.08em" }}
            >
              {asamblea.mes}
            </span>
          </span>
          <span className="flex min-w-0 flex-col" style={{ gap: "3px" }}>
            <span className="font-medium" style={{ fontSize: "14px", lineHeight: "20px" }}>
              {asamblea.titulo}
            </span>
            <span className="text-tinta-3" style={{ fontSize: "12px" }}>
              {asamblea.diaSemana}{" "}
              <span className="font-mono" style={{ fontSize: "11.5px" }}>
                {asamblea.hora}
              </span>{" "}
              · {asamblea.lugar}
            </span>
          </span>
        </div>

        <div style={{ marginBottom: "8px" }}>
          <BarraQuorum
            quorum={{
              confirmadas: asamblea.confirmadas,
              total: asamblea.total,
              minimo: Math.floor(asamblea.total / 2) + 1,
            }}
            conTexto={false}
          />
        </div>

        <div className="flex items-center justify-between" style={{ gap: "10px" }}>
          <span className="text-tinta-3" style={{ fontSize: "12px" }}>
            <span
              className="font-mono font-bold text-tinta"
              style={{ fontSize: "11.5px" }}
            >
              {asamblea.confirmadas} de {asamblea.total}
            </span>{" "}
            unidades confirmaron
          </span>
          <Link
            href="/panel/reuniones"
            className="font-medium text-primario no-underline hover:text-primario-hover hover:underline"
            style={{ fontSize: "13px" }}
          >
            Ver reunión
          </Link>
        </div>
      </div>
    </Card>
  );
}
