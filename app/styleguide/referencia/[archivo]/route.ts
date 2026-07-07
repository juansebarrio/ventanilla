import { readFile } from "node:fs/promises";
import { join, normalize } from "node:path";
import { NextResponse } from "next/server";

/*
 * Sirve los archivos de design-reference/ para poder incrustarlos en iframes
 * en la styleguide (comparación lado a lado). Es una herramienta de
 * desarrollo: los .dc.html cargan su support.js con ruta relativa, que
 * resuelve contra esta misma ruta.
 */

const DIR = join(process.cwd(), "design-reference");

const TIPOS: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ archivo: string }> },
) {
  const { archivo } = await params;
  const nombre = decodeURIComponent(archivo);

  // Evita traspasar el directorio de referencia.
  const ruta = normalize(join(DIR, nombre));
  if (!ruta.startsWith(DIR)) {
    return new NextResponse("No encontrado", { status: 404 });
  }

  try {
    const contenido = await readFile(ruta);
    const ext = nombre.slice(nombre.lastIndexOf(".")).toLowerCase();
    return new NextResponse(contenido, {
      headers: { "content-type": TIPOS[ext] ?? "application/octet-stream" },
    });
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
}
