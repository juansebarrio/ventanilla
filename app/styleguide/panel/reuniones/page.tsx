"use client";

import { PanelReuniones } from "@/components/panel/reuniones/PanelReuniones";
import { obtenerReuniones } from "@/lib/reuniones/servicio";

/**
 * Preview de la pantalla Reuniones con los datos del handoff. La simulación
 * emite la confirmación de Estela Quiroga a los 3 segundos, para ver la
 * fila entrar animada y el quórum actualizarse en vivo.
 */
export default function PreviewReuniones() {
  return <PanelReuniones datos={obtenerReuniones()} simularConfirmacion />;
}
