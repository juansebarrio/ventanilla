"use client";

import { PanelHoy } from "@/components/panel/hoy/PanelHoy";
import { accionesHoyStub, hoyFixture } from "@/lib/fixtures/panel";

export default function PreviewHoy() {
  return <PanelHoy vm={hoyFixture} acciones={accionesHoyStub} />;
}
