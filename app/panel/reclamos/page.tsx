import { BandejaReclamos } from "@/components/panel/reclamos/BandejaReclamos";
import { cargarReclamos } from "@/lib/data/reclamos";
import { requireMiembro } from "@/lib/data/tenant";
import type { FiltrosReclamos } from "@/lib/panel/tipos";

export default async function PaginaReclamos({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const sp = await searchParams;
  const { supabase, administrationId } = await requireMiembro();

  const filtros: FiltrosReclamos = {
    edificio: sp.edificio ?? "todos",
    categoria: sp.categoria ?? "todas",
    estado: sp.estado ?? "abiertos",
    urgencia: sp.urgencia ?? "todas",
    q: sp.q ?? "",
  };

  const [vm, edificios, categorias] = await Promise.all([
    cargarReclamos(supabase, administrationId, filtros),
    supabase
      .from("buildings")
      .select("direccion")
      .eq("administration_id", administrationId)
      .order("direccion")
      .then((r) => (r.data ?? []).map((b) => b.direccion)),
    supabase
      .from("categories")
      .select("nombre")
      .eq("administration_id", administrationId)
      .order("nombre")
      .then((r) => (r.data ?? []).map((c) => c.nombre)),
  ]);

  return (
    <BandejaReclamos
      vm={vm}
      filtros={filtros}
      edificios={edificios}
      categorias={categorias}
      administrationId={administrationId}
    />
  );
}
