"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { InputBusqueda } from "@/components/InputBusqueda";

/** Buscador de la bandeja: escribe ?q= en la URL con debounce. */
export function BuscadorReclamos({ valor }: { valor: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [texto, setTexto] = useState(valor);
  const primera = useRef(true);

  useEffect(() => {
    if (primera.current) {
      primera.current = false;
      return;
    }
    const t = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (texto.trim()) params.set("q", texto.trim());
      else params.delete("q");
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    }, 250);
    return () => clearTimeout(t);
  }, [texto, pathname, router, searchParams]);

  return (
    <InputBusqueda
      value={texto}
      onChange={(e) => setTexto(e.target.value)}
      placeholder="Buscar por número, dirección o texto"
      aria-label="Buscar reclamos"
    />
  );
}
