"use client";

import { useState, useTransition } from "react";
import { horaCorta } from "@/lib/domain/format";
import type {
  AccionesHoy,
  EsperaConEstado,
  HoyVM,
  KpisHoy,
  MovimientoFeed,
} from "@/lib/panel/tipos";
import type { AsambleaHoyVM } from "@/lib/reuniones/tipos";
import { CardAsambleaHoy } from "./CardAsambleaHoy";
import { CardEsperan } from "./CardEsperan";
import { CardExpensas } from "./CardExpensas";
import { CardMovimientos } from "./CardMovimientos";
import { CardResumen } from "./CardResumen";

/**
 * Pantalla Hoy. Client component que orquesta la emisión optimista de la OT,
 * igual que el prototipo: al emitir, la fila muestra "OT-XXX emitida · recién",
 * el KPI "esperan tu acción" baja y el feed suma el movimiento, sin recargar.
 * La server action solo persiste; en una recarga real la base manda.
 */
export function PanelHoy({
  vm,
  acciones,
  asamblea,
}: {
  vm: HoyVM;
  acciones: AccionesHoy;
  /** Módulo "Próxima asamblea" (Reuniones); sin datos no se muestra. */
  asamblea?: AsambleaHoyVM;
}) {
  const [kpis, setKpis] = useState<KpisHoy>(vm.kpis);
  const [esperan, setEsperan] = useState<EsperaConEstado[]>(() =>
    vm.esperan.map((e) => ({ ...e, emitida: null })),
  );
  const [movimientos, setMovimientos] = useState<MovimientoFeed[]>(vm.movimientos);
  const [emitiendoId, setEmitiendoId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  function emitir(claimId: string) {
    const item = esperan.find((e) => e.claimId === claimId);
    if (!item || item.emitida) return;
    setError(null);
    setEmitiendoId(claimId);
    iniciar(async () => {
      const r = await acciones.emitirOrden(claimId);
      setEmitiendoId(null);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setEsperan((prev) =>
        prev.map((e) => (e.claimId === claimId ? { ...e, emitida: r.numeroOT } : e)),
      );
      setKpis((prev) => ({
        ...prev,
        esperanAccion: Math.max(0, prev.esperanAccion - 1),
      }));
      setMovimientos((prev) =>
        [
          {
            id: `opt-${r.numeroOT}`,
            hora: horaCorta(new Date()),
            texto: `${r.numeroOT} emitida (${item.numero})`,
          },
          ...prev,
        ].slice(0, 5),
      );
    });
  }

  return (
    <main style={{ flex: 1, minWidth: 0, maxWidth: "1200px", padding: "30px 32px 56px" }}>
      <header
        className="flex items-baseline justify-between"
        style={{ marginBottom: "22px" }}
      >
        <h1
          className="font-display font-bold text-tinta"
          style={{ fontSize: "26px", lineHeight: "32px" }}
        >
          Hoy
        </h1>
        <span className="text-tinta-2" style={{ fontSize: "15px" }}>
          {vm.fecha}
        </span>
      </header>

      <section
        className="grid items-start"
        style={{ gridTemplateColumns: "3fr 2fr", gap: "20px" }}
      >
        <div className="flex flex-col" style={{ gap: "20px" }}>
          <CardEsperan
            items={esperan}
            onEmitir={emitir}
            emitiendoId={emitiendoId}
            error={error}
          />
          <CardExpensas arrearsPorEdificio={vm.arrearsPorEdificio} />
        </div>
        <div className="flex flex-col" style={{ gap: "20px" }}>
          <CardResumen kpis={kpis} />
          {asamblea ? <CardAsambleaHoy asamblea={asamblea} /> : null}
          <CardMovimientos movimientos={movimientos} />
        </div>
      </section>
    </main>
  );
}
