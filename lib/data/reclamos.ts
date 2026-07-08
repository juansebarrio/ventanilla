import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { OPEN_ESTADOS, type Estado, type Urgencia } from "@/lib/domain/claims";
import { resumenUnidad } from "@/lib/domain/format";
import type { Database } from "@/lib/supabase/database.types";
import type { FilaReclamo, FiltrosReclamos, ReclamosVM } from "@/lib/panel/tipos";

type Cliente = SupabaseClient<Database>;

function fechaRelativaTexto(iso: string, ahora: number): string {
  const minutos = Math.floor((ahora - new Date(iso).getTime()) / 60_000);
  if (minutos < 2) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

/**
 * Bandeja de reclamos. Trae todas las del tenant (≈46 filas) y filtra en TS:
 * más simple que combinar .or()/ILIKE sobre columnas de tablas unidas, y el
 * conteo total sale sin una segunda query.
 */
export async function cargarReclamos(
  supabase: Cliente,
  administrationId: string,
  filtros: FiltrosReclamos,
): Promise<ReclamosVM> {
  const ahora = Date.now();

  const [claimsRes, buildingsRes, categoriesRes, unitsRes] = await Promise.all([
    supabase
      .from("claims")
      .select(
        "numero_publico, titulo, categoria_id, urgencia, estado, building_id, unit_id, created_at",
      )
      .eq("administration_id", administrationId)
      .order("created_at", { ascending: false }),
    supabase.from("buildings").select("id, direccion").eq("administration_id", administrationId),
    supabase.from("categories").select("id, nombre").eq("administration_id", administrationId),
    supabase
      .from("units")
      .select("id, piso, letra")
      .eq("administration_id", administrationId),
  ]);

  const buildings = new Map((buildingsRes.data ?? []).map((b) => [b.id, b.direccion]));
  const categorias = new Map((categoriesRes.data ?? []).map((c) => [c.id, c.nombre]));
  const units = new Map((unitsRes.data ?? []).map((u) => [u.id, u]));
  const claims = claimsRes.data ?? [];

  const q = filtros.q.trim().toLowerCase();

  const enriquecidas = claims.map((c) => {
    const edificio = buildings.get(c.building_id) ?? "";
    const unidad = c.unit_id ? units.get(c.unit_id) : null;
    const unidadResumen = unidad ? resumenUnidad(unidad.piso, unidad.letra) : "";
    const categoria = (c.categoria_id ? categorias.get(c.categoria_id) : "") ?? "";
    const ubicacion = unidadResumen ? `${edificio} · ${unidadResumen}` : edificio;
    const fila: FilaReclamo = {
      numero: c.numero_publico,
      titulo: c.titulo,
      categoria,
      urgencia: c.urgencia as Urgencia,
      ubicacion,
      estado: c.estado as Estado,
      actividad: fechaRelativaTexto(c.created_at, ahora),
      href: `/panel/reclamos/${c.numero_publico}`,
      urgente: c.urgencia === "urgente",
    };
    return { fila, edificio, categoria, unidadResumen };
  });

  const filas = enriquecidas
    .filter(({ fila, edificio, categoria, unidadResumen }) => {
      if (filtros.edificio !== "todos" && edificio !== filtros.edificio) return false;
      if (filtros.categoria !== "todas" && categoria !== filtros.categoria) return false;
      if (filtros.estado === "abiertos") {
        if (!(OPEN_ESTADOS as readonly string[]).includes(fila.estado)) return false;
      } else if (filtros.estado !== "todos") {
        if (fila.estado !== filtros.estado) return false;
      }
      if (filtros.urgencia !== "todas" && fila.urgencia !== filtros.urgencia) return false;
      if (q) {
        const heno = [
          fila.numero,
          fila.titulo,
          edificio,
          categoria,
          unidadResumen,
        ]
          .join(" ")
          .toLowerCase();
        if (!heno.includes(q)) return false;
      }
      return true;
    })
    .map(({ fila }) => fila);

  const filtrando =
    q !== "" ||
    filtros.edificio !== "todos" ||
    filtros.categoria !== "todas" ||
    filtros.estado !== "abiertos" ||
    filtros.urgencia !== "todas";

  return { filas, visibles: filas.length, total: claims.length, filtrando };
}
