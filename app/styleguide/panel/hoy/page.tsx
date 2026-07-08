"use client";

import { PanelHoy } from "@/components/panel/hoy/PanelHoy";
import { accionesHoyStub, hoyFixture } from "@/lib/fixtures/panel";
import { obtenerAsambleaHoy } from "@/lib/reuniones/servicio";

export default function PreviewHoy() {
  return (
    <PanelHoy
      vm={hoyFixture}
      acciones={accionesHoyStub}
      asamblea={obtenerAsambleaHoy()}
    />
  );
}
