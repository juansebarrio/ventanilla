import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { esEstadoAbierto, type Estado, type Urgencia } from "@/lib/domain/claims";
import { fechaDelDia, horaCorta, resumenUnidad } from "@/lib/domain/format";
import { esCategoria, RUBRO_POR_CATEGORIA } from "@/lib/pipeline/categorias";
import type { Database } from "@/lib/supabase/database.types";
import type {
  ArrearsEdificio,
  HoyVM,
  ItemEspera,
  MovimientoFeed,
} from "@/lib/panel/tipos";
import {
  colorPorPeriodos,
  formatDias,
  formatSegundos,
  textoMovimiento,
} from "./format-panel";

type Cliente = SupabaseClient<Database>;

const SEG_POR_DIA = 86_400;

function fechaRelativaTexto(iso: string, ahora: number): string {
  const minutos = Math.floor((ahora - new Date(iso).getTime()) / 60_000);
  if (minutos < 2) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.floor(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
}

export async function cargarHoy(
  supabase: Cliente,
  administrationId: string,
): Promise<HoyVM> {
  const ahora = Date.now();

  const [claimsRes, buildingsRes, categoriesRes] = await Promise.all([
    supabase
      .from("claims")
      .select(
        "id, numero_publico, titulo, categoria_id, urgencia, estado, building_id, created_at, primera_respuesta_at, cerrado_at",
      )
      .eq("administration_id", administrationId),
    supabase
      .from("buildings")
      .select("id, direccion, total_unidades")
      .eq("administration_id", administrationId),
    supabase
      .from("categories")
      .select("id, nombre")
      .eq("administration_id", administrationId),
  ]);

  const claims = claimsRes.data ?? [];
  const buildings = new Map(
    (buildingsRes.data ?? []).map((b) => [b.id, b]),
  );
  const categorias = new Map(
    (categoriesRes.data ?? []).map((c) => [c.id, c.nombre]),
  );

  // ── KPIs ─────────────────────────────────────────────────────────────────
  const abiertos = claims.filter((c) => esEstadoAbierto(c.estado as Estado)).length;
  const urgentes = claims.filter(
    (c) => c.urgencia === "urgente" && esEstadoAbierto(c.estado as Estado),
  ).length;
  const esperanAccion = claims.filter((c) => c.estado === "recibido").length;

  const conPrimera = claims.filter((c) => c.primera_respuesta_at);
  const promedioSeg =
    conPrimera.length === 0
      ? 0
      : conPrimera.reduce(
          (acc, c) =>
            acc +
            (new Date(c.primera_respuesta_at as string).getTime() -
              new Date(c.created_at).getTime()) /
              1000,
          0,
        ) / conPrimera.length;

  const cerrados = claims.filter((c) => c.cerrado_at);
  const promedioDias =
    cerrados.length === 0
      ? 0
      : cerrados.reduce(
          (acc, c) =>
            acc +
            (new Date(c.cerrado_at as string).getTime() -
              new Date(c.created_at).getTime()) /
              1000 /
              SEG_POR_DIA,
          0,
        ) / cerrados.length;

  // ── Esperan tu acción ──────────────────────────────────────────────────────
  const esperan: ItemEspera[] = claims
    .filter((c) => c.estado === "recibido")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((c) => {
      const nombreCat = c.categoria_id ? categorias.get(c.categoria_id) : null;
      const conProveedor =
        !!nombreCat && esCategoria(nombreCat) && RUBRO_POR_CATEGORIA[nombreCat] !== null;
      return {
        claimId: c.id,
        numero: c.numero_publico,
        titulo: c.titulo,
        edificio: buildings.get(c.building_id)?.direccion ?? "",
        urgencia: c.urgencia as Urgencia,
        hace: fechaRelativaTexto(c.created_at, ahora),
        conProveedor,
        href: `/panel/reclamos/${c.numero_publico}`,
      };
    });

  // ── Últimos movimientos ──────────────────────────────────────────────────────
  const numeroPorClaim = new Map(claims.map((c) => [c.id, c.numero_publico]));
  const eventosRes = await supabase
    .from("claim_events")
    .select("id, claim_id, texto, created_at")
    .eq("administration_id", administrationId)
    .neq("tipo", "clasificacion")
    .order("created_at", { ascending: false })
    .limit(5);

  const movimientos: MovimientoFeed[] = (eventosRes.data ?? []).map((e) => ({
    id: e.id,
    hora: horaCorta(new Date(e.created_at)),
    texto: textoMovimiento(e.texto, numeroPorClaim.get(e.claim_id) ?? ""),
  }));

  // ── Expensas adeudadas ───────────────────────────────────────────────────────
  const [arrearsRes, unitsRes] = await Promise.all([
    supabase
      .from("arrears")
      .select("building_id, unit_id, resident_nombre, periodos_adeudados, monto")
      .eq("administration_id", administrationId),
    supabase
      .from("units")
      .select("id, piso, letra, uf_numero")
      .eq("administration_id", administrationId),
  ]);
  const units = new Map((unitsRes.data ?? []).map((u) => [u.id, u]));

  const porEdificio = new Map<string, ArrearsEdificio>();
  for (const a of arrearsRes.data ?? []) {
    const building = buildings.get(a.building_id);
    if (!building) continue;
    let grupo = porEdificio.get(a.building_id);
    if (!grupo) {
      grupo = {
        edificio: building.direccion,
        filas: [],
        totalAdeudado: 0,
        conDeuda: 0,
        totalUnidades: building.total_unidades,
      };
      porEdificio.set(a.building_id, grupo);
    }
    const unidad = a.unit_id ? units.get(a.unit_id) : null;
    grupo.filas.push({
      uf: unidad ? `UF ${String(unidad.uf_numero).padStart(2, "0")}` : "UF",
      nombre: a.resident_nombre,
      unidadResumen: unidad ? resumenUnidad(unidad.piso, unidad.letra) : "",
      periodos: a.periodos_adeudados,
      puntoUrgencia: colorPorPeriodos(a.periodos_adeudados),
      monto: a.monto,
    });
    grupo.totalAdeudado += a.monto;
    grupo.conDeuda += 1;
  }
  const arrearsPorEdificio = [...porEdificio.values()].sort((a, b) =>
    a.edificio.localeCompare(b.edificio),
  );

  return {
    fecha: fechaDelDia(),
    kpis: {
      abiertos,
      urgentes,
      esperanAccion,
      primeraRespuesta: formatSegundos(promedioSeg),
      resolucionPromedio: formatDias(promedioDias),
    },
    esperan,
    movimientos,
    arrearsPorEdificio,
  };
}
