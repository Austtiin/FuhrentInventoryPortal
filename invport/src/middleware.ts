import { NextRequest, NextResponse } from 'next/server';

// Development auth parity middleware
// Mirrors SWA allowedRoles by gating routes when enabled.
// Toggle with env NEXT_DEV_ENFORCE_AUTH=true

export function middleware(req: NextRequest) {
  const enforce = process.env.NEXT_DEV_ENFORCE_AUTH === 'true' && process.env.NODE_ENV === 'development';
  if (!enforce) return NextResponse.next();

  const { pathname } = req.nextUrl;

  // Allow public/static assets and auth endpoints
  const publicAllow = (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/logo') ||
    pathname === '/robots.txt' ||
    pathname === '/humans.txt' ||
    pathname === '/sw.js' ||
    pathname.endsWith('.ico') ||
    pathname.startsWith('/.auth') ||
    pathname.startsWith('/loggedout') ||
    pathname.endsWith('.html')
  );
  if (publicAllow) return NextResponse.next();

  // Basic auth check for dev: SWA sets x-ms-client-principal; allow cookie fallback
  const principal = req.headers.get('x-ms-client-principal');
  const devAuthCookie = req.cookies.get('dev-auth');
  const isAuthenticated = Boolean(principal) || (devAuthCookie?.value === '1');

  if (!isAuthenticated) {
    // Redirect to 401 page (available in public) for dev parity
    const url = req.nextUrl.clone();
    url.pathname = '/401.html';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except Next internals and static assets
  matcher: ['/((?!_next|logo|favicon.ico).*)'],
};
