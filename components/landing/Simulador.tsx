"use client";

import { useEffect, useRef, useState } from "react";

/*
 * Simulador de la landing. La UX replica el prototipo: burbuja propia
 * inmediata, indicador escribiendo, respuesta a los ~1400 ms (si la API tarda
 * más, el indicador sigue hasta que llegue) y la card "La administración ve"
 * pasa del ejemplo R-1048 al reclamo recién creado. La clasificación y la
 * numeración las hace el pipeline real vía POST /api/simulador.
 */

const ESPERA_MS = 1400;
const MAX_CARACTERES = 300;

type Mensaje =
  | { tipo: "propio"; texto: string; hora: string }
  | { tipo: "ajeno"; pre: string; num: string | null; post: string; hora: string };

type ReclamoNuevo = {
  numero: string;
  resumen: string;
  categoria: string;
  urgencia: string;
  urgenciaColor: string;
};

const COLOR_URGENCIA: Record<string, string> = {
  urgente: "#A3352B",
  alta: "#C97A10",
  media: "#8A928D",
  baja: "#C6CCC8",
};

const LABEL_URGENCIA: Record<string, string> = {
  urgente: "Urgente",
  alta: "Alta",
  media: "Media",
  baja: "Baja",
};

function horaAhora(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Divide el mensaje de confirmación alrededor del número, como el prototipo. */
function partirMensaje(mensaje: string, numero: string | null): Omit<Extract<Mensaje, { tipo: "ajeno" }>, "tipo" | "hora"> {
  if (numero && mensaje.includes(numero)) {
    const [pre, ...resto] = mensaje.split(numero);
    return { pre: pre ?? "", num: numero, post: resto.join(numero) };
  }
  return { pre: mensaje, num: null, post: "" };
}

export function Simulador() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [escribiendo, setEscribiendo] = useState(false);
  const [nuevo, setNuevo] = useState<ReclamoNuevo | null>(null);
  const [texto, setTexto] = useState("");
  const chatRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [mensajes, escribiendo]);

  async function enviar() {
    const limpio = texto.trim();
    if (!limpio || escribiendo) return;
    setTexto("");
    setMensajes((prev) => [...prev, { tipo: "propio", texto: limpio, hora: horaAhora() }]);
    setEscribiendo(true);

    const inicio = Date.now();
    let respuesta: {
      ok: boolean;
      numero?: string;
      resumen?: string;
      categoria?: string;
      urgencia?: string;
      mensaje?: string;
      error?: string;
    };
    try {
      const r = await fetch("/api/simulador", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ texto: limpio }),
      });
      respuesta = await r.json();
      if (!r.ok) respuesta.ok = false;
    } catch {
      respuesta = { ok: false };
    }

    // Respetar el ritmo del prototipo: nunca antes de ~1400 ms.
    const restante = Math.max(0, ESPERA_MS - (Date.now() - inicio));
    await new Promise((resolver) => setTimeout(resolver, restante));

    setEscribiendo(false);

    if (respuesta.ok && respuesta.mensaje && respuesta.numero) {
      setMensajes((prev) => [
        ...prev,
        {
          tipo: "ajeno",
          ...partirMensaje(respuesta.mensaje as string, respuesta.numero as string),
          hora: horaAhora(),
        },
      ]);
      setNuevo({
        numero: respuesta.numero,
        resumen: respuesta.resumen ?? "",
        categoria: (respuesta.categoria ?? "").toUpperCase(),
        urgencia: LABEL_URGENCIA[respuesta.urgencia ?? "media"] ?? "Media",
        urgenciaColor: COLOR_URGENCIA[respuesta.urgencia ?? "media"] ?? "#8A928D",
      });
    } else {
      const aviso =
        respuesta.error ??
        "No pudimos registrar tu reclamo en este momento. Probá de nuevo en un rato.";
      setMensajes((prev) => [
        ...prev,
        { tipo: "ajeno", pre: aviso, num: null, post: "", hora: horaAhora() },
      ]);
    }
  }

  return (
    <div>
      <div
        className="ld-sim-grid"
        style={{
          position: "relative",
          background: "#FFFFFF",
          border: "1px solid #E5E1D8",
          borderRadius: "10px",
          padding: "36px",
        }}
      >
        {/* ── Columna izquierda: el chat ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "#8A928D",
            }}
          >
            VOS ESCRIBÍS
          </span>
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              border: "1px solid #E5E1D8",
              borderRadius: "10px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "12px 16px",
                background: "#FFFFFF",
                borderBottom: "1px solid #E5E1D8",
              }}
            >
              <span
                aria-hidden
                style={{
                  width: "24px",
                  height: "24px",
                  background: "#1E4D3F",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  fontFamily: "var(--font-space-grotesk)",
                  fontWeight: 700,
                  fontSize: "13px",
                }}
              >
                V
              </span>
              <span style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "13px", fontWeight: 600 }}>Ventanilla</span>
                <span style={{ fontSize: "11px", color: "#8A928D" }}>Yerbal 1240</span>
              </span>
            </div>

            <div
              ref={chatRef}
              style={{
                flex: 1,
                minHeight: "340px",
                maxHeight: "380px",
                overflowY: "auto",
                background: "#F7F5F0",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <BurbujaPropia hora="11:24">
                Hola, se rompió la cerradura de la puerta de entrada y quedó sin llave
              </BurbujaPropia>
              <BurbujaAjena hora="11:24">
                Hola. Registré tu reclamo por la cerradura de la puerta de entrada
                (Yerbal 1240). Tu número de seguimiento es <NumeroMono>R-1048</NumeroMono>.
                Por tratarse de un tema de seguridad lo marcamos con prioridad alta. Te
                avisamos apenas el cerrajero confirme la visita.
              </BurbujaAjena>

              {mensajes.map((m, i) =>
                m.tipo === "propio" ? (
                  <BurbujaPropia key={i} hora={m.hora} animada>
                    {m.texto}
                  </BurbujaPropia>
                ) : (
                  <BurbujaAjena key={i} hora={m.hora} animada>
                    {m.pre}
                    {m.num ? <NumeroMono>{m.num}</NumeroMono> : null}
                    {m.post}
                  </BurbujaAjena>
                ),
              )}

              {escribiendo ? (
                <div
                  aria-label="Escribiendo"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "#FFFFFF",
                    border: "1px solid #D4E3DA",
                    borderRadius: "10px 10px 10px 4px",
                    padding: "12px 14px",
                    width: "fit-content",
                  }}
                >
                  {[0, 0.18, 0.36].map((delay) => (
                    <span
                      key={delay}
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "#8A928D",
                        animation: `vtn-dot 1.1s infinite`,
                        animationDelay: `${delay}s`,
                      }}
                    />
                  ))}
                </div>
              ) : null}
            </div>

            <div
              style={{
                display: "flex",
                gap: "8px",
                padding: "12px",
                background: "#FFFFFF",
                borderTop: "1px solid #E5E1D8",
              }}
            >
              <input
                type="text"
                value={texto}
                maxLength={MAX_CARACTERES}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") void enviar();
                }}
                placeholder="Escribí tu reclamo, mandá foto o audio"
                aria-label="Escribí tu reclamo"
                style={{
                  flex: 1,
                  height: "40px",
                  border: "1px solid #E5E1D8",
                  borderRadius: "8px",
                  background: "#F7F5F0",
                  padding: "0 14px",
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "#1C2B26",
                  outline: "none",
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#1E4D3F";
                  e.currentTarget.style.boxShadow = "0 0 0 3px #E3EDE7";
                  e.currentTarget.style.background = "#FFFFFF";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#E5E1D8";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.background = "#F7F5F0";
                }}
              />
              <button
                type="button"
                onClick={() => void enviar()}
                title="Enviar"
                aria-label="Enviar"
                style={{
                  width: "40px",
                  height: "40px",
                  minWidth: "40px",
                  border: "none",
                  borderRadius: "8px",
                  background: "#1E4D3F",
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="m22 2-7 20-4-9-9-4Z" />
                  <path d="M22 2 11 13" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* ── Columna central: flecha punteada ── */}
        <div className="ld-flecha">
          <svg
            width="96"
            height="40"
            viewBox="0 0 96 40"
            fill="none"
            style={{ position: "absolute", left: 0, top: "47%" }}
            aria-hidden
          >
            <path d="M6 20 H 78" stroke="#1E4D3F" strokeWidth="1.5" strokeDasharray="4 5" opacity="0.55" />
            <path
              d="M72 13 L 82 20 L 72 27"
              stroke="#1E4D3F"
              strokeWidth="1.5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.55"
            />
          </svg>
        </div>

        {/* ── Columna derecha: la administración ve ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              letterSpacing: "0.06em",
              color: "#8A928D",
            }}
          >
            LA ADMINISTRACIÓN VE
          </span>
          <div
            style={{
              flex: 1,
              background: "#F7F5F0",
              border: "1px solid #E5E1D8",
              borderRadius: "10px",
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            {nuevo ? (
              <CardReclamo
                animada
                numero={nuevo.numero}
                cuando="recién"
                resumen={nuevo.resumen}
                categoria={nuevo.categoria}
                urgencia={nuevo.urgencia}
                urgenciaColor={nuevo.urgenciaColor}
              />
            ) : (
              <CardReclamo
                numero="R-1048"
                cuando="hace 1 min"
                resumen="Cerradura de la puerta de entrada rota, sin llave"
                categoria="SEGURIDAD Y ACCESOS"
                urgencia="Alta"
                urgenciaColor="#C97A10"
              />
            )}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: "18px 0 0",
          textAlign: "center",
          fontSize: "14px",
          color: "#5C6660",
        }}
      >
        El simulador usa el sistema real. Solo cambia el canal.{" "}
        <a
          href="/login"
          className="hover:underline"
          style={{ color: "#1E4D3F", fontWeight: 500, textDecoration: "none" }}
        >
          Mirá el otro lado: entrá al panel de la administración.
        </a>
      </p>
    </div>
  );
}

// ── Piezas ────────────────────────────────────────────────────────────────────

function NumeroMono({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        fontFamily: "var(--font-space-mono)",
        fontWeight: 700,
        fontSize: "12.5px",
        color: "#1E4D3F",
      }}
    >
      {children}
    </span>
  );
}

function BurbujaPropia({
  children,
  hora,
  animada,
}: {
  children: React.ReactNode;
  hora: string;
  animada?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: "4px",
        alignSelf: "flex-end",
        maxWidth: "85%",
        animation: animada ? "vtn-fade 0.25s ease" : undefined,
      }}
    >
      <div style={{ background: "#E3EDE7", borderRadius: "10px 10px 4px 10px", padding: "10px 13px" }}>
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "21px" }}>{children}</p>
      </div>
      <span
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "10.5px",
          color: "#8A928D",
          paddingRight: "2px",
        }}
      >
        {hora}
      </span>
    </div>
  );
}

function BurbujaAjena({
  children,
  hora,
  animada,
}: {
  children: React.ReactNode;
  hora: string;
  animada?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        gap: "4px",
        maxWidth: "85%",
        animation: animada ? "vtn-fade 0.25s ease" : undefined,
      }}
    >
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #D4E3DA",
          borderRadius: "10px 10px 10px 4px",
          padding: "10px 13px",
        }}
      >
        <p style={{ margin: 0, fontSize: "14px", lineHeight: "21px" }}>{children}</p>
      </div>
      <span
        style={{
          fontFamily: "var(--font-space-mono)",
          fontSize: "10.5px",
          color: "#8A928D",
          paddingLeft: "2px",
        }}
      >
        {hora}
      </span>
    </div>
  );
}

function CardReclamo({
  numero,
  cuando,
  resumen,
  categoria,
  urgencia,
  urgenciaColor,
  animada,
}: {
  numero: string;
  cuando: string;
  resumen: string;
  categoria: string;
  urgencia: string;
  urgenciaColor: string;
  animada?: boolean;
}) {
  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E5E1D8",
        borderRadius: "10px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        animation: animada ? "vtn-fade 0.35s ease" : undefined,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px",
        }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "7px 12px",
            background: "#FFFFFF",
            border: "1.5px dashed #1E4D3F",
            borderRadius: "8px",
            fontFamily: "var(--font-space-mono)",
            fontWeight: 700,
            fontSize: "13px",
            color: "#1E4D3F",
          }}
        >
          {numero}
        </span>
        <span
          style={{ fontFamily: "var(--font-space-mono)", fontSize: "11px", color: "#8A928D" }}
        >
          {cuando}
        </span>
      </div>
      <span style={{ fontSize: "15px", fontWeight: 500, lineHeight: "21px" }}>{resumen}</span>
      <span style={{ fontSize: "13px", color: "#5C6660" }}>Yerbal 1240 · Ámbito común</span>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <span
          style={{
            background: "#F7F5F0",
            border: "1px solid #E5E1D8",
            color: "#5C6660",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            padding: "4px 10px",
            borderRadius: "4px",
          }}
        >
          {categoria}
        </span>
        <span
          style={{
            background: "#EEF1EF",
            color: "#3F4A45",
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            padding: "4px 10px",
            borderRadius: "4px",
          }}
        >
          RECIBIDO
        </span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
          <span
            aria-hidden
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: urgenciaColor,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#5C6660" }}>{urgencia}</span>
        </span>
      </div>
      <button
        type="button"
        style={{
          height: "40px",
          border: "none",
          borderRadius: "8px",
          background: "#1E4D3F",
          color: "#FFFFFF",
          fontSize: "14px",
          fontWeight: 500,
          cursor: "pointer",
        }}
      >
        Emitir orden de trabajo
      </button>
    </div>
  );
}
