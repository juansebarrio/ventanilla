"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { SelectFiltro } from "@/components/SelectFiltro";
import type { FiltrosReclamos } from "@/lib/panel/tipos";

/*
 * Barra de filtros server-side: cada select reescribe su query param y navega
 * (replace, sin ensuciar el historial). El default de estado es "Abiertos".
 */

const ESTADOS_OPCIONES: { valor: string; label: string }[] = [
  { valor: "abiertos", label: "Abiertos" },
  { valor: "todos", label: "Todos" },
  { valor: "recibido", label: "Recibido" },
  { valor: "en_gestion", label: "En gestión" },
  { valor: "asignado", label: "Asignado" },
  { valor: "resuelto", label: "Resuelto" },
  { valor: "cerrado", label: "Cerrado" },
  { valor: "derivado", label: "Derivado" },
];

const URGENCIAS_OPCIONES: { valor: string; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "urgente", label: "Urgente" },
  { valor: "alta", label: "Alta" },
  { valor: "media", label: "Media" },
  { valor: "baja", label: "Baja" },
];

export function BarraFiltros({
  valores,
  edificios,
  categorias,
}: {
  valores: FiltrosReclamos;
  edificios: string[];
  categorias: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function setParam(clave: string, valor: string, porDefecto: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (valor === porDefecto) params.delete(clave);
    else params.set(clave, valor);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <div className="flex" style={{ gap: "10px", marginBottom: "16px" }}>
      <SelectFiltro
        etiqueta="EDIFICIO"
        value={valores.edificio}
        onChange={(e) => setParam("edificio", e.target.value, "todos")}
      >
        <option value="todos">Todos</option>
        {edificios.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </SelectFiltro>

      <SelectFiltro
        etiqueta="CATEGORÍA"
        value={valores.categoria}
        onChange={(e) => setParam("categoria", e.target.value, "todas")}
      >
        <option value="todas">Todas</option>
        {categorias.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </SelectFiltro>

      <SelectFiltro
        etiqueta="ESTADO"
        value={valores.estado}
        onChange={(e) => setParam("estado", e.target.value, "abiertos")}
      >
        {ESTADOS_OPCIONES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.label}
          </option>
        ))}
      </SelectFiltro>

      <SelectFiltro
        etiqueta="URGENCIA"
        value={valores.urgencia}
        onChange={(e) => setParam("urgencia", e.target.value, "todas")}
      >
        {URGENCIAS_OPCIONES.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.label}
          </option>
        ))}
      </SelectFiltro>
    </div>
  );
}
