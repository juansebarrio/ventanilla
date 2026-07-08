"use client";

import { useState } from "react";

/**
 * Foto del reclamo. Con signedUrl muestra la imagen real; si falta o falla la
 * carga, cae al placeholder fotográfico del diseño (mancha de humedad en
 * gradientes), como el prototipo.
 */
export function FotoReclamo({
  signedUrl,
  nombre,
}: {
  signedUrl: string | null;
  nombre: string;
}) {
  const [falló, setFalló] = useState(false);
  const mostrarImagen = signedUrl && !falló;

  return (
    <figure style={{ margin: 0 }}>
      {mostrarImagen ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={signedUrl}
          alt={`Foto del reclamo (${nombre})`}
          onError={() => setFalló(true)}
          style={{
            width: "236px",
            maxWidth: "100%",
            height: "168px",
            objectFit: "cover",
            borderRadius: "6px",
            display: "block",
          }}
        />
      ) : (
        <div
          role="img"
          aria-label="Foto de mancha de humedad"
          style={{
            width: "236px",
            maxWidth: "100%",
            height: "168px",
            borderRadius: "6px",
            position: "relative",
            backgroundImage:
              "radial-gradient(circle at 38% 34%, rgba(96,86,70,0.55), transparent 45%), radial-gradient(circle at 56% 52%, rgba(82,72,58,0.45), transparent 40%), radial-gradient(circle at 30% 62%, rgba(120,110,92,0.35), transparent 38%), linear-gradient(168deg, #E2DCCE 0%, #D6D0C2 55%, #C6BFAF 100%)",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              height: "16px",
              background: "#A89F8D",
              borderTop: "1px solid #8E8574",
              borderBottomLeftRadius: "6px",
              borderBottomRightRadius: "6px",
            }}
          />
        </div>
      )}
      <figcaption
        className="font-mono text-tinta-3"
        style={{ fontSize: "11px", padding: "6px 4px 2px" }}
      >
        {nombre}
      </figcaption>
    </figure>
  );
}
