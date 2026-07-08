"use client";

import { useEffect, useRef, useState } from "react";
import { Boton } from "@/components/Boton";
import { Card, CardHeader } from "@/components/Card";
import { IconoCheck, IconoPin, IconoVideo } from "@/components/iconos";
import type { Asamblea } from "@/lib/reuniones/tipos";
import { BarraQuorum, type QuorumVM } from "./BarraQuorum";
import { ChipSello } from "./ChipSello";

const LABEL_CAJA: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "7px",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "var(--tinta-3)",
};

const LABEL_SECCION: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "var(--tinta-3)",
};

export function CardAsamblea({
  asamblea,
  quorum,
}: {
  asamblea: Asamblea;
  quorum: QuorumVM;
}) {
  const [linkCopiado, setLinkCopiado] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(asamblea.linkVirtual);
    } catch {
      // Sin permiso de portapapeles el feedback igual confirma la acción.
    }
    setLinkCopiado(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setLinkCopiado(false), 2000);
  }

  return (
    <Card>
      <CardHeader
        titulo="Próxima asamblea"
        acciones={<ChipSello sello="convocada" />}
      />
      <div className="flex flex-col" style={{ gap: "18px", padding: "20px" }}>
        {/* Fecha */}
        <div className="flex items-center" style={{ gap: "16px" }}>
          <span
            className="inline-flex flex-col items-center justify-center"
            style={{
              gap: "2px",
              width: "64px",
              height: "64px",
              minWidth: "64px",
              border: "1.5px dashed var(--primario)",
              borderRadius: "8px",
            }}
            aria-hidden
          >
            <span
              className="font-mono font-bold text-primario"
              style={{ fontSize: "24px", lineHeight: 1 }}
            >
              {asamblea.dia}
            </span>
            <span
              className="font-mono font-bold text-tinta-2"
              style={{ fontSize: "11px", letterSpacing: "0.08em" }}
            >
              {asamblea.mes}
            </span>
          </span>
          <div className="flex min-w-0 flex-col" style={{ gap: "4px" }}>
            <span className="font-semibold" style={{ fontSize: "16px", lineHeight: "22px" }}>
              Asamblea {asamblea.tipo}
            </span>
            <span className="text-tinta-2" style={{ fontSize: "13px" }}>
              {asamblea.edificio} · {asamblea.fechaLarga} ·{" "}
              <span className="font-mono" style={{ fontSize: "12px" }}>
                {asamblea.hora}
              </span>{" "}
              · segunda convocatoria{" "}
              <span className="font-mono" style={{ fontSize: "12px" }}>
                {asamblea.segundaConvocatoria}
              </span>
            </span>
            <span className="text-tinta-3" style={{ fontSize: "12px" }}>
              {asamblea.convocatoriaNota}
            </span>
          </div>
        </div>

        {/* Virtual y presencial */}
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <div
            className="flex flex-col"
            style={{
              border: "1px solid var(--borde)",
              borderRadius: "8px",
              padding: "14px",
              gap: "8px",
            }}
          >
            <span style={LABEL_CAJA}>
              <IconoVideo />
              VIRTUAL
            </span>
            <span
              className="break-all font-mono font-bold text-primario"
              style={{ fontSize: "13px" }}
            >
              {asamblea.linkVirtual}
            </span>
            <div>
              {linkCopiado ? (
                <span
                  className="vtn-anim-in inline-flex items-center"
                  style={{ gap: "6px", height: "32px" }}
                  role="status"
                >
                  <IconoCheck
                    width={14}
                    height={14}
                    strokeWidth={2}
                    style={{ color: "var(--estado-resuelto-fg)" }}
                  />
                  <span
                    className="font-semibold"
                    style={{ fontSize: "13px", color: "var(--estado-resuelto-fg)" }}
                  >
                    Copiado
                  </span>
                </span>
              ) : (
                <Boton variante="secundario" tamano="chico" onClick={copiarLink}>
                  Copiar link
                </Boton>
              )}
            </div>
            <span className="text-tinta-3" style={{ fontSize: "12px" }}>
              Se abre en el navegador, sin cuenta.
            </span>
          </div>

          <div
            className="flex flex-col"
            style={{
              border: "1px solid var(--borde)",
              borderRadius: "8px",
              padding: "14px",
              gap: "8px",
            }}
          >
            <span style={LABEL_CAJA}>
              <IconoPin />
              PRESENCIAL
            </span>
            <span className="font-medium" style={{ fontSize: "14px", lineHeight: "20px" }}>
              {asamblea.lugarPresencial.titulo}
            </span>
            <span className="text-tinta-2" style={{ fontSize: "13px" }}>
              {asamblea.lugarPresencial.direccion}
            </span>
            <span className="text-tinta-3" style={{ fontSize: "12px" }}>
              {asamblea.lugarPresencial.nota}
            </span>
          </div>
        </div>

        {/* Orden del día */}
        <div className="flex flex-col" style={{ gap: "10px" }}>
          <span style={LABEL_SECCION}>ORDEN DEL DÍA</span>
          <ol className="m-0 flex list-none flex-col p-0" style={{ gap: "8px" }}>
            {asamblea.ordenDelDia.map((item, i) => (
              <li
                key={item}
                className="flex"
                style={{ gap: "10px", fontSize: "14px", lineHeight: "20px" }}
              >
                <span
                  className="font-mono font-bold text-primario"
                  style={{ fontSize: "13px" }}
                >
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ol>
        </div>

        {/* Quórum */}
        <div
          className="flex flex-col"
          style={{
            gap: "8px",
            borderTop: "1px dashed var(--borde)",
            paddingTop: "16px",
          }}
        >
          <span style={LABEL_SECCION}>QUÓRUM</span>
          <BarraQuorum quorum={quorum} />
        </div>
      </div>
    </Card>
  );
}
