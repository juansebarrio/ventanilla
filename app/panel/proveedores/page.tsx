import { VistaProveedores } from "@/components/panel/lectura/VistasLectura";
import { cargarProveedores } from "@/lib/data/lectura";
import { requireMiembro } from "@/lib/data/tenant";

export default async function PaginaProveedores() {
  const { supabase, administrationId } = await requireMiembro();
  const proveedores = await cargarProveedores(supabase, administrationId);
  return <VistaProveedores proveedores={proveedores} />;
}
