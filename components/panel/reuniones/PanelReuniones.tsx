"use client";

import { useEffect, useState } from "react";
import { Boton } from "@/components/Boton";
import { IconoMas } from "@/components/iconos";
import {
  enviarActa,
  suscribirConfirmaciones,
  textoPlanoActa,
} from "@/lib/reuniones/servicio";
import type { Confirmacion, DatosReuniones } from "@/lib/reuniones/tipos";
import { CardAsamblea } from "./CardAsamblea";
import { CardEstadoActa } from "./CardEstadoActa";
import { CardIngresantes } from "./CardIngresantes";
import { DocumentoActa } from "./DocumentoActa";

/*
 * Pantalla Reuniones. Client component que orquesta el estado compartido:
 * las confirmaciones que llegan por WhatsApp actualizan listado, contador
 * y quórum en vivo, y el envío del acta cambia chip y sello a la vez.
 * "Convocar asamblea" queda decorativo en Fase 0, como "Nuevo reclamo".
 */
export function PanelReuniones({
  datos,
  simularConfirmacion = false,
}: {
  datos: DatosReuniones;
  /** Emite una confirmación de muestra a los 3 s (previews de styleguide). */
  simularConfirmacion?: boolean;
}) {
  const [nuevas, setNuevas] = useState<Confirmacion[]>([]);
  const [enviada, setEnviada] = useState(datos.acta.estado === "enviada");

  useEffect(() => {
    return suscribirConfirmaciones(
      (confirmacion) => setNuevas((prev) => [confirmacion, ...prev]),
      { simular: simularConfirmacion },
    );
  }, [simularConfirmacion]);

  const quorum = {
    confirmadas: datos.confirmadasTotal + nuevas.length,
    total: datos.asamblea.totalUnidades,
    minimo: datos.asamblea.quorumMinimo,
  };

  function enviar() {
    setEnviada(true);
    void enviarActa(datos.acta.id);
  }

  async function copiarTexto() {
    try {
      await navigator.clipboard.writeText(textoPlanoActa(datos.acta));
    } catch {
      // Sin permiso de portapapeles el feedback igual confirma la acción.
    }
  }

  return (
    <main style={{ flex: 1, minWidth: 0, maxWidth: "1200px", padding: "30px 32px 56px" }}>
      <header
        className="flex items-center justify-between"
        style={{ gap: "16px", marginBottom: "20px" }}
      >
        <h1
          className="font-display font-bold text-tinta"
          style={{ fontSize: "26px", lineHeight: "32px" }}
        >
          Reuniones
        </h1>
        <Boton variante="secundario">
          <IconoMas />
          Convocar asamblea
        </Boton>
      </header>

      <section
        className="grid items-start"
        style={{ gridTemplateColumns: "62fr 38fr", gap: "20px" }}
      >
        <div className="flex flex-col" style={{ gap: "20px" }}>
          <CardAsamblea asamblea={datos.asamblea} quorum={quorum} />
          <DocumentoActa acta={datos.acta} enviada={enviada} />
        </div>
        <div className="flex flex-col" style={{ gap: "20px" }}>
          <CardIngresantes
            confirmaciones={datos.confirmaciones}
            nuevas={nuevas}
            confirmadasTotal={datos.confirmadasTotal}
            totalUnidades={datos.asamblea.totalUnidades}
          />
          <CardEstadoActa
            acta={datos.acta}
            enviada={enviada}
            onEnviar={enviar}
            onCopiarTexto={copiarTexto}
          />
        </div>
      </section>
    </main>
  );
}
