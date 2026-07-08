"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Pie de la bandeja: conteo real y accesos. Sin filtros muestra "N de M
 * reclamos · Ver cerrados"; filtrando, "N de M reclamos coinciden · Limpiar
 * filtros"; sin resultados, el estado vacío.
 */
export function PieReclamos({
  visibles,
  total,
  filtrando,
}: {
  visibles: number;
  total: number;
  filtrando: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function verCerrados() {
    const params = new URLSearchParams(searchParams.toString());
    params.set("estado", "cerrado");
    router.replace(`${pathname}?${params.toString()}`);
  }

  function limpiar() {
    router.replace(pathname);
  }

  // El prototipo mantiene la línea de conteo también sin resultados: el
  // estado vacío se muestra encima del pie, no en su lugar.
  const pie = (
    <div className="flex items-center" style={{ gap: "6px", padding: "14px 20px" }}>
      <span className="text-tinta-3" style={{ fontSize: "13px" }}>
        {visibles} de {total} {visibles === 1 ? "reclamo" : "reclamos"}
        {filtrando ? " coinciden" : ""} ·
      </span>
      {filtrando ? (
        <BotonLink onClick={limpiar}>Limpiar filtros</BotonLink>
      ) : (
        <BotonLink onClick={verCerrados}>Ver cerrados</BotonLink>
      )}
    </div>
  );

  if (visibles === 0) {
    return (
      <>
        <div
          className="flex flex-col items-center"
          style={{ gap: "8px", padding: "44px 20px", textAlign: "center" }}
        >
          <span className="text-tinta-2" style={{ fontSize: "14px" }}>
            Ningún reclamo coincide con esos filtros.
          </span>
          <BotonLink onClick={limpiar}>Limpiar filtros</BotonLink>
        </div>
        {pie}
      </>
    );
  }

  return pie;
}

function BotonLink({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer border-none bg-transparent p-0 font-sans font-medium text-primario hover:underline"
      style={{ fontSize: "13px" }}
    >
      {children}
    </button>
  );
}
