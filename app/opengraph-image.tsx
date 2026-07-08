import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

/*
 * OG image de la landing: fondo papel con el comprobante R-1044, la misma
 * marca de agua del hero pero en tinta plena. Space Mono va embebida desde
 * assets/fonts (OFL) para que el render no dependa de la red.
 */

export const alt =
  "Ventanilla · Comprobante de reclamo R-1044 · Cada reclamo respondido en minutos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const [monoBold, monoRegular] = await Promise.all([
    readFile(join(process.cwd(), "assets/fonts/SpaceMono-Bold.ttf")),
    readFile(join(process.cwd(), "assets/fonts/SpaceMono-Regular.ttf")),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#F7F5F0",
          fontFamily: "Space Mono",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 44,
            left: 56,
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "#1E4D3F",
              color: "#F7F5F0",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              fontWeight: 700,
            }}
          >
            V
          </div>
          <div style={{ fontSize: 30, fontWeight: 700, color: "#1C2B26" }}>
            Ventanilla
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "44px 84px",
            border: "3px dashed rgba(30,77,63,0.55)",
            borderRadius: 18,
            background: "#FFFFFF",
            transform: "rotate(-2deg)",
          }}
        >
          <div
            style={{
              fontSize: 22,
              letterSpacing: 10,
              color: "#5C6660",
              marginBottom: 10,
            }}
          >
            COMPROBANTE DE RECLAMO
          </div>
          <div
            style={{
              fontSize: 148,
              fontWeight: 700,
              color: "#1E4D3F",
              lineHeight: 1.05,
            }}
          >
            R-1044
          </div>
          <div style={{ fontSize: 24, color: "#5C6660", marginTop: 8 }}>
            Filtración en pared del living · Alta
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 44,
            fontSize: 26,
            color: "#1C2B26",
            display: "flex",
          }}
        >
          Cada reclamo respondido en minutos. Con número de seguimiento.
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Space Mono", data: monoBold, weight: 700, style: "normal" },
        { name: "Space Mono", data: monoRegular, weight: 400, style: "normal" },
      ],
    },
  );
}
