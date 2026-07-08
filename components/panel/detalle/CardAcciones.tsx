"use client";

import { useState } from "react";
import { Card, CardTitulo } from "@/components/Card";
import { ChipEstado } from "@/components/ChipEstado";
import { IconoCheck } from "@/components/iconos";
import { ESTADOS, type Estado } from "@/lib/domain/claims";
import type { UnidadOpcion } from "@/lib/panel/tipos";

/**
 * Card "Acciones": marcar resuelto, cambiar estado (menú con los siete
 * estados), derivar y reasignar unidad. La orquestación (persistencia +
 * optimismo) vive en PanelDetalle; acá va la interacción de menús.
 */
export function CardAcciones({
  estado,
  unidades,
  onMarcarResuelto,
  onCambiarEstado,
  onDerivar,
  onReasignar,
  pendiente,
  error,
}: {
  estado: Estado;
  unidades: UnidadOpcion[];
  onMarcarResuelto: () => void;
  onCambiarEstado: (hacia: Estado) => void;
  onDerivar: () => void;
  onReasignar: (unitId: string) => void;
  pendiente: boolean;
  error: string | null;
}) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [reasignando, setReasignando] = useState(false);
  const resuelto = estado === "resuelto";

  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <CardTitulo>Acciones</CardTitulo>
        </div>

        {resuelto ? (
          <div
            className="vtn-anim-in flex items-center"
            style={{
              gap: "8px",
              padding: "10px 12px",
              borderRadius: "8px",
              background: "var(--estado-resuelto-bg)",
            }}
          >
            <IconoCheck stroke="var(--estado-resuelto-fg)" />
            <span
              className="font-semibold"
              style={{ fontSize: "13px", color: "var(--estado-resuelto-fg)" }}
            >
              Resuelto · esperando conformidad
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={onMarcarResuelto}
            disabled={pendiente}
            className="w-full cursor-pointer border-none font-sans font-medium text-white transition-colors duration-200 hover:bg-primario-hover disabled:opacity-60"
            style={{
              height: "40px",
              borderRadius: "8px",
              background: "var(--primario)",
              fontSize: "14px",
            }}
          >
            Marcar resuelto
          </button>
        )}

        <div
          className="relative grid"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}
        >
          <button
            type="button"
            onClick={() => setMenuAbierto((v) => !v)}
            className="cursor-pointer bg-superficie font-sans font-medium text-tinta hover:bg-papel"
            style={{
              height: "40px",
              border: "1px solid var(--borde)",
              borderRadius: "8px",
              fontSize: "14px",
            }}
            aria-expanded={menuAbierto}
          >
            Cambiar estado
          </button>
          <button
            type="button"
            onClick={onDerivar}
            disabled={pendiente}
            className="cursor-pointer bg-superficie font-sans font-medium text-tinta hover:bg-papel disabled:opacity-60"
            style={{
              height: "40px",
              border: "1px solid var(--borde)",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          >
            Derivar
          </button>

          {menuAbierto ? (
            <div
              className="vtn-anim-in absolute flex flex-col"
              style={{
                top: "44px",
                left: 0,
                width: "220px",
                gap: "4px",
                padding: "8px",
                background: "var(--superficie)",
                border: "1px solid var(--borde)",
                borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(28,43,38,0.08)",
                zIndex: 10,
              }}
              role="menu"
            >
              {ESTADOS.map((e) => (
                <button
                  key={e}
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuAbierto(false);
                    if (e !== estado) onCambiarEstado(e);
                  }}
                  className="flex cursor-pointer items-center border-none bg-transparent hover:bg-papel"
                  style={{ padding: "6px 8px", borderRadius: "6px", textAlign: "left" }}
                >
                  <ChipEstado estado={e} />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div style={{ marginTop: "12px", textAlign: "center" }}>
          {reasignando ? (
            <div className="flex items-center justify-center" style={{ gap: "8px" }}>
              <select
                aria-label="Reasignar a unidad"
                className="cursor-pointer bg-superficie font-sans text-tinta"
                style={{
                  height: "36px",
                  border: "1px solid var(--borde)",
                  borderRadius: "8px",
                  padding: "0 12px",
                  fontSize: "14px",
                }}
                defaultValue=""
                onChange={(ev) => {
                  if (ev.target.value) {
                    onReasignar(ev.target.value);
                    setReasignando(false);
                  }
                }}
              >
                <option value="" disabled>
                  Elegí una unidad
                </option>
                {unidades.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.resumen}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setReasignando(false)}
                className="cursor-pointer border-none bg-transparent font-sans font-medium text-tinta-3"
                style={{ fontSize: "13px" }}
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setReasignando(true)}
              className="cursor-pointer border-none bg-transparent p-0 font-sans font-medium text-primario hover:underline"
              style={{ fontSize: "13px" }}
            >
              Reasignar unidad
            </button>
          )}
        </div>

        {error ? (
          <p
            role="alert"
            style={{
              fontSize: "13px",
              color: "var(--estado-reabierto-fg)",
              marginTop: "10px",
            }}
          >
            {error}
          </p>
        ) : null}
      </div>
    </Card>
  );
}
