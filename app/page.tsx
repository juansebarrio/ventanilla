import type { Metadata } from "next";
import { Simulador } from "@/components/landing/Simulador";

export const metadata: Metadata = {
  title: "Ventanilla · Cada reclamo respondido en minutos",
  description:
    "Ventanilla atiende los reclamos de tus consorcios por WhatsApp, los clasifica, emite la orden de trabajo y mantiene al vecino al tanto. Sin apps que nadie descarga.",
};

const CHIP_CASO: React.CSSProperties = {
  background: "#FDF0DC",
  color: "#92600A",
  fontSize: "11px",
  fontWeight: 600,
  letterSpacing: "0.08em",
  padding: "4px 10px",
  borderRadius: "4px",
};

const BOTON_PRIMARIO: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  height: "40px",
  padding: "0 20px",
  borderRadius: "8px",
  background: "#1E4D3F",
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 500,
  textDecoration: "none",
};

const KICKER: React.CSSProperties = {
  display: "block",
  textAlign: "center",
  fontSize: "12px",
  fontWeight: 600,
  letterSpacing: "0.06em",
  color: "#1E4D3F",
};

export default function Landing() {
  return (
    <div style={{ background: "#F7F5F0" }}>
      {/* ── Nav ── */}
      <nav
        className="ld-pad"
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          height: "68px",
          background: "rgba(247,245,240,0.94)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #E5E1D8",
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span
            aria-hidden
            style={{
              width: "28px",
              height: "28px",
              background: "#1E4D3F",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              fontSize: "17px",
            }}
          >
            V
          </span>
          <span
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              fontSize: "20px",
              letterSpacing: "-0.01em",
            }}
          >
            Ventanilla
          </span>
        </div>
        <span style={CHIP_CASO}>CASO DE ESTUDIO</span>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <a
            href="#contacto"
            className="hover:bg-primario-hover"
            style={{ ...BOTON_PRIMARIO, padding: "0 18px" }}
          >
            Hablemos
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        className="ld-pad"
        style={{
          position: "relative",
          paddingTop: "104px",
          paddingBottom: "120px",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: "50%",
            top: "64px",
            transform: "translateX(-50%) rotate(4deg)",
            width: "400px",
            padding: "26px 32px",
            border: "1.5px dashed rgba(30,77,63,0.16)",
            borderRadius: "10px",
            pointerEvents: "none",
          }}
        >
          <span
            style={{
              display: "block",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              color: "rgba(28,43,38,0.13)",
            }}
          >
            COMPROBANTE DE RECLAMO
          </span>
          <span
            style={{
              display: "block",
              fontFamily: "var(--font-space-mono)",
              fontWeight: 700,
              fontSize: "52px",
              color: "rgba(30,77,63,0.09)",
              lineHeight: 1.2,
            }}
          >
            R-1044
          </span>
        </div>

        <div
          style={{
            position: "relative",
            maxWidth: "880px",
            margin: "0 auto",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <h1
            className="ld-h1"
            style={{
              margin: 0,
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.01em",
              textWrap: "balance",
            }}
          >
            Cada reclamo respondido en minutos.{" "}
            <span style={{ color: "#1E4D3F" }}>Con número de seguimiento.</span>
          </h1>
          <p
            style={{
              margin: 0,
              maxWidth: "540px",
              fontSize: "18px",
              lineHeight: "28px",
              color: "#5C6660",
              textWrap: "pretty",
            }}
          >
            Ventanilla atiende los reclamos de tus consorcios por WhatsApp, los
            clasifica, emite la orden de trabajo y mantiene al vecino al tanto. Sin
            apps que nadie descarga.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <a href="#simulador" className="hover:bg-primario-hover" style={BOTON_PRIMARIO}>
              Probá el simulador
            </a>
            <a
              href="#contacto"
              className="hover:bg-papel"
              style={{
                ...BOTON_PRIMARIO,
                background: "#FFFFFF",
                border: "1px solid #E5E1D8",
                color: "#1C2B26",
              }}
            >
              Hablemos
            </a>
          </div>
        </div>
      </section>

      {/* ── Simulador ── */}
      <section id="simulador" className="ld-pad" style={{ paddingBottom: "120px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <span style={{ ...KICKER, marginBottom: "20px" }}>SIMULADOR</span>
          <Simulador />
        </div>
      </section>

      {/* ── Cómo funciona ── */}
      <section className="ld-pad" style={{ paddingBottom: "120px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <span style={{ ...KICKER, marginBottom: "36px" }}>CÓMO FUNCIONA</span>
          <div className="ld-pasos-grid">
            {[
              ["1", "El vecino escribe.", "Texto, audio o foto, por WhatsApp."],
              ["2", "Recibe su número.", "En segundos, con el reclamo ya clasificado."],
              ["3", "Sale la orden de trabajo.", "El proveedor recibe el detalle y las fotos."],
              ["4", "Nadie pregunta qué pasó.", "Cada novedad le llega al vecino sola."],
            ].map(([numero, titulo, texto]) => (
              <div
                key={numero}
                style={{
                  borderTop: "2px dashed #D8D2C4",
                  paddingTop: "22px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontWeight: 700,
                    fontSize: "40px",
                    lineHeight: 1,
                    color: "#1E4D3F",
                  }}
                >
                  {numero}
                </span>
                <span
                  style={{
                    fontFamily: "var(--font-space-grotesk)",
                    fontWeight: 500,
                    fontSize: "19px",
                    lineHeight: "26px",
                  }}
                >
                  {titulo}
                </span>
                <span style={{ fontSize: "14px", lineHeight: "21px", color: "#5C6660" }}>
                  {texto}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para administraciones ── */}
      <section
        className="ld-pad"
        style={{ background: "#1C2B26", paddingTop: "96px", paddingBottom: "96px" }}
      >
        <div className="ld-oscura-grid" style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <h2
              className="ld-h2"
              style={{
                margin: 0,
                fontFamily: "var(--font-space-grotesk)",
                fontWeight: 700,
                lineHeight: 1.15,
                color: "#F7F5F0",
                letterSpacing: "-0.01em",
                textWrap: "balance",
              }}
            >
              La reputación de una administración se mide en tiempo de respuesta.
            </h2>
            <p
              style={{
                margin: 0,
                maxWidth: "460px",
                fontSize: "16px",
                lineHeight: "26px",
                color: "rgba(247,245,240,0.75)",
                textWrap: "pretty",
              }}
            >
              Los consorcios no cambian de administración por precio: cambian porque
              nadie contesta. Ventanilla convierte tu punto más débil en tu mejor
              argumento.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {[
              ["38 s", "PRIMERA RESPUESTA"],
              ["2,1 días", "RESOLUCIÓN PROMEDIO"],
              ["0", "RECLAMOS SIN REGISTRAR"],
            ].map(([valor, label], i) => (
              <div
                key={label}
                style={{
                  borderTop: "1px solid rgba(247,245,240,0.16)",
                  borderBottom: i === 2 ? "1px solid rgba(247,245,240,0.16)" : undefined,
                  padding: "20px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--font-space-mono)",
                    fontWeight: 700,
                    fontSize: "36px",
                    lineHeight: 1,
                    color: "#FFFFFF",
                  }}
                >
                  {valor}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 600,
                    letterSpacing: "0.06em",
                    color: "rgba(247,245,240,0.6)",
                  }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Franja de honestidad ── */}
      <section
        className="ld-pad"
        style={{
          borderTop: "2px dashed #D8D2C4",
          borderBottom: "2px dashed #D8D2C4",
          paddingTop: "52px",
          paddingBottom: "52px",
        }}
      >
        <p
          style={{
            margin: "0 auto",
            maxWidth: "660px",
            textAlign: "center",
            fontSize: "15px",
            lineHeight: "24px",
            color: "#5C6660",
          }}
        >
          <span
            style={{
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 500,
              fontSize: "17px",
              color: "#1C2B26",
            }}
          >
            Administración Iribarne no existe.
          </span>{" "}
          Es el caso de estudio con el que mostramos Ventanilla funcionando de punta a
          punta. La clasificación, los números de seguimiento y los avisos son reales.
        </p>
      </section>

      {/* ── Cierre ── */}
      <section
        id="contacto"
        className="ld-pad"
        style={{ paddingTop: "120px", paddingBottom: "110px" }}
      >
        <div
          style={{
            maxWidth: "680px",
            margin: "0 auto",
            textAlign: "center",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "28px",
          }}
        >
          <h2
            className="ld-h2"
            style={{
              margin: 0,
              fontFamily: "var(--font-space-grotesk)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.01em",
              textWrap: "balance",
            }}
          >
            Ventanilla se instala con tu número y tu cartera de edificios.
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <a
              href="mailto:hola@js80.studio"
              className="hover:bg-primario-hover"
              style={BOTON_PRIMARIO}
            >
              Hablemos
            </a>
            <a
              href="mailto:hola@js80.studio"
              className="hover:underline"
              style={{
                fontFamily: "var(--font-space-mono)",
                fontSize: "14px",
                color: "#1E4D3F",
                textDecoration: "none",
              }}
            >
              hola@js80.studio
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        className="ld-pad"
        style={{ borderTop: "1px solid #E5E1D8", paddingTop: "26px", paddingBottom: "26px" }}
      >
        <div
          style={{
            maxWidth: "1160px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "13px", color: "#5C6660" }}>
            Ventanilla · Un producto de JS80, estudio de soluciones digitales
          </span>
          <span
            style={{ fontFamily: "var(--font-space-mono)", fontSize: "13px", color: "#5C6660" }}
          >
            js80.studio
          </span>
          <span style={CHIP_CASO}>CASO DE ESTUDIO</span>
        </div>
      </footer>
    </div>
  );
}
