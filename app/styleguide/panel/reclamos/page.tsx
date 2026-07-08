import { Suspense } from "react";
import { BandejaReclamos } from "@/components/panel/reclamos/BandejaReclamos";
import { reclamosFixture } from "@/lib/fixtures/panel";

const FILTROS = {
  edificio: "todos",
  categoria: "todas",
  estado: "abiertos",
  urgencia: "todas",
  q: "",
};

export default function PreviewReclamos() {
  return (
    <Suspense fallback={null}>
      <BandejaReclamos
        vm={reclamosFixture}
        filtros={FILTROS}
        edificios={["Yerbal 1240", "Virrey Loreto 2680"]}
        categorias={[
          "Ascensor",
          "Plomería y pérdidas",
          "Electricidad",
          "Filtraciones y humedad",
          "Ruidos y convivencia",
          "Seguridad y accesos",
          "Limpieza",
          "Administrativo",
        ]}
      />
    </Suspense>
  );
}
