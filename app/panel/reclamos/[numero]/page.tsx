import { notFound } from "next/navigation";
import { PanelDetalle } from "@/components/panel/detalle/PanelDetalle";
import { cargarDetalle } from "@/lib/data/detalle";
import { requireMiembro } from "@/lib/data/tenant";
import {
  cambiarEstado,
  derivar,
  marcarResuelto,
  reasignarUnidad,
  responder,
} from "../../actions";

export default async function PaginaDetalle({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero } = await params;
  const { supabase, administrationId } = await requireMiembro();
  const vm = await cargarDetalle(supabase, administrationId, numero);
  if (!vm) notFound();

  return (
    <PanelDetalle
      vm={vm}
      acciones={{ responder, marcarResuelto, cambiarEstado, derivar, reasignarUnidad }}
    />
  );
}
