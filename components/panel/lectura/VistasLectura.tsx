import { Card, CardHeader, CardTitulo } from "@/components/Card";
import type { AjustesVM, EdificioVM, ProveedorVM } from "@/lib/panel/tipos";

/*
 * Vistas de solo lectura (fase 0): edificios, proveedores y ajustes. Sin
 * formularios de edición; misma tarjetería del sistema.
 */

function Encabezado({ titulo }: { titulo: string }) {
  return (
    <h1
      className="font-display font-bold text-tinta"
      style={{ fontSize: "26px", lineHeight: "32px", marginBottom: "22px" }}
    >
      {titulo}
    </h1>
  );
}

function Contenedor({ children }: { children: React.ReactNode }) {
  return (
    <main style={{ flex: 1, minWidth: 0, maxWidth: "1200px", padding: "30px 32px 56px" }}>
      {children}
    </main>
  );
}

function Dato({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex items-center" style={{ gap: "10px", padding: "7px 0" }}>
      <span
        className="whitespace-nowrap font-sans font-semibold uppercase text-tinta-3"
        style={{ fontSize: "11px", letterSpacing: "0.06em" }}
      >
        {label}
      </span>
      <span
        aria-hidden
        className="flex-1 self-end"
        style={{ borderBottom: "1px dotted var(--leader-dots)", marginBottom: "4px" }}
      />
      <span className="text-tinta" style={{ fontSize: "14px" }}>
        {valor}
      </span>
    </div>
  );
}

export function VistaEdificios({ edificios }: { edificios: EdificioVM[] }) {
  return (
    <Contenedor>
      <Encabezado titulo="Edificios" />
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {edificios.map((e) => (
          <Card key={e.direccion}>
            <CardHeader titulo={e.direccion} />
            <div style={{ padding: "8px 20px 16px" }}>
              <Dato label="Alias" valor={e.alias} />
              <Dato label="Unidades" valor={String(e.totalUnidades)} />
              <Dato
                label="Con deuda"
                valor={`${e.unidadesConDeuda} de ${e.totalUnidades}`}
              />
            </div>
          </Card>
        ))}
      </div>
    </Contenedor>
  );
}

export function VistaProveedores({ proveedores }: { proveedores: ProveedorVM[] }) {
  return (
    <Contenedor>
      <Encabezado titulo="Proveedores" />
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
        {proveedores.map((p) => (
          <Card key={p.nombre}>
            <CardHeader titulo={p.nombre} />
            <div style={{ padding: "8px 20px 16px" }}>
              <Dato label="Rubro" valor={p.rubro} />
              <Dato label="Contacto" valor={p.contacto} />
              <Dato label="Atiende" valor={p.edificios.join(" · ") || "—"} />
            </div>
          </Card>
        ))}
      </div>
    </Contenedor>
  );
}

export function VistaAjustes({ ajustes }: { ajustes: AjustesVM }) {
  return (
    <Contenedor>
      <Encabezado titulo="Ajustes" />
      <div style={{ maxWidth: "560px" }} className="flex flex-col gap-5">
        <Card>
          <CardHeader titulo="Administración" />
          <div style={{ padding: "8px 20px 16px" }}>
            <Dato label="Nombre" valor={ajustes.tenantNombre} />
            <Dato label="Usuaria" valor={ajustes.usuariaNombre} />
            <Dato label="Correo" valor={ajustes.email} />
            <Dato label="Edificios" valor={String(ajustes.edificios)} />
            <Dato label="Proveedores" valor={String(ajustes.proveedores)} />
          </div>
        </Card>

        <Card>
          <CardHeader titulo="Categorías" />
          <div className="flex flex-wrap" style={{ gap: "8px", padding: "16px 20px" }}>
            {ajustes.categorias.map((c) => (
              <span
                key={c}
                className="font-sans text-tinta-2"
                style={{
                  fontSize: "13px",
                  padding: "5px 10px",
                  borderRadius: "6px",
                  background: "var(--papel)",
                  border: "1px solid var(--borde)",
                }}
              >
                {c}
              </span>
            ))}
          </div>
        </Card>

        <Card>
          <div style={{ padding: "16px 20px" }}>
            <CardTitulo>Edición</CardTitulo>
            <p className="m-0 text-tinta-2" style={{ fontSize: "14px", marginTop: "6px" }}>
              La edición de edificios, proveedores y ajustes llega en la próxima
              fase. Por ahora estas pantallas son de solo lectura.
            </p>
          </div>
        </Card>
      </div>
    </Contenedor>
  );
}
