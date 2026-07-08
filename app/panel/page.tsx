import { PanelHoy } from "@/components/panel/hoy/PanelHoy";
import { cargarHoy } from "@/lib/data/hoy";
import { requireMiembro } from "@/lib/data/tenant";
import { emitirOrden } from "./actions";

export default async function PaginaHoy() {
  const { supabase, administrationId } = await requireMiembro();
  const vm = await cargarHoy(supabase, administrationId);

  return <PanelHoy vm={vm} acciones={{ emitirOrden }} />;
}
