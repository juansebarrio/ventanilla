import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { maskPhone } from "@/lib/domain/format";
import type { Database } from "@/lib/supabase/database.types";
import type { AjustesVM, EdificioVM, ProveedorVM } from "@/lib/panel/tipos";

type Cliente = SupabaseClient<Database>;

export async function cargarEdificios(
  supabase: Cliente,
  administrationId: string,
): Promise<EdificioVM[]> {
  const [buildingsRes, arrearsRes] = await Promise.all([
    supabase
      .from("buildings")
      .select("id, direccion, alias, total_unidades")
      .eq("administration_id", administrationId)
      // El edificio más grande primero, mismo criterio que la card de
      // expensas del Panel Hoy (Yerbal 1240 antes que Virrey Loreto 2680).
      .order("total_unidades", { ascending: false })
      .order("direccion"),
    supabase.from("arrears").select("building_id").eq("administration_id", administrationId),
  ]);

  const deudaPorEdificio = new Map<string, number>();
  for (const a of arrearsRes.data ?? []) {
    deudaPorEdificio.set(a.building_id, (deudaPorEdificio.get(a.building_id) ?? 0) + 1);
  }

  return (buildingsRes.data ?? []).map((b) => ({
    direccion: b.direccion,
    alias: b.alias,
    totalUnidades: b.total_unidades,
    unidadesConDeuda: deudaPorEdificio.get(b.id) ?? 0,
  }));
}

const RUBRO_LABEL: Record<string, string> = {
  plomeria_filtraciones: "Plomería y filtraciones",
  seguridad_accesos: "Seguridad y accesos",
  ascensor: "Ascensor",
  electricidad: "Electricidad",
  limpieza: "Limpieza",
};

export async function cargarProveedores(
  supabase: Cliente,
  administrationId: string,
): Promise<ProveedorVM[]> {
  const [providersRes, vinculosRes, buildingsRes] = await Promise.all([
    supabase
      .from("providers")
      .select("id, nombre, rubro, contacto")
      .eq("administration_id", administrationId)
      .order("nombre"),
    supabase
      .from("provider_buildings")
      .select("provider_id, building_id")
      .eq("administration_id", administrationId),
    supabase.from("buildings").select("id, direccion").eq("administration_id", administrationId),
  ]);

  const direcciones = new Map((buildingsRes.data ?? []).map((b) => [b.id, b.direccion]));
  const edificiosPorProveedor = new Map<string, string[]>();
  for (const v of vinculosRes.data ?? []) {
    const dir = direcciones.get(v.building_id);
    if (!dir) continue;
    const lista = edificiosPorProveedor.get(v.provider_id) ?? [];
    lista.push(dir);
    edificiosPorProveedor.set(v.provider_id, lista);
  }

  return (providersRes.data ?? []).map((p) => ({
    nombre: p.nombre,
    rubro: RUBRO_LABEL[p.rubro] ?? p.rubro,
    contacto: maskPhone(p.contacto),
    edificios: (edificiosPorProveedor.get(p.id) ?? []).sort(),
  }));
}

export async function cargarAjustes(
  supabase: Cliente,
  administrationId: string,
  tenantNombre: string,
  usuariaNombre: string,
  email: string,
): Promise<AjustesVM> {
  const [edificiosRes, proveedoresRes, categoriasRes] = await Promise.all([
    supabase
      .from("buildings")
      .select("id", { count: "exact", head: true })
      .eq("administration_id", administrationId),
    supabase
      .from("providers")
      .select("id", { count: "exact", head: true })
      .eq("administration_id", administrationId),
    supabase
      .from("categories")
      .select("nombre")
      .eq("administration_id", administrationId)
      .order("nombre"),
  ]);

  return {
    tenantNombre,
    usuariaNombre,
    email,
    edificios: edificiosRes.count ?? 0,
    proveedores: proveedoresRes.count ?? 0,
    categorias: (categoriasRes.data ?? []).map((c) => c.nombre),
  };
}
