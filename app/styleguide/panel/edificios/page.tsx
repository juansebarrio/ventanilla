import { VistaEdificios } from "@/components/panel/lectura/VistasLectura";
import { edificiosFixture } from "@/lib/fixtures/panel";

export default function PreviewEdificios() {
  return <VistaEdificios edificios={edificiosFixture} />;
}
