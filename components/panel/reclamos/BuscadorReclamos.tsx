"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { InputBusqueda } from "@/components/InputBusqueda";

/** Buscador de la bandeja: escribe ?q= en la URL con debounce. */
export function BuscadorReclamos({ valor }: { valor: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [texto, setTexto] = useState(valor);
  const [valorPrevio, setValorPrevio] = useState(valor);

  // Si la URL cambió por fuera (Limpiar filtros, Ver cerrados), el input se
  // realinea con ella; mientras el cambio viene del tipeo, valor acompaña.
  if (valor !== valorPrevio) {
    setValorPrevio(valor);
    setTexto(valor);
  }

  useEffect(() => {
    // Ya sincronizado con la URL: no reescribirla (evita, además, que el
    // efecto re-agregue ?q= después de un Limpiar filtros).
    if (texto.trim() === valor) return;
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (texto.trim()) params.set("q", texto.trim());
      else params.delete("q");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 250);
    return () => clearTimeout(t);
  }, [texto, valor, pathname, router, searchParams]);

  return (
    <InputBusqueda
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      placeholder="Buscar por número, dirección o texto"
      aria-label="Buscar reclamos"
    />
  );
}
