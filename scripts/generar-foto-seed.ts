/**
 * Genera supabase/seed/assets/IMG-20260707-WA0012.jpg: el placeholder
 * fotográfico de la mancha de humedad del timeline de R-1044.
 *
 * Replica la composición del export de design-reference (Panel Detalle):
 * pared con gradiente beige, tres manchas radiales marrones y un zócalo
 * inferior. Determinístico: correrlo dos veces da el mismo archivo.
 *
 *   pnpm tsx scripts/generar-foto-seed.ts
 */

import { encode } from "jpeg-js";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ANCHO = 708; // 236 px del diseño × 3 para nitidez
const ALTO = 504; // 168 px × 3

type RGB = [number, number, number];

function mezclar(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Ruido determinístico suave para que la "pared" no sea un gradiente puro.
function ruido(x: number, y: number): number {
  const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Mancha radial: devuelve opacidad 0..1 según distancia al centro.
function mancha(
  x: number,
  y: number,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  fuerza: number,
): number {
  // Distorsión del espacio antes de medir la distancia: bordes orgánicos,
  // sin lóbulos regulares.
  const wx = x + 26 * Math.sin(y * 0.013 + cx * 0.01) + 14 * Math.sin(y * 0.031 + 2.1);
  const wy = y + 22 * Math.sin(x * 0.011 + cy * 0.01) + 12 * Math.sin(x * 0.027 + 4.7);
  const dx = (wx - cx) / rx;
  const dy = (wy - cy) / ry;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d >= 1) return 0;
  return fuerza * Math.pow(1 - d, 2.2);
}

const paredArriba: RGB = [226, 220, 206]; // #E2DCCE
const paredMedio: RGB = [214, 208, 194]; // #D6D0C2
const paredAbajo: RGB = [198, 191, 175]; // #C6BFAF
const marron1: RGB = [96, 86, 70];
const marron2: RGB = [82, 72, 58];
const marron3: RGB = [120, 110, 92];
const zocalo: RGB = [168, 159, 141]; // #A89F8D
const zocaloBorde: RGB = [142, 133, 116]; // #8E8574

const alturaZocalo = Math.round(ALTO * 0.095);
const datos = Buffer.alloc(ANCHO * ALTO * 4);

for (let y = 0; y < ALTO; y++) {
  for (let x = 0; x < ANCHO; x++) {
    const ty = y / ALTO;
    let color: RGB =
      ty < 0.55
        ? mezclar(paredArriba, paredMedio, ty / 0.55)
        : mezclar(paredMedio, paredAbajo, (ty - 0.55) / 0.45);

    // Textura sutil de pared.
    const grano = (ruido(x * 0.35, y * 0.35) - 0.5) * 7;
    color = [color[0] + grano, color[1] + grano, color[2] + grano];

    // Manchas de humedad superpuestas, como los radial-gradient del export.
    const m1 = mancha(x, y, ANCHO * 0.40, ALTO * 0.34, ANCHO * 0.34, ALTO * 0.40, 0.9);
    const m2 = mancha(x, y, ANCHO * 0.52, ALTO * 0.50, ANCHO * 0.26, ALTO * 0.32, 0.75);
    const m3 = mancha(x, y, ANCHO * 0.32, ALTO * 0.56, ANCHO * 0.20, ALTO * 0.26, 0.6);
    const m4 = mancha(x, y, ANCHO * 0.46, ALTO * 0.26, ANCHO * 0.16, ALTO * 0.18, 0.5);
    color = mezclar(color, marron1, Math.min(1, m1 + m4 * 0.6));
    color = mezclar(color, marron2, m2 * (0.85 + 0.15 * ruido(x * 0.1, y * 0.1)));
    color = mezclar(color, marron3, m3);

    // Descascarado: vetas claras dentro de la zona más comprometida.
    const humedad = m1 + m2;
    if (humedad > 0.55 && ruido(x * 0.045, y * 0.06) > 0.86) {
      color = mezclar(color, paredArriba, 0.35);
    }

    // Zócalo inferior con su borde superior.
    if (y >= ALTO - alturaZocalo) {
      color = y < ALTO - alturaZocalo + 3 ? zocaloBorde : zocalo;
      const granoZ = (ruido(x * 0.5, y * 0.5) - 0.5) * 5;
      color = [color[0] + granoZ, color[1] + granoZ, color[2] + granoZ];
    }

    const i = (y * ANCHO + x) * 4;
    datos[i] = Math.max(0, Math.min(255, Math.round(color[0])));
    datos[i + 1] = Math.max(0, Math.min(255, Math.round(color[1])));
    datos[i + 2] = Math.max(0, Math.min(255, Math.round(color[2])));
    datos[i + 3] = 255;
  }
}

const jpeg = encode({ data: datos, width: ANCHO, height: ALTO }, 82);
const destino = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "supabase",
  "seed",
  "assets",
  "IMG-20260707-WA0012.jpg",
);
mkdirSync(dirname(destino), { recursive: true });
writeFileSync(destino, jpeg.data);
console.log(`Foto generada en ${destino} (${jpeg.data.length} bytes)`);
