"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";
import {
  IconoAjustes,
  IconoEdificios,
  IconoHoy,
  IconoProveedores,
  IconoReclamos,
  IconoUsers,
} from "./iconos";

/*
 * Barra lateral del panel. Ancho fijo 240 px, réplica del export.
 * El chip DEMO es permanente: enlaza al caso de estudio y no se oculta por
 * configuración. La usuaria se muestra abajo con iniciales, nombre y tenant.
 */

type ItemNav = {
  href: string;
  label: string;
  Icono: ComponentType<SVGProps<SVGSVGElement>>;
};

const NAV: ItemNav[] = [
  { href: "/panel", label: "Hoy", Icono: IconoHoy },
  { href: "/panel/reclamos", label: "Reclamos", Icono: IconoReclamos },
  { href: "/panel/reuniones", label: "Reuniones", Icono: IconoUsers },
  { href: "/panel/edificios", label: "Edificios", Icono: IconoEdificios },
  { href: "/panel/proveedores", label: "Proveedores", Icono: IconoProveedores },
  { href: "/panel/ajustes", label: "Ajustes", Icono: IconoAjustes },
];

function esActivo(pathname: string, href: string): boolean {
  if (href === "/panel") return pathname === "/panel";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function iniciales(nombre: string): string {
  return nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p.charAt(0).toUpperCase())
    .join("");
}

export function Sidebar({
  usuaria = "Carla Méndez",
  tenant = "Administración Iribarne",
  alto = "100vh",
}: {
  usuaria?: string;
  tenant?: string;
  /** Alto del aside; 100vh en el panel, acotado en la styleguide. */
  alto?: string;
}) {
  const pathname = usePathname() ?? "/panel";

  return (
    <aside
      className="sticky top-0 flex flex-col bg-superficie"
      style={{
        width: "240px",
        minWidth: "240px",
        height: alto,
        borderRight: "1px solid var(--borde)",
      }}
    >
      {/* Logo + chip DEMO */}
      <div style={{ padding: "24px 20px 14px" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <span
            className="flex items-center justify-center font-display font-bold text-white"
            style={{
              width: "28px",
              height: "28px",
              background: "var(--primario)",
              borderRadius: "4px",
              fontSize: "17px",
            }}
          >
            V
          </span>
          <span
            className="font-display font-bold text-tinta"
            style={{ fontSize: "19px", letterSpacing: "-0.01em" }}
          >
            Ventanilla
          </span>
        </div>
        <Link
          href="/"
          title="Ver el caso de estudio"
          className="inline-block font-sans font-semibold no-underline"
          style={{
            marginTop: "12px",
            background: "var(--chip-demo-bg)",
            color: "var(--chip-demo-fg)",
            fontSize: "11px",
            letterSpacing: "0.08em",
            padding: "4px 10px",
            borderRadius: "4px",
          }}
        >
          DEMO
        </Link>
      </div>

      {/* Navegación */}
      <nav
        className="flex flex-col"
        style={{ gap: "2px", padding: "10px 12px" }}
        aria-label="Navegación del panel"
      >
        {NAV.map(({ href, label, Icono }) => {
          const activo = esActivo(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={activo ? "page" : undefined}
              className="vtn-nav-item flex items-center no-underline transition-colors duration-200 ease-out"
              style={{
                gap: "10px",
                padding: "9px 12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: 500,
              }}
            >
              <Icono />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Usuaria */}
      <div
        className="flex items-center"
        style={{
          marginTop: "auto",
          padding: "16px 20px",
          gap: "10px",
          borderTop: "1px solid var(--borde)",
        }}
      >
        <span
          className="flex items-center justify-center font-sans font-semibold"
          style={{
            width: "34px",
            height: "34px",
            minWidth: "34px",
            borderRadius: "50%",
            background: "var(--primario-suave)",
            color: "var(--primario)",
            fontSize: "12px",
          }}
          aria-hidden
        >
          {iniciales(usuaria)}
        </span>
        <span className="flex min-w-0 flex-col">
          <span
            className="font-sans font-medium text-tinta"
            style={{ fontSize: "14px" }}
          >
            {usuaria}
          </span>
          <span className="text-tinta-3" style={{ fontSize: "12px" }}>
            {tenant}
          </span>
        </span>
      </div>
    </aside>
  );
}
