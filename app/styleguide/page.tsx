import type { Metadata } from "next";
import { Boton } from "@/components/Boton";
import { Card, CardHeader, CardTitulo } from "@/components/Card";
import { ChipEstado } from "@/components/ChipEstado";
import { ChipUrgencia } from "@/components/ChipUrgencia";
import { IconoEnviar, IconoMas } from "@/components/iconos";
import { InputBusqueda } from "@/components/InputBusqueda";
import { KpiCard, KpiFila } from "@/components/KpiCard";
import { SelectFiltro } from "@/components/SelectFiltro";
import { Sidebar } from "@/components/Sidebar";
import {
  TablaReclamosFila,
  TablaReclamosHeader,
} from "@/components/TablaReclamos";
import { Ticket } from "@/components/Ticket";
import { ESTADOS, URGENCIAS } from "@/lib/domain/claims";

export const metadata: Metadata = {
  title: "Styleguide · Ventanilla",
  robots: { index: false, follow: false },
};

const REFERENCIAS = [
  { archivo: "Panel Hoy.dc.html", titulo: "Panel Hoy" },
  { archivo: "Panel Reclamos.dc.html", titulo: "Panel Reclamos" },
  { archivo: "Panel Detalle R-1044.dc.html", titulo: "Detalle R-1044" },
  { archivo: "Landing Ventanilla.dc.html", titulo: "Landing" },
];

const TOKENS: { nombre: string; valor: string }[] = [
  { nombre: "papel", valor: "#F7F5F0" },
  { nombre: "superficie", valor: "#FFFFFF" },
  { nombre: "superficie-suave", valor: "#FAF9F5" },
  { nombre: "borde", valor: "#E5E1D8" },
  { nombre: "tinta", valor: "#1C2B26" },
  { nombre: "tinta-2", valor: "#5C6660" },
  { nombre: "tinta-3", valor: "#8A928D" },
  { nombre: "primario", valor: "#1E4D3F" },
  { nombre: "primario-hover", valor: "#16382E" },
  { nombre: "primario-suave", valor: "#E3EDE7" },
  { nombre: "primario-suave-2", valor: "#F6FAF7" },
];

function Seccion({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "40px" }}>
      <h2
        className="font-display font-bold text-tinta"
        style={{ fontSize: "20px", marginBottom: "16px" }}
      >
        {titulo}
      </h2>
      {children}
    </section>
  );
}

export default function Styleguide() {
  return (
    <main style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "36px" }}>
        <h1
          className="font-display font-bold text-tinta"
          style={{ fontSize: "26px" }}
        >
          Styleguide
        </h1>
        <p className="text-tinta-2" style={{ fontSize: "15px", marginTop: "6px" }}>
          Componentes base del sistema, para comparación contra el export
          durante el desarrollo. Fuera de la navegación del panel.
        </p>
      </header>

      <Seccion titulo="Colores">
        <div className="flex flex-wrap" style={{ gap: "12px" }}>
          {TOKENS.map((t) => (
            <div key={t.nombre} style={{ width: "140px" }}>
              <div
                style={{
                  height: "56px",
                  borderRadius: "8px",
                  background: t.valor,
                  border: "1px solid var(--borde)",
                }}
              />
              <div style={{ marginTop: "6px" }}>
                <div
                  className="font-sans font-medium text-tinta"
                  style={{ fontSize: "13px" }}
                >
                  {t.nombre}
                </div>
                <div className="font-mono text-tinta-3" style={{ fontSize: "12px" }}>
                  {t.valor}
                </div>
              </div>
            </div>
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Tipografía">
        <div className="flex flex-col" style={{ gap: "10px" }}>
          <p className="font-display font-bold text-tinta" style={{ fontSize: "26px" }}>
            Space Grotesk 700 · Cada reclamo respondido en minutos
          </p>
          <p className="font-display font-medium text-tinta" style={{ fontSize: "19px" }}>
            Space Grotesk 500 · Título de card
          </p>
          <p className="font-sans text-tinta" style={{ fontSize: "15px" }}>
            Public Sans 400 · Cuerpo de texto del sistema
          </p>
          <p className="font-mono font-bold text-primario" style={{ fontSize: "16px" }}>
            Space Mono 700 · R-1044 · OT-311 · $ 952.800 · 14:33
          </p>
        </div>
      </Seccion>

      <Seccion titulo="Ticket">
        <div className="flex items-center" style={{ gap: "16px" }}>
          <Ticket tamano="grande">R-1044</Ticket>
          <Ticket tamano="chico">R-1047</Ticket>
          <Ticket tamano="chico">OT-311</Ticket>
        </div>
      </Seccion>

      <Seccion titulo="Chips de estado">
        <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>
          {ESTADOS.map((e) => (
            <ChipEstado key={e} estado={e} />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Chips de urgencia">
        <div className="flex flex-wrap items-center" style={{ gap: "20px" }}>
          {URGENCIAS.map((u) => (
            <ChipUrgencia key={u} urgencia={u} textoColoreado />
          ))}
        </div>
      </Seccion>

      <Seccion titulo="Botones">
        <div className="flex flex-wrap items-center" style={{ gap: "12px" }}>
          <Boton variante="primario">
            <IconoEnviar />
            Enviar
          </Boton>
          <Boton variante="secundario">
            <IconoMas />
            Nuevo reclamo
          </Boton>
          <Boton variante="primario" tamano="chico">
            Emitir orden de trabajo
          </Boton>
          <Boton variante="secundario" tamano="chico">
            Revisar
          </Boton>
          <Boton variante="terciario">Ver cerrados</Boton>
        </div>
      </Seccion>

      <Seccion titulo="Filtros y búsqueda">
        <div className="flex flex-wrap items-center" style={{ gap: "10px" }}>
          <InputBusqueda placeholder="Buscar por número, dirección o texto" />
          <SelectFiltro etiqueta="EDIFICIO" defaultValue="Todos">
            <option>Todos</option>
            <option>Yerbal 1240</option>
            <option>Virrey Loreto 2680</option>
          </SelectFiltro>
          <SelectFiltro etiqueta="ESTADO" defaultValue="Abiertos">
            <option>Abiertos</option>
            <option>Todos</option>
            <option>Recibido</option>
          </SelectFiltro>
        </div>
      </Seccion>

      <Seccion titulo="Resumen del día (KPIs)">
        <div style={{ maxWidth: "360px" }}>
          <KpiCard titulo="Resumen del día">
            <KpiFila label="Abiertos" valor="7" />
            <KpiFila label="Urgentes" valor="1" destacado />
            <KpiFila label="Esperan tu acción" valor="3" />
            <KpiFila
              label="Primera respuesta"
              valor="38 s"
              nota="automática, todos los reclamos"
            />
            <KpiFila label="Resolución promedio" valor="2,1 días" />
          </KpiCard>
        </div>
      </Seccion>

      <Seccion titulo="Card">
        <div style={{ maxWidth: "420px" }}>
          <Card>
            <CardHeader
              titulo="Expensas adeudadas"
              acciones={
                <SelectFiltro etiqueta="EDIFICIO" defaultValue="Yerbal 1240">
                  <option>Yerbal 1240</option>
                  <option>Virrey Loreto 2680</option>
                </SelectFiltro>
              }
            />
            <div style={{ padding: "16px 20px" }}>
              <CardTitulo>Contenido de la card</CardTitulo>
            </div>
          </Card>
        </div>
      </Seccion>

      <Seccion titulo="Tabla de reclamos">
        <Card overflowHidden>
          <TablaReclamosHeader />
          <TablaReclamosFila
            fila={{
              numero: "R-1047",
              titulo: "Ascensor parado entre pisos, sin personas adentro",
              categoria: "Ascensor",
              urgencia: "urgente",
              ubicacion: "Yerbal 1240",
              estado: "recibido",
              actividad: "hace 4 min",
              urgente: true,
            }}
          />
          <TablaReclamosFila
            fila={{
              numero: "R-1044",
              titulo: "Filtración en pared del living, viene de arriba",
              categoria: "Filtraciones y humedad",
              urgencia: "alta",
              ubicacion: "Yerbal 1240 · 5°B",
              estado: "asignado",
              actividad: "hace 2 h",
              href: "/styleguide",
            }}
          />
        </Card>
      </Seccion>

      <Seccion titulo="Sidebar">
        <div
          style={{
            height: "620px",
            border: "1px solid var(--borde)",
            borderRadius: "10px",
            overflow: "hidden",
            width: "240px",
          }}
        >
          <Sidebar alto="620px" />
        </div>
      </Seccion>

      <Seccion titulo="Comparación con el export">
        <p className="text-tinta-2" style={{ fontSize: "14px", marginBottom: "16px" }}>
          Los HTML originales, incrustados para comparar lado a lado. Requieren
          conexión (el runtime carga React). Las cuatro pantallas de referencia:
        </p>
        <div
          className="grid"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}
        >
          {REFERENCIAS.map((r) => (
            <figure key={r.archivo} style={{ margin: 0 }}>
              <figcaption
                className="font-sans font-medium text-tinta-2"
                style={{ fontSize: "13px", marginBottom: "6px" }}
              >
                {r.titulo}
              </figcaption>
              <iframe
                title={r.titulo}
                src={`/styleguide/referencia/${encodeURIComponent(r.archivo)}`}
                style={{
                  width: "100%",
                  height: "420px",
                  border: "1px solid var(--borde)",
                  borderRadius: "8px",
                  background: "var(--superficie)",
                }}
              />
            </figure>
          ))}
        </div>
      </Seccion>
    </main>
  );
}
