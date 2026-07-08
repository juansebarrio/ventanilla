import { Card, CardTitulo } from "@/components/Card";
import { ChipUrgencia } from "@/components/ChipUrgencia";
import type { DatosClaim } from "@/lib/panel/tipos";

/** Card "Datos": ficha del reclamo. El teléfono va enmascarado. */
export function CardDatos({ datos }: { datos: DatosClaim }) {
  return (
    <Card>
      <div style={{ padding: "20px" }}>
        <div style={{ marginBottom: "14px" }}>
          <CardTitulo>Datos</CardTitulo>
        </div>
        <dl
          className="m-0 grid"
          style={{ gridTemplateColumns: "104px 1fr", rowGap: "11px" }}
        >
          <Campo label="Categoría">{datos.categoria}</Campo>
          <Campo label="Urgencia">
            <ChipUrgencia urgencia={datos.urgencia} />
          </Campo>
          <Campo label="Ámbito">{datos.ambito}</Campo>
          <Campo label="Edificio">{datos.edificioUnidad}</Campo>
          {datos.vecina ? <Campo label="Vecina">{datos.vecina}</Campo> : null}
          {datos.telefonoEnmascarado ? (
            <Campo label="Teléfono">
              <span className="font-mono" style={{ fontSize: "13px" }}>
                {datos.telefonoEnmascarado}
              </span>
            </Campo>
          ) : null}
          <Campo label="Ingreso">
            <span className="font-mono" style={{ fontSize: "13px" }}>
              {datos.ingreso}
            </span>
          </Campo>
        </dl>
      </div>
    </Card>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <dt
        className="font-sans font-semibold uppercase text-tinta-3"
        style={{ fontSize: "11px", letterSpacing: "0.06em" }}
      >
        {label}
      </dt>
      <dd className="m-0 text-tinta" style={{ fontSize: "14px" }}>
        {children}
      </dd>
    </>
  );
}
