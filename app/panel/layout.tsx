import { Sidebar } from "@/components/Sidebar";
import { requireMiembro } from "@/lib/data/tenant";

/**
 * Chrome del panel: barra lateral fija + contenido. Cada página renderiza su
 * propio <main> (el padding-top difiere entre pantallas). El guard de sesión
 * lo hace el proxy; requireMiembro es la defensa en profundidad y provee los
 * datos de la usuaria al sidebar.
 */
export default async function PanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { usuariaNombre, tenantNombre } = await requireMiembro();

  return (
    <div
      className="flex"
      style={{ minWidth: "1440px", minHeight: "100vh", background: "var(--papel)" }}
    >
      <Sidebar usuaria={usuariaNombre} tenant={tenantNombre} />
      {children}
    </div>
  );
}
