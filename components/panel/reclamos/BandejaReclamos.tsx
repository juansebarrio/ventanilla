import { Boton } from "@/components/Boton";
import { Card } from "@/components/Card";
import { IconoMas } from "@/components/iconos";
import type { FiltrosReclamos, ReclamosVM } from "@/lib/panel/tipos";
import { BarraFiltros } from "./BarraFiltros";
import { BuscadorReclamos } from "./BuscadorReclamos";
import { PieReclamos } from "./PieReclamos";
import { TablaReclamosLive } from "./TablaReclamosLive";

/**
 * Bandeja de reclamos completa. Presentacional: la página real la alimenta con
 * datos de Supabase y el administrationId (para Realtime); el styleguide, con
 * fixtures y sin administrationId.
 */
export function BandejaReclamos({
  vm,
  filtros,
  edificios,
  categorias,
  administrationId,
}: {
  vm: ReclamosVM;
  filtros: FiltrosReclamos;
  edificios: string[];
  categorias: string[];
  administrationId?: string;
}) {
  return (
    <main style={{ flex: 1, minWidth: 0, maxWidth: "1200px", padding: "30px 32px 56px" }}>
      <header
        className="flex items-center justify-between"
        style={{ marginBottom: "16px", gap: "16px" }}
      >
        <h1
          className="font-display font-bold text-tinta"
          style={{ fontSize: "26px", lineHeight: "32px" }}
        >
          Reclamos
        </h1>
        <div className="flex items-center" style={{ gap: "12px" }}>
          <BuscadorReclamos valor={filtros.q} />
          <Boton
            variante="secundario"
            disabled
            title="Disponible en la próxima fase"
          >
            <IconoMas />
            Nuevo reclamo
          </Boton>
        </div>
      </header>

      <BarraFiltros valores={filtros} edificios={edificios} categorias={categorias} />

      <Card overflowHidden>
        <TablaReclamosLive filas={vm.filas} administrationId={administrationId} />
        <PieReclamos
          visibles={vm.visibles}
          total={vm.total}
          filtrando={vm.filtrando}
        />
      </Card>
    </main>
  );
}
