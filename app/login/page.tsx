import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "Ingresar · Ventanilla",
  robots: { index: false, follow: false },
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string }>;
}) {
  const { desde } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <div
        className="w-full rounded-[10px] border border-borde bg-superficie"
        style={{ maxWidth: "380px", padding: "32px" }}
      >
        <div className="flex items-center" style={{ gap: "10px", marginBottom: "24px" }}>
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

        <h1
          className="font-display font-medium text-tinta"
          style={{ fontSize: "19px", marginBottom: "4px" }}
        >
          Ingresá al panel
        </h1>
        <p className="text-tinta-2" style={{ fontSize: "14px", marginBottom: "20px" }}>
          Administración de reclamos de tus consorcios.
        </p>

        <LoginForm desde={desde ?? "/panel"} />
      </div>
    </main>
  );
}
