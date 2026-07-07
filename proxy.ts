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

  if (!user && path.startsWith("/panel")) {
    const login = new URL("/login", request.url);
    login.searchParams.set("desde", path);
    return NextResponse.redirect(login);
  }

  if (user && path === "/login") {
    return NextResponse.redirect(new URL("/panel", request.url));
  }

  return response;
}

export const config = {
  // Corre en todo salvo estáticos y assets, para no bloquear CSS/JS/imágenes.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
