"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/Boton";
import { Card, CardTitulo } from "@/components/Card";
import { IconoCheck } from "@/components/iconos";
import type { Acta } from "@/lib/reuniones/tipos";
import { ChipSello } from "./ChipSello";

/*
 * Estado del acta: metadatos de la generación automática y las dos
 * acciones. "Enviar a los vecinos" pasa BORRADOR → ENVIADA (chip, sello
 * del documento y banda de confirmación); "Copiar texto" copia el acta
 * completa en texto plano.
 */

const LABEL: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "var(--tinta-3)",
};

export function CardEstadoActa({
  acta,
  enviada,
  onEnviar,
  onCopiarTexto,
}: {
  acta: Acta;
  enviada: boolean;
  onEnviar: () => void;
  onCopiarTexto: () => void;
}) {
  const [copiado, setCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  function copiar() {
    onCopiarTexto();
    setCopiado(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <CardTitulo>Estado del acta</CardTitulo>
        </div>

        <div
          className="grid items-baseline"
          style={{
            gridTemplateColumns: "104px 1fr",
            rowGap: "11px",
            columnGap: "12px",
          }}
        >
          <span style={LABEL}>ESTADO</span>
          <span>
            <ChipSello sello={enviada ? "enviada" : "borrador"} animado={enviada} />
          </span>
          <span style={LABEL}>ASAMBLEA</span>
          <span style={{ fontSize: "14px", lineHeight: "20px" }}>
            {acta.asambleaLabel}
          </span>
          <span style={LABEL}>GENERADA</span>
          <span className="font-mono" style={{ fontSize: "13px", lineHeight: "20px" }}>
            {acta.generadaEl}
          </span>
          <span style={LABEL}>ORIGEN</span>
          <span style={{ fontSize: "14px", lineHeight: "20px" }}>{acta.origen}</span>
          <span style={LABEL}>ASISTENCIA</span>
          <span style={{ fontSize: "14px", lineHeight: "20px" }}>
            {acta.asistencia.presentes} de {acta.asistencia.total} unidades
          </span>
        </div>

        <p
          className="text-tinta-3"
          style={{ margin: "14px 0 16px", fontSize: "12px", lineHeight: "18px" }}
        >
          El borrador se arma solo al cierre de la asamblea. Revisalo antes de
          enviarlo.
        </p>

        {enviada ? (
          <div
            className="vtn-anim-in flex w-full items-center justify-center"
            style={{
              gap: "8px",
              height: "40px",
              borderRadius: "8px",
              background: "var(--estado-resuelto-bg)",
            }}
            role="status"
          >
            <IconoCheck
              width={15}
              height={15}
              strokeWidth={2}
              style={{ color: "var(--estado-resuelto-fg)" }}
            />
            <span
              className="font-semibold"
              style={{ fontSize: "13px", color: "var(--estado-resuelto-fg)" }}
            >
              Enviada a las {acta.asistencia.total} unidades por WhatsApp
            </span>
          </div>
        ) : (
          <Boton variante="primario" onClick={onEnviar} style={{ width: "100%" }}>
            Enviar a los vecinos
          </Boton>
        )}

        <Boton
          variante="secundario"
          onClick={copiar}
          style={{ width: "100%", marginTop: "8px" }}
        >
          {copiado ? "Copiado" : "Copiar texto"}
        </Boton>
      </div>
    </Card>
  );
}
