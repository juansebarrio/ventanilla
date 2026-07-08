import type { Metadata } from "next";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "Panel (preview) · Ventanilla",
  robots: { index: false, follow: false },
};

/**
 * Chrome de preview del panel para el styleguide: misma barra lateral y layout
 * que el panel real, pero con datos fijos (usuaria del seed) y sin Supabase.
 */
export default function StyleguidePanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex"
      style={{ minWidth: "1440px", minHeight: "100vh", background: "var(--papel)" }}
    >
      <Sidebar usuaria="Carla Méndez" tenant="Administración Iribarne" />
      {children}
    </div>
  );
}
