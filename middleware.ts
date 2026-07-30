import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Regla 1: Proteger Panel Master
    if (path.startsWith("/master") && token?.role !== "MASTER") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Regla 2: Proteger Panel Stand
    if (path.startsWith("/stand") && token?.role !== "STAND") {
      return NextResponse.redirect(new URL("/", req.url));
    }

    // Regla 3: Proteger Panel Visitante y Rutas de Calificación
    if ((path.startsWith("/cliente") || path.startsWith("/calificar")) && token?.role !== "CLIENTE") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  },
  {
    callbacks: {
      // Solo permite el acceso si el usuario está logueado
      authorized: ({ token }) => !!token,
    },
  }
);

// Aquí definimos cuáles rutas va a vigilar el guardia
export const config = {
  matcher: ["/master/:path*", "/stand/:path*", "/cliente/:path*", "/calificar/:path*"],
};