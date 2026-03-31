import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isAuthPage = req.nextUrl.pathname.startsWith("/login") || 
                     req.nextUrl.pathname.startsWith("/register") ||
                     req.nextUrl.pathname.startsWith("/forgot-password");

  // If user is logged in and tries to access auth pages, redirect to home
  if (isLoggedIn && isAuthPage) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user is not logged in and tries to access protected pages, redirect to login
  if (!isLoggedIn && !isAuthPage) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};