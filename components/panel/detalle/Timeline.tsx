import type { ComponentType, SVGProps } from "react";
import {
  IconoCheckCirculo,
  IconoDocumento,
  IconoEtiqueta,
} from "@/components/iconos";
import { TokensResaltados } from "@/components/panel/comunes/TokensResaltados";
import type { ItemTimeline } from "@/lib/panel/tipos";
import { AudioPlayer } from "./AudioPlayer";
import { FotoReclamo } from "./FotoReclamo";

/** Timeline unificado de mensajes y eventos, en orden cronológico. */
export function Timeline({ items }: { items: ItemTimeline[] }) {
  return (
    <ol
      className="m-0 flex list-none flex-col p-0"
      style={{ gap: "16px", padding: "22px 24px" }}
    >
      {items.map((item) => (
        <li key={item.id} className="flex flex-col">
          {item.clase === "vecino" ? (
            <BurbujaVecino item={item} />
          ) : item.clase === "evento" ? (
            <Evento item={item} />
          ) : (
            <BurbujaSalida item={item} />
          )}
        </li>
      ))}
    </ol>
  );
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center" style={{ gap: "8px", marginBottom: "6px" }}>
      {children}
    </div>
  );
}

function BurbujaVecino({
  item,
}: {
  item: Extract<ItemTimeline, { clase: "vecino" }>;
}) {
  return (
    <div className="flex flex-col self-start" style={{ maxWidth: "78%" }}>
      <Etiqueta>
        <span className="font-semibold text-tinta-2" style={{ fontSize: "12px" }}>
          {item.autor}
        </span>
        <span className="font-mono text-tinta-3" style={{ fontSize: "11px" }}>
          {item.hora}
        </span>
      </Etiqueta>
      <div
        style={{
          background: "var(--papel)",
          border: "1px solid #EFECE4",
          borderRadius: "10px 10px 10px 4px",
          padding: "12px 14px",
        }}
      >
        {item.media.kind === "texto" ? (
          <span className="text-tinta" style={{ fontSize: "15px", lineHeight: "22px" }}>
            {item.media.texto}
          </span>
        ) : item.media.kind === "audio" ? (
          <div className="flex flex-col" style={{ gap: "10px", minWidth: "260px" }}>
            <AudioPlayer signedUrl={item.media.signedUrl} duracion={item.media.duracion} />
            {item.media.transcripcion ? (
              <div style={{ borderTop: "1px dashed var(--borde)", paddingTop: "10px" }}>
                <div
                  className="font-sans font-semibold uppercase text-tinta-3"
                  style={{ fontSize: "10px", letterSpacing: "0.08em", marginBottom: "4px" }}
                >
                  Transcripción
                </div>
                <p
                  className="m-0 text-tinta-2"
                  style={{ fontSize: "14px", lineHeight: "21px", fontStyle: "italic" }}
                >
                  {item.media.transcripcion}
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <FotoReclamo signedUrl={item.media.signedUrl} nombre={item.media.nombre} />
        )}
      </div>
    </div>
  );
}

function BurbujaSalida({
  item,
}: {
  item: Extract<ItemTimeline, { clase: "ventanilla" | "administracion" }>;
}) {
  const esAdmin = item.clase === "administracion";
  return (
    <div className="flex flex-col self-end" style={{ maxWidth: "78%" }}>
      <Etiqueta>
        {esAdmin ? (
          <span className="font-semibold text-primario" style={{ fontSize: "12px" }}>
            Administración Iribarne
          </span>
        ) : (
          <>
            <span
              className="flex items-center justify-center font-display font-bold text-white"
              style={{
                width: "14px",
                height: "14px",
                background: "var(--primario)",
                borderRadius: "3px",
                fontSize: "9px",
              }}
              aria-hidden
            >
              V
            </span>
            <span className="font-semibold text-primario" style={{ fontSize: "12px" }}>
              Ventanilla
            </span>
          </>
        )}
        <span className="font-mono text-tinta-3" style={{ fontSize: "11px" }}>
          {item.hora}
        </span>
      </Etiqueta>
      <div
        style={{
          background: esAdmin ? "var(--primario-suave)" : "var(--primario-suave-2)",
          border: esAdmin ? "none" : "1px solid #D4E3DA",
          borderRadius: "10px 10px 4px 10px",
          padding: "12px 14px",
        }}
      >
        <span className="text-tinta" style={{ fontSize: "15px", lineHeight: "22px" }}>
          <TokensResaltados texto={item.texto} size="13px" />
        </span>
      </div>
    </div>
  );
}

const ICONO_EVENTO: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  clasificacion: IconoEtiqueta,
  aprobacion: IconoCheckCirculo,
  ot_creada: IconoDocumento,
  estado: IconoCheckCirculo,
};

function Evento({ item }: { item: Extract<ItemTimeline, { clase: "evento" }> }) {
  const Icono = ICONO_EVENTO[item.tipo] ?? IconoEtiqueta;
  return (
    <div className="flex items-center self-center" style={{ gap: "8px" }}>
      <span className="font-mono text-tinta-3" style={{ fontSize: "11px" }}>
        {item.hora}
      </span>
      <Icono width={15} height={15} stroke="var(--tinta-3)" />
      <span className="text-tinta-2" style={{ fontSize: "13px" }}>
        <TokensResaltados texto={item.texto} size="12px" />
      </span>
    </div>
  );
}
