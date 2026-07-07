/** Las diez categorías cerradas del sistema y su mapeo a rubros de proveedor. */

export const CATEGORIAS = [
  "Ascensor",
  "Seguridad y accesos",
  "Plomería y pérdidas",
  "Filtraciones y humedad",
  "Electricidad",
  "Ruidos y convivencia",
  "Limpieza",
  "Administrativo",
  "Expensas y pagos",
  "Mantenimiento general",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export function esCategoria(valor: string): valor is Categoria {
  return (CATEGORIAS as readonly string[]).includes(valor);
}

/**
 * Rubro de proveedor que atiende cada categoría, para emitir la orden de
 * trabajo. Las categorías sin proveedor de rubro (ruidos, administrativo,
 * expensas, mantenimiento general) no generan OT automática.
 */
export const RUBRO_POR_CATEGORIA: Record<Categoria, string | null> = {
  Ascensor: "ascensor",
  "Seguridad y accesos": "seguridad_accesos",
  "Plomería y pérdidas": "plomeria_filtraciones",
  "Filtraciones y humedad": "plomeria_filtraciones",
  Electricidad: "electricidad",
  "Ruidos y convivencia": null,
  Limpieza: "limpieza",
  Administrativo: null,
  "Expensas y pagos": null,
  "Mantenimiento general": null,
};
