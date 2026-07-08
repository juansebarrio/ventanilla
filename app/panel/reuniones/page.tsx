import { PanelReuniones } from "@/components/panel/reuniones/PanelReuniones";
import { requireMiembro } from "@/lib/data/tenant";
import { obtenerReuniones } from "@/lib/reuniones/servicio";

export default async function PaginaReuniones() {
  await requireMiembro();
  const datos = obtenerReuniones();

  return <PanelReuniones datos={datos} />;
}
