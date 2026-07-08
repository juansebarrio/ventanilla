import { VistaEdificios } from "@/components/panel/lectura/VistasLectura";
import { cargarEdificios } from "@/lib/data/lectura";
import { requireMiembro } from "@/lib/data/tenant";

export default async function PaginaEdificios() {
  const { supabase, administrationId } = await requireMiembro();
  const edificios = await cargarEdificios(supabase, administrationId);
  return <VistaEdificios edificios={edificios} />;
}
