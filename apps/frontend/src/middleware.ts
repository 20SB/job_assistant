import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedRoutes = ["/dashboard", "/onboarding", "/cv", "/preferences", "/subscription", "/jobs"];
const authRoutes = ["/login", "/signup"];

export function middleware(request: NextRequest) {
    const token = request.cookies.get("auth_token")?.value;
    const { pathname } = request.nextUrl;

    // For protected routes: redirect to login if no token in cookie
    // Note: We also check localStorage on the client side via AuthContext,
    // but middleware runs server-side so we use a cookie as a signal.
    // The actual auth validation happens via AuthContext + API call.
    const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
    const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

    if (isProtected && !token) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    // If logged in user tries to access auth pages, redirect to dashboard
    if (isAuthRoute && token) {
        return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/onboarding/:path*", "/cv/:path*", "/preferences/:path*", "/subscription/:path*", "/jobs/:path*", "/login", "/signup"],
};
