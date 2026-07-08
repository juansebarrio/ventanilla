import { Card } from "@/components/Card";
import { textoVotos } from "@/lib/reuniones/servicio";
import type { Acta, SegmentoTexto } from "@/lib/reuniones/tipos";
import { SelloDocumento } from "./ChipSello";

/*
 * El acta generada al cierre de la asamblea, con la forma de un acta manual
 * de consorcio: membrete centrado, cuerpo justificado, resoluciones con
 * votos en mono y las tres firmas sobre línea punteada. El sello de goma
 * (BORRADOR / ENVIADA) va rotado arriba a la derecha.
 */

function Segmentos({ partes }: { partes: SegmentoTexto[] }) {
  return (
    <>
      {partes.map((s, i) =>
        s.estilo === "mono" ? (
          <span key={i} className="font-mono text-tinta" style={{ fontSize: "13px" }}>
            {s.texto}
          </span>
        ) : s.estilo === "ticket" ? (
          <span
            key={i}
            className="font-mono font-bold text-primario"
            style={{ fontSize: "12.5px" }}
          >
            {s.texto}
          </span>
        ) : (
          <span key={i}>{s.texto}</span>
        ),
      )}
    </>
  );
}

export function DocumentoActa({
  acta,
  enviada,
}: {
  acta: Acta;
  enviada: boolean;
}) {
  return (
    <Card className="relative" >
      <div style={{ padding: "36px 40px" }}>
        <SelloDocumento estado={enviada ? "enviada" : "borrador"} />

        {/* Encabezado */}
        <div className="flex flex-col items-center text-center" style={{ gap: "6px" }}>
          <span
            className="font-semibold uppercase text-tinta-3"
            style={{ fontSize: "11px", letterSpacing: "0.08em" }}
          >
            {acta.membrete}
          </span>
          <h2
            className="m-0 font-display font-bold text-tinta"
            style={{ fontSize: "22px", lineHeight: "28px" }}
          >
            {acta.titulo}
          </h2>
          <span className="font-mono text-tinta-3" style={{ fontSize: "12px" }}>
            {acta.fechaLinea}
          </span>
        </div>

        <div style={{ borderTop: "1px dashed var(--borde)", margin: "20px 0" }} />

        {/* Apertura */}
        {acta.apertura.map((parrafo, i) => (
          <p
            key={i}
            className="text-justify"
            style={{
              margin: i === acta.apertura.length - 1 ? "0 0 20px" : "0 0 12px",
              fontSize: "14px",
              lineHeight: "22px",
            }}
          >
            {parrafo}
          </p>
        ))}

        <span
          className="block font-semibold text-tinta-3"
          style={{ fontSize: "11px", letterSpacing: "0.08em", marginBottom: "12px" }}
        >
          ORDEN DEL DÍA Y RESOLUCIONES
        </span>

        {/* Resoluciones */}
        <div className="flex flex-col" style={{ gap: "16px" }}>
          {acta.resoluciones.map((r, i) => (
            <div key={r.titulo}>
              <span className="font-semibold" style={{ fontSize: "14px", lineHeight: "20px" }}>
                {i + 1}. {r.titulo}
              </span>
              <p
                className="text-justify text-tinta-2"
                style={{
                  margin: r.votos ? "4px 0 6px" : "4px 0 0",
                  fontSize: "14px",
                  lineHeight: "21px",
                }}
              >
                <Segmentos partes={r.parrafo} />
              </p>
              {r.votos ? (
                <span className="font-mono text-primario" style={{ fontSize: "12px" }}>
                  {textoVotos(r.votos)}
                </span>
              ) : null}
            </div>
          ))}
        </div>

        {/* Firmas */}
        <div
          className="grid"
          style={{
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "24px",
            marginTop: "32px",
          }}
        >
          {acta.firmas.map((f) => (
            <div
              key={f.nombre}
              className="flex flex-col"
              style={{
                borderTop: "1px dotted var(--tinta-3)",
                paddingTop: "8px",
                gap: "2px",
              }}
            >
              <span className="font-semibold" style={{ fontSize: "13px" }}>
                {f.nombre}
              </span>
              <span className="text-tinta-3" style={{ fontSize: "11px" }}>
                {f.rol}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
