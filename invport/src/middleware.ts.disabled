import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/inventory',
  '/dealers',
  '/reports',
  '/users',
  '/settings',
  '/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // TODO: Temporarily disable auth middleware until OAuth is configured
  // Remove this return statement when ready to enable authentication
  return NextResponse.next();
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );
  
  // Get authentication token from cookies
  const authUser = request.cookies.get('auth_user')?.value;
  const isAuthenticated = authUser !== undefined;
  
  // Redirect to sign-in if accessing protected route without authentication
  if (isProtectedRoute && !isAuthenticated) {
    const signInUrl = new URL('/auth/signin', request.url);
    signInUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(signInUrl);
  }
  
  // Redirect to dashboard if accessing auth pages while authenticated
  if (isAuthenticated && pathname.startsWith('/auth/signin')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Continue with the request
  return NextResponse.next();
}

// Configure which routes should run the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
};