"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  TablaReclamosFila,
  TablaReclamosHeader,
  type FilaReclamo,
} from "@/components/TablaReclamos";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Cuerpo de la tabla con Realtime. Cuando entra un reclamo nuevo al tenant
 * (por ejemplo desde el simulador), refresca el server component y marca la
 * fila nueva con la animación de entrada. Sin administrationId (styleguide) no
 * se suscribe.
 */
export function TablaReclamosLive({
  filas,
  administrationId,
}: {
  filas: FilaReclamo[];
  administrationId?: string;
}) {
  const router = useRouter();

  // Filas nuevas = las que no estaban en el render anterior (tras un refresh de
  // Realtime). Patrón de React de ajustar estado durante el render al cambiar
  // la prop: sin efectos ni refs, y sin animar en el primer render.
  const [filasPrevias, setFilasPrevias] = useState(filas);
  const [nuevos, setNuevos] = useState<Set<string>>(() => new Set());
  if (filas !== filasPrevias) {
    const previos = new Set(filasPrevias.map((f) => f.numero));
    setNuevos(new Set(filas.filter((f) => !previos.has(f.numero)).map((f) => f.numero)));
    setFilasPrevias(filas);
  }

  useEffect(() => {
    if (!administrationId) return;
    const supabase = createSupabaseBrowserClient();
    const canal = supabase
      .channel(`claims:${administrationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "claims",
          filter: `administration_id=eq.${administrationId}`,
        },
        () => router.refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(canal);
    };
  }, [administrationId, router]);

  return (
    <div>
      <TablaReclamosHeader />
      {filas.map((fila) => (
        <TablaReclamosFila
          key={fila.numero}
          fila={{ ...fila, nueva: nuevos.has(fila.numero) }}
        />
      ))}
    </div>
  );
}
