import { Fragment } from "react";

/**
 * Resalta los números públicos (R-1044, OT-311) dentro de un texto, en
 * Space Mono verde, como en el feed y las burbujas del export.
 */
export function TokensResaltados({
  texto,
  size = "12.5px",
}: {
  texto: string;
  size?: string;
}) {
  const partes = texto.split(/(R-\d+|OT-\d+)/g);
  return (
    <>
      {partes.map((parte, i) =>
        /^(R-\d+|OT-\d+)$/.test(parte) ? (
          <span
            key={i}
            className="font-mono font-bold text-primario"
            style={{ fontSize: size }}
          >
            {parte}
          </span>
        ) : (
          <Fragment key={i}>{parte}</Fragment>
        ),
      )}
    </>
  );
}
