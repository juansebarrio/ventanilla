"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Boton } from "@/components/Boton";
import { Card } from "@/components/Card";
import { ChipEstado } from "@/components/ChipEstado";
import { ChipUrgencia } from "@/components/ChipUrgencia";
import { IconoEnviar } from "@/components/iconos";
import { ESTADO_LABELS, type Estado } from "@/lib/domain/claims";
import { horaCorta } from "@/lib/domain/format";
import type {
  AccionesDetalle,
  DetalleVM,
  ItemTimeline,
  Resultado,
} from "@/lib/panel/tipos";
import { CardAcciones } from "./CardAcciones";
import { CardDatos } from "./CardDatos";
import { CardOrdenTrabajo } from "./CardOrdenTrabajo";
import { Timeline } from "./Timeline";

/**
 * Pantalla de detalle. Client component que orquesta las acciones sobre el
 * reclamo (responder, resolver, cambiar estado, derivar, reasignar) de forma
 * optimista, como el prototipo: nunca recarga; la burbuja o el evento aparece
 * al instante y la server action persiste en segundo plano.
 */
export function PanelDetalle({
  vm,
  acciones,
}: {
  vm: DetalleVM;
  acciones: AccionesDetalle;
}) {
  const [estado, setEstado] = useState<Estado>(vm.estado);
  const [timeline, setTimeline] = useState<ItemTimeline[]>(vm.timeline);
  const [respuesta, setRespuesta] = useState("");
  const [pendiente, setPendiente] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorRespuesta, setErrorRespuesta] = useState<string | null>(null);
  const [, iniciar] = useTransition();

  function agregar(item: ItemTimeline) {
    setTimeline((prev) => [...prev, item]);
  }

  function enviarRespuesta() {
    const texto = respuesta.trim();
    if (!texto) return;
    setErrorRespuesta(null);
    setRespuesta("");
    agregar({
      clase: "administracion",
      id: `opt-msg-${Date.now()}`,
      hora: horaCorta(new Date()),
      texto,
    });
    iniciar(async () => {
      const r = await acciones.responder(vm.claimId, texto);
      if (!r.ok) setErrorRespuesta(r.error);
    });
  }

  function aplicarCambio(
    hacia: Estado,
    accion: () => Promise<Resultado>,
    textoEvento: string,
  ) {
    setError(null);
    setPendiente(true);
    iniciar(async () => {
      const r = await accion();
      setPendiente(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      setEstado(hacia);
      agregar({
        clase: "evento",
        id: `opt-ev-${Date.now()}`,
        hora: horaCorta(new Date()),
        tipo: "estado",
        texto: textoEvento,
      });
    });
  }

  function reasignar(unitId: string) {
    const unidad = vm.unidades.find((u) => u.id === unitId);
    setError(null);
    setPendiente(true);
    iniciar(async () => {
      const r = await acciones.reasignarUnidad(vm.claimId, unitId);
      setPendiente(false);
      if (!r.ok) {
        setError(r.error);
        return;
      }
      agregar({
        clase: "evento",
        id: `opt-re-${Date.now()}`,
        hora: horaCorta(new Date()),
        tipo: "nota",
        texto: `Reclamo reasignado a ${unidad?.resumen ?? "otra unidad"}`,
      });
    });
  }

  return (
    <main style={{ flex: 1, minWidth: 0, maxWidth: "1200px", padding: "26px 32px 56px" }}>
      <nav
        className="flex items-center"
        style={{ gap: "8px", marginBottom: "18px", fontSize: "13px" }}
        aria-label="Ubicación"
      >
        <Link href="/panel/reclamos" className="text-tinta-2 no-underline hover:text-primario">
          Reclamos
        </Link>
        <span className="text-tinta-3">/</span>
        <span className="font-mono font-bold text-primario" style={{ fontSize: "12.5px" }}>
          {vm.numero}
        </span>
      </nav>

      <header style={{ marginBottom: "22px" }}>
        <div className="flex flex-wrap items-center" style={{ gap: "14px" }}>
          <span
            className="inline-flex items-center whitespace-nowrap rounded-[8px] font-mono font-bold text-primario"
            style={{
              background: "var(--superficie)",
              border: "1.5px dashed var(--primario)",
              padding: "12px 18px",
              fontSize: "20px",
            }}
          >
            {vm.numero}
          </span>
          <h1
            className="font-display font-bold text-tinta"
            style={{ fontSize: "26px", lineHeight: "32px" }}
          >
            {vm.titulo}
          </h1>
          <ChipEstado estado={estado} />
          <ChipUrgencia urgencia={vm.urgencia} />
        </div>
        <p className="m-0 text-tinta-3" style={{ fontSize: "13px", marginTop: "10px" }}>
          {vm.subtitulo}
        </p>
      </header>

      <div
        className="grid items-start"
        style={{ gridTemplateColumns: "62fr 38fr", gap: "20px" }}
      >
        <Card>
          <Timeline items={timeline} />
          <div
            className="flex items-center"
            style={{ gap: "10px", padding: "16px 20px", borderTop: "1px solid var(--borde-suave)" }}
          >
            <input
              type="text"
              value={respuesta}
              onChange={(e) => setRespuesta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") enviarRespuesta();
              }}
              placeholder="Responder como Administración Iribarne"
              aria-label="Responder"
              className="flex-1 font-sans text-tinta outline-none"
              style={{
                height: "40px",
                border: "1px solid var(--borde)",
                borderRadius: "8px",
                background: "var(--superficie)",
                padding: "0 14px",
                fontSize: "14px",
              }}
            />
            <Boton variante="primario" onClick={enviarRespuesta}>
              <IconoEnviar />
              Enviar
            </Boton>
          </div>
          {errorRespuesta ? (
            <p
              role="alert"
              className="m-0"
              style={{
                fontSize: "13px",
                color: "var(--estado-reabierto-fg)",
                padding: "0 20px 14px",
              }}
            >
              {errorRespuesta}
            </p>
          ) : null}
        </Card>

        <div className="flex flex-col" style={{ gap: "16px" }}>
          <CardDatos datos={vm.datos} />
          {vm.orden ? <CardOrdenTrabajo orden={vm.orden} /> : null}
          <CardAcciones
            estado={estado}
            unidades={vm.unidades}
            pendiente={pendiente}
            error={error}
            onMarcarResuelto={() =>
              aplicarCambio(
                "resuelto",
                () => acciones.marcarResuelto(vm.claimId),
                "Marcado Resuelto · esperando conformidad",
              )
            }
            onCambiarEstado={(hacia) =>
              aplicarCambio(
                hacia,
                () => acciones.cambiarEstado(vm.claimId, hacia),
                `Estado cambiado a ${ESTADO_LABELS[hacia]}`,
              )
            }
            onDerivar={() =>
              aplicarCambio(
                "derivado",
                () => acciones.derivar(vm.claimId),
                `Estado cambiado a ${ESTADO_LABELS.derivado}`,
              )
            }
            onReasignar={reasignar}
          />
        </div>
      </div>
    </main>
  );
}
