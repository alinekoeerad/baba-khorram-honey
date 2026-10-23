import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge Security Guard Middleware (P0)
 * Intercepts all requests matching /admin/:path*
 * Enforces session token presence and redirects unauthenticated users to /admin/login.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    // Check for session token across all supported cookie keys
    const token =
      request.cookies.get('honey.session_token')?.value ||
      request.cookies.get('better-auth.session_token')?.value ||
      request.cookies.get('session_token')?.value;

    const authHeader = request.headers.get('authorization');
    const hasBearer = Boolean(authHeader && authHeader.startsWith('Bearer '));
    const hasToken = Boolean(token || hasBearer);

    const isLoginPage = pathname === '/admin/login' || pathname.startsWith('/admin/login/');

    // Unauthenticated user trying to access any admin route other than /admin/login
    if (!hasToken && !isLoginPage) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Authenticated user trying to access the login page
    if (hasToken && isLoginPage) {
      const dashboardUrl = new URL('/admin', request.url);
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
