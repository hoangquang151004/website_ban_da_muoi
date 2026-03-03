import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that require authentication (any role)
const protectedUserRoutes = ["/account"];

// Routes that require admin role
const protectedAdminRoutes = ["/admin"];

// Auth routes - redirect to home if already logged in
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  // Bypass auth in development mode for easier UI testing
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Read token from cookie (set by auth service after login)
  const token = request.cookies.get("auth-token")?.value;
  const userRole = request.cookies.get("user-role")?.value;

  const isAdminRoute = protectedAdminRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isUserRoute = protectedUserRoutes.some((route) =>
    pathname.startsWith(route),
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Not logged in - redirect to login
  if ((isAdminRoute || isUserRoute) && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Logged in but not admin - redirect to home
  if (isAdminRoute && userRole !== "admin") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Already logged in, trying to access auth routes - redirect to home
  if (isAuthRoute && token) {
    if (userRole === "admin") {
      return NextResponse.redirect(new URL("/admin/dashboard", request.url));
    }
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/login", "/register"],
};
