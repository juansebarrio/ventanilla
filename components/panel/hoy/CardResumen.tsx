import { KpiCard, KpiFila } from "@/components/KpiCard";
import type { KpisHoy } from "@/lib/panel/tipos";

/** Card "Resumen del día": los cinco KPIs como filas leader-dots. */
export function CardResumen({ kpis }: { kpis: KpisHoy }) {
  return (
    <KpiCard titulo="Resumen del día">
      <KpiFila label="Abiertos" valor={String(kpis.abiertos)} />
      <KpiFila label="Urgentes" valor={String(kpis.urgentes)} destacado />
      <KpiFila label="Esperan tu acción" valor={String(kpis.esperanAccion)} />
      <KpiFila
        label="Primera respuesta"
        valor={kpis.primeraRespuesta}
        nota="automática, todos los reclamos"
      />
      <KpiFila label="Resolución promedio" valor={kpis.resolucionPromedio} />
    </KpiCard>
  );
}
