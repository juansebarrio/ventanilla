"use client";

import { PanelDetalle } from "@/components/panel/detalle/PanelDetalle";
import { accionesDetalleStub, detalleFixture } from "@/lib/fixtures/panel";

export default function PreviewDetalle() {
  return <PanelDetalle vm={detalleFixture} acciones={accionesDetalleStub} />;
}
