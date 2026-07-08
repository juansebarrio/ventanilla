import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/*
 * Proxy (antes "middleware" en Next < 16): refresca la sesión de Supabase en
 * cada request y protege las rutas del panel. Si faltan las variables de
 * entorno (build o preview sin credenciales), no bloquea nada.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // Los redirects llevan las cookies que getUser() haya rotado: un redirect
  // pelado las perdería y el refresh token viejo quedaría consumido.
  function redirigir(destino: URL): NextResponse {
    const redirect = NextResponse.redirect(destino);
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }

  if (!user && path.startsWith("/panel")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("desde", path);
    return redirigir(login);
  }

  if (user && path === "/login") {
    return redirigir(new URL("/panel", request.url));
  }

  return response;
}

export const config = {
  // Solo el panel y el login: deja fuera /styleguide/panel (fixtures sin
  // sesión), la landing y los assets.
  matcher: ["/panel/:path*", "/login"],
};
