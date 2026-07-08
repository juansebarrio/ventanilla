"use client";

import { useActionState } from "react";
import { Boton } from "@/components/Boton";
import { iniciarSesion, type EstadoLogin } from "./actions";

const INICIAL: EstadoLogin = { error: null };

const CAMPO: React.CSSProperties = {
  height: "40px",
  width: "100%",
  border: "1px solid var(--borde)",
  borderRadius: "8px",
  background: "var(--superficie)",
  padding: "0 14px",
  fontSize: "14px",
};

export function LoginForm({
  desde,
  emailInicial,
  claveInicial,
}: {
  desde: string;
  emailInicial?: string;
  claveInicial?: string;
}) {
  const [estado, accion, pendiente] = useActionState(iniciarSesion, INICIAL);

  return (
    <form action={accion} className="flex flex-col" style={{ gap: "14px" }}>
      <input type="hidden" name="desde" value={desde} />

      <label className="flex flex-col" style={{ gap: "6px" }}>
        <span
          className="font-sans font-semibold uppercase text-tinta-3"
          style={{ fontSize: "11px", letterSpacing: "0.06em" }}
        >
          Correo
        </span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          defaultValue={emailInicial}
          className="font-sans text-tinta outline-none"
          style={CAMPO}
          placeholder="carla@iribarne.ar"
        />
      </label>

      <label className="flex flex-col" style={{ gap: "6px" }}>
        <span
          className="font-sans font-semibold uppercase text-tinta-3"
          style={{ fontSize: "11px", letterSpacing: "0.06em" }}
        >
          Contraseña
        </span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          defaultValue={claveInicial}
          className="font-sans text-tinta outline-none"
          style={CAMPO}
        />
      </label>

      {estado.error ? (
        <p
          className="font-sans"
          style={{ fontSize: "13px", color: "var(--estado-reabierto-fg)" }}
          role="alert"
        >
          {estado.error}
        </p>
      ) : null}

      <Boton
        type="submit"
        variante="primario"
        disabled={pendiente}
        style={{ width: "100%", marginTop: "4px" }}
      >
        {pendiente ? "Ingresando…" : "Ingresar"}
      </Boton>
    </form>
  );
}
