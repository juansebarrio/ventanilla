/**
 * Acceso a variables de entorno con lectura perezosa: el build de Next
 * no exige credenciales; el error salta recién cuando el código que las
 * necesita corre sin ellas.
 */

function obligatoria(nombre: string): string {
  const valor = process.env[nombre];
  if (!valor) {
    throw new Error(
      `Falta la variable de entorno ${nombre}. Revisá .env.example para el detalle.`,
    );
  }
  return valor;
}

export const env = {
  get supabaseUrl(): string {
    return obligatoria("NEXT_PUBLIC_SUPABASE_URL");
  },
  get supabaseAnonKey(): string {
    return obligatoria("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
  get supabaseServiceRoleKey(): string {
    return obligatoria("SUPABASE_SERVICE_ROLE_KEY");
  },
  get anthropicApiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY || undefined;
  },
  get demoResetSecret(): string {
    return obligatoria("DEMO_RESET_SECRET");
  },
  get elevenLabsApiKey(): string | undefined {
    return process.env.ELEVENLABS_API_KEY || undefined;
  },
  get whatsapp():
    | {
        verifyToken: string;
        accessToken: string;
        phoneNumberId: string;
        appSecret: string | undefined;
      }
    | undefined {
    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!verifyToken || !accessToken || !phoneNumberId) return undefined;
    return {
      verifyToken,
      accessToken,
      phoneNumberId,
      appSecret: process.env.WHATSAPP_APP_SECRET || undefined,
    };
  },
  get simulatorDailyCap(): number {
    const crudo = process.env.SIMULATOR_DAILY_CAP;
    const valor = crudo ? Number.parseInt(crudo, 10) : NaN;
    return Number.isFinite(valor) && valor > 0 ? valor : 300;
  },
};
