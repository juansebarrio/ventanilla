import { VistaAjustes } from "@/components/panel/lectura/VistasLectura";
import { cargarAjustes } from "@/lib/data/lectura";
import { requireMiembro } from "@/lib/data/tenant";

export default async function PaginaAjustes() {
  const { supabase, administrationId, tenantNombre, usuariaNombre, email } =
    await requireMiembro();

  const ajustes = await cargarAjustes(
    supabase,
    administrationId,
    tenantNombre,
    usuariaNombre,
    email,
  );
  return <VistaAjustes ajustes={ajustes} />;
}
